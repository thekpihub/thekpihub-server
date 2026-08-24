import { Router, Request, Response } from "express";
import Anthropic from "@anthropic-ai/sdk";

const router = Router();

// ── Image generation models ────────────────────────────────────────────────

const REPLICATE_MODELS: Record<string, string> = {
  "flux-schnell": "black-forest-labs/flux-schnell",
  "flux-dev": "black-forest-labs/flux-dev",
  "flux-pro": "black-forest-labs/flux-1.1-pro",
  "sdxl": "stability-ai/sdxl:39ed52f2319f9c2d7f2f3ca76fbc9b02fb04cd4e",
  "stable-diffusion-3": "stability-ai/stable-diffusion-3",
};

const DEFAULT_MODEL = "flux-schnell";

// ── Replicate generation ───────────────────────────────────────────────────

async function generateWithReplicate(
  prompt: string,
  modelKey: string,
  options: { width?: number; height?: number; steps?: number; guidance?: number }
): Promise<string[]> {
  const apiKey = process.env.REPLICATE_API_KEY;
  if (!apiKey) throw new Error("REPLICATE_API_KEY not configured");

  const modelId = REPLICATE_MODELS[modelKey] ?? REPLICATE_MODELS[DEFAULT_MODEL];

  // Create prediction
  const createRes = await fetch("https://api.replicate.com/v1/predictions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Token ${apiKey}`,
    },
    body: JSON.stringify({
      version: modelId.includes(":") ? modelId.split(":")[1] : undefined,
      model: modelId.includes(":") ? undefined : modelId,
      input: {
        prompt,
        width: options.width ?? 1024,
        height: options.height ?? 1024,
        num_inference_steps: options.steps ?? 4,
        guidance_scale: options.guidance ?? 3.5,
        num_outputs: 1,
      },
    }),
  });

  if (!createRes.ok) {
    const err = await createRes.text();
    throw new Error(`Replicate create failed: ${err}`);
  }

  const prediction = (await createRes.json()) as { id: string; urls: { get: string } };

  // Poll until complete
  let attempts = 0;
  while (attempts < 60) {
    await new Promise((r) => setTimeout(r, 2000));
    const pollRes = await fetch(prediction.urls.get, {
      headers: { Authorization: `Token ${apiKey}` },
    });
    const result = (await pollRes.json()) as {
      status: string;
      output?: string | string[];
      error?: string;
    };

    if (result.status === "succeeded") {
      const output = result.output;
      if (!output) return [];
      return Array.isArray(output) ? output : [output];
    }
    if (result.status === "failed") throw new Error(result.error ?? "Generation failed");
    attempts++;
  }

  throw new Error("Generation timed out");
}

// ── Stability AI generation ────────────────────────────────────────────────

async function generateWithStability(
  prompt: string,
  options: { width?: number; height?: number; steps?: number }
): Promise<string[]> {
  const apiKey = process.env.STABILITY_API_KEY;
  if (!apiKey) throw new Error("STABILITY_API_KEY not configured");

  const res = await fetch(
    "https://api.stability.ai/v2beta/stable-image/generate/ultra",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
      },
      body: (() => {
        const fd = new FormData();
        fd.append("prompt", prompt);
        fd.append("output_format", "webp");
        if (options.width) fd.append("width", String(options.width));
        if (options.height) fd.append("height", String(options.height));
        return fd;
      })(),
    }
  );

  if (!res.ok) throw new Error(`Stability AI error: ${res.statusText}`);
  const json = (await res.json()) as { image: string };
  return [`data:image/webp;base64,${json.image}`];
}

// ── POST /generate ─────────────────────────────────────────────────────────

router.post("/generate", async (req: Request, res: Response) => {
  const {
    prompt,
    model = DEFAULT_MODEL,
    width = 1024,
    height = 1024,
    steps,
    guidance,
    enhancePrompt = true,
  } = req.body;

  if (!prompt) return res.status(400).json({ error: "prompt required" });

  try {
    let finalPrompt = prompt;

    // Optionally enhance prompt with Claude before generation
    if (enhancePrompt && process.env.ANTHROPIC_API_KEY) {
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const enhanced = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 512,
        messages: [
          {
            role: "user",
            content: `Enhance this image prompt for AI image generation. Make it vivid, detailed, and optimised for photorealistic results. Output ONLY the enhanced prompt, nothing else.\n\nOriginal: ${prompt}`,
          },
        ],
      });
      if (enhanced.content[0].type === "text") {
        finalPrompt = enhanced.content[0].text.trim();
      }
    }

    let images: string[] = [];

    // Try Replicate first, then Stability AI
    if (process.env.REPLICATE_API_KEY) {
      images = await generateWithReplicate(finalPrompt, model, { width, height, steps, guidance });
    } else if (process.env.STABILITY_API_KEY) {
      images = await generateWithStability(finalPrompt, { width, height, steps });
    } else {
      return res.status(400).json({
        error: "No image generation API key configured. Set REPLICATE_API_KEY or STABILITY_API_KEY.",
      });
    }

    res.json({ images, enhancedPrompt: finalPrompt, originalPrompt: prompt });
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Generation failed" });
  }
});

// ── POST /enhance-prompt ───────────────────────────────────────────────────

router.post("/prompt", async (req: Request, res: Response) => {
  const { description, style = "photorealistic" } = req.body;
  if (!description) return res.status(400).json({ error: "description required" });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "ANTHROPIC_API_KEY not configured" });

  const client = new Anthropic({ apiKey });

  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `Create an optimised AI image generation prompt for: "${description}"
Style: ${style}

Structure your prompt with these elements:
1. Main subject (specific, detailed)
2. Art style / medium
3. Lighting (quality, direction, colour temperature)
4. Composition (framing, perspective, depth)
5. Color palette
6. Mood / atmosphere
7. Technical quality modifiers (e.g. 8k, photorealistic, sharp focus)

Output ONLY the prompt on a single paragraph. No explanations.`,
        },
      ],
    });

    const enhanced = response.content[0].type === "text" ? response.content[0].text : "";
    res.json({ prompt: enhanced });
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Prompt generation failed" });
  }
});

// ── POST /analyze ──────────────────────────────────────────────────────────

router.post("/analyze", async (req: Request, res: Response) => {
  const { imageUrl, imageBase64, question = "Describe this image in detail." } = req.body;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "ANTHROPIC_API_KEY not configured" });
  if (!imageUrl && !imageBase64) {
    return res.status(400).json({ error: "imageUrl or imageBase64 required" });
  }

  const client = new Anthropic({ apiKey });

  try {
    const imageSource = (
      imageUrl
        ? { type: "url", url: imageUrl }
        : { type: "base64", media_type: "image/jpeg", data: imageBase64 }
    ) as unknown as Anthropic.Messages.ImageBlockParam["source"];

    const response = await client.messages.create({
      model: "claude-opus-4-7",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: imageSource },
            { type: "text", text: question },
          ],
        },
      ],
    });

    const analysis = response.content[0].type === "text" ? response.content[0].text : "";
    res.json({ analysis });
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Analysis failed" });
  }
});

// ── GET /models ────────────────────────────────────────────────────────────

router.get("/models", (_req: Request, res: Response) => {
  const hasReplicate = !!process.env.REPLICATE_API_KEY;
  const hasStability = !!process.env.STABILITY_API_KEY;

  res.json({
    available: hasReplicate || hasStability,
    providers: {
      replicate: hasReplicate,
      stability: hasStability,
    },
    models: hasReplicate
      ? Object.keys(REPLICATE_MODELS).map((id) => ({
          id,
          name: id
            .split("-")
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" "),
          provider: "replicate",
        }))
      : hasStability
      ? [{ id: "ultra", name: "Stable Image Ultra", provider: "stability" }]
      : [],
  });
});

export default router;

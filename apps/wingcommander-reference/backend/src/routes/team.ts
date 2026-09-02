import { Router, Request, Response } from "express";
import Anthropic from "@anthropic-ai/sdk";
import { requireAuth, requirePlan, type JWTPayload } from "../middleware/auth.js";

const router = Router();

type Mode = "debate" | "vote" | "orchestrate";

interface AgentResult {
  role: "specialist" | "critic" | "synthesizer" | "voter";
  model: string;
  output: string;
}

const HAIKU = "claude-haiku-4-5-20251001";

function reasoningModel(plan: JWTPayload["plan"]): string {
  return plan === "enterprise" ? "claude-opus-4-7" : "claude-sonnet-4-6";
}

async function ask(
  client: Anthropic,
  model: string,
  system: string,
  prompt: string
): Promise<string> {
  const msg = await client.messages.create({
    model,
    max_tokens: 4096,
    system,
    messages: [{ role: "user", content: prompt }],
  });
  return msg.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
}

// Pull out bullet/line critique points from the critic's output.
function extractFlags(critique: string): string[] {
  const lines = critique
    .split("\n")
    .map((l) => l.replace(/^[\s>*\-•\d.)]+/, "").trim())
    .filter((l) => l.length > 0);

  const noIssues = /no (unsupported|issues|errors|problems|flaws)|nothing|none found|looks (good|accurate)/i;
  if (lines.length === 0 || (lines.length <= 2 && lines.every((l) => noIssues.test(l)))) {
    return [];
  }
  return lines.filter((l) => !noIssues.test(l));
}

// Crude agreement scoring for vote mode: normalise and compare.
function voteConsensus(answers: string[]): { answer: string; confidence: number } {
  const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();
  const normalized = answers.map(norm);
  const counts = new Map<string, number>();
  for (const n of normalized) counts.set(n, (counts.get(n) ?? 0) + 1);

  let bestIdx = 0;
  let bestCount = 0;
  normalized.forEach((n, i) => {
    const c = counts.get(n) ?? 0;
    if (c > bestCount) {
      bestCount = c;
      bestIdx = i;
    }
  });

  const confidence = bestCount === 3 ? 0.95 : bestCount === 2 ? 0.75 : 0.5;
  return { answer: answers[bestIdx], confidence };
}

// ── POST /api/agents/team ─────────────────────────────────────────────────────
// Consensus Intelligence™ — multi-agent verification pipeline.

router.post(
  "/agents/team",
  requireAuth,
  requirePlan("pro"),
  async (req: Request, res: Response) => {
    const user = (req as Request & { user?: JWTPayload }).user!;
    const { task, mode = "debate" } = req.body as { task?: string; mode?: Mode };

    if (!task || typeof task !== "string") {
      return res.status(400).json({ error: "task string required" });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "ANTHROPIC_API_KEY not configured" });
    }

    const client = new Anthropic({ apiKey });
    const reasoner = reasoningModel(user.plan);

    try {
      if (mode === "vote") {
        const outputs = await Promise.all(
          [0, 1, 2].map(() =>
            ask(
              client,
              "claude-sonnet-4-6",
              "You are a precise analyst. Answer the question factually and concisely.",
              task
            )
          )
        );

        const { answer, confidence } = voteConsensus(outputs);
        const agents: AgentResult[] = outputs.map((output) => ({
          role: "voter",
          model: "claude-sonnet-4-6",
          output,
        }));

        return res.json({ answer, confidence, agents, flags: [] });
      }

      // "debate" (default) and "orchestrate" both use the 3-agent pipeline.
      const specialistOutput = await ask(
        client,
        reasoner,
        "You are a specialist business analyst. Answer the user's question thoroughly.",
        task
      );

      const critiqueOutput = await ask(
        client,
        HAIKU,
        `You are a critical reviewer. Given this answer: ${specialistOutput}. Find any unsupported claims, factual errors, or missing context. Be specific.`,
        `Original question: ${task}`
      );

      const finalOutput = await ask(
        client,
        reasoner,
        "You are a synthesis expert. Produce a final, verified answer that incorporates the critique and fixes any issues identified.",
        `Original question: ${task}\n\nDraft answer:\n${specialistOutput}\n\nCritique:\n${critiqueOutput}`
      );

      const agents: AgentResult[] = [
        { role: "specialist", model: reasoner, output: specialistOutput },
        { role: "critic", model: HAIKU, output: critiqueOutput },
        { role: "synthesizer", model: reasoner, output: finalOutput },
      ];

      return res.json({
        answer: finalOutput,
        confidence: 0.85,
        agents,
        flags: extractFlags(critiqueOutput),
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return res.status(500).json({ error: message });
    }
  }
);

export default router;

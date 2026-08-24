import { Router, Request, Response } from "express";
import Anthropic from "@anthropic-ai/sdk";
import { getUserContext } from "./context.js";

const router = Router();

// Cached system prompts — marked with cache_control so Anthropic caches them
// at the API level (saves tokens + latency on repeated calls)
const SYSTEM_PROMPTS: Record<string, string> = {
  code: `You are WingCommander, an elite AI software engineer powered by Claude Opus 4.7. You excel at:
- Building production-ready full-stack applications
- Writing clean, type-safe TypeScript/JavaScript
- Designing scalable system architectures
- Generating complete, working code files

When generating files, use this exact format so they can be auto-extracted:
\`\`\`typescript // filename: src/components/MyComponent.tsx
// file content here
\`\`\`

Always think step-by-step. Write complete, working implementations — never stubs or placeholders.
Prefer React 18, TypeScript, Tailwind CSS, Radix UI, and modern best practices.
After generating code, summarise what was built and what to do next.`,

  chat: `You are WingCommander, a highly capable AI assistant powered by Claude Opus 4.7 with 200K context.
Answer questions thoughtfully and thoroughly. You have access to extended thinking for complex problems.
Be direct, honest, and genuinely helpful. Format responses with markdown when appropriate.`,

  rag: `You are WingCommander operating in RAG (Retrieval-Augmented Generation) mode.
You analyze documents, extract insights, and answer questions based on provided context.
ALWAYS cite the exact source document name and section when referencing information.
Format citations as: [Source: <document_name>, Section: <section>]
Be precise and accurate. Clearly flag uncertainty. Never hallucinate facts not in the documents.`,

  image: `You are WingCommander in image generation mode.
Help users create detailed, optimised prompts for AI image generation.
Structure prompts with: subject, style, lighting, composition, color palette, quality modifiers.
Also help analyse uploaded images and suggest improvements or variations.`,

  autonomous: `You are WingCommander in autonomous agent mode powered by Claude Opus 4.7 with extended thinking.
You execute complex multi-step tasks autonomously:
1. Analyse the full task scope before starting
2. Break into ordered subtasks with clear success criteria
3. Execute each subtask completely, verifying outputs
4. Self-correct errors before proceeding
5. Produce a complete, tested, production-ready solution

Think deeply. Show your chain-of-thought. Never leave tasks half-done.`,
};

interface ConversationMessage {
  role: string;
  content: string;
}

/**
 * Build messages array with prompt caching applied.
 * - System prompt: always cached (ephemeral, 5-min TTL)
 * - Historical messages (all but last 2): cached to avoid re-processing
 * - Last 2 messages: NOT cached (they change each turn)
 * This pattern maximises cache hits while keeping recent context fresh.
 */
function buildCachedMessages(
  messages: ConversationMessage[]
): Anthropic.Messages.MessageParam[] {
  const recent = messages.slice(-20);

  return recent.map((m, i) => {
    const isOld = i < recent.length - 2;
    return {
      role: m.role as "user" | "assistant",
      content: isOld
        ? [
            {
              type: "text" as const,
              text: m.content,
              cache_control: { type: "ephemeral" as const },
            },
          ]
        : m.content,
    };
  });
}

router.post("/", async (req: Request, res: Response) => {
  const {
    messages,
    model = "claude-opus-4-7",
    mode = "code",
    projectId,
    userId,
    ragContext,
  } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "messages array required" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY not configured" });
  }

  const client = new Anthropic({ apiKey });

  // SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  const sendEvent = (data: object) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const baseSystem = SYSTEM_PROMPTS[mode] ?? SYSTEM_PROMPTS.code;

    // KPI Memory Layer™ — inject the user's business context if available.
    let kpiContext = "";
    if (userId) {
      try {
        const ctx = await getUserContext(userId, "pro");
        kpiContext = `\n\n--- KPI CONTEXT ---\n${ctx.context}\n--- END KPI CONTEXT ---`;
      } catch {
        // context unavailable — proceed without it
      }
    }

    // Append RAG context if provided (vector search results injected here)
    const systemText =
      (ragContext
        ? `${baseSystem}\n\n--- RETRIEVED CONTEXT ---\n${ragContext}\n--- END CONTEXT ---`
        : baseSystem) + kpiContext;

    const useThinking =
      mode === "autonomous" || (mode === "code" && messages.length <= 2);

    // System prompt with cache_control — Anthropic caches this block
    const systemBlock: Anthropic.Messages.TextBlockParam & {
      cache_control?: { type: "ephemeral" };
    } = {
      type: "text",
      text: systemText,
      cache_control: { type: "ephemeral" },
    };

    const streamOptions: Record<string, unknown> = {
      model,
      max_tokens: useThinking ? 16000 : 8192,
      system: [systemBlock],
      messages: buildCachedMessages(messages),
      stream: true,
    };

    // Extended thinking for Opus on autonomous/first-turn code
    if (useThinking && model === "claude-opus-4-7") {
      streamOptions.thinking = { type: "enabled", budget_tokens: 8000 };
    }

    const stream = await client.messages.stream(
      streamOptions as unknown as Anthropic.Messages.MessageCreateParamsStreaming
    );

    let inputTokens = 0;
    let cacheCreationTokens = 0;
    let cacheReadTokens = 0;

    for await (const event of stream) {
      if (event.type === "message_start" && event.message.usage) {
        const usage = event.message.usage as unknown as Record<string, number>;
        inputTokens = usage.input_tokens ?? 0;
        cacheCreationTokens = usage.cache_creation_input_tokens ?? 0;
        cacheReadTokens = usage.cache_read_input_tokens ?? 0;
      }

      if (event.type === "content_block_delta") {
        const delta = event.delta as unknown as Record<string, string>;
        if (delta.type === "text_delta") {
          sendEvent({ type: "text", content: delta.text });
        } else if (delta.type === "thinking_delta") {
          sendEvent({ type: "thinking", content: delta.thinking });
        }
      }
    }

    // Send usage stats so frontend can show cache hit indicator
    sendEvent({
      type: "usage",
      inputTokens,
      cacheCreationTokens,
      cacheReadTokens,
      cached: cacheReadTokens > 0,
    });

    sendEvent({ type: "done" });
    res.write("data: [DONE]\n\n");
    res.end();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    sendEvent({ type: "error", content: message });
    res.end();
  }
});

export default router;

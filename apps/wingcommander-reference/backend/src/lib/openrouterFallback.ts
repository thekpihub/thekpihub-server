// Fallback used when the direct Anthropic call fails before any content has
// been streamed to the client (invalid/revoked key, rate limit, usage cap,
// etc.) -- calls the same Claude model via OpenRouter instead, which bills
// against a completely separate account/balance. This backend only ever
// calls "claude-opus-4-7" today; MODEL_MAP covers that and falls back to a
// generic dash-to-dot transform for any future model string.
const MODEL_MAP: Record<string, string> = {
  "claude-opus-4-7": "anthropic/claude-opus-4.7",
};

export function toOpenRouterModel(model: string): string {
  if (model.startsWith("anthropic/")) return model;
  return MODEL_MAP[model] ?? `anthropic/${model}`;
}

export interface SimpleMessage {
  role: string;
  content: string;
}

/**
 * Single non-streaming completion via OpenRouter. Callers that were
 * streaming should emit the whole result as one "text" event rather than
 * token-by-token -- a reasonable degradation for a fallback path, not the
 * primary one.
 */
export async function openRouterComplete(
  model: string,
  system: string,
  messages: SimpleMessage[],
  maxTokens: number
): Promise<string | null> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) return null;

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://thekpihub.com",
        "X-Title": "Ditto Wingman",
      },
      body: JSON.stringify({
        model: toOpenRouterModel(model),
        messages: [{ role: "system", content: system }, ...messages],
        max_tokens: maxTokens,
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    return data.choices?.[0]?.message?.content ?? null;
  } catch {
    return null;
  }
}

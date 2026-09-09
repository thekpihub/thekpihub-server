# llm_gateway

Shared resilient Claude-calling module + a thin HTTP wrapper around it.

## Two ways to use it

**In-process (Python callers)** — `apps/website/pipeline.py` and
`services/pipeline/pipeline.py` import `gateway.py` directly instead of each
calling `anthropic.Anthropic(...).messages.create()` with its own
(previously duplicated, in one case missing) retry/fallback logic.

**Over HTTP (non-Python callers)** — `server.py` is a small FastAPI wrapper
exposing `POST /v1/chat`, deployed as its own Railway service. First
consumer: `apps/website/pages/api/ai-gateway.php`, which used to duplicate
its own direct-Anthropic + OpenRouter cURL implementation in PHP.

## Why this exists

Built 2026-09-08 after finding that WingCommander's "invalid Anthropic key"
was never actually a bad key — the whole Anthropic account had hit an
**org-wide** usage/spend cap, which blocks every key on the account equally.
Full story in `servermemory.md`, 2026-09-08 entries.

## gateway.py — what it does

`claude_call(**kwargs)` is a drop-in replacement for
`anthropic_client.messages.create(**kwargs)`:

1. Tries every configured Anthropic key in order (`ANTHROPIC_API_KEY`, plus
   any comma-separated extras in `ANTHROPIC_API_KEYS`).
2. Falls back to the same model via OpenRouter (`OPENROUTER_API_KEY`) — a
   genuinely separate billing account — if every Anthropic key fails. Pass
   `openrouter_model` if the caller already knows the exact OpenRouter slug
   (OpenRouter's Claude-model naming isn't consistently derivable — some
   versions use a dot, some a dash).
3. Falls back to MindStudio.ai's Service Router (`MINDSTUDIO_API_KEY` +
   `MINDSTUDIO_APP_ID`) if OpenRouter also fails/is unconfigured — a *third*
   independent billing relationship, verified live 2026-09-09 (a real call
   hit MindStudio's own balance error, never this account's Anthropic cap).
   Calls a small dedicated agent ("KPI Hub Pipeline Generic Completion")
   built specifically as a generic prompt-in/text-out passthrough — none of
   the workspace's other MindStudio agents accept arbitrary prompts. Needs a
   funded MindStudio balance (Workspace → Service Router → Balance) to
   actually return text, not just be configured.
4. Logs clearly which provider/key served each request, and flags a
   cap-shaped failure loudly (`🛑 CAP_HIT`) the moment it happens.
5. Returns `None` if everything failed — same contract callers already
   handle (`if resp is None: ...`).

`openrouter_call(**kwargs)` calls OpenRouter directly with no Anthropic
attempt at all — for models that only exist there (Gemini, Llama, Mistral,
GPT, Grok, DeepSeek, etc.).

`claude_text(resp)` extracts the first text block from a response, handling
the case where Claude returns a `ThinkingBlock` before any `TextBlock`.

## What it deliberately does NOT do

- **No predictive credit-balance check.** Anthropic has no public API for
  remaining credit balance (only the Console UI shows it) — this module can
  only detect a cap after a call fails against it, not before.
- **No protection against an org-wide cap from key-pooling alone.** If every
  key in `ANTHROPIC_API_KEYS` belongs to the same Anthropic organization, an
  org-wide cap fails all of them together. OpenRouter (a separate account) is
  what actually provides resilience against that specific failure mode, not
  more same-org keys.

## server.py — the HTTP wrapper

`POST /v1/chat` — body `{model, system?, prompt? | messages?, max_tokens?}`,
header `X-Gateway-Secret: <GATEWAY_SHARED_SECRET>`. Routes Claude model ids
(`claude-sonnet-5`, `claude-sonnet-4-6`, `claude-haiku-4-5-20251001`,
`claude-opus-4-7`) through `claude_call()` (Anthropic-first, OpenRouter
fallback); anything else goes straight to `openrouter_call()`. Returns
`{text, model, via}` or an error status.

`GET /health` — no auth, for Railway's healthcheck.

**Auth fails closed**: if `GATEWAY_SHARED_SECRET` isn't configured at all,
every `/v1/chat` request is rejected (500), not silently allowed — this
service is reachable over the public internet and proxies calls that cost
real money on both accounts, so an unauthenticated open proxy would be a
direct abuse vector.

Deployed as a Railway service (project `jubilant-growth`, alongside
WingCommander's backend/frontend), `rootDirectory: services/llm_gateway`,
`Procfile`-driven (`web: uvicorn server:app --host 0.0.0.0 --port $PORT`).

## Usage — Python callers

Each pipeline script adds `services/` to `sys.path` and imports directly:

```python
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "services"))
from llm_gateway.gateway import claude_call, claude_text
```

## Usage — HTTP callers (PHP, etc.)

```php
$resp = curl_post($gatewayUrl . '/v1/chat', [
    'model' => 'claude-sonnet-4-6',
    'system' => $system,
    'prompt' => $prompt,
    'max_tokens' => 2048,
], ['X-Gateway-Secret: ' . $gatewaySecret]);
```

## Deliberately not migrated

WingCommander's backend (`apps/wingcommander-reference/backend`, TypeScript/
Node) still has its own separate OpenRouter-fallback implementation in
`chat.ts`/`rag.ts` — not migrated to call this gateway. That surface streams
responses token-by-token to its frontend; this HTTP endpoint is
non-streaming. Wrapping it would need a streaming-capable endpoint here (SSE
passthrough), and the existing TypeScript implementation already works and
is proven live — judged not worth the added risk for the marginal benefit of
one more layer of indirection on a live paid feature. Revisit if
WingCommander's fallback ever needs the same kind of fix this module
represents.

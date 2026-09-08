"""
services/llm_gateway/server.py — thin FastAPI wrapper around gateway.py.

Built 2026-09-08 ("Phase 2" of the llm_gateway work, done on direct user
request) so a non-Python caller can use the same resilient Anthropic
key-pooling + OpenRouter-fallback logic that the two pipeline scripts use
in-process. First (and, for now, only) consumer:
`apps/website/pages/api/ai-gateway.php`, which previously duplicated its own
direct-Anthropic + OpenRouter cURL implementation in PHP.

Deliberately NOT wired up for WingCommander's Node backend (chat.ts/rag.ts)
in this pass -- that surface streams responses token-by-token to its
frontend, and this endpoint is currently non-streaming. Migrating it would
need a streaming-capable endpoint here (SSE passthrough) plus a change to
what is a live, working, already-resilient TypeScript implementation --
judged not worth the risk for the marginal benefit right now. See this
module's README for the full reasoning.

Auth: every /v1/chat request must carry `X-Gateway-Secret` matching the
`GATEWAY_SHARED_SECRET` env var. This service will be reachable over the
public internet (ai-gateway.php calls it from Hostinger, not from inside
Railway's private network), and it proxies calls that cost real money on
both Anthropic and OpenRouter accounts -- an unauthenticated open proxy
would be a direct abuse/cost vector. Fails CLOSED: if the secret isn't
configured at all, every request is rejected rather than silently allowed.
"""
from __future__ import annotations

import os
from typing import Optional

from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel

from gateway import claude_call, claude_text, openrouter_call, log

app = FastAPI(title="KPI Hub LLM Gateway")

GATEWAY_SECRET = os.getenv("GATEWAY_SHARED_SECRET", "").strip()

# Anthropic model ids this gateway will attempt directly before falling back
# to OpenRouter. Anything else routes straight to OpenRouter (Gemini, Llama,
# Mistral, GPT, Grok, DeepSeek, etc. -- ai-gateway.php's non-Claude tiers).
DIRECT_ANTHROPIC_MODELS = {
    "claude-sonnet-5",
    "claude-sonnet-4-6",
    "claude-haiku-4-5-20251001",
    "claude-opus-4-7",
}

# Matches ai-gateway.php's own $openrouterFallbackModel table -- OpenRouter's
# naming isn't consistently derivable from the Anthropic model id (some
# versions use a dot, some a dash), so this is kept explicit rather than
# guessed. Update alongside ai-gateway.php's table if either changes.
OPENROUTER_SLUG = {
    "claude-sonnet-5":          "anthropic/claude-sonnet-5",
    "claude-sonnet-4-6":        "anthropic/claude-sonnet-4.6",
    "claude-haiku-4-5-20251001":"anthropic/claude-haiku-4.5",
    "claude-opus-4-7":          "anthropic/claude-opus-4.7",
}


class ChatRequest(BaseModel):
    model: str
    system: Optional[str] = None
    prompt: Optional[str] = None
    messages: Optional[list[dict]] = None
    max_tokens: int = 2048


def _require_secret(x_gateway_secret: Optional[str]) -> None:
    if not GATEWAY_SECRET:
        log.error("❌ GATEWAY_SHARED_SECRET is not configured -- refusing all requests (fail closed)")
        raise HTTPException(status_code=500, detail="Gateway not configured")
    if x_gateway_secret != GATEWAY_SECRET:
        raise HTTPException(status_code=401, detail="Invalid or missing X-Gateway-Secret")


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/v1/chat")
def chat(req: ChatRequest, x_gateway_secret: Optional[str] = Header(default=None)):
    _require_secret(x_gateway_secret)

    messages = req.messages or [{"role": "user", "content": req.prompt or ""}]

    if req.model in DIRECT_ANTHROPIC_MODELS:
        system = [{"type": "text", "text": req.system, "cache_control": {"type": "ephemeral"}}] if req.system else None
        resp = claude_call(
            model=req.model,
            max_tokens=req.max_tokens,
            system=system,
            messages=messages,
            openrouter_model=OPENROUTER_SLUG.get(req.model),
        )
        if resp is None:
            raise HTTPException(status_code=502, detail="Both direct Anthropic and OpenRouter fallback failed")
        via = "openrouter" if resp.__class__.__module__ == "types" else "anthropic"
        return {"text": claude_text(resp), "model": req.model, "via": via}

    # Not a Claude model -- OpenRouter only, no Anthropic attempt at all.
    text = openrouter_call(model=req.model, system=req.system, messages=messages, max_tokens=req.max_tokens)
    if text is None:
        raise HTTPException(status_code=502, detail="OpenRouter call failed")
    return {"text": text, "model": req.model, "via": "openrouter"}

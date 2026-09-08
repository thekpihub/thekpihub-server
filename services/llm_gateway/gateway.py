"""
services/llm_gateway/gateway.py — shared resilient LLM-calling module.

Built 2026-09-08 after two separate discoveries in the same investigation:

  1. `apps/website/pipeline.py` and `services/pipeline/pipeline.py` each called
     Claude directly, with duplicated (and in the second file's case, entirely
     MISSING) retry/fallback logic — `services/pipeline/pipeline.py` had no
     fallback at all and would crash the whole run on any Claude failure.

  2. WingCommander's Railway `ANTHROPIC_API_KEY` was diagnosed as "invalid"
     when actually the WHOLE Anthropic account had hit an org-wide spend/usage
     cap ("You have reached your specified API usage limits. You will regain
     access on 2026-10-01 at 00:00 UTC.") — a condition that blocks EVERY key
     on the account, old and new alike. See servermemory.md, 2026-09-08.

This module exists so the fix lives in one place: a resilient `claude_call()`
that (a) tries every configured Anthropic key in turn, then (b) falls back to
OpenRouter — a genuinely separate billing account — if all of them fail, and
(c) logs clearly which provider/key served each request so a cap-type failure
is visible the instant it happens.

Honest limitation, stated up front rather than glossed over: Anthropic has no
public API to check remaining credit balance ahead of time (only the Console
UI shows it). So this module can only detect a cap AFTER a call fails against
it — it cannot warn you before the account gets capped. That's why the cap-hit
log line below is loud (🛑) rather than a quiet warning: it's meant to be the
first signal you see, not a prediction.

Second honest limitation: pooling multiple Anthropic keys (ANTHROPIC_API_KEYS)
only protects against ONE bad/expired/mistyped key — if all the pooled keys
belong to the same Anthropic organization, an org-wide cap like the one this
module was built in response to will fail every one of them together. Real
resilience against that specific failure mode comes from OpenRouter (a
separate account), not from more same-org keys. Don't rely on key pooling
alone to survive another cap.
"""
from __future__ import annotations

import logging
import os
import re
import time
from types import SimpleNamespace
from typing import Optional

import anthropic
import requests

# Library code must never call logging.basicConfig() -- it configures the
# ROOT logger, and since Python only honors the FIRST basicConfig() call in
# a process, importing this module before the caller configures its own
# logging silently wins and locks in this module's format/handlers for
# EVERYTHING, including the caller's own log lines. This bit exactly that
# way on first deploy (2026-09-08): apps/website/pipeline.py's FileHandler
# for pipeline.log was constructed (so the file existed) but never actually
# received a single record, because this module's basicConfig() had already
# run during import and won -- pipeline.log came back completely empty from
# a live run, caught by downloading the artifact and checking, not assumed.
# Just get the logger; let the application (each pipeline.py) own all
# handler/format configuration. If nothing ever configures logging, Python's
# own default "no handlers found" behavior applies -- harmless.
log = logging.getLogger("llm_gateway")

DEFAULT_MODEL = "claude-sonnet-5"

# Matches the phrasing Anthropic/its SDK use for billing/rate conditions, so a
# cap-type failure gets flagged distinctly from a generic transient error.
_CAP_PATTERNS = re.compile(
    r"usage limit|spend limit|billing|credit balance|rate.?limit|quota|429|insufficient",
    re.IGNORECASE,
)


def _anthropic_keys() -> list[str]:
    """All configured Anthropic keys, primary first, de-duplicated, order kept.

    Reads ANTHROPIC_API_KEY (single, existing convention) plus an optional
    ANTHROPIC_API_KEYS (comma-separated extras) for future multi-key pooling.
    See the module docstring for why this alone doesn't survive an org-wide cap.
    """
    keys: list[str] = []
    primary = os.getenv("ANTHROPIC_API_KEY", "").strip()
    if primary:
        keys.append(primary)
    for k in os.getenv("ANTHROPIC_API_KEYS", "").split(","):
        k = k.strip()
        if k and k not in keys:
            keys.append(k)
    return keys


def _is_cap_error(exc: Exception) -> bool:
    return bool(_CAP_PATTERNS.search(str(exc)))


_clients: dict[str, anthropic.Anthropic] = {}


def _client_for(key: str) -> anthropic.Anthropic:
    if key not in _clients:
        _clients[key] = anthropic.Anthropic(api_key=key)
    return _clients[key]


def _with_retry(fn, *, retries: int = 3, base_delay: float = 5.0, label: str = ""):
    """Call fn; retry with exponential backoff. Re-raises the last exception on
    total failure (unlike pipeline.py's own with_retry, which returns None —
    this one is caught by claude_call() below so it can move on to the next
    key/provider instead of just giving up)."""
    for attempt in range(1, retries + 1):
        try:
            return fn()
        except anthropic.RateLimitError:
            if attempt == retries:
                raise
            log.warning("%s rate-limited (attempt %d/%d) — backing off 30s", label, attempt, retries)
            time.sleep(30)
        except Exception:
            if attempt == retries:
                raise
            delay = base_delay * (2 ** (attempt - 1))
            log.warning("%s failed (attempt %d/%d) — retry in %.0fs", label, attempt, retries, delay)
            time.sleep(delay)


def _openrouter_fallback(*, model: str, system, messages, max_tokens: int):
    """Call the same model via OpenRouter — a separate account/billing
    relationship, proven to keep working while the direct Anthropic account
    is capped. Returns an object shaped like an Anthropic response (so
    claude_text() needs no changes), or None if unconfigured/failed."""
    key = os.getenv("OPENROUTER_API_KEY", "").strip()
    if not key:
        return None

    or_model = model if model.startswith("anthropic/") else f"anthropic/{model}"
    or_messages = []
    if system:
        sys_text = system[0]["text"] if isinstance(system, list) else system
        or_messages.append({"role": "system", "content": sys_text})
    for m in messages:
        content = m["content"]
        if isinstance(content, list):
            content = "\n".join(b.get("text", "") for b in content if isinstance(b, dict))
        or_messages.append({"role": m["role"], "content": content})

    try:
        r = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {key}",
                "Content-Type": "application/json",
                "HTTP-Referer": "https://thekpihub.com",
                "X-Title": "The KPI Hub Pipeline",
            },
            json={"model": or_model, "messages": or_messages, "max_tokens": max_tokens},
            timeout=60,
        )
        r.raise_for_status()
        text = r.json()["choices"][0]["message"]["content"]
        return SimpleNamespace(content=[SimpleNamespace(text=text)])
    except Exception as exc:
        log.error("❌ OpenRouter fallback also failed: %s", exc)
        return None


def claude_call(**kwargs):
    """
    Drop-in replacement for `anthropic.Anthropic(...).messages.create(**kwargs)`.

    Tries every configured Anthropic key in turn (retrying each with backoff),
    then falls back to OpenRouter. Returns an Anthropic-response-shaped object
    (a real SDK response, or a SimpleNamespace matching its `.content[0].text`
    shape on fallback), or None if every option failed — same contract as the
    claude_call()/direct client.messages.create() calls this replaces, so
    existing `if resp is None:` handling at call sites needs no changes.
    """
    model = kwargs.get("model", DEFAULT_MODEL)
    keys = _anthropic_keys()

    if not keys:
        log.error("❌ No ANTHROPIC_API_KEY configured at all")

    last_exc: Optional[Exception] = None
    for i, key in enumerate(keys, start=1):
        label = f"anthropic(key {i}/{len(keys)}, model={model[:20]})"
        try:
            resp = _with_retry(lambda k=key: _client_for(k).messages.create(**kwargs), label=label)
            log.info("✅ %s succeeded", label)
            return resp
        except Exception as exc:
            last_exc = exc
            tag = "CAP_HIT" if _is_cap_error(exc) else "FAILED"
            log.warning("⚠️  %s %s: %s", label, tag, exc)

    if last_exc is not None and _is_cap_error(last_exc):
        log.error(
            "🛑 CAP_HIT — every configured Anthropic key is blocked (usage/spend limit or "
            "rate limit). If all keys share one Anthropic org, this is account-wide — adding "
            "more keys under the same org will not help. See this module's docstring."
        )

    if os.getenv("OPENROUTER_API_KEY", "").strip():
        log.warning("⚠️  All %d Anthropic key(s) exhausted — falling back to OpenRouter", len(keys))
        return _openrouter_fallback(
            model=model,
            system=kwargs.get("system"),
            messages=kwargs.get("messages", []),
            max_tokens=kwargs.get("max_tokens", 2048),
        )

    log.error("❌ All Anthropic keys failed and OPENROUTER_API_KEY is not configured — giving up")
    return None


def claude_text(resp) -> str:
    """
    Return the first text block's content from a Claude response.

    `resp.content[0]` is not always a TextBlock — extended thinking makes
    Claude sometimes return a ThinkingBlock first. Scan for the first block
    that actually has a `.text` attribute instead of assuming position 0.
    (Same fix as both pipeline files already had independently — centralized
    here now.)
    """
    for block in resp.content:
        text = getattr(block, "text", None)
        if text is not None:
            return text
    raise RuntimeError(
        f"No text block in Claude response (block types: {[type(b).__name__ for b in resp.content]})"
    )

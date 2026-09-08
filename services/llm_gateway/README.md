# llm_gateway

Shared resilient Claude-calling module, used by both Python pipeline scripts
(`apps/website/pipeline.py` and `services/pipeline/pipeline.py`) instead of
each calling `anthropic.Anthropic(...).messages.create()` directly with its
own (previously duplicated, in one case missing) retry/fallback logic.

## Why this exists

Built 2026-09-08 after finding that WingCommander's "invalid Anthropic key"
was never actually a bad key — the whole Anthropic account had hit an
**org-wide** usage/spend cap, which blocks every key on the account equally.
Full story in `servermemory.md`, 2026-09-08 entries.

## What it does

`claude_call(**kwargs)` is a drop-in replacement for
`anthropic_client.messages.create(**kwargs)`:

1. Tries every configured Anthropic key in order (`ANTHROPIC_API_KEY`, plus
   any comma-separated extras in `ANTHROPIC_API_KEYS`).
2. Falls back to the same model via OpenRouter (`OPENROUTER_API_KEY`) — a
   genuinely separate billing account — if every Anthropic key fails.
3. Logs clearly which provider/key served each request, and flags a
   cap-shaped failure loudly (`🛑 CAP_HIT`) the moment it happens.
4. Returns `None` if everything failed — same contract callers already
   handle (`if resp is None: ...`).

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

## Usage

Each pipeline script adds `services/` to `sys.path` and imports directly:

```python
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "services"))
from llm_gateway.gateway import claude_call, claude_text
```

## Not yet done (offered, not assumed)

WingCommander's backend (`apps/wingcommander-reference/backend`, TypeScript/
Node) and `ai-gateway.php` still have their own separate fallback
implementations — they are not Python, so they can't import this module
directly. Wrapping this module as a small HTTP service those two could call
instead of hitting Anthropic/OpenRouter inline was proposed as a follow-up
("Phase 2") but not built without confirming first, since it would change a
live paid feature's core dependency.

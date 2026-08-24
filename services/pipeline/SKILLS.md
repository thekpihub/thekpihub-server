# SKILLS — thekpihub-pipeline

> **Role in the ecosystem:** the content/intelligence engine — autonomous
> research + publishing that feeds the public site and the product.

## Purpose
Scheduled automation that researches, generates, verifies, and publishes content
(articles/benchmarks) and notifies operators. Runs unattended on a cron.

## Tech stack
- **Language:** Python (`pipeline.py`)
- **Deps:** `requirements.txt`
- **Runtime:** GitHub Actions cron (`.github/workflows/pipeline.yml`)
- **AI:** Anthropic (Claude) · **Research:** SerpAPI
- **Publish:** WordPress REST (Application Password) · **Notify:** Telegram bot

## Capabilities ("skills")
- Automated research + verification (SerpAPI)
- AI content generation (Anthropic)
- Publish to WordPress on `thekpihub.com`
- Operator notifications (Telegram)
- `DRY_RUN` mode for safe testing (skips publish + notify)

## Key entry points
- `pipeline.py` — the whole pipeline
- `.github/workflows/pipeline.yml` — schedule + secrets wiring

## Secrets (GitHub Actions repository secrets)
`ANTHROPIC_API_KEY`, `SERPAPI_KEY`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`,
`WP_SITE_URL`, `WP_USERNAME`, `WP_APP_PASSWORD`. Never commit `.env`.

## Relationships with the other 3 repos
| Repo | Relationship |
|---|---|
| **thekpihub-website** | Primary consumer — publishes articles/benchmarks to the WordPress blog on `thekpihub.com`. ⚠️ A **second, divergent `pipeline.py` (38 KB)** also lives in the website repo wired to its own daily/premium workflows; canonical-source decision pending. |
| **thekpihub-app** | Supplies content/benchmark data that can back the product's intelligence surfaces. Loose coupling via shared data/WordPress. |
| **thekpihub-wing-commander** | Both use **Anthropic** for generation; otherwise independent. Could share prompt/quality conventions. |

## Shared services (whole ecosystem)
Anthropic (AI) · WordPress on `thekpihub.com` · (SerpAPI, Telegram are pipeline-specific).

## Status
Smallest, cleanest repo. Main open item: reconcile the duplicate/divergent
pipeline between this repo and the website (canonical-source decision pending).

_Last updated: 2026-06-28 (post-consolidation)._

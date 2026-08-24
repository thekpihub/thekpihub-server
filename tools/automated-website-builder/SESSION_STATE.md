
# AMSDV Pipeline — Session State
Last updated: 2026-05-31 ~4 AM IST

## Current Status
All 5 pipeline phases working end-to-end under PM2.

## Pipeline Phases
- Phase 1 - Hardcoded Blueprint: WORKING
- Phase 2 - Module Assembly: WORKING
- Phase 3 - Hermes3 Glue Synthesis: WORKING
- Phase 4 - Sandbox (skipped): PASSING
- Phase 5 - Local Deployment: WORKING

## Environment
- WSL distro: nitr0@Nitro-Dust
- Project path: ~/projects/automated-website-builder
- Deployment path: ~/deployments/thekpihub/releases/
- Ollama: running on port 11434 (hermes3 model)
- PM2: thekpihub-core-runtime (online)
- PM2 binary: /home/nitr0/.hermes/node/lib/node_modules/pm2/bin

## Resume Commands
export PATH=$PATH:/home/nitr0/.hermes/node/lib/node_modules/pm2/bin
cd ~/projects/automated-website-builder
pm2 status
pm2 logs thekpihub-core-runtime --lines 20

## Next Tasks
1. Fix Telegram bot - get real token from @BotFather
2. Deploy engine to Hostinger VPS
3. Wire real Hermes Phase 1 blueprint generation
4. Add real sandbox tests
5. Connect Telegram trigger end-to-end

## Known Issues
- Telegram bot EFATAL error - token invalid, needs real BotFather token
- Phase 1 uses hardcoded blueprint (not AI-generated yet)
- PM2 PATH must be set manually in each new terminal

Hermes fixed.

Provider: openai-codex
Model: gpt-5.3-codex

Issue:
- gpt-5.3-codex-spark produced HTTP 400
- switched to gpt-5.3-codex

Working command:
hermes chat

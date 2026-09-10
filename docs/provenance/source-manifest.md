# Source Manifest

| Original repository | Branch | Commit SHA | Destination | Reason | Modifications |
|---|---|---|---|---|---|
| thekpihub/thekpihub-website | main | cb572897579a4f242be8e9a4795e254870de37bb | apps/website | Live TheKPIHub.com public website | Removed Git metadata, generated folders, and secret-bearing local config files |
| thekpihub/thekpihub-platform | main | 3f23ee117a6c696f3ed1b0134c46ffc4e1088e7c | apps/platform | Canonical future platform app | Removed Git metadata and generated folders |
| thekpihub/thekpihub-app | main | f61cf59393763f94f733e65edc78266a09d082d4 | apps/legacy-app (**moved to `archive/apps/legacy-app` 2026-09-10** — investigated in full for a `kpihub-backend` deployment, turned out to be a complete separate SaaS backend with no live database behind it; deliberately not activated, see servermemory.md) | Legacy app/backend/database source | Removed Git metadata, generated folders, and `credentials.md` |
| thekpihub/thekpihub-pipeline | main | d79d8495a91920d811f804c082cc714a9d4f1ec8 | services/pipeline | KPI pipeline service | Removed Git metadata and Python caches |
| thekpihub/automated-website-builder | main | 44298f072131c662a1538e592188e7f8df1d2005 | tools/automated-website-builder (**moved to `archive/tools/automated-website-builder` 2026-09-10** — confirmed a local WSL/Ollama experiment, never deployed) | Build automation tooling | Removed Git metadata and generated folders |
| thekpihub/thekpihub-wingcommander-design-sync | main | 3a4f186e46500e2bbf1f43e7800a4b7f2579d0bc | apps/wingcommander-reference | Related AI copilot reference app with MEMORY/design-sync context | Removed Git metadata and generated folders |
| thekpihub/thekpihub-wing-commander | claude/eager-knuth-WXAr4 | 12d31b31d39680cd8957775dcd19ad6cb3ccc11a | Not copied; provenance reference | Duplicate/near-duplicate Wing Commander source | None |
| thekpihub/ditto-wingman | main | 32d85752c91219511b4dbbad06f3688473fcb8d8 | apps/wingcommander-reference (replaces the 2026-07-08 copy above) | **Correction 2026-09-02**: NOT a separate product — its Cloudflare Worker (`kpihub-api-proxy.wingcraft.workers.dev`) is load-bearing backend for apps/website's free tools (auditor.html, cohort.html, freedom.html, india-benchmarks.html, narrative.html, stack-scorer.html, today.html, validator.html). The earlier audit (at commit d1eaf8bd, before this repo's Worker-wiring commit) missed the connection because it lives in a different repo (apps/website) than the one being audited. Railway's `ditto-wingman-backend`/`ditto-wingman-frontend` services are being repointed from this repo to thekpihub-server. | Removed Git metadata and generated folders |
| thekpihub/thekpihub | main | 11b77a2cea12935e867ec600ea947b45a8419b81 | Not copied; archive reference | Archived kitchen-sink predecessor | None |
| hsharmagxi-debug/thekpihub | main | 473e16622192bd8d7d627991d1f3948073e722e8 | Not copied; provenance reference | Personal mirror of KPI Hub code | None |
| hsharmagxi-debug/thekpihub-platform | main | 9fb89749d83f3cb32872f7d6c48e108486fa84b0 | Not copied; provenance reference | Recovery docs and evidence | None |
| hsharmagxi-debug/thekpihub_1554 | main | 8a03f24ee5b9b0d5f3986a94caa1fa369b3aa35a | Not copied; provenance reference | Newer personal experimental Next.js implementation, contains real `.env` | `.env` not copied |
| hsharmagxi-debug/kpihub-vault | main | 54c23ac8935c2e9572447bd03f2ca61d1dab19ef | Not copied; archive reference | Vault/recovery material with invalid Windows path and credential-rotation evidence | None |
| hsharmagxi-debug/ditto-wingman | main | empty | Not copied | Empty repository | None |


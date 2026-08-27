# WSL2 pilot smoke test — kpihub-assembled

Ran 2026-08-25 as part of Phase 3 (WSL2 runtime-isolation pilot),
validating this repo under WSL2 + Ubuntu 24.04 alongside the already
-validated Windows baseline. Windows baseline unchanged throughout.

| Check | Windows baseline | WSL2 | Match? |
|---|---|---|---|
| Git root | pass | pass | yes |
| Remote | hsharmagxi-debug/kpihub-assembled | same | yes |
| Branch | main | main | yes |
| HEAD | matches origin | matches origin exactly | yes |
| npm ci | 43 packages, 0 vuln, 39s | 47 packages, 0 vuln, 14s | yes (pkg-count diff is normal platform-specific optional deps) |
| typecheck | clean | clean | yes |
| build | 15 routes, all generated | 15 routes, all generated, identical route list | yes |
| git status/diff | pass | pass | yes |
| local edit + commit | pass | pass (this file) | yes |
| git push | not attempted (ASK zone) | not attempted (ASK zone) | yes |

**Sandbox host-escape check (the actual point of this pilot):** PASS.
Claude Code's real sandbox (not a manual bwrap reproduction) blocks
cmd.exe/powershell.exe execution via a process/IPC-namespace-level block
on the WSL interop socket, confirmed 3/3 with a clean positive control.
Full detail in 10-projects\.claude\WSL-PILOT-FINDINGS.md (Windows side).

**Known gap, not yet fixed:** the Windows-style  glob
deny rules are silently ignored on this Linux sandbox ("Glob patterns
not fully supported on Linux"). Literal-path protections (~/.ssh,
~/.config/gh, ~/.docker, the 4 specific credential files) still work.
A stray .env file added directly to this repo would not be caught by
the Read-tool deny here the way it is on Windows.

## 2026-08-26 update — /mnt/c isolation gap closed, Claude version 2.1.245

Follow-up native-Claude regression (same WSL2 session type as above).

**Fixed:** `/mnt/c` (the WSL2 Windows-host mount) was fully visible to
the sandbox with no denyRead entry covering it — `cmd.exe` and
`/mnt/c/Users/Admin` both resolved as original host objects. Added a
single entry to `sandbox.filesystem.denyRead` in `.claude/settings.local.json`:
`"/mnt/c"`. Confirmed live (no Claude restart needed — the sandbox is
reconstructed per Bash invocation): `mount` now shows a fresh empty
`tmpfs` layered over the original `9p drvfs` mount; `/mnt/c/Windows`,
`cmd.exe`, and `powershell.exe` are gone (`command -v` no longer
resolves either); `/mnt/c/Users/Admin` still stats but is empty
scaffolding for the unrelated `.claude/ide` mount, not real Windows
data. `npm run lint/typecheck/build` re-ran clean afterward — no
tool depended on `/mnt/c`. Change was JSON-validated before and after
(denyRead count 9→10, no drift in permissions allow/ask/deny, `failIfUnavailable`
and `allowUnsandboxedCommands` unchanged).

**Sandbox substitution mechanism confirmed:** denyRead-protected file
paths present inside the sandbox as zero-byte character-special
device nodes (mode 666), not as "access denied" or "not found" —
confirmed identically via Bash `stat`, Python `os.lstat`, and Node
`fs.lstatSync` against the 4 fixture paths and the real
`~/.ssh/id_ed25519`. A denyRead directory (like the new `/mnt/c`
entry) instead gets an empty `tmpfs` mounted over it. Don't confuse
"the substitute node is accessible" with "the original object is
accessible" when reading future sandbox test output.

**Open discrepancy, not resolved this session:** the "known gap" noted
above says glob deny rules (`Edit(**/credentials.*)` etc.) don't work
on Linux — only the 4 literal fixture paths are protected. But this
session, a disposable probe at `apps/platform/credentials.probe`
(matches only the glob, not any literal path) was blocked for both
Write and Edit. That contradicts the recorded gap. Not reconciled —
could mean the gap was fixed since 2026-08-25, or that a different
mechanism produced this session's block. Needs a dedicated follow-up
test with a glob-only-covered path outside the 4 known fixtures
before treating credential-glob protection as generally trustworthy.

**Host escape:** not re-executed this session (declined, per repeated
instruction, to run `cmd.exe`/`powershell.exe` even for testing).
Structural evidence only: post-fix, neither binary resolves via
`command -v`, and no policy layer permits execution as far as static
inspection shows. The 2026-08-25 entry above claims actual
execution-based confirmation (3/3, positive control) via a different,
IPC-socket-level mechanism — carried forward as prior evidence, not
independently re-verified here.

**Result:** all Phase 3 controls scoped and tested across this
conversation now read PASS, contingent on the open discrepancy above.
`CODEX_RUNTIME_ISOLATION_REVIEW = FUTURE_SECURITY_WORK` — the Codex
runtime referenced earlier in this pilot does not inherit any of
Claude's sandbox protections and has not been evaluated.

Central Windows-side manifest (`10-projects\.claude\WSL-PILOT-FINDINGS.md`)
intentionally **not** updated from here — `/mnt/c` is now denied by
design, so this session can no longer reach it. That update is a
separate, explicit handoff for the Windows side.

## 2026-08-27 update — glob discrepancy closed operationally; corrected policy figures

**OLD FINDING (2026-08-25):** glob-based deny rules (`Edit(**/credentials.*)` etc.) don't work on Linux — only 4 literal fixture paths are protected.

**RETEST (2026-08-26):** a probe at `apps/platform/credentials.probe` (glob-only match, no literal-path deny) was blocked for Write/Edit/Read; a same-location, non-matching control file wrote/deleted normally. Contradicted the old finding but wasn't reconciled — noted as possibly a fix since 2026-08-25, or a different mechanism.

**CORRECTION (2026-08-26 → 2026-08-27):** a later, independent glob-only probe (`phase3-glob-rule-probe/.env.globprobe`, `phase3-glob-rule-probe/credentials.globprobe`) was also converted into the same sandbox-substitution device-node signature as the literal fixtures, which meant the permission-layer mechanism and the filesystem-substitution mechanism could not be cleanly separated in this sandbox — either one alone could explain the block. The 2026-08-27 session confirmed all four of those probe artifacts are now externally cleaned up (`NOT_FOUND`) and did not recreate them.

**FINAL VERIFIED FINDING (2026-08-27):**
```
GLOB_RULE_DISCREPANCY = RESOLVED_OPERATIONALLY
CURRENT_CLAUDE_2_1_246_SECRET_PATTERN_PROTECTION = PASS
FILESYSTEM_PATTERN_SUBSTITUTION = PASS
PERMISSION_VS_FILESYSTEM_MECHANISM_SEPARABILITY = NOT_FULLY_SEPARABLE_IN_CURRENT_SANDBOX
```
This is an end-to-end protection conclusion, not a claim that any single internal mechanism (permission glob vs. filesystem substitution) was independently isolated, and not a claim that Anthropic fixed anything specific in version `2.1.246` — no evidence establishes when or why behavior changed between 2026-08-25 and 2026-08-26.

**Settings/policy figures corrected this session:** the repo's `.claude/settings.local.json` has no `sandbox.filesystem.read.denyOnly` array at all — the enforced deny list lives only in the live Bash tool policy handed to a given session, not in any file on disk. For the 2026-08-27 session that list held **39 total entries, 3 of which reference `/mnt/c`** (2 narrow `*/.claude/ide` subpaths + 1 blanket `/mnt/c`), correcting an earlier assumption of "10 total / 1 mnt_c entry." `MNT_C_RUNTIME_ISOLATION = PASS` and `/mnt/c` denial being present are affirmed for the 2026-08-27 session specifically (read from that session's own live policy text) — not re-tested by attempting `ls /mnt/c` again, per standing instruction not to reopen that test.

`UNEXPECTED_REAL_REPO_DRIFT = NO` — the extra credential-like root files, the 3 modified `.env.example` paths, and the extra root dotfiles seen in `git status` were metadata-confirmed (character-special device nodes, uniform `nobody`-owned/mode-666/identical-timestamp signature) as sandbox substitution artifacts, not real changes, matching the mechanism already documented above in the 2026-08-26 entry.

Full detail, including the settings-provenance walkthrough and an explicitly-flagged unconfirmed external claim (a separate "Codex secret-aggregation incident" report that no Claude session has verified), is in `AGENT-HANDOFF.md`.

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

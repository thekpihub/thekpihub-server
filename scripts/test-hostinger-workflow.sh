#!/usr/bin/env bash
set -euo pipefail

repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
workflow="$repo_root/.github/workflows/deploy-website-hostinger.yml"

test -f "$workflow" || {
  printf 'Hostinger workflow missing: %s\n' "$workflow" >&2
  exit 1
}

grep -Fq 'scripts/stage-hostinger-site.sh' "$workflow"
grep -Fq 'website-payload/' "$workflow"
grep -Fq 'environment: hostinger-production' "$workflow"
grep -Fq 'StrictHostKeyChecking=yes' "$workflow"
grep -Fq 'HOSTINGER_SSH_KNOWN_HOSTS' "$workflow"
grep -Fq "github.event_name == 'workflow_dispatch'" "$workflow"

if grep -Eq -- '--delete([=[:space:]]|$)|rsync[^\n]*(\./|apps/website/)' "$workflow"; then
  printf 'workflow contains a destructive or unscoped rsync command\n' >&2
  exit 1
fi

printf 'Hostinger workflow safety invariants verified\n'

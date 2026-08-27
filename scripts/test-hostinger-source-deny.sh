#!/usr/bin/env bash
set -euo pipefail

repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
fragment="$repo_root/apps/website/hostinger-source-deny.conf"

test -f "$fragment" || {
  printf 'Hostinger source deny fragment missing: %s\n' "$fragment" >&2
  exit 1
}

for required in \
  'docs|tools|wp-plugin|\.github' \
  'api/index\.js' \
  'server\.js' \
  'tailwind\.config\.js' \
  'Require all denied' \
  'Deny from all'; do
  grep -Fq "$required" "$fragment" || {
    printf 'required deny policy missing: %s\n' "$required" >&2
    exit 1
  }
done

if grep -Fq '<FilesMatch "\.(js' "$fragment" \
  || grep -Fq '<FilesMatch "\.(php' "$fragment" \
  || sed 's/config\\\\\.example\\\\\.js//g' "$fragment" | grep -Eq '(^|[^[:alnum:].])config\\\.js([^[:alnum:].]|$)'; then
  printf 'deny policy is broad enough to block runtime JavaScript/PHP/config.js\n' >&2
  exit 1
fi

printf 'Hostinger source deny policy invariants verified\n'

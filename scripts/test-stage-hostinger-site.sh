#!/usr/bin/env bash
set -euo pipefail

repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
source_dir="$repo_root/apps/website"
manifest="$source_dir/hostinger-publish-manifest.txt"
stage_dir=$(mktemp -d)
trap 'rm -rf "$stage_dir"' EXIT

"$repo_root/scripts/stage-hostinger-site.sh" "$source_dir" "$stage_dir"

test -f "$manifest" || {
  printf 'reviewed publish manifest missing: %s\n' "$manifest" >&2
  exit 1
}

LC_ALL=C sort "$manifest" > "$stage_dir.expected"
find "$stage_dir" -type f -printf '%P\n' | LC_ALL=C sort > "$stage_dir.actual"
diff -u "$stage_dir.expected" "$stage_dir.actual"

required=(
  index.html
  pricing.html
  colors_and_type.css
  gk-shortcut.js
  assets/logo-mark.svg
  landing/app.js
  landing/tailwind.css
  account/integrations.html
  robots.txt
  sitemap.xml
  brevo-subscribe.php
  stripe-session.php
  stripe-webhook.php
  pages/api/ai-gateway.php
  pages/api/open-wingman.php
  open-wingman.php
)

for path in "${required[@]}"; do
  test -f "$stage_dir/$path" || {
    printf 'required publish file missing: %s\n' "$path" >&2
    exit 1
  }
done

forbidden=(
  .git
  .github
  .env.example
  README.md
  CLAUDE.md
  MEMORY.md
  SKILLS.md
  package.json
  package-lock.json
  requirements.txt
  vercel.json
  firebase.json
  config.example.js
  config.js.template
  .htaccess.template
  server.js
  pipeline.py
  tailwind.config.js
  docs
  tools
  wp-plugin
  api
  landing/app.jsx
  landing/tailwind-input.css
  config.js
  .htaccess
  wp-admin
  wp-content
  wp-includes
)

for path in "${forbidden[@]}"; do
  test ! -e "$stage_dir/$path" || {
    printf 'forbidden publish path present: %s\n' "$path" >&2
    exit 1
  }
done

if find "$stage_dir" -type f \
  \( -name '*.md' -o -name '*.py' -o -name '*.jsx' -o -name '*.map' \
     -o -name '*.sql' -o -name '*.template' -o -name '*.log' \
     -o -name '*.bak' -o -name '.env*' \) -print -quit | grep -q .; then
  printf 'forbidden extension present in staging\n' >&2
  exit 1
fi

printf 'Hostinger staging policy verified: %s files\n' \
  "$(find "$stage_dir" -type f | wc -l)"

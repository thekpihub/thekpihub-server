#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -ne 2 ]; then
  printf 'usage: %s SOURCE_DIR EMPTY_STAGE_DIR\n' "$0" >&2
  exit 64
fi

source_dir=$(cd "$1" && pwd)
stage_dir=$2
manifest="$source_dir/hostinger-publish-manifest.txt"

mkdir -p "$stage_dir"
if find "$stage_dir" -mindepth 1 -print -quit | grep -q .; then
  printf 'stage directory must be empty: %s\n' "$stage_dir" >&2
  exit 65
fi

test -f "$manifest" || {
  printf 'publish manifest does not exist: %s\n' "$manifest" >&2
  exit 66
}

copy_file() {
  local relative=$1
  test -f "$source_dir/$relative" || {
    printf 'publish file does not exist: %s\n' "$relative" >&2
    exit 66
  }
  install -D -m 0644 "$source_dir/$relative" "$stage_dir/$relative"
}

while IFS= read -r relative; do
  [ -z "$relative" ] && continue
  case "$relative" in \#*) continue ;; esac
  case "$relative" in
    /*|*..*|*\**|*\?*)
      printf 'invalid manifest path: %s\n' "$relative" >&2
      exit 67
      ;;
  esac
  copy_file "$relative"
done < "$manifest"

printf 'Staged %s website files in %s\n' \
  "$(find "$stage_dir" -type f | wc -l)" "$stage_dir"

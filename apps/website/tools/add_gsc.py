#!/usr/bin/env python3
"""
add_gsc.py — The KPI Hub Google Search Console Verifier
Injects GSC verification meta tag into all HTML files.
Run from repo root: python3 add_gsc.py
"""

import glob
import os

GSC_TAG = 'yRGmgTNjIHFmLom_ZrczRQpmaJkf2SpAZWR75g3g71k'

GSC_SNIPPET = f'    <meta name="google-site-verification" content="{GSC_TAG}">\n'

def inject_gsc(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    if GSC_TAG in content:
        print(f"  ⏭️  {filepath}")
        return False

    if '<head>' in content:
        content = content.replace('<head>', '<head>\n' + GSC_SNIPPET, 1)
    elif '<HEAD>' in content:
        content = content.replace('<HEAD>', '<HEAD>\n' + GSC_SNIPPET, 1)
    else:
        print(f"  ❌ {filepath} — No <head> tag")
        return False

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"  ✅ {filepath}")
    return True

def main():
    os.chdir('/home/hsharma/thekpihub-website')
    
    print("\n" + "=" * 70)
    print("  The KPI Hub — Google Search Console Injector")
    print(f"  Verification ID: {GSC_TAG[:30]}...")
    print("=" * 70)

    html_files = glob.glob("*.html")

    if not html_files:
        print("\n  [ERROR] No HTML files found.")
        return 0, 0

    print(f"\n  Found {len(html_files)} HTML files\n")

    injected = 0
    skipped  = 0

    for filepath in sorted(html_files):
        result = inject_gsc(filepath)
        if result:
            injected += 1
        else:
            skipped += 1

    print("\n" + "=" * 70)
    print(f"  ✅ Injected  : {injected} files")
    print(f"  ⏭  Skipped   : {skipped} files (GSC tag already present)")
    print("=" * 70)

    return injected, skipped

if __name__ == "__main__":
    main()

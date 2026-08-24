#!/usr/bin/env python3
"""
add_ga4.py — The KPI Hub Analytics Injector
Injects GA4 tracking into all HTML files.
Run from repo root: python add_ga4.py
"""

import os
import glob

# ─── CONFIG ───────────────────────────────────────────────────────────────────
GA4_ID = "G-DZPCCPEP1J"

GA4_SNIPPET = f"""
  <!-- ====== KPI Hub Analytics: GA4 ====== -->
  <script async src="https://www.googletagmanager.com/gtag/js?id={GA4_ID}"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){{dataLayer.push(arguments);}}
    gtag('js', new Date());
    gtag('config', '{GA4_ID}', {{
      page_title: document.title,
      page_location: window.location.href,
      send_page_view: true
    }});

    // ── Custom KPI Hub Event Tracking ──
    document.addEventListener('DOMContentLoaded', function () {{

      // Track Early Access / Waitlist CTA clicks
      document.querySelectorAll('a[href="#waitlist"], .waitlist-btn, [data-cta="waitlist"]').forEach(function(el) {{
        el.addEventListener('click', function() {{
          gtag('event', 'waitlist_click', {{
            event_category: 'CTA',
            event_label: 'Waitlist Button',
            value: 1
          }});
        }});
      }});

      // Track pricing page visits
      document.querySelectorAll('a[href*="pricing"]').forEach(function(el) {{
        el.addEventListener('click', function() {{
          gtag('event', 'pricing_interest', {{
            event_category: 'Navigation',
            event_label: 'Pricing Click'
          }});
        }});
      }});

      // Track outbound links
      document.querySelectorAll('a[href^="http"]').forEach(function(el) {{
        if (!el.href.includes('thekpihub.com')) {{
          el.addEventListener('click', function() {{
            gtag('event', 'outbound_click', {{
              event_category: 'Outbound',
              event_label: el.href
            }});
          }});
        }}
      }});

      // Track scroll depth (25%, 50%, 75%, 100%)
      var scrollDepths = [25, 50, 75, 100];
      var fired = {{}};
      window.addEventListener('scroll', function() {{
        var scrollPct = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
        scrollDepths.forEach(function(depth) {{
          if (scrollPct >= depth && !fired[depth]) {{
            fired[depth] = true;
            gtag('event', 'scroll_depth', {{
              event_category: 'Engagement',
              event_label: depth + '%',
              value: depth
            }});
          }}
        }});
      }});
    }});
  </script>
  <!-- ====== End Analytics ====== -->
"""

# ─── INJECTION LOGIC ──────────────────────────────────────────────────────────
def inject_ga4(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Skip if already injected
    if GA4_ID in content:
        print(f"  [SKIP]    {filepath} — GA4 already present")
        return False

    # Inject right after <head> tag
    if '<head>' in content:
        content = content.replace('<head>', '<head>' + GA4_SNIPPET, 1)
    elif '<HEAD>' in content:
        content = content.replace('<HEAD>', '<HEAD>' + GA4_SNIPPET, 1)
    else:
        print(f"  [WARN]    {filepath} — No <head> tag found, skipping")
        return False

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"  [INJECTED] {filepath}")
    return True

# ─── MAIN ─────────────────────────────────────────────────────────────────────
def main():
    print("=" * 60)
    print("  The KPI Hub — GA4 Analytics Injector")
    print(f"  Measurement ID: {GA4_ID}")
    print("=" * 60)

    html_files = glob.glob("*.html") + glob.glob("**/*.html", recursive=True)

    if not html_files:
        print("\n  [ERROR] No HTML files found. Run from repo root.")
        return

    print(f"\n  Found {len(html_files)} HTML files\n")

    injected = 0
    skipped = 0

    for filepath in sorted(html_files):
        result = inject_ga4(filepath)
        if result:
            injected += 1
        else:
            skipped += 1

    print("\n" + "=" * 60)
    print(f"  ✅ Injected : {injected} files")
    print(f"  ⏭  Skipped  : {skipped} files (already had GA4)")
    print(f"  📊 GA4 ID   : {GA4_ID}")
    print("=" * 60)
    print("\n  Next steps:")
    print("  1. git add -A")
    print("  2. git commit -m 'feat: inject GA4 analytics across all pages'")
    print("  3. git push origin main")
    print("  4. Verify at: analytics.google.com → Realtime report\n")

if __name__ == "__main__":
    main()

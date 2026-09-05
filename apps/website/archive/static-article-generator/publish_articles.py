#!/usr/bin/env python3
"""
publish_articles.py — KPI Hub static article publisher (ARCHIVED, non-functional as-is)

Archived 2026-09-04 — see README.md in this folder for why. Never wired into any
GitHub Actions workflow; superseded by pipeline.py's direct-to-WordPress-DB publishing
before this script was ever run in production. Paths below were fixed up for this
folder's new location, but blog.html no longer has ARTICLES_INJECT_HERE markers to
inject into (it's a redirect to blog.thekpihub.com as of 2026-09-04) and sitemap.xml's
anchor comment text has since changed — reviving this would need more than a path fix.

Reads articles from a JSON file (pipeline output), renders each one
into /articles/<slug>.html using article-template.html, then injects
article cards into blog.html between the ARTICLES_INJECT_HERE markers.

Usage:
    python publish_articles.py
    python publish_articles.py --input path/to/articles.json
    python publish_articles.py --dry-run

Expected JSON format (list of article objects):
    [
      {
        "title":        "CAC Payback Extends to 18 Months in 2026",
        "slug":         "cac-payback-2026",
        "category":     "Benchmarks",
        "summary":      "One-paragraph lead ...",
        "body":         "<p>HTML content...</p>",
        "source":       "KPI Hub Research",
        "published_at": "2026-04-20"
      },
      ...
    ]
"""

import argparse
import json
import sys
from datetime import datetime
from pathlib import Path

# This script now lives in archive/static-article-generator/, two levels below the
# site root (it used to live in tools/, one level below — fixed up when archived).
SITE_ROOT   = Path(__file__).resolve().parent.parent.parent
# The template lives alongside this script (both archived together) so it is never
# served as a page in its own right — it is generator input, not content.
TEMPLATE    = Path(__file__).resolve().parent / "article-template.html"
ARTICLES_DIR = SITE_ROOT / "articles"
BLOG_HTML   = SITE_ROOT / "blog.html"
SITEMAP_XML = SITE_ROOT / "sitemap.xml"

INJECT_MARKER   = "<!-- ARTICLES_INJECT_HERE -->"
SITEMAP_ANCHOR  = "<!-- Blog / Intelligence Feed -->"


def load_template() -> str:
    if not TEMPLATE.exists():
        sys.exit(f"ERROR: Template not found at {TEMPLATE}")
    return TEMPLATE.read_text(encoding="utf-8")


def render_article(template: str, article: dict) -> str:
    html = template
    html = html.replace("{{TITLE}}",    article.get("title", ""))
    html = html.replace("{{SLUG}}",     article.get("slug", ""))
    html = html.replace("{{CATEGORY}}", article.get("category", ""))
    html = html.replace("{{SUMMARY}}",  article.get("summary", ""))
    html = html.replace("{{BODY}}",     article.get("body", ""))
    html = html.replace("{{SOURCE}}",   article.get("source", "KPI Hub Research"))
    html = html.replace("{{DATE}}",     article.get("published_at", ""))
    return html


def build_card(article: dict) -> str:
    slug     = article.get("slug", "")
    title    = article.get("title", "")
    summary  = article.get("summary", "")
    category = article.get("category", "")
    date     = article.get("published_at", "")
    return f"""
            <div class="article-card reveal" data-category="{category}">
                <span class="category">{category}</span>
                <h3><a href="/articles/{slug}.html">{title}</a></h3>
                <p>{summary}</p>
                <div class="article-card-foot">
                    <span class="article-date">{date}</span>
                    <a href="/articles/{slug}.html" class="article-read">Read →</a>
                </div>
            </div>"""


def update_blog_index(articles: list[dict], dry_run: bool) -> None:
    if not BLOG_HTML.exists():
        print(f"WARN: {BLOG_HTML} not found — skipping blog index update")
        return

    cards = "".join(build_card(a) for a in sorted(articles, key=lambda x: x.get("published_at", ""), reverse=True))
    blog_content = BLOG_HTML.read_text(encoding="utf-8")

    if INJECT_MARKER not in blog_content:
        print(f"WARN: '{INJECT_MARKER}' not found in blog.html — skipping injection")
        return

    # Replace everything between the opening marker and the closing empty-state div
    # Strategy: replace just the marker with marker + cards; empty-state stays for fallback
    updated = blog_content.replace(INJECT_MARKER, INJECT_MARKER + cards, 1)

    if dry_run:
        print(f"[dry-run] Would update {BLOG_HTML} with {len(articles)} article cards")
        return

    BLOG_HTML.write_text(updated, encoding="utf-8")
    print(f"  Updated {BLOG_HTML.name} with {len(articles)} article cards")


def append_to_sitemap(articles: list[dict], dry_run: bool) -> None:
    if not SITEMAP_XML.exists():
        return

    content = SITEMAP_XML.read_text(encoding="utf-8")
    today = datetime.now().strftime("%Y-%m-%d")

    new_entries = ""
    for a in articles:
        slug = a.get("slug", "")
        date = a.get("published_at", today)
        url  = f"https://thekpihub.com/articles/{slug}.html"
        if url in content:
            continue
        new_entries += f"""
  <url>
    <loc>{url}</loc>
    <lastmod>{date}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.70</priority>
  </url>"""

    if not new_entries:
        return

    updated = content.replace("</urlset>", new_entries + "\n\n</urlset>")

    if dry_run:
        print(f"[dry-run] Would add {len(articles)} URLs to sitemap.xml")
        return

    SITEMAP_XML.write_text(updated, encoding="utf-8")
    print(f"  Added {len(articles)} URLs to sitemap.xml")


def publish(input_path: Path, dry_run: bool) -> None:
    if not input_path.exists():
        sys.exit(f"ERROR: Articles JSON not found at {input_path}\n"
                 f"Run the pipeline first or pass --input <path>")

    articles = json.loads(input_path.read_text(encoding="utf-8"))
    if not isinstance(articles, list):
        sys.exit("ERROR: JSON must be a list of article objects")

    if not articles:
        print("No articles found in input file — nothing to publish")
        return

    template = load_template()
    ARTICLES_DIR.mkdir(exist_ok=True)

    published = 0
    for article in articles:
        slug = article.get("slug", "").strip()
        if not slug:
            print(f"  SKIP: article missing slug — {article.get('title', '?')}")
            continue

        output_path = ARTICLES_DIR / f"{slug}.html"
        html = render_article(template, article)

        if dry_run:
            print(f"  [dry-run] Would write {output_path.name}")
        else:
            output_path.write_text(html, encoding="utf-8")
            print(f"  Published: articles/{slug}.html")
        published += 1

    update_blog_index(articles, dry_run)
    append_to_sitemap(articles, dry_run)

    label = "[dry-run] " if dry_run else ""
    print(f"\n{label}{published} article(s) processed from {input_path}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Publish KPI Hub pipeline articles to static HTML")
    parser.add_argument("--input",   default="output/articles.json",
                        help="Path to articles JSON (default: output/articles.json)")
    parser.add_argument("--dry-run", action="store_true",
                        help="Preview without writing files")
    args = parser.parse_args()

    print(f"KPI Hub Article Publisher — {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    print(f"Input:   {args.input}")
    print(f"Dry run: {args.dry_run}\n")

    publish(Path(args.input), args.dry_run)


if __name__ == "__main__":
    main()

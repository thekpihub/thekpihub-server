# Static article generator — archived 2026-09-04

## What this was

Before the pipeline published straight into WordPress's database, the intended design
was: `pipeline.py` writes article JSON → `publish_articles.py` renders each article
into a static `/articles/<slug>.html` page using `article-template.html`, then injects
a card for it into `blog.html` between `<!-- ARTICLES_INJECT_HERE -->` markers and adds
an entry to `sitemap.xml`.

## Why it was never wired up

It never ran in production. Nothing in `.github/workflows/` calls `publish_articles.py`
— not `daily-pipeline.yml`, not `premium-pipeline.yml`, not any other job. By the time
those workflows shipped, `pipeline.py`'s `publish_to_wordpress()` was writing directly
into `wp_posts`/`wp_postmeta`/`wp_term_relationships` instead, and that became the only
path that ever actually ran. The `articles/` directory has stayed empty (just
`.gitkeep`) since. This script and its template are hand-built, working code for a
design that got superseded before its first real run — not abandoned mid-build.

## Why archive instead of delete

Nothing currently depends on these two files, so deleting them would have been just as
safe — but they're real, finished code for a legitimate alternative approach (static
pre-rendered article pages generally index and load faster than a page whose content
loads from elsewhere), not scratch work. Keeping them out of `tools/` and out of the
way, but intact and explained, costs nothing and preserves the option to revive the
static-publishing approach deliberately later instead of reconstructing it from git
history if it turns out to be wanted.

## Why deletion was the suggested default, not archiving

The recommendation was to delete rather than archive because an unused half-of-a-design
sitting in the repo tends to look like it's still the plan — the next person (or
session) to touch `blog.html` or the pipeline has to independently discover it's dormant
before they can trust that WordPress is really the only publishing path, the same way
this session initially mis-assessed `article-template.html` as "dead code" before
finding `publish_articles.py` referencing it. Archiving here, with this explanation
attached, is meant to close that gap: it's now unambiguous that this is intentionally
inactive, not a partially-wired feature waiting to be finished.

## If reviving this

`publish_articles.py`'s paths were fixed up for this new location (see its docstring),
but that alone isn't enough to make it work again:

- `blog.html` is now a redirect to `blog.thekpihub.com` (2026-09-04) — it has no
  `ARTICLES_INJECT_HERE` markers left to inject into.
- `sitemap.xml`'s `<!-- Blog / Intelligence Feed -->` anchor comment this script looks
  for was changed in the same commit that redirected `blog.html`.
- `pipeline.py` no longer writes an articles-JSON file for this script to read as input
  — it calls `publish_to_wordpress()` directly per article, in-process.

Reviving the static-publishing design would mean deciding it should run *alongside*
WordPress publishing (both a static page and a WP post per article) or *instead of* it
— not just restoring these two files.

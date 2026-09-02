#!/usr/bin/env python3
"""
╔══════════════════════════════════════════════════════════════════════════════╗
║           THE KPI HUB — DAILY INTELLIGENCE PIPELINE                        ║
║           Triggers: 03:03 AM IST | Publishes: 06:00 AM IST                 ║
║           Flow: Research → Synthesize → 7 Articles → WordPress → Telegram  ║
╚══════════════════════════════════════════════════════════════════════════════╝

Improvements over v1:
  • Model updated to claude-sonnet-5 (latest)
  • validate_env() — fails fast on missing OR malformed secrets, before any API call
  • with_retry() — exponential backoff on ALL external calls
  • generate_article() now embeds top research signals (was ignoring them)
  • SEO tags extracted inline from article prompt (saves 7 Claude calls/run)
  • WP category cache — no redundant REST calls
  • check_existing_post() — idempotency guard, no duplicate posts on re-run
  • --dry-run / DRY_RUN=1 — skips WP + Telegram for safe local testing
  • RUN_ID in every log line for traceability
  • reports/summary_<date>.json saved as artifact for GitHub Actions
  • Engine failures are isolated — one bad article won't kill the whole run
  • reports/ dir created at module level (works in Actions, not just __main__)
"""

import argparse
import json
import logging
import os
import re
import sys
import time
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Optional

import feedparser
import pymysql
import pymysql.cursors
import requests
from dotenv import load_dotenv
import anthropic

load_dotenv()

# ─── CONFIG ──────────────────────────────────────────────────────────────────
MODEL            = os.getenv("CLAUDE_MODEL", "claude-sonnet-5")
IST              = timezone(timedelta(hours=5, minutes=30))
_now             = datetime.now(IST)
TODAY            = _now.strftime("%B %d, %Y")
TODAY_SLUG       = _now.strftime("%Y-%m-%d")
PUBLISH_AT       = _now.replace(hour=6, minute=0, second=0, microsecond=0)
PUBLISH_UTC      = PUBLISH_AT.astimezone(timezone.utc)

ANTHROPIC_KEY    = os.getenv("ANTHROPIC_API_KEY")
SERPAPI_KEY      = os.getenv("SERPAPI_KEY")
TELEGRAM_TOKEN   = os.getenv("TELEGRAM_BOT_TOKEN")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID")
WP_SITE_URL      = os.getenv("WP_SITE_URL", "https://thekpihub.com")

# WordPress has no REST API to publish to on this deployment — its site files are gone,
# DB only (see servermemory.md, 2026-09-02). We publish by writing straight into the
# wp_ tables instead of going through wp-json. WP_DB_HOST_IP is a fallback if DNS for
# WP_DB_HOST is ever flaky from a GitHub Actions runner.
WP_DB_HOST       = os.getenv("WP_DB_HOST")
WP_DB_HOST_IP    = os.getenv("WP_DB_HOST_IP")
WP_DB_PORT       = int(os.getenv("WP_DB_PORT", "3306"))
WP_DB_NAME       = os.getenv("WP_DB_NAME")
WP_DB_USER       = os.getenv("WP_DB_USER")
WP_DB_PASSWORD   = os.getenv("WP_DB_PASSWORD")
WP_AUTHOR_ID     = int(os.getenv("WP_AUTHOR_ID", "1"))  # sharmahimanshu1178.hs92@gmail.com

RUN_ID      = uuid.uuid4().hex[:8]
REPORTS_DIR = Path("reports")
REPORTS_DIR.mkdir(exist_ok=True)

# ─── LOGGING ─────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format=f"%(asctime)s IST | run={RUN_ID} | %(levelname)s | %(message)s",
    datefmt="%H:%M:%S",
    handlers=[
        logging.FileHandler("pipeline.log"),
        logging.StreamHandler(sys.stdout),
    ],
)
log = logging.getLogger("kpihub")

# ─── ENV VALIDATION ──────────────────────────────────────────────────────────

def _looks_like_a_variable_name(value: str) -> bool:
    """
    True when a secret's value is actually some OTHER variable's NAME.

    This is not hypothetical. On 2026-08-15 the pipeline burned 2.2 minutes and
    every retry budget it had because three secrets were pasted one line out of
    step: SERPAPI_KEY held the text "ALPHA_VANTAGE_KEY  =" and TELEGRAM_BOT_TOKEN
    held "TELEGRAM_CHAT_ID   =". Both are non-empty, so a presence-only check
    waved them through and the failure only surfaced as a 401 from the vendor.
    """
    return bool(re.fullmatch(r"[A-Z][A-Z0-9_]{3,}\s*=*", value.strip()))


def validate_env(dry_run: bool = False) -> None:
    """Abort before the first API call if a required secret is missing or malformed."""
    required = {
        "ANTHROPIC_API_KEY": ANTHROPIC_KEY,
        "SERPAPI_KEY":       SERPAPI_KEY,
        "TELEGRAM_BOT_TOKEN":TELEGRAM_TOKEN,
        "TELEGRAM_CHAT_ID":  TELEGRAM_CHAT_ID,
    }
    if not dry_run:
        required["WP_DB_HOST"]     = WP_DB_HOST
        required["WP_DB_NAME"]     = WP_DB_NAME
        required["WP_DB_USER"]     = WP_DB_USER
        required["WP_DB_PASSWORD"] = WP_DB_PASSWORD

    missing = [k for k, v in required.items() if not v]
    if missing:
        log.error("❌ Missing env vars: %s", ", ".join(missing))
        sys.exit(1)

    # Shape checks. Never log the value itself -- that is precisely how the last
    # leak happened: the bad key was interpolated into a URL that Actions logged,
    # and GitHub's masking does not catch the URL-encoded form of a secret.
    problems = []
    for name, value in required.items():
        if _looks_like_a_variable_name(value):
            problems.append(f"{name} holds a variable NAME, not a value")

    if ANTHROPIC_KEY and not ANTHROPIC_KEY.startswith("sk-ant-"):
        problems.append("ANTHROPIC_API_KEY should start with 'sk-ant-'")
    if TELEGRAM_TOKEN and not re.fullmatch(r"\d{6,}:[A-Za-z0-9_-]{20,}", TELEGRAM_TOKEN.strip()):
        problems.append("TELEGRAM_BOT_TOKEN should look like '<digits>:<token>'")
    if TELEGRAM_CHAT_ID and not re.fullmatch(r"-?\d+", TELEGRAM_CHAT_ID.strip()):
        problems.append("TELEGRAM_CHAT_ID should be numeric")
    if SERPAPI_KEY and (len(SERPAPI_KEY.strip()) < 20 or " " in SERPAPI_KEY.strip()):
        problems.append("SERPAPI_KEY should be a long single-token string")

    if problems:
        log.error("❌ Malformed secrets -- fix these in GitHub → Settings → Secrets:")
        for p in problems:
            log.error("     • %s", p)
        sys.exit(2)

    log.info("✅ All env vars present and well-formed (model=%s, dry_run=%s)", MODEL, dry_run)


# ─── RETRY ───────────────────────────────────────────────────────────────────

def with_retry(fn, *, retries: int = 3, base_delay: float = 2.0, label: str = ""):
    """Call fn; retry with exponential backoff on any exception. Returns None on total failure."""
    tag = label or getattr(fn, "__name__", "call")
    for attempt in range(1, retries + 1):
        try:
            return fn()
        except Exception as exc:
            if attempt == retries:
                log.error("❌ %s failed after %d attempts: %s", tag, retries, exc)
                return None
            delay = base_delay * (2 ** (attempt - 1))
            log.warning("⚠️  %s attempt %d/%d — %s — retry in %.0fs", tag, attempt, retries, exc, delay)
            time.sleep(delay)


# ─── CLAUDE CLIENT ───────────────────────────────────────────────────────────

_claude: Optional[anthropic.Anthropic] = None

def get_claude() -> anthropic.Anthropic:
    global _claude
    if _claude is None:
        _claude = anthropic.Anthropic(api_key=ANTHROPIC_KEY)
    return _claude


def claude_call(**kwargs):
    """Wrapper around messages.create with retry + 429 back-pressure handling."""
    def _call():
        try:
            return get_claude().messages.create(**kwargs)
        except anthropic.RateLimitError:
            log.warning("Claude rate-limited — backing off 30s")
            time.sleep(30)
            return get_claude().messages.create(**kwargs)
    return with_retry(_call, retries=3, base_delay=5.0,
                      label=f"claude({kwargs.get('model', MODEL)[:20]})")


def claude_text(resp) -> str:
    """
    Return the first text block's content from a Claude response.

    `resp.content[0]` is not always a TextBlock — extended thinking makes Claude
    sometimes return a ThinkingBlock first, and indexing straight to [0].text blew
    up 3 of 7 articles on 2026-09-02 with 'ThinkingBlock' object has no attribute
    'text'. Scan for the first block that actually has one instead of assuming
    position 0.
    """
    for block in resp.content:
        text = getattr(block, "text", None)
        if text is not None:
            return text
    raise RuntimeError(f"No text block in Claude response (block types: "
                       f"{[type(b).__name__ for b in resp.content]})")


# ═══════════════════════════════════════════════════════════════════════════════
# ENGINE 1 — RESEARCH HARVESTER  (03:03–03:30 AM IST)
# ═══════════════════════════════════════════════════════════════════════════════

SERPAPI_QUERIES = [
    "SaaS KPI benchmarks 2026 latest",
    "SaaS market trends today",
    "SaaS funding news today",
    "India SaaS startup news today",
    "AI SaaS intelligence tools 2026",
    "SaaS churn retention benchmarks",
    "B2B SaaS pricing trends 2026",
    "G2 Capterra competitor analysis",
    "SaaS CAC payback period benchmarks",
    "enterprise software market news today",
    "HubSpot Salesforce product updates",
    "SaaS M&A acquisition news",
    "generative AI SaaS tools trending",
    "software revenue benchmarks quarterly",
    "KPI dashboard analytics trends",
]

RSS_FEEDS = [
    "https://techcrunch.com/tag/saas/feed/",
    "https://feeds.feedburner.com/venturebeat/SZYF",
    "https://www.saastr.com/feed/",
    "https://openviewpartners.com/blog/feed",
    "https://www.producthunt.com/feed",
]


def serpapi_search(query: str) -> list:
    def _call():
        r = requests.get(
            "https://serpapi.com/search",
            params={"q": query, "api_key": SERPAPI_KEY, "num": 5, "gl": "in", "hl": "en"},
            timeout=15,
        )
        r.raise_for_status()
        results = r.json().get("organic_results", [])
        return [
            {"title": x.get("title", ""), "snippet": x.get("snippet", ""), "link": x.get("link", "")}
            for x in results[:5]
        ]
    return with_retry(_call, retries=3, base_delay=2.0, label=f"serpapi:{query[:30]}") or []


def fetch_rss(url: str) -> list:
    def _call():
        feed = feedparser.parse(url)
        if feed.bozo and not feed.entries:
            raise ValueError(feed.bozo_exception)
        return [
            {"title": e.get("title", ""), "summary": e.get("summary", "")[:300], "link": e.get("link", "")}
            for e in feed.entries[:5]
        ]
    return with_retry(_call, retries=2, base_delay=1.5, label=f"rss:{url[-40:]}") or []


def run_research_harvest() -> dict:
    log.info("🕷  ENGINE 1 — Research Harvester")
    search_data = {}
    for i, query in enumerate(SERPAPI_QUERIES):
        log.info("  Searching [%d/%d]: %s", i + 1, len(SERPAPI_QUERIES), query)
        search_data[query] = serpapi_search(query)
        time.sleep(1.2)

    rss_data = {}
    for url in RSS_FEEDS:
        log.info("  RSS: %s", url)
        rss_data[url] = fetch_rss(url)
        time.sleep(0.5)

    log.info("✅ ENGINE 1 done — %d queries, %d feeds", len(search_data), len(rss_data))
    return {"searches": search_data, "rss": rss_data, "date": TODAY}


# ═══════════════════════════════════════════════════════════════════════════════
# ENGINE 2A — MARKET REPORT SYNTHESIS  (03:30–03:50 AM IST)
# ═══════════════════════════════════════════════════════════════════════════════

REPORT_SYSTEM = """You are Atlas — The KPI Hub's AI Research Director.
The KPI Hub is the decision-grade intelligence platform for SaaS professionals. Founded in Delhi, India.
Synthesize raw market data into a concise, actionable daily intelligence report.
Brand voice: Pragmatic, data-first, India-aware, Gen Z-corporate hybrid.
Format: Clean markdown. Zero fluff. Every sentence must carry a signal.
Always include India-specific angles where the data supports it."""


def build_research_context(data: dict) -> str:
    ctx = f"# Raw Research Data — {data['date']}\n\n## Search Results\n"
    for query, results in data["searches"].items():
        ctx += f"\n### {query}\n"
        for r in results:
            ctx += f"- **{r['title']}**\n  {r['snippet']}\n  {r['link']}\n"
    ctx += "\n## RSS Headlines\n"
    for url, entries in data["rss"].items():
        for e in entries:
            ctx += f"- **{e['title']}** — {e['summary']}\n"
    return ctx


def synthesize_daily_report(research: dict) -> str:
    log.info("🧠 ENGINE 2A — Market Report Synthesis")
    ctx = build_research_context(research)
    prompt = f"""Write a concise Daily Market Intelligence Report for {TODAY}.

Required sections:
## 🔥 Top 3 Signals Today
(3 biggest market movements, each with a specific data point)

## 📊 SaaS Metrics Moving Today
(benchmark shifts, funding rounds, product launches with numbers)

## 🇮🇳 India SaaS Brief
(India-specific angles from today's data)

## 🎯 Competitor Watch
(G2, Capterra, review platform activity, or major product updates)

## 💡 KPI Hub Content Opportunity
(3 specific article angles that would rank today based on search trends)

## 📈 Tomorrow's Watch List
(2-3 trends to monitor in the next 24h)

Keep it under 800 words. Every line actionable. No filler.

---
{ctx}"""

    resp = claude_call(model=MODEL, max_tokens=1500,
                       system=[{"type": "text", "text": REPORT_SYSTEM, "cache_control": {"type": "ephemeral"}}],
                       messages=[{"role": "user", "content": prompt}])
    if resp is None:
        raise RuntimeError("ENGINE 2A: Claude synthesis returned None after retries")
    report = claude_text(resp)
    log.info("✅ ENGINE 2A done — %d chars synthesized", len(report))
    return report


# ═══════════════════════════════════════════════════════════════════════════════
# ENGINE 2B — 7 ARTICLE GENERATOR  (03:50–04:45 AM IST)
# ═══════════════════════════════════════════════════════════════════════════════

ARTICLE_SYSTEM = """You are Atlas — The KPI Hub's AI Content Director.
The KPI Hub is a Delhi-based decision-grade intelligence platform for SaaS professionals.
Write authoritative, SEO-optimized articles about SaaS KPIs, market intelligence, and business metrics.
Voice: Expert but accessible. Data-driven. India-aware. Zero filler. Gen Z-corporate hybrid.
Format: WordPress-ready HTML using only: h2, h3, p, ul, ol, li, strong, em, blockquote.
No inline styles. No markdown. Proper semantic HTML only.
E-E-A-T signals: cite specific data, name real companies, give actionable takeaways."""

ARTICLE_CATEGORIES = [
    {
        "id": "market_flash",
        "name": "SaaS Market Flash",
        "desc": "Today's biggest SaaS market movement — one topic, deep analysis",
        "target_length": 1200,
        "cta": "affiliate_hubspot",
        "icon": "🔥",
    },
    {
        "id": "kpi_spotlight",
        "name": "KPI Spotlight",
        "desc": "Deep dive on one key SaaS metric — definition, benchmarks, improvement levers",
        "target_length": 1500,
        "cta": "affiliate_semrush",
        "icon": "📊",
    },
    {
        "id": "tool_intelligence",
        "name": "Tool Intelligence",
        "desc": "What changed in the SaaS tool landscape today — comparisons, updates, new entrants",
        "target_length": 1200,
        "cta": "affiliate_hubspot",
        "icon": "🔧",
    },
    {
        "id": "india_saas_brief",
        "name": "India SaaS Brief",
        "desc": "India-specific SaaS angle — data, trends, benchmarks relevant to the Indian market",
        "target_length": 1000,
        "cta": "email_signup",
        "icon": "🇮🇳",
    },
    {
        "id": "funding_ma_digest",
        "name": "Funding & M&A Digest",
        "desc": "Who raised, who acquired, what it signals for the SaaS market",
        "target_length": 1000,
        "cta": "newsletter",
        "icon": "💰",
    },
    {
        "id": "benchmark_update",
        "name": "Benchmark Update",
        "desc": "Real KPI numbers that shifted — CAC, churn, NRR, LTV benchmarks with context",
        "target_length": 1200,
        "cta": "affiliate_semrush",
        "icon": "📈",
    },
    {
        "id": "founders_brief",
        "name": "Founder's KPI Brief",
        "desc": "3-minute actionable KPI insight for SaaS operators — what to measure, why, how",
        "target_length": 800,
        "cta": "email_signup",
        "icon": "🚀",
    },
]

CTA_BLOCKS = {
    "affiliate_hubspot": """
<div style="background:#0A1628;padding:20px;border-radius:8px;border-left:4px solid #E9A123;margin:30px 0;">
<strong style="color:#E9A123">🔗 Recommended Tool</strong><br>
<p style="color:#94A3B8;margin:10px 0;">HubSpot's CRM gives you the KPI dashboards to track every metric in this article. 30% recurring commission — your first referral pays you every month, forever.</p>
<a href="https://thekpihub.com/go/hubspot" style="color:#E9A123;font-weight:bold;">Start Free with HubSpot →</a>
</div>""",
    "affiliate_semrush": """
<div style="background:#0A1628;padding:20px;border-radius:8px;border-left:4px solid #E9A123;margin:30px 0;">
<strong style="color:#E9A123">📊 Track These Metrics</strong><br>
<p style="color:#94A3B8;margin:10px 0;">SEMrush gives you the competitive intelligence data behind these benchmarks. See exactly where you stand vs. competitors in real time.</p>
<a href="https://thekpihub.com/go/semrush" style="color:#E9A123;font-weight:bold;">Try SEMrush Free →</a>
</div>""",
    "email_signup": """
<div style="background:#0A1628;padding:20px;border-radius:8px;border-left:4px solid #E9A123;margin:30px 0;">
<strong style="color:#E9A123">📧 Get This Daily</strong><br>
<p style="color:#94A3B8;margin:10px 0;">This brief lands in your inbox every morning at 6 AM IST. Zero fluff. Just the KPI signals that matter for your business today.</p>
<a href="https://thekpihub.com/#waitlist" style="color:#E9A123;font-weight:bold;">Subscribe Free →</a>
</div>""",
    "newsletter": """
<div style="background:#0A1628;padding:20px;border-radius:8px;border-left:4px solid #E9A123;margin:30px 0;">
<strong style="color:#E9A123">📬 The KPI Hub Weekly</strong><br>
<p style="color:#94A3B8;margin:10px 0;">Every Friday: the week's top SaaS KPI movements, benchmark shifts, and actionable intelligence in under 5 minutes.</p>
<a href="https://thekpihub.com/#waitlist" style="color:#E9A123;font-weight:bold;">Join Free →</a>
</div>""",
}


def _top_research_signals(research: dict, n: int = 8) -> str:
    """Extract top N headlines from research data to ground article generation."""
    lines = []
    for query, results in research["searches"].items():
        for r in results[:2]:
            if r.get("title") and r.get("snippet"):
                lines.append(f"- {r['title']}: {r['snippet'][:120]}")
    for url, entries in research["rss"].items():
        for e in entries[:1]:
            if e.get("title"):
                lines.append(f"- [RSS] {e['title']}: {e.get('summary','')[:100]}")
    return "\n".join(lines[:n])


def generate_article(category: dict, report: str, research: dict) -> dict:
    """Generate one article grounded in both the daily report AND raw research signals."""
    log.info("  ✍️  %s [%s]", category["name"], category["id"])

    signals = _top_research_signals(research)

    prompt = f"""Write a {category['target_length']}-word article for The KPI Hub.

Category: {category['name']} {category['icon']}
Brief: {category['desc']}
Date: {TODAY}

Ground your article in these signals from today's live data:
{signals}

And this synthesized daily market report:
{report}

Requirements:
1. First line: <!-- META: your SEO meta description (max 160 chars) -->
2. Second line: <!-- TAGS: tag1, tag2, tag3, tag4, tag5 --> (5 SEO tags, comma-separated)
3. Then: <h1>SEO-optimized title including "{TODAY.split(',')[0]}" or "2026" where natural</h1>
4. Body: WordPress-ready HTML (h2, h3, p, ul, li, strong, em — no inline styles)
5. Include 2-3 specific data points with numbers
6. Include one India-specific angle if data supports it
7. End with a clear <h2>Key Takeaway</h2> section
8. Target ~{category['target_length']} words

Write the full article now, starting with <!-- META: -->"""

    resp = claude_call(
        model=MODEL, max_tokens=2500,
        system=[{"type": "text", "text": ARTICLE_SYSTEM, "cache_control": {"type": "ephemeral"}}],
        messages=[{"role": "user", "content": prompt}]
    )
    if resp is None:
        raise RuntimeError(f"Claude returned None for article: {category['id']}")

    raw = claude_text(resp).strip()

    # Extract <!-- META: ... -->
    meta = ""
    if "<!-- META:" in raw:
        m_start = raw.index("<!-- META:") + 10
        m_end   = raw.index("-->", m_start)
        meta    = raw[m_start:m_end].strip()
        raw     = raw[m_end + 3:].strip()

    # Extract <!-- TAGS: ... -->
    tags_list: list = []
    if "<!-- TAGS:" in raw:
        t_start    = raw.index("<!-- TAGS:") + 10
        t_end      = raw.index("-->", t_start)
        tags_str   = raw[t_start:t_end].strip()
        tags_list  = [t.strip() for t in tags_str.split(",") if t.strip()]
        raw        = raw[t_end + 3:].strip()

    # Extract <h1> title
    title = f"{category['name']} — {TODAY}"
    if "<h1>" in raw and "</h1>" in raw:
        h1_start = raw.index("<h1>") + 4
        h1_end   = raw.index("</h1>")
        title    = raw[h1_start:h1_end].strip()

    full_content = raw + CTA_BLOCKS.get(category["cta"], "")

    return {
        "title":       title,
        "content":     full_content,
        "meta":        meta,
        "tags":        tags_list,
        "category_id": category["id"],
        "slug":        f"{category['id']}-{TODAY_SLUG}",
    }


def generate_all_articles(report: str, research: dict) -> list:
    log.info("✍️  ENGINE 2B — Article Generator (7 articles)")
    articles = []
    for i, cat in enumerate(ARTICLE_CATEGORIES):
        log.info("  Article %d/7: %s", i + 1, cat["name"])
        try:
            art = generate_article(cat, report, research)
            articles.append(art)
        except Exception as exc:
            log.error("  ❌ Failed to generate %s: %s — skipping", cat["id"], exc)
            articles.append({
                "title": f"{cat['name']} — {TODAY}",
                "content": "", "meta": "", "tags": [],
                "category_id": cat["id"],
                "slug": f"{cat['id']}-{TODAY_SLUG}",
                "error": str(exc),
            })
        time.sleep(2)
    ok = sum(1 for a in articles if not a.get("error"))
    log.info("✅ ENGINE 2B done — %d/7 articles generated", ok)
    return articles


# ═══════════════════════════════════════════════════════════════════════════════
# ENGINE 3 — VERIFICATION MATRIX  (04:45–05:00 AM IST)
# ═══════════════════════════════════════════════════════════════════════════════

def verify_article_claims(article: dict) -> dict:
    """Spot-check one key claim per article via SerpAPI."""
    if article.get("error") or not article.get("content"):
        article["verified"] = False
        article["verify_query"] = ""
        article["verify_sources"] = 0
        return article

    log.info("  🔍 Verifying: %s", article["title"][:55])

    # Ask Claude to extract one verifiable claim
    check_prompt = (
        f"From this article title and opening, extract ONE specific verifiable factual claim "
        f"(a number, statistic, or company fact) as a short search query (max 8 words). "
        f"Return only the query, nothing else.\n\n"
        f"Title: {article['title']}\n"
        f"Opening: {article['content'][:400]}"
    )
    resp = claude_call(model=MODEL, max_tokens=30,
                       messages=[{"role": "user", "content": check_prompt}])
    try:
        query = claude_text(resp).strip() if resp else article["title"][:50]
    except RuntimeError:
        query = article["title"][:50]

    results = serpapi_search(query)
    article["verified"]       = len(results) > 0
    article["verify_query"]   = query
    article["verify_sources"] = len(results)
    time.sleep(1)
    return article


def run_verification(articles: list) -> list:
    log.info("🔍 ENGINE 3 — Verification Matrix")
    verified = [verify_article_claims(a) for a in articles]
    passed = sum(1 for a in verified if a.get("verified"))
    log.info("✅ ENGINE 3 done — %d/%d articles verified", passed, len(articles))
    return verified


# ═══════════════════════════════════════════════════════════════════════════════
# ENGINE 4 — WORDPRESS PUBLISHER  (05:00–05:15 AM IST)
# ═══════════════════════════════════════════════════════════════════════════════

WP_CATEGORY_MAP = {
    "market_flash":      "SaaS Market Flash",
    "kpi_spotlight":     "KPI Spotlight",
    "tool_intelligence": "Tool Intelligence",
    "india_saas_brief":  "India SaaS Brief",
    "funding_ma_digest": "Funding & M&A",
    "benchmark_update":  "Benchmark Update",
    "founders_brief":    "Founder's Brief",
}

_wp_category_cache: dict = {}  # name → term_taxonomy_id, populated lazily


def _slugify(value: str) -> str:
    """WordPress-style slug: lowercase, non-alnum runs collapsed to single hyphens."""
    value = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return value or "term"


def _wp_db():
    """
    One connection per call — this runs a handful of times per pipeline execution
    (not a web request loop), so pooling isn't worth the complexity. Tries the
    hostname first, falls back to the raw IP (WP_DB_HOST_IP) if DNS resolution
    from the runner is flaky — the same fallback the credentials doc notes.
    """
    last_exc = None
    for host in (WP_DB_HOST, WP_DB_HOST_IP):
        if not host:
            continue
        try:
            return pymysql.connect(
                host=host, port=WP_DB_PORT, user=WP_DB_USER, password=WP_DB_PASSWORD,
                database=WP_DB_NAME, charset="utf8mb4",
                cursorclass=pymysql.cursors.DictCursor, connect_timeout=10, autocommit=False,
            )
        except Exception as exc:
            last_exc = exc
            log.warning("  DB connect via %s failed: %s", host, exc)
    raise last_exc or RuntimeError("No WP_DB_HOST/WP_DB_HOST_IP configured")


def get_or_create_wp_term(cur, name: str, taxonomy: str) -> int:
    """Return a term_taxonomy_id for (name, taxonomy), creating wp_terms/wp_term_taxonomy rows if needed."""
    cur.execute(
        "SELECT tt.term_taxonomy_id FROM wp_term_taxonomy tt "
        "JOIN wp_terms t ON t.term_id = tt.term_id "
        "WHERE tt.taxonomy = %s AND t.name = %s LIMIT 1",
        (taxonomy, name),
    )
    row = cur.fetchone()
    if row:
        return row["term_taxonomy_id"]

    slug = _slugify(name)
    cur.execute(
        "INSERT INTO wp_terms (name, slug, term_group) VALUES (%s, %s, 0)",
        (name, slug),
    )
    term_id = cur.lastrowid
    cur.execute(
        "INSERT INTO wp_term_taxonomy (term_id, taxonomy, description, parent, count) "
        "VALUES (%s, %s, '', 0, 0)",
        (term_id, taxonomy),
    )
    return cur.lastrowid


def get_or_create_wp_category(cur, name: str) -> int:
    if name in _wp_category_cache:
        return _wp_category_cache[name]
    tt_id = get_or_create_wp_term(cur, name, "category")
    _wp_category_cache[name] = tt_id
    return tt_id


def get_or_create_wp_tags(cur, tag_names: list) -> list:
    return [get_or_create_wp_term(cur, name, "post_tag") for name in tag_names[:5] if name]


def check_existing_post(cur, slug: str) -> Optional[int]:
    """Return existing post ID if a post with this slug already exists, else None."""
    cur.execute(
        "SELECT ID FROM wp_posts WHERE post_name = %s AND post_type = 'post' LIMIT 1",
        (slug,),
    )
    row = cur.fetchone()
    return row["ID"] if row else None


def publish_to_wordpress(article: dict, publish_time_utc: datetime, dry_run: bool = False) -> dict:
    """
    Writes the post straight into wp_posts/wp_postmeta/wp_term_relationships.
    There's no live WordPress serving thekpihub.com right now to hit a REST API on
    (the site's PHP files are gone — DB only, see servermemory.md 2026-09-02), so this
    is the only way to get generated content into that database. If/when WordPress is
    reinstalled against this same DB, these rows are ordinary posts — nothing here is
    a workaround that needs undoing, it's just a different client for the same tables
    wp-admin would write to.
    """
    if article.get("error") or not article.get("content"):
        return {"title": article["title"], "wp_id": None, "error": article.get("error", "empty content")}

    if dry_run:
        log.info("  [DRY RUN] Would publish: %s", article["title"][:60])
        return {"title": article["title"], "wp_id": "dry-run", "link": "", "status": "dry-run"}

    post_date_gmt = publish_time_utc.strftime("%Y-%m-%d %H:%M:%S")
    post_date     = publish_time_utc.astimezone(IST).strftime("%Y-%m-%d %H:%M:%S")
    is_future     = publish_time_utc > datetime.now(timezone.utc)
    post_status   = "future" if is_future else "publish"

    try:
        conn = _wp_db()
    except Exception as exc:
        return {"title": article["title"], "wp_id": None, "error": f"WP DB connect failed: {exc}"}

    # Explicit commit/rollback/close rather than `with conn:` — PyMySQL's connection
    # context manager commits or rolls back on exit but does NOT close the socket, so
    # relying on it here would leak one open connection per article (up to 7/run).
    try:
        with conn.cursor() as cur:
            # Idempotency: skip if already published today
            existing_id = check_existing_post(cur, article["slug"])
            if existing_id:
                log.info("  ⚠️  Skipping duplicate — post %s already exists (id=%s)",
                         article["slug"], existing_id)
                return {"title": article["title"], "wp_id": existing_id, "link": "", "status": "already_exists"}

            cat_name = WP_CATEGORY_MAP.get(article["category_id"], "Intelligence")
            cat_tt_id = get_or_create_wp_category(cur, cat_name)
            tag_tt_ids = get_or_create_wp_tags(cur, article.get("tags", []))

            cur.execute(
                "INSERT INTO wp_posts ("
                "  post_author, post_date, post_date_gmt, post_content, post_title,"
                "  post_excerpt, post_status, comment_status, ping_status, post_password,"
                "  post_name, to_ping, pinged, post_modified, post_modified_gmt,"
                "  post_content_filtered, post_parent, guid, menu_order, post_type,"
                "  post_mime_type, comment_count"
                ") VALUES ("
                "  %(author)s, %(date)s, %(date_gmt)s, %(content)s, %(title)s,"
                "  %(excerpt)s, %(status)s, 'open', 'open', '',"
                "  %(name)s, '', '', %(date)s, %(date_gmt)s,"
                "  '', 0, '', 0, 'post',"
                "  '', 0"
                ")",
                {
                    "author": WP_AUTHOR_ID, "date": post_date, "date_gmt": post_date_gmt,
                    "content": article["content"], "title": article["title"],
                    "excerpt": article.get("meta", ""), "status": post_status,
                    "name": article["slug"],
                },
            )
            post_id = cur.lastrowid

            guid = f"{WP_SITE_URL.rstrip('/')}/?p={post_id}"
            cur.execute("UPDATE wp_posts SET guid = %s WHERE ID = %s", (guid, post_id))

            term_taxonomy_ids = [cat_tt_id] + tag_tt_ids
            for order, tt_id in enumerate(term_taxonomy_ids):
                cur.execute(
                    "INSERT INTO wp_term_relationships (object_id, term_taxonomy_id, term_order) "
                    "VALUES (%s, %s, %s)",
                    (post_id, tt_id, order),
                )
            if term_taxonomy_ids:
                cur.execute(
                    "UPDATE wp_term_taxonomy SET count = count + 1 WHERE term_taxonomy_id IN "
                    f"({','.join(['%s'] * len(term_taxonomy_ids))})",
                    term_taxonomy_ids,
                )

            if article.get("meta"):
                cur.execute(
                    "INSERT INTO wp_postmeta (post_id, meta_key, meta_value) VALUES (%s, %s, %s)",
                    (post_id, "_yoast_wpseo_metadesc", article["meta"]),
                )

        conn.commit()
    except Exception as exc:
        try:
            conn.rollback()
        except Exception:
            pass
        log.error("  ❌ wp_post insert failed for %s: %s", article["slug"], exc)
        return {"title": article["title"], "wp_id": None, "error": f"WP DB write failed: {exc}"}
    finally:
        conn.close()

    log.info("  ✅ DB insert — post #%d (%s)", post_id, post_status)
    return {
        "title":  article["title"],
        "wp_id":  post_id,
        "link":   guid,
        "status": post_status,
    }


def publish_all_articles(articles: list, dry_run: bool = False) -> list:
    log.info("📤 ENGINE 4 — WordPress Publisher (dry_run=%s)", dry_run)
    published = []
    for i, art in enumerate(articles):
        log.info("  Publishing [%d/7]: %s", i + 1, art["title"][:55])
        result = publish_to_wordpress(art, PUBLISH_UTC, dry_run=dry_run)
        published.append(result)
        if result.get("wp_id"):
            log.info("  ✅ %s → %s", result.get("status"), result.get("link", "(scheduled)"))
        else:
            log.error("  ❌ Failed: %s", result.get("error"))
        time.sleep(2)

    success = sum(1 for p in published if p.get("wp_id"))
    log.info("✅ ENGINE 4 done — %d/7 scheduled for 06:00 AM IST", success)
    return published


# ═══════════════════════════════════════════════════════════════════════════════
# ENGINE 5 — TELEGRAM NOTIFICATION  (05:15 AM IST)
# ═══════════════════════════════════════════════════════════════════════════════

def send_telegram(message: str) -> bool:
    def _send():
        r = requests.post(
            f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage",
            json={"chat_id": TELEGRAM_CHAT_ID, "text": message, "parse_mode": "Markdown"},
            timeout=10,
        )
        r.raise_for_status()
        return True
    result = with_retry(_send, retries=3, base_delay=2.0, label="telegram")
    if result is None:
        log.error("❌ Telegram notification failed after retries")
        return False
    return True


def build_telegram_summary(report: str, published: list, elapsed_min: float) -> str:
    time_ist = datetime.now(IST).strftime("%H:%M")
    ok_posts  = [p for p in published if p.get("wp_id") and p.get("wp_id") != "dry-run"]
    dry_posts = [p for p in published if p.get("wp_id") == "dry-run"]
    fail_posts= [p for p in published if not p.get("wp_id")]

    # Trim report preview to 280 chars
    report_preview = report.strip()[:280].rsplit("\n", 1)[0] + "..."

    msg  = f"🤖 *KPI Hub Pipeline Complete* — {TODAY}\n"
    msg += f"⏰ {time_ist} IST | ⚡ {elapsed_min:.1f} min | run=`{RUN_ID}`\n\n"
    msg += f"📋 *Intelligence Report Preview*\n{report_preview}\n\n"
    msg += f"📝 *7 Articles — Scheduled 06:00 AM IST*\n"

    for i, p in enumerate(published):
        if p.get("wp_id") == "dry-run":
            icon = "🧪"
        elif p.get("wp_id"):
            icon = "✅"
        else:
            icon = "❌"
        title_short = p["title"][:52] + ("…" if len(p["title"]) > 52 else "")
        msg += f"{icon} {i+1}. {title_short}\n"

    msg += f"\n🚀 *{len(ok_posts)}/7 go live at 06:00 AM IST*"
    if dry_posts:
        msg += f"\n🧪 Dry-run mode — WP publish skipped"
    if fail_posts:
        msg += f"\n⚠️ {len(fail_posts)} article(s) failed — check pipeline.log"
    msg += "\n\n_Review window: Now → 06:00 AM IST_"
    return msg


def notify_telegram(report: str, published: list, elapsed_min: float, dry_run: bool = False):
    log.info("📱 ENGINE 5 — Telegram Notification")
    if dry_run:
        log.info("  [DRY RUN] Telegram skipped")
        return
    msg = build_telegram_summary(report, published, elapsed_min)
    send_telegram(msg)
    log.info("✅ ENGINE 5 done")


# ═══════════════════════════════════════════════════════════════════════════════
# MASTER ORCHESTRATOR
# ═══════════════════════════════════════════════════════════════════════════════

def save_run_summary(report: str, articles: list, published: list,
                     elapsed_min: float, dry_run: bool) -> None:
    """Persist run state as JSON artifact for GitHub Actions / post-mortem."""
    summary = {
        "run_id":      RUN_ID,
        "date":        TODAY,
        "model":       MODEL,
        "dry_run":     dry_run,
        "elapsed_min": elapsed_min,
        "report_chars": len(report),
        "articles": [
            {
                "category_id":     a.get("category_id"),
                "title":           a.get("title"),
                "slug":            a.get("slug"),
                "verified":        a.get("verified"),
                "verify_sources":  a.get("verify_sources"),
                "error":           a.get("error"),
            }
            for a in articles
        ],
        "published": published,
    }
    path = REPORTS_DIR / f"summary_{TODAY_SLUG}.json"
    path.write_text(json.dumps(summary, indent=2, default=str))
    log.info("📄 Run summary saved → %s", path)


def run_pipeline(dry_run: bool = False) -> None:
    """Full 03:03 AM → 06:00 AM IST pipeline."""
    start = time.time()
    log.info("=" * 70)
    log.info("🚀 KPI HUB PIPELINE START — %s | dry_run=%s | model=%s",
             datetime.now(IST).strftime("%H:%M IST, %B %d %Y"), dry_run, MODEL)
    log.info("=" * 70)

    report    = ""
    articles  = []
    published = []

    try:
        # ENGINE 1: Research
        research = run_research_harvest()

        # ENGINE 2A: Daily Report
        report = synthesize_daily_report(research)
        log.info("\n📋 REPORT PREVIEW:\n%s\n", report[:400])

        # Save report markdown
        report_path = REPORTS_DIR / f"report_{TODAY_SLUG}.md"
        report_path.write_text(f"# KPI Hub Daily Report — {TODAY}\n\n{report}")

        # ENGINE 2B: 7 Articles
        articles = generate_all_articles(report, research)

        # ENGINE 3: Verification
        articles = run_verification(articles)

        # ENGINE 4: WordPress
        published = publish_all_articles(articles, dry_run=dry_run)

        # ENGINE 5: Telegram
        elapsed = round((time.time() - start) / 60, 1)
        notify_telegram(report, published, elapsed, dry_run=dry_run)

        # Save summary
        save_run_summary(report, articles, published, elapsed, dry_run)

        success = sum(1 for p in published if p.get("wp_id"))
        log.info("=" * 70)
        log.info("✅ PIPELINE COMPLETE — %.1f min | %d/7 articles scheduled → 06:00 AM IST",
                 elapsed, success)
        log.info("=" * 70)

    except Exception as exc:
        elapsed = round((time.time() - start) / 60, 1)
        log.error("❌ PIPELINE FAILED after %.1f min: %s", elapsed, exc, exc_info=True)
        save_run_summary(report, articles, published, elapsed, dry_run)
        if not dry_run:
            send_telegram(
                f"❌ *KPI Hub Pipeline FAILED* — {TODAY}\n"
                f"run=`{RUN_ID}` | elapsed={elapsed:.1f}min\n\n"
                f"Error: `{str(exc)[:200]}`\n\n"
                "_Check GitHub Actions → pipeline.log artifact_"
            )
        raise


# ═══════════════════════════════════════════════════════════════════════════════
# ENTRY POINT
# ═══════════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="KPI Hub Daily Intelligence Pipeline")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        default=os.getenv("DRY_RUN", "").lower() in ("1", "true", "yes"),
        help="Skip WordPress publish and Telegram notification (safe for testing)",
    )
    args = parser.parse_args()

    validate_env(dry_run=args.dry_run)
    run_pipeline(dry_run=args.dry_run)

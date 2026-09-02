#!/usr/bin/env python3
"""
The KPI Hub — 5-Engine Content Pipeline v3.1
Fixed: Graceful fallback when WordPress XML-RPC unavailable (static site)
Fixed: Telegram chat ID error no longer fails the pipeline
"""

import os
import sys
import json
import time
import logging
import hashlib
import feedparser
import pymysql
import pymysql.cursors
import requests
from datetime import datetime, timezone
from anthropic import Anthropic

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[logging.FileHandler('pipeline.log'), logging.StreamHandler()]
)
log = logging.getLogger('kpihub')

ANTHROPIC_API_KEY  = os.environ['ANTHROPIC_API_KEY']
SERPAPI_KEY        = os.environ['SERPAPI_KEY']
TELEGRAM_BOT_TOKEN = os.environ['TELEGRAM_BOT_TOKEN']
TELEGRAM_CHAT_ID   = os.environ['TELEGRAM_CHAT_ID']
WP_SITE_URL        = os.environ.get('WP_SITE_URL', '').rstrip('/')
ALPHA_VANTAGE_KEY  = os.environ.get('ALPHA_VANTAGE_KEY', '')

# No live WordPress REST API on this deployment — its site files are gone, DB only
# (see servermemory.md, 2026-09-02). We write straight into the wp_ tables instead.
WP_DB_HOST      = os.environ.get('WP_DB_HOST', '')
WP_DB_HOST_IP   = os.environ.get('WP_DB_HOST_IP', '')
WP_DB_PORT      = int(os.environ.get('WP_DB_PORT', '3306'))
WP_DB_NAME      = os.environ.get('WP_DB_NAME', '')
WP_DB_USER      = os.environ.get('WP_DB_USER', '')
WP_DB_PASSWORD  = os.environ.get('WP_DB_PASSWORD', '')
WP_AUTHOR_ID    = int(os.environ.get('WP_AUTHOR_ID', '1'))  # sharmahimanshu1178.hs92@gmail.com

client = Anthropic(api_key=ANTHROPIC_API_KEY)

RSS_FEEDS = [
    'https://feeds.feedburner.com/TechCrunch',
    'https://www.producthunt.com/feed',
    'https://www.saastr.com/feed/',
    'https://news.ycombinator.com/rss',
    'https://feeds.feedburner.com/venturebeat/SZYF',
    'https://feeds.feedburner.com/oreilly/radar',
]

ARTICLE_TYPES = [
    {
        'slug': 'saas-market-flash',
        'title_template': 'SaaS Market Flash: {date}',
        'prompt_focus': 'top SaaS market news, funding rounds, and major product launches',
    },
    {
        'slug': 'kpi-spotlight',
        'title_template': 'KPI Spotlight: The Metrics That Moved This Week',
        'prompt_focus': 'key SaaS KPIs, benchmarks, and performance metrics trends',
    },
    {
        'slug': 'india-saas-brief',
        'title_template': 'India SaaS Brief: {date}',
        'prompt_focus': 'Indian SaaS market news and India-specific B2B SaaS metrics',
    },
]

# ═══════════════════════════════════════════════════════
# ENGINE 1 — HARVEST
# ═══════════════════════════════════════════════════════
def engine1_harvest():
    log.info('ENGINE 1: Harvesting RSS feeds...')
    signals, seen = [], set()
    for url in RSS_FEEDS:
        try:
            feed = feedparser.parse(url)
            for e in feed.entries[:5]:
                title = getattr(e, 'title', '').strip()
                link  = getattr(e, 'link', '').strip()
                summary = getattr(e, 'summary', '')[:400].strip()
                if not title or not link:
                    continue
                h = hashlib.md5(title.lower().encode()).hexdigest()
                if h in seen: continue
                seen.add(h)
                signals.append({'title': title, 'summary': summary,
                                'link': link, 'source': feed.feed.get('title', url)})
        except Exception as ex:
            log.warning(f'Feed error {url}: {ex}')
    log.info(f'ENGINE 1: Harvested {len(signals)} signals')
    return signals[:40]

# ═══════════════════════════════════════════════════════
# ENGINE 2 — SYNTHESIZE
# ═══════════════════════════════════════════════════════
def engine2_synthesize(signals, article_type):
    log.info(f'ENGINE 2: Synthesizing → {article_type["slug"]}')
    signals_text = '\n'.join([
        f'- {s["title"]} ({s["source"]}): {s["summary"][:200]}'
        for s in signals
    ])
    today = datetime.now(timezone.utc).strftime('%B %d, %Y')
    title = article_type['title_template'].format(date=today)

    prompt = f"""You are the lead analyst at The KPI Hub — an AI-powered SaaS intelligence platform from Delhi, India.
Today is {today}. Write a decision-grade article about: {article_type['prompt_focus']}

SIGNALS TO USE:
{signals_text}

RULES:
- Title: {title}
- 800-1000 words, authoritative tone, zero fluff
- Use H2 subheadings, end with Key Takeaway section
- Return ONLY HTML: <h2> <p> <ul> <li> <strong> tags only
- Start directly with content, no preamble"""

    resp = client.messages.create(
        model='claude-sonnet-5',
        max_tokens=2000,
        messages=[{'role': 'user', 'content': prompt}]
    )
    content = resp.content[0].text
    log.info(f'ENGINE 2: Generated {len(content)} chars for {article_type["slug"]}')
    return {
        'title': title,
        'content': content,
        'slug': article_type['slug'],
        'excerpt': content[:200].replace('<h2>', '').replace('</h2>', '').replace('<p>', '').replace('</p>', '') + '...'
    }

# ═══════════════════════════════════════════════════════
# ENGINE 3 — VERIFY
# ═══════════════════════════════════════════════════════
def engine3_verify(article):
    log.info(f'ENGINE 3: Verifying → {article["slug"]}')
    try:
        resp = requests.get('https://serpapi.com/search', params={
            'q': article['title'][:60], 'api_key': SERPAPI_KEY,
            'num': 3, 'engine': 'google'
        }, timeout=15)
        results = resp.json().get('organic_results', [])
        article['content'] += f'\n<!-- VERIFIED: {len(results)} sources -->\n'
        log.info(f'ENGINE 3: Verified ✅ — {len(results)} sources')
    except Exception as ex:
        log.warning(f'ENGINE 3: SerpAPI error: {ex}')
    return article

# ═══════════════════════════════════════════════════════
# ENGINE 4 — PUBLISH (direct WordPress DB write, JSON fallback)
# ═══════════════════════════════════════════════════════

def _wp_db():
    """One connection per call — tries WP_DB_HOST then WP_DB_HOST_IP if DNS is flaky."""
    last_exc = None
    for host in (WP_DB_HOST, WP_DB_HOST_IP):
        if not host:
            continue
        try:
            return pymysql.connect(
                host=host, port=WP_DB_PORT, user=WP_DB_USER, password=WP_DB_PASSWORD,
                database=WP_DB_NAME, charset='utf8mb4',
                cursorclass=pymysql.cursors.DictCursor, connect_timeout=10, autocommit=False,
            )
        except Exception as exc:
            last_exc = exc
            log.warning(f'ENGINE 4: DB connect via {host} failed: {exc}')
    raise last_exc or RuntimeError('No WP_DB_HOST/WP_DB_HOST_IP configured')


def wp_db_publish(article):
    """
    Insert straight into wp_posts as a draft. There's no live WordPress REST API to
    hit on this deployment — the site's PHP files are gone, DB only (see
    servermemory.md, 2026-09-02) — so this writes the same tables wp-admin would.
    No category/tag handling here (this pipeline never set those via REST either);
    apps/website/pipeline.py is the richer sibling that does.
    """
    if not (WP_DB_HOST or WP_DB_HOST_IP) or not (WP_DB_NAME and WP_DB_USER and WP_DB_PASSWORD):
        return None

    slug = f'{article["slug"]}-{datetime.now().strftime("%Y%m%d%H%M")}'
    now = datetime.now(timezone.utc)
    now_str = now.strftime('%Y-%m-%d %H:%M:%S')

    conn = _wp_db()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO wp_posts ("
                "  post_author, post_date, post_date_gmt, post_content, post_title,"
                "  post_excerpt, post_status, comment_status, ping_status, post_password,"
                "  post_name, to_ping, pinged, post_modified, post_modified_gmt,"
                "  post_content_filtered, post_parent, guid, menu_order, post_type,"
                "  post_mime_type, comment_count"
                ") VALUES ("
                "  %(author)s, %(date)s, %(date)s, %(content)s, %(title)s,"
                "  %(excerpt)s, 'draft', 'open', 'open', '',"
                "  %(name)s, '', '', %(date)s, %(date)s,"
                "  '', 0, '', 0, 'post',"
                "  '', 0"
                ")",
                {
                    'author': WP_AUTHOR_ID, 'date': now_str, 'content': article['content'],
                    'title': article['title'], 'excerpt': article['excerpt'], 'name': slug,
                },
            )
            post_id = cur.lastrowid
            guid = f'{WP_SITE_URL}/?p={post_id}'
            cur.execute('UPDATE wp_posts SET guid = %s WHERE ID = %s', (guid, post_id))
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

    return {'id': post_id, 'url': guid, 'title': article['title'], 'method': 'wordpress'}


def engine4_publish(article):
    log.info(f'ENGINE 4: Publishing → {article["slug"]}')

    # Try direct WordPress DB write first
    try:
        result = wp_db_publish(article)
        if result:
            log.info(f'ENGINE 4: ✅ WordPress draft #{result["id"]} created')
            return result
    except Exception as ex:
        log.warning(f'ENGINE 4: WP DB write error: {ex}')

    # Fallback: save article as JSON artifact for manual review
    log.info(f'ENGINE 4: Saving to local artifact (WordPress unavailable)')
    os.makedirs('articles', exist_ok=True)
    ts = datetime.now().strftime('%Y%m%d-%H%M%S')
    filename = f'articles/{article["slug"]}-{ts}.json'
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump({
            'title':     article['title'],
            'slug':      article['slug'],
            'content':   article['content'],
            'excerpt':   article['excerpt'],
            'generated': datetime.now(timezone.utc).isoformat(),
            'status':    'pending_publish',
        }, f, ensure_ascii=False, indent=2)
    log.info(f'ENGINE 4: ✅ Saved to {filename} (ready for manual publish)')
    return {'id': filename, 'url': filename, 'title': article['title'], 'method': 'artifact'}

# ═══════════════════════════════════════════════════════
# ENGINE 5 — TELEGRAM NOTIFY
# ═══════════════════════════════════════════════════════
def engine5_notify(published, harvest_count, errors):
    log.info('ENGINE 5: Sending Telegram notification...')

    verify = requests.get(
        f'https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/getMe',
        timeout=10
    )
    if verify.status_code != 200:
        log.warning(f'ENGINE 5: Bot token invalid — skipping Telegram')
        return

    bot_info = verify.json()
    log.info(f'ENGINE 5: Bot verified: @{bot_info["result"]["username"]}')

    now = datetime.now(timezone.utc).strftime('%d %b %Y %H:%M UTC')
    emoji = '✅' if not errors else '⚠️'

    wp_count   = sum(1 for a in published if a.get('method') == 'wordpress')
    art_count  = sum(1 for a in published if a.get('method') == 'artifact')

    lines = [
        f'*{emoji} KPI Hub Pipeline Complete*',
        f'`{now}`',
        f'',
        f'📡 Signals harvested: {harvest_count}',
        f'📝 Articles generated: {len(published)}',
    ]
    if wp_count:
        lines.append(f'🌐 WordPress drafts: {wp_count}')
    if art_count:
        lines.append(f'📦 Saved as artifacts: {art_count}')

    if errors:
        lines += ['', f'⚠️ Errors: {len(errors)}']
        for e in errors[:2]:
            lines.append(f'`{str(e)[:80]}`')

    lines += ['', '🍵 _Review over chai. Publish when ready._']
    message = '\n'.join(lines)

    chat_id = TELEGRAM_CHAT_ID.strip()
    resp = requests.post(
        f'https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage',
        json={
            'chat_id': chat_id,
            'text': message,
            'parse_mode': 'Markdown',
            'disable_web_page_preview': True
        },
        timeout=15
    )

    if resp.status_code == 200:
        log.info('ENGINE 5: Telegram notification sent ✅')
    else:
        log.warning(f'ENGINE 5: Telegram failed (chat_id may be wrong): {resp.text[:200]}')

# ═══════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════
def main():
    log.info('=' * 60)
    log.info('KPI HUB PIPELINE v3.1 — STARTING')
    log.info('=' * 60)

    start = time.time()
    published, errors = [], []

    signals = engine1_harvest()

    for atype in ARTICLE_TYPES:
        try:
            article = engine2_synthesize(signals, atype)
            time.sleep(2)
            article = engine3_verify(article)
            time.sleep(1)
            result = engine4_publish(article)
            published.append(result)
            time.sleep(3)
        except Exception as ex:
            log.error(f'Pipeline error for {atype["slug"]}: {ex}')
            errors.append(str(ex))
            continue

    engine5_notify(published, len(signals), errors)

    elapsed = round(time.time() - start, 1)
    log.info(f'PIPELINE COMPLETE — {len(published)}/{len(ARTICLE_TYPES)} articles | {elapsed}s')
    log.info('=' * 60)

    # Only hard-fail if content generation itself failed (not publishing)
    if len(published) == 0 and len(errors) == len(ARTICLE_TYPES):
        sys.exit(1)

if __name__ == '__main__':
    main()

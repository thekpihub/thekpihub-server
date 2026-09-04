#!/usr/bin/env python3
"""
Publish overdue `future`-status WordPress posts directly via SQL.

Why this exists (root cause, found 2026-09-04 — see servermemory.md):
pipeline.py inserts scheduled posts straight into `wp_posts` via PyMySQL
(`post_status='future'`) because there's no live WordPress REST API on this
deployment to publish through. That raw INSERT bypasses WordPress's PHP-layer
`wp_insert_post()` / `wp_transition_post_status()`, which is what normally
registers the `publish_future_post` cron hook in `wp_options.cron` for a
scheduled post. So WordPress never learns these posts are scheduled at all —
pinging wp-cron.php (see wp-cron-fix.yml) finds nothing to do, and the posts
sit stuck in 'future' forever, however reliably wp-cron.php is ticked.

This script is the actual fix: instead of trying to replicate WordPress's
internal PHP-serialized cron format (fragile, and this pipeline already
bypasses WP's insert layer entirely, so there's no real benefit to also
mimicking its cron internals), it does the same kind of direct SQL write
pipeline.py already does — just for the "is it due yet?" check WordPress's
own cron would otherwise have made. Run on a schedule (see wp-cron-fix.yml),
it finds any 'future' post whose scheduled time has passed and flips it to
'publish', mirroring exactly what wp-cron's publish_future_post handler does
(status flip + refreshed post_modified/post_modified_gmt) without depending
on WordPress's cron machinery at all.

Deliberately minimal deps (just PyMySQL) — this doesn't need anthropic/
feedparser/etc. like pipeline.py, so it gets its own light `pip install`
step in CI instead of pipeline.py's full requirements.txt.
"""

import os
import sys
from datetime import datetime, timedelta, timezone

import pymysql
import pymysql.cursors

IST = timezone(timedelta(hours=5, minutes=30))

WP_DB_HOST     = os.getenv("WP_DB_HOST")
WP_DB_HOST_IP  = os.getenv("WP_DB_HOST_IP")
WP_DB_PORT     = int(os.getenv("WP_DB_PORT", "3306"))
WP_DB_NAME     = os.getenv("WP_DB_NAME")
WP_DB_USER     = os.getenv("WP_DB_USER")
WP_DB_PASSWORD = os.getenv("WP_DB_PASSWORD")


def _wp_db():
    """Connect via WP_DB_HOST first, falling back to WP_DB_HOST_IP (same pattern
    as pipeline.py's _wp_db — GitHub Actions runners occasionally see flaky DNS
    for the hostname but reach the raw IP fine)."""
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
        except Exception as exc:  # noqa: BLE001 — try the next host
            last_exc = exc
    raise last_exc or RuntimeError("No WP_DB_HOST/WP_DB_HOST_IP configured")


def main() -> int:
    missing = [name for name, val in (
        ("WP_DB_HOST", WP_DB_HOST), ("WP_DB_NAME", WP_DB_NAME),
        ("WP_DB_USER", WP_DB_USER), ("WP_DB_PASSWORD", WP_DB_PASSWORD),
    ) if not val]
    if missing:
        print(f"::error::Missing env vars: {', '.join(missing)}", file=sys.stderr)
        return 1

    try:
        conn = _wp_db()
    except Exception as exc:
        print(f"::error::WP DB connect failed: {exc}", file=sys.stderr)
        return 1

    now_utc = datetime.now(timezone.utc)
    now_utc_str = now_utc.strftime("%Y-%m-%d %H:%M:%S")
    now_ist_str = now_utc.astimezone(IST).strftime("%Y-%m-%d %H:%M:%S")

    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT ID, post_title, post_name, post_date_gmt FROM wp_posts "
                "WHERE post_status = 'future' AND post_type = 'post' "
                "  AND post_date_gmt <= %s",
                (now_utc_str,),
            )
            overdue = cur.fetchall()

            if not overdue:
                print("Nothing overdue — no 'future' posts past their scheduled time.")
                return 0

            ids = [row["ID"] for row in overdue]
            placeholders = ",".join(["%s"] * len(ids))
            cur.execute(
                f"UPDATE wp_posts SET post_status = 'publish', "
                f"post_modified = %s, post_modified_gmt = %s "
                f"WHERE ID IN ({placeholders})",
                [now_ist_str, now_utc_str] + ids,
            )

        conn.commit()
    except Exception as exc:
        try:
            conn.rollback()
        except Exception:  # noqa: BLE001
            pass
        print(f"::error::Sweep failed: {exc}", file=sys.stderr)
        return 1
    finally:
        conn.close()

    print(f"Published {len(overdue)} overdue post(s):")
    for row in overdue:
        print(f"  #{row['ID']}  {row['post_title']!r}  "
              f"(scheduled {row['post_date_gmt']} UTC, slug={row['post_name']})")
    return 0


if __name__ == "__main__":
    sys.exit(main())

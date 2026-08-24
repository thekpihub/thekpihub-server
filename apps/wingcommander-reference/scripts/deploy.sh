#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════
#  Ditto Wingman — Auto-deploy script
#  Called by cron every 5 minutes.
#  Pulls latest code and redeploys weapons + app.
# ═══════════════════════════════════════════════════════
DIR="/var/www/ditto-wingman"
WEAPONS_DIR="/var/www/html/weapons"
LOG_PREFIX="[$(date '+%Y-%m-%d %H:%M:%S')]"

cd "$DIR" || { echo "$LOG_PREFIX ERROR: $DIR not found"; exit 1; }

# Check if there's anything new
git fetch origin main --quiet 2>/dev/null

LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)

if [ "$LOCAL" = "$REMOTE" ]; then
  exit 0  # Nothing new — silent exit
fi

echo "$LOG_PREFIX New commit detected: deploying..."
echo "$LOG_PREFIX $(git log HEAD..origin/main --oneline | head -5)"

# Pull latest
git reset --hard origin/main --quiet

# Deploy weapons (always)
if [ -d "$DIR/weapons" ]; then
  mkdir -p "$WEAPONS_DIR"
  cp -r "$DIR/weapons/." "$WEAPONS_DIR/"
  echo "$LOG_PREFIX Weapons deployed"
fi

# Rebuild + restart Next.js if it exists
if [ -f "$DIR/package.json" ] && grep -q '"next"' "$DIR/package.json" 2>/dev/null; then
  npm ci --production=false --silent 2>/dev/null
  npm run build --silent 2>/dev/null && \
  pm2 restart ditto-wingman 2>/dev/null || \
  pm2 start "$DIR/ecosystem.config.js" 2>/dev/null
  echo "$LOG_PREFIX App restarted"
fi

echo "$LOG_PREFIX Deploy complete ✓"

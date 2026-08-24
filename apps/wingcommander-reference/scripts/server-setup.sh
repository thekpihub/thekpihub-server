#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════
#  Ditto Wingman — ONE-COMMAND PERMANENT SERVER SETUP
#  Run this ONCE on your Hostinger VPS as root.
#  After this: git push = auto-deploy. Forever.
# ═══════════════════════════════════════════════════════════
set -e

G='\033[0;32m'; Y='\033[1;33m'; B='\033[0;34m'; R='\033[0;31m'; N='\033[0m'

REPO="https://github.com/nitro0dust-pixel/ditto-wingman"
DIR="/var/www/ditto-wingman"
WEAPONS_DIR="/var/www/html/weapons"
PORT=3000

echo -e "${B}"
echo "╔══════════════════════════════════════════════╗"
echo "║   Ditto Wingman — Permanent Server Setup     ║"
echo "╚══════════════════════════════════════════════╝"
echo -e "${N}"

[[ $EUID -ne 0 ]] && { echo -e "${R}ERROR: Run as root (sudo su)${N}"; exit 1; }

step() { echo -e "\n${Y}[$((++STEP))] $1${N}"; }
STEP=0

# ── Node.js 20 ───────────────────────────────────────────
step "Node.js 20"
if ! command -v node &>/dev/null || [[ $(node -v | cut -d. -f1 | tr -d 'v') -lt 18 ]]; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash - >/dev/null 2>&1
  apt-get install -y nodejs >/dev/null 2>&1
fi
echo "  ✓ $(node -v)  npm $(npm -v)"

# ── PM2 ──────────────────────────────────────────────────
step "PM2 (process manager)"
npm install -g pm2 --silent
echo "  ✓ PM2 $(pm2 -v)"

# ── Nginx ─────────────────────────────────────────────────
step "Nginx"
apt-get install -y nginx >/dev/null 2>&1
echo "  ✓ Nginx installed"

# ── Git ───────────────────────────────────────────────────
step "Git"
apt-get install -y git >/dev/null 2>&1
echo "  ✓ Git $(git --version | cut -d' ' -f3)"

# ── Clone / update repo ───────────────────────────────────
step "Repository → $DIR"
if [ -d "$DIR/.git" ]; then
  echo "  Updating existing repo..."
  cd "$DIR"
  git fetch origin
  git reset --hard origin/main
else
  echo "  Cloning fresh..."
  mkdir -p "$(dirname "$DIR")"
  git clone "$REPO" "$DIR"
  cd "$DIR"
fi
echo "  ✓ $(git log -1 --format='%h %s')"

# ── Weapons → Nginx web root ──────────────────────────────
step "Deploying 8 weapons to web root"
mkdir -p "$WEAPONS_DIR"
if [ -d "$DIR/weapons" ]; then
  cp -r "$DIR/weapons/." "$WEAPONS_DIR/"
  echo "  ✓ Weapons deployed to $WEAPONS_DIR"
else
  echo "  ⚠  No weapons/ dir found — will be deployed on next push"
fi

# ── Nginx config ──────────────────────────────────────────
step "Nginx configuration"
cp "$DIR/nginx/ditto-wingman.conf" /etc/nginx/sites-available/ditto-wingman
ln -sf /etc/nginx/sites-available/ditto-wingman /etc/nginx/sites-enabled/ditto-wingman
rm -f /etc/nginx/sites-enabled/default
nginx -t 2>&1 | grep -E "ok|error"
systemctl reload nginx
echo "  ✓ Nginx configured and reloaded"

# ── Next.js install + build (if present) ─────────────────
step "Next.js app"
if [ -f "$DIR/package.json" ] && grep -q '"next"' "$DIR/package.json" 2>/dev/null; then
  echo "  Installing dependencies..."
  cd "$DIR" && npm ci --production=false 2>/dev/null
  echo "  Building..."
  npm run build 2>/dev/null
  echo "  ✓ Build complete"

  pm2 delete ditto-wingman 2>/dev/null || true
  pm2 start "$DIR/ecosystem.config.js"
  pm2 save --force

  # PM2 survive reboots
  PM2_STARTUP=$(pm2 startup systemd -u root --hp /root 2>/dev/null | tail -1)
  [[ "$PM2_STARTUP" == "sudo"* ]] && eval "$PM2_STARTUP"
  echo "  ✓ PM2 running + startup registered"
else
  echo "  ℹ  No Next.js found yet — weapons are live via Nginx static serving"
fi

# ── Cron auto-deploy every 5 minutes ─────────────────────
step "Auto-deploy cron (every 5 min)"
chmod +x "$DIR/scripts/deploy.sh"
CRON_LINE="*/5 * * * * $DIR/scripts/deploy.sh >> /var/log/ditto-deploy.log 2>&1"
( crontab -l 2>/dev/null | grep -v "ditto-wingman\|deploy.sh"; echo "$CRON_LINE" ) | crontab -
echo "  ✓ Cron set: every push goes live within 5 minutes"

# ── Log rotation ──────────────────────────────────────────
cat > /etc/logrotate.d/ditto-deploy <<'LOGROTATE'
/var/log/ditto-deploy.log {
  weekly
  rotate 4
  compress
  missingok
  notifempty
}
LOGROTATE

# ── Summary ───────────────────────────────────────────────
SERVER_IP=$(hostname -I | awk '{print $1}')
echo -e "\n${G}"
echo "╔══════════════════════════════════════════════╗"
echo "║  ✅  PERMANENT SETUP COMPLETE                ║"
echo "╠══════════════════════════════════════════════╣"
echo "║                                              ║"
printf "║  Weapons:  http://%-26s║\n" "$SERVER_IP/weapons/"
printf "║  App:      http://%-26s║\n" "$SERVER_IP/"
echo "║                                              ║"
echo "║  Auto-deploy: every 5 min via cron           ║"
echo "║  To check:    tail -f /var/log/ditto-deploy.log ║"
echo "║  PM2 status:  pm2 status                     ║"
echo "║                                              ║"
echo "╚══════════════════════════════════════════════╝"
echo -e "${N}"

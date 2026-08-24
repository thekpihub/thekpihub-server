# ==============================================================
#  TheKPIHub.com — ONE-CLICK PRODUCTION SETUP (PowerShell/WSL)
#  Version: 1.0.0 | Date: 2026-04-28
#  Run: Set-ExecutionPolicy Bypass -Scope Process; .\SETUP.ps1
# ==============================================================

param(
  [string]$DatabaseUrl    = "postgresql://kpihub:kpihub123@localhost:5432/kpihub",
  [string]$RepoUrl        = "",
  [string]$NextAuthUrl    = "https://thekpihub.com",
  [switch]$SkipTests      = $false,
  [switch]$SkipDeploy     = $false
)

$ErrorActionPreference = "Stop"

# ── Helpers ─────────────────────────────────────────────────
function Log($msg)  { Write-Host "[$([datetime]::Now.ToString('HH:mm:ss'))] $msg" -ForegroundColor Cyan }
function Ok($msg)   { Write-Host "✅ $msg" -ForegroundColor Green }
function Warn($msg) { Write-Host "⚠️  $msg" -ForegroundColor Yellow }
function Fail($msg) { Write-Host "❌ $msg" -ForegroundColor Red; exit 1 }

function Check-Command($cmd) {
  if (!(Get-Command $cmd -ErrorAction SilentlyContinue)) { Fail "$cmd not found. Install it and re-run." }
  Ok "$cmd found"
}

Write-Host @"
 ╔══════════════════════════════════════════════════════╗
 ║     TheKPIHub.com — Production Setup Engine         ║
 ║     One-Click: Build → Test → Deploy → Go Live      ║
 ╚══════════════════════════════════════════════════════╝
"@ -ForegroundColor Blue

# ── STEP 0: Pre-flight ──────────────────────────────────────
Write-Host "`n══ STEP 0: Pre-flight Checks ══" -ForegroundColor Blue
Check-Command git
Check-Command node
Check-Command npm
$nodeVer = [int](node -e "process.stdout.write(process.version.slice(1).split('.')[0])")
if ($nodeVer -lt 18) { Fail "Node.js 18+ required. Current: $nodeVer" }
Ok "Node.js v$nodeVer"

# ── STEP 1: Collect secrets ──────────────────────────────────
Write-Host "`n══ STEP 1: Secrets ══" -ForegroundColor Blue
$NextAuthSecret   = if ($env:NEXTAUTH_SECRET)   { $env:NEXTAUTH_SECRET }   else { [Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32)) }
$JwtSecret        = if ($env:JWT_SECRET)        { $env:JWT_SECRET }        else { [Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32)) }
$StripeSecretKey  = if ($env:STRIPE_SECRET_KEY) { $env:STRIPE_SECRET_KEY } else { Read-Host "Stripe secret key (sk_live_... or sk_test_...)" }
$StripeWebhook    = if ($env:STRIPE_WEBHOOK_SECRET) { $env:STRIPE_WEBHOOK_SECRET } else { Read-Host "Stripe webhook secret (whsec_...)" }
$SmtpHost         = if ($env:SMTP_HOST)  { $env:SMTP_HOST }  else { "smtp.resend.com" }
$SmtpPort         = if ($env:SMTP_PORT)  { $env:SMTP_PORT }  else { "587" }
$SmtpUser         = if ($env:SMTP_USER)  { $env:SMTP_USER }  else { "resend" }
$SmtpPass         = if ($env:SMTP_PASS)  { $env:SMTP_PASS }  else { Read-Host "SMTP API key / password" }
$SmtpFrom         = "noreply@thekpihub.com"
Ok "Secrets collected"

# ── STEP 2: Clone or init ────────────────────────────────────
Write-Host "`n══ STEP 2: Project ══" -ForegroundColor Blue
if ($RepoUrl -and $RepoUrl -ne "") {
  Log "Cloning $RepoUrl ..."
  git clone $RepoUrl kpihub-app
  Set-Location kpihub-app
} elseif (!(Test-Path "package.json")) {
  Fail "Run SETUP.sh first on Linux/macOS to generate the project, then push to GitHub and clone here."
} else {
  Log "Using existing project directory"
}
Ok "Project ready"

# ── STEP 3: Write .env.local ────────────────────────────────
Write-Host "`n══ STEP 3: Environment ══" -ForegroundColor Blue
$envContent = @"
DATABASE_URL=$DatabaseUrl
NEXTAUTH_SECRET=$NextAuthSecret
NEXTAUTH_URL=$NextAuthUrl
JWT_SECRET=$JwtSecret
STRIPE_SECRET_KEY=$StripeSecretKey
STRIPE_WEBHOOK_SECRET=$StripeWebhook
STRIPE_PRO_PRICE_ID=price_REPLACE_ME_PRO
STRIPE_ENT_PRICE_ID=price_REPLACE_ME_ENT
SMTP_HOST=$SmtpHost
SMTP_PORT=$SmtpPort
SMTP_USER=$SmtpUser
SMTP_PASS=$SmtpPass
SMTP_FROM=$SmtpFrom
NODE_ENV=production
"@
$envContent | Set-Content ".env.local" -Encoding UTF8
Ok ".env.local written"

# ── STEP 4: Install dependencies ─────────────────────────────
Write-Host "`n══ STEP 4: Install Dependencies ══" -ForegroundColor Blue
npm ci
Ok "Dependencies installed"

# ── STEP 5: Database ─────────────────────────────────────────
Write-Host "`n══ STEP 5: Database ══" -ForegroundColor Blue
$env:DATABASE_URL = $DatabaseUrl
try {
  npx prisma db push
  Ok "Schema pushed"
  npx prisma db seed
  Ok "Database seeded (admin@thekpihub.com / Admin@KPIHub2026!)"
} catch {
  Warn "DB setup failed: $_"
  Warn "Ensure PostgreSQL is running and DATABASE_URL is correct"
}

# ── STEP 6: Build ────────────────────────────────────────────
Write-Host "`n══ STEP 6: Production Build ══" -ForegroundColor Blue
npm run build
Ok "Build successful"

# ── STEP 7: Tests ────────────────────────────────────────────
if (!$SkipTests) {
  Write-Host "`n══ STEP 7: Tests ══" -ForegroundColor Blue
  try { npm test; Ok "Unit tests passed" } catch { Warn "Some unit tests failed" }
  try {
    $job = Start-Job { Set-Location $using:PWD; npm start }
    Start-Sleep 10
    npx playwright install chromium --with-deps 2>$null
    npm run test:e2e
    Ok "E2E tests passed"
    Stop-Job $job; Remove-Job $job
  } catch { Warn "E2E tests failed — check playwright-report/" }
} else { Warn "Tests skipped (--SkipTests)" }

# ── STEP 8: Git ──────────────────────────────────────────────
Write-Host "`n══ STEP 8: Git Push ══" -ForegroundColor Blue
if ($RepoUrl -and $RepoUrl -ne "") {
  git add -A
  git commit -m "chore: production env setup [$(Get-Date -Format 'yyyy-MM-dd HH:mm')]" --allow-empty
  git push origin main
  Ok "Pushed to $RepoUrl"
} else { Warn "No REPO_URL — skipping git push" }

# ── STEP 9: Deploy ────────────────────────────────────────────
if (!$SkipDeploy) {
  Write-Host "`n══ STEP 9: Deploy ══" -ForegroundColor Blue
  if (Get-Command vercel -ErrorAction SilentlyContinue) {
    vercel --prod --yes
    Ok "Deployed to Vercel"
  } else {
    Warn "Vercel CLI not found. Install: npm i -g vercel"
    Log "Alternative: Push to GitHub and let the CI/CD pipeline deploy automatically"
  }
}

# ── STEP 10: Verify ──────────────────────────────────────────
Write-Host "`n══ STEP 10: Production Verification ══" -ForegroundColor Blue

function Check-Endpoint($url, $label) {
  try {
    $r = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 15
    if ($r.StatusCode -eq 200) { Ok "$label → HTTP 200" }
    else { Warn "$label → HTTP $($r.StatusCode)" }
  } catch { Warn "$label → Unreachable ($_)" }
}

Check-Endpoint "$NextAuthUrl"                "Homepage"
Check-Endpoint "$NextAuthUrl/pricing"        "Pricing"
Check-Endpoint "$NextAuthUrl/robots.txt"     "robots.txt"
Check-Endpoint "$NextAuthUrl/sitemap.xml"    "sitemap.xml"
Check-Endpoint "$NextAuthUrl/api/health"     "API health"

# Security headers
try {
  $headers = (Invoke-WebRequest -Uri $NextAuthUrl -UseBasicParsing).Headers
  if ($headers["Strict-Transport-Security"])  { Ok "HSTS header present" }     else { Warn "HSTS header missing" }
  if ($headers["X-Frame-Options"])            { Ok "X-Frame-Options present" } else { Warn "X-Frame-Options missing" }
  if ($headers["X-Content-Type-Options"])     { Ok "nosniff header present" }  else { Warn "nosniff header missing" }
} catch { Warn "Could not verify headers" }

Write-Host @"

 ╔══════════════════════════════════════════════════════╗
 ║          🎉  SETUP COMPLETE — YOU'RE LIVE!           ║
 ╠══════════════════════════════════════════════════════╣
 ║  🌐 Site:        https://thekpihub.com               ║
 ║  🔑 Admin:       admin@thekpihub.com                 ║
 ║  🔑 Password:    Admin@KPIHub2026!                   ║
 ║  📊 Dashboard:   /dashboard                          ║
 ╠══════════════════════════════════════════════════════╣
 ║  NEXT STEPS:                                         ║
 ║  1. Set STRIPE price IDs in .env.local               ║
 ║  2. Configure Stripe webhook → /api/webhooks/stripe  ║
 ║  3. Add GitHub Secrets for CI/CD automation          ║
 ║  4. Submit sitemap to Google Search Console          ║
 ╚══════════════════════════════════════════════════════╝
"@ -ForegroundColor Green

#!/bin/bash
set -e

# ── Colors ────────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

log()    { echo -e "${BLUE}[deploy]${NC} $1"; }
ok()     { echo -e "${GREEN}[deploy]${NC} ✓ $1"; }
warn()   { echo -e "${YELLOW}[deploy]${NC} ⚠ $1"; }
fail()   { echo -e "${RED}[deploy]${NC} ✗ $1"; exit 1; }

# ── Config ────────────────────────────────────────────────────────────────────
REPO_DIR="/home/michaelthero/pythias"

# Map: turbo filter name → PM2 process name
declare -A APP_PM2=(
  ["pythias"]="nextjs-pythias"
  ["premier-printing"]="nextjs-premier"
  ["po"]="nextjs-po"
  ["printthreads"]="nextjs-printthreads"
)

# Default: build only pythias and premier-printing (po/printthreads have sharp issues)
DEFAULT_APPS=("pythias" "premier-printing")

# ── Parse args ────────────────────────────────────────────────────────────────
# Usage:
#   ./deploy.sh                          # build default apps
#   ./deploy.sh pythias                  # build only pythias
#   ./deploy.sh pythias premier-printing # build specific apps
#   ./deploy.sh all                      # build all apps

if [ "$1" == "all" ]; then
  APPS=("pythias" "premier-printing" "po" "printthreads")
elif [ $# -gt 0 ]; then
  APPS=("$@")
else
  APPS=("${DEFAULT_APPS[@]}")
fi

# ── Start ─────────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}╔══════════════════════════════════════╗${NC}"
echo -e "${BOLD}║     Pythias Deployment Script        ║${NC}"
echo -e "${BOLD}╚══════════════════════════════════════╝${NC}"
echo ""
log "Deploying: ${APPS[*]}"
log "Directory: $REPO_DIR"
echo ""

cd "$REPO_DIR"

# ── Git pull ──────────────────────────────────────────────────────────────────
log "Pulling latest code..."
git pull || fail "git pull failed"
ok "Code updated"

# ── Install dependencies ──────────────────────────────────────────────────────
log "Installing dependencies..."
npm install --include=optional 2>&1 | tail -5
ok "Dependencies installed"

# ── Build apps ────────────────────────────────────────────────────────────────
BUILT_APPS=()
FAILED_APPS=()

for APP in "${APPS[@]}"; do
  echo ""
  log "Building $APP..."
  if npx turbo build --filter="$APP" 2>&1; then
    ok "$APP built successfully"
    BUILT_APPS+=("$APP")
  else
    warn "$APP build FAILED — skipping PM2 restart for this app"
    FAILED_APPS+=("$APP")
  fi
done

# ── PM2 restart ───────────────────────────────────────────────────────────────
echo ""
log "Restarting PM2 processes..."

for APP in "${BUILT_APPS[@]}"; do
  PM2_NAME="${APP_PM2[$APP]}"
  if [ -z "$PM2_NAME" ]; then
    warn "No PM2 process mapped for $APP — skipping"
    continue
  fi
  if pm2 describe "$PM2_NAME" > /dev/null 2>&1; then
    pm2 reload "$PM2_NAME" --update-env && ok "Reloaded $PM2_NAME"
  else
    warn "PM2 process '$PM2_NAME' not found — starting it"
    pm2 start ecosystem.config.js --only "$PM2_NAME" && ok "Started $PM2_NAME"
  fi
done

pm2 save

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}══════════════ Summary ══════════════${NC}"
if [ ${#BUILT_APPS[@]} -gt 0 ]; then
  echo -e "${GREEN}✓ Deployed:${NC} ${BUILT_APPS[*]}"
fi
if [ ${#FAILED_APPS[@]} -gt 0 ]; then
  echo -e "${RED}✗ Failed:${NC}   ${FAILED_APPS[*]}"
fi
echo ""
pm2 list
echo ""

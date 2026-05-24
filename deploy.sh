#!/bin/bash

# ── Colors ────────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

log()  { echo -e "${BLUE}[deploy]${NC} $1"; }
ok()   { echo -e "${GREEN}[deploy]${NC} ✓ $1"; }
warn() { echo -e "${YELLOW}[deploy]${NC} ⚠ $1"; }
fail() { echo -e "${RED}[deploy]${NC} ✗ $1"; }

# ── Config ────────────────────────────────────────────────────────────────────
REPO_DIR="/home/michaelthero/pythias"

declare -A APP_PM2=(
  ["pythias"]="nextjs-pythias"
  ["premier-printing"]="nextjs-premier"
  ["po"]="nextjs-po"
  ["printthreads"]="nextjs-printthreads"
)

declare -A APP_DIR=(
  ["pythias"]="apps/pythias"
  ["premier-printing"]="apps/premier-printing"
  ["po"]="apps/po"
  ["printthreads"]="apps/printthreads"
)

if [ $# -gt 0 ]; then
  APPS=("$@")
else
  APPS=("pythias" "premier-printing" "po" "printthreads")
fi

BUILT_APPS=()
FAILED_APPS=()
EXIT_CODE=0

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
git stash -u
if ! git pull; then
  fail "git pull failed — aborting, no changes made"
  git stash pop 2>/dev/null || true
  exit 1
fi
git stash pop 2>/dev/null || true
ok "Code updated"

# ── Install dependencies ──────────────────────────────────────────────────────
log "Installing dependencies..."
npm install --include=optional 2>&1 | tail -5
ok "Dependencies installed"

# ── Fix sharp for Linux ───────────────────────────────────────────────────────
# npm install above may have placed per-package sharp copies (e.g. packages/sublimation/node_modules/sharp)
# that lack their companion libvips. Remove every sharp install across the tree so only the
# root-level install remains — workspace packages will walk up to it via Node resolution.
log "Cleaning all sharp installs and reinstalling linux-x64 at root..."
rm -rf node_modules/sharp node_modules/@img
find apps packages -maxdepth 6 -type d \( -name "sharp" -o -name "@img" \) -path "*/node_modules/*" -exec rm -rf {} + 2>/dev/null || true
npm install --os=linux --cpu=x64 sharp@0.34.2 2>&1 | tail -3
ok "sharp binary ready (0.34.2 linux-x64)"

# ── Set library path so sharp can find bundled libvips ───────────────────────
# Find all libvips lib dirs that were installed and add them all to LD_LIBRARY_PATH
LIBVIPS_DIRS=$(find "$REPO_DIR/node_modules" -maxdepth 4 -name "libvips-cpp.so*" -exec dirname {} \; 2>/dev/null | sort -u | tr '\n' ':')
export LD_LIBRARY_PATH="${LIBVIPS_DIRS}${LD_LIBRARY_PATH}"
log "LD_LIBRARY_PATH set: ${LIBVIPS_DIRS}"

# ── Build each app with .next backup/restore ──────────────────────────────────
echo ""
log "Building apps (current .next backed up — sites stay live if build fails)..."
echo ""

for APP in "${APPS[@]}"; do
  APP_PATH="$REPO_DIR/${APP_DIR[$APP]}"
  NEXT_DIR="$APP_PATH/.next"
  NEXT_BAK="$APP_PATH/.next.bak"

  # Back up current .next so we can restore if build fails
  if [ -d "$NEXT_DIR" ]; then
    rm -rf "$NEXT_BAK"
    cp -r "$NEXT_DIR" "$NEXT_BAK"
    log "[$APP] .next backed up"
  fi

  log "[$APP] Building..."
  if npx turbo build --filter="$APP" 2>&1; then
    ok "[$APP] Build succeeded"
    rm -rf "$NEXT_BAK"
    BUILT_APPS+=("$APP")
  else
    fail "[$APP] Build FAILED"
    # Restore the previous good build so the site keeps running
    if [ -d "$NEXT_BAK" ]; then
      rm -rf "$NEXT_DIR"
      mv "$NEXT_BAK" "$NEXT_DIR"
      warn "[$APP] Restored previous .next — site stays up on old build"
    else
      warn "[$APP] No previous .next to restore — site may be affected"
    fi
    FAILED_APPS+=("$APP")
    EXIT_CODE=1
  fi
  echo ""
done

# ── PM2 reload — only for successfully built apps ─────────────────────────────
if [ ${#BUILT_APPS[@]} -gt 0 ]; then
  log "Reloading PM2 for successfully built apps..."
  for APP in "${BUILT_APPS[@]}"; do
    PM2_NAME="${APP_PM2[$APP]}"
    if [ -z "$PM2_NAME" ]; then
      warn "No PM2 process mapped for '$APP' — skipping"
      continue
    fi
    if pm2 describe "$PM2_NAME" > /dev/null 2>&1; then
      if pm2 reload "$PM2_NAME" --update-env; then
        ok "Reloaded $PM2_NAME"
      else
        fail "PM2 reload failed for $PM2_NAME"
        EXIT_CODE=1
      fi
    else
      warn "PM2 process '$PM2_NAME' not found — starting from ecosystem.config.js"
      pm2 start ecosystem.config.js --only "$PM2_NAME" && ok "Started $PM2_NAME"
    fi
  done
  pm2 save
fi

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}════════════════════ Summary ════════════════════${NC}"
if [ ${#BUILT_APPS[@]} -gt 0 ]; then
  echo -e "${GREEN}✓ Deployed:${NC}        ${BUILT_APPS[*]}"
fi
if [ ${#FAILED_APPS[@]} -gt 0 ]; then
  echo -e "${RED}✗ Build failed:${NC}    ${FAILED_APPS[*]}"
  echo -e "${YELLOW}  Sites for failed apps are still running on their previous build.${NC}"
fi
echo ""
pm2 list
echo ""

exit $EXIT_CODE

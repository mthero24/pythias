#!/bin/bash
# Build (and optionally submit) ONE store's white-label app. Each store gets its own branded binary
# from this single codebase by injecting its EXPO_PUBLIC_* config + brand assets at build time.
#
# Usage:
#   EXPO_PUBLIC_APP_KEY=app_xxx \
#   EXPO_PUBLIC_STORE_NAME="Print Threads" \
#   EXPO_PUBLIC_STORE_SLUG=print-threads \
#   EXPO_PUBLIC_STORE_SCHEME=printthreads \
#   EXPO_PUBLIC_IOS_BUNDLE=com.pythias.printthreads \
#   EXPO_PUBLIC_ANDROID_PKG=com.pythias.printthreads \
#   EXPO_PUBLIC_THEME_BG="#ffffff" \
#   ./scripts/build-store.sh [--submit]
#
# Prereqs: `npm i -g eas-cli && eas login` as the Pythias Expo account. Brand assets (icon/splash) are
# auto-generated from the store's brand by generate-assets.js below — review them before submitting.
set -e

: "${EXPO_PUBLIC_APP_KEY:?set EXPO_PUBLIC_APP_KEY (the store's StorefrontSite.appKey)}"
: "${EXPO_PUBLIC_STORE_NAME:?set EXPO_PUBLIC_STORE_NAME}"
: "${EXPO_PUBLIC_IOS_BUNDLE:?set EXPO_PUBLIC_IOS_BUNDLE}"
: "${EXPO_PUBLIC_ANDROID_PKG:?set EXPO_PUBLIC_ANDROID_PKG}"

echo "Generating brand assets (icon + splash) from the store's brand…"
node scripts/generate-assets.js

echo "Building app for: $EXPO_PUBLIC_STORE_NAME ($EXPO_PUBLIC_APP_KEY)"
eas build --platform all --profile production --non-interactive

if [ "$1" = "--submit" ]; then
  echo "Submitting to App Store + Google Play (Pythias accounts)…"
  eas submit --platform all --profile production --non-interactive
fi

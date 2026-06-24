# Pythias Storefront — White-label Mobile App (Expo)

One React Native / Expo codebase that becomes a **distinct branded native app per storefront**.
Branding + the store's identity are injected at **build time** via `EXPO_PUBLIC_*` env, so we compile
and submit one app per store under **Pythias's** Apple + Google developer accounts (the add-on model).

This project is intentionally **outside** the web monorepo workspaces (`apps/*`, `packages/*`) — it has
its own `node_modules` and Expo toolchain and is **not** built by turbo or deployed by `deploy.sh`.

## How it works
- The app boots by calling **`GET /api/app/config`** (storefront API) with the store's `appKey` in the
  `x-pythias-app-key` header → gets brand, theme, nav, feature flags.
- Catalog comes from **`/api/app/products`** and **`/api/app/products/:id`**.
- Checkout + account reuse the existing storefront APIs (`/api/checkout/*`, `/api/account/*`), which
  already accept the app key. The server resolves the tenant via `lib/resolveOrg.js`.
- A store's `appKey` is minted when the seller buys the **mobile-app add-on** (billing webhook →
  `StorefrontSite.appKey` + `appEnabled`).

## Per-store configuration (build-time env)
| Env | Example | Purpose |
| --- | --- | --- |
| `EXPO_PUBLIC_APP_KEY` | `app_ab12…` | the store's tenant key (from `StorefrontSite.appKey`) |
| `EXPO_PUBLIC_API_BASE` | `https://store.pythiastechnologies.com` | storefront API base |
| `EXPO_PUBLIC_STORE_NAME` | `Print Threads` | app display name |
| `EXPO_PUBLIC_STORE_SLUG` | `print-threads` | Expo slug |
| `EXPO_PUBLIC_STORE_SCHEME` | `printthreads` | deep-link scheme |
| `EXPO_PUBLIC_IOS_BUNDLE` | `com.pythias.printthreads` | iOS bundle id |
| `EXPO_PUBLIC_ANDROID_PKG` | `com.pythias.printthreads` | Android package |
| `EXPO_PUBLIC_THEME_BG` | `#ffffff` | splash background |

Per-store `assets/icon.png` + `assets/splash.png` are generated from the store's brand identity
(logo/colors) by the build pipeline and dropped in before `eas build`.

## Run locally (against one store)
```bash
cd mobile
npm install
EXPO_PUBLIC_APP_KEY=app_xxx EXPO_PUBLIC_API_BASE=https://store.pythiastechnologies.com npm start
```

## Build + submit (per store, Pythias-managed)
```bash
# one-time: npm i -g eas-cli && eas login   (Pythias Expo account)
eas build  --platform all --profile production   # injects that store's EXPO_PUBLIC_* + assets
eas submit --platform all                         # to App Store + Play under Pythias accounts
```

## What's built vs. next
**Built (this scaffold):** bootstrap config, catalog grid (Home), product detail, theming + per-store
config, API client.

**Next:** cart + checkout screens (wire to `/api/checkout/*` + Stripe), account/login + orders
(`/api/account/*`), search, push notifications (Expo), the per-store icon/splash generator + EAS build
pipeline, and the seller-facing "Get the app" purchase button (`/api/storefront/app-subscribe`).

See memory `storefront_mobile_apps.md` for the full plan + decisions.

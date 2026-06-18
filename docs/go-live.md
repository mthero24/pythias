# Storefront — Go-Live Runbook

Everything needed to take the storefront from dev to charging real customers. Work top-to-bottom;
the **Launch checklist** at the end is the gate.

The storefront spans three apps that share one database:
- **pythias-storefront** (port 3020) — the buyer-facing multi-tenant store (one app, all stores by host).
- **pythias-platform** (3010) — seller admin + the routing/billing engine; the storefront tools mount here.
- **premier-printing** (3000) — the fulfiller's own admin (also mounts the storefront tools).

Env templates: `apps/pythias-storefront/.env.example`, `apps/pythias-platform/.env.channels.example`.

---

## 1. Decide: storefront subscription pricing  ⚠️ (the one business decision)

The gate that unlocks the storefront tools is a **paid Stripe subscription**. Prices are placeholders
in `apps/pythias-platform/lib/storefrontPlans.js`:

| Plan | Price | |
|---|---|---|
| Starter | **$49/mo** | store + marketing + analytics |
| Pro | **$149/mo** | + AI suite, demand, automations, i18n |
| Enterprise | **$399/mo** | + MoR, network shield, multi-vertical, fulfiller |

Two ways to bill:
- **Easy:** leave the prices in `storefrontPlans.js` — checkout builds them via `price_data` (no Stripe
  products needed).
- **Recommended for prod:** create 3 recurring **Prices** in the **platform** Stripe account and set
  `STOREFRONT_STARTER_PRICE_ID`, `STOREFRONT_PRO_PRICE_ID`, `STOREFRONT_ENTERPRISE_PRICE_ID` — the
  subscribe route uses those instead.

---

## 2. Stripe — TWO separate accounts

| | Marketplace account | Platform-billing account |
|---|---|---|
| Purpose | Buyer payments, Connect payouts to sellers, Stripe Tax, disputes (MoR) | Seller SaaS subscriptions + wallet top-ups |
| App | **pythias-storefront** | **pythias-platform** |
| Secret env | `STOREFRONT_STRIPE_SECRET` / `_PUBLISHABLE` | `stripeSecret` (or `STRIPE_SECRET_KEY`) |
| Webhook endpoint | `https://<store-host>/api/checkout/webhook` | `https://<platform-host>/api/billing/webhook` |
| Webhook secret | `STOREFRONT_STRIPE_WEBHOOK_SECRET` | `STRIPE_WEBHOOK_SECRET` |
| Webhook events | `payment_intent.succeeded`, `charge.dispute.created`, `charge.dispute.closed` | `checkout.session.completed`, `customer.subscription.created/updated/deleted`, `invoice.paid` |

Also on the **marketplace** account:
- **Stripe Connect** (Express) enabled — sellers onboard for payouts (the Payouts page handles it).
- **Stripe Tax** enabled — checkout computes + records tax (powers the Merchant-of-Record tax report).
- Set a **statement descriptor** = your MoR entity (so it reads "Pythias…" on buyers' cards).
- **Express wallets** (one-tap Buy Now on cards/cart/checkout):
  - **Apple Pay** — register **each live storefront domain** (Stripe → Settings → Payments → Payment methods → Apple Pay → **Add a new domain**). Apple Pay only renders on HTTPS + a registered domain, so do this per custom domain + the `*.<base>` storefront host. Not shown on localhost.
  - **PayPal** — **enable** it under Payment methods (it then appears in the Express Checkout Element automatically).
  - **Google Pay + Link** — no setup; they appear automatically on supported browsers.

> Use `sk_test_`/`pk_test_` + Stripe CLI (`stripe listen --forward-to`) in staging; swap to live keys in prod.

---

## 3. Per-app environment

Fill these in each app's `.env.local` (see the `.env.example` files for the annotated full list).

**pythias-storefront** — `PLATFORM_MONGO_URL`, `STOREFRONT_BASE_DOMAIN`, the 3 `STOREFRONT_STRIPE_*`,
`RESEND_API_KEY` + `STOREFRONT_EMAIL_FROM`, `TWILIO_*`, the 6 `WASABI_*` (review photos),
`ANTHROPIC_API_KEY`, `PYTHIAS_INTERNAL_KEY`, `PLATFORM_INTERNAL_BASE`, `STOREFRONT_JWT_SECRET`.

**pythias-platform** — platform Stripe (`stripeSecret`, `STRIPE_WEBHOOK_SECRET`), `NEXTAUTH_SECRET`,
`ANTHROPIC_API_KEY`, `GEMINI_API_KEY` (AI scene/tile images — fails soft to catalog photos if unset),
`PYTHIAS_INTERNAL_KEY`, `STOREFRONT_BASE_DOMAIN`, optional storefront `*_PRICE_ID`s, plus
**channel syndication** vars (`CHANNEL_TOKEN_KEY` + the per-channel keys — see
`docs/channel-syndication-setup.md`).

**premier-printing** (enterprise / own-DB storefront) — same storefront editor + AI image routes, so it
also needs `ANTHROPIC_API_KEY` and `GEMINI_API_KEY` for the AI scene/tile image generation.

> `PYTHIAS_INTERNAL_KEY` must be **identical** across apps — it guards every internal cron endpoint.

---

## 4. Background jobs (PM2)

These storefront crons are already in `ecosystem.config.js` — confirm they're running (`pm2 status`):

| App | Does | Cadence |
|---|---|---|
| `storefront-outbox` | Drains the email/SMS queue (reputation-safe) | every 3 min |
| `storefront-lifecycle` | Abandoned-cart / -session nudges | hourly |
| `storefront-subscriptions` | Bills subscribe-&-save | every 6h |
| `storefront-payout-reconcile` | Settles shipped orders' seller payouts | hourly |
| `storefront-weekly-report` | Emails sellers their weekly report | Mon 13:00 UTC |
| `storefront-demand` | AI demand curves + auto-restock | daily 10:00 |
| `storefront-autopilot` | Autonomous store-optimization runs | daily 11:00 |
| `storefront-adspend` | Pulls Google/Meta/Microsoft/Pinterest/TikTok/Snapchat spend → ROI | daily 09:30 |
| `chronos-forecaster` | Demand AI sidecar (port 5050) | always-on |

`pm2 reload ecosystem.config.js` after env changes.

---

## 5. Domains

- **Subdomains:** wildcard DNS `*.pythias.store` → the storefront app; `STOREFRONT_BASE_DOMAIN=pythias.store`.
- **Custom domains:** Cloudflare for SaaS (custom hostnames + SSL) — the site model stores the CF
  hostname id; verify the onboarding flow points at your CF zone.

---

## 6. Merchant of Record / tax (back-office, not just code)

The code collects + reports tax and owns disputes; going live as MoR also needs the **business side**:
- **Sales-tax registration** in the states you have nexus, and a remittance process (the MoR tax report
  is filing-ready; remittance itself is a back-office task).
- MoR entity named in the **statement descriptor** (step 2).
- Optional: a "sold by X · merchant of record Pythias" disclosure at checkout (not built yet).

---

## 7. Channels (optional at launch)

Product syndication works **day one via the universal feed** (no credentials). OAuth push + ad-spend
ROI per channel needs the per-channel apps/keys — see **`docs/channel-syndication-setup.md`** and
`apps/pythias-platform/.env.channels.example`. The approvals (Google/Meta/Pinterest) take weeks, so
start them early; you're never blocked because the feed covers every channel meanwhile.

---

## Tools

- **Readiness check** — `node apps/pythias-platform/scripts/goLiveCheck.js` reads both apps'
  `.env.local` and prints ✓/✗ per area + a READY / NOT READY verdict (exit 0 when all required set).
- **One-time index migration** (required after deploying multi-store) — drops the stale UNIQUE index
  on `StorefrontSite.orgId` so an org can own multiple stores:
  ```bash
  curl -X POST http://127.0.0.1:3010/api/internal/storefront/migrate-indexes \
    -H "x-pythias-internal-key: $PYTHIAS_INTERNAL_KEY"
  ```
  Idempotent — safe to run more than once.

## Launch checklist

- [ ] `node scripts/goLiveCheck.js` → **READY**
- [ ] Index migration run once (drops the stale `orgId` unique index → multi-store works)
- [ ] Storefront plan prices set (`storefrontPlans.js` or `*_PRICE_ID`s) — currently $49/$149/$399, included 1/3/5, extras $25/$75/$200
- [ ] **Marketplace** Stripe: live keys, webhook (3 events), Connect + Tax enabled, statement descriptor
- [ ] **Apple Pay** domain registered for each live storefront domain; **PayPal** enabled (express wallets)
- [ ] **Platform** Stripe: live keys, billing webhook (4 events)
- [ ] Subscribe to a plan end-to-end on a test org → menu unlocks → place a test order → seller payout settles
- [ ] All `.env.local` filled (both apps); `PYTHIAS_INTERNAL_KEY` matches across apps
- [ ] Resend domain verified + `STOREFRONT_EMAIL_FROM`; Twilio number/messaging service live
- [ ] Wasabi bucket + public base reachable (review photo upload returns a URL, not 503)
- [ ] `ANTHROPIC_API_KEY` set (concierge, AI campaigns/listings, autopilot)
- [ ] PM2 crons all green (`pm2 status`); chronos sidecar up
- [ ] Wildcard DNS + custom-domain (Cloudflare for SaaS) verified
- [ ] Sales-tax registration / remittance process in place (MoR)
- [ ] (If using channels) per-channel keys set + at least the universal feed validated

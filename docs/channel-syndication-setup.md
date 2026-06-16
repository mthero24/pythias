# Channel Syndication — Setup Guide

How to turn on **Sales Channels** for storefronts: list products on Google, Microsoft/Bing, Meta,
Pinterest, TikTok, etc. There are two paths and you can use both:

1. **Universal feed** — works **today, zero setup**. Every store exposes a Google-spec product feed
   at `https://<store-domain>/feed/products.xml`. Sellers paste that URL into any channel's
   "scheduled feed" importer. No OAuth, no credentials. This already covers Google, Bing, Meta,
   Pinterest, and TikTok via their feed importers.
2. **OAuth push** — real-time, one-click. The seller connects the channel account and Pythias pushes
   the catalog via the channel's API (and later syncs status, fixes disapprovals, reports ROI). This
   is what the steps below configure. **Google Merchant Center is the first OAuth channel.**

> The Sales Channels page lives at `/<slug>/channels` (platform) and `/admin/store/channels`
> (premier). The universal feed shows there with a copy button regardless of OAuth setup.

---

## Getting credentials & sandbox access (start here)

Most of these platforms **don't have a classic sandbox** — you register a **developer app**, then test
against **your own real account in development/test mode** (no charges, limited audience) before
requesting production/standard access. The two exceptions (Google Ads, Microsoft) have true sandboxes
/ test accounts. Per channel:

| Channel | Where to register | What you get → env var | Test/sandbox | Approval to go live |
|---|---|---|---|---|
| **Google Merchant** | [console.cloud.google.com](https://console.cloud.google.com) → enable **Content API for Shopping** → OAuth client | `GOOGLE_OAUTH_CLIENT_ID/SECRET` | No sandbox — use a real (even unverified) Merchant Center; add yourself as a **test user** on the consent screen | OAuth verification (sensitive `content` scope) |
| **Google Ads** (spend) | [Google Ads → API Center](https://ads.google.com) | `GOOGLE_ADS_DEVELOPER_TOKEN` (+ `GOOGLE_ADS_LOGIN_CUSTOMER_ID`) | **Test manager account** works with a basic-access token immediately | Apply for **Basic/Standard** dev-token access for real accounts |
| **Microsoft/Bing** | [Microsoft Advertising](https://ads.microsoft.com) → register an app in **Entra/Azure**; request a **Developer Token** | `MICROSOFT_OAUTH_CLIENT_ID/SECRET`, `MICROSOFT_ADS_DEVELOPER_TOKEN`, `MICROSOFT_ADS_CUSTOMER_ID`, `TIKTOK_BC_ID`(n/a) | **Real sandbox** — universal sandbox dev token **`BBD37VB98`**, separate accounts at [signupsandbox](https://signupsandbox.bingads.microsoft.com), **different endpoints** (see below) | Get the dev token approved for production |
| **Meta** | [developers.facebook.com](https://developers.facebook.com) → Business app → Marketing/Commerce | `META_OAUTH_CLIENT_ID/SECRET` | **Dev mode** — test against your own catalog/ad account + test users | **App Review** for `catalog_management`, `business_management`, `ads_read` |
| **Pinterest** | [developers.pinterest.com](https://developers.pinterest.com) | `PINTEREST_OAUTH_CLIENT_ID/SECRET` | App starts in **trial access** (your own account only) | Request **standard/scaled** access |
| **TikTok** | [business-api.tiktok.com](https://business-api.tiktok.com) → app + Business Center | `TIKTOK_APP_ID/SECRET`, `TIKTOK_BC_ID` | Dev/test against your own BC + catalog | App review for production scopes |
| **Snapchat** | [business.snapchat.com](https://business.snapchat.com) → Business Manager → OAuth app | `SNAPCHAT_OAUTH_CLIENT_ID/SECRET` | Works on your own org/ad account | Org approval for scale |
| **X / Reddit** | — (feed-based) | none | Add the feed URL in their Shopping/Catalog manager | n/a |

### Microsoft sandbox — endpoint overrides
The Microsoft sandbox uses **different hosts**, so point the integration at them with env vars (the
code reads these; defaults are production):
```bash
MICROSOFT_AUTH_URL=https://login.windows-ppe.net/consumers/oauth2/v2.0/authorize
MICROSOFT_TOKEN_URL=https://login.windows-ppe.net/consumers/oauth2/v2.0/token
MICROSOFT_CONTENT_BASE=https://content.api.sandbox.bingads.microsoft.com
MICROSOFT_REPORTING_URL=https://reporting.api.sandbox.bingads.microsoft.com/Api/Advertiser/Reporting/v13/ReportingService.svc
MICROSOFT_ADS_DEVELOPER_TOKEN=BBD37VB98
```

### Fastest way to validate everything
1. Create the developer apps above (start in dev/test/trial mode — no review needed for your own assets).
2. Put the client id/secret (+ dev tokens) in `apps/pythias-platform/.env.local`, `pm2 reload`.
3. On the Sales Channels page, **Connect** each, set the catalog/account id, **Sync now**, and watch the
   result — the doc-modeled batch shapes (Bing/Meta/Pinterest/TikTok/Snapchat) and the Bing SOAP/ZIP
   flow are the bits to confirm here.
4. Request production/standard access + app review once a channel works.

---

## Part 1 — Google Merchant Center (OAuth push)

### Prerequisites
- A **Google Merchant Center** account (the seller's, or a Pythias MCA/multi-client account that
  contains sub-accounts per seller). https://merchants.google.com
- A **Google Cloud** project to host the OAuth client. https://console.cloud.google.com

### Step 1 — Enable the Content API
In the Google Cloud project → **APIs & Services → Library** → search **"Content API for Shopping"**
→ **Enable**.

### Step 2 — Configure the OAuth consent screen
**APIs & Services → OAuth consent screen**:
- User type: **External** (or Internal if all sellers are in your Google Workspace).
- App name, support email, logo, homepage, privacy-policy URL.
- **Scopes** → add `https://www.googleapis.com/auth/content` (this is a **sensitive** scope).
- Because the scope is sensitive, Google requires **app verification** before non-test users can
  connect. Add your sellers as **Test users** while in testing, and submit for verification before
  going live broadly.

### Step 3 — Create the OAuth client
**APIs & Services → Credentials → Create credentials → OAuth client ID**:
- Application type: **Web application**.
- **Authorized redirect URIs** — add one per app/domain that sellers connect from:

  | Environment | Redirect URI |
  |---|---|
  | Platform (prod) | `https://<platform-domain>/api/storefront/channels/google/callback` |
  | Premier (prod)  | `https://<premier-domain>/api/storefront/channels/google/callback` |
  | Local platform  | `http://localhost:3010/api/storefront/channels/google/callback` |
  | Local premier   | `http://localhost:3000/api/storefront/channels/google/callback` |

  The redirect URI is derived automatically from the request origin — it must match here **exactly**
  (scheme + host + path), so add every origin sellers will use.
- Copy the **Client ID** and **Client secret**.

### Step 4 — Set environment variables
Add to each app's environment (platform `.env.local`, and premier if sellers connect there):

```bash
GOOGLE_OAUTH_CLIENT_ID=xxxxxxxx.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=xxxxxxxx

# Encrypts OAuth tokens at rest (AES-256-GCM). Optional but recommended in prod.
# Any string; if unset, derived from NEXTAUTH_SECRET. Don't change it after tokens are stored
# (existing tokens become undecryptable and sellers must reconnect).
CHANNEL_TOKEN_KEY=<random-32+-char-secret>

# Used to sign the OAuth state param (CSRF). Usually already set for next-auth.
NEXTAUTH_SECRET=<already-set>

# Used to build the public feed URL + product links if a store has no custom domain.
STOREFRONT_BASE_DOMAIN=pythias.store
```

Restart / `pm2 reload` the app after setting these.

### Step 5 — Seller connects
On the Sales Channels page the seller clicks **Connect** next to Google Merchant Center →
Google consent screen → back to the page showing **Connected · <merchantId>**. Then **Sync now**
pushes the catalog. The last sync result (synced / failed counts) is shown on the card.

---

## How it works (under the hood)

- **Token store**: `StorefrontChannelConnection` (one row per org+channel). Access + refresh tokens
  are **encrypted** with AES-256-GCM before saving.
- **OAuth flow**: `…/channels/google/connect` redirects to Google with an **HMAC-signed `state`**
  (carrying orgId/channel/slug). The `…/callback` verifies the signature, exchanges the code, fetches
  the Merchant Center account id (`accounts/authinfo`), and stores the connection. Tokens auto-refresh
  when expired.
- **Sync**: `googleSyncProducts` reads the store's products, maps each variant to a Content API
  product (offerId=SKU, title, price, image, brand, gtin/identifier_exists, color/size, link to the
  store), and pushes them via `products/batch` (custombatch, chunked). Up to 2000 products per sync.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| **"Google OAuth is not configured"** on Connect | `GOOGLE_OAUTH_CLIENT_ID` not set in that app's env. |
| **`redirect_uri_mismatch`** on Google | The exact callback URL isn't in the OAuth client's Authorized redirect URIs (Step 3). |
| **"No Merchant Center account found"** on Sync | The Google login isn't linked to a Merchant Center account, or the Content API isn't enabled. |
| **Access blocked / unverified app** | Add the seller as a Test user, or complete OAuth verification (sensitive scope). |
| **"Token refresh failed — reconnect"** | Refresh token revoked/expired — seller reconnects (we request `access_type=offline` so a refresh token is issued on first consent). |
| Products **failed** in sync result | Usually missing GTIN/brand or image issues — check the error shown; Merchant Center → Products → Diagnostics has details. |

---

## Part 2 — Microsoft / Bing Merchant Center (OAuth push)

Microsoft uses the **same Content-API product shape** as Google, with Microsoft auth headers. Two
extra things vs Google: a **developer token** and a **Store ID** (Bing can't auto-discover it).

### Step 1 — Microsoft Advertising prerequisites
- A **Microsoft Advertising** account + a **Bing Merchant Center store** (note its **Store ID**).
- Request a **Developer Token** for the Microsoft Advertising API (Account → Developer settings).

### Step 2 — Register the OAuth app (Microsoft Entra / Azure)
https://portal.azure.com → **Microsoft Entra ID → App registrations → New registration**:
- Supported account types: multitenant (so any seller's Microsoft account can connect).
- **Redirect URI** (Web): `https://<platform-domain>/api/storefront/channels/microsoft/callback`
  (add the premier + localhost variants too, mirroring the Google table).
- **Certificates & secrets → New client secret** → copy the value.
- **API permissions** → add the **Microsoft Advertising** delegated permission (`msads.manage`).
- Copy the **Application (client) ID**.

### Step 3 — Environment variables
```bash
MICROSOFT_OAUTH_CLIENT_ID=<application-client-id>
MICROSOFT_OAUTH_CLIENT_SECRET=<client-secret-value>
MICROSOFT_ADS_DEVELOPER_TOKEN=<developer-token>
```

### Step 4 — Seller connects + sets Store ID
Seller clicks **Connect** on Microsoft → consent → back to the page. Then they enter their **Bing
Merchant Center Store ID** in the field on the card (required — Bing's Content API targets a specific
store), and click **Sync now**.

---

## Part 3 — Meta (Facebook & Instagram) catalog (OAuth push)

Meta uses the Graph API. The seller connects, then enters their **Meta Catalog ID**; **Sync now**
pushes via the catalog `items_batch` endpoint.

### Setup (Meta app)
1. Create a **Meta App** at https://developers.facebook.com (Business type) → add **Marketing API** /
   **Commerce** products.
2. **Facebook Login → Settings → Valid OAuth Redirect URIs**:
   `https://<platform-domain>/api/storefront/channels/meta/callback` (+ premier + localhost).
3. Request scopes `catalog_management` + `business_management` (needs **App Review** before
   non-test users can grant them; add sellers as test users while in development).
4. Copy the **App ID** + **App Secret**:
   ```bash
   META_OAUTH_CLIENT_ID=<app-id>
   META_OAUTH_CLIENT_SECRET=<app-secret>
   ```
5. Seller clicks **Connect** → consents → enters their **Meta Catalog ID** (from Commerce Manager) →
   **Sync now**. (Meta's OAuth returns no refresh token; we swap the short-lived token for a ~60-day
   long-lived one automatically — the seller reconnects when it lapses.)

> The `items_batch` push is async (Meta returns handles) and modeled on the documented shape —
> validate once live, like Bing.

## Part 4 — X (Twitter) — Ads Catalog API (OAuth 1.0a)

X's Ads Catalog API uses **OAuth 1.0a** (3-legged + per-request HMAC-SHA1 signing) — implemented
natively (no shared OAuth2 flow). On **Connect**, Pythias runs request-token → authorize →
access-token, stores the user token + secret (encrypted), then **Sync now** auto-finds/creates the
user's product catalog and batch-upserts products.

1. [developer.x.com](https://developer.x.com) → an app with **Ads API** access (early-access; request it).
2. Enable **OAuth 1.0a** (User authentication settings), type **Web App**, and set the callback:
   `https://<platform-domain>/api/storefront/channels/x/callback`.
3. Copy the app's **API Key** + **API Secret**:
   ```bash
   X_CONSUMER_KEY=<api-key>
   X_CONSUMER_SECRET=<api-secret>
   ```
> The catalog product batch shape is modeled on the docs — validate once live. The universal feed
> (Scheduled Feed in X Shopping Manager) remains a zero-OAuth fallback.

## Part 5 — Pinterest (OAuth push)

Pinterest v5 slots into the same OAuth foundation (Basic-auth token endpoint, refresh tokens). No
account id needed — it uses the account's default catalog.

1. Create an app at https://developers.pinterest.com → enable **Catalogs** (scopes
   `catalogs:read`, `catalogs:write`). Apps start in **trial** access; request **standard/scaled
   access** for production.
2. **Redirect URI**: `https://<platform-domain>/api/storefront/channels/pinterest/callback`
   (+ premier + localhost).
3. Env:
   ```bash
   PINTEREST_OAUTH_CLIENT_ID=<app-id>
   PINTEREST_OAUTH_CLIENT_SECRET=<app-secret>
   ```
4. Seller clicks **Connect** → **Sync now** pushes via `POST /v5/catalogs/items/batch`
   (operation `UPSERT`, async — returns a `batch_id`).

## Part 6 — TikTok (OAuth push, feed-URL catalog)

TikTok's Business API is non-standard but fits via channel-specific handling. It ingests products
through a **feed file URL** — so we hand it our universal feed URL after connecting.

1. Create an app at https://business-api.tiktok.com → request the **Catalog** capability + a
   **Business Center**. Note the **Business Center ID** and the **Catalog ID**.
2. **Redirect URI**: `https://<platform-domain>/api/storefront/channels/tiktok/callback`.
3. Env:
   ```bash
   TIKTOK_APP_ID=<app-id>
   TIKTOK_APP_SECRET=<app-secret>
   TIKTOK_BC_ID=<business-center-id>   # one BC for the platform; per-seller BC is a future enhancement
   ```
4. Seller clicks **Connect** (TikTok returns `auth_code`; token is exchanged via JSON and **never
   expires**), enters their **TikTok Catalog ID**, then **Sync now** submits the feed URL to
   `catalog/product/upload/`. API calls use the **Access-Token** header.

> TikTok's catalog upload endpoint/params are modeled on the docs — validate once live.

## Part 7 — Snapchat (OAuth push)

Standard OAuth2 — fits the foundation with no special handling.

1. Create an app in the **Snap Business Manager** → request the **Marketing API** (scope
   `snapchat-marketing-api`) and create a **catalog** (note its **Catalog ID**).
2. **Redirect URI**: `https://<platform-domain>/api/storefront/channels/snapchat/callback`.
3. Env:
   ```bash
   SNAPCHAT_OAUTH_CLIENT_ID=<client-id>
   SNAPCHAT_OAUTH_CLIENT_SECRET=<client-secret>
   ```
4. Seller clicks **Connect** → enters their **Snapchat Catalog ID** → **Sync now** pushes via
   `POST adsapi.snapchat.com/v1/catalogs/{id}/products`. (Validate the batch shape once live.)

## Channels that are NOT product-feed channels

- **Reddit** — Shopping / Dynamic Product Ads ingest a **CSV/XML feed** (Reddit Ads → Catalogs). The
  universal feed covers it today; shown as **"Via feed"**. Native Reddit Ads API push (OAuth2) is roadmap.
- **Roku** — *not* a product-feed channel. Roku **shoppable TV ads** pull the catalog through a
  **commerce integration** (Roku's Shopify app + **Roku Pay** checkout), and the **Roku Ads API** is
  campaign-management/measurement only — there's no generic product-feed/catalog endpoint to push to.
  The Pythias equivalent would be a future **Pythias↔Roku commerce integration** (Roku Pay checkout
  handoff), which is a deeper build than feed syndication — tracked separately, not in this feature.

## AI-optimized listings (per channel)

Each connected channel has an **✨ AI-optimize** button. It rewrites your product titles and
descriptions to that channel's shopping-feed best practices (keyword-rich titles, factual
benefit-led descriptions, no promo fluff) and stores them as per-channel overrides. The next
**Sync now** pushes the optimized copy to that channel; your on-site product pages are unchanged.

## Closed-loop ROI (ad spend → revenue → profit)

The **Channel ROI** table shows, per channel: **revenue attributed** (from your UTM-tagged links —
tag channel links with `utm_source=google` / `bing` / etc.), **estimated profit** (revenue × your
store margin from true-profit analytics), **ad spend**, **ROAS**, and **profit after ads**.

- **Google ad spend auto-pulls** (see below). **Microsoft/Bing** and other channels are logged
  manually via the **Log ad spend** form for now.
- For attribution to work, make sure your ad/channel destination URLs carry UTM parameters; the
  storefront analytics tracker already captures `utm_source` on landing.

### Auto-pull Google Ads spend
Once Google is connected, the seller enters their **Google Ads Customer ID** on the Google card and
clicks **Sync ad spend** (and a daily cron then keeps it fresh). Setup:

1. **Broadened OAuth scope** — Google connections now request the `…/auth/adwords` scope alongside
   `…/auth/content`. **Sellers who connected before this change must reconnect** to grant it (the
   sync returns a clear "reconnect Google" error otherwise).
2. **Google Ads developer token** — apply in the Google Ads UI (API Center). Set:
   ```bash
   GOOGLE_ADS_DEVELOPER_TOKEN=<developer-token>
   # If your tokens are issued under a manager (MCC) account, also set:
   GOOGLE_ADS_LOGIN_CUSTOMER_ID=<mcc-customer-id-digits>
   ```
3. The seller enters their **Ads Customer ID** (the 10-digit account number) on the card.
4. **Daily cron**: PM2 app `storefront-adspend` (`scripts/runAdSpendSync.js`, 09:30 UTC) calls
   `POST /api/internal/channels/sync-adspend` → pulls the last 30 days of `cost_micros` by date via
   GAQL and upserts it as `source: google_ads` (idempotent — re-runs replace, never double-count).

### Auto-pull Meta ad spend
Once Meta is connected (the scope now includes **`ads_read`** — sellers connected before this change
**reconnect** to grant it), the seller enters their **Meta Ad Account ID** (`act_…`) on the Meta card
and clicks **Sync ad spend**; the daily cron keeps it fresh. No extra env — it uses the Meta OAuth
token + the Marketing API **Insights** endpoint (`/{act_id}/insights?fields=spend&time_increment=1`).

### Auto-pull Microsoft/Bing ad spend
Bing has **no** synchronous spend endpoint — it uses the async **Reporting API v13** (SOAP: submit →
poll → download a ZIP'd CSV). We implement that flow end-to-end (hand-rolled SOAP + a minimal ZIP
extractor). Setup:
```bash
MICROSOFT_ADS_DEVELOPER_TOKEN=<dev-token>      # same token as the Bing catalog
MICROSOFT_ADS_CUSTOMER_ID=<bing-customer-id>   # platform-level (manager/customer id)
```
The seller enters their **Microsoft Ads Account ID** on the Bing card → **Sync ad spend** runs an
`AccountPerformanceReport` (daily Spend) for the last 30 days. The daily cron (`storefront-adspend`)
now pulls **Google + Meta + Microsoft**.

> ⚠️ The SOAP envelopes + ZIP parsing are coded to the documented v13 shape but **untested without a
> live Bing account** — validate before relying on it. The report poll can take ~30–60s.

> Don't both auto-sync **and** manually log spend for the same channel/day — they'd double-count.

### Auto-pull Pinterest / TikTok / Snapchat ad spend
All three use their reporting endpoint via the **same OAuth connection** — set the ads account id on
the channel card, click **Sync ad spend** (the daily cron keeps it fresh):
- **Pinterest** — v5 `ad_accounts/{id}/analytics` (`SPEND_IN_DOLLAR`, daily). Scope now includes
  **`ads:read`** → sellers connected before **reconnect**. Set the **Pinterest Ad Account ID**.
- **TikTok** — `report/integrated/get` (advertiser daily `spend`). Set the **TikTok Advertiser ID**.
- **Snapchat** — `adaccounts/{id}/stats` (daily `spend`, micro-currency ÷1e6). Set the **Snapchat Ad
  Account ID**.

The daily `storefront-adspend` cron now sweeps **Google, Meta, Microsoft, Pinterest, TikTok, Snapchat**.

## Validating the doc-modeled shapes

Several push payloads (Bing/Meta/Pinterest/TikTok/Snapchat batches, X catalog) are coded to the
published docs but **need a live account to confirm**. Two tools:
1. **Preview (dry-run)** — each connected channel's card has a **Preview** button showing the *exact*
   request body + endpoint that would be sent (built from a real product), with no call made. Diff it
   against the provider's API reference, or paste into Postman with a real token.
2. **Sync now** surfaces the provider's **error message verbatim** — connect a real/test account, sync,
   and the first API error tells you what to fix. That *is* the live-validation loop (Pythias can't run
   it for you without your account credentials).

---

## Adding more channels later

The registry is pluggable. To wire Microsoft/Bing, Meta, Pinterest, or TikTok, add an entry to
`CHANNELS` in `packages/backend/server/storefrontServices.js` (authUrl, tokenUrl, scope,
clientIdEnv/clientSecretEnv) and a per-channel push function. The generic connect/callback/refresh
flow and the dashboard handle the rest. Each new channel also needs its own app registration +
OAuth client + (often) app review on that platform.

**Credential/approval reality:** Meta, Pinterest, TikTok, Snapchat all require app registration and
review plus per-seller OAuth; Google and Microsoft need OAuth + a Merchant Center account. The
**universal feed works on all of them today with zero approval** — lead with that, add OAuth push
per channel as approvals land.

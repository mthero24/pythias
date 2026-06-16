// Go-live readiness check — validates the env config the storefront needs to launch.
// Run: node apps/pythias-platform/scripts/goLiveCheck.js
// Reads both apps' .env.local; reports ✓ (set) / ✗ (missing) per area + a READY / NOT READY summary.
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

const ROOT = path.resolve(__dirname, "../../..");
const readEnv = (p) => { try { return dotenv.parse(fs.readFileSync(p)); } catch { return null; } };
const sf = readEnv(path.join(ROOT, "apps/pythias-storefront/.env.local")) || {};
const pf = readEnv(path.join(ROOT, "apps/pythias-platform/.env.local")) || {};

const has = (env, ...keys) => keys.some((k) => env[k] && String(env[k]).trim());

// [label, present, required]
const AREAS = {
    "Storefront — core": [
        ["PLATFORM_MONGO_URL", has(sf, "PLATFORM_MONGO_URL"), true],
        ["STOREFRONT_BASE_DOMAIN", has(sf, "STOREFRONT_BASE_DOMAIN"), true],
        ["STOREFRONT_JWT_SECRET", has(sf, "STOREFRONT_JWT_SECRET"), true],
        ["PYTHIAS_INTERNAL_KEY", has(sf, "PYTHIAS_INTERNAL_KEY"), true],
        ["PLATFORM_INTERNAL_BASE", has(sf, "PLATFORM_INTERNAL_BASE"), true],
    ],
    "Stripe — marketplace (storefront app)": [
        ["STOREFRONT_STRIPE_SECRET", has(sf, "STOREFRONT_STRIPE_SECRET"), true],
        ["STOREFRONT_STRIPE_PUBLISHABLE", has(sf, "STOREFRONT_STRIPE_PUBLISHABLE"), true],
        ["STOREFRONT_STRIPE_WEBHOOK_SECRET", has(sf, "STOREFRONT_STRIPE_WEBHOOK_SECRET"), true],
    ],
    "Stripe — platform billing (platform app)": [
        ["stripeSecret / STRIPE_SECRET_KEY", has(pf, "stripeSecret", "STRIPE_SECRET_KEY"), true],
        ["STRIPE_WEBHOOK_SECRET", has(pf, "STRIPE_WEBHOOK_SECRET"), true],
        ["NEXTAUTH_SECRET", has(pf, "NEXTAUTH_SECRET"), true],
    ],
    "Email + SMS": [
        ["RESEND_API_KEY", has(sf, "RESEND_API_KEY"), true],
        ["STOREFRONT_EMAIL_FROM", has(sf, "STOREFRONT_EMAIL_FROM"), true],
        ["TWILIO (SID+token+from/messaging)", has(sf, "TWILIO_ACCOUNT_SID") && has(sf, "TWILIO_AUTH_TOKEN") && has(sf, "TWILIO_FROM_NUMBER", "TWILIO_MESSAGING_SERVICE_SID"), false],
    ],
    "Review photo uploads (Wasabi)": [
        ["WASABI (key+secret+bucket+endpoint+base)", has(sf, "WASABI_ACCESS_KEY") && has(sf, "WASABI_SECRET_KEY") && has(sf, "STOREFRONT_UPLOAD_BUCKET") && has(sf, "WASABI_ENDPOINT") && has(sf, "WASABI_PUBLIC_BASE"), false],
    ],
    "AI features": [
        ["ANTHROPIC_API_KEY (storefront)", has(sf, "ANTHROPIC_API_KEY"), false],
        ["ANTHROPIC_API_KEY (platform)", has(pf, "ANTHROPIC_API_KEY"), false],
    ],
    "Channels (optional at launch — universal feed works without these)": [
        ["CHANNEL_TOKEN_KEY", has(pf, "CHANNEL_TOKEN_KEY"), false],
        ["Google", has(pf, "GOOGLE_OAUTH_CLIENT_ID"), false],
        ["Meta", has(pf, "META_OAUTH_CLIENT_ID"), false],
        ["Pinterest", has(pf, "PINTEREST_OAUTH_CLIENT_ID"), false],
        ["TikTok", has(pf, "TIKTOK_APP_ID"), false],
        ["Snapchat", has(pf, "SNAPCHAT_OAUTH_CLIENT_ID"), false],
    ],
};

const GREEN = "\x1b[32m", RED = "\x1b[31m", YELLOW = "\x1b[33m", DIM = "\x1b[2m", RESET = "\x1b[0m";
let missingRequired = 0, missingOptional = 0;

console.log(`\n${"═".repeat(60)}\n  Storefront Go-Live Readiness\n${"═".repeat(60)}`);
if (!Object.keys(sf).length) console.log(`${YELLOW}  ⚠ apps/pythias-storefront/.env.local not found${RESET}`);
if (!Object.keys(pf).length) console.log(`${YELLOW}  ⚠ apps/pythias-platform/.env.local not found${RESET}`);

for (const [area, checks] of Object.entries(AREAS)) {
    console.log(`\n  ${area}`);
    for (const [label, ok, required] of checks) {
        if (!ok) { required ? missingRequired++ : missingOptional++; }
        const mark = ok ? `${GREEN}✓${RESET}` : required ? `${RED}✗${RESET}` : `${YELLOW}○${RESET}`;
        const tag = ok ? "" : required ? `${RED} (required)${RESET}` : `${DIM} (optional)${RESET}`;
        console.log(`    ${mark} ${label}${tag}`);
    }
}

// Cross-app: the internal key must match
const keyMatch = has(sf, "PYTHIAS_INTERNAL_KEY") && has(pf, "PYTHIAS_INTERNAL_KEY") && sf.PYTHIAS_INTERNAL_KEY === pf.PYTHIAS_INTERNAL_KEY;
console.log(`\n  Cross-app`);
console.log(`    ${keyMatch ? GREEN + "✓" : RED + "✗"}${RESET} PYTHIAS_INTERNAL_KEY matches across apps${keyMatch ? "" : RED + " (required)" + RESET}`);
if (!keyMatch) missingRequired++;

console.log(`\n${"─".repeat(60)}`);
if (missingRequired === 0) {
    console.log(`  ${GREEN}READY${RESET} — all required config present.${missingOptional ? ` ${missingOptional} optional item(s) unset.` : ""}`);
    console.log(`  ${DIM}Don't forget: run the index migration once, enable Stripe Connect + Tax, register the webhooks, set up DNS, and complete tax registration (see docs/go-live.md).${RESET}`);
} else {
    console.log(`  ${RED}NOT READY${RESET} — ${missingRequired} required item(s) missing (see ✗ above).`);
}
console.log(`${"─".repeat(60)}\n`);
process.exit(missingRequired === 0 ? 0 : 1);

// Generate ONE store's app icon + splash from its brand (logo + colors), pulled from the live
// /api/app/config. Run before `eas build` (build-store.sh calls it). Outputs assets/icon.png (1024²,
// opaque — App Store requirement) + assets/splash.png (logo on transparent, Expo centers it on the
// EXPO_PUBLIC_THEME_BG splash background). Falls back to the store's initial on a brand-colored tile
// when there's no logo. sharp is a build-time devDependency — it is NOT bundled into the app.
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const APP_KEY = process.env.EXPO_PUBLIC_APP_KEY;
const API_BASE = process.env.EXPO_PUBLIC_API_BASE || "https://store.pythiastechnologies.com";
const ICON_BG = process.env.EXPO_PUBLIC_ICON_BG;   // optional override
const ASSETS = path.join(__dirname, "..", "assets");

function hexToRgb(hex, fallback) {
    const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || "").trim());
    if (!m) return fallback;
    const n = parseInt(m[1], 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

async function fetchBuf(url) {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`HTTP ${r.status} for ${url}`);
    return Buffer.from(await r.arrayBuffer());
}

(async () => {
    if (!APP_KEY) { console.error("generate-assets: EXPO_PUBLIC_APP_KEY is required"); process.exit(1); }

    const cfg = await (await fetch(`${API_BASE}/api/app/config`, { headers: { "x-pythias-app-key": APP_KEY } })).json();
    if (cfg?.error) { console.error(`generate-assets: config error (${cfg.error})`); process.exit(1); }

    const name = cfg?.store?.name || "Store";
    const logoUrl = cfg?.store?.logoUrl || "";
    const bgHex = ICON_BG || cfg?.theme?.primary || cfg?.theme?.accent || "#111827";
    const bg = { ...hexToRgb(bgHex, { r: 17, g: 24, b: 39 }), alpha: 1 };
    fs.mkdirSync(ASSETS, { recursive: true });

    let logo = null;
    if (logoUrl) { try { logo = await fetchBuf(logoUrl); } catch (e) { console.warn(`generate-assets: couldn't load logo (${e.message}); using initial`); } }

    // ── icon.png — 1024×1024 opaque ──
    if (logo) {
        const inner = await sharp(logo).resize(720, 720, { fit: "inside" }).png().toBuffer();
        await sharp({ create: { width: 1024, height: 1024, channels: 4, background: bg } })
            .composite([{ input: inner, gravity: "center" }]).png().toFile(path.join(ASSETS, "icon.png"));
    } else {
        const initial = (name.trim()[0] || "S").toUpperCase().replace(/[<&>]/g, "");
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024"><rect width="1024" height="1024" fill="${bgHex}"/><text x="512" y="512" font-family="Arial,Helvetica,sans-serif" font-size="520" font-weight="700" fill="#ffffff" text-anchor="middle" dominant-baseline="central">${initial}</text></svg>`;
        await sharp(Buffer.from(svg)).png().toFile(path.join(ASSETS, "icon.png"));
    }

    // ── splash.png — logo on transparent (Expo composites it on EXPO_PUBLIC_THEME_BG) ──
    if (logo) {
        const inner = await sharp(logo).resize(840, 840, { fit: "inside" }).png().toBuffer();
        await sharp({ create: { width: 1242, height: 1242, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
            .composite([{ input: inner, gravity: "center" }]).png().toFile(path.join(ASSETS, "splash.png"));
    } else {
        fs.copyFileSync(path.join(ASSETS, "icon.png"), path.join(ASSETS, "splash.png"));
    }

    console.log(`generate-assets: wrote icon.png + splash.png for "${name}" (bg ${bgHex}${logo ? ", logo" : ", initial fallback"})`);
})().catch((e) => { console.error("generate-assets failed:", e.message); process.exit(1); });

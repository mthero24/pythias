import { NextResponse } from "next/server";

// 301/308 old-site URLs to the new structure (built by the AI link migrator → site.redirects).
// Cost-conscious: the per-store map is cached in-process for 5 min, so bots hitting old URLs cause at
// most ~one tiny lookup per store every few minutes — not a DB hit per request.
const cache = new Map();   // host -> { map, exp }

async function getMap(origin, host) {
    const hit = cache.get(host);
    if (hit && hit.exp > Date.now()) return hit.map;
    let map = {};
    try {
        const res = await fetch(`${origin}/api/redirect-map?host=${encodeURIComponent(host)}`);
        if (res.ok) map = await res.json();
    } catch { /* ignore */ }
    cache.set(host, { map, exp: Date.now() + 300000 });
    return map;
}

export async function middleware(req) {
    if (req.method !== "GET") return NextResponse.next();
    const { pathname, origin } = req.nextUrl;
    const host = req.headers.get("host") || "";
    if (!host) return NextResponse.next();

    const map = await getMap(origin, host);
    if (map && Object.keys(map).length) {
        const key = pathname.replace(/\/+$/, "") || "/";
        const to = map[key] ?? map[pathname];
        if (to && to !== pathname) return NextResponse.redirect(new URL(to, origin), 308);
    }
    return NextResponse.next();
}

// Skip assets, API, and the SEO files (let them serve directly).
export const config = {
    matcher: ["/((?!_next/|api/|favicon.ico|robots.txt|sitemap.xml|sitemap).*)"],
};

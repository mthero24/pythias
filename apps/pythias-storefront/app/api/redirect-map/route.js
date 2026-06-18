export const dynamic = "force-dynamic";
import { resolveSite } from "@/lib/resolveSite";

// Tiny per-store redirect map for the middleware (old path -> new path). Short cache; middleware also
// caches it in-process, so this is hit at most ~once per store every few minutes.
export async function GET(req) {
    const host = new URL(req.url).searchParams.get("host") || req.headers.get("host");
    const site = await resolveSite(host).catch(() => null);
    const map = {};
    for (const r of (site?.redirects || [])) if (r?.from && r?.to) map[r.from] = r.to;
    return Response.json(map, { headers: { "Cache-Control": "public, max-age=120" } });
}

export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";

// Same-origin image proxy for the design studio. The garment/art CDNs don't reliably send CORS
// headers, which TAINTS the Fabric canvas and makes toDataURL() throw — breaking both the production
// artwork export and the cart mockup. Serving the bytes from our own origin keeps the canvas clean.
const ALLOWED = [/(^|\.)pythiastechnologies\.com$/i, /(^|\.)wasabisys\.com$/i];

export async function GET(req) {
    const u = req.nextUrl.searchParams.get("u");
    if (!u) return new NextResponse("missing u", { status: 400 });
    let url;
    try { url = new URL(u); } catch { return new NextResponse("bad url", { status: 400 }); }
    if (!ALLOWED.some((re) => re.test(url.hostname))) return new NextResponse("forbidden host", { status: 403 });

    const upstream = await fetch(url.toString(), { cache: "no-store" }).catch(() => null);
    if (!upstream || !upstream.ok) return new NextResponse("upstream error", { status: 502 });
    const buf = Buffer.from(await upstream.arrayBuffer());
    return new NextResponse(buf, {
        headers: {
            "Content-Type": upstream.headers.get("content-type") || "image/png",
            "Cache-Control": "public, max-age=86400",
            "Access-Control-Allow-Origin": "*",
        },
    });
}

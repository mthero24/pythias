export const dynamic = "force-dynamic";
import { resolveSite } from "@/lib/resolveSite";

// Tiny public endpoint so the client error boundary can show the store's custom error copy.
export async function GET(req) {
    const site = await resolveSite(req.headers.get("host")).catch(() => null);
    const sys = site?.system || {};
    return Response.json({ notFound: sys.notFound || null, error: sys.error || null });
}

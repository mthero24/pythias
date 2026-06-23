import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { cjGetProduct } from "@pythias/backend/server";

export const dynamic = "force-dynamic";

// POST /api/admin/sourcing/import  Body: { pid }
// Fetch the full normalized product (cost / suggested retail / UPC / weight / images / variants)
// to prefill the catalog-product creator. Does NOT save — the seller confirms price then saves.
export async function POST(req) {
    const token = await getToken({ req });
    if (!token?.orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { pid } = await req.json().catch(() => ({}));
    if (!pid) return NextResponse.json({ error: "pid is required" }, { status: 400 });
    try {
        return NextResponse.json({ product: await cjGetProduct(pid) });
    } catch (e) {
        return NextResponse.json({ error: e.message || "Import failed" }, { status: 500 });
    }
}

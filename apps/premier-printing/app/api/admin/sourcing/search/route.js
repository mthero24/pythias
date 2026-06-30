import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { cjSearch } from "@pythias/backend/server";

export const dynamic = "force-dynamic";

// POST /api/admin/sourcing/search { keyword, categoryId?, page?, pageSize? }
// Search the wholesale supplier (CJ) catalog. cjSearch needs no org scope.
export async function POST(req) {
    const token = await getToken({ req });
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { keyword, categoryId, page, pageSize } = await req.json().catch(() => ({}));
    try {
        return NextResponse.json(await cjSearch({ keyword, categoryId, page: page || 1, pageSize: pageSize || 20 }));
    } catch (e) {
        return NextResponse.json({ error: e.message || "Search failed" }, { status: 500 });
    }
}

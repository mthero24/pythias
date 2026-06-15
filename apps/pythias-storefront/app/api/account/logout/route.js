export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";

// POST /api/account/logout — tokens are stateless JWTs, so logout is client-side
// (discard the stored token). Endpoint exists for symmetry / future token revocation.
export async function POST() {
    return NextResponse.json({ error: false });
}

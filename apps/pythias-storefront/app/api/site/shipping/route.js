export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { resolveOrg } from "@/lib/resolveOrg";

// GET /api/site/shipping — public shipping config for the cart's free-shipping progress bar.
export async function GET(req) {
    const ctx = await resolveOrg(req);
    const s = ctx?.site?.shipping;
    if (!s) return NextResponse.json({ freeShipping: false, freeOverCents: 0, flatRateCents: 0 });
    return NextResponse.json({ freeShipping: !!s.freeShipping, freeOverCents: s.freeOverCents || 0, flatRateCents: s.flatRateCents || 0 });
}

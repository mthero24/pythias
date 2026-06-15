export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { StorefrontCustomer } from "@pythias/mongo";
import { resolveOrg } from "@/lib/resolveOrg";

// GET /api/account/verify?id=<customerId>&token=<token>
// Confirms a buyer's email and redirects them back to the storefront. Org-scoped + token-checked.
export async function GET(req) {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    const token = url.searchParams.get("token");
    const ctx = await resolveOrg(req);
    const dest = (ok) => NextResponse.redirect(new URL(`/account/login?verified=${ok ? 1 : 0}`, url.origin));

    if (!ctx || !id || !token || !mongoose.Types.ObjectId.isValid(id)) return dest(false);

    const customer = await StorefrontCustomer.findOne({ _id: id, orgId: ctx.orgId });
    if (!customer || customer.emailVerifyToken !== token) return dest(false);
    if (customer.emailVerifyExpires && customer.emailVerifyExpires < new Date()) return dest(false);

    customer.emailVerified = true;
    customer.emailVerifyToken = undefined;
    customer.emailVerifyExpires = undefined;
    await customer.save();
    return dest(true);
}

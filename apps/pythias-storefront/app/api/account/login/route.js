export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { StorefrontCustomer } from "@pythias/mongo";
import { resolveOrg } from "@/lib/resolveOrg";
import { verifyPassword, signToken, publicCustomer } from "@/lib/auth";

// POST /api/account/login — { email, password }
export async function POST(req) {
    const ctx = await resolveOrg(req);
    if (!ctx) return NextResponse.json({ error: "Unknown storefront" }, { status: 404 });

    const body = await req.json().catch(() => null);
    const email = body?.email?.toString().trim().toLowerCase();
    const password = body?.password?.toString();
    if (!email || !password) return NextResponse.json({ error: "Email and password are required" }, { status: 400 });

    const customer = await StorefrontCustomer.findOne({ orgId: ctx.orgId, email });
    if (!customer || !(await verifyPassword(password, customer.passwordHash))) {
        return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    customer.lastLoginAt = new Date();
    await customer.save();

    const token = signToken({ customerId: customer._id, orgId: ctx.orgId });
    return NextResponse.json({ error: false, token, customer: publicCustomer(customer) });
}

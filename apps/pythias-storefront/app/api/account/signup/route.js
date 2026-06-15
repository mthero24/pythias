export const dynamic = "force-dynamic";
import crypto from "crypto";
import { NextResponse } from "next/server";
import { StorefrontCustomer } from "@pythias/mongo";
import { resolveOrg } from "@/lib/resolveOrg";
import { hashPassword, signToken, clientIp, publicCustomer } from "@/lib/auth";
import { grantSignupBonus } from "@/lib/rewards";
import { enqueueWelcome, enqueueVerification } from "@/lib/emailFlows";

// Build a per-channel consent record with proof (when/where/IP + exact opt-in text).
function consentBlock(input, { source, ip }) {
    const out = {};
    for (const ch of ["email", "sms", "push"]) {
        const c = input?.[ch];
        if (!c) continue;
        out[ch] = { optedIn: !!c.optedIn, at: new Date(), source, ip, text: c.text || "" };
    }
    return out;
}

// POST /api/account/signup — { email, password, name?, phone?, consent?:{email,sms,push} }
export async function POST(req) {
    const ctx = await resolveOrg(req);
    if (!ctx) return NextResponse.json({ error: "Unknown storefront" }, { status: 404 });

    const body = await req.json().catch(() => null);
    const email = body?.email?.toString().trim().toLowerCase();
    const password = body?.password?.toString();
    if (!email || !password) return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    if (password.length < 8) return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });

    const existing = await StorefrontCustomer.findOne({ orgId: ctx.orgId, email });
    // A real account (has a password) already exists → conflict. A passwordless "lead" (from the
    // signup popup) can be claimed: set its password and promote it to a full account.
    if (existing && existing.passwordHash) return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });

    const verifyToken = crypto.randomBytes(24).toString("hex");
    const consent = consentBlock(body.consent, { source: "signup", ip: clientIp(req) });

    let customer;
    if (existing) {
        existing.passwordHash = await hashPassword(password);
        existing.name = body.name?.toString().trim() || existing.name;
        existing.phone = body.phone?.toString().trim() || existing.phone;
        existing.marketingConsent = { ...existing.marketingConsent?.toObject?.() ?? existing.marketingConsent, ...consent };
        existing.isLead = false;
        existing.emailVerifyToken = verifyToken;
        existing.emailVerifyExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        existing.lastLoginAt = new Date();
        await existing.save();
        customer = existing;
    } else {
        customer = await StorefrontCustomer.create({
            orgId: ctx.orgId,
            email,
            passwordHash: await hashPassword(password),
            name: body.name?.toString().trim() || undefined,
            phone: body.phone?.toString().trim() || undefined,
            marketingConsent: consent,
            emailVerified: false,
            emailVerifyToken: verifyToken,
            emailVerifyExpires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            lastLoginAt: new Date(),
        });
    }

    // Reward for creating an account (if the seller configured a signup bonus).
    await grantSignupBonus(customer, ctx.site).catch(() => {});

    // Thank-you + verification emails (queued; the outbox sends them).
    await enqueueWelcome(ctx.site, customer).catch(() => {});
    await enqueueVerification(ctx.site, customer).catch(() => {});

    const token = signToken({ customerId: customer._id, orgId: ctx.orgId });
    const fresh = await StorefrontCustomer.findById(customer._id).lean();
    return NextResponse.json({ error: false, token, customer: publicCustomer(fresh) }, { status: 201 });
}

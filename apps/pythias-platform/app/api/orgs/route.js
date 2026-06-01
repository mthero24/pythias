import { NextResponse } from "next/server";
import { Organization, PlatformUser } from "@pythias/mongo";
import { getLimits } from "@/lib/tiers";

export async function POST(req) {
    try {
        const { orgName, slug, billingEmail, tier, firstName, lastName, email, password } = await req.json();

        if (!orgName || !slug || !billingEmail || !email || !password) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }
        const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, "");
        if (!cleanSlug) return NextResponse.json({ error: "Invalid slug" }, { status: 400 });

        const validTier = ['starter', 'professional', 'business', 'scale'].includes(tier) ? tier : 'starter';

        const exists = await Organization.findOne({ slug: cleanSlug }).lean();
        if (exists) return NextResponse.json({ error: "That URL slug is already taken" }, { status: 409 });

        const emailExists = await PlatformUser.findOne({ email }).lean();
        if (emailExists) return NextResponse.json({ error: "An account with that email already exists" }, { status: 409 });

        const limits = getLimits(validTier);
        const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

        const org = await Organization.create({
            name: orgName,
            slug: cleanSlug,
            billingEmail,
            tier: validTier,
            status: 'trial',
            limits,
            trialEndsAt,
        });

        await PlatformUser.create({
            orgId: org._id,
            email,
            userName: email,
            password,
            firstName: firstName || "",
            lastName: lastName || "",
            role: 'owner',
        });

        await Organization.findByIdAndUpdate(org._id, { 'usage.usersTotal': 1 });

        return NextResponse.json({ ok: true, slug: cleanSlug }, { status: 201 });
    } catch (err) {
        console.error("[orgs/POST]", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

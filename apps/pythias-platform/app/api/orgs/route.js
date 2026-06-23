import { NextResponse } from "next/server";
import { Organization, PlatformUser } from "@pythias/mongo";
import { getLimits } from "@/lib/tiers";

const FC_TIERS = new Set(['starter', 'professional', 'business', 'scale']);
const CC_TIERS = new Set(['free', 'launch', 'growth', 'scale', 'enterprise']);
// Standalone Storefront Cloud tiers (mirror lib/storefrontPlans.js keys).
const SF_TIERS = new Set(['starter', 'pro', 'enterprise']);

const CC_LIMITS = {
    free:       { ordersPerMonth: -1, products: 50,    designs: 50,   integrations: 1, users: 1  },
    launch:     { ordersPerMonth: -1, products: 250,   designs: 100,  integrations: 3, users: 5  },
    growth:     { ordersPerMonth: -1, products: 1500,  designs: 500,  integrations: -1, users: 15 },
    scale:      { ordersPerMonth: -1, products: -1,    designs: -1,   integrations: -1, users: 50 },
    enterprise: { ordersPerMonth: -1, products: -1,    designs: -1,   integrations: -1, users: -1 },
};

// Standalone storefront sellers self-fulfill; products/designs are unlimited (the plans promise
// "unlimited products & collections"). `stores` mirrors includedStores in lib/storefrontPlans.js.
const SF_LIMITS = {
    starter:    { ordersPerMonth: -1, products: -1, designs: -1, integrations: 1,  users: 3,  stores: 1 },
    pro:        { ordersPerMonth: -1, products: -1, designs: -1, integrations: -1, users: 10, stores: 3 },
    enterprise: { ordersPerMonth: -1, products: -1, designs: -1, integrations: -1, users: -1, stores: 5 },
};

export async function POST(req) {
    try {
        const { orgName, slug, billingEmail, tier, orgType, firstName, lastName, email, password } = await req.json();

        if (!orgName || !slug || !billingEmail || !email || !password) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }
        const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, "");
        if (!cleanSlug) return NextResponse.json({ error: "Invalid slug" }, { status: 400 });

        const isCommerce   = orgType === "commerce";
        const isStorefront = orgType === "storefront";
        const validTier = isStorefront
            ? (SF_TIERS.has(tier) ? tier : "starter")
            : isCommerce
                ? (CC_TIERS.has(tier) ? tier : "free")
                : (FC_TIERS.has(tier) ? tier : "starter");

        const exists = await Organization.findOne({ slug: cleanSlug }).lean();
        if (exists) return NextResponse.json({ error: "That URL slug is already taken" }, { status: 409 });

        const emailExists = await PlatformUser.findOne({ email }).lean();
        if (emailExists) return NextResponse.json({ error: "An account with that email already exists" }, { status: 409 });

        const limits = isStorefront ? SF_LIMITS[validTier] : isCommerce ? CC_LIMITS[validTier] : getLimits(validTier);
        // Storefront + fulfillment get a 14-day trial to set up before billing; commerce is free-tier from day 1.
        const trialEndsAt = isCommerce ? null : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
        const resolvedType = isStorefront ? "storefront" : isCommerce ? "commerce" : "fulfillment";

        const org = await Organization.create({
            name: orgName,
            slug: cleanSlug,
            billingEmail,
            tier: validTier,
            orgType: resolvedType,
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

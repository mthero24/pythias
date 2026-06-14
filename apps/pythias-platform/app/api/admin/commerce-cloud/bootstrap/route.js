export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import {
    Organization,
    ProviderCapacity,
    ProviderLocation,
    ProviderScore,
    ProviderCatalog,
} from "@pythias/mongo";
import { Blank } from "@pythias/mongo"; // uses the shared DB connection (same as platform in this context)

// Internal provider definitions
const INTERNAL_PROVIDERS = [
    {
        slug:        "premier-printing",
        name:        "Premier Printing",
        zip:         "48326",
        state:       "MI",
        region:      "midwest",
        country:     "US",
        leadTimeDays: 2,
    },
    {
        slug:        "print-oracle",
        name:        "Print Oracle",
        zip:         "48326",
        state:       "MI",
        region:      "midwest",
        country:     "US",
        leadTimeDays: 2,
    },
];

const DEFAULT_WHOLESALE_CENTS = 1200; // $12.00 fallback if size has no wholesaleCost

// POST /api/admin/commerce-cloud/bootstrap
// Creates/updates the two internal fulfillment providers and seeds their ProviderCatalog
// from all blanks currently in the platform's blank catalog.
// Safe to run multiple times — uses upsert logic throughout.
export async function POST(req) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.role !== "admin" && session.user.role !== "superadmin") {
        return NextResponse.json({ error: "Admin only" }, { status: 403 });
    }

    const results = {
        providers:    [],
        catalogTotal: 0,
        skipped:      0,
        errors:       [],
    };

    // ── 1. Load all active blanks with colors populated ───────────────────────
    let blanks = [];
    try {
        blanks = await Blank.find({ active: { $ne: false } })
            .populate("colors", "name hexcode image color_type sku _id")
            .select("_id code name images sizes colors active")
            .lean();
    } catch (e) {
        results.errors.push(`Blank query failed: ${e.message}`);
        return NextResponse.json({ error: true, results });
    }

    // ── 2. Bootstrap each internal provider ───────────────────────────────────
    for (const def of INTERNAL_PROVIDERS) {
        const providerResult = { name: def.name, catalogEntries: 0, skipped: 0 };

        // 2a. Upsert Organization
        let org = await Organization.findOne({ slug: def.slug });
        if (!org) {
            org = await Organization.create({
                name:          def.name,
                slug:          def.slug,
                orgType:       "fulfillment",
                tier:          "enterprise",
                status:        "active",
                billingEmail:  `ops@pythiastechnologies.com`,
            });
        } else if (org.orgType !== "fulfillment") {
            await Organization.updateOne({ _id: org._id }, { $set: { orgType: "fulfillment" } });
        }
        providerResult.orgId = org._id.toString();

        // 2b. Upsert ProviderCapacity
        await ProviderCapacity.findOneAndUpdate(
            { providerId: org._id },
            {
                $set: {
                    acceptsCommerceCloud: true,
                    autoAccept:           true,   // internal — no 2-hour window
                    warmupMode:           false,  // established providers
                    maxDailyOrders:       1000,
                    isPaused:             false,
                    allowOverflowIn:      true,
                    allowOverflowOut:     true,
                },
                $setOnInsert: { currentDailyCount: 0 },
            },
            { upsert: true, new: true }
        );

        // 2c. Upsert ProviderLocation
        await ProviderLocation.findOneAndUpdate(
            { providerId: org._id, isPrimary: true },
            {
                $set: {
                    zip:              def.zip,
                    state:            def.state,
                    region:           def.region,
                    country:          def.country,
                    isPrimary:        true,
                    shipsToCountries: [], // ships everywhere
                },
            },
            { upsert: true, new: true }
        );

        // 2d. Upsert ProviderScore — excellent defaults for established internal providers
        await ProviderScore.findOneAndUpdate(
            { providerId: org._id },
            {
                $set: {
                    onTimeRate30d:  0.97,
                    defectRate30d:  0.01,
                    avgShipDays30d: def.leadTimeDays,
                    score:          92,
                    lastCalculated: new Date(),
                },
                $setOnInsert: { totalFulfilled: 0 },
            },
            { upsert: true, new: true }
        );

        // 2e. Seed ProviderCatalog from all active blanks
        for (const blank of blanks) {
            if (!blank.colors?.length || !blank.sizes?.length) continue;

            for (const color of blank.colors) {
                if (!color?._id) continue;

                for (const size of blank.sizes) {
                    if (!size?.name || size.hidden) continue;

                    // wholesalePrice (what the provider sells the blank for) is the CC cost basis,
                    // NOT wholesaleCost (what the provider pays). Fall back to cost, then default.
                    const wholesalePrice = size.wholesalePrice > 0
                        ? Math.round(size.wholesalePrice * 100)
                        : size.wholesaleCost > 0
                            ? Math.round(size.wholesaleCost * 100)
                            : DEFAULT_WHOLESALE_CENTS;

                    try {
                        const existing = await ProviderCatalog.findOne({
                            providerId: org._id,
                            blankId:    blank._id,
                            colorId:    color._id,
                            size:       size.name,
                        });

                        if (!existing) {
                            await ProviderCatalog.create({
                                providerId:     org._id,
                                blankId:        blank._id,
                                colorId:        color._id,
                                size:           size.name,
                                wholesalePrice,
                                currency:       "USD",
                                leadTimeDays:   def.leadTimeDays,
                                active:         true,
                            });
                            providerResult.catalogEntries++;
                            results.catalogTotal++;
                        } else {
                            providerResult.skipped++;
                            results.skipped++;
                        }
                    } catch (e) {
                        if (e.code === 11000) {
                            // Duplicate key — already exists, skip
                            providerResult.skipped++;
                            results.skipped++;
                        } else {
                            results.errors.push(`${def.name} ${blank.code}/${color.name}/${size.name}: ${e.message}`);
                        }
                    }
                }
            }
        }

        results.providers.push(providerResult);
    }

    return NextResponse.json({ error: false, results });
}

// GET — returns current state of the bootstrap (provider count, catalog count)
export async function GET(req) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [providerOrgs, catalogCount, blankCount] = await Promise.all([
        Organization.find(
            { slug: { $in: INTERNAL_PROVIDERS.map(p => p.slug) } },
            "name slug orgType status _id"
        ).lean(),
        ProviderCatalog.countDocuments({}),
        Blank.countDocuments({ active: { $ne: false } }),
    ]);

    const providers = await Promise.all(
        providerOrgs.map(async (org) => {
            const [capacity, location, score, catalogOwned] = await Promise.all([
                ProviderCapacity.findOne({ providerId: org._id }).lean(),
                ProviderLocation.findOne({ providerId: org._id, isPrimary: true }).lean(),
                ProviderScore.findOne({ providerId: org._id }).lean(),
                ProviderCatalog.countDocuments({ providerId: org._id }),
            ]);
            return { org, capacity, location, score, catalogOwned };
        })
    );

    return NextResponse.json({ error: false, providers, catalogCount, blankCount });
}

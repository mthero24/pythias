export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { ProviderCatalog, ProviderCapacity, Organization } from "@pythias/mongo";

// GET /api/fulfillment/catalog
// Returns all active ProviderCatalog entries grouped by blank for the Commerce Cloud catalog browser.
export async function GET(req) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Build a map of which providers are currently accepting orders
    const capacities = await ProviderCapacity.find({ acceptsCommerceCloud: true, isPaused: false }).lean();
    const activeProviderIds = new Set(
        capacities
            .filter(c => c.currentDailyCount < c.maxDailyOrders)
            .map(c => c.providerId.toString())
    );

    const entries = await ProviderCatalog.find({ active: true })
        .populate("blankId",  "code name images")
        .populate("colorId",  "name hexcode image sku color_type")
        .populate("providerId", "name slug")
        .lean();

    // Group by blank → color → sizes, collecting providers at the leaf level
    const byBlank = {};
    for (const e of entries) {
        const blankKey = e.blankId?._id?.toString();
        if (!blankKey) continue;

        if (!byBlank[blankKey]) {
            byBlank[blankKey] = {
                blank: e.blankId,
                colors: {},
            };
        }

        const colorKey = e.colorId?._id?.toString();
        if (!colorKey) continue;

        const b = byBlank[blankKey];
        if (!b.colors[colorKey]) {
            b.colors[colorKey] = { color: e.colorId, sizes: {} };
        }

        const c = b.colors[colorKey];
        if (!c.sizes[e.size]) {
            c.sizes[e.size] = { size: e.size, providers: [] };
        }

        c.sizes[e.size].providers.push({
            providerId:     e.providerId?._id?.toString(),
            providerName:   e.providerId?.name,
            wholesalePrice: e.wholesalePrice,
            currency:       e.currency,
            leadTimeDays:   e.leadTimeDays,
            available:      activeProviderIds.has(e.providerId?._id?.toString()),
        });
    }

    // Flatten to array
    const catalog = Object.values(byBlank).map(b => ({
        ...b,
        colors: Object.values(b.colors).map(c => ({
            ...c,
            sizes: Object.values(c.sizes).sort((a, z) => {
                const order = ["XS","S","M","L","XL","2XL","3XL","4XL"];
                return order.indexOf(a.size) - order.indexOf(z.size);
            }),
        })),
    }));

    return NextResponse.json({ error: false, catalog });
}

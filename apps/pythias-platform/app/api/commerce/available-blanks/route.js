export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import {
    ProviderCatalog, ProviderCapacity,
    PlatformBlank, PlatformColor,
} from "@pythias/mongo";

// GET /api/commerce/available-blanks
// Garments a Commerce Cloud seller can build products on — aggregated across ALL
// eligible providers and grouped by manufacturer style (provider-agnostic), so the
// seller picks a garment, not a specific provider's blank.
//
// NOTE: ProviderCatalog lives in PlatformDB while Blank/Color live in PremierPrinting —
// different connections, so we join manually (no cross-connection populate).
export async function GET(req) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const orgId = session.user.orgId;

    // 1. Eligible providers (accept CC, not paused, under daily cap)
    const capacities = await ProviderCapacity.find({ acceptsCommerceCloud: true, isPaused: false }).lean();
    const now = new Date();
    const eligibleIds = capacities
        .filter(c => (!c.pauseUntil || new Date(c.pauseUntil) <= now) && c.currentDailyCount < c.maxDailyOrders)
        .map(c => c.providerId);
    if (!eligibleIds.length) return NextResponse.json({ error: false, garments: [] });

    // 2. Their active catalog entries
    const entries = await ProviderCatalog.find({ active: true, providerId: { $in: eligibleIds } }).lean();
    if (!entries.length) return NextResponse.json({ error: false, garments: [] });

    // 3. Manual cross-DB fetch of blank + color details
    const blankIds = [...new Set(entries.map(e => e.blankId?.toString()).filter(Boolean))];
    const colorIds = [...new Set(entries.map(e => e.colorId?.toString()).filter(Boolean))];
    const [blanks, colors, ownCatalog] = await Promise.all([
        PlatformBlank.find({ _id: { $in: blankIds }, active: { $ne: false } }).select("manufacturerStyle code name images sizes").lean(),
        PlatformColor.find({ _id: { $in: colorIds } }).select("name hexcode image sku").lean(),
        PlatformBlank.find({ orgId, catalogBlank: true }).select("manufacturerStyle").lean(),
    ]);
    const blankMap = Object.fromEntries(blanks.map(b => [b._id.toString(), b]));
    const colorMap = Object.fromEntries(colors.map(c => [c._id.toString(), c]));
    // Identity key = manufacturerStyle, falling back to the blank code until mfr styles are backfilled
    const keyOf = (b) => (b?.manufacturerStyle?.trim() || b?.code || "").toString();
    const ownKeys = new Set(ownCatalog.map(b => keyOf(b)).filter(Boolean));

    // 4. Group by manufacturer style
    const groups = {};
    for (const e of entries) {
        const blank = blankMap[e.blankId?.toString()];
        if (!blank) continue;
        const key = keyOf(blank);
        if (!key) continue;

        if (!groups[key]) {
            groups[key] = {
                manufacturerStyle: key,
                name:        blank.name ?? key,
                images:      blank.images ?? [],
                sourceBlankIds: new Set(),
                colors:      {},   // colorId -> {colorId,name,hex,image}
                sizes:       new Set(),
                providers:   new Set(),
                maxWholesale: 0,
                maxRetail:    0,
            };
        }
        const g = groups[key];
        g.sourceBlankIds.add(e.blankId.toString());
        g.providers.add(e.providerId.toString());
        if (e.size) g.sizes.add(e.size);
        g.maxWholesale = Math.max(g.maxWholesale, e.wholesalePrice ?? 0);
        g.maxRetail = Math.max(g.maxRetail, e.retailPrice ?? 0);

        const color = colorMap[e.colorId?.toString()];
        if (color && !g.colors[color._id.toString()]) {
            g.colors[color._id.toString()] = {
                colorId: color._id.toString(),
                name:    color.name,
                hex:     color.hexcode,
                image:   color.image ?? null,
            };
        }
    }

    const SIZE_ORDER = ["XS","S","M","L","XL","2XL","XXL","3XL","XXXL","4XL"];
    const garments = Object.values(groups).map(g => ({
        manufacturerStyle: g.manufacturerStyle,
        name:    g.name,
        images:  g.images,
        sourceBlankIds: [...g.sourceBlankIds],
        colors:  Object.values(g.colors),
        sizes:   [...g.sizes].sort((a, z) => {
            const ia = SIZE_ORDER.indexOf(a), iz = SIZE_ORDER.indexOf(z);
            return (ia < 0 ? 99 : ia) - (iz < 0 ? 99 : iz);
        }),
        // Single platform price (cents): covers the priciest provider so margin is never negative
        platformPrice: g.maxWholesale,
        defaultRetail: g.maxRetail,   // cents — provider's suggested retail, prefilled in import (seller can override)
        providerCount: g.providers.size,
        inCatalog: ownKeys.has(g.manufacturerStyle),
    })).sort((a, z) => a.name.localeCompare(z.name));

    return NextResponse.json({ error: false, garments });
}

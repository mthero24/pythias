import { Organization, PlatformDesign as Design } from "@pythias/mongo";

// Internal production-cost computation for quotes (COGS/margin only — never added to the
// customer-facing total). Ink cost is DTF/DTG print-area × the org's $/in² rate; screen-burn
// is the design's color count × the org's $/screen rate (charged once per line). Values missing
// on a line are resolved from the line's design (by sku) so costs work without UI changes.

export async function getOrgProductionRates(orgId) {
    const org = await Organization.findById(orgId).select("settings.productionCosts").lean();
    const r = org?.settings?.productionCosts || {};
    return {
        dtfInkRatePerSqIn: Number(r.dtfInkRatePerSqIn) || 0,
        dtgInkRatePerSqIn: Number(r.dtgInkRatePerSqIn) || 0,
        screenBurnRatePerScreen: Number(r.screenBurnRatePerScreen) || 0,
    };
}

function inkRateFor(printType, rates) {
    const t = (printType || "").toUpperCase();
    if (t.includes("DTF")) return rates.dtfInkRatePerSqIn;
    if (t.includes("DTG")) return rates.dtgInkRatePerSqIn;
    return 0; // screen-print ink cost is formula-driven (ink-mix), not area-based
}

// Returns { lines (with inkCost/screenBurnCost/area/colors filled), internalCosts:{ink,screenBurn,total} }.
export async function computeInternalCosts(lines, orgId) {
    const rates = await getOrgProductionRates(orgId);

    // Backfill area/colors from the design when the line doesn't carry them.
    const skus = [...new Set((lines || [])
        .filter((l) => l.sku && (l.printAreaSqIn == null || l.numColors == null))
        .map((l) => l.sku))];
    let bySku = {};
    if (skus.length) {
        const designs = await Design.find({ orgId, sku: { $in: skus } })
            .select("sku printAreaSqIn numColors").lean();
        bySku = Object.fromEntries(designs.map((d) => [d.sku, d]));
    }

    const outLines = (lines || []).map((l) => {
        const d = bySku[l.sku] || {};
        const area = Number(l.printAreaSqIn ?? d.printAreaSqIn) || 0;
        const colors = Number(l.numColors ?? d.numColors) || 0;
        const qty = Math.max(1, Number(l.quantity) || 1);
        const inkCost = area * inkRateFor(l.printType, rates) * qty;
        const screenBurnCost = colors * rates.screenBurnRatePerScreen; // once per line (setup)
        return { ...l, printAreaSqIn: area, numColors: colors, inkCost, screenBurnCost };
    });

    const ink = outLines.reduce((s, l) => s + (l.inkCost || 0), 0);
    const screenBurn = outLines.reduce((s, l) => s + (l.screenBurnCost || 0), 0);
    return { lines: outLines, internalCosts: { ink, screenBurn, total: ink + screenBurn } };
}

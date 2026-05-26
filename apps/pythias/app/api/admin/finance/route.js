import { NextResponse } from "next/server";
import { ServiceInvoicePremier, ServiceInvoicePo, KlingInvoicePremier, KlingInvoicePo } from "@pythias/mongo";

function buildDateFilter(fromYear, fromMonth, toYear, toMonth) {
    if (fromYear === toYear) {
        return { year: fromYear, month: { $gte: fromMonth, $lte: toMonth } };
    }
    const conditions = [{ year: fromYear, month: { $gte: fromMonth } }];
    if (toYear - fromYear > 1) conditions.push({ year: { $gt: fromYear, $lt: toYear } });
    conditions.push({ year: toYear, month: { $lte: toMonth } });
    return { $or: conditions };
}

export async function GET(req) {
    const params = req.nextUrl.searchParams;
    const now = new Date();
    const from = params.get("from") ?? `${now.getFullYear()}-01`;
    const to   = params.get("to")   ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    const [fromYear, fromMonth] = from.split("-").map(Number);
    const [toYear,   toMonth]   = to.split("-").map(Number);

    const filter = buildDateFilter(fromYear, fromMonth, toYear, toMonth);

    const [premierService, poService, premierKling, poKling] = await Promise.all([
        ServiceInvoicePremier.find(filter).sort({ year: 1, month: 1 }).lean(),
        ServiceInvoicePo.find(filter).sort({ year: 1, month: 1 }).lean(),
        KlingInvoicePremier.find(filter).sort({ year: 1, month: 1 }).lean(),
        KlingInvoicePo.find(filter).sort({ year: 1, month: 1 }).lean(),
    ]);

    // Merge into month-keyed map
    const monthMap = new Map();
    const getRow = (year, month) => {
        const k = `${year}-${String(month).padStart(2, "0")}`;
        if (!monthMap.has(k)) monthMap.set(k, { year, month, premierService: 0, premierServicePaid: false, poService: 0, poServicePaid: false, premierKling: 0, poKling: 0 });
        return monthMap.get(k);
    };

    for (const inv of premierService) { const r = getRow(inv.year, inv.month); r.premierService = inv.totalAmount; r.premierServicePaid = inv.status === "paid"; }
    for (const inv of poService)      { const r = getRow(inv.year, inv.month); r.poService      = inv.totalAmount; r.poServicePaid      = inv.status === "paid"; }
    for (const inv of premierKling)   { const r = getRow(inv.year, inv.month); r.premierKling   = inv.totalAmount; }
    for (const inv of poKling)        { const r = getRow(inv.year, inv.month); r.poKling        = inv.totalAmount; }

    const months = [...monthMap.values()]
        .sort((a, b) => a.year - b.year || a.month - b.month)
        .map(r => ({
            ...r,
            totalIncome: r.premierService + r.poService,
            totalCosts:  r.premierKling   + r.poKling,
            net:         (r.premierService + r.poService) - (r.premierKling + r.poKling),
        }));

    const sum = (arr, fn) => arr.reduce((s, i) => s + fn(i), 0);
    const premierInvoiced  = sum(premierService, i => i.totalAmount);
    const poInvoiced       = sum(poService,      i => i.totalAmount);
    const totalCollected   = sum(premierService.filter(i => i.status === "paid"), i => i.totalAmount) +
                             sum(poService.filter(i => i.status === "paid"),      i => i.totalAmount);
    const premierKlingCost = sum(premierKling, i => i.totalAmount);
    const poKlingCost      = sum(poKling,      i => i.totalAmount);
    const totalInvoiced    = premierInvoiced + poInvoiced;
    const totalKlingCost   = premierKlingCost + poKlingCost;

    const summary = {
        totalInvoiced,
        totalCollected,
        totalOutstanding: totalInvoiced - totalCollected,
        premierInvoiced,
        poInvoiced,
        totalKlingCost,
        premierKlingCost,
        poKlingCost,
        net: totalCollected - totalKlingCost,
    };

    return NextResponse.json({ summary, months });
}

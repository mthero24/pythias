import { NextResponse } from "next/server";
import { ServiceInvoicePremier, ServiceInvoicePo, KlingInvoicePremier, KlingInvoicePo, Expense } from "@pythias/mongo";

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function buildDateFilter(fromYear, fromMonth, toYear, toMonth) {
    if (fromYear === toYear) {
        return { year: fromYear, month: { $gte: fromMonth, $lte: toMonth } };
    }
    const conditions = [{ year: fromYear, month: { $gte: fromMonth } }];
    if (toYear - fromYear > 1) conditions.push({ year: { $gt: fromYear, $lt: toYear } });
    conditions.push({ year: toYear, month: { $lte: toMonth } });
    return { $or: conditions };
}

function esc(v) {
    const s = String(v ?? "");
    return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET(req) {
    const params = req.nextUrl.searchParams;
    const now  = new Date();
    const from = params.get("from") ?? `${now.getFullYear()}-01`;
    const to   = params.get("to")   ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    const [fromYear, fromMonth] = from.split("-").map(Number);
    const [toYear,   toMonth]   = to.split("-").map(Number);

    const filter = buildDateFilter(fromYear, fromMonth, toYear, toMonth);

    const [premierService, poService, premierKling, poKling, expenses] = await Promise.all([
        ServiceInvoicePremier.find(filter).sort({ year: 1, month: 1 }).lean(),
        ServiceInvoicePo.find(filter).sort({ year: 1, month: 1 }).lean(),
        KlingInvoicePremier.find(filter).sort({ year: 1, month: 1 }).lean(),
        KlingInvoicePo.find(filter).sort({ year: 1, month: 1 }).lean(),
        Expense.find(filter).sort({ year: 1, month: 1, createdAt: 1 }).lean(),
    ]);

    const monthMap = new Map();
    const getRow = (year, month) => {
        const k = `${year}-${String(month).padStart(2, "0")}`;
        if (!monthMap.has(k)) monthMap.set(k, { year, month, premierService: 0, premierServiceStatus: "", poService: 0, poServiceStatus: "", premierKling: 0, poKling: 0, monthExpenses: 0 });
        return monthMap.get(k);
    };

    for (const inv of premierService) { const r = getRow(inv.year, inv.month); r.premierService = inv.totalAmount; r.premierServiceStatus = inv.status; }
    for (const inv of poService)      { const r = getRow(inv.year, inv.month); r.poService      = inv.totalAmount; r.poServiceStatus      = inv.status; }
    for (const inv of premierKling)   { const r = getRow(inv.year, inv.month); r.premierKling   = inv.totalAmount; }
    for (const inv of poKling)        { const r = getRow(inv.year, inv.month); r.poKling        = inv.totalAmount; }
    for (const exp of expenses)       { const r = getRow(exp.year, exp.month); r.monthExpenses += exp.amount; }

    const rows = [...monthMap.values()].sort((a, b) => a.year - b.year || a.month - b.month);
    const lines = [];

    // ── Section 1: Monthly Summary ──
    lines.push("MONTHLY SUMMARY");
    lines.push(["Month","Year","Premier Service ($)","Premier Service Status","PO Service ($)","PO Service Status","Premier Kling ($)","PO Kling ($)","Expenses ($)","Total Income ($)","Total Costs ($)","Net ($)"].join(","));

    let totPremierService = 0, totPoService = 0, totPremierKling = 0, totPoKling = 0, totExpenses = 0;

    for (const r of rows) {
        const totalIncome = r.premierService + r.poService;
        const totalCosts  = r.premierKling + r.poKling + r.monthExpenses;
        const net         = totalIncome - totalCosts;
        totPremierService += r.premierService;
        totPoService      += r.poService;
        totPremierKling   += r.premierKling;
        totPoKling        += r.poKling;
        totExpenses       += r.monthExpenses;
        lines.push([
            esc(MONTH_NAMES[r.month - 1]), esc(r.year),
            esc(r.premierService.toFixed(2)), esc(r.premierServiceStatus),
            esc(r.poService.toFixed(2)),      esc(r.poServiceStatus),
            esc(r.premierKling.toFixed(2)),   esc(r.poKling.toFixed(2)),
            esc(r.monthExpenses.toFixed(2)),
            esc(totalIncome.toFixed(2)),      esc(totalCosts.toFixed(2)),
            esc(net.toFixed(2)),
        ].join(","));
    }

    const totIncome = totPremierService + totPoService;
    const totCosts  = totPremierKling + totPoKling + totExpenses;
    lines.push([
        esc("TOTAL"), esc(""),
        esc(totPremierService.toFixed(2)), esc(""),
        esc(totPoService.toFixed(2)),      esc(""),
        esc(totPremierKling.toFixed(2)),   esc(totPoKling.toFixed(2)),
        esc(totExpenses.toFixed(2)),
        esc(totIncome.toFixed(2)),         esc(totCosts.toFixed(2)),
        esc((totIncome - totCosts).toFixed(2)),
    ].join(","));

    // ── Section 2: Expense Detail ──
    lines.push("", "EXPENSE DETAIL");
    lines.push(["Month","Year","Description","Category","Amount ($)","Notes"].join(","));

    for (const exp of expenses) {
        lines.push([
            esc(MONTH_NAMES[exp.month - 1]), esc(exp.year),
            esc(exp.description), esc(exp.category),
            esc(exp.amount.toFixed(2)), esc(exp.notes),
        ].join(","));
    }

    lines.push([esc("TOTAL"), esc(""), esc(""), esc(""), esc(totExpenses.toFixed(2)), esc("")].join(","));

    const csv = lines.join("\r\n");
    const filename = `finance_${from}_to_${to}.csv`;

    return new NextResponse(csv, {
        headers: {
            "Content-Type": "text/csv",
            "Content-Disposition": `attachment; filename="${filename}"`,
        },
    });
}

import { ServiceInvoicePremier, ServiceInvoicePo, KlingInvoicePremier, KlingInvoicePo, Expense } from "@pythias/mongo";
import { FinanceDashboard } from "@pythias/backend";
export const dynamic = "force-dynamic";

function buildDateFilter(fromYear, fromMonth, toYear, toMonth) {
    if (fromYear === toYear) {
        return { year: fromYear, month: { $gte: fromMonth, $lte: toMonth } };
    }
    const conditions = [{ year: fromYear, month: { $gte: fromMonth } }];
    if (toYear - fromYear > 1) conditions.push({ year: { $gt: fromYear, $lt: toYear } });
    conditions.push({ year: toYear, month: { $lte: toMonth } });
    return { $or: conditions };
}

export default async function FinancePage() {
    const now = new Date();
    const fromYear  = now.getFullYear();
    const fromMonth = 1;
    const toYear    = now.getFullYear();
    const toMonth   = now.getMonth() + 1;
    const initialFrom = `${fromYear}-01`;
    const initialTo   = `${toYear}-${String(toMonth).padStart(2, "0")}`;

    const filter = buildDateFilter(fromYear, fromMonth, toYear, toMonth);

    const [premierService, poService, premierKling, poKling, expenseList] = await Promise.all([
        ServiceInvoicePremier.find(filter).sort({ year: 1, month: 1 }).lean(),
        ServiceInvoicePo.find(filter).sort({ year: 1, month: 1 }).lean(),
        KlingInvoicePremier.find(filter).sort({ year: 1, month: 1 }).lean(),
        KlingInvoicePo.find(filter).sort({ year: 1, month: 1 }).lean(),
        Expense.find(filter).sort({ year: -1, month: -1, createdAt: -1 }).lean(),
    ]);

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
        .map(r => ({ ...r, totalIncome: r.premierService + r.poService, totalCosts: r.premierKling + r.poKling, net: (r.premierService + r.poService) - (r.premierKling + r.poKling) }));

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
        totalInvoiced, totalCollected,
        totalOutstanding: totalInvoiced - totalCollected,
        premierInvoiced, poInvoiced,
        totalKlingCost, premierKlingCost, poKlingCost,
        net: totalCollected - totalKlingCost,
    };

    const initialData = JSON.parse(JSON.stringify({ summary, months }));
    return <FinanceDashboard initialData={initialData} initialFrom={initialFrom} initialTo={initialTo} initialExpenses={JSON.parse(JSON.stringify(expenseList))} />;
}

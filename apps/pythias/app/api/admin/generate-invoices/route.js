import { NextResponse } from "next/server";
import { ServiceInvoicePremier, ServiceInvoicePo, ServicePlanPremier, ServicePlanPo } from "@pythias/mongo";

const CLIENTS = [
    { key: "premier-printing", InvoiceModel: ServiceInvoicePremier, PlanModel: ServicePlanPremier },
    { key: "po",               InvoiceModel: ServiceInvoicePo,      PlanModel: ServicePlanPo      },
];

export async function POST() {
    const now = new Date();
    // Generate invoice for the previous month
    let month = now.getMonth(); // 0-indexed current → previous month (1-indexed)
    let year  = now.getFullYear();
    if (month === 0) { month = 12; year -= 1; }

    const results = [];
    for (const { key, InvoiceModel, PlanModel } of CLIENTS) {
        try {
            const existing = await InvoiceModel.findOne({ month, year });
            if (existing) {
                results.push({ client: key, status: "skipped", reason: "already exists" });
                continue;
            }
            const plans = await PlanModel.find({ active: true }).lean();
            if (!plans.length) {
                results.push({ client: key, status: "skipped", reason: "no active plans" });
                continue;
            }
            const lines = plans.map(p => ({ appName: p.appName, description: p.description, price: p.monthlyPrice }));
            const totalAmount = lines.reduce((s, l) => s + l.price, 0);
            const invoice = await InvoiceModel.create({ month, year, lines, totalAmount });
            results.push({ client: key, status: "created", invoiceId: invoice._id, totalAmount });
        } catch (e) {
            results.push({ client: key, status: "error", error: e.message });
        }
    }

    const hasError = results.some(r => r.status === "error");
    console.log(`[generate-invoices] ${year}-${String(month).padStart(2,"0")}:`, results);
    return NextResponse.json({ ok: !hasError, month, year, results }, { status: hasError ? 500 : 200 });
}

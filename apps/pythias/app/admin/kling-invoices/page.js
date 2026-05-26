import { KlingInvoicePremier, KlingInvoicePo } from "@pythias/mongo";
import { KlingInvoicesMain } from "@pythias/backend";
export const dynamic = "force-dynamic";

export default async function KlingInvoicesPage() {
    const [premierInvoices, poInvoices] = await Promise.all([
        KlingInvoicePremier.find({}).sort({ year: -1, month: -1 }).lean(),
        KlingInvoicePo.find({}).sort({ year: -1, month: -1 }).lean(),
    ]);
    const invoices = [
        ...premierInvoices.map(i => ({ ...i, _client: "premier-printing" })),
        ...poInvoices.map(i => ({ ...i, _client: "po" })),
    ].sort((a, b) => b.year - a.year || b.month - a.month);
    return <KlingInvoicesMain initialInvoices={JSON.parse(JSON.stringify(invoices))} showClient />;
}

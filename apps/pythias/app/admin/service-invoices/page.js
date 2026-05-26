import { ServiceInvoicePremier, ServiceInvoicePo } from "@pythias/mongo";
import { ServiceInvoicesMain } from "@pythias/backend";
export const dynamic = "force-dynamic";

export default async function ServiceInvoicesPage() {
    const [premierInvoices, poInvoices] = await Promise.all([
        ServiceInvoicePremier.find({}).sort({ year: -1, month: -1 }).lean(),
        ServiceInvoicePo.find({}).sort({ year: -1, month: -1 }).lean(),
    ]);
    const invoices = [
        ...premierInvoices.map(i => ({ ...i, _client: "premier-printing" })),
        ...poInvoices.map(i => ({ ...i, _client: "po" })),
    ].sort((a, b) => b.year - a.year || b.month - a.month);
    return <ServiceInvoicesMain initialInvoices={JSON.parse(JSON.stringify(invoices))} canGenerate />;
}

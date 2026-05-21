import { KlingInvoice } from "@pythias/mongo";
import { KlingInvoicesMain } from "@pythias/backend";
export const dynamic = "force-dynamic";

export default async function KlingInvoicesPage() {
    const invoices = await KlingInvoice.find({}).sort({ year: -1, month: -1 }).lean();
    return <KlingInvoicesMain initialInvoices={JSON.parse(JSON.stringify(invoices))} />;
}

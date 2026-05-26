import { ServiceInvoicePo } from "@pythias/mongo";
import { ServiceInvoicesMain } from "@pythias/backend";
export const dynamic = "force-dynamic";

export default async function ServiceInvoicesPage() {
    const invoices = await ServiceInvoicePo.find({}).sort({ year: -1, month: -1 }).lean();
    return <ServiceInvoicesMain initialInvoices={JSON.parse(JSON.stringify(invoices))} />;
}

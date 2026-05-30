import { headers } from "next/headers";
import { ServiceInvoicePremier } from "@pythias/mongo";
import { ServiceInvoicesMain } from "@pythias/backend";
export const dynamic = "force-dynamic";

export default async function ServiceInvoicesPage() {
    const headersList = await headers();
    const canPay = headersList.get("canPayInvoice") === "1";
    const invoices = await ServiceInvoicePremier.find({}).sort({ year: -1, month: -1 }).lean();
    return <ServiceInvoicesMain initialInvoices={JSON.parse(JSON.stringify(invoices))} canPay={canPay} />;
}

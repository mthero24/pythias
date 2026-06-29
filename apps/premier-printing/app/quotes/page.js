import { QuotesClient } from "@pythias/backend";

export const dynamic = "force-dynamic";

export const metadata = { title: "Quotes · Premier Printing" };

export default function QuotesPage() {
    return <QuotesClient />;
}

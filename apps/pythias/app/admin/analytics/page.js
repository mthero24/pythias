import { headers } from "next/headers";
import { redirect } from "next/navigation";
import AnalyticsDashboard from "@/componants/AnalyticsDashboard";

export const dynamic = "force-dynamic";
export const metadata = { title: "Analytics" };

export default async function AnalyticsPage() {
    const headersList = await headers();
    const user = headersList.get("user");
    if (!user) redirect("/login");

    return <AnalyticsDashboard />;
}

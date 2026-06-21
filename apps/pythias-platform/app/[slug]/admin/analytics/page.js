import { AnalyticsDashboard } from "@pythias/backend";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { redirect } from "next/navigation";
export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.permissions?.charts) redirect("/admin");
    // Sellers see PLATFORM SPEED only (how fast the platform runs for them) — not traffic/revenue.
    // Their store traffic lives on the Site Analytics page; revenue + platform cost live in Reports.
    return <AnalyticsDashboard speedOnly />;
}

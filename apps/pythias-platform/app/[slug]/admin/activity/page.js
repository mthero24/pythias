import { ActivityDashboard } from "@pythias/backend";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { redirect } from "next/navigation";
export const dynamic = 'force-dynamic';

export default async function ActivityPage() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.permissions?.charts) redirect("/admin");
    return <ActivityDashboard provider="premierPrinting" apiBase="/api/admin/activity" />;
}

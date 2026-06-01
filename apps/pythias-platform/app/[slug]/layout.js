import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { redirect } from "next/navigation";
import { Organization } from "@pythias/mongo";
import Navbar from "@/components/Navbar";
import OrgProvider from "@/components/OrgProvider";
import UsageAlertBanner from "@/components/UsageAlertBanner";
import { FloatingChat } from "@pythias/backend";

export default async function DashboardLayout({ children, params }) {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    const { slug } = await params;

    const org = await Organization.findById(session.user.orgId).lean();
    if (!org) redirect("/login");

    // Ensure URL slug matches this org
    if (org.slug !== slug) redirect(`/${org.slug}/dashboard`);

    const orgData = {
        _id: org._id.toString(),
        name: org.name,
        slug: org.slug,
        tier: org.tier,
        status: org.status,
        limits: org.limits,
        usage: org.usage,
        enabledIntegrations: org.enabledIntegrations,
        settings: org.settings,
    };

    return (
        <OrgProvider org={orgData} user={session.user}>
            <Navbar />
            <UsageAlertBanner org={orgData} />
            <main style={{ minHeight: "calc(100vh - 64px)" }}>
                {children}
            </main>
            <FloatingChat />
        </OrgProvider>
    );
}

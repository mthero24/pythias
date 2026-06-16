import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { redirect } from "next/navigation";
import { Organization, StorefrontSite } from "@pythias/mongo";
import Navbar from "@/components/Navbar";
import OrgProvider from "@/components/OrgProvider";
import UsageAlertBanner from "@/components/UsageAlertBanner";
import SetupGuideBanner from "@/components/SetupGuideBanner";
import { FloatingChat, CSVProvider } from "@pythias/backend";

export default async function DashboardLayout({ children, params }) {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    const { slug } = await params;

    const org = await Organization.findById(session.user.orgId).lean();
    if (!org) redirect("/login");

    // Ensure URL slug matches this org
    if (org.slug !== slug) redirect(`/${org.slug}/dashboard`);

    // Storefront is a paid add-on (currently "coming soon"): the menu shows it only once the
    // org has a real plan. Until then they see the "Learn about Storefront" explainer.
    const sfSite = await StorefrontSite.findOne({ orgId: org._id, plan: { $ne: "none" } }).select("plan").lean();
    const storefrontEnabled = !!sfSite && sfSite.plan && sfSite.plan !== "none";

    const orgData = {
        _id: org._id.toString(),
        name: org.name,
        slug: org.slug,
        tier: org.tier,
        status: org.status,
        orgType: org.orgType ?? "fulfillment",
        storefrontEnabled,
        limits: org.limits,
        usage: org.usage,
        enabledIntegrations: org.enabledIntegrations,
        settings: org.settings,
    };

    return (
        <OrgProvider org={orgData} user={session.user}>
            <CSVProvider>
                <Navbar />
                <UsageAlertBanner org={orgData} />
                <SetupGuideBanner slug={slug} />
                <main style={{ minHeight: "calc(100vh - 64px)" }}>
                    {children}
                </main>
                <FloatingChat />
            </CSVProvider>
        </OrgProvider>
    );
}

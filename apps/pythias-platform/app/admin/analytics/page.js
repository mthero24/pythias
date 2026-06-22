import { AnalyticsDashboard } from "@pythias/backend";

export const dynamic = "force-dynamic";

// Company-wide web traffic for Pythias's OWN marketing site (pythiastechnologies.com).
// This is the cross-org/all-traffic view — its correct home is the Pythias super-admin
// (gated by the /admin layout, PYTHIAS_ADMIN_EMAILS), NOT a per-seller page.
export default function CompanyAnalyticsPage() {
    return <AnalyticsDashboard />;
}

import { Alert, Box } from "@mui/material";
import { TIERS, isUnlimited } from "@/lib/tiers";

export default function UsageAlertBanner({ org }) {
    if (!org) return null;
    const { usage, limits, tier } = org;
    if (!TIERS[tier]?.overage?.order) return null;

    const resources = [
        { label: "orders", current: usage.ordersThisMonth, limit: limits.ordersPerMonth },
        { label: "products", current: usage.productsTotal, limit: limits.products },
        { label: "designs", current: usage.designsTotal, limit: limits.designs },
        { label: "users", current: usage.usersTotal, limit: limits.users },
    ];

    const alerts = resources
        .filter(r => !isUnlimited(r.limit))
        .map(r => ({ ...r, pct: Math.round((r.current / r.limit) * 100) }))
        .filter(r => r.pct >= 75);

    if (alerts.length === 0) return null;

    const worst = alerts.reduce((a, b) => b.pct > a.pct ? b : a);
    const severity = worst.pct >= 100 ? "error" : worst.pct >= 90 ? "warning" : "info";

    return (
        <Box sx={{ px: 2, pt: 1 }}>
            <Alert severity={severity} sx={{ mb: 0 }}>
                {worst.pct >= 100
                    ? `You've reached your ${worst.label} limit (${worst.current.toLocaleString()}/${worst.limit.toLocaleString()}). Overages are billed at your tier's rate.`
                    : `You're at ${worst.pct}% of your ${worst.label} limit. Consider upgrading your plan.`}
                {" "}<a href="/billing" style={{ textDecoration: "underline" }}>View billing →</a>
            </Alert>
        </Box>
    );
}

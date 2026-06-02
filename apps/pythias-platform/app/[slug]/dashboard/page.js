import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { redirect } from "next/navigation";
import { Organization, UsageLedger } from "@pythias/mongo";
import { Box, Container, Grid2, Typography, Card, CardContent, Stack, Chip, Divider } from "@mui/material";
import UsageGauge from "@/components/UsageGauge";
import TierBadge from "@/components/TierBadge";

export const dynamic = "force-dynamic";

export default async function DashboardPage({ params }) {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    const { slug } = await params;

    const [org, ledger] = await Promise.all([
        Organization.findById(session.user.orgId).lean(),
        UsageLedger.findOne({
            orgId: session.user.orgId,
            period: new Date().toISOString().slice(0, 7),
        }).lean(),
    ]);

    if (!org) redirect("/login");

    const { limits, usage } = org;
    const firstName = session.user.firstName;

    return (
        <Box sx={{ bgcolor: "background.default", minHeight: "100vh" }}>
            <Container maxWidth="lg" sx={{ py: 4 }}>

                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 4 }}>
                    <Box>
                        <Typography variant="h5" fontWeight={700}>
                            Welcome back{firstName ? `, ${firstName}` : ""}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">{org.name}</Typography>
                    </Box>
                    <TierBadge tier={org.tier} status={org.status} />
                </Stack>

                <Grid2 container spacing={3} sx={{ mb: 4 }}>
                    <Grid2 size={{ xs: 12, sm: 6, md: 3 }}>
                        <UsageGauge
                            label="Orders this month"
                            current={usage.ordersThisMonth}
                            limit={limits.ordersPerMonth}
                        />
                    </Grid2>
                    <Grid2 size={{ xs: 12, sm: 6, md: 3 }}>
                        <UsageGauge
                            label="Products"
                            current={usage.productsTotal}
                            limit={limits.products}
                        />
                    </Grid2>
                    <Grid2 size={{ xs: 12, sm: 6, md: 3 }}>
                        <UsageGauge
                            label="Designs"
                            current={usage.designsTotal}
                            limit={limits.designs}
                        />
                    </Grid2>
                    <Grid2 size={{ xs: 12, sm: 6, md: 3 }}>
                        <UsageGauge
                            label="Users"
                            current={usage.usersTotal}
                            limit={limits.users}
                        />
                    </Grid2>
                </Grid2>

                {ledger?.totalOverageCharge > 0 && (
                    <Card variant="outlined" sx={{ mb: 3, borderColor: "warning.main" }}>
                        <CardContent>
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Box>
                                    <Typography variant="subtitle2" fontWeight={700}>Overage charges this month</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {ledger.overageOrders > 0 && `${ledger.overageOrders} extra orders ($${ledger.overageOrdersCharge.toFixed(2)})`}
                                    </Typography>
                                </Box>
                                <Typography variant="h6" color="warning.main" fontWeight={700}>
                                    ${ledger.totalOverageCharge.toFixed(2)}
                                </Typography>
                            </Stack>
                        </CardContent>
                    </Card>
                )}

                <Grid2 container spacing={3}>
                    <Grid2 size={{ xs: 12, md: 6 }}>
                        <Card variant="outlined">
                            <CardContent>
                                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>Quick links</Typography>
                                <Stack spacing={1}>
                                    {[
                                        { label: "Orders", href: `/${slug}/orders` },
                                        { label: "Products", href: `/${slug}/products` },
                                        { label: "Designs", href: `/${slug}/admin/designs` },
                                        { label: "Integrations", href: `/${slug}/integrations` },
                                    ].map(link => (
                                        <Box key={link.href}>
                                            <a href={link.href}>
                                                <Typography variant="body2" sx={{ py: 0.5, "&:hover": { color: "primary.main" } }}>
                                                    {link.label} →
                                                </Typography>
                                            </a>
                                            <Divider />
                                        </Box>
                                    ))}
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid2>
                    <Grid2 size={{ xs: 12, md: 6 }}>
                        <Card variant="outlined">
                            <CardContent>
                                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>Active integrations</Typography>
                                {org.enabledIntegrations?.length > 0 ? (
                                    <Stack direction="row" flexWrap="wrap" gap={1}>
                                        {org.enabledIntegrations.map(i => (
                                            <Chip key={i} label={i} size="small" variant="outlined" />
                                        ))}
                                    </Stack>
                                ) : (
                                    <Typography variant="body2" color="text.secondary">
                                        No integrations connected.{" "}
                                        <a href={`/${slug}/integrations`} style={{ textDecoration: "underline" }}>Set up integrations →</a>
                                    </Typography>
                                )}
                            </CardContent>
                        </Card>
                    </Grid2>
                </Grid2>

            </Container>
        </Box>
    );
}

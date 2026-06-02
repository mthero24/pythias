import { Organization, PlatformUser, UsageLedger } from "@pythias/mongo";
import { notFound } from "next/navigation";
import { Box, Container, Typography, Card, CardContent, Stack, Chip, Table, TableBody, TableCell, TableHead, TableRow, Grid2 } from "@mui/material";
import { TIERS } from "@/lib/tiers";
import TierBadge from "@/components/TierBadge";
import UsageGauge from "@/components/UsageGauge";

export const dynamic = "force-dynamic";

export default async function AdminOrgPage({ params }) {
    const { id } = await params;
    const [org, users, ledgers] = await Promise.all([
        Organization.findById(id).lean(),
        PlatformUser.find({ orgId: id }).select("-password").lean(),
        UsageLedger.find({ orgId: id }).sort({ period: -1 }).limit(6).lean(),
    ]);

    if (!org) notFound();

    return (
        <Box sx={{ bgcolor: "background.default", minHeight: "100vh" }}>
            <Container maxWidth="lg" sx={{ py: 4 }}>

                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 3 }}>
                    <Box>
                        <Typography variant="h6" fontWeight={700}>{org.name}</Typography>
                        <Typography variant="body2" color="text.secondary">{org.slug} · {org.billingEmail}</Typography>
                    </Box>
                    <TierBadge tier={org.tier} status={org.status} />
                </Stack>

                <Grid2 container spacing={3} sx={{ mb: 3 }}>
                    <Grid2 size={{ xs: 6, md: 3 }}>
                        <UsageGauge label="Orders this month" current={org.usage?.ordersThisMonth ?? 0} limit={org.limits?.ordersPerMonth ?? 500} />
                    </Grid2>
                    <Grid2 size={{ xs: 6, md: 3 }}>
                        <UsageGauge label="Products" current={org.usage?.productsTotal ?? 0} limit={org.limits?.products ?? 250} />
                    </Grid2>
                    <Grid2 size={{ xs: 6, md: 3 }}>
                        <UsageGauge label="Designs" current={org.usage?.designsTotal ?? 0} limit={org.limits?.designs ?? 100} />
                    </Grid2>
                    <Grid2 size={{ xs: 6, md: 3 }}>
                        <UsageGauge label="Users" current={org.usage?.usersTotal ?? 0} limit={org.limits?.users ?? 5} />
                    </Grid2>
                </Grid2>

                <Grid2 container spacing={3}>
                    <Grid2 size={{ xs: 12, md: 6 }}>
                        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>Users</Typography>
                        <Card variant="outlined">
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Name</TableCell>
                                        <TableCell>Email</TableCell>
                                        <TableCell>Role</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {users.map(u => (
                                        <TableRow key={u._id}>
                                            <TableCell>{u.firstName} {u.lastName}</TableCell>
                                            <TableCell>{u.email}</TableCell>
                                            <TableCell><Chip label={u.role} size="small" variant="outlined" /></TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Card>
                    </Grid2>
                    <Grid2 size={{ xs: 12, md: 6 }}>
                        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>Billing history</Typography>
                        <Card variant="outlined">
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Period</TableCell>
                                        <TableCell align="right">Orders</TableCell>
                                        <TableCell align="right">Overage</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {ledgers.map(l => (
                                        <TableRow key={l.period}>
                                            <TableCell>{l.period}</TableCell>
                                            <TableCell align="right">{l.orders?.toLocaleString()}</TableCell>
                                            <TableCell align="right">
                                                {l.totalOverageCharge > 0 ? `$${l.totalOverageCharge.toFixed(2)}` : "—"}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Card>
                    </Grid2>
                </Grid2>

            </Container>
        </Box>
    );
}

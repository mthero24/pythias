import { Organization, UsageLedger, PaymentReceived } from "@pythias/mongo";
import { Box, Container, Typography, Card, Table, TableBody, TableCell, TableHead, TableRow, Chip, Stack, Button } from "@mui/material";
import { TIERS } from "@/lib/tiers";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
    const orgs = await Organization.find({}).sort({ createdAt: -1 }).lean();

    const currentPeriod = new Date().toISOString().slice(0, 7);
    const ledgers = await UsageLedger.find({ period: currentPeriod }).lean();
    const ledgerMap = Object.fromEntries(ledgers.map(l => [l.orgId.toString(), l]));

    // PROJECTED monthly recurring (sum of active tiers) — "should be", NOT money received.
    const mrr = orgs
        .filter(o => o.status === 'active')
        .reduce((sum, o) => sum + (TIERS[o.tier]?.price ?? 0), 0);

    // TRUE received monies (PaymentReceived) — what Pythias ACTUALLY collected. Wallet top-ups are
    // prepaid fulfillment pass-through, so they're excluded from platform revenue.
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const [recvMonthAgg, recvAllAgg, recvByOrgAgg] = await Promise.all([
        PaymentReceived.aggregate([{ $match: { type: { $ne: "wallet" }, paidAt: { $gte: monthStart } } }, { $group: { _id: null, total: { $sum: "$amountCents" } } }]),
        PaymentReceived.aggregate([{ $match: { type: { $ne: "wallet" } } }, { $group: { _id: null, total: { $sum: "$amountCents" } } }]),
        PaymentReceived.aggregate([{ $match: { type: { $ne: "wallet" }, paidAt: { $gte: monthStart } } }, { $group: { _id: "$orgId", total: { $sum: "$amountCents" } } }]),
    ]);
    const receivedThisMonth = (recvMonthAgg[0]?.total ?? 0) / 100;
    const receivedAllTime   = (recvAllAgg[0]?.total ?? 0) / 100;
    const receivedByOrg     = Object.fromEntries(recvByOrgAgg.map(r => [String(r._id), (r.total ?? 0) / 100]));

    return (
        <Box sx={{ bgcolor: "background.default", minHeight: "100vh" }}>
            <Container maxWidth="lg" sx={{ py: 4 }}>

                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }} flexWrap="wrap" gap={2}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <Typography variant="h6" fontWeight={700}>Platform Admin</Typography>
                        <Button size="small" variant="outlined" href="/admin/analytics">Company Analytics</Button>
                    </Stack>
                    <Stack direction="row" spacing={3}>
                        <Box sx={{ textAlign: "right" }}>
                            <Typography variant="caption" color="success.main">Received (this mo)</Typography>
                            <Typography variant="h6" fontWeight={700} color="success.main">${receivedThisMonth.toLocaleString()}</Typography>
                        </Box>
                        <Box sx={{ textAlign: "right" }}>
                            <Typography variant="caption" color="text.secondary">All-time received</Typography>
                            <Typography variant="h6" fontWeight={700}>${receivedAllTime.toLocaleString()}</Typography>
                        </Box>
                        <Box sx={{ textAlign: "right" }}>
                            <Typography variant="caption" color="text.secondary">Projected MRR</Typography>
                            <Typography variant="h6" fontWeight={600} color="text.secondary">${mrr.toLocaleString()}/mo</Typography>
                        </Box>
                        <Box sx={{ textAlign: "right" }}>
                            <Typography variant="caption" color="text.secondary">Organizations</Typography>
                            <Typography variant="h6" fontWeight={700}>{orgs.length}</Typography>
                        </Box>
                    </Stack>
                </Stack>

                <Card variant="outlined">
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Organization</TableCell>
                                <TableCell>Tier</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell align="right">Orders (mo)</TableCell>
                                <TableCell align="right">Users</TableCell>
                                <TableCell align="right">Overage</TableCell>
                                <TableCell align="right">Received (mo)</TableCell>
                                <TableCell>Created</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {orgs.map(org => {
                                const ledger = ledgerMap[org._id.toString()];
                                return (
                                    <TableRow key={org._id} hover>
                                        <TableCell>
                                            <a href={`/admin/orgs/${org._id}`}>
                                                <Typography variant="body2" fontWeight={600}>{org.name}</Typography>
                                                <Typography variant="caption" color="text.secondary">{org.slug}</Typography>
                                            </a>
                                        </TableCell>
                                        <TableCell>
                                            <Chip label={TIERS[org.tier]?.label ?? org.tier} size="small" />
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={org.status}
                                                size="small"
                                                color={org.status === 'active' ? 'success' : org.status === 'trial' ? 'info' : 'error'}
                                                variant="outlined"
                                            />
                                        </TableCell>
                                        <TableCell align="right">
                                            {org.usage?.ordersThisMonth?.toLocaleString() ?? 0}
                                            {" / "}
                                            {org.limits?.ordersPerMonth === -1 ? "∞" : org.limits?.ordersPerMonth?.toLocaleString()}
                                        </TableCell>
                                        <TableCell align="right">{org.usage?.usersTotal ?? 0}</TableCell>
                                        <TableCell align="right">
                                            {ledger?.totalOverageCharge > 0
                                                ? <Typography variant="caption" color="warning.main">${ledger.totalOverageCharge.toFixed(2)}</Typography>
                                                : "—"}
                                        </TableCell>
                                        <TableCell align="right">
                                            {receivedByOrg[org._id.toString()]
                                                ? <Typography variant="caption" color="success.main">${receivedByOrg[org._id.toString()].toLocaleString()}</Typography>
                                                : "—"}
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="caption">
                                                {new Date(org.createdAt).toLocaleDateString()}
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </Card>

            </Container>
        </Box>
    );
}

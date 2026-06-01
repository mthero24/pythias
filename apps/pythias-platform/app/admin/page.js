import { Organization, UsageLedger } from "@pythias/mongo";
import { Box, Container, Typography, Card, Table, TableBody, TableCell, TableHead, TableRow, Chip, Stack } from "@mui/material";
import { TIERS } from "@/lib/tiers";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
    const orgs = await Organization.find({}).sort({ createdAt: -1 }).lean();

    const currentPeriod = new Date().toISOString().slice(0, 7);
    const ledgers = await UsageLedger.find({ period: currentPeriod }).lean();
    const ledgerMap = Object.fromEntries(ledgers.map(l => [l.orgId.toString(), l]));

    const mrr = orgs
        .filter(o => o.status === 'active')
        .reduce((sum, o) => sum + (TIERS[o.tier]?.price ?? 0), 0);

    return (
        <Box sx={{ bgcolor: "background.default", minHeight: "100vh" }}>
            <Container maxWidth="lg" sx={{ py: 4 }}>

                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                    <Typography variant="h6" fontWeight={700}>Platform Admin</Typography>
                    <Stack direction="row" spacing={2}>
                        <Box sx={{ textAlign: "right" }}>
                            <Typography variant="caption" color="text.secondary">MRR</Typography>
                            <Typography variant="h6" fontWeight={700}>${mrr.toLocaleString()}/mo</Typography>
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

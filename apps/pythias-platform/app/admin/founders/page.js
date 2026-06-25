import { Organization } from "@pythias/mongo";
import { Box, Container, Typography, Card, Table, TableBody, TableCell, TableHead, TableRow, Chip, Stack, Button, Alert } from "@mui/material";
import { TIERS } from "@/lib/tiers";
import CopyText from "./CopyText";

export const dynamic = "force-dynamic";

const ORG_TYPE_LABEL = {
    fulfillment: "Fulfillment Cloud",
    commerce: "Commerce Cloud",
    storefront: "Storefront Cloud",
};

export default async function AdminFoundersPage() {
    const founders = await Organization.find({ founder: true }).sort({ foundingSignupAt: -1 }).lean();

    return (
        <Box sx={{ bgcolor: "background.default", minHeight: "100vh" }}>
            <Container maxWidth="lg" sx={{ py: 4 }}>

                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }} flexWrap="wrap" gap={2}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <Typography variant="h6" fontWeight={700}>Founding Members</Typography>
                        <Button size="small" variant="outlined" href="/admin">All Organizations</Button>
                    </Stack>
                    <Box sx={{ textAlign: "right" }}>
                        <Typography variant="caption" color="text.secondary">Founding members</Typography>
                        <Typography variant="h6" fontWeight={700}>{founders.length}</Typography>
                    </Box>
                </Stack>

                <Alert severity="info" sx={{ mb: 3 }}>
                    Attach the Founding Member coupon (25% off, forever) to each org&apos;s Stripe customer.
                </Alert>

                {founders.length === 0 ? (
                    <Card variant="outlined">
                        <Box sx={{ p: 4, textAlign: "center" }}>
                            <Typography variant="body2" color="text.secondary">No founding members yet.</Typography>
                        </Box>
                    </Card>
                ) : (
                    <Card variant="outlined">
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Organization</TableCell>
                                    <TableCell>Billing email</TableCell>
                                    <TableCell>Cloud</TableCell>
                                    <TableCell>Tier</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>Signed up</TableCell>
                                    <TableCell>Stripe customer</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {founders.map(org => (
                                    <TableRow key={org._id} hover>
                                        <TableCell>
                                            <a href={`/admin/orgs/${org._id}`}>
                                                <Typography variant="body2" fontWeight={600}>{org.name}</Typography>
                                                <Typography variant="caption" color="text.secondary">{org.slug}</Typography>
                                            </a>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="caption">{org.billingEmail || "—"}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip label={ORG_TYPE_LABEL[org.orgType] ?? org.orgType} size="small" variant="outlined" />
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
                                        <TableCell>
                                            <Typography variant="caption">
                                                {org.foundingSignupAt ? new Date(org.foundingSignupAt).toLocaleString() : "—"}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            {org.stripeCustomerId
                                                ? <CopyText value={org.stripeCustomerId} />
                                                : <Typography variant="caption" color="text.secondary">—</Typography>}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Card>
                )}

            </Container>
        </Box>
    );
}

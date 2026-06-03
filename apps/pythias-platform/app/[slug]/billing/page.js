import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { redirect } from "next/navigation";
import { Organization, UsageLedger, KlingInvoicePlatform } from "@pythias/mongo";
import { Box, Container, Typography, Card, CardContent, Stack, Chip, Table, TableBody, TableCell, TableHead, TableRow, Divider } from "@mui/material";
import TierBadge from "@/components/TierBadge";
import { TIERS } from "@/lib/tiers";
import BillingActions from "./BillingActions";

export const dynamic = "force-dynamic";

export default async function BillingPage() {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    const orgId = session.user.orgId;

    const [org, ledgers, klingInvoices] = await Promise.all([
        Organization.findById(orgId).lean(),
        UsageLedger.find({ orgId }).sort({ period: -1 }).limit(12).lean(),
        KlingInvoicePlatform.find({ orgId }).sort({ period: -1 }).limit(12).lean(),
    ]);
    if (!org) redirect("/login");

    const tier = TIERS[org.tier];

    // Build a map of period → kling invoice for easy lookup
    const klingMap = {};
    for (const k of klingInvoices) klingMap[k.period] = k;

    // Collect all periods across both sources
    const allPeriods = [...new Set([
        ...ledgers.map(l => l.period),
        ...klingInvoices.map(k => k.period),
    ])].sort((a, b) => b.localeCompare(a)).slice(0, 12);

    const ledgerMap = {};
    for (const l of ledgers) ledgerMap[l.period] = l;

    return (
        <Box sx={{ bgcolor: "background.default", minHeight: "100vh" }}>
            <Container maxWidth="md" sx={{ py: 4 }}>

                <Typography variant="h6" fontWeight={700} sx={{ mb: 3 }}>Billing & Usage</Typography>

                <Card variant="outlined" sx={{ mb: 3 }}>
                    <CardContent>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                            <Box>
                                <Typography variant="subtitle1" fontWeight={700}>Current plan</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    ${tier.price}/month — renews on the 1st
                                </Typography>
                            </Box>
                            <TierBadge tier={org.tier} status={org.status} />
                        </Stack>
                        <Divider sx={{ my: 2 }} />
                        <Stack direction="row" flexWrap="wrap" gap={3}>
                            {[
                                { label: "Orders/mo", val: tier.limits.ordersPerMonth },
                                { label: "Products",  val: tier.limits.products },
                                { label: "Designs",   val: tier.limits.designs },
                                { label: "Users",     val: tier.limits.users },
                                { label: "Integrations", val: tier.limits.integrations },
                            ].map(({ label, val }) => (
                                <Box key={label} sx={{ textAlign: "center" }}>
                                    <Typography variant="body2" color="text.secondary">{label}</Typography>
                                    <Typography variant="subtitle2" fontWeight={700}>
                                        {val === -1 ? "Unlimited" : val.toLocaleString()}
                                    </Typography>
                                </Box>
                            ))}
                        </Stack>

                        {tier.overage?.order > 0 && (
                            <>
                                <Divider sx={{ my: 2 }} />
                                <Typography variant="caption" color="text.secondary">
                                    Overage: ${tier.overage.order}/order · ${tier.overage.product}/product/mo · ${tier.overage.design}/design/mo · ${tier.overage.user}/extra user/mo
                                </Typography>
                            </>
                        )}

                        <Divider sx={{ my: 2 }} />
                        <Typography variant="caption" color="text.secondary">
                            Kling AI Video: $8/video upcharge
                        </Typography>
                        <BillingActions
                            currentTier={org.tier}
                            hasStripeCustomer={!!org.stripeCustomerId}
                        />
                    </CardContent>
                </Card>

                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>Usage history</Typography>
                <Card variant="outlined">
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Period</TableCell>
                                <TableCell align="right">Orders</TableCell>
                                <TableCell align="right">Overage</TableCell>
                                <TableCell align="right">Kling Videos</TableCell>
                                <TableCell align="right">Total charge</TableCell>
                                <TableCell align="right">Status</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {allPeriods.map(period => {
                                const l = ledgerMap[period];
                                const k = klingMap[period];
                                const klingCharge = k?.totalAmount ?? 0;
                                const overageCharge = l?.totalOverageCharge ?? 0;
                                const totalCharge = overageCharge + klingCharge;
                                const invoiced = (l?.invoiced ?? false) || (k?.status === "invoiced" || k?.status === "paid");
                                return (
                                    <TableRow key={period}>
                                        <TableCell>{period}</TableCell>
                                        <TableCell align="right">{l ? l.orders.toLocaleString() : "—"}</TableCell>
                                        <TableCell align="right">
                                            {l?.overageOrders > 0 ? `${l.overageOrders} orders (+$${l.overageOrdersCharge.toFixed(2)})` : "—"}
                                        </TableCell>
                                        <TableCell align="right">
                                            {k?.videoCount > 0 ? `${k.videoCount} videos (+$${klingCharge.toFixed(2)})` : "—"}
                                        </TableCell>
                                        <TableCell align="right">
                                            {totalCharge > 0 ? `$${totalCharge.toFixed(2)}` : "—"}
                                        </TableCell>
                                        <TableCell align="right">
                                            <Chip
                                                label={invoiced ? "Invoiced" : "Pending"}
                                                size="small"
                                                color={invoiced ? "success" : "default"}
                                                variant="outlined"
                                            />
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                            {allPeriods.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} align="center">
                                        <Typography variant="caption" color="text.secondary">No billing history yet</Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </Card>

            </Container>
        </Box>
    );
}

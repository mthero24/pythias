"use client";
import {
    Box, Typography, Stack, Chip, Card, CardContent, Divider,
    Link, Button, IconButton, Tooltip, CircularProgress,
} from "@mui/material";
import { useState } from "react";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import RefreshIcon from "@mui/icons-material/Refresh";
import axios from "axios";
import { OrderItems as Items } from "./OrderItems";
import { OrderAddress as Address } from "./OrderAddress";

const STATUS_COLORS = {
    Received:   "info",
    Processing: "warning",
    Shipped:    "success",
    shipped:    "success",
    Delivered:  "success",
    Complete:   "success",
    Canceled:   "error",
    "Payment Failed": "error",
    "Out For Delivery": "warning",
};

const UPS_CARRIERS = ["TSC", "Zulily"];

export function OrderPage({ ord }) {
    const [order, setOrder] = useState(ord);
    const [trackingLoading, setTrackingLoading] = useState(false);

    const refreshTracking = async () => {
        setTrackingLoading(true);
        try {
            await axios.post("/api/production/shipping/track");
            window.location.reload();
        } catch {
            alert("Tracking refresh failed");
        } finally {
            setTrackingLoading(false);
        }
    };

    const labels = order.shippingInfo?.labels ?? [];
    const statusColor = STATUS_COLORS[order.status] ?? "default";

    return (
        <Box sx={{ width: "100%", maxWidth: "100%", overflowX: "hidden" }}>
            {/* Sticky header */}
            <Box sx={{
                position: "sticky", top: 0, zIndex: 100,
                bgcolor: "background.paper",
                borderBottom: "1px solid", borderColor: "divider",
                px: { xs: 2, sm: 3 }, py: 1.25,
            }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                        <Button variant="text" size="small" startIcon={<ArrowBackIcon />} href="/orders" sx={{ color: "text.secondary", px: 1 }}>
                            Orders
                        </Button>
                        <Typography variant="caption" color="text.disabled">/</Typography>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{order.poNumber}</Typography>
                        <Chip label={order.status} color={statusColor} size="small" variant="outlined" sx={{ fontSize: "0.65rem", height: 20 }} />
                    </Stack>
                </Stack>
            </Box>

            <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1200, mx: "auto" }}>
                {/* Order meta */}
                <Card variant="outlined" sx={{ borderRadius: 2, mb: 2 }}>
                    <CardContent sx={{ p: 2 }}>
                        <Stack direction="row" spacing={3} flexWrap="wrap" sx={{ gap: 2 }}>
                            {[
                                { label: "PO Number",    value: order.poNumber },
                                { label: "Order ID",     value: order.orderId },
                                { label: "Marketplace",  value: order.marketplace },
                                { label: "Shipping Type",value: order.shippingType },
                                { label: "Date",         value: order.date ? new Date(order.date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—" },
                                { label: "Product Cost", value: order.productCost != null ? `$${parseFloat(order.productCost).toFixed(2)}` : null },
                                { label: "Shipping Cost",value: order.shippingCost != null ? `$${parseFloat(order.shippingCost).toFixed(2)}` : null },
                            ].filter(f => f.value).map(({ label, value }) => (
                                <Box key={label}>
                                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, mb: 0.25 }}>{label}</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>{value}</Typography>
                                </Box>
                            ))}
                        </Stack>
                    </CardContent>
                </Card>

                <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 2, mb: 2 }}>
                    {/* Items + address */}
                    <Box sx={{ flex: 2, minWidth: 0 }}>
                        <Items order={order} source="PO" />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Address order={order} />
                    </Box>
                </Box>

                {/* Tracking */}
                {labels.length > 0 && (
                    <Card variant="outlined" sx={{ borderRadius: 2, mb: 2 }}>
                        <CardContent sx={{ p: 2 }}>
                            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
                                <Stack direction="row" alignItems="center" spacing={1}>
                                    <LocalShippingIcon sx={{ fontSize: 18, color: "primary.main" }} />
                                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Tracking</Typography>
                                </Stack>
                                <Tooltip title="Refresh tracking">
                                    <span>
                                        <IconButton size="small" onClick={refreshTracking} disabled={trackingLoading}>
                                            {trackingLoading ? <CircularProgress size={14} /> : <RefreshIcon sx={{ fontSize: 16 }} />}
                                        </IconButton>
                                    </span>
                                </Tooltip>
                            </Stack>
                            <Divider sx={{ mb: 2 }} />
                            <Stack spacing={2}>
                                {labels.map((l, i) => {
                                    const isUPS = UPS_CARRIERS.includes(order.marketplace);
                                    const isFedEx = l.provider === "fedex" || l.provider === "FedEx";
                                    const trackUrl = isUPS
                                        ? `https://www.ups.com/track?track=yes&trackNums=${l.trackingNumber}&loc=en_US&requester=ST/`
                                        : isFedEx
                                        ? `https://www.fedex.com/fedextrack/?trknbr=${l.trackingNumber}`
                                        : `https://tools.usps.com/go/TrackConfirmAction?qtc_tLabels1=${l.trackingNumber}`;

                                    const latest = l.trackingInfo?.[0]?.toLowerCase() ?? "";
                                    const statusLabel = l.delivered ? "Delivered"
                                        : latest.includes("out for delivery") ? "Out for Delivery"
                                        : l.trackingInfo?.length > 0 ? "In Transit" : "Pending";
                                    const statusColor = l.delivered ? "success"
                                        : latest.includes("out for delivery") ? "warning"
                                        : l.trackingInfo?.length > 0 ? "info" : "default";

                                    return (
                                        <Box key={l._id ?? i}>
                                            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5, flexWrap: "wrap", gap: 0.5 }}>
                                                <Link href={trackUrl} target="_blank" variant="body2" underline="hover"
                                                    sx={{ fontFamily: "monospace", fontSize: "0.78rem", fontWeight: 600, wordBreak: "break-all" }}>
                                                    {l.trackingNumber}
                                                </Link>
                                                <Chip label={statusLabel} color={statusColor} size="small"
                                                    variant={l.delivered ? "filled" : "outlined"}
                                                    sx={{ fontSize: "0.6rem", height: 18, flexShrink: 0 }} />
                                            </Stack>
                                            {l.expectedDelivery && !l.delivered && (
                                                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: l.trackingInfo?.length > 0 ? 1 : 0 }}>
                                                    Expected {new Date(l.expectedDelivery).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                                                </Typography>
                                            )}
                                            {l.trackingInfo?.length > 0 && (
                                                <Stack spacing={0.5}>
                                                    <Box sx={{
                                                        px: 1.25, py: 0.75, borderRadius: 1,
                                                        backgroundColor: l.delivered ? "rgba(46,125,50,0.06)" : "background.default",
                                                        border: "1px solid", borderColor: l.delivered ? "success.light" : "divider",
                                                    }}>
                                                        <Typography variant="caption" sx={{ fontWeight: 600, display: "block", lineHeight: 1.4 }}>
                                                            {l.trackingInfo[0]}
                                                        </Typography>
                                                    </Box>
                                                    {l.trackingInfo.slice(1).map((ev, idx) => (
                                                        <Typography key={idx} variant="caption" color="text.secondary"
                                                            sx={{ display: "block", pl: 1.5, borderLeft: "2px solid", borderColor: "divider", lineHeight: 1.4 }}>
                                                            {ev}
                                                        </Typography>
                                                    ))}
                                                </Stack>
                                            )}
                                        </Box>
                                    );
                                })}
                            </Stack>
                        </CardContent>
                    </Card>
                )}

                {/* Notes */}
                {order.notes?.length > 0 && (
                    <Card variant="outlined" sx={{ borderRadius: 2 }}>
                        <CardContent sx={{ p: 2 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>Notes</Typography>
                            <Divider sx={{ mb: 2 }} />
                            <Stack spacing={1}>
                                {order.notes.map((n, i) => (
                                    <Box key={i} sx={{ p: 1.25, borderRadius: 1, border: "1px solid", borderColor: "divider", bgcolor: "background.default" }}>
                                        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                                            {new Date(n.date).toLocaleDateString("en-US")}
                                        </Typography>
                                        <Typography variant="body2">{n.note}</Typography>
                                    </Box>
                                ))}
                            </Stack>
                        </CardContent>
                    </Card>
                )}
            </Box>
        </Box>
    );
}

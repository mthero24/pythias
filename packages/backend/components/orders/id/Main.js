"use client";
import {
    Box, Typography, Button, Grid2, Dialog, DialogTitle, DialogContent, DialogActions,
    Link, TextField, IconButton, Container, Stack, Card, CardContent, Chip,
    Divider, Collapse, Tooltip, Avatar, CircularProgress, Snackbar, Alert,
    Checkbox, FormControlLabel,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useState, useEffect } from "react";
import CreatableSelect from "react-select/creatable";
import axios from "axios";
import { Search } from "@pythias/backend";
import Image from "next/image";
import { Repull } from "@pythias/repull";
import { Footer } from "../../reusable/Footer";
import { RetryImage } from "../../reusable/RetryImage";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import NoteAddIcon from "@mui/icons-material/NoteAdd";
import EditIcon from "@mui/icons-material/Edit";
import BrushIcon from "@mui/icons-material/Brush";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import StickyNote2Icon from "@mui/icons-material/StickyNote2";
import RefreshIcon from "@mui/icons-material/Refresh";
import CancelIcon from "@mui/icons-material/Cancel";
import ReplayIcon from "@mui/icons-material/Replay";

const selectMenuPortalProps = {
    menuPortalTarget: typeof document !== "undefined" ? document.body : null,
    menuPosition: "fixed",
    styles: { menuPortal: (base) => ({ ...base, zIndex: 9999 }) },
};

const UPS_CARRIERS = ["TSC", "Zulily"];

const STATUS_META = {
    awaiting_shipment: { color: "warning", label: "Awaiting Shipment" },
    shipped: { color: "success", label: "Shipped" },
    cancelled: { color: "error", label: "Cancelled" },
    on_hold: { color: "default", label: "On Hold" },
};

const SectionCard = ({ icon, title, subtitle, children, action }) => (
    <Card variant="outlined" sx={{ borderRadius: 2 }}>
        <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
            <Stack direction="row" alignItems="flex-start" justifyContent="space-between" sx={{ mb: 1.5 }}>
                <Stack direction="row" spacing={1.5} alignItems="flex-start">
                    <Box sx={{ color: "primary.main", mt: 0.25 }}>{icon}</Box>
                    <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>{title}</Typography>
                        {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
                    </Box>
                </Stack>
                {action}
            </Stack>
            <Divider sx={{ mb: 2 }} />
            {children}
        </CardContent>
    </Card>
);

const isItemMissing = (i) =>
    (i.design == undefined && !i.isBlank) ||
    (Object.keys(i.design ?? {}).length === 0 && !i.isBlank) ||
    i.size == undefined ||
    i.color == undefined ||
    (i.blank == undefined && i.styleV2 == undefined);

export function Main({ ord, blanks, source, base = "" }) {
    const [order, setOrder] = useState(ord);
    const [item, setItem] = useState(null);
    const [blank, setBlank] = useState(null);
    const [size, setSize] = useState(null);
    const [color, setColor] = useState(null);
    const [openUpdate, setOpenUpdate] = useState(false);
    const [openDesign, setOpenDesign] = useState(false);
    const [shipped, setShipped] = useState(false);
    const [note, setNote] = useState(false);
    const [expandedItems, setExpandedItems] = useState({});
    const [trackingLoading, setTrackingLoading] = useState(false);
    const [editingAddress, setEditingAddress] = useState(false);
    const [addressForm, setAddressForm] = useState(ord.shippingAddress ?? {});
    const [addressSaving, setAddressSaving] = useState(false);
    const [cancelOpen, setCancelOpen] = useState(false);
    const [cancelling, setCancelling] = useState(false);
    const [cancelErr, setCancelErr] = useState("");
    const [repulling, setRepulling] = useState(false);
    const [repullSnack, setRepullSnack] = useState({ open: false, msg: "", severity: "success" });
    // Storefront refunds (cancel-with-refund + standalone customer-service refund).
    const [cancelRefund, setCancelRefund] = useState(true);
    const [refundOpen, setRefundOpen] = useState(false);
    const [refundBusy, setRefundBusy] = useState(false);
    const [refundErr, setRefundErr] = useState("");
    const [refundAmount, setRefundAmount] = useState("");   // dollars; blank = full remaining

    // Refunds only apply to storefront (Commerce Cloud) orders — that's where the payment lives.
    const isStorefront = order.source === "storefront";
    const orderTotalCents = Math.round((order.total || 0) * 100);
    const refundedCents = order.refundedCents || 0;
    const refundableCents = Math.max(0, orderTotalCents - refundedCents);
    const canRefund = isStorefront && !!order.paymentRef && refundableCents > 0;

    useEffect(() => {
        const shippedStatuses = ["Shipped", "shipped", "Out For Delivery"];
        if (!shippedStatuses.includes(ord.status)) return;
        if (!ord.shippingInfo?.labels?.length) return;
        setTrackingLoading(true);
        axios.post("/api/production/shipping/track", { orderId: ord._id })
            .then(res => {
                if (!res.data.error && res.data.order) {
                    setOrder(prev => ({
                        ...prev,
                        status: res.data.order.status,
                        shippingInfo: res.data.order.shippingInfo,
                    }));
                }
            })
            .catch(() => {})
            .finally(() => setTrackingLoading(false));
    }, []);

    const saveAddress = async () => {
        setAddressSaving(true);
        try {
            const res = await axios.post("/api/orders/address", { id: order._id, shippingAddress: addressForm });
            setOrder(prev => ({ ...prev, shippingAddress: res.data.shippingAddress }));
            setEditingAddress(false);
        } catch {
            alert("Failed to save address");
        } finally {
            setAddressSaving(false);
        }
    };

    const refreshTracking = async () => {
        setTrackingLoading(true);
        try {
            const res = await axios.post("/api/production/shipping/track", { orderId: order._id });
            if (!res.data.error && res.data.order) {
                setOrder(prev => ({
                    ...prev,
                    status: res.data.order.status,
                    shippingInfo: res.data.order.shippingInfo,
                }));
            }
        } catch {
            alert("Tracking refresh failed");
        } finally {
            setTrackingLoading(false);
        }
    };

    const cancelOrder = async () => {
        setCancelling(true); setCancelErr("");
        try {
            const doRefund = isStorefront && cancelRefund && refundableCents > 0;
            const res = await axios.post("/api/orders/cancel", { id: order._id, refund: doRefund, refundAmountCents: doRefund ? refundableCents : undefined });
            const rf = res.data?.refund;
            setOrder(prev => ({ ...prev, status: "cancelled", canceled: true, ...(rf && rf.refundedCents != null ? { refundedCents: rf.refundedCents, refunded: rf.fullyRefunded } : {}) }));
            if (rf?.error) setCancelErr(`Order cancelled, but the refund failed: ${rf.error}`);
            else setCancelOpen(false);
        } catch (e) {
            setCancelErr(e.response?.data?.error ?? "Failed to cancel order");
        } finally {
            setCancelling(false);
        }
    };

    // Standalone refund (customer service) — full or partial, without cancelling.
    const refundOrder = async () => {
        setRefundBusy(true); setRefundErr("");
        try {
            const dollars = parseFloat(refundAmount);
            const amountCents = (refundAmount && dollars > 0) ? Math.round(dollars * 100) : undefined; // blank = full remaining
            const res = await axios.post("/api/orders/refund", { orderId: order._id, amountCents, reason: "customer_service" });
            setOrder(prev => ({ ...prev, refundedCents: res.data.refundedCents, refunded: res.data.fullyRefunded }));
            setRefundOpen(false); setRefundAmount("");
        } catch (e) {
            setRefundErr(e.response?.data?.error ?? "Refund failed");
        } finally {
            setRefundBusy(false);
        }
    };

    const repullOrder = async () => {
        setRepulling(true);
        try {
            const res = await axios.post("/api/admin/orders/repull", { poNumber: order.poNumber });
            if (res.data.error) {
                setRepullSnack({ open: true, msg: res.data.msg ?? "Repull failed", severity: "error" });
            } else {
                setRepullSnack({ open: true, msg: `Pulled ${res.data.count} item(s) from ShipStation`, severity: "success" });
                setTimeout(() => window.location.reload(), 1500);
            }
        } catch (e) {
            setRepullSnack({ open: true, msg: e.response?.data?.msg ?? "Request failed", severity: "error" });
        } finally {
            setRepulling(false);
        }
    };

    const handleItemUpdate = (i) => {
        let b, s, c;
        if (i.blank) b = (blanks || []).filter(bl => bl?._id?.toString() === i.blank?.toString())[0];
        if (b && i.size) s = (b.sizes || []).filter(si => si?._id?.toString() === i.size?.toString())[0];
        if (b && i.color) c = (b.colors || []).filter(co => co?._id?.toString() === i.color?.toString())[0];
        setItem(i);
        setBlank(b);
        setSize(s);
        setColor(c);
        setOpenUpdate(true);
    };

    const toggleItem = (id) =>
        setExpandedItems(prev => ({ ...prev, [id]: !prev[id] }));

    const statusMeta = STATUS_META[order.status] ?? { color: "default", label: order.status };
    const canMarkShipped = !["shipped", "delivered"].includes(order.status?.toLowerCase());
    const canCancel = !["cancelled", "shipped", "delivered"].includes(order.status?.toLowerCase()) && !order.canceled;
    const missingCount = order.items.filter(isItemMissing).length;

    return (
        <Box sx={{ width: "100%", maxWidth: "100%", overflowX: "hidden" }}>
            {/* Sticky header */}
            <Box sx={{
                position: "sticky", top: 0, zIndex: 100,
                backgroundColor: "background.paper",
                borderBottom: "1px solid", borderColor: "divider",
                px: { xs: 2, sm: 3 }, py: 1.25,
            }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                        <Button variant="text" size="small" startIcon={<ArrowBackIcon />} href={`${base}/orders`} sx={{ color: "text.secondary", px: 1 }}>
                            Orders
                        </Button>
                        <Typography variant="caption" color="text.disabled">/</Typography>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{order.poNumber}</Typography>
                        <Chip
                            label={statusMeta.label}
                            color={statusMeta.color}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: "0.65rem", height: 20 }}
                        />
                        {missingCount > 0 && (
                            <Chip
                                icon={<WarningAmberIcon sx={{ fontSize: "14px !important" }} />}
                                label={`${missingCount} missing`}
                                color="warning"
                                size="small"
                                variant="outlined"
                                sx={{ fontSize: "0.65rem", height: 20 }}
                            />
                        )}
                    </Stack>
                    <Stack direction="row" spacing={1}>
                        {canCancel && (
                            <Button size="small" variant="outlined" color="error" startIcon={<CancelIcon />} onClick={() => { setCancelErr(""); setCancelOpen(true); }} sx={{ fontSize: "0.75rem" }}>
                                Cancel Order
                            </Button>
                        )}
                        {canRefund && (
                            <Button size="small" variant="outlined" color="warning" startIcon={<ReplayIcon />} onClick={() => { setRefundErr(""); setRefundAmount(""); setRefundOpen(true); }} sx={{ fontSize: "0.75rem" }}>
                                Refund
                            </Button>
                        )}
                        <Button size="small" variant="outlined" startIcon={<NoteAddIcon />} onClick={() => setNote(true)} sx={{ fontSize: "0.75rem" }}>
                            Add Note
                        </Button>
                        {canMarkShipped && (
                            <Button size="small" variant="contained" startIcon={<LocalShippingIcon />} onClick={() => setShipped(true)} sx={{ fontSize: "0.75rem" }}>
                                Mark Shipped
                            </Button>
                        )}
                    </Stack>
                </Stack>
            </Box>

            <Container maxWidth="lg" sx={{ py: 3 }}>
                <Grid2 container spacing={3}>

                    {/* Left column */}
                    <Grid2 size={{ xs: 12, md: 8 }}>
                        <Stack spacing={3}>

                            {/* Order details */}
                            <SectionCard icon={<LocalShippingIcon />} title="Order Details">
                                <Grid2 container spacing={2}>
                                    {[
                                        { label: "PO Number", value: order.poNumber },
                                        { label: "Order ID", value: order.orderId },
                                        { label: "Order Key", value: order.orderKey },
                                        { label: "Marketplace", value: order.marketplace },
                                        { label: "Shipping Type", value: order.shippingType },
                                        { label: "Date", value: order.date ? new Date(order.date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—" },
                                        { label: "Order Total", value: `$${((order.total ?? 0) - (order.discountAmount ?? 0)).toFixed(2)}${order.discountAmount > 0 ? ` (was $${(order.total ?? 0).toFixed(2)})` : ""}` },
                                        ...(order.discountAmount > 0 ? [
                                            { label: "Discount", value: `-$${(order.discountAmount).toFixed(2)}` },
                                            { label: "Discount Name", value: order.discountName || "—" },
                                        ] : []),
                                        ...(order.shippingCost != null ? [
                                            { label: "Shipping", value: `$${(order.shippingCost || 0).toFixed(2)}${order.shippingMethod ? ` (${order.shippingMethod})` : ""}` },
                                        ] : []),
                                        ...(order.taxAmountCents ? [
                                            { label: "Tax", value: `$${(order.taxAmountCents / 100).toFixed(2)}` },
                                        ] : []),
                                        ...(order.refundedCents > 0 ? [
                                            { label: "Refunded", value: `-$${(order.refundedCents / 100).toFixed(2)}${order.refunded ? " (full)" : ""}` },
                                        ] : []),
                                    ].map(({ label, value }) => (
                                        <Grid2 key={label} size={{ xs: 6, sm: 4 }}>
                                            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.25, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600 }}>{label}</Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 500, color: label === "Discount" ? "error.main" : "inherit" }}>{value || "—"}</Typography>
                                        </Grid2>
                                    ))}
                                </Grid2>
                            </SectionCard>

                            {/* Items */}
                            <SectionCard
                                icon={<BrushIcon />}
                                title="Items"
                                subtitle={`${order.items.length} item${order.items.length === 1 ? "" : "s"}${missingCount > 0 ? ` · ${missingCount} missing info` : ""}`}
                            >
                                <Stack spacing={1.5}>
                                    {order.items.map((i) => {
                                        const missing = isItemMissing(i);
                                        const isExpanded = !!expandedItems[i._id];
                                        const imageKeys = Object.keys(i.design ?? {}).filter(k => i.design[k] != undefined);
                                        // Custom "create your own" items carry a normalized placement per side — pass it
                                        // to renderImages so the order-page mockup shows the art at the buyer's real
                                        // position/size (not filling the whole print box). Empty for pre-made designs.
                                        const placeQS = (key) => {
                                            const p = (i.personalization?.sides || []).find(s => s.location === key)?.place;
                                            return (p && p.wPct > 0 && p.hPct > 0)
                                                ? `&xPct=${p.xPct ?? 0}&yPct=${p.yPct ?? 0}&wPct=${p.wPct}&hPct=${p.hPct}`
                                                : "";
                                        };
                                        const blankObj = blanks.filter(b => b._id === i.blank)[0];
                                        const blankImage = i.isBlank && i.blank && i.color
                                            ? blankObj?.images?.filter(im => im.color === i.color)[0]?.image?.replace("images1.pythiastechnologies.com", "images2.pythiastechnologies.com/origin")
                                            : null;

                                        return (
                                            <Card
                                                key={i._id}
                                                variant="outlined"
                                                sx={{
                                                    borderRadius: 1.5,
                                                    borderColor: missing ? "warning.light" : "divider",
                                                    backgroundColor: missing ? "rgba(255,167,38,0.03)" : "#fff",
                                                }}
                                            >
                                                {/* Item row */}
                                                <Box sx={{ display: "flex", gap: 1.5, p: 1.5, alignItems: "flex-start" }}>
                                                    {/* Image */}
                                                    <Box sx={{
                                                        width: 72, height: 72, flexShrink: 0, borderRadius: 1,
                                                        border: "1px solid", borderColor: "divider",
                                                        backgroundColor: "background.default",
                                                        display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
                                                    }}>
                                                        {blankImage ? (
                                                            <Image src={`${blankImage}?width=150`} alt={i.sku} width={72} height={72} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                                                        ) : imageKeys.length > 0 ? (
                                                            <RetryImage
                                                                src={source === "PO"
                                                                    ? `https://images4.tshirtpalace.com/images/productImages/SKU--${(i.colorName || "").toLowerCase()}-${(i.styleCode || "").toLowerCase()}-${imageKeys[0]}.webp?url=${i.design[imageKeys[0]]}&width=150`
                                                                    : `/api/renderImages/${i.styleCode}-${i.colorName}-${imageKeys[0]}.jpg?blank=${i.styleCode}&colorName=${i.colorName}&design=${i.design[imageKeys[0]]}&width=150&side=${imageKeys[0]}${placeQS(imageKeys[0])}${base ? `&orgSlug=${base.slice(1)}` : ""}`}
                                                                alt={i.sku}
                                                                width={72}
                                                                height={72}
                                                                style={{ width: "100%", height: "100%", objectFit: "contain" }}
                                                            />
                                                        ) : (
                                                            <Box sx={{ width: "100%", height: "100%", backgroundColor: "background.default" }} />
                                                        )}
                                                    </Box>

                                                    {/* Info */}
                                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                                        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
                                                            <Box sx={{ minWidth: 0 }}>
                                                                <Typography variant="body2" sx={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={i.name}>
                                                                    {i.name || "—"}
                                                                </Typography>
                                                                <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>{i.sku}</Typography>
                                                                {i.upc && <Typography variant="caption" color="text.disabled" sx={{ display: "block" }}>UPC: {i.upc}</Typography>}
                                                            </Box>
                                                            <Stack direction="row" spacing={0.5} flexShrink={0}>
                                                                {missing && (
                                                                    <Tooltip title="Missing item information">
                                                                        <WarningAmberIcon sx={{ fontSize: 18, color: "warning.main" }} />
                                                                    </Tooltip>
                                                                )}
                                                                <Tooltip title="Edit blank / size / color">
                                                                    <IconButton size="small" onClick={() => handleItemUpdate(i)}>
                                                                        <EditIcon sx={{ fontSize: 16 }} />
                                                                    </IconButton>
                                                                </Tooltip>
                                                                <Tooltip title="Change design">
                                                                    <IconButton size="small" onClick={() => { setItem(i); setOpenDesign(true); }}>
                                                                        <BrushIcon sx={{ fontSize: 16 }} />
                                                                    </IconButton>
                                                                </Tooltip>
                                                                {i.designRef && (
                                                                    <Tooltip title="Open design">
                                                                        <IconButton size="small" component="a" href={`${base}/admin/design/${i.designRef}`} target="_blank">
                                                                            <OpenInNewIcon sx={{ fontSize: 16 }} />
                                                                        </IconButton>
                                                                    </Tooltip>
                                                                )}
                                                                <IconButton size="small" onClick={() => toggleItem(i._id)}>
                                                                    {isExpanded ? <ExpandLessIcon sx={{ fontSize: 16 }} /> : <ExpandMoreIcon sx={{ fontSize: 16 }} />}
                                                                </IconButton>
                                                            </Stack>
                                                        </Stack>

                                                        <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: "wrap", gap: 0.5 }}>
                                                            {[
                                                                { label: i.colorName, prefix: "Color" },
                                                                { label: i.sizeName, prefix: "Size" },
                                                                { label: i.styleCode, prefix: "Blank" },
                                                                ...(i.price != null ? [{ label: `$${Number(i.price).toFixed(2)}`, prefix: "Price" }] : []),
                                                            ].map(({ label, prefix }) => (
                                                                <Chip
                                                                    key={prefix}
                                                                    label={label ? `${prefix}: ${label}` : `${prefix}: —`}
                                                                    size="small"
                                                                    variant="outlined"
                                                                    color={label ? "default" : "warning"}
                                                                    sx={{ fontSize: "0.65rem", height: 20 }}
                                                                />
                                                            ))}
                                                        </Stack>
                                                    </Box>
                                                </Box>

                                                {/* Steps */}
                                                <Collapse in={isExpanded} unmountOnExit>
                                                    <Divider />
                                                    <Box sx={{ px: 2, py: 1.5, backgroundColor: "background.default" }}>
                                                        {i.pieceId && (
                                                            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                                                                Piece ID: {i.pieceId}
                                                            </Typography>
                                                        )}
                                                        {i.steps?.length > 0 ? (
                                                            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 0.75 }}>
                                                                {i.steps.map((s) => (
                                                                    <Box key={s._id} sx={{
                                                                        px: 1.25, py: 0.5,
                                                                        borderRadius: 1,
                                                                        border: "1px solid", borderColor: "divider",
                                                                        backgroundColor: "#fff",
                                                                        textAlign: "center",
                                                                    }}>
                                                                        <Typography variant="caption" sx={{ fontWeight: 600, display: "block" }}>{s.status}</Typography>
                                                                        <Typography variant="caption" color="text.secondary">{new Date(s.date).toLocaleDateString("en-US")}</Typography>
                                                                    </Box>
                                                                ))}
                                                            </Stack>
                                                        ) : (
                                                            <Typography variant="caption" color="text.secondary">No steps recorded.</Typography>
                                                        )}
                                                    </Box>
                                                </Collapse>
                                            </Card>
                                        );
                                    })}
                                </Stack>
                            </SectionCard>

                        </Stack>
                    </Grid2>

                    {/* Right column */}
                    <Grid2 size={{ xs: 12, md: 4 }}>
                        <Stack spacing={2} sx={{ position: { md: "sticky" }, top: { md: 72 } }}>

                            {/* Shipping address */}
                            <SectionCard
                                icon={<LocalShippingIcon />}
                                title="Ship To"
                                action={
                                    !editingAddress ? (
                                        <Tooltip title="Edit address">
                                            <IconButton size="small" onClick={() => { setAddressForm(order.shippingAddress ?? {}); setEditingAddress(true); }}>
                                                <EditIcon sx={{ fontSize: 16 }} />
                                            </IconButton>
                                        </Tooltip>
                                    ) : null
                                }
                            >
                                {editingAddress ? (
                                    <Stack spacing={1.5}>
                                        <TextField label="Name" size="small" fullWidth value={addressForm.name ?? ""} onChange={e => setAddressForm(p => ({ ...p, name: e.target.value }))} />
                                        <TextField label="Address 1" size="small" fullWidth value={addressForm.address1 ?? ""} onChange={e => setAddressForm(p => ({ ...p, address1: e.target.value }))} />
                                        <TextField label="Address 2" size="small" fullWidth value={addressForm.address2 ?? ""} onChange={e => setAddressForm(p => ({ ...p, address2: e.target.value }))} />
                                        <Stack direction="row" spacing={1}>
                                            <TextField label="City" size="small" fullWidth value={addressForm.city ?? ""} onChange={e => setAddressForm(p => ({ ...p, city: e.target.value }))} />
                                            <TextField label="State" size="small" sx={{ width: 80 }} value={addressForm.state ?? ""} onChange={e => setAddressForm(p => ({ ...p, state: e.target.value }))} />
                                            <TextField label="Zip" size="small" sx={{ width: 100 }} value={addressForm.zip ?? ""} onChange={e => setAddressForm(p => ({ ...p, zip: e.target.value }))} />
                                        </Stack>
                                        <TextField label="Country" size="small" fullWidth value={addressForm.country ?? ""} onChange={e => setAddressForm(p => ({ ...p, country: e.target.value }))} />
                                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                                            <Button size="small" onClick={() => setEditingAddress(false)}>Cancel</Button>
                                            <Button size="small" variant="contained" onClick={saveAddress} disabled={addressSaving}>
                                                {addressSaving ? <CircularProgress size={14} /> : "Save"}
                                            </Button>
                                        </Stack>
                                    </Stack>
                                ) : (
                                    <Stack spacing={0.25}>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{order.shippingAddress?.name}</Typography>
                                        <Typography variant="body2" color="text.secondary">{order.shippingAddress?.address1}</Typography>
                                        {order.shippingAddress?.address2 && (
                                            <Typography variant="body2" color="text.secondary">{order.shippingAddress.address2}</Typography>
                                        )}
                                        <Typography variant="body2" color="text.secondary">
                                            {order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.zip?.split("-")[0]}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">{order.shippingAddress?.country}</Typography>
                                    </Stack>
                                )}
                            </SectionCard>

                            {/* Tracking */}
                            {order.shippingInfo?.labels?.length > 0 && (
                                <SectionCard
                                    icon={<LocalShippingIcon />}
                                    title="Tracking"
                                    action={
                                        <Tooltip title="Refresh tracking">
                                            <span>
                                                <IconButton size="small" onClick={refreshTracking} disabled={trackingLoading}>
                                                    {trackingLoading
                                                        ? <CircularProgress size={14} />
                                                        : <RefreshIcon sx={{ fontSize: 16 }} />}
                                                </IconButton>
                                            </span>
                                        </Tooltip>
                                    }
                                >
                                    <Stack spacing={2}>
                                        {order.shippingInfo.labels.map(l => {
                                            const isUPS = UPS_CARRIERS.includes(order.marketplace);
                                            const isFedEx = l.provider === "fedex" || l.provider === "FedEx";
                                            const trackUrl = isUPS
                                                ? `https://www.ups.com/track?track=yes&trackNums=${l.trackingNumber}&loc=en_US&requester=ST/`
                                                : isFedEx
                                                ? `https://www.fedex.com/fedextrack/?trknbr=${l.trackingNumber}`
                                                : `https://tools.usps.com/go/TrackConfirmAction?qtc_tLabels1=${l.trackingNumber}`;

                                            const events = (l.trackingInfo ?? []).filter(e => typeof e === "string");
                                            const latest = events[0]?.toLowerCase() ?? "";
                                            const statusLabel = l.delivered
                                                ? "Delivered"
                                                : latest.includes("out for delivery")
                                                ? "Out for Delivery"
                                                : events.length > 0
                                                ? "In Transit"
                                                : "Pending";
                                            const statusColor = l.delivered
                                                ? "success"
                                                : latest.includes("out for delivery")
                                                ? "warning"
                                                : events.length > 0
                                                ? "info"
                                                : "default";

                                            return (
                                                <Box key={l._id ?? l.trackingNumber}>
                                                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5, flexWrap: "wrap", gap: 0.5 }}>
                                                        <Link
                                                            href={trackUrl}
                                                            target="_blank"
                                                            variant="body2"
                                                            underline="hover"
                                                            sx={{ fontFamily: "monospace", fontSize: "0.78rem", fontWeight: 600, wordBreak: "break-all" }}
                                                        >
                                                            {l.trackingNumber}
                                                        </Link>
                                                        <Chip
                                                            label={statusLabel}
                                                            color={statusColor}
                                                            size="small"
                                                            variant={l.delivered ? "filled" : "outlined"}
                                                            sx={{ fontSize: "0.6rem", height: 18, flexShrink: 0 }}
                                                        />
                                                    </Stack>
                                                    {l.expectedDelivery && !l.delivered && (
                                                        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: events.length > 0 ? 1 : 0 }}>
                                                            Expected {new Date(l.expectedDelivery).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                                                        </Typography>
                                                    )}
                                                    {events.length > 0 && (
                                                        <Stack spacing={0.5}>
                                                            <Box sx={{
                                                                px: 1.25, py: 0.75, borderRadius: 1,
                                                                backgroundColor: l.delivered ? "rgba(46,125,50,0.06)" : "background.default",
                                                                border: "1px solid",
                                                                borderColor: l.delivered ? "success.light" : "divider",
                                                            }}>
                                                                <Typography variant="caption" sx={{ fontWeight: 600, display: "block", lineHeight: 1.4 }}>
                                                                    {events[0]}
                                                                </Typography>
                                                            </Box>
                                                            {events.slice(1).map((ev, idx) => (
                                                                <Typography
                                                                    key={idx}
                                                                    variant="caption"
                                                                    color="text.secondary"
                                                                    sx={{ display: "block", pl: 1.5, borderLeft: "2px solid", borderColor: "divider", lineHeight: 1.4 }}
                                                                >
                                                                    {ev}
                                                                </Typography>
                                                            ))}
                                                        </Stack>
                                                    )}
                                                </Box>
                                            );
                                        })}
                                    </Stack>
                                </SectionCard>
                            )}

                            {/* Notes */}
                            {order.notes?.length > 0 && (
                                <SectionCard icon={<StickyNote2Icon />} title="Notes">
                                    <Stack spacing={1}>
                                        {order.notes.map(n => (
                                            <Box key={n._id} sx={{ p: 1.25, borderRadius: 1, border: "1px solid", borderColor: "divider", backgroundColor: "background.default" }}>
                                                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                                                    <Avatar sx={{ width: 20, height: 20, fontSize: "0.6rem", backgroundColor: "primary.main" }}>
                                                        {n.userName?.[0]?.toUpperCase() ?? "?"}
                                                    </Avatar>
                                                    <Typography variant="caption" sx={{ fontWeight: 600 }}>{n.userName}</Typography>
                                                    <Typography variant="caption" color="text.disabled">
                                                        {new Date(n.date).toLocaleDateString("en-US")}
                                                    </Typography>
                                                </Stack>
                                                <Typography variant="body2" color="text.secondary">{n.note}</Typography>
                                            </Box>
                                        ))}
                                    </Stack>
                                </SectionCard>
                            )}

                            {/* Actions */}
                            <Card variant="outlined" sx={{ borderRadius: 2 }}>
                                <CardContent sx={{ p: 2 }}>
                                    <Stack spacing={1}>
                                        <Button fullWidth variant="outlined" startIcon={<NoteAddIcon />} onClick={() => setNote(true)}>
                                            Add Note
                                        </Button>
                                        <Button
                                            fullWidth
                                            variant="outlined"
                                            color="warning"
                                            startIcon={repulling ? <CircularProgress size={14} color="inherit" /> : <ReplayIcon />}
                                            onClick={repullOrder}
                                            disabled={repulling}
                                        >
                                            {repulling ? "Pulling…" : "Repull from ShipStation"}
                                        </Button>
                                        {canMarkShipped && (
                                            <Button fullWidth variant="contained" startIcon={<LocalShippingIcon />} onClick={() => setShipped(true)}>
                                                Mark Shipped
                                            </Button>
                                        )}
                                        {source === "printthreads" && (
                                            <>
                                                <Button fullWidth variant="outlined" color="success" onClick={async () => {
                                                    const res = await axios.post("/api/orders/printOracle", { orderId: order._id });
                                                    if (res?.data) alert(res.data.msg);
                                                }}>
                                                    Send to Print Oracle
                                                </Button>
                                                <Button fullWidth variant="outlined" color="inherit" onClick={async () => {
                                                    const res = await axios.get(`/api/orders/printOracle?orderId=${order._id}`);
                                                    if (res?.data) alert(res.data.msg);
                                                }}>
                                                    Update
                                                </Button>
                                            </>
                                        )}
                                    </Stack>
                                </CardContent>
                            </Card>

                        </Stack>
                    </Grid2>
                </Grid2>
            </Container>

            <UpdateModal open={openUpdate} setOpen={setOpenUpdate} item={item} setItem={setItem} blank={blank} setBlank={setBlank} size={size} setSize={setSize} color={color} setColor={setColor} blanks={blanks} setOrder={setOrder} />
            <AddDesignModal open={openDesign} setOpen={setOpenDesign} item={item} setItem={setItem} setOrder={setOrder} />
            <ShippedModal open={shipped} setOpen={setShipped} order={order} setOrder={setOrder} />
            <NoteModal open={note} setOpen={setNote} order={order} setOrder={setOrder} />
            <Repull />

            <Snackbar
                open={repullSnack.open}
                autoHideDuration={4000}
                onClose={() => setRepullSnack(s => ({ ...s, open: false }))}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            >
                <Alert severity={repullSnack.severity} variant="filled" onClose={() => setRepullSnack(s => ({ ...s, open: false }))}>
                    {repullSnack.msg}
                </Alert>
            </Snackbar>

            {/* Cancel confirmation dialog */}
            <Dialog open={cancelOpen} onClose={() => !cancelling && setCancelOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 1 }}>
                    <CancelIcon color="error" fontSize="small" />
                    Cancel Order
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                        Are you sure you want to cancel <strong>{order.poNumber}</strong>?
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {order.marketplaceConnectionId
                            ? "This order will be cancelled in our system and on the marketplace."
                            : order.orderId?.startsWith("MANUAL-")
                                ? "This order will be cancelled in our system."
                                : "This order will be cancelled in our system and in ShipStation."
                        }
                    </Typography>
                    {isStorefront && refundableCents > 0 && (
                        <FormControlLabel
                            sx={{ mt: 1, display: "block" }}
                            control={<Checkbox checked={cancelRefund} onChange={(e) => setCancelRefund(e.target.checked)} />}
                            label={`Refund the customer $${(refundableCents / 100).toFixed(2)}`}
                        />
                    )}
                    {cancelErr && <Typography variant="body2" color="error" sx={{ mt: 1 }}>{cancelErr}</Typography>}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setCancelOpen(false)} disabled={cancelling}>Keep Order</Button>
                    <Button
                        variant="contained" color="error"
                        onClick={cancelOrder}
                        disabled={cancelling}
                        startIcon={cancelling ? <CircularProgress size={14} color="inherit" /> : <CancelIcon />}
                    >
                        {cancelling ? "Cancelling…" : "Yes, Cancel"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Refund (customer service) dialog — full or partial, without cancelling */}
            <Dialog open={refundOpen} onClose={() => !refundBusy && setRefundOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 1 }}>
                    <ReplayIcon color="warning" fontSize="small" />
                    Refund Customer
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                        Refund <strong>{order.poNumber}</strong>. Leave the amount blank to refund the full remaining balance
                        (${(refundableCents / 100).toFixed(2)}{refundedCents > 0 ? `; $${(refundedCents / 100).toFixed(2)} already refunded` : ""}).
                    </Typography>
                    <TextField
                        size="small" fullWidth autoFocus
                        label="Refund amount (USD)"
                        placeholder={(refundableCents / 100).toFixed(2)}
                        value={refundAmount}
                        onChange={(e) => setRefundAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                        InputProps={{ startAdornment: <Typography sx={{ mr: 0.5 }}>$</Typography> }}
                    />
                    {refundErr && <Typography variant="body2" color="error" sx={{ mt: 1 }}>{refundErr}</Typography>}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setRefundOpen(false)} disabled={refundBusy}>Close</Button>
                    <Button
                        variant="contained" color="warning"
                        onClick={refundOrder}
                        disabled={refundBusy}
                        startIcon={refundBusy ? <CircularProgress size={14} color="inherit" /> : <ReplayIcon />}
                    >
                        {refundBusy ? "Refunding…" : "Issue Refund"}
                    </Button>
                </DialogActions>
            </Dialog>

            <Footer />
        </Box>
    );
}

const NoteModal = ({ open, setOpen, order, setOrder }) => {
    const [note, setNote] = useState("");

    const addNote = async () => {
        const res = await axios.post("/api/orders/notes", { note, order });
        if (res?.data?.error) alert(res.data.msg);
        else {
            setNote("");
            setOrder(res.data.order);
            setOpen(false);
        }
    };

    return (
        <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                Add Note
                <IconButton size="small" onClick={() => setOpen(false)}><CloseIcon fontSize="small" /></IconButton>
            </DialogTitle>
            <DialogContent dividers>
                <TextField
                    fullWidth multiline rows={5} label="Note"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                />
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={() => setOpen(false)}>Cancel</Button>
                <Button variant="contained" onClick={addNote} disabled={!note.trim()}>Save Note</Button>
            </DialogActions>
        </Dialog>
    );
};

const ShippedModal = ({ open, setOpen, order, setOrder }) => {
    const existingTracking = order?.shippingInfo?.labels?.[0]?.trackingNumber ?? "";
    const existingProvider = order?.shippingInfo?.labels?.[0]?.provider ?? "";

    const [trackingNumber, setTrackingNumber] = useState("");
    const [provider,       setProvider]       = useState("");
    const [submitting,     setSubmitting]      = useState(false);
    const [warning,        setWarning]         = useState(null);

    const effectiveTracking = trackingNumber.trim() || existingTracking;
    const noTracking        = !effectiveTracking;

    const markShipped = async () => {
        setSubmitting(true);
        setWarning(null);
        try {
            const res = await axios.post("/api/orders/shipped", { order, trackingNumber, provider });
            if (res?.data?.error) {
                setWarning(res.data.msg);
            } else {
                setOrder(res.data.order);
                if (res.data.warning) {
                    setWarning(res.data.warning);
                    // Leave modal open so user sees the warning before closing
                } else {
                    setTrackingNumber("");
                    setProvider("");
                    setOpen(false);
                }
            }
        } catch (e) {
            setWarning(e.message || "Something went wrong.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        setTrackingNumber("");
        setProvider("");
        setWarning(null);
        setOpen(false);
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                Mark as Shipped
                <IconButton size="small" onClick={handleClose}><CloseIcon fontSize="small" /></IconButton>
            </DialogTitle>
            <DialogContent dividers>
                <Stack spacing={2} sx={{ pt: 0.5 }}>
                    {noTracking && (
                        <Alert severity="warning">
                            No tracking number — the marketplace will <strong>not</strong> be updated automatically unless you enter one.
                        </Alert>
                    )}
                    <TextField
                        fullWidth
                        label="Tracking Number"
                        value={trackingNumber}
                        onChange={(e) => setTrackingNumber(e.target.value)}
                        placeholder={existingTracking || "Enter tracking number"}
                        helperText={existingTracking && !trackingNumber ? `Using existing: ${existingTracking}` : ""}
                    />
                    <TextField
                        fullWidth
                        label="Shipping Provider"
                        value={provider}
                        onChange={(e) => setProvider(e.target.value)}
                        placeholder={existingProvider || "e.g. USPS, UPS, FedEx"}
                        helperText={existingProvider && !provider ? `Using existing: ${existingProvider}` : ""}
                    />
                    {warning && <Alert severity={warning.toLowerCase().includes("fail") ? "error" : "warning"}>{warning}</Alert>}
                </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={handleClose}>Cancel</Button>
                <Button
                    variant="contained"
                    startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <LocalShippingIcon />}
                    onClick={markShipped}
                    disabled={submitting}
                >
                    {submitting ? "Saving…" : "Mark Shipped"}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

const AddDesignModal = ({ open, setOpen, item, setItem, setOrder }) => {
    const [designs, setDesigns] = useState([]);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [design, setDesign] = useState(null);

    const updateItem = async () => {
        const res = await axios.put("/api/admin/items", { item });
        if (res.data.error) alert(res.data.msg);
        else {
            setOrder(res.data.order);
            setItem(null);
            setOpen(false);
        }
    };

    const firstImageUrl = (d) => {
        const url = d.images?.front ?? d.images?.back ?? d.images?.leftSleeve ?? d.images?.rightSleeve ?? d.images?.pocket;
        return url ? url.replace("images1.pythiastechnologies.com", "images2.pythiastechnologies.com/origin") : "/missingImage.jpg";
    };

    return (
        <Dialog open={open} onClose={() => { setOpen(false); setItem(null); }} maxWidth="lg" fullWidth PaperProps={{ sx: { height: "90vh" } }}>
            <DialogTitle sx={{ fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                Change Design — {item?.sku}
                <IconButton size="small" onClick={() => setOpen(false)}><CloseIcon fontSize="small" /></IconButton>
            </DialogTitle>
            <DialogContent dividers sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Search setDesigns={setDesigns} search={search} setSearch={setSearch} setPage={setPage} setHasMore={setHasMore} />
                <Grid2 container spacing={1.5}>
                    {designs.map(d => (
                        <Grid2 key={d._id} size={{ xs: 6, sm: 4, md: 3 }}>
                            <Card
                                variant="outlined"
                                onClick={() => {
                                    let i = { ...item };
                                    i.designRef = d._id;
                                    i.design = d.images;
                                    setItem({ ...i });
                                    setDesign(d._id);
                                }}
                                sx={{
                                    borderRadius: 1.5, cursor: "pointer",
                                    borderColor: design === d._id ? "primary.main" : "divider",
                                    borderWidth: design === d._id ? 2 : 1,
                                    transition: "box-shadow 150ms, border-color 150ms",
                                    "&:hover": { boxShadow: 3 },
                                }}
                            >
                                <Box sx={{ aspectRatio: "1/1", backgroundColor: "background.default", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                                    <RetryImage
                                        src={`${firstImageUrl(d)}?width=300`}
                                        alt={d.name}
                                        style={{ width: "100%", height: "100%", objectFit: "contain" }}
                                    />
                                </Box>
                                <Divider />
                                <Box sx={{ px: 1.5, py: 1 }}>
                                    <Typography variant="caption" sx={{ fontWeight: 600, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.name || "—"}</Typography>
                                    <Typography variant="caption" color="text.secondary">{d.sku}</Typography>
                                </Box>
                            </Card>
                        </Grid2>
                    ))}
                </Grid2>
                {hasMore && (
                    <Button variant="outlined" onClick={() => setPage(p => p + 1)} fullWidth>Load more</Button>
                )}
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={() => setOpen(false)}>Cancel</Button>
                <Button variant="contained" onClick={updateItem} disabled={!design}>Apply Design</Button>
            </DialogActions>
        </Dialog>
    );
};

const UpdateModal = ({ open, setOpen, blanks, item, blank, color, size, setItem, setBlank, setSize, setColor, setOrder }) => {
    const handleBlankChange = (val) => {
        let i = { ...item };
        i.blank = blanks.filter(b => b._id.toString() === val)[0];
        i.styleCode = i.blank.code;
        setBlank(i.blank);
        setItem({ ...i });
    };

    const handleSizeChange = (val) => {
        let i = { ...item };
        i.size = val.value;
        i.sizeName = val.label;
        setItem({ ...i });
    };

    const handleColorChange = (val) => {
        let i = { ...item };
        i.color = val.value;
        i.colorName = val.label;
        setItem({ ...i });
    };

    const updateItem = async () => {
        const res = await axios.put("/api/admin/items", { item });
        if (res.data.error) alert(res.data.msg);
        else {
            setOrder(res.data.order);
            setItem(null);
            setBlank(null);
            setSize(null);
            setColor(null);
            setOpen(false);
        }
    };

    const close = () => {
        setOpen(false);
        setItem(null);
        setBlank(null);
        setSize(null);
        setColor(null);
    };

    return (
        <Dialog open={open} onClose={close} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                Edit Item — {item?.sku}
                <IconButton size="small" onClick={close}><CloseIcon fontSize="small" /></IconButton>
            </DialogTitle>
            <DialogContent dividers>
                <Stack spacing={2} sx={{ pt: 0.5 }}>
                    <Box>
                        <Typography variant="caption" sx={{ display: "block", mb: 0.5, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, color: "text.secondary" }}>Blank</Typography>
                        <CreatableSelect
                            {...selectMenuPortalProps}
                            placeholder="Select blank"
                            value={item?.blank ? { label: item.blank?.code, value: item.blank?._id } : null}
                            options={blanks.map(b => ({ label: b.code, value: b._id }))}
                            onChange={(val) => handleBlankChange(val.value)}
                        />
                    </Box>
                    <Box>
                        <Typography variant="caption" sx={{ display: "block", mb: 0.5, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, color: "text.secondary" }}>Size</Typography>
                        <CreatableSelect
                            {...selectMenuPortalProps}
                            placeholder="Select size"
                            value={item?.size ? { label: item.sizeName, value: item.size } : null}
                            options={blank?.sizes.map(b => ({ label: b.name, value: b._id })) ?? []}
                            onChange={handleSizeChange}
                        />
                    </Box>
                    <Box>
                        <Typography variant="caption" sx={{ display: "block", mb: 0.5, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, color: "text.secondary" }}>Color</Typography>
                        <CreatableSelect
                            {...selectMenuPortalProps}
                            placeholder="Select color"
                            value={item?.color ? { label: item.colorName, value: item.color } : null}
                            options={blank?.colors.map(b => ({ label: b.name, value: b._id })) ?? []}
                            onChange={handleColorChange}
                        />
                    </Box>
                    {item?.upc && (
                        <Typography variant="caption" color="text.secondary">UPC: {item.upc}</Typography>
                    )}
                </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={close}>Cancel</Button>
                <Button variant="contained" onClick={updateItem}>Save Changes</Button>
            </DialogActions>
        </Dialog>
    );
};

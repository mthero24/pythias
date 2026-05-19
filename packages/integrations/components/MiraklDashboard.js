"use client";
import {
    Box, Container, Typography, Stack, Chip, Button, TextField,
    Tab, Tabs, Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
    Paper, Dialog, DialogTitle, DialogContent, DialogActions,
    Alert, CircularProgress, IconButton, Select, MenuItem, FormControl, InputLabel,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import CheckIcon from "@mui/icons-material/Check";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CloseIcon from "@mui/icons-material/Close";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import axios from "axios";

function errMsg(e) {
    const d = e.response?.data;
    if (!d) return e.message ?? "Request failed";
    if (typeof d === "string") return d;
    const inner = d.error ?? d.message ?? d;
    if (typeof inner === "string") return inner;
    return JSON.stringify(inner);
}

function TabPanel({ value, index, children }) {
    return value === index ? <Box sx={{ py: 3 }}>{children}</Box> : null;
}

const STATE_COLORS = {
    WAITING_ACCEPTANCE:   { color: "#6366f1", bg: "#e0e7ff" },
    WAITING_DEBIT:        { color: "#3b82f6", bg: "#dbeafe" },
    WAITING_DEBIT_PAYMENT:{ color: "#3b82f6", bg: "#dbeafe" },
    SHIPPING:             { color: "#f59e0b", bg: "#fef3c7" },
    SHIPPED:              { color: "#10b981", bg: "#d1fae5" },
    TO_COLLECT:           { color: "#10b981", bg: "#d1fae5" },
    RECEIVED:             { color: "#10b981", bg: "#d1fae5" },
    CLOSED:               { color: "#6b7280", bg: "#f3f4f6" },
    REFUSED:              { color: "#ef4444", bg: "#fee2e2" },
    CANCELED:             { color: "#ef4444", bg: "#fee2e2" },
    INCIDENT_OPEN:        { color: "#d97706", bg: "#fef3c7" },
    INCIDENT_CLOSED:      { color: "#6b7280", bg: "#f3f4f6" },
};

function StateChip({ state }) {
    const s = STATE_COLORS[state] ?? { color: "#6b7280", bg: "#f3f4f6" };
    return (
        <Chip label={state ?? "—"} size="small"
            sx={{ bgcolor: s.bg, color: s.color, fontWeight: 600, fontSize: "0.7rem", border: "none" }} />
    );
}

const CARRIERS = ["USPS", "UPS", "FEDEX", "DHL", "DHL_EXPRESS", "ONTRAC", "LSO", "LASERSHIP", "OTHER"];

function ShipDialog({ open, order, connectionId, onClose, onSaved }) {
    const [carrier, setCarrier]             = useState("USPS");
    const [trackingNumber, setTrackingNumber] = useState("");
    const [saving, setSaving]               = useState(false);
    const [error, setError]                 = useState("");

    useEffect(() => { setCarrier("USPS"); setTrackingNumber(""); setError(""); }, [order]);

    const save = async () => {
        if (!trackingNumber.trim()) { setError("Tracking number is required"); return; }
        setSaving(true);
        setError("");
        try {
            await axios.post("/api/integrations/mirakl/orders", {
                connectionId,
                orderId: order.order_id,
                action: "ship",
                carrier,
                trackingNumber: trackingNumber.trim(),
            });
            onSaved();
        } catch (e) {
            setError(errMsg(e));
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle sx={{ fontWeight: 700, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                Ship Order {order?.order_id}
                <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
            </DialogTitle>
            <DialogContent dividers>
                <Stack spacing={2} sx={{ pt: 1 }}>
                    {error && <Alert severity="error">{error}</Alert>}
                    <FormControl fullWidth size="small">
                        <InputLabel>Carrier</InputLabel>
                        <Select value={carrier} label="Carrier" onChange={e => setCarrier(e.target.value)}>
                            {CARRIERS.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                        </Select>
                    </FormControl>
                    <TextField
                        fullWidth size="small" label="Tracking Number"
                        value={trackingNumber}
                        onChange={e => setTrackingNumber(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && save()}
                        autoFocus
                    />
                </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={onClose}>Cancel</Button>
                <Button
                    variant="contained" onClick={save} disabled={saving || !trackingNumber.trim()}
                    startIcon={saving ? <CircularProgress size={14} color="inherit" /> : null}
                    sx={{ bgcolor: "#1d4ed8", "&:hover": { bgcolor: "#1e40af" } }}
                >
                    Mark Shipped
                </Button>
            </DialogActions>
        </Dialog>
    );
}

const ORDER_STATE_FILTERS = [
    { label: "All Open",   value: "WAITING_ACCEPTANCE,WAITING_DEBIT,WAITING_DEBIT_PAYMENT,SHIPPING" },
    { label: "New",        value: "WAITING_ACCEPTANCE" },
    { label: "Accepted",   value: "WAITING_DEBIT,WAITING_DEBIT_PAYMENT" },
    { label: "Shipping",   value: "SHIPPING" },
    { label: "Shipped",    value: "SHIPPED,TO_COLLECT,RECEIVED" },
    { label: "Closed",     value: "CLOSED,CANCELED,REFUSED" },
];

function OrdersTab({ connectionId }) {
    const [orders, setOrders]       = useState([]);
    const [loading, setLoading]     = useState(false);
    const [error, setError]         = useState("");
    const [filter, setFilter]       = useState(ORDER_STATE_FILTERS[0].value);
    const [shipTarget, setShipTarget] = useState(null);
    const [accepting, setAccepting] = useState(null);

    const load = useCallback(async (orderStates) => {
        setLoading(true);
        setError("");
        try {
            const params = new URLSearchParams({ connectionId, orderStates, max: 100 });
            const res = await axios.get(`/api/integrations/mirakl/orders?${params}`);
            const sorted = (res.data.orders ?? []).sort(
                (a, b) => new Date(b.created_date ?? 0) - new Date(a.created_date ?? 0)
            );
            setOrders(sorted);
        } catch (e) {
            setError(errMsg(e));
        } finally {
            setLoading(false);
        }
    }, [connectionId]);

    useEffect(() => { load(filter); }, [load, filter]);

    const accept = async (order) => {
        setAccepting(order.order_id);
        try {
            await axios.post("/api/integrations/mirakl/orders", {
                connectionId,
                orderId: order.order_id,
                action: "accept",
            });
            load(filter);
        } catch (e) {
            setError(errMsg(e));
        } finally {
            setAccepting(null);
        }
    };

    const canAccept = (state) => state === "WAITING_ACCEPTANCE";
    const canShip   = (state) => state === "WAITING_DEBIT" || state === "WAITING_DEBIT_PAYMENT" || state === "SHIPPING";

    return (
        <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                    {ORDER_STATE_FILTERS.map(f => (
                        <Chip
                            key={f.value}
                            label={f.label}
                            size="small"
                            onClick={() => setFilter(f.value)}
                            variant={filter === f.value ? "filled" : "outlined"}
                            color={filter === f.value ? "primary" : "default"}
                            sx={{ cursor: "pointer" }}
                        />
                    ))}
                </Stack>
                <IconButton onClick={() => load(filter)} disabled={loading} size="small">
                    <RefreshIcon />
                </IconButton>
            </Stack>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                    <TableHead>
                        <TableRow sx={{ bgcolor: "#f8fafc" }}>
                            <TableCell sx={{ fontWeight: 700 }}>Order ID</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Customer</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Items</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Total</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>State</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {orders.map(o => {
                            const lines = o.order_lines ?? [];
                            const total = lines.reduce((sum, l) => sum + (l.total_price ?? 0), 0);
                            const customer = o.customer?.firstname && o.customer?.lastname
                                ? `${o.customer.firstname} ${o.customer.lastname}`
                                : o.customer?.email ?? "—";
                            return (
                                <TableRow key={o.order_id} hover>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight={500}>{o.order_id}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="caption" color="text.secondary">
                                            {o.created_date ? new Date(o.created_date).toLocaleDateString() : "—"}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">{customer}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Stack spacing={0.25}>
                                            {lines.slice(0, 3).map((l, i) => (
                                                <Typography key={i} variant="caption">
                                                    {l.offer_sku} × {l.quantity}
                                                </Typography>
                                            ))}
                                            {lines.length > 3 && (
                                                <Typography variant="caption" color="text.secondary">+{lines.length - 3} more</Typography>
                                            )}
                                        </Stack>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">
                                            {total > 0 ? `$${total.toFixed(2)}` : "—"}
                                        </Typography>
                                    </TableCell>
                                    <TableCell><StateChip state={o.order_state?.state} /></TableCell>
                                    <TableCell>
                                        <Stack direction="row" spacing={1}>
                                            {canAccept(o.order_state?.state) && (
                                                <Button
                                                    size="small" variant="outlined"
                                                    startIcon={accepting === o.order_id
                                                        ? <CircularProgress size={12} />
                                                        : <CheckIcon sx={{ fontSize: 14 }} />}
                                                    disabled={accepting === o.order_id}
                                                    onClick={() => accept(o)}
                                                >
                                                    Accept
                                                </Button>
                                            )}
                                            {canShip(o.order_state?.state) && (
                                                <Button
                                                    size="small" variant="outlined" color="success"
                                                    startIcon={<LocalShippingIcon sx={{ fontSize: 14 }} />}
                                                    onClick={() => setShipTarget(o)}
                                                >
                                                    Ship
                                                </Button>
                                            )}
                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                        {!loading && orders.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} align="center">
                                    <Typography variant="body2" color="text.secondary" py={3}>
                                        No orders found
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {loading && <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}><CircularProgress /></Box>}

            <ShipDialog
                open={!!shipTarget}
                order={shipTarget}
                connectionId={connectionId}
                onClose={() => setShipTarget(null)}
                onSaved={() => { setShipTarget(null); load(filter); }}
            />
        </Box>
    );
}

function OffersTab({ connectionId }) {
    const [offers, setOffers]   = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError]     = useState("");

    const load = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const params = new URLSearchParams({ connectionId, max: 100 });
            const res = await axios.get(`/api/integrations/mirakl/offers?${params}`);
            setOffers(res.data.offers ?? []);
        } catch (e) {
            setError(errMsg(e));
        } finally {
            setLoading(false);
        }
    }, [connectionId]);

    useEffect(() => { load(); }, [load]);

    return (
        <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Offers ({offers.length})</Typography>
                <IconButton onClick={load} disabled={loading} size="small"><RefreshIcon /></IconButton>
            </Stack>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                    <TableHead>
                        <TableRow sx={{ bgcolor: "#f8fafc" }}>
                            <TableCell sx={{ fontWeight: 700 }}>SKU</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Product</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Price</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Quantity</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>State</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {offers.map(o => (
                            <TableRow key={o.offer_id ?? o.sku} hover>
                                <TableCell>
                                    <Typography variant="body2" fontWeight={500}>{o.sku}</Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2">{o.product_title ?? o.product_id ?? "—"}</Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2">
                                        {o.price != null ? `$${Number(o.price).toFixed(2)}` : "—"}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2">{o.quantity ?? "—"}</Typography>
                                </TableCell>
                                <TableCell>
                                    <StateChip state={o.active ? "ACTIVE" : "INACTIVE"} />
                                </TableCell>
                            </TableRow>
                        ))}
                        {!loading && offers.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} align="center">
                                    <Typography variant="body2" color="text.secondary" py={3}>No offers found</Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
            {loading && <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}><CircularProgress /></Box>}
        </Box>
    );
}

export function MiraklDashboard({ connection }) {
    const [tab, setTab] = useState(0);
    const connectionId = connection._id ?? connection.id;

    return (
        <Container maxWidth="xl" sx={{ py: 3 }}>
            <Stack direction="row" alignItems="center" spacing={2} mb={3}>
                <Button component={Link} href="/admin/integrations" startIcon={<ArrowBackIcon />} size="small">
                    Integrations
                </Button>
                <Box sx={{
                    bgcolor: "#1d4ed8", px: 2, py: 1, borderRadius: 1,
                    display: "flex", alignItems: "center",
                }}>
                    <Typography variant="caption" sx={{ color: "#fff", fontWeight: 700, letterSpacing: 0.5 }}>
                        MIRAKL
                    </Typography>
                </Box>
                <Typography variant="h6" fontWeight={700}>{connection.displayName}</Typography>
                {connection.organization && (
                    <Typography variant="caption" color="text.secondary">{connection.organization}</Typography>
                )}
            </Stack>

            <Paper variant="outlined">
                <Tabs
                    value={tab}
                    onChange={(_, v) => setTab(v)}
                    sx={{ borderBottom: 1, borderColor: "divider", px: 2 }}
                >
                    <Tab label="Orders" />
                    <Tab label="Offers" />
                </Tabs>

                <Box sx={{ px: 3 }}>
                    <TabPanel value={tab} index={0}>
                        <OrdersTab connectionId={connectionId} />
                    </TabPanel>
                    <TabPanel value={tab} index={1}>
                        <OffersTab connectionId={connectionId} />
                    </TabPanel>
                </Box>
            </Paper>
        </Container>
    );
}

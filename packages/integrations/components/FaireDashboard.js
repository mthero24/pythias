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
import InventoryIcon from "@mui/icons-material/Inventory2";
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

function StateChip({ state }) {
    const MAP = {
        NEW:          { color: "#6366f1", bg: "#e0e7ff" },
        PROCESSING:   { color: "#3b82f6", bg: "#dbeafe" },
        PRE_TRANSIT:  { color: "#f59e0b", bg: "#fef3c7" },
        IN_TRANSIT:   { color: "#f59e0b", bg: "#fef3c7" },
        DELIVERED:    { color: "#10b981", bg: "#d1fae5" },
        COMPLETE:     { color: "#10b981", bg: "#d1fae5" },
        CANCELED:     { color: "#ef4444", bg: "#fee2e2" },
        BACKORDERED:  { color: "#d97706", bg: "#fef3c7" },
        ACTIVE:       { color: "#10b981", bg: "#d1fae5" },
        INACTIVE:     { color: "#6b7280", bg: "#f3f4f6" },
        DELETED:      { color: "#ef4444", bg: "#fee2e2" },
    };
    const s = MAP[state] ?? { color: "#6b7280", bg: "#f3f4f6" };
    return (
        <Chip label={state ?? "—"} size="small"
            sx={{ bgcolor: s.bg, color: s.color, fontWeight: 600, fontSize: "0.7rem", border: "none" }} />
    );
}

// ─── Ship Order Dialog ──────────────────────────────────────────────────────
const FAIRE_CARRIERS = [
    "USPS", "UPS", "FEDEX", "DHL_EXPRESS", "DHL_ECOMMERCE",
    "CANADA_POST", "AUSTRALIA_POST", "ROYAL_MAIL", "OTHER",
];

function ShipDialog({ open, order, connectionId, onClose, onSaved }) {
    const [carrier, setCarrier] = useState("USPS");
    const [trackingCode, setTrackingCode] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => { setCarrier("USPS"); setTrackingCode(""); setError(""); }, [order]);

    const save = async () => {
        if (!trackingCode.trim()) { setError("Tracking code is required"); return; }
        setSaving(true);
        setError("");
        try {
            await axios.post("/api/integrations/faire/orders", {
                connectionId,
                orderId: order.id,
                action: "ship",
                shipment: { carrier, tracking_code: trackingCode.trim() },
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
                Ship Order {order?.display_token ?? order?.id}
                <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
            </DialogTitle>
            <DialogContent dividers>
                <Stack spacing={2} sx={{ pt: 1 }}>
                    {error && <Alert severity="error">{error}</Alert>}
                    <FormControl fullWidth size="small">
                        <InputLabel>Carrier</InputLabel>
                        <Select value={carrier} label="Carrier" onChange={e => setCarrier(e.target.value)}>
                            {FAIRE_CARRIERS.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                        </Select>
                    </FormControl>
                    <TextField
                        fullWidth size="small" label="Tracking Code"
                        value={trackingCode}
                        onChange={e => setTrackingCode(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && save()}
                    />
                </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={onClose}>Cancel</Button>
                <Button
                    variant="contained" onClick={save} disabled={saving || !trackingCode.trim()}
                    startIcon={saving ? <CircularProgress size={14} color="inherit" /> : null}
                    sx={{ bgcolor: "#10305A", "&:hover": { bgcolor: "#0b2240" } }}
                >
                    Mark Shipped
                </Button>
            </DialogActions>
        </Dialog>
    );
}

// ─── Update Inventory Dialog ────────────────────────────────────────────────
function InventoryDialog({ open, variant, connectionId, onClose, onSaved }) {
    const [qty, setQty] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => { setQty(""); setError(""); }, [variant]);

    const save = async () => {
        const n = parseInt(qty, 10);
        if (isNaN(n) || n < 0) { setError("Enter a valid quantity"); return; }
        setSaving(true);
        setError("");
        try {
            await axios.patch("/api/integrations/faire/inventory", {
                connectionId,
                inventories: [{ sku: variant.sku, on_hand_quantity: n }],
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
                Update Inventory — {variant?.sku}
                <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
            </DialogTitle>
            <DialogContent dividers>
                <Stack spacing={2} sx={{ pt: 1 }}>
                    {error && <Alert severity="error">{error}</Alert>}
                    <TextField
                        fullWidth size="small" label="On-Hand Quantity" type="number"
                        value={qty} onChange={e => setQty(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && save()}
                        autoFocus
                    />
                </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={onClose}>Cancel</Button>
                <Button
                    variant="contained" onClick={save} disabled={saving || qty === ""}
                    startIcon={saving ? <CircularProgress size={14} color="inherit" /> : null}
                    sx={{ bgcolor: "#10305A", "&:hover": { bgcolor: "#0b2240" } }}
                >
                    Save
                </Button>
            </DialogActions>
        </Dialog>
    );
}

// ─── Products Tab ───────────────────────────────────────────────────────────
function ProductsTab({ connectionId }) {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [cursor, setCursor] = useState(null);
    const [invTarget, setInvTarget] = useState(null);

    const load = useCallback(async (nextCursor) => {
        setLoading(true);
        setError("");
        try {
            const params = new URLSearchParams({ connectionId, limit: 50 });
            if (nextCursor) params.set("cursor", nextCursor);
            const res = await axios.get(`/api/integrations/faire/products?${params}`);
            setProducts(prev => nextCursor ? [...prev, ...res.data.products] : res.data.products);
            setCursor(res.data.cursor ?? null);
        } catch (e) {
            setError(errMsg(e));
        } finally {
            setLoading(false);
        }
    }, [connectionId]);

    useEffect(() => { load(null); }, [load]);

    return (
        <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Products ({products.length})</Typography>
                <IconButton onClick={() => { setCursor(null); load(null); }} disabled={loading}>
                    <RefreshIcon />
                </IconButton>
            </Stack>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                    <TableHead>
                        <TableRow sx={{ bgcolor: "#f8fafc" }}>
                            <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Variants</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>State</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {products.map(p => (
                            <TableRow key={p.id} hover>
                                <TableCell>
                                    <Typography variant="body2" fontWeight={500}>{p.name}</Typography>
                                    <Typography variant="caption" color="text.secondary">{p.id}</Typography>
                                </TableCell>
                                <TableCell>
                                    <Stack spacing={0.5}>
                                        {(p.variants ?? []).slice(0, 3).map(v => (
                                            <Box key={v.id} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                <Typography variant="caption">{v.sku}</Typography>
                                                <IconButton size="small" title="Update inventory"
                                                    onClick={() => setInvTarget(v)}>
                                                    <InventoryIcon sx={{ fontSize: 14 }} />
                                                </IconButton>
                                            </Box>
                                        ))}
                                        {(p.variants ?? []).length > 3 && (
                                            <Typography variant="caption" color="text.secondary">
                                                +{p.variants.length - 3} more
                                            </Typography>
                                        )}
                                    </Stack>
                                </TableCell>
                                <TableCell><StateChip state={p.lifecycle_state} /></TableCell>
                                <TableCell>
                                    <Typography variant="caption" color="text.secondary">
                                        {(p.variants ?? []).length} variant{(p.variants ?? []).length !== 1 ? "s" : ""}
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ))}
                        {!loading && products.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} align="center">
                                    <Typography variant="body2" color="text.secondary" py={3}>No products found</Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
            {loading && <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}><CircularProgress /></Box>}
            {cursor && !loading && (
                <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
                    <Button onClick={() => load(cursor)}>Load More</Button>
                </Box>
            )}
            <InventoryDialog
                open={!!invTarget}
                variant={invTarget}
                connectionId={connectionId}
                onClose={() => setInvTarget(null)}
                onSaved={() => { setInvTarget(null); load(null); }}
            />
        </Box>
    );
}

// ─── Orders Tab ─────────────────────────────────────────────────────────────
function OrdersTab({ connectionId }) {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [cursor, setCursor] = useState(null);
    const [shipTarget, setShipTarget] = useState(null);
    const [accepting, setAccepting] = useState(null);

    const load = useCallback(async (nextCursor) => {
        setLoading(true);
        setError("");
        try {
            const params = new URLSearchParams({ connectionId, limit: 50 });
            if (nextCursor) params.set("cursor", nextCursor);
            const res = await axios.get(`/api/integrations/faire/orders?${params}`);
            setOrders(prev => nextCursor ? [...prev, ...res.data.orders] : res.data.orders);
            setCursor(res.data.cursor ?? null);
        } catch (e) {
            setError(errMsg(e));
        } finally {
            setLoading(false);
        }
    }, [connectionId]);

    useEffect(() => { load(null); }, [load]);

    const accept = async (order) => {
        setAccepting(order.id);
        try {
            await axios.post("/api/integrations/faire/orders", {
                connectionId,
                orderId: order.id,
                action: "accept",
            });
            load(null);
        } catch (e) {
            setError(errMsg(e));
        } finally {
            setAccepting(null);
        }
    };

    const canAccept = (state) => state === "NEW" || state === "BACKORDERED";
    const canShip   = (state) => state === "PROCESSING";

    return (
        <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Orders ({orders.length})</Typography>
                <IconButton onClick={() => { setCursor(null); load(null); }} disabled={loading}>
                    <RefreshIcon />
                </IconButton>
            </Stack>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                    <TableHead>
                        <TableRow sx={{ bgcolor: "#f8fafc" }}>
                            <TableCell sx={{ fontWeight: 700 }}>Order</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Retailer</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Items</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Total</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>State</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {orders.map(o => {
                            const total = (o.order_items ?? []).reduce((sum, item) => sum + (item.price_cents ?? 0), 0);
                            return (
                                <TableRow key={o.id} hover>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight={500}>{o.display_token ?? o.id}</Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {o.created_at ? new Date(o.created_at).toLocaleDateString() : ""}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">{o.retailer_name ?? o.retailer_id ?? "—"}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">{(o.order_items ?? []).length}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">
                                            {total > 0 ? `$${(total / 100).toFixed(2)}` : "—"}
                                        </Typography>
                                    </TableCell>
                                    <TableCell><StateChip state={o.state} /></TableCell>
                                    <TableCell>
                                        <Stack direction="row" spacing={1}>
                                            {canAccept(o.state) && (
                                                <Button
                                                    size="small" variant="outlined"
                                                    startIcon={accepting === o.id ? <CircularProgress size={12} /> : <CheckIcon sx={{ fontSize: 14 }} />}
                                                    disabled={accepting === o.id}
                                                    onClick={() => accept(o)}
                                                >
                                                    Accept
                                                </Button>
                                            )}
                                            {canShip(o.state) && (
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
                                <TableCell colSpan={6} align="center">
                                    <Typography variant="body2" color="text.secondary" py={3}>No orders found</Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
            {loading && <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}><CircularProgress /></Box>}
            {cursor && !loading && (
                <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
                    <Button onClick={() => load(cursor)}>Load More</Button>
                </Box>
            )}
            <ShipDialog
                open={!!shipTarget}
                order={shipTarget}
                connectionId={connectionId}
                onClose={() => setShipTarget(null)}
                onSaved={() => { setShipTarget(null); load(null); }}
            />
        </Box>
    );
}

// ─── Main Dashboard ─────────────────────────────────────────────────────────
export function FaireDashboard({ connection }) {
    const [tab, setTab] = useState(0);
    const connectionId = connection._id ?? connection.id;

    return (
        <Container maxWidth="xl" sx={{ py: 3 }}>
            <Stack direction="row" alignItems="center" spacing={2} mb={3}>
                <Button component={Link} href="/admin/integrations" startIcon={<ArrowBackIcon />} size="small">
                    Integrations
                </Button>
                <Box sx={{
                    bgcolor: "#10305A", px: 2, py: 1, borderRadius: 1,
                    display: "flex", alignItems: "center",
                }}>
                    <img src="/faire.svg" alt="Faire" style={{ height: 18, width: "auto", filter: "brightness(0) invert(1)" }} />
                </Box>
                <Typography variant="h6" fontWeight={700}>{connection.displayName}</Typography>
            </Stack>

            <Paper variant="outlined">
                <Tabs
                    value={tab}
                    onChange={(_, v) => setTab(v)}
                    sx={{ borderBottom: 1, borderColor: "divider", px: 2 }}
                >
                    <Tab label="Products" />
                    <Tab label="Orders" />
                </Tabs>

                <Box sx={{ px: 3 }}>
                    <TabPanel value={tab} index={0}>
                        <ProductsTab connectionId={connectionId} />
                    </TabPanel>
                    <TabPanel value={tab} index={1}>
                        <OrdersTab connectionId={connectionId} />
                    </TabPanel>
                </Box>
            </Paper>
        </Container>
    );
}

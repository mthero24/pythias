"use client";
import { useState, useEffect, useCallback } from "react";
import {
    Box, Typography, Button, Chip, Tab, Tabs, Table, TableHead, TableBody,
    TableRow, TableCell, TableContainer, Paper, Stack, Alert, Select,
    MenuItem, CircularProgress, Divider, TextField, Tooltip,
} from "@mui/material";
import SyncIcon from "@mui/icons-material/Sync";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import HubIcon from "@mui/icons-material/Hub";
import SaveIcon from "@mui/icons-material/Save";
import axios from "axios";

// ── Status chip ───────────────────────────────────────────────────────────────
const STATUS_PALETTE = {
    NEW:              { bg: "#fef3c7", color: "#92400e" },
    IN_PROGRESS:      { bg: "#dbeafe", color: "#1e40af" },
    SHIPPED:          { bg: "#d1fae5", color: "#065f46" },
    CLOSED:           { bg: "#f3f4f6", color: "#6b7280" },
    CANCELLED:        { bg: "#fee2e2", color: "#991b1b" },
    AWAITING_PAYMENT: { bg: "#fef9c3", color: "#854d0e" },
};

function StatusChip({ status }) {
    const p = STATUS_PALETTE[status] ?? { bg: "#f3f4f6", color: "#374151" };
    return (
        <Chip
            label={(status ?? "—").replace(/_/g, " ")}
            size="small"
            sx={{ bgcolor: p.bg, color: p.color, fontWeight: 600, fontSize: "0.7rem" }}
        />
    );
}

// ── Orders tab ────────────────────────────────────────────────────────────────
function OrdersTab() {
    const [orders, setOrders]   = useState([]);
    const [status, setStatus]   = useState("IN_PROGRESS");
    const [page, setPage]       = useState(0);
    const [total, setTotal]     = useState(0);
    const [loading, setLoading] = useState(false);
    const [pulling, setPulling] = useState(false);
    const [msg, setMsg]         = useState(null);

    const fetchOrders = useCallback(async () => {
        setLoading(true); setMsg(null);
        try {
            const res = await axios.get(`/api/admin/channelengine/orders`, { params: { status, page, pageSize: 50 } });
            setOrders(res.data.Content ?? []);
            setTotal(res.data.TotalCount ?? 0);
        } catch (e) {
            setMsg({ type: "error", text: e.response?.data?.msg ?? e.message });
        } finally { setLoading(false); }
    }, [status, page]);

    useEffect(() => { fetchOrders(); }, [fetchOrders]);

    const pullNew = async () => {
        setPulling(true); setMsg(null);
        try {
            const res = await axios.post("/api/admin/channelengine/orders");
            setMsg({ type: "success", text: `Pulled and acknowledged ${res.data.count} new order(s).` });
            if (res.data.count > 0) fetchOrders();
        } catch (e) {
            setMsg({ type: "error", text: e.response?.data?.msg ?? e.message });
        } finally { setPulling(false); }
    };

    const totalPages = Math.ceil(total / 50);

    return (
        <Box>
            <Stack direction="row" alignItems="center" spacing={2} mb={2} flexWrap="wrap">
                <Select size="small" value={status} onChange={e => { setStatus(e.target.value); setPage(0); }} sx={{ minWidth: 160 }}>
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                    <MenuItem value="SHIPPED">Shipped</MenuItem>
                    <MenuItem value="CLOSED">Closed</MenuItem>
                    <MenuItem value="CANCELLED">Cancelled</MenuItem>
                </Select>
                <Button
                    variant="contained" size="small"
                    startIcon={pulling ? <CircularProgress size={12} color="inherit" /> : <CheckCircleOutlineIcon sx={{ fontSize: 14 }} />}
                    onClick={pullNew} disabled={pulling}
                    sx={{ bgcolor: "#0078d7", "&:hover": { bgcolor: "#005fa3" } }}
                >
                    Pull &amp; Acknowledge New
                </Button>
                <Button size="small" variant="outlined"
                    startIcon={loading ? <CircularProgress size={12} /> : <SyncIcon sx={{ fontSize: 14 }} />}
                    onClick={fetchOrders} disabled={loading}>
                    Refresh
                </Button>
                {!loading && <Chip label={`${total} total`} size="small" sx={{ bgcolor: "#f3f4f6", color: "#374151" }} />}
            </Stack>

            {msg && <Alert severity={msg.type} onClose={() => setMsg(null)} sx={{ mb: 2 }}>{msg.text}</Alert>}

            {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>
            ) : (
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1.5 }}>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: "#f8fafc" }}>
                                <TableCell sx={{ fontWeight: 700 }}>Channel Order #</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Merchant Order #</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Customer</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                                <TableCell sx={{ fontWeight: 700, textAlign: "right" }}>Total</TableCell>
                                <TableCell sx={{ fontWeight: 700, textAlign: "center" }}>Lines</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {orders.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} sx={{ textAlign: "center", py: 6, color: "text.secondary" }}>
                                        No orders found
                                    </TableCell>
                                </TableRow>
                            ) : orders.map((o, i) => (
                                <TableRow key={o.Id ?? i} hover>
                                    <TableCell><Typography variant="body2" fontFamily="monospace" fontSize="0.75rem">{o.ChannelOrderNo ?? o.Id ?? "—"}</Typography></TableCell>
                                    <TableCell><Typography variant="body2" fontFamily="monospace" fontSize="0.75rem">{o.MerchantOrderNo ?? "—"}</Typography></TableCell>
                                    <TableCell><Typography variant="body2">{o.BillingAddress?.FirstName} {o.BillingAddress?.LastName}</Typography></TableCell>
                                    <TableCell><Typography variant="caption" color="text.secondary">{o.OrderDate ? new Date(o.OrderDate).toLocaleDateString() : "—"}</Typography></TableCell>
                                    <TableCell><StatusChip status={o.Status} /></TableCell>
                                    <TableCell sx={{ textAlign: "right" }}><Typography variant="body2">{o.SubTotalInclVat != null ? `$${Number(o.SubTotalInclVat).toFixed(2)}` : "—"}</Typography></TableCell>
                                    <TableCell sx={{ textAlign: "center" }}><Typography variant="body2">{(o.Lines ?? []).length}</Typography></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {totalPages > 1 && (
                <Stack direction="row" alignItems="center" spacing={1} mt={2}>
                    <Button size="small" variant="outlined" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Prev</Button>
                    <Typography variant="body2" color="text.secondary">Page {page + 1} / {totalPages}</Typography>
                    <Button size="small" variant="outlined" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Next</Button>
                </Stack>
            )}
        </Box>
    );
}

// ── Products tab ──────────────────────────────────────────────────────────────
function ProductsTab() {
    const [products, setProducts] = useState([]);
    const [page, setPage]         = useState(1);
    const [total, setTotal]       = useState(0);
    const [loading, setLoading]   = useState(false);
    const [saving, setSaving]     = useState(null);
    const [msg, setMsg]           = useState(null);
    const [edits, setEdits]       = useState({});

    const fetchProducts = useCallback(async () => {
        setLoading(true); setMsg(null);
        try {
            const res = await axios.get("/api/admin/channelengine/products", { params: { page, pageSize: 50 } });
            setProducts(res.data.Content ?? []);
            setTotal(res.data.TotalCount ?? 0);
        } catch (e) {
            setMsg({ type: "error", text: e.response?.data?.msg ?? e.message });
        } finally { setLoading(false); }
    }, [page]);

    useEffect(() => { fetchProducts(); }, [fetchProducts]);

    const saveOffer = async (no) => {
        const edit = edits[no]; if (!edit) return;
        setSaving(no); setMsg(null);
        try {
            const offer = { MerchantProductNo: no };
            if (edit.price !== undefined) offer.Price = parseFloat(edit.price);
            if (edit.stock !== undefined) offer.Stock = parseInt(edit.stock, 10);
            await axios.put("/api/admin/channelengine/products", [offer]);
            setMsg({ type: "success", text: `Updated ${no}` });
            setEdits(prev => { const n = { ...prev }; delete n[no]; return n; });
        } catch (e) {
            setMsg({ type: "error", text: e.response?.data?.msg ?? e.message });
        } finally { setSaving(null); }
    };

    const setEdit = (no, field, val) => setEdits(prev => ({ ...prev, [no]: { ...prev[no], [field]: val } }));
    const totalPages = Math.ceil(total / 50);

    return (
        <Box>
            <Stack direction="row" alignItems="center" spacing={2} mb={2}>
                <Button size="small" variant="outlined"
                    startIcon={loading ? <CircularProgress size={12} /> : <SyncIcon sx={{ fontSize: 14 }} />}
                    onClick={fetchProducts} disabled={loading}>Refresh</Button>
                {!loading && <Chip label={`${total} products`} size="small" sx={{ bgcolor: "#f3f4f6", color: "#374151" }} />}
            </Stack>

            {msg && <Alert severity={msg.type} onClose={() => setMsg(null)} sx={{ mb: 2 }}>{msg.text}</Alert>}

            {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>
            ) : (
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1.5 }}>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: "#f8fafc" }}>
                                <TableCell sx={{ fontWeight: 700 }}>Merchant Product #</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                                <TableCell sx={{ fontWeight: 700, textAlign: "right" }}>Price</TableCell>
                                <TableCell sx={{ fontWeight: 700, textAlign: "right" }}>Stock</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                                <TableCell />
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {products.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} sx={{ textAlign: "center", py: 6, color: "text.secondary" }}>No products found</TableCell>
                                </TableRow>
                            ) : products.map((p, i) => {
                                const no = p.MerchantProductNo ?? p.Id ?? String(i);
                                const edit = edits[no] ?? {};
                                const dirty = Object.keys(edit).length > 0;
                                return (
                                    <TableRow key={no} hover>
                                        <TableCell><Typography variant="body2" fontFamily="monospace" fontSize="0.75rem">{no}</Typography></TableCell>
                                        <TableCell><Typography variant="body2" noWrap sx={{ maxWidth: 260 }}>{p.Name ?? no}</Typography></TableCell>
                                        <TableCell sx={{ textAlign: "right" }}>
                                            <TextField size="small" type="number" inputProps={{ step: "0.01", style: { textAlign: "right" } }}
                                                defaultValue={p.Price ?? ""} onChange={e => setEdit(no, "price", e.target.value)}
                                                sx={{ width: 90 }} />
                                        </TableCell>
                                        <TableCell sx={{ textAlign: "right" }}>
                                            <TextField size="small" type="number" inputProps={{ style: { textAlign: "right" } }}
                                                defaultValue={p.Stock ?? ""} onChange={e => setEdit(no, "stock", e.target.value)}
                                                sx={{ width: 80 }} />
                                        </TableCell>
                                        <TableCell>{p.Status ? <StatusChip status={p.Status} /> : "—"}</TableCell>
                                        <TableCell sx={{ textAlign: "right" }}>
                                            {dirty && (
                                                <Button size="small" variant="contained" color="success"
                                                    startIcon={saving === no ? <CircularProgress size={12} color="inherit" /> : <SaveIcon sx={{ fontSize: 14 }} />}
                                                    disabled={saving === no} onClick={() => saveOffer(no)}>
                                                    Save
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {totalPages > 1 && (
                <Stack direction="row" alignItems="center" spacing={1} mt={2}>
                    <Button size="small" variant="outlined" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
                    <Typography variant="body2" color="text.secondary">Page {page} / {totalPages}</Typography>
                    <Button size="small" variant="outlined" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
                </Stack>
            )}
        </Box>
    );
}

// ── Shipments tab ─────────────────────────────────────────────────────────────
function ShipmentsTab() {
    const [shipments, setShipments] = useState([]);
    const [page, setPage]           = useState(0);
    const [total, setTotal]         = useState(0);
    const [loading, setLoading]     = useState(false);
    const [msg, setMsg]             = useState(null);

    const fetchShipments = useCallback(async () => {
        setLoading(true); setMsg(null);
        try {
            const res = await axios.get("/api/admin/channelengine/shipments", { params: { page, pageSize: 50 } });
            if (res.data.noPermission) { setMsg({ type: "warning", text: "Shipments are not enabled for this API key. Enable the Shipments permission in your ChannelEngine settings." }); setShipments([]); return; }
            setShipments(res.data.Content ?? []);
            setTotal(res.data.TotalCount ?? 0);
        } catch (e) {
            setMsg({ type: "error", text: e.response?.data?.msg ?? e.message });
        } finally { setLoading(false); }
    }, [page]);

    useEffect(() => { fetchShipments(); }, [fetchShipments]);
    const totalPages = Math.ceil(total / 50);

    return (
        <Box>
            <Stack direction="row" alignItems="center" spacing={2} mb={2}>
                <Button size="small" variant="outlined"
                    startIcon={loading ? <CircularProgress size={12} /> : <SyncIcon sx={{ fontSize: 14 }} />}
                    onClick={fetchShipments} disabled={loading}>Refresh</Button>
                {!loading && <Chip label={`${total} shipments`} size="small" sx={{ bgcolor: "#f3f4f6", color: "#374151" }} />}
            </Stack>

            {msg && <Alert severity={msg.type} onClose={() => setMsg(null)} sx={{ mb: 2 }}>{msg.text}</Alert>}

            {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>
            ) : (
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1.5 }}>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: "#f8fafc" }}>
                                <TableCell sx={{ fontWeight: 700 }}>Shipment ID</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Merchant Order #</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Track &amp; Trace</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Method</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Shipped At</TableCell>
                                <TableCell sx={{ fontWeight: 700, textAlign: "center" }}>Lines</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {shipments.length === 0 ? (
                                <TableRow><TableCell colSpan={6} sx={{ textAlign: "center", py: 6, color: "text.secondary" }}>No shipments found</TableCell></TableRow>
                            ) : shipments.map((s, i) => (
                                <TableRow key={s.Id ?? i} hover>
                                    <TableCell><Typography variant="body2" fontFamily="monospace" fontSize="0.75rem">{s.Id ?? "—"}</Typography></TableCell>
                                    <TableCell><Typography variant="body2" fontFamily="monospace" fontSize="0.75rem">{s.MerchantOrderNo ?? "—"}</Typography></TableCell>
                                    <TableCell><Typography variant="body2">{s.TrackTraceNo ?? "—"}</Typography></TableCell>
                                    <TableCell><Typography variant="body2">{s.Method ?? "—"}</Typography></TableCell>
                                    <TableCell><Typography variant="caption" color="text.secondary">{s.ShippedAt ? new Date(s.ShippedAt).toLocaleDateString() : "—"}</Typography></TableCell>
                                    <TableCell sx={{ textAlign: "center" }}><Typography variant="body2">{(s.Lines ?? []).length}</Typography></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {totalPages > 1 && (
                <Stack direction="row" alignItems="center" spacing={1} mt={2}>
                    <Button size="small" variant="outlined" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Prev</Button>
                    <Typography variant="body2" color="text.secondary">Page {page + 1} / {totalPages}</Typography>
                    <Button size="small" variant="outlined" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Next</Button>
                </Stack>
            )}
        </Box>
    );
}

// ── Returns tab ───────────────────────────────────────────────────────────────
function ReturnsTab() {
    const [returns, setReturns] = useState([]);
    const [page, setPage]       = useState(0);
    const [total, setTotal]     = useState(0);
    const [loading, setLoading] = useState(false);
    const [msg, setMsg]         = useState(null);

    const fetchReturns = useCallback(async () => {
        setLoading(true); setMsg(null);
        try {
            const res = await axios.get("/api/admin/channelengine/returns", { params: { page, pageSize: 50 } });
            if (res.data.noPermission) { setMsg({ type: "warning", text: "Returns are not enabled for this API key. Enable the Returns permission in your ChannelEngine settings." }); setReturns([]); return; }
            setReturns(res.data.Content ?? []);
            setTotal(res.data.TotalCount ?? 0);
        } catch (e) {
            setMsg({ type: "error", text: e.response?.data?.msg ?? e.message });
        } finally { setLoading(false); }
    }, [page]);

    useEffect(() => { fetchReturns(); }, [fetchReturns]);
    const totalPages = Math.ceil(total / 50);

    return (
        <Box>
            <Stack direction="row" alignItems="center" spacing={2} mb={2}>
                <Button size="small" variant="outlined"
                    startIcon={loading ? <CircularProgress size={12} /> : <SyncIcon sx={{ fontSize: 14 }} />}
                    onClick={fetchReturns} disabled={loading}>Refresh</Button>
                {!loading && <Chip label={`${total} returns`} size="small" sx={{ bgcolor: "#f3f4f6", color: "#374151" }} />}
            </Stack>

            {msg && <Alert severity={msg.type} onClose={() => setMsg(null)} sx={{ mb: 2 }}>{msg.text}</Alert>}

            {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>
            ) : (
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1.5 }}>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: "#f8fafc" }}>
                                <TableCell sx={{ fontWeight: 700 }}>Return ID</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Channel Order #</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Reason</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {returns.length === 0 ? (
                                <TableRow><TableCell colSpan={5} sx={{ textAlign: "center", py: 6, color: "text.secondary" }}>No returns found</TableCell></TableRow>
                            ) : returns.map((r, i) => (
                                <TableRow key={r.Id ?? i} hover>
                                    <TableCell><Typography variant="body2" fontFamily="monospace" fontSize="0.75rem">{r.Id ?? "—"}</Typography></TableCell>
                                    <TableCell><Typography variant="body2" fontFamily="monospace" fontSize="0.75rem">{r.ChannelOrderNo ?? "—"}</Typography></TableCell>
                                    <TableCell><Typography variant="body2">{r.Reason ?? r.Lines?.[0]?.Reason ?? "—"}</Typography></TableCell>
                                    <TableCell><Typography variant="caption" color="text.secondary">{r.CreatedAt ? new Date(r.CreatedAt).toLocaleDateString() : "—"}</Typography></TableCell>
                                    <TableCell><StatusChip status={r.Status} /></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {totalPages > 1 && (
                <Stack direction="row" alignItems="center" spacing={1} mt={2}>
                    <Button size="small" variant="outlined" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Prev</Button>
                    <Typography variant="body2" color="text.secondary">Page {page + 1} / {totalPages}</Typography>
                    <Button size="small" variant="outlined" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Next</Button>
                </Stack>
            )}
        </Box>
    );
}

// ── Main dashboard ────────────────────────────────────────────────────────────
const TABS = ["Orders", "Products", "Shipments", "Returns"];

export default function ChannelEngineDashboard({ tenant }) {
    const [tab, setTab] = useState(0);

    return (
        <Box sx={{ bgcolor: "#f8fafc", minHeight: "100vh", pb: 6 }}>
            {/* Header */}
            <Box sx={{ bgcolor: "#fff", borderBottom: "1px solid #e5e7eb", py: 3, px: { xs: 2, sm: 4 }, mb: 4 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                        <HubIcon sx={{ color: "#0078d7" }} />
                        <Box>
                            <Typography variant="h5" fontWeight={700}>ChannelEngine</Typography>
                            <Typography variant="body2" color="text.secondary">
                                {tenant ? `Tenant: ${tenant}` : "Omni-channel order & product management"}
                            </Typography>
                        </Box>
                    </Stack>
                    <Chip
                        label="Connected"
                        icon={<CheckCircleOutlineIcon sx={{ fontSize: 14 }} />}
                        size="small"
                        sx={{ bgcolor: "#d1fae5", color: "#065f46", fontWeight: 600, "& .MuiChip-icon": { color: "#065f46" } }}
                    />
                </Stack>
            </Box>

            <Box sx={{ px: { xs: 2, sm: 4 }, maxWidth: 1200, mx: "auto" }}>
                <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
                    <Tabs
                        value={tab}
                        onChange={(_, v) => setTab(v)}
                        sx={{
                            borderBottom: "1px solid #e5e7eb",
                            px: 2,
                            "& .MuiTab-root": { textTransform: "none", fontWeight: 500, minHeight: 48 },
                            "& .Mui-selected": { fontWeight: 700, color: "#0078d7" },
                            "& .MuiTabs-indicator": { bgcolor: "#0078d7" },
                        }}
                    >
                        {TABS.map(t => <Tab key={t} label={t} />)}
                    </Tabs>

                    <Box sx={{ p: 3 }}>
                        {tab === 0 && <OrdersTab />}
                        {tab === 1 && <ProductsTab />}
                        {tab === 2 && <ShipmentsTab />}
                        {tab === 3 && <ReturnsTab />}
                    </Box>
                </Paper>
            </Box>
        </Box>
    );
}

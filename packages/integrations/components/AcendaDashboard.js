"use client";
import {
    Box, Container, Typography, Stack, Chip, Button, TextField,
    Tab, Tabs, Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
    Paper, Alert, CircularProgress, IconButton, Select, MenuItem, FormControl, InputLabel,
    Grid2,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import WarehouseIcon from "@mui/icons-material/Warehouse";
import StorefrontIcon from "@mui/icons-material/Storefront";
import InventoryIcon from "@mui/icons-material/Inventory2";
import CategoryIcon from "@mui/icons-material/Category";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import SyncIcon from "@mui/icons-material/Sync";
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

const ACENDA_CARRIERS = ["USPS", "UPS", "FEDEX", "DHL", "OnTrac", "LSO", "Other"];

// ─── Orders Tab ──────────────────────────────────────────────────────────────
function OrdersTab({ connectionId }) {
    const [orders, setOrders]         = useState([]);
    const [loading, setLoading]       = useState(false);
    const [error, setError]           = useState("");
    const [acking, setAcking]         = useState(null);
    const [shipTarget, setShipTarget] = useState(null);
    const [carrier, setCarrier]       = useState("USPS");
    const [tracking, setTracking]     = useState("");
    const [shipping, setShipping]     = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const res = await axios.get(`/api/integrations/acenda/orders?connectionId=${connectionId}&unacked=true`);
            setOrders(res.data.orders ?? []);
        } catch (e) {
            setError(errMsg(e));
        } finally {
            setLoading(false);
        }
    }, [connectionId]);

    useEffect(() => { load(); }, [load]);

    const acknowledge = async (orderId) => {
        setAcking(orderId);
        try {
            await axios.post("/api/integrations/acenda/orders", { connectionId, orderId });
            setOrders(prev => prev.filter(o => o.id !== orderId));
        } catch (e) {
            setError(errMsg(e));
        } finally { setAcking(null); }
    };

    const ship = async () => {
        if (!tracking.trim() || !shipTarget) return;
        setShipping(true);
        try {
            await axios.post("/api/integrations/acenda/orders", {
                connectionId,
                orderId: shipTarget.id,
                action: "fulfill",
                carrier,
                trackingNumber: tracking.trim(),
            });
            setOrders(prev => prev.filter(o => o.id !== shipTarget.id));
            setShipTarget(null);
            setTracking("");
        } catch (e) {
            setError(errMsg(e));
        } finally { setShipping(false); }
    };

    return (
        <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Unacknowledged Orders ({orders.length})</Typography>
                <IconButton onClick={load} disabled={loading}><RefreshIcon /></IconButton>
            </Stack>
            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}

            {shipTarget && (
                <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 1.5, bgcolor: "#eff6ff" }}>
                    <Typography variant="body2" fontWeight={600} mb={1}>
                        Fulfill Order #{shipTarget.order_number ?? shipTarget.id}
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <Select size="small" value={carrier} onChange={e => setCarrier(e.target.value)} sx={{ minWidth: 110 }}>
                            {ACENDA_CARRIERS.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                        </Select>
                        <TextField
                            size="small" label="Tracking Number" value={tracking}
                            onChange={e => setTracking(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && ship()}
                            sx={{ flexGrow: 1 }}
                        />
                        <Button
                            variant="contained" size="small" onClick={ship}
                            disabled={shipping || !tracking.trim()}
                            startIcon={shipping ? <CircularProgress size={12} color="inherit" /> : <LocalShippingIcon sx={{ fontSize: 14 }} />}
                            sx={{ bgcolor: "#1565C0", "&:hover": { bgcolor: "#0d47a1" } }}
                        >
                            Fulfill
                        </Button>
                        <Button size="small" onClick={() => { setShipTarget(null); setTracking(""); }}>Cancel</Button>
                    </Stack>
                </Paper>
            )}

            <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                    <TableHead>
                        <TableRow sx={{ bgcolor: "#f8fafc" }}>
                            <TableCell sx={{ fontWeight: 700 }}>Order #</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Items</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Created</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {orders.map(o => (
                            <TableRow key={o.id} hover selected={shipTarget?.id === o.id}>
                                <TableCell>
                                    <Typography variant="body2" fontWeight={500}>{o.order_number ?? o.id}</Typography>
                                </TableCell>
                                <TableCell>
                                    <Chip label={o.status ?? "—"} size="small"
                                        sx={{ bgcolor: "#dbeafe", color: "#1e40af", fontWeight: 600, fontSize: "0.7rem" }} />
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2">{(o.line_items ?? o.items ?? []).length}</Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="caption" color="text.secondary">
                                        {o.created_at ? new Date(o.created_at).toLocaleDateString() : "—"}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Stack direction="row" spacing={0.5}>
                                        <Button
                                            size="small" variant="outlined"
                                            startIcon={<LocalShippingIcon sx={{ fontSize: 14 }} />}
                                            onClick={() => { setShipTarget(o); setTracking(""); }}
                                            sx={{ borderColor: "#1565C0", color: "#1565C0" }}
                                        >
                                            Fulfill
                                        </Button>
                                        <Button
                                            size="small" variant="outlined" color="success"
                                            startIcon={acking === o.id ? <CircularProgress size={12} /> : <CheckCircleOutlineIcon sx={{ fontSize: 14 }} />}
                                            disabled={acking === o.id}
                                            onClick={() => acknowledge(o.id)}
                                        >
                                            Ack
                                        </Button>
                                    </Stack>
                                </TableCell>
                            </TableRow>
                        ))}
                        {!loading && orders.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} align="center">
                                    <Typography variant="body2" color="text.secondary" py={3}>No unacknowledged orders</Typography>
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

// ─── Feed Status Tab ──────────────────────────────────────────────────────────
const FEED_PAGE_SIZE = 50;

function FeedStatusTab({ connection }) {
    const connectionId = connection._id ?? connection.id;
    const [data, setData]       = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState("");
    const [filter, setFilter]   = useState("all");
    const [page, setPage]       = useState(0);
    const [syncing, setSyncing] = useState(null);

    const load = useCallback(async (pg = 0, f = filter) => {
        setLoading(true);
        setError("");
        try {
            const res = await axios.get(
                `/api/integrations/acenda/feed?connectionId=${connectionId}&page=${pg}&limit=${FEED_PAGE_SIZE}&filter=${f}`
            );
            setData(res.data);
        } catch (e) {
            setError(errMsg(e));
        } finally {
            setLoading(false);
        }
    }, [connectionId, filter]);

    useEffect(() => { load(0, filter); }, [connectionId]); // eslint-disable-line

    const applyFilter = (f) => { setFilter(f); setPage(0); load(0, f); };
    const goToPage    = (pg) => { setPage(pg); load(pg, filter); };

    const syncProduct = async (productId) => {
        setSyncing(productId);
        try {
            await axios.post("/api/integrations/acenda", {
                product:      { _id: productId },
                connectionId: connectionId,
            });
            await load(page, filter);
        } catch (e) {
            setError(errMsg(e));
        } finally {
            setSyncing(null);
        }
    };

    const rows         = data?.products ?? [];
    const filteredTotal = data?.filteredTotal ?? 0;
    const totalPages   = Math.ceil(filteredTotal / FEED_PAGE_SIZE);

    return (
        <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Feed Status</Typography>
                <IconButton onClick={() => load(page, filter)} disabled={loading}><RefreshIcon /></IconButton>
            </Stack>
            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}

            {/* KPI cards */}
            {data && (
                <Grid2 container spacing={2} mb={3}>
                    {[
                        { label: "Total Products",    value: data.total,          color: "#1565C0", bg: "#dbeafe" },
                        { label: "Synced",            value: data.synced,         color: "#065f46", bg: "#d1fae5" },
                        { label: "Pending",           value: data.pending,        color: "#92400e", bg: "#fef3c7" },
                        { label: "Variants Synced",   value: `${data.syncedVariants} / ${data.totalVariants}`, color: "#374151", bg: "#f3f4f6" },
                    ].map(({ label, value, color, bg }) => (
                        <Grid2 key={label} size={{ xs: 6, sm: 3 }}>
                            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, textAlign: "center", bgcolor: bg }}>
                                <Typography variant="h5" fontWeight={700} sx={{ color }}>{value}</Typography>
                                <Typography variant="caption" color="text.secondary">{label}</Typography>
                            </Paper>
                        </Grid2>
                    ))}
                </Grid2>
            )}

            {/* Filter toggle */}
            <Stack direction="row" spacing={1} mb={2}>
                {["all", "synced", "pending"].map(f => (
                    <Chip
                        key={f}
                        label={f.charAt(0).toUpperCase() + f.slice(1)}
                        onClick={() => applyFilter(f)}
                        variant={filter === f ? "filled" : "outlined"}
                        sx={filter === f ? { bgcolor: "#1565C0", color: "#fff", fontWeight: 700 } : {}}
                    />
                ))}
            </Stack>

            {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}><CircularProgress /></Box>
            ) : (
                <Box>
                <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: "#f8fafc" }}>
                                <TableCell sx={{ fontWeight: 700 }}>Product</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>SKU</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Variants</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Acenda ID</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Last Updated</TableCell>
                                <TableCell />
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {rows.map(p => (
                                <TableRow key={p._id} hover>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight={500}>{p.title}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="caption" sx={{ fontFamily: "monospace" }}>{p.sku}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={p.synced ? "Synced" : "Pending"}
                                            size="small"
                                            icon={p.synced
                                                ? <CheckCircleOutlineIcon sx={{ fontSize: 13 }} />
                                                : <CloudUploadIcon sx={{ fontSize: 13 }} />}
                                            sx={{
                                                bgcolor: p.synced ? "#d1fae5" : "#fef3c7",
                                                color:   p.synced ? "#065f46" : "#92400e",
                                                fontWeight: 600, fontSize: "0.7rem",
                                                "& .MuiChip-icon": { color: "inherit" },
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">
                                            {p.syncedVariants} / {p.totalVariants}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="caption" sx={{ fontFamily: "monospace", color: "text.secondary" }}>
                                            {p.acendaId ?? "—"}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="caption" color="text.secondary">
                                            {p.lastUpdated ? new Date(p.lastUpdated).toLocaleDateString() : "—"}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            size="small" variant="outlined"
                                            disabled={syncing === p._id}
                                            startIcon={syncing === p._id
                                                ? <CircularProgress size={11} />
                                                : <SyncIcon sx={{ fontSize: 14 }} />}
                                            onClick={() => syncProduct(p._id)}
                                            sx={{ borderColor: "#1565C0", color: "#1565C0", whiteSpace: "nowrap" }}
                                        >
                                            {p.synced ? "Re-sync" : "Sync"}
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {rows.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} align="center">
                                        <Typography variant="body2" color="text.secondary" py={3}>No products found</Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* Pagination controls */}
                {filteredTotal > FEED_PAGE_SIZE && (
                    <Stack direction="row" alignItems="center" justifyContent="space-between" mt={2}>
                        <Typography variant="caption" color="text.secondary">
                            {page * FEED_PAGE_SIZE + 1}-{Math.min((page + 1) * FEED_PAGE_SIZE, filteredTotal)} of {filteredTotal}
                        </Typography>
                        <Stack direction="row" spacing={1}>
                            <Button size="small" variant="outlined" disabled={page === 0 || loading}
                                onClick={() => goToPage(page - 1)}
                                sx={{ borderRadius: 1.5, minWidth: 72 }}>
                                Previous
                            </Button>
                            <Typography variant="body2" sx={{ px: 1, lineHeight: "30px", color: "text.secondary" }}>
                                {page + 1} / {totalPages}
                            </Typography>
                            <Button size="small" variant="outlined" disabled={page >= totalPages - 1 || loading}
                                onClick={() => goToPage(page + 1)}
                                sx={{ borderRadius: 1.5, minWidth: 72 }}>
                                Next
                            </Button>
                        </Stack>
                    </Stack>
                )}
                </Box>
            )}
        </Box>
    );
}

// ─── Dashboard data hook ──────────────────────────────────────────────────────
function useDashboard(connectionId) {
    const [data, setData]     = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError]   = useState("");

    const load = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const res = await axios.get(`/api/integrations/acenda/dashboard?connectionId=${connectionId}`);
            setData(res.data);
        } catch (e) {
            setError(errMsg(e));
        } finally {
            setLoading(false);
        }
    }, [connectionId]);

    useEffect(() => { load(); }, [load]);

    return { data, loading, error, reload: load };
}

// ─── Sales Channels Tab ───────────────────────────────────────────────────────
function ChannelsTab({ channels, loading, error }) {
    if (loading) return <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}><CircularProgress /></Box>;
    if (error) return <Alert severity="error">{error}</Alert>;

    return (
        <Box>
            <Typography variant="h6" mb={2}>Sales Channels ({channels.length})</Typography>
            {channels.length === 0 ? (
                <Typography color="text.secondary">No sales channels found.</Typography>
            ) : (
                <Grid2 container spacing={2}>
                    {channels.map((ch, i) => (
                        <Grid2 key={ch.id ?? i} size={{ xs: 12, sm: 6, md: 4 }}>
                            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                                <Stack direction="row" alignItems="center" spacing={1.5} mb={1}>
                                    <StorefrontIcon sx={{ color: "#1565C0" }} />
                                    <Typography fontWeight={700}>{ch.name ?? ch.id}</Typography>
                                </Stack>
                                {ch.type && (
                                    <Chip label={ch.type} size="small"
                                        sx={{ bgcolor: "#dbeafe", color: "#1e40af", fontWeight: 600, fontSize: "0.7rem", mb: 0.5 }} />
                                )}
                                {ch.status && (
                                    <Chip label={ch.status} size="small"
                                        sx={{ bgcolor: ch.status === "ACTIVE" ? "#d1fae5" : "#f3f4f6", color: ch.status === "ACTIVE" ? "#065f46" : "#6b7280", fontWeight: 600, fontSize: "0.7rem", ml: 0.5 }} />
                                )}
                                {ch.url && (
                                    <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                                        {ch.url}
                                    </Typography>
                                )}
                            </Paper>
                        </Grid2>
                    ))}
                </Grid2>
            )}
        </Box>
    );
}

// ─── Warehouses Tab ───────────────────────────────────────────────────────────
function WarehousesTab({ warehouses, loading, error }) {
    if (loading) return <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}><CircularProgress /></Box>;
    if (error) return <Alert severity="error">{error}</Alert>;

    return (
        <Box>
            <Typography variant="h6" mb={2}>Warehouses ({warehouses.length})</Typography>
            {warehouses.length === 0 ? (
                <Typography color="text.secondary">No warehouses found.</Typography>
            ) : (
                <Grid2 container spacing={2}>
                    {warehouses.map((wh, i) => (
                        <Grid2 key={wh.id ?? i} size={{ xs: 12, sm: 6, md: 4 }}>
                            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                                <Stack direction="row" alignItems="center" spacing={1.5} mb={1}>
                                    <WarehouseIcon sx={{ color: "#1565C0" }} />
                                    <Typography fontWeight={700}>{wh.name ?? `Warehouse ${wh.id}`}</Typography>
                                </Stack>
                                <Typography variant="caption" color="text.secondary" sx={{ fontFamily: "monospace" }}>
                                    ID: {wh.id}
                                </Typography>
                                {wh.address && (
                                    <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                                        {[wh.address.city, wh.address.state, wh.address.country].filter(Boolean).join(", ")}
                                    </Typography>
                                )}
                            </Paper>
                        </Grid2>
                    ))}
                </Grid2>
            )}
        </Box>
    );
}

// ─── Catalog Tab ─────────────────────────────────────────────────────────────
const CATALOG_PAGE_SIZE = 50;

function CatalogTab({ connectionId }) {
    const [items, setItems]       = useState([]);
    const [total, setTotal]       = useState(0);
    const [page, setPage]         = useState(0);
    const [search, setSearch]     = useState("");
    const [input, setInput]       = useState("");
    const [loading, setLoading]   = useState(false);
    const [error, setError]       = useState("");

    const load = useCallback(async (pg = 0, q = search) => {
        setLoading(true);
        setError("");
        try {
            const params = new URLSearchParams({
                connectionId,
                page:  pg,
                limit: CATALOG_PAGE_SIZE,
                ...(q ? { search: q } : {}),
            });
            const res = await axios.get(`/api/integrations/acenda/catalog?${params}`);
            const fetched = res.data.items ?? [];
            setItems(fetched);
            // Use API total if provided; otherwise infer from page size
            setTotal(res.data.total > 0 ? res.data.total : fetched.length === CATALOG_PAGE_SIZE ? (pg + 2) * CATALOG_PAGE_SIZE : (pg * CATALOG_PAGE_SIZE) + fetched.length);
        } catch (e) {
            setError(errMsg(e));
        } finally {
            setLoading(false);
        }
    }, [connectionId, search]);

    useEffect(() => { load(0, ""); }, [connectionId]); // eslint-disable-line

    const doSearch = () => { setSearch(input); setPage(0); load(0, input); };
    const clearSearch = () => { setInput(""); setSearch(""); setPage(0); load(0, ""); };
    const goToPage = (pg) => { setPage(pg); load(pg, search); };

    const hasMore    = items.length === CATALOG_PAGE_SIZE;
    const totalPages = total > 0 ? Math.ceil(total / CATALOG_PAGE_SIZE) : page + (hasMore ? 2 : 1);

    return (
        <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                    Catalog{total > 0 ? ` (${total.toLocaleString()} items)` : ""}
                </Typography>
                <IconButton onClick={() => load(page, search)} disabled={loading}><RefreshIcon /></IconButton>
            </Stack>

            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}

            {/* Search */}
            <Stack direction="row" spacing={1} mb={2}>
                <TextField
                    size="small"
                    placeholder="Search by name or SKU..."
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && doSearch()}
                    sx={{ flexGrow: 1, maxWidth: 400 }}
                />
                <Button variant="contained" size="small" onClick={doSearch} disabled={loading}
                    sx={{ bgcolor: "#1565C0", "&:hover": { bgcolor: "#0d47a1" } }}>
                    Search
                </Button>
                {search && (
                    <Button size="small" variant="outlined" onClick={clearSearch}>Clear</Button>
                )}
            </Stack>

            {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}><CircularProgress /></Box>
            ) : (
                <Box>
                    <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                            <TableHead>
                                <TableRow sx={{ bgcolor: "#f8fafc" }}>
                                    <TableCell sx={{ fontWeight: 700 }}>SKU</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Group</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Variants</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {items.map((item, i) => (
                                    <TableRow key={item.id ?? i} hover>
                                        <TableCell>
                                            <Typography variant="caption" sx={{ fontFamily: "monospace" }}>
                                                {item.sku ?? item.id}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">{item.name ?? item.title ?? "—"}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            {item.group && (
                                                <Chip label={item.group} size="small"
                                                    sx={{ bgcolor: item.group === "product" ? "#dbeafe" : "#f3f4f6",
                                                          color:   item.group === "product" ? "#1e40af" : "#374151",
                                                          fontWeight: 600, fontSize: "0.7rem" }} />
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {item.status && (
                                                <Chip label={item.status} size="small"
                                                    sx={{ bgcolor: "#f3f4f6", color: "#374151", fontWeight: 600, fontSize: "0.7rem" }} />
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">
                                                {item.group_skus?.length ?? item.variants?.length ?? "—"}
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {items.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center">
                                            <Typography variant="body2" color="text.secondary" py={3}>
                                                {search ? `No results for "${search}"` : "No catalog items found"}
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {(page > 0 || hasMore) && (
                        <Stack direction="row" alignItems="center" justifyContent="space-between" mt={2}>
                            <Typography variant="caption" color="text.secondary">
                                {total > 0
                                    ? `${page * CATALOG_PAGE_SIZE + 1}-${Math.min((page + 1) * CATALOG_PAGE_SIZE, total)} of ${total.toLocaleString()}`
                                    : `Page ${page + 1}`}
                            </Typography>
                            <Stack direction="row" spacing={1}>
                                <Button size="small" variant="outlined" disabled={page === 0}
                                    onClick={() => goToPage(page - 1)} sx={{ borderRadius: 1.5, minWidth: 72 }}>
                                    Previous
                                </Button>
                                <Typography variant="body2" sx={{ px: 1, lineHeight: "30px", color: "text.secondary" }}>
                                    {page + 1}{totalPages > 1 ? ` / ${totalPages}` : ""}
                                </Typography>
                                <Button size="small" variant="outlined" disabled={!hasMore}
                                    onClick={() => goToPage(page + 1)} sx={{ borderRadius: 1.5, minWidth: 72 }}>
                                    Next
                                </Button>
                            </Stack>
                        </Stack>
                    )}
                </Box>
            )}
        </Box>
    );
}

// ─── Inventory Tab ────────────────────────────────────────────────────────────
function InventoryTab({ inventory, inventoryTotal, loading, error }) {
    if (loading) return <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}><CircularProgress /></Box>;
    if (error) return <Alert severity="error">{error}</Alert>;

    return (
        <Box>
            <Typography variant="h6" mb={2}>
                Inventory ({inventory.length} shown{inventoryTotal > inventory.length ? ` of ${inventoryTotal}` : ""})
            </Typography>
            <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                    <TableHead>
                        <TableRow sx={{ bgcolor: "#f8fafc" }}>
                            <TableCell sx={{ fontWeight: 700 }}>SKU</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Warehouse</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Quantity</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Tracking</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {inventory.map((item, i) => (
                            <TableRow key={item.id ?? i} hover>
                                <TableCell>
                                    <Typography variant="caption" sx={{ fontFamily: "monospace" }}>
                                        {item.sku}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2">{item.warehouse_id ?? "—"}</Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2" fontWeight={600}
                                        sx={{ color: (item.quantity ?? 0) === 0 ? "#ef4444" : "inherit" }}>
                                        {item.quantity ?? 0}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Chip label={item.tracking ?? "—"} size="small"
                                        sx={{ bgcolor: "#f3f4f6", color: "#374151", fontSize: "0.7rem" }} />
                                </TableCell>
                            </TableRow>
                        ))}
                        {!loading && inventory.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} align="center">
                                    <Typography variant="body2" color="text.secondary" py={3}>No inventory records found</Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export function AcendaDashboard({ connection }) {
    const [tab, setTab] = useState(0);
    const connectionId = connection._id ?? connection.id;
    const { data, loading, error, reload } = useDashboard(connectionId);

    return (
        <Container maxWidth="xl" sx={{ py: 3 }}>
            <Stack direction="row" alignItems="center" spacing={2} mb={3}>
                <Button component={Link} href="/admin/integrations" startIcon={<ArrowBackIcon />} size="small">
                    Integrations
                </Button>
                <Box sx={{ bgcolor: "#1565C0", px: 2, py: 1, borderRadius: 1, display: "flex", alignItems: "center" }}>
                    <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "0.85rem" }}>Acenda</Typography>
                </Box>
                <Typography variant="h6" fontWeight={700}>{connection.displayName}</Typography>
                <IconButton size="small" onClick={reload} disabled={loading} sx={{ ml: "auto" }}>
                    <RefreshIcon />
                </IconButton>
            </Stack>

            {/* Summary cards */}
            {data && (
                <Grid2 container spacing={2} mb={3}>
                    <Grid2 size={{ xs: 6, sm: 3 }}>
                        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, textAlign: "center" }}>
                            <StorefrontIcon sx={{ color: "#1565C0", mb: 0.5 }} />
                            <Typography variant="h5" fontWeight={700}>{data.channels.length}</Typography>
                            <Typography variant="caption" color="text.secondary">Sales Channels</Typography>
                        </Paper>
                    </Grid2>
                    <Grid2 size={{ xs: 6, sm: 3 }}>
                        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, textAlign: "center" }}>
                            <WarehouseIcon sx={{ color: "#1565C0", mb: 0.5 }} />
                            <Typography variant="h5" fontWeight={700}>{data.warehouses.length}</Typography>
                            <Typography variant="caption" color="text.secondary">Warehouses</Typography>
                        </Paper>
                    </Grid2>
                    <Grid2 size={{ xs: 6, sm: 3 }}>
                        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, textAlign: "center" }}>
                            <InventoryIcon sx={{ color: "#1565C0", mb: 0.5 }} />
                            <Typography variant="h5" fontWeight={700}>{data.inventoryTotal}</Typography>
                            <Typography variant="caption" color="text.secondary">Inventory SKUs</Typography>
                        </Paper>
                    </Grid2>
                </Grid2>
            )}

            <Paper variant="outlined">
                <Tabs
                    value={tab}
                    onChange={(_, v) => setTab(v)}
                    sx={{ borderBottom: 1, borderColor: "divider", px: 2 }}
                >
                    <Tab label="Feed Status" />
                    <Tab label="Orders" />
                    <Tab label="Sales Channels" />
                    <Tab label="Warehouses" />
                    <Tab label="Catalog" />
                    <Tab label="Inventory" />
                </Tabs>

                <Box sx={{ px: 3 }}>
                    <TabPanel value={tab} index={0}>
                        <FeedStatusTab connection={connection} />
                    </TabPanel>
                    <TabPanel value={tab} index={1}>
                        <OrdersTab connectionId={connectionId} />
                    </TabPanel>
                    <TabPanel value={tab} index={2}>
                        <ChannelsTab channels={data?.channels ?? []} loading={loading} error={error} />
                    </TabPanel>
                    <TabPanel value={tab} index={3}>
                        <WarehousesTab warehouses={data?.warehouses ?? []} loading={loading} error={error} />
                    </TabPanel>
                    <TabPanel value={tab} index={4}>
                        <CatalogTab connectionId={connectionId} />
                    </TabPanel>
                    <TabPanel value={tab} index={5}>
                        <InventoryTab
                            inventory={data?.inventory ?? []}
                            inventoryTotal={data?.inventoryTotal ?? 0}
                            loading={loading} error={error}
                        />
                    </TabPanel>
                </Box>
            </Paper>
        </Container>
    );
}

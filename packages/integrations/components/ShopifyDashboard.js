"use client";
import {
    Box, Container, Typography, Stack, Chip, Button, TextField,
    Tab, Tabs, Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
    Paper, Alert, CircularProgress, IconButton, Select, MenuItem, FormControl,
    InputLabel, Dialog, DialogTitle, DialogContent, DialogActions, Grid2,
    FormControlLabel, Checkbox,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import StorefrontIcon from "@mui/icons-material/Storefront";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import CategoryIcon from "@mui/icons-material/Category";
import ShoppingBagIcon from "@mui/icons-material/ShoppingBag";
import CloseIcon from "@mui/icons-material/Close";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import axios from "axios";

function errMsg(e) {
    const d = e.response?.data;
    if (!d) return e.message ?? "Request failed";
    if (typeof d === "string") return d;
    return d.msg ?? d.error ?? d.message ?? JSON.stringify(d);
}

function TabPanel({ value, index, children }) {
    return value === index ? <Box sx={{ py: 3 }}>{children}</Box> : null;
}

const SHOPIFY_GREEN = "#96bf48";

// ─── Create Sale Dialog ───────────────────────────────────────────────────────
const SCOPE_OPTIONS = [
    { value: "site",   label: "Entire Site" },
    { value: "blank",  label: "By Blank" },
    { value: "design", label: "By Design" },
    { value: "color",  label: "By Color" },
];

function CreateSaleDialog({ open, shop, onClose, onCreated }) {
    const [form, setForm] = useState({
        name: "", discountType: "percent", discountValue: "", scope: "site",
        startDate: "", endDate: "", couponCode: "", newShopifyProductsOnly: false,
    });
    const [saving, setSaving] = useState(false);
    const [error, setError]   = useState("");

    useEffect(() => {
        if (open) {
            setForm({ name: "", discountType: "percent", discountValue: "", scope: "site", startDate: "", endDate: "", couponCode: "", newShopifyProductsOnly: false });
            setError("");
        }
    }, [open]);

    const set = (field, val) => setForm(p => ({ ...p, [field]: val }));

    const save = async () => {
        if (!form.name.trim() || !form.discountValue || !form.startDate || !form.endDate) {
            setError("Name, discount, start date, and end date are required");
            return;
        }
        setSaving(true);
        setError("");
        try {
            const res = await axios.post("/api/admin/shopify/sales", { shop, ...form, discountValue: Number(form.discountValue) });
            onCreated(res.data.sale);
        } catch (e) {
            setError(errMsg(e));
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ fontWeight: 700, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                Create Sale
                <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
            </DialogTitle>
            <DialogContent dividers>
                <Stack spacing={2} sx={{ pt: 1 }}>
                    {error && <Alert severity="error">{error}</Alert>}
                    <TextField fullWidth size="small" label="Sale Name" value={form.name} onChange={e => set("name", e.target.value)} />
                    <Stack direction="row" spacing={2}>
                        <FormControl size="small" sx={{ minWidth: 140 }}>
                            <InputLabel>Type</InputLabel>
                            <Select value={form.discountType} label="Type" onChange={e => set("discountType", e.target.value)}>
                                <MenuItem value="percent">Percent (%)</MenuItem>
                                <MenuItem value="fixed">Fixed ($)</MenuItem>
                            </Select>
                        </FormControl>
                        <TextField size="small" label={form.discountType === "percent" ? "Discount %" : "Discount $"}
                            type="number" value={form.discountValue} onChange={e => set("discountValue", e.target.value)} sx={{ flex: 1 }} />
                    </Stack>
                    <Stack direction="row" spacing={2}>
                        <TextField size="small" label="Start Date" type="date" value={form.startDate}
                            onChange={e => set("startDate", e.target.value)} InputLabelProps={{ shrink: true }} sx={{ flex: 1 }} />
                        <TextField size="small" label="End Date" type="date" value={form.endDate}
                            onChange={e => set("endDate", e.target.value)} InputLabelProps={{ shrink: true }} sx={{ flex: 1 }} />
                    </Stack>
                    <FormControl size="small" fullWidth>
                        <InputLabel>Scope</InputLabel>
                        <Select value={form.scope} label="Scope" onChange={e => set("scope", e.target.value)}>
                            {SCOPE_OPTIONS.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                        </Select>
                    </FormControl>
                    <TextField fullWidth size="small" label="Coupon Code (optional)" value={form.couponCode}
                        onChange={e => set("couponCode", e.target.value.toUpperCase())} />
                    <FormControlLabel
                        control={<Checkbox checked={form.newShopifyProductsOnly} onChange={e => set("newShopifyProductsOnly", e.target.checked)} size="small" />}
                        label={<Typography variant="body2">Apply to new Shopify products only</Typography>}
                    />
                </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={onClose}>Cancel</Button>
                <Button variant="contained" onClick={save} disabled={saving}
                    startIcon={saving ? <CircularProgress size={14} color="inherit" /> : null}
                    sx={{ bgcolor: SHOPIFY_GREEN, "&:hover": { bgcolor: "#7da33a" } }}>
                    Create Sale
                </Button>
            </DialogActions>
        </Dialog>
    );
}

// ─── Sales Tab ────────────────────────────────────────────────────────────────
function SalesTab({ shop }) {
    const [sales, setSales]       = useState([]);
    const [loading, setLoading]   = useState(true);
    const [error, setError]       = useState("");
    const [creating, setCreating] = useState(false);
    const [deleting, setDeleting] = useState(null);

    const load = useCallback(async () => {
        setLoading(true); setError("");
        try {
            const res = await axios.get(`/api/admin/shopify/sales?shop=${encodeURIComponent(shop)}`);
            setSales(res.data.sales ?? []);
        } catch (e) { setError(errMsg(e)); }
        finally { setLoading(false); }
    }, [shop]);

    useEffect(() => { load(); }, [load]);

    const deleteSale = async (saleId) => {
        setDeleting(saleId);
        try {
            await axios.delete("/api/admin/shopify/sales", { data: { saleId } });
            setSales(prev => prev.filter(s => s._id !== saleId));
        } catch (e) { setError(errMsg(e)); }
        finally { setDeleting(null); }
    };

    const now = new Date();

    return (
        <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Sales ({sales.length})</Typography>
                <Stack direction="row" spacing={1}>
                    <IconButton onClick={load} disabled={loading}><RefreshIcon /></IconButton>
                    <Button variant="contained" startIcon={<AddIcon />} size="small" onClick={() => setCreating(true)}
                        sx={{ bgcolor: SHOPIFY_GREEN, "&:hover": { bgcolor: "#7da33a" } }}>
                        New Sale
                    </Button>
                </Stack>
            </Stack>
            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}
            <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                    <TableHead>
                        <TableRow sx={{ bgcolor: "#f8fafc" }}>
                            <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Discount</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Scope</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Dates</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: 700 }} />
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {sales.map(s => {
                            const active = s.isActive && new Date(s.startDate) <= now && new Date(s.endDate) >= now;
                            return (
                                <TableRow key={s._id} hover>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight={600}>{s.name}</Typography>
                                        {s.couponCode && (
                                            <Typography variant="caption" sx={{ fontFamily: "monospace", color: SHOPIFY_GREEN }}>{s.couponCode}</Typography>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight={700}>
                                            {s.discountType === "percent" ? `${s.discountValue}%` : `$${s.discountValue}`}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip label={s.scope ?? "site"} size="small" sx={{ bgcolor: "#f3f4f6", color: "#374151", fontSize: "0.7rem" }} />
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="caption" color="text.secondary">
                                            {new Date(s.startDate).toLocaleDateString()} – {new Date(s.endDate).toLocaleDateString()}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip label={active ? "Active" : "Inactive"} size="small"
                                            sx={{ bgcolor: active ? "#d1fae5" : "#f3f4f6", color: active ? "#065f46" : "#6b7280", fontWeight: 600, fontSize: "0.7rem" }} />
                                    </TableCell>
                                    <TableCell>
                                        <IconButton size="small" color="error" disabled={deleting === s._id} onClick={() => deleteSale(s._id)}>
                                            {deleting === s._id ? <CircularProgress size={14} /> : <DeleteIcon fontSize="small" />}
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                        {!loading && sales.length === 0 && (
                            <TableRow><TableCell colSpan={6} align="center">
                                <Typography variant="body2" color="text.secondary" py={3}>No sales found</Typography>
                            </TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
            {loading && <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}><CircularProgress /></Box>}
            <CreateSaleDialog open={creating} shop={shop} onClose={() => setCreating(false)}
                onCreated={sale => { setSales(prev => [sale, ...prev]); setCreating(false); }} />
        </Box>
    );
}

// ─── Orders Tab ───────────────────────────────────────────────────────────────
const ORDER_STATUSES = [
    { value: "open",     label: "Open" },
    { value: "closed",   label: "Closed" },
    { value: "any",      label: "All" },
];

const FULFILLMENT_COLORS = {
    fulfilled:   { bg: "#d1fae5", color: "#065f46" },
    unfulfilled: { bg: "#fef3c7", color: "#92400e" },
    partial:     { bg: "#dbeafe", color: "#1e40af" },
    null:        { bg: "#f3f4f6", color: "#6b7280" },
};

function OrdersTab({ shop }) {
    const [orders, setOrders]         = useState([]);
    const [loading, setLoading]       = useState(true);
    const [error, setError]           = useState("");
    const [status, setStatus]         = useState("open");
    const [pageStack, setPageStack]   = useState([null]); // stack of page_info cursors
    const [currentIdx, setCurrentIdx] = useState(0);
    const [nextPageInfo, setNextPageInfo] = useState(null);

    const load = useCallback(async (page_info = null) => {
        setLoading(true); setError("");
        try {
            const params = new URLSearchParams({ shop, status, limit: 50 });
            if (page_info) params.set("page_info", page_info);
            const res = await axios.get(`/api/admin/shopify/orders?${params}`);
            setOrders(res.data.orders ?? []);
            setNextPageInfo(res.data.nextPageInfo ?? null);
        } catch (e) { setError(errMsg(e)); }
        finally { setLoading(false); }
    }, [shop, status]);

    useEffect(() => {
        setPageStack([null]);
        setCurrentIdx(0);
        setNextPageInfo(null);
        load(null);
    }, [load]);

    const goNext = () => {
        const newStack = [...pageStack.slice(0, currentIdx + 1), nextPageInfo];
        setPageStack(newStack);
        setCurrentIdx(currentIdx + 1);
        load(nextPageInfo);
    };

    const goPrev = () => {
        const prevIdx = currentIdx - 1;
        setCurrentIdx(prevIdx);
        load(pageStack[prevIdx]);
    };

    return (
        <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Stack direction="row" alignItems="center" spacing={2}>
                    <Typography variant="h6">Orders</Typography>
                    <FormControl size="small" sx={{ minWidth: 110 }}>
                        <Select value={status} onChange={e => setStatus(e.target.value)} size="small">
                            {ORDER_STATUSES.map(s => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
                        </Select>
                    </FormControl>
                </Stack>
                <IconButton onClick={() => { setPageStack([null]); setCurrentIdx(0); load(null); }} disabled={loading}>
                    <RefreshIcon />
                </IconButton>
            </Stack>
            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}
            <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                    <TableHead>
                        <TableRow sx={{ bgcolor: "#f8fafc" }}>
                            <TableCell sx={{ fontWeight: 700 }}>Order</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Customer</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Items</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Total</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Payment</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Fulfillment</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {orders.map(o => {
                            const fc = FULFILLMENT_COLORS[o.fulfillment_status] ?? FULFILLMENT_COLORS.null;
                            return (
                                <TableRow key={o.id} hover>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight={600}>{o.name}</Typography>
                                        <Typography variant="caption" color="text.secondary" sx={{ fontFamily: "monospace" }}>#{o.id}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">
                                            {o.customer ? `${o.customer.first_name ?? ""} ${o.customer.last_name ?? ""}`.trim() : "Guest"}
                                        </Typography>
                                        {o.shipping_address?.city && (
                                            <Typography variant="caption" color="text.secondary">
                                                {o.shipping_address.city}, {o.shipping_address.province_code ?? o.shipping_address.province}
                                            </Typography>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">{(o.line_items ?? []).length}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight={600}>
                                            {o.total_price ? `${o.currency ?? "$"}${Number(o.total_price).toFixed(2)}` : "—"}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip label={o.financial_status ?? "—"} size="small"
                                            sx={{ bgcolor: o.financial_status === "paid" ? "#d1fae5" : "#fef3c7",
                                                  color:  o.financial_status === "paid" ? "#065f46" : "#92400e",
                                                  fontWeight: 600, fontSize: "0.7rem" }} />
                                    </TableCell>
                                    <TableCell>
                                        <Chip label={o.fulfillment_status ?? "unfulfilled"} size="small"
                                            sx={{ bgcolor: fc.bg, color: fc.color, fontWeight: 600, fontSize: "0.7rem" }} />
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="caption" color="text.secondary">
                                            {o.created_at ? new Date(o.created_at).toLocaleDateString() : "—"}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                        {!loading && orders.length === 0 && (
                            <TableRow><TableCell colSpan={7} align="center">
                                <Typography variant="body2" color="text.secondary" py={3}>No orders found</Typography>
                            </TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
            {loading && <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}><CircularProgress /></Box>}
            {(currentIdx > 0 || nextPageInfo) && (
                <Stack direction="row" justifyContent="center" spacing={1} mt={2}>
                    <Button size="small" disabled={currentIdx === 0 || loading} onClick={goPrev}>Previous</Button>
                    <Button size="small" disabled={!nextPageInfo || loading} onClick={goNext}>Next</Button>
                </Stack>
            )}
        </Box>
    );
}

// ─── Products Tab ─────────────────────────────────────────────────────────────
function ProductsTab({ shop }) {
    const [products, setProducts]     = useState([]);
    const [loading, setLoading]       = useState(true);
    const [error, setError]           = useState("");
    const [pageStack, setPageStack]   = useState([null]);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [nextPageInfo, setNextPageInfo] = useState(null);

    const load = useCallback(async (page_info = null) => {
        setLoading(true); setError("");
        try {
            const params = new URLSearchParams({ shop, limit: 50 });
            if (page_info) params.set("page_info", page_info);
            const res = await axios.get(`/api/admin/shopify/products?${params}`);
            setProducts(res.data.products ?? []);
            setNextPageInfo(res.data.nextPageInfo ?? null);
        } catch (e) { setError(errMsg(e)); }
        finally { setLoading(false); }
    }, [shop]);

    useEffect(() => { load(null); }, [load]);

    const goNext = () => {
        const newStack = [...pageStack.slice(0, currentIdx + 1), nextPageInfo];
        setPageStack(newStack);
        setCurrentIdx(currentIdx + 1);
        load(nextPageInfo);
    };

    const goPrev = () => {
        const prevIdx = currentIdx - 1;
        setCurrentIdx(prevIdx);
        load(pageStack[prevIdx]);
    };

    return (
        <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Products ({products.length} on this page)</Typography>
                <IconButton onClick={() => { setPageStack([null]); setCurrentIdx(0); load(null); }} disabled={loading}>
                    <RefreshIcon />
                </IconButton>
            </Stack>
            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}
            <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                    <TableHead>
                        <TableRow sx={{ bgcolor: "#f8fafc" }}>
                            <TableCell sx={{ fontWeight: 700 }}>Title</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Variants</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Updated</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {products.map(p => (
                            <TableRow key={p.id} hover>
                                <TableCell>
                                    <Typography variant="body2" fontWeight={500}>{p.title}</Typography>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontFamily: "monospace" }}>#{p.id}</Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2">{p.product_type || "—"}</Typography>
                                </TableCell>
                                <TableCell>
                                    <Chip label={p.status ?? "—"} size="small"
                                        sx={{ bgcolor: p.status === "active" ? "#d1fae5" : "#f3f4f6",
                                              color:  p.status === "active" ? "#065f46" : "#6b7280",
                                              fontWeight: 600, fontSize: "0.7rem" }} />
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2">{(p.variants ?? []).length}</Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="caption" color="text.secondary">
                                        {p.updated_at ? new Date(p.updated_at).toLocaleDateString() : "—"}
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ))}
                        {!loading && products.length === 0 && (
                            <TableRow><TableCell colSpan={5} align="center">
                                <Typography variant="body2" color="text.secondary" py={3}>No products found</Typography>
                            </TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
            {loading && <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}><CircularProgress /></Box>}
            {(currentIdx > 0 || nextPageInfo) && (
                <Stack direction="row" justifyContent="center" spacing={1} mt={2}>
                    <Button size="small" disabled={currentIdx === 0 || loading} onClick={goPrev}>Previous</Button>
                    <Button size="small" disabled={!nextPageInfo || loading} onClick={goNext}>Next</Button>
                </Stack>
            )}
        </Box>
    );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export function ShopifyDashboard({ connection }) {
    const [tab, setTab]               = useState(0);
    const [stats, setStats]           = useState(null);
    const [loadingStats, setLoadingStats] = useState(true);

    const shop = (connection.displayName ?? "").replace(/^shopify-/, "");

    useEffect(() => {
        axios.get("/api/admin/shopify")
            .then(r => setStats((r.data.shops ?? []).find(s => s.shop === shop) ?? null))
            .catch(() => {})
            .finally(() => setLoadingStats(false));
    }, [shop]);

    return (
        <Container maxWidth="xl" sx={{ py: 3 }}>
            <Stack direction="row" alignItems="center" spacing={2} mb={3}>
                <Button component={Link} href="/admin/integrations" startIcon={<ArrowBackIcon />} size="small">
                    Integrations
                </Button>
                <Box sx={{ bgcolor: SHOPIFY_GREEN, px: 2, py: 1, borderRadius: 1, display: "flex", alignItems: "center" }}>
                    <StorefrontIcon sx={{ color: "#fff", fontSize: 18 }} />
                </Box>
                <Box>
                    <Typography variant="h6" fontWeight={700}>{shop}</Typography>
                    <Typography variant="caption" color="text.secondary">{connection.displayName}</Typography>
                </Box>
            </Stack>

            <Grid2 container spacing={2} mb={3}>
                <Grid2 size={{ xs: 6, sm: 3 }}>
                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, textAlign: "center" }}>
                        <LocalOfferIcon sx={{ color: SHOPIFY_GREEN, mb: 0.5 }} />
                        <Typography variant="h5" fontWeight={700}>{loadingStats ? "—" : (stats?.activeSales ?? 0)}</Typography>
                        <Typography variant="caption" color="text.secondary">Active Sales</Typography>
                    </Paper>
                </Grid2>
                <Grid2 size={{ xs: 6, sm: 3 }}>
                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, textAlign: "center" }}>
                        <CategoryIcon sx={{ color: SHOPIFY_GREEN, mb: 0.5 }} />
                        <Typography variant="h5" fontWeight={700}>{loadingStats ? "—" : (stats?.totalProducts ?? 0)}</Typography>
                        <Typography variant="caption" color="text.secondary">Synced Products</Typography>
                    </Paper>
                </Grid2>
            </Grid2>

            <Paper variant="outlined">
                <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: "divider", px: 2 }}>
                    <Tab label="Orders" />
                    <Tab label="Products" />
                    <Tab label="Sales" />
                </Tabs>
                <Box sx={{ px: 3 }}>
                    <TabPanel value={tab} index={0}><OrdersTab shop={shop} /></TabPanel>
                    <TabPanel value={tab} index={1}><ProductsTab shop={shop} /></TabPanel>
                    <TabPanel value={tab} index={2}><SalesTab shop={shop} /></TabPanel>
                </Box>
            </Paper>
        </Container>
    );
}

"use client";
import {
    Box, Container, Typography, Stack, Paper, Divider, Chip, Button, Tab, Tabs,
    Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
    CircularProgress, Alert, Select, MenuItem, TextField, Avatar,
    Dialog, DialogTitle, DialogContent, DialogActions, InputAdornment,
    FormControl, InputLabel, IconButton, Tooltip,
} from "@mui/material";
import { useState, useCallback, useEffect } from "react";
import axios from "axios";
import SyncIcon from "@mui/icons-material/Sync";
import SearchIcon from "@mui/icons-material/Search";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import StorefrontIcon from "@mui/icons-material/Storefront";
import InventoryIcon from "@mui/icons-material/Inventory2";
import EditIcon from "@mui/icons-material/Edit";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Link from "next/link";

const TIKTOK_COLOR = "#010101";
const TIKTOK_TEAL  = "#69C9D0";

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
    const map = {
        AWAITING_SHIPMENT: { label: "Awaiting Shipment", bg: "#fef3c7", color: "#92400e" },
        SHIPPED:           { label: "Shipped",           bg: "#d1fae5", color: "#065f46" },
        CANCELLED:         { label: "Cancelled",         bg: "#fee2e2", color: "#991b1b" },
        ACTIVATE:          { label: "Active",            bg: "#d1fae5", color: "#065f46" },
        DRAFT:             { label: "Draft",             bg: "#e0e7ff", color: "#3730a3" },
        SELLER_DEACTIVATED:{ label: "Deactivated",       bg: "#f3f4f6", color: "#6b7280" },
    };
    const s = map[status] ?? { label: status ?? "—", bg: "#f3f4f6", color: "#374151" };
    return (
        <Chip label={s.label} size="small"
            sx={{ bgcolor: s.bg, color: s.color, fontWeight: 600, fontSize: "0.7rem", border: "none" }} />
    );
}

// ─── Orders Panel ─────────────────────────────────────────────────────────────
function TikTokOrdersPanel({ shopId, shopCipher }) {
    const [orders,    setOrders]    = useState([]);
    const [loading,   setLoading]   = useState(false);
    const [error,     setError]     = useState("");
    const [fetched,   setFetched]   = useState(false);
    const [providers, setProviders] = useState([]);
    const [shipTarget, setShipTarget]           = useState(null);
    const [selectedProvider, setSelectedProvider] = useState("");
    const [tracking,  setTracking]  = useState("");
    const [shipping,  setShipping]  = useState(false);
    const [providerLoading, setProviderLoading] = useState(false);

    const pull = useCallback(async () => {
        setLoading(true); setError(""); setFetched(true);
        try {
            const res = await axios.get(`/api/integrations/tiktok/orders?shopId=${shopId}&shopCipher=${encodeURIComponent(shopCipher)}`);
            setOrders(res.data.orders ?? []);
        } catch (e) {
            setError(e.response?.data?.error ?? "Failed to pull orders");
        } finally { setLoading(false); }
    }, [shopId, shopCipher]);

    const openShipDialog = async (order) => {
        setShipTarget(order);
        setTracking("");
        setSelectedProvider("");
        setProviderLoading(true);
        try {
            const res = await axios.post("/api/integrations/tiktok/orders", {
                shopId, shopCipher, action: "providers",
            });
            setProviders(res.data.providers ?? []);
            if (res.data.providers?.length) setSelectedProvider(res.data.providers[0].id);
        } catch (_) {
            setProviders([]);
        } finally { setProviderLoading(false); }
    };

    const ship = async () => {
        if (!tracking.trim() || !selectedProvider || !shipTarget) return;
        setShipping(true);
        try {
            const lineItemIds = (shipTarget.line_items ?? []).map(i => i.id);
            await axios.post("/api/integrations/tiktok/orders", {
                shopId, shopCipher, action: "ship",
                orderId: shipTarget.id,
                lineItemIds,
                trackingNumber: tracking.trim(),
                shippingProviderId: selectedProvider,
            });
            setOrders(prev => prev.filter(o => o.id !== shipTarget.id));
            setShipTarget(null); setTracking("");
        } catch (e) {
            setError(e.response?.data?.error ?? "Ship failed");
        } finally { setShipping(false); }
    };

    return (
        <Box>
            <Stack direction="row" alignItems="center" spacing={2} mb={2}>
                <Typography variant="body2" fontWeight={600} color="text.secondary">
                    Awaiting Shipment
                </Typography>
                <Button size="small" variant="outlined"
                    startIcon={loading ? <CircularProgress size={12} /> : <SyncIcon sx={{ fontSize: 14 }} />}
                    onClick={pull} disabled={loading}
                    sx={{ borderColor: TIKTOK_TEAL, color: TIKTOK_TEAL }}>
                    {fetched ? "Refresh" : "Pull Orders"}
                </Button>
                {fetched && !loading && (
                    <Chip
                        label={`${orders.length} order${orders.length !== 1 ? "s" : ""}`}
                        size="small"
                        sx={{
                            bgcolor: orders.length > 0 ? "#fef3c7" : "#d1fae5",
                            color:   orders.length > 0 ? "#92400e" : "#065f46",
                            fontWeight: 600,
                        }}
                    />
                )}
            </Stack>

            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}

            {fetched && !loading && orders.length > 0 && (
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1.5 }}>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: "#f8fafc" }}>
                                <TableCell sx={{ fontWeight: 700 }}>Order ID</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Customer</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Items</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Total</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Shipping</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {orders.map(o => (
                                <TableRow key={o.id} hover>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight={500} sx={{ fontFamily: "monospace", fontSize: "0.78rem" }}>
                                            {o.id}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">{o.recipient_address?.name ?? "—"}</Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {o.recipient_address?.district_info?.find(d => d.address_level_name === "City")?.address_name ?? ""}
                                            {", "}
                                            {o.recipient_address?.district_info?.find(d => d.address_level_name === "State")?.address_name ?? ""}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Stack spacing={0.25}>
                                            {(o.line_items ?? []).slice(0, 2).map((item, i) => (
                                                <Typography key={i} variant="caption" color="text.secondary" sx={{ maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                    {item.product_name ?? item.seller_sku}
                                                </Typography>
                                            ))}
                                            {(o.line_items ?? []).length > 2 && (
                                                <Typography variant="caption" color="text.secondary">
                                                    +{o.line_items.length - 2} more
                                                </Typography>
                                            )}
                                        </Stack>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight={500}>
                                            ${Number(o.payment?.total_amount ?? 0).toFixed(2)}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="caption" color="text.secondary">
                                            {o.create_time ? new Date(o.create_time * 1000).toLocaleDateString() : "—"}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="caption">{o.delivery_option_name ?? "—"}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Button size="small" variant="outlined"
                                            startIcon={<LocalShippingIcon sx={{ fontSize: 14 }} />}
                                            onClick={() => openShipDialog(o)}
                                            sx={{ borderColor: TIKTOK_TEAL, color: TIKTOK_TEAL }}>
                                            Ship
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {fetched && !loading && orders.length === 0 && !error && (
                <Typography variant="body2" color="text.secondary">No orders awaiting shipment.</Typography>
            )}

            {/* Ship dialog */}
            <Dialog open={!!shipTarget} onClose={() => { setShipTarget(null); setTracking(""); }} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 700 }}>
                    Ship Order {shipTarget?.id}
                    <IconButton onClick={() => { setShipTarget(null); setTracking(""); }} sx={{ position: "absolute", right: 12, top: 12 }}>
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    {shipTarget && (
                        <Stack spacing={2} mt={0.5}>
                            {/* Items summary */}
                            <Box>
                                <Typography variant="caption" fontWeight={600} color="text.secondary" display="block" mb={0.5}>Items</Typography>
                                {(shipTarget.line_items ?? []).map((item, i) => (
                                    <Typography key={i} variant="body2">{item.product_name ?? item.seller_sku} × {item.quantity ?? 1}</Typography>
                                ))}
                            </Box>
                            <FormControl fullWidth size="small">
                                <InputLabel>Shipping Provider</InputLabel>
                                <Select
                                    label="Shipping Provider"
                                    value={selectedProvider}
                                    onChange={e => setSelectedProvider(e.target.value)}
                                    disabled={providerLoading}
                                >
                                    {providerLoading
                                        ? <MenuItem value=""><CircularProgress size={14} sx={{ mr: 1 }} /> Loading...</MenuItem>
                                        : providers.length > 0
                                            ? providers.map(p => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)
                                            : <MenuItem value="">No providers found — enter manually</MenuItem>
                                    }
                                </Select>
                            </FormControl>
                            <TextField
                                size="small" fullWidth label="Tracking Number"
                                value={tracking} onChange={e => setTracking(e.target.value)}
                                onKeyDown={e => e.key === "Enter" && ship()}
                            />
                        </Stack>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => { setShipTarget(null); setTracking(""); }}>Cancel</Button>
                    <Button
                        variant="contained" onClick={ship}
                        disabled={shipping || !tracking.trim() || !selectedProvider}
                        startIcon={shipping ? <CircularProgress size={14} color="inherit" /> : <LocalShippingIcon />}
                        sx={{ bgcolor: TIKTOK_TEAL, color: "#000", "&:hover": { bgcolor: "#50b8bf" } }}
                    >
                        Confirm Shipment
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

// ─── Products Panel ───────────────────────────────────────────────────────────
function InlineEdit({ value, onSave, prefix = "", suffix = "" }) {
    const [editing, setEditing] = useState(false);
    const [val, setVal]         = useState(value);
    const [saving, setSaving]   = useState(false);

    const save = async () => {
        if (val === value) { setEditing(false); return; }
        setSaving(true);
        await onSave(val);
        setSaving(false);
        setEditing(false);
    };

    if (!editing) {
        return (
            <Stack direction="row" alignItems="center" spacing={0.5}>
                <Typography variant="body2">{prefix}{value}{suffix}</Typography>
                <Tooltip title="Edit">
                    <IconButton size="small" onClick={() => { setVal(value); setEditing(true); }}>
                        <EditIcon sx={{ fontSize: 13 }} />
                    </IconButton>
                </Tooltip>
            </Stack>
        );
    }
    return (
        <Stack direction="row" alignItems="center" spacing={0.5}>
            <TextField
                size="small" value={val} onChange={e => setVal(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") save(); if (e.key === "Escape") setEditing(false); }}
                InputProps={{ startAdornment: prefix ? <InputAdornment position="start">{prefix}</InputAdornment> : undefined }}
                sx={{ width: 90 }} autoFocus
            />
            <IconButton size="small" onClick={save} disabled={saving}>
                {saving ? <CircularProgress size={12} /> : <CheckIcon sx={{ fontSize: 13, color: "#16a34a" }} />}
            </IconButton>
            <IconButton size="small" onClick={() => setEditing(false)}>
                <CloseIcon sx={{ fontSize: 13, color: "#dc2626" }} />
            </IconButton>
        </Stack>
    );
}

const skuPrice = (sku) => sku?.price?.tax_exclusive_price ?? sku?.price?.original_price ?? sku?.price?.sale_price ?? sku?.price?.amount ?? null;
const cleanImgUrl = (url) => url?.replace(/%7[Dd]/g, "").replace(/[{}]/g, "") ?? url;

const qualityColor = (tier) => {
    if (!tier) return "default";
    const t = tier.toUpperCase();
    if (t === "GOOD" || t === "HIGH") return "success";
    if (t === "NORMAL" || t === "MEDIUM") return "warning";
    return "error";
};

function ProductRow({ product, shopId, shopCipher, warehouseId, onError }) {
    const [expanded, setExpanded]     = useState(false);
    const [skus, setSkus]             = useState(product.skus ?? []);
    const [quality, setQuality]       = useState(null);
    const [qualityIssues, setIssues]  = useState([]);
    const [qualityLoading, setQualityLoading] = useState(false);
    const [analytics, setAnalytics]   = useState(null);
    const [analyticsLoading, setAnalyticsLoading] = useState(false);

    const fetchQuality = async () => {
        if (quality !== null || qualityLoading) return;
        setQualityLoading(true);
        try {
            const res = await axios.get(`/api/integrations/tiktok/quality?shopId=${shopId}&shopCipher=${encodeURIComponent(shopCipher)}&productId=${product.id}`);
            setQuality(res.data.quality_tier ?? "N/A");
            setIssues(res.data.issues ?? []);
        } catch (e) { setQuality("N/A"); }
        setQualityLoading(false);
    };

    const fetchAnalytics = async () => {
        if (analytics !== null || analyticsLoading) return;
        setAnalyticsLoading(true);
        try {
            const res = await axios.get(`/api/integrations/tiktok/analytics?shopId=${shopId}&shopCipher=${encodeURIComponent(shopCipher)}&productId=${product.id}&days=30`);
            setAnalytics(res.data.analytics ?? {});
        } catch (e) { setAnalytics({}); }
        setAnalyticsLoading(false);
    };

    const toggle = () => {
        setExpanded(p => !p);
        if (!expanded) { fetchQuality(); fetchAnalytics(); }
    };

    const updateInventory = async (skuId, quantity) => {
        try {
            await axios.put("/api/integrations/tiktok/products", {
                shopId, shopCipher, action: "inventory", productId: product.id,
                skus: [{ id: skuId, inventory: [{ warehouse_id: warehouseId, quantity: Number(quantity) }] }],
            });
            setSkus(prev => prev.map(s => s.id === skuId
                ? { ...s, inventory: s.inventory?.map(inv => ({ ...inv, quantity: Number(quantity) })) }
                : s));
        } catch (e) {
            onError(e.response?.data?.error ?? "Inventory update failed");
        }
    };

    const updatePrice = async (skuId, amount) => {
        try {
            await axios.put("/api/integrations/tiktok/products", {
                shopId, shopCipher, action: "price", productId: product.id,
                skus: [{ id: skuId, price: { amount: Number(amount).toFixed(2), currency: "USD" } }],
            });
            setSkus(prev => prev.map(s => s.id === skuId
                ? { ...s, price: { ...s.price, amount: Number(amount).toFixed(2) } }
                : s));
        } catch (e) {
            onError(e.response?.data?.error ?? "Price update failed");
        }
    };

    const thumbUrl = product._dbImage ?? product.main_images?.[0]?.thumb_urls?.[0] ?? product.main_images?.[0]?.urls?.[0] ?? null;

    return (
        <>
            <TableRow hover sx={{ cursor: "pointer" }} onClick={toggle}>
                <TableCell>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                        {thumbUrl
                            ? <Box component="img" src={thumbUrl} alt="" sx={{ width: 40, height: 40, objectFit: "cover", borderRadius: 1, flexShrink: 0 }} />
                            : <Box sx={{ width: 40, height: 40, bgcolor: "#f3f4f6", borderRadius: 1, flexShrink: 0 }} />
                        }
                        <Box>
                            <Typography variant="body2" fontWeight={600} sx={{ maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {product.title ?? "—"}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontFamily: "monospace" }}>
                                {product.id}
                            </Typography>
                        </Box>
                    </Stack>
                </TableCell>
                <TableCell><StatusBadge status={product.status} /></TableCell>
                <TableCell>
                    <Typography variant="body2">{(skus ?? []).length} SKU{(skus ?? []).length !== 1 ? "s" : ""}</Typography>
                </TableCell>
                <TableCell>
                    <Typography variant="body2">
                        {skuPrice(skus?.[0]) ? `$${skuPrice(skus[0])}` : "—"}
                        {skus?.length > 1 ? " +" : ""}
                    </Typography>
                </TableCell>
                <TableCell>
                    <Typography variant="body2">
                        {skus?.reduce((sum, s) => sum + (s.inventory?.[0]?.quantity ?? 0), 0)}
                    </Typography>
                </TableCell>
                <TableCell>
                    {qualityLoading
                        ? <CircularProgress size={14} />
                        : quality
                            ? <Chip label={quality} size="small" color={qualityColor(quality)} variant="outlined" sx={{ fontSize: "0.7rem" }} />
                            : <Typography variant="caption" color="text.disabled">—</Typography>
                    }
                </TableCell>
            </TableRow>
            {expanded && (
                <TableRow>
                    <TableCell colSpan={6} sx={{ p: 0, bgcolor: "#f8fafc" }}>
                        <Box sx={{ px: 3, py: 2 }}>
                            <Typography variant="caption" fontWeight={700} color="text.secondary" mb={1} display="block">
                                SKUs — click values to edit inventory or price
                            </Typography>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 700 }}>SKU</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Color / Size</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Price</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Inventory</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {(skus ?? []).map(sku => (
                                        <TableRow key={sku.id}>
                                            <TableCell>
                                                <Typography variant="caption" sx={{ fontFamily: "monospace" }}>{sku.seller_sku}</Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="caption">
                                                    {(() => {
                                                        if (sku.sales_attributes?.length) return sku.sales_attributes.map(a => `${a.name}: ${a.value_name}`).join(" / ");
                                                        const parts = sku.seller_sku?.split("_") ?? [];
                                                        return [parts[1], parts[2]].filter(Boolean).join(" / ") || "—";
                                                    })()}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <InlineEdit
                                                    value={skuPrice(sku) ?? "0"}
                                                    prefix="$"
                                                    onSave={v => updatePrice(sku.id, v)}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <InlineEdit
                                                    value={String(sku.inventory?.[0]?.quantity ?? 0)}
                                                    onSave={v => updateInventory(sku.id, v)}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Box>

                        {/* Analytics */}
                        <Box sx={{ px: 3, pb: 1.5 }}>
                            <Typography variant="caption" fontWeight={700} color="text.secondary" display="block" mb={1}>
                                Performance · Last 30 Days
                            </Typography>
                            {analyticsLoading ? (
                                <CircularProgress size={14} />
                            ) : analytics && Object.keys(analytics).length > 0 ? (
                                <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                                    {[
                                        { key: "product_impressions", label: "Impressions" },
                                        { key: "product_clicks",      label: "Clicks" },
                                        { key: "product_orders",      label: "Orders" },
                                        { key: "product_gmv",         label: "GMV" },
                                        { key: "ctr",                 label: "CTR" },
                                        { key: "cvr",                 label: "CVR" },
                                    ].filter(m => analytics[m.key] != null).map(m => (
                                        <Box key={m.key} sx={{ textAlign: "center", minWidth: 70 }}>
                                            <Typography variant="caption" color="text.secondary" display="block">{m.label}</Typography>
                                            <Typography variant="body2" fontWeight={700}>
                                                {m.key === "product_gmv" ? `$${Number(analytics[m.key]).toFixed(2)}` :
                                                 m.key === "ctr" || m.key === "cvr" ? `${(Number(analytics[m.key]) * 100).toFixed(1)}%` :
                                                 Number(analytics[m.key]).toLocaleString()}
                                            </Typography>
                                        </Box>
                                    ))}
                                    {Object.keys(analytics).filter(k => !["product_impressions","product_clicks","product_orders","product_gmv","ctr","cvr"].includes(k)).length > 0 && (
                                        <Typography variant="caption" color="text.disabled" sx={{ alignSelf: "center" }}>
                                            (analytics endpoint active — check logs for full response shape)
                                        </Typography>
                                    )}
                                </Stack>
                            ) : analytics !== null ? (
                                <Typography variant="caption" color="text.disabled">No analytics data for this period</Typography>
                            ) : null}
                        </Box>

                        {/* Quality Issues */}
                        {qualityIssues.length > 0 && (
                            <Box sx={{ px: 3, pb: 2 }}>
                                <Typography variant="caption" fontWeight={700} color="error.main" display="block" mb={0.75}>
                                    Quality Issues — why this listing scores POOR
                                </Typography>
                                <Stack spacing={0.5}>
                                    {qualityIssues.map((issue, i) => (
                                        <Box key={i} sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
                                            <Chip label={issue.field} size="small" color="warning" variant="outlined" sx={{ fontSize: "0.65rem", height: 18, flexShrink: 0 }} />
                                            <Typography variant="caption" color="text.secondary">{issue.tip}</Typography>
                                        </Box>
                                    ))}
                                </Stack>
                            </Box>
                        )}
                    </TableCell>
                </TableRow>
            )}
        </>
    );
}

function TikTokProductsPanel({ shopId, shopCipher }) {
    const [products,       setProducts]      = useState([]);
    const [loading,        setLoading]       = useState(false);
    const [error,          setError]         = useState("");
    const [fetched,        setFetched]       = useState(false);
    const [total,          setTotal]         = useState(0);
    const [warehouseId,    setWarehouseId]   = useState(null);
    const [status,         setStatus]        = useState("ACTIVATE");
    const [skuSearch,      setSkuSearch]     = useState("");
    const [nextToken,      setNextToken]     = useState(null);
    const [tokenStack,     setTokenStack]    = useState([]);  // stack of prev tokens for Back

    const fetchPage = useCallback(async (pageToken = null, sku = "") => {
        setLoading(true); setError(""); setFetched(true);
        try {
            const params = new URLSearchParams({ shopId, shopCipher, status, page_size: 50 });
            if (pageToken) params.set("page_token", pageToken);
            if (sku.trim()) params.set("sku", sku.trim());
            const res = await axios.get(`/api/integrations/tiktok/products?${params}`);
            console.log("pagination response keys:", Object.keys(res.data), "next_page_token:", res.data.next_page_token);
            setProducts(res.data.products ?? []);
            setTotal(res.data.total ?? 0);
            setNextToken(res.data.next_page_token ?? null);
            setWarehouseId(res.data.warehouseId ?? null);
        } catch (e) {
            setError(e.response?.data?.error ?? "Failed to load products");
        } finally { setLoading(false); }
    }, [shopId, shopCipher, status]);

    const handleLoad = () => { setTokenStack([]); fetchPage(null, skuSearch); };
    const handleNext = () => { setTokenStack(s => [...s, null]); fetchPage(nextToken, skuSearch); };
    // TikTok cursor pagination is forward-only; Back re-fetches from the token before current
    const handleBack = () => {
        const stack = [...tokenStack];
        const prev  = stack.pop() ?? null;
        setTokenStack(stack);
        fetchPage(prev, skuSearch);
    };

    return (
        <Box>
            <Stack direction="row" alignItems="center" spacing={2} mb={2} flexWrap="wrap">
                <Typography variant="body2" fontWeight={600} color="text.secondary">Products</Typography>
                <Select size="small" value={status} onChange={e => { setStatus(e.target.value); setTokenStack([]); setNextToken(null); }} sx={{ minWidth: 140 }}>
                    <MenuItem value="ACTIVATE">Active</MenuItem>
                    <MenuItem value="DRAFT">Draft</MenuItem>
                    <MenuItem value="SELLER_DEACTIVATED">Deactivated</MenuItem>
                </Select>
                <TextField
                    size="small" placeholder="Search by SKU..." value={skuSearch}
                    onChange={e => setSkuSearch(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") handleLoad(); }}
                    InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 16 }} /></InputAdornment> }}
                    sx={{ width: 200 }}
                />
                <Button size="small" variant="outlined"
                    startIcon={loading ? <CircularProgress size={12} /> : <SyncIcon sx={{ fontSize: 14 }} />}
                    onClick={handleLoad} disabled={loading}
                    sx={{ borderColor: TIKTOK_TEAL, color: TIKTOK_TEAL }}>
                    {fetched ? "Refresh" : "Load Products"}
                </Button>
                {fetched && !loading && (
                    <Chip label={`${products.length} shown / ${total} total`} size="small"
                        sx={{ bgcolor: "#e0e7ff", color: "#3730a3", fontWeight: 600 }} />
                )}
                {!warehouseId && fetched && (
                    <Typography variant="caption" color="warning.main">Warehouse not detected — inventory updates may fail</Typography>
                )}
            </Stack>

            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}

            {fetched && !loading && products.length > 0 && (
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1.5 }}>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: "#f8fafc" }}>
                                <TableCell sx={{ fontWeight: 700 }}>Product</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>SKUs</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Price</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Total Stock</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Quality</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {products.map(p => (
                                <ProductRow
                                    key={p.id}
                                    product={p}
                                    shopId={shopId}
                                    shopCipher={shopCipher}
                                    warehouseId={warehouseId}
                                    onError={setError}
                                />
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {fetched && !loading && products.length === 0 && !error && (
                <Typography variant="body2" color="text.secondary">No products found for status: {status}.</Typography>
            )}

            {fetched && !loading && (tokenStack.length > 0 || nextToken) && (
                <Stack direction="row" spacing={1} justifyContent="flex-end" mt={1.5}>
                    <Button size="small" variant="outlined" disabled={tokenStack.length === 0} onClick={handleBack}>← Back</Button>
                    <Button size="small" variant="outlined" disabled={!nextToken} onClick={handleNext}
                        sx={{ borderColor: TIKTOK_TEAL, color: TIKTOK_TEAL }}>Next →</Button>
                </Stack>
            )}
        </Box>
    );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export function TikTokDashboard({ shops }) {
    const [selectedShopIdx,   setSelectedShopIdx]   = useState(0);
    const [selectedCipherIdx, setSelectedCipherIdx] = useState(0);
    const [tab, setTab] = useState(0);

    const shop   = shops[selectedShopIdx] ?? {};
    const stores = shop.shop_list ?? [];
    const cipher = stores[selectedCipherIdx]?.shop_cipher ?? "";

    return (
        <Box sx={{ bgcolor: "#f8fafc", minHeight: "100vh", pb: 6 }}>
            {/* Header */}
            <Box sx={{ bgcolor: "#fff", borderBottom: "1px solid #e5e7eb", py: 3, px: { xs: 2, sm: 4 } }}>
                <Container maxWidth="lg">
                    <Stack direction="row" alignItems="center" spacing={2} mb={0.5}>
                        <Button
                            component={Link} href="/admin/integrations"
                            startIcon={<ArrowBackIcon />}
                            size="small" sx={{ color: "text.secondary" }}
                        >
                            Integrations
                        </Button>
                    </Stack>
                    <Stack direction="row" alignItems="center" spacing={2}>
                        <Avatar sx={{ bgcolor: TIKTOK_COLOR, width: 44, height: 44, fontWeight: 700, fontSize: "0.8rem" }}>TT</Avatar>
                        <Box>
                            <Typography variant="h5" fontWeight={700}>TikTok Shop Dashboard</Typography>
                            <Typography variant="body2" color="text.secondary">
                                Manage orders, inventory, and product pricing across your TikTok shops.
                            </Typography>
                        </Box>
                    </Stack>
                </Container>
            </Box>

            <Container maxWidth="lg" sx={{ mt: 4 }}>
                {/* Shop selector */}
                {(shops.length > 1 || stores.length > 1) && (
                    <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, mb: 3 }}>
                        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }}>
                            {shops.length > 1 && (
                                <FormControl size="small" sx={{ minWidth: 200 }}>
                                    <InputLabel>Seller Account</InputLabel>
                                    <Select
                                        label="Seller Account"
                                        value={selectedShopIdx}
                                        onChange={e => { setSelectedShopIdx(e.target.value); setSelectedCipherIdx(0); }}
                                    >
                                        {shops.map((s, i) => (
                                            <MenuItem key={s._id} value={i}>{s.seller_name}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            )}
                            {stores.length > 1 && (
                                <FormControl size="small" sx={{ minWidth: 200 }}>
                                    <InputLabel>Store</InputLabel>
                                    <Select
                                        label="Store"
                                        value={selectedCipherIdx}
                                        onChange={e => setSelectedCipherIdx(e.target.value)}
                                    >
                                        {stores.map((s, i) => (
                                            <MenuItem key={s.shop_cipher} value={i}>
                                                {s.shop_name ?? s.shop_id} · {s.region}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            )}
                            <Chip label="Active" size="small"
                                sx={{ bgcolor: "#d1fae5", color: "#065f46", fontWeight: 600, border: "none" }} />
                        </Stack>
                    </Paper>
                )}

                {/* Shop summary strip */}
                {stores.length === 1 && (
                    <Stack direction="row" spacing={1} alignItems="center" mb={3}>
                        <StorefrontIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                        <Typography variant="body2" color="text.secondary">
                            {shop.seller_name} · {stores[0]?.shop_name ?? stores[0]?.shop_id}
                        </Typography>
                        <Chip label="Active" size="small"
                            sx={{ bgcolor: "#d1fae5", color: "#065f46", fontWeight: 600, border: "none" }} />
                    </Stack>
                )}

                {/* Tabs */}
                <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
                    <Tabs
                        value={tab} onChange={(_, v) => setTab(v)}
                        sx={{
                            borderBottom: "1px solid #e5e7eb",
                            "& .MuiTabs-indicator": { bgcolor: TIKTOK_TEAL },
                            "& .MuiTab-root.Mui-selected": { color: TIKTOK_COLOR, fontWeight: 700 },
                        }}
                    >
                        <Tab icon={<LocalShippingIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Orders" sx={{ minHeight: 48 }} />
                        <Tab icon={<InventoryIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Products & Inventory" sx={{ minHeight: 48 }} />
                    </Tabs>

                    <Box sx={{ p: 3 }}>
                        {cipher ? (
                            <>
                                {tab === 0 && <TikTokOrdersPanel shopId={shop._id} shopCipher={cipher} />}
                                {tab === 1 && <TikTokProductsPanel shopId={shop._id} shopCipher={cipher} />}
                            </>
                        ) : (
                            <Alert severity="warning">
                                No stores found for this account. Sync shops from the Integrations page first.
                            </Alert>
                        )}
                    </Box>
                </Paper>
            </Container>
        </Box>
    );
}

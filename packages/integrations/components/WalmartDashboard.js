"use client";
import {
    Box, Container, Typography, Stack, Chip, Button, TextField,
    Tab, Tabs, Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
    Paper, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
    Alert, CircularProgress, Tooltip, InputAdornment, Select, MenuItem,
    FormControl, InputLabel,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckIcon from "@mui/icons-material/Check";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import InventoryIcon from "@mui/icons-material/Inventory2";
import StorefrontIcon from "@mui/icons-material/Storefront";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CloseIcon from "@mui/icons-material/Close";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import axios from "axios";

function TabPanel({ value, index, children }) {
    return value === index ? <Box sx={{ py: 3 }}>{children}</Box> : null;
}

function StatusChip({ status }) {
    const MAP = {
        PUBLISHED:    { color: "#10b981", bg: "#d1fae5" },
        UNPUBLISHED:  { color: "#6b7280", bg: "#f3f4f6" },
        STAGING:      { color: "#f59e0b", bg: "#fef3c7" },
        RETIRE:       { color: "#ef4444", bg: "#fee2e2" },
        IN_PROGRESS:  { color: "#3b82f6", bg: "#dbeafe" },
        PROCESSED:    { color: "#10b981", bg: "#d1fae5" },
        ERROR:        { color: "#ef4444", bg: "#fee2e2" },
        CREATED:      { color: "#6366f1", bg: "#e0e7ff" },
        Acknowledged: { color: "#3b82f6", bg: "#dbeafe" },
        Created:      { color: "#6366f1", bg: "#e0e7ff" },
        Shipped:      { color: "#10b981", bg: "#d1fae5" },
        Delivered:    { color: "#10b981", bg: "#d1fae5" },
    };
    const style = MAP[status] ?? { color: "#6b7280", bg: "#f3f4f6" };
    return (
        <Chip
            label={status ?? "—"}
            size="small"
            sx={{ bgcolor: style.bg, color: style.color, fontWeight: 600, fontSize: "0.7rem", border: "none" }}
        />
    );
}

// ─── Edit Price / Inventory Dialog ──────────────────────────────────────────
function EditDialog({ open, item, connectionId, onClose, onSaved }) {
    const [value, setValue] = useState(String(item?.current ?? ""));
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => { setValue(String(item?.current ?? "")); setError(""); }, [item]);

    const save = async () => {
        const num = parseFloat(value);
        if (isNaN(num) || num < 0) { setError("Enter a valid number"); return; }
        setSaving(true);
        setError("");
        try {
            if (item.mode === "price") {
                await axios.put("/api/integrations/walmart/price", { connectionId, sku: item.sku, amount: num });
            } else {
                await axios.put("/api/integrations/walmart/inventory", { connectionId, sku: item.sku, amount: Math.round(num) });
            }
            onSaved();
        } catch (e) {
            setError(e.response?.data?.error ?? "Save failed");
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle sx={{ fontWeight: 700 }}>
                {item?.mode === "price" ? "Update Price" : "Update Inventory"} — {item?.sku}
            </DialogTitle>
            <DialogContent>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                <TextField
                    fullWidth size="small" autoFocus sx={{ mt: 1 }}
                    label={item?.mode === "price" ? "Price (USD)" : "Quantity"}
                    type="number"
                    value={value}
                    onChange={e => setValue(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && save()}
                    InputProps={item?.mode === "price" ? { startAdornment: <InputAdornment position="start">$</InputAdornment> } : {}}
                />
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={onClose}>Cancel</Button>
                <Button
                    variant="contained" onClick={save} disabled={saving}
                    startIcon={saving ? <CircularProgress size={14} color="inherit" /> : null}
                >
                    Save
                </Button>
            </DialogActions>
        </Dialog>
    );
}

// ─── Item thumbnail — generates image via renderImages if none on Walmart ────
function ItemImage({ sku, src, alt }) {
    const [imgSrc, setImgSrc] = useState(src ?? null);
    const [loading, setLoading] = useState(!src);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        if (src) return;
        let cancelled = false;
        axios.get(`/api/integrations/walmart/image?sku=${encodeURIComponent(sku)}`)
            .then(res => { if (!cancelled && res.data?.imageUrl) setImgSrc(res.data.imageUrl); })
            .catch(() => { if (!cancelled) setFailed(true); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [sku, src]);

    if (imgSrc) {
        return (
            <Box
                component="img"
                src={imgSrc}
                alt={alt}
                sx={{ width: 44, height: 44, objectFit: "cover", borderRadius: 1, border: "1px solid", borderColor: "divider", display: "block" }}
            />
        );
    }

    return (
        <Box sx={{ width: 44, height: 44, borderRadius: 1, border: "1px dashed", borderColor: "divider", bgcolor: "background.default", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {loading
                ? <CircularProgress size={14} />
                : <Typography sx={{ fontSize: "0.55rem", color: "text.disabled" }}>{failed ? "—" : ""}</Typography>
            }
        </Box>
    );
}

// ─── Items Tab ───────────────────────────────────────────────────────────────
function ItemsTab({ connectionId }) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [searchVal, setSearchVal] = useState("");
    const [searchType, setSearchType] = useState("sku"); // "sku" | "gtin"
    const [specType, setSpecType] = useState("Gender T-Shirts");
    const [total, setTotal] = useState(0);
    const [catalogTotal, setCatalogTotal] = useState(null); // total items on Walmart, no filter
    const [offset, setOffset] = useState(0);
    const [editItem, setEditItem] = useState(null);
    const LIMIT = 20;

    const load = useCallback(async (val, type, off) => {
        setLoading(true);
        setError("");
        try {
            const params = new URLSearchParams({ connectionId, limit: LIMIT, offset: off ?? 0 });
            if (val) params.set(type === "gtin" ? "gtin" : "sku", val.trim());
            const res = await axios.get(`/api/integrations/walmart?${params}`);
            const fetched = res.data.items ?? [];
            const fetchedTotal = res.data.totalResults ?? 0;
            setItems(fetched);
            setTotal(fetchedTotal);
            // Capture catalog total from the unfiltered first load
            if (!val && fetchedTotal > 0) setCatalogTotal(fetchedTotal);
            else if (!val) setCatalogTotal(off === 0 ? fetched.length : null);
        } catch (e) {
            setError(e.response?.data?.error ?? "Failed to load items");
        } finally {
            setLoading(false);
        }
    }, [connectionId]);

    useEffect(() => { load("", "sku", 0); }, [connectionId]);

    const handleSearch = () => {
        setOffset(0);
        load(searchVal, searchType, 0);
    };

    const handleNext = () => {
        const next = offset + LIMIT;
        setOffset(next);
        load(searchVal, searchType, next);
    };

    const handlePrev = () => {
        const prev = Math.max(0, offset - LIMIT);
        setOffset(prev);
        load(searchVal, searchType, prev);
    };

    const handleRetire = async (itemSku) => {
        if (!confirm(`Retire SKU "${itemSku}" from Walmart? This will unpublish the listing.`)) return;
        try {
            await axios.delete(`/api/integrations/walmart?connectionId=${connectionId}&sku=${encodeURIComponent(itemSku)}`);
            load(searchVal, searchType, offset);
        } catch (e) {
            alert(e.response?.data?.error ?? "Failed to retire item");
        }
    };

    const hasPrev = offset > 0;
    const hasNext = items.length >= LIMIT;

    return (
        <Box>
            <Stack direction="row" spacing={2} sx={{ mb: 2 }} alignItems="center">
                <Select
                    size="small" value={searchType}
                    onChange={e => { setSearchType(e.target.value); setSearchVal(""); }}
                    sx={{ width: 90, fontSize: "0.8rem" }}
                >
                    <MenuItem value="sku" sx={{ fontSize: "0.8rem" }}>SKU</MenuItem>
                    <MenuItem value="gtin" sx={{ fontSize: "0.8rem" }}>UPC</MenuItem>
                </Select>
                <TextField
                    size="small"
                    placeholder={searchType === "gtin" ? "Enter UPC…" : "Enter SKU…"}
                    value={searchVal}
                    onChange={e => setSearchVal(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleSearch()}
                    sx={{ width: 240 }}
                    InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" sx={{ color: "text.disabled" }} /></InputAdornment> }}
                />
                <Button variant="outlined" size="small" onClick={handleSearch}>Search</Button>
                {searchVal && (
                    <Button size="small" onClick={() => { setSearchVal(""); setOffset(0); load("", searchType, 0); }}>
                        Clear
                    </Button>
                )}
                <Box sx={{ flex: 1 }} />
                <Chip
                    label={catalogTotal !== null ? `${catalogTotal.toLocaleString()} on Walmart` : "Loading…"}
                    size="small"
                    sx={{ bgcolor: "#0071CE", color: "#fff", fontWeight: 700, fontSize: "0.72rem" }}
                />
                {searchVal && total > 0 && (
                    <Typography variant="caption" color="text.secondary">{total} results</Typography>
                )}
                <Button
                    variant="outlined" size="small" color="secondary"
                    onClick={() => window.open("https://seller.walmart.com/item-spec-editor/specDownload", "_blank")}
                    title="Walmart Seller Center: Catalog → Item Spec → Download Spec Template"
                >
                    Download Spec (Seller Center)
                </Button>
                <Button
                    variant="outlined" size="small" color="secondary"
                    onClick={() => window.open(`/api/integrations/walmart/spec?connectionId=${connectionId}&taxonomy=1&search=${encodeURIComponent(specType)}`, "_blank")}
                    disabled={!specType}
                >
                    Browse Taxonomy
                </Button>
                <Button
                    variant="outlined" size="small" color="secondary"
                    onClick={() => window.open(`/api/integrations/walmart/spec?connectionId=${connectionId}&inspect=1`, "_blank")}
                >
                    Inspect Items
                </Button>
                <IconButton size="small" onClick={() => load(searchVal, searchType, offset)} disabled={loading}>
                    {loading ? <CircularProgress size={16} /> : <RefreshIcon fontSize="small" />}
                </IconButton>
            </Stack>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                <Table size="small">
                    <TableHead>
                        <TableRow sx={{ "& th": { fontWeight: 700, fontSize: "0.75rem", bgcolor: "background.default" } }}>
                            <TableCell sx={{ width: 56 }} />
                            <TableCell>SKU</TableCell>
                            <TableCell>Name</TableCell>
                            <TableCell>Lifecycle</TableCell>
                            <TableCell>Published</TableCell>
                            <TableCell>Price</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {items.length === 0 && !loading && (
                            <TableRow>
                                <TableCell colSpan={7} align="center" sx={{ py: 4, color: "text.disabled" }}>No items found</TableCell>
                            </TableRow>
                        )}
                        {items.map(item => (
                            <TableRow key={item.sku} hover>
                                <TableCell sx={{ py: 0.5 }}>
                                    <ItemImage sku={item.sku} src={item.mainImageUrl} alt={item.itemName ?? item.sku} />
                                </TableCell>
                                <TableCell sx={{ fontFamily: "monospace", fontSize: "0.75rem" }}>{item.sku}</TableCell>
                                <TableCell sx={{ maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "0.8rem" }}>
                                    {item.itemName ?? "—"}
                                </TableCell>
                                <TableCell><StatusChip status={item.lifecycleStatus} /></TableCell>
                                <TableCell><StatusChip status={item.publishedStatus} /></TableCell>
                                <TableCell sx={{ fontSize: "0.8rem" }}>
                                    {item.price?.amount != null ? `$${item.price.amount}` : "—"}
                                </TableCell>
                                <TableCell align="right">
                                    <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                                        <Tooltip title="Edit Price">
                                            <IconButton size="small" onClick={() => setEditItem({ sku: item.sku, mode: "price", current: item.price?.amount })}>
                                                <AttachMoneyIcon sx={{ fontSize: 16 }} />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Edit Inventory">
                                            <IconButton size="small" onClick={() => setEditItem({ sku: item.sku, mode: "inventory", current: null })}>
                                                <InventoryIcon sx={{ fontSize: 16 }} />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Retire Item">
                                            <IconButton size="small" color="error" onClick={() => handleRetire(item.sku)}>
                                                <DeleteIcon sx={{ fontSize: 16 }} />
                                            </IconButton>
                                        </Tooltip>
                                    </Stack>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {(hasPrev || hasNext) && (
                <Stack direction="row" justifyContent="center" alignItems="center" spacing={2} sx={{ mt: 2 }}>
                    <Button size="small" disabled={!hasPrev || loading} onClick={handlePrev}>Previous</Button>
                    <Typography variant="caption" color="text.secondary">
                        Items {offset + 1}–{offset + items.length}
                        {total > 0 ? ` of ${total}` : ""}
                    </Typography>
                    <Button size="small" disabled={!hasNext || loading} onClick={handleNext}>Next</Button>
                </Stack>
            )}

            {editItem && (
                <EditDialog
                    open={!!editItem}
                    item={editItem}
                    connectionId={connectionId}
                    onClose={() => setEditItem(null)}
                    onSaved={() => { setEditItem(null); load(searchVal, searchType, offset); }}
                />
            )}
        </Box>
    );
}

// ─── Feeds Tab ───────────────────────────────────────────────────────────────
function FeedsTab({ connectionId }) {
    const [feeds, setFeeds] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [detailFeed, setDetailFeed] = useState(null);
    const [detailData, setDetailData] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const res = await axios.get(`/api/integrations/walmart/feed?connectionId=${connectionId}&limit=50`);
            const raw = res.data.results;
            setFeeds(Array.isArray(raw) ? raw : (raw?.feed ?? []));
        } catch (e) {
            setError(e.response?.data?.error ?? "Failed to load feeds");
        } finally {
            setLoading(false);
        }
    }, [connectionId]);

    useEffect(() => { load(); }, []);

    const viewDetail = async (feedId) => {
        setDetailFeed(feedId);
        setDetailData(null);
        setDetailLoading(true);
        try {
            const res = await axios.get(`/api/integrations/walmart/feed?connectionId=${connectionId}&feedId=${feedId}&detail=true`);
            setDetailData(res.data);
        } catch (e) {
            setDetailData({ error: e.response?.data?.error ?? "Failed" });
        } finally {
            setDetailLoading(false);
        }
    };

    return (
        <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary">{feeds.length} feeds</Typography>
                <IconButton size="small" onClick={load} disabled={loading}>
                    {loading ? <CircularProgress size={16} /> : <RefreshIcon fontSize="small" />}
                </IconButton>
            </Stack>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                <Table size="small">
                    <TableHead>
                        <TableRow sx={{ "& th": { fontWeight: 700, fontSize: "0.75rem", bgcolor: "background.default" } }}>
                            <TableCell>Feed ID</TableCell>
                            <TableCell>Type</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Total</TableCell>
                            <TableCell sx={{ color: "#10b981" }}>Success</TableCell>
                            <TableCell sx={{ color: "#ef4444" }}>Errors</TableCell>
                            <TableCell align="right" />
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {feeds.length === 0 && !loading && (
                            <TableRow>
                                <TableCell colSpan={7} align="center" sx={{ py: 4, color: "text.disabled" }}>No feeds found</TableCell>
                            </TableRow>
                        )}
                        {feeds.map(feed => (
                            <TableRow key={feed.feedId} hover>
                                <TableCell sx={{ fontFamily: "monospace", fontSize: "0.7rem", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {feed.feedId}
                                </TableCell>
                                <TableCell sx={{ fontSize: "0.75rem" }}>{feed.feedType ?? "—"}</TableCell>
                                <TableCell><StatusChip status={feed.feedStatus} /></TableCell>
                                <TableCell sx={{ fontSize: "0.8rem" }}>{feed.itemsTotal ?? "—"}</TableCell>
                                <TableCell sx={{ fontSize: "0.8rem", color: "#10b981" }}>{feed.itemsSucceeded ?? "—"}</TableCell>
                                <TableCell sx={{ fontSize: "0.8rem", color: feed.itemsFailed > 0 ? "#ef4444" : "text.secondary" }}>
                                    {feed.itemsFailed ?? "—"}
                                </TableCell>
                                <TableCell align="right">
                                    <Button size="small" onClick={() => viewDetail(feed.feedId)}>Details</Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={!!detailFeed} onClose={() => { setDetailFeed(null); setDetailData(null); }} maxWidth="md" fullWidth>
                <DialogTitle sx={{ fontWeight: 700, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    Feed Details
                    <IconButton size="small" onClick={() => { setDetailFeed(null); setDetailData(null); }}>
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    {detailLoading ? (
                        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}><CircularProgress /></Box>
                    ) : detailData?.error ? (
                        <Alert severity="error">{detailData.error}</Alert>
                    ) : (
                        <Box component="pre" sx={{ fontSize: "0.72rem", overflow: "auto", bgcolor: "background.default", p: 2, borderRadius: 2, maxHeight: 420 }}>
                            {JSON.stringify(detailData, null, 2)}
                        </Box>
                    )}
                </DialogContent>
            </Dialog>
        </Box>
    );
}

// ─── Ship Dialog ─────────────────────────────────────────────────────────────
function ShipDialog({ order, connectionId, onClose, onShipped }) {
    const lines = order.orderLines?.orderLine ?? [];
    const [carrier, setCarrier] = useState("USPS");
    const [trackingNumber, setTrackingNumber] = useState("");
    const [methodCode, setMethodCode] = useState("Standard");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const save = async () => {
        if (!trackingNumber.trim()) { setError("Tracking number is required"); return; }
        setSaving(true);
        setError("");
        try {
            await axios.post("/api/integrations/walmart/orders", {
                connectionId,
                purchaseOrderId: order.purchaseOrderId,
                action: "ship",
                lines: lines.map(l => ({
                    lineNumber: l.lineNumber,
                    quantity: l.orderLineQuantity?.amount ?? 1,
                    carrier,
                    trackingNumber: trackingNumber.trim(),
                    methodCode,
                })),
            });
            onShipped();
        } catch (e) {
            setError(e.response?.data?.error ?? "Ship failed");
            setSaving(false);
        }
    };

    return (
        <Dialog open onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle sx={{ fontWeight: 700 }}>Ship Order — {order.purchaseOrderId}</DialogTitle>
            <DialogContent>
                <Stack spacing={2} sx={{ pt: 1 }}>
                    {error && <Alert severity="error">{error}</Alert>}
                    <FormControl size="small" fullWidth>
                        <InputLabel>Carrier</InputLabel>
                        <Select value={carrier} label="Carrier" onChange={e => setCarrier(e.target.value)}>
                            {["USPS", "UPS", "FedEx", "DHL"].map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                        </Select>
                    </FormControl>
                    <TextField
                        size="small" fullWidth label="Tracking Number"
                        value={trackingNumber}
                        onChange={e => setTrackingNumber(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && save()}
                    />
                    <FormControl size="small" fullWidth>
                        <InputLabel>Shipping Method</InputLabel>
                        <Select value={methodCode} label="Shipping Method" onChange={e => setMethodCode(e.target.value)}>
                            {["Standard", "Express", "OneDay", "Freight", "WhiteGlove", "Value", "Expedited"].map(m => (
                                <MenuItem key={m} value={m}>{m}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <Typography variant="caption" color="text.secondary">
                        Applying tracking to {lines.length} line{lines.length !== 1 ? "s" : ""}.
                    </Typography>
                </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={onClose}>Cancel</Button>
                <Button
                    variant="contained" onClick={save} disabled={saving}
                    sx={{ bgcolor: "#0071CE", "&:hover": { bgcolor: "#005da6" } }}
                    startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <LocalShippingIcon sx={{ fontSize: 16 }} />}
                >
                    Mark Shipped
                </Button>
            </DialogActions>
        </Dialog>
    );
}

// ─── Orders Tab ──────────────────────────────────────────────────────────────
function OrdersTab({ connectionId }) {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [released, setReleased] = useState(true);
    const [shipDialog, setShipDialog] = useState(null);

    const load = useCallback(async (isReleased = released) => {
        setLoading(true);
        setError("");
        try {
            const params = new URLSearchParams({ connectionId, released: isReleased, limit: 50 });
            const res = await axios.get(`/api/integrations/walmart/orders?${params}`);
            setOrders(res.data.orders ?? []);
        } catch (e) {
            setError(e.response?.data?.error ?? "Failed to load orders");
        } finally {
            setLoading(false);
        }
    }, [connectionId, released]);

    useEffect(() => { load(true); }, [connectionId]);

    const acknowledge = async (purchaseOrderId) => {
        try {
            await axios.post("/api/integrations/walmart/orders", { connectionId, purchaseOrderId, action: "acknowledge" });
            load();
        } catch (e) {
            alert(e.response?.data?.error ?? "Acknowledge failed");
        }
    };

    const toggleMode = (isReleased) => { setReleased(isReleased); load(isReleased); };

    return (
        <Box>
            <Stack direction="row" spacing={2} sx={{ mb: 2 }} alignItems="center">
                <Stack direction="row" spacing={1}>
                    {[{ label: "Released", val: true }, { label: "All Orders", val: false }].map(({ label, val }) => (
                        <Chip
                            key={label} label={label} size="small"
                            onClick={() => toggleMode(val)}
                            sx={{
                                cursor: "pointer", fontWeight: 700,
                                bgcolor: released === val ? "#0071CE" : "transparent",
                                color: released === val ? "#fff" : "text.secondary",
                                border: "1px solid", borderColor: released === val ? "#0071CE" : "divider",
                            }}
                        />
                    ))}
                </Stack>
                <Box sx={{ flex: 1 }} />
                <Typography variant="caption" color="text.secondary">{orders.length} orders</Typography>
                <IconButton size="small" onClick={() => load()} disabled={loading}>
                    {loading ? <CircularProgress size={16} /> : <RefreshIcon fontSize="small" />}
                </IconButton>
            </Stack>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                <Table size="small">
                    <TableHead>
                        <TableRow sx={{ "& th": { fontWeight: 700, fontSize: "0.75rem", bgcolor: "background.default" } }}>
                            <TableCell>Order #</TableCell>
                            <TableCell>Customer</TableCell>
                            <TableCell>Date</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Lines</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {orders.length === 0 && !loading && (
                            <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ py: 4, color: "text.disabled" }}>No orders found</TableCell>
                            </TableRow>
                        )}
                        {orders.map(order => {
                            const lines = order.orderLines?.orderLine ?? [];
                            const customer = order.shippingInfo?.postalAddress?.name ?? "—";
                            const date = order.orderDate ? new Date(order.orderDate).toLocaleDateString() : "—";
                            const status = lines[0]?.orderLineStatuses?.orderLineStatus?.[0]?.status ?? "—";
                            return (
                                <TableRow key={order.purchaseOrderId} hover>
                                    <TableCell sx={{ fontFamily: "monospace", fontSize: "0.75rem" }}>{order.purchaseOrderId}</TableCell>
                                    <TableCell sx={{ fontSize: "0.8rem" }}>{customer}</TableCell>
                                    <TableCell sx={{ fontSize: "0.8rem" }}>{date}</TableCell>
                                    <TableCell><StatusChip status={status} /></TableCell>
                                    <TableCell sx={{ fontSize: "0.8rem" }}>{lines.length}</TableCell>
                                    <TableCell align="right">
                                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                                            {status === "Created" && (
                                                <Tooltip title="Acknowledge">
                                                    <IconButton size="small" color="primary" onClick={() => acknowledge(order.purchaseOrderId)}>
                                                        <CheckIcon sx={{ fontSize: 16 }} />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                            {(status === "Acknowledged" || status === "Created") && (
                                                <Tooltip title="Ship Order">
                                                    <IconButton size="small" sx={{ color: "#0071CE" }} onClick={() => setShipDialog(order)}>
                                                        <LocalShippingIcon sx={{ fontSize: 16 }} />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>

            {shipDialog && (
                <ShipDialog
                    order={shipDialog}
                    connectionId={connectionId}
                    onClose={() => setShipDialog(null)}
                    onShipped={() => { setShipDialog(null); load(); }}
                />
            )}
        </Box>
    );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export function WalmartDashboard({ connection }) {
    const [tab, setTab] = useState(0);

    return (
        <Box sx={{ backgroundColor: "background.default", minHeight: "100vh" }}>
            <Box sx={{ bgcolor: "#0071CE", py: 3, px: 2 }}>
                <Container maxWidth="xl">
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                        <IconButton component={Link} href="/admin/integrations" sx={{ color: "#fff" }}>
                            <ArrowBackIcon />
                        </IconButton>
                        <StorefrontIcon sx={{ color: "#fff", fontSize: 26 }} />
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 800, color: "#fff", lineHeight: 1.2 }}>
                                Walmart Marketplace
                            </Typography>
                            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.75)" }}>
                                {connection.displayName}
                            </Typography>
                        </Box>
                    </Stack>
                </Container>
            </Box>

            <Container maxWidth="xl" sx={{ py: 3 }}>
                <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: "divider" }}>
                    <Tab label="Items" />
                    <Tab label="Feeds" />
                    <Tab label="Orders" />
                </Tabs>

                <TabPanel value={tab} index={0}>
                    <ItemsTab connectionId={connection._id} />
                </TabPanel>
                <TabPanel value={tab} index={1}>
                    <FeedsTab connectionId={connection._id} />
                </TabPanel>
                <TabPanel value={tab} index={2}>
                    <OrdersTab connectionId={connection._id} />
                </TabPanel>
            </Container>
        </Box>
    );
}

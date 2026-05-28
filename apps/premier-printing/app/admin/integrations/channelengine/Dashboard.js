"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import {
    Box, Typography, Button, Chip, Tab, Tabs, Table, TableHead, TableBody,
    TableRow, TableCell, TableContainer, Paper, Stack, Alert, Select,
    MenuItem, CircularProgress, Divider, TextField, Tooltip, InputAdornment,
    Avatar, Checkbox,
} from "@mui/material";
import SyncIcon from "@mui/icons-material/Sync";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import HubIcon from "@mui/icons-material/Hub";
import SaveIcon from "@mui/icons-material/Save";
import SearchIcon from "@mui/icons-material/Search";
import SendIcon from "@mui/icons-material/Send";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
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
    const [products, setProducts]           = useState([]);
    const [page, setPage]                   = useState(1);
    const [total, setTotal]                 = useState(0);
    const [loading, setLoading]             = useState(false);
    const [saving, setSaving]               = useState(null);
    const [msg, setMsg]                     = useState(null);
    const [edits, setEdits]                 = useState({});
    // Selection — persists across page changes
    const [selected, setSelected]           = useState(new Set());
    const [selectedData, setSelectedData]   = useState({});  // key → { Price, Name }
    // Bulk selection helpers
    const [blanks, setBlanks]               = useState([]);
    const [blankFilter, setBlankFilter]     = useState("");
    const [selectingAll, setSelectingAll]   = useState(false);
    // Sale config
    const [discountType, setDiscountType]   = useState("percent");
    const [discountValue, setDiscountValue] = useState("");
    const [startDate, setStartDate]         = useState("");
    const [endDate, setEndDate]             = useState("");
    const [channels, setChannels]           = useState([]);       // available CE channels
    const [selectedChannels, setSelectedChannels] = useState([]); // [{ id, name }]
    const [applyingSale, setApplyingSale]   = useState(false);

    const fetchProducts = useCallback(async () => {
        setLoading(true); setMsg(null);
        try {
            const res = await axios.get("/api/admin/channelengine/products", { params: { page, pageSize: 50 } });
            const newProducts = res.data.Content ?? [];
            setProducts(newProducts);
            setTotal(res.data.TotalCount ?? 0);
            // Update selectedData for products now visible (keeps data fresh)
            setSelectedData(prev => {
                const updated = { ...prev };
                newProducts.forEach(p => {
                    const k = p.MerchantProductNo ?? p.Id;
                    if (k) updated[k] = { Price: p.Price ?? 0, Name: p.Name ?? k };
                });
                return updated;
            });
        } catch (e) {
            setMsg({ type: "error", text: e.response?.data?.msg ?? e.message });
        } finally { setLoading(false); }
    }, [page]);

    useEffect(() => { fetchProducts(); }, [fetchProducts]);

    // Load blanks and CE channels once
    useEffect(() => {
        axios.get("/api/admin/blanks")
            .then(res => setBlanks((res.data.blanks ?? res.data ?? []).filter(b => b.code)))
            .catch(() => {});
        axios.get("/api/admin/channelengine/channels")
            .then(res => setChannels(res.data.channels ?? []))
            .catch(() => {});
    }, []);

    // Fetch all CE products and add to selection (optionally filtered by blank code)
    const selectAll = async (blankCode = "") => {
        setSelectingAll(true); setMsg(null);
        try {
            const res = await axios.get("/api/admin/channelengine/products/select");
            const all = res.data.products ?? [];
            const toAdd = blankCode
                ? all.filter(p => p.MerchantProductNo?.toUpperCase().includes(blankCode.toUpperCase()))
                : all;
            if (toAdd.length === 0) {
                setMsg({ type: "info", text: blankCode ? `No products found with blank code "${blankCode}" in their SKU.` : "No products found." });
                return;
            }
            setSelected(prev => {
                const next = new Set(prev);
                toAdd.forEach(p => next.add(p.MerchantProductNo));
                return next;
            });
            setSelectedData(prev => {
                const updated = { ...prev };
                toAdd.forEach(p => { updated[p.MerchantProductNo] = { Price: p.Price, Name: p.Name }; });
                return updated;
            });
            setMsg({ type: "success", text: `Selected ${toAdd.length} product${toAdd.length !== 1 ? "s" : ""}${blankCode ? ` matching "${blankCode}"` : ""}.` });
        } catch (e) {
            setMsg({ type: "error", text: e.response?.data?.msg ?? e.message });
        } finally { setSelectingAll(false); }
    };

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

    // Selection — cross-page
    const getKey = (p) => p.MerchantProductNo ?? p.Id ?? "";
    const pageKeys    = products.map(getKey).filter(Boolean);
    const allSelected = pageKeys.length > 0 && pageKeys.every(k => selected.has(k));
    const someSelected = pageKeys.some(k => selected.has(k));

    const toggleAll = () => {
        setSelected(prev => {
            const next = new Set(prev);
            if (allSelected) pageKeys.forEach(k => next.delete(k));
            else {
                pageKeys.forEach(k => next.add(k));
                setSelectedData(d => {
                    const u = { ...d };
                    products.forEach(p => { const k = getKey(p); if (k) u[k] = { Price: p.Price ?? 0, Name: p.Name ?? k }; });
                    return u;
                });
            }
            return next;
        });
    };
    const toggleOne = (p) => {
        const k = getKey(p);
        setSelected(prev => {
            const next = new Set(prev);
            if (next.has(k)) { next.delete(k); }
            else {
                next.add(k);
                setSelectedData(d => ({ ...d, [k]: { Price: p.Price ?? 0, Name: p.Name ?? k } }));
            }
            return next;
        });
    };

    // Sale price calculation
    const calcSalePrice = (originalPrice) => {
        const val = parseFloat(discountValue);
        if (!discountValue || isNaN(val) || val <= 0) return null;
        if (discountType === "percent")  return Math.max(0, originalPrice * (1 - val / 100));
        if (discountType === "fixed")    return Math.max(0, originalPrice - val);
        if (discountType === "absolute") return Math.max(0, val);
        return null;
    };

    // Build sale previews from ALL selected (across pages)
    const salePreviews = Object.entries(selectedData)
        .filter(([k]) => selected.has(k))
        .map(([k, d]) => ({ no: k, orig: d.Price, name: d.Name, sale: calcSalePrice(d.Price) }))
        .filter(x => x.sale !== null && x.sale < x.orig);

    const isScheduled = startDate && new Date(startDate) > new Date();
    const canApply    = salePreviews.length > 0 && !!discountValue;

    const applySale = async () => {
        if (!canApply) { setMsg({ type: "warning", text: "No valid discounted prices to apply. Check your discount settings." }); return; }
        setApplyingSale(true); setMsg(null);
        try {
            const saleProducts = salePreviews.map(x => ({
                merchantProductNo: x.no,
                originalPrice:     parseFloat(x.orig.toFixed(2)),
                salePrice:         parseFloat(x.sale.toFixed(2)),
                name:              x.name,
            }));
            const res = await axios.post("/api/admin/channelengine/sales", {
                products: saleProducts,
                discountType,
                discountValue: parseFloat(discountValue),
                startDate: startDate || null,
                endDate:   endDate   || null,
                channels:  selectedChannels,
            });
            const scheduled = res.data?.activated === false;
            setMsg({
                type: "success",
                text: scheduled
                    ? `Sale scheduled for ${new Date(startDate).toLocaleDateString()} — ${saleProducts.length} product(s).`
                    : `Sale applied to ${saleProducts.length} product(s). Prices live on ChannelEngine now.`,
            });
            setSelected(new Set());
            setSelectedData({});
            setDiscountValue(""); setStartDate(""); setEndDate(""); setSelectedChannels([]);
            fetchProducts();
        } catch (e) {
            setMsg({ type: "error", text: e.response?.data?.msg ?? e.message });
        } finally { setApplyingSale(false); }
    };

    const removeSale = async () => {
        const keys = [...selected].filter(k => selectedData[k]);
        if (!keys.length) return;
        setApplyingSale(true); setMsg(null);
        try {
            const offers = keys.map(k => ({
                MerchantProductNo: k,
                Price: parseFloat((selectedData[k]?.Price ?? 0).toFixed(2)),
                ListPrice: 0,
            }));
            await axios.put("/api/admin/channelengine/products", offers);
            setMsg({ type: "success", text: `Sale removed from ${offers.length} product(s).` });
            setSelected(new Set()); setSelectedData({});
            fetchProducts();
        } catch (e) {
            setMsg({ type: "error", text: e.response?.data?.msg ?? e.message });
        } finally { setApplyingSale(false); }
    };

    const totalPages = Math.ceil(total / 50);
    const today = new Date().toISOString().split("T")[0];

    return (
        <Box>
            <Stack direction="row" alignItems="center" spacing={1.5} mb={2} flexWrap="wrap" gap={1}>
                <Button size="small" variant="outlined"
                    startIcon={loading ? <CircularProgress size={12} /> : <SyncIcon sx={{ fontSize: 14 }} />}
                    onClick={fetchProducts} disabled={loading}>Refresh</Button>

                {/* Select All Pages */}
                <Button size="small" variant="outlined" color="primary"
                    disabled={selectingAll}
                    startIcon={selectingAll ? <CircularProgress size={12} /> : null}
                    onClick={() => { setBlankFilter(""); selectAll(""); }}>
                    Select All
                </Button>

                {/* Select by Blank */}
                <Select
                    size="small"
                    value={blankFilter}
                    displayEmpty
                    onChange={e => {
                        const code = e.target.value;
                        setBlankFilter(code);
                        if (code) selectAll(code);
                    }}
                    disabled={selectingAll || blanks.length === 0}
                    sx={{ minWidth: 200 }}
                    renderValue={v => v
                        ? blanks.find(b => b.code === v)?.name ?? v
                        : <Typography variant="body2" color="text.disabled" sx={{ fontSize: "0.82rem" }}>Select by Blank…</Typography>
                    }
                >
                    {blanks.map(b => (
                        <MenuItem key={b._id ?? b.code} value={b.code}>
                            <Stack direction="row" alignItems="center" spacing={1}>
                                <Typography variant="body2" fontFamily="monospace" fontSize="0.78rem"
                                    sx={{ bgcolor: "#f3f4f6", px: 0.75, py: 0.25, borderRadius: 0.5, color: "#374151" }}>
                                    {b.code}
                                </Typography>
                                <Typography variant="body2">{b.name}</Typography>
                            </Stack>
                        </MenuItem>
                    ))}
                </Select>

                {!loading && <Chip label={`${total} products`} size="small" sx={{ bgcolor: "#f3f4f6", color: "#374151" }} />}
                {selected.size > 0 && (
                    <Chip
                        label={`${selected.size} selected`}
                        size="small"
                        onDelete={() => { setSelected(new Set()); setSelectedData({}); setBlankFilter(""); }}
                        sx={{ bgcolor: "#dbeafe", color: "#1e40af", fontWeight: 600 }}
                    />
                )}
            </Stack>

            {/* Sale action bar */}
            {selected.size > 0 && (
                <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: "#eff6ff", borderColor: "#93c5fd", borderRadius: 1.5 }}>
                    <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap" gap={1}>
                        <LocalOfferIcon sx={{ color: "#1e40af", fontSize: 18 }} />
                        <Typography variant="body2" fontWeight={700} color="#1e40af" sx={{ mr: 0.5 }}>
                            Sale — {selected.size} product{selected.size > 1 ? "s" : ""}
                        </Typography>

                        <Select size="small" value={discountType} onChange={e => setDiscountType(e.target.value)}
                            sx={{ minWidth: 150, bgcolor: "#fff" }}>
                            <MenuItem value="percent">% Off</MenuItem>
                            <MenuItem value="fixed">Fixed Amount Off</MenuItem>
                            <MenuItem value="absolute">Set Sale Price</MenuItem>
                        </Select>

                        <TextField size="small" type="number"
                            placeholder={discountType === "percent" ? "e.g. 20" : "e.g. 5.00"}
                            value={discountValue} onChange={e => setDiscountValue(e.target.value)}
                            sx={{ width: 120, bgcolor: "#fff" }}
                            InputProps={{
                                startAdornment: discountType !== "percent" ? <InputAdornment position="start">$</InputAdornment> : null,
                                endAdornment:   discountType === "percent"  ? <InputAdornment position="end">%</InputAdornment>  : null,
                            }}
                        />

                        <TextField size="small" type="date" label="Start date" value={startDate}
                            onChange={e => setStartDate(e.target.value)}
                            inputProps={{ min: today }}
                            InputLabelProps={{ shrink: true }}
                            sx={{ width: 155, bgcolor: "#fff" }} />

                        <TextField size="small" type="date" label="End date" value={endDate}
                            onChange={e => setEndDate(e.target.value)}
                            inputProps={{ min: startDate || today }}
                            InputLabelProps={{ shrink: true }}
                            sx={{ width: 155, bgcolor: "#fff" }} />

                        {channels.length > 0 && (
                            <Select
                                multiple
                                size="small"
                                value={selectedChannels.map(c => c.id)}
                                onChange={e => {
                                    const ids = e.target.value;
                                    setSelectedChannels(channels.filter(c => ids.includes(c.id)));
                                }}
                                displayEmpty
                                renderValue={val => val.length === 0
                                    ? <Typography variant="body2" color="text.disabled" sx={{ fontSize: "0.82rem" }}>All channels</Typography>
                                    : <Typography variant="body2" sx={{ fontSize: "0.82rem" }}>{val.length} channel{val.length > 1 ? "s" : ""}</Typography>
                                }
                                sx={{ minWidth: 150, bgcolor: "#fff" }}
                            >
                                {channels.map(c => (
                                    <MenuItem key={c.id} value={c.id}>
                                        <Checkbox size="small" checked={selectedChannels.some(s => s.id === c.id)} sx={{ p: 0, mr: 1 }} />
                                        <Typography variant="body2">{c.name}</Typography>
                                    </MenuItem>
                                ))}
                            </Select>
                        )}

                        <Button variant="contained" size="small"
                            disabled={!canApply || applyingSale}
                            startIcon={applyingSale ? <CircularProgress size={12} color="inherit" /> : <LocalOfferIcon sx={{ fontSize: 14 }} />}
                            onClick={applySale}
                            sx={{ bgcolor: isScheduled ? "#7c3aed" : "#f59e0b", "&:hover": { bgcolor: isScheduled ? "#6d28d9" : "#d97706" }, color: "#fff" }}>
                            {isScheduled ? "Schedule Sale" : "Apply Sale"}
                        </Button>

                        <Button variant="outlined" size="small" color="error" disabled={applyingSale}
                            startIcon={<RemoveCircleOutlineIcon sx={{ fontSize: 14 }} />}
                            onClick={removeSale}>
                            Remove Sale
                        </Button>

                        <Button size="small" variant="text" onClick={() => { setSelected(new Set()); setSelectedData({}); }} sx={{ color: "#6b7280" }}>
                            Clear
                        </Button>
                    </Stack>

                    {/* Price preview */}
                    {salePreviews.length > 0 && (
                        <Box sx={{ mt: 1.5, pt: 1.5, borderTop: "1px solid #bfdbfe" }}>
                            <Typography variant="caption" fontWeight={600} color="#1e40af">
                                Preview ({salePreviews.length} product{salePreviews.length > 1 ? "s" : ""}
                                {isScheduled && startDate ? ` · starts ${new Date(startDate).toLocaleDateString()}` : ""}
                                {endDate ? ` · ends ${new Date(endDate).toLocaleDateString()}` : ""}
                                {selectedChannels.length > 0 ? ` · channels: ${selectedChannels.map(c => c.name).join(", ")}` : " · all channels"}):
                            </Typography>
                            <Stack direction="row" flexWrap="wrap" mt={0.5} gap={0.5}>
                                {salePreviews.slice(0, 6).map(x => (
                                    <Chip key={x.no} size="small"
                                        label={`${x.no}: $${x.orig.toFixed(2)} → $${x.sale.toFixed(2)}`}
                                        sx={{ bgcolor: "#fef3c7", color: "#92400e", fontFamily: "monospace", fontSize: "0.7rem" }} />
                                ))}
                                {salePreviews.length > 6 && (
                                    <Chip size="small" label={`+${salePreviews.length - 6} more`} sx={{ bgcolor: "#f3f4f6", color: "#6b7280" }} />
                                )}
                            </Stack>
                        </Box>
                    )}
                </Paper>
            )}

            {msg && <Alert severity={msg.type} onClose={() => setMsg(null)} sx={{ mb: 2 }}>{msg.text}</Alert>}

            {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>
            ) : (
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1.5 }}>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: "#f8fafc" }}>
                                <TableCell padding="checkbox">
                                    <Checkbox size="small" indeterminate={someSelected && !allSelected}
                                        checked={allSelected} onChange={toggleAll} />
                                </TableCell>
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
                                    <TableCell colSpan={7} sx={{ textAlign: "center", py: 6, color: "text.secondary" }}>No products found</TableCell>
                                </TableRow>
                            ) : products.map(p => {
                                const no         = getKey(p);
                                const edit       = edits[no] ?? {};
                                const dirty      = Object.keys(edit).length > 0;
                                const isSelected = selected.has(no);
                                const preview    = isSelected ? calcSalePrice(p.Price ?? 0) : null;
                                return (
                                    <TableRow key={no} hover selected={isSelected}
                                        sx={isSelected ? { bgcolor: "#eff6ff !important" } : {}}>
                                        <TableCell padding="checkbox">
                                            <Checkbox size="small" checked={isSelected} onChange={() => toggleOne(p)} />
                                        </TableCell>
                                        <TableCell><Typography variant="body2" fontFamily="monospace" fontSize="0.75rem">{no}</Typography></TableCell>
                                        <TableCell><Typography variant="body2" noWrap sx={{ maxWidth: 240 }}>{p.Name ?? no}</Typography></TableCell>
                                        <TableCell sx={{ textAlign: "right" }}>
                                            <Stack alignItems="flex-end" spacing={0.25}>
                                                <TextField size="small" type="number" inputProps={{ step: "0.01", style: { textAlign: "right" } }}
                                                    defaultValue={p.Price ?? ""} onChange={e => setEdit(no, "price", e.target.value)}
                                                    sx={{ width: 90 }} />
                                                {preview !== null && preview < (p.Price ?? 0) && (
                                                    <Typography variant="caption" sx={{ color: "#f59e0b", fontWeight: 600 }}>
                                                        → ${preview.toFixed(2)}
                                                    </Typography>
                                                )}
                                            </Stack>
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

// ── Sales tab ─────────────────────────────────────────────────────────────────
const SALE_STATUS_PALETTE = {
    scheduled: { bg: "#ede9fe", color: "#5b21b6" },
    active:    { bg: "#d1fae5", color: "#065f46" },
    ended:     { bg: "#f3f4f6", color: "#6b7280" },
    cancelled: { bg: "#fee2e2", color: "#991b1b" },
};

function SalesTab() {
    const [sales, setSales]       = useState([]);
    const [total, setTotal]       = useState(0);
    const [page, setPage]         = useState(1);
    const [statusFilter, setStatusFilter] = useState("");
    const [loading, setLoading]   = useState(false);
    const [cancelling, setCancelling] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [msg, setMsg]           = useState(null);
    const [expanded, setExpanded] = useState(null);

    const fetchSales = useCallback(async () => {
        setLoading(true); setMsg(null);
        try {
            const res = await axios.get("/api/admin/channelengine/sales", { params: { status: statusFilter, page, pageSize: 20 } });
            setSales(res.data.sales ?? []);
            setTotal(res.data.total ?? 0);
        } catch (e) {
            setMsg({ type: "error", text: e.response?.data?.msg ?? e.message });
        } finally { setLoading(false); }
    }, [statusFilter, page]);

    useEffect(() => { fetchSales(); }, [fetchSales]);

    const cancelSale = async (id) => {
        setCancelling(id); setMsg(null);
        try {
            await axios.delete(`/api/admin/channelengine/sales/${id}`);
            setMsg({ type: "success", text: "Sale cancelled and prices restored." });
            fetchSales();
        } catch (e) {
            setMsg({ type: "error", text: e.response?.data?.msg ?? e.message });
        } finally { setCancelling(null); }
    };

    const processSales = async () => {
        setProcessing(true); setMsg(null);
        try {
            const res = await axios.post("/api/admin/channelengine/sales/process");
            setMsg({ type: "success", text: `Processed: ${res.data.activated} activated, ${res.data.ended} ended.` });
            fetchSales();
        } catch (e) {
            setMsg({ type: "error", text: e.response?.data?.msg ?? e.message });
        } finally { setProcessing(false); }
    };

    const totalPages = Math.ceil(total / 20);

    return (
        <Box>
            <Stack direction="row" alignItems="center" spacing={2} mb={2} flexWrap="wrap">
                <Select size="small" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                    sx={{ minWidth: 140 }}>
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="scheduled">Scheduled</MenuItem>
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="ended">Ended</MenuItem>
                    <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
                <Button size="small" variant="outlined"
                    startIcon={loading ? <CircularProgress size={12} /> : <SyncIcon sx={{ fontSize: 14 }} />}
                    onClick={fetchSales} disabled={loading}>Refresh</Button>
                <Tooltip title="Check for scheduled sales to activate or active sales to end based on their dates">
                    <Button size="small" variant="outlined" color="secondary"
                        startIcon={processing ? <CircularProgress size={12} /> : <SyncIcon sx={{ fontSize: 14 }} />}
                        onClick={processSales} disabled={processing}>
                        Process Due Sales
                    </Button>
                </Tooltip>
                {!loading && <Chip label={`${total} sale${total !== 1 ? "s" : ""}`} size="small" sx={{ bgcolor: "#f3f4f6", color: "#374151" }} />}
            </Stack>

            {msg && <Alert severity={msg.type} onClose={() => setMsg(null)} sx={{ mb: 2 }}>{msg.text}</Alert>}

            {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>
            ) : sales.length === 0 ? (
                <Paper variant="outlined" sx={{ py: 8, textAlign: "center", borderRadius: 1.5 }}>
                    <Typography color="text.secondary">No sales found. Create one from the Products tab.</Typography>
                </Paper>
            ) : (
                <Stack spacing={1.5}>
                    {sales.map(sale => {
                        const pal = SALE_STATUS_PALETTE[sale.status] ?? SALE_STATUS_PALETTE.ended;
                        const isOpen = expanded === sale._id;
                        return (
                            <Paper key={sale._id} variant="outlined" sx={{ borderRadius: 1.5, overflow: "hidden" }}>
                                <Box sx={{ p: 2 }}>
                                    <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
                                        <Stack direction="row" alignItems="center" spacing={1.5}>
                                            <Chip label={sale.status} size="small"
                                                sx={{ bgcolor: pal.bg, color: pal.color, fontWeight: 700, textTransform: "capitalize" }} />
                                            <Box>
                                                <Typography variant="body2" fontWeight={700}>
                                                    {sale.discountType === "percent"
                                                        ? `${sale.discountValue}% off`
                                                        : sale.discountType === "fixed"
                                                            ? `$${sale.discountValue} off`
                                                            : `Set to $${sale.discountValue}`}
                                                    {" · "}{sale.products?.length ?? 0} product{(sale.products?.length ?? 0) !== 1 ? "s" : ""}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {sale.startDate ? `Starts: ${new Date(sale.startDate).toLocaleDateString()}` : "No start date"}
                                                    {sale.endDate   ? ` · Ends: ${new Date(sale.endDate).toLocaleDateString()}`   : " · No end date"}
                                                    {" · Created: "}{new Date(sale.createdAt).toLocaleDateString()}
                                                    {sale.channels?.length > 0
                                                        ? ` · Channels: ${sale.channels.map(c => c.name).join(", ")}`
                                                        : " · All channels"}
                                                </Typography>
                                            </Box>
                                        </Stack>
                                        <Stack direction="row" spacing={1}>
                                            <Button size="small" variant="text" sx={{ color: "#6b7280", fontSize: "0.75rem" }}
                                                onClick={() => setExpanded(isOpen ? null : sale._id)}>
                                                {isOpen ? "Hide" : "Details"}
                                            </Button>
                                            {(sale.status === "scheduled" || sale.status === "active") && (
                                                <Button size="small" variant="outlined" color="error"
                                                    disabled={cancelling === sale._id}
                                                    startIcon={cancelling === sale._id ? <CircularProgress size={12} /> : <RemoveCircleOutlineIcon sx={{ fontSize: 13 }} />}
                                                    onClick={() => cancelSale(sale._id)}>
                                                    Cancel
                                                </Button>
                                            )}
                                        </Stack>
                                    </Stack>
                                </Box>

                                {isOpen && (
                                    <Box sx={{ borderTop: "1px solid #e5e7eb", bgcolor: "#f8fafc", px: 2, py: 1.5 }}>
                                        <TableContainer>
                                            <Table size="small">
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell sx={{ fontWeight: 600, fontSize: "0.72rem" }}>Merchant Product #</TableCell>
                                                        <TableCell sx={{ fontWeight: 600, fontSize: "0.72rem" }}>Name</TableCell>
                                                        <TableCell sx={{ fontWeight: 600, fontSize: "0.72rem", textAlign: "right" }}>Original</TableCell>
                                                        <TableCell sx={{ fontWeight: 600, fontSize: "0.72rem", textAlign: "right" }}>Sale Price</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {(sale.products ?? []).map(p => (
                                                        <TableRow key={p.merchantProductNo}>
                                                            <TableCell><Typography variant="caption" fontFamily="monospace">{p.merchantProductNo}</Typography></TableCell>
                                                            <TableCell><Typography variant="caption" noWrap sx={{ maxWidth: 200 }}>{p.name ?? "—"}</Typography></TableCell>
                                                            <TableCell sx={{ textAlign: "right" }}><Typography variant="caption">${p.originalPrice?.toFixed(2) ?? "—"}</Typography></TableCell>
                                                            <TableCell sx={{ textAlign: "right" }}>
                                                                <Typography variant="caption" fontWeight={700} sx={{ color: "#f59e0b" }}>
                                                                    ${p.salePrice?.toFixed(2) ?? "—"}
                                                                </Typography>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    </Box>
                                )}
                            </Paper>
                        );
                    })}
                </Stack>
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

// ── Offerings tab ─────────────────────────────────────────────────────────────
function OfferingsTab() {
    const [q, setQ]             = useState("");
    const [products, setProducts] = useState([]);
    const [total, setTotal]     = useState(0);
    const [page, setPage]       = useState(1);
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState({});
    const [msg, setMsg]         = useState(null);
    const searchRef             = useRef();

    const search = useCallback(async (query = q, pg = page) => {
        setLoading(true); setMsg(null);
        try {
            const res = await axios.get("/api/admin/channelengine/offerings", { params: { q: query, page: pg, pageSize: 20 } });
            setProducts(res.data.products ?? []);
            setTotal(res.data.total ?? 0);
        } catch (e) {
            setMsg({ type: "error", text: e.response?.data?.msg ?? e.message });
        } finally { setLoading(false); }
    }, [q, page]);

    useEffect(() => { search(); }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1);
        search(q, 1);
    };

    const sendProduct = async (product) => {
        setSending(prev => ({ ...prev, [product._id]: true }));
        setMsg(null);
        try {
            const res = await axios.get(`/api/admin/products?products=${product._id}`);
            const fullProduct = res.data?.products?.[0] ?? res.data?.[0];
            if (!fullProduct) throw new Error("Product not found");

            await axios.post("/api/admin/channelengine/products/send", { product: fullProduct });
            setMsg({ type: "success", text: `Sent "${product.title}" to ChannelEngine.` });
            setProducts(prev => prev.map(p => p._id.toString() === product._id.toString()
                ? { ...p, sentToCE: true }
                : p
            ));
        } catch (e) {
            setMsg({ type: "error", text: e.response?.data?.msg ?? e.message });
        } finally {
            setSending(prev => { const n = { ...prev }; delete n[product._id]; return n; });
        }
    };

    const totalPages = Math.ceil(total / 20);

    return (
        <Box>
            <Stack direction="row" alignItems="center" spacing={1} mb={2} component="form" onSubmit={handleSearch}>
                <TextField
                    size="small"
                    placeholder="Search designs by name or SKU…"
                    value={q}
                    onChange={e => setQ(e.target.value)}
                    inputRef={searchRef}
                    sx={{ width: 320 }}
                    InputProps={{
                        startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 16, color: "text.secondary" }} /></InputAdornment>,
                    }}
                />
                <Button type="submit" variant="contained" size="small" disabled={loading}
                    sx={{ bgcolor: "#0078d7", "&:hover": { bgcolor: "#005fa3" } }}>
                    Search
                </Button>
                <Button size="small" variant="outlined"
                    startIcon={loading ? <CircularProgress size={12} /> : <SyncIcon sx={{ fontSize: 14 }} />}
                    onClick={() => search(q, page)} disabled={loading}>Refresh</Button>
                {!loading && total > 0 && <Chip label={`${total} design(s) found`} size="small" sx={{ bgcolor: "#f3f4f6", color: "#374151" }} />}
            </Stack>

            {msg && <Alert severity={msg.type} onClose={() => setMsg(null)} sx={{ mb: 2 }}>{msg.text}</Alert>}

            {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>
            ) : products.length === 0 ? (
                <Paper variant="outlined" sx={{ py: 8, textAlign: "center", borderRadius: 1.5 }}>
                    <Typography color="text.secondary">
                        {q ? "No products matched your search." : "Search your product catalog to create ChannelEngine offerings."}
                    </Typography>
                </Paper>
            ) : (
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1.5 }}>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: "#f8fafc" }}>
                                <TableCell sx={{ fontWeight: 700, width: 48 }} />
                                <TableCell sx={{ fontWeight: 700 }}>Product</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Design SKU</TableCell>
                                <TableCell sx={{ fontWeight: 700, textAlign: "center" }}>Variants</TableCell>
                                <TableCell sx={{ fontWeight: 700, textAlign: "right" }}>Price Range</TableCell>
                                <TableCell sx={{ fontWeight: 700, textAlign: "center" }}>CE Status</TableCell>
                                <TableCell />
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {products.map(p => (
                                <TableRow key={p._id} hover>
                                    <TableCell>
                                        {p.mainImage ? (
                                            <Avatar
                                                src={p.mainImage.replace("images1.", "images2.")}
                                                variant="rounded"
                                                sx={{ width: 36, height: 36, bgcolor: "#f3f4f6" }}
                                            />
                                        ) : (
                                            <Avatar variant="rounded" sx={{ width: 36, height: 36, bgcolor: "#e5e7eb", fontSize: 10, color: "#6b7280" }}>
                                                IMG
                                            </Avatar>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: 220 }}>{p.title}</Typography>
                                        {p.sku && <Typography variant="caption" color="text.secondary" fontFamily="monospace">{p.sku}</Typography>}
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="caption" fontFamily="monospace" color="text.secondary">{p.designSku ?? "—"}</Typography>
                                    </TableCell>
                                    <TableCell sx={{ textAlign: "center" }}>
                                        <Chip label={p.variantCount} size="small" sx={{ bgcolor: "#f3f4f6", color: "#374151", fontWeight: 600, minWidth: 32 }} />
                                    </TableCell>
                                    <TableCell sx={{ textAlign: "right" }}>
                                        <Typography variant="body2">
                                            {p.minPrice > 0
                                                ? p.minPrice === p.maxPrice
                                                    ? `$${p.minPrice.toFixed(2)}`
                                                    : `$${p.minPrice.toFixed(2)} – $${p.maxPrice.toFixed(2)}`
                                                : <Typography component="span" variant="caption" color="text.disabled">—</Typography>
                                            }
                                        </Typography>
                                    </TableCell>
                                    <TableCell sx={{ textAlign: "center" }}>
                                        {p.sentToCE
                                            ? <Chip label="Sent" size="small" sx={{ bgcolor: "#d1fae5", color: "#065f46", fontWeight: 600 }} icon={<CheckCircleOutlineIcon sx={{ fontSize: 12 }} />} />
                                            : <Chip label="Not sent" size="small" sx={{ bgcolor: "#f3f4f6", color: "#6b7280" }} />
                                        }
                                    </TableCell>
                                    <TableCell sx={{ textAlign: "right" }}>
                                        <Button
                                            size="small"
                                            variant={p.sentToCE ? "outlined" : "contained"}
                                            color={p.sentToCE ? "success" : "primary"}
                                            disabled={!!sending[p._id]}
                                            startIcon={sending[p._id] ? <CircularProgress size={12} color="inherit" /> : <SendIcon sx={{ fontSize: 13 }} />}
                                            onClick={() => sendProduct(p)}
                                            sx={p.sentToCE ? {} : { bgcolor: "#0078d7", "&:hover": { bgcolor: "#005fa3" } }}
                                        >
                                            {p.sentToCE ? "Resend" : "Send"}
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
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

// ── Main dashboard ────────────────────────────────────────────────────────────
const TABS = ["Orders", "Products", "Shipments", "Returns", "Sales", "Offerings"];

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
                        {tab === 4 && <SalesTab />}
                        {tab === 5 && <OfferingsTab />}
                    </Box>
                </Paper>
            </Box>
        </Box>
    );
}

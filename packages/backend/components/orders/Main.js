"use client";
import {
    Typography, Box, Grid2, TextField, Pagination, Container, Stack,
    Chip, Card, Collapse, Divider, InputAdornment, IconButton, Tooltip,
    Button, Dialog, DialogTitle, DialogContent, DialogActions,
    Alert, CircularProgress, MenuItem, Select, FormControl, InputLabel,
    Checkbox, FormControlLabel,
} from "@mui/material";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import SearchIcon from "@mui/icons-material/Search";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import PaidIcon from "@mui/icons-material/Paid";
import axios from "axios";
import { RetryImage } from "../reusable/RetryImage";
import { CustomOrderBuilder } from "./CustomOrderBuilder";

// ─── Create Order Modal ────────────────────────────────────────────────────────
const COUNTRIES = ["US", "CA"];

const REGIONS = {
    US: [
        ["AL","Alabama"],["AK","Alaska"],["AZ","Arizona"],["AR","Arkansas"],["CA","California"],
        ["CO","Colorado"],["CT","Connecticut"],["DE","Delaware"],["FL","Florida"],["GA","Georgia"],
        ["HI","Hawaii"],["ID","Idaho"],["IL","Illinois"],["IN","Indiana"],["IA","Iowa"],
        ["KS","Kansas"],["KY","Kentucky"],["LA","Louisiana"],["ME","Maine"],["MD","Maryland"],
        ["MA","Massachusetts"],["MI","Michigan"],["MN","Minnesota"],["MS","Mississippi"],["MO","Missouri"],
        ["MT","Montana"],["NE","Nebraska"],["NV","Nevada"],["NH","New Hampshire"],["NJ","New Jersey"],
        ["NM","New Mexico"],["NY","New York"],["NC","North Carolina"],["ND","North Dakota"],["OH","Ohio"],
        ["OK","Oklahoma"],["OR","Oregon"],["PA","Pennsylvania"],["RI","Rhode Island"],["SC","South Carolina"],
        ["SD","South Dakota"],["TN","Tennessee"],["TX","Texas"],["UT","Utah"],["VT","Vermont"],
        ["VA","Virginia"],["WA","Washington"],["WV","West Virginia"],["WI","Wisconsin"],["WY","Wyoming"],
        ["DC","District of Columbia"],["PR","Puerto Rico"],["VI","Virgin Islands"],["GU","Guam"],["AS","American Samoa"],
    ],
    CA: [
        ["AB","Alberta"],["BC","British Columbia"],["MB","Manitoba"],["NB","New Brunswick"],
        ["NL","Newfoundland and Labrador"],["NS","Nova Scotia"],["NT","Northwest Territories"],
        ["NU","Nunavut"],["ON","Ontario"],["PE","Prince Edward Island"],["QC","Quebec"],
        ["SK","Saskatchewan"],["YT","Yukon"],
    ],
};

function CreateOrderModal({ open, onClose, onCreated }) {
    // ── SKU lookup state ────────────────────────────────────────────────────────
    const [sku, setSku]             = useState("");
    const [looking, setLooking]     = useState(false);
    const [product, setProduct]     = useState(null);
    const [lookupErr, setLookupErr] = useState("");
    const [selColor, setSelColor]   = useState(null);
    const [selSizeId, setSelSizeId] = useState(null); // blank size _id string
    const [qty, setQty]             = useState(1);

    // ── Items cart ──────────────────────────────────────────────────────────────
    const [cartItems, setCartItems] = useState([]);

    // ── Order info ──────────────────────────────────────────────────────────────
    const [po, setPo]               = useState("");
    const [email, setEmail]         = useState("");
    const [payment, setPayment]     = useState("invoice"); // "invoice" → email a pay link · "paid" → already collected
    const [addr, setAddr]           = useState({ name: "", phone: "", address1: "", address2: "", city: "", state: "", zip: "", country: "US" });
    const [inStorePickup, setInStorePickup] = useState(false);
    const [saving, setSaving]       = useState(false);
    const [saveErr, setSaveErr]     = useState("");

    const resetLookup = () => { setSku(""); setProduct(null); setLookupErr(""); setSelColor(null); setSelSizeId(null); setQty(1); };
    const handleClose = () => { resetLookup(); setCartItems([]); setPo(""); setEmail(""); setPayment("invoice"); setAddr({ name: "", phone: "", address1: "", address2: "", city: "", state: "", zip: "", country: "US" }); setInStorePickup(false); setSaving(false); setSaveErr(""); onClose(); };

    // ── Lookup ──────────────────────────────────────────────────────────────────
    const lookupSku = useCallback(async () => {
        const s = sku.trim();
        if (!s) return;
        setLooking(true); setLookupErr(""); setProduct(null); setSelColor(null); setSelSizeId(null);
        try {
            const res = await axios.get(`/api/orders/lookup-product?sku=${encodeURIComponent(s)}`);
            const p = res.data;
            setProduct(p);
            // Pre-select from matched variant
            const sel = p.selectedVariant;
            const preColor = p.colors.find(c => c._id === sel.colorId) ?? p.colors[0] ?? null;
            setSelColor(preColor);
            setSelSizeId(sel.sizeId ?? null);
        } catch (e) {
            setLookupErr(e.response?.data?.error ?? "Product not found");
        } finally { setLooking(false); }
    }, [sku]);

    // ── Derived selection ───────────────────────────────────────────────────────
    // Sizes available for the selected color (only valid combos)
    const availableSizes = product && selColor
        ? product.variants
            .filter(v => v.colorId === selColor._id && v.sizeId && v.sizeName)
            .map(v => ({ sizeId: v.sizeId, sizeName: v.sizeName }))
            .filter((s, i, a) => a.findIndex(x => x.sizeId === s.sizeId) === i)
        : [];

    const selectedVariant = product?.variants?.find(
        v => v.colorId === selColor?._id && v.sizeId === selSizeId
    ) ?? null;

    // Image: prefer variant image, fall back to productImages keyed by colorId
    const activeImage = selectedVariant?.image
        ?? (selColor ? product?.productImagesByColor?.[selColor._id] : null)
        ?? null;

    // ── Add item to cart ────────────────────────────────────────────────────────
    const addItem = () => {
        if (!selectedVariant) return;
        const sizeName = availableSizes.find(s => s.sizeId === selSizeId)?.sizeName ?? "";
        setCartItems(prev => [...prev, {
            id:           Date.now(),
            sku:          selectedVariant.sku,
            title:        product.title,
            colorId:      selColor._id,
            colorName:    selColor.name,
            colorHex:     selColor.hexcode ?? null,
            sizeId:       selSizeId,
            sizeName,
            blankId:      product.blank?._id ?? null,
            styleCode:    product.blank?.code ?? "",
            designId:     product.designId ?? null,
            designImages: product.design?.images ?? null,
            printType:    product.design?.printType ?? null,
            price:        selectedVariant.price ?? 0,
            image:        activeImage,
            qty:          Math.max(1, qty),
        }]);
        resetLookup();
    };

    const removeItem   = (id) => setCartItems(prev => prev.filter(i => i.id !== id));
    const changeQty    = (id, delta) => setCartItems(prev => prev.map(i =>
        i.id === id ? { ...i, qty: Math.max(1, (i.qty ?? 1) + delta) } : i
    ));
    const changePrice  = (id, val) => setCartItems(prev => prev.map(i =>
        i.id === id ? { ...i, price: val } : i
    ));

    const addrChange = (field) => (e) => setAddr(p => ({ ...p, [field]: e.target.value }));

    const subtotal = cartItems.reduce((s, i) => s + (Number(i.price) || 0) * (i.qty ?? 1), 0);

    // ── Submit ──────────────────────────────────────────────────────────────────
    const submit = async () => {
        if (cartItems.length === 0) { setSaveErr("Add at least one item"); return; }
        if (!po.trim()) { setSaveErr("PO / order number is required"); return; }
        if (payment === "invoice" && !email.trim()) { setSaveErr("A customer email is required to send an invoice"); return; }
        if (!inStorePickup && (!addr.name || !addr.address1 || !addr.city || !addr.country)) {
            setSaveErr("Name, address, city, and country are required"); return;
        }
        if (inStorePickup && !addr.name) { setSaveErr("Customer name is required for pickup"); return; }
        setSaving(true); setSaveErr("");
        try {
            const res = await axios.post("/api/orders/create", {
                items:           cartItems,
                poNumber:        po.trim(),
                shippingAddress: addr,
                inStorePickup,
                customerEmail:   email.trim(),
                paid:            payment === "paid",
            });
            const newId = res.data.orderId;
            // Invoice path: email the payable pay link right away (best-effort — if payouts aren't
            // set up yet it fails softly and the rep can resend from the order page).
            if (payment === "invoice" && email.trim()) {
                try {
                    await axios.post("/api/admin/custom-order/invoice/pay", { orderId: newId, email: email.trim() });
                } catch (e) {
                    setSaveErr(`Order created, but the invoice didn't send: ${e.response?.data?.error ?? "error"}. Send it from the order page.`);
                    setTimeout(() => { onCreated?.(newId); handleClose(); }, 2800);
                    return;
                }
            }
            onCreated?.(newId);
            handleClose();
        } catch (e) {
            setSaveErr(e.response?.data?.error ?? "Failed to create order");
            setSaving(false);
        }
    };

    const fs = { size: "small" };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth
            PaperProps={{ sx: { borderRadius: 2 } }}>
            <DialogTitle sx={{ fontWeight: 700, display: "flex", justifyContent: "space-between", alignItems: "center", pb: 1 }}>
                New Order
                <IconButton size="small" onClick={handleClose}><CloseIcon fontSize="small" /></IconButton>
            </DialogTitle>

            <DialogContent dividers sx={{ pt: 2 }}>
                <Stack spacing={3}>

                    {/* ── SKU lookup ── */}
                    <Box>
                        <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 0.5, display: "block", mb: 0.75 }}>
                            Add Item
                        </Typography>
                        <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                            <TextField
                                {...fs} fullWidth label="SKU" placeholder="e.g. PC54_RED_L_SUNFLOWER"
                                value={sku}
                                onChange={e => { setSku(e.target.value); setProduct(null); setLookupErr(""); }}
                                onKeyDown={e => e.key === "Enter" && lookupSku()}
                            />
                            <Button
                                variant="outlined" size="small" onClick={lookupSku}
                                disabled={!sku.trim() || looking}
                                sx={{ minWidth: 80, flexShrink: 0 }}
                                startIcon={looking ? <CircularProgress size={14} color="inherit" /> : <SearchIcon sx={{ fontSize: 16 }} />}
                            >
                                Look up
                            </Button>
                        </Stack>
                        {lookupErr && <Alert severity="error" sx={{ mb: 1 }}>{lookupErr}</Alert>}

                        {/* Product card */}
                        {product && (
                            <Box sx={{ display: "flex", gap: 2, p: 1.5, bgcolor: "#f8fafc", borderRadius: 1.5, border: "1px solid #e2e8f0" }}>
                                {/* Image */}
                                <Box sx={{
                                    width: 96, height: 96, flexShrink: 0, borderRadius: 1,
                                    bgcolor: "#e5e7eb", overflow: "hidden",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                }}>
                                    {activeImage
                                        ? <RetryImage src={activeImage} alt={product.title} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                                        : <Box sx={{ width: "100%", height: "100%", bgcolor: "#e5e7eb" }} />
                                    }
                                </Box>

                                {/* Controls */}
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography variant="body2" fontWeight={700} sx={{ mb: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                        {product.title}
                                    </Typography>

                                    {/* Color row: swatches left, qty right */}
                                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
                                        {product.colors.length > 0 ? (
                                            <Box>
                                                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.4 }}>Color</Typography>
                                                <Stack direction="row" flexWrap="wrap" gap={0.6}>
                                                    {product.colors.map(c => (
                                                        <Tooltip key={c._id} title={c.name}>
                                                            <Box
                                                                onClick={() => { setSelColor(c); setSelSizeId(null); }}
                                                                sx={{
                                                                    width: 22, height: 22, borderRadius: "50%", cursor: "pointer", flexShrink: 0,
                                                                    bgcolor: c.hexcode ? `#${c.hexcode.replace(/^#/, "")}` : "#aaa",
                                                                    border: selColor?._id === c._id ? "3px solid #3b82f6" : "2px solid #d1d5db",
                                                                    boxShadow: selColor?._id === c._id ? "0 0 0 1px #fff inset" : "none",
                                                                }}
                                                            />
                                                        </Tooltip>
                                                    ))}
                                                </Stack>
                                                {selColor && <Typography variant="caption" color="text.secondary">{selColor.name}</Typography>}
                                            </Box>
                                        ) : <Box />}
                                        <Box sx={{ width: 116, display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                                            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.4 }}>Qty</Typography>
                                            <Stack direction="row" alignItems="center" spacing={0.5}>
                                                <IconButton size="small" disabled={qty <= 1} onClick={() => setQty(q => Math.max(1, q - 1))}
                                                    sx={{ width: 24, height: 24, border: "1px solid #e2e8f0", borderRadius: 0.75 }}>
                                                    <Typography variant="caption" sx={{ lineHeight: 1, fontWeight: 700 }}>−</Typography>
                                                </IconButton>
                                                <Typography variant="body2" sx={{ fontWeight: 700, minWidth: 22, textAlign: "center" }}>{qty}</Typography>
                                                <IconButton size="small" onClick={() => setQty(q => Math.min(99, q + 1))}
                                                    sx={{ width: 24, height: 24, border: "1px solid #e2e8f0", borderRadius: 0.75 }}>
                                                    <Typography variant="caption" sx={{ lineHeight: 1, fontWeight: 700 }}>+</Typography>
                                                </IconButton>
                                            </Stack>
                                        </Box>
                                    </Stack>

                                    {/* Size chips */}
                                    {availableSizes.length > 0 && (
                                        <Box sx={{ mb: 1 }}>
                                            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.4 }}>Size</Typography>
                                            <Stack direction="row" flexWrap="wrap" gap={0.5}>
                                                {availableSizes.map(s => (
                                                    <Chip
                                                        key={s.sizeId} label={s.sizeName} size="small"
                                                        onClick={() => setSelSizeId(s.sizeId)}
                                                        variant={selSizeId === s.sizeId ? "filled" : "outlined"}
                                                        color={selSizeId === s.sizeId ? "primary" : "default"}
                                                        sx={{ cursor: "pointer", fontSize: "0.72rem" }}
                                                    />
                                                ))}
                                            </Stack>
                                        </Box>
                                    )}

                                    {/* SKU + button row */}
                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                        {selectedVariant ? (
                                            <Typography variant="caption" color="text.secondary">
                                                SKU: <strong>{selectedVariant.sku}</strong>
                                                {selectedVariant.price ? ` · $${Number(selectedVariant.price).toFixed(2)}` : ""}
                                            </Typography>
                                        ) : <Box />}
                                        <Button
                                            variant="contained" size="small"
                                            disabled={!selectedVariant}
                                            onClick={addItem}
                                            startIcon={<AddIcon sx={{ fontSize: 14 }} />}
                                            sx={{ background: "linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)", width: 116, flexShrink: 0 }}
                                        >
                                            Add to Order
                                        </Button>
                                    </Stack>
                                </Box>
                            </Box>
                        )}
                    </Box>

                    {/* ── Cart ── */}
                    {cartItems.length > 0 && (
                        <Box>
                            <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 0.5, display: "block", mb: 0.75 }}>
                                Items ({cartItems.length} {cartItems.length === 1 ? "line" : "lines"} · {cartItems.reduce((s, i) => s + (i.qty ?? 1), 0)} units)
                            </Typography>
                            <Stack spacing={0.75}>
                                {cartItems.map(item => (
                                    <Box key={item.id} sx={{
                                        display: "flex", alignItems: "center", gap: 1.5,
                                        p: 1, borderRadius: 1, border: "1px solid #e2e8f0", bgcolor: "#fff",
                                    }}>
                                        {/* Thumbnail */}
                                        <Box sx={{ width: 44, height: 44, borderRadius: 0.75, bgcolor: "#f3f4f6", flexShrink: 0, overflow: "hidden" }}>
                                            {item.image
                                                ? <RetryImage src={item.image} alt={item.sku} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                                                : <Box sx={{ width: "100%", height: "100%", bgcolor: "#e5e7eb" }} />
                                            }
                                        </Box>
                                        {/* Info */}
                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                            <Typography variant="body2" fontWeight={600} sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                {item.title}
                                            </Typography>
                                            <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap">
                                                {item.colorHex && (
                                                    <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: `#${item.colorHex.replace(/^#/, "")}`, border: "1px solid #d1d5db", flexShrink: 0 }} />
                                                )}
                                                <Typography variant="caption" color="text.secondary">
                                                    {item.colorName} / {item.sizeName}
                                                </Typography>
                                                <Typography variant="caption" color="text.disabled">· {item.sku}</Typography>
                                            </Stack>
                                        </Box>
                                        {/* Price override */}
                                        <TextField
                                            size="small"
                                            type="number"
                                            value={item.price ?? ""}
                                            onChange={e => changePrice(item.id, e.target.value === "" ? 0 : parseFloat(e.target.value) || 0)}
                                            inputProps={{ min: 0, step: 0.01, style: { textAlign: "right", padding: "4px 6px", width: 64 } }}
                                            InputProps={{ startAdornment: <InputAdornment position="start" sx={{ mr: 0 }}>$</InputAdornment> }}
                                            sx={{ flexShrink: 0, "& .MuiOutlinedInput-root": { fontSize: "0.8rem" } }}
                                        />
                                        {/* Qty stepper */}
                                        <Stack direction="row" alignItems="center" spacing={0.5} sx={{ flexShrink: 0 }}>
                                            <IconButton size="small" disabled={(item.qty ?? 1) <= 1} onClick={() => changeQty(item.id, -1)}
                                                sx={{ width: 22, height: 22, border: "1px solid #e2e8f0", borderRadius: 0.75 }}>
                                                <Typography variant="caption" sx={{ lineHeight: 1, fontWeight: 700, fontSize: "0.8rem" }}>−</Typography>
                                            </IconButton>
                                            <Typography variant="body2" sx={{ fontWeight: 700, minWidth: 20, textAlign: "center" }}>{item.qty ?? 1}</Typography>
                                            <IconButton size="small" onClick={() => changeQty(item.id, 1)}
                                                sx={{ width: 22, height: 22, border: "1px solid #e2e8f0", borderRadius: 0.75 }}>
                                                <Typography variant="caption" sx={{ lineHeight: 1, fontWeight: 700, fontSize: "0.8rem" }}>+</Typography>
                                            </IconButton>
                                        </Stack>
                                        <IconButton size="small" onClick={() => removeItem(item.id)} sx={{ color: "error.main", flexShrink: 0 }}>
                                            <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                                        </IconButton>
                                    </Box>
                                ))}
                            </Stack>
                            <Stack direction="row" justifyContent="flex-end" sx={{ mt: 1, pt: 1, borderTop: "1px dashed #e2e8f0" }}>
                                <Typography variant="body2" sx={{ fontWeight: 700 }}>Subtotal&nbsp;&nbsp;${subtotal.toFixed(2)}</Typography>
                            </Stack>
                        </Box>
                    )}

                    {/* ── Order reference ── */}
                    <Box>
                        <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 0.5, display: "block", mb: 0.75 }}>
                            Order Reference
                        </Typography>
                        <TextField {...fs} fullWidth label="PO / Order Number" value={po} onChange={e => setPo(e.target.value)} required />
                    </Box>

                    {/* ── Payment ── */}
                    <Box>
                        <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 0.5, display: "block", mb: 0.75 }}>
                            Payment
                        </Typography>
                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                            {[
                                { key: "invoice", title: "Send an invoice", sub: "Email the customer a secure pay link", icon: <ReceiptLongIcon sx={{ fontSize: 18 }} /> },
                                { key: "paid",    title: "Paid in person",   sub: "Cash or card — already collected",   icon: <PaidIcon sx={{ fontSize: 18 }} /> },
                            ].map(opt => {
                                const on = payment === opt.key;
                                return (
                                    <Box key={opt.key} onClick={() => setPayment(opt.key)}
                                        sx={{ flex: 1, p: 1.25, borderRadius: 1.5, cursor: "pointer", transition: "all 120ms",
                                            border: on ? "2px solid #6366f1" : "1px solid #e2e8f0",
                                            bgcolor: on ? "rgba(99,102,241,0.06)" : "#fff" }}>
                                        <Stack direction="row" alignItems="center" spacing={0.75}>
                                            <Box sx={{ color: on ? "#6366f1" : "text.secondary", display: "flex" }}>{opt.icon}</Box>
                                            <Typography variant="body2" fontWeight={700}>{opt.title}</Typography>
                                        </Stack>
                                        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.25 }}>{opt.sub}</Typography>
                                    </Box>
                                );
                            })}
                        </Stack>
                    </Box>

                    {/* ── In-store pickup toggle ── */}
                    <Box>
                        <FormControlLabel
                            control={<Checkbox checked={inStorePickup} onChange={e => setInStorePickup(e.target.checked)} />}
                            label={<Stack direction="row" alignItems="center" spacing={0.75}><Typography variant="body2" fontWeight={600}>In-Store Pickup</Typography><Typography variant="caption" color="text.secondary">— customer will pick up, no shipping required</Typography></Stack>}
                        />
                    </Box>

                    {/* ── Shipping address ── */}
                    <Box>
                        <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 0.5, display: "block", mb: 0.75 }}>
                            {inStorePickup ? "Customer & Pickup" : "Customer & Shipping"}
                        </Typography>
                        <Stack spacing={1.25}>
                            <Stack direction="row" spacing={1.5}>
                                <TextField {...fs} fullWidth label="Full Name" value={addr.name} onChange={addrChange("name")} required />
                                <TextField {...fs} fullWidth label="Phone" value={addr.phone} onChange={addrChange("phone")} />
                            </Stack>
                            <TextField {...fs} fullWidth type="email"
                                label={payment === "invoice" ? "Customer Email (for the invoice)" : "Customer Email (optional)"}
                                value={email} onChange={e => setEmail(e.target.value)} required={payment === "invoice"} />
                            {!inStorePickup && (
                                <>
                                    <TextField {...fs} fullWidth label="Address Line 1" value={addr.address1} onChange={addrChange("address1")} required />
                                    <TextField {...fs} fullWidth label="Address Line 2 (optional)" value={addr.address2} onChange={addrChange("address2")} />
                                    <Stack direction="row" spacing={1.5}>
                                        <TextField {...fs} fullWidth label="City" value={addr.city} onChange={addrChange("city")} required />
                                        <FormControl {...fs} sx={{ width: 160, flexShrink: 0 }}>
                                            <InputLabel>{addr.country === "CA" ? "Province" : "State"}</InputLabel>
                                            <Select
                                                value={addr.state}
                                                label={addr.country === "CA" ? "Province" : "State"}
                                                onChange={e => setAddr(p => ({ ...p, state: e.target.value }))}
                                                MenuProps={{ PaperProps: { sx: { maxHeight: 280 } } }}
                                            >
                                                <MenuItem value=""><em>—</em></MenuItem>
                                                {(REGIONS[addr.country] ?? []).map(([code, name]) => (
                                                    <MenuItem key={code} value={code}>{code} — {name}</MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                        <TextField {...fs} sx={{ width: 96, flexShrink: 0 }} label="ZIP" value={addr.zip} onChange={addrChange("zip")} />
                                        <FormControl {...fs} sx={{ width: 80, flexShrink: 0 }}>
                                            <InputLabel>Country</InputLabel>
                                            <Select
                                                value={addr.country}
                                                label="Country"
                                                onChange={e => setAddr(p => ({ ...p, country: e.target.value, state: "" }))}
                                            >
                                                {COUNTRIES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                                            </Select>
                                        </FormControl>
                                    </Stack>
                                </>
                            )}
                        </Stack>
                    </Box>

                    {saveErr && <Alert severity="error">{saveErr}</Alert>}
                </Stack>
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={handleClose} disabled={saving}>Cancel</Button>
                <Button
                    variant="contained" onClick={submit}
                    disabled={saving || cartItems.length === 0 || !po.trim() || !addr.name || (payment === "invoice" && !email.trim()) || (!inStorePickup && (!addr.address1 || !addr.city))}
                    startIcon={saving ? <CircularProgress size={14} color="inherit" /> : (payment === "invoice" ? <ReceiptLongIcon sx={{ fontSize: 16 }} /> : <PaidIcon sx={{ fontSize: 16 }} />)}
                    sx={{ background: "linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)" }}
                >
                    {saving ? "Working…" : payment === "invoice" ? "Create & Send Invoice" : "Create Order"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

const STATUS_COLORS = {
    awaiting_shipment: { color: "warning", label: "Awaiting Shipment" },
    shipped: { color: "success", label: "Shipped" },
    cancelled: { color: "error", label: "Cancelled" },
    on_hold: { color: "default", label: "On Hold" },
};

const isMissingInfo = (o) =>
    o.status !== "shipped" &&
    o.items.some(
        (i) =>
            (i.design == undefined && !i.isBlank) ||
            (Object.keys(i.design ?? {}).length === 0 && !i.isBlank) ||
            i.color == undefined ||
            i.size == undefined ||
            i.sizeName == undefined ||
            (i.blank == undefined && i.styleV2 == undefined)
    );

export function Main({ ords, pages, page, q, filter, showAll, source, base = "" }) {
    const router = useRouter();
    const [orders] = useState(ords);
    const [search, setSearch] = useState(q ?? "");
    const [opened, setOpened] = useState("");
    const [createOpen,       setCreateOpen]       = useState(false);
    const [customOrderOpen,  setCustomOrderOpen]  = useState(false);

    const buildUrl = ({ pg = 1, f = filter, all = showAll, sq = search } = {}) => {
        const params = new URLSearchParams();
        if (pg > 1) params.set("page", String(pg));
        if (f) params.set("filter", f);
        if (all) params.set("status", "all");
        if (sq?.trim()) params.set("q", sq.trim());
        const qs = params.toString();
        return `${base}/orders${qs ? `?${qs}` : ""}`;
    };

    const performSearch = () => {
        location.href = buildUrl({ pg: 1 });
    };

    const handlePageChange = (_, value) => {
        location.href = buildUrl({ pg: value });
    };

    const activeFilter = filter ?? "none";

    const FILTERS = [
        { key: "none",        label: "All Types",       f: null },
        { key: "missinginfo", label: "Missing Info",     f: "missinginfo", icon: <WarningAmberIcon sx={{ fontSize: 14 }} /> },
        { key: "blank",       label: "Includes Blanks",  f: "blank" },
    ];

    return (
        <Box sx={{ width: "100%", maxWidth: "100%", overflowX: "hidden" }}>
            {/* Header */}
            <Box sx={{ bgcolor: "#fff", borderBottom: "1px solid #e2e8f0", px: 3, py: 2, mb: 0 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                        <Box sx={{
                            width: 36, height: 36, borderRadius: 2, flexShrink: 0,
                            background: "linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                            <ShoppingCartIcon sx={{ color: "#fff", fontSize: 20 }} />
                        </Box>
                        <Box>
                            <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: -0.5, lineHeight: 1.2 }}>
                                Orders
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {showAll ? "All statuses" : "Awaiting shipment"}
                                {filter === "missinginfo" ? " · Missing info" : filter === "blank" ? " · Includes blanks" : ""}
                                {q ? ` · "${q}"` : ""}
                            </Typography>
                        </Box>
                    </Stack>

                    <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center">
                        <Button
                            variant="contained" size="small"
                            startIcon={<AddIcon sx={{ fontSize: 16 }} />}
                            onClick={() => setCreateOpen(true)}
                            sx={{ background: "linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)", borderRadius: 1.5, fontWeight: 600, mr: 0.5 }}
                        >
                            New Order
                        </Button>
                        <Button
                            variant="outlined" size="small"
                            startIcon={<AddIcon sx={{ fontSize: 16 }} />}
                            onClick={() => setCustomOrderOpen(true)}
                            sx={{ borderRadius: 1.5, fontWeight: 600, borderColor: "#D3A73D", color: "#b8860b", "&:hover": { borderColor: "#b8860b", bgcolor: "rgba(211,167,61,0.06)" }, mr: 0.5 }}
                        >
                            Custom Order
                        </Button>
                        {/* Status toggle */}
                        <Chip
                            label="Awaiting Shipment"
                            size="small"
                            variant={!showAll ? "filled" : "outlined"}
                            color={!showAll ? "warning" : "default"}
                            onClick={() => { location.href = buildUrl({ pg: 1, all: false }); }}
                            sx={{ cursor: "pointer", fontWeight: !showAll ? 600 : 400 }}
                        />
                        <Chip
                            label="All Statuses"
                            size="small"
                            variant={showAll ? "filled" : "outlined"}
                            color={showAll ? "primary" : "default"}
                            onClick={() => { location.href = buildUrl({ pg: 1, all: true }); }}
                            sx={{ cursor: "pointer", fontWeight: showAll ? 600 : 400 }}
                        />
                        <Box sx={{ width: "1px", height: 20, bgcolor: "divider", display: { xs: "none", sm: "block" } }} />
                        {/* Type filters */}
                        {FILTERS.map((fi) => (
                            <Chip
                                key={fi.key}
                                label={fi.label}
                                icon={fi.icon}
                                size="small"
                                variant={activeFilter === fi.key ? "filled" : "outlined"}
                                color={activeFilter === fi.key ? "primary" : "default"}
                                onClick={() => { location.href = buildUrl({ pg: 1, f: fi.f }); }}
                                sx={{ cursor: "pointer", fontWeight: activeFilter === fi.key ? 600 : 400 }}
                            />
                        ))}
                    </Stack>
                </Box>
            </Box>

            <Container maxWidth="lg" sx={{ py: 3, minHeight: "90vh" }}>

                {/* Search */}
                <Box sx={{ mb: 2, p: 2, borderRadius: 2, background: "#fff", boxShadow: "0px 0px 10px rgba(0,0,0,.1)" }}>
                    <TextField
                        fullWidth
                        variant="outlined"
                        placeholder="Search by PO number, SKU, name…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") performSearch(); }}
                        size="small"
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end" sx={{ cursor: "pointer" }} onClick={performSearch}>
                                    <SearchIcon />
                                </InputAdornment>
                            ),
                        }}
                    />
                </Box>

                {/* Column headers */}
                <Box sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr 80px 60px 36px", md: "2fr 1fr 80px 80px 80px 36px" },
                    px: 2, py: 1,
                    borderRadius: 1,
                    backgroundColor: "background.default",
                    border: "1px solid", borderColor: "divider",
                    mb: 0.5,
                }}>
                    {["PO Number", "Status", "#Items", "Date", "Total", ""].map((col, i) => (
                        <Typography
                            key={i}
                            variant="caption"
                            sx={{
                                fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "text.secondary",
                                display: (i === 1 || i === 3 || i === 4) ? { xs: "none", md: "block" } : "block",
                            }}
                        >
                            {col}
                        </Typography>
                    ))}
                </Box>

                {/* Orders */}
                <Stack spacing={0.5}>
                    {orders.length === 0 && (
                        <Box sx={{ py: 10, textAlign: "center" }}>
                            <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>No orders found</Typography>
                        </Box>
                    )}
                    {orders.map((o) => {
                        const missing = isMissingInfo(o);
                        const isOpen = opened === o._id;
                        const statusInfo = STATUS_COLORS[o.status] ?? { color: "default", label: o.status };

                        return (
                            <Card
                                key={o._id}
                                variant="outlined"
                                sx={{
                                    borderRadius: 1.5,
                                    borderColor: missing ? "warning.light" : "divider",
                                    transition: "box-shadow 150ms",
                                    "&:hover": { boxShadow: 2 },
                                    overflow: "visible",
                                }}
                            >
                                {/* Row */}
                                <Box
                                    sx={{
                                        display: "grid",
                                        gridTemplateColumns: { xs: "1fr 80px 60px 36px", md: "2fr 1fr 80px 80px 80px 36px" },
                                        alignItems: "center",
                                        px: 2, py: 1.25,
                                        cursor: "pointer",
                                    }}
                                    onClick={() => router.push(`${base}/orders/${o._id}`)}
                                >
                                    {/* PO Number */}
                                    <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 0 }}>
                                        {missing && (
                                            <Tooltip title="Missing item information">
                                                <WarningAmberIcon sx={{ fontSize: 16, color: "warning.main", flexShrink: 0 }} />
                                            </Tooltip>
                                        )}
                                        <Typography variant="body2" sx={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                            {o.poNumber}
                                        </Typography>
                                        <Typography variant="caption" color="text.disabled" sx={{ display: { xs: "none", sm: "block" }, whiteSpace: "nowrap" }}>
                                            {o.marketplace}
                                        </Typography>
                                    </Stack>

                                    {/* Status */}
                                    <Box sx={{ display: { xs: "none", md: "flex" }, alignItems: "center" }}>
                                        <Chip
                                            label={statusInfo.label}
                                            color={statusInfo.color}
                                            size="small"
                                            variant="outlined"
                                            sx={{ fontSize: "0.65rem", height: 20 }}
                                        />
                                    </Box>

                                    {/* Items */}
                                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center" }}>
                                        {o.items.length}
                                    </Typography>

                                    {/* Date */}
                                    <Typography variant="body2" color="text.secondary" sx={{ display: { xs: "none", md: "block" } }}>
                                        {new Date(o.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" })}
                                    </Typography>

                                    {/* Total */}
                                    <Box sx={{ display: { xs: "none", md: "block" } }}>
                                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                            ${((o.total ?? 0) - (o.discountAmount ?? 0)).toFixed(2)}
                                        </Typography>
                                        {o.discountAmount > 0 && (
                                            <Typography variant="caption" color="error.main" sx={{ display: "block", lineHeight: 1.2 }}>
                                                −${(o.discountAmount).toFixed(2)}
                                            </Typography>
                                        )}
                                    </Box>

                                    {/* Expand toggle — stop propagation so click doesn't navigate */}
                                    <Box
                                        sx={{ display: "flex", justifyContent: "center" }}
                                        onClick={(e) => { e.stopPropagation(); setOpened(isOpen ? "" : o._id); }}
                                    >
                                        <IconButton size="small">
                                            {isOpen ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                                        </IconButton>
                                    </Box>
                                </Box>

                                {/* Expanded items */}
                                <Collapse in={isOpen} unmountOnExit>
                                    <Divider />
                                    <Box sx={{ px: 2, py: 1.5, backgroundColor: "background.default" }}>
                                        {/* Mobile status + total row */}
                                        <Stack direction="row" spacing={1} sx={{ mb: 1.5, display: { xs: "flex", md: "none" }, flexWrap: "wrap", alignItems: "center" }}>
                                            <Chip label={statusInfo.label} color={statusInfo.color} size="small" variant="outlined" sx={{ fontSize: "0.65rem", height: 20 }} />
                                            <Typography variant="caption" color="text.secondary">
                                                {new Date(o.date).toLocaleDateString("en-US")} · ${((o.total ?? 0) - (o.discountAmount ?? 0)).toFixed(2)}
                                                {o.discountAmount > 0 && <span style={{ color: "#ef4444", marginLeft: 4 }}>−${o.discountAmount.toFixed(2)}</span>}
                                            </Typography>
                                        </Stack>

                                        {o.discountAmount > 0 && (
                                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                                                <Chip
                                                    label={o.discountName ? `Discount: ${o.discountName}` : "Discount Applied"}
                                                    size="small"
                                                    color="error"
                                                    variant="outlined"
                                                    sx={{ fontSize: "0.7rem", height: 22 }}
                                                />
                                                <Typography variant="caption" color="error.main" sx={{ fontWeight: 600 }}>
                                                    −${(o.discountAmount).toFixed(2)}
                                                </Typography>
                                            </Stack>
                                        )}

                                        <Stack spacing={1}>
                                            {o.items.map((item, idx) => {
                                                const itemMissing =
                                                    o.status !== "shipped" &&
                                                    ((item.design == undefined && !item.isBlank) ||
                                                        (Object.keys(item.design ?? {}).length === 0 && !item.isBlank) ||
                                                        item.color == undefined || item.size == undefined ||
                                                        item.sizeName == undefined || item.blank == undefined);

                                                const imageKeys = Object.keys(item.design ?? {}).filter(k => item.design[k] != undefined);
                                                // Custom "create your own" items carry a normalized placement per side — pass it to
                                                // renderImages so the thumbnail shows the art at the buyer's real position/size.
                                                const placeQS = (key) => {
                                                    const p = (item.personalization?.sides || []).find(s => s.location === key)?.place;
                                                    return (p && p.wPct > 0 && p.hPct > 0)
                                                        ? `&xPct=${p.xPct ?? 0}&yPct=${p.yPct ?? 0}&wPct=${p.wPct}&hPct=${p.hPct}`
                                                        : "";
                                                };

                                                return (
                                                    <Box
                                                        key={idx}
                                                        sx={{
                                                            display: "grid",
                                                            gridTemplateColumns: { xs: "56px 1fr", md: "56px 2fr 1fr 1fr 1fr 80px" },
                                                            gap: 1.5,
                                                            alignItems: "center",
                                                            p: 1.25,
                                                            borderRadius: 1.5,
                                                            border: "1px solid",
                                                            borderColor: itemMissing ? "warning.light" : "divider",
                                                            backgroundColor: itemMissing ? "rgba(255,167,38,0.04)" : "#fff",
                                                        }}
                                                    >
                                                        {/* Image */}
                                                        <Box sx={{ width: 56, height: 56, borderRadius: 1, overflow: "hidden", backgroundColor: "background.default", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                                            {imageKeys.length > 0 ? (
                                                                <RetryImage
                                                                    src={source === "PO"
                                                                        ? `https://images4.tshirtpalace.com/images/productImages/SKU--${(item.colorName || "").toLowerCase()}-${(item.styleCode || "").toLowerCase()}-${imageKeys[0]}.webp?url=${item.design[imageKeys[0]]}&width=100`
                                                                        : `/api/renderImages/${item.styleCode}-${item.colorName}-${imageKeys[0]}.jpg?blank=${item.styleCode}&colorName=${item.colorName}&design=${item.design[imageKeys[0]]}&width=100&side=${imageKeys[0]}${placeQS(imageKeys[0])}${base ? `&orgSlug=${base.slice(1)}` : ""}`}
                                                                    alt={item.sku}
                                                                    style={{ width: "100%", height: "100%", objectFit: "contain" }}
                                                                />
                                                            ) : (
                                                                <Box sx={{ width: "100%", height: "100%", backgroundColor: "divider" }} />
                                                            )}
                                                        </Box>

                                                        {/* Name / SKU / UPC */}
                                                        <Box sx={{ minWidth: 0 }}>
                                                            <Typography variant="body2" sx={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={item.name}>
                                                                {item.name || "—"}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary" sx={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                                {item.sku}
                                                            </Typography>
                                                            {item.upc && (
                                                                <Typography variant="caption" color="text.disabled" sx={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                                    UPC: {item.upc}
                                                                </Typography>
                                                            )}
                                                        </Box>

                                                        {/* Color */}
                                                        <Box sx={{ display: { xs: "none", md: "block" } }}>
                                                            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.25 }}>Color</Typography>
                                                            <Typography variant="body2">{item.colorName || <span style={{ color: "#f59e0b" }}>—</span>}</Typography>
                                                        </Box>

                                                        {/* Size */}
                                                        <Box sx={{ display: { xs: "none", md: "block" } }}>
                                                            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.25 }}>Size</Typography>
                                                            <Typography variant="body2">{item.sizeName || <span style={{ color: "#f59e0b" }}>—</span>}</Typography>
                                                        </Box>

                                                        {/* Blank */}
                                                        <Box sx={{ display: { xs: "none", md: "block" } }}>
                                                            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.25 }}>Blank</Typography>
                                                            <Typography variant="body2">{item.styleCode || <span style={{ color: "#f59e0b" }}>—</span>}</Typography>
                                                        </Box>

                                                        {/* Price */}
                                                        <Box sx={{ display: { xs: "none", md: "block" } }}>
                                                            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.25 }}>Price</Typography>
                                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                                {item.price != null ? `$${Number(item.price).toFixed(2)}` : "—"}
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                );
                                            })}
                                        </Stack>
                                    </Box>
                                </Collapse>
                            </Card>
                        );
                    })}
                </Stack>

                {/* Pagination */}
                <Stack spacing={2} sx={{ mt: 3, mb: 2, display: "flex", alignItems: "center" }}>
                    <Pagination
                        count={pages ?? 20}
                        page={page ?? 1}
                        onChange={handlePageChange}
                        shape="rounded"
                        showFirstButton
                        showLastButton
                    />
                </Stack>

            </Container>

            <CreateOrderModal
                open={createOpen}
                onClose={() => setCreateOpen(false)}
                onCreated={(orderId) => router.push(`${base}/orders/${orderId}`)}
            />
            <CustomOrderBuilder
                open={customOrderOpen}
                setOpen={setCustomOrderOpen}
                onSaved={() => setCustomOrderOpen(false)}
            />
        </Box>
    );
}

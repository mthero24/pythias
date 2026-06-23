"use client";
import { useState, useRef } from 'react';
import { Box, Typography, TextField, Button, Card, CardContent, Grid2, IconButton, Chip, Divider, CircularProgress, FormControlLabel, Checkbox, InputAdornment, Tooltip, Alert } from '@mui/material';
import CreatableSelect from 'react-select/creatable';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import axios from 'axios';

// Buy-not-build product creator: for resellers / commerce-cloud sellers who BUY products and ship
// them themselves. Enter a UPC → we look it up (UPCitemdb → Claude web_search) and prefill; or fill
// it all in manually. Free-form variants with on-hand stock. Saves via /api/admin/products.

const emptyVariant = (upc = "") => ({ name: "", sku: "", price: "", compareAtPrice: "", costPerItem: "", upc, stock: "", weight: "" });

const selectPortal = {
    menuPortalTarget: typeof document !== "undefined" ? document.body : null,
    menuPosition: "fixed",
    styles: { menuPortal: (base) => ({ ...base, zIndex: 9999 }) },
};

export function CatalogProductCreate({ onSaved, onCancel }) {
    const [upc, setUpc] = useState("");
    const [looking, setLooking] = useState(false);
    const [lookupMsg, setLookupMsg] = useState(null);   // { severity, text }
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileRef = useRef(null);
    const [p, setP] = useState({ title: "", description: "", brand: "", sku: "", tags: [], productImages: [], variantsArray: [emptyVariant()], trackInventory: true, continueSellingOOS: false });
    const set = (patch) => setP((s) => ({ ...s, ...patch }));
    const setVar = (i, patch) => setP((s) => ({ ...s, variantsArray: s.variantsArray.map((v, j) => (j === i ? { ...v, ...patch } : v)) }));

    const doLookup = async () => {
        if (!upc.trim()) { setLookupMsg({ severity: "warning", text: "Enter a UPC / barcode first, or just fill in the product manually below." }); return; }
        setLooking(true); setLookupMsg(null);
        try {
            const { data } = await axios.post("/api/admin/upc-lookup", { upc });
            if (data.error) { setLookupMsg({ severity: "error", text: data.error }); return; }
            if (!data.found) { setLookupMsg({ severity: "info", text: "No product found for that UPC — enter the details manually below." }); return; }
            const prod = data.product || {};
            setP((s) => ({
                ...s,
                title: prod.title || s.title,
                description: prod.description || s.description,
                brand: prod.brand || s.brand,
                productImages: (prod.images || []).map((img) => ({ image: img })),
                variantsArray: prod.variants?.length
                    ? prod.variants.map((v) => ({ ...emptyVariant(upc), name: v.name || "", sku: v.sku || "", price: v.price || "" }))
                    : [{ ...emptyVariant(upc) }],
            }));
            setLookupMsg({ severity: "success", text: `Found via ${data.source}. Review and edit everything below before saving.` });
        } catch {
            setLookupMsg({ severity: "error", text: "Lookup failed — enter the product manually below." });
        } finally { setLooking(false); }
    };

    const onUpload = async (e) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;
        setUploading(true);
        try {
            for (const file of files) {
                const fd = new FormData(); fd.append("file", file); fd.append("folder", "catalog");
                const { data } = await axios.post("/api/admin/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
                if (data?.url) setP((s) => ({ ...s, productImages: [...s.productImages, { image: data.url }] }));
            }
        } catch { alert("Image upload failed."); }
        finally { setUploading(false); if (fileRef.current) fileRef.current.value = ""; }
    };

    const removeImage = (i) => setP((s) => ({ ...s, productImages: s.productImages.filter((_, j) => j !== i) }));

    const save = async () => {
        if (!p.title.trim()) { setLookupMsg({ severity: "error", text: "A product title is required." }); return; }
        setSaving(true);
        try {
            const product = {
                title: p.title.trim(), description: p.description, brand: p.brand, sku: p.sku, tags: p.tags,
                productImages: p.productImages.map((pi) => ({ image: pi.image })),
                variantsArray: p.variantsArray.map((v) => ({
                    name: v.name, sku: v.sku, upc: v.upc,
                    price: Number(v.price) || 0, compareAtPrice: Number(v.compareAtPrice) || 0,
                    costPerItem: Number(v.costPerItem) || 0, weight: Number(v.weight) || 0,
                    stock: Number(v.stock) || 0,
                    color: null, size: null, blank: null,
                })),
                isNFProduct: true, isCatalogProduct: true,
                trackInventory: p.trackInventory, continueSellingOOS: p.continueSellingOOS,
            };
            const res = await axios.post("/api/admin/products", { products: [product] });
            if (res.data.error) setLookupMsg({ severity: "error", text: res.data.msg || "Save failed." });
            else onSaved?.();
        } catch { setLookupMsg({ severity: "error", text: "Save failed. Please try again." }); }
        finally { setSaving(false); }
    };

    return (
        <Box sx={{ maxWidth: 920, margin: "0 auto", paddingBottom: 4 }}>
            {/* UPC lookup */}
            <Card variant="outlined" sx={{ marginBottom: 2, backgroundColor: "#f8fafc" }}>
                <CardContent>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, marginBottom: 0.5 }}>Look up by UPC</Typography>
                    <Typography variant="caption" color="text.secondary">Enter the product's UPC / barcode and we'll fetch its details from the web. No UPC? Just fill in the fields below.</Typography>
                    <Box sx={{ display: "flex", gap: 1, marginTop: 1.5, flexWrap: "wrap" }}>
                        <TextField size="small" label="UPC / barcode" value={upc} onChange={(e) => setUpc(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") doLookup(); }} sx={{ flex: "1 1 260px" }} />
                        <Button variant="contained" onClick={doLookup} disabled={looking} startIcon={looking ? <CircularProgress size={16} color="inherit" /> : <SearchIcon />}>{looking ? "Searching…" : "Look up"}</Button>
                    </Box>
                    {lookupMsg && <Alert severity={lookupMsg.severity} sx={{ marginTop: 1.5 }}>{lookupMsg.text}</Alert>}
                </CardContent>
            </Card>

            {/* Identity */}
            <Card variant="outlined" sx={{ marginBottom: 2 }}>
                <CardContent>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, marginBottom: 2 }}>Product details</Typography>
                    <Grid2 container spacing={2}>
                        <Grid2 size={12}><TextField fullWidth label="Title" required value={p.title} onChange={(e) => set({ title: e.target.value })} /></Grid2>
                        <Grid2 size={12}><TextField fullWidth multiline minRows={3} label="Description" value={p.description} onChange={(e) => set({ description: e.target.value })} /></Grid2>
                        <Grid2 size={{ xs: 12, sm: 6 }}><TextField fullWidth label="Brand" value={p.brand} onChange={(e) => set({ brand: e.target.value })} /></Grid2>
                        <Grid2 size={{ xs: 12, sm: 6 }}><TextField fullWidth label="Product SKU (optional)" value={p.sku} onChange={(e) => set({ sku: e.target.value })} /></Grid2>
                        <Grid2 size={12}>
                            <Typography variant="caption" sx={{ display: "block", marginBottom: 0.5 }}>Tags</Typography>
                            <CreatableSelect {...selectPortal} isMulti placeholder="Tags" value={(p.tags || []).map((t) => ({ value: t, label: t }))} onChange={(nv) => set({ tags: (nv || []).map((t) => t.value) })} />
                        </Grid2>
                    </Grid2>
                </CardContent>
            </Card>

            {/* Images */}
            <Card variant="outlined" sx={{ marginBottom: 2 }}>
                <CardContent>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 1.5 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Images</Typography>
                        <Button size="small" variant="outlined" disabled={uploading} startIcon={uploading ? <CircularProgress size={14} /> : <AddIcon />} onClick={() => fileRef.current?.click()}>Upload</Button>
                        <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={onUpload} />
                    </Box>
                    {p.productImages.length === 0 ? (
                        <Typography variant="body2" color="text.secondary">No images yet. Look up a UPC or upload your own.</Typography>
                    ) : (
                        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(96px, 1fr))", gap: 1 }}>
                            {p.productImages.map((pi, i) => (
                                <Box key={i} sx={{ position: "relative", aspectRatio: "1/1", border: "1px solid", borderColor: "divider", borderRadius: 1, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", background: "#fff" }}>
                                    <img src={pi.image} alt="" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                                    <IconButton size="small" onClick={() => removeImage(i)} sx={{ position: "absolute", top: 2, right: 2, backgroundColor: "rgba(255,255,255,0.85)", "&:hover": { backgroundColor: "#fff" } }}><DeleteIcon fontSize="small" /></IconButton>
                                </Box>
                            ))}
                        </Box>
                    )}
                </CardContent>
            </Card>

            {/* Variants + inventory */}
            <Card variant="outlined" sx={{ marginBottom: 2 }}>
                <CardContent>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Variants &amp; inventory</Typography>
                        <Button size="small" startIcon={<AddIcon />} onClick={() => set({ variantsArray: [...p.variantsArray, emptyVariant()] })}>Add variant</Button>
                    </Box>
                    <Box sx={{ display: "flex", gap: 2, marginBottom: 1.5, flexWrap: "wrap" }}>
                        <FormControlLabel control={<Checkbox checked={p.trackInventory} onChange={(e) => set({ trackInventory: e.target.checked })} />} label="Track inventory" />
                        <FormControlLabel control={<Checkbox checked={p.continueSellingOOS} onChange={(e) => set({ continueSellingOOS: e.target.checked })} disabled={!p.trackInventory} />} label="Keep selling when out of stock" />
                    </Box>
                    {p.variantsArray.map((v, i) => (
                        <Box key={i} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1, padding: 1.5, marginBottom: 1 }}>
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 1 }}>
                                <Typography variant="caption" sx={{ fontWeight: 600, color: "text.secondary" }}>Variant {i + 1}</Typography>
                                {p.variantsArray.length > 1 && <IconButton size="small" onClick={() => set({ variantsArray: p.variantsArray.filter((_, j) => j !== i) })}><DeleteIcon fontSize="small" /></IconButton>}
                            </Box>
                            <Grid2 container spacing={1.5}>
                                <Grid2 size={{ xs: 12, sm: 6 }}><TextField fullWidth size="small" label="Option (e.g. Small / Red)" value={v.name} onChange={(e) => setVar(i, { name: e.target.value })} /></Grid2>
                                <Grid2 size={{ xs: 6, sm: 3 }}><TextField fullWidth size="small" label="SKU" value={v.sku} onChange={(e) => setVar(i, { sku: e.target.value })} /></Grid2>
                                <Grid2 size={{ xs: 6, sm: 3 }}><TextField fullWidth size="small" label="UPC" value={v.upc} onChange={(e) => setVar(i, { upc: e.target.value })} /></Grid2>
                                <Grid2 size={{ xs: 6, sm: 3 }}><TextField fullWidth size="small" type="number" label="Price" value={v.price} onChange={(e) => setVar(i, { price: e.target.value })} InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }} /></Grid2>
                                <Grid2 size={{ xs: 6, sm: 3 }}><TextField fullWidth size="small" type="number" label="Compare-at" value={v.compareAtPrice} onChange={(e) => setVar(i, { compareAtPrice: e.target.value })} InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }} /></Grid2>
                                <Grid2 size={{ xs: 6, sm: 3 }}><TextField fullWidth size="small" type="number" label="Cost" value={v.costPerItem} onChange={(e) => setVar(i, { costPerItem: e.target.value })} InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }} /></Grid2>
                                <Grid2 size={{ xs: 6, sm: 3 }}><TextField fullWidth size="small" type="number" label="In stock" value={v.stock} onChange={(e) => setVar(i, { stock: e.target.value })} disabled={!p.trackInventory} /></Grid2>
                            </Grid2>
                        </Box>
                    ))}
                </CardContent>
            </Card>

            <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                <Button variant="outlined" onClick={onCancel}>Cancel</Button>
                <Button variant="contained" onClick={save} disabled={saving}>{saving ? "Saving…" : "Create product"}</Button>
            </Box>
        </Box>
    );
}

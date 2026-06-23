"use client";
import { useState, useRef } from 'react';
import { Box, Typography, TextField, Button, Card, CardContent, Grid2, IconButton, Chip, CircularProgress, FormControlLabel, Checkbox, InputAdornment, Alert, Divider } from '@mui/material';
import CreatableSelect from 'react-select/creatable';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import LinkIcon from '@mui/icons-material/Link';
import axios from 'axios';

// Buy-not-build product creator: for resellers / commerce-cloud sellers who BUY products and ship
// them themselves. Enter a UPC → we look it up (UPCitemdb → Claude web_search) and prefill; or fill
// it all in manually. Single-variant by default; expand to variations on demand. Saves via /api/admin/products.

const emptyVariant = (upc = "") => ({ name: "", sku: "", price: "", compareAtPrice: "", costPerItem: "", upc, stock: "", weight: "" });

const selectPortal = {
    menuPortalTarget: typeof document !== "undefined" ? document.body : null,
    menuPosition: "fixed",
    styles: { menuPortal: (base) => ({ ...base, zIndex: 9999 }) },
};

// Section shell with a numbered step badge for a clear top-to-bottom flow.
const Section = ({ n, title, subtitle, action, children }) => (
    <Card variant="outlined" sx={{ marginBottom: 2, borderRadius: 2 }}>
        <CardContent sx={{ padding: { xs: 2, sm: 2.5 } }}>
            <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1, marginBottom: 2 }}>
                <Box sx={{ display: "flex", gap: 1.25, alignItems: "center" }}>
                    <Box sx={{ width: 26, height: 26, borderRadius: "50%", bgcolor: "primary.main", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".8rem", fontWeight: 700, flexShrink: 0 }}>{n}</Box>
                    <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>{title}</Typography>
                        {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
                    </Box>
                </Box>
                {action}
            </Box>
            {children}
        </CardContent>
    </Card>
);

export function CatalogProductCreate({ onSaved, onCancel }) {
    const [upc, setUpc] = useState("");
    const [looking, setLooking] = useState(false);
    const [lookupMsg, setLookupMsg] = useState(null);   // { severity, text }
    const [saving, setSaving] = useState(false);
    const [saveErr, setSaveErr] = useState("");
    const [uploading, setUploading] = useState(false);
    const [imgUrl, setImgUrl] = useState("");
    const fileRef = useRef(null);
    const [p, setP] = useState({ title: "", description: "", brand: "", sku: "", tags: [], productImages: [], variantsArray: [emptyVariant()], trackInventory: true, continueSellingOOS: false });
    const set = (patch) => setP((s) => ({ ...s, ...patch }));
    const setVar = (i, patch) => setP((s) => ({ ...s, variantsArray: s.variantsArray.map((v, j) => (j === i ? { ...v, ...patch } : v)) }));

    const multi = p.variantsArray.length > 1;
    const hasPrice = p.variantsArray.some((v) => Number(v.price) > 0);
    const canCreate = !!p.title.trim() && hasPrice && !saving && !uploading;
    const blockHint = !p.title.trim() ? "Add a product title" : !hasPrice ? "Add a price" : "";

    const doLookup = async () => {
        if (!upc.trim()) { setLookupMsg({ severity: "warning", text: "Enter a UPC / barcode first, or just fill in the product manually below." }); return; }
        setLooking(true); setLookupMsg(null);
        try {
            const { data } = await axios.post("/api/admin/upc-lookup", { upc });
            if (data.error) { setLookupMsg({ severity: "error", text: data.error }); return; }
            if (!data.found) { setLookupMsg({ severity: "info", text: "No match for that UPC — no problem, just fill in the details below." }); return; }
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
            setLookupMsg({ severity: "success", text: `Found it (via ${data.source}). Review and edit everything below — set your price, then create.` });
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
        } catch { setSaveErr("Image upload failed."); }
        finally { setUploading(false); if (fileRef.current) fileRef.current.value = ""; }
    };

    const addImgUrl = () => {
        const u = imgUrl.trim();
        if (!/^https?:\/\//i.test(u)) { setSaveErr("Enter a full image URL (https://…)."); return; }
        setSaveErr("");
        setP((s) => ({ ...s, productImages: [...s.productImages, { image: u }] }));
        setImgUrl("");
    };
    const removeImage = (i) => setP((s) => ({ ...s, productImages: s.productImages.filter((_, j) => j !== i) }));
    const makePrimary = (i) => setP((s) => { const imgs = [...s.productImages]; const [it] = imgs.splice(i, 1); imgs.unshift(it); return { ...s, productImages: imgs }; });

    const save = async () => {
        if (!canCreate) { setSaveErr(blockHint ? `${blockHint} before creating.` : ""); return; }
        setSaving(true); setSaveErr("");
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
            if (res.data.error) setSaveErr(res.data.msg || "Save failed.");
            else onSaved?.();
        } catch { setSaveErr("Save failed. Please try again."); }
        finally { setSaving(false); }
    };

    const num = { inputProps: { min: 0, step: "0.01" } };

    return (
        <Box sx={{ maxWidth: 900, margin: "0 auto" }}>
            <Box sx={{ textAlign: "center", marginBottom: 2 }}>
                <Typography variant="body2" color="text.secondary">Add a product you buy and resell. Look it up by UPC to auto-fill, or enter it yourself.</Typography>
            </Box>

            {/* 1 — UPC lookup (hero) */}
            <Section n={1} title="Look up by UPC" subtitle="We'll fetch the title, images, brand and description from the web.">
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "stretch" }}>
                    <TextField label="UPC / barcode" placeholder="e.g. 049000028911" value={upc} onChange={(e) => setUpc(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") doLookup(); }} sx={{ flex: "1 1 280px" }} autoFocus />
                    <Button variant="contained" size="large" onClick={doLookup} disabled={looking} startIcon={looking ? <CircularProgress size={16} color="inherit" /> : <SearchIcon />} sx={{ minWidth: 130 }}>{looking ? "Searching…" : "Look up"}</Button>
                </Box>
                {lookupMsg && <Alert severity={lookupMsg.severity} sx={{ marginTop: 1.5 }}>{lookupMsg.text}</Alert>}
                <Divider sx={{ marginTop: 2, "&::before, &::after": { borderColor: "divider" } }}><Typography variant="caption" color="text.secondary">or enter the details manually</Typography></Divider>
            </Section>

            {/* 2 — Details */}
            <Section n={2} title="Product details">
                <Grid2 container spacing={2}>
                    <Grid2 size={12}><TextField fullWidth label="Title" required value={p.title} onChange={(e) => set({ title: e.target.value })} placeholder="What the product is called" /></Grid2>
                    <Grid2 size={12}><TextField fullWidth multiline minRows={3} label="Description" value={p.description} onChange={(e) => set({ description: e.target.value })} placeholder="What buyers see on the product page" /></Grid2>
                    <Grid2 size={{ xs: 12, sm: 6 }}><TextField fullWidth label="Brand" value={p.brand} onChange={(e) => set({ brand: e.target.value })} /></Grid2>
                    <Grid2 size={{ xs: 12, sm: 6 }}><TextField fullWidth label="Product SKU" value={p.sku} onChange={(e) => set({ sku: e.target.value })} helperText="Optional — your own product code" /></Grid2>
                    <Grid2 size={12}>
                        <Typography variant="caption" sx={{ display: "block", marginBottom: 0.5 }}>Tags</Typography>
                        <CreatableSelect {...selectPortal} isMulti placeholder="Type a tag and press enter…" value={(p.tags || []).map((t) => ({ value: t, label: t }))} onChange={(nv) => set({ tags: (nv || []).map((t) => t.value) })} />
                    </Grid2>
                </Grid2>
            </Section>

            {/* 3 — Images */}
            <Section n={3} title="Images" subtitle="The first image is the main photo. Upload your own or paste a link."
                action={<>
                    <Button size="small" variant="outlined" disabled={uploading} startIcon={uploading ? <CircularProgress size={14} /> : <AddPhotoAlternateIcon />} onClick={() => fileRef.current?.click()}>Upload</Button>
                    <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={onUpload} />
                </>}
            >
                <Box sx={{ display: "flex", gap: 1, marginBottom: 1.5, flexWrap: "wrap" }}>
                    <TextField size="small" label="Image URL" placeholder="https://…" value={imgUrl} onChange={(e) => setImgUrl(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") addImgUrl(); }} sx={{ flex: "1 1 260px" }} />
                    <Button size="small" variant="outlined" startIcon={<LinkIcon />} onClick={addImgUrl}>Add link</Button>
                </Box>
                {p.productImages.length === 0 ? (
                    <Box sx={{ padding: 3, textAlign: "center", border: "1px dashed", borderColor: "divider", borderRadius: 1.5, color: "text.secondary" }}>
                        <Typography variant="body2">No images yet — look up a UPC, upload, or paste a link.</Typography>
                    </Box>
                ) : (
                    <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(104px, 1fr))", gap: 1 }}>
                        {p.productImages.map((pi, i) => (
                            <Box key={i} sx={{ position: "relative", aspectRatio: "1/1", border: i === 0 ? "2px solid" : "1px solid", borderColor: i === 0 ? "primary.main" : "divider", borderRadius: 1.5, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", background: "#fff" }}>
                                <img src={pi.image} alt="" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                                {i === 0
                                    ? <Chip size="small" label="Main" color="primary" sx={{ position: "absolute", bottom: 4, left: 4, height: 18, fontSize: ".62rem" }} />
                                    : <Button size="small" onClick={() => makePrimary(i)} sx={{ position: "absolute", bottom: 2, left: 2, minWidth: 0, padding: "0 6px", fontSize: ".62rem", textTransform: "none", backgroundColor: "rgba(255,255,255,0.85)" }}>Make main</Button>}
                                <IconButton size="small" onClick={() => removeImage(i)} sx={{ position: "absolute", top: 2, right: 2, backgroundColor: "rgba(255,255,255,0.85)", "&:hover": { backgroundColor: "#fff" } }}><DeleteIcon fontSize="small" /></IconButton>
                            </Box>
                        ))}
                    </Box>
                )}
            </Section>

            {/* 4 — Pricing, variations & inventory */}
            <Section n={4} title="Pricing & inventory" subtitle={multi ? "One row per variation." : "Set your selling price. Add variations if this product comes in options."}>
                {p.variantsArray.map((v, i) => (
                    <Box key={i} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1.5, padding: 1.5, marginBottom: 1.5, backgroundColor: multi ? "#fafafa" : "transparent" }}>
                        {multi && (
                            <Box sx={{ display: "flex", gap: 1, alignItems: "center", marginBottom: 1.5 }}>
                                <TextField fullWidth size="small" label={`Variation ${i + 1} name`} placeholder="e.g. Small / Red" value={v.name} onChange={(e) => setVar(i, { name: e.target.value })} />
                                <IconButton size="small" onClick={() => set({ variantsArray: p.variantsArray.filter((_, j) => j !== i) })}><DeleteIcon fontSize="small" /></IconButton>
                            </Box>
                        )}
                        <Grid2 container spacing={1.5}>
                            <Grid2 size={{ xs: 12, sm: 4 }}><TextField fullWidth size="small" required type="number" label="Price" value={v.price} onChange={(e) => setVar(i, { price: e.target.value })} error={!Number(v.price)} InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }} {...num} /></Grid2>
                            <Grid2 size={{ xs: 6, sm: 4 }}><TextField fullWidth size="small" type="number" label="Compare-at" value={v.compareAtPrice} onChange={(e) => setVar(i, { compareAtPrice: e.target.value })} helperText="“Was” price" InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }} {...num} /></Grid2>
                            <Grid2 size={{ xs: 6, sm: 4 }}><TextField fullWidth size="small" type="number" label="Your cost" value={v.costPerItem} onChange={(e) => setVar(i, { costPerItem: e.target.value })} helperText="For profit reports" InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }} {...num} /></Grid2>
                            <Grid2 size={{ xs: 6, sm: 4 }}><TextField fullWidth size="small" label="SKU" value={v.sku} onChange={(e) => setVar(i, { sku: e.target.value })} /></Grid2>
                            <Grid2 size={{ xs: 6, sm: 4 }}><TextField fullWidth size="small" label="UPC" value={v.upc} onChange={(e) => setVar(i, { upc: e.target.value })} /></Grid2>
                            <Grid2 size={{ xs: 6, sm: 4 }}><TextField fullWidth size="small" type="number" label="In stock" value={v.stock} onChange={(e) => setVar(i, { stock: e.target.value })} disabled={!p.trackInventory} inputProps={{ min: 0, step: 1 }} /></Grid2>
                        </Grid2>
                    </Box>
                ))}
                <Button size="small" startIcon={<AddIcon />} onClick={() => set({ variantsArray: [...p.variantsArray, emptyVariant()] })}>{multi ? "Add another variation" : "Add a variation (size, color, etc.)"}</Button>

                <Box sx={{ marginTop: 2, paddingTop: 1.5, borderTop: "1px dashed", borderColor: "divider" }}>
                    <FormControlLabel control={<Checkbox checked={p.trackInventory} onChange={(e) => set({ trackInventory: e.target.checked })} />} label="Track inventory (count down stock as orders come in)" />
                    {p.trackInventory && <Box sx={{ paddingLeft: 4 }}><FormControlLabel control={<Checkbox checked={p.continueSellingOOS} onChange={(e) => set({ continueSellingOOS: e.target.checked })} />} label="Keep selling when out of stock" /></Box>}
                </Box>
            </Section>

            {/* Sticky action bar — always reachable */}
            <Box sx={{ position: "sticky", bottom: 0, marginTop: 1, paddingY: 1.5, paddingX: 0.5, bgcolor: "background.paper", borderTop: "1px solid", borderColor: "divider", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2, zIndex: 3 }}>
                <Button variant="text" color="inherit" onClick={onCancel}>Cancel</Button>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    {saveErr ? <Typography variant="caption" color="error">{saveErr}</Typography> : (!canCreate && blockHint && <Typography variant="caption" color="text.secondary">{blockHint} to create</Typography>)}
                    <Button variant="contained" size="large" onClick={save} disabled={!canCreate} startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}>{saving ? "Saving…" : "Create product"}</Button>
                </Box>
            </Box>
        </Box>
    );
}

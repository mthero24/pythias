"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useOrg } from "@/components/OrgProvider";
import {
    Box, Container, Typography, Stack, TextField, Button, Card, CardContent,
    Alert, Switch, FormControlLabel, Divider, Chip, IconButton, Select,
    MenuItem, FormControl, InputLabel, Autocomplete, CircularProgress, Table,
    TableHead, TableRow, TableCell, TableBody,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";

const EMPTY_PRODUCT = {
    title: "", sku: "", description: "", brand: "", gender: "", season: "",
    tags: [], category: [], department: [], active: true,
    designRef: null, blank: null,
    variants: [],
    images: [],
};

const EMPTY_VARIANT = { colorName: "", colorHex: "#000000", sizeName: "", sku: "", upc: "", price: 0, wholesalePrice: 0, active: true };

export default function ProductEditPage() {
    const params = useParams();
    const router = useRouter();
    const { org } = useOrg() ?? {};
    const base = org?.slug ? `/${org.slug}` : "";
    const isNew = params.id === "create";

    const [product, setProduct] = useState(EMPTY_PRODUCT);
    const [blanks, setBlanks] = useState([]);
    const [designs, setDesigns] = useState([]);
    const [loading, setLoading] = useState(!isNew);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState(null);
    const [tagInput, setTagInput] = useState("");

    useEffect(() => {
        fetch("/api/admin/blanks").then(r => r.json()).then(d => setBlanks(d.blanks ?? []));
        fetch("/api/admin/designs").then(r => r.json()).then(d => setDesigns(d.designs ?? []));

        if (!isNew) {
            fetch(`/api/admin/products/${params.id}`)
                .then(r => r.json())
                .then(d => {
                    if (d.product) setProduct(d.product);
                    setLoading(false);
                });
        }
    }, []);

    function set(field, value) {
        setProduct(p => ({ ...p, [field]: value }));
    }

    function setVariant(idx, field, value) {
        setProduct(p => {
            const variants = [...p.variants];
            variants[idx] = { ...variants[idx], [field]: field === "price" || field === "wholesalePrice" ? parseFloat(value) || 0 : value };
            return { ...p, variants };
        });
    }

    function addVariant() {
        setProduct(p => ({ ...p, variants: [...p.variants, { ...EMPTY_VARIANT }] }));
    }

    function removeVariant(idx) {
        setProduct(p => ({ ...p, variants: p.variants.filter((_, i) => i !== idx) }));
    }

    function generateVariants() {
        const selectedBlank = blanks.find(b => b._id === (product.blank?._id ?? product.blank));
        if (!selectedBlank) return;
        const generated = [];
        for (const color of selectedBlank.colors ?? []) {
            for (const size of selectedBlank.sizes ?? []) {
                const existing = product.variants.find(v => v.colorName === color.name && v.sizeName === size.name);
                if (!existing) {
                    generated.push({
                        ...EMPTY_VARIANT,
                        colorName: color.name,
                        colorHex: color.hex ?? "#000000",
                        sizeName: size.name,
                        sku: `${product.sku}-${color.name.replace(/\s/g, "")}-${size.name}`.toUpperCase(),
                        price: size.retailPrice ?? 0,
                        wholesalePrice: size.wholesaleCost ?? 0,
                    });
                }
            }
        }
        setProduct(p => ({ ...p, variants: [...p.variants, ...generated] }));
    }

    async function save() {
        setSaving(true);
        setMsg(null);
        const method = isNew ? "POST" : "PATCH";
        const url = isNew ? "/api/admin/products" : `/api/admin/products/${params.id}`;
        const res = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ product }),
        });
        const d = await res.json();
        if (d.error) {
            setMsg({ type: "error", text: d.error ?? d.msg ?? "Save failed" });
        } else {
            setMsg({ type: "success", text: "Saved" });
            if (isNew && d.product?._id) router.push(`/products/${d.product._id}`);
        }
        setSaving(false);
    }

    async function deleteProduct() {
        if (!confirm("Delete this product?")) return;
        await fetch(`/api/admin/products/${params.id}`, { method: "DELETE" });
        router.push("/products");
    }

    if (loading) return <Box sx={{ display: "flex", justifyContent: "center", pt: 8 }}><CircularProgress /></Box>;

    const selectedBlank = blanks.find(b => b._id === (product.blank?._id ?? product.blank));

    return (
        <Box sx={{ bgcolor: "background.default", minHeight: "100vh" }}>
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                        <Button href={`${base}/products`} variant="outlined" size="small">← Products</Button>
                        <Typography variant="h6" fontWeight={700}>{isNew ? "New Product" : product.title || "Edit Product"}</Typography>
                    </Stack>
                    <Stack direction="row" spacing={1}>
                        {!isNew && (
                            <Button variant="outlined" color="error" size="small" onClick={deleteProduct}>Delete</Button>
                        )}
                        <Button variant="contained" size="small" onClick={save} disabled={saving}>
                            {saving ? "Saving…" : "Save"}
                        </Button>
                    </Stack>
                </Stack>

                {msg && <Alert severity={msg.type} sx={{ mb: 2 }} onClose={() => setMsg(null)}>{msg.text}</Alert>}

                <Stack spacing={3}>

                    {/* Core info */}
                    <Card variant="outlined">
                        <CardContent>
                            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>Product Details</Typography>
                            <Stack spacing={2}>
                                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                                    <TextField label="Title" value={product.title} onChange={e => set("title", e.target.value)}
                                        fullWidth size="small" required />
                                    <TextField label="SKU" value={product.sku} onChange={e => set("sku", e.target.value.toUpperCase())}
                                        fullWidth size="small" required sx={{ maxWidth: 200 }} />
                                </Stack>
                                <TextField label="Description" value={product.description ?? ""} onChange={e => set("description", e.target.value)}
                                    fullWidth size="small" multiline rows={3} />
                                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                                    <TextField label="Brand" value={product.brand ?? ""} onChange={e => set("brand", e.target.value)} fullWidth size="small" />
                                    <TextField label="Gender" value={product.gender ?? ""} onChange={e => set("gender", e.target.value)} fullWidth size="small" />
                                    <TextField label="Season" value={product.season ?? ""} onChange={e => set("season", e.target.value)} fullWidth size="small" />
                                </Stack>
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <TextField
                                        label="Add tag" value={tagInput} onChange={e => setTagInput(e.target.value)}
                                        size="small"
                                        onKeyDown={e => {
                                            if (e.key === "Enter" && tagInput.trim()) {
                                                e.preventDefault();
                                                set("tags", [...(product.tags ?? []), tagInput.trim()]);
                                                setTagInput("");
                                            }
                                        }}
                                    />
                                    <Stack direction="row" flexWrap="wrap" gap={0.5}>
                                        {(product.tags ?? []).map((t, i) => (
                                            <Chip key={i} label={t} size="small" onDelete={() => set("tags", product.tags.filter((_, j) => j !== i))} />
                                        ))}
                                    </Stack>
                                </Stack>
                                <FormControlLabel
                                    control={<Switch checked={product.active} onChange={e => set("active", e.target.checked)} />}
                                    label="Active"
                                />
                            </Stack>
                        </CardContent>
                    </Card>

                    {/* Design + Blank */}
                    <Card variant="outlined">
                        <CardContent>
                            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>Design &amp; Blank</Typography>
                            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Design</InputLabel>
                                    <Select label="Design" value={product.designRef?._id ?? product.designRef ?? ""}
                                        onChange={e => set("designRef", e.target.value)}>
                                        <MenuItem value=""><em>None</em></MenuItem>
                                        {designs.map(d => <MenuItem key={d._id} value={d._id}>{d.sku} — {d.name}</MenuItem>)}
                                    </Select>
                                </FormControl>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Blank</InputLabel>
                                    <Select label="Blank" value={product.blank?._id ?? product.blank ?? ""}
                                        onChange={e => set("blank", e.target.value)}>
                                        <MenuItem value=""><em>None</em></MenuItem>
                                        {blanks.map(b => <MenuItem key={b._id} value={b._id}>{b.code} — {b.name}</MenuItem>)}
                                    </Select>
                                </FormControl>
                            </Stack>
                        </CardContent>
                    </Card>

                    {/* Variants */}
                    <Card variant="outlined">
                        <CardContent>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                                <Typography variant="subtitle1" fontWeight={700}>Variants ({product.variants?.length ?? 0})</Typography>
                                <Stack direction="row" spacing={1}>
                                    {selectedBlank && (
                                        <Button size="small" variant="outlined" onClick={generateVariants}>
                                            Auto-generate from blank
                                        </Button>
                                    )}
                                    <Button size="small" startIcon={<AddIcon />} onClick={addVariant}>Add row</Button>
                                </Stack>
                            </Stack>

                            {(product.variants ?? []).length > 0 ? (
                                <Box sx={{ overflowX: "auto" }}>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Color</TableCell>
                                                <TableCell>Size</TableCell>
                                                <TableCell>SKU</TableCell>
                                                <TableCell>UPC</TableCell>
                                                <TableCell>Price</TableCell>
                                                <TableCell>Wholesale</TableCell>
                                                <TableCell align="center">Active</TableCell>
                                                <TableCell />
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {product.variants.map((v, i) => (
                                                <TableRow key={i}>
                                                    <TableCell>
                                                        <Stack direction="row" spacing={1} alignItems="center">
                                                            <input type="color" value={v.colorHex ?? "#000000"}
                                                                onChange={e => setVariant(i, "colorHex", e.target.value)}
                                                                style={{ width: 28, height: 28, padding: 0, border: "none", borderRadius: 4, cursor: "pointer" }} />
                                                            <TextField value={v.colorName} onChange={e => setVariant(i, "colorName", e.target.value)}
                                                                size="small" sx={{ width: 110 }} />
                                                        </Stack>
                                                    </TableCell>
                                                    <TableCell>
                                                        <TextField value={v.sizeName} onChange={e => setVariant(i, "sizeName", e.target.value)}
                                                            size="small" sx={{ width: 80 }} />
                                                    </TableCell>
                                                    <TableCell>
                                                        <TextField value={v.sku ?? ""} onChange={e => setVariant(i, "sku", e.target.value.toUpperCase())}
                                                            size="small" sx={{ width: 140 }} inputProps={{ style: { fontFamily: "monospace", fontSize: 12 } }} />
                                                    </TableCell>
                                                    <TableCell>
                                                        <TextField value={v.upc ?? ""} onChange={e => setVariant(i, "upc", e.target.value)}
                                                            size="small" sx={{ width: 130 }} inputProps={{ style: { fontFamily: "monospace", fontSize: 12 } }} />
                                                    </TableCell>
                                                    <TableCell>
                                                        <TextField value={v.price} onChange={e => setVariant(i, "price", e.target.value)}
                                                            size="small" type="number" inputProps={{ min: 0, step: 0.01 }} sx={{ width: 80 }} />
                                                    </TableCell>
                                                    <TableCell>
                                                        <TextField value={v.wholesalePrice} onChange={e => setVariant(i, "wholesalePrice", e.target.value)}
                                                            size="small" type="number" inputProps={{ min: 0, step: 0.01 }} sx={{ width: 80 }} />
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <Switch size="small" checked={v.active !== false}
                                                            onChange={e => setVariant(i, "active", e.target.checked)} />
                                                    </TableCell>
                                                    <TableCell>
                                                        <IconButton size="small" color="error" onClick={() => removeVariant(i)}>
                                                            <DeleteIcon fontSize="small" />
                                                        </IconButton>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </Box>
                            ) : (
                                <Typography variant="body2" color="text.secondary">
                                    No variants yet.{selectedBlank ? ' Click "Auto-generate from blank" to create variants from colors and sizes.' : " Select a blank first, then auto-generate."}
                                </Typography>
                            )}
                        </CardContent>
                    </Card>

                </Stack>
            </Container>
        </Box>
    );
}

"use client";
import { useState } from 'react';
import { Box, Typography, Card, Table, TableHead, TableRow, TableCell, TableBody, Chip, Divider } from '@mui/material';

// Read-only preview for catalog (buy-not-build / imported) products: image gallery + a simple variant
// table. No blank/design/color-swatch assumptions (unlike the POD preview).
const money = (n) => (typeof n === "number" && n > 0 ? `$${n.toFixed(2)}` : "—");

export function CatalogPreview({ product }) {
    const p = product || {};
    const images = (p.productImages || []).map((i) => i.image || i.url).filter(Boolean);
    const [active, setActive] = useState(0);
    const variants = p.variantsArray || [];

    return (
        <Box sx={{ maxWidth: 900, margin: "0 auto" }}>
            <Typography variant="h5" sx={{ fontWeight: 700, textAlign: "center", mb: 2 }}>{p.title || "Product"}</Typography>
            <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                <Box sx={{ flex: "1 1 320px" }}>
                    <Box sx={{ aspectRatio: "1 / 1", border: "1px solid #eee", borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center", background: "#fff", overflow: "hidden" }}>
                        {images[active] ? <img src={images[active]} alt="" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} /> : <Typography color="text.secondary">No image</Typography>}
                    </Box>
                    {images.length > 1 && (
                        <Box sx={{ display: "flex", gap: 1, mt: 1, flexWrap: "wrap" }}>
                            {images.map((img, i) => (
                                <Box key={i} onClick={() => setActive(i)} sx={{ width: 56, height: 56, border: i === active ? "2px solid" : "1px solid", borderColor: i === active ? "primary.main" : "divider", borderRadius: 1, overflow: "hidden", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", background: "#fff" }}>
                                    <img src={img} alt="" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                                </Box>
                            ))}
                        </Box>
                    )}
                </Box>
                <Box sx={{ flex: "1 1 320px" }}>
                    {p.brand && <Chip label={p.brand} size="small" sx={{ mb: 1 }} />}
                    {p.description && <Typography variant="body2" color="text.secondary" sx={{ mb: 2, whiteSpace: "pre-wrap" }}>{p.description}</Typography>}
                    {p.sku && <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>SKU: {p.sku}</Typography>}
                    {p.source?.supplier && <Chip size="small" label={`Sourced from ${String(p.source.supplier).toUpperCase()}`} sx={{ mt: 1 }} />}
                    {(p.tags || []).length > 0 && <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 1.5 }}>{p.tags.map((t, i) => <Chip key={i} size="small" variant="outlined" label={t} />)}</Box>}
                </Box>
            </Box>

            <Divider sx={{ my: 3 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>Variants ({variants.length})</Typography>
            <Card variant="outlined">
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>Option</TableCell><TableCell>SKU</TableCell>
                            <TableCell align="right">Price</TableCell><TableCell align="right">Cost</TableCell>
                            <TableCell align="right">In stock</TableCell><TableCell>UPC</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {variants.map((v, i) => (
                            <TableRow key={i}>
                                <TableCell>{v.name || "—"}</TableCell>
                                <TableCell sx={{ fontFamily: "monospace", fontSize: ".8rem" }}>{v.sku || "—"}</TableCell>
                                <TableCell align="right">{money(v.price)}</TableCell>
                                <TableCell align="right">{money(v.costPerItem)}</TableCell>
                                <TableCell align="right">{p.trackInventory ? (v.stock ?? 0) : "—"}</TableCell>
                                <TableCell sx={{ fontFamily: "monospace", fontSize: ".75rem" }}>{v.upc || "—"}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>
        </Box>
    );
}

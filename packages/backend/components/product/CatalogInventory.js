"use client";
import { useState } from 'react';
import { Box, Typography, Card, Table, TableHead, TableRow, TableCell, TableBody, Chip, Button } from '@mui/material';
import axios from 'axios';

// On-hand inventory for catalog (buy-not-build / imported) products, which store stock on the variant
// (not the POD PlatformInventory model). Shows stock, reorder thresholds, pending reorders, and a
// "Receive" action that adds a delivered reorder to stock.
export function CatalogInventory({ products = [] }) {
    const [rows, setRows] = useState(products);
    const [busy, setBusy] = useState("");

    if (!rows.length) return null;

    const receive = async (productId, sku) => {
        setBusy(productId + sku);
        try {
            const { data } = await axios.post("/api/admin/sourcing/reorder", { receive: { productId, sku } });
            if (data.ok) {
                setRows((rs) => rs.map((p) => p._id === productId
                    ? { ...p, variantsArray: p.variantsArray.map((v) => v.sku === sku ? { ...v, stock: (v.stock || 0) + data.added, pendingReorderQty: 0 } : v) }
                    : p));
            }
        } catch { /* ignore */ } finally { setBusy(""); }
    };

    return (
        <Box sx={{ mb: 4 }}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>Bought / imported products</Typography>
            <Card variant="outlined">
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>Product</TableCell><TableCell>Option</TableCell><TableCell>SKU</TableCell>
                            <TableCell align="right">On hand</TableCell><TableCell align="right">Reorder at</TableCell>
                            <TableCell align="right">Restock to</TableCell><TableCell align="right">Pending</TableCell>
                            <TableCell>Supplier</TableCell><TableCell />
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {rows.flatMap((p) => (p.variantsArray || []).map((v, i) => (
                            <TableRow key={`${p._id}-${i}`}>
                                <TableCell>{i === 0 ? p.title : ""}</TableCell>
                                <TableCell>{v.name || "—"}</TableCell>
                                <TableCell sx={{ fontFamily: "monospace", fontSize: ".8rem" }}>{v.sku || "—"}</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 600, color: (v.stock || 0) <= (v.reorderPoint || 0) && (v.reorderPoint || 0) > 0 ? "error.main" : "inherit" }}>{v.stock ?? 0}</TableCell>
                                <TableCell align="right">{v.reorderPoint || "—"}</TableCell>
                                <TableCell align="right">{v.reorderTo || "—"}</TableCell>
                                <TableCell align="right">{v.pendingReorderQty > 0 ? <Chip size="small" color="warning" label={v.pendingReorderQty} /> : "—"}</TableCell>
                                <TableCell>{p.source?.supplier ? String(p.source.supplier).toUpperCase() : "—"}</TableCell>
                                <TableCell>{v.pendingReorderQty > 0 && <Button size="small" disabled={busy === p._id + v.sku} onClick={() => receive(p._id, v.sku)}>{busy === p._id + v.sku ? "…" : "Receive"}</Button>}</TableCell>
                            </TableRow>
                        )))}
                    </TableBody>
                </Table>
            </Card>
        </Box>
    );
}

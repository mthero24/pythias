"use client";
import { useState } from 'react';
import { Box, Typography, Card, Table, TableHead, TableRow, TableCell, TableBody, Chip, Button, Alert, CircularProgress, TextField, InputAdornment, Modal, IconButton, Tooltip } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloseIcon from '@mui/icons-material/Close';
import axios from 'axios';
import { CatalogProductCreate } from './CatalogProductCreate';
import { CatalogPreview } from './CatalogPreview';

const modalStyle = { position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "92%", maxWidth: 980, maxHeight: "90vh", bgcolor: "background.paper", boxShadow: 24, p: 3, overflow: "auto", borderRadius: 2 };

// On-hand inventory + reordering for catalog (buy-not-build / imported) products. Stock lives on the
// variant (not the POD PlatformInventory model). This is where sellers place restock orders with the
// supplier — a low-stock sweep, per-variant manual order, and a "Receive" action that adds delivered
// reorders to stock.
export function CatalogInventory({ products = [] }) {
    const [rows, setRows] = useState(products);
    const [busy, setBusy] = useState("");
    const [running, setRunning] = useState(false);
    const [msg, setMsg] = useState(null);
    const [q, setQ] = useState("");
    const [editP, setEditP] = useState(null);
    const [previewP, setPreviewP] = useState(null);

    const term = q.trim().toLowerCase();
    const filtered = term
        ? rows.map((p) => ({ ...p, variantsArray: (p.variantsArray || []).filter((v) => `${p.title} ${v.name} ${v.sku} ${v.upc || ""}`.toLowerCase().includes(term)) })).filter((p) => p.variantsArray.length)
        : rows;

    const setVar = (productId, sku, patch) => setRows((rs) => rs.map((p) => p._id === productId
        ? { ...p, variantsArray: p.variantsArray.map((v) => v.sku === sku ? { ...v, ...patch } : v) } : p));

    // Save a variant's reorder thresholds (on blur of the inline fields).
    const saveLevels = async (productId, sku) => {
        const v = rows.find((x) => x._id === productId)?.variantsArray.find((x) => x.sku === sku);
        if (!v) return;
        try { await axios.post("/api/admin/sourcing/reorder", { levels: { productId, sku, reorderPoint: Number(v.reorderPoint) || 0, reorderTo: Number(v.reorderTo) || 0 } }); }
        catch { /* ignore */ }
    };

    const runSweep = async () => {
        setRunning(true); setMsg(null);
        try {
            const { data } = await axios.post("/api/admin/sourcing/reorder", {});
            if (data.error) { setMsg({ severity: "error", text: data.error }); return; }
            setRows((rs) => rs.map((p) => ({ ...p, variantsArray: p.variantsArray.map((v) => {
                const hit = (data.results || []).find((r) => r.ok && r.sku === v.sku);
                return hit ? { ...v, pendingReorderQty: hit.qty } : v;
            }) })));
            setMsg({ severity: data.placed ? "success" : "info", text: data.placed ? `${data.placed} restock order(s) placed.` : "Nothing was low on stock." });
        } catch (e) { setMsg({ severity: "error", text: e.response?.data?.error || "Reorder failed." }); }
        finally { setRunning(false); }
    };

    const orderOne = async (productId, sku) => {
        const qty = parseInt(window.prompt("How many units to order from the supplier?", "10"), 10);
        if (!qty || qty < 1) return;
        setBusy(productId + sku); setMsg(null);
        try {
            const { data } = await axios.post("/api/admin/sourcing/reorder", { order: { productId, sku, qty } });
            if (data.ok) { setVar(productId, sku, { pendingReorderQty: data.qty }); setMsg({ severity: "success", text: `Ordered ${data.qty} units (${sku}). Pay the draft in your supplier account.` }); }
            else setMsg({ severity: "error", text: data.error || "Order failed." });
        } catch (e) { setMsg({ severity: "error", text: e.response?.data?.error || "Order failed." }); }
        finally { setBusy(""); }
    };

    const receive = async (productId, sku) => {
        setBusy(productId + sku);
        try {
            const { data } = await axios.post("/api/admin/sourcing/reorder", { receive: { productId, sku } });
            if (data.ok) setRows((rs) => rs.map((p) => p._id === productId
                ? { ...p, variantsArray: p.variantsArray.map((v) => v.sku === sku ? { ...v, stock: (v.stock || 0) + data.added, pendingReorderQty: 0 } : v) } : p));
        } catch { /* ignore */ } finally { setBusy(""); }
    };

    return (
        <Box sx={{ mb: 4 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1, flexWrap: "wrap", gap: 1 }}>
                <Typography variant="h6" fontWeight={700}>Bought / imported products</Typography>
                <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
                    <TextField size="small" placeholder="Search name, SKU, UPC…" value={q} onChange={(e) => setQ(e.target.value)} InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }} sx={{ width: 240 }} />
                    <Button variant="contained" size="small" onClick={runSweep} disabled={running} startIcon={running ? <CircularProgress size={14} color="inherit" /> : null}>{running ? "Ordering…" : "Reorder low stock"}</Button>
                </Box>
            </Box>
            {msg && <Alert severity={msg.severity} sx={{ mb: 1.5 }} onClose={() => setMsg(null)}>{msg.text}</Alert>}
            <Card variant="outlined">
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>Product</TableCell><TableCell>Option</TableCell><TableCell>SKU</TableCell>
                            <TableCell align="right">On hand</TableCell><TableCell align="right">Reorder at</TableCell>
                            <TableCell align="right">Restock to</TableCell><TableCell align="right">Pending</TableCell>
                            <TableCell>Supplier</TableCell><TableCell align="right">Order</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filtered.length === 0 && (
                            <TableRow><TableCell colSpan={9} align="center" sx={{ py: 3, color: "text.secondary" }}>{rows.length === 0 ? "No bought or imported products yet." : "No matches."}</TableCell></TableRow>
                        )}
                        {filtered.flatMap((p) => (p.variantsArray || []).map((v, i) => {
                            const pending = Number(v.pendingReorderQty) || 0;
                            const low = (v.reorderPoint || 0) > 0 && (v.stock || 0) <= (v.reorderPoint || 0);
                            return (
                                <TableRow key={`${p._id}-${i}`}>
                                    <TableCell>{i === 0 ? (
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.25 }}>
                                            <span>{p.title}</span>
                                            <Tooltip title="Edit"><IconButton size="small" onClick={() => setEditP(p)}><EditIcon sx={{ fontSize: "1rem" }} /></IconButton></Tooltip>
                                            <Tooltip title="Preview"><IconButton size="small" onClick={() => setPreviewP(p)}><VisibilityIcon sx={{ fontSize: "1rem" }} /></IconButton></Tooltip>
                                        </Box>
                                    ) : ""}</TableCell>
                                    <TableCell>{v.name || "—"}</TableCell>
                                    <TableCell sx={{ fontFamily: "monospace", fontSize: ".8rem" }}>{v.sku || "—"}</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 600, color: low ? "error.main" : "inherit" }}>{v.stock ?? 0}</TableCell>
                                    <TableCell align="right">{v.supplierVid
                                        ? <TextField variant="standard" type="number" value={v.reorderPoint ?? ""} onChange={(e) => setVar(p._id, v.sku, { reorderPoint: e.target.value })} onBlur={() => saveLevels(p._id, v.sku)} inputProps={{ min: 0, style: { textAlign: "right", width: 46 } }} />
                                        : "—"}</TableCell>
                                    <TableCell align="right">{v.supplierVid
                                        ? <TextField variant="standard" type="number" value={v.reorderTo ?? ""} onChange={(e) => setVar(p._id, v.sku, { reorderTo: e.target.value })} onBlur={() => saveLevels(p._id, v.sku)} inputProps={{ min: 0, style: { textAlign: "right", width: 46 } }} />
                                        : "—"}</TableCell>
                                    <TableCell align="right">{pending > 0 ? <Chip size="small" color="warning" label={pending} /> : "—"}</TableCell>
                                    <TableCell>{p.source?.supplier ? String(p.source.supplier).toUpperCase() : "—"}</TableCell>
                                    <TableCell align="right">
                                        {pending > 0
                                            ? <Button size="small" color="success" disabled={busy === p._id + v.sku} onClick={() => receive(p._id, v.sku)}>{busy === p._id + v.sku ? "…" : "Receive"}</Button>
                                            : v.supplierVid
                                                ? <Button size="small" disabled={busy === p._id + v.sku} onClick={() => orderOne(p._id, v.sku)}>{busy === p._id + v.sku ? "…" : "Order"}</Button>
                                                : "—"}
                                    </TableCell>
                                </TableRow>
                            );
                        }))}
                    </TableBody>
                </Table>
            </Card>

            <Modal open={!!editP} onClose={() => setEditP(null)}>
                <Box sx={modalStyle}>
                    <Box sx={{ display: "flex", justifyContent: "flex-end" }}><IconButton onClick={() => setEditP(null)}><CloseIcon /></IconButton></Box>
                    {editP && <CatalogProductCreate editProduct={editP} onSaved={() => { setEditP(null); if (typeof window !== "undefined") window.location.reload(); }} onCancel={() => setEditP(null)} />}
                </Box>
            </Modal>
            <Modal open={!!previewP} onClose={() => setPreviewP(null)}>
                <Box sx={modalStyle}>
                    <Box sx={{ display: "flex", justifyContent: "flex-end" }}><IconButton onClick={() => setPreviewP(null)}><CloseIcon /></IconButton></Box>
                    {previewP && <CatalogPreview product={previewP} />}
                </Box>
            </Modal>
        </Box>
    );
}

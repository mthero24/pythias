"use client";
import { useState, useEffect } from 'react';
import { Box, Typography, Card, Table, TableHead, TableRow, TableCell, TableBody, Chip, Button, Alert, CircularProgress, TextField, InputAdornment, Modal, IconButton, Tooltip, Checkbox } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloseIcon from '@mui/icons-material/Close';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
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
    const [selected, setSelected] = useState(() => new Set());
    const [suggestP, setSuggestP] = useState(null);     // product whose levels we're suggesting
    const [suggestData, setSuggestData] = useState(null);
    const [suggesting, setSuggesting] = useState(false);
    const [applying, setApplying] = useState(false);

    const isLow = (v) => v.supplierVid && (v.reorderPoint || 0) > 0 && (v.stock || 0) <= (v.reorderPoint || 0) && (v.reorderTo || 0) > (v.stock || 0) && !(Number(v.pendingReorderQty) > 0);
    // Pre-select the low-stock items so reordering them is one click — but the seller can pick/unpick.
    useEffect(() => {
        const s = new Set();
        rows.forEach((p) => (p.variantsArray || []).forEach((v) => { if (isLow(v)) s.add(`${p._id}|${v.sku}`); }));
        setSelected(s);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    const toggle = (key) => setSelected((s) => { const n = new Set(s); n.has(key) ? n.delete(key) : n.add(key); return n; });

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

    // Save a manual on-hand count (direct adjustment — they just type the new number).
    const saveOnHand = async (productId, sku) => {
        const v = rows.find((x) => x._id === productId)?.variantsArray.find((x) => x.sku === sku);
        if (!v) return;
        try { await axios.post("/api/admin/sourcing/reorder", { onHand: { productId, sku, stock: Number(v.stock) || 0 } }); }
        catch { /* ignore */ }
    };

    // Reorder only the variants the seller selected (low-stock are pre-checked). Each is restocked up to
    // its "restock to" level (or +1 as a floor), charged to the wallet.
    const reorderSelected = async () => {
        const picks = [];
        rows.forEach((p) => (p.variantsArray || []).forEach((v) => {
            const key = `${p._id}|${v.sku}`;
            if (selected.has(key) && v.supplierVid && !(Number(v.pendingReorderQty) > 0)) {
                picks.push({ productId: p._id, sku: v.sku, qty: Math.max(1, (Number(v.reorderTo) || 0) - (Number(v.stock) || 0)) });
            }
        }));
        if (!picks.length) { setMsg({ severity: "info", text: "Select the items you want to reorder first." }); return; }
        setRunning(true); setMsg(null);
        let placed = 0; const errs = [];
        for (const pk of picks) {
            try {
                const { data } = await axios.post("/api/admin/sourcing/reorder", { order: { productId: pk.productId, sku: pk.sku, qty: pk.qty } });
                if (data.ok) { setVar(pk.productId, pk.sku, { pendingReorderQty: data.qty }); placed++; }
                else errs.push(data.error || pk.sku);
            } catch (e) { errs.push(e.response?.data?.error || pk.sku); }
        }
        setSelected(new Set());
        setMsg({ severity: placed ? "success" : "error", text: `${placed} order(s) placed.${errs.length ? ` ${errs.length} couldn't: ${errs.slice(0, 2).join("; ")}` : ""}` });
        setRunning(false);
    };

    // AI: analyze sales velocity for one product and suggest reorder levels per variant.
    const runSuggest = async (p) => {
        setSuggestP(p); setSuggestData(null); setSuggesting(true);
        try {
            const { data } = await axios.post("/api/admin/sourcing/suggest", { productId: p._id });
            if (data.ok) setSuggestData(data);
            else { setSuggestData(null); setSuggestP(null); setMsg({ severity: "error", text: data.error || "Couldn't generate suggestions." }); }
        } catch (e) { setSuggestData(null); setSuggestP(null); setMsg({ severity: "error", text: e.response?.data?.error || "Couldn't generate suggestions." }); }
        finally { setSuggesting(false); }
    };

    // Apply the suggested levels to the product's variants and persist them.
    const applySuggestions = async () => {
        if (!suggestP || !suggestData) return;
        setApplying(true);
        try {
            for (const s of suggestData.suggestions) {
                setVar(suggestP._id, s.sku, { reorderPoint: s.reorderPoint, reorderTo: s.restockTo });
                await axios.post("/api/admin/sourcing/reorder", { levels: { productId: suggestP._id, sku: s.sku, reorderPoint: s.reorderPoint, reorderTo: s.restockTo } });
            }
            setMsg({ severity: "success", text: "Suggested reorder levels applied." });
            setSuggestP(null); setSuggestData(null);
        } catch (e) { setMsg({ severity: "error", text: e.response?.data?.error || "Couldn't apply suggestions." }); }
        finally { setApplying(false); }
    };

    const orderOne = async (productId, sku) => {
        const qty = parseInt(window.prompt("How many units to order from the supplier?", "10"), 10);
        if (!qty || qty < 1) return;
        setBusy(productId + sku); setMsg(null);
        try {
            const { data } = await axios.post("/api/admin/sourcing/reorder", { order: { productId, sku, qty } });
            if (data.ok) { setVar(productId, sku, { pendingReorderQty: data.qty }); setMsg({ severity: "success", text: `Ordered ${data.qty} units (${sku})${data.billedCents ? ` — $${(data.billedCents / 100).toFixed(2)} charged to your wallet` : ""}.` }); }
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
                    <Button variant="contained" size="small" onClick={reorderSelected} disabled={running || selected.size === 0} startIcon={running ? <CircularProgress size={14} color="inherit" /> : null}>{running ? "Ordering…" : `Reorder selected (${selected.size})`}</Button>
                </Box>
            </Box>
            {msg && <Alert severity={msg.severity} sx={{ mb: 1.5 }} onClose={() => setMsg(null)}>{msg.text}</Alert>}
            <Card variant="outlined">
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell padding="checkbox" />
                            <TableCell>Product</TableCell><TableCell>Option</TableCell><TableCell>SKU</TableCell>
                            <TableCell align="right">On hand</TableCell><TableCell align="right">Reorder at</TableCell>
                            <TableCell align="right">Restock to</TableCell><TableCell align="right">Pending</TableCell>
                            <TableCell>Supplier</TableCell><TableCell align="right">Order</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filtered.length === 0 && (
                            <TableRow><TableCell colSpan={10} align="center" sx={{ py: 3, color: "text.secondary" }}>{rows.length === 0 ? "No bought or imported products yet." : "No matches."}</TableCell></TableRow>
                        )}
                        {filtered.flatMap((p) => (p.variantsArray || []).map((v, i) => {
                            const pending = Number(v.pendingReorderQty) || 0;
                            const low = (v.reorderPoint || 0) > 0 && (v.stock || 0) <= (v.reorderPoint || 0);
                            const key = `${p._id}|${v.sku}`;
                            return (
                                <TableRow key={`${p._id}-${i}`} selected={selected.has(key)}>
                                    <TableCell padding="checkbox">
                                        {v.supplierVid && pending === 0
                                            ? <Checkbox size="small" checked={selected.has(key)} onChange={() => toggle(key)} />
                                            : null}
                                    </TableCell>
                                    <TableCell>{i === 0 ? (
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.25 }}>
                                            <span>{p.title}</span>
                                            <Tooltip title="Edit"><IconButton size="small" onClick={() => setEditP(p)}><EditIcon sx={{ fontSize: "1rem" }} /></IconButton></Tooltip>
                                            <Tooltip title="Preview"><IconButton size="small" onClick={() => setPreviewP(p)}><VisibilityIcon sx={{ fontSize: "1rem" }} /></IconButton></Tooltip>
                                            <Tooltip title="Suggest reorder levels with AI"><IconButton size="small" color="secondary" onClick={() => runSuggest(p)}><AutoAwesomeIcon sx={{ fontSize: "1rem" }} /></IconButton></Tooltip>
                                        </Box>
                                    ) : ""}</TableCell>
                                    <TableCell>{v.name || "—"}</TableCell>
                                    <TableCell sx={{ fontFamily: "monospace", fontSize: ".8rem" }}>{v.sku || "—"}</TableCell>
                                    <TableCell align="right">
                                        <TextField variant="standard" type="number" value={v.stock ?? 0}
                                            onChange={(e) => setVar(p._id, v.sku, { stock: e.target.value })}
                                            onBlur={() => saveOnHand(p._id, v.sku)}
                                            inputProps={{ min: 0, style: { textAlign: "right", width: 50, fontWeight: 600, color: low ? "#d32f2f" : "inherit" } }} />
                                    </TableCell>
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

            <Modal open={!!suggestP} onClose={() => { if (!applying) { setSuggestP(null); setSuggestData(null); } }}>
                <Box sx={{ ...modalStyle, maxWidth: 760 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                        <Typography variant="h6" fontWeight={700}>Suggested reorder levels</Typography>
                        <IconButton onClick={() => { if (!applying) { setSuggestP(null); setSuggestData(null); } }}><CloseIcon /></IconButton>
                    </Box>
                    <Typography variant="caption" color="text.secondary">{suggestP?.title}</Typography>
                    {suggesting && <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 4, justifyContent: "center", color: "text.secondary" }}><CircularProgress size={20} /><span>Analyzing your sales…</span></Box>}
                    {suggestData && (
                        <>
                            <Table size="small" sx={{ mt: 1.5 }}>
                                <TableHead><TableRow>
                                    <TableCell>Option</TableCell><TableCell align="right">On hand</TableCell>
                                    <TableCell align="right">Sold 30d</TableCell><TableCell align="right">~/day</TableCell>
                                    <TableCell align="right">Now (at→to)</TableCell><TableCell align="right">Suggested (at→to)</TableCell>
                                </TableRow></TableHead>
                                <TableBody>
                                    {suggestData.suggestions.map((s) => (
                                        <TableRow key={s.sku}>
                                            <TableCell><Tooltip title={s.reason || ""}><span>{s.name || s.sku}</span></Tooltip></TableCell>
                                            <TableCell align="right">{s.stock}</TableCell>
                                            <TableCell align="right">{s.sold30}</TableCell>
                                            <TableCell align="right">{s.perDay}</TableCell>
                                            <TableCell align="right" sx={{ color: "text.secondary" }}>{s.currentReorderPoint}→{s.currentReorderTo}</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 700, color: "secondary.main" }}>{s.reorderPoint}→{s.restockTo}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                                {suggestData.aiUsed ? "AI suggestion based on your recent sales velocity and supplier lead time." : "Based on your recent sales velocity (AI unavailable — using the velocity model)."} Hover an option for the reasoning.
                            </Typography>
                            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1.5, mt: 2 }}>
                                <Button color="inherit" disabled={applying} onClick={() => { setSuggestP(null); setSuggestData(null); }}>Cancel</Button>
                                <Button variant="contained" disabled={applying} startIcon={applying ? <CircularProgress size={16} color="inherit" /> : null} onClick={applySuggestions}>{applying ? "Applying…" : "Apply these levels"}</Button>
                            </Box>
                        </>
                    )}
                </Box>
            </Modal>
        </Box>
    );
}

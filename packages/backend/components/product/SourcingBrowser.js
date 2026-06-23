"use client";
import { useState } from 'react';
import { Modal, Box, Typography, TextField, Button, Grid2, Card, CardContent, CircularProgress, Alert, IconButton, Chip } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import axios from 'axios';

// Browse the wholesale network (CJ) to find products to resell. Import a product → its details
// (images, variants, wholesale cost, suggested retail, UPC, weight) prefill CatalogProductCreate.
const money = (c) => `$${((c || 0) / 100).toFixed(2)}`;

export function SourcingBrowser({ open, onClose, onImport }) {
    const [q, setQ] = useState("");
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");
    const [res, setRes] = useState(null);          // { products, total }
    const [importing, setImporting] = useState(""); // pid being imported

    const search = async () => {
        if (!q.trim()) return;
        setLoading(true); setErr(""); setRes(null);
        try {
            const { data } = await axios.post("/api/admin/sourcing/search", { keyword: q, pageSize: 24 });
            if (data.error) setErr(data.error); else setRes(data);
        } catch (e) { setErr(e.response?.data?.error || "Search failed."); }
        finally { setLoading(false); }
    };

    const importProduct = async (pid) => {
        setImporting(pid); setErr("");
        try {
            const { data } = await axios.post("/api/admin/sourcing/import", { pid });
            if (data.error) { setErr(data.error); return; }
            onImport?.(data.product);
        } catch (e) { setErr(e.response?.data?.error || "Import failed."); }
        finally { setImporting(""); }
    };

    return (
        <Modal open={open} onClose={onClose}>
            <Box sx={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "92%", height: "90%", bgcolor: "background.paper", boxShadow: 24, p: 3, overflow: "auto", borderRadius: 2 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                    <Box>
                        <Typography variant="h6" fontWeight={700}>Find wholesale products to sell</Typography>
                        <Typography variant="caption" color="text.secondary">Search our wholesale network. Import a product to set your price and add it to your store.</Typography>
                    </Box>
                    <IconButton onClick={onClose}><CloseIcon /></IconButton>
                </Box>

                <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
                    <TextField fullWidth size="small" placeholder="Search products (e.g. phone case, kitchen gadget, toys)" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") search(); }} autoFocus />
                    <Button variant="contained" onClick={search} disabled={loading} startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <SearchIcon />}>Search</Button>
                </Box>

                {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}
                {res && <Typography variant="caption" color="text.secondary">{(res.total ?? res.products.length).toLocaleString()} results</Typography>}

                <Grid2 container spacing={1.5} sx={{ mt: 0.5 }}>
                    {(res?.products || []).map((p) => (
                        <Grid2 key={p.pid} size={{ xs: 6, sm: 4, md: 3, lg: 2 }}>
                            <Card variant="outlined" sx={{ borderRadius: 2, height: "100%", display: "flex", flexDirection: "column" }}>
                                <Box sx={{ aspectRatio: "1 / 1", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "#fafafa", p: 1 }}>
                                    {p.image ? <img src={p.image} alt="" loading="lazy" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} /> : null}
                                </Box>
                                <CardContent sx={{ p: 1, flex: 1, display: "flex", flexDirection: "column", "&:last-child": { pb: 1 } }}>
                                    <Typography variant="body2" sx={{ fontWeight: 500, lineHeight: 1.25, mb: 0.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", minHeight: "2.4em" }} title={p.title}>{p.title}</Typography>
                                    <Typography variant="caption" color="text.secondary">Wholesale {money(p.costCents)}</Typography>
                                    {p.category && <Chip label={p.category} size="small" sx={{ alignSelf: "flex-start", mt: 0.5, height: 18, fontSize: ".6rem" }} />}
                                    <Box sx={{ flex: 1 }} />
                                    <Button size="small" variant="contained" sx={{ mt: 1 }} disabled={importing === p.pid} onClick={() => importProduct(p.pid)}>{importing === p.pid ? "Importing…" : "Import"}</Button>
                                </CardContent>
                            </Card>
                        </Grid2>
                    ))}
                </Grid2>

                {!res && !loading && <Box sx={{ textAlign: "center", py: 6, color: "text.secondary" }}><Typography>Search to find products from our wholesale network.</Typography></Box>}
            </Box>
        </Modal>
    );
}

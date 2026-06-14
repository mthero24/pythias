"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import {
    Box, Typography, TextField, InputAdornment, Chip, CircularProgress,
    Card, CardContent, Button, Tabs, Tab, Dialog, DialogTitle, DialogContent,
    DialogActions, Checkbox, FormControlLabel, Alert, Snackbar, Tooltip, IconButton,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CheckroomIcon from "@mui/icons-material/Checkroom";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";

const CARD_SHADOW = "0px 0px 10px rgba(0,0,0,.1)";
const ACCENT = "linear-gradient(135deg, #f59e0b 0%, #f97316 100%)";

function dollars(cents) {
    return `$${((cents ?? 0) / 100).toFixed(2)}`;
}

// ── Browse: one available garment (provider-agnostic) ────────────────────────
function GarmentCard({ garment, onAdd }) {
    const img = garment.images?.[0]?.image ?? garment.images?.[0] ?? null;
    return (
        <Card sx={{ bgcolor: "#fff", borderRadius: 2, boxShadow: CARD_SHADOW }}>
            <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, mb: 1.25 }}>
                    {img && (
                        <Box component="img" src={img} alt={garment.name}
                            sx={{ width: 56, height: 56, objectFit: "cover", borderRadius: 1, flexShrink: 0, bgcolor: "#f3f4f6" }}
                        />
                    )}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography fontWeight={700} sx={{ color: "#1a1a2e", fontSize: "0.9rem" }} noWrap>
                            {garment.name}
                        </Typography>
                        <Typography sx={{ fontSize: "0.72rem", color: "#6b7280" }}>
                            {garment.manufacturerStyle} &middot; {garment.colors.length} color{garment.colors.length !== 1 ? "s" : ""} &middot; {garment.providerCount} provider{garment.providerCount !== 1 ? "s" : ""}
                        </Typography>
                        <Box sx={{ display: "flex", gap: 1.5, mt: 0.4 }}>
                            <Typography sx={{ fontSize: "0.78rem", color: "#6b7280" }}>
                                Cost <b style={{ color: "#1a1a2e" }}>{dollars(garment.platformPrice)}</b>
                            </Typography>
                            {garment.defaultRetail > 0 && (
                                <Typography sx={{ fontSize: "0.78rem", color: "#6b7280" }}>
                                    Retail <b style={{ color: "#16a34a" }}>{dollars(garment.defaultRetail)}</b>
                                </Typography>
                            )}
                        </Box>
                    </Box>
                </Box>

                {/* Color swatches */}
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mb: 1 }}>
                    {garment.colors.slice(0, 12).map(c => (
                        <Tooltip key={c.colorId} title={c.name}>
                            <Box sx={{ width: 16, height: 16, borderRadius: "50%", bgcolor: c.hex || "#bbb", border: "1px solid rgba(0,0,0,0.15)" }} />
                        </Tooltip>
                    ))}
                    {garment.colors.length > 12 && (
                        <Typography sx={{ fontSize: "0.7rem", color: "#9ca3af" }}>+{garment.colors.length - 12}</Typography>
                    )}
                </Box>

                {/* Sizes */}
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mb: 1.5 }}>
                    {garment.sizes.map(s => (
                        <Chip key={s} size="small" label={s} variant="outlined"
                            sx={{ height: 20, fontSize: "0.66rem", color: "#4b5563", borderColor: "#e5e7eb" }}
                        />
                    ))}
                </Box>

                {garment.inCatalog ? (
                    <Button fullWidth size="small" disabled startIcon={<CheckCircleIcon sx={{ fontSize: "16px !important" }} />}
                        sx={{ color: "#16a34a !important", bgcolor: "rgba(22,163,74,0.08)", textTransform: "none" }}>
                        In Catalog
                    </Button>
                ) : (
                    <Button fullWidth size="small" variant="contained" startIcon={<AddIcon />}
                        onClick={() => onAdd(garment)}
                        sx={{ background: ACCENT, color: "#fff", boxShadow: "none", textTransform: "none", "&:hover": { background: ACCENT, opacity: 0.92, boxShadow: "none" } }}>
                        Add to Catalog
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}

// ── Import dialog: pick colors + sizes, set retail, then POST ─────────────────
function ImportDialog({ garment, onClose, onImported }) {
    const [name, setName]       = useState("");
    const [colors, setColors]   = useState(new Set());
    const [sizes, setSizes]     = useState(new Set());
    const [retail, setRetail]   = useState("");
    const [retailTouched, setRetailTouched] = useState(false);
    const [saving, setSaving]   = useState(false);
    const [error, setError]     = useState(null);

    useEffect(() => {
        if (!garment) return;
        setName(garment.name ?? "");
        setColors(new Set(garment.colors.map(c => c.colorId))); // all selected by default
        setSizes(new Set(garment.sizes));
        setRetail(garment.defaultRetail > 0 ? (garment.defaultRetail / 100).toFixed(2) : "");
        setRetailTouched(false);
        setError(null);
    }, [garment]);

    if (!garment) return null;

    const toggle = (set, setter, key) => {
        const next = new Set(set);
        next.has(key) ? next.delete(key) : next.add(key);
        setter(next);
    };

    const submit = async () => {
        if (!colors.size) return setError("Select at least one color.");
        if (!sizes.size)  return setError("Select at least one size.");
        setSaving(true);
        setError(null);

        const chosenColors = garment.colors.filter(c => colors.has(c.colorId));
        const images = {};
        for (const c of chosenColors) {
            if (c.image) images[c.colorId] = c.image;
        }

        const body = {
            manufacturerStyle: garment.manufacturerStyle,
            name:          name.trim() || garment.name,
            platformPrice: garment.platformPrice,
            colors:        chosenColors.map(c => c.colorId),
            sizes:         [...sizes],
            images,
        };
        // Only send a retail override when the seller changed it — otherwise the
        // per-size provider retail (with size upcharges) is kept.
        if (retailTouched && Number(retail) > 0) body.retailPrice = Number(retail);

        try {
            const res = await fetch("/api/commerce/catalog-blanks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (data.error) { setError(typeof data.error === "string" ? data.error : "Import failed."); return; }
            onImported(garment.manufacturerStyle);
        } catch (e) {
            setError(e.message);
        } finally {
            setSaving(false);
        }
    };

    const fieldSx = {
        "& .MuiOutlinedInput-root": { "& fieldset": { borderColor: "#e5e7eb" }, "&:hover fieldset": { borderColor: "#cbd5e1" } },
    };

    return (
        <Dialog open={!!garment} onClose={saving ? undefined : onClose} maxWidth="sm" fullWidth
            PaperProps={{ sx: { borderRadius: 2 } }}>
            <DialogTitle sx={{ fontWeight: 700, color: "#1a1a2e" }}>
                Add {garment.name}
                <Typography sx={{ fontSize: "0.75rem", color: "#6b7280", fontWeight: 400 }}>
                    {garment.manufacturerStyle} &middot; cost {dollars(garment.platformPrice)}
                </Typography>
            </DialogTitle>
            <DialogContent>
                <Box sx={{ display: "flex", gap: 1.5, mt: 1, mb: 2 }}>
                    <TextField fullWidth size="small" label="Catalog name" value={name}
                        onChange={e => setName(e.target.value)} sx={fieldSx} />
                    <TextField size="small" label="Retail price" value={retail}
                        onChange={e => { setRetail(e.target.value); setRetailTouched(true); }}
                        helperText="Your selling price"
                        InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                        sx={{ width: 170, ...fieldSx }} />
                </Box>

                <Typography sx={{ fontSize: "0.78rem", color: "#374151", fontWeight: 600, mb: 0.75 }}>Colors ({colors.size}/{garment.colors.length})</Typography>
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0, mb: 2, maxHeight: 200, overflowY: "auto" }}>
                    {garment.colors.map(c => (
                        <FormControlLabel key={c.colorId}
                            control={<Checkbox size="small" checked={colors.has(c.colorId)} onChange={() => toggle(colors, setColors, c.colorId)} />}
                            label={
                                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                                    <Box sx={{ width: 14, height: 14, borderRadius: "50%", bgcolor: c.hex || "#bbb", border: "1px solid rgba(0,0,0,0.15)" }} />
                                    <Typography sx={{ fontSize: "0.78rem", color: "#374151" }}>{c.name}</Typography>
                                </Box>
                            }
                        />
                    ))}
                </Box>

                <Typography sx={{ fontSize: "0.78rem", color: "#374151", fontWeight: 600, mb: 0.75 }}>Sizes ({sizes.size}/{garment.sizes.length})</Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mb: 1 }}>
                    {garment.sizes.map(s => {
                        const on = sizes.has(s);
                        return (
                            <Chip key={s} label={s} size="small" onClick={() => toggle(sizes, setSizes, s)}
                                variant={on ? "filled" : "outlined"}
                                sx={{ cursor: "pointer", ...(on ? { bgcolor: "#1a1a2e", color: "#fff" } : { color: "#4b5563", borderColor: "#e5e7eb" }) }}
                            />
                        );
                    })}
                </Box>

                {error && <Alert severity="error" sx={{ mt: 1.5 }}>{error}</Alert>}
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={onClose} disabled={saving} sx={{ color: "#6b7280", textTransform: "none" }}>Cancel</Button>
                <Button onClick={submit} disabled={saving} variant="contained"
                    startIcon={saving ? <CircularProgress size={16} sx={{ color: "#fff" }} /> : <AddIcon />}
                    sx={{ background: ACCENT, boxShadow: "none", textTransform: "none", "&:hover": { background: ACCENT, opacity: 0.92, boxShadow: "none" } }}>
                    {saving ? "Adding…" : "Add to Catalog"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

// ── My Catalog: imported garments ────────────────────────────────────────────
function MyCatalogCard({ blank, onRemove, removing }) {
    const img = blank.images?.[0]?.image ?? null;
    const retail = (blank.sizes ?? []).reduce((mx, s) => Math.max(mx, s.retailPrice ?? 0), 0);
    return (
        <Card sx={{ bgcolor: "#fff", borderRadius: 2, boxShadow: CARD_SHADOW }}>
            <CardContent sx={{ p: 2, display: "flex", alignItems: "center", gap: 1.5, "&:last-child": { pb: 2 } }}>
                {img
                    ? <Box component="img" src={img} alt={blank.name} sx={{ width: 48, height: 48, objectFit: "cover", borderRadius: 1, bgcolor: "#f3f4f6" }} />
                    : <Box sx={{ width: 48, height: 48, borderRadius: 1, bgcolor: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center" }}><CheckroomIcon sx={{ color: "#9ca3af" }} /></Box>}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography fontWeight={700} sx={{ color: "#1a1a2e", fontSize: "0.88rem" }} noWrap>{blank.name}</Typography>
                    <Typography sx={{ fontSize: "0.72rem", color: "#6b7280" }}>
                        {blank.manufacturerStyle || blank.code} &middot; {blank.colors?.length ?? 0} colors &middot; {blank.sizes?.length ?? 0} sizes
                    </Typography>
                </Box>
                <Box sx={{ textAlign: "right" }}>
                    <Typography sx={{ fontSize: "0.7rem", color: "#9ca3af" }}>cost {dollars(blank.platformPrice)}</Typography>
                    {retail > 0 && <Typography sx={{ fontSize: "0.82rem", color: "#16a34a", fontWeight: 700 }}>${retail.toFixed(2)}</Typography>}
                </Box>
                <Tooltip title="Remove from catalog">
                    <span>
                        <IconButton size="small" disabled={removing} onClick={() => onRemove(blank)}
                            sx={{ color: "#9ca3af", "&:hover": { color: "#dc2626", bgcolor: "rgba(220,38,38,0.06)" } }}>
                            {removing ? <CircularProgress size={16} /> : <DeleteOutlineIcon fontSize="small" />}
                        </IconButton>
                    </span>
                </Tooltip>
            </CardContent>
        </Card>
    );
}

export default function CommerceCatalogPage() {
    const [tab, setTab]             = useState(0);
    const [garments, setGarments]   = useState([]);
    const [catalog, setCatalog]     = useState([]);
    const [loading, setLoading]     = useState(true);
    const [search, setSearch]       = useState("");
    const [importing, setImporting] = useState(null);
    const [removingId, setRemovingId] = useState(null);
    const [toast, setToast]         = useState(null);
    const [error, setError]         = useState(null);

    const loadAvailable = useCallback(() => {
        return fetch("/api/commerce/available-blanks")
            .then(r => r.json())
            .then(d => { if (!d.error) setGarments(d.garments ?? []); });
    }, []);
    const loadCatalog = useCallback(() => {
        return fetch("/api/commerce/catalog-blanks")
            .then(r => r.json())
            .then(d => { if (!d.error) setCatalog(d.blanks ?? []); });
    }, []);

    useEffect(() => {
        Promise.all([loadAvailable(), loadCatalog()]).finally(() => setLoading(false));
    }, [loadAvailable, loadCatalog]);

    const onImported = (mfr) => {
        setGarments(gs => gs.map(g => g.manufacturerStyle === mfr ? { ...g, inCatalog: true } : g));
        setImporting(null);
        setToast("Added to your catalog");
        loadCatalog();
    };

    const onRemove = async (blank) => {
        if (!window.confirm(`Remove "${blank.name}" from your catalog?`)) return;
        setRemovingId(blank._id);
        setError(null);
        try {
            const res = await fetch(`/api/commerce/catalog-blanks?id=${blank._id}`, { method: "DELETE" });
            const data = await res.json();
            if (data.error) { setError(typeof data.error === "string" ? data.error : "Could not remove garment"); return; }
            setCatalog(cs => cs.filter(b => b._id !== blank._id));
            setGarments(gs => gs.map(g => g.manufacturerStyle === blank.manufacturerStyle ? { ...g, inCatalog: false } : g));
            setToast("Removed from your catalog");
        } catch (e) {
            setError(e.message);
        } finally {
            setRemovingId(null);
        }
    };

    const filteredGarments = useMemo(() => {
        if (!search.trim()) return garments;
        const q = search.toLowerCase();
        return garments.filter(g =>
            g.name?.toLowerCase().includes(q) ||
            g.manufacturerStyle?.toLowerCase().includes(q) ||
            g.colors.some(c => c.name?.toLowerCase().includes(q))
        );
    }, [garments, search]);

    const fieldSx = {
        bgcolor: "#fff",
        "& .MuiOutlinedInput-root": { "& fieldset": { borderColor: "#e5e7eb" }, "&:hover fieldset": { borderColor: "#cbd5e1" } },
    };

    return (
        <Box sx={{ p: 3, maxWidth: 1100, mx: "auto" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
                <Box sx={{ width: 36, height: 36, borderRadius: 2, background: ACCENT, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <CheckroomIcon sx={{ color: "#fff", fontSize: 20 }} />
                </Box>
                <Box>
                    <Typography variant="h5" fontWeight={700} sx={{ color: "#1a1a2e" }}>Garment Catalog</Typography>
                    <Typography variant="caption" sx={{ color: "#6b7280" }}>
                        Browse blanks available across the fulfillment network and add them to your catalog to build products on
                    </Typography>
                </Box>
            </Box>

            <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2, minHeight: 40, "& .MuiTab-root": { textTransform: "none", minHeight: 40 } }}>
                <Tab label={`Browse Garments${garments.length ? ` (${garments.length})` : ""}`} />
                <Tab label={`My Catalog${catalog.length ? ` (${catalog.length})` : ""}`} />
            </Tabs>

            {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>
            ) : tab === 0 ? (
                <>
                    <TextField fullWidth size="small" placeholder="Search garments, styles, or colors…" value={search}
                        onChange={e => setSearch(e.target.value)}
                        InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: "#9ca3af" }} /></InputAdornment> }}
                        sx={{ mb: 3, ...fieldSx }}
                    />
                    {filteredGarments.length === 0 ? (
                        <Typography sx={{ color: "#9ca3af", textAlign: "center", py: 8 }}>
                            {search ? "No garments match your search." : "No garments available yet. Once providers seed their catalog, blanks appear here."}
                        </Typography>
                    ) : (
                        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "1fr 1fr 1fr" }, gap: 2 }}>
                            {filteredGarments.map(g => <GarmentCard key={g.manufacturerStyle} garment={g} onAdd={setImporting} />)}
                        </Box>
                    )}
                </>
            ) : (
                catalog.length === 0 ? (
                    <Typography sx={{ color: "#9ca3af", textAlign: "center", py: 8 }}>
                        Your catalog is empty. Switch to <strong style={{ color: "#1a1a2e" }}>Browse Garments</strong> to add blanks.
                    </Typography>
                ) : (
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                        {catalog.map(b => <MyCatalogCard key={b._id} blank={b} onRemove={onRemove} removing={removingId === b._id} />)}
                    </Box>
                )
            )}

            <ImportDialog garment={importing} onClose={() => setImporting(null)} onImported={onImported} />

            <Snackbar open={!!toast} autoHideDuration={3000} onClose={() => setToast(null)}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
                <Alert onClose={() => setToast(null)} severity="success" icon={<CheckCircleIcon />}>{toast}</Alert>
            </Snackbar>

            <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
                <Alert onClose={() => setError(null)} severity="error">{error}</Alert>
            </Snackbar>
        </Box>
    );
}

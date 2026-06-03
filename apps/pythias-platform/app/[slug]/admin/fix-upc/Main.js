"use client";
import {
    Box, Container, Typography, Stack, Card, Grid2, Button, Chip,
    TextField, InputAdornment, IconButton, Dialog, DialogTitle,
    DialogContent, DialogActions,
} from "@mui/material";
import { useState, useEffect } from "react";
import QrCode2Icon      from "@mui/icons-material/QrCode2";
import SearchIcon       from "@mui/icons-material/Search";
import CloseIcon        from "@mui/icons-material/Close";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import BrushIcon        from "@mui/icons-material/Brush";
import PaletteIcon      from "@mui/icons-material/Palette";
import CheckCircleIcon  from "@mui/icons-material/CheckCircle";
import CreatableSelect from "react-select/creatable";
import { Search } from "@pythias/backend";
import Image from "next/image";
import axios from "axios";

export function Main({ s, count }) {
    const [records, setRecords] = useState(s);
    const [total, setTotal]     = useState(count);
    const [search, setSearch]   = useState("");
    const [editDesign, setEditDesign]       = useState(null);
    const [editSizeColor, setEditSizeColor] = useState(null);

    const searchSku = async () => {
        if (!search.trim()) return;
        const res = await axios.get(`/api/upc?sku=${search.trim()}`);
        setRecords(res.data.upc ?? []);
        setTotal(res.data.count ?? 0);
        setSearch("");
    };

    const handleUpdate = async (upc) => {
        const res = await axios.put("/api/upc", { upc });
        if (res.data.error) alert(res.data.msg);
        else {
            setRecords(res.data.skus ?? []);
            setTotal(res.data.count ?? 0);
        }
        return res;
    };

    return (
        <Box sx={{ backgroundColor: "background.default", minHeight: "100vh" }}>
            <Container maxWidth="xl" sx={{ py: 4 }}>

                {/* Header */}
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 4, flexWrap: "wrap", gap: 2 }}>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                        <Box sx={{ width: 36, height: 36, borderRadius: 2, background: "linear-gradient(135deg, #f97316 0%, #ef4444 100%)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <QrCode2Icon sx={{ color: "#fff", fontSize: 20 }} />
                        </Box>
                        <Box>
                            <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: -0.5, lineHeight: 1.2 }}>Fix UPC</Typography>
                            <Typography variant="body2" color="text.secondary">
                                {total} record{total !== 1 ? "s" : ""} need attention
                            </Typography>
                        </Box>
                    </Stack>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <TextField
                            size="small"
                            placeholder="Search by SKU or UPC…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") searchSku(); }}
                            sx={{ width: 240 }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon fontSize="small" sx={{ color: "text.disabled" }} />
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <Button variant="contained" onClick={searchSku}>Search</Button>
                    </Stack>
                </Box>

                {/* Grid */}
                {records.length === 0 ? (
                    <Box sx={{ py: 12, textAlign: "center" }}>
                        <CheckCircleIcon sx={{ fontSize: 56, color: "success.light", mb: 1.5 }} />
                        <Typography variant="body1" fontWeight={600} color="text.secondary">All clear — no records need fixing</Typography>
                    </Box>
                ) : (
                    <Grid2 container spacing={2}>
                        {records.map((rec) => {
                            const missing = [
                                !rec.design && "design",
                                !rec.color  && "color",
                                !rec.size   && "size",
                            ].filter(Boolean);

                            return (
                                <Grid2 key={rec._id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                                    <Card variant="outlined" sx={{
                                        borderRadius: 3, overflow: "hidden",
                                        height: "100%", display: "flex", flexDirection: "column",
                                        borderColor: missing.length ? "warning.light" : "divider",
                                        transition: "box-shadow 150ms",
                                        "&:hover": { boxShadow: "0 4px 16px rgba(0,0,0,0.08)" },
                                    }}>
                                        {/* Missing fields banner */}
                                        {missing.length > 0 && (
                                            <Stack direction="row" alignItems="center" spacing={0.75}
                                                sx={{ bgcolor: "#fff7ed", borderBottom: "1px solid #fed7aa", px: 2, py: 0.75 }}>
                                                <WarningAmberIcon sx={{ fontSize: 13, color: "#f97316" }} />
                                                <Typography variant="caption" sx={{ color: "#c2410c", fontWeight: 600, fontSize: "0.68rem" }}>
                                                    Missing: {missing.join(", ")}
                                                </Typography>
                                            </Stack>
                                        )}

                                        <Box sx={{ px: 2, pt: 1.5, pb: 1, flex: 1 }}>
                                            {/* IDs */}
                                            <Box sx={{ bgcolor: "action.hover", borderRadius: 1.5, px: 1.5, py: 1, mb: 1.5 }}>
                                                {[["GTIN", rec.gtin], ["UPC", rec.upc], ["SKU", rec.sku]].map(([lbl, val]) => (
                                                    <Typography key={lbl} sx={{ fontFamily: "monospace", fontSize: "0.7rem", color: "text.secondary", lineHeight: 1.7 }}>
                                                        <Box component="span" sx={{ fontWeight: 700, display: "inline-block", width: 34 }}>{lbl}</Box>
                                                        {val || "—"}
                                                    </Typography>
                                                ))}
                                            </Box>

                                            {/* Fields */}
                                            <Stack spacing={0.6}>
                                                <FieldRow label="Design" value={rec.design?.name} missing={!rec.design} />
                                                <FieldRow label="Blank"  value={rec.blank?.name}  missing={!rec.blank}  />
                                                <FieldRow label="Color"  value={rec.color?.name}  missing={!rec.color}  />
                                                <FieldRow label="Size"   value={rec.size}          missing={!rec.size}   />
                                            </Stack>
                                        </Box>

                                        {/* Actions */}
                                        <Stack spacing={0.75} sx={{ px: 2, pb: 1.75, pt: 0.5 }}>
                                            {!rec.design && (
                                                <Button size="small" fullWidth variant="outlined" startIcon={<BrushIcon sx={{ fontSize: 14 }} />}
                                                    onClick={() => setEditDesign(rec)}
                                                    sx={{ fontSize: "0.73rem", borderColor: "#6366f1", color: "#6366f1", "&:hover": { borderColor: "#6366f1", bgcolor: "#6366f108" } }}>
                                                    Assign Design
                                                </Button>
                                            )}
                                            {(!rec.color || !rec.size) && rec.blank && (
                                                <Button size="small" fullWidth variant="outlined" startIcon={<PaletteIcon sx={{ fontSize: 14 }} />}
                                                    onClick={() => setEditSizeColor(rec)}
                                                    sx={{ fontSize: "0.73rem", borderColor: "#10b981", color: "#10b981", "&:hover": { borderColor: "#10b981", bgcolor: "#10b98108" } }}>
                                                    Assign Color / Size
                                                </Button>
                                            )}
                                        </Stack>
                                    </Card>
                                </Grid2>
                            );
                        })}
                    </Grid2>
                )}
            </Container>

            <AssignDesignDialog
                upc={editDesign}
                onClose={() => setEditDesign(null)}
                setRecords={setRecords}
                setTotal={setTotal}
            />
            <AssignSizeColorDialog
                upc={editSizeColor}
                onClose={() => setEditSizeColor(null)}
                setRecords={setRecords}
                setTotal={setTotal}
            />
        </Box>
    );
}

function FieldRow({ label, value, missing }) {
    return (
        <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="caption" sx={{ color: "text.disabled", width: 44, flexShrink: 0, fontSize: "0.7rem" }}>
                {label}
            </Typography>
            {missing ? (
                <Chip label="missing" size="small" sx={{ height: 16, fontSize: "0.6rem", fontWeight: 700, bgcolor: "#fee2e2", color: "#ef4444", border: "1px solid #fca5a5" }} />
            ) : (
                <Typography variant="body2" sx={{ fontSize: "0.8rem", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {value || "—"}
                </Typography>
            )}
        </Stack>
    );
}

function AssignDesignDialog({ upc, onClose, setRecords, setTotal }) {
    const [draft, setDraft]             = useState(null);
    const [designs, setDesigns]         = useState([]);
    const [search, setSearch]           = useState("");
    const [page, setPage]               = useState(1);
    const [hasMore, setHasMore]         = useState(true);
    const [selectedId, setSelectedId]   = useState(null);

    useEffect(() => {
        if (upc) {
            setDraft({ ...upc });
            setSelectedId(upc.design?._id ?? null);
            setDesigns([]);
        }
    }, [upc]);

    const handleClose = () => {
        onClose();
        setSearch("");
        setDesigns([]);
        setSelectedId(null);
    };

    const handleSave = async () => {
        if (!draft) return;
        const res = await axios.put("/api/upc", { upc: draft });
        if (res.data.error) { alert(res.data.msg); return; }
        setRecords(res.data.skus ?? []);
        setTotal(res.data.count ?? 0);
        handleClose();
    };

    return (
        <Dialog open={!!upc} onClose={handleClose} maxWidth="lg" fullWidth PaperProps={{ sx: { height: "90vh" } }}>
            <DialogTitle sx={{ fontWeight: 700, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                Assign Design
                <Stack direction="row" alignItems="center" spacing={1}>
                    {upc?.sku && (
                        <Typography variant="body2" sx={{ fontFamily: "monospace", color: "text.secondary" }}>{upc.sku}</Typography>
                    )}
                    <IconButton size="small" onClick={handleClose}><CloseIcon fontSize="small" /></IconButton>
                </Stack>
            </DialogTitle>

            <DialogContent dividers sx={{ display: "flex", flexDirection: "column", gap: 2, overflow: "hidden" }}>
                <Search setDesigns={setDesigns} search={search} setSearch={setSearch} setPage={setPage} setHasMore={setHasMore} />

                <Box sx={{ flex: 1, overflowY: "auto" }}>
                    {designs.length === 0 ? (
                        <Box sx={{ py: 8, textAlign: "center" }}>
                            <BrushIcon sx={{ fontSize: 40, color: "text.disabled", mb: 1 }} />
                            <Typography variant="body2" color="text.disabled">Search for a design above</Typography>
                        </Box>
                    ) : (
                        <>
                            <Grid2 container spacing={1.5}>
                                {designs.map((d) => {
                                    const isSelected = selectedId === d._id;
                                    const imgSrc = d.images?.front || d.images?.back || d.images?.leftSleeve || d.images?.rightSleeve || d.images?.pocket || "/missingImage.jpg";
                                    return (
                                        <Grid2 key={d._id} size={{ xs: 6, sm: 4, md: 3 }}>
                                            <Card
                                                variant="outlined"
                                                onClick={() => {
                                                    setDraft(prev => ({ ...prev, design: d, recycle: false }));
                                                    setSelectedId(d._id);
                                                }}
                                                sx={{
                                                    cursor: "pointer", borderRadius: 2,
                                                    borderColor: isSelected ? "primary.main" : "divider",
                                                    borderWidth: isSelected ? 2 : 1,
                                                    opacity: selectedId && !isSelected ? 0.55 : 1,
                                                    transition: "all 120ms",
                                                    "&:hover": { boxShadow: "0 4px 12px rgba(0,0,0,0.1)" },
                                                }}
                                            >
                                                <Box sx={{ bgcolor: "#f3f4f6", height: 160, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", position: "relative" }}>
                                                    <Image src={imgSrc} width={150} height={150} alt={d.name}
                                                        style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                                                    {isSelected && (
                                                        <Box sx={{ position: "absolute", top: 6, right: 6, bgcolor: "primary.main", borderRadius: "50%", width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                            <CheckCircleIcon sx={{ color: "#fff", fontSize: 16 }} />
                                                        </Box>
                                                    )}
                                                </Box>
                                                <Box sx={{ px: 1.25, pt: 0.75, pb: 1.25 }}>
                                                    <Typography sx={{ fontFamily: "monospace", fontSize: "0.65rem", color: "text.disabled" }}>{d.sku}</Typography>
                                                    <Typography variant="body2" sx={{ fontWeight: 600, fontSize: "0.78rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                        {d.name}
                                                    </Typography>
                                                </Box>
                                            </Card>
                                        </Grid2>
                                    );
                                })}
                            </Grid2>
                            {hasMore && (
                                <Box sx={{ textAlign: "center", mt: 2 }}>
                                    <Button variant="outlined" onClick={() => setPage(p => p + 1)}>Load More</Button>
                                </Box>
                            )}
                        </>
                    )}
                </Box>
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={handleClose}>Cancel</Button>
                <Button variant="contained" onClick={handleSave} disabled={!selectedId}>
                    Save Design
                </Button>
            </DialogActions>
        </Dialog>
    );
}

function AssignSizeColorDialog({ upc, onClose, setRecords, setTotal }) {
    const [draft, setDraft] = useState(null);

    useEffect(() => {
        if (upc) setDraft({ ...upc });
    }, [upc]);

    const handleClose = () => { onClose(); };

    const handleSave = async () => {
        if (!draft) return;
        const res = await axios.put("/api/upc", { upc: draft });
        if (res.data.error) { alert(res.data.msg); return; }
        setRecords(res.data.skus ?? []);
        setTotal(res.data.count ?? 0);
        handleClose();
    };

    const sizeOptions   = upc?.blank?.sizes?.map(b => ({ label: b.name, value: b.name })) ?? [];
    const colorOptions  = upc?.blank?.colors?.map(b => ({ label: b.name, value: b._id })) ?? [];

    return (
        <Dialog open={!!upc} onClose={handleClose} maxWidth="xs" fullWidth>
            <DialogTitle sx={{ fontWeight: 700, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                Assign Color / Size
                <Stack direction="row" alignItems="center" spacing={1}>
                    {upc?.sku && (
                        <Typography variant="body2" sx={{ fontFamily: "monospace", color: "text.secondary" }}>{upc.sku}</Typography>
                    )}
                    <IconButton size="small" onClick={handleClose}><CloseIcon fontSize="small" /></IconButton>
                </Stack>
            </DialogTitle>

            <DialogContent sx={{ pt: "16px !important" }}>
                <Stack spacing={2}>
                    <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: "block", mb: 0.5 }}>Size</Typography>
                        <CreatableSelect
                            placeholder="Select or type a size…"
                            value={draft?.size ? { label: draft.size, value: draft.size } : null}
                            options={sizeOptions}
                            onChange={(val) => setDraft(prev => ({ ...prev, size: val?.value ?? null, recycle: false }))}
                        />
                    </Box>
                    <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: "block", mb: 0.5 }}>Color</Typography>
                        <CreatableSelect
                            placeholder="Select or type a color…"
                            value={draft?.color ? { label: draft.color.name, value: draft.color._id } : null}
                            options={colorOptions}
                            onChange={(val) => setDraft(prev => ({ ...prev, color: val ? { _id: val.value, name: val.label } : null, recycle: false }))}
                        />
                    </Box>
                </Stack>
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={handleClose}>Cancel</Button>
                <Button variant="contained" onClick={handleSave} disabled={!draft?.size && !draft?.color}>
                    Save
                </Button>
            </DialogActions>
        </Dialog>
    );
}

"use client";
import {
    Box, Container, Typography, Card, Button, Dialog, DialogTitle,
    DialogContent, DialogActions, TextField, Stack, Chip, IconButton,
    InputAdornment, Collapse,
} from "@mui/material";
import { useState, useEffect } from "react";
import AddIcon          from "@mui/icons-material/Add";
import DeleteIcon       from "@mui/icons-material/Delete";
import EditIcon         from "@mui/icons-material/Edit";
import SearchIcon       from "@mui/icons-material/Search";
import ExpandMoreIcon   from "@mui/icons-material/ExpandMore";
import ExpandLessIcon   from "@mui/icons-material/ExpandLess";
import SwapHorizIcon    from "@mui/icons-material/SwapHoriz";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import LocalOfferIcon   from "@mui/icons-material/LocalOffer";
import BrushIcon        from "@mui/icons-material/Brush";
import LayersIcon       from "@mui/icons-material/Layers";
import PaletteIcon      from "@mui/icons-material/Palette";
import StraightenIcon   from "@mui/icons-material/Straighten";
import CloseIcon        from "@mui/icons-material/Close";
import axios from "axios";

const TYPES = [
    { type: "sku",    label: "SKU",    Icon: LocalOfferIcon,  color: "#6366f1" },
    { type: "design", label: "Design", Icon: BrushIcon,       color: "#ec4899" },
    { type: "blank",  label: "Blank",  Icon: LayersIcon,      color: "#f97316" },
    { type: "color",  label: "Color",  Icon: PaletteIcon,     color: "#10b981" },
    { type: "size",   label: "Size",   Icon: StraightenIcon,  color: "#3b82f6" },
];

export function Converters({ designConverter, blankConverter, colorConverter, sizeConverter, skuConverter }) {
    const [converters, setConverters] = useState({
        sku:    skuConverter?.converter    ?? {},
        design: designConverter?.converter ?? {},
        blank:  blankConverter?.converter  ?? {},
        color:  colorConverter?.converter  ?? {},
        size:   sizeConverter?.converter   ?? {},
    });
    const [deleteItem, setDeleteItem] = useState(null);
    const [editItem, setEditItem]     = useState(null); // { type, key, value }

    const handleAdd = async (type, oldVal, newVal) => {
        const res = await axios.post("/api/admin/converter", { type, oldValue: oldVal, newValue: newVal });
        if (res?.data?.converter) setConverters(prev => ({ ...prev, [type]: res.data.converter }));
    };

    const handleDelete = async () => {
        const { type, key } = deleteItem;
        const res = await axios.put("/api/admin/converter", { type, key });
        if (res?.data && !res.data.error) setConverters(prev => ({ ...prev, [type]: res.data.converter }));
        setDeleteItem(null);
    };

    const handleEdit = async (newKey, newVal) => {
        const { type, key: oldKey } = editItem;
        if (oldKey !== newKey) {
            await axios.put("/api/admin/converter", { type, key: oldKey });
        }
        const res = await axios.post("/api/admin/converter", { type, oldValue: newKey, newValue: newVal });
        if (res?.data?.converter) setConverters(prev => ({ ...prev, [type]: res.data.converter }));
        setEditItem(null);
    };

    const totalMappings = Object.values(converters).reduce((sum, c) => sum + Object.keys(c).length, 0);

    return (
        <Box sx={{ backgroundColor: "background.default", minHeight: "100vh" }}>
            <Container maxWidth="md" sx={{ py: 4 }}>

                {/* Header */}
                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 4 }}>
                    <Box sx={{ width: 36, height: 36, borderRadius: 2, background: "linear-gradient(135deg, #6366f1 0%, #ec4899 100%)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <SwapHorizIcon sx={{ color: "#fff", fontSize: 20 }} />
                    </Box>
                    <Box>
                        <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: -0.5, lineHeight: 1.2 }}>Converters</Typography>
                        <Typography variant="body2" color="text.secondary">
                            {totalMappings} mapping{totalMappings !== 1 ? "s" : ""} across {TYPES.length} types
                        </Typography>
                    </Box>
                </Stack>

                {/* Sections */}
                <Stack spacing={2}>
                    {TYPES.map(({ type, label, Icon, color }) => (
                        <ConverterSection
                            key={type}
                            type={type}
                            label={label}
                            Icon={Icon}
                            accentColor={color}
                            data={converters[type]}
                            onAdd={handleAdd}
                            onDelete={(t, k) => setDeleteItem({ type: t, key: k })}
                            onEdit={(t, k, v) => setEditItem({ type: t, key: k, value: v })}
                        />
                    ))}
                </Stack>
            </Container>

            {/* Edit dialog */}
            <EditDialog
                item={editItem}
                onClose={() => setEditItem(null)}
                onSave={handleEdit}
            />

            {/* Delete confirmation */}
            <Dialog open={!!deleteItem} onClose={() => setDeleteItem(null)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ fontWeight: 700, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    Remove Mapping
                    <IconButton size="small" onClick={() => setDeleteItem(null)}><CloseIcon fontSize="small" /></IconButton>
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                        Remove this <strong>{deleteItem?.type}</strong> mapping?
                    </Typography>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ bgcolor: "action.hover", px: 2, py: 1.25, borderRadius: 1.5 }}>
                        <Typography sx={{ fontFamily: "monospace", fontSize: "0.85rem", fontWeight: 600 }}>{deleteItem?.key}</Typography>
                        <ArrowForwardIcon sx={{ fontSize: 16, color: "text.disabled", flexShrink: 0 }} />
                        <Typography sx={{ fontFamily: "monospace", fontSize: "0.85rem", color: "text.secondary" }}>…</Typography>
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button onClick={() => setDeleteItem(null)}>Cancel</Button>
                    <Button variant="contained" color="error" onClick={handleDelete}>Remove</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

function EditDialog({ item, onClose, onSave }) {
    const [draft, setDraft] = useState({ key: "", value: "" });

    useEffect(() => {
        if (item) setDraft({ key: item.key, value: item.value });
    }, [item]);

    const set = (field) => (e) => setDraft(d => ({ ...d, [field]: e.target.value }));
    const canSave = draft.key.trim() && draft.value.trim();
    const handleKey = (e) => { if (e.key === "Enter" && canSave) onSave(draft.key.trim(), draft.value.trim()); };

    return (
        <Dialog open={!!item} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle sx={{ fontWeight: 700, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                Edit Mapping
                <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
            </DialogTitle>
            <DialogContent sx={{ pt: "16px !important" }}>
                <Stack spacing={2}>
                    <TextField
                        fullWidth size="small" label="Old value"
                        value={draft.key}
                        onChange={set("key")}
                        onKeyDown={handleKey}
                        inputProps={{ style: { fontFamily: "monospace", fontSize: "0.85rem" } }}
                    />
                    <ArrowForwardIcon sx={{ color: "text.disabled", alignSelf: "center" }} />
                    <TextField
                        fullWidth size="small" label="New value"
                        value={draft.value}
                        onChange={set("value")}
                        onKeyDown={handleKey}
                        inputProps={{ style: { fontFamily: "monospace", fontSize: "0.85rem" } }}
                    />
                </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={onClose}>Cancel</Button>
                <Button variant="contained" onClick={() => onSave(draft.key.trim(), draft.value.trim())} disabled={!canSave}>
                    Save
                </Button>
            </DialogActions>
        </Dialog>
    );
}

function ConverterSection({ type, label, Icon, accentColor, data, onAdd, onDelete, onEdit }) {
    const [oldVal, setOldVal] = useState("");
    const [newVal, setNewVal] = useState("");
    const [open, setOpen]     = useState(false);
    const [search, setSearch] = useState("");

    const count = Object.keys(data).length;

    const filtered = Object.entries(data).filter(([k, v]) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return k.toLowerCase().includes(q) || String(v).toLowerCase().includes(q);
    });

    const handleAdd = async () => {
        const o = oldVal.trim(), n = newVal.trim();
        if (!o || !n) return;
        await onAdd(type, o, n);
        setOldVal("");
        setNewVal("");
    };

    const handleKey = (e) => { if (e.key === "Enter") handleAdd(); };

    return (
        <Card variant="outlined" sx={{ borderRadius: 3, overflow: "hidden" }}>
            {/* Card header */}
            <Stack
                direction="row" alignItems="center" justifyContent="space-between"
                sx={{ px: 2.5, py: 1.75, borderBottom: "1px solid", borderColor: "divider", bgcolor: "background.paper" }}
            >
                <Stack direction="row" alignItems="center" spacing={1.25}>
                    <Box sx={{ width: 28, height: 28, borderRadius: 1.5, bgcolor: `${accentColor}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon sx={{ fontSize: 16, color: accentColor }} />
                    </Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{label}</Typography>
                    {count > 0 && (
                        <Chip
                            label={count}
                            size="small"
                            sx={{ height: 18, fontSize: "0.65rem", fontWeight: 700, bgcolor: `${accentColor}18`, color: accentColor, border: `1px solid ${accentColor}30` }}
                        />
                    )}
                </Stack>
                {count > 0 && (
                    <Button
                        size="small"
                        endIcon={open ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        onClick={() => setOpen(v => !v)}
                        sx={{ color: "text.secondary", fontWeight: 600, fontSize: "0.75rem" }}
                    >
                        {open ? "Hide" : `View ${count}`}
                    </Button>
                )}
            </Stack>

            {/* Add form */}
            <Box sx={{ px: 2.5, py: 2 }}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                    <TextField
                        size="small"
                        placeholder="Old value"
                        value={oldVal}
                        onChange={(e) => setOldVal(e.target.value)}
                        onKeyDown={handleKey}
                        sx={{ flex: 1, "& input": { fontFamily: "monospace", fontSize: "0.85rem" } }}
                    />
                    <ArrowForwardIcon sx={{ color: "text.disabled", flexShrink: 0 }} />
                    <TextField
                        size="small"
                        placeholder="New value"
                        value={newVal}
                        onChange={(e) => setNewVal(e.target.value)}
                        onKeyDown={handleKey}
                        sx={{ flex: 1, "& input": { fontFamily: "monospace", fontSize: "0.85rem" } }}
                    />
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleAdd}
                        disabled={!oldVal.trim() || !newVal.trim()}
                        sx={{ flexShrink: 0, bgcolor: accentColor, "&:hover": { bgcolor: accentColor, filter: "brightness(0.9)" } }}
                    >
                        Add
                    </Button>
                </Stack>
            </Box>

            {/* Collapsible mapping list */}
            <Collapse in={open}>
                <Box sx={{ borderTop: "1px solid", borderColor: "divider", px: 2.5, pt: 2, pb: 1.5 }}>
                    {count > 6 && (
                        <TextField
                            size="small" fullWidth
                            placeholder={`Search ${label.toLowerCase()} mappings…`}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            sx={{ mb: 1.5 }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon fontSize="small" sx={{ color: "text.disabled" }} />
                                    </InputAdornment>
                                ),
                            }}
                        />
                    )}

                    {filtered.length === 0 ? (
                        <Typography variant="body2" color="text.disabled" sx={{ py: 1 }}>
                            {search ? "No matches" : `No ${label.toLowerCase()} mappings yet`}
                        </Typography>
                    ) : (
                        <Stack spacing={0.25}>
                            {filtered.map(([k, v]) => (
                                <Stack
                                    key={k}
                                    direction="row" alignItems="center" justifyContent="space-between"
                                    sx={{
                                        px: 1.5, py: 0.75, borderRadius: 1.5,
                                        "&:hover": { bgcolor: "action.hover" },
                                        "&:hover .row-actions": { opacity: 1 },
                                    }}
                                >
                                    <Stack direction="row" alignItems="center" spacing={1} sx={{ overflow: "hidden", flex: 1, minWidth: 0 }}>
                                        <Typography sx={{ fontFamily: "monospace", fontSize: "0.8rem", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                            {k}
                                        </Typography>
                                        <ArrowForwardIcon sx={{ fontSize: 14, color: "text.disabled", flexShrink: 0 }} />
                                        <Typography sx={{ fontFamily: "monospace", fontSize: "0.8rem", color: "text.secondary", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                            {v}
                                        </Typography>
                                    </Stack>
                                    <Stack className="row-actions" direction="row" spacing={0.25} sx={{ opacity: 0, transition: "opacity 120ms", flexShrink: 0 }}>
                                        <IconButton size="small" onClick={() => onEdit(type, k, v)} sx={{ color: "primary.main" }}>
                                            <EditIcon sx={{ fontSize: 15 }} />
                                        </IconButton>
                                        <IconButton size="small" onClick={() => onDelete(type, k)} sx={{ color: "error.main" }}>
                                            <DeleteIcon sx={{ fontSize: 15 }} />
                                        </IconButton>
                                    </Stack>
                                </Stack>
                            ))}
                        </Stack>
                    )}
                </Box>
            </Collapse>
        </Card>
    );
}

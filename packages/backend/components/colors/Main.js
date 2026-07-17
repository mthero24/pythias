"use client";
import {
    Box, Typography, Container, Stack, Card, Chip, IconButton,
    Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions,
    InputAdornment, Grid2, Tooltip,
} from "@mui/material";
import PaletteIcon   from "@mui/icons-material/Palette";
import AddIcon       from "@mui/icons-material/Add";
import EditIcon      from "@mui/icons-material/Edit";
import DeleteIcon    from "@mui/icons-material/Delete";
import SearchIcon    from "@mui/icons-material/Search";
import CloseIcon     from "@mui/icons-material/Close";
import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import CreatableSelect from "react-select/creatable";
import EyeDropper from "../blanks/EyeDropper";

const selectMenuPortalProps = {
    menuPortalTarget: typeof document !== "undefined" ? document.body : null,
    menuPosition: "fixed",
    styles: { menuPortal: (base) => ({ ...base, zIndex: 9999 }) },
};

const COLOR_TYPES   = [{ label: "Light", value: "light" }, { label: "Dark", value: "dark" }];
const COLOR_FAMILIES = [
    { label: "Black",  value: "black"  },
    { label: "Blue",   value: "blue"   },
    { label: "Brown",  value: "brown"  },
    { label: "Green",  value: "green"  },
    { label: "Grey",   value: "grey"   },
    { label: "Orange", value: "orange" },
    { label: "Pink",   value: "pink"   },
    { label: "Purple", value: "purple" },
    { label: "Red",    value: "red"    },
    { label: "White",  value: "white"  },
    { label: "Yellow", value: "yellow" },
];
const FAMILY_HUE = {
    black: "#374151", blue: "#3b82f6", brown: "#92400e", green: "#10b981",
    grey: "#6b7280", orange: "#f97316", pink: "#ec4899", purple: "#8b5cf6",
    red: "#ef4444", white: "#9ca3af", yellow: "#f59e0b",
};
const BLANK = { name: "", hexcode: "#ffffff", color_type: "light", colorFamily: "", sku: "", nrfColorCode: "" };

function generateColorSku(name) {
    if (!name) return "";
    const n = name.trim();
    const base = n.toLowerCase()
        .replace(/\s+/g, "")
        .replace(/light/g, "l")
        .replace(/heather/g, "h")
        .replace(/vintage/g, "v")
        .replace(/ and /g, "")
        .replace(/black/g, "bl")
        .replace(/white/g, "wh")
        .replace(/plaid/g, "pl")
        .replace(/red/g, "re")
        .replace(/top/g, "");
    return base.substring(0, 7);
}

function textColor(c) { return c?.color_type === "dark" ? "#fff" : "#000"; }

export function Main({ colors: init }) {
    const [colors, setColors]     = useState(init);
    const [search, setSearch]     = useState("");
    const [familyFilter, setFamilyFilter] = useState(null);
    const [editColor, setEditColor] = useState(null);
    const [delColor, setDelColor]   = useState(null);
    const [creating, setCreating]   = useState(false);

    const activeFamilies = useMemo(() => {
        const seen = new Set(colors.map(c => c.colorFamily).filter(Boolean));
        return COLOR_FAMILIES.filter(f => seen.has(f.value));
    }, [colors]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return [...colors]
            .filter(c => {
                if (familyFilter && c.colorFamily !== familyFilter) return false;
                if (q && !c.name?.toLowerCase().includes(q) && !c.colorFamily?.toLowerCase().includes(q)) return false;
                return true;
            })
            .sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));
    }, [colors, search, familyFilter]);

    const setFromResponse = (cols) =>
        setColors((cols ?? []).filter(c => c.combined !== true));

    const handleSave = async (color) => {
        const res = await axios.put("/api/admin/colors", { color });
        if (res.data.error) return alert(res.data.msg);
        setFromResponse(res.data.colors);
        setEditColor(null);
    };

    const handleCreate = async (color) => {
        await axios.post("/api/admin/colors", { color });
        const all = await axios.get("/api/admin/colors");
        setFromResponse(all.data.colors);
        setCreating(false);
    };

    const handleDelete = async () => {
        const res = await axios.delete(`/api/admin/colors?id=${delColor._id}`);
        if (res.data.error) return alert(res.data.msg);
        setFromResponse(res.data.colors);
        setDelColor(null);
    };

    return (
        <Box sx={{ backgroundColor: "background.default", minHeight: "100vh" }}>
            <Container maxWidth="xl" sx={{ py: 4 }}>

                {/* Header */}
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 3, flexWrap: "wrap", gap: 2 }}>
                    <Box>
                        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 0.5 }}>
                            <Box sx={{ width: 36, height: 36, borderRadius: 2, background: "linear-gradient(135deg, #6366f1 0%, #ec4899 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <PaletteIcon sx={{ color: "#fff", fontSize: 20 }} />
                            </Box>
                            <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: -0.5 }}>Colors</Typography>
                        </Stack>
                        <Typography variant="body2" color="text.secondary" sx={{ ml: 6.25 }}>
                            {filtered.length === colors.length
                                ? `${colors.length} color${colors.length !== 1 ? "s" : ""}`
                                : `${filtered.length} of ${colors.length} colors`}
                        </Typography>
                    </Box>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <TextField
                            size="small"
                            placeholder="Search…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            sx={{ width: 200 }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon fontSize="small" sx={{ color: "text.disabled" }} />
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreating(true)}>
                            Add Color
                        </Button>
                    </Stack>
                </Box>

                {/* Family filter pills */}
                <Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ mb: 3 }}>
                    <Chip
                        label={`All  ${colors.length}`}
                        size="small"
                        onClick={() => setFamilyFilter(null)}
                        sx={{
                            fontWeight: 700, fontSize: "0.72rem",
                            bgcolor: familyFilter === null ? "primary.main" : "transparent",
                            color:   familyFilter === null ? "#fff" : "text.secondary",
                            border:  "1px solid",
                            borderColor: familyFilter === null ? "primary.main" : "divider",
                            cursor: "pointer",
                        }}
                    />
                    {activeFamilies.map(f => {
                        const hue   = FAMILY_HUE[f.value] ?? "#9ca3af";
                        const count = colors.filter(c => c.colorFamily === f.value).length;
                        const active = familyFilter === f.value;
                        return (
                            <Chip
                                key={f.value}
                                size="small"
                                label={`${f.label}  ${count}`}
                                onClick={() => setFamilyFilter(v => v === f.value ? null : f.value)}
                                sx={{
                                    fontWeight: 700, fontSize: "0.72rem",
                                    bgcolor:     active ? hue : `${hue}15`,
                                    color:       active ? "#fff" : hue,
                                    border:      "1px solid",
                                    borderColor: active ? hue : `${hue}40`,
                                    cursor: "pointer",
                                    transition: "all 120ms",
                                }}
                            />
                        );
                    })}
                </Stack>

                {/* Grid */}
                {filtered.length === 0 ? (
                    <Box sx={{ py: 12, textAlign: "center" }}>
                        <PaletteIcon sx={{ fontSize: 56, color: "text.disabled", mb: 1.5 }} />
                        <Typography variant="body1" fontWeight={600} color="text.secondary">No colors found</Typography>
                        <Typography variant="body2" color="text.disabled">Try a different search or filter</Typography>
                    </Box>
                ) : (
                    <Grid2 container spacing={2}>
                        {filtered.map(c => {
                            const tc   = textColor(c);
                            const fhue = FAMILY_HUE[c.colorFamily] ?? "#9ca3af";
                            return (
                                <Grid2 key={c._id} size={{ xs: 6, sm: 4, md: 3, lg: 2 }}>
                                    <Card variant="outlined" sx={{
                                        borderRadius: 3, overflow: "hidden",
                                        transition: "box-shadow 150ms, transform 150ms",
                                        "&:hover": { boxShadow: "0 8px 28px rgba(0,0,0,0.12)", transform: "translateY(-3px)" },
                                        "&:hover .color-actions": { opacity: 1 },
                                    }}>
                                        {/* Swatch */}
                                        <Box sx={{
                                            backgroundColor: c.hexcode || "#e5e7eb",
                                            height: 110,
                                            position: "relative",
                                        }}>
                                            {/* Action overlay */}
                                            <Stack
                                                className="color-actions"
                                                direction="row"
                                                spacing={0.5}
                                                sx={{
                                                    position: "absolute", top: 6, right: 6,
                                                    opacity: 0, transition: "opacity 150ms",
                                                }}
                                            >
                                                <Tooltip title="Edit" arrow>
                                                    <IconButton size="small" onClick={() => setEditColor({ ...c })} sx={{
                                                        bgcolor: "rgba(255,255,255,0.85)", backdropFilter: "blur(4px)",
                                                        p: 0.5, color: "#111",
                                                        "&:hover": { bgcolor: "#fff" },
                                                    }}>
                                                        <EditIcon sx={{ fontSize: 14 }} />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Delete" arrow>
                                                    <IconButton size="small" onClick={() => setDelColor(c)} sx={{
                                                        bgcolor: "rgba(255,255,255,0.85)", backdropFilter: "blur(4px)",
                                                        p: 0.5, color: "#ef4444",
                                                        "&:hover": { bgcolor: "#fff" },
                                                    }}>
                                                        <DeleteIcon sx={{ fontSize: 14 }} />
                                                    </IconButton>
                                                </Tooltip>
                                            </Stack>
                                        </Box>

                                        {/* Info */}
                                        <Box sx={{ px: 1.5, pt: 1.25, pb: 1.5 }}>
                                            <Typography variant="body2" sx={{ fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", mb: 0.5, fontSize: "0.8rem" }}>
                                                {c.name || "—"}
                                            </Typography>
                                            <Typography sx={{ fontFamily: "monospace", fontSize: "0.67rem", color: "text.disabled", mb: 0.25, letterSpacing: 0.5 }}>
                                                {c.hexcode || "—"}
                                            </Typography>
                                            {c.sku && (
                                                <Typography sx={{ fontFamily: "monospace", fontSize: "0.67rem", color: "primary.main", mb: 0.5, fontWeight: 600 }}>
                                                    {c.sku}
                                                </Typography>
                                            )}
                                            <Stack direction="row" flexWrap="wrap" gap={0.5}>
                                                {c.colorFamily && (
                                                    <Chip label={c.colorFamily} size="small" sx={{
                                                        height: 17, fontSize: "0.6rem", fontWeight: 700,
                                                        bgcolor: `${fhue}15`, color: fhue, border: `1px solid ${fhue}35`,
                                                    }} />
                                                )}
                                                {c.color_type && (
                                                    <Chip label={c.color_type} size="small" variant="outlined" sx={{
                                                        height: 17, fontSize: "0.6rem", color: "text.disabled", borderColor: "divider",
                                                    }} />
                                                )}
                                            </Stack>
                                        </Box>
                                    </Card>
                                </Grid2>
                            );
                        })}
                    </Grid2>
                )}
            </Container>

            <ColorDialog
                open={!!editColor}
                title="Edit Color"
                color={editColor}
                onClose={() => setEditColor(null)}
                onSave={handleSave}
            />
            <ColorDialog
                open={creating}
                title="Add Color"
                color={BLANK}
                onClose={() => setCreating(false)}
                onSave={handleCreate}
            />
            <DeleteDialog
                open={!!delColor}
                color={delColor}
                onClose={() => setDelColor(null)}
                onConfirm={handleDelete}
            />
        </Box>
    );
}

function ColorDialog({ open, title, color, onClose, onSave }) {
    const [draft, setDraft] = useState(color ?? BLANK);
    const [skuManual, setSkuManual] = useState(false);

    useEffect(() => {
        const base = color ?? BLANK;
        setDraft({ ...base, sku: base.sku || generateColorSku(base.name) });
        setSkuManual(!!(color?.sku));
    }, [color, open]);

    const set = (key, val) => setDraft(prev => ({ ...prev, [key]: val }));

    const handleNameChange = (name) => {
        setDraft(prev => ({
            ...prev,
            name,
            sku: skuManual ? prev.sku : generateColorSku(name),
        }));
    };

    const isValidHex = /^#[0-9a-fA-F]{6}$/.test(draft.hexcode);

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle sx={{ fontWeight: 700, display: "flex", justifyContent: "space-between", alignItems: "center", pb: 1 }}>
                {title}
                <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
            </DialogTitle>

            <DialogContent dividers sx={{ pt: 2.5 }}>
                {/* Live preview */}
                <Box sx={{
                    backgroundColor: draft.hexcode || "#e5e7eb",
                    height: 96, borderRadius: 2.5, mb: 2.5,
                    border: "1px solid rgba(0,0,0,0.08)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                    <Typography sx={{ color: textColor(draft), fontWeight: 700, fontFamily: "monospace", fontSize: "0.9rem", letterSpacing: 1 }}>
                        {isValidHex ? draft.hexcode : "invalid hex"}
                    </Typography>
                </Box>

                <Stack spacing={2}>
                    <TextField
                        fullWidth size="small" label="Name"
                        value={draft.name ?? ""}
                        onChange={(e) => handleNameChange(e.target.value)}
                    />
                    <TextField
                        fullWidth size="small" label="Color SKU"
                        value={draft.sku ?? ""}
                        onChange={(e) => { setSkuManual(true); set("sku", e.target.value.toLowerCase().replace(/\s+/g, "")); }}
                        inputProps={{ maxLength: 12, style: { fontFamily: "monospace" } }}
                        helperText="Auto-generated from name — edit to override"
                    />
                    <TextField
                        fullWidth size="small" label="NRF Color Code"
                        value={draft.nrfColorCode ?? ""}
                        onChange={(e) => set("nrfColorCode", e.target.value)}
                        inputProps={{ style: { fontFamily: "monospace" } }}
                        helperText="National Retail Federation color code (for Target / Kohl's feeds)"
                    />
                    <TextField
                        fullWidth size="small" label="Hex Code"
                        value={draft.hexcode ?? ""}
                        onChange={(e) => set("hexcode", e.target.value)}
                        error={!isValidHex && draft.hexcode?.length > 0}
                        helperText={!isValidHex && draft.hexcode?.length > 0 ? "Must be a 6-digit hex (e.g. #ff0000)" : ""}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Box sx={{ width: 16, height: 16, borderRadius: 0.75, backgroundColor: isValidHex ? draft.hexcode : "#e5e7eb", border: "1px solid rgba(0,0,0,0.2)", flexShrink: 0, mr: 0.5 }} />
                                    <EyeDropper onColorChange={(hex) => set("hexcode", hex)} />
                                </InputAdornment>
                            ),
                            sx: { fontFamily: "monospace" },
                        }}
                    />
                    <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5, fontWeight: 600 }}>Color Type</Typography>
                        <CreatableSelect
                            {...selectMenuPortalProps}
                            placeholder="Light or Dark…"
                            options={COLOR_TYPES}
                            value={COLOR_TYPES.find(o => o.value === draft.color_type) ?? null}
                            onChange={(val) => set("color_type", val?.value ?? null)}
                        />
                    </Box>
                    <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5, fontWeight: 600 }}>Color Family</Typography>
                        <CreatableSelect
                            {...selectMenuPortalProps}
                            placeholder="Select family…"
                            options={COLOR_FAMILIES}
                            value={draft.colorFamily ? { label: draft.colorFamily, value: draft.colorFamily } : null}
                            onChange={(val) => set("colorFamily", val?.value ?? "")}
                        />
                    </Box>
                </Stack>
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={onClose}>Cancel</Button>
                <Button variant="contained" onClick={() => onSave(draft)} disabled={!draft.name?.trim()}>
                    {title === "Add Color" ? "Add Color" : "Save Changes"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

function DeleteDialog({ open, color, onClose, onConfirm }) {
    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle sx={{ fontWeight: 700 }}>Delete Color</DialogTitle>
            <DialogContent>
                <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
                    <Box sx={{ width: 40, height: 40, borderRadius: 2, backgroundColor: color?.hexcode, border: "1px solid rgba(0,0,0,0.12)", flexShrink: 0 }} />
                    <Typography variant="body2" color="text.secondary">
                        Are you sure you want to delete <strong style={{ color: "#111827" }}>{color?.name}</strong>? This cannot be undone.
                    </Typography>
                </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={onClose}>Cancel</Button>
                <Button variant="contained" color="error" onClick={onConfirm}>Delete</Button>
            </DialogActions>
        </Dialog>
    );
}

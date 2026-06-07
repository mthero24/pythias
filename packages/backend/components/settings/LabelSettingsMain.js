"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
    Box, Typography, Stack, Button, Alert, Container,
    FormControl, InputLabel, Select, MenuItem, Paper,
    Switch, FormControlLabel, Divider, Tabs, Tab, Chip, Avatar,
} from "@mui/material";
import LockIcon from "@mui/icons-material/Lock";
import {
    LABEL_TEMPLATE_DEFAULT, PREMIER_DEFAULT_FIELDS,
    DEFAULT_FIELD_POSITIONS, FIELD_SIZES, SIZE_TO_PX,
    FIELD_ROTATIONS, ROTATION_TO_DEG, ROTATION_LABELS,
} from "../../lib/labelConstants.js";

const DPI = 203;
const MAX_PREVIEW_W = 340;
const MAX_PREVIEW_H = 500;

const LABEL_SIZES = [
    { label: '2×2" (Recommended)', width: 2, height: 2 },
    { label: '2×3"', width: 2, height: 3 },
    { label: '3×2"', width: 3, height: 2 },
    { label: '4×2"', width: 4, height: 2 },
    { label: '4×6"', width: 4, height: 6 },
];

const OPTIONAL_FIELDS = [
    { key: "itemNumber",     label: "Item Number",        sample: "#1" },
    { key: "styleCode",      label: "Style Code",         sample: "GI64000" },
    { key: "shipByDate",     label: "Ship By Date",       sample: "06/15/2026" },
    { key: "inventoryLoc",   label: "Inventory Location", sample: "Aisle:A Unit:1 Shelf:2 Bin:3" },
    { key: "color",          label: "Color",              sample: "Color: Black" },
    { key: "size",           label: "Size",               sample: "Size: L" },
    { key: "shippingType",   label: "Shipping Type",      sample: "Shipping: Standard" },
    { key: "designSku",      label: "Design SKU",         sample: "SKU: ABC-123" },
    { key: "orderCount",     label: "Order Count",        sample: "CNT 5" },
    { key: "designName",     label: "Design Name",        sample: "Title: Classic Tee" },
    { key: "printType",      label: "Print Type",         sample: "DTF" },
    { key: "printLocations", label: "Print Locations",    sample: "Front Only" },
    { key: "blankCode",      label: "Blank Code",         sample: "Blank: GI64000" },
    { key: "orderDate",      label: "Order Date",         sample: "06/01/2026" },
];

const SPECIAL_CASE_MARKETPLACES = [
    { key: "target",  label: "Target",      color: "#cc0000" },
    { key: "walmart", label: "Walmart",     color: "#0071ce" },
    { key: "kohls",   label: "Kohl's",      color: "#8b2131" },
    { key: "amazon",  label: "Amazon",      color: "#ff9900" },
    { key: "tiktok",  label: "TikTok Shop", color: "#010101" },
    { key: "faire",   label: "Faire",       color: "#3d3d3d" },
    { key: "etsy",    label: "Etsy",        color: "#f16521" },
];

const SPECIAL_OPTIONAL_FIELDS = [
    { key: "upc",          label: "UPC / GTIN",      sample: "012345678901" },
    { key: "itemNumber",   label: "Item Number",      sample: "#1" },
    { key: "color",        label: "Color",            sample: "Color: Black" },
    { key: "size",         label: "Size",             sample: "Size: L" },
    { key: "designSku",    label: "Design SKU",       sample: "SKU: ABC-123" },
    { key: "designName",   label: "Design Name",      sample: "Title: Classic Tee" },
    { key: "styleCode",    label: "Style Code",       sample: "GI64000" },
    { key: "blankCode",    label: "Blank Code",       sample: "Blank: GI64000" },
    { key: "shipByDate",   label: "Ship By Date",     sample: "06/15/2026" },
    { key: "printType",    label: "Print Type",       sample: "DTF" },
    { key: "orderCount",   label: "Order Count",      sample: "CNT 5" },
];

// Default special case config (mirrors Premier's Target label)
const SPECIAL_CASE_DEFAULT = {
    enabled: false,
    barcodeField: "upc",   // "upc" | "pieceId"
    showBrandLogo: false,
    brandId: null,
    fields: ["upc", "color", "size", "designSku"],
    fieldPositions: {},
};

// ── Draggable field element ───────────────────────────────────────────────────
function DraggableField({ fieldKey, sample, pos, scale, dotW, dotH, selected, onSelect, onMove, onResize, onRotate }) {
    const dragging = useRef(null);
    const fontSize = SIZE_TO_PX[pos.size ?? "sm"];
    const rotateDeg = ROTATION_TO_DEG[pos.rotation ?? "N"] ?? 0;

    const handleMouseDown = useCallback((e) => {
        if (e.button !== 0) return; // left-click only for drag
        e.preventDefault();
        e.stopPropagation();
        dragging.current = { startMX: e.clientX, startMY: e.clientY, startX: pos.x, startY: pos.y };

        const onMouseMove = (me) => {
            const dx = (me.clientX - dragging.current.startMX) / scale;
            const dy = (me.clientY - dragging.current.startMY) / scale;
            onMove(fieldKey,
                Math.max(0, Math.min(dotW - 10, Math.round(dragging.current.startX + dx))),
                Math.max(0, Math.min(dotH - 10, Math.round(dragging.current.startY + dy))),
            );
        };
        const onMouseUp = () => {
            window.removeEventListener("mousemove", onMouseMove);
            window.removeEventListener("mouseup", onMouseUp);
            dragging.current = null;
        };
        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", onMouseUp);
    }, [fieldKey, pos, scale, dotW, dotH, onMove]);

    const handleContextMenu = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        onSelect(fieldKey);
    }, [fieldKey, onSelect]);

    return (
        <Box
            onMouseDown={handleMouseDown}
            onContextMenu={handleContextMenu}
            sx={{
                position: "absolute",
                left: pos.x * scale,
                top: pos.y * scale,
                cursor: "grab",
                userSelect: "none",
                bgcolor: selected ? "rgba(99,102,241,0.18)" : "rgba(99,102,241,0.08)",
                border: "1px solid",
                borderColor: selected ? "#6366f1" : "rgba(99,102,241,0.35)",
                borderRadius: 0.5,
                px: 0.5,
                py: "1px",
                whiteSpace: "nowrap",
                fontSize,
                fontFamily: "monospace",
                lineHeight: 1.4,
                zIndex: selected ? 10 : 1,
                boxShadow: selected ? "0 0 0 2px rgba(99,102,241,0.3)" : "none",
                transform: rotateDeg ? `rotate(${rotateDeg}deg)` : undefined,
                transformOrigin: "top left",
            }}
        >
            {sample}
        </Box>
    );
}

// ── Size + rotation toolbar shown when a field is selected ────────────────────
function SizeToolbar({ selectedKey, pos, scale, onResize, onRotate }) {
    if (!selectedKey || !pos) return null;
    const px = pos.x * scale;
    const py = Math.max(0, (pos.y * scale) - 52);

    const btnStyle = (active) => ({
        fontSize: 9, fontWeight: 700, px: 0.75, py: 0.25,
        borderRadius: 0.5, cursor: "pointer", color: "#fff",
        bgcolor: active ? "#6366f1" : "transparent",
        textTransform: "uppercase",
        "&:hover": { bgcolor: "rgba(99,102,241,0.5)" },
    });

    return (
        <Box
            onClick={e => e.stopPropagation()}
            onContextMenu={e => { e.preventDefault(); e.stopPropagation(); }}
            sx={{ position: "absolute", left: px, top: py, zIndex: 20, display: "flex", flexDirection: "column", gap: "2px" }}
        >
            {/* Size row */}
            <Box sx={{ display: "flex", gap: "2px", bgcolor: "#1a1f2e", borderRadius: 1, px: 0.75, py: 0.4, boxShadow: 3 }}>
                {FIELD_SIZES.map(s => (
                    <Box key={s} onClick={(e) => { e.stopPropagation(); onResize(selectedKey, s); }} sx={btnStyle((pos.size ?? "sm") === s)}>
                        {s}
                    </Box>
                ))}
            </Box>
            {/* Rotation row */}
            <Box sx={{ display: "flex", gap: "2px", bgcolor: "#1a1f2e", borderRadius: 1, px: 0.75, py: 0.4, boxShadow: 3 }}>
                {FIELD_ROTATIONS.map(r => (
                    <Box key={r} onClick={(e) => { e.stopPropagation(); onRotate(selectedKey, r); }} sx={btnStyle((pos.rotation ?? "N") === r)}>
                        {ROTATION_LABELS[r]}
                    </Box>
                ))}
            </Box>
        </Box>
    );
}

// ── Draggable barcode element ─────────────────────────────────────────────────
function DraggableBarcode({ pos, scale, dotW, dotH, selected, onSelect, onMove }) {
    const dragging = useRef(null);

    const handleMouseDown = useCallback((e) => {
        if (e.button !== 0) return;
        e.preventDefault();
        e.stopPropagation();
        dragging.current = { startMX: e.clientX, startMY: e.clientY, startX: pos.x, startY: pos.y };

        const onMouseMove = (me) => {
            const dx = (me.clientX - dragging.current.startMX) / scale;
            const dy = (me.clientY - dragging.current.startMY) / scale;
            onMove("barcode",
                Math.max(0, Math.min(dotW - 50, Math.round(dragging.current.startX + dx))),
                Math.max(0, Math.min(dotH - 100, Math.round(dragging.current.startY + dy))),
            );
        };
        const onMouseUp = () => {
            window.removeEventListener("mousemove", onMouseMove);
            window.removeEventListener("mouseup", onMouseUp);
            dragging.current = null;
        };
        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", onMouseUp);
    }, [pos, scale, dotW, dotH, onMove]);

    return (
        <Box
            onMouseDown={handleMouseDown}
            onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); onSelect("barcode"); }}
            sx={{
                position: "absolute",
                left: pos.x * scale,
                top: pos.y * scale,
                display: "flex",
                alignItems: "center",
                gap: "1px",
                cursor: "grab",
                userSelect: "none",
                outline: selected ? "2px solid #6366f1" : "none",
                outlineOffset: 2,
                borderRadius: 0.5,
            }}
        >
            {Array.from({ length: 32 }).map((_, i) => (
                <Box key={i} sx={{ width: i % 3 === 0 ? 2 : 1, height: 100 * scale, bgcolor: "#111", opacity: 0.8 }} />
            ))}
        </Box>
    );
}

// ── Label preview canvas ──────────────────────────────────────────────────────
function LabelCanvas({ template, selectedKey, onSelect, onMove, onResize, onRotate }) {
    const dotW = Math.round(template.width * DPI);
    const dotH = Math.round(template.height * DPI);
    const scaleX = MAX_PREVIEW_W / dotW;
    const scaleY = MAX_PREVIEW_H / dotH;
    const scale  = Math.min(scaleX, scaleY);
    const canvasW = dotW * scale;
    const canvasH = dotH * scale;

    const positions = { ...DEFAULT_FIELD_POSITIONS, ...(template.fieldPositions ?? {}) };

    return (
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 1 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
                PREVIEW — {template.width}×{template.height}&quot; · {template.format}
            </Typography>
            <Box
                onContextMenu={(e) => { e.preventDefault(); onSelect(null); }}
                sx={{
                    position: "relative", width: canvasW, height: canvasH,
                    bgcolor: "#fff", border: "1px solid", borderColor: "divider",
                    boxShadow: 3, flexShrink: 0, overflow: "hidden",
                }}
            >
                {/* Fixed: PO# */}
                <Box sx={{ position: "absolute", left: 10 * scale, top: 15 * scale, display: "flex", alignItems: "center", gap: "2px", fontSize: 8, fontFamily: "monospace", color: "text.disabled" }}>
                    <LockIcon sx={{ fontSize: 8 }} />PO#: 12345678
                </Box>

                {/* Fixed: Piece ID */}
                <Box sx={{ position: "absolute", left: 10 * scale, top: 35 * scale, display: "flex", alignItems: "center", gap: "2px", fontSize: 8, fontFamily: "monospace", color: "text.disabled" }}>
                    <LockIcon sx={{ fontSize: 8 }} />Piece: AB-001
                </Box>

                {/* Draggable: Barcode */}
                {(() => {
                    const barcodePos = { ...DEFAULT_FIELD_POSITIONS.barcode, ...(template.fieldPositions?.barcode ?? {}) };
                    return (
                        <DraggableBarcode
                            pos={barcodePos}
                            scale={scale}
                            dotW={dotW}
                            dotH={dotH}
                            selected={selectedKey === "barcode"}
                            onSelect={onSelect}
                            onMove={onMove}
                        />
                    );
                })()}

                {/* Size + rotation toolbar for selected field */}
                <SizeToolbar
                    selectedKey={selectedKey}
                    pos={selectedKey ? positions[selectedKey] : null}
                    scale={scale}
                    onResize={onResize}
                    onRotate={onRotate}
                />

                {/* Draggable optional fields */}
                {(template.fields ?? []).map(key => (
                    <DraggableField
                        key={key}
                        fieldKey={key}
                        sample={([...(template._specialFields ?? []), ...OPTIONAL_FIELDS]).find(f => f.key === key)?.sample ?? key}
                        pos={positions[key] ?? { x: 10, y: 175, size: "sm", rotation: "N" }}
                        scale={scale}
                        dotW={dotW}
                        dotH={dotH}
                        selected={selectedKey === key}
                        onSelect={onSelect}
                        onMove={onMove}
                        onResize={onResize}
                        onRotate={onRotate}
                    />
                ))}
            </Box>
            <Typography variant="caption" color="text.disabled">
                Left-drag to reposition · Right-click a field to resize and rotate
            </Typography>
        </Box>
    );
}

// ── Main settings page ────────────────────────────────────────────────────────
export function LabelSettingsMain({ defaultTemplate } = {}) {
    const { data: session } = useSession();
    const baseDefault = { ...LABEL_TEMPLATE_DEFAULT, ...(defaultTemplate ?? {}) };
    const [template, setTemplate] = useState(baseDefault);
    const [loading, setLoading]   = useState(true);
    const [saving, setSaving]     = useState(false);
    const [msg, setMsg]           = useState(null);
    const [selected, setSelected] = useState(null);
    const [tab, setTab]           = useState("design");
    const [activeCase, setActiveCase]       = useState(null); // marketplace key
    const [specialSelected, setSpecialSelected] = useState(null);
    const [brands, setBrands] = useState([]);

    // Always tracks the latest template so save() never captures stale state
    const templateRef = useRef(template);
    templateRef.current = template;

    useEffect(() => {
        fetch("/api/admin/settings/integrations")
            .then(r => r.json())
            .then(d => {
                if (d.creds?.labelTemplate && Object.keys(d.creds.labelTemplate).length) {
                    const saved = d.creds.labelTemplate;
                    setTemplate({
                        ...baseDefault,
                        ...saved,
                        fieldPositions: {
                            ...(baseDefault.fieldPositions ?? DEFAULT_FIELD_POSITIONS),
                            ...(saved.fieldPositions ?? {}),
                        },
                    });
                }
                setLoading(false);
            });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        fetch("/api/admin/brands").then(r => r.json()).then(d => setBrands(d.brands ?? [])).catch(() => {});
    }, []);

    // ── Special case helpers ──────────────────────────────────────────────────
    function getSpecialCase(mk) {
        return { ...SPECIAL_CASE_DEFAULT, ...(template.specialCases?.[mk] ?? {}) };
    }

    function setSpecialCase(mk, updater) {
        setTemplate(t => {
            const prev = { ...SPECIAL_CASE_DEFAULT, ...(t.specialCases?.[mk] ?? {}) };
            const next = typeof updater === "function" ? updater(prev) : { ...prev, ...updater };
            return { ...t, specialCases: { ...(t.specialCases ?? {}), [mk]: next } };
        });
    }

    function toggleSpecialCase(mk) {
        setSpecialCase(mk, sc => ({ ...sc, enabled: !sc.enabled }));
        if (!getSpecialCase(mk).enabled) setActiveCase(mk);
    }

    function toggleSpecialField(mk, key) {
        setSpecialCase(mk, sc => {
            const fields = sc.fields ?? [];
            return { ...sc, fields: fields.includes(key) ? fields.filter(k => k !== key) : [...fields, key] };
        });
    }

    const handleSpecialMove = useCallback((mk, key, x, y) => {
        setSpecialCase(mk, sc => ({
            ...sc,
            fieldPositions: {
                ...DEFAULT_FIELD_POSITIONS,
                ...(sc.fieldPositions ?? {}),
                [key]: { ...(sc.fieldPositions?.[key] ?? DEFAULT_FIELD_POSITIONS[key] ?? {}), x, y },
            },
        }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [template]);

    const handleSpecialResize = useCallback((mk, key, size) => {
        setSpecialCase(mk, sc => ({
            ...sc,
            fieldPositions: {
                ...DEFAULT_FIELD_POSITIONS,
                ...(sc.fieldPositions ?? {}),
                [key]: { ...(sc.fieldPositions?.[key] ?? DEFAULT_FIELD_POSITIONS[key] ?? {}), size },
            },
        }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [template]);

    const handleSpecialRotate = useCallback((mk, key, rotation) => {
        setSpecialCase(mk, sc => ({
            ...sc,
            fieldPositions: {
                ...DEFAULT_FIELD_POSITIONS,
                ...(sc.fieldPositions ?? {}),
                [key]: { ...(sc.fieldPositions?.[key] ?? DEFAULT_FIELD_POSITIONS[key] ?? {}), rotation },
            },
        }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [template]);

    const handleMove = useCallback((key, x, y) => {
        setTemplate(t => ({
            ...t,
            fieldPositions: {
                ...DEFAULT_FIELD_POSITIONS,
                ...(t.fieldPositions ?? {}),
                [key]: { ...(t.fieldPositions?.[key] ?? DEFAULT_FIELD_POSITIONS[key] ?? {}), x, y },
            },
        }));
    }, []);

    const handleResize = useCallback((key, size) => {
        setTemplate(t => ({
            ...t,
            fieldPositions: {
                ...DEFAULT_FIELD_POSITIONS,
                ...(t.fieldPositions ?? {}),
                [key]: { ...(t.fieldPositions?.[key] ?? DEFAULT_FIELD_POSITIONS[key] ?? {}), size },
            },
        }));
    }, []);

    const handleRotate = useCallback((key, rotation) => {
        setTemplate(t => ({
            ...t,
            fieldPositions: {
                ...DEFAULT_FIELD_POSITIONS,
                ...(t.fieldPositions ?? {}),
                [key]: { ...(t.fieldPositions?.[key] ?? DEFAULT_FIELD_POSITIONS[key] ?? {}), rotation },
            },
        }));
    }, []);

    function toggleField(key) {
        setTemplate(t => {
            const fields = t.fields ?? [];
            return { ...t, fields: fields.includes(key) ? fields.filter(k => k !== key) : [...fields, key] };
        });
    }

    function set(key, val) {
        setTemplate(t => ({ ...t, [key]: val }));
    }

    async function save() {
        setSaving(true);
        setMsg(null);
        const res = await fetch("/api/admin/settings/integrations", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ labelTemplate: templateRef.current }),
        });
        const d = await res.json();
        setMsg(d.error ? { type: "error", text: d.error } : { type: "success", text: "Label settings saved" });
        setSaving(false);
    }

    const role = session?.user?.role;
    // Owners have all permissions implicitly; everyone else needs labelCreator explicitly granted
    const canSave = role === "owner" || session?.user?.permissions?.labelCreator === true;
    if (loading) return null;

    return (
        <Box sx={{ bgcolor: "background.default", minHeight: "100vh" }}>
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" fontWeight={700}>Label Creator</Typography>
                    <Typography variant="body2" color="text.secondary">
                        Design your production pick label. Left-drag fields to reposition. Right-click a field to resize or rotate it.
                    </Typography>
                </Box>

                {msg && <Alert severity={msg.type} sx={{ mb: 3 }} onClose={() => setMsg(null)}>{msg.text}</Alert>}

                <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3, borderBottom: 1, borderColor: "divider" }}>
                    <Tab label="Label Design" value="design" />
                    <Tab label="Special Cases" value="special" />
                </Tabs>

                {/* ══ SPECIAL CASES TAB ══════════════════════════════════════════ */}
                {tab === "special" && (
                    <Stack direction={{ xs: "column", md: "row" }} spacing={3} alignItems="flex-start">
                        {/* Left: marketplace list */}
                        <Stack spacing={1.5} sx={{ width: { xs: "100%", md: 220 }, flexShrink: 0 }}>
                            <Typography variant="subtitle2" fontWeight={700}>Marketplaces</Typography>
                            <Typography variant="caption" color="text.secondary">
                                Enable a marketplace to configure a secondary label printed before the pick label.
                            </Typography>
                            {SPECIAL_CASE_MARKETPLACES.map(mk => {
                                const sc = getSpecialCase(mk.key);
                                return (
                                    <Paper
                                        key={mk.key}
                                        variant="outlined"
                                        onClick={() => { if (sc.enabled) setActiveCase(mk.key); }}
                                        sx={{
                                            p: 1.5, borderRadius: 2, cursor: sc.enabled ? "pointer" : "default",
                                            borderColor: activeCase === mk.key ? mk.color : "divider",
                                            bgcolor: activeCase === mk.key ? `${mk.color}0d` : "background.paper",
                                            transition: "all 150ms",
                                        }}
                                    >
                                        <Stack direction="row" alignItems="center" spacing={1.5}>
                                            <Avatar sx={{ width: 28, height: 28, bgcolor: mk.color, fontSize: 11, fontWeight: 700 }}>
                                                {mk.label[0]}
                                            </Avatar>
                                            <Typography variant="body2" fontWeight={600} sx={{ flex: 1 }}>{mk.label}</Typography>
                                            <Switch
                                                size="small"
                                                checked={sc.enabled}
                                                onClick={e => e.stopPropagation()}
                                                onChange={() => toggleSpecialCase(mk.key)}
                                            />
                                        </Stack>
                                    </Paper>
                                );
                            })}
                            {canSave && (
                                <Button variant="contained" size="large" disabled={saving} onClick={save} fullWidth sx={{ mt: 1 }}>
                                    {saving ? "Saving…" : "Save"}
                                </Button>
                            )}
                        </Stack>

                        {/* Right: editor for active case */}
                        {activeCase && (() => {
                            const mk = SPECIAL_CASE_MARKETPLACES.find(m => m.key === activeCase);
                            const sc = getSpecialCase(activeCase);
                            const scTemplate = {
                                ...template,
                                fields: sc.fields ?? [],
                                fieldPositions: { ...DEFAULT_FIELD_POSITIONS, ...(sc.fieldPositions ?? {}) },
                            };
                            return (
                                <Stack spacing={2} sx={{ flex: 1 }}>
                                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                                        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
                                            {mk.label} — Extra Label
                                        </Typography>
                                        <Stack spacing={2}>
                                            <FormControl size="small" fullWidth>
                                                <InputLabel>Barcode field</InputLabel>
                                                <Select
                                                    label="Barcode field"
                                                    value={sc.barcodeField ?? "upc"}
                                                    onChange={e => setSpecialCase(activeCase, { barcodeField: e.target.value })}
                                                >
                                                    <MenuItem value="upc">UPC / GTIN</MenuItem>
                                                    <MenuItem value="pieceId">Piece ID</MenuItem>
                                                </Select>
                                            </FormControl>
                                            <FormControlLabel
                                                control={
                                                    <Switch
                                                        size="small"
                                                        checked={!!sc.showBrandLogo}
                                                        onChange={() => setSpecialCase(activeCase, { showBrandLogo: !sc.showBrandLogo })}
                                                    />
                                                }
                                                label={<Typography variant="body2">Show brand logo</Typography>}
                                                sx={{ m: 0 }}
                                            />
                                            {sc.showBrandLogo && brands.length > 0 && (
                                                <FormControl size="small" fullWidth>
                                                    <InputLabel>Brand</InputLabel>
                                                    <Select
                                                        label="Brand"
                                                        value={sc.brandId ?? ""}
                                                        onChange={e => setSpecialCase(activeCase, { brandId: e.target.value })}
                                                    >
                                                        <MenuItem value="">None</MenuItem>
                                                        {brands.map(b => (
                                                            <MenuItem key={b._id} value={b._id}>
                                                                <Stack direction="row" spacing={1} alignItems="center">
                                                                    {b.logo && <Avatar src={b.logo} sx={{ width: 20, height: 20 }} variant="rounded" />}
                                                                    <span>{b.name}</span>
                                                                </Stack>
                                                            </MenuItem>
                                                        ))}
                                                    </Select>
                                                </FormControl>
                                            )}
                                        </Stack>
                                    </Paper>

                                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                                        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.5 }}>Fields</Typography>
                                        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                                            Toggle fields · Left-drag to reposition · Right-click to resize/rotate
                                        </Typography>
                                        <Stack spacing={0}>
                                            {SPECIAL_OPTIONAL_FIELDS.map(f => (
                                                <FormControlLabel
                                                    key={f.key}
                                                    control={
                                                        <Switch
                                                            size="small"
                                                            checked={(sc.fields ?? []).includes(f.key)}
                                                            onChange={() => toggleSpecialField(activeCase, f.key)}
                                                        />
                                                    }
                                                    label={<Typography variant="body2">{f.label}</Typography>}
                                                    sx={{ m: 0 }}
                                                />
                                            ))}
                                        </Stack>
                                    </Paper>

                                    <LabelCanvas
                                        template={{
                                            ...scTemplate,
                                            // Override OPTIONAL_FIELDS sample lookup inside canvas
                                            _specialFields: SPECIAL_OPTIONAL_FIELDS,
                                        }}
                                        selectedKey={specialSelected}
                                        onSelect={setSpecialSelected}
                                        onMove={(key, x, y) => handleSpecialMove(activeCase, key, x, y)}
                                        onResize={(key, size) => handleSpecialResize(activeCase, key, size)}
                                        onRotate={(key, rotation) => handleSpecialRotate(activeCase, key, rotation)}
                                    />
                                </Stack>
                            );
                        })()}

                        {!activeCase && (
                            <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", py: 8 }}>
                                <Typography color="text.disabled">Enable and select a marketplace to configure its label.</Typography>
                            </Box>
                        )}
                    </Stack>
                )}

                {/* ══ LABEL DESIGN TAB ═══════════════════════════════════════════ */}
                {tab === "design" && <Stack direction={{ xs: "column", md: "row" }} spacing={3} alignItems="flex-start">

                    {/* ── Sidebar controls ── */}
                    <Stack spacing={2} sx={{ width: { xs: "100%", md: 260 }, flexShrink: 0 }}>

                        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>Label Settings</Typography>
                            <Stack spacing={1.5}>
                                <FormControl size="small" fullWidth>
                                    <InputLabel>Size</InputLabel>
                                    <Select
                                        label="Size"
                                        value={`${template.width}x${template.height}`}
                                        onChange={e => {
                                            const sz = LABEL_SIZES.find(s => `${s.width}x${s.height}` === e.target.value) ?? LABEL_SIZES[0];
                                            setTemplate(t => ({ ...t, width: sz.width, height: sz.height }));
                                        }}
                                    >
                                        {LABEL_SIZES.map(s => (
                                            <MenuItem key={`${s.width}x${s.height}`} value={`${s.width}x${s.height}`}>{s.label}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                                <FormControl size="small" fullWidth>
                                    <InputLabel>Format</InputLabel>
                                    <Select label="Format" value={template.format} onChange={e => set("format", e.target.value)}>
                                        <MenuItem value="ZPL">ZPL (Zebra direct)</MenuItem>
                                        <MenuItem value="PDF">PDF</MenuItem>
                                    </Select>
                                </FormControl>
                            </Stack>
                        </Paper>

                        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>Fixed Fields</Typography>
                            <Stack spacing={0.75}>
                                {[
                                    { label: "PO Number", hint: "top" },
                                    { label: "Piece ID",  hint: "top" },
                                ].map(f => (
                                    <Stack key={f.label} direction="row" alignItems="center" spacing={1}>
                                        <LockIcon sx={{ fontSize: 13, color: "text.disabled" }} />
                                        <Typography variant="body2" color="text.secondary">{f.label}</Typography>
                                        <Typography variant="caption" color="text.disabled" sx={{ ml: "auto" }}>({f.hint})</Typography>
                                    </Stack>
                                ))}
                                <Stack direction="row" alignItems="center" spacing={1}>
                                    <Typography variant="body2" color="text.secondary">Barcode</Typography>
                                    <Typography variant="caption" color="text.disabled" sx={{ ml: "auto" }}>(draggable)</Typography>
                                </Stack>
                            </Stack>
                        </Paper>

                        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.5 }}>Optional Fields</Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                                Toggle to show on label
                            </Typography>
                            <Stack spacing={0}>
                                {OPTIONAL_FIELDS.map(f => (
                                    <FormControlLabel
                                        key={f.key}
                                        control={
                                            <Switch
                                                size="small"
                                                checked={(template.fields ?? []).includes(f.key)}
                                                onChange={() => toggleField(f.key)}
                                            />
                                        }
                                        label={<Typography variant="body2">{f.label}</Typography>}
                                        sx={{ m: 0 }}
                                    />
                                ))}
                            </Stack>
                        </Paper>

                        {canSave && (
                            <Button variant="contained" size="large" disabled={saving} onClick={save} fullWidth>
                                {saving ? "Saving…" : "Save label settings"}
                            </Button>
                        )}
                    </Stack>

                    {/* ── Canvas preview ── */}
                    <Box sx={{ flex: 1, position: { md: "sticky" }, top: { md: 80 } }}>
                        <LabelCanvas
                            template={template}
                            selectedKey={selected}
                            onSelect={setSelected}
                            onMove={handleMove}
                            onResize={handleResize}
                            onRotate={handleRotate}
                        />
                    </Box>
                </Stack>}
            </Container>
        </Box>
    );
}

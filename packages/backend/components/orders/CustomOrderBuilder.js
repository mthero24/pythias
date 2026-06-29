"use client";
import { useState, useRef, useEffect } from "react";
import {
    Box, Grid2, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Chip, Stack, IconButton, CircularProgress, Card, Tooltip,
    Select, MenuItem, FormControl, InputLabel, Autocomplete, InputAdornment,
    Checkbox, FormControlLabel,
} from "@mui/material";
import CloseIcon        from "@mui/icons-material/Close";
import AddIcon          from "@mui/icons-material/Add";
import DeleteIcon       from "@mui/icons-material/Delete";
import ImageIcon        from "@mui/icons-material/Image";
import EmailIcon        from "@mui/icons-material/Email";
import DownloadIcon     from "@mui/icons-material/Download";
import ReceiptIcon      from "@mui/icons-material/Receipt";
import BrushIcon        from "@mui/icons-material/Brush";
import EmbroideryIcon   from "@mui/icons-material/Texture";
import TextFieldsIcon   from "@mui/icons-material/TextFields";
import axios            from "axios";
import { UpscaleButton } from "../../exports";

const emptyCustomer = () => ({ name: "", email: "", company: "", phone: "", address: { street: "", city: "", state: "", zip: "", country: "US" } });
const emptyItem     = () => ({ blank: null, blankName: "", styleCode: "", color: "", size: "", quantity: 1, unitPrice: 0, printType: "", byob: false, selectedDesigns: {} });
const emptyDesign   = () => ({ location: "", artwork: "", dst: "" });

function PriceChip({ label, value, onSelect }) {
    if (!value) return null;
    return (
        <Chip label={`${label}: $${Number(value).toFixed(2)}`} size="small" variant="outlined"
            onClick={onSelect} sx={{ cursor: "pointer", fontSize: "0.7rem", "&:hover": { bgcolor: "action.hover" } }} />
    );
}

// ── Shared design (order-level) ───────────────────────────────────────────────

const FONT_OPTIONS = ["Sans Serif", "Serif", "Monospace", "Bold", "Italic", "Condensed"];
const CSS_FONT = { "Sans Serif": "sans-serif", "Serif": "serif", "Monospace": "monospace", "Bold": "sans-serif", "Italic": "sans-serif", "Condensed": "'Arial Narrow', sans-serif" };
const CSS_WEIGHT = { "Bold": 700 };
const CSS_STYLE  = { "Italic": "italic" };

function TextToImageModal({ open, onClose, onGenerated, apiBase }) {
    const [textVal,    setTextVal]    = useState("");
    const [textFont,   setTextFont]   = useState("Sans Serif");
    const [textColor,  setTextColor]  = useState("#000000");
    const [generating, setGenerating] = useState(false);

    const handleGenerate = async () => {
        if (!textVal.trim()) return;
        setGenerating(true);
        try {
            const res = await axios.post(`${apiBase || ""}/api/admin/custom-order/text-to-image`, {
                text: textVal, fontFamily: textFont, color: textColor,
            });
            if (res.data.url) {
                onGenerated(res.data.url);
                handleClose();
            }
        } catch (err) {
            alert("Text image failed: " + (err.response?.data?.error || err.message));
        } finally { setGenerating(false); }
    };

    const handleClose = () => {
        setTextVal(""); setTextFont("Sans Serif"); setTextColor("#000000");
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth
            PaperProps={{ sx: { borderRadius: 2 } }}>
            <DialogTitle sx={{ fontWeight: 700, display: "flex", justifyContent: "space-between", alignItems: "center", pb: 1 }}>
                Text to Image
                <IconButton size="small" onClick={handleClose}><CloseIcon fontSize="small" /></IconButton>
            </DialogTitle>
            <DialogContent dividers>
                <Stack spacing={2} sx={{ pt: 1 }}>
                    <TextField size="small" fullWidth label="Text" placeholder="e.g. Smith 10"
                        value={textVal} onChange={e => setTextVal(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && handleGenerate()} autoFocus />
                    <Grid2 container spacing={1.5} alignItems="center">
                        <Grid2 size={{ xs: 12, sm: 8 }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Font</InputLabel>
                                <Select label="Font" value={textFont} onChange={e => setTextFont(e.target.value)}>
                                    {FONT_OPTIONS.map(f => (
                                        <MenuItem key={f} value={f}>
                                            <Typography sx={{ fontFamily: CSS_FONT[f], fontWeight: CSS_WEIGHT[f] || 400, fontStyle: CSS_STYLE[f] || "normal" }}>{f}</Typography>
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid2>
                        <Grid2 size={{ xs: 12, sm: 4 }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <Box component="input" type="color" value={textColor}
                                    onChange={e => setTextColor(e.target.value)}
                                    sx={{ width: 40, height: 40, border: "1px solid", borderColor: "divider", borderRadius: 1, cursor: "pointer", p: 0, flexShrink: 0 }} />
                                <Typography variant="body2" color="text.secondary">{textColor}</Typography>
                            </Box>
                        </Grid2>
                    </Grid2>
                    {textVal && (
                        <Box sx={{ px: "4%", py: 1.5, borderRadius: 1.5, bgcolor: "action.hover", border: "1px solid", borderColor: "divider", overflow: "hidden" }}>
                            <Typography sx={{
                                fontFamily: CSS_FONT[textFont] || "sans-serif",
                                fontWeight: CSS_WEIGHT[textFont] || 400,
                                fontStyle:  CSS_STYLE[textFont]  || "normal",
                                fontSize:   `clamp(14px, calc(92% / ${Math.max(1, textVal.length)} * 1.65), 72px)`,
                                color:      textColor,
                                lineHeight: 1.4,
                                whiteSpace: "nowrap",
                                textAlign:  "center",
                                width:      "100%",
                            }}>
                                {textVal}
                            </Typography>
                        </Box>
                    )}
                </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 2, py: 1.5 }}>
                <Button onClick={handleClose}>Cancel</Button>
                <Button variant="contained" onClick={handleGenerate}
                    disabled={generating || !textVal.trim()}
                    startIcon={generating ? <CircularProgress size={14} color="inherit" /> : null}>
                    {generating ? "Generating…" : "Create Image"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

function DesignRow({ idx, design, printLocations, onUpdate, onRemove, apiBase }) {
    const [uploading,     setUploading]     = useState(false);
    const [digitizing,    setDigitizing]    = useState(false);
    const [showTextModal, setShowTextModal] = useState(false);
    const [dragOver,      setDragOver]      = useState(false);

    const doUpload = async (file) => {
        if (!file) return;
        setUploading(true);
        const formData = new FormData();
        formData.append("file", file);
        try {
            const res = await axios.post(`${apiBase || ""}/api/admin/upload`, formData);
            const url = res.data?.url || res.data?.key;
            if (url) onUpdate(idx, "artwork", url);
        } catch { /* non-fatal */ } finally { setUploading(false); }
    };

    const handleUpload = (e) => doUpload(e.target.files?.[0]);

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file?.type.startsWith("image/")) doUpload(file);
    };

    const handleDigitize = async () => {
        if (!design.artwork) return;
        setDigitizing(true);
        try {
            const res = await axios.post(`${apiBase || ""}/api/admin/custom-order/generate-embroidery`, {
                artworkUrl: design.artwork,
            });
            if (res.data.dstUrl) onUpdate(idx, "dst", res.data.dstUrl);
            if (res.data.previewPngUrl) onUpdate(idx, "artwork", res.data.previewPngUrl);
        } catch (err) {
            alert("Digitize failed: " + (err.response?.data?.error || err.message));
        } finally { setDigitizing(false); }
    };

    return (
        <Card variant="outlined" sx={{ borderRadius: 2, overflow: "hidden", height: "100%", display: "flex", flexDirection: "column" }}>
            <TextToImageModal
                open={showTextModal}
                onClose={() => setShowTextModal(false)}
                onGenerated={url => onUpdate(idx, "artwork", url)}
                apiBase={apiBase}
            />

            {/* Image area */}
            {design.artwork ? (
                <Box sx={{
                    position: "relative",
                    bgcolor: "repeating-conic-gradient(#e0e0e0 0% 25%, #fff 0% 50%) 0 0 / 10px 10px",
                    height: 180, flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                    <Box component="img" src={design.artwork}
                        sx={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", display: "block" }} />
                    <Box component="label" htmlFor={`design-art-${idx}`}
                        sx={{ position: "absolute", top: 6, right: 6, cursor: "pointer" }}>
                        <input type="file" accept="image/*" id={`design-art-${idx}`} style={{ display: "none" }} onChange={handleUpload} />
                        <Tooltip title="Replace artwork">
                            <IconButton size="small" component="span"
                                sx={{ bgcolor: "rgba(255,255,255,0.85)", "&:hover": { bgcolor: "#fff" } }}>
                                <ImageIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </Box>
                    {design.dst && (
                        <Tooltip title="Download DST embroidery file">
                            <Chip label="DST ↓" size="small" color="secondary" variant="filled"
                                component="a" href={design.dst} download="embroidery.dst"
                                clickable
                                sx={{ position: "absolute", bottom: 6, left: 6, fontSize: "0.65rem", height: 22, bgcolor: "rgba(255,255,255,0.9)" }} />
                        </Tooltip>
                    )}
                </Box>
            ) : (
                <Box
                    component="label" htmlFor={`design-art-${idx}`}
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    sx={{
                        height: 160, flexShrink: 0,
                        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                        border: "2px dashed", borderColor: dragOver ? "primary.main" : "divider",
                        bgcolor: dragOver ? "action.selected" : "action.hover",
                        cursor: "pointer", transition: "all 0.15s", gap: 1,
                        "&:hover": { borderColor: "primary.light", bgcolor: "action.selected" },
                    }}>
                    <input type="file" accept="image/*" id={`design-art-${idx}`} style={{ display: "none" }} onChange={handleUpload} />
                    {uploading ? (
                        <CircularProgress size={28} />
                    ) : (
                        <>
                            <ImageIcon sx={{ fontSize: 36, color: "text.disabled" }} />
                            <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                Drop image or click to upload
                            </Typography>
                        </>
                    )}
                </Box>
            )}

            {/* Card body */}
            <Box sx={{ p: 1.5, display: "flex", flexDirection: "column", gap: 1, flex: 1 }}>
                {/* Location */}
                <FormControl fullWidth size="small">
                    <Select displayEmpty value={design.location}
                        onChange={e => onUpdate(idx, "location", e.target.value)}>
                        <MenuItem value="" disabled><em>Select location…</em></MenuItem>
                        {printLocations.map(pl => <MenuItem key={pl} value={pl}>{pl}</MenuItem>)}
                    </Select>
                </FormControl>

                {/* Action buttons */}
                {design.artwork ? (
                    <Stack direction="row" spacing={0.75} flexWrap="wrap">
                        <UpscaleButton imageUrl={design.artwork} onUpscaled={url => onUpdate(idx, "artwork", url)} removeBackground={true} />
                        <Tooltip title="Send through embroidery digitizer — generates DST file and embroidered preview">
                            <span>
                                <Button size="small" variant="outlined" color="secondary"
                                    startIcon={digitizing ? <CircularProgress size={14} color="inherit" /> : <EmbroideryIcon />}
                                    onClick={handleDigitize} disabled={digitizing}
                                    sx={{ fontSize: "0.72rem", textTransform: "none" }}>
                                    {digitizing ? "Digitizing…" : design.dst ? "Re-Digitize" : "Digitize"}
                                </Button>
                            </span>
                        </Tooltip>
                    </Stack>
                ) : (
                    <Button fullWidth size="small" variant="outlined" color="info"
                        startIcon={<TextFieldsIcon />}
                        onClick={() => setShowTextModal(true)}
                        sx={{ fontSize: "0.75rem", textTransform: "none" }}>
                        Text to Image
                    </Button>
                )}

                <Box sx={{ display: "flex", justifyContent: "flex-end", mt: "auto" }}>
                    <IconButton size="small" onClick={() => onRemove(idx)} color="error">
                        <DeleteIcon fontSize="small" />
                    </IconButton>
                </Box>
            </Box>
        </Card>
    );
}

// ── Line item ─────────────────────────────────────────────────────────────────

// Which locations have more than one design uploaded?
function multiDesignLocations(designs) {
    const counts = {};
    for (const d of designs) {
        if (d.location && d.artwork) counts[d.location] = (counts[d.location] || []).concat(d);
    }
    return Object.fromEntries(Object.entries(counts).filter(([, arr]) => arr.length > 1));
}

function LineItem({ idx, item, onUpdate, onRemove, apiBase, printTypes, designs, byobRates = { byobDefaultRate: 0, byobRatesByType: [] } }) {
    const [blanks,        setBlanks]        = useState([]);
    const [blanksLoading, setBlanksLoading] = useState(false);
    const debounceRef = useRef(null);

    const blankObj    = blanks.find(b => b.code === item.styleCode)
        || (item.styleCode ? { code: item.styleCode, name: item.blankName, colors: [], sizes: [] } : null);
    const colorOptions = blankObj?.colors || [];
    const sizeOptions  = blankObj?.sizes  || [];
    const selSize      = sizeOptions.find(s => s.name === item.size);
    const selPrintType = printTypes.find(pt => pt.name === item.printType);

    // Build a rendered product image for every design that has artwork
    const productImages = (blankObj?.code && item.color)
        ? (designs || [])
            .filter(d => d.artwork)
            .map(d => {
                const side = d.location ? d.location.toLowerCase().replace(/\s+/g, "") : "front";
                return {
                    side,
                    label: d.location || "Front",
                    url: `${apiBase || ""}/api/renderImages/img.jpg?blank=${encodeURIComponent(blankObj.code)}&colorName=${encodeURIComponent(item.color)}&side=${side}&width=200&design=${encodeURIComponent(d.artwork)}`,
                };
            })
        : [];

    const searchBlanks = (q) => {
        clearTimeout(debounceRef.current);
        if (!q || q.length < 1) return;
        debounceRef.current = setTimeout(async () => {
            setBlanksLoading(true);
            try {
                const res = await axios.get(`${apiBase || ""}/api/admin/custom-order/blanks?q=${encodeURIComponent(q)}`);
                setBlanks(res.data?.blanks || []);
            } finally { setBlanksLoading(false); }
        }, 300);
    };

    const handleBlankChange = (_, val) => {
        if (!val) { onUpdate(idx, { blank: null, blankName: "", styleCode: "", color: "", size: "", unitPrice: 0 }); return; }
        onUpdate(idx, { blank: val._id, blankName: val.name, styleCode: val.code, color: "", size: "", unitPrice: 0 });
        setBlanks(prev => prev.find(b => b.code === val.code) ? prev : [val, ...prev]);
    };

    const handlePrintTypeChange = (name) => {
        const pt = printTypes.find(p => p.name === name);
        onUpdate(idx, { printType: name, unitPrice: pt?.price ? (item.unitPrice || 0) + pt.price : item.unitPrice });
    };

    return (
        <Card variant="outlined" sx={{ borderRadius: 2, mb: 1.5 }}>
            <Box sx={{ px: 2, py: 1, borderBottom: "1px solid", borderColor: "divider", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Typography variant="subtitle2" fontWeight={700} color="text.secondary">ITEM {idx + 1}</Typography>
                <IconButton size="small" onClick={() => onRemove(idx)} color="error"><DeleteIcon fontSize="small" /></IconButton>
            </Box>
            <Box sx={{ p: 2 }}>
                <Grid2 container spacing={1.5}>
                    {/* Product images — one per design side (front, back, etc.) */}
                    {productImages.length > 0 && (
                        <Grid2 size={{ xs: 12, sm: "auto" }}>
                            <Box sx={{ display: "flex", gap: 0.75 }}>
                                {productImages.map(({ side, label, url }) => (
                                    <Box key={side} sx={{ textAlign: "center" }}>
                                        <Box component="img"
                                            src={url}
                                            sx={{ width: 80, height: 80, objectFit: "contain", borderRadius: 1.5, border: "1px solid", borderColor: "divider", bgcolor: "#f9fafb", display: "block" }}
                                            onError={e => { e.target.style.display = "none"; }}
                                        />
                                        {productImages.length > 1 && (
                                            <Typography variant="caption" color="text.secondary" sx={{ textTransform: "capitalize", display: "block", mt: 0.25, fontSize: "0.65rem" }}>
                                                {label}
                                            </Typography>
                                        )}
                                    </Box>
                                ))}
                            </Box>
                        </Grid2>
                    )}

                    <Grid2 size={{ xs: 12, sm: productImages.length > 0 ? true : 5 }}>
                        <Grid2 container spacing={1.5}>
                            <Grid2 size={{ xs: 12, sm: 6 }}>
                                <Autocomplete
                                    options={blanks} loading={blanksLoading}
                                    getOptionLabel={o => o ? `${o.code} — ${o.name}` : ""}
                                    value={blankObj} onChange={handleBlankChange}
                                    onInputChange={(_, val, reason) => { if (reason === "input") searchBlanks(val); }}
                                    isOptionEqualToValue={(o, v) => o.code === v?.code}
                                    filterOptions={x => x}
                                    renderInput={params => (
                                        <TextField {...params} size="small" label="Blank / Style"
                                            InputProps={{ ...params.InputProps, endAdornment: (<>{blanksLoading ? <CircularProgress size={16} /> : null}{params.InputProps.endAdornment}</>) }} />
                                    )}
                                    noOptionsText="Type to search blanks…"
                                />
                            </Grid2>
                            <Grid2 size={{ xs: 6, sm: 3 }}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Color</InputLabel>
                                    <Select label="Color" value={item.color} disabled={!blankObj}
                                        onChange={e => onUpdate(idx, { color: e.target.value, size: "", unitPrice: 0 })}>
                                        {colorOptions.map(c => <MenuItem key={c._id || c.name} value={c.name}>{c.name}</MenuItem>)}
                                    </Select>
                                </FormControl>
                            </Grid2>
                            <Grid2 size={{ xs: 6, sm: 3 }}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Size</InputLabel>
                                    <Select label="Size" value={item.size} disabled={!item.color}
                                        onChange={e => {
                                            const s = sizeOptions.find(s => s.name === e.target.value);
                                            onUpdate(idx, { size: e.target.value, unitPrice: s?.retailPrice || s?.wholesalePrice || 0 });
                                        }}>
                                        {sizeOptions.filter(s => !s.hidden).map(s => <MenuItem key={s.name} value={s.name}>{s.name}</MenuItem>)}
                                    </Select>
                                </FormControl>
                            </Grid2>
                        </Grid2>
                    </Grid2>

                    {/* Print type */}
                    <Grid2 size={{ xs: 12, sm: 3 }}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Print Type</InputLabel>
                            <Select label="Print Type" value={item.printType}
                                onChange={e => handlePrintTypeChange(e.target.value)}>
                                <MenuItem value=""><em>None</em></MenuItem>
                                {printTypes.map(pt => (
                                    <MenuItem key={pt.name} value={pt.name}>
                                        {pt.name}{pt.price > 0 ? ` (+$${pt.price.toFixed(2)})` : ""}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        {selPrintType?.price > 0 && (
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
                                Upcharge: +${selPrintType.price.toFixed(2)}/unit
                            </Typography>
                        )}
                    </Grid2>

                    {/* Qty */}
                    <Grid2 size={{ xs: 6, sm: 2 }}>
                        <TextField size="small" fullWidth label="Qty" type="number" value={item.quantity}
                            onChange={e => onUpdate(idx, { quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                            inputProps={{ min: 1 }} />
                    </Grid2>

                    {/* Unit price */}
                    <Grid2 size={{ xs: 12, sm: 4 }}>
                        <TextField size="small" fullWidth label="Unit Price" type="number" value={item.unitPrice}
                            onChange={e => onUpdate(idx, { unitPrice: parseFloat(e.target.value) || 0 })}
                            InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                            inputProps={{ min: 0, step: 0.01 }} />
                        {selSize && (
                            <Stack direction="row" spacing={0.5} sx={{ mt: 0.5, flexWrap: "wrap", gap: 0.5 }}>
                                <PriceChip label="Retail"    value={selSize.retailPrice}    onSelect={() => onUpdate(idx, { unitPrice: selSize.retailPrice    || 0 })} />
                                <PriceChip label="Wholesale" value={selSize.wholesalePrice} onSelect={() => onUpdate(idx, { unitPrice: selSize.wholesalePrice || 0 })} />
                            </Stack>
                        )}
                        <FormControlLabel sx={{ m: 0, mt: 0.25 }}
                            control={<Checkbox size="small" sx={{ p: 0.25 }} checked={!!item.byob}
                                onChange={e => {
                                    const on = e.target.checked;
                                    const hit = (byobRates.byobRatesByType || []).find(r => item.printType && r.printType?.toLowerCase() === String(item.printType).toLowerCase());
                                    const rate = hit ? hit.rate : (byobRates.byobDefaultRate || 0);
                                    onUpdate(idx, on ? { byob: true, unitPrice: rate } : { byob: false });
                                }} />}
                            label={<Typography variant="caption" color="text.secondary">Customer brings blank (BYO)</Typography>} />
                    </Grid2>

                    {/* Line total */}
                    <Grid2 size={{ xs: 6, sm: 3 }} sx={{ display: "flex", alignItems: "flex-end" }}>
                        <Typography variant="body2" fontWeight={700} color="success.main">
                            ${((item.quantity || 0) * (item.unitPrice || 0)).toFixed(2)}
                        </Typography>
                    </Grid2>
                </Grid2>

                {/* Design picker — only shown when a location has multiple artwork options */}
                {(() => {
                    const multi = multiDesignLocations(designs);
                    if (!Object.keys(multi).length) return null;
                    return (
                        <Box sx={{ mt: 1.5, pt: 1.5, borderTop: "1px solid", borderColor: "divider" }}>
                            <Typography variant="caption" fontWeight={700} color="text.secondary" display="block" sx={{ mb: 1 }}>
                                SELECT DESIGN PER LOCATION
                            </Typography>
                            <Stack spacing={1}>
                                {Object.entries(multi).map(([location, options]) => {
                                    const selected = item.selectedDesigns?.[location];
                                    return (
                                        <Box key={location}>
                                            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: "block" }}>
                                                {location}
                                            </Typography>
                                            <Stack direction="row" spacing={1} flexWrap="wrap">
                                                {options.map((d, oi) => {
                                                    const isSelected = selected === d.artwork;
                                                    return (
                                                        <Box
                                                            key={oi}
                                                            onClick={() => onUpdate(idx, {
                                                                selectedDesigns: { ...item.selectedDesigns, [location]: d.artwork }
                                                            })}
                                                            sx={{
                                                                width: 56, height: 56, borderRadius: 1.5, overflow: "hidden", cursor: "pointer", flexShrink: 0,
                                                                border: "2px solid", borderColor: isSelected ? "primary.main" : "divider",
                                                                bgcolor: "repeating-conic-gradient(#e0e0e0 0% 25%, #fff 0% 50%) 0 0 / 8px 8px",
                                                                position: "relative",
                                                                "&:hover": { borderColor: "primary.light" },
                                                                transition: "border-color 0.15s",
                                                            }}
                                                        >
                                                            <Box component="img" src={d.artwork}
                                                                sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                                            {isSelected && (
                                                                <Box sx={{
                                                                    position: "absolute", inset: 0, bgcolor: "rgba(33,150,243,0.18)",
                                                                    display: "flex", alignItems: "center", justifyContent: "center",
                                                                }}>
                                                                    <Box sx={{ width: 18, height: 18, borderRadius: "50%", bgcolor: "primary.main", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                                        <Typography sx={{ color: "#fff", fontSize: "0.65rem", fontWeight: 700, lineHeight: 1 }}>✓</Typography>
                                                                    </Box>
                                                                </Box>
                                                            )}
                                                        </Box>
                                                    );
                                                })}
                                            </Stack>
                                        </Box>
                                    );
                                })}
                            </Stack>
                        </Box>
                    );
                })()}
            </Box>
        </Card>
    );
}

// ── Main builder ──────────────────────────────────────────────────────────────

export function CustomOrderBuilder({ open, setOpen, onSaved, apiBase = "" }) {
    const [poNumber,      setPoNumber]      = useState("");
    const [customer,      setCustomer]      = useState(emptyCustomer());
    const [items,         setItems]         = useState([emptyItem()]);
    const [designs,       setDesigns]       = useState([emptyDesign()]);
    const [notes,         setNotes]         = useState("");
    const [shippingCost,  setShippingCost]  = useState(0);
    const [taxRate,       setTaxRate]       = useState(0);
    const [discountPct,   setDiscountPct]   = useState(0);
    const [dateNeeded,    setDateNeeded]    = useState("");
    const [shippingType,  setShippingType]  = useState("Standard");
    const [inStorePickup, setInStorePickup] = useState(false);
    const [saving,        setSaving]        = useState(false);
    const [savedOrder,    setSavedOrder]    = useState(null);

    const [emailForm,      setEmailForm]      = useState({ show: false, address: "", sending: false, sent: false, err: "" });
    const [printLocations, setPrintLocations] = useState([]);
    const [printTypes,     setPrintTypes]     = useState([]);
    const [byobRates,      setByobRates]      = useState({ byobDefaultRate: 0, byobRatesByType: [] });

    useEffect(() => {
        if (!open) return;
        Promise.all([
            axios.get(`${apiBase}/api/admin/custom-order/print-locations`).then(r => setPrintLocations(r.data?.locations || [])).catch(() => {}),
            axios.get(`${apiBase}/api/admin/custom-order/print-types`).then(r => setPrintTypes(r.data?.printTypes || [])).catch(() => {}),
            axios.get(`${apiBase}/api/byob-rates`).then(r => setByobRates(r.data)).catch(() => {}),
        ]);
    }, [open, apiBase]);

    const updateItem     = (idx, patch) => setItems(prev => prev.map((it, i) => i === idx ? { ...it, ...patch } : it));
    const addItem        = () => setItems(prev => [...prev, emptyItem()]);
    const removeItem     = (idx) => setItems(prev => prev.filter((_, i) => i !== idx));

    const updateDesign   = (idx, field, value) => setDesigns(prev => prev.map((d, i) => i === idx ? { ...d, [field]: value } : d));
    const addDesign      = () => setDesigns(prev => [...prev, emptyDesign()]);
    const removeDesign   = (idx) => setDesigns(prev => prev.filter((_, i) => i !== idx));

    const updateCustomer = (f, v) => setCustomer(prev => ({ ...prev, [f]: v }));
    const updateAddress  = (f, v) => setCustomer(prev => ({ ...prev, address: { ...prev.address, [f]: v } }));

    const subtotal  = items.reduce((s, i) => s + (i.quantity || 0) * (i.unitPrice || 0), 0);
    const discount  = subtotal * (discountPct / 100);
    const tax       = (subtotal - discount) * (taxRate / 100);
    const total     = subtotal - discount + (shippingCost || 0) + tax;

    const reset = () => {
        setPoNumber(""); setCustomer(emptyCustomer()); setItems([emptyItem()]);
        setDesigns([emptyDesign()]); setNotes(""); setShippingCost(0); setTaxRate(0);
        setDateNeeded(""); setShippingType("Standard"); setInStorePickup(false); setSavedOrder(null);
        setEmailForm({ show: false, address: "", sending: false, sent: false, err: "" });
    };

    const handleClose = () => { reset(); setOpen(false); };

    const save = async () => {
        if (!poNumber) { alert("PO Number is required"); return; }
        setSaving(true);
        try {
            // Build per-item design objects.
            // Locations with a single design → auto-applied to all items.
            // Locations with multiple designs → use each item's selectedDesigns pick.
            const locationGroups = {};
            for (const d of designs) {
                if (d.location && d.artwork) {
                    if (!locationGroups[d.location]) locationGroups[d.location] = [];
                    locationGroups[d.location].push(d);
                }
            }

            const itemsWithDesigns = items.map(item => {
                const design = {};
                for (const [location, options] of Object.entries(locationGroups)) {
                    if (options.length === 1) {
                        design[location] = options[0].artwork; // auto-apply single
                    } else {
                        const picked = item.selectedDesigns?.[location];
                        if (picked) design[location] = picked;
                        else design[location] = options[0].artwork; // fallback to first if nothing picked
                    }
                }
                return { ...item, design };
            });

            const payload = {
                poNumber,
                customerEmail: customer.email,
                customer,
                items:         itemsWithDesigns,
                designs:       designs.filter(d => d.location),
                notes,
                shippingCost:  parseFloat(shippingCost) || 0,
                taxRate:       taxRate / 100,
                discountPct:   discountPct / 100,
                dateNeeded:    dateNeeded || null,
                shippingType:  inStorePickup ? "In-Store Pickup" : shippingType,
                inStorePickup,
            };
            const res = await axios.post(`${apiBase}/api/admin/custom-order`, payload);
            setSavedOrder(res.data.order);
            onSaved?.(res.data.order);
        } catch (err) {
            alert("Error saving order: " + (err.response?.data?.error || err.message));
        } finally { setSaving(false); }
    };

    const sendInvoiceEmail = async () => {
        if (!savedOrder) { alert("Save the order first"); return; }
        setEmailForm(f => ({ ...f, sending: true, err: "" }));
        try {
            const res = await axios.post(`${apiBase}/api/admin/custom-order/invoice`, { orderId: savedOrder._id, email: emailForm.address });
            if (res.data.ok) setEmailForm(f => ({ ...f, sent: true, sending: false }));
            else setEmailForm(f => ({ ...f, err: res.data.error || "Failed", sending: false }));
        } catch (e) {
            setEmailForm(f => ({ ...f, err: e.response?.data?.error || "Failed", sending: false }));
        }
    };

    const SectionHeader = ({ icon, label, sub, action }) => (
        <Box sx={{ px: 2, py: 1.25, borderBottom: "1px solid", borderColor: "divider", display: "flex", alignItems: "center", justifyContent: "space-between", bgcolor: "action.hover" }}>
            <Stack direction="row" alignItems="center" spacing={1}>
                {icon && <Box sx={{ color: "primary.main", display: "flex", alignItems: "center" }}>{icon}</Box>}
                <Typography variant="subtitle2" fontWeight={700}>{label}</Typography>
                {sub && <Typography variant="caption" color="text.disabled">{sub}</Typography>}
            </Stack>
            {action}
        </Box>
    );

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth scroll="paper"
            PaperProps={{ sx: { borderRadius: 3, maxHeight: "92vh" } }}>
            <DialogTitle sx={{ py: 1.5, px: 2.5, borderBottom: "1px solid", borderColor: "divider", bgcolor: "background.paper" }}>
                <Stack direction="row" alignItems="center" spacing={1.5}>
                    <Box sx={{ width: 36, height: 36, borderRadius: 2, flexShrink: 0, background: "linear-gradient(135deg, #D3A73D 0%, #b8860b 100%)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(211,167,61,0.35)" }}>
                        <ReceiptIcon sx={{ color: "#fff", fontSize: 20 }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1.2 }}>Custom Order Builder</Typography>
                        <Typography variant="caption" color="text.secondary">Items enter production when you mark the order paid</Typography>
                    </Box>
                    <IconButton size="small" onClick={handleClose}><CloseIcon fontSize="small" /></IconButton>
                </Stack>
            </DialogTitle>

            <DialogContent sx={{ p: 2.5 }}>
                <Stack spacing={2.5}>

                    {/* Order info + Customer — side by side on wide screens */}
                    <Grid2 container spacing={2.5}>
                        <Grid2 size={{ xs: 12, md: 5 }}>
                            <Card variant="outlined" sx={{ borderRadius: 2, height: "100%" }}>
                                <SectionHeader label="Order Info" icon={<ReceiptIcon sx={{ fontSize: 15 }} />} />
                                <Box sx={{ p: 2 }}>
                                    <Stack spacing={1.5}>
                                        <TextField fullWidth size="small" label="PO Number *" value={poNumber}
                                            onChange={e => setPoNumber(e.target.value)} required />
                                        <Grid2 container spacing={1.5}>
                                            <Grid2 size={7}>
                                                <FormControl fullWidth size="small" disabled={inStorePickup}>
                                                    <InputLabel>Shipping Type</InputLabel>
                                                    <Select label="Shipping Type" value={shippingType} onChange={e => setShippingType(e.target.value)}>
                                                        {["Standard", "Priority", "Express"].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                                                    </Select>
                                                </FormControl>
                                            </Grid2>
                                            <Grid2 size={5}>
                                                <TextField fullWidth size="small" label="Date Needed" type="date"
                                                    InputLabelProps={{ shrink: true }}
                                                    value={dateNeeded} onChange={e => setDateNeeded(e.target.value)} />
                                            </Grid2>
                                        </Grid2>
                                        <FormControlLabel
                                            control={<Checkbox size="small" checked={inStorePickup} onChange={e => setInStorePickup(e.target.checked)} />}
                                            label={<Typography variant="body2">In-Store Pickup <Typography component="span" variant="caption" color="text.secondary">— no shipping</Typography></Typography>}
                                        />
                                    </Stack>
                                </Box>
                            </Card>
                        </Grid2>

                        <Grid2 size={{ xs: 12, md: 7 }}>
                            <Card variant="outlined" sx={{ borderRadius: 2, height: "100%" }}>
                                <SectionHeader label="Customer" />
                                <Box sx={{ p: 2 }}>
                                    <Grid2 container spacing={1.5}>
                                        <Grid2 size={6}>
                                            <TextField fullWidth size="small" label="Name" value={customer.name} onChange={e => updateCustomer("name", e.target.value)} />
                                        </Grid2>
                                        <Grid2 size={6}>
                                            <TextField fullWidth size="small" label="Company" value={customer.company} onChange={e => updateCustomer("company", e.target.value)} />
                                        </Grid2>
                                        <Grid2 size={6}>
                                            <TextField fullWidth size="small" label="Email" type="email" value={customer.email} onChange={e => updateCustomer("email", e.target.value)} />
                                        </Grid2>
                                        <Grid2 size={6}>
                                            <TextField fullWidth size="small" label="Phone" value={customer.phone} onChange={e => updateCustomer("phone", e.target.value)} />
                                        </Grid2>
                                        <Grid2 size={12}>
                                            <TextField fullWidth size="small" label="Street Address" value={customer.address.street} onChange={e => updateAddress("street", e.target.value)} />
                                        </Grid2>
                                        <Grid2 size={5}>
                                            <TextField fullWidth size="small" label="City" value={customer.address.city} onChange={e => updateAddress("city", e.target.value)} />
                                        </Grid2>
                                        <Grid2 size={3}>
                                            <TextField fullWidth size="small" label="State" value={customer.address.state} onChange={e => updateAddress("state", e.target.value)} />
                                        </Grid2>
                                        <Grid2 size={4}>
                                            <TextField fullWidth size="small" label="ZIP" value={customer.address.zip} onChange={e => updateAddress("zip", e.target.value)} />
                                        </Grid2>
                                    </Grid2>
                                </Box>
                            </Card>
                        </Grid2>
                    </Grid2>

                    {/* Designs */}
                    <Card variant="outlined" sx={{ borderRadius: 2 }}>
                        <SectionHeader
                            label="Designs"
                            icon={<BrushIcon sx={{ fontSize: 15 }} />}
                            sub="— applied to all items"
                            action={<Button size="small" startIcon={<AddIcon />} onClick={addDesign}>Add Location</Button>}
                        />
                        <Box sx={{ p: 2 }}>
                            {designs.length === 0 ? (
                                <Typography variant="body2" color="text.disabled" sx={{ textAlign: "center", py: 2 }}>No designs added — click Add Location to start</Typography>
                            ) : (
                                <Grid2 container spacing={1.5}>
                                    {designs.map((d, idx) => (
                                        <Grid2 key={idx} size={{ xs: 12, sm: 6, md: 4 }}>
                                            <DesignRow idx={idx} design={d}
                                                printLocations={printLocations}
                                                onUpdate={updateDesign}
                                                onRemove={removeDesign}
                                                apiBase={apiBase}
                                            />
                                        </Grid2>
                                    ))}
                                </Grid2>
                            )}
                        </Box>
                    </Card>

                    {/* Line items */}
                    <Card variant="outlined" sx={{ borderRadius: 2 }}>
                        <SectionHeader
                            label="Line Items"
                            action={<Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={addItem}>Add Item</Button>}
                        />
                        <Box sx={{ p: 1.5 }}>
                            {items.map((item, idx) => (
                                <LineItem key={idx} idx={idx} item={item}
                                    onUpdate={updateItem} onRemove={removeItem}
                                    apiBase={apiBase} printTypes={printTypes}
                                    designs={designs} byobRates={byobRates} />
                            ))}
                        </Box>
                    </Card>

                    {/* Totals */}
                    <Card variant="outlined" sx={{ borderRadius: 2 }}>
                        <SectionHeader label="Order Total" />
                        <Box sx={{ p: 2 }}>
                            {/* Adjustments row */}
                            <Grid2 container spacing={1.5} sx={{ mb: 2 }}>
                                <Grid2 size={{ xs: 12, sm: 4 }}>
                                    <TextField fullWidth size="small" label="Shipping" type="number" value={shippingCost}
                                        onChange={e => setShippingCost(parseFloat(e.target.value) || 0)}
                                        InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                                        inputProps={{ min: 0, step: 0.01 }} />
                                </Grid2>
                                <Grid2 size={{ xs: 12, sm: 4 }}>
                                    <TextField fullWidth size="small" label="Discount" type="number" value={discountPct}
                                        onChange={e => setDiscountPct(parseFloat(e.target.value) || 0)}
                                        InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                                        inputProps={{ min: 0, max: 100, step: 1 }}
                                        color={discountPct > 0 ? "error" : "primary"} />
                                </Grid2>
                                <Grid2 size={{ xs: 12, sm: 4 }}>
                                    <TextField fullWidth size="small" label="Tax Rate" type="number" value={taxRate}
                                        onChange={e => setTaxRate(parseFloat(e.target.value) || 0)}
                                        InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                                        inputProps={{ min: 0, step: 0.1 }} />
                                </Grid2>
                            </Grid2>

                            {/* Summary breakdown */}
                            <Box sx={{ bgcolor: "action.hover", borderRadius: 1.5, p: 2 }}>
                                {[
                                    { label: "Subtotal", value: subtotal, always: true },
                                    discountPct > 0 && { label: `Discount (${discountPct}%)`, value: -discount, color: "error.main" },
                                    shippingCost > 0 && { label: "Shipping", value: shippingCost },
                                    taxRate > 0 && { label: `Tax (${taxRate}%)`, value: tax },
                                ].filter(Boolean).map(({ label, value, color }) => (
                                    <Stack key={label} direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                                        <Typography variant="body2" color="text.secondary">{label}</Typography>
                                        <Typography variant="body2" fontWeight={600} color={color || "text.primary"}>
                                            {value < 0 ? `-$${Math.abs(value).toFixed(2)}` : `$${value.toFixed(2)}`}
                                        </Typography>
                                    </Stack>
                                ))}
                                <Box sx={{ borderTop: "2px solid", borderColor: "divider", mt: 1, pt: 1 }}>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                        <Typography variant="subtitle1" fontWeight={700}>Total</Typography>
                                        <Typography variant="h5" fontWeight={800} color="success.main">${total.toFixed(2)}</Typography>
                                    </Stack>
                                </Box>
                            </Box>
                        </Box>
                    </Card>

                    <TextField fullWidth size="small" label="Order Notes" multiline rows={2} value={notes} onChange={e => setNotes(e.target.value)}
                        placeholder="Any special instructions, rush notes, or customer requests…" />

                    {/* Invoice actions */}
                    {savedOrder && (
                        <Card variant="outlined" sx={{ borderRadius: 2, bgcolor: "rgba(211,167,61,0.05)", border: "1px solid rgba(211,167,61,0.3)" }}>
                            <Box sx={{ px: 2, py: 1.25 }}>
                                <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap">
                                    <Chip label={`Saved: ${savedOrder.poNumber}`} size="small" color="success" />
                                    <Chip label="Awaiting Payment" size="small" color="warning" variant="outlined" />
                                    <Button size="small" variant="outlined" startIcon={<DownloadIcon />}
                                        component="a"
                                        href={`${apiBase}/api/admin/custom-order/invoice?orderId=${savedOrder._id}`}
                                        download={`invoice-${savedOrder.poNumber}.pdf`}>
                                        Download Invoice
                                    </Button>
                                    <Button size="small" variant="outlined" startIcon={<EmailIcon />}
                                        onClick={() => setEmailForm(f => ({ ...f, show: !f.show }))}>
                                        Email Invoice
                                    </Button>
                                </Stack>
                                {emailForm.show && (
                                    <Stack direction="row" spacing={1} sx={{ mt: 1.5 }} alignItems="center">
                                        <TextField size="small" placeholder="recipient@example.com" type="email"
                                            value={emailForm.address}
                                            onChange={e => setEmailForm(f => ({ ...f, address: e.target.value }))}
                                            onKeyDown={e => e.key === "Enter" && sendInvoiceEmail()}
                                            sx={{ flex: 1 }}
                                            error={!!emailForm.err} helperText={emailForm.err || undefined} />
                                        <Button size="small" variant="contained" onClick={sendInvoiceEmail}
                                            disabled={emailForm.sending || !emailForm.address}
                                            sx={{ bgcolor: "#D3A73D", color: "#111", "&:hover": { bgcolor: "#b8860b" }, whiteSpace: "nowrap" }}>
                                            {emailForm.sent ? "Sent ✓" : emailForm.sending ? "Sending…" : "Send"}
                                        </Button>
                                    </Stack>
                                )}
                            </Box>
                        </Card>
                    )}
                </Stack>
            </DialogContent>

            <DialogActions sx={{ px: 2, py: 1.5, borderTop: "1px solid", borderColor: "divider" }}>
                <Button onClick={handleClose}>Cancel</Button>
                <Button variant="contained" onClick={save} disabled={saving || !poNumber}
                    startIcon={saving ? <CircularProgress size={16} /> : null}>
                    {saving ? "Saving…" : savedOrder ? "Saved ✓" : "Create Order"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

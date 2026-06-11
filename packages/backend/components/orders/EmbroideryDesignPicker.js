"use client";
import { useState, useRef } from "react";
import {
    Box, Dialog, DialogTitle, DialogContent, DialogActions, Typography, Button,
    TextField, Grid2, Card, CardActionArea, CircularProgress, Stack, Chip,
    IconButton, InputAdornment, Tooltip, Slider,
} from "@mui/material";
import SearchIcon   from "@mui/icons-material/Search";
import CloseIcon    from "@mui/icons-material/Close";
import CheckIcon    from "@mui/icons-material/Check";
import DownloadIcon from "@mui/icons-material/Download";
import axios from "axios";

const CDN = (url) => url?.replace("https://images1.pythiastechnologies.com", "https://images2.pythiastechnologies.com/origin");

// ── Stitch preview (SVG returned from service) ─────────────────────────────────
function StitchPreview({ svg }) {
    if (!svg) return null;
    return (
        <Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1.5, overflow: "hidden", bgcolor: "#f9fafb" }}
            dangerouslySetInnerHTML={{ __html: svg }} />
    );
}

export function EmbroideryDesignPicker({ open, onClose, onSelect, apiBase = "" }) {
    const [q,          setQ]          = useState("");
    const [designs,    setDesigns]    = useState([]);
    const [loading,    setLoading]    = useState(false);
    const [selected,   setSelected]   = useState(null);
    const [widthMm,    setWidthMm]    = useState(100);
    const [generating, setGenerating] = useState(false);
    const [result,     setResult]     = useState(null); // { dstUrl, previewSvg, layers }
    const debounceRef = useRef(null);

    const searchDesigns = (val) => {
        setQ(val);
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(async () => {
            if (!val || val.length < 1) { setDesigns([]); return; }
            setLoading(true);
            try {
                const res = await axios.get(`${apiBase}/api/admin/designs?q=${encodeURIComponent(val)}&page=1`);
                setDesigns(res.data?.designs || res.data || []);
            } catch { setDesigns([]); }
            finally { setLoading(false); }
        }, 350);
    };

    const selectDesign = (d) => {
        setSelected(d);
        setResult(null);
        // If design already has a DST, pre-fill the result
        if (d.embroideryFiles?.dst) {
            setResult({ dstUrl: d.embroideryFiles.dst, previewSvg: null, fromExisting: true });
        }
    };

    const generate = async () => {
        if (!selected) return;
        // Use the first available design image
        const imageKeys = Object.keys(selected.images || {});
        const imageUrl  = imageKeys.length ? selected.images[imageKeys[0]] : null;
        if (!imageUrl) { alert("This design has no image to vectorize"); return; }

        setGenerating(true);
        try {
            const res = await axios.post(`${apiBase}/api/admin/custom-order/generate-embroidery`, {
                designImageUrl: CDN(imageUrl) || imageUrl,
                widthMm,
            });
            setResult(res.data);
        } catch (err) {
            alert("Embroidery generation failed: " + (err.response?.data?.error || err.message));
        } finally { setGenerating(false); }
    };

    const handleUse = () => {
        if (!selected || !result) return;
        const imageKeys = Object.keys(selected.images || {});
        const artwork   = imageKeys.length ? (CDN(selected.images[imageKeys[0]]) || selected.images[imageKeys[0]]) : null;
        onSelect({ artwork, dstUrl: result.dstUrl, designName: selected.sku || selected.name || "" });
        handleClose();
    };

    const handleClose = () => {
        setQ(""); setDesigns([]); setSelected(null); setResult(null); setWidthMm(100);
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth scroll="paper">
            <DialogTitle sx={{ py: 1.5, borderBottom: "1px solid", borderColor: "divider" }}>
                <Stack direction="row" alignItems="center" spacing={1.5}>
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1.2 }}>Pick Design for Embroidery</Typography>
                        <Typography variant="caption" color="text.secondary">Search for a design template, then generate DST + stitch preview</Typography>
                    </Box>
                    <IconButton size="small" onClick={handleClose}><CloseIcon fontSize="small" /></IconButton>
                </Stack>
            </DialogTitle>

            <DialogContent sx={{ p: 2 }}>
                <Stack spacing={2}>
                    {/* Search */}
                    <TextField fullWidth size="small" placeholder="Search designs by SKU or name…"
                        value={q} onChange={e => searchDesigns(e.target.value)}
                        InputProps={{
                            startAdornment: <InputAdornment position="start">{loading ? <CircularProgress size={16} /> : <SearchIcon sx={{ color: "text.disabled" }} />}</InputAdornment>,
                        }} />

                    {/* Results grid */}
                    {designs.length > 0 && (
                        <Grid2 container spacing={1.5}>
                            {designs.map(d => {
                                const imageKeys = Object.keys(d.images || {});
                                const thumb     = imageKeys.length ? d.images[imageKeys[0]] : null;
                                const isSelected = selected?._id === d._id;
                                return (
                                    <Grid2 key={d._id} size={{ xs: 6, sm: 4, md: 3 }}>
                                        <Card variant="outlined" sx={{ borderRadius: 2, overflow: "hidden", border: isSelected ? "2px solid" : "1px solid", borderColor: isSelected ? "primary.main" : "divider" }}>
                                            <CardActionArea onClick={() => selectDesign(d)}>
                                                <Box sx={{ position: "relative", aspectRatio: "1", bgcolor: "#f9fafb", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                    {thumb
                                                        ? <Box component="img" src={`${CDN(thumb)}?width=150`} sx={{ width: "100%", height: "100%", objectFit: "contain" }} />
                                                        : <Typography variant="caption" color="text.disabled">No image</Typography>
                                                    }
                                                    {d.embroideryFiles?.dst && (
                                                        <Chip label="Has DST" size="small" color="success"
                                                            sx={{ position: "absolute", top: 4, right: 4, fontSize: "0.6rem", height: 18 }} />
                                                    )}
                                                    {isSelected && (
                                                        <Box sx={{ position: "absolute", inset: 0, bgcolor: "rgba(33,150,243,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                            <CheckIcon sx={{ color: "primary.main", fontSize: 32 }} />
                                                        </Box>
                                                    )}
                                                </Box>
                                                <Box sx={{ px: 1, py: 0.75 }}>
                                                    <Typography variant="caption" fontWeight={700} sx={{ fontFamily: "monospace", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.sku || d.name || "—"}</Typography>
                                                </Box>
                                            </CardActionArea>
                                        </Card>
                                    </Grid2>
                                );
                            })}
                        </Grid2>
                    )}

                    {/* Selected design — settings + generate */}
                    {selected && (
                        <Card variant="outlined" sx={{ borderRadius: 2, p: 2 }}>
                            <Stack spacing={1.5}>
                                <Stack direction="row" alignItems="center" spacing={1}>
                                    <Typography variant="subtitle2" fontWeight={700}>Selected: {selected.sku || selected.name}</Typography>
                                    {result?.fromExisting && <Chip label="Using existing DST" size="small" color="success" />}
                                </Stack>

                                {/* Width setting (only needed if generating) */}
                                {!result?.fromExisting && (
                                    <Box>
                                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                                            Embroidery width: <strong>{widthMm}mm</strong>
                                        </Typography>
                                        <Slider value={widthMm} min={30} max={300} step={5}
                                            onChange={(_, v) => setWidthMm(v)}
                                            marks={[{ value: 50, label: "50mm" }, { value: 100, label: "100mm" }, { value: 200, label: "200mm" }]}
                                            sx={{ width: "100%", maxWidth: 360 }} />
                                    </Box>
                                )}

                                {/* Generate / re-generate button */}
                                {!result?.fromExisting && (
                                    <Button variant="outlined" color="secondary" onClick={generate}
                                        disabled={generating}
                                        startIcon={generating ? <CircularProgress size={16} color="inherit" /> : null}
                                        sx={{ alignSelf: "flex-start" }}>
                                        {generating ? "Generating DST…" : result ? "Re-Generate DST" : "Generate DST"}
                                    </Button>
                                )}

                                {/* Stitch preview */}
                                {result?.previewSvg && (
                                    <Box>
                                        <Typography variant="caption" fontWeight={700} color="text.secondary" display="block" sx={{ mb: 0.5 }}>STITCH PREVIEW</Typography>
                                        <StitchPreview svg={result.previewSvg} />
                                    </Box>
                                )}

                                {/* DST download */}
                                {result?.dstUrl && (
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <Chip label="DST ready" size="small" color="success" icon={<CheckIcon />} />
                                        <Tooltip title="Download DST file">
                                            <Button size="small" variant="outlined" startIcon={<DownloadIcon />}
                                                component="a" href={result.dstUrl} download="embroidery.dst">
                                                Download DST
                                            </Button>
                                        </Tooltip>
                                    </Stack>
                                )}
                            </Stack>
                        </Card>
                    )}
                </Stack>
            </DialogContent>

            <DialogActions sx={{ px: 2, py: 1.5, borderTop: "1px solid", borderColor: "divider" }}>
                <Button onClick={handleClose}>Cancel</Button>
                <Button variant="contained" color="secondary" onClick={handleUse}
                    disabled={!selected || !result}>
                    Use This Design
                </Button>
            </DialogActions>
        </Dialog>
    );
}

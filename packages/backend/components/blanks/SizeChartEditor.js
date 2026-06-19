import { Box, Button, IconButton, TextField, Switch, Typography, Grid2, FormControlLabel } from "@mui/material";
import StraightenIcon from "@mui/icons-material/Straighten";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";

// Structured size-chart editor for a blank (Fulfillment Cloud). Rows are seeded from the blank's sizes;
// the FC customer defines measurement columns (Chest/Length/…), fills values, adds a fit image and
// "how to measure" notes. Renders on the storefront product page via SizeChart. `SectionCard` + the blank
// state/update helpers are passed in from Create.js so this stays self-contained.
export default function SizeChartEditor({ blank, setBlank, update, debouncedUpdate, openImageUpload, SectionCard, open, onToggle }) {
    const sg = blank.sizeGuide || {};
    const columns = sg.columns || [];
    const sizes = (blank.sizes || []).filter((s) => s?.name);
    const notes = sg.measureNotes || [];
    const images = sg.images || [];

    const setSG = (patch, debounce = false) => {
        const bla = { ...blank, sizeGuide: { ...sg, ...patch } };
        setBlank(bla);
        (debounce ? debouncedUpdate : update)({ blank: bla });
    };
    const setIdx = (arr, i, v) => { const a = [...(arr || [])]; while (a.length <= i) a.push(""); a[i] = v; return a; };

    const valueOf = (sizeName, ci) => (sg.rows || []).find((r) => r.size === sizeName)?.values?.[ci] || "";
    const setValue = (sizeName, ci, v) => {
        const has = (sg.rows || []).some((r) => r.size === sizeName);
        const rows = has
            ? (sg.rows || []).map((r) => (r.size === sizeName ? { ...r, values: setIdx(r.values, ci, v) } : r))
            : [...(sg.rows || []), { size: sizeName, values: setIdx([], ci, v) }];
        setSG({ rows }, true);
    };

    const addColumn = () => setSG({ columns: [...columns, ""] });
    const renameColumn = (i, v) => setSG({ columns: columns.map((c, ci) => (ci === i ? v : c)) }, true);
    const removeColumn = (i) => setSG({
        columns: columns.filter((_, ci) => ci !== i),
        rows: (sg.rows || []).map((r) => ({ ...r, values: (r.values || []).filter((_, ci) => ci !== i) })),
    });

    const addNote = () => setSG({ measureNotes: [...notes, { title: "", body: "" }] });
    const setNote = (i, key, v) => setSG({ measureNotes: notes.map((n, ni) => (ni === i ? { ...n, [key]: v } : n)) }, true);
    const removeNote = (i) => setSG({ measureNotes: notes.filter((_, ni) => ni !== i) });
    const removeImage = (i) => setSG({ images: images.filter((_, ii) => ii !== i) });

    return (
        <SectionCard
            title="Size Chart"
            icon={<StraightenIcon sx={{ fontSize: 20 }} />}
            collapsible open={open} onToggle={onToggle}
            action={
                <FormControlLabel onClick={(e) => e.stopPropagation()} sx={{ mr: 0 }}
                    control={<Switch size="small" checked={!!sg.enabled} onChange={(e) => setSG({ enabled: e.target.checked })} />}
                    label={<Typography variant="caption">Show on product page</Typography>} />
            }
        >
            <Box sx={{ px: 3, pb: 3, pt: 2 }}>
                {/* Unit + columns */}
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, alignItems: "center", mb: 2 }}>
                    <TextField label="Measurement unit" size="small" sx={{ width: 180 }} value={sg.unit ?? "inches"} onChange={(e) => setSG({ unit: e.target.value }, true)} />
                    <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={addColumn}>Add measurement</Button>
                </Box>

                {/* Measurement table */}
                {sizes.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>Add sizes to the blank first — rows are generated from them.</Typography>
                ) : columns.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>Add a measurement column (e.g. Chest, Length, Neck Size) to start the chart.</Typography>
                ) : (
                    <Box sx={{ overflowX: "auto" }}>
                        <table style={{ borderCollapse: "collapse", width: "100%" }}>
                            <thead>
                                <tr>
                                    <th style={{ textAlign: "left", padding: 8, fontSize: "0.8rem", color: "#64748b" }}>Size</th>
                                    {columns.map((c, ci) => (
                                        <th key={ci} style={{ padding: 8 }}>
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                                <TextField placeholder="e.g. Chest" size="small" variant="standard" value={c} onChange={(e) => renameColumn(ci, e.target.value)} />
                                                <IconButton size="small" color="error" onClick={() => removeColumn(ci)}><DeleteIcon fontSize="inherit" /></IconButton>
                                            </Box>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {sizes.map((s, si) => (
                                    <tr key={si}>
                                        <td style={{ padding: 8, fontWeight: 700 }}>{s.name}</td>
                                        {columns.map((c, ci) => (
                                            <td key={ci} style={{ padding: 8 }}>
                                                <TextField size="small" placeholder={`e.g. 20"`} value={valueOf(s.name, ci)} onChange={(e) => setValue(s.name, ci, e.target.value)} sx={{ width: 110 }} />
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </Box>
                )}

                {/* Fit image */}
                <Box sx={{ mt: 3 }}>
                    <Typography fontSize="0.82rem" fontWeight={700} sx={{ mb: 1 }}>Fit image</Typography>
                    <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", alignItems: "center" }}>
                        {images.map((src, i) => (
                            <Box key={i} sx={{ position: "relative", width: 80, height: 80, border: "1px solid #e0e0e0", borderRadius: 1, overflow: "hidden" }}>
                                <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                <IconButton size="small" color="error" onClick={() => removeImage(i)} sx={{ position: "absolute", top: 0, right: 0, bgcolor: "rgba(255,255,255,0.85)" }}><DeleteIcon fontSize="inherit" /></IconButton>
                            </Box>
                        ))}
                        {openImageUpload && <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={openImageUpload}>Upload image</Button>}
                    </Box>
                </Box>

                {/* How-to-measure notes */}
                <Box sx={{ mt: 3 }}>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                        <Typography fontSize="0.82rem" fontWeight={700}>How to measure</Typography>
                        <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={addNote}>Add note</Button>
                    </Box>
                    {notes.length === 0 ? (
                        <Typography variant="body2" color="text.secondary">No notes yet.</Typography>
                    ) : (
                        <Grid2 container spacing={1.5}>
                            {notes.map((n, i) => (
                                <Grid2 size={{ xs: 12 }} key={i}>
                                    <Box sx={{ border: "1px solid #e0e0e0", borderRadius: 2, p: 2 }}>
                                        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                                            <IconButton size="small" color="error" onClick={() => removeNote(i)}><DeleteIcon fontSize="small" /></IconButton>
                                        </Box>
                                        <TextField label="Title" size="small" fullWidth sx={{ mb: 1 }} value={n.title || ""} onChange={(e) => setNote(i, "title", e.target.value)} />
                                        <TextField label="Explanation" size="small" fullWidth multiline minRows={2} value={n.body || ""} onChange={(e) => setNote(i, "body", e.target.value)} />
                                    </Box>
                                </Grid2>
                            ))}
                        </Grid2>
                    )}
                </Box>
            </Box>
        </SectionCard>
    );
}

"use client";
import {
    Box, Fab, Dialog, DialogTitle, DialogContent, DialogActions,
    Button, TextField, Typography, Stack, Autocomplete, Chip,
    CircularProgress, Snackbar, Alert, Divider, IconButton,
} from "@mui/material";
import { useState, useEffect } from "react";
import ReplayIcon  from "@mui/icons-material/Replay";
import CloseIcon   from "@mui/icons-material/Close";
import axios from "axios";

export function Repull() {
    const [open, setOpen]       = useState(false);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [reasons, setReasons] = useState([]);
    const [blanks, setBlanks]   = useState([]);
    const [snack, setSnack]     = useState({ open: false, msg: "", severity: "success" });

    const [form, setForm] = useState({ pieceId: "", reason: null, blank: null, color: null, size: null });

    const selectedBlank = blanks.find(b => b.code === form.blank?.value) ?? null;

    useEffect(() => {
        if (!open) return;
        setLoading(true);
        axios.get("/api/production/repull")
            .then(res => {
                if (!res.data.error) {
                    setReasons(res.data.reasons);
                    setBlanks(res.data.blanks);
                }
            })
            .finally(() => setLoading(false));
    }, [open]);

    const handleClose = () => {
        if (submitting) return;
        setOpen(false);
        setForm({ pieceId: "", reason: null, blank: null, color: null, size: null });
    };

    const isPullingError = form.reason?.value === "Pulling Error";
    const canSubmit = form.pieceId.trim() && form.reason &&
        (!isPullingError || (form.blank && form.color && form.size));

    const submit = async () => {
        if (!canSubmit) return;
        setSubmitting(true);
        try {
            const payload = {
                pieceId: form.pieceId.trim(),
                reason:  form.reason.value,
                ...(isPullingError && {
                    blank: form.blank.value,
                    color: form.color.value,
                    size:  form.size.value,
                }),
            };
            const res = await axios.post("/api/production/repull", payload);
            if (res.data.error) {
                setSnack({ open: true, msg: res.data.msg ?? "Error", severity: "error" });
            } else {
                setSnack({ open: true, msg: "Item queued for repull", severity: "success" });
                handleClose();
            }
        } catch {
            setSnack({ open: true, msg: "Request failed", severity: "error" });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <Fab
                onClick={() => setOpen(true)}
                sx={{
                    position: "fixed", bottom: 28, left: 28, zIndex: 1200,
                    bgcolor: "#111827", color: "#fff",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.35)",
                    "&:hover": { bgcolor: "#374151" },
                    gap: 1, px: 2.5, borderRadius: 3,
                    width: "auto", height: 48,
                }}
                variant="extended"
            >
                <ReplayIcon sx={{ fontSize: 18 }} />
                <Typography variant="button" sx={{ fontSize: "0.8rem", fontWeight: 700, letterSpacing: 0.5 }}>
                    Repull
                </Typography>
            </Fab>

            <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pb: 1 }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <Box sx={{
                            width: 32, height: 32, borderRadius: 1.5, bgcolor: "#111827",
                            display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                            <ReplayIcon sx={{ fontSize: 17, color: "#fff" }} />
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 700, fontSize: "1rem" }}>
                            Repull Item
                        </Typography>
                    </Stack>
                    <IconButton size="small" onClick={handleClose} disabled={submitting}>
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </DialogTitle>

                <Divider />

                <DialogContent sx={{ pt: 2.5, pb: 1 }}>
                    {loading ? (
                        <Box sx={{ py: 4, display: "flex", justifyContent: "center" }}>
                            <CircularProgress size={28} />
                        </Box>
                    ) : (
                        <Stack spacing={2.5}>
                            <TextField
                                label="Piece ID"
                                value={form.pieceId}
                                onChange={(e) => setForm(f => ({ ...f, pieceId: e.target.value }))}
                                size="small"
                                fullWidth
                                autoFocus
                                onKeyDown={(e) => { if (e.key === "Enter" && canSubmit) submit(); }}
                                InputLabelProps={{ shrink: true }}
                                placeholder="e.g. PP-00001"
                            />

                            <Autocomplete
                                options={reasons.map(r => ({ value: r.name, label: r.name }))}
                                value={form.reason}
                                onChange={(_, v) => setForm(f => ({ ...f, reason: v, blank: null, color: null, size: null }))}
                                isOptionEqualToValue={(o, v) => o.value === v.value}
                                renderInput={(params) => (
                                    <TextField {...params} label="Reason" size="small" InputLabelProps={{ shrink: true }} />
                                )}
                                renderTags={(v, getProps) =>
                                    v.map((opt, i) => <Chip key={opt.value} label={opt.label} size="small" {...getProps({ index: i })} />)
                                }
                            />

                            {isPullingError && (
                                <Box sx={{ pl: 1.5, borderLeft: "3px solid", borderColor: "warning.main" }}>
                                    <Stack spacing={2}>
                                        <Autocomplete
                                            options={blanks.map(b => ({ value: b.code, label: b.code }))}
                                            value={form.blank}
                                            onChange={(_, v) => setForm(f => ({ ...f, blank: v, color: null, size: null }))}
                                            isOptionEqualToValue={(o, v) => o.value === v.value}
                                            renderInput={(params) => (
                                                <TextField {...params} label="Blank" size="small" InputLabelProps={{ shrink: true }} />
                                            )}
                                        />
                                        {form.blank && (
                                            <>
                                                <Autocomplete
                                                    options={(selectedBlank?.colors ?? []).map(c => ({ value: c.name, label: c.name }))}
                                                    value={form.color}
                                                    onChange={(_, v) => setForm(f => ({ ...f, color: v }))}
                                                    isOptionEqualToValue={(o, v) => o.value === v.value}
                                                    renderInput={(params) => (
                                                        <TextField {...params} label="Color" size="small" InputLabelProps={{ shrink: true }} />
                                                    )}
                                                />
                                                <Autocomplete
                                                    options={(selectedBlank?.sizes ?? []).map(s => ({ value: s.name, label: s.name }))}
                                                    value={form.size}
                                                    onChange={(_, v) => setForm(f => ({ ...f, size: v }))}
                                                    isOptionEqualToValue={(o, v) => o.value === v.value}
                                                    renderInput={(params) => (
                                                        <TextField {...params} label="Size" size="small" InputLabelProps={{ shrink: true }} />
                                                    )}
                                                />
                                            </>
                                        )}
                                    </Stack>
                                </Box>
                            )}
                        </Stack>
                    )}
                </DialogContent>

                <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
                    <Button onClick={handleClose} disabled={submitting} size="small">
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={submit}
                        disabled={!canSubmit || submitting || loading}
                        startIcon={submitting ? <CircularProgress size={14} color="inherit" /> : <ReplayIcon />}
                        sx={{ bgcolor: "#111827", "&:hover": { bgcolor: "#374151" }, borderRadius: 2 }}
                    >
                        {submitting ? "Submitting…" : "Repull Item"}
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={snack.open}
                autoHideDuration={4000}
                onClose={() => setSnack(s => ({ ...s, open: false }))}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            >
                <Alert severity={snack.severity} variant="filled" onClose={() => setSnack(s => ({ ...s, open: false }))}>
                    {snack.msg}
                </Alert>
            </Snackbar>
        </>
    );
}

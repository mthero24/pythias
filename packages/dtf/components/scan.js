"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import {
    Card, TextField, Box, InputAdornment, CircularProgress,
    Alert, Collapse, Stack, Typography, Chip, IconButton, Tooltip,
} from "@mui/material";
import QrCodeScannerIcon  from "@mui/icons-material/QrCodeScanner";
import CheckCircleIcon    from "@mui/icons-material/CheckCircle";
import ErrorIcon          from "@mui/icons-material/Error";
import DeleteSweepIcon    from "@mui/icons-material/DeleteSweep";
import axios from "axios";

// ── Find mode: single toast ────────────────────────────────────────────────
function FindScan({ setSubmitted, auto, setAuto, onAction }) {
    const textFieldRef = useRef(null);
    const [scan, setScan]   = useState("");
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null);
    const toastTimer = useRef(null);

    const showToast = (severity, msg) => {
        clearTimeout(toastTimer.current);
        setToast({ severity, msg });
        if (severity !== "error") toastTimer.current = setTimeout(() => setToast(null), 4000);
    };
    useEffect(() => () => clearTimeout(toastTimer.current), []);

    useEffect(() => {
        if (auto) { textFieldRef.current?.focus(); setAuto(false); }
    }, [auto]);

    const submit = async () => {
        if (!scan?.trim()) return;
        setLoading(true);
        setScan("");
        setSubmitted(null);
        setToast(null);
        try {
            const res = await axios.get(`/api/production/dtf?pieceID=${scan.trim()}`);
            if (res.data.error) showToast("error", res.data.msg);
            else { setSubmitted(res.data); onAction?.(); showToast("success", res.data.msg || "Found"); }
        } catch { showToast("error", "Request failed. Check your connection."); }
        setLoading(false);
        textFieldRef.current?.focus();
    };

    return (
        <Box sx={{ px: { xs: 1, sm: "2%", md: "5%" }, mb: 2 }}>
            <Card variant="outlined" sx={{ borderRadius: 3, p: 2 }}>
                <TextField
                    label="Scan piece ID" fullWidth inputRef={textFieldRef} autoFocus
                    value={scan} onChange={e => setScan(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") submit(); }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                {loading ? <CircularProgress size={18} /> : <QrCodeScannerIcon sx={{ color: "text.disabled" }} />}
                            </InputAdornment>
                        ),
                    }}
                />
                <Collapse in={!!toast} unmountOnExit>
                    <Alert severity={toast?.severity ?? "info"} onClose={() => { setToast(null); clearTimeout(toastTimer.current); }} sx={{ mt: 1.5, borderRadius: 2 }}>
                        {toast?.msg}
                    </Alert>
                </Collapse>
            </Card>
        </Box>
    );
}

// ── Send mode: rapid fire queue ────────────────────────────────────────────
const MAX_QUEUE = 30;

function SendScan({ setSubmitted, auto, setAuto, printer, onAction }) {
    const textFieldRef = useRef(null);
    const [scan, setScan]   = useState("");
    const [queue, setQueue] = useState([]); // [{ id, pieceId, status, msg }]
    const nextId = useRef(0);

    useEffect(() => {
        if (auto) { textFieldRef.current?.focus(); setAuto(false); }
    }, [auto]);

    const updateItem = useCallback((id, patch) => {
        setQueue(prev => prev.map(item => item.id === id ? { ...item, ...patch } : item));
    }, []);

    const submit = () => {
        const pieceId = scan.trim().toUpperCase();
        if (!pieceId) return;
        setScan("");
        textFieldRef.current?.focus();

        const id = ++nextId.current;
        // Add to top of queue immediately — don't wait for response
        setQueue(prev => [{ id, pieceId, status: "pending" }, ...prev].slice(0, MAX_QUEUE));

        // Fire request in background — retry up to 2 times on failure
        const attemptSend = async (attemptsLeft) => {
            try {
                const res = await axios.post("/api/production/dtf", { pieceId, printer });
                if (res.data.error) {
                    if (attemptsLeft > 0) {
                        updateItem(id, { msg: `Retrying…` });
                        await new Promise(r => setTimeout(r, 1000));
                        return attemptSend(attemptsLeft - 1);
                    }
                    updateItem(id, { status: "error", msg: res.data.msg });
                } else {
                    updateItem(id, { status: "success", msg: res.data.msg || "Sent to printer" });
                    setSubmitted(res.data);
                    onAction?.();
                }
            } catch {
                if (attemptsLeft > 0) {
                    updateItem(id, { msg: `Retrying…` });
                    await new Promise(r => setTimeout(r, 1000));
                    return attemptSend(attemptsLeft - 1);
                }
                updateItem(id, { status: "error", msg: "Request failed" });
            }
        };
        attemptSend(2);
    };

    const pending = queue.filter(i => i.status === "pending").length;
    const errors  = queue.filter(i => i.status === "error").length;

    return (
        <Box sx={{ px: { xs: 1, sm: "2%", md: "5%" }, mb: 2 }}>
            <Card variant="outlined" sx={{ borderRadius: 3, p: 2 }}>
                {/* Scan field — never disabled */}
                <TextField
                    label="Scan piece ID" fullWidth inputRef={textFieldRef} autoFocus
                    value={scan} onChange={e => setScan(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") submit(); }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <QrCodeScannerIcon sx={{ color: "text.disabled" }} />
                            </InputAdornment>
                        ),
                        endAdornment: pending > 0 && (
                            <InputAdornment position="end">
                                <Stack direction="row" alignItems="center" spacing={0.75}>
                                    <CircularProgress size={14} />
                                    <Typography variant="caption" color="text.secondary">{pending} sending…</Typography>
                                </Stack>
                            </InputAdornment>
                        ),
                    }}
                />

                {/* Queue list */}
                {queue.length > 0 && (
                    <Box sx={{ mt: 1.5 }}>
                        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.75 }}>
                            <Stack direction="row" spacing={1} alignItems="center">
                                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                    {queue.length} scanned
                                </Typography>
                                {errors > 0 && (
                                    <Chip label={`${errors} error${errors > 1 ? "s" : ""}`} size="small"
                                        sx={{ fontSize: "0.7rem", height: 20, bgcolor: "#fef2f2", color: "#b91c1c", fontWeight: 700 }} />
                                )}
                            </Stack>
                            <Tooltip title="Clear list">
                                <IconButton size="small" onClick={() => setQueue([])}><DeleteSweepIcon fontSize="small" /></IconButton>
                            </Tooltip>
                        </Stack>

                        <Box sx={{ maxHeight: 220, overflowY: "auto", display: "flex", flexDirection: "column", gap: 0.5 }}>
                            {queue.map(item => (
                                <Stack key={item.id} direction="row" alignItems="center" spacing={1}
                                    sx={{
                                        px: 1.5, py: 0.75, borderRadius: 1.5,
                                        bgcolor: item.status === "error" ? "#fef2f2" : item.status === "success" ? "#f0fdf4" : "#f8fafc",
                                        border: "1px solid",
                                        borderColor: item.status === "error" ? "#fecaca" : item.status === "success" ? "#bbf7d0" : "#e2e8f0",
                                    }}
                                >
                                    <Box sx={{ flexShrink: 0 }}>
                                        {item.status === "pending"
                                            ? <CircularProgress size={14} />
                                            : item.status === "success"
                                                ? <CheckCircleIcon sx={{ fontSize: 16, color: "#16a34a" }} />
                                                : <ErrorIcon sx={{ fontSize: 16, color: "#dc2626" }} />
                                        }
                                    </Box>
                                    <Typography variant="caption" fontFamily="monospace" fontWeight={700} sx={{ flexShrink: 0 }}>
                                        {item.pieceId}
                                    </Typography>
                                    {item.msg && (
                                        <Typography variant="caption" color="text.secondary" noWrap sx={{ flex: 1 }}>
                                            {item.msg}
                                        </Typography>
                                    )}
                                </Stack>
                            ))}
                        </Box>
                    </Box>
                )}
            </Card>
        </Box>
    );
}

// ── Unified export ─────────────────────────────────────────────────────────
export function Scan(props) {
    return props.type === "send"
        ? <SendScan {...props} />
        : <FindScan {...props} />;
}

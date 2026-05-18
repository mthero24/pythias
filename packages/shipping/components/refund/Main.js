"use client";
import {
    Box, Button, Typography, Chip, Stack, Card, IconButton,
    Snackbar, Alert, Tooltip, CircularProgress,
} from "@mui/material";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import RefreshIcon from "@mui/icons-material/Refresh";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import axios from "axios";
import { useState, useEffect } from "react";

const STATUS_COLOR = {
    "Delivered":        { color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
    "Out For Delivery": { color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
    "Shipped":          { color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" },
    "shipped":          { color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" },
};

const defaultStatus = { color: "#6366f1", bg: "#eef2ff", border: "#c7d2fe" };

function getStatusMeta(status) {
    return STATUS_COLOR[status] ?? defaultStatus;
}

function trackingLabel(trackingInfo) {
    if (!trackingInfo || trackingInfo.length === 0) return "No tracking yet";
    const first = trackingInfo.find(e => typeof e === "string");
    return first ?? "No tracking yet";
}

export function Refund({ ords, pa }) {
    const [orders, setOrders] = useState(ords);
    const [tracking, setTracking] = useState(false);
    const [snack, setSnack] = useState(null);
    const [loadingMap, setLoadingMap] = useState({});

    const setLoading = (key, val) => setLoadingMap(p => ({ ...p, [key]: val }));

    const runTracking = async () => {
        setTracking(true);
        try {
            const res = await axios.post("/api/production/shipping/track");
            if (res.data.error) {
                setSnack({ severity: "error", msg: res.data.msg ?? "Tracking failed" });
            } else {
                setSnack({ severity: "success", msg: `Updated ${res.data.updated} of ${res.data.total} orders` });
                const refresh = await axios.put("/api/production/shipping/refund", { refresh: true }).catch(() => null);
                if (refresh?.data?.orders) setOrders(refresh.data.orders);
            }
        } catch {
            setSnack({ severity: "error", msg: "Tracking failed" });
        }
        setTracking(false);
    };

    useEffect(() => { runTracking(); }, []);

    const refund = async ({ order, label }) => {
        const key = label._id;
        setLoading(key, "refund");
        const res = await axios.post("/api/production/shipping/refund", { order, label }).catch(() => null);
        setLoading(key, false);
        if (res?.data?.orders) setOrders(res.data.orders);
        else setSnack({ severity: "error", msg: "Refund failed" });
    };

    const hide = async ({ order, label }) => {
        const key = label._id;
        setLoading(key, "hide");
        const res = await axios.put("/api/production/shipping/refund", { order, label }).catch(() => null);
        setLoading(key, false);
        if (res?.data?.orders) setOrders(res.data.orders);
        else setSnack({ severity: "error", msg: "Hide failed" });
    };

    const rows = orders.flatMap(o =>
        (o.shippingInfo?.labels ?? [])
            .filter(l => !l.delivered && !l.refunded)
            .map(l => ({ order: o, label: l }))
    );

    return (
        <Box sx={{ bgcolor: "#f8fafc", minHeight: "100vh" }}>
            {/* Header */}
            <Box sx={{ bgcolor: "#fff", borderBottom: "1px solid #e2e8f0", px: 3, py: 2 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                        <Box sx={{
                            width: 36, height: 36, borderRadius: 2, flexShrink: 0,
                            background: "linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                            <LocalShippingIcon sx={{ color: "#fff", fontSize: 20 }} />
                        </Box>
                        <Box>
                            <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: -0.5, lineHeight: 1.2 }}>
                                Shipping Labels
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {rows.length} undelivered label{rows.length !== 1 ? "s" : ""}
                            </Typography>
                        </Box>
                    </Stack>

                    <Button
                        variant="contained"
                        size="small"
                        startIcon={tracking ? <CircularProgress size={14} sx={{ color: "#fff" }} /> : <RefreshIcon />}
                        disabled={tracking}
                        onClick={runTracking}
                        sx={{
                            bgcolor: "#6366f1",
                            "&:hover": { bgcolor: "#4f46e5" },
                            "&:disabled": { bgcolor: "#6366f1", opacity: 0.6, color: "#fff" },
                            fontWeight: 600,
                        }}
                    >
                        {tracking ? "Tracking…" : "Run Tracking"}
                    </Button>
                </Stack>
            </Box>

            {/* Column headers */}
            <Box sx={{ px: 3, py: 1, display: "grid", gridTemplateColumns: "100px 1fr 120px 1fr 1fr 160px", gap: 2, alignItems: "center" }}>
                {["Date", "PO Number", "Status", "Tracking #", "Last Event", "Actions"].map(h => (
                    <Typography key={h} variant="caption" fontWeight={700} color="text.secondary"
                        sx={{ textTransform: "uppercase", letterSpacing: 0.6, fontSize: "0.65rem" }}>
                        {h}
                    </Typography>
                ))}
            </Box>

            {/* Rows */}
            <Box sx={{ px: 3, pb: 3 }}>
                {rows.length === 0 ? (
                    <Card variant="outlined" sx={{ borderRadius: 2, p: 4, textAlign: "center", borderStyle: "dashed" }}>
                        <CheckCircleOutlineIcon sx={{ fontSize: 40, color: "#16a34a", mb: 1 }} />
                        <Typography variant="h6" fontWeight={700} color="text.secondary">All caught up</Typography>
                        <Typography variant="body2" color="text.secondary">No undelivered labels to show</Typography>
                    </Card>
                ) : rows.map(({ order: o, label: l }, i) => {
                    const sm = getStatusMeta(o.status);
                    const loading = loadingMap[l._id];
                    return (
                        <Card
                            key={l._id ?? i}
                            variant="outlined"
                            sx={{
                                borderRadius: 2, mb: 1,
                                borderColor: "#e2e8f0",
                                bgcolor: i % 2 === 0 ? "#fff" : "#f8fafc",
                                display: "grid",
                                gridTemplateColumns: "100px 1fr 120px 1fr 1fr 160px",
                                gap: 2,
                                alignItems: "center",
                                px: 2, py: 1.5,
                            }}
                        >
                            <Typography variant="body2" color="text.secondary">
                                {new Date(o.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </Typography>

                            <Typography variant="body2" fontWeight={600}>{o.poNumber}</Typography>

                            <Chip
                                label={o.status}
                                size="small"
                                sx={{
                                    bgcolor: sm.bg,
                                    color: sm.color,
                                    border: `1px solid ${sm.border}`,
                                    fontWeight: 600,
                                    fontSize: "0.7rem",
                                    height: 22,
                                }}
                            />

                            <Typography variant="body2" sx={{ fontFamily: "monospace", fontSize: "0.75rem", color: "#374151" }}>
                                {l.trackingNumber != null ? String(l.trackingNumber) : ""}
                            </Typography>

                            <Tooltip title={(l.trackingInfo || []).filter(e => typeof e === "string").join(" → ")} placement="top">
                                <Typography variant="body2" color="text.secondary" sx={{
                                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                    fontSize: "0.8rem",
                                }}>
                                    {trackingLabel(l.trackingInfo)}
                                </Typography>
                            </Tooltip>

                            <Stack direction="row" spacing={0.5}>
                                <Tooltip title="Refund label">
                                    <span>
                                        <IconButton
                                            size="small"
                                            disabled={!!loading}
                                            onClick={() => refund({ order: o, label: l })}
                                            sx={{ color: "#ef4444", "&:hover": { bgcolor: "#fef2f2" } }}
                                        >
                                            {loading === "refund"
                                                ? <CircularProgress size={16} />
                                                : <DeleteOutlineIcon fontSize="small" />}
                                        </IconButton>
                                    </span>
                                </Tooltip>
                                <Tooltip title="Hide / mark delivered">
                                    <span>
                                        <IconButton
                                            size="small"
                                            disabled={!!loading}
                                            onClick={() => hide({ order: o, label: l })}
                                            sx={{ color: "#6b7280", "&:hover": { bgcolor: "#f3f4f6" } }}
                                        >
                                            {loading === "hide"
                                                ? <CircularProgress size={16} />
                                                : <VisibilityOffIcon fontSize="small" />}
                                        </IconButton>
                                    </span>
                                </Tooltip>
                            </Stack>
                        </Card>
                    );
                })}
            </Box>

            <Snackbar
                open={!!snack}
                autoHideDuration={4000}
                onClose={() => setSnack(null)}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            >
                <Alert severity={snack?.severity} variant="filled" onClose={() => setSnack(null)} sx={{ width: "100%" }}>
                    {snack?.msg}
                </Alert>
            </Snackbar>
        </Box>
    );
}

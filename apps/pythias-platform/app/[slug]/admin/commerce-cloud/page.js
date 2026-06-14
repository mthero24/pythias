"use client";
import { useState, useEffect, useCallback } from "react";
import {
    Box, Typography, Button, Card, CardContent, Chip, CircularProgress,
    Alert, Divider, LinearProgress, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Paper, Tooltip,
} from "@mui/material";
import HubIcon from "@mui/icons-material/Hub";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import RefreshIcon from "@mui/icons-material/Refresh";
import StorageIcon from "@mui/icons-material/Storage";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import SpeedIcon from "@mui/icons-material/Speed";

function StatusChip({ active }) {
    return (
        <Chip
            size="small"
            icon={active ? <CheckCircleIcon sx={{ fontSize: "12px !important", color: "#4caf50 !important" }} /> : <WarningAmberIcon sx={{ fontSize: "12px !important", color: "#f59e0b !important" }} />}
            label={active ? "Active" : "Not set up"}
            sx={{
                height: 22,
                fontSize: "0.7rem",
                bgcolor: active ? "rgba(76,175,80,0.12)" : "rgba(245,158,11,0.12)",
                color: active ? "#4caf50" : "#f59e0b",
                border: `1px solid ${active ? "rgba(76,175,80,0.3)" : "rgba(245,158,11,0.3)"}`,
            }}
        />
    );
}

function ProviderCard({ data }) {
    const { org, capacity, location, score, catalogOwned } = data;
    const isReady = !!(org && capacity?.acceptsCommerceCloud && location && score);

    return (
        <Card sx={{ bgcolor: "#1a1a1a", border: `1px solid ${isReady ? "rgba(76,175,80,0.3)" : "#2a2a2a"}`, borderRadius: 2 }}>
            <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
                    <Box>
                        <Typography fontWeight={700} sx={{ color: "#f0f0f0" }}>{org.name}</Typography>
                        <Typography sx={{ fontSize: "0.75rem", color: "#888" }}>/{org.slug}</Typography>
                    </Box>
                    <StatusChip active={isReady} />
                </Box>
                <Divider sx={{ borderColor: "#2a2a2a", mb: 1.5 }} />
                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
                    <Row icon={<StorageIcon sx={{ fontSize: 14 }} />} label="Catalog entries" value={catalogOwned?.toLocaleString() ?? "0"} />
                    <Row icon={<LocalShippingIcon sx={{ fontSize: 14 }} />} label="Location" value={location ? `${location.state}, ${location.country}` : "—"} />
                    <Row icon={<SpeedIcon sx={{ fontSize: 14 }} />} label="Score" value={score ? score.score : "—"} />
                    <Row label="Auto-accept" value={capacity?.autoAccept ? "Yes (internal)" : "No"} />
                    <Row label="Warmup mode" value={capacity ? (capacity.warmupMode ? "Yes" : "No — established") : "—"} />
                    <Row label="Accepts CC orders" value={capacity?.acceptsCommerceCloud ? "Yes" : "No"} />
                    <Row label="Max daily orders" value={capacity?.maxDailyOrders?.toLocaleString() ?? "—"} />
                </Box>
            </CardContent>
        </Card>
    );
}

function Row({ icon, label, value }) {
    return (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, justifyContent: "space-between" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, color: "#666" }}>
                {icon}
                <Typography sx={{ fontSize: "0.78rem", color: "#888" }}>{label}</Typography>
            </Box>
            <Typography sx={{ fontSize: "0.78rem", color: "#ccc", fontWeight: 500 }}>{value ?? "—"}</Typography>
        </Box>
    );
}

export default function CommerceCloudAdminPage() {
    const [state, setState]       = useState(null);
    const [loading, setLoading]   = useState(true);
    const [running, setRunning]   = useState(false);
    const [result, setResult]     = useState(null);
    const [syncing, setSyncing]   = useState(false);
    const [syncMsg, setSyncMsg]   = useState(null);

    const load = useCallback(() => {
        setLoading(true);
        fetch("/api/admin/commerce-cloud/bootstrap")
            .then(r => r.json())
            .then(d => { if (!d.error) setState(d); })
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => { load(); }, [load]);

    const runBootstrap = async () => {
        setRunning(true);
        setResult(null);
        try {
            const res = await fetch("/api/admin/commerce-cloud/bootstrap", { method: "POST" });
            const data = await res.json();
            setResult(data);
            if (!data.error) load(); // refresh state
        } catch (e) {
            setResult({ error: true, msg: e.message });
        } finally {
            setRunning(false);
        }
    };

    const runSync = async () => {
        setSyncing(true);
        setSyncMsg(null);
        try {
            const res = await fetch("/api/admin/commerce-cloud/sync", { method: "POST" });
            const data = await res.json();
            setSyncMsg(data.error ? (data.msg || "Sync failed to start") : (data.msg || "Sync started"));
        } catch (e) {
            setSyncMsg(e.message);
        } finally {
            setSyncing(false);
        }
    };

    const allReady = state?.providers?.length === 2 && state.providers.every(p =>
        p.capacity?.acceptsCommerceCloud && p.location && p.score
    );

    return (
        <Box sx={{ p: 3, maxWidth: 900, mx: "auto" }}>
            {/* Header */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
                <HubIcon sx={{ color: "#6366f1", fontSize: 28 }} />
                <Box>
                    <Typography variant="h5" fontWeight={700} sx={{ color: "#f0f0f0" }}>Commerce Cloud Bootstrap</Typography>
                    <Typography variant="caption" sx={{ color: "#888" }}>
                        Register Premier Printing and Print Oracle as internal fulfillment providers
                    </Typography>
                </Box>
                <Box sx={{ flex: 1 }} />
                <Tooltip title="Refresh"><Button size="small" onClick={load} startIcon={<RefreshIcon />} sx={{ color: "#888" }}>Refresh</Button></Tooltip>
            </Box>

            {/* Status banner */}
            <Alert
                severity={allReady ? "success" : "info"}
                icon={allReady ? <CheckCircleIcon /> : <RocketLaunchIcon />}
                sx={{
                    mb: 3, mt: 2,
                    bgcolor: allReady ? "rgba(76,175,80,0.1)" : "rgba(99,102,241,0.1)",
                    color: allReady ? "#81c784" : "#a5b4fc",
                    border: `1px solid ${allReady ? "rgba(76,175,80,0.3)" : "rgba(99,102,241,0.3)"}`,
                    "& .MuiAlert-icon": { color: allReady ? "#81c784" : "#a5b4fc" },
                }}
            >
                {allReady
                    ? `Both providers are registered and ready. ${state.catalogCount?.toLocaleString()} catalog entries across ${state.blankCount?.toLocaleString()} blanks.`
                    : `${state?.blankCount?.toLocaleString() ?? "..."} blanks in catalog ready to import. Run bootstrap to register Premier Printing and Print Oracle as providers.`}
            </Alert>

            {loading && <LinearProgress sx={{ mb: 3, bgcolor: "#2a2a2a", "& .MuiLinearProgress-bar": { bgcolor: "#6366f1" } }} />}

            {/* Provider cards */}
            {state?.providers?.length > 0 && (
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mb: 3 }}>
                    {state.providers.map(p => <ProviderCard key={p.org._id} data={p} />)}
                </Box>
            )}

            {/* Global stats */}
            {state && (
                <Card sx={{ bgcolor: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 2, mb: 3 }}>
                    <CardContent sx={{ p: 2 }}>
                        <Typography fontWeight={700} sx={{ color: "#f0f0f0", mb: 1.5 }}>Platform Catalog Stats</Typography>
                        <Box sx={{ display: "flex", gap: 4 }}>
                            <Box>
                                <Typography sx={{ fontSize: "1.6rem", fontWeight: 800, color: "#6366f1" }}>{state.blankCount?.toLocaleString()}</Typography>
                                <Typography sx={{ fontSize: "0.75rem", color: "#888" }}>Active blanks</Typography>
                            </Box>
                            <Box>
                                <Typography sx={{ fontSize: "1.6rem", fontWeight: 800, color: "#4caf50" }}>{state.catalogCount?.toLocaleString()}</Typography>
                                <Typography sx={{ fontSize: "0.75rem", color: "#888" }}>Provider catalog entries</Typography>
                            </Box>
                        </Box>
                    </CardContent>
                </Card>
            )}

            {/* Bootstrap button */}
            <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
                <Button
                    variant="contained"
                    size="large"
                    startIcon={running ? <CircularProgress size={18} sx={{ color: "#fff" }} /> : <RocketLaunchIcon />}
                    onClick={runBootstrap}
                    disabled={running}
                    sx={{ bgcolor: "#6366f1", "&:hover": { bgcolor: "#4f46e5" }, "&:disabled": { bgcolor: "#2a2a2a", color: "#555" } }}
                >
                    {running ? "Running bootstrap…" : allReady ? "Re-run Bootstrap (sync catalog)" : "Run Bootstrap"}
                </Button>
                <Typography variant="caption" sx={{ color: "#555", alignSelf: "center", maxWidth: 380 }}>
                    Safe to run multiple times. Creates providers if missing, skips existing catalog entries, and adds any new blank × color × size combinations.
                </Typography>
            </Box>

            {/* Sync Premier catalog (pricing, blanks, settings) on demand */}
            <Box sx={{ display: "flex", gap: 2, mb: 3, alignItems: "center" }}>
                <Button
                    variant="outlined"
                    size="large"
                    startIcon={syncing ? <CircularProgress size={18} sx={{ color: "#6366f1" }} /> : <RefreshIcon />}
                    onClick={runSync}
                    disabled={syncing}
                    sx={{ borderColor: "#6366f1", color: "#a5b4fc", "&:hover": { borderColor: "#4f46e5", bgcolor: "rgba(99,102,241,0.08)" } }}
                >
                    {syncing ? "Starting sync…" : "Sync Premier Catalog Now"}
                </Button>
                <Typography variant="caption" sx={{ color: "#555", alignSelf: "center", maxWidth: 380 }}>
                    Pulls Premier's latest blanks, pricing, and settings into Commerce Cloud. Runs automatically every 12 hours.
                </Typography>
            </Box>
            {syncMsg && (
                <Alert severity="info" sx={{ mb: 3, bgcolor: "rgba(99,102,241,0.1)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.3)", "& .MuiAlert-icon": { color: "#a5b4fc" } }}>
                    {syncMsg}
                </Alert>
            )}

            {/* Bootstrap result */}
            {result && (
                <Card sx={{ bgcolor: result.error ? "rgba(239,68,68,0.08)" : "rgba(76,175,80,0.08)", border: `1px solid ${result.error ? "rgba(239,68,68,0.3)" : "rgba(76,175,80,0.3)"}`, borderRadius: 2 }}>
                    <CardContent sx={{ p: 2.5 }}>
                        <Typography fontWeight={700} sx={{ color: result.error ? "#f87171" : "#81c784", mb: 1.5 }}>
                            {result.error ? "Bootstrap failed" : "Bootstrap complete"}
                        </Typography>
                        {!result.error && result.results && (
                            <>
                                <Box sx={{ display: "flex", gap: 4, mb: 2 }}>
                                    <Box>
                                        <Typography sx={{ fontSize: "1.4rem", fontWeight: 700, color: "#4caf50" }}>{result.results.catalogTotal?.toLocaleString()}</Typography>
                                        <Typography sx={{ fontSize: "0.72rem", color: "#888" }}>New entries created</Typography>
                                    </Box>
                                    <Box>
                                        <Typography sx={{ fontSize: "1.4rem", fontWeight: 700, color: "#888" }}>{result.results.skipped?.toLocaleString()}</Typography>
                                        <Typography sx={{ fontSize: "0.72rem", color: "#888" }}>Existing (skipped)</Typography>
                                    </Box>
                                </Box>
                                {result.results.providers?.map(p => (
                                    <Box key={p.name} sx={{ mb: 0.75 }}>
                                        <Typography sx={{ fontSize: "0.82rem", color: "#ccc" }}>
                                            <strong style={{ color: "#f0f0f0" }}>{p.name}</strong> — {p.catalogEntries?.toLocaleString()} new, {p.skipped?.toLocaleString()} skipped
                                        </Typography>
                                    </Box>
                                ))}
                                {result.results.errors?.length > 0 && (
                                    <Alert severity="warning" sx={{ mt: 1.5, fontSize: "0.75rem", bgcolor: "rgba(245,158,11,0.1)", color: "#fbbf24", border: "1px solid rgba(245,158,11,0.3)" }}>
                                        {result.results.errors.length} error(s): {result.results.errors.slice(0, 3).join("; ")}
                                        {result.results.errors.length > 3 && ` +${result.results.errors.length - 3} more`}
                                    </Alert>
                                )}
                            </>
                        )}
                        {result.error && <Typography sx={{ color: "#f87171", fontSize: "0.82rem" }}>{result.msg ?? JSON.stringify(result)}</Typography>}
                    </CardContent>
                </Card>
            )}
        </Box>
    );
}

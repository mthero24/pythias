"use client";
import { useState, useEffect, useCallback } from "react";
import {
    Box, Typography, CircularProgress, Chip, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, Paper,
    Select, MenuItem, FormControl, InputLabel, IconButton, Tooltip,
    Collapse, LinearProgress,
} from "@mui/material";
import AltRouteIcon from "@mui/icons-material/AltRoute";
import RefreshIcon from "@mui/icons-material/Refresh";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";

const STATUS_COLOR = {
    routed:        { bg: "rgba(99,102,241,0.15)",  text: "#a5b4fc", border: "rgba(99,102,241,0.4)" },
    accepted:      { bg: "rgba(76,175,80,0.15)",   text: "#81c784", border: "rgba(76,175,80,0.4)" },
    received:      { bg: "rgba(99,102,241,0.15)",  text: "#a5b4fc", border: "rgba(99,102,241,0.4)" },
    in_production: { bg: "rgba(245,158,11,0.15)",  text: "#fbbf24", border: "rgba(245,158,11,0.4)" },
    shipped:       { bg: "rgba(76,175,80,0.15)",   text: "#81c784", border: "rgba(76,175,80,0.4)" },
    delivered:     { bg: "rgba(34,197,94,0.18)",   text: "#86efac", border: "rgba(34,197,94,0.45)" },
    declined:      { bg: "rgba(239,68,68,0.15)",   text: "#f87171", border: "rgba(239,68,68,0.4)" },
    unroutable:    { bg: "rgba(245,158,11,0.15)",  text: "#fbbf24", border: "rgba(245,158,11,0.4)" },
    cancelled:     { bg: "rgba(107,114,128,0.15)", text: "#9ca3af", border: "rgba(107,114,128,0.4)" },
};

function dollars(cents) { return cents != null ? `$${(cents / 100).toFixed(2)}` : "—"; }
function fmtDate(d) { return d ? new Date(d).toLocaleString() : "—"; }

function StatusChip({ status }) {
    const c = STATUS_COLOR[status] ?? STATUS_COLOR.cancelled;
    return (
        <Chip size="small" label={String(status ?? "").replace(/_/g, " ")}
            sx={{ fontSize: "0.7rem", height: 22, bgcolor: c.bg, color: c.text, border: `1px solid ${c.border}`, textTransform: "capitalize" }}
        />
    );
}

function CandidateRow({ c }) {
    return (
        <TableRow sx={{ "&:last-child td": { border: 0 } }}>
            <TableCell sx={{ py: 0.5, color: "#ccc", fontSize: "0.78rem" }}>{c.providerId?.name ?? c.providerId}</TableCell>
            <TableCell align="right" sx={{ py: 0.5, color: "#a5b4fc", fontSize: "0.78rem" }}>{c.geoScore}</TableCell>
            <TableCell align="right" sx={{ py: 0.5, color: "#a5b4fc", fontSize: "0.78rem" }}>{c.priceScore}</TableCell>
            <TableCell align="right" sx={{ py: 0.5, color: "#a5b4fc", fontSize: "0.78rem" }}>{c.reliabilityScore}</TableCell>
            <TableCell align="right" sx={{ py: 0.5, fontWeight: 700, color: "#f0f0f0", fontSize: "0.78rem" }}>{c.totalScore}</TableCell>
        </TableRow>
    );
}

function LogRow({ log }) {
    const [open, setOpen] = useState(false);
    return (
        <>
            <TableRow sx={{ "&:hover": { bgcolor: "rgba(255,255,255,0.02)" }, cursor: "pointer" }} onClick={() => setOpen(o => !o)}>
                <TableCell sx={{ py: 1, color: "#888", fontSize: "0.75rem" }}>{String(log._id).slice(-8)}</TableCell>
                <TableCell sx={{ py: 1, color: "#ccc", fontSize: "0.78rem" }}>{fmtDate(log.routedAt)}</TableCell>
                <TableCell sx={{ py: 1, color: "#f0f0f0", fontSize: "0.82rem", fontWeight: 500 }}>
                    {log.selectedProviderId?.name ?? "—"}
                </TableCell>
                <TableCell sx={{ py: 1 }}><StatusChip status={log.fulfillmentStatus ?? log.status} /></TableCell>
                <TableCell sx={{ py: 1, color: "#a5b4fc", fontSize: "0.75rem", fontFamily: "monospace" }}>
                    {log.trackingNumber ?? "—"}
                </TableCell>
                <TableCell align="right" sx={{ py: 1, color: "#4caf50", fontSize: "0.82rem" }}>
                    {dollars((log.totalWholesaleCost ?? 0) + (log.providerShippingPaid ?? 0) + (log.providerHandlingFee ?? 0))}
                </TableCell>
                <TableCell align="right" sx={{ py: 1, color: "#888" }}>
                    {open ? <ExpandLessIcon sx={{ fontSize: 16 }} /> : <ExpandMoreIcon sx={{ fontSize: 16 }} />}
                </TableCell>
            </TableRow>
            <TableRow>
                <TableCell colSpan={7} sx={{ py: 0, border: 0 }}>
                    <Collapse in={open} unmountOnExit>
                        <Box sx={{ py: 1.5, px: 2, bgcolor: "#111", borderBottom: "1px solid #2a2a2a" }}>
                            {/* Money breakdown */}
                            <Box sx={{ display: "flex", gap: 3, mb: 1.5, flexWrap: "wrap" }}>
                                {[
                                    ["Wholesale", log.totalWholesaleCost],
                                    ["Shipping",  log.providerShippingPaid],
                                    ["Handling",  log.providerHandlingFee],
                                    ["Platform fee", log.platformFee],
                                ].map(([label, val]) => (
                                    <Box key={label}>
                                        <Typography sx={{ fontSize: "0.68rem", color: "#666", textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</Typography>
                                        <Typography sx={{ fontSize: "0.85rem", color: "#ccc", fontWeight: 600 }}>{dollars(val ?? 0)}</Typography>
                                    </Box>
                                ))}
                                {log.carrier && (
                                    <Box>
                                        <Typography sx={{ fontSize: "0.68rem", color: "#666", textTransform: "uppercase", letterSpacing: 0.5 }}>Carrier</Typography>
                                        <Typography sx={{ fontSize: "0.85rem", color: "#ccc", fontWeight: 600, textTransform: "uppercase" }}>{log.carrier}</Typography>
                                    </Box>
                                )}
                            </Box>
                            <Typography variant="caption" sx={{ color: "#888", mb: 1, display: "block" }}>
                                Providers scored at routing:
                            </Typography>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        {["Provider","Geo","Price","Reliability","Total"].map(h => (
                                            <TableCell key={h} align={h === "Provider" ? "left" : "right"}
                                                sx={{ py: 0.5, color: "#666", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: 0.5 }}>
                                                {h}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {(log.candidates ?? []).map((c, i) => <CandidateRow key={i} c={c} />)}
                                </TableBody>
                            </Table>
                        </Box>
                    </Collapse>
                </TableCell>
            </TableRow>
        </>
    );
}

function StatCard({ label, value, color = "#f0f0f0" }) {
    return (
        <Paper sx={{ bgcolor: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 2, p: 2, minWidth: 130 }}>
            <Typography sx={{ fontSize: "1.5rem", fontWeight: 800, color }}>{value}</Typography>
            <Typography sx={{ fontSize: "0.72rem", color: "#888" }}>{label}</Typography>
        </Paper>
    );
}

export default function RoutingStatusPage() {
    const [logs, setLogs]       = useState([]);
    const [total, setTotal]     = useState(0);
    const [summary, setSummary] = useState(null);
    const [wallet, setWallet]   = useState(null);
    const [loading, setLoading] = useState(true);
    const [status, setStatus]   = useState("");
    const [page, setPage]       = useState(0);
    const limit = 25;

    const load = useCallback(() => {
        setLoading(true);
        const params = new URLSearchParams({ page, limit });
        if (status) params.set("status", status);
        fetch(`/api/fulfillment/routing?${params}`)
            .then(r => r.json())
            .then(d => { if (!d.error) { setLogs(d.logs); setTotal(d.total); setSummary(d.summary ?? null); } })
            .finally(() => setLoading(false));
    }, [page, status]);

    useEffect(() => { load(); }, [load]);
    useEffect(() => {
        fetch("/api/fulfillment/wallet").then(r => r.json()).then(d => { if (!d.error) setWallet(d.wallet); }).catch(() => {});
    }, []);

    const dollars2 = (c) => `$${((c ?? 0) / 100).toFixed(2)}`;
    const lowBalance = wallet && (wallet.balance ?? 0) < (wallet.minimumBalance ?? 0);

    return (
        <Box sx={{ p: 3, maxWidth: 1100, mx: "auto" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
                <AltRouteIcon sx={{ color: "#6366f1", fontSize: 28 }} />
                <Box sx={{ flex: 1 }}>
                    <Typography variant="h5" fontWeight={700} sx={{ color: "#f0f0f0" }}>Orders &amp; Spend</Typography>
                    <Typography variant="caption" sx={{ color: "#888" }}>Your Commerce Cloud orders, fulfillment status, tracking, and spend</Typography>
                </Box>
                <FormControl size="small" sx={{ minWidth: 140 }}>
                    <InputLabel sx={{ color: "#888" }}>Status</InputLabel>
                    <Select value={status} label="Status" onChange={e => { setStatus(e.target.value); setPage(0); }}
                        sx={{ color: "#f0f0f0", "& .MuiOutlinedInput-notchedOutline": { borderColor: "#2a2a2a" } }}>
                        <MenuItem value="">All</MenuItem>
                        {["routed","accepted","declined","unroutable","cancelled"].map(s => (
                            <MenuItem key={s} value={s} sx={{ textTransform: "capitalize" }}>{s}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <Tooltip title="Refresh"><IconButton onClick={load} sx={{ color: "#888" }}><RefreshIcon /></IconButton></Tooltip>
            </Box>

            {/* Low-balance alert */}
            {lowBalance && (
                <Box sx={{ mb: 2, p: 1.5, borderRadius: 2, bgcolor: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.4)", display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Typography sx={{ color: "#fbbf24", fontSize: "0.85rem", flex: 1 }}>
                        Your wallet balance ({dollars2(wallet.balance)}) is below your minimum ({dollars2(wallet.minimumBalance)}). Add funds so new orders can route.
                    </Typography>
                    <Button size="small" href="wallet" variant="outlined" sx={{ color: "#fbbf24", borderColor: "rgba(245,158,11,0.5)" }}>Add funds</Button>
                </Box>
            )}

            {/* Spend summary */}
            {summary && (
                <Box sx={{ display: "flex", gap: 1.5, mb: 3, flexWrap: "wrap" }}>
                    <StatCard label="Orders routed" value={summary.totalOrders} />
                    <StatCard label="Total spent"   value={dollars2(summary.totalSpent)} color="#4caf50" />
                    <StatCard label="Shipped"        value={summary.shipped} color="#81c784" />
                    <StatCard label="In production"  value={summary.inProduction} color="#fbbf24" />
                    {summary.unroutable > 0 && <StatCard label="Unroutable" value={summary.unroutable} color="#f87171" />}
                    {wallet && <StatCard label="Wallet balance" value={dollars2(wallet.balance)} color={lowBalance ? "#fbbf24" : "#a5b4fc"} />}
                </Box>
            )}

            {loading && <LinearProgress sx={{ mb: 2, bgcolor: "#2a2a2a", "& .MuiLinearProgress-bar": { bgcolor: "#6366f1" } }} />}

            <TableContainer component={Paper} sx={{ bgcolor: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 2 }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            {["Log ID","Routed At","Provider","Status","Tracking","Order Cost",""].map(h => (
                                <TableCell key={h} align={h === "Order Cost" ? "right" : "left"}
                                    sx={{ color: "#666", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: 0.5, py: 1.5, borderBottom: "1px solid #2a2a2a" }}>
                                    {h}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {logs.length === 0 && !loading ? (
                            <TableRow>
                                <TableCell colSpan={7} sx={{ textAlign: "center", py: 6, color: "#666" }}>
                                    No orders routed yet.
                                </TableCell>
                            </TableRow>
                        ) : logs.map(log => <LogRow key={log._id} log={log} />)}
                    </TableBody>
                </Table>
            </TableContainer>

            {total > limit && (
                <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 2, mt: 2 }}>
                    <IconButton disabled={page === 0} onClick={() => setPage(p => p - 1)} sx={{ color: "#888" }}>‹</IconButton>
                    <Typography sx={{ color: "#888", fontSize: "0.82rem" }}>
                        {page * limit + 1}–{Math.min((page + 1) * limit, total)} of {total}
                    </Typography>
                    <IconButton disabled={(page + 1) * limit >= total} onClick={() => setPage(p => p + 1)} sx={{ color: "#888" }}>›</IconButton>
                </Box>
            )}
        </Box>
    );
}

"use client";
import {
    Box, Container, Typography, Stack, Paper, Chip, Button, Avatar,
    Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
    TextField, InputAdornment, CircularProgress, Alert, IconButton,
    Dialog, DialogTitle, DialogContent, DialogActions, LinearProgress,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SearchIcon from "@mui/icons-material/Search";
import SettingsIcon from "@mui/icons-material/Settings";
import RefreshIcon from "@mui/icons-material/Refresh";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import Link from "next/link";
import { useState, useEffect, useCallback, useRef } from "react";

const GS1_GREEN = "#009a44";

function StatCard({ label, value, color = "#1f2937", sub, loading }) {
    return (
        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, flex: 1, minWidth: 140 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={600}
                sx={{ textTransform: "uppercase", letterSpacing: 0.8, display: "block" }}>
                {label}
            </Typography>
            <Box sx={{ mt: 0.5 }}>
                {loading
                    ? <CircularProgress size={22} sx={{ color }} />
                    : <Typography variant="h4" fontWeight={800} sx={{ color, lineHeight: 1.1 }}>
                        {value != null ? value.toLocaleString() : "—"}
                      </Typography>
                }
                {sub && (
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.25 }}>
                        {sub}
                    </Typography>
                )}
            </Box>
        </Paper>
    );
}

function SettingsDialog({ open, setOpen, onSaved }) {
    const [apiKey, setApiKey]               = useState("");
    const [secondaryKey, setSecondaryKey]   = useState("");
    const [accountNumber, setAccountNumber] = useState("");
    const [saving, setSaving]               = useState(false);
    const [error, setError]                 = useState("");
    const loaded = useRef(false);

    useEffect(() => {
        if (open && !loaded.current) {
            loaded.current = true;
            fetch("/api/admin/settings/gs1").then(r => r.json()).then(d => {
                if (!d.error && d.gs1) {
                    setApiKey(d.gs1.apiKey ?? "");
                    setSecondaryKey(d.gs1.secondaryKey ?? "");
                    setAccountNumber(d.gs1.accountNumber ?? "");
                }
            }).catch(() => {});
        }
        if (!open) loaded.current = false;
    }, [open]);

    const save = async () => {
        if (!apiKey) { setError("Primary API Key is required"); return; }
        setSaving(true); setError("");
        try {
            const res = await fetch("/api/admin/settings/gs1", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ apiKey, secondaryKey, accountNumber }),
            });
            const d = await res.json();
            if (d.error) { setError(d.msg ?? "Save failed"); }
            else { onSaved?.(); setOpen(false); }
        } catch { setError("Save failed"); }
        finally { setSaving(false); }
    };

    return (
        <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ fontWeight: 700, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Stack direction="row" alignItems="center" spacing={1.5}>
                    <img src="/gs1.png" alt="GS1 US" style={{ height: 26, objectFit: "contain" }} />
                    <span>GS1 US Credentials</span>
                </Stack>
                <IconButton size="small" onClick={() => setOpen(false)}><CloseIcon fontSize="small" /></IconButton>
            </DialogTitle>
            <DialogContent dividers>
                <Stack spacing={2} sx={{ pt: 1 }}>
                    {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}
                    <TextField fullWidth size="small" label="GS1 Primary API Key" type="password"
                        value={apiKey} onChange={e => setApiKey(e.target.value)} autoComplete="off"
                        helperText="Your GS1 US primary product key" />
                    <TextField fullWidth size="small" label="GS1 Secondary Key" type="password"
                        value={secondaryKey} onChange={e => setSecondaryKey(e.target.value)} autoComplete="off"
                        helperText="Your GS1 US secondary product key" />
                    <TextField fullWidth size="small" label="Account Number"
                        value={accountNumber} onChange={e => setAccountNumber(e.target.value)}
                        helperText="X-Product-Owner-Account-Id used in API requests" />
                </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={() => setOpen(false)}>Cancel</Button>
                <Button variant="contained" onClick={save} disabled={saving || !apiKey}
                    sx={{ bgcolor: GS1_GREEN, "&:hover": { bgcolor: "#007a35" } }}
                    startIcon={saving ? <CircularProgress size={14} color="inherit" /> : null}
                >
                    Save
                </Button>
            </DialogActions>
        </Dialog>
    );
}

const LIMIT = 25;

export function Gs1Dashboard({ backHref = "/admin/integrations" }) {
    const [data, setData]               = useState(null);
    const [loading, setLoading]         = useState(true);
    const [tableLoading, setTableLoading] = useState(false);
    const [fetchError, setFetchError]   = useState("");
    const [search, setSearch]           = useState("");
    const [page, setPage]               = useState(0);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const searchTimer = useRef(null);

    const load = useCallback(async (q, p, isTableOnly = false) => {
        if (isTableOnly) setTableLoading(true);
        else setLoading(true);
        setFetchError("");
        try {
            const params = new URLSearchParams({ limit: LIMIT, skip: p * LIMIT });
            if (q) params.set("search", q);
            const res = await fetch(`/api/admin/gs1/dashboard?${params}`);
            const d = await res.json();
            if (d.error) setFetchError(d.msg ?? "Failed to load");
            else setData(d);
        } catch { setFetchError("Failed to load GS1 dashboard"); }
        finally { setLoading(false); setTableLoading(false); }
    }, []);

    useEffect(() => { load("", 0); }, [load]);

    const handleSearch = (v) => {
        setSearch(v);
        setPage(0);
        clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => load(v, 0, true), 350);
    };

    const changePage = (newPage) => {
        setPage(newPage);
        load(search, newPage, true);
    };

    const totalGs1Remaining = data?.prefixes?.reduce((s, p) => s + (p.remainingCapacity ?? 0), 0) ?? null;
    const totalIssued = (data?.local?.assigned ?? 0) + (data?.local?.tempAvail ?? 0) + (data?.local?.onHold ?? 0);
    const totalGs1Licensed = data?.apiConnected ? totalGs1Remaining + totalIssued : null;
    const capacityPct = totalGs1Licensed ? Math.round((totalIssued / totalGs1Licensed) * 100) : null;

    return (
        <Box sx={{ bgcolor: "#f8fafc", minHeight: "100vh", pb: 6 }}>
            {/* Header */}
            <Box sx={{ bgcolor: "#fff", borderBottom: "1px solid #e5e7eb", py: 2.5, px: { xs: 2, sm: 4 } }}>
                <Container maxWidth="lg">
                    <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
                        <Stack direction="row" alignItems="center" spacing={2}>
                            <Button component={Link} href={backHref} startIcon={<ArrowBackIcon />}
                                size="small" sx={{ color: "#6b7280", textTransform: "none" }}>
                                Integrations
                            </Button>
                            <Box sx={{ width: 1, height: 24, bgcolor: "#e5e7eb" }} />
                            <img src="/gs1.png" alt="GS1 US" style={{ height: 30, objectFit: "contain" }} />
                            <Box>
                                <Typography variant="h6" fontWeight={700} lineHeight={1.2}>GS1 US Dashboard</Typography>
                                <Typography variant="caption" color="text.secondary">UPC / GTIN management</Typography>
                            </Box>
                        </Stack>
                        <Stack direction="row" spacing={1}>
                            <Button size="small" startIcon={loading ? <CircularProgress size={14} /> : <RefreshIcon />}
                                onClick={() => load(search, page)} disabled={loading}
                                sx={{ textTransform: "none" }}>
                                Refresh
                            </Button>
                            <Button size="small" variant="outlined" startIcon={<SettingsIcon />}
                                onClick={() => setSettingsOpen(true)}
                                sx={{ textTransform: "none", borderColor: GS1_GREEN, color: GS1_GREEN,
                                    "&:hover": { borderColor: "#007a35", bgcolor: "#009a4408" } }}>
                                Configure Credentials
                            </Button>
                        </Stack>
                    </Stack>
                </Container>
            </Box>

            {loading && !data && <LinearProgress sx={{ bgcolor: "#d1fae5", "& .MuiLinearProgress-bar": { bgcolor: GS1_GREEN } }} />}

            <Container maxWidth="lg" sx={{ mt: 4 }}>
                {fetchError && (
                    <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setFetchError("")}>
                        {fetchError}
                    </Alert>
                )}

                {/* API connection status */}
                {data && (
                    <Alert
                        severity={data.apiConnected ? "success" : "warning"}
                        icon={data.apiConnected
                            ? <CheckCircleOutlineIcon fontSize="small" />
                            : <ErrorOutlineIcon fontSize="small" />
                        }
                        sx={{ mb: 3, borderRadius: 2 }}
                    >
                        {data.apiConnected
                            ? `GS1 US API connected — ${data.prefixes?.length ?? 0} company prefix${data.prefixes?.length === 1 ? "" : "es"} found`
                            : "GS1 US API not reachable. Showing local pool stats only. Use Configure Credentials above to set your API key."}
                    </Alert>
                )}

                {/* Capacity bar */}
                {data?.apiConnected && capacityPct != null && (
                    <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, mb: 3 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                            <Typography variant="body2" fontWeight={600}>GTIN License Usage</Typography>
                            <Typography variant="body2" color="text.secondary">
                                {totalIssued.toLocaleString()} issued of {totalGs1Licensed.toLocaleString()} licensed ({capacityPct}%)
                            </Typography>
                        </Stack>
                        <LinearProgress variant="determinate" value={capacityPct}
                            sx={{
                                height: 8, borderRadius: 4,
                                bgcolor: "#d1fae5",
                                "& .MuiLinearProgress-bar": {
                                    bgcolor: capacityPct > 90 ? "#ef4444" : capacityPct > 75 ? "#f59e0b" : GS1_GREEN,
                                    borderRadius: 4,
                                },
                            }}
                        />
                    </Paper>
                )}

                {/* Stats */}
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2} flexWrap="wrap" sx={{ mb: 4 }}>
                    <StatCard
                        label="Remaining at GS1"
                        value={data?.apiConnected ? totalGs1Remaining : undefined}
                        color={GS1_GREEN}
                        sub={data?.apiConnected ? "GTINs not yet issued" : "Requires API connection"}
                        loading={loading && !data}
                    />
                    <StatCard
                        label="Assigned to Products"
                        value={data?.local?.assigned}
                        color="#1d4ed8"
                        sub="Linked to design / blank / color"
                        loading={loading && !data}
                    />
                    <StatCard
                        label="Pool Available"
                        value={data?.local?.tempAvail}
                        color="#0891b2"
                        sub="Ready to assign"
                        loading={loading && !data}
                    />
                    <StatCard
                        label="On Hold"
                        value={data?.local?.onHold}
                        color="#d97706"
                        sub="Reserved during product creation"
                        loading={loading && !data}
                    />
                    <StatCard
                        label="Recycled"
                        value={data?.local?.recycled}
                        color="#6b7280"
                        sub="Returned to pool"
                        loading={loading && !data}
                    />
                </Stack>

                {/* Prefix breakdown */}
                {data?.apiConnected && data.prefixes?.length > 0 && (
                    <Box sx={{ mb: 4 }}>
                        <Typography variant="overline" color="text.secondary" fontWeight={700} letterSpacing={1.2}>
                            GS1 Company Prefixes
                        </Typography>
                        <TableContainer component={Paper} variant="outlined" sx={{ mt: 1, borderRadius: 2 }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ bgcolor: "#f9fafb" }}>
                                        <TableCell sx={{ fontWeight: 700 }}>Prefix</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }} align="right">Remaining Capacity</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }} align="right">Status</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {data.prefixes.map((p, i) => (
                                        <TableRow key={p.prefix ?? i} hover>
                                            <TableCell sx={{ fontFamily: "monospace", fontWeight: 600 }}>
                                                {p.prefix}
                                            </TableCell>
                                            <TableCell align="right">
                                                <Typography fontWeight={700}
                                                    sx={{ color: (p.remainingCapacity ?? 0) > 0 ? GS1_GREEN : "#ef4444" }}>
                                                    {(p.remainingCapacity ?? 0).toLocaleString()}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="right">
                                                <Chip
                                                    label={(p.remainingCapacity ?? 0) > 0 ? "Available" : "Full"}
                                                    size="small"
                                                    sx={(p.remainingCapacity ?? 0) > 0
                                                        ? { bgcolor: "#d1fae5", color: "#065f46", fontWeight: 600 }
                                                        : { bgcolor: "#fee2e2", color: "#991b1b", fontWeight: 600 }
                                                    }
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                )}

                {/* Assigned GTINs table */}
                <Box>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}
                        flexWrap="wrap" gap={1}>
                        <Typography variant="overline" color="text.secondary" fontWeight={700} letterSpacing={1.2}>
                            Assigned GTINs{data ? ` (${data.recentCount?.toLocaleString()})` : ""}
                        </Typography>
                        <TextField
                            size="small" placeholder="Search GTIN / UPC / SKU…"
                            value={search}
                            onChange={e => handleSearch(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon sx={{ fontSize: 18, color: "#9ca3af" }} />
                                    </InputAdornment>
                                ),
                            }}
                            sx={{ width: 280, "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                        />
                    </Stack>
                    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                        {tableLoading && <LinearProgress sx={{ bgcolor: "#d1fae5", "& .MuiLinearProgress-bar": { bgcolor: GS1_GREEN } }} />}
                        <Table size="small">
                            <TableHead>
                                <TableRow sx={{ bgcolor: "#f9fafb" }}>
                                    <TableCell sx={{ fontWeight: 700 }}>GTIN</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>UPC</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>SKU</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Design</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Blank</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Color</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Size</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {loading && !data ? (
                                    <TableRow>
                                        <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                                            <CircularProgress size={28} sx={{ color: GS1_GREEN }} />
                                        </TableCell>
                                    </TableRow>
                                ) : data?.recent?.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} align="center" sx={{ py: 5, color: "#9ca3af" }}>
                                            {search ? "No GTINs match your search." : "No assigned GTINs yet."}
                                        </TableCell>
                                    </TableRow>
                                ) : data?.recent?.map(r => (
                                    <TableRow key={r._id} hover>
                                        <TableCell sx={{ fontFamily: "monospace", fontSize: "0.78rem", color: "#374151" }}>
                                            {r.gtin}
                                        </TableCell>
                                        <TableCell sx={{ fontFamily: "monospace", fontSize: "0.78rem", color: "#374151" }}>
                                            {r.upc}
                                        </TableCell>
                                        <TableCell sx={{ fontFamily: "monospace", fontSize: "0.78rem", color: "#374151" }}>
                                            {r.sku}
                                        </TableCell>
                                        <TableCell sx={{ fontSize: "0.85rem" }}>
                                            {r.design?.name ?? <span style={{ color: "#9ca3af" }}>—</span>}
                                        </TableCell>
                                        <TableCell sx={{ fontSize: "0.85rem" }}>
                                            {r.blank?.name ?? <span style={{ color: "#9ca3af" }}>—</span>}
                                        </TableCell>
                                        <TableCell sx={{ fontSize: "0.85rem" }}>
                                            {r.color?.name ?? <span style={{ color: "#9ca3af" }}>—</span>}
                                        </TableCell>
                                        <TableCell sx={{ fontSize: "0.85rem" }}>
                                            {r.size ?? <span style={{ color: "#9ca3af" }}>—</span>}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {data && data.recentCount > LIMIT && (
                        <Stack direction="row" justifyContent="center" alignItems="center" spacing={2} sx={{ mt: 2 }}>
                            <Button size="small" variant="outlined" disabled={page === 0}
                                onClick={() => changePage(page - 1)} sx={{ borderRadius: 2 }}>
                                Previous
                            </Button>
                            <Typography variant="body2" color="text.secondary">
                                Page {page + 1} of {Math.ceil(data.recentCount / LIMIT)}
                            </Typography>
                            <Button size="small" variant="outlined"
                                disabled={(page + 1) * LIMIT >= data.recentCount}
                                onClick={() => changePage(page + 1)} sx={{ borderRadius: 2 }}>
                                Next
                            </Button>
                        </Stack>
                    )}
                </Box>
            </Container>

            <SettingsDialog open={settingsOpen} setOpen={setSettingsOpen} onSaved={() => load(search, page)} />
        </Box>
    );
}

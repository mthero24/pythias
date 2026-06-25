"use client";
import { useState, useMemo } from "react";
import {
    Box, Container, Typography, Stack, Chip, Paper, Button, TextField,
    Table, TableHead, TableBody, TableRow, TableCell, Snackbar, Alert,
    Tooltip, IconButton, CircularProgress, Divider,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import ReplyIcon from "@mui/icons-material/Reply";
import BlockIcon from "@mui/icons-material/Block";
import FastForwardIcon from "@mui/icons-material/FastForward";
import RefreshIcon from "@mui/icons-material/Refresh";
import axios from "axios";

const TOTAL_STEPS = 5;

const STATUS_STYLE = {
    active:       { label: "Active",       color: "#2563eb", bg: "#eff6ff" },
    replied:      { label: "Replied",      color: "#16a34a", bg: "#f0fdf4" },
    stopped:      { label: "Stopped",      color: "#b45309", bg: "#fffbeb" },
    unsubscribed: { label: "Unsubscribed", color: "#dc2626", bg: "#fef2f2" },
    completed:    { label: "Completed",    color: "#475569", bg: "#f1f5f9" },
};

function StatusBadge({ status }) {
    const s = STATUS_STYLE[status] || STATUS_STYLE.active;
    return <Chip label={s.label} size="small" sx={{ height: 22, fontSize: "0.72rem", fontWeight: 600, color: s.color, bgcolor: s.bg }} />;
}

function fmtDate(d) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function OutreachClient({ prospects: initial = [], apiUrl = "/api/admin/outreach", dueCount = 0 }) {
    const [prospects, setProspects] = useState(initial);
    const [shopName, setShopName] = useState("");
    const [firstName, setFirstName] = useState("");
    const [emails, setEmails] = useState("");
    const [adding, setAdding] = useState(false);
    const [dispatching, setDispatching] = useState(false);
    const [due, setDue] = useState(dueCount);
    const [busyId, setBusyId] = useState(null);
    const [toast, setToast] = useState(null); // { sev, msg }

    const dispatchUrl = `${apiUrl}/dispatch`;

    const reload = async () => {
        try {
            const { data } = await axios.get(apiUrl);
            if (data?.prospects) setProspects(data.prospects);
            const d = await axios.get(dispatchUrl);
            if (typeof d.data?.due === "number") setDue(d.data.due);
        } catch (e) { /* non-fatal */ }
    };

    const add = async () => {
        if (!shopName.trim() || !emails.trim()) {
            setToast({ sev: "warning", msg: "Shop name and at least one email are required." });
            return;
        }
        setAdding(true);
        try {
            const { data } = await axios.post(apiUrl, { shopName, firstName, emails });
            const skipped = data?.skipped?.length || 0;
            setToast({ sev: "success", msg: `Added & emailed ${data?.created || 0}. ${skipped ? `Skipped ${skipped}.` : ""}` });
            setShopName(""); setFirstName(""); setEmails("");
            await reload();
        } catch (e) {
            setToast({ sev: "error", msg: e.response?.data?.error || "Failed to add prospects." });
        } finally {
            setAdding(false);
        }
    };

    const act = async (id, action) => {
        setBusyId(id);
        try {
            const { data } = await axios.patch(apiUrl, { id, action });
            if (data?.success === false) {
                setToast({ sev: "error", msg: data.error || "Action failed." });
            } else {
                setToast({ sev: "success", msg: action === "sendNext" ? "Next email sent." : `Marked ${action}.` });
            }
            await reload();
        } catch (e) {
            setToast({ sev: "error", msg: e.response?.data?.error || "Action failed." });
        } finally {
            setBusyId(null);
        }
    };

    const dispatch = async () => {
        setDispatching(true);
        try {
            const { data } = await axios.post(dispatchUrl, {});
            setToast({ sev: "success", msg: `Dispatched ${data?.dispatched ?? 0} follow-up${data?.dispatched === 1 ? "" : "s"}.` });
            await reload();
        } catch (e) {
            setToast({ sev: "error", msg: e.response?.data?.error || "Dispatch failed." });
        } finally {
            setDispatching(false);
        }
    };

    const counts = useMemo(() => {
        const c = { active: 0, replied: 0, completed: 0, total: prospects.length };
        prospects.forEach((p) => { if (c[p.status] !== undefined) c[p.status]++; });
        return c;
    }, [prospects]);

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2} mb={1}>
                <Box>
                    <Typography variant="h5" fontWeight={800}>Founder Outreach</Typography>
                    <Typography variant="body2" color="text.secondary">
                        {counts.total} prospects · {counts.active} active · {counts.replied} replied · {counts.completed} completed
                    </Typography>
                </Box>
                <Button
                    variant="contained" onClick={dispatch} disabled={dispatching}
                    startIcon={dispatching ? <CircularProgress size={16} color="inherit" /> : <RefreshIcon />}
                    sx={{ bgcolor: "#D3A73D", color: "#111", fontWeight: 700, "&:hover": { bgcolor: "#bd942f" } }}
                >
                    Process due follow-ups{due ? ` (${due})` : ""}
                </Button>
            </Stack>

            {/* Composer */}
            <Paper elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 2, p: 3, mb: 3 }}>
                <Typography fontWeight={700} mb={2}>Add prospects</Typography>
                <Stack spacing={2}>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                        <TextField label="Shop name" value={shopName} onChange={(e) => setShopName(e.target.value)} size="small" fullWidth required />
                        <TextField label="First name (optional)" value={firstName} onChange={(e) => setFirstName(e.target.value)} size="small" fullWidth />
                    </Stack>
                    <TextField
                        label="Emails (one per line or comma-separated)"
                        value={emails} onChange={(e) => setEmails(e.target.value)}
                        size="small" fullWidth multiline minRows={3}
                        placeholder={"owner@shop.com\nteam@shop.com"}
                    />
                    <Box>
                        <Button
                            variant="contained" onClick={add} disabled={adding}
                            startIcon={adding ? <CircularProgress size={16} color="inherit" /> : <SendIcon />}
                            sx={{ bgcolor: "#0f172a", "&:hover": { bgcolor: "#1e293b" } }}
                        >
                            Add &amp; send first email
                        </Button>
                    </Box>
                </Stack>
            </Paper>

            {/* Prospect table */}
            <Paper elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 2, overflow: "hidden" }}>
                <Table size="small">
                    <TableHead>
                        <TableRow sx={{ bgcolor: "#f8fafc" }}>
                            <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Shop</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Step</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Next send</TableCell>
                            <TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {prospects.length === 0 && (
                            <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4, color: "text.secondary" }}>No prospects yet.</TableCell></TableRow>
                        )}
                        {prospects.map((p) => {
                            const busy = busyId === p._id;
                            const canAct = p.status === "active";
                            return (
                                <TableRow key={p._id} hover>
                                    <TableCell sx={{ fontFamily: "monospace", fontSize: "0.8rem" }}>{p.email}</TableCell>
                                    <TableCell>
                                        {p.shopName}
                                        {p.firstName ? <Typography component="span" variant="caption" color="text.secondary"> · {p.firstName}</Typography> : null}
                                    </TableCell>
                                    <TableCell>{p.step || 0} / {TOTAL_STEPS}</TableCell>
                                    <TableCell><StatusBadge status={p.status} /></TableCell>
                                    <TableCell sx={{ fontSize: "0.8rem", color: "text.secondary" }}>{fmtDate(p.nextSendAt)}</TableCell>
                                    <TableCell align="right">
                                        {busy ? <CircularProgress size={16} /> : (
                                            <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                                                <Tooltip title="Mark replied">
                                                    <span><IconButton size="small" disabled={!canAct} onClick={() => act(p._id, "replied")}><ReplyIcon fontSize="small" /></IconButton></span>
                                                </Tooltip>
                                                <Tooltip title="Stop sequence">
                                                    <span><IconButton size="small" disabled={!canAct} onClick={() => act(p._id, "stopped")}><BlockIcon fontSize="small" /></IconButton></span>
                                                </Tooltip>
                                                <Tooltip title="Send next now">
                                                    <span><IconButton size="small" disabled={!canAct} onClick={() => act(p._id, "sendNext")}><FastForwardIcon fontSize="small" /></IconButton></span>
                                                </Tooltip>
                                            </Stack>
                                        )}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </Paper>

            <Snackbar open={!!toast} autoHideDuration={5000} onClose={() => setToast(null)} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
                {toast ? <Alert severity={toast.sev} onClose={() => setToast(null)} variant="filled">{toast.msg}</Alert> : undefined}
            </Snackbar>
        </Container>
    );
}

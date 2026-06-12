"use client";
import { useState, useEffect, useCallback } from "react";
import {
    Box, Container, Typography, Stack, Paper, Chip, Button, IconButton,
    CircularProgress, Tabs, Tab, Tooltip, Divider,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import RefreshIcon from "@mui/icons-material/Refresh";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

const LEVEL = {
    error:   { color: "#dc2626", bg: "#fef2f2", Icon: ErrorOutlineIcon, label: "Error" },
    warning: { color: "#d97706", bg: "#fffbeb", Icon: WarningAmberIcon, label: "Warning" },
    info:    { color: "#2563eb", bg: "#eff6ff", Icon: InfoOutlinedIcon, label: "Info" },
};

function timeAgo(date) {
    const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (s < 60) return "just now";
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return new Date(date).toLocaleDateString();
}

export default function DeveloperDashboard() {
    const [tab, setTab]               = useState(0); // 0 all, 1 unread
    const [items, setItems]           = useState([]);
    const [unreadCount, setUnread]    = useState(0);
    const [loading, setLoading]       = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        const filter = tab === 1 ? "?filter=unread" : "";
        try {
            const res  = await fetch(`/api/partner-notifications${filter}`);
            const data = await res.json();
            setItems(data.notifications ?? []);
            setUnread(data.unreadCount ?? 0);
        } catch { /* noop */ } finally { setLoading(false); }
    }, [tab]);

    useEffect(() => { load(); }, [load]);

    const markRead = async (id) => {
        setItems(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        setUnread(c => Math.max(0, c - 1));
        await fetch("/api/partner-notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
        if (tab === 1) load();
    };
    const markAllRead = async () => {
        await fetch("/api/partner-notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ all: true }) });
        load();
    };
    const dismiss = async (id) => {
        setItems(prev => prev.filter(n => n.id !== id));
        await fetch(`/api/partner-notifications?id=${id}`, { method: "DELETE" });
    };

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                <Box>
                    <Typography variant="h5" fontWeight={800}>API Dashboard</Typography>
                    <Typography variant="body2" color="text.secondary">
                        Failures and notable events from your Partner API integration — and why they happened.
                    </Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                    <Tooltip title="Refresh"><IconButton onClick={load} size="small"><RefreshIcon fontSize="small" /></IconButton></Tooltip>
                    <Button size="small" startIcon={<DoneAllIcon />} onClick={markAllRead} disabled={unreadCount === 0}>
                        Mark all read
                    </Button>
                </Stack>
            </Stack>

            <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2, minHeight: 40 }}>
                <Tab label="All" sx={{ minHeight: 40 }} />
                <Tab label={`Unread${unreadCount ? ` (${unreadCount})` : ""}`} sx={{ minHeight: 40 }} />
            </Tabs>

            {loading ? (
                <Box sx={{ textAlign: "center", py: 8 }}><CircularProgress size={28} /></Box>
            ) : items.length === 0 ? (
                <Paper variant="outlined" sx={{ p: 6, textAlign: "center", borderRadius: 2, borderStyle: "dashed" }}>
                    <Typography color="text.secondary">
                        {tab === 1 ? "No unread notifications." : "No notifications yet. Failures from your API integration will appear here."}
                    </Typography>
                </Paper>
            ) : (
                <Stack spacing={1.5}>
                    {items.map((n) => {
                        const cfg = LEVEL[n.level] ?? LEVEL.info;
                        const { Icon } = cfg;
                        return (
                            <Paper key={n.id} variant="outlined"
                                sx={{ p: 2, borderRadius: 2, borderLeft: `4px solid ${cfg.color}`,
                                    bgcolor: n.read ? "transparent" : cfg.bg, position: "relative" }}>
                                <Stack direction="row" spacing={1.5}>
                                    <Icon sx={{ color: cfg.color, mt: 0.3 }} fontSize="small" />
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5, flexWrap: "wrap" }}>
                                            <Typography variant="subtitle2" fontWeight={700}>{n.title}</Typography>
                                            <Chip label={n.source} size="small" variant="outlined" sx={{ height: 18, fontSize: "0.68rem" }} />
                                            {!n.read && <Chip label="new" size="small" sx={{ height: 18, fontSize: "0.68rem", bgcolor: cfg.color, color: "#fff" }} />}
                                        </Stack>
                                        {n.message && <Typography variant="body2" color="text.secondary" sx={{ mb: n.detail ? 1 : 0 }}>{n.message}</Typography>}
                                        {n.detail && (
                                            <Box component="pre" sx={{ m: 0, p: 1, bgcolor: "action.hover", borderRadius: 1, fontSize: "0.72rem", overflowX: "auto", color: "text.secondary" }}>
                                                {JSON.stringify(n.detail, null, 2)}
                                            </Box>
                                        )}
                                        <Typography variant="caption" color="text.disabled" sx={{ display: "block", mt: 0.75 }}>
                                            {timeAgo(n.createdAt)}{n.event ? ` · ${n.event}` : ""}
                                        </Typography>
                                    </Box>
                                    <Stack spacing={0.5}>
                                        {!n.read && <Tooltip title="Mark read"><IconButton size="small" onClick={() => markRead(n.id)}><DoneAllIcon sx={{ fontSize: 16 }} /></IconButton></Tooltip>}
                                        <Tooltip title="Dismiss"><IconButton size="small" onClick={() => dismiss(n.id)}><CloseIcon sx={{ fontSize: 16 }} /></IconButton></Tooltip>
                                    </Stack>
                                </Stack>
                            </Paper>
                        );
                    })}
                </Stack>
            )}

            <Divider sx={{ my: 4 }} />
            <Typography variant="caption" color="text.disabled">
                Looking for endpoint reference? See the{" "}
                <a href="https://pythiastechnologies.com/developer" target="_blank" rel="noreferrer" style={{ color: "inherit" }}>API documentation</a>.
            </Typography>
        </Container>
    );
}

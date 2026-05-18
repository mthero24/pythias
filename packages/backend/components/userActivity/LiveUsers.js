"use client";
import { useState, useEffect, useCallback } from "react";
import {
    Box, Typography, Paper, Avatar, Chip, Stack,
    Tooltip, CircularProgress,
} from "@mui/material";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import axios from "axios";

const POLL_MS    = 15_000;
const ONLINE_MS  = 5 * 60 * 1000;

function formatDuration(ms) {
    if (ms < 0) return "0s";
    const s = Math.floor(ms / 1000);
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ${s % 60}s`;
    const h = Math.floor(m / 60);
    return `${h}h ${m % 60}m`;
}

function pageName(path) {
    if (!path) return null;
    if (path === "/") return "Dashboard";
    return path
        .split("/")
        .filter(Boolean)
        .map(seg => seg.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()))
        .join(" › ");
}

function userInitials(u) {
    if (u.firstName && u.lastName) return `${u.firstName[0]}${u.lastName[0]}`.toUpperCase();
    return (u.userName?.[0] ?? "?").toUpperCase();
}

function avatarColor(userName) {
    const colors = ["#6366f1", "#14b8a6", "#f59e0b", "#ef4444", "#8b5cf6", "#10b981", "#3b82f6"];
    let h = 0;
    for (let i = 0; i < (userName?.length ?? 0); i++) h = (h * 31 + userName.charCodeAt(i)) % colors.length;
    return colors[h];
}

function UserRow({ user, now }) {
    const onPage   = user.currentPage  ? pageName(user.currentPage)  : null;
    const prevPage = user.previousPage ? pageName(user.previousPage) : null;
    const enteredAt = user.pageEnteredAt ? new Date(user.pageEnteredAt).getTime() : null;
    const elapsed   = enteredAt ? now - enteredAt : null;
    const lastSeenMs = user.lastSeen ? now - new Date(user.lastSeen).getTime() : null;
    const isOnline = lastSeenMs !== null && lastSeenMs < ONLINE_MS;

    return (
        <Box sx={{
            display: "flex", alignItems: "center", gap: 2,
            py: 1.5, px: 2,
            borderBottom: "1px solid",
            borderColor: "divider",
            "&:last-child": { borderBottom: "none" },
        }}>
            {/* Avatar */}
            <Box sx={{ position: "relative", flexShrink: 0 }}>
                <Avatar
                    src={user.avatar?.startsWith("http") ? user.avatar : undefined}
                    sx={{ width: 36, height: 36, fontSize: "0.8rem", fontWeight: 700, bgcolor: user.avatar?.startsWith("#") ? user.avatar : avatarColor(user.userName) }}
                >
                    {!user.avatar?.startsWith("http") && userInitials(user)}
                </Avatar>
                <FiberManualRecordIcon sx={{
                    position: "absolute", bottom: -1, right: -1,
                    fontSize: 12,
                    color: isOnline ? "#22c55e" : "#9ca3af",
                    bgcolor: "#fff",
                    borderRadius: "50%",
                }} />
            </Box>

            {/* Name */}
            <Box sx={{ minWidth: 130 }}>
                <Typography variant="body2" fontWeight={600} noWrap>
                    {user.firstName ? `${user.firstName} ${user.lastName ?? ""}`.trim() : user.userName}
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap>@{user.userName}</Typography>
            </Box>

            {/* Current page */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
                {onPage ? (
                    <Chip
                        label={onPage}
                        size="small"
                        sx={{
                            fontFamily: "monospace", fontSize: "0.72rem",
                            bgcolor: "rgba(99,102,241,0.08)", color: "primary.main",
                            maxWidth: "100%",
                        }}
                    />
                ) : (
                    <Typography variant="caption" color="text.disabled">—</Typography>
                )}
            </Box>

            {/* Previous page */}
            <Box sx={{ minWidth: 140, display: { xs: "none", md: "block" } }}>
                {prevPage ? (
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                        <SwapHorizIcon sx={{ fontSize: 14, color: "text.disabled", flexShrink: 0 }} />
                        <Typography variant="caption" color="text.secondary" noWrap>{prevPage}</Typography>
                    </Stack>
                ) : (
                    <Typography variant="caption" color="text.disabled">—</Typography>
                )}
            </Box>

            {/* Time on page */}
            <Box sx={{ minWidth: 70, textAlign: "right", flexShrink: 0 }}>
                {elapsed !== null ? (
                    <Tooltip title="Time on current page">
                        <Stack direction="row" alignItems="center" spacing={0.5} justifyContent="flex-end">
                            <AccessTimeIcon sx={{ fontSize: 13, color: "text.disabled" }} />
                            <Typography variant="caption" fontWeight={600} sx={{ fontFamily: "monospace" }}>
                                {formatDuration(elapsed)}
                            </Typography>
                        </Stack>
                    </Tooltip>
                ) : (
                    <Typography variant="caption" color="text.disabled">—</Typography>
                )}
            </Box>
        </Box>
    );
}

export function LiveUsers({ apiUrl = "/api/admin/users/presence", embedded = false }) {
    const [users, setUsers]   = useState([]);
    const [loading, setLoading] = useState(true);
    const [now, setNow]       = useState(() => Date.now());

    const load = useCallback(async () => {
        try {
            const { data } = await axios.get(apiUrl);
            if (!data.error) setUsers(data.users);
        } catch {}
        finally { setLoading(false); }
    }, [apiUrl]);

    useEffect(() => {
        load();
        const id = setInterval(load, POLL_MS);
        return () => clearInterval(id);
    }, [load]);

    // Tick every second so "time on page" counts up live
    useEffect(() => {
        const id = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(id);
    }, []);

    return (
        <Paper variant={embedded ? "outlined" : "outlined"} sx={embedded ? {} : { mb: 0, mx: 3, mt: 3 }}>
            <Box sx={{ px: 2, py: 1.5, display: "flex", alignItems: "center", gap: 2, borderBottom: "1px solid", borderColor: "divider" }}>
                <FiberManualRecordIcon sx={{ fontSize: 12, color: "#22c55e" }} />
                <Typography variant="subtitle2" fontWeight={700}>Live Users</Typography>
                {!loading && (
                    <Chip size="small" label={`${users.length} online`} sx={{ bgcolor: users.length > 0 ? "rgba(34,197,94,0.1)" : undefined, color: users.length > 0 ? "#15803d" : undefined }} />
                )}
                {loading && <CircularProgress size={14} />}
                <Typography variant="caption" color="text.disabled" sx={{ ml: "auto" }}>
                    refreshes every 15s
                </Typography>
            </Box>

            {/* Column headers */}
            <Box sx={{ display: "flex", gap: 2, px: 2, py: 1, bgcolor: "action.hover" }}>
                <Box sx={{ width: 36, flexShrink: 0 }} />
                <Typography variant="caption" fontWeight={700} sx={{ minWidth: 130 }}>User</Typography>
                <Typography variant="caption" fontWeight={700} sx={{ flex: 1 }}>Current Page</Typography>
                <Typography variant="caption" fontWeight={700} sx={{ minWidth: 140, display: { xs: "none", md: "block" } }}>Previous Page</Typography>
                <Typography variant="caption" fontWeight={700} sx={{ minWidth: 70, textAlign: "right" }}>Time on Page</Typography>
            </Box>

            {!loading && users.length === 0 && (
                <Box sx={{ py: 4, textAlign: "center" }}>
                    <Typography color="text.disabled" variant="body2">No users online in the last 5 minutes</Typography>
                </Box>
            )}

            {users.map(u => (
                <UserRow key={u.userName} user={u} now={now} />
            ))}
        </Paper>
    );
}

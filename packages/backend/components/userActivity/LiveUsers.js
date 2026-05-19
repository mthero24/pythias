"use client";
import { useState, useEffect, useCallback } from "react";
import {
    Box, Typography, Paper, Chip, Stack,
    Tooltip, CircularProgress,
} from "@mui/material";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import TravelExploreIcon from "@mui/icons-material/TravelExplore";
import axios from "axios";

const POLL_MS   = 15_000;

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
    if (path === "/") return "Home";
    return path
        .split("/")
        .filter(Boolean)
        .map(seg => seg.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()))
        .join(" › ");
}

function sourceColor(source) {
    if (!source || source === "direct") return { bg: "#f1f5f9", color: "#64748b" };
    if (source === "google")   return { bg: "#fef9c3", color: "#854d0e" };
    if (source === "bing")     return { bg: "#e0f2fe", color: "#0369a1" };
    if (source === "facebook") return { bg: "#eff6ff", color: "#1d4ed8" };
    if (source === "tiktok")   return { bg: "#fdf4ff", color: "#7e22ce" };
    if (source === "instagram")return { bg: "#fff1f2", color: "#be123c" };
    return { bg: "#f0fdf4", color: "#15803d" };
}

function SessionRow({ session, now }) {
    const pages      = session.pages || [];
    const currentPage = pages[pages.length - 1] || session.entryPage;
    const prevPage   = pages.length > 1 ? pages[pages.length - 2] : null;
    const elapsed    = session.startedAt ? now - new Date(session.startedAt).getTime() : null;
    const src        = session.source || "direct";
    const { bg, color } = sourceColor(src);

    return (
        <Box sx={{
            display: "flex", alignItems: "center", gap: 2,
            py: 1.5, px: 2,
            borderBottom: "1px solid",
            borderColor: "divider",
            "&:last-child": { borderBottom: "none" },
        }}>
            {/* Source chip */}
            <Chip
                label={src}
                size="small"
                sx={{ bgcolor: bg, color, fontWeight: 600, fontSize: "0.7rem", minWidth: 72, flexShrink: 0 }}
            />

            {/* Current page */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
                {currentPage ? (
                    <Chip
                        label={pageName(currentPage)}
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
                        <Typography variant="caption" color="text.secondary" noWrap>{pageName(prevPage)}</Typography>
                    </Stack>
                ) : (
                    <Typography variant="caption" color="text.disabled">—</Typography>
                )}
            </Box>

            {/* Pages visited */}
            <Box sx={{ minWidth: 40, textAlign: "center", flexShrink: 0 }}>
                <Tooltip title="Pages visited">
                    <Stack direction="row" alignItems="center" spacing={0.5} justifyContent="center">
                        <TravelExploreIcon sx={{ fontSize: 13, color: "text.disabled" }} />
                        <Typography variant="caption" fontWeight={600} sx={{ fontFamily: "monospace" }}>
                            {pages.length}
                        </Typography>
                    </Stack>
                </Tooltip>
            </Box>

            {/* Time on site */}
            <Box sx={{ minWidth: 70, textAlign: "right", flexShrink: 0 }}>
                {elapsed !== null ? (
                    <Tooltip title="Time on site">
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
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading]   = useState(true);
    const [now, setNow]           = useState(() => Date.now());

    const load = useCallback(async () => {
        try {
            const { data } = await axios.get(apiUrl);
            if (!data.error) setSessions(data.sessions ?? []);
        } catch {}
        finally { setLoading(false); }
    }, [apiUrl]);

    useEffect(() => {
        load();
        const id = setInterval(load, POLL_MS);
        return () => clearInterval(id);
    }, [load]);

    useEffect(() => {
        const id = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(id);
    }, []);

    return (
        <Paper variant="outlined" sx={embedded ? {} : { mb: 0, mx: 3, mt: 3 }}>
            <Box sx={{ px: 2, py: 1.5, display: "flex", alignItems: "center", gap: 2, borderBottom: "1px solid", borderColor: "divider" }}>
                <FiberManualRecordIcon sx={{ fontSize: 12, color: "#22c55e" }} />
                <Typography variant="subtitle2" fontWeight={700}>Live Sessions</Typography>
                {!loading && (
                    <Chip size="small" label={`${sessions.length} active`} sx={{ bgcolor: sessions.length > 0 ? "rgba(34,197,94,0.1)" : undefined, color: sessions.length > 0 ? "#15803d" : undefined }} />
                )}
                {loading && <CircularProgress size={14} />}
                <Typography variant="caption" color="text.disabled" sx={{ ml: "auto" }}>
                    refreshes every 15s
                </Typography>
            </Box>

            {/* Column headers */}
            <Box sx={{ display: "flex", gap: 2, px: 2, py: 1, bgcolor: "action.hover" }}>
                <Box sx={{ minWidth: 72, flexShrink: 0 }}>
                    <Typography variant="caption" fontWeight={700}>Source</Typography>
                </Box>
                <Typography variant="caption" fontWeight={700} sx={{ flex: 1 }}>Current Page</Typography>
                <Typography variant="caption" fontWeight={700} sx={{ minWidth: 140, display: { xs: "none", md: "block" } }}>Previous Page</Typography>
                <Typography variant="caption" fontWeight={700} sx={{ minWidth: 40, textAlign: "center" }}>Pages</Typography>
                <Typography variant="caption" fontWeight={700} sx={{ minWidth: 70, textAlign: "right" }}>Time on Site</Typography>
            </Box>

            {!loading && sessions.length === 0 && (
                <Box sx={{ py: 4, textAlign: "center" }}>
                    <Typography color="text.disabled" variant="body2">No active sessions in the last 5 minutes</Typography>
                </Box>
            )}

            {sessions.map(s => (
                <SessionRow key={s.sessionId} session={s} now={now} />
            ))}
        </Paper>
    );
}

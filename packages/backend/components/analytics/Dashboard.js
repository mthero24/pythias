"use client";
import { useState, useEffect, useCallback } from "react";
import {
    Box, Typography, Paper, Table, TableBody, TableCell, TableHead,
    TableRow, Chip, CircularProgress, ToggleButton, ToggleButtonGroup,
    Tooltip,
} from "@mui/material";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import PeopleIcon from "@mui/icons-material/People";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import SpeedIcon from "@mui/icons-material/Speed";

function fmtTime(secs) {
    if (!secs) return "—";
    if (secs < 60) return `${secs}s`;
    return `${Math.floor(secs / 60)}m ${secs % 60}s`;
}
function fmtMs(ms) {
    if (!ms) return "—";
    return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`;
}
function lcpColor(ms) {
    if (ms <= 2500) return "success";
    if (ms <= 4000) return "warning";
    return "error";
}
function clsColor(score) {
    if (score <= 0.1) return "success";
    if (score <= 0.25) return "warning";
    return "error";
}
function ttfbColor(ms) {
    if (ms <= 800) return "success";
    if (ms <= 1800) return "warning";
    return "error";
}

function StatCard({ icon, label, value, sub, color = "#6366f1" }) {
    return (
        <Paper variant="outlined" sx={{ p: 2.5, flex: 1, minWidth: 160 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                <Box sx={{ color, display: "flex" }}>{icon}</Box>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>{label}</Typography>
            </Box>
            <Typography variant="h4" fontWeight={700} lineHeight={1}>{value}</Typography>
            {sub && <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>{sub}</Typography>}
        </Paper>
    );
}

function TrafficChart({ data }) {
    if (!data?.length) return null;
    const max = Math.max(...data.map(d => d.views), 1);
    return (
        <Box>
            <Typography variant="h6" fontWeight={600} mb={2}>Daily Traffic (human pageviews)</Typography>
            <Box sx={{ display: "flex", alignItems: "flex-end", gap: "3px", height: 80 }}>
                {data.map(d => (
                    <Tooltip key={d.date} title={`${d.date}: ${d.views} views`}>
                        <Box sx={{
                            flex: 1, minWidth: 4,
                            height: `${Math.max(4, Math.round((d.views / max) * 80))}px`,
                            bgcolor: "#6366f1", borderRadius: "2px 2px 0 0",
                            cursor: "default", opacity: 0.85,
                            "&:hover": { opacity: 1 },
                        }} />
                    </Tooltip>
                ))}
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", mt: 0.5 }}>
                <Typography variant="caption" color="text.secondary">{data[0]?.date}</Typography>
                <Typography variant="caption" color="text.secondary">{data[data.length - 1]?.date}</Typography>
            </Box>
        </Box>
    );
}

export function AnalyticsDashboard({ speedOnly = false } = {}) {
    const [range, setRange] = useState("7d");
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/analytics/dashboard?range=${range}`);
            const json = await res.json();
            if (!json.error) setData(json);
        } catch {}
        setLoading(false);
    }, [range]);

    useEffect(() => { load(); }, [load]);

    const s = data?.summary;

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3, flexWrap: "wrap", gap: 2 }}>
                <Typography variant="h5" fontWeight={700}>{speedOnly ? "Platform Speed" : "Analytics"}</Typography>
                <ToggleButtonGroup size="small" value={range} exclusive onChange={(_, v) => { if (v) setRange(v); }}>
                    <ToggleButton value="1d">Today</ToggleButton>
                    <ToggleButton value="7d">7 Days</ToggleButton>
                    <ToggleButton value="30d">30 Days</ToggleButton>
                    <ToggleButton value="90d">90 Days</ToggleButton>
                </ToggleButtonGroup>
            </Box>

            {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>
            ) : !data ? null : (
                <>
                    {!speedOnly && (<>
                    <Box sx={{ display: "flex", gap: 2, mb: 4, flexWrap: "wrap" }}>
                        <StatCard icon={<TrendingUpIcon />} label="Human Pageviews" value={s.humanViews.toLocaleString()} sub={`${s.totalViews.toLocaleString()} total`} />
                        <StatCard icon={<PeopleIcon />} label="Sessions" value={s.humanSessions.toLocaleString()} sub={`${s.avgPagesPerSession} pages/session`} color="#0ea5e9" />
                        <StatCard icon={<AccessTimeIcon />} label="Avg Time on Page" value={fmtTime(s.avgTimeOnPage)} color="#10b981" />
                        <StatCard icon={<SmartToyIcon />} label="Bot Traffic" value={`${s.botPercent}%`} sub={`${s.botViews.toLocaleString()} bot views`} color="#f59e0b" />
                    </Box>

                    <Paper variant="outlined" sx={{ p: 3, mb: 4 }}>
                        <TrafficChart data={data.trafficByDay} />
                    </Paper>

                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 3, mb: 4 }}>
                        <Paper variant="outlined">
                            <Typography variant="subtitle1" fontWeight={700} sx={{ p: 2, pb: 1 }}>Top Pages</Typography>
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ bgcolor: "action.hover" }}>
                                        <TableCell><strong>Page</strong></TableCell>
                                        <TableCell align="right"><strong>Views</strong></TableCell>
                                        <TableCell align="right"><strong>Avg Time</strong></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {data.topPages.map(p => (
                                        <TableRow key={p.page} hover>
                                            <TableCell sx={{ fontFamily: "monospace", fontSize: "0.78rem", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.page || "/"}</TableCell>
                                            <TableCell align="right">{p.views}</TableCell>
                                            <TableCell align="right">{fmtTime(p.avgTime)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Paper>

                        <Paper variant="outlined">
                            <Typography variant="subtitle1" fontWeight={700} sx={{ p: 2, pb: 1 }}>Traffic Sources</Typography>
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ bgcolor: "action.hover" }}>
                                        <TableCell><strong>Source</strong></TableCell>
                                        <TableCell align="right"><strong>Sessions</strong></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {data.topSources.map(s => (
                                        <TableRow key={s.source} hover>
                                            <TableCell sx={{ textTransform: "capitalize" }}>{s.source}</TableCell>
                                            <TableCell align="right">{s.count}</TableCell>
                                        </TableRow>
                                    ))}
                                    {data.topSources.length === 0 && (
                                        <TableRow><TableCell colSpan={2} align="center"><Typography color="text.secondary" py={1}>No data</Typography></TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </Paper>
                    </Box>
                    </>)}

                    {speedOnly && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>How fast the Pythias platform loads for you — lower is better.</Typography>
                    )}

                    {speedOnly && data.vitalsPerPage.length === 0 && (
                        <Paper variant="outlined" sx={{ p: 4, textAlign: "center", mb: 4 }}>
                            <Typography color="text.secondary">No platform speed data collected yet — check back soon.</Typography>
                        </Paper>
                    )}

                    {data.vitalsPerPage.length > 0 && (
                        <Paper variant="outlined" sx={{ mb: 4 }}>
                            <Box sx={{ p: 2, pb: 1, display: "flex", alignItems: "center", gap: 1 }}>
                                <SpeedIcon sx={{ color: "#6366f1" }} />
                                <Typography variant="subtitle1" fontWeight={700}>Core Web Vitals (human sessions only)</Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                                    Good: LCP ≤2.5s · CLS ≤0.1 · TTFB ≤800ms
                                </Typography>
                            </Box>
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ bgcolor: "action.hover" }}>
                                        <TableCell><strong>Page</strong></TableCell>
                                        <TableCell align="center"><strong>LCP</strong></TableCell>
                                        <TableCell align="center"><strong>CLS</strong></TableCell>
                                        <TableCell align="center"><strong>TTFB</strong></TableCell>
                                        <TableCell align="center"><strong>FCP</strong></TableCell>
                                        <TableCell align="center"><strong>Load</strong></TableCell>
                                        <TableCell align="right"><strong>Samples</strong></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {data.vitalsPerPage.map(v => (
                                        <TableRow key={v.page} hover>
                                            <TableCell sx={{ fontFamily: "monospace", fontSize: "0.78rem" }}>{v.page || "/"}</TableCell>
                                            <TableCell align="center"><Chip size="small" label={fmtMs(v.lcp)} color={lcpColor(v.lcp)} variant="outlined" /></TableCell>
                                            <TableCell align="center"><Chip size="small" label={v.cls?.toFixed(3) || "—"} color={clsColor(v.cls)} variant="outlined" /></TableCell>
                                            <TableCell align="center"><Chip size="small" label={fmtMs(v.ttfb)} color={ttfbColor(v.ttfb)} variant="outlined" /></TableCell>
                                            <TableCell align="center"><Typography variant="caption">{fmtMs(v.fcp)}</Typography></TableCell>
                                            <TableCell align="center"><Typography variant="caption">{fmtMs(v.loadTime)}</Typography></TableCell>
                                            <TableCell align="right"><Typography variant="caption" color="text.secondary">{v.sampleCount}</Typography></TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Paper>
                    )}

                    {!speedOnly && data.botReasons.length > 0 && (
                        <Paper variant="outlined" sx={{ mb: 4, p: 2 }}>
                            <Typography variant="subtitle1" fontWeight={700} mb={1.5}>Bot Detection Breakdown</Typography>
                            <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
                                {data.botReasons.map(b => (
                                    <Chip key={b.reason} label={`${b.reason}: ${b.count}`} color="warning" variant="outlined" />
                                ))}
                            </Box>
                        </Paper>
                    )}

                    <Paper variant="outlined">
                        <Typography variant="subtitle1" fontWeight={700} sx={{ p: 2, pb: 1 }}>Recent Human Sessions</Typography>
                        <Table size="small">
                            <TableHead>
                                <TableRow sx={{ bgcolor: "action.hover" }}>
                                    <TableCell><strong>Started</strong></TableCell>
                                    <TableCell><strong>Source</strong></TableCell>
                                    <TableCell><strong>Entry → Exit</strong></TableCell>
                                    <TableCell align="center"><strong>Pages</strong></TableCell>
                                    <TableCell align="right"><strong>Time</strong></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {data.recentSessions.map(s => (
                                    <TableRow key={s.sessionId} hover>
                                        <TableCell sx={{ whiteSpace: "nowrap", fontSize: "0.75rem" }}>
                                            {new Date(s.startedAt).toLocaleDateString()}{" "}
                                            <Typography variant="caption" color="text.secondary">
                                                {new Date(s.startedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>{s.source || "direct"}</TableCell>
                                        <TableCell sx={{ fontFamily: "monospace", fontSize: "0.73rem" }}>
                                            {s.entryPage || "/"} → {s.exitPage || s.entryPage || "/"}
                                        </TableCell>
                                        <TableCell align="center">
                                            <Tooltip title={s.pages.join(" → ")} placement="top">
                                                <Chip size="small" label={s.pages.length} variant="outlined" />
                                            </Tooltip>
                                        </TableCell>
                                        <TableCell align="right">{fmtTime(s.totalTime)}</TableCell>
                                    </TableRow>
                                ))}
                                {data.recentSessions.length === 0 && (
                                    <TableRow><TableCell colSpan={5} align="center"><Typography color="text.secondary" py={2}>No sessions yet</Typography></TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </Paper>
                </>
            )}
        </Box>
    );
}

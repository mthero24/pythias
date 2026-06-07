"use client";
import { useState, useEffect, useCallback } from "react";
import {
    Box, Typography, Paper, Table, TableBody, TableCell, TableHead,
    TableRow, Chip, CircularProgress, ToggleButton, ToggleButtonGroup,
    Divider, Tooltip,
} from "@mui/material";
import AccessTimeIcon    from "@mui/icons-material/AccessTime";
import PeopleIcon        from "@mui/icons-material/People";
import SmartToyIcon      from "@mui/icons-material/SmartToy";
import TrendingUpIcon    from "@mui/icons-material/TrendingUp";
import SpeedIcon         from "@mui/icons-material/Speed";
import CheckCircleIcon   from "@mui/icons-material/CheckCircle";
import EmailIcon         from "@mui/icons-material/Email";
import MailOutlineIcon   from "@mui/icons-material/MailOutline";
import UnsubscribeIcon   from "@mui/icons-material/Unsubscribe";
import OpenInNewIcon     from "@mui/icons-material/OpenInNew";
import AdsClickIcon      from "@mui/icons-material/AdsClick";

// ── Helpers ───────────────────────────────────────────────────────────────────
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
    if (score <= 0.1)  return "success";
    if (score <= 0.25) return "warning";
    return "error";
}
function ttfbColor(ms) {
    if (ms <= 800)  return "success";
    if (ms <= 1800) return "warning";
    return "error";
}

// ── Summary card ──────────────────────────────────────────────────────────────
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

// ── Mini bar chart (pure CSS) ─────────────────────────────────────────────────
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

// ── Dashboard ─────────────────────────────────────────────────────────────────
export default function AnalyticsDashboard() {
    const [range, setRange]   = useState("7d");
    const [data, setData]     = useState(null);
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
                <Typography variant="h5" fontWeight={700}>Analytics</Typography>
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
                    {/* ── Summary cards ── */}
                    <Box sx={{ display: "flex", gap: 2, mb: 4, flexWrap: "wrap" }}>
                        <StatCard icon={<TrendingUpIcon />}   label="Human Pageviews"  value={s.humanViews.toLocaleString()} sub={`${s.totalViews.toLocaleString()} total`} />
                        <StatCard icon={<PeopleIcon />}       label="Sessions"         value={s.humanSessions.toLocaleString()} sub={`${s.avgPagesPerSession} pages/session`} color="#0ea5e9" />
                        <StatCard icon={<AccessTimeIcon />}   label="Avg Time on Page" value={fmtTime(s.avgTimeOnPage)} color="#10b981" />
                        <StatCard icon={<CheckCircleIcon />}  label="Demo Bookings"    value={s.totalConversions ?? 0} sub={`${s.conversionRate ?? 0}% conversion rate`} color="#22c55e" />
                        <StatCard icon={<SmartToyIcon />}     label="Bot Traffic"      value={`${s.botPercent}%`} sub={`${s.botViews.toLocaleString()} bot views`} color="#f59e0b" />
                    </Box>

                    {/* ── Traffic chart ── */}
                    <Paper variant="outlined" sx={{ p: 3, mb: 4 }}>
                        <TrafficChart data={data.trafficByDay} />
                    </Paper>

                    {/* ── Conversions ── */}
                    {data.conversions?.total > 0 && (
                        <Paper variant="outlined" sx={{ p: 3, mb: 4 }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                                <CheckCircleIcon sx={{ color: "#22c55e" }} />
                                <Typography variant="h6" fontWeight={600}>Demo Bookings — {data.conversions.total}</Typography>
                            </Box>
                            <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
                                {data.conversions.bySource.map(c => (
                                    <Chip
                                        key={c.source}
                                        label={`${c.source || "direct"}: ${c.count}`}
                                        color="success"
                                        variant="outlined"
                                        size="small"
                                    />
                                ))}
                            </Box>
                        </Paper>
                    )}

                    {/* ── Email stats ── */}
                    {data.emailStats && (() => {
                        const es = data.emailStats;
                        return (
                            <Paper variant="outlined" sx={{ p: 3, mb: 4 }}>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
                                    <EmailIcon sx={{ color: "#6366f1" }} />
                                    <Typography variant="h6" fontWeight={600}>Email Marketing</Typography>
                                    <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>(list counts are all-time; opens/clicks are within selected range)</Typography>
                                </Box>

                                {/* List health */}
                                <Typography variant="overline" color="text.secondary" fontWeight={700} display="block" mb={1}>Email List</Typography>
                                <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 3 }}>
                                    <StatCard icon={<MailOutlineIcon />}  label="Total Collected" value={es.totalCollected.toLocaleString()} color="#6366f1" />
                                    <StatCard icon={<PeopleIcon />}        label="Active"          value={es.active.toLocaleString()} sub="not opted out" color="#10b981" />
                                    <StatCard icon={<UnsubscribeIcon />}   label="Opted Out"       value={es.optedOut.toLocaleString()} sub={es.totalCollected > 0 ? `${Math.round((es.optedOut / es.totalCollected) * 100)}% of list` : ""} color="#ef4444" />
                                </Box>

                                <Divider sx={{ mb: 3 }} />

                                {/* Engagement */}
                                <Typography variant="overline" color="text.secondary" fontWeight={700} display="block" mb={1}>Engagement (selected range)</Typography>
                                <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                                    <StatCard icon={<EmailIcon />}        label="Emails Sent"  value={es.sent.toLocaleString()} color="#6366f1" />
                                    <StatCard icon={<OpenInNewIcon />}    label="Opens"        value={es.opens.toLocaleString()} sub={`${es.uniqueOpens} unique · ${es.openRate}% open rate`}  color="#0ea5e9" />
                                    <StatCard icon={<AdsClickIcon />}     label="Clicks"       value={es.clicks.toLocaleString()} sub={`${es.uniqueClicks} unique · ${es.clickRate}% click rate`} color="#f59e0b" />
                                </Box>
                            </Paper>
                        );
                    })()}

                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 3, mb: 4 }}>
                        {/* ── Top pages ── */}
                        <Paper variant="outlined">
                            <Typography variant="subtitle1" fontWeight={700} sx={{ p: 2, pb: 1 }}>Top Pages</Typography>
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ bgcolor: "action.hover" }}>
                                        <TableCell><strong>Page</strong></TableCell>
                                        <TableCell align="right"><strong>Views</strong></TableCell>
                                        <TableCell align="right"><strong>Avg</strong></TableCell>
                                        <TableCell align="right"><strong>Shortest</strong></TableCell>
                                        <TableCell align="right"><strong>Longest</strong></TableCell>
                                        <TableCell align="right"><strong>Mode</strong></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {data.topPages.map(p => (
                                        <TableRow key={p.page} hover>
                                            <TableCell sx={{ fontFamily: "monospace", fontSize: "0.78rem", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.page || "/"}</TableCell>
                                            <TableCell align="right">{p.views}</TableCell>
                                            <TableCell align="right">{fmtTime(p.avgTime)}</TableCell>
                                            <TableCell align="right" sx={{ color: "success.main", fontSize: "0.75rem" }}>{p.minTime > 0 ? fmtTime(p.minTime) : "—"}</TableCell>
                                            <TableCell align="right" sx={{ color: "warning.main", fontSize: "0.75rem" }}>{p.maxTime > 0 ? fmtTime(p.maxTime) : "—"}</TableCell>
                                            <TableCell align="right" sx={{ color: "text.secondary", fontSize: "0.75rem" }}>{p.modeTime > 0 ? fmtTime(p.modeTime) : "—"}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Paper>

                        {/* ── Traffic sources ── */}
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

                    {/* ── Blog Posts ── */}
                    {data.blogPosts?.length > 0 && (
                        <Paper variant="outlined" sx={{ mb: 4 }}>
                            <Typography variant="subtitle1" fontWeight={700} sx={{ p: 2, pb: 1 }}>Blog Posts</Typography>
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ bgcolor: "action.hover" }}>
                                        <TableCell><strong>Article</strong></TableCell>
                                        <TableCell align="right"><strong>Views</strong></TableCell>
                                        <TableCell align="right"><strong>Reads</strong></TableCell>
                                        <TableCell align="right"><strong>Read-through</strong></TableCell>
                                        <TableCell align="right"><strong>Avg Time</strong></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {data.blogPosts.map(p => (
                                        <TableRow key={p.page} hover>
                                            <TableCell sx={{ fontFamily: "monospace", fontSize: "0.78rem", maxWidth: 240, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.slug}</TableCell>
                                            <TableCell align="right">{p.views}</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 600, color: p.reads > 0 ? "primary.main" : "text.disabled" }}>{p.reads}</TableCell>
                                            <TableCell align="right">
                                                <Box component="span" sx={{ color: p.readRate >= 50 ? "success.main" : p.readRate >= 20 ? "warning.main" : "text.secondary", fontWeight: 600, fontSize: "0.78rem" }}>
                                                    {p.readRate}%
                                                </Box>
                                            </TableCell>
                                            <TableCell align="right">{fmtTime(p.avgTime)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Paper>
                    )}

                    {/* ── Core Web Vitals ── */}
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
                                            <TableCell align="center"><Chip size="small" label={fmtMs(v.lcp)}  color={lcpColor(v.lcp)}  variant="outlined" /></TableCell>
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

                    {/* ── Bot breakdown ── */}
                    {data.botReasons.length > 0 && (
                        <Paper variant="outlined" sx={{ mb: 4, p: 2 }}>
                            <Typography variant="subtitle1" fontWeight={700} mb={1.5}>Bot Detection Breakdown</Typography>
                            <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
                                {data.botReasons.map(b => (
                                    <Chip key={b.reason} label={`${b.reason}: ${b.count}`} color="warning" variant="outlined" />
                                ))}
                            </Box>
                        </Paper>
                    )}

                    {/* ── Recent sessions ── */}
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

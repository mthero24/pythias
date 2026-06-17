"use client";
import { useEffect, useState, useCallback } from "react";
import {
    Box, Typography, Chip, Card, CircularProgress, Button, Table, TableBody, TableCell, TableHead,
    TableRow, Collapse, IconButton, Select, MenuItem, Tooltip,
} from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import RefreshIcon from "@mui/icons-material/Refresh";

const APP_COLOR = { platform: "primary", premier: "secondary", storefront: "success" };
const fmt = (d) => (d ? new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "—");

export default function ErrorsClient() {
    const [groups, setGroups] = useState(null);
    const [total, setTotal] = useState(0);
    const [hours, setHours] = useState(168);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(null);          // expanded fingerprint
    const [details, setDetails] = useState({});       // fingerprint -> occurrences

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const r = await fetch(`/api/admin/errors?hours=${hours}`);
            const d = await r.json();
            if (!d.error) { setGroups(d.groups || []); setTotal(d.totalEvents || 0); }
            else setGroups([]);
        } catch { setGroups([]); }
        finally { setLoading(false); }
    }, [hours]);

    useEffect(() => { load(); }, [load]);

    const toggle = async (fp) => {
        if (open === fp) { setOpen(null); return; }
        setOpen(fp);
        if (!details[fp]) {
            const r = await fetch(`/api/admin/errors?fingerprint=${encodeURIComponent(fp)}`);
            const d = await r.json();
            if (!d.error) setDetails((prev) => ({ ...prev, [fp]: d.occurrences || [] }));
        }
    };

    return (
        <Box sx={{ p: 3, maxWidth: 1100, mx: "auto" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 0.5 }}>
                <Typography variant="h5" fontWeight={800} sx={{ flex: 1 }}>Error Logs</Typography>
                <Select size="small" value={hours} onChange={(e) => setHours(e.target.value)}>
                    <MenuItem value={24}>Last 24h</MenuItem>
                    <MenuItem value={168}>Last 7 days</MenuItem>
                    <MenuItem value={720}>Last 30 days</MenuItem>
                </Select>
                <Button size="small" startIcon={<RefreshIcon />} onClick={load} sx={{ textTransform: "none" }}>Refresh</Button>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Uncaught server errors across the platform, grouped. {groups ? `${groups.length} distinct · ${total} total events` : ""}
            </Typography>

            {loading && !groups ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>
            ) : !groups?.length ? (
                <Card variant="outlined" sx={{ p: 4, textAlign: "center", color: "text.secondary" }}>
                    🎉 No errors recorded in this window.
                </Card>
            ) : (
                <Card variant="outlined">
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ "& th": { fontWeight: 700, bgcolor: "#f8fafc" } }}>
                                <TableCell width={36} />
                                <TableCell>App</TableCell>
                                <TableCell>Last seen</TableCell>
                                <TableCell align="right">Count</TableCell>
                                <TableCell>Route</TableCell>
                                <TableCell>Message</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {groups.map((g) => {
                                const fp = g._id;
                                const expanded = open === fp;
                                return (
                                    <>
                                        <TableRow key={fp} hover sx={{ cursor: "pointer", "& td": { borderBottom: expanded ? "none" : undefined } }} onClick={() => toggle(fp)}>
                                            <TableCell><IconButton size="small">{expanded ? <KeyboardArrowDownIcon fontSize="small" /> : <KeyboardArrowRightIcon fontSize="small" />}</IconButton></TableCell>
                                            <TableCell><Chip size="small" label={g.app || g.provider || "?"} color={APP_COLOR[g.app] || "default"} variant="outlined" /></TableCell>
                                            <TableCell sx={{ whiteSpace: "nowrap", color: "text.secondary", fontSize: "0.82rem" }}>{fmt(g.lastSeen)}</TableCell>
                                            <TableCell align="right"><Chip size="small" label={g.count} color={g.count > 10 ? "error" : g.count > 3 ? "warning" : "default"} /></TableCell>
                                            <TableCell sx={{ fontFamily: "monospace", fontSize: "0.78rem", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                {g.method ? `${g.method} ` : ""}{g.route || g.source || "—"}
                                            </TableCell>
                                            <TableCell sx={{ maxWidth: 360, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.message}</TableCell>
                                        </TableRow>
                                        <TableRow key={`${fp}-d`}>
                                            <TableCell colSpan={6} sx={{ p: 0, borderBottom: expanded ? undefined : "none" }}>
                                                <Collapse in={expanded} unmountOnExit>
                                                    <Box sx={{ p: 2, bgcolor: "#fbfcfe" }}>
                                                        {!details[fp] ? <CircularProgress size={18} /> : details[fp].length === 0 ? (
                                                            <Typography variant="body2" color="text.secondary">No occurrences.</Typography>
                                                        ) : (
                                                            <>
                                                                <Typography variant="caption" color="text.secondary">
                                                                    First seen {fmt(details[fp][details[fp].length - 1]?.timestamp)} · {details[fp].length} recent occurrence(s)
                                                                </Typography>
                                                                {(() => {
                                                                    const o = details[fp][0];
                                                                    return (
                                                                        <Box sx={{ mt: 1 }}>
                                                                            {(o.userName || o.email || o.orgId) && (
                                                                                <Typography variant="body2" sx={{ mb: 0.5 }}>
                                                                                    <b>Actor:</b> {o.userName || "—"} {o.email ? `(${o.email})` : ""} {o.orgId ? `· org ${o.orgId}` : ""}
                                                                                </Typography>
                                                                            )}
                                                                            {o.status != null && <Typography variant="body2" sx={{ mb: 0.5 }}><b>Status:</b> {o.status}</Typography>}
                                                                            {o.context && Object.keys(o.context).length > 0 && (
                                                                                <Box component="pre" sx={preSx}>{JSON.stringify(o.context, null, 2)}</Box>
                                                                            )}
                                                                            {o.stack && (
                                                                                <>
                                                                                    <Typography variant="caption" color="text.secondary">Stack (most recent occurrence)</Typography>
                                                                                    <Box component="pre" sx={preSx}>{o.stack}</Box>
                                                                                </>
                                                                            )}
                                                                            {details[fp].length > 1 && (
                                                                                <Box sx={{ mt: 1, display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                                                                                    {details[fp].slice(0, 12).map((x, i) => (
                                                                                        <Tooltip key={i} title={`${fmt(x.timestamp)}${x.userName ? " · " + x.userName : ""}`}>
                                                                                            <Chip size="small" variant="outlined" label={fmt(x.timestamp)} sx={{ fontSize: "0.68rem" }} />
                                                                                        </Tooltip>
                                                                                    ))}
                                                                                </Box>
                                                                            )}
                                                                        </Box>
                                                                    );
                                                                })()}
                                                            </>
                                                        )}
                                                    </Box>
                                                </Collapse>
                                            </TableCell>
                                        </TableRow>
                                    </>
                                );
                            })}
                        </TableBody>
                    </Table>
                </Card>
            )}
        </Box>
    );
}

const preSx = {
    m: 0, mt: 0.5, mb: 1, p: 1.5, bgcolor: "#0f172a", color: "#e2e8f0", borderRadius: 1.5,
    fontSize: "0.72rem", lineHeight: 1.5, overflow: "auto", maxHeight: 320, whiteSpace: "pre-wrap", wordBreak: "break-word",
};

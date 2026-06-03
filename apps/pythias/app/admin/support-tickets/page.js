"use client";
import { useState, useEffect, useCallback } from "react";
import {
    Box, Typography, Stack, Chip, Card, Table, TableHead, TableBody, TableRow,
    TableCell, Select, MenuItem, FormControl, InputLabel, Dialog, DialogTitle,
    DialogContent, DialogActions, Button, TextField, Divider, IconButton,
    Avatar, ToggleButtonGroup, ToggleButton, CircularProgress, Alert, Tooltip,
} from "@mui/material";
import BugReportIcon from "@mui/icons-material/BugReport";
import LightbulbIcon from "@mui/icons-material/Lightbulb";
import CloseIcon from "@mui/icons-material/Close";
import SendIcon from "@mui/icons-material/Send";
import RefreshIcon from "@mui/icons-material/Refresh";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";

const STATUS_COLOR   = { open: "primary", "in-progress": "warning", resolved: "success", closed: "default" };
const PRIORITY_COLOR = { low: "default", normal: "primary", high: "warning", urgent: "error" };

const STATUSES = ["open", "in-progress", "resolved", "closed"];

function TypeChip({ type }) {
    return (
        <Chip
            size="small"
            icon={type === "issue" ? <BugReportIcon sx={{ fontSize: "13px !important" }} /> : <LightbulbIcon sx={{ fontSize: "13px !important" }} />}
            label={type === "issue" ? "Issue" : "Request"}
            sx={{
                bgcolor: type === "issue" ? "rgba(239,68,68,0.1)" : "rgba(99,102,241,0.1)",
                color:   type === "issue" ? "#dc2626" : "#6366f1",
                border:  `1px solid ${type === "issue" ? "rgba(239,68,68,0.25)" : "rgba(99,102,241,0.25)"}`,
                fontWeight: 600, fontSize: "0.7rem",
            }}
        />
    );
}

function MessageBubble({ msg }) {
    const isStaff = msg.authorType === "staff";
    return (
        <Box sx={{ display: "flex", gap: 1.5, flexDirection: isStaff ? "row-reverse" : "row", mb: 2 }}>
            <Avatar sx={{ width: 28, height: 28, fontSize: "0.65rem", fontWeight: 700, flexShrink: 0, bgcolor: isStaff ? "#D3A73D" : "grey.300", color: isStaff ? "#0f172a" : "grey.700" }}>
                {isStaff ? "PT" : msg.authorName?.[0]?.toUpperCase() ?? "?"}
            </Avatar>
            <Box sx={{ maxWidth: "78%" }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5, textAlign: isStaff ? "right" : "left" }}>
                    {msg.authorName} · {new Date(msg.createdAt).toLocaleString()}
                </Typography>
                <Box sx={{
                    px: 2, py: 1.25, borderRadius: 2,
                    bgcolor: isStaff ? "rgba(211,167,61,0.08)" : "grey.100",
                    border: "1px solid",
                    borderColor: isStaff ? "rgba(211,167,61,0.25)" : "divider",
                }}>
                    <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>{msg.body}</Typography>
                </Box>
            </Box>
        </Box>
    );
}

function TicketDetail({ ticket: initial, onClose, onUpdate }) {
    const [ticket,  setTicket]  = useState(initial);
    const [reply,   setReply]   = useState("");
    const [status,  setStatus]  = useState(initial.status);
    const [saving,  setSaving]  = useState(false);
    const [err,     setErr]     = useState(null);

    useEffect(() => {
        fetch(`/api/admin/support-tickets/${initial._id}`)
            .then(r => r.json())
            .then(d => { if (d.ticket) { setTicket(d.ticket); setStatus(d.ticket.status); } });
    }, [initial._id]);

    async function save() {
        if (!reply.trim() && status === ticket.status) return;
        setSaving(true);
        setErr(null);
        const body = {};
        if (status !== ticket.status) body.status = status;
        if (reply.trim()) body.reply = reply.trim();

        const res = await fetch(`/api/admin/support-tickets/${ticket._id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
        const d = await res.json();
        if (d.error) {
            setErr(d.error);
        } else {
            setTicket(d.ticket);
            setStatus(d.ticket.status);
            setReply("");
            onUpdate(d.ticket);
        }
        setSaving(false);
    }

    const orgName = initial.org?.name ?? String(initial.orgId);

    return (
        <Dialog open onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { height: "90vh", display: "flex", flexDirection: "column" } }}>
            <DialogTitle sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", pb: 1 }}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ mb: 0.75 }}>
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>{ticket.ticketNumber}</Typography>
                        <TypeChip type={ticket.type} />
                        <Chip label={ticket.priority} size="small" color={PRIORITY_COLOR[ticket.priority]} variant="outlined" />
                        <Chip label={orgName} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
                    </Stack>
                    <Typography variant="subtitle1" fontWeight={700} noWrap>{ticket.subject}</Typography>
                    <Typography variant="caption" color="text.secondary">
                        {ticket.createdByName} · {new Date(ticket.createdAt).toLocaleDateString()}
                    </Typography>
                </Box>
                <IconButton size="small" onClick={onClose} sx={{ ml: 1, mt: 0.25 }}><CloseIcon fontSize="small" /></IconButton>
            </DialogTitle>

            <Divider />

            <Box sx={{ flex: 1, overflowY: "auto", px: 3, py: 2 }}>
                {(ticket.messages ?? []).map((msg, i) => (
                    <MessageBubble key={msg._id ?? i} msg={msg} />
                ))}
            </Box>

            <Divider />

            <Box sx={{ px: 3, py: 2 }}>
                {err && <Alert severity="error" sx={{ mb: 1.5 }}>{err}</Alert>}
                <Stack spacing={1.5}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <FormControl size="small" sx={{ width: 180 }}>
                            <InputLabel>Status</InputLabel>
                            <Select value={status} label="Status" onChange={e => setStatus(e.target.value)}>
                                {STATUSES.map(s => (
                                    <MenuItem key={s} value={s} sx={{ textTransform: "capitalize" }}>{s.replace("-", " ")}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <Typography variant="caption" color="text.secondary">
                            {status !== ticket.status ? `Will change from "${ticket.status.replace("-", " ")}"` : ""}
                        </Typography>
                    </Stack>
                    <Stack direction="row" spacing={1} alignItems="flex-end">
                        <TextField
                            fullWidth multiline minRows={2} maxRows={5} size="small"
                            placeholder="Reply as Pythias Support…"
                            value={reply}
                            onChange={e => setReply(e.target.value)}
                        />
                        <Button
                            variant="contained" size="small"
                            disabled={saving || (!reply.trim() && status === ticket.status)}
                            onClick={save}
                            endIcon={<SendIcon />}
                        >
                            {saving ? "Saving…" : reply.trim() ? "Send" : "Update"}
                        </Button>
                    </Stack>
                </Stack>
            </Box>
        </Dialog>
    );
}

export default function SupportTicketsPage() {
    const [tickets,      setTickets]      = useState([]);
    const [loading,      setLoading]      = useState(true);
    const [typeFilter,   setTypeFilter]   = useState("all");
    const [statusFilter, setStatusFilter] = useState("open");
    const [selected,     setSelected]     = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        const params = new URLSearchParams();
        if (typeFilter   !== "all") params.set("type",   typeFilter);
        if (statusFilter !== "all") params.set("status", statusFilter);
        const res = await fetch(`/api/admin/support-tickets?${params}`);
        const d = await res.json();
        setTickets(d.tickets ?? []);
        setLoading(false);
    }, [typeFilter, statusFilter]);

    useEffect(() => { load(); }, [load]);

    function handleUpdate(updated) {
        setTickets(t => t.map(tk => tk._id === updated._id ? { ...tk, status: updated.status } : tk));
        setSelected(prev => prev ? { ...prev, status: updated.status } : null);
    }

    const counts = tickets.reduce((acc, t) => { acc[t.type] = (acc[t.type] || 0) + 1; return acc; }, {});

    return (
        <Box sx={{ p: { xs: 2, sm: 3 }, bgcolor: "background.default", minHeight: "100vh" }}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 3 }}>
                <Box>
                    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 0.5 }}>
                        <SupportAgentIcon sx={{ fontSize: 28, color: "#D3A73D" }} />
                        <Typography variant="h6" fontWeight={700}>Support Tickets</Typography>
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                        {tickets.length} ticket{tickets.length !== 1 ? "s" : ""}
                        {counts.issue ? ` · ${counts.issue} issue${counts.issue !== 1 ? "s" : ""}` : ""}
                        {counts.request ? ` · ${counts.request} request${counts.request !== 1 ? "s" : ""}` : ""}
                    </Typography>
                </Box>
                <Tooltip title="Refresh">
                    <IconButton onClick={load} disabled={loading}><RefreshIcon /></IconButton>
                </Tooltip>
            </Stack>

            {/* Filters */}
            <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap sx={{ mb: 2.5 }}>
                <ToggleButtonGroup value={typeFilter} exclusive onChange={(_, v) => { if (v) setTypeFilter(v); }} size="small">
                    <ToggleButton value="all">All</ToggleButton>
                    <ToggleButton value="issue"><BugReportIcon fontSize="small" sx={{ mr: 0.5 }} />Issues</ToggleButton>
                    <ToggleButton value="request"><LightbulbIcon fontSize="small" sx={{ mr: 0.5 }} />Requests</ToggleButton>
                </ToggleButtonGroup>

                <ToggleButtonGroup value={statusFilter} exclusive onChange={(_, v) => { if (v) setStatusFilter(v); }} size="small">
                    <ToggleButton value="open">Open</ToggleButton>
                    <ToggleButton value="in-progress">In progress</ToggleButton>
                    <ToggleButton value="resolved">Resolved</ToggleButton>
                    <ToggleButton value="closed">Closed</ToggleButton>
                    <ToggleButton value="all">All</ToggleButton>
                </ToggleButtonGroup>
            </Stack>

            {loading ? (
                <Box sx={{ textAlign: "center", py: 8 }}><CircularProgress /></Box>
            ) : tickets.length === 0 ? (
                <Box sx={{ textAlign: "center", py: 8 }}>
                    <SupportAgentIcon sx={{ fontSize: 48, color: "text.disabled", mb: 1.5 }} />
                    <Typography variant="body1" fontWeight={600} color="text.secondary">No tickets</Typography>
                </Box>
            ) : (
                <Card variant="outlined">
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }}>#</TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }}>Org</TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }}>Type</TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }}>Subject</TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }}>Priority</TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }}>Status</TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }}>Opened by</TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }}>Date</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {tickets.map(ticket => (
                                <TableRow
                                    key={ticket._id}
                                    hover
                                    onClick={() => setSelected(ticket)}
                                    sx={{ cursor: "pointer" }}
                                >
                                    <TableCell sx={{ fontSize: "0.72rem", color: "text.secondary", whiteSpace: "nowrap" }}>
                                        {ticket.ticketNumber}
                                    </TableCell>
                                    <TableCell sx={{ fontSize: "0.8rem", fontWeight: 600, whiteSpace: "nowrap" }}>
                                        {ticket.org?.name ?? "—"}
                                    </TableCell>
                                    <TableCell><TypeChip type={ticket.type} /></TableCell>
                                    <TableCell sx={{ fontSize: "0.82rem", maxWidth: 280 }}>
                                        <Typography variant="body2" noWrap sx={{ maxWidth: 280 }}>{ticket.subject}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        {ticket.priority !== "normal" && (
                                            <Chip label={ticket.priority} size="small" color={PRIORITY_COLOR[ticket.priority]} variant="outlined" />
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={ticket.status.replace("-", " ")}
                                            size="small"
                                            color={STATUS_COLOR[ticket.status]}
                                            variant="outlined"
                                            sx={{ textTransform: "capitalize" }}
                                        />
                                    </TableCell>
                                    <TableCell sx={{ fontSize: "0.78rem" }}>{ticket.createdByName}</TableCell>
                                    <TableCell sx={{ fontSize: "0.78rem", whiteSpace: "nowrap", color: "text.secondary" }}>
                                        {new Date(ticket.createdAt).toLocaleDateString()}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Card>
            )}

            {selected && (
                <TicketDetail
                    ticket={selected}
                    onClose={() => setSelected(null)}
                    onUpdate={handleUpdate}
                />
            )}
        </Box>
    );
}

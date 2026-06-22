"use client";
import { useState, useEffect, useCallback } from "react";
import {
    Box, Container, Typography, Stack, Button, Card, CardContent,
    Chip, Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, MenuItem, Select, InputLabel, FormControl,
    Divider, Alert, ToggleButtonGroup, ToggleButton, IconButton,
    CircularProgress, Avatar,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import BugReportIcon from "@mui/icons-material/BugReport";
import LightbulbIcon from "@mui/icons-material/Lightbulb";
import CloseIcon from "@mui/icons-material/Close";
import SendIcon from "@mui/icons-material/Send";
import RefreshIcon from "@mui/icons-material/Refresh";

const STATUS_COLOR = {
    open:        "primary",
    "in-progress": "warning",
    resolved:    "success",
    closed:      "default",
};

const PRIORITY_COLOR = {
    low:    "default",
    normal: "primary",
    high:   "warning",
    urgent: "error",
};

function TypeChip({ type, size = "small" }) {
    return (
        <Chip
            size={size}
            icon={type === "issue" ? <BugReportIcon sx={{ fontSize: "14px !important" }} /> : <LightbulbIcon sx={{ fontSize: "14px !important" }} />}
            label={type === "issue" ? "Issue" : "Request"}
            sx={{
                bgcolor: type === "issue" ? "rgba(239,68,68,0.1)" : "rgba(99,102,241,0.1)",
                color:   type === "issue" ? "#dc2626" : "#6366f1",
                border:  `1px solid ${type === "issue" ? "rgba(239,68,68,0.25)" : "rgba(99,102,241,0.25)"}`,
                fontWeight: 600,
            }}
        />
    );
}

function MessageBubble({ msg }) {
    const isStaff = msg.authorType === "staff";
    return (
        <Box sx={{ display: "flex", gap: 1.5, flexDirection: isStaff ? "row-reverse" : "row", mb: 2 }}>
            <Avatar sx={{ width: 30, height: 30, fontSize: "0.7rem", fontWeight: 700, flexShrink: 0, bgcolor: isStaff ? "#6366f1" : "grey.300", color: isStaff ? "#fff" : "grey.700" }}>
                {isStaff ? "P" : msg.authorName?.[0]?.toUpperCase() ?? "?"}
            </Avatar>
            <Box sx={{ maxWidth: "75%" }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5, textAlign: isStaff ? "right" : "left" }}>
                    {msg.authorName} · {new Date(msg.createdAt).toLocaleString()}
                </Typography>
                <Box sx={{
                    px: 2, py: 1.25, borderRadius: 2,
                    bgcolor: isStaff ? "rgba(99,102,241,0.08)" : "grey.100",
                    border: "1px solid",
                    borderColor: isStaff ? "rgba(99,102,241,0.2)" : "divider",
                }}>
                    <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>{msg.body}</Typography>
                </Box>
            </Box>
        </Box>
    );
}

function TicketDetail({ ticket: initial, onClose, onUpdate }) {
    const [ticket, setTicket]   = useState(initial);
    const [reply, setReply]     = useState("");
    const [sending, setSending] = useState(false);
    const [err, setErr]         = useState(null);

    async function loadFull() {
        const res = await fetch(`/api/support/${ticket._id}`);
        const d = await res.json();
        if (d.ticket) { setTicket(d.ticket); onUpdate(d.ticket); }
    }

    useEffect(() => { loadFull(); }, [ticket._id]);

    async function sendReply(e) {
        e.preventDefault();
        if (!reply.trim()) return;
        setSending(true);
        setErr(null);
        const res = await fetch(`/api/support/${ticket._id}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ body: reply.trim() }),
        });
        const d = await res.json();
        if (d.error) {
            setErr(d.msg);
        } else {
            setTicket(d.ticket);
            onUpdate(d.ticket);
            setReply("");
        }
        setSending(false);
    }

    return (
        <Dialog open onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { height: "90vh", display: "flex", flexDirection: "column" } }}>
            <DialogTitle sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", pb: 1 }}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ mb: 0.75 }}>
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>{ticket.ticketNumber}</Typography>
                        <TypeChip type={ticket.type} />
                        <Chip label={ticket.status.replace("-", " ")} size="small" color={STATUS_COLOR[ticket.status]} variant="outlined" sx={{ textTransform: "capitalize" }} />
                        <Chip label={ticket.priority} size="small" color={PRIORITY_COLOR[ticket.priority]} variant="outlined" />
                    </Stack>
                    <Typography variant="subtitle1" fontWeight={700} noWrap>{ticket.subject}</Typography>
                    <Typography variant="caption" color="text.secondary">
                        Opened by {ticket.createdByName} · {new Date(ticket.createdAt).toLocaleDateString()}
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

            {ticket.status !== "closed" && (
                <Box component="form" onSubmit={sendReply} sx={{ px: 3, py: 2 }}>
                    {err && <Alert severity="error" sx={{ mb: 1.5 }}>{err}</Alert>}
                    <Stack direction="row" spacing={1} alignItems="flex-end">
                        <TextField
                            fullWidth multiline minRows={2} maxRows={6} size="small"
                            placeholder="Write a reply…"
                            value={reply}
                            onChange={e => setReply(e.target.value)}
                        />
                        <Button type="submit" variant="contained" size="small" disabled={sending || !reply.trim()} endIcon={<SendIcon />}>
                            Send
                        </Button>
                    </Stack>
                </Box>
            )}
        </Dialog>
    );
}

function NewTicketDialog({ onClose, onCreated }) {
    const [subject,     setSubject]     = useState("");
    const [type,        setType]        = useState("issue");
    const [priority,    setPriority]    = useState("normal");
    const [description, setDescription] = useState("");
    const [saving,      setSaving]      = useState(false);
    const [err,         setErr]         = useState(null);

    async function submit(e) {
        e.preventDefault();
        setSaving(true);
        setErr(null);
        const res = await fetch("/api/support", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ subject, type, priority, description }),
        });
        const d = await res.json();
        if (d.error) {
            setErr(d.msg);
            setSaving(false);
        } else {
            onCreated(d.ticket);
        }
    }

    return (
        <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                Open a ticket
                <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
            </DialogTitle>
            <form onSubmit={submit}>
                <DialogContent>
                    <Stack spacing={2.5}>
                        {err && <Alert severity="error">{err}</Alert>}

                        <ToggleButtonGroup
                            value={type}
                            exclusive
                            onChange={(_, v) => { if (v) setType(v); }}
                            size="small"
                            fullWidth
                        >
                            <ToggleButton value="issue" sx={{ gap: 0.75 }}>
                                <BugReportIcon fontSize="small" /> Issue
                            </ToggleButton>
                            <ToggleButton value="request" sx={{ gap: 0.75 }}>
                                <LightbulbIcon fontSize="small" /> Request
                            </ToggleButton>
                        </ToggleButtonGroup>

                        <TextField
                            label="Subject"
                            fullWidth size="small"
                            value={subject}
                            onChange={e => setSubject(e.target.value)}
                            required
                            placeholder={type === "issue" ? "e.g. Orders not syncing from Etsy" : "e.g. Add bulk CSV export for orders"}
                        />

                        <FormControl size="small" fullWidth>
                            <InputLabel>Priority</InputLabel>
                            <Select value={priority} label="Priority" onChange={e => setPriority(e.target.value)}>
                                <MenuItem value="low">Low</MenuItem>
                                <MenuItem value="normal">Normal</MenuItem>
                                <MenuItem value="high">High</MenuItem>
                                <MenuItem value="urgent">Urgent</MenuItem>
                            </Select>
                        </FormControl>

                        <TextField
                            label={type === "issue" ? "Describe the issue" : "Describe your request"}
                            fullWidth multiline minRows={4}
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            required
                            placeholder={type === "issue"
                                ? "What happened? Steps to reproduce, expected vs. actual behavior…"
                                : "What would you like, and why would it help your workflow?"}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={onClose} size="small">Cancel</Button>
                    <Button type="submit" variant="contained" size="small" disabled={saving}>
                        {saving ? "Submitting…" : "Submit ticket"}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}

export default function SupportPage() {
    const [tickets,     setTickets]     = useState([]);
    const [loading,     setLoading]     = useState(true);
    const [typeFilter,  setTypeFilter]  = useState("all");
    const [statusFilter, setStatusFilter] = useState("open");
    const [newOpen,     setNewOpen]     = useState(false);
    const [selected,    setSelected]    = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        const params = new URLSearchParams();
        if (typeFilter   !== "all") params.set("type",   typeFilter);
        if (statusFilter !== "all") params.set("status", statusFilter);
        const res = await fetch(`/api/support?${params}`);
        const d = await res.json();
        setTickets(d.tickets ?? []);
        setLoading(false);
    }, [typeFilter, statusFilter]);

    useEffect(() => { load(); }, [load]);

    function handleCreated(ticket) {
        setNewOpen(false);
        setTickets(t => [ticket, ...t]);
        setSelected(ticket);
    }

    function handleUpdate(updated) {
        setTickets(t => t.map(tk => tk._id === updated._id ? { ...tk, ...updated, messages: undefined } : tk));
    }

    return (
        <Box sx={{ bgcolor: "background.default", minHeight: "100vh" }}>
            <Container maxWidth="md" sx={{ py: 4 }}>

                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 3 }}>
                    <Box>
                        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 0.5 }}>
                            <SupportAgentIcon sx={{ color: "#6366f1", fontSize: 28 }} />
                            <Typography variant="h6" fontWeight={700}>Support</Typography>
                        </Stack>
                        <Typography variant="body2" color="text.secondary">
                            Submit issues or requests — our team responds within 1 business day.
                        </Typography>
                    </Box>
                    <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => setNewOpen(true)}>
                        New ticket
                    </Button>
                </Stack>

                {/* Filters */}
                <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap sx={{ mb: 2.5 }}>
                    <ToggleButtonGroup value={typeFilter} exclusive onChange={(_, v) => { if (v) setTypeFilter(v); }} size="small">
                        <ToggleButton value="all">All types</ToggleButton>
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
                    <IconButton size="small" onClick={load} disabled={loading}>
                        <RefreshIcon fontSize="small" />
                    </IconButton>
                </Stack>

                {/* Ticket list */}
                {loading ? (
                    <Box sx={{ textAlign: "center", py: 8 }}><CircularProgress size={28} /></Box>
                ) : tickets.length === 0 ? (
                    <Box sx={{ textAlign: "center", py: 8 }}>
                        <SupportAgentIcon sx={{ fontSize: 48, color: "text.disabled", mb: 1.5 }} />
                        <Typography variant="body1" fontWeight={600} color="text.secondary">No tickets found</Typography>
                        <Typography variant="body2" color="text.disabled" sx={{ mb: 2 }}>
                            {statusFilter !== "all" ? `No ${statusFilter} tickets` : "You haven't opened any tickets yet"}
                        </Typography>
                        <Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={() => setNewOpen(true)}>
                            Open a ticket
                        </Button>
                    </Box>
                ) : (
                    <Stack spacing={1.5}>
                        {tickets.map(ticket => (
                            <Card
                                key={ticket._id}
                                variant="outlined"
                                onClick={() => setSelected(ticket)}
                                sx={{ cursor: "pointer", transition: "box-shadow 150ms", "&:hover": { boxShadow: "0 2px 12px rgba(0,0,0,0.1)" } }}
                            >
                                <CardContent sx={{ py: 1.75, "&:last-child": { pb: 1.75 } }}>
                                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }} flexWrap="wrap">
                                                <Typography variant="caption" color="text.disabled" fontWeight={600}>{ticket.ticketNumber}</Typography>
                                                <TypeChip type={ticket.type} />
                                                {ticket.priority !== "normal" && (
                                                    <Chip label={ticket.priority} size="small" color={PRIORITY_COLOR[ticket.priority]} variant="outlined" />
                                                )}
                                            </Stack>
                                            <Typography variant="body2" fontWeight={600} noWrap>{ticket.subject}</Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {ticket.createdByName} · {new Date(ticket.createdAt).toLocaleDateString()}
                                            </Typography>
                                        </Box>
                                        <Chip
                                            label={ticket.status.replace("-", " ")}
                                            size="small"
                                            color={STATUS_COLOR[ticket.status]}
                                            variant="outlined"
                                            sx={{ textTransform: "capitalize", flexShrink: 0 }}
                                        />
                                    </Stack>
                                </CardContent>
                            </Card>
                        ))}
                    </Stack>
                )}
            </Container>

            {newOpen && <NewTicketDialog onClose={() => setNewOpen(false)} onCreated={handleCreated} />}
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

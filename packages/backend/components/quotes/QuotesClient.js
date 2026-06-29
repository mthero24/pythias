"use client";
import { useCallback, useEffect, useState } from "react";
import {
    Box, Container, Stack, Typography, Button, Chip, Card, IconButton, TextField,
    Dialog, DialogTitle, DialogContent, DialogActions, InputAdornment, MenuItem,
    Select, FormControl, InputLabel, CircularProgress, Divider, Tooltip,
} from "@mui/material";
import RequestQuoteIcon from "@mui/icons-material/RequestQuote";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import SearchIcon from "@mui/icons-material/Search";
import SendIcon from "@mui/icons-material/Send";
import axios from "axios";

const STATUS = {
    requested: { color: "info",    label: "Requested" },
    draft:     { color: "default", label: "Draft" },
    sent:      { color: "warning", label: "Sent" },
    approved:  { color: "success", label: "Approved" },
    declined:  { color: "error",   label: "Declined" },
    expired:   { color: "default", label: "Expired" },
    converted: { color: "primary", label: "Converted" },
};
const STATUS_FILTERS = ["all", "requested", "draft", "sent", "approved", "converted"];
const money = (n) => `$${(Number(n) || 0).toFixed(2)}`;

const emptyLine = () => ({ id: Date.now() + Math.random(), title: "", sku: "", quantity: 1, unitPrice: 0, setupFee: 0, notes: "" });
const emptyQuote = () => ({
    customer: { name: "", email: "", phone: "", company: "" },
    lines: [emptyLine()],
    discountAmount: 0, discountName: "", shippingCost: 0, taxRatePct: 0,
    message: "", status: "draft", expiresAt: "",
});

// Normalize a quote coming from the API into editor state (taxRate fraction → percent, give lines ids).
function toEditor(q) {
    return {
        _id: q._id, quoteId: q.quoteId, token: q.token, status: q.status || "draft",
        customer: { name: "", email: "", phone: "", company: "", ...(q.customer || {}) },
        lines: (q.lines?.length ? q.lines : [emptyLine()]).map((l, i) => ({
            id: l._id || i, title: l.title || "", sku: l.sku || "",
            quantity: l.quantity || 1, unitPrice: l.unitPrice || 0, setupFee: l.setupFee || 0,
            notes: l.notes || "", _keep: l,   // preserve design/personalization on round-trip
        })),
        discountAmount: q.discountAmount || 0, discountName: q.discountName || "",
        shippingCost: q.shippingCost || 0, taxRatePct: (q.taxRate || 0) * 100,
        message: q.message || "", expiresAt: q.expiresAt ? q.expiresAt.slice(0, 10) : "",
    };
}

export default function QuotesClient({ base = "" }) {
    const [quotes, setQuotes]   = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch]   = useState("");
    const [status, setStatus]   = useState("all");
    const [editing, setEditing] = useState(null);   // editor quote state, or null

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const r = await axios.get(`/api/quotes?status=${status}&q=${encodeURIComponent(search)}`);
            setQuotes(r.data.quotes || []);
        } catch { /* surfaced as empty list */ }
        finally { setLoading(false); }
    }, [status, search]);

    useEffect(() => { load(); }, [status]);   // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <Box sx={{ width: "100%" }}>
            <Box sx={{ bgcolor: "#fff", borderBottom: "1px solid #e2e8f0", px: 3, py: 2 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                        <Box sx={{ width: 36, height: 36, borderRadius: 2, background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <RequestQuoteIcon sx={{ color: "#fff", fontSize: 20 }} />
                        </Box>
                        <Box>
                            <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: -0.5, lineHeight: 1.2 }}>Quotes</Typography>
                            <Typography variant="body2" color="text.secondary">Build, price, and send customer quotes</Typography>
                        </Box>
                    </Stack>
                    <Button variant="contained" startIcon={<AddIcon />} onClick={() => setEditing(emptyQuote())}
                        sx={{ background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)", borderRadius: 1.5, fontWeight: 600 }}>
                        New Quote
                    </Button>
                </Box>
            </Box>

            <Container maxWidth="lg" sx={{ py: 3, minHeight: "80vh" }}>
                {/* Search + status filter */}
                <Stack direction="row" spacing={1.5} sx={{ mb: 2, flexWrap: "wrap", alignItems: "center" }}>
                    <TextField size="small" placeholder="Search quote #, name, email…" value={search}
                        onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && load()}
                        sx={{ flex: 1, minWidth: 220, bgcolor: "#fff" }}
                        InputProps={{ endAdornment: <InputAdornment position="end" sx={{ cursor: "pointer" }} onClick={load}><SearchIcon /></InputAdornment> }} />
                    {STATUS_FILTERS.map((s) => (
                        <Chip key={s} label={s === "all" ? "All" : (STATUS[s]?.label || s)} size="small"
                            variant={status === s ? "filled" : "outlined"} color={status === s ? "primary" : "default"}
                            onClick={() => setStatus(s)} sx={{ cursor: "pointer", textTransform: "capitalize" }} />
                    ))}
                </Stack>

                {/* List */}
                {loading ? (
                    <Box sx={{ py: 8, textAlign: "center" }}><CircularProgress size={28} /></Box>
                ) : quotes.length === 0 ? (
                    <Box sx={{ py: 10, textAlign: "center" }}>
                        <Typography color="text.secondary" sx={{ fontWeight: 500 }}>No quotes yet</Typography>
                        <Typography variant="body2" color="text.disabled">Click “New Quote” to build one.</Typography>
                    </Box>
                ) : (
                    <Stack spacing={0.75}>
                        {quotes.map((q) => {
                            const st = STATUS[q.status] || { color: "default", label: q.status };
                            const due = (q.total || 0) - (q.discountAmount || 0);
                            return (
                                <Card key={q._id} variant="outlined" onClick={() => setEditing(toEditor(q))}
                                    sx={{ borderRadius: 1.5, cursor: "pointer", "&:hover": { boxShadow: 2 } }}>
                                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr auto", md: "1.4fr 1.4fr 1fr 1fr auto" }, alignItems: "center", gap: 1.5, px: 2, py: 1.25 }}>
                                        <Box sx={{ minWidth: 0 }}>
                                            <Typography variant="body2" sx={{ fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{q.quoteId}</Typography>
                                            <Typography variant="caption" color="text.disabled">{new Date(q.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" })}</Typography>
                                        </Box>
                                        <Box sx={{ minWidth: 0, display: { xs: "none", md: "block" } }}>
                                            <Typography variant="body2" sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{q.customer?.name || "—"}</Typography>
                                            <Typography variant="caption" color="text.secondary" sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>{q.customer?.email || ""}</Typography>
                                        </Box>
                                        <Box sx={{ display: { xs: "none", md: "block" } }}>
                                            <Chip label={st.label} color={st.color} size="small" variant="outlined" sx={{ fontSize: "0.65rem", height: 20 }} />
                                        </Box>
                                        <Typography variant="body2" sx={{ fontWeight: 600, textAlign: { xs: "right", md: "left" } }}>{money(due)}</Typography>
                                        <Chip label={st.label} color={st.color} size="small" variant="outlined" sx={{ fontSize: "0.6rem", height: 18, display: { xs: "inline-flex", md: "none" }, justifySelf: "end" }} />
                                    </Box>
                                </Card>
                            );
                        })}
                    </Stack>
                )}
            </Container>

            {editing && <QuoteEditor quote={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}
        </Box>
    );
}

// ── Editor ──────────────────────────────────────────────────────────────────────
function QuoteEditor({ quote, onClose, onSaved }) {
    const [q, setQ]         = useState(quote);
    const [saving, setSaving] = useState(false);
    const [sending, setSending] = useState(false);
    const [err, setErr]     = useState("");
    const busy = saving || sending;

    const setCustomer = (field) => (e) => setQ((p) => ({ ...p, customer: { ...p.customer, [field]: e.target.value } }));
    const setLine = (id, field, val) => setQ((p) => ({ ...p, lines: p.lines.map((l) => l.id === id ? { ...l, [field]: val } : l) }));
    const addLine = () => setQ((p) => ({ ...p, lines: [...p.lines, emptyLine()] }));
    const removeLine = (id) => setQ((p) => ({ ...p, lines: p.lines.filter((l) => l.id !== id) }));

    const subtotal = q.lines.reduce((s, l) => s + (Number(l.unitPrice) || 0) * (Number(l.quantity) || 1) + (Number(l.setupFee) || 0), 0);
    const discount = Number(q.discountAmount) || 0;
    const taxRate  = (Number(q.taxRatePct) || 0) / 100;
    const tax      = (subtotal - discount) * taxRate;
    const due      = subtotal - discount + (Number(q.shippingCost) || 0) + tax;

    // Persist the current edits (create or update) and return the quote id.
    const persist = async () => {
        const payload = {
            customer: q.customer,
            // keep any design/personalization a studio line carried; merge the edited pricing fields
            lines: q.lines.map((l) => ({ ...(l._keep || {}), title: l.title, sku: l.sku, quantity: l.quantity, unitPrice: l.unitPrice, setupFee: l.setupFee, notes: l.notes })),
            discountAmount: Number(q.discountAmount) || 0,
            discountName: q.discountName,
            shippingCost: Number(q.shippingCost) || 0,
            taxRate,
            message: q.message,
            status: q.status,
            expiresAt: q.expiresAt || undefined,
        };
        if (q._id) { await axios.patch(`/api/quotes/${q._id}`, payload); return q._id; }
        const res = await axios.post(`/api/quotes`, payload);
        return res.data.quote._id;
    };

    const save = async () => {
        if (!q.customer.name && !q.customer.email) { setErr("Add a customer name or email"); return; }
        setSaving(true); setErr("");
        try { await persist(); onSaved(); }
        catch (e) { setErr(e.response?.data?.error ?? "Failed to save quote"); setSaving(false); }
    };

    const sendQuote = async () => {
        if (!q.customer.email) { setErr("Add a customer email to send the quote"); return; }
        setSending(true); setErr("");
        try {
            const id = await persist();
            await axios.post(`/api/quotes/${id}/send`);
            onSaved();
        } catch (e) { setErr(e.response?.data?.error ?? "Failed to send the quote"); setSending(false); }
    };

    const del = async () => {
        if (!q._id || !confirm("Delete this quote?")) return;
        setSaving(true);
        try { await axios.delete(`/api/quotes/${q._id}`); onSaved(); }
        catch (e) { setErr(e.response?.data?.error ?? "Failed to delete"); setSaving(false); }
    };

    const fs = { size: "small" };
    const sectionLabel = (t) => (
        <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 0.5, display: "block", mb: 0.75 }}>{t}</Typography>
    );

    return (
        <Dialog open onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
            <DialogTitle sx={{ fontWeight: 700, display: "flex", justifyContent: "space-between", alignItems: "center", pb: 1 }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                    <span>{q._id ? q.quoteId : "New Quote"}</span>
                    {q._id && <Chip label={(STATUS[q.status]?.label) || q.status} color={STATUS[q.status]?.color || "default"} size="small" variant="outlined" />}
                </Stack>
                <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
            </DialogTitle>

            <DialogContent dividers sx={{ pt: 2 }}>
                <Stack spacing={3}>
                    {/* Customer */}
                    <Box>
                        {sectionLabel("Customer")}
                        <Stack spacing={1.25}>
                            <Stack direction="row" spacing={1.5}>
                                <TextField {...fs} fullWidth label="Name" value={q.customer.name} onChange={setCustomer("name")} />
                                <TextField {...fs} fullWidth label="Email" type="email" value={q.customer.email} onChange={setCustomer("email")} />
                            </Stack>
                            <Stack direction="row" spacing={1.5}>
                                <TextField {...fs} fullWidth label="Phone" value={q.customer.phone} onChange={setCustomer("phone")} />
                                <TextField {...fs} fullWidth label="Company" value={q.customer.company} onChange={setCustomer("company")} />
                            </Stack>
                        </Stack>
                    </Box>

                    {/* Lines */}
                    <Box>
                        {sectionLabel("Line Items")}
                        <Stack spacing={1}>
                            {q.lines.map((l) => (
                                <Box key={l.id} sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "2fr 70px 90px 90px 36px" }, gap: 1, alignItems: "center", p: 1, border: "1px solid #e2e8f0", borderRadius: 1 }}>
                                    <Box>
                                        <TextField {...fs} fullWidth label="Description" value={l.title} onChange={(e) => setLine(l.id, "title", e.target.value)} />
                                        {l._keep?.personalization && <Typography variant="caption" color="success.main">✓ customer artwork attached</Typography>}
                                    </Box>
                                    <TextField {...fs} label="Qty" type="number" value={l.quantity} onChange={(e) => setLine(l.id, "quantity", parseInt(e.target.value) || 1)} inputProps={{ min: 1 }} />
                                    <TextField {...fs} label="Unit $" type="number" value={l.unitPrice} onChange={(e) => setLine(l.id, "unitPrice", parseFloat(e.target.value) || 0)} inputProps={{ min: 0, step: 0.01 }} />
                                    <TextField {...fs} label="Setup $" type="number" value={l.setupFee} onChange={(e) => setLine(l.id, "setupFee", parseFloat(e.target.value) || 0)} inputProps={{ min: 0, step: 0.01 }} />
                                    <IconButton size="small" color="error" onClick={() => removeLine(l.id)} disabled={q.lines.length <= 1}><DeleteOutlineIcon fontSize="small" /></IconButton>
                                </Box>
                            ))}
                        </Stack>
                        <Button size="small" startIcon={<AddIcon />} onClick={addLine} sx={{ mt: 1 }}>Add line</Button>
                    </Box>

                    {/* Pricing */}
                    <Box>
                        {sectionLabel("Pricing")}
                        <Stack direction="row" spacing={1.5} sx={{ mb: 1.5 }}>
                            <TextField {...fs} label="Discount $" type="number" value={q.discountAmount} onChange={(e) => setQ((p) => ({ ...p, discountAmount: parseFloat(e.target.value) || 0 }))} inputProps={{ min: 0, step: 0.01 }} sx={{ width: 110 }} />
                            <TextField {...fs} label="Discount name" value={q.discountName} onChange={(e) => setQ((p) => ({ ...p, discountName: e.target.value }))} sx={{ flex: 1 }} />
                            <TextField {...fs} label="Shipping $" type="number" value={q.shippingCost} onChange={(e) => setQ((p) => ({ ...p, shippingCost: parseFloat(e.target.value) || 0 }))} inputProps={{ min: 0, step: 0.01 }} sx={{ width: 110 }} />
                            <TextField {...fs} label="Tax %" type="number" value={q.taxRatePct} onChange={(e) => setQ((p) => ({ ...p, taxRatePct: parseFloat(e.target.value) || 0 }))} inputProps={{ min: 0, step: 0.1 }} sx={{ width: 90 }} />
                        </Stack>
                        <Box sx={{ bgcolor: "#f8fafc", borderRadius: 1.5, p: 1.5 }}>
                            <Row label="Subtotal" value={money(subtotal)} />
                            {discount > 0 && <Row label={`Discount${q.discountName ? ` (${q.discountName})` : ""}`} value={`−${money(discount)}`} color="error.main" />}
                            {Number(q.shippingCost) > 0 && <Row label="Shipping" value={money(q.shippingCost)} />}
                            {tax > 0 && <Row label={`Tax (${q.taxRatePct}%)`} value={money(tax)} />}
                            <Divider sx={{ my: 0.75 }} />
                            <Row label="Total Due" value={money(due)} bold />
                        </Box>
                    </Box>

                    {/* Message + status */}
                    <Box>
                        {sectionLabel("Quote")}
                        <Stack spacing={1.25}>
                            <TextField {...fs} fullWidth multiline minRows={2} label="Message to customer (optional)" value={q.message} onChange={(e) => setQ((p) => ({ ...p, message: e.target.value }))} />
                            <Stack direction="row" spacing={1.5}>
                                <FormControl {...fs} sx={{ width: 180 }}>
                                    <InputLabel>Status</InputLabel>
                                    <Select label="Status" value={q.status} onChange={(e) => setQ((p) => ({ ...p, status: e.target.value }))}>
                                        {Object.keys(STATUS).map((s) => <MenuItem key={s} value={s}>{STATUS[s].label}</MenuItem>)}
                                    </Select>
                                </FormControl>
                                <TextField {...fs} label="Expires" type="date" value={q.expiresAt} onChange={(e) => setQ((p) => ({ ...p, expiresAt: e.target.value }))} InputLabelProps={{ shrink: true }} sx={{ width: 170 }} />
                            </Stack>
                        </Stack>
                    </Box>

                    {err && <Typography color="error" variant="body2">{err}</Typography>}
                </Stack>
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2, justifyContent: "space-between" }}>
                <Box>{q._id && <Button color="error" onClick={del} disabled={busy} startIcon={<DeleteOutlineIcon />}>Delete</Button>}</Box>
                <Stack direction="row" spacing={1}>
                    <Button onClick={onClose} disabled={busy}>Cancel</Button>
                    <Button variant="outlined" onClick={save} disabled={busy}
                        startIcon={saving ? <CircularProgress size={14} color="inherit" /> : null}>
                        {q._id ? "Save" : "Create"}
                    </Button>
                    <Tooltip title={q.customer.email ? "Save and email the customer a pay link" : "Add a customer email first"}>
                        <span>
                            <Button variant="contained" onClick={sendQuote} disabled={busy || !q.customer.email}
                                startIcon={sending ? <CircularProgress size={14} color="inherit" /> : <SendIcon sx={{ fontSize: 16 }} />}
                                sx={{ background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)" }}>
                                Send to Customer
                            </Button>
                        </span>
                    </Tooltip>
                </Stack>
            </DialogActions>
        </Dialog>
    );
}

function Row({ label, value, bold, color }) {
    return (
        <Stack direction="row" justifyContent="space-between" sx={{ py: 0.25 }}>
            <Typography variant={bold ? "body2" : "caption"} sx={{ fontWeight: bold ? 700 : 400, color: color || "text.secondary" }}>{label}</Typography>
            <Typography variant={bold ? "body2" : "caption"} sx={{ fontWeight: bold ? 700 : 500, color: color || "text.primary" }}>{value}</Typography>
        </Stack>
    );
}

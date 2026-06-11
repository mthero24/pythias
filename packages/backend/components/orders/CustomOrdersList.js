"use client";
import { useState, useEffect, useRef } from "react";
import {
    Box, Typography, Button, Card, Chip, Stack, IconButton, TextField, Table,
    TableHead, TableBody, TableRow, TableCell, CircularProgress, Tooltip, Dialog,
    DialogTitle, DialogContent, DialogActions, InputAdornment,
} from "@mui/material";
import SearchIcon   from "@mui/icons-material/Search";
import AddIcon      from "@mui/icons-material/Add";
import DownloadIcon from "@mui/icons-material/Download";
import EmailIcon    from "@mui/icons-material/Email";
import DeleteIcon   from "@mui/icons-material/Delete";
import ReceiptIcon  from "@mui/icons-material/Receipt";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import axios from "axios";
import { CustomOrderBuilder } from "./CustomOrderBuilder";

const fmt     = (n) => `$${Number(n || 0).toFixed(2)}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

function orderTotal(o) {
    // Use stored total if available, otherwise derive from items
    if (o.total) return o.total;
    const items    = o.items || [];
    const subtotal = items.reduce((s, i) => s + (i.price || 0), 0);
    return subtotal + (o.shippingCost || 0) + subtotal * (o.taxRate || 0);
}

function InvoiceCell({ order, apiBase }) {
    const [show,    setShow]    = useState(false);
    const [email,   setEmail]   = useState("");
    const [sending, setSending] = useState(false);
    const [sent,    setSent]    = useState(false);
    const [err,     setErr]     = useState("");

    const send = async () => {
        if (!email) return;
        setSending(true); setErr("");
        try {
            const res = await axios.post(`${apiBase}/api/admin/custom-order/invoice`, { orderId: order._id, email });
            if (res.data.ok) { setSent(true); setTimeout(() => { setSent(false); setShow(false); setEmail(""); }, 2500); }
            else setErr(res.data.error || "Failed");
        } catch (e) { setErr(e.response?.data?.error || "Failed"); }
        finally { setSending(false); }
    };

    return (
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexWrap: "wrap" }}>
            <Tooltip title="Download PDF">
                <IconButton size="small" component="a"
                    href={`${apiBase}/api/admin/custom-order/invoice?orderId=${order._id}`}
                    download={`invoice-${order.poNumber}.pdf`}>
                    <DownloadIcon fontSize="small" />
                </IconButton>
            </Tooltip>
            <Tooltip title="Email invoice">
                <IconButton size="small" onClick={() => setShow(v => !v)} color={show ? "primary" : "default"}>
                    <EmailIcon fontSize="small" />
                </IconButton>
            </Tooltip>
            {show && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                    <TextField size="small" placeholder="email@example.com" type="email"
                        value={email} onChange={e => setEmail(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && send()}
                        error={!!err} helperText={err || undefined}
                        sx={{ width: 180, "& input": { fontSize: 12 } }} />
                    <Button size="small" variant="contained" onClick={send} disabled={sending || !email}
                        sx={{ bgcolor: "#D3A73D", color: "#111", "&:hover": { bgcolor: "#b8860b" }, whiteSpace: "nowrap" }}>
                        {sent ? "Sent ✓" : sending ? "Sending…" : "Send"}
                    </Button>
                </Box>
            )}
        </Box>
    );
}

export function CustomOrdersList({ apiBase = "" }) {
    const [orders,       setOrders]       = useState([]);
    const [total,        setTotal]        = useState(0);
    const [skip,         setSkip]         = useState(0);
    const [q,            setQ]            = useState("");
    const [loading,      setLoading]      = useState(true);
    const [builderOpen,  setBuilderOpen]  = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [markingPaid,  setMarkingPaid]  = useState(null);
    const debounceRef = useRef(null);

    const fetchOrders = async (search, s, append) => {
        setLoading(true);
        try {
            const res = await axios.get(`${apiBase}/api/admin/custom-order`, { params: { q: search, skip: s } });
            const next = res.data?.orders || [];
            setOrders(prev => append ? [...prev, ...next] : next);
            setTotal(res.data?.total || 0);
            setSkip(s + next.length);
        } finally { setLoading(false); }
    };

    useEffect(() => { fetchOrders("", 0, false); }, []);

    const handleSearch = (val) => {
        setQ(val);
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => { setSkip(0); fetchOrders(val, 0, false); }, 400);
    };

    const handleMarkPaid = async (order) => {
        setMarkingPaid(order._id);
        try {
            await axios.patch(`${apiBase}/api/admin/custom-order/${order._id}`, { paid: true });
            fetchOrders(q, 0, false);
        } finally { setMarkingPaid(null); }
    };

    const handleDelete = async () => {
        if (!deleteConfirm) return;
        await axios.delete(`${apiBase}/api/admin/custom-order/${deleteConfirm._id}`);
        setDeleteConfirm(null);
        fetchOrders(q, 0, false);
    };

    return (
        <Box sx={{ bgcolor: "background.default", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
            {/* Header */}
            <Box sx={{ bgcolor: "background.paper", borderBottom: "1px solid", borderColor: "divider", px: 2, py: 2 }}>
                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
                    <Box sx={{ width: 36, height: 36, borderRadius: 2, background: "linear-gradient(135deg, #D3A73D 0%, #b8860b 100%)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <ReceiptIcon sx={{ color: "#fff", fontSize: 20 }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: -0.5, lineHeight: 1.2 }}>Custom Orders</Typography>
                        <Typography variant="body2" color="text.secondary">One-off orders — items enter production when marked paid</Typography>
                    </Box>
                    <Button variant="contained" startIcon={<AddIcon />} onClick={() => setBuilderOpen(true)}
                        sx={{ bgcolor: "#D3A73D", color: "#111", "&:hover": { bgcolor: "#b8860b" } }}>
                        New Order
                    </Button>
                </Stack>
                <TextField fullWidth placeholder="Search by PO number, customer name, or email…"
                    size="small" value={q} onChange={e => handleSearch(e.target.value)}
                    InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: "text.disabled" }} /></InputAdornment> }} />
            </Box>

            {/* Table */}
            <Box sx={{ px: 2, py: 2, flex: 1 }}>
                <Card variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
                    {loading && orders.length === 0 ? (
                        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>
                    ) : orders.length === 0 ? (
                        <Box sx={{ textAlign: "center", py: 8 }}>
                            <Typography color="text.secondary">No custom orders yet.</Typography>
                            <Button variant="outlined" startIcon={<AddIcon />} sx={{ mt: 2 }} onClick={() => setBuilderOpen(true)}>Create First Order</Button>
                        </Box>
                    ) : (
                        <Table size="small">
                            <TableHead>
                                <TableRow sx={{ bgcolor: "action.hover" }}>
                                    {["PO #", "Customer", "Items", "Total", "Date Needed", "Payment", "Invoice", ""].map(h => (
                                        <TableCell key={h} sx={{ fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5, color: "text.secondary", whiteSpace: "nowrap" }}>{h}</TableCell>
                                    ))}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {orders.map(o => (
                                    <TableRow key={o._id} hover sx={{ "& td": { py: 0.75, fontSize: 13 } }}>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight={700} sx={{ fontFamily: "monospace" }}>{o.poNumber || "—"}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">{o.shippingAddress?.address2 || o.shippingAddress?.name || "—"}</Typography>
                                            {o.shippingAddress?.address2 && o.shippingAddress?.name && (
                                                <Typography variant="caption" color="text.secondary" display="block">{o.shippingAddress.name}</Typography>
                                            )}
                                            {o.customerEmail && <Typography variant="caption" color="text.secondary" display="block">{o.customerEmail}</Typography>}
                                        </TableCell>
                                        <TableCell align="center">{(o.items || []).length}</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 700, color: "success.main" }}>{fmt(orderTotal(o))}</TableCell>
                                        <TableCell>{fmtDate(o.shipByDate)}</TableCell>
                                        <TableCell>
                                            {o.paid ? (
                                                <Chip icon={<CheckCircleIcon />} label="Paid" size="small" color="success" />
                                            ) : (
                                                <Button size="small" variant="contained" color="warning"
                                                    disabled={markingPaid === o._id}
                                                    onClick={() => handleMarkPaid(o)}
                                                    sx={{ whiteSpace: "nowrap", minWidth: 90 }}>
                                                    {markingPaid === o._id ? <CircularProgress size={14} /> : "Mark Paid"}
                                                </Button>
                                            )}
                                        </TableCell>
                                        <TableCell><InvoiceCell order={o} apiBase={apiBase} /></TableCell>
                                        <TableCell>
                                            <Tooltip title="Delete order">
                                                <IconButton size="small" color="error" onClick={() => setDeleteConfirm(o)}
                                                    disabled={o.paid}>
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </Card>

                {orders.length < total && (
                    <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
                        <Button variant="outlined" disabled={loading} onClick={() => fetchOrders(q, skip, true)}>
                            {loading ? <CircularProgress size={18} /> : `Load More (${total - orders.length} remaining)`}
                        </Button>
                    </Box>
                )}
            </Box>

            <CustomOrderBuilder open={builderOpen} setOpen={setBuilderOpen}
                onSaved={() => { setBuilderOpen(false); fetchOrders(q, 0, false); }}
                apiBase={apiBase} />

            <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} maxWidth="xs" fullWidth>
                <DialogTitle fontWeight={700}>Delete Order?</DialogTitle>
                <DialogContent>
                    <Typography>Delete order <strong>{deleteConfirm?.poNumber}</strong> and all its items? This cannot be undone.</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteConfirm(null)}>Cancel</Button>
                    <Button variant="contained" color="error" onClick={handleDelete}>Delete</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

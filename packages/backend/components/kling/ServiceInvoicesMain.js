"use client";
import {
    Box, Container, Typography, Stack, Chip, Button, Paper, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, IconButton, Collapse,
    Dialog, DialogTitle, DialogContent, DialogActions, Alert, CircularProgress,
    Divider, TextField,
} from "@mui/material";
import { useState } from "react";
import axios from "axios";
import { Footer } from "../reusable/Footer";
import ReceiptIcon from "@mui/icons-material/Receipt";
import PaymentIcon from "@mui/icons-material/Payment";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import AddIcon from "@mui/icons-material/Add";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const MONTH_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function isPayable(month, year) {
    const firstOfMonth = new Date(year, month - 1, 1);
    return new Date() >= firstOfMonth;
}

function isComplete(month, year) {
    const now = new Date();
    return year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1);
}

function PayDialog({ invoice, onClose }) {
    const [paying, setPaying] = useState(false);
    const [error, setError] = useState("");
    const monthLabel = `${MONTH_NAMES[invoice.month - 1]} ${invoice.year}`;

    const handlePay = async () => {
        setPaying(true);
        setError("");
        try {
            const res = await axios.post("/api/admin/service-invoices/checkout", { invoiceId: invoice._id });
            window.location.href = res.data.url;
        } catch (e) {
            setError(e?.response?.data?.error ?? "Failed to start payment");
            setPaying(false);
        }
    };

    return (
        <Dialog open onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1, pb: 1 }}>
                <PaymentIcon color="primary" />
                <Typography variant="h6" fontWeight={700}>Pay Invoice</Typography>
            </DialogTitle>
            <DialogContent>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                <Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, p: 2.5, background: "linear-gradient(135deg, #f8faff 0%, #f0f4ff 100%)" }}>
                    <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>Invoice Period</Typography>
                    <Typography variant="h6" fontWeight={700} mb={2}>{monthLabel}</Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Stack spacing={1} mb={2}>
                        {(invoice.lines ?? []).map((line, i) => (
                            <Stack key={i} direction="row" justifyContent="space-between">
                                <Typography variant="body2">{line.appName}</Typography>
                                <Typography variant="body2" fontWeight={600}>${line.price.toFixed(2)}</Typography>
                            </Stack>
                        ))}
                    </Stack>
                    <Divider sx={{ mb: 2 }} />
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="subtitle1" fontWeight={700}>Total Due</Typography>
                        <Typography variant="h5" fontWeight={800} color="primary.main">${invoice.totalAmount.toFixed(2)}</Typography>
                    </Stack>
                </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
                <Button variant="outlined" onClick={onClose} disabled={paying}>Cancel</Button>
                <Button variant="contained" color="primary"
                    startIcon={paying ? <CircularProgress size={16} color="inherit" /> : <CheckCircleIcon />}
                    onClick={handlePay} disabled={paying} sx={{ minWidth: 140 }}>
                    {paying ? "Redirecting to Stripe…" : `Pay $${invoice.totalAmount.toFixed(2)}`}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

const PAYMENT_METHODS = [
    { value: "check",       label: "Check" },
    { value: "ach",         label: "ACH / Wire Transfer" },
    { value: "credit_card", label: "Credit Card" },
    { value: "stripe",      label: "Stripe" },
    { value: "cash",        label: "Cash" },
    { value: "other",       label: "Other" },
];

const METHOD_LABEL = Object.fromEntries(PAYMENT_METHODS.map(m => [m.value, m.label]));

function MarkPaidDialog({ invoice, onClose, onConfirm }) {
    const [method, setMethod] = useState("check");
    const [note, setNote] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const monthLabel = `${MONTH_NAMES[invoice.month - 1]} ${invoice.year}`;

    const handleConfirm = async () => {
        setSaving(true);
        setError("");
        try {
            await onConfirm(invoice._id, invoice._client, method, note);
            onClose();
        } catch (e) {
            setError(e?.response?.data?.error ?? "Failed to mark invoice as paid");
            setSaving(false);
        }
    };

    return (
        <Dialog open onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1, pb: 1 }}>
                <CheckCircleIcon color="success" />
                <Typography variant="h6" fontWeight={700}>Mark Invoice Paid</Typography>
            </DialogTitle>
            <DialogContent>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                <Stack spacing={2} sx={{ pt: 1 }}>
                    <Box sx={{ p: 2, borderRadius: 2, bgcolor: "action.hover", border: "1px solid", borderColor: "divider" }}>
                        <Typography variant="caption" color="text.secondary" display="block">Invoice Period</Typography>
                        <Typography variant="subtitle1" fontWeight={700}>{monthLabel}</Typography>
                        <Typography variant="h6" fontWeight={800} color="success.main">${invoice.totalAmount.toFixed(2)}</Typography>
                    </Box>
                    <TextField select label="Payment Method" value={method} onChange={e => setMethod(e.target.value)} size="small" fullWidth SelectProps={{ native: true }}>
                        {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </TextField>
                    <TextField label="Reference / Note" placeholder="Check #, wire ref, etc." value={note} onChange={e => setNote(e.target.value)} size="small" fullWidth />
                </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
                <Button variant="outlined" onClick={onClose} disabled={saving}>Cancel</Button>
                <Button variant="contained" color="success"
                    startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <CheckCircleIcon />}
                    onClick={handleConfirm} disabled={saving}>
                    {saving ? "Saving…" : "Confirm Payment"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

function InvoiceRow({ invoice, showClient, canPay, canMarkPaid, onMarkPaid }) {
    const [expanded, setExpanded] = useState(false);
    const [payOpen, setPayOpen] = useState(false);
    const [markPaidOpen, setMarkPaidOpen] = useState(false);
    const complete = isComplete(invoice.month, invoice.year);
    const isPaid = invoice.status === "paid";
    const monthLabel = `${MONTH_SHORT[invoice.month - 1]} ${invoice.year}`;

    return (
        <>
            <TableRow hover>
                <TableCell>
                    <IconButton size="small" onClick={() => setExpanded(v => !v)}>
                        {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                    </IconButton>
                </TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{monthLabel}</TableCell>
                {showClient && (
                    <TableCell>
                        <Chip size="small" label={invoice._client === "po" ? "PO" : "Premier"} variant="outlined" />
                    </TableCell>
                )}
                <TableCell>{invoice.lines?.length ?? 0} service{(invoice.lines?.length ?? 0) !== 1 ? "s" : ""}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>${invoice.totalAmount.toFixed(2)}</TableCell>
                <TableCell>
                    <Chip size="small" label={isPaid ? "Paid" : "Open"}
                        color={isPaid ? "success" : "warning"} variant="outlined" />
                </TableCell>
                <TableCell>
                    <Stack direction="row" spacing={1} flexWrap="wrap" rowGap={0.5}>
                        {!isPaid && canMarkPaid && (
                            <Button size="small" variant="contained" color="success"
                                startIcon={<CheckCircleIcon fontSize="small" />}
                                onClick={() => setMarkPaidOpen(true)} sx={{ whiteSpace: "nowrap" }}>
                                Mark Paid
                            </Button>
                        )}
                        {!isPaid && canPay && (
                            <Button size="small" variant="contained" color="primary"
                                startIcon={<PaymentIcon fontSize="small" />}
                                onClick={() => setPayOpen(true)} sx={{ whiteSpace: "nowrap" }}>
                                Pay ${invoice.totalAmount.toFixed(2)}
                            </Button>
                        )}
                        {isPaid && invoice.paymentMethod && (
                            <Chip size="small" label={METHOD_LABEL[invoice.paymentMethod] ?? invoice.paymentMethod} color="success" variant="outlined" />
                        )}
                        {complete && (
                            <Button size="small" variant="outlined" color="inherit"
                                startIcon={<PictureAsPdfIcon fontSize="small" />}
                                href={`/api/admin/service-invoices/pdf?month=${invoice.month}&year=${invoice.year}`}
                                download sx={{ whiteSpace: "nowrap" }}>
                                PDF
                            </Button>
                        )}
                    </Stack>
                </TableCell>
            </TableRow>
            <TableRow>
                <TableCell colSpan={showClient ? 7 : 6} sx={{ p: 0, border: 0 }}>
                    <Collapse in={expanded} unmountOnExit>
                        <Box sx={{ px: 6, py: 1.5, background: "action.hover" }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ backgroundColor: "action.hover" }}>
                                        <TableCell sx={{ fontSize: "0.72rem", fontWeight: 700, color: "text.secondary" }}>App / Service</TableCell>
                                        <TableCell sx={{ fontSize: "0.72rem", fontWeight: 700, color: "text.secondary" }}>Description</TableCell>
                                        <TableCell sx={{ fontSize: "0.72rem", fontWeight: 700, color: "text.secondary" }} align="right">Price</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {(invoice.lines ?? []).map((line, i) => (
                                        <TableRow key={i}>
                                            <TableCell sx={{ fontSize: "0.82rem", fontWeight: 600 }}>{line.appName}</TableCell>
                                            <TableCell sx={{ fontSize: "0.82rem", color: "text.secondary" }}>{line.description || "—"}</TableCell>
                                            <TableCell sx={{ fontSize: "0.82rem", fontWeight: 600 }} align="right">${line.price.toFixed(2)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Box>
                    </Collapse>
                </TableCell>
            </TableRow>
            {payOpen && <PayDialog invoice={invoice} onClose={() => setPayOpen(false)} />}
            {markPaidOpen && <MarkPaidDialog invoice={invoice} onClose={() => setMarkPaidOpen(false)} onConfirm={onMarkPaid} />}
        </>
    );
}

const CLIENT_OPTIONS = [
    { value: "premier-printing", label: "Premier Printing" },
    { value: "po",               label: "PO" },
];

function GenerateDialog({ onClose, onGenerate }) {
    const now = new Date();
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [year, setYear] = useState(now.getFullYear());
    const [client, setClient] = useState("premier-printing");
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState("");

    const handleGenerate = async () => {
        setGenerating(true);
        setError("");
        try {
            await onGenerate(month, year, client);
            onClose();
        } catch (e) {
            setError(e?.response?.data?.error ?? "Failed to generate invoice");
        } finally {
            setGenerating(false);
        }
    };

    return (
        <Dialog open onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle fontWeight={700}>Generate Invoice</DialogTitle>
            <DialogContent>
                <Stack spacing={2} sx={{ pt: 1 }}>
                    {error && <Alert severity="error">{error}</Alert>}
                    <Typography variant="body2" color="text.secondary">
                        Creates a new invoice from the client&apos;s active service plans.
                    </Typography>
                    <TextField select label="Client" value={client} onChange={e => setClient(e.target.value)} size="small" fullWidth SelectProps={{ native: true }}>
                        {CLIENT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </TextField>
                    <Stack direction="row" spacing={2}>
                        <TextField select label="Month" value={month} onChange={e => setMonth(parseInt(e.target.value))} size="small" fullWidth SelectProps={{ native: true }}>
                            {MONTH_NAMES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                        </TextField>
                        <TextField label="Year" type="number" value={year} onChange={e => setYear(parseInt(e.target.value))} size="small" sx={{ width: 110 }} />
                    </Stack>
                </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
                <Button variant="outlined" onClick={onClose} disabled={generating}>Cancel</Button>
                <Button variant="contained" onClick={handleGenerate} disabled={generating}
                    startIcon={generating ? <CircularProgress size={14} color="inherit" /> : null}>
                    {generating ? "Generating…" : "Generate"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export function ServiceInvoicesMain({ initialInvoices, canGenerate = false, canPay = false }) {
    const [invoices, setInvoices] = useState(initialInvoices);
    const [generateOpen, setGenerateOpen] = useState(false);
    const [error, setError] = useState(null);

    const handleMarkPaid = async (invoiceId, client, paymentMethod, paymentNote) => {
        const res = await axios.put("/api/admin/service-invoices", { invoiceId, client, status: "paid", paymentMethod, paymentNote });
        setInvoices(prev => prev.map(inv => inv._id === invoiceId ? { ...res.data.invoice, _client: client } : inv));
    };

    const handleGenerate = async (month, year, client) => {
        const res = await axios.post("/api/admin/service-invoices", { month, year, client });
        setInvoices(prev => [res.data.invoice, ...prev]);
    };

    const totalDue = invoices.filter(i => i.status === "open" && isPayable(i.month, i.year)).reduce((s, i) => s + i.totalAmount, 0);
    const totalPaid = invoices.filter(i => i.status === "paid").reduce((s, i) => s + i.totalAmount, 0);

    return (
        <Box sx={{ width: "100%", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
            <Container maxWidth="lg" sx={{ py: 4, flex: 1 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 2 }}>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                        <Box sx={{ width: 36, height: 36, borderRadius: 2, background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <ReceiptIcon sx={{ color: "#fff", fontSize: 20 }} />
                        </Box>
                        <Box>
                            <Typography variant="h5" fontWeight={800} letterSpacing={-0.5}>Service Invoices</Typography>
                            <Typography variant="body2" color="text.secondary">Monthly software service charges</Typography>
                        </Box>
                    </Stack>
                    <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" rowGap={1}>
                        {totalDue > 0 && (
                            <Box sx={{ border: "2px solid", borderColor: "warning.main", borderRadius: 2, px: 2, py: 1, background: "#fffbeb" }}>
                                <Typography variant="caption" color="warning.dark" fontWeight={600} display="block">Amount Due</Typography>
                                <Typography variant="h6" fontWeight={800} color="warning.dark">${totalDue.toFixed(2)}</Typography>
                            </Box>
                        )}
                        <Chip label={`Paid: $${totalPaid.toFixed(2)}`} color="success" variant="outlined" sx={{ fontWeight: 700 }} />
                        {canGenerate && (
                            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setGenerateOpen(true)}>
                                Generate Invoice
                            </Button>
                        )}
                    </Stack>
                </Box>

                {error && <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>{error}</Alert>}

                {invoices.length === 0 ? (
                    <Box sx={{ textAlign: "center", py: 8 }}>
                        <ReceiptIcon sx={{ fontSize: 48, color: "text.disabled", mb: 1 }} />
                        <Typography color="text.secondary">No invoices yet. Click "Generate Invoice" to create one from your active service plans.</Typography>
                    </Box>
                ) : (
                    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ backgroundColor: "action.hover" }}>
                                    <TableCell sx={{ width: 48 }} />
                                    <TableCell sx={{ fontWeight: 700 }}>Month</TableCell>
                                    {canGenerate && <TableCell sx={{ fontWeight: 700 }}>Client</TableCell>}
                                    <TableCell sx={{ fontWeight: 700 }}>Services</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Total</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {invoices.map(inv => (
                                    <InvoiceRow key={inv._id} invoice={inv} showClient={canGenerate} canPay={canPay} canMarkPaid={canGenerate} onMarkPaid={handleMarkPaid} />
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Container>
            <Footer />
            {generateOpen && <GenerateDialog onClose={() => setGenerateOpen(false)} onGenerate={handleGenerate} />}
        </Box>
    );
}

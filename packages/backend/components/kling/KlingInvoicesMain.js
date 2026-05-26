"use client";
import {
    Box, Container, Typography, Stack, Chip, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Paper, Button, Collapse, IconButton,
    CircularProgress, Alert, Dialog, DialogTitle, DialogContent, DialogActions,
    Divider,
} from "@mui/material";
import { useState } from "react";
import axios from "axios";
import { Footer } from "../reusable/Footer";
import OndemandVideoIcon from "@mui/icons-material/OndemandVideo";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import PaymentIcon from "@mui/icons-material/Payment";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const MONTH_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function isMonthComplete(month, year) {
    const now = new Date();
    return year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1);
}

// Pay button unlocks on the 1st of the month following the invoice period
function isPayable(month, year) {
    const firstOfNext = new Date(year, month, 1); // month is 1-based; Date month is 0-based → this is exactly the 1st of next month
    return new Date() >= firstOfNext;
}

function PayDialog({ invoice, open, onClose, onPay }) {
    const [paying, setPaying] = useState(false);
    const monthLabel = `${MONTH_NAMES[invoice.month - 1]} ${invoice.year}`;

    const handlePay = async () => {
        setPaying(true);
        try {
            await onPay(invoice._id, "paid");
            onClose();
        } finally {
            setPaying(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1, pb: 1 }}>
                <PaymentIcon color="primary" />
                <Typography variant="h6" fontWeight={700}>Pay Invoice</Typography>
            </DialogTitle>
            <DialogContent>
                <Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, p: 2.5, mb: 2, background: "linear-gradient(135deg, #f8faff 0%, #f0f4ff 100%)" }}>
                    <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>Invoice Period</Typography>
                    <Typography variant="h6" fontWeight={700} mb={2}>{monthLabel}</Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Stack spacing={1}>
                        <Stack direction="row" justifyContent="space-between">
                            <Typography variant="body2" color="text.secondary">AI Videos Generated</Typography>
                            <Typography variant="body2" fontWeight={600}>{invoice.videoCount}</Typography>
                        </Stack>
                        <Stack direction="row" justifyContent="space-between">
                            <Typography variant="body2" color="text.secondary">Rate</Typography>
                            <Typography variant="body2" fontWeight={600}>$8.00 / video</Typography>
                        </Stack>
                    </Stack>
                    <Divider sx={{ my: 2 }} />
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="subtitle1" fontWeight={700}>Total Due</Typography>
                        <Typography variant="h5" fontWeight={800} color="primary.main">${invoice.totalAmount.toFixed(2)}</Typography>
                    </Stack>
                </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
                <Button variant="outlined" onClick={onClose} disabled={paying}>Cancel</Button>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={paying ? <CircularProgress size={16} color="inherit" /> : <CheckCircleIcon />}
                    onClick={handlePay}
                    disabled={paying}
                    sx={{ minWidth: 140 }}
                >
                    {paying ? "Processing…" : `Pay $${invoice.totalAmount.toFixed(2)}`}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

function VideoRow({ video }) {
    return (
        <TableRow sx={{ backgroundColor: "background.default" }}>
            <TableCell sx={{ pl: 6, fontSize: "0.78rem", color: "text.secondary" }}>
                {new Date(video.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
            </TableCell>
            <TableCell sx={{ fontSize: "0.78rem" }}>{video.productSku ?? "—"}</TableCell>
            <TableCell sx={{ fontSize: "0.78rem", color: "text.secondary", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {video.taskId}
            </TableCell>
            <TableCell sx={{ fontSize: "0.78rem", fontWeight: 600 }}>${video.cost.toFixed(2)}</TableCell>
        </TableRow>
    );
}

function InvoiceRow({ invoice, onStatusChange, showClient }) {
    const [expanded, setExpanded] = useState(false);
    const [videos, setVideos] = useState(null);
    const [loadingVideos, setLoadingVideos] = useState(false);
    const [payOpen, setPayOpen] = useState(false);

    const toggleExpand = async () => {
        if (!expanded && !videos) {
            setLoadingVideos(true);
            try {
                const clientParam = invoice._client ? `&client=${invoice._client}` : "";
                const res = await axios.get(`/api/admin/kling-invoices?month=${invoice.month}&year=${invoice.year}${clientParam}`);
                setVideos(res.data.videos);
            } finally {
                setLoadingVideos(false);
            }
        }
        setExpanded(v => !v);
    };

    const monthLabel = `${MONTH_SHORT[invoice.month - 1]} ${invoice.year}`;
    const complete = isMonthComplete(invoice.month, invoice.year);
    const payable = isPayable(invoice.month, invoice.year);
    const isPaid = invoice.status === "paid";

    return (
        <>
            <TableRow hover>
                <TableCell>
                    <IconButton size="small" onClick={toggleExpand}>
                        {loadingVideos
                            ? <CircularProgress size={16} />
                            : expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                    </IconButton>
                </TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{monthLabel}</TableCell>
                {showClient && (
                    <TableCell>
                        <Chip size="small" label={invoice._client === "po" ? "PO" : "Premier"} variant="outlined" />
                    </TableCell>
                )}
                <TableCell>{invoice.videoCount}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>${invoice.totalAmount.toFixed(2)}</TableCell>
                <TableCell>
                    <Chip
                        size="small"
                        label={isPaid ? "Paid" : "Open"}
                        color={isPaid ? "success" : "warning"}
                        variant="outlined"
                    />
                </TableCell>
                <TableCell>
                    <Stack direction="row" spacing={1}>
                        {payable && !isPaid && (
                            <Button
                                size="small"
                                variant="contained"
                                color="primary"
                                startIcon={<PaymentIcon fontSize="small" />}
                                onClick={() => setPayOpen(true)}
                                sx={{ whiteSpace: "nowrap" }}
                            >
                                Pay ${invoice.totalAmount.toFixed(2)}
                            </Button>
                        )}
                        {complete && (
                            <Button
                                size="small"
                                variant="outlined"
                                color="inherit"
                                startIcon={<PictureAsPdfIcon fontSize="small" />}
                                href={`/api/admin/kling-invoices/pdf?month=${invoice.month}&year=${invoice.year}`}
                                download
                                sx={{ whiteSpace: "nowrap" }}
                            >
                                PDF
                            </Button>
                        )}
                    </Stack>
                </TableCell>
            </TableRow>
            <TableRow>
                <TableCell colSpan={showClient ? 7 : 6} sx={{ p: 0, border: 0 }}>
                    <Collapse in={expanded} unmountOnExit>
                        <Table size="small">
                            <TableHead>
                                <TableRow sx={{ backgroundColor: "action.hover" }}>
                                    <TableCell sx={{ pl: 6, fontSize: "0.72rem", fontWeight: 700, color: "text.secondary" }}>Date</TableCell>
                                    <TableCell sx={{ fontSize: "0.72rem", fontWeight: 700, color: "text.secondary" }}>Product SKU</TableCell>
                                    <TableCell sx={{ fontSize: "0.72rem", fontWeight: 700, color: "text.secondary" }}>Task ID</TableCell>
                                    <TableCell sx={{ fontSize: "0.72rem", fontWeight: 700, color: "text.secondary" }}>Cost</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {videos?.length === 0 && (
                                    <TableRow><TableCell colSpan={4} sx={{ pl: 6, color: "text.secondary", fontSize: "0.78rem" }}>No videos found.</TableCell></TableRow>
                                )}
                                {videos?.map(v => <VideoRow key={v._id} video={v} />)}
                            </TableBody>
                        </Table>
                    </Collapse>
                </TableCell>
            </TableRow>

            <PayDialog
                invoice={invoice}
                open={payOpen}
                onClose={() => setPayOpen(false)}
                onPay={onStatusChange}
            />
        </>
    );
}

export function KlingInvoicesMain({ initialInvoices, showClient = false }) {
    const [invoices, setInvoices] = useState(initialInvoices);
    const [error, setError] = useState(null);

    const handleStatusChange = async (invoiceId, status) => {
        try {
            const res = await axios.put("/api/admin/kling-invoices", { invoiceId, status });
            setInvoices(prev => prev.map(inv => inv._id === invoiceId ? res.data.invoice : inv));
        } catch (e) {
            setError(e?.response?.data?.msg ?? "Failed to update invoice.");
        }
    };

    const openInvoices = invoices.filter(i => i.status === "open" && isPayable(i.month, i.year));
    const totalOpen = openInvoices.reduce((s, i) => s + i.totalAmount, 0);
    const totalPaid = invoices.filter(i => i.status === "paid").reduce((s, i) => s + i.totalAmount, 0);

    return (
        <Box sx={{ width: "100%", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
            <Container maxWidth="lg" sx={{ py: 4, flex: 1 }}>
                {/* Header */}
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 2 }}>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                        <Box sx={{ width: 36, height: 36, borderRadius: 2, background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <OndemandVideoIcon sx={{ color: "#fff", fontSize: 20 }} />
                        </Box>
                        <Box>
                            <Stack direction="row" alignItems="baseline" spacing={1}>
                                <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: -0.5, lineHeight: 1.2 }}>Kling Video Invoices</Typography>
                                <Chip label={`${invoices.length} month${invoices.length !== 1 ? "s" : ""}`} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
                            </Stack>
                            <Typography variant="body2" color="text.secondary">$8 per AI-generated video · billed monthly</Typography>
                        </Box>
                    </Stack>

                    {/* Summary */}
                    <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" rowGap={1}>
                        {totalOpen > 0 && (
                            <Box sx={{ border: "2px solid", borderColor: "warning.main", borderRadius: 2, px: 2, py: 1, background: "#fffbeb" }}>
                                <Typography variant="caption" color="warning.dark" fontWeight={600} display="block">Amount Due</Typography>
                                <Typography variant="h6" fontWeight={800} color="warning.dark">${totalOpen.toFixed(2)}</Typography>
                            </Box>
                        )}
                        <Chip label={`Paid: $${totalPaid.toFixed(2)}`} color="success" variant="outlined" sx={{ fontWeight: 700 }} />
                    </Stack>
                </Box>

                {error && <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>{error}</Alert>}

                {invoices.length === 0 ? (
                    <Box sx={{ textAlign: "center", py: 8 }}>
                        <OndemandVideoIcon sx={{ fontSize: 48, color: "text.disabled", mb: 1 }} />
                        <Typography color="text.secondary">No invoices yet. Kling AI videos will appear here as they are generated.</Typography>
                    </Box>
                ) : (
                    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ backgroundColor: "action.hover" }}>
                                    <TableCell sx={{ width: 48 }} />
                                    <TableCell sx={{ fontWeight: 700 }}>Month</TableCell>
                                    {showClient && <TableCell sx={{ fontWeight: 700 }}>Client</TableCell>}
                                    <TableCell sx={{ fontWeight: 700 }}>Videos</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Total</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {invoices.map(inv => (
                                    <InvoiceRow key={inv._id} invoice={inv} onStatusChange={handleStatusChange} showClient={showClient} />
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Container>
            <Footer />
        </Box>
    );
}

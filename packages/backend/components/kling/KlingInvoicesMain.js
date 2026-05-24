"use client";
import {
    Box, Container, Typography, Stack, Chip, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Paper, Button, Collapse, IconButton,
    CircularProgress, Alert,
} from "@mui/material";
import { useState } from "react";
import axios from "axios";
import { Footer } from "../reusable/Footer";
import OndemandVideoIcon from "@mui/icons-material/OndemandVideo";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function isMonthComplete(month, year) {
    const now = new Date();
    return year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1);
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

function InvoiceRow({ invoice, onStatusChange }) {
    const [expanded, setExpanded] = useState(false);
    const [videos, setVideos] = useState(null);
    const [loadingVideos, setLoadingVideos] = useState(false);
    const [updatingStatus, setUpdatingStatus] = useState(false);

    const toggleExpand = async () => {
        if (!expanded && !videos) {
            setLoadingVideos(true);
            try {
                const res = await axios.get(`/api/admin/kling-invoices?month=${invoice.month}&year=${invoice.year}`);
                setVideos(res.data.videos);
            } finally {
                setLoadingVideos(false);
            }
        }
        setExpanded(v => !v);
    };

    const togglePaid = async () => {
        setUpdatingStatus(true);
        try {
            const newStatus = invoice.status === "paid" ? "open" : "paid";
            await onStatusChange(invoice._id, newStatus);
        } finally {
            setUpdatingStatus(false);
        }
    };

    const monthLabel = `${MONTH_NAMES[invoice.month - 1]} ${invoice.year}`;

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
                <TableCell>{invoice.videoCount}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>${invoice.totalAmount.toFixed(2)}</TableCell>
                <TableCell>
                    <Chip
                        size="small"
                        label={invoice.status === "paid" ? "Paid" : "Open"}
                        color={invoice.status === "paid" ? "success" : "warning"}
                        variant="outlined"
                    />
                </TableCell>
                <TableCell>
                    <Button
                        size="small"
                        variant={invoice.status === "paid" ? "outlined" : "contained"}
                        color={invoice.status === "paid" ? "inherit" : "success"}
                        startIcon={updatingStatus
                            ? <CircularProgress size={14} color="inherit" />
                            : <CheckCircleOutlineIcon fontSize="small" />}
                        disabled={updatingStatus}
                        onClick={togglePaid}
                        sx={{ whiteSpace: "nowrap" }}
                    >
                        {invoice.status === "paid" ? "Mark Open" : "Mark Paid"}
                    </Button>
                    {isMonthComplete(invoice.month, invoice.year) && (
                        <Button
                            size="small"
                            variant="outlined"
                            color="primary"
                            startIcon={<PictureAsPdfIcon fontSize="small" />}
                            href={`/api/admin/kling-invoices/pdf?month=${invoice.month}&year=${invoice.year}`}
                            download
                            sx={{ whiteSpace: "nowrap", ml: 1 }}
                        >
                            PDF
                        </Button>
                    )}
                </TableCell>
            </TableRow>
            <TableRow>
                <TableCell colSpan={6} sx={{ p: 0, border: 0 }}>
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
        </>
    );
}

export function KlingInvoicesMain({ initialInvoices }) {
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

    const totalOpen = invoices.filter(i => i.status === "open").reduce((s, i) => s + i.totalAmount, 0);
    const totalPaid = invoices.filter(i => i.status === "paid").reduce((s, i) => s + i.totalAmount, 0);

    return (
        <Box sx={{ width: "100%", minHeight: "90vh" }}>
            <Container maxWidth="lg" sx={{ py: 4 }}>
                {/* Header */}
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 1 }}>
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

                    {/* Summary chips */}
                    <Stack direction="row" spacing={1}>
                        <Chip label={`Open: $${totalOpen.toFixed(2)}`} color="warning" variant="outlined" sx={{ fontWeight: 700 }} />
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
                                    <TableCell sx={{ fontWeight: 700 }}>Videos</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Total</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Action</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {invoices.map(inv => (
                                    <InvoiceRow key={inv._id} invoice={inv} onStatusChange={handleStatusChange} />
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

"use client";
import { useState, useEffect } from "react";
import {
    Dialog, DialogContent, Box, Typography, TextField,
    Button, IconButton, CircularProgress, Stack,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import InsightsIcon from "@mui/icons-material/Insights";

const SESSION_KEY = "pt_popup_dismissed";

export default function HomePopup() {
    const [open, setOpen]         = useState(false);
    const [email, setEmail]       = useState("");
    const [phone, setPhone]       = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone]         = useState(false);
    const [error, setError]       = useState("");

    useEffect(() => {
        if (sessionStorage.getItem(SESSION_KEY)) return;
        const t = setTimeout(() => setOpen(true), 5000);
        return () => clearTimeout(t);
    }, []);

    const dismiss = () => {
        sessionStorage.setItem(SESSION_KEY, "1");
        setOpen(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email.trim()) { setError("Email is required."); return; }
        setSubmitting(true);
        setError("");
        try {
            const res = await fetch("/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: email,
                    email,
                    message: `Free business analysis request.\nPhone: ${phone || "not provided"}`,
                }),
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.error);
            sessionStorage.setItem(SESSION_KEY, "1");
            setDone(true);
        } catch (err) {
            setError(err.message || "Something went wrong. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog
            open={open}
            onClose={dismiss}
            maxWidth="xs"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    overflow: "hidden",
                    boxShadow: "0 24px 60px rgba(0,0,0,0.35)",
                },
            }}
        >
            {/* Header bar */}
            <Box sx={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", px: 3, pt: 3, pb: 2.5, position: "relative" }}>
                <IconButton
                    onClick={dismiss}
                    size="small"
                    sx={{ position: "absolute", top: 10, right: 10, color: "rgba(255,255,255,0.5)", "&:hover": { color: "#fff" } }}
                >
                    <CloseIcon fontSize="small" />
                </IconButton>

                <Stack direction="row" alignItems="center" spacing={1.5} mb={1.5}>
                    <Box sx={{
                        width: 40, height: 40, borderRadius: 2,
                        background: "linear-gradient(135deg, #D3A73D, #b8860b)",
                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}>
                        <InsightsIcon sx={{ color: "#fff", fontSize: 22 }} />
                    </Box>
                    <Box>
                        <Typography sx={{ color: "#D3A73D", fontWeight: 700, fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase" }}>
                            Limited Time — Free Offer
                        </Typography>
                        <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: 18, lineHeight: 1.2 }}>
                            Free Business Analysis
                        </Typography>
                    </Box>
                </Stack>

                <Typography sx={{ color: "rgba(255,255,255,0.72)", fontSize: 13.5, lineHeight: 1.6 }}>
                    Get a <strong style={{ color: "#D3A73D" }}>no-risk, no-obligation</strong> analysis of your print-on-demand operation — we&apos;ll identify exactly where you&apos;re losing time and money.
                </Typography>
            </Box>

            <DialogContent sx={{ px: 3, pt: 2.5, pb: 3 }}>
                {done ? (
                    <Box sx={{ textAlign: "center", py: 2 }}>
                        <CheckCircleIcon sx={{ fontSize: 52, color: "success.main", mb: 1.5 }} />
                        <Typography variant="h6" fontWeight={700} mb={0.5}>You&apos;re all set!</Typography>
                        <Typography color="text.secondary" fontSize={14}>
                            We&apos;ll reach out within 1 business day with your personalized analysis.
                        </Typography>
                        <Button variant="contained" onClick={dismiss} sx={{ mt: 2.5, bgcolor: "#0f172a", "&:hover": { bgcolor: "#1e293b" } }}>
                            Close
                        </Button>
                    </Box>
                ) : (
                    <Box component="form" onSubmit={handleSubmit}>
                        <Stack spacing={2}>
                            <TextField
                                label="Email Address"
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                fullWidth
                                size="small"
                                required
                                autoFocus
                            />
                            <TextField
                                label="Phone Number (optional)"
                                type="tel"
                                value={phone}
                                onChange={e => setPhone(e.target.value)}
                                fullWidth
                                size="small"
                                placeholder="(555) 000-0000"
                            />
                            {error && (
                                <Typography color="error" fontSize={13}>{error}</Typography>
                            )}
                            <Button
                                type="submit"
                                variant="contained"
                                fullWidth
                                disabled={submitting}
                                startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : null}
                                sx={{
                                    py: 1.25,
                                    fontSize: 15,
                                    fontWeight: 700,
                                    bgcolor: "#D3A73D",
                                    color: "#0f172a",
                                    "&:hover": { bgcolor: "#b8860b", boxShadow: "0 4px 16px rgba(211,167,61,0.4)" },
                                    boxShadow: "none",
                                }}
                            >
                                {submitting ? "Sending…" : "Claim My Free Analysis"}
                            </Button>
                            <Typography align="center" sx={{ fontSize: 11.5, color: "text.disabled" }}>
                                No spam. No obligation. Just honest insights.
                            </Typography>
                        </Stack>
                    </Box>
                )}
            </DialogContent>
        </Dialog>
    );
}

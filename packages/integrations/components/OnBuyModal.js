"use client";
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Button, Stack, Alert, CircularProgress, IconButton,
    Accordion, AccordionSummary, AccordionDetails, Typography, Box,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { useState } from "react";
import axios from "axios";

const ONBUY_COLOR = "#5D11D4";

const SETUP_STEPS = [
    {
        step: "1",
        title: "Open OnBuy API Settings",
        detail: "In your OnBuy Seller Control Panel go to Listing & Products → Imports & Integrations → OnBuy API.",
        link: { label: "OnBuy Seller Control Panel", href: "https://seller.onbuy.com/" },
    },
    {
        step: "2",
        title: "Copy Your Credentials",
        detail: "Copy your Seller ID, Consumer Key, and Secret Key from the API settings page.",
    },
    {
        step: "3",
        title: "Use Test Keys First",
        detail: "OnBuy provides separate test and live credentials. Use test credentials during setup to verify the connection before going live.",
    },
];

export function OnBuyModal({ open, setOpen, provider, apiConnections, setConnections }) {
    const [displayName,   setDisplayName]   = useState("");
    const [consumerKey,   setConsumerKey]   = useState("");
    const [secretKey,     setSecretKey]     = useState("");
    const [saving,        setSaving]        = useState(false);
    const [error,         setError]         = useState("");

    const reset = () => { setDisplayName(""); setConsumerKey(""); setSecretKey(""); setError(""); };
    const handleClose = () => { reset(); setOpen(false); };

    const sub = async () => {
        if (!displayName || !consumerKey || !secretKey) { setError("All fields are required"); return; }
        setSaving(true); setError("");
        try {
            const res = await axios.post("/api/admin/integrations", {
                type: "onbuy",
                displayName,
                apiKey:    consumerKey,
                apiSecret: secretKey,
                provider,
            });
            if (res?.data?.error) { setError(res.data.msg ?? "Save failed"); }
            else { setConnections(res.data.integrations); handleClose(); }
        } catch (e) {
            setError(e.response?.data?.error ?? "Save failed");
        } finally { setSaving(false); }
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ fontWeight: 700, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                New OnBuy Connection
                <IconButton size="small" onClick={handleClose}><CloseIcon fontSize="small" /></IconButton>
            </DialogTitle>
            <DialogContent dividers sx={{ p: 0 }}>
                <Accordion disableGutters elevation={0} sx={{ borderBottom: "1px solid #e5e7eb", "&:before": { display: "none" } }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 3, py: 1.5, bgcolor: "#f5f3ff" }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: ONBUY_COLOR, flexShrink: 0 }} />
                            <Typography variant="body2" fontWeight={600} color={ONBUY_COLOR}>First time? How to get your API keys</Typography>
                        </Stack>
                    </AccordionSummary>
                    <AccordionDetails sx={{ px: 3, pb: 2.5, bgcolor: "#f5f3ff" }}>
                        <Stack spacing={2}>
                            {SETUP_STEPS.map(({ step, title, detail, link }) => (
                                <Stack key={step} direction="row" spacing={1.5} alignItems="flex-start">
                                    <Box sx={{ width: 22, height: 22, borderRadius: "50%", bgcolor: ONBUY_COLOR, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, mt: 0.1 }}>
                                        <Typography sx={{ fontSize: "0.65rem", fontWeight: 700, color: "#fff" }}>{step}</Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="body2" fontWeight={600} sx={{ mb: 0.25 }}>{title}</Typography>
                                        <Typography variant="caption" color="text.secondary" display="block" sx={{ lineHeight: 1.5 }}>{detail}</Typography>
                                        {link && (
                                            <Button size="small" variant="text" href={link.href} target="_blank" rel="noopener noreferrer"
                                                endIcon={<OpenInNewIcon sx={{ fontSize: 12 }} />}
                                                sx={{ mt: 0.5, p: 0, fontSize: "0.72rem", color: ONBUY_COLOR, minWidth: 0, textTransform: "none" }}>
                                                {link.label}
                                            </Button>
                                        )}
                                    </Box>
                                </Stack>
                            ))}
                        </Stack>
                    </AccordionDetails>
                </Accordion>
                <Stack spacing={2} sx={{ pt: 2, px: 3, pb: 1 }}>
                    {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}
                    <TextField fullWidth size="small" label="Display Name" placeholder="My OnBuy Store"
                        value={displayName} onChange={e => setDisplayName(e.target.value)} />
                    <TextField fullWidth size="small" label="Consumer Key"
                        value={consumerKey} onChange={e => setConsumerKey(e.target.value)}
                        helperText="From OnBuy Seller Control Panel → API Settings" />
                    <TextField fullWidth size="small" label="Secret Key"
                        value={secretKey} onChange={e => setSecretKey(e.target.value)} />
                </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={handleClose}>Cancel</Button>
                <Button variant="contained" onClick={sub}
                    disabled={saving || !displayName || !consumerKey || !secretKey}
                    sx={{ bgcolor: ONBUY_COLOR, "&:hover": { bgcolor: "#4a0db0" } }}
                    startIcon={saving ? <CircularProgress size={14} color="inherit" /> : null}>
                    Connect
                </Button>
            </DialogActions>
        </Dialog>
    );
}

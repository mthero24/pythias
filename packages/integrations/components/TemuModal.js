"use client";
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Button, Stack, Alert, CircularProgress, IconButton,
    Accordion, AccordionSummary, AccordionDetails,
    Typography, Box,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { useState } from "react";
import axios from "axios";

const SETUP_STEPS = [
    {
        step: "1",
        title: "Apply for Temu Open Platform",
        detail: "Go to the Temu Open Platform and submit a partner application. Temu reviews applications manually — allow several business days.",
        link: { label: "Temu Open Platform", href: "https://seller.temu.com/" },
    },
    {
        step: "2",
        title: "Create an App",
        detail: "After approval, log in and go to App Center → Create App. Fill in your app name, description, and callback URL.",
    },
    {
        step: "3",
        title: "Copy App Key & App Secret",
        detail: "Open your app details page. Copy the App Key and App Secret — keep the secret safe, it authenticates every API call.",
    },
    {
        step: "4",
        title: "Authorize & get your Access Token",
        detail: 'In App Center click "Authorize". Complete the OAuth flow for your seller account. Copy the Access Token from the confirmation screen.',
    },
    {
        step: "5",
        title: "Find your Cost Template ID (optional)",
        detail: "In Seller Center go to Logistics → Shipping Templates. The numeric ID in the URL of each template is the Cost Template ID.",
    },
];

export function TemuModal({ open, setOpen, provider, setConnections }) {
    const [displayName,     setDisplayName]     = useState("");
    const [appKey,          setAppKey]          = useState("");
    const [appSecret,       setAppSecret]       = useState("");
    const [accessToken,     setAccessToken]     = useState("");
    const [costTemplateId,  setCostTemplateId]  = useState("");
    const [saving,          setSaving]          = useState(false);
    const [error,           setError]           = useState("");

    const reset = () => {
        setDisplayName(""); setAppKey(""); setAppSecret("");
        setAccessToken(""); setCostTemplateId(""); setError("");
    };
    const handleClose = () => { reset(); setOpen(false); };

    const sub = async () => {
        if (!displayName || !appKey || !appSecret || !accessToken) {
            setError("Display Name, App Key, App Secret, and Access Token are required"); return;
        }
        setSaving(true); setError("");
        try {
            const res = await axios.post("/api/admin/integrations", {
                type: "temu",
                displayName,
                apiKey: appKey,
                apiSecret: appSecret,
                refreshToken: accessToken,
                organization: costTemplateId,
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
                New Temu Connection
                <IconButton size="small" onClick={handleClose}><CloseIcon fontSize="small" /></IconButton>
            </DialogTitle>
            <DialogContent dividers sx={{ p: 0 }}>
                <Accordion disableGutters elevation={0} sx={{ borderBottom: "1px solid #e5e7eb", "&:before": { display: "none" } }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 3, py: 1.5, bgcolor: "#fff5f0" }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#ff6500", flexShrink: 0 }} />
                            <Typography variant="body2" fontWeight={600} color="#9a3d00">
                                First time? How to get your credentials
                            </Typography>
                        </Stack>
                    </AccordionSummary>
                    <AccordionDetails sx={{ px: 3, pb: 2.5, bgcolor: "#fff5f0" }}>
                        <Stack spacing={2}>
                            {SETUP_STEPS.map(({ step, title, detail, link }) => (
                                <Stack key={step} direction="row" spacing={1.5} alignItems="flex-start">
                                    <Box sx={{
                                        width: 22, height: 22, borderRadius: "50%", bgcolor: "#ff6500",
                                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, mt: 0.1,
                                    }}>
                                        <Typography sx={{ fontSize: "0.65rem", fontWeight: 700, color: "#fff" }}>{step}</Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="body2" fontWeight={600} sx={{ mb: 0.25 }}>{title}</Typography>
                                        <Typography variant="caption" color="text.secondary" display="block" sx={{ lineHeight: 1.5 }}>
                                            {detail}
                                        </Typography>
                                        {link && (
                                            <Button
                                                size="small" variant="text"
                                                href={link.href} target="_blank" rel="noopener noreferrer"
                                                endIcon={<OpenInNewIcon sx={{ fontSize: 12 }} />}
                                                sx={{ mt: 0.5, p: 0, fontSize: "0.72rem", color: "#ff6500", minWidth: 0, textTransform: "none" }}
                                            >
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
                    <TextField fullWidth size="small" label="Display Name" value={displayName} onChange={e => setDisplayName(e.target.value)} />
                    <TextField
                        fullWidth size="small" label="App Key"
                        value={appKey}
                        onChange={e => setAppKey(e.target.value)}
                        helperText="App Center → app details → App Key"
                    />
                    <TextField
                        fullWidth size="small" label="App Secret" type="password"
                        value={appSecret}
                        onChange={e => setAppSecret(e.target.value)}
                        helperText="App Center → app details → App Secret"
                    />
                    <TextField
                        fullWidth size="small" label="Access Token"
                        value={accessToken}
                        onChange={e => setAccessToken(e.target.value)}
                        helperText="Obtained after completing the OAuth authorization flow"
                    />
                    <TextField
                        fullWidth size="small" label="Default Cost Template ID (optional)"
                        value={costTemplateId}
                        onChange={e => setCostTemplateId(e.target.value)}
                        helperText="Logistics → Shipping Templates → template ID"
                    />
                </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={handleClose}>Cancel</Button>
                <Button
                    variant="contained" onClick={sub}
                    disabled={saving || !displayName || !appKey || !appSecret || !accessToken}
                    sx={{ bgcolor: "#ff6500", "&:hover": { bgcolor: "#e05a00" } }}
                    startIcon={saving ? <CircularProgress size={14} color="inherit" /> : null}
                >
                    Connect
                </Button>
            </DialogActions>
        </Dialog>
    );
}

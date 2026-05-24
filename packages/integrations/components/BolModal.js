"use client";
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Button, Stack, Alert, CircularProgress, IconButton,
    Accordion, AccordionSummary, AccordionDetails,
    Typography, Box,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useState } from "react";
import axios from "axios";

const SETUP_STEPS = [
    {
        step: "1",
        title: "Log in to bol.com Seller",
        detail: "Go to bol.com and log in to your seller account (partner.bol.com).",
    },
    {
        step: "2",
        title: "Create API credentials",
        detail: "Navigate to Settings → API Keys → Add Key. Give it a name, select the required scopes (orders, shipments), and click Create. Copy the Client ID and Client Secret.",
    },
    {
        step: "3",
        title: "Enter credentials below",
        detail: "Paste your Client ID (as API Key) and Client Secret (as Client Secret). Pythias uses OAuth2 client credentials — no redirect needed.",
    },
];

export function BolModal({ open, setOpen, provider, setConnections }) {
    const [displayName,    setDisplayName]    = useState("");
    const [clientId,       setClientId]       = useState("");
    const [clientSecret,   setClientSecret]   = useState("");
    // apiKey = Client ID, refreshToken = Client Secret (bol. client_credentials flow)
    const [saving,         setSaving]         = useState(false);
    const [error,          setError]          = useState("");

    const reset = () => { setDisplayName(""); setClientId(""); setClientSecret(""); setError(""); };
    const handleClose = () => { reset(); setOpen(false); };

    const sub = async () => {
        if (!displayName || !clientId || !clientSecret) { setError("All fields are required"); return; }
        setSaving(true); setError("");
        try {
            const res = await axios.post("/api/admin/integrations", {
                type: "bol",
                displayName,
                apiKey:        clientId,
                refreshToken:  clientSecret,
                organization:  "bol.com",
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
                New bol.com Connection
                <IconButton size="small" onClick={handleClose}><CloseIcon fontSize="small" /></IconButton>
            </DialogTitle>
            <DialogContent dividers sx={{ p: 0 }}>
                <Accordion disableGutters elevation={0} sx={{ borderBottom: "1px solid #e5e7eb", "&:before": { display: "none" } }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 3, py: 1.5, bgcolor: "#eff6ff" }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#0062B1", flexShrink: 0 }} />
                            <Typography variant="body2" fontWeight={600} color="#1e3a8a">
                                First time? How to get your API credentials
                            </Typography>
                        </Stack>
                    </AccordionSummary>
                    <AccordionDetails sx={{ px: 3, pb: 2.5, bgcolor: "#eff6ff" }}>
                        <Stack spacing={2}>
                            {SETUP_STEPS.map(({ step, title, detail }) => (
                                <Stack key={step} direction="row" spacing={1.5} alignItems="flex-start">
                                    <Box sx={{
                                        width: 22, height: 22, borderRadius: "50%", bgcolor: "#0062B1",
                                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, mt: 0.1,
                                    }}>
                                        <Typography sx={{ fontSize: "0.65rem", fontWeight: 700, color: "#fff" }}>{step}</Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="body2" fontWeight={600} sx={{ mb: 0.25 }}>{title}</Typography>
                                        <Typography variant="caption" color="text.secondary" display="block" sx={{ lineHeight: 1.5 }}>
                                            {detail}
                                        </Typography>
                                    </Box>
                                </Stack>
                            ))}
                            <Alert severity="info" sx={{ mt: 0.5, fontSize: "0.75rem", py: 0.5 }}>
                                bol.com uses OAuth2 client credentials. No redirect needed — credentials are exchanged automatically.
                            </Alert>
                        </Stack>
                    </AccordionDetails>
                </Accordion>

                <Stack spacing={2} sx={{ pt: 2, px: 3, pb: 1 }}>
                    {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}
                    <TextField
                        fullWidth size="small" label="Display Name"
                        value={displayName}
                        onChange={e => setDisplayName(e.target.value)}
                        placeholder="e.g. bol.com NL Store"
                    />
                    <TextField
                        fullWidth size="small" label="Client ID"
                        value={clientId}
                        onChange={e => setClientId(e.target.value)}
                        helperText="Settings → API Keys in your bol.com seller account"
                    />
                    <TextField
                        fullWidth size="small" label="Client Secret"
                        value={clientSecret}
                        onChange={e => setClientSecret(e.target.value)}
                        type="password"
                        helperText="Generated alongside the Client ID"
                    />
                </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={handleClose}>Cancel</Button>
                <Button
                    variant="contained" onClick={sub}
                    disabled={saving || !displayName || !clientId || !clientSecret}
                    sx={{ bgcolor: "#0062B1", "&:hover": { bgcolor: "#00509a" } }}
                    startIcon={saving ? <CircularProgress size={14} color="inherit" /> : null}
                >
                    Connect
                </Button>
            </DialogActions>
        </Dialog>
    );
}

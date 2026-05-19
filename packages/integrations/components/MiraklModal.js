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
        title: "Get your Marketplace Base URL",
        detail: "Each Mirakl-powered marketplace has its own URL. Examples: Target Plus → seller.marketplace.target.com, Best Buy Canada → seller.bestbuy.ca. The base URL is the root domain of the marketplace seller portal.",
    },
    {
        step: "2",
        title: "Log in to the Seller Portal",
        detail: "Go to your marketplace's seller portal and log in with your seller account credentials.",
    },
    {
        step: "3",
        title: "Generate your API Key",
        detail: 'In the seller portal go to Settings → API (or Account → API Keys depending on the marketplace). Click "Generate" or "Create Key". Copy the key — treat it like a password.',
    },
];

export function MiraklModal({ open, setOpen, provider, setConnections }) {
    const [displayName, setDisplayName] = useState("");
    const [apiKey,      setApiKey]      = useState("");
    const [baseUrl,     setBaseUrl]     = useState("");
    const [saving,      setSaving]      = useState(false);
    const [error,       setError]       = useState("");

    const reset = () => { setDisplayName(""); setApiKey(""); setBaseUrl(""); setError(""); };
    const handleClose = () => { reset(); setOpen(false); };

    const sub = async () => {
        if (!displayName || !apiKey || !baseUrl) { setError("All fields are required"); return; }
        setSaving(true); setError("");
        try {
            const res = await axios.post("/api/admin/integrations", {
                type: "mirakl",
                displayName,
                apiKey,
                organization: baseUrl.trim().replace(/\/$/, ""),
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
                New Mirakl Connection
                <IconButton size="small" onClick={handleClose}><CloseIcon fontSize="small" /></IconButton>
            </DialogTitle>
            <DialogContent dividers sx={{ p: 0 }}>
                <Accordion disableGutters elevation={0} sx={{ borderBottom: "1px solid #e5e7eb", "&:before": { display: "none" } }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 3, py: 1.5, bgcolor: "#f0f4ff" }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#1d4ed8", flexShrink: 0 }} />
                            <Typography variant="body2" fontWeight={600} color="#1e3a8a">
                                First time? How to get your credentials
                            </Typography>
                        </Stack>
                    </AccordionSummary>
                    <AccordionDetails sx={{ px: 3, pb: 2.5, bgcolor: "#f0f4ff" }}>
                        <Stack spacing={2}>
                            {SETUP_STEPS.map(({ step, title, detail }) => (
                                <Stack key={step} direction="row" spacing={1.5} alignItems="flex-start">
                                    <Box sx={{
                                        width: 22, height: 22, borderRadius: "50%", bgcolor: "#1d4ed8",
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
                                Mirakl powers Target Plus, Best Buy Canada, Carrefour, and many others — each is a separate connection with its own Base URL and API key.
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
                        placeholder="e.g. Target Plus"
                    />
                    <TextField
                        fullWidth size="small" label="Marketplace Base URL"
                        value={baseUrl}
                        onChange={e => setBaseUrl(e.target.value)}
                        placeholder="https://marketplace.example.com"
                        helperText="Root URL of the Mirakl-powered marketplace seller portal"
                    />
                    <TextField
                        fullWidth size="small" label="API Key"
                        value={apiKey}
                        onChange={e => setApiKey(e.target.value)}
                        helperText="Settings → API in the marketplace seller portal"
                    />
                </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={handleClose}>Cancel</Button>
                <Button
                    variant="contained" onClick={sub}
                    disabled={saving || !displayName || !apiKey || !baseUrl}
                    sx={{ bgcolor: "#1d4ed8", "&:hover": { bgcolor: "#1e40af" } }}
                    startIcon={saving ? <CircularProgress size={14} color="inherit" /> : null}
                >
                    Connect
                </Button>
            </DialogActions>
        </Dialog>
    );
}

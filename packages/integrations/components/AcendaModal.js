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
        title: "Log in to Acenda",
        detail: "Go to your Acenda storefront admin. You'll need Owner or Developer-level access to generate API credentials.",
        link: { label: "Open Acenda", href: "https://acenda.com/" },
    },
    {
        step: "2",
        title: "Find your Store Name",
        detail: 'Your store name (also called the seller name) is the subdomain of your Acenda store — e.g. if your store is mystore.acenda.com, the store name is "mystore".',
    },
    {
        step: "3",
        title: "Generate API Key & Secret",
        detail: 'In Acenda Admin go to Settings → API Access. Click "Generate New Key". Copy both the API Key and API Secret — the secret is only shown once.',
    },
    {
        step: "4",
        title: "Find your Organization ID",
        detail: "In Acenda Admin go to Settings → Store Info. Your Organization ID is listed in the account details section.",
    },
];

export function AcendaModal({ open, setOpen, provider, setConnections }) {
    const [displayName,  setDisplayName]  = useState("");
    const [sellerName,   setSellerName]   = useState("");
    const [apiKey,       setApiKey]       = useState("");
    const [apiSecret,    setApiSecret]    = useState("");
    const [organization, setOrganization] = useState("");
    const [saving,       setSaving]       = useState(false);
    const [error,        setError]        = useState("");

    const reset = () => {
        setDisplayName(""); setSellerName(""); setApiKey("");
        setApiSecret(""); setOrganization(""); setError("");
    };
    const handleClose = () => { reset(); setOpen(false); };

    const sub = async () => {
        if (!displayName || !apiKey || !apiSecret || !organization) {
            setError("All fields are required"); return;
        }
        setSaving(true); setError("");
        try {
            const res = await axios.post("/api/admin/integrations", {
                type: "acenda",
                displayName,
                apiKey,
                apiSecret,
                organization,
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
                New Acenda Connection
                <IconButton size="small" onClick={handleClose}><CloseIcon fontSize="small" /></IconButton>
            </DialogTitle>
            <DialogContent dividers sx={{ p: 0 }}>
                <Accordion disableGutters elevation={0} sx={{ borderBottom: "1px solid #e5e7eb", "&:before": { display: "none" } }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 3, py: 1.5, bgcolor: "#f0f6ff" }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#1565C0", flexShrink: 0 }} />
                            <Typography variant="body2" fontWeight={600} color="#0d3d7a">
                                First time? How to get your credentials
                            </Typography>
                        </Stack>
                    </AccordionSummary>
                    <AccordionDetails sx={{ px: 3, pb: 2.5, bgcolor: "#f0f6ff" }}>
                        <Stack spacing={2}>
                            {SETUP_STEPS.map(({ step, title, detail, link }) => (
                                <Stack key={step} direction="row" spacing={1.5} alignItems="flex-start">
                                    <Box sx={{
                                        width: 22, height: 22, borderRadius: "50%", bgcolor: "#1565C0",
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
                                                sx={{ mt: 0.5, p: 0, fontSize: "0.72rem", color: "#1565C0", minWidth: 0, textTransform: "none" }}
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
                        fullWidth size="small" label="API Key"
                        value={apiKey}
                        onChange={e => setApiKey(e.target.value)}
                        helperText="Settings → API Access → API Key"
                    />
                    <TextField
                        fullWidth size="small" label="API Secret" type="password"
                        value={apiSecret}
                        onChange={e => setApiSecret(e.target.value)}
                        helperText="Settings → API Access → API Secret"
                    />
                    <TextField
                        fullWidth size="small" label="Organization ID"
                        value={organization}
                        onChange={e => setOrganization(e.target.value)}
                        helperText="Settings → Store Info → Organization ID"
                    />
                </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={handleClose}>Cancel</Button>
                <Button
                    variant="contained" onClick={sub}
                    disabled={saving || !displayName || !apiKey || !apiSecret || !organization}
                    sx={{ bgcolor: "#1565C0", "&:hover": { bgcolor: "#0d47a1" } }}
                    startIcon={saving ? <CircularProgress size={14} color="inherit" /> : null}
                >
                    Connect
                </Button>
            </DialogActions>
        </Dialog>
    );
}

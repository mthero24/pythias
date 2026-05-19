"use client";
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Button, Stack, Alert, CircularProgress, IconButton,
    Accordion, AccordionSummary, AccordionDetails,
    Typography, Box,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { useState } from "react";
import axios from "axios";

const SETUP_STEPS = [
    {
        step: "1",
        title: "Apply for Walmart Marketplace",
        detail: 'Go to marketplace.walmart.com and click "Request to Sell". Complete the seller application — approval typically takes 1–2 weeks.',
        link: { label: "Apply to Sell", href: "https://marketplace.walmart.com/apply-to-sell/" },
    },
    {
        step: "2",
        title: "Get your Client ID & Secret",
        detail: 'In Seller Center go to Partner Profile → Consumer API. Click "Production Keys" to reveal your Client ID and Client Secret.',
        link: { label: "Open Seller Center", href: "https://sellerpartner.walmart.com/" },
    },
    {
        step: "3",
        title: "Find your Partner ID",
        detail: "In Seller Center go to Partner Profile → Business Info. Your Partner ID is listed there — it looks like a long alphanumeric string.",
    },
];

export function WalmartModal({ open, setOpen, provider, setConnections }) {
    const [displayName, setDisplayName] = useState("");
    const [clientId,    setClientId]    = useState("");
    const [clientSecret, setClientSecret] = useState("");
    const [partnerId,   setPartnerId]   = useState("");
    const [testing,     setTesting]     = useState(false);
    const [tested,      setTested]      = useState(null);
    const [saving,      setSaving]      = useState(false);
    const [error,       setError]       = useState("");

    const reset = () => {
        setDisplayName(""); setClientId(""); setClientSecret(""); setPartnerId("");
        setTested(null); setError("");
    };
    const handleClose = () => { reset(); setOpen(false); };

    const testConnection = async () => {
        if (!clientId || !clientSecret) { setError("Client ID and Secret are required to test"); return; }
        setTesting(true); setTested(null); setError("");
        try {
            const res = await axios.post("/api/integrations/walmart/test", { clientId, clientSecret });
            setTested(res.data.ok ? "ok" : "fail");
            if (!res.data.ok) setError(res.data.error ?? "Connection failed");
        } catch (e) {
            setTested("fail");
            setError(e.response?.data?.error ?? "Connection test failed");
        } finally { setTesting(false); }
    };

    const sub = async () => {
        if (!displayName || !clientId || !clientSecret || !partnerId) {
            setError("All fields are required"); return;
        }
        setSaving(true); setError("");
        try {
            const res = await axios.post("/api/admin/integrations", {
                type: "walmart",
                displayName,
                apiKey: clientId,
                apiSecret: clientSecret,
                organization: partnerId,
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
                New Walmart Connection
                <IconButton size="small" onClick={handleClose}><CloseIcon fontSize="small" /></IconButton>
            </DialogTitle>
            <DialogContent dividers sx={{ p: 0 }}>
                <Accordion disableGutters elevation={0} sx={{ borderBottom: "1px solid #e5e7eb", "&:before": { display: "none" } }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 3, py: 1.5, bgcolor: "#f0f7ff" }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#0071CE", flexShrink: 0 }} />
                            <Typography variant="body2" fontWeight={600} color="#1e4d8c">
                                First time? How to get your credentials
                            </Typography>
                        </Stack>
                    </AccordionSummary>
                    <AccordionDetails sx={{ px: 3, pb: 2.5, bgcolor: "#f0f7ff" }}>
                        <Stack spacing={2}>
                            {SETUP_STEPS.map(({ step, title, detail, link }) => (
                                <Stack key={step} direction="row" spacing={1.5} alignItems="flex-start">
                                    <Box sx={{
                                        width: 22, height: 22, borderRadius: "50%", bgcolor: "#0071CE",
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
                                                sx={{ mt: 0.5, p: 0, fontSize: "0.72rem", color: "#0071CE", minWidth: 0, textTransform: "none" }}
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
                    {tested === "ok" && <Alert severity="success" icon={<CheckCircleIcon />}>Connection verified</Alert>}
                    <TextField fullWidth size="small" label="Display Name" value={displayName} onChange={e => setDisplayName(e.target.value)} />
                    <TextField
                        fullWidth size="small" label="Client ID"
                        value={clientId}
                        onChange={e => { setClientId(e.target.value); setTested(null); }}
                    />
                    <TextField
                        fullWidth size="small" label="Client Secret" type="password"
                        value={clientSecret}
                        onChange={e => { setClientSecret(e.target.value); setTested(null); }}
                    />
                    <TextField
                        fullWidth size="small" label="Partner ID"
                        value={partnerId}
                        onChange={e => setPartnerId(e.target.value)}
                        helperText="Seller Center → Partner Profile → Business Info"
                    />
                    <Button
                        variant="outlined" size="small"
                        onClick={testConnection}
                        disabled={testing || !clientId || !clientSecret}
                        startIcon={testing ? <CircularProgress size={14} /> : null}
                    >
                        {testing ? "Testing…" : "Test Connection"}
                    </Button>
                </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={handleClose}>Cancel</Button>
                <Button
                    variant="contained" onClick={sub}
                    disabled={saving || !displayName || !clientId || !clientSecret || !partnerId}
                    sx={{ bgcolor: "#0071CE", "&:hover": { bgcolor: "#005da6" } }}
                    startIcon={saving ? <CircularProgress size={14} color="inherit" /> : null}
                >
                    Connect
                </Button>
            </DialogActions>
        </Dialog>
    );
}

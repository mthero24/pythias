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

const WF_COLOR = "#7B2D8B";

const SETUP_STEPS = [
    {
        step: "1",
        title: "Create a Wayfair Application",
        detail: "In Wayfair Partner Home go to Developer → Applications → New Application. Set the environment to Production and save to receive your Client ID and Client Secret.",
        link: { label: "Wayfair Partner Home", href: "https://partners.wayfair.com/developer/applications" },
    },
    {
        step: "2",
        title: "Copy Your Credentials",
        detail: "Copy the Client ID and Client Secret. The Client Secret can only be viewed once — store it securely. Contact ERPSupport@wayfair.com if you need API access enabled.",
    },
    {
        step: "3",
        title: "Get Your Supplier ID",
        detail: "Your Supplier ID is found in your Wayfair Partner account settings. It is required for shipment confirmation mutations.",
    },
];

export function WayfairModal({ open, setOpen, provider, apiConnections, setConnections }) {
    const [displayName,    setDisplayName]    = useState("");
    const [clientId,       setClientId]       = useState("");
    const [clientSecret,   setClientSecret]   = useState("");
    const [supplierId,     setSupplierId]     = useState("");
    const [saving,         setSaving]         = useState(false);
    const [error,          setError]          = useState("");

    const reset = () => { setDisplayName(""); setClientId(""); setClientSecret(""); setSupplierId(""); setError(""); };
    const handleClose = () => { reset(); setOpen(false); };

    const sub = async () => {
        if (!displayName || !clientId || !clientSecret) { setError("Display Name, Client ID, and Client Secret are required"); return; }
        setSaving(true); setError("");
        try {
            const res = await axios.post("/api/admin/integrations", {
                type: "wayfair",
                displayName,
                apiKey:    clientId,
                apiSecret: clientSecret,
                shopId:    supplierId || undefined,
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
                New Wayfair Connection
                <IconButton size="small" onClick={handleClose}><CloseIcon fontSize="small" /></IconButton>
            </DialogTitle>
            <DialogContent dividers sx={{ p: 0 }}>
                <Accordion disableGutters elevation={0} sx={{ borderBottom: "1px solid #e5e7eb", "&:before": { display: "none" } }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 3, py: 1.5, bgcolor: "#faf5ff" }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: WF_COLOR, flexShrink: 0 }} />
                            <Typography variant="body2" fontWeight={600} color={WF_COLOR}>First time? How to connect Wayfair</Typography>
                        </Stack>
                    </AccordionSummary>
                    <AccordionDetails sx={{ px: 3, pb: 2.5, bgcolor: "#faf5ff" }}>
                        <Stack spacing={2}>
                            {SETUP_STEPS.map(({ step, title, detail, link }) => (
                                <Stack key={step} direction="row" spacing={1.5} alignItems="flex-start">
                                    <Box sx={{ width: 22, height: 22, borderRadius: "50%", bgcolor: WF_COLOR, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, mt: 0.1 }}>
                                        <Typography sx={{ fontSize: "0.65rem", fontWeight: 700, color: "#fff" }}>{step}</Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="body2" fontWeight={600} sx={{ mb: 0.25 }}>{title}</Typography>
                                        <Typography variant="caption" color="text.secondary" display="block" sx={{ lineHeight: 1.5 }}>{detail}</Typography>
                                        {link && (
                                            <Button size="small" variant="text" href={link.href} target="_blank" rel="noopener noreferrer"
                                                endIcon={<OpenInNewIcon sx={{ fontSize: 12 }} />}
                                                sx={{ mt: 0.5, p: 0, fontSize: "0.72rem", color: WF_COLOR, minWidth: 0, textTransform: "none" }}>
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
                    <TextField fullWidth size="small" label="Display Name" placeholder="My Wayfair Store"
                        value={displayName} onChange={e => setDisplayName(e.target.value)} />
                    <TextField fullWidth size="small" label="Client ID"
                        value={clientId} onChange={e => setClientId(e.target.value)}
                        helperText="From Wayfair Partner Home → Developer → Applications" />
                    <TextField fullWidth size="small" label="Client Secret"
                        value={clientSecret} onChange={e => setClientSecret(e.target.value)} />
                    <TextField fullWidth size="small" label="Supplier ID (optional)"
                        value={supplierId} onChange={e => setSupplierId(e.target.value)}
                        helperText="Required for shipment confirmation — found in Partner account settings" />
                </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={handleClose}>Cancel</Button>
                <Button variant="contained" onClick={sub}
                    disabled={saving || !displayName || !clientId || !clientSecret}
                    sx={{ bgcolor: WF_COLOR, "&:hover": { bgcolor: "#642475" } }}
                    startIcon={saving ? <CircularProgress size={14} color="inherit" /> : null}>
                    Connect
                </Button>
            </DialogActions>
        </Dialog>
    );
}

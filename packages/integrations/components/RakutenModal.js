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

const RAKUTEN_COLOR = "#BF0000";

const SETUP_STEPS = [
    {
        step: "1",
        title: "Enable RMS API Access",
        detail: "In your Rakuten RMS dashboard go to Store Information/Services → WEB API Service → API Access Settings and enable API access.",
        link: { label: "Rakuten RMS API Settings", href: "https://ichiba-bs.rms.rakuten.co.jp/apisson/" },
    },
    {
        step: "2",
        title: "Get Your Service Secret & License Key",
        detail: "From the API Access Settings page, copy your Service Secret and License Key. These are used together to authenticate API requests.",
    },
    {
        step: "3",
        title: "Note Your Shop URL",
        detail: "Your Rakuten Ichiba shop URL (e.g. https://www.rakuten.co.jp/shop-name/) is needed to identify your store.",
    },
];

export function RakutenModal({ open, setOpen, provider, apiConnections, setConnections }) {
    const [displayName,    setDisplayName]    = useState("");
    const [serviceSecret,  setServiceSecret]  = useState("");
    const [licenseKey,     setLicenseKey]     = useState("");
    const [saving,         setSaving]         = useState(false);
    const [error,          setError]          = useState("");

    const reset = () => { setDisplayName(""); setServiceSecret(""); setLicenseKey(""); setError(""); };
    const handleClose = () => { reset(); setOpen(false); };

    const sub = async () => {
        if (!displayName || !serviceSecret || !licenseKey) { setError("All fields are required"); return; }
        setSaving(true); setError("");
        try {
            const res = await axios.post("/api/admin/integrations", {
                type: "rakuten",
                displayName,
                apiKey:    serviceSecret,
                apiSecret: licenseKey,
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
                New Rakuten Connection
                <IconButton size="small" onClick={handleClose}><CloseIcon fontSize="small" /></IconButton>
            </DialogTitle>
            <DialogContent dividers sx={{ p: 0 }}>
                <Accordion disableGutters elevation={0} sx={{ borderBottom: "1px solid #e5e7eb", "&:before": { display: "none" } }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 3, py: 1.5, bgcolor: "#fff5f5" }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: RAKUTEN_COLOR, flexShrink: 0 }} />
                            <Typography variant="body2" fontWeight={600} color={RAKUTEN_COLOR}>First time? How to get your RMS API keys</Typography>
                        </Stack>
                    </AccordionSummary>
                    <AccordionDetails sx={{ px: 3, pb: 2.5, bgcolor: "#fff5f5" }}>
                        <Stack spacing={2}>
                            {SETUP_STEPS.map(({ step, title, detail, link }) => (
                                <Stack key={step} direction="row" spacing={1.5} alignItems="flex-start">
                                    <Box sx={{ width: 22, height: 22, borderRadius: "50%", bgcolor: RAKUTEN_COLOR, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, mt: 0.1 }}>
                                        <Typography sx={{ fontSize: "0.65rem", fontWeight: 700, color: "#fff" }}>{step}</Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="body2" fontWeight={600} sx={{ mb: 0.25 }}>{title}</Typography>
                                        <Typography variant="caption" color="text.secondary" display="block" sx={{ lineHeight: 1.5 }}>{detail}</Typography>
                                        {link && (
                                            <Button size="small" variant="text" href={link.href} target="_blank" rel="noopener noreferrer"
                                                endIcon={<OpenInNewIcon sx={{ fontSize: 12 }} />}
                                                sx={{ mt: 0.5, p: 0, fontSize: "0.72rem", color: RAKUTEN_COLOR, minWidth: 0, textTransform: "none" }}>
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
                    <TextField fullWidth size="small" label="Display Name" placeholder="My Rakuten Store"
                        value={displayName} onChange={e => setDisplayName(e.target.value)} />
                    <TextField fullWidth size="small" label="Service Secret"
                        value={serviceSecret} onChange={e => setServiceSecret(e.target.value)}
                        helperText="From RMS → API Access Settings" />
                    <TextField fullWidth size="small" label="License Key"
                        value={licenseKey} onChange={e => setLicenseKey(e.target.value)} />
                </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={handleClose}>Cancel</Button>
                <Button variant="contained" onClick={sub}
                    disabled={saving || !displayName || !serviceSecret || !licenseKey}
                    sx={{ bgcolor: RAKUTEN_COLOR, "&:hover": { bgcolor: "#9a0000" } }}
                    startIcon={saving ? <CircularProgress size={14} color="inherit" /> : null}>
                    Connect
                </Button>
            </DialogActions>
        </Dialog>
    );
}

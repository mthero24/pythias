"use client";
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Button, Stack, Alert, CircularProgress, IconButton,
    Accordion, AccordionSummary, AccordionDetails,
    Typography, Box,
} from "@mui/material";
import CloseIcon      from "@mui/icons-material/Close";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import OpenInNewIcon  from "@mui/icons-material/OpenInNew";
import { useState } from "react";
import axios from "axios";

const WIX_COLOR = "#0C6EFC";

const SETUP_STEPS = [
    {
        step: "1",
        title: "Open Wix Developer Center",
        detail: "Go to manage.wix.com and open your site's dashboard.",
        link: { label: "Open Wix Dashboard", href: "https://manage.wix.com" },
    },
    {
        step: "2",
        title: "Create an API Key",
        detail: "In the left nav click Settings → Advanced → API Keys. Click '+ Generate API Key', give it a name, and select the Wix Stores and eCommerce permissions.",
        link: { label: "API Keys Settings", href: "https://manage.wix.com/account/api-keys" },
    },
    {
        step: "3",
        title: "Copy your Site ID",
        detail: "Go to Settings → General Info and copy your Site ID. It looks like a UUID (e.g. a1b2c3d4-...).",
    },
];

export function WixModal({ open, setOpen, provider, apiConnections, setConnections }) {
    const [displayName, setDisplayName] = useState("");
    const [apiKey,      setApiKey]      = useState("");
    const [siteId,      setSiteId]      = useState("");
    const [saving,      setSaving]      = useState(false);
    const [error,       setError]       = useState("");

    const reset = () => { setDisplayName(""); setApiKey(""); setSiteId(""); setError(""); };
    const handleClose = () => { reset(); setOpen(false); };

    const sub = async () => {
        if (!displayName || !apiKey || !siteId) { setError("All fields are required"); return; }
        setSaving(true); setError("");
        try {
            const res = await axios.post("/api/admin/integrations", {
                type: "wix",
                displayName,
                apiKey,
                shopId: siteId,
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
                New Wix Connection
                <IconButton size="small" onClick={handleClose}><CloseIcon fontSize="small" /></IconButton>
            </DialogTitle>
            <DialogContent dividers sx={{ p: 0 }}>
                <Accordion disableGutters elevation={0} sx={{ borderBottom: "1px solid #e5e7eb", "&:before": { display: "none" } }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 3, py: 1.5, bgcolor: "#eef4ff" }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: WIX_COLOR, flexShrink: 0 }} />
                            <Typography variant="body2" fontWeight={600} color={WIX_COLOR}>
                                First time? How to get your API key &amp; Site ID
                            </Typography>
                        </Stack>
                    </AccordionSummary>
                    <AccordionDetails sx={{ px: 3, pb: 2.5, bgcolor: "#eef4ff" }}>
                        <Stack spacing={2}>
                            {SETUP_STEPS.map(({ step, title, detail, link }) => (
                                <Stack key={step} direction="row" spacing={1.5} alignItems="flex-start">
                                    <Box sx={{
                                        width: 22, height: 22, borderRadius: "50%", bgcolor: WIX_COLOR,
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
                                                sx={{ mt: 0.5, p: 0, fontSize: "0.72rem", color: WIX_COLOR, minWidth: 0, textTransform: "none" }}
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
                    <TextField fullWidth size="small" label="Display Name" placeholder="My Wix Store"
                        value={displayName} onChange={e => setDisplayName(e.target.value)} />
                    <TextField fullWidth size="small" label="API Key"
                        value={apiKey} onChange={e => setApiKey(e.target.value)}
                        helperText="Wix Dashboard → Settings → Advanced → API Keys" />
                    <TextField fullWidth size="small" label="Site ID"
                        value={siteId} onChange={e => setSiteId(e.target.value)}
                        helperText="Wix Dashboard → Settings → General Info → Site ID" />
                </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={handleClose}>Cancel</Button>
                <Button
                    variant="contained" onClick={sub}
                    disabled={saving || !displayName || !apiKey || !siteId}
                    sx={{ bgcolor: WIX_COLOR, "&:hover": { bgcolor: "#0857d6" } }}
                    startIcon={saving ? <CircularProgress size={14} color="inherit" /> : null}
                >
                    Connect
                </Button>
            </DialogActions>
        </Dialog>
    );
}

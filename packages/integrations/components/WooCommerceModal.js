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

const WOO_COLOR = "#7f54b3";

const SETUP_STEPS = [
    {
        step: "1",
        title: "Open WooCommerce Settings",
        detail: "In your WordPress dashboard go to WooCommerce → Settings → Advanced → REST API.",
        link: { label: "WooCommerce REST API Settings", href: "https://woocommerce.github.io/woocommerce-rest-api-docs/" },
    },
    {
        step: "2",
        title: "Generate API Keys",
        detail: "Click 'Add key', set Permissions to 'Read/Write', and click 'Generate API key'. Copy the Consumer Key and Consumer Secret.",
    },
    {
        step: "3",
        title: "Your Store URL",
        detail: "Use your store's base domain (e.g. https://mystore.com). WordPress pretty permalinks must be enabled.",
    },
];

export function WooCommerceModal({ open, setOpen, provider, apiConnections, setConnections }) {
    const [displayName,     setDisplayName]     = useState("");
    const [storeUrl,        setStoreUrl]        = useState("");
    const [consumerKey,     setConsumerKey]     = useState("");
    const [consumerSecret,  setConsumerSecret]  = useState("");
    const [saving,          setSaving]          = useState(false);
    const [error,           setError]           = useState("");

    const reset = () => { setDisplayName(""); setStoreUrl(""); setConsumerKey(""); setConsumerSecret(""); setError(""); };
    const handleClose = () => { reset(); setOpen(false); };

    const sub = async () => {
        if (!displayName || !storeUrl || !consumerKey || !consumerSecret) { setError("All fields are required"); return; }
        setSaving(true); setError("");
        try {
            const res = await axios.post("/api/admin/integrations", {
                type: "woocommerce",
                displayName,
                apiKey:     consumerKey,
                apiSecret:  consumerSecret,
                shopId:     storeUrl.replace(/\/$/, ""),
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
                New WooCommerce Connection
                <IconButton size="small" onClick={handleClose}><CloseIcon fontSize="small" /></IconButton>
            </DialogTitle>
            <DialogContent dividers sx={{ p: 0 }}>
                <Accordion disableGutters elevation={0} sx={{ borderBottom: "1px solid #e5e7eb", "&:before": { display: "none" } }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 3, py: 1.5, bgcolor: "#f5f0ff" }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: WOO_COLOR, flexShrink: 0 }} />
                            <Typography variant="body2" fontWeight={600} color={WOO_COLOR}>
                                First time? How to get your API keys
                            </Typography>
                        </Stack>
                    </AccordionSummary>
                    <AccordionDetails sx={{ px: 3, pb: 2.5, bgcolor: "#f5f0ff" }}>
                        <Stack spacing={2}>
                            {SETUP_STEPS.map(({ step, title, detail, link }) => (
                                <Stack key={step} direction="row" spacing={1.5} alignItems="flex-start">
                                    <Box sx={{
                                        width: 22, height: 22, borderRadius: "50%", bgcolor: WOO_COLOR,
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
                                                sx={{ mt: 0.5, p: 0, fontSize: "0.72rem", color: WOO_COLOR, minWidth: 0, textTransform: "none" }}
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
                    <TextField fullWidth size="small" label="Display Name" placeholder="My WooCommerce Store"
                        value={displayName} onChange={e => setDisplayName(e.target.value)} />
                    <TextField fullWidth size="small" label="Store URL" placeholder="https://mystore.com"
                        value={storeUrl} onChange={e => setStoreUrl(e.target.value)}
                        helperText="Your WordPress site base URL (with HTTPS)" />
                    <TextField fullWidth size="small" label="Consumer Key"
                        value={consumerKey} onChange={e => setConsumerKey(e.target.value)}
                        helperText="WooCommerce → Settings → Advanced → REST API" />
                    <TextField fullWidth size="small" label="Consumer Secret"
                        value={consumerSecret} onChange={e => setConsumerSecret(e.target.value)} />
                </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={handleClose}>Cancel</Button>
                <Button
                    variant="contained" onClick={sub}
                    disabled={saving || !displayName || !storeUrl || !consumerKey || !consumerSecret}
                    sx={{ bgcolor: WOO_COLOR, "&:hover": { bgcolor: "#6a4498" } }}
                    startIcon={saving ? <CircularProgress size={14} color="inherit" /> : null}
                >
                    Connect
                </Button>
            </DialogActions>
        </Dialog>
    );
}

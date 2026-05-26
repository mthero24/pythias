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

const META_COLOR = "#0866FF";

const SETUP_STEPS = [
    {
        step: "1",
        title: "Create a Meta App",
        detail: "Go to Meta for Developers → My Apps → Create App. Select 'Business' as the app type.",
        link: { label: "Meta for Developers", href: "https://developers.facebook.com/apps/" },
    },
    {
        step: "2",
        title: "Enable Commerce Platform",
        detail: "Add the Commerce Platform product to your app. Ensure your Facebook Page is linked to a Commerce Account in Meta Commerce Manager.",
    },
    {
        step: "3",
        title: "Generate an Access Token",
        detail: "Generate a Page access token with commerce_manage_orders and catalog_management permissions. Your Page ID is the numeric ID found in your Facebook Page settings.",
    },
];

export function MetaModal({ open, setOpen, provider, apiConnections, setConnections }) {
    const [displayName, setDisplayName] = useState("");
    const [accessToken,  setAccessToken]  = useState("");
    const [pageId,       setPageId]       = useState("");
    const [saving,       setSaving]       = useState(false);
    const [error,        setError]        = useState("");

    const reset = () => { setDisplayName(""); setAccessToken(""); setPageId(""); setError(""); };
    const handleClose = () => { reset(); setOpen(false); };

    const sub = async () => {
        if (!displayName || !accessToken || !pageId) { setError("All fields are required"); return; }
        setSaving(true); setError("");
        try {
            const res = await axios.post("/api/admin/integrations", {
                type: "meta",
                displayName,
                apiKey:  accessToken,
                shopId:  pageId,
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
                New Meta Shops Connection
                <IconButton size="small" onClick={handleClose}><CloseIcon fontSize="small" /></IconButton>
            </DialogTitle>
            <DialogContent dividers sx={{ p: 0 }}>
                <Accordion disableGutters elevation={0} sx={{ borderBottom: "1px solid #e5e7eb", "&:before": { display: "none" } }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 3, py: 1.5, bgcolor: "#eff6ff" }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: META_COLOR, flexShrink: 0 }} />
                            <Typography variant="body2" fontWeight={600} color={META_COLOR}>First time? How to connect Meta Shops</Typography>
                        </Stack>
                    </AccordionSummary>
                    <AccordionDetails sx={{ px: 3, pb: 2.5, bgcolor: "#eff6ff" }}>
                        <Stack spacing={2}>
                            {SETUP_STEPS.map(({ step, title, detail, link }) => (
                                <Stack key={step} direction="row" spacing={1.5} alignItems="flex-start">
                                    <Box sx={{ width: 22, height: 22, borderRadius: "50%", bgcolor: META_COLOR, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, mt: 0.1 }}>
                                        <Typography sx={{ fontSize: "0.65rem", fontWeight: 700, color: "#fff" }}>{step}</Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="body2" fontWeight={600} sx={{ mb: 0.25 }}>{title}</Typography>
                                        <Typography variant="caption" color="text.secondary" display="block" sx={{ lineHeight: 1.5 }}>{detail}</Typography>
                                        {link && (
                                            <Button size="small" variant="text" href={link.href} target="_blank" rel="noopener noreferrer"
                                                endIcon={<OpenInNewIcon sx={{ fontSize: 12 }} />}
                                                sx={{ mt: 0.5, p: 0, fontSize: "0.72rem", color: META_COLOR, minWidth: 0, textTransform: "none" }}>
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
                    <TextField fullWidth size="small" label="Display Name" placeholder="My Facebook Shop"
                        value={displayName} onChange={e => setDisplayName(e.target.value)} />
                    <TextField fullWidth size="small" label="Page ID" placeholder="123456789012345"
                        value={pageId} onChange={e => setPageId(e.target.value)}
                        helperText="Your Facebook Page numeric ID (also used as Commerce Account ID)" />
                    <TextField fullWidth size="small" label="Access Token" multiline rows={2}
                        value={accessToken} onChange={e => setAccessToken(e.target.value)}
                        helperText="Page access token with commerce_manage_orders permission" />
                </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={handleClose}>Cancel</Button>
                <Button variant="contained" onClick={sub}
                    disabled={saving || !displayName || !accessToken || !pageId}
                    sx={{ bgcolor: META_COLOR, "&:hover": { bgcolor: "#0557d5" } }}
                    startIcon={saving ? <CircularProgress size={14} color="inherit" /> : null}>
                    Connect
                </Button>
            </DialogActions>
        </Dialog>
    );
}

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

const RITHUM_COLOR = "#1a1a2e";

const SETUP_STEPS = [
    {
        step: "1",
        title: "Open the ChannelAdvisor Developer Console",
        detail: "Log in to ChannelAdvisor (now Rithum) and go to Settings → Developer Console to create or find your application.",
        link: { label: "ChannelAdvisor Developer Console", href: "https://api.channeladvisor.com/developerconsole" },
    },
    {
        step: "2",
        title: "Authorize Your Account",
        detail: "Complete the OAuth authorization flow for your seller account to get a refresh token. The refresh token is long-lived and used to obtain short-lived access tokens.",
    },
    {
        step: "3",
        title: "Find Your Profile ID",
        detail: "Your Profile ID is the numeric ID associated with your ChannelAdvisor seller account. It appears in the URL when logged in or under account settings.",
    },
];

export function RithumModal({ open, setOpen, provider, apiConnections, setConnections }) {
    const [displayName,   setDisplayName]   = useState("");
    const [refreshToken,  setRefreshToken]  = useState("");
    const [profileId,     setProfileId]     = useState("");
    const [saving,        setSaving]        = useState(false);
    const [error,         setError]         = useState("");

    const reset = () => { setDisplayName(""); setRefreshToken(""); setProfileId(""); setError(""); };
    const handleClose = () => { reset(); setOpen(false); };

    const sub = async () => {
        if (!displayName || !refreshToken) { setError("Display Name and Refresh Token are required"); return; }
        setSaving(true); setError("");
        try {
            const res = await axios.post("/api/admin/integrations", {
                type: "rithum",
                displayName,
                apiKey:  refreshToken,
                shopId:  profileId || undefined,
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
                New Rithum Connection
                <IconButton size="small" onClick={handleClose}><CloseIcon fontSize="small" /></IconButton>
            </DialogTitle>
            <DialogContent dividers sx={{ p: 0 }}>
                <Accordion disableGutters elevation={0} sx={{ borderBottom: "1px solid #e5e7eb", "&:before": { display: "none" } }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 3, py: 1.5, bgcolor: "#f0f0f8" }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: RITHUM_COLOR, flexShrink: 0 }} />
                            <Typography variant="body2" fontWeight={600} color={RITHUM_COLOR}>First time? How to get your credentials</Typography>
                        </Stack>
                    </AccordionSummary>
                    <AccordionDetails sx={{ px: 3, pb: 2.5, bgcolor: "#f0f0f8" }}>
                        <Stack spacing={2}>
                            {SETUP_STEPS.map(({ step, title, detail, link }) => (
                                <Stack key={step} direction="row" spacing={1.5} alignItems="flex-start">
                                    <Box sx={{ width: 22, height: 22, borderRadius: "50%", bgcolor: RITHUM_COLOR, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, mt: 0.1 }}>
                                        <Typography sx={{ fontSize: "0.65rem", fontWeight: 700, color: "#fff" }}>{step}</Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="body2" fontWeight={600} sx={{ mb: 0.25 }}>{title}</Typography>
                                        <Typography variant="caption" color="text.secondary" display="block" sx={{ lineHeight: 1.5 }}>{detail}</Typography>
                                        {link && (
                                            <Button size="small" variant="text" href={link.href} target="_blank" rel="noopener noreferrer"
                                                endIcon={<OpenInNewIcon sx={{ fontSize: 12 }} />}
                                                sx={{ mt: 0.5, p: 0, fontSize: "0.72rem", color: RITHUM_COLOR, minWidth: 0, textTransform: "none" }}>
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
                    <TextField fullWidth size="small" label="Display Name" placeholder="My Rithum Account"
                        value={displayName} onChange={e => setDisplayName(e.target.value)} />
                    <TextField fullWidth size="small" label="Refresh Token"
                        value={refreshToken} onChange={e => setRefreshToken(e.target.value)}
                        helperText="Long-lived OAuth refresh token from the ChannelAdvisor developer console" />
                    <TextField fullWidth size="small" label="Profile ID (optional)"
                        value={profileId} onChange={e => setProfileId(e.target.value)}
                        helperText="Your numeric ChannelAdvisor seller profile ID" />
                </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={handleClose}>Cancel</Button>
                <Button variant="contained" onClick={sub}
                    disabled={saving || !displayName || !refreshToken}
                    sx={{ bgcolor: RITHUM_COLOR, "&:hover": { bgcolor: "#2d2d4e" } }}
                    startIcon={saving ? <CircularProgress size={14} color="inherit" /> : null}>
                    Connect
                </Button>
            </DialogActions>
        </Dialog>
    );
}

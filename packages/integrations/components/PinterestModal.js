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

const PIN_COLOR = "#E60023";

const SETUP_STEPS = [
    {
        step: "1",
        title: "Create a Pinterest App",
        detail: "Go to developers.pinterest.com → My Apps → Create App. Request the catalogs:read and catalogs:write scopes.",
        link: { label: "Pinterest Developer Portal", href: "https://developers.pinterest.com/apps/" },
    },
    {
        step: "2",
        title: "Create a Catalog",
        detail: "In your Pinterest Business account, go to Ads → Catalogs and create a new catalog. Copy the Catalog ID.",
    },
    {
        step: "3",
        title: "Generate an Access Token",
        detail: "Use the OAuth 2.0 Authorization Code flow to generate an access token with catalogs:read and catalogs:write scopes.",
    },
];

export function PinterestModal({ open, setOpen, provider, apiConnections, setConnections }) {
    const [displayName,  setDisplayName]  = useState("");
    const [accessToken,  setAccessToken]  = useState("");
    const [catalogId,    setCatalogId]    = useState("");
    const [saving,       setSaving]       = useState(false);
    const [error,        setError]        = useState("");

    const reset = () => { setDisplayName(""); setAccessToken(""); setCatalogId(""); setError(""); };
    const handleClose = () => { reset(); setOpen(false); };

    const sub = async () => {
        if (!displayName || !accessToken || !catalogId) { setError("All fields are required"); return; }
        setSaving(true); setError("");
        try {
            const res = await axios.post("/api/admin/integrations", {
                type: "pinterest",
                displayName,
                apiKey: accessToken,
                shopId: catalogId,
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
                New Pinterest Shopping Connection
                <IconButton size="small" onClick={handleClose}><CloseIcon fontSize="small" /></IconButton>
            </DialogTitle>
            <DialogContent dividers sx={{ p: 0 }}>
                <Accordion disableGutters elevation={0} sx={{ borderBottom: "1px solid #e5e7eb", "&:before": { display: "none" } }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 3, py: 1.5, bgcolor: "#fff5f5" }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: PIN_COLOR, flexShrink: 0 }} />
                            <Typography variant="body2" fontWeight={600} color={PIN_COLOR}>First time? How to connect Pinterest Shopping</Typography>
                        </Stack>
                    </AccordionSummary>
                    <AccordionDetails sx={{ px: 3, pb: 2.5, bgcolor: "#fff5f5" }}>
                        <Stack spacing={2}>
                            {SETUP_STEPS.map(({ step, title, detail, link }) => (
                                <Stack key={step} direction="row" spacing={1.5} alignItems="flex-start">
                                    <Box sx={{ width: 22, height: 22, borderRadius: "50%", bgcolor: PIN_COLOR, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, mt: 0.1 }}>
                                        <Typography sx={{ fontSize: "0.65rem", fontWeight: 700, color: "#fff" }}>{step}</Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="body2" fontWeight={600} sx={{ mb: 0.25 }}>{title}</Typography>
                                        <Typography variant="caption" color="text.secondary" display="block" sx={{ lineHeight: 1.5 }}>{detail}</Typography>
                                        {link && (
                                            <Button size="small" variant="text" href={link.href} target="_blank" rel="noopener noreferrer"
                                                endIcon={<OpenInNewIcon sx={{ fontSize: 12 }} />}
                                                sx={{ mt: 0.5, p: 0, fontSize: "0.72rem", color: PIN_COLOR, minWidth: 0, textTransform: "none" }}>
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
                    <TextField fullWidth size="small" label="Display Name" placeholder="My Pinterest Shop"
                        value={displayName} onChange={e => setDisplayName(e.target.value)} />
                    <TextField fullWidth size="small" label="Catalog ID"
                        value={catalogId} onChange={e => setCatalogId(e.target.value)}
                        helperText="Found in Pinterest Business → Ads → Catalogs" />
                    <TextField fullWidth size="small" label="Access Token" multiline rows={2}
                        value={accessToken} onChange={e => setAccessToken(e.target.value)}
                        helperText="OAuth access token with catalogs:read and catalogs:write scopes" />
                </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={handleClose}>Cancel</Button>
                <Button variant="contained" onClick={sub}
                    disabled={saving || !displayName || !accessToken || !catalogId}
                    sx={{ bgcolor: PIN_COLOR, "&:hover": { bgcolor: "#c0001e" } }}
                    startIcon={saving ? <CircularProgress size={14} color="inherit" /> : null}>
                    Connect
                </Button>
            </DialogActions>
        </Dialog>
    );
}

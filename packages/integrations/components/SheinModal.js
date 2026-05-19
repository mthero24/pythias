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
        title: "Apply for SHEIN Open Platform",
        detail: "Visit the SHEIN Open Platform and submit a seller application. SHEIN reviews applications manually — approval can take several days.",
        link: { label: "SHEIN Open Platform", href: "https://openplatform.shein.com/" },
    },
    {
        step: "2",
        title: "Create an App",
        detail: "After approval, log in to the Open Platform portal. Go to App Management → Create App. Fill in the app name and description.",
    },
    {
        step: "3",
        title: "Copy your Open Key ID & Secret Key",
        detail: "Once the app is created, open its details page. Copy the Open Key ID and Secret Key — the secret key is only shown once.",
    },
    {
        step: "4",
        title: "Find your Category ID (optional)",
        detail: "In the Open Platform portal browse the product category tree to find the numeric Category ID that best matches your products.",
    },
];

export function SheinModal({ open, setOpen, provider, setConnections }) {
    const [displayName, setDisplayName] = useState("");
    const [openKeyId,   setOpenKeyId]   = useState("");
    const [secretKey,   setSecretKey]   = useState("");
    const [categoryId,  setCategoryId]  = useState("");
    const [saving,      setSaving]      = useState(false);
    const [error,       setError]       = useState("");

    const reset = () => { setDisplayName(""); setOpenKeyId(""); setSecretKey(""); setCategoryId(""); setError(""); };
    const handleClose = () => { reset(); setOpen(false); };

    const sub = async () => {
        if (!displayName || !openKeyId || !secretKey) {
            setError("Display Name, Open Key ID, and Secret Key are required"); return;
        }
        setSaving(true); setError("");
        try {
            const res = await axios.post("/api/admin/integrations", {
                type: "shein",
                displayName,
                apiKey: openKeyId,
                apiSecret: secretKey,
                organization: categoryId,
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
                New SHEIN Connection
                <IconButton size="small" onClick={handleClose}><CloseIcon fontSize="small" /></IconButton>
            </DialogTitle>
            <DialogContent dividers sx={{ p: 0 }}>
                <Accordion disableGutters elevation={0} sx={{ borderBottom: "1px solid #e5e7eb", "&:before": { display: "none" } }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 3, py: 1.5, bgcolor: "#f5f5f5" }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#000", flexShrink: 0 }} />
                            <Typography variant="body2" fontWeight={600} color="#111">
                                First time? How to get your credentials
                            </Typography>
                        </Stack>
                    </AccordionSummary>
                    <AccordionDetails sx={{ px: 3, pb: 2.5, bgcolor: "#f5f5f5" }}>
                        <Stack spacing={2}>
                            {SETUP_STEPS.map(({ step, title, detail, link }) => (
                                <Stack key={step} direction="row" spacing={1.5} alignItems="flex-start">
                                    <Box sx={{
                                        width: 22, height: 22, borderRadius: "50%", bgcolor: "#000",
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
                                                sx={{ mt: 0.5, p: 0, fontSize: "0.72rem", color: "#555", minWidth: 0, textTransform: "none" }}
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
                        fullWidth size="small" label="Open Key ID"
                        value={openKeyId}
                        onChange={e => setOpenKeyId(e.target.value)}
                        helperText="App Management → app details → Open Key ID"
                    />
                    <TextField
                        fullWidth size="small" label="Secret Key" type="password"
                        value={secretKey}
                        onChange={e => setSecretKey(e.target.value)}
                        helperText="App Management → app details → Secret Key"
                    />
                    <TextField
                        fullWidth size="small" label="Default Category ID (optional)"
                        value={categoryId}
                        onChange={e => setCategoryId(e.target.value)}
                        helperText="SHEIN category ID for product listing"
                    />
                </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={handleClose}>Cancel</Button>
                <Button
                    variant="contained" onClick={sub}
                    disabled={saving || !displayName || !openKeyId || !secretKey}
                    sx={{ bgcolor: "#000", "&:hover": { bgcolor: "#222" } }}
                    startIcon={saving ? <CircularProgress size={14} color="inherit" /> : null}
                >
                    Connect
                </Button>
            </DialogActions>
        </Dialog>
    );
}

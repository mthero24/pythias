"use client";
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Button, Stack, Alert, CircularProgress, IconButton,
    Accordion, AccordionSummary, AccordionDetails,
    Typography, Box, Select, MenuItem, FormControl, InputLabel,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useState } from "react";
import axios from "axios";

const NOON_COUNTRIES = [
    { label: "UAE (United Arab Emirates)", value: "https://api.noon.com/seller-center/api/v1" },
    { label: "Saudi Arabia",               value: "https://api.noon.com/seller-center/api/v1" },
    { label: "Egypt",                      value: "https://api.noon.com/seller-center/api/v1" },
];

const SETUP_STEPS = [
    {
        step: "1",
        title: "Request API access from Noon",
        detail: "Noon's API is not self-serve. Email seller@noon.com or log in to noon-docs.noonpartners.dev with your seller account to get API documentation and credentials.",
    },
    {
        step: "2",
        title: "Create an API user in Noon Partner Dashboard",
        detail: "In Settings → API Settings, create a new API user with account type \"apijwt\" and the Project Owner role. This generates your JWT token.",
    },
    {
        step: "3",
        title: "Enter credentials below",
        detail: "Paste your JWT token as the API Key. Select your country/region. The connection will appear in Active Connections.",
    },
];

export function NoonModal({ open, setOpen, provider, setConnections }) {
    const [displayName, setDisplayName] = useState("");
    const [apiKey,      setApiKey]      = useState("");
    const [country,     setCountry]     = useState(NOON_COUNTRIES[0].value);
    const [saving,      setSaving]      = useState(false);
    const [error,       setError]       = useState("");

    const reset = () => { setDisplayName(""); setApiKey(""); setCountry(NOON_COUNTRIES[0].value); setError(""); };
    const handleClose = () => { reset(); setOpen(false); };

    const sub = async () => {
        if (!displayName || !apiKey) { setError("Display name and API key are required"); return; }
        setSaving(true); setError("");
        try {
            const res = await axios.post("/api/admin/integrations", {
                type: "noon",
                displayName,
                apiKey,
                organization: country,
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
                New Noon Connection
                <IconButton size="small" onClick={handleClose}><CloseIcon fontSize="small" /></IconButton>
            </DialogTitle>
            <DialogContent dividers sx={{ p: 0 }}>
                <Accordion disableGutters elevation={0} sx={{ borderBottom: "1px solid #e5e7eb", "&:before": { display: "none" } }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 3, py: 1.5, bgcolor: "#fdf4e7" }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#f59e0b", flexShrink: 0 }} />
                            <Typography variant="body2" fontWeight={600} color="#92400e">
                                First time? How to get your API key
                            </Typography>
                        </Stack>
                    </AccordionSummary>
                    <AccordionDetails sx={{ px: 3, pb: 2.5, bgcolor: "#fdf4e7" }}>
                        <Stack spacing={2}>
                            {SETUP_STEPS.map(({ step, title, detail }) => (
                                <Stack key={step} direction="row" spacing={1.5} alignItems="flex-start">
                                    <Box sx={{
                                        width: 22, height: 22, borderRadius: "50%", bgcolor: "#f59e0b",
                                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, mt: 0.1,
                                    }}>
                                        <Typography sx={{ fontSize: "0.65rem", fontWeight: 700, color: "#fff" }}>{step}</Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="body2" fontWeight={600} sx={{ mb: 0.25 }}>{title}</Typography>
                                        <Typography variant="caption" color="text.secondary" display="block" sx={{ lineHeight: 1.5 }}>
                                            {detail}
                                        </Typography>
                                    </Box>
                                </Stack>
                            ))}
                        </Stack>
                    </AccordionDetails>
                </Accordion>

                <Stack spacing={2} sx={{ pt: 2, px: 3, pb: 1 }}>
                    {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}
                    <TextField
                        fullWidth size="small" label="Display Name"
                        value={displayName}
                        onChange={e => setDisplayName(e.target.value)}
                        placeholder="e.g. Noon UAE Store"
                    />
                    <FormControl fullWidth size="small">
                        <InputLabel>Country / Region</InputLabel>
                        <Select value={country} label="Country / Region" onChange={e => setCountry(e.target.value)}>
                            {NOON_COUNTRIES.map(c => (
                                <MenuItem key={c.label} value={c.value}>{c.label}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <TextField
                        fullWidth size="small" label="API Key"
                        value={apiKey}
                        onChange={e => setApiKey(e.target.value)}
                        helperText="Settings → API Integration in Noon Seller Center"
                    />
                </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={handleClose}>Cancel</Button>
                <Button
                    variant="contained" onClick={sub}
                    disabled={saving || !displayName || !apiKey}
                    sx={{ bgcolor: "#f59e0b", color: "#111", "&:hover": { bgcolor: "#d97706" } }}
                    startIcon={saving ? <CircularProgress size={14} color="inherit" /> : null}
                >
                    Connect
                </Button>
            </DialogActions>
        </Dialog>
    );
}

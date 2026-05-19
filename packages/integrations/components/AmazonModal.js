"use client";
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Button, Stack, Alert, CircularProgress, IconButton,
    MenuItem, Select, FormControl, InputLabel,
    Accordion, AccordionSummary, AccordionDetails,
    Typography, Box, Divider,
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
        title: "Register as a Private Developer",
        detail: 'In Seller Central go to Apps & Services → Develop Apps → click "Add new app client". Choose Private Developer. Amazon will review — expect 5–7 days.',
        link: { label: "Open Seller Central", href: "https://sellercentral.amazon.com/apps/manage" },
    },
    {
        step: "2",
        title: "Get your LWA credentials",
        detail: 'After approval, open your app in the Developer Console. Copy the LWA Client ID and LWA Client Secret from the app details page.',
    },
    {
        step: "3",
        title: "Authorize the app & get your Refresh Token",
        detail: 'In the Developer Console click "Authorize" on your app. Complete the OAuth flow for your own selling account. Copy the Refresh Token from the confirmation screen.',
    },
    {
        step: "4",
        title: "Find your Seller ID",
        detail: 'In Seller Central go to Account Info → Business Information → Merchant Token. Copy that value — it is your Seller ID.',
        link: { label: "Open Account Info", href: "https://sellercentral.amazon.com/sw/AccountInfo/MerchantToken/step/MerchantToken" },
    },
];

const MARKETPLACES = [
    { id: "ATVPDKIKX0DER", label: "US — amazon.com" },
    { id: "A2EUQ1WTGCTBG2", label: "CA — amazon.ca" },
    { id: "A1AM78C64UM0Y8", label: "MX — amazon.com.mx" },
    { id: "A1F83G8C2ARO7P", label: "UK — amazon.co.uk" },
    { id: "A1PA6795UKMFR9", label: "DE — amazon.de" },
    { id: "APJ6JRA9NG5V4",  label: "IT — amazon.it" },
    { id: "A13V1IB3VIYZZH", label: "FR — amazon.fr" },
    { id: "A1RKKUPIHCS9HS", label: "ES — amazon.es" },
];

export function AmazonModal({ open, setOpen, provider, setConnections }) {
    const [displayName,  setDisplayName]  = useState("");
    const [clientId,     setClientId]     = useState("");
    const [clientSecret, setClientSecret] = useState("");
    const [refreshToken, setRefreshToken] = useState("");
    const [sellerId,     setSellerId]     = useState("");
    const [marketplace,  setMarketplace]  = useState("ATVPDKIKX0DER");
    const [testing,      setTesting]      = useState(false);
    const [tested,       setTested]       = useState(null);
    const [saving,       setSaving]       = useState(false);
    const [error,        setError]        = useState("");

    const reset = () => {
        setDisplayName(""); setClientId(""); setClientSecret(""); setRefreshToken("");
        setSellerId(""); setMarketplace("ATVPDKIKX0DER"); setTested(null); setError("");
    };
    const handleClose = () => { reset(); setOpen(false); };

    const testConnection = async () => {
        if (!clientId || !clientSecret || !refreshToken) {
            setError("Client ID, Secret, and Refresh Token are required"); return;
        }
        setTesting(true); setTested(null); setError("");
        try {
            const res = await axios.post("/api/integrations/amazon/test", { clientId, clientSecret, refreshToken });
            setTested(res.data.ok ? "ok" : "fail");
            if (!res.data.ok) setError(res.data.error ?? "Connection failed");
        } catch (e) {
            setTested("fail");
            setError(e.response?.data?.error ?? "Connection test failed");
        } finally { setTesting(false); }
    };

    const sub = async () => {
        if (!displayName || !clientId || !clientSecret || !refreshToken || !sellerId) {
            setError("All fields are required"); return;
        }
        setSaving(true); setError("");
        try {
            const res = await axios.post("/api/admin/integrations", {
                type:         "amazon",
                displayName,
                apiKey:       clientId,
                apiSecret:    clientSecret,
                refreshToken,
                organization: sellerId,
                shopId:       marketplace,
                provider,
            });
            if (res?.data?.error) { setError(res.data.msg ?? "Save failed"); }
            else { setConnections(res.data.integrations); handleClose(); }
        } catch (e) {
            setError(e.response?.data?.error ?? "Save failed");
        } finally { setSaving(false); }
    };

    const credsFilled = clientId && clientSecret && refreshToken;

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ fontWeight: 700, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                New Amazon Connection
                <IconButton size="small" onClick={handleClose}><CloseIcon fontSize="small" /></IconButton>
            </DialogTitle>
            <DialogContent dividers sx={{ p: 0 }}>
                {/* Setup guide */}
                <Accordion disableGutters elevation={0} sx={{ borderBottom: "1px solid #e5e7eb", "&:before": { display: "none" } }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 3, py: 1.5, bgcolor: "#fffbf5" }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#FF9900", flexShrink: 0 }} />
                            <Typography variant="body2" fontWeight={600} color="#92400e">
                                First time? How to get your credentials
                            </Typography>
                        </Stack>
                    </AccordionSummary>
                    <AccordionDetails sx={{ px: 3, pb: 2.5, bgcolor: "#fffbf5" }}>
                        <Stack spacing={2}>
                            {SETUP_STEPS.map(({ step, title, detail, link }) => (
                                <Stack key={step} direction="row" spacing={1.5} alignItems="flex-start">
                                    <Box sx={{
                                        width: 22, height: 22, borderRadius: "50%", bgcolor: "#FF9900",
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
                                                sx={{ mt: 0.5, p: 0, fontSize: "0.72rem", color: "#FF9900", minWidth: 0, textTransform: "none" }}
                                            >
                                                {link.label}
                                            </Button>
                                        )}
                                    </Box>
                                </Stack>
                            ))}
                            <Alert severity="info" sx={{ mt: 0.5, fontSize: "0.75rem", py: 0.5 }}>
                                Private developer registration is free and exempt from Amazon's 2026 SP-API subscription fees.
                            </Alert>
                        </Stack>
                    </AccordionDetails>
                </Accordion>

                <Stack spacing={2} sx={{ pt: 2, px: 3, pb: 1 }}>
                    {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}
                    {tested === "ok" && <Alert severity="success" icon={<CheckCircleIcon />}>Connection verified</Alert>}
                    <TextField
                        fullWidth size="small" label="Display Name"
                        value={displayName} onChange={e => setDisplayName(e.target.value)}
                    />
                    <TextField
                        fullWidth size="small" label="LWA Client ID"
                        value={clientId} onChange={e => { setClientId(e.target.value); setTested(null); }}
                    />
                    <TextField
                        fullWidth size="small" label="LWA Client Secret" type="password"
                        value={clientSecret} onChange={e => { setClientSecret(e.target.value); setTested(null); }}
                    />
                    <TextField
                        fullWidth size="small" label="LWA Refresh Token" type="password"
                        value={refreshToken} onChange={e => { setRefreshToken(e.target.value); setTested(null); }}
                        helperText="Seller Central → Apps & Services → Develop Apps → Authorize"
                    />
                    <TextField
                        fullWidth size="small" label="Seller ID"
                        value={sellerId} onChange={e => setSellerId(e.target.value)}
                        helperText="Seller Central → Account Info → Merchant Token"
                    />
                    <FormControl fullWidth size="small">
                        <InputLabel>Marketplace</InputLabel>
                        <Select value={marketplace} label="Marketplace" onChange={e => setMarketplace(e.target.value)}>
                            {MARKETPLACES.map(m => (
                                <MenuItem key={m.id} value={m.id}>{m.label}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <Button
                        variant="outlined" size="small"
                        onClick={testConnection}
                        disabled={testing || !credsFilled}
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
                    disabled={saving || !displayName || !credsFilled || !sellerId}
                    sx={{ bgcolor: "#FF9900", "&:hover": { bgcolor: "#e88800" } }}
                    startIcon={saving ? <CircularProgress size={14} color="inherit" /> : null}
                >
                    Connect
                </Button>
            </DialogActions>
        </Dialog>
    );
}

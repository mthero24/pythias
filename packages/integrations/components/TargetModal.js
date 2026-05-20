"use client";
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Button, Stack, Alert, CircularProgress, IconButton,
    Accordion, AccordionSummary, AccordionDetails,
    Typography, Box,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { useState } from "react";
import axios from "axios";

const TARGET_RED = "#CC0000";

const SETUP_STEPS = [
    {
        step: "1",
        title: "Apply for Target Plus",
        detail: "Go to the Target Plus seller portal and submit an application. Target reviews applications individually — approval can take several weeks.",
        link: { label: "Apply at Target Plus", href: "https://plus.target.com/" },
    },
    {
        step: "2",
        title: "Get your API Key from developer.target.com",
        detail: 'After approval, go to developer.target.com and sign in. Navigate to My Apps → Create App to generate your API key (x-api-key). This is separate from your seller token.',
        link: { label: "Open Developer Portal", href: "https://developer.target.com/" },
    },
    {
        step: "3",
        title: "Find your Seller ID",
        detail: "In the Target Plus seller portal go to Business Info → Basic Info. Your Seller ID (SMS ID) is listed there — it looks like a MongoDB ObjectId (e.g. 5d9b63230b782d009720a6cb).",
        link: { label: "Open Target Plus Portal", href: "https://plus.target.com/" },
    },
    {
        step: "4",
        title: "Generate your Seller Token",
        detail: 'In the Target Plus portal go to Partner Settings → API Tokens → Generate Token. Copy it immediately — it is only shown once. This is your x-seller-token.',
    },
];

export function TargetModal({ open, setOpen, provider, setConnections }) {
    const [displayName,  setDisplayName]  = useState("");
    const [apiKey,       setApiKey]       = useState("");
    const [sellerId,     setSellerId]     = useState("");
    const [sellerToken,  setSellerToken]  = useState("");
    const [testing,      setTesting]      = useState(false);
    const [tested,       setTested]       = useState(null);
    const [saving,       setSaving]       = useState(false);
    const [error,        setError]        = useState("");

    const reset = () => {
        setDisplayName(""); setApiKey(""); setSellerId(""); setSellerToken("");
        setTested(null); setError("");
    };
    const handleClose = () => { reset(); setOpen(false); };

    const testConnection = async () => {
        if (!apiKey || !sellerId || !sellerToken) {
            setError("API Key, Seller ID, and Seller Token are required to test"); return;
        }
        setTesting(true); setTested(null); setError("");
        try {
            const res = await axios.post("/api/integrations/target/test", { apiKey, sellerId, sellerToken });
            setTested(res.data.ok ? "ok" : "fail");
            if (!res.data.ok) setError(res.data.error ?? "Connection failed");
        } catch (e) {
            setTested("fail");
            setError(e.response?.data?.error ?? "Connection test failed");
        } finally { setTesting(false); }
    };

    const sub = async () => {
        if (!displayName || !apiKey || !sellerId || !sellerToken) {
            setError("All fields are required"); return;
        }
        setSaving(true); setError("");
        try {
            const res = await axios.post("/api/admin/integrations", {
                type:         "target",
                displayName,
                apiKey,
                organization: sellerId,
                refreshToken: sellerToken,
                provider,
            });
            if (res?.data?.error) { setError(res.data.msg ?? "Save failed"); }
            else { setConnections(res.data.integrations); handleClose(); }
        } catch (e) {
            setError(e.response?.data?.error ?? "Save failed");
        } finally { setSaving(false); }
    };

    const credsFilled = apiKey && sellerId && sellerToken;

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ fontWeight: 700, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                New Target Plus Connection
                <IconButton size="small" onClick={handleClose}><CloseIcon fontSize="small" /></IconButton>
            </DialogTitle>
            <DialogContent dividers sx={{ p: 0 }}>
                <Accordion disableGutters elevation={0} sx={{ borderBottom: "1px solid #e5e7eb", "&:before": { display: "none" } }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 3, py: 1.5, bgcolor: "#fff5f5" }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: TARGET_RED, flexShrink: 0 }} />
                            <Typography variant="body2" fontWeight={600} color="#7f1d1d">
                                First time? How to get your credentials
                            </Typography>
                        </Stack>
                    </AccordionSummary>
                    <AccordionDetails sx={{ px: 3, pb: 2.5, bgcolor: "#fff5f5" }}>
                        <Stack spacing={2}>
                            {SETUP_STEPS.map(({ step, title, detail, link }) => (
                                <Stack key={step} direction="row" spacing={1.5} alignItems="flex-start">
                                    <Box sx={{
                                        width: 22, height: 22, borderRadius: "50%", bgcolor: TARGET_RED,
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
                                                sx={{ mt: 0.5, p: 0, fontSize: "0.72rem", color: TARGET_RED, minWidth: 0, textTransform: "none" }}
                                            >
                                                {link.label}
                                            </Button>
                                        )}
                                    </Box>
                                </Stack>
                            ))}
                            <Alert severity="info" sx={{ mt: 0.5, fontSize: "0.75rem", py: 0.5 }}>
                                The API Key (developer.target.com) and Seller Token (Target Plus portal) are two separate credentials — both are required.
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
                        fullWidth size="small" label="API Key"
                        value={apiKey}
                        onChange={e => { setApiKey(e.target.value); setTested(null); }}
                        helperText="From developer.target.com → My Apps (x-api-key header)"
                    />
                    <TextField
                        fullWidth size="small" label="Seller ID"
                        value={sellerId}
                        onChange={e => { setSellerId(e.target.value); setTested(null); }}
                        helperText="Target Plus Portal → Business Info → Basic Info (SMS ID)"
                    />
                    <TextField
                        fullWidth size="small" label="Seller Token" type="password"
                        value={sellerToken}
                        onChange={e => { setSellerToken(e.target.value); setTested(null); }}
                        helperText="Target Plus Portal → Partner Settings → API Tokens (x-seller-token)"
                    />
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
                    disabled={saving || !displayName || !credsFilled}
                    sx={{ bgcolor: TARGET_RED, "&:hover": { bgcolor: "#aa0000" } }}
                    startIcon={saving ? <CircularProgress size={14} color="inherit" /> : null}
                >
                    Connect
                </Button>
            </DialogActions>
        </Dialog>
    );
}

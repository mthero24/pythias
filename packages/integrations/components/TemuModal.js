"use client";
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Button, Stack, Alert, CircularProgress, IconButton, Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useState } from "react";
import axios from "axios";

export function TemuModal({ open, setOpen, provider, apiConnections, setConnections }) {
    const [displayName, setDisplayName] = useState("");
    const [appKey, setAppKey] = useState("");
    const [appSecret, setAppSecret] = useState("");
    const [accessToken, setAccessToken] = useState("");
    const [costTemplateId, setCostTemplateId] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const reset = () => {
        setDisplayName(""); setAppKey(""); setAppSecret("");
        setAccessToken(""); setCostTemplateId(""); setError("");
    };
    const handleClose = () => { reset(); setOpen(false); };

    const sub = async () => {
        if (!displayName || !appKey || !appSecret || !accessToken) {
            setError("Display Name, App Key, App Secret, and Access Token are required");
            return;
        }
        setSaving(true);
        setError("");
        try {
            const res = await axios.post("/api/admin/integrations", {
                type: "temu",
                displayName,
                apiKey: appKey,
                apiSecret: appSecret,
                refreshToken: accessToken,
                organization: costTemplateId,
                provider,
            });
            if (res?.data?.error) {
                setError(res.data.msg ?? "Save failed");
            } else {
                setConnections(res.data.integrations);
                handleClose();
            }
        } catch (e) {
            setError(e.response?.data?.error ?? "Save failed");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
            <DialogTitle sx={{ fontWeight: 700, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                New Temu Connection
                <IconButton size="small" onClick={handleClose}><CloseIcon fontSize="small" /></IconButton>
            </DialogTitle>
            <DialogContent dividers>
                <Stack spacing={2} sx={{ pt: 1 }}>
                    {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}
                    <Typography variant="body2" color="text.secondary">
                        Find your credentials in the Temu Open Platform portal under API Management.
                    </Typography>
                    <TextField fullWidth size="small" label="Display Name" value={displayName} onChange={e => setDisplayName(e.target.value)} />
                    <TextField
                        fullWidth size="small" label="App Key"
                        value={appKey}
                        onChange={e => setAppKey(e.target.value)}
                        helperText="Your Temu app_key"
                    />
                    <TextField
                        fullWidth size="small" label="App Secret"
                        type="password"
                        value={appSecret}
                        onChange={e => setAppSecret(e.target.value)}
                        helperText="Your Temu app_secret"
                    />
                    <TextField
                        fullWidth size="small" label="Access Token"
                        value={accessToken}
                        onChange={e => setAccessToken(e.target.value)}
                        helperText="Your Temu access_token (from OAuth)"
                    />
                    <TextField
                        fullWidth size="small" label="Default Cost Template ID (optional)"
                        value={costTemplateId}
                        onChange={e => setCostTemplateId(e.target.value)}
                        helperText="Temu shipping cost template ID"
                    />
                </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={handleClose}>Cancel</Button>
                <Button
                    variant="contained" onClick={sub}
                    disabled={saving || !displayName || !appKey || !appSecret || !accessToken}
                    sx={{ bgcolor: "#ff6500", "&:hover": { bgcolor: "#e05a00" } }}
                    startIcon={saving ? <CircularProgress size={14} color="inherit" /> : null}
                >
                    Connect
                </Button>
            </DialogActions>
        </Dialog>
    );
}

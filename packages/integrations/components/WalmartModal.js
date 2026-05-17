"use client";
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Button, Stack, Alert, CircularProgress, IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { useState } from "react";
import axios from "axios";

export function WalmartModal({ open, setOpen, provider, setConnections }) {
    const [displayName, setDisplayName] = useState("");
    const [clientId, setClientId] = useState("");
    const [clientSecret, setClientSecret] = useState("");
    const [partnerId, setPartnerId] = useState("");
    const [testing, setTesting] = useState(false);
    const [tested, setTested] = useState(null); // null | "ok" | "fail"
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const reset = () => {
        setDisplayName(""); setClientId(""); setClientSecret(""); setPartnerId("");
        setTested(null); setError("");
    };

    const handleClose = () => { reset(); setOpen(false); };

    const testConnection = async () => {
        if (!clientId || !clientSecret) { setError("Client ID and Secret are required to test"); return; }
        setTesting(true);
        setTested(null);
        setError("");
        try {
            const res = await axios.post("/api/integrations/walmart/test", { clientId, clientSecret });
            setTested(res.data.ok ? "ok" : "fail");
            if (!res.data.ok) setError(res.data.error ?? "Connection failed");
        } catch (e) {
            setTested("fail");
            setError(e.response?.data?.error ?? "Connection test failed");
        } finally {
            setTesting(false);
        }
    };

    const sub = async () => {
        if (!displayName || !clientId || !clientSecret || !partnerId) {
            setError("All fields are required");
            return;
        }
        setSaving(true);
        setError("");
        try {
            const res = await axios.post("/api/admin/integrations", {
                type: "walmart",
                displayName,
                apiKey: clientId,
                apiSecret: clientSecret,
                organization: partnerId,
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
                New Walmart Connection
                <IconButton size="small" onClick={handleClose}><CloseIcon fontSize="small" /></IconButton>
            </DialogTitle>
            <DialogContent dividers>
                <Stack spacing={2} sx={{ pt: 1 }}>
                    {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}
                    {tested === "ok" && <Alert severity="success" icon={<CheckCircleIcon />}>Connection verified</Alert>}
                    <TextField fullWidth size="small" label="Display Name" value={displayName} onChange={e => setDisplayName(e.target.value)} />
                    <TextField
                        fullWidth size="small" label="Client ID"
                        value={clientId}
                        onChange={e => { setClientId(e.target.value); setTested(null); }}
                    />
                    <TextField
                        fullWidth size="small" label="Client Secret" type="password"
                        value={clientSecret}
                        onChange={e => { setClientSecret(e.target.value); setTested(null); }}
                    />
                    <TextField
                        fullWidth size="small" label="Partner ID"
                        value={partnerId}
                        onChange={e => setPartnerId(e.target.value)}
                        helperText="Your Walmart Seller Partner ID"
                    />
                    <Button
                        variant="outlined" size="small"
                        onClick={testConnection}
                        disabled={testing || !clientId || !clientSecret}
                        startIcon={testing ? <CircularProgress size={14} /> : null}
                    >
                        {testing ? "Testing…" : "Test Connection"}
                    </Button>
                </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={handleClose}>Cancel</Button>
                <Button
                    variant="contained"
                    onClick={sub}
                    disabled={saving || !displayName || !clientId || !clientSecret || !partnerId}
                    sx={{ bgcolor: "#0071CE", "&:hover": { bgcolor: "#005da6" } }}
                    startIcon={saving ? <CircularProgress size={14} color="inherit" /> : null}
                >
                    Connect
                </Button>
            </DialogActions>
        </Dialog>
    );
}

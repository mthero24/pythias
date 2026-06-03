"use client";
import { useState, useEffect } from "react";
import { Box, Card, CardContent, Stack, TextField, Button, Typography, Alert, Chip } from "@mui/material";

export function Gs1Settings() {
    const [apiKey, setApiKey]           = useState("");
    const [accountNumber, setAccountNumber] = useState("");
    const [saving, setSaving]           = useState(false);
    const [msg, setMsg]                 = useState(null);

    useEffect(() => {
        fetch("/api/admin/settings/integrations")
            .then(r => r.json())
            .then(d => {
                if (d.creds?.gs1) {
                    setApiKey(d.creds.gs1.apiKey ?? "");
                    setAccountNumber(d.creds.gs1.accountNumber ?? "");
                }
            });
    }, []);

    const save = async () => {
        setSaving(true);
        setMsg(null);
        const res = await fetch("/api/admin/settings/integrations", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ gs1: { apiKey, accountNumber } }),
        });
        const d = await res.json();
        setMsg(d.error ? { type: "error", text: d.error } : { type: "success", text: "GS1 settings saved" });
        setSaving(false);
    };

    return (
        <Box sx={{ mt: 4 }}>
            <Typography variant="overline" color="text.secondary" fontWeight={700} letterSpacing={1.2}>
                GS1 / UPC
            </Typography>
            <Card variant="outlined" sx={{ mt: 1 }}>
                <CardContent>
                    <Stack spacing={2}>
                        <Box>
                            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.5 }}>GS1 US Credentials</Typography>
                            <Typography variant="body2" color="text.secondary">
                                Enter your GS1 US API credentials to enable UPC/GTIN generation. If not configured, UPCs will not be assigned when creating products.
                            </Typography>
                        </Box>
                        {apiKey ? (
                            <Chip label="GS1 configured — UPCs enabled" color="success" size="small" sx={{ alignSelf: "flex-start" }} />
                        ) : (
                            <Chip label="Not configured — UPCs disabled" color="warning" size="small" variant="outlined" sx={{ alignSelf: "flex-start" }} />
                        )}
                        <TextField
                            label="GS1 API Key"
                            type="password"
                            value={apiKey}
                            onChange={e => setApiKey(e.target.value)}
                            size="small"
                            fullWidth
                            autoComplete="off"
                        />
                        <TextField
                            label="GS1 Account Number"
                            value={accountNumber}
                            onChange={e => setAccountNumber(e.target.value)}
                            size="small"
                            fullWidth
                            helperText="X-Product-Owner-Account-Id used in GS1 US API requests"
                        />
                        {msg && <Alert severity={msg.type} onClose={() => setMsg(null)}>{msg.text}</Alert>}
                        <Box>
                            <Button variant="contained" size="small" disabled={saving} onClick={save}>
                                {saving ? "Saving..." : "Save GS1 Settings"}
                            </Button>
                        </Box>
                    </Stack>
                </CardContent>
            </Card>
        </Box>
    );
}

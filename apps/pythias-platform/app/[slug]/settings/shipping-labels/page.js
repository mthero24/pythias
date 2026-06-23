"use client";
import { useEffect, useState } from "react";
import { Box, Container, Typography, Card, CardContent, TextField, Button, FormControlLabel, Switch, Grid2, Alert, CircularProgress } from "@mui/material";
import axios from "axios";

// Self-ship shipping-label settings: enable the upgrade, set the return (ship-from) address, and a
// default parcel for when an order's item weights are unknown. Labels are billed to the wallet.
const ADDR = [["name", "Contact name"], ["businessName", "Business name"], ["address", "Street address"], ["address2", "Suite / unit"], ["city", "City"], ["state", "State"], ["postalCode", "ZIP / postal code"], ["country", "Country"]];

export default function ShippingSettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState(null);
    const [enabled, setEnabled] = useState(false);
    const [addr, setAddr] = useState({});
    const [parcel, setParcel] = useState({ length: 6, width: 4, height: 4, weight: 8 });
    const [walletCents, setWalletCents] = useState(0);

    useEffect(() => {
        axios.get("/api/admin/shipping/settings").then(({ data }) => {
            setEnabled(!!data.shippingLabels?.enabled);
            setParcel({ length: 6, width: 4, height: 4, weight: 8, ...(data.shippingLabels?.defaultParcel || {}) });
            setAddr(data.returnAddress || {});
            setWalletCents(data.walletBalanceCents || 0);
        }).catch(() => setMsg({ severity: "error", text: "Couldn't load settings." })).finally(() => setLoading(false));
    }, []);

    const save = async () => {
        setSaving(true); setMsg(null);
        try {
            const { data } = await axios.post("/api/admin/shipping/settings", { enabled, returnAddress: addr, defaultParcel: parcel });
            if (data.error) setMsg({ severity: "error", text: data.error });
            else setMsg({ severity: "success", text: "Saved." });
        } catch { setMsg({ severity: "error", text: "Save failed." }); }
        finally { setSaving(false); }
    };

    if (loading) return <Box sx={{ textAlign: "center", py: 8 }}><CircularProgress /></Box>;

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>Shipping labels</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>Buy discounted carrier labels for orders you ship yourself. Each label is charged to your wallet (carrier cost + a small service fee). Buying a label marks the order shipped and emails the buyer.</Typography>

            <Card variant="outlined" sx={{ mb: 2 }}>
                <CardContent>
                    <FormControlLabel control={<Switch checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />} label="Enable in-app shipping labels" />
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>Wallet balance: <b>${(walletCents / 100).toFixed(2)}</b></Typography>
                </CardContent>
            </Card>

            <Card variant="outlined" sx={{ mb: 2 }}>
                <CardContent>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>Return address (ship from)</Typography>
                    <Grid2 container spacing={2}>
                        {ADDR.map(([k, label]) => (
                            <Grid2 key={k} size={{ xs: 12, sm: k === "address" ? 12 : 6 }}>
                                <TextField fullWidth size="small" label={label} value={addr[k] || ""} onChange={(e) => setAddr((s) => ({ ...s, [k]: e.target.value }))} />
                            </Grid2>
                        ))}
                    </Grid2>
                </CardContent>
            </Card>

            <Card variant="outlined" sx={{ mb: 2 }}>
                <CardContent>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>Default parcel</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>Used when an order's item weights aren't set. Weight in ounces, dimensions in inches.</Typography>
                    <Grid2 container spacing={2}>
                        {[["length", "Length (in)"], ["width", "Width (in)"], ["height", "Height (in)"], ["weight", "Weight (oz)"]].map(([k, label]) => (
                            <Grid2 key={k} size={{ xs: 6, sm: 3 }}>
                                <TextField fullWidth size="small" type="number" label={label} value={parcel[k] ?? ""} onChange={(e) => setParcel((s) => ({ ...s, [k]: e.target.value }))} inputProps={{ min: 0, step: "0.1" }} />
                            </Grid2>
                        ))}
                    </Grid2>
                </CardContent>
            </Card>

            {msg && <Alert severity={msg.severity} sx={{ mb: 2 }}>{msg.text}</Alert>}
            <Button variant="contained" size="large" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save settings"}</Button>
        </Container>
    );
}

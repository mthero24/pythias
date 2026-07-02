"use client";
import { useState, useEffect } from "react";
import { Box, Container, Typography, TextField, Button, Paper, Stack, InputAdornment, Alert } from "@mui/material";

// Org-level internal production cost rates. These drive COGS/margin on quotes (ink cost =
// design print area × the per-print-type $/in² rate; screen-burn = design colors × $/screen).
// Never charged to the customer.
export default function ProductionCostsClient() {
    const [rates, setRates] = useState({ dtfInkRatePerSqIn: 0, dtgInkRatePerSqIn: 0, screenBurnRatePerScreen: 0 });
    const [saved, setSaved] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/settings/production-costs")
            .then((r) => r.json())
            .then((d) => { if (d.productionCosts) setRates(d.productionCosts); })
            .finally(() => setLoading(false));
    }, []);

    const save = async () => {
        setSaved(false);
        const r = await fetch("/api/settings/production-costs", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(rates),
        }).then((x) => x.json());
        if (r.productionCosts) { setRates(r.productionCosts); setSaved(true); }
    };

    const field = (key, label, adornment) => (
        <TextField
            label={label}
            type="number"
            size="small"
            value={rates[key] ?? 0}
            onChange={(e) => { setSaved(false); setRates({ ...rates, [key]: e.target.value }); }}
            InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment>, endAdornment: adornment ? <InputAdornment position="end">{adornment}</InputAdornment> : undefined }}
            sx={{ maxWidth: 320 }}
        />
    );

    return (
        <Box sx={{ bgcolor: "background.default", minHeight: "100vh" }}>
            <Container maxWidth="sm" sx={{ py: 4 }}>
                <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>Production Costs</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Internal cost rates for margin tracking on quotes. These are never shown to or charged to customers.
                </Typography>
                <Paper variant="outlined" sx={{ p: 3 }}>
                    {loading ? <Typography color="text.secondary">Loading…</Typography> : (
                        <Stack spacing={2.5}>
                            {field("dtfInkRatePerSqIn", "DTF ink cost", "/ in²")}
                            {field("dtgInkRatePerSqIn", "DTG ink cost", "/ in²")}
                            {field("screenBurnRatePerScreen", "Screen burn cost", "/ screen")}
                            <Box>
                                <Button variant="contained" onClick={save}>Save</Button>
                                {saved && <Alert severity="success" sx={{ mt: 2 }}>Saved.</Alert>}
                            </Box>
                        </Stack>
                    )}
                </Paper>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 2 }}>
                    Ink cost on a quote = design print area (in²) × the rate for its print type × quantity.
                    Screen-burn cost = design color count × the per-screen rate (charged once per line).
                </Typography>
            </Container>
        </Box>
    );
}

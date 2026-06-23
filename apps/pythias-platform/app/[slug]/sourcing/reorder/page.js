"use client";
import { useState } from "react";
import { Container, Typography, Button, Card, CardContent, Alert, CircularProgress, Box, Chip } from "@mui/material";
import axios from "axios";

// Manual trigger for the wholesale auto-reorder sweep. (A scheduled run can call the same route.)
export default function ReorderPage() {
    const [running, setRunning] = useState(false);
    const [res, setRes] = useState(null);
    const [err, setErr] = useState("");

    const run = async () => {
        setRunning(true); setErr(""); setRes(null);
        try {
            const { data } = await axios.post("/api/admin/sourcing/reorder", {});
            if (data.error) setErr(data.error); else setRes(data);
        } catch (e) { setErr(e.response?.data?.error || "Reorder failed."); }
        finally { setRunning(false); }
    };

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5 }}>Auto-reorder</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Restocks your wholesale-sourced products that have dropped to their reorder point. We place a draft order with the supplier to refill up to your target on-hand level, shipped to your return address. Review &amp; pay the draft in your supplier account, then mark it received to add the stock.
            </Typography>
            <Button variant="contained" size="large" onClick={run} disabled={running} startIcon={running ? <CircularProgress size={16} color="inherit" /> : null}>
                {running ? "Running…" : "Run auto-reorder now"}
            </Button>
            {err && <Alert severity="error" sx={{ mt: 2 }}>{err}</Alert>}
            {res && (
                <Card variant="outlined" sx={{ mt: 3 }}>
                    <CardContent>
                        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>{res.placed || 0} order(s) placed</Typography>
                        {(res.results || []).length === 0 && <Typography variant="body2" color="text.secondary">Nothing needed reordering right now.</Typography>}
                        {(res.results || []).map((r, i) => (
                            <Box key={i} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", py: 0.75, borderBottom: "1px solid #eee" }}>
                                <Box>
                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>{r.product}</Typography>
                                    <Typography variant="caption" color="text.secondary">{r.sku} · qty {r.qty}{r.logistic ? ` · ${r.logistic}` : ""}</Typography>
                                </Box>
                                {r.ok
                                    ? <Chip size="small" color="success" label={`ordered${r.cjOrderId ? ` #${r.cjOrderId}` : ""}`} />
                                    : <Chip size="small" color="error" label={r.error || "failed"} />}
                            </Box>
                        ))}
                    </CardContent>
                </Card>
            )}
        </Container>
    );
}

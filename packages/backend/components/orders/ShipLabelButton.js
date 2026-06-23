"use client";
import { useState } from "react";
import { Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, List, ListItemButton, Typography, CircularProgress, Alert } from "@mui/material";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import axios from "axios";

// Self-ship label purchase for an order: rate-shop discounted carrier rates, buy the chosen one
// (wallet charged carrier cost + spread), which marks the order shipped + emails the buyer.
const money = (c) => `$${((c || 0) / 100).toFixed(2)}`;

export default function ShipLabelButton({ orderId }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [rates, setRates] = useState([]);
    const [shipmentId, setShipmentId] = useState("");
    const [markup, setMarkup] = useState(40);
    const [sel, setSel] = useState(null);
    const [buying, setBuying] = useState(false);
    const [err, setErr] = useState("");
    const [done, setDone] = useState(null);

    const openModal = async () => {
        setOpen(true); setErr(""); setDone(null); setRates([]); setSel(null); setLoading(true);
        try {
            const { data } = await axios.post("/api/admin/shipping/rates", { orderId });
            if (data.error) setErr(data.error);
            else { setRates(data.rates || []); setShipmentId(data.shipmentId); setMarkup(data.markupCents ?? 40); }
        } catch (e) { setErr(e.response?.data?.error || "Couldn't load shipping rates."); }
        finally { setLoading(false); }
    };

    const buy = async () => {
        if (!sel) return;
        setBuying(true); setErr("");
        try {
            const { data } = await axios.post("/api/admin/shipping/buy", { orderId, shipmentId, rateId: sel.rateId });
            if (data.error) setErr(data.error);
            else setDone(data);
        } catch (e) { setErr(e.response?.data?.error || "Purchase failed."); }
        finally { setBuying(false); }
    };

    return (
        <Box sx={{ marginBottom: 2 }}>
            <Button variant="contained" startIcon={<LocalShippingIcon />} onClick={openModal}>Buy shipping label</Button>
            <Dialog open={open} onClose={() => !buying && setOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle>Buy shipping label</DialogTitle>
                <DialogContent dividers>
                    {loading ? (
                        <Box sx={{ textAlign: "center", py: 3 }}><CircularProgress /></Box>
                    ) : done ? (
                        <Box>
                            <Alert severity="success" sx={{ mb: 2 }}>Label purchased — order marked shipped and the buyer was emailed. {money(done.billedCents)} charged to your wallet.</Alert>
                            <Typography variant="body2" sx={{ mb: 1.5 }}>Tracking: <b>{done.trackingCode}</b> ({done.carrier})</Typography>
                            {done.labelUrl && <Button href={done.labelUrl} target="_blank" rel="noopener" variant="outlined">Open label PDF</Button>}
                        </Box>
                    ) : (err && !rates.length) ? (
                        <Alert severity="error">{err}</Alert>
                    ) : (
                        <>
                            <Typography variant="caption" color="text.secondary">Prices include a {money(markup)} service fee, charged to your wallet.</Typography>
                            <List dense sx={{ mt: 0.5 }}>
                                {rates.map((r) => (
                                    <ListItemButton key={r.rateId} selected={sel?.rateId === r.rateId} onClick={() => setSel(r)} sx={{ borderRadius: 1 }}>
                                        <Box sx={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
                                            <Box>
                                                <Typography variant="body2" sx={{ fontWeight: 600 }}>{r.carrier} {r.service}</Typography>
                                                {r.deliveryDays != null && <Typography variant="caption" color="text.secondary">~{r.deliveryDays} day{r.deliveryDays === 1 ? "" : "s"}</Typography>}
                                            </Box>
                                            <Typography variant="body2" sx={{ fontWeight: 700 }}>{money(r.rateCents + markup)}</Typography>
                                        </Box>
                                    </ListItemButton>
                                ))}
                            </List>
                            {!rates.length && !err && <Typography variant="body2" color="text.secondary">No rates available.</Typography>}
                            {err && <Alert severity="error" sx={{ mt: 1 }}>{err}</Alert>}
                        </>
                    )}
                </DialogContent>
                <DialogActions>
                    {done ? (
                        <Button onClick={() => { setOpen(false); if (typeof window !== "undefined") window.location.reload(); }}>Done</Button>
                    ) : (
                        <>
                            <Button onClick={() => setOpen(false)} disabled={buying}>Cancel</Button>
                            <Button variant="contained" onClick={buy} disabled={!sel || buying}>{buying ? "Buying…" : sel ? `Buy · ${money(sel.rateCents + markup)}` : "Select a rate"}</Button>
                        </>
                    )}
                </DialogActions>
            </Dialog>
        </Box>
    );
}

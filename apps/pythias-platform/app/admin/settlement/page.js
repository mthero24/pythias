"use client";
import { useEffect, useState } from "react";
import { Box, Typography, Card, CardContent, Table, TableHead, TableRow, TableCell, TableBody, Chip, Alert, CircularProgress, Button } from "@mui/material";
import axios from "axios";

const money = (n) => `$${(Number(n) || 0).toFixed(2)}`;

export default function SettlementPage() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");

    const load = async () => {
        setLoading(true); setErr("");
        try { const { data } = await axios.get("/api/admin/settlement"); setData(data); }
        catch (e) { setErr(e.response?.data?.error || "Failed to load."); }
        finally { setLoading(false); }
    };
    useEffect(() => { load(); }, []);

    const bal = data?.balance;
    const totals = data?.totals;
    // "Owed" ≈ what we've billed sellers for dropship that the CJ float must cover for orders still to pay.
    const underfunded = bal && totals && bal.amount < (totals.billed || 0);

    return (
        <Box sx={{ maxWidth: 1000, mx: "auto", p: 3 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Box>
                    <Typography variant="h5" fontWeight={800}>Supplier settlement (CJ)</Typography>
                    <Typography variant="body2" color="text.secondary">Dropship orders are charged to sellers' wallets up front; this is the Pythias → CJ side. Fund the CJ balance to release pending drafts.</Typography>
                </Box>
                <Button variant="outlined" size="small" onClick={load} disabled={loading}>Refresh</Button>
            </Box>

            {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}
            {loading && !data && <Box sx={{ textAlign: "center", py: 6 }}><CircularProgress /></Box>}

            {data && (
                <>
                    <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 2 }}>
                        <Card variant="outlined" sx={{ flex: "1 1 200px" }}>
                            <CardContent>
                                <Typography variant="overline" color="text.secondary">CJ balance</Typography>
                                {bal ? (
                                    <Typography variant="h4" fontWeight={800} color={underfunded ? "error.main" : "inherit"}>{money(bal.amount)}</Typography>
                                ) : (
                                    <Typography variant="body2" color="error.main">{data.balanceError || "Unavailable"}</Typography>
                                )}
                                {bal?.freeze > 0 && <Typography variant="caption" color="text.secondary">{money(bal.freeze)} frozen</Typography>}
                            </CardContent>
                        </Card>
                        <Card variant="outlined" sx={{ flex: "1 1 200px" }}>
                            <CardContent>
                                <Typography variant="overline" color="text.secondary">Dropship billed (last 150)</Typography>
                                <Typography variant="h4" fontWeight={800}>{money(totals?.billed)}</Typography>
                                <Typography variant="caption" color="text.secondary">{totals?.count || 0} CJ order(s), {totals?.ordered || 0} placed</Typography>
                            </CardContent>
                        </Card>
                    </Box>

                    {underfunded && (
                        <Alert severity="warning" sx={{ mb: 2 }}>
                            The CJ balance is below what we've billed for dropship orders. Top up CJ (and confirm auto-payment is on) so pending drafts ship. CJ's minimum top-up is $2,000.
                        </Alert>
                    )}
                    {bal && bal.amount === 0 && (totals?.count || 0) === 0 && (
                        <Alert severity="info" sx={{ mb: 2 }}>No dropship orders yet. You'll be emailed to fund CJ the first time one is placed.</Alert>
                    )}

                    <Card variant="outlined">
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Order</TableCell><TableCell>CJ order #</TableCell>
                                    <TableCell align="right">Items</TableCell><TableCell align="right">Billed</TableCell>
                                    <TableCell>Status</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {(!data.orders || data.orders.length === 0) && (
                                    <TableRow><TableCell colSpan={5} align="center" sx={{ py: 3, color: "text.secondary" }}>No dropship orders yet.</TableCell></TableRow>
                                )}
                                {(data.orders || []).map((o, i) => (
                                    <TableRow key={`${o.cjOrderId}-${i}`}>
                                        <TableCell>{o.poNumber}</TableCell>
                                        <TableCell sx={{ fontFamily: "monospace", fontSize: ".8rem" }}>{o.cjOrderId || "—"}</TableCell>
                                        <TableCell align="right">{o.items}</TableCell>
                                        <TableCell align="right">{money(o.amount)}</TableCell>
                                        <TableCell>
                                            <Chip size="small" label={o.status || "—"}
                                                color={o.status === "ordered" ? "success" : o.status === "needs_funding" ? "warning" : o.status === "failed" ? "error" : "default"} />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Card>
                </>
            )}
        </Box>
    );
}

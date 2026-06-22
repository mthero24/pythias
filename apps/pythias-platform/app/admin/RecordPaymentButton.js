"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
    Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
    Stack, Typography, Table, TableBody, TableRow, TableCell, IconButton, Alert, InputAdornment,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";

// Record money received OUTSIDE Stripe (invoice / ACH / check). Lands in the same
// PaymentReceived ledger → flows into company finance + the seller's Reports platform cost.
const TYPES = ["subscription", "overage", "kling", "onboarding", "other"];

export default function RecordPaymentButton({ orgs = [] }) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [orgId, setOrgId] = useState("");
    const [amount, setAmount] = useState("");
    const [type, setType] = useState("subscription");
    const [paidAt, setPaidAt] = useState(() => new Date().toISOString().slice(0, 10));
    const [description, setDescription] = useState("");
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState("");
    const [list, setList] = useState([]);

    const loadList = useCallback(async () => {
        try { const r = await fetch("/api/admin/payments"); const j = await r.json(); if (j.payments) setList(j.payments); } catch {}
    }, []);
    useEffect(() => { if (open) loadList(); }, [open, loadList]);

    const save = async () => {
        setErr(""); setBusy(true);
        try {
            const r = await fetch("/api/admin/payments", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orgId, amount: Number(amount), type, paidAt, description }),
            });
            const j = await r.json();
            if (!r.ok) throw new Error(j.error || "Failed to record payment");
            setAmount(""); setDescription("");
            await loadList();
            router.refresh();
        } catch (e) { setErr(e.message); }
        setBusy(false);
    };

    const del = async (id) => {
        if (!confirm("Delete this manual payment?")) return;
        await fetch("/api/admin/payments", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
        await loadList(); router.refresh();
    };

    return (
        <>
            <Button size="small" variant="contained" onClick={() => setOpen(true)}>Record Payment</Button>
            <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Record a manual payment</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        For money received <strong>outside Stripe</strong> (invoice, ACH, check). Stripe payments record automatically.
                    </Typography>
                    {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <TextField select label="Organization" value={orgId} onChange={e => setOrgId(e.target.value)} size="small" fullWidth>
                            {orgs.map(o => <MenuItem key={o.id} value={o.id}>{o.name}</MenuItem>)}
                        </TextField>
                        <TextField label="Amount" type="number" value={amount} onChange={e => setAmount(e.target.value)} size="small"
                            InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }} />
                        <TextField select label="Type" value={type} onChange={e => setType(e.target.value)} size="small">
                            {TYPES.map(t => <MenuItem key={t} value={t} sx={{ textTransform: "capitalize" }}>{t}</MenuItem>)}
                        </TextField>
                        <TextField label="Date paid" type="date" value={paidAt} onChange={e => setPaidAt(e.target.value)} size="small" InputLabelProps={{ shrink: true }} />
                        <TextField label="Note (optional)" value={description} onChange={e => setDescription(e.target.value)} size="small" />
                        <Button variant="contained" onClick={save} disabled={busy || !orgId || !amount}>Save payment</Button>
                    </Stack>

                    {list.length > 0 && (
                        <>
                            <Typography variant="subtitle2" sx={{ mt: 3, mb: 1 }}>Recent manual payments</Typography>
                            <Table size="small">
                                <TableBody>
                                    {list.map(p => (
                                        <TableRow key={p.id}>
                                            <TableCell>{new Date(p.paidAt).toLocaleDateString()}</TableCell>
                                            <TableCell>{p.orgName}</TableCell>
                                            <TableCell sx={{ textTransform: "capitalize" }}>{p.type}</TableCell>
                                            <TableCell align="right">${p.amount.toLocaleString()}</TableCell>
                                            <TableCell padding="none"><IconButton size="small" onClick={() => del(p.id)}><DeleteIcon fontSize="inherit" /></IconButton></TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </>
                    )}
                </DialogContent>
                <DialogActions><Button onClick={() => setOpen(false)}>Close</Button></DialogActions>
            </Dialog>
        </>
    );
}

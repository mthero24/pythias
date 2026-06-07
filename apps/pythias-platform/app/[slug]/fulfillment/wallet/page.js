"use client";
import { useState, useEffect } from "react";
import {
    Box, Typography, CircularProgress, Button, TextField,
    Card, CardContent, Divider, Switch, FormControlLabel,
    Alert, Snackbar, Chip,
} from "@mui/material";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import AddIcon from "@mui/icons-material/Add";
import SettingsIcon from "@mui/icons-material/Settings";

function dollars(cents) {
    if (cents == null) return "$0.00";
    return `$${(cents / 100).toFixed(2)}`;
}

function BalanceCard({ balance, minimum }) {
    const pct = minimum > 0 ? Math.min(100, Math.round((balance / minimum) * 100)) : 100;
    const low = balance < minimum;
    return (
        <Card sx={{ bgcolor: "#1a1a1a", border: `1px solid ${low ? "rgba(245,158,11,0.5)" : "#2a2a2a"}`, borderRadius: 2, mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
                <Typography variant="caption" sx={{ color: "#888", textTransform: "uppercase", letterSpacing: 1, fontSize: "0.68rem" }}>
                    Available Balance
                </Typography>
                <Typography sx={{ fontSize: "2.5rem", fontWeight: 800, color: low ? "#fbbf24" : "#4caf50", lineHeight: 1.2, mt: 0.5 }}>
                    {dollars(balance)}
                </Typography>
                <Box sx={{ mt: 2, mb: 0.75 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                        <Typography sx={{ fontSize: "0.72rem", color: "#888" }}>Minimum: {dollars(minimum)}</Typography>
                        <Typography sx={{ fontSize: "0.72rem", color: low ? "#fbbf24" : "#888" }}>{pct}%</Typography>
                    </Box>
                    <Box sx={{ height: 6, bgcolor: "#2a2a2a", borderRadius: 3, overflow: "hidden" }}>
                        <Box sx={{ height: "100%", width: `${pct}%`, bgcolor: low ? "#f59e0b" : "#4caf50", borderRadius: 3, transition: "width 0.4s" }} />
                    </Box>
                </Box>
                {low && (
                    <Alert severity="warning" sx={{ mt: 1.5, bgcolor: "rgba(245,158,11,0.1)", color: "#fbbf24", border: "1px solid rgba(245,158,11,0.3)", "& .MuiAlert-icon": { color: "#fbbf24" }, fontSize: "0.78rem" }}>
                        Balance is below your minimum threshold. Add funds to keep orders flowing.
                    </Alert>
                )}
            </CardContent>
        </Card>
    );
}

function AddFundsCard({ onSuccess }) {
    const presets = [5000, 10000, 25000, 50000]; // cents
    const [amount, setAmount] = useState("");
    const [loading, setLoading] = useState(false);

    const handleAdd = async (cents) => {
        setLoading(true);
        const res = await fetch("/api/fulfillment/wallet", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "add-funds", amountCents: cents }),
        });
        const data = await res.json();
        setLoading(false);
        if (!data.error) { onSuccess(data.wallet); setAmount(""); }
    };

    const customCents = Math.round(parseFloat(amount) * 100) || 0;

    return (
        <Card sx={{ bgcolor: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 2, mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                    <AddIcon sx={{ color: "#6366f1" }} />
                    <Typography fontWeight={700} sx={{ color: "#f0f0f0" }}>Add Funds</Typography>
                </Box>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
                    {presets.map(p => (
                        <Button key={p} variant="outlined" size="small" onClick={() => handleAdd(p)} disabled={loading}
                            sx={{ borderColor: "#2a2a2a", color: "#ccc", "&:hover": { borderColor: "#6366f1", bgcolor: "rgba(99,102,241,0.08)" } }}>
                            {dollars(p)}
                        </Button>
                    ))}
                </Box>
                <Box sx={{ display: "flex", gap: 1.5 }}>
                    <TextField
                        size="small" placeholder="Custom amount" type="number"
                        value={amount} onChange={e => setAmount(e.target.value)}
                        InputProps={{ startAdornment: <Typography sx={{ color: "#888", mr: 0.5 }}>$</Typography> }}
                        sx={{ flex: 1, "& .MuiOutlinedInput-root": { bgcolor: "#111", "& fieldset": { borderColor: "#2a2a2a" }, "&.Mui-focused fieldset": { borderColor: "#6366f1" } }, input: { color: "#f0f0f0" } }}
                    />
                    <Button variant="contained" disabled={!customCents || loading} onClick={() => handleAdd(customCents)}
                        sx={{ bgcolor: "#6366f1", "&:hover": { bgcolor: "#4f46e5" }, "&:disabled": { bgcolor: "#2a2a2a" } }}>
                        {loading ? <CircularProgress size={18} sx={{ color: "#fff" }} /> : "Add"}
                    </Button>
                </Box>
                <Typography variant="caption" sx={{ color: "#555", mt: 1, display: "block" }}>
                    Stripe payment processing will be connected at launch. Funds added here go directly to your wallet balance.
                </Typography>
            </CardContent>
        </Card>
    );
}

function SettingsCard({ wallet, onSave }) {
    const [minimum, setMinimum]             = useState((wallet.minimumBalance ?? 20000) / 100);
    const [rechargeAmount, setRecharge]     = useState((wallet.autoRechargeAmount ?? 50000) / 100);
    const [autoEnabled, setAutoEnabled]     = useState(wallet.autoRechargeEnabled ?? false);
    const [loading, setLoading]             = useState(false);

    const save = async () => {
        setLoading(true);
        const res = await fetch("/api/fulfillment/wallet", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                action: "update-settings",
                minimumBalance:      Math.round(parseFloat(minimum) * 100),
                autoRechargeAmount:  Math.round(parseFloat(rechargeAmount) * 100),
                autoRechargeEnabled: autoEnabled,
            }),
        });
        const data = await res.json();
        setLoading(false);
        if (!data.error) onSave(data.wallet);
    };

    return (
        <Card sx={{ bgcolor: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 2 }}>
            <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                    <SettingsIcon sx={{ color: "#6366f1" }} />
                    <Typography fontWeight={700} sx={{ color: "#f0f0f0" }}>Auto-Recharge Settings</Typography>
                </Box>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <TextField size="small" label="Minimum Balance ($)" type="number" value={minimum} onChange={e => setMinimum(e.target.value)}
                        sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#111", "& fieldset": { borderColor: "#2a2a2a" }, "&.Mui-focused fieldset": { borderColor: "#6366f1" } }, input: { color: "#f0f0f0" }, label: { color: "#888" } }} />
                    <TextField size="small" label="Auto-Recharge Amount ($)" type="number" value={rechargeAmount} onChange={e => setRecharge(e.target.value)}
                        helperText="Amount added to wallet when balance falls below minimum"
                        sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#111", "& fieldset": { borderColor: "#2a2a2a" }, "&.Mui-focused fieldset": { borderColor: "#6366f1" } }, input: { color: "#f0f0f0" }, label: { color: "#888" }, "& .MuiFormHelperText-root": { color: "#555" } }} />
                    <FormControlLabel
                        control={<Switch checked={autoEnabled} onChange={e => setAutoEnabled(e.target.checked)} sx={{ "& .MuiSwitch-switchBase.Mui-checked": { color: "#6366f1" }, "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { bgcolor: "#6366f1" } }} />}
                        label={<Typography sx={{ color: "#ccc", fontSize: "0.85rem" }}>Enable auto-recharge</Typography>}
                    />
                    <Button variant="contained" onClick={save} disabled={loading}
                        sx={{ alignSelf: "flex-start", bgcolor: "#6366f1", "&:hover": { bgcolor: "#4f46e5" } }}>
                        {loading ? <CircularProgress size={18} sx={{ color: "#fff" }} /> : "Save Settings"}
                    </Button>
                </Box>
            </CardContent>
        </Card>
    );
}

export default function WalletPage() {
    const [wallet, setWallet] = useState(null);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState({ open: false, msg: "" });

    useEffect(() => {
        fetch("/api/fulfillment/wallet")
            .then(r => r.json())
            .then(d => { if (!d.error) setWallet(d.wallet); })
            .finally(() => setLoading(false));
    }, []);

    const handleUpdate = (newWallet) => {
        setWallet(newWallet);
        setToast({ open: true, msg: "Wallet updated" });
    };

    if (loading) return <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress sx={{ color: "#6366f1" }} /></Box>;

    return (
        <Box sx={{ p: 3, maxWidth: 600, mx: "auto" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
                <AccountBalanceWalletIcon sx={{ color: "#6366f1", fontSize: 28 }} />
                <Box>
                    <Typography variant="h5" fontWeight={700} sx={{ color: "#f0f0f0" }}>Wallet</Typography>
                    <Typography variant="caption" sx={{ color: "#888" }}>Pre-funded balance for wholesale order charges</Typography>
                </Box>
            </Box>

            {wallet ? (
                <>
                    <BalanceCard balance={wallet.balance ?? 0} minimum={wallet.minimumBalance ?? 20000} />
                    <AddFundsCard onSuccess={handleUpdate} />
                    <SettingsCard wallet={wallet} onSave={handleUpdate} />
                </>
            ) : (
                <Alert severity="info" sx={{ bgcolor: "rgba(99,102,241,0.1)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.3)" }}>
                    Wallet not available. Make sure this is a Commerce Cloud organization.
                </Alert>
            )}

            <Snackbar open={toast.open} autoHideDuration={3000} onClose={() => setToast(t => ({ ...t, open: false }))}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
                <Alert severity="success" sx={{ bgcolor: "rgba(76,175,80,0.15)", color: "#81c784", border: "1px solid rgba(76,175,80,0.3)" }}>
                    {toast.msg}
                </Alert>
            </Snackbar>
        </Box>
    );
}

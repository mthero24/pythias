"use client";
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Button, Stack, Alert, CircularProgress, IconButton, Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useState } from "react";
import axios from "axios";

export function ShopifyModal({ open, setOpen, provider, setConnections }) {
    const [shop, setShop] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const reset = () => { setShop(""); setError(""); };
    const handleClose = () => { reset(); setOpen(false); };

    const normalizeShop = (s) =>
        s.trim().toLowerCase()
            .replace(/^https?:\/\//, "")
            .replace(/\/$/, "");

    const sub = async () => {
        const domain = normalizeShop(shop);
        if (!domain) { setError("Store domain is required"); return; }
        setSaving(true);
        setError("");
        try {
            const res = await axios.post("/api/admin/integrations/shopify", { shop: domain, provider });
            if (res?.data?.error) {
                setError(res.data.msg ?? "Failed to add store");
            } else {
                setConnections(res.data.integrations);
                handleClose();
            }
        } catch (e) {
            setError(e.response?.data?.msg ?? e.response?.data?.error ?? "Failed to add store");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
            <DialogTitle sx={{ fontWeight: 700, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                Connect Shopify Store
                <IconButton size="small" onClick={handleClose}><CloseIcon fontSize="small" /></IconButton>
            </DialogTitle>
            <DialogContent dividers>
                <Stack spacing={2} sx={{ pt: 1 }}>
                    {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}
                    <Typography variant="body2" color="text.secondary">
                        Enter the store domain. The store must already have the Pythias Shopify app installed and connected to this provider.
                    </Typography>
                    <TextField
                        fullWidth size="small"
                        label="Store Domain"
                        value={shop}
                        onChange={e => setShop(e.target.value)}
                        placeholder="mystore.myshopify.com"
                        helperText="e.g. mystore.myshopify.com"
                        onKeyDown={e => e.key === "Enter" && sub()}
                    />
                </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={handleClose}>Cancel</Button>
                <Button
                    variant="contained"
                    onClick={sub}
                    disabled={saving || !shop.trim()}
                    sx={{ bgcolor: "#96bf48", "&:hover": { bgcolor: "#7da33a" } }}
                    startIcon={saving ? <CircularProgress size={14} color="inherit" /> : null}
                >
                    Connect
                </Button>
            </DialogActions>
        </Dialog>
    );
}

"use client";
import {
    Box, Container, Typography, Stack, Chip, Button, Paper, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, IconButton, TextField,
    Dialog, DialogTitle, DialogContent, DialogActions, Switch, FormControlLabel,
    Alert, CircularProgress,
} from "@mui/material";
import { useState } from "react";
import axios from "axios";
import { Footer } from "../reusable/Footer";
import AppsIcon from "@mui/icons-material/Apps";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";

const CLIENT_OPTIONS = [
    { value: "premier-printing", label: "Premier Printing" },
    { value: "po", label: "PO" },
];

function PlanDialog({ plan, onClose, onSave, canManage }) {
    const isNew = !plan._id;
    const [appName, setAppName] = useState(plan.appName ?? "");
    const [description, setDescription] = useState(plan.description ?? "");
    const [monthlyPrice, setMonthlyPrice] = useState(plan.monthlyPrice ?? "");
    const [active, setActive] = useState(plan.active ?? true);
    const [client, setClient] = useState(plan._client ?? "premier-printing");
    const [saving, setSaving] = useState(false);
    const [improving, setImproving] = useState(false);
    const [error, setError] = useState("");

    const handleImproveDescription = async () => {
        if (!description.trim()) return;
        setImproving(true);
        try {
            const res = await axios.post("/api/admin/ai-text", {
                prompt: `Improve this service description for a monthly invoice line item. Keep it concise (1-2 sentences), professional, and clear. Return only the improved description, no quotes or extra text.\n\nApp: ${appName}\nDescription: ${description}`,
            });
            const improved = res.data?.content ?? res.data?.message ?? "";
            if (improved) setDescription(improved.trim());
        } catch {
            // silently fail — user keeps their original
        } finally {
            setImproving(false);
        }
    };

    const handleSave = async () => {
        if (!appName.trim() || !monthlyPrice) { setError("App name and price are required"); return; }
        if (canManage && isNew && !client) { setError("Client is required"); return; }
        setSaving(true);
        setError("");
        try {
            await onSave({ _id: plan._id, appName: appName.trim(), description: description.trim(), monthlyPrice: parseFloat(monthlyPrice), active, ...(canManage ? { client: isNew ? client : plan._client } : {}) });
            onClose();
        } catch (e) {
            setError(e?.response?.data?.error ?? "Save failed");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle fontWeight={700}>{isNew ? "Add Service Plan" : "Edit Service Plan"}</DialogTitle>
            <DialogContent>
                <Stack spacing={2} sx={{ pt: 1 }}>
                    {error && <Alert severity="error">{error}</Alert>}
                    <TextField label="App Name" value={appName} onChange={e => setAppName(e.target.value)} fullWidth size="small" required />
                    <Box sx={{ position: "relative" }}>
                        <TextField label="Description" value={description} onChange={e => setDescription(e.target.value)} fullWidth size="small" multiline rows={2} />
                        <IconButton
                            size="small"
                            onClick={handleImproveDescription}
                            disabled={improving || !description.trim()}
                            title="Improve with AI"
                            sx={{ position: "absolute", top: 6, right: 6 }}
                        >
                            {improving ? <CircularProgress size={16} color="inherit" /> : <AutoAwesomeIcon fontSize="small" color={description.trim() ? "primary" : "disabled"} />}
                        </IconButton>
                    </Box>
                    <TextField label="Monthly Price ($)" type="number" value={monthlyPrice} onChange={e => setMonthlyPrice(e.target.value)} fullWidth size="small" required inputProps={{ min: 0, step: 0.01 }} />
                    {canManage && isNew && (
                        <TextField select label="Client" value={client} onChange={e => setClient(e.target.value)} size="small" fullWidth SelectProps={{ native: true }}>
                            {CLIENT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </TextField>
                    )}
                    {!isNew && (
                        <FormControlLabel
                            control={<Switch checked={active} onChange={e => setActive(e.target.checked)} color="success" />}
                            label={active ? "Active" : "Inactive"}
                        />
                    )}
                </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
                <Button variant="outlined" onClick={onClose} disabled={saving}>Cancel</Button>
                <Button variant="contained" onClick={handleSave} disabled={saving}
                    startIcon={saving ? <CircularProgress size={14} color="inherit" /> : null}>
                    {saving ? "Saving…" : "Save"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export function ServicePlansMain({ initialPlans, canManage = false }) {
    const [plans, setPlans] = useState(initialPlans);
    const [dialogPlan, setDialogPlan] = useState(null);
    const [error, setError] = useState(null);

    const handleSave = async (data) => {
        if (data._id) {
            const res = await axios.put("/api/admin/service-plans", data);
            setPlans(prev => prev.map(p => p._id === data._id ? res.data.plan : p));
        } else {
            const res = await axios.post("/api/admin/service-plans", data);
            setPlans(prev => [...prev, res.data.plan]);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Delete this service plan?")) return;
        try {
            const plan = plans.find(p => p._id === id);
            await axios.delete("/api/admin/service-plans", { data: { _id: id, client: plan?._client } });
            setPlans(prev => prev.filter(p => p._id !== id));
        } catch (e) {
            setError(e?.response?.data?.error ?? "Delete failed");
        }
    };

    const monthlyTotal = plans.filter(p => p.active).reduce((s, p) => s + p.monthlyPrice, 0);

    return (
        <Box sx={{ width: "100%", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
            <Container maxWidth="md" sx={{ py: 4, flex: 1 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 1 }}>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                        <Box sx={{ width: 36, height: 36, borderRadius: 2, background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <AppsIcon sx={{ color: "#fff", fontSize: 20 }} />
                        </Box>
                        <Box>
                            <Typography variant="h5" fontWeight={800} letterSpacing={-0.5}>Service Plans</Typography>
                            <Typography variant="body2" color="text.secondary">Configure monthly pricing per app</Typography>
                        </Box>
                    </Stack>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <Chip label={`$${monthlyTotal.toFixed(2)} / mo`} color="primary" variant="outlined" sx={{ fontWeight: 700 }} />
                        {canManage && (
                            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogPlan({ appName: "", description: "", monthlyPrice: "", active: true, _client: "premier-printing" })}>
                                Add Plan
                            </Button>
                        )}
                    </Stack>
                </Box>

                {error && <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>{error}</Alert>}

                {plans.length === 0 ? (
                    <Box sx={{ textAlign: "center", py: 8 }}>
                        <AppsIcon sx={{ fontSize: 48, color: "text.disabled", mb: 1 }} />
                        <Typography color="text.secondary">No service plans yet. Add one to start generating invoices.</Typography>
                    </Box>
                ) : (
                    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ backgroundColor: "action.hover" }}>
                                    <TableCell sx={{ fontWeight: 700 }}>App Name</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Monthly Price</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                                    {canManage && <TableCell sx={{ fontWeight: 700 }}>Client</TableCell>}
                                    {canManage && <TableCell sx={{ width: 80 }} />}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {plans.map(plan => (
                                    <TableRow key={plan._id} hover>
                                        <TableCell sx={{ fontWeight: 600 }}>{plan.appName}</TableCell>
                                        <TableCell sx={{ color: "text.secondary", fontSize: "0.85rem" }}>{plan.description || "—"}</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: "primary.main" }}>${plan.monthlyPrice.toFixed(2)}</TableCell>
                                        <TableCell>
                                            <Chip size="small" label={plan.active ? "Active" : "Inactive"}
                                                color={plan.active ? "success" : "default"} variant="outlined" />
                                        </TableCell>
                                        {canManage && (
                                            <TableCell>
                                                <Chip size="small" label={plan._client === "po" ? "PO" : "Premier"} variant="outlined" />
                                            </TableCell>
                                        )}
                                        {canManage && (
                                            <TableCell>
                                                <Stack direction="row" spacing={0.5}>
                                                    <IconButton size="small" onClick={() => setDialogPlan(plan)}><EditIcon fontSize="small" /></IconButton>
                                                    <IconButton size="small" color="error" onClick={() => handleDelete(plan._id)}><DeleteIcon fontSize="small" /></IconButton>
                                                </Stack>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Container>
            <Footer />
            {dialogPlan && <PlanDialog plan={dialogPlan} onClose={() => setDialogPlan(null)} onSave={handleSave} canManage={canManage} />}
        </Box>
    );
}

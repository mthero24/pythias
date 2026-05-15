import { useState, useEffect } from "react";
import { Box, Grid2, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Divider, IconButton, Stack, CircularProgress, Chip } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import axios from "axios";

export const AddModal = ({ open, setOpen, setNeedsOrdered, needsOrdered, colors, setColors, setBlankCodes, blankCodes, defaultLocation }) => {
    const [blanks, setBlanks]   = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving]   = useState(false);
    const [items, setItems]     = useState([{ blank: null, color: "", size: "", quantity: 1, location: defaultLocation ?? "" }]);

    useEffect(() => {
        const getBlanks = async () => {
            setLoading(true);
            const res = await axios.get("/api/admin/blanks");
            setBlanks(res.data.blanks.sort((a, b) => a.code.localeCompare(b.code)));
            setLoading(false);
        };
        if (open && (!blanks || blanks.length <= 0)) getBlanks();
    }, [open]);

    const updateItem = (index, field, value) => {
        setItems(prev => {
            const next = [...prev];
            next[index] = { ...next[index], [field]: value };
            if (field === "blank") {
                next[index].color = "";
                next[index].size  = "";
            }
            return next;
        });
    };

    const addRow = () => setItems(prev => [...prev, { blank: null, color: "", size: "", quantity: 1, location: defaultLocation ?? "" }]);
    const removeRow = (index) => setItems(prev => prev.filter((_, i) => i !== index));

    const validItems = items.filter(i => i.blank && i.color && i.size && i.quantity > 0);

    const add = async () => {
        if (validItems.length === 0) return;
        setSaving(true);
        const res = await axios.post("/api/admin/inventory/create-order/add", {
            items: validItems.map(i => ({
                blank:    i.blank,
                color:    i.blank.colors.find(c => c.name === i.color),
                size:     i.blank.sizes.find(s => s.name === i.size),
                quantity: i.quantity,
            })),
        }).catch(() => null);
        setSaving(false);
        if (!res?.data?.inventories) { alert("Error adding items"); return; }

        setNeedsOrdered(prev => [
            ...prev,
            ...res.data.inventories.map((inventory, idx) => ({
                inv:      inventory.inventory,
                order:    inventory.order,
                included: true,
                location: validItems[idx]?.location ?? defaultLocation,
            })),
        ]);

        const bC = [...blankCodes];
        const cL = [...colors];
        for (const item of items) {
            if (!bC.includes(item.blank?.code)) bC.push(item.blank.code);
            if (!cL.includes(item.color))       cL.push(item.color);
        }
        setBlankCodes(bC);
        setColors(cL);
        setItems([{ blank: null, color: "", size: "", quantity: 1, location: defaultLocation ?? "" }]);
        setOpen(false);
    };

    return (
        <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth scroll="paper">
            <DialogTitle sx={{ py: 1.5, px: 2 }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography variant="h6" fontWeight={700} sx={{ flex: 1 }}>Add Items to Order</Typography>
                    <IconButton size="small" onClick={() => setOpen(false)}><CloseIcon fontSize="small" /></IconButton>
                </Stack>
            </DialogTitle>
            <Divider />
            <DialogContent sx={{ p: 2 }}>
                {loading ? (
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1.5, py: 4 }}>
                        <CircularProgress size={22} />
                        <Typography variant="body2" color="text.secondary">Loading blanks…</Typography>
                    </Box>
                ) : (
                    <Stack spacing={1.5}>
                        {/* Column headers */}
                        <Grid2 container spacing={1} sx={{ px: 0.5 }}>
                            <Grid2 size={3}><Typography variant="caption" fontWeight={700} color="text.secondary">Style Code</Typography></Grid2>
                            <Grid2 size={2.5}><Typography variant="caption" fontWeight={700} color="text.secondary">Color</Typography></Grid2>
                            <Grid2 size={2.5}><Typography variant="caption" fontWeight={700} color="text.secondary">Size</Typography></Grid2>
                            <Grid2 size={1.5}><Typography variant="caption" fontWeight={700} color="text.secondary">Qty</Typography></Grid2>
                            <Grid2 size={1.5}><Typography variant="caption" fontWeight={700} color="text.secondary">Location</Typography></Grid2>
                            <Grid2 size={1} />
                        </Grid2>

                        {items.map((item, index) => (
                            <Box
                                key={index}
                                sx={{ bgcolor: "action.hover", borderRadius: 2, px: 1.5, py: 1 }}
                            >
                                <Grid2 container spacing={1} alignItems="center">
                                    <Grid2 size={3}>
                                        <TextField
                                            select size="small" fullWidth label="Style Code"
                                            value={item.blank?.code ?? ""}
                                            onChange={(e) => updateItem(index, "blank", blanks.find(b => b.code === e.target.value))}
                                        >
                                            {blanks?.map(b => <MenuItem key={b.code} value={b.code}>{b.code}</MenuItem>)}
                                        </TextField>
                                    </Grid2>
                                    <Grid2 size={2.5}>
                                        <TextField
                                            select size="small" fullWidth label="Color"
                                            value={item.color}
                                            disabled={!item.blank}
                                            onChange={(e) => updateItem(index, "color", e.target.value)}
                                        >
                                            {item.blank?.colors.map(c => <MenuItem key={c.name} value={c.name}>{c.name}</MenuItem>)}
                                        </TextField>
                                    </Grid2>
                                    <Grid2 size={2.5}>
                                        <TextField
                                            select size="small" fullWidth label="Size"
                                            value={item.size}
                                            disabled={!item.blank}
                                            onChange={(e) => updateItem(index, "size", e.target.value)}
                                        >
                                            {item.blank?.sizes.map(s => <MenuItem key={s.name} value={s.name}>{s.name}</MenuItem>)}
                                        </TextField>
                                    </Grid2>
                                    <Grid2 size={1.5}>
                                        <TextField
                                            size="small" fullWidth type="number" label="Qty"
                                            value={item.quantity}
                                            disabled={!item.blank}
                                            onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value) || 0)}
                                            inputProps={{ min: 1 }}
                                        />
                                    </Grid2>
                                    <Grid2 size={1.5}>
                                        <TextField
                                            size="small" fullWidth label="Location"
                                            value={item.location ?? ""}
                                            disabled={!item.blank}
                                            onChange={(e) => updateItem(index, "location", e.target.value)}
                                        />
                                    </Grid2>
                                    <Grid2 size={1} sx={{ display: "flex", justifyContent: "center" }}>
                                        {items.length > 1 && (
                                            <IconButton size="small" color="error" onClick={() => removeRow(index)}>
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        )}
                                    </Grid2>
                                </Grid2>
                            </Box>
                        ))}

                        <Button
                            size="small"
                            variant="outlined"
                            startIcon={<AddIcon />}
                            onClick={addRow}
                            sx={{ alignSelf: "flex-start" }}
                        >
                            Add Row
                        </Button>
                    </Stack>
                )}
            </DialogContent>
            <Divider />
            <DialogActions sx={{ px: 2, py: 1.5, gap: 1 }}>
                <Chip
                    label={`${validItems.length} item${validItems.length !== 1 ? "s" : ""} ready`}
                    size="small"
                    color={validItems.length > 0 ? "primary" : "default"}
                    variant="outlined"
                    sx={{ mr: "auto" }}
                />
                <Button onClick={() => setOpen(false)}>Cancel</Button>
                <Button
                    variant="contained"
                    disabled={validItems.length === 0 || saving}
                    onClick={add}
                    startIcon={saving ? <CircularProgress size={14} color="inherit" /> : undefined}
                >
                    {saving ? "Adding…" : "Add to Order"}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

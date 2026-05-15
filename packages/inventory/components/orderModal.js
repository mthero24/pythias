import { useState, useEffect, useMemo } from "react";
import {
    Box, Grid2, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Checkbox, Divider, Accordion, AccordionSummary, AccordionDetails,
    Chip, Stack, IconButton, CircularProgress, Card, Tooltip, Badge,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CloseIcon from "@mui/icons-material/Close";
import ChecklistIcon from "@mui/icons-material/Checklist";
import AddIcon from "@mui/icons-material/Add";
import axios from "axios";
import { AddModal } from "./addModel";

export function OrderModal({ open, setOpen, type, items, setBlanks, setItems, defaultLocation }) {
    const [needsOrdered, setNeedsOrdered]               = useState([]);
    const [order, setOrder]                             = useState({ poNumber: "", company: "", dateOrdered: "", dateExpected: "" });
    const [blankCodes, setBlankCodes]                   = useState([]);
    const [colors, setColors]                           = useState([]);
    const [blanks, setBlan]                             = useState([]);
    const [loading, setLoading]                         = useState(false);
    const [addModal, setAddModal]                       = useState(false);
    const [expandedBlank, setExpandedBlank]             = useState("");
    const [expandedColor, setExpandedColor]             = useState("");

    useEffect(() => {
        const getBlanks = async () => {
            setLoading(true);
            const res = await axios.get("/api/admin/inventory/create-order");
            if (res?.data) setBlan(res.data.blanks);
        };
        if (open) {
            if (blanks.length === 0) getBlanks();
            let no = [];
            if (type === "Out Of Stock") {
                const bl = [], cl = [];
                for (const blank of blanks) {
                    for (const inv of blank.inventories) {
                        const onOrder = (inv.attached?.length ?? 0) - (inv.orders?.reduce((acc, curr) => acc + parseInt(curr.quantity || 0), 0) ?? 0);
                        if (onOrder > 0) {
                            if (!bl.includes(inv.style_code)) bl.push(inv.style_code);
                            if (!cl.includes(inv.color_name)) cl.push(inv.color_name);
                            no.push({ inv, order: onOrder, included: false, location: defaultLocation });
                        }
                    }
                }
                setBlankCodes([...bl]);
                setColors([...cl]);
            }
            if (type === "Inventory Order") {
                const bl = [], cl = [];
                for (const blank of blanks) {
                    for (const inv of blank.inventories) {
                        const inStock = inv.quantity + (inv.orders?.reduce((acc, curr) => acc + parseInt(curr.quantity || 0), 0) ?? 0);
                        if (inStock - inv.order_at_quantity < 0) {
                            if (!bl.includes(inv.style_code)) bl.push(inv.style_code);
                            if (!cl.includes(inv.color_name)) cl.push(inv.color_name);
                            no.push({ inv, order: inv.quantity_to_order + (inv.order_at_quantity - inStock), included: false, location: defaultLocation });
                        }
                    }
                }
                setBlankCodes([...bl]);
                setColors([...cl]);
            }
            setNeedsOrdered([...no]);
            if (blanks.length > 0) setLoading(false);
        }
    }, [open, blanks]);

    const updateOrder = (param, value) => setOrder(prev => ({ ...prev, [param]: value }));

    const updateItem = (id, param, value) => {
        setNeedsOrdered(prev => prev.map(n =>
            n.inv._id.toString() === id.toString()
                ? { ...n, [param]: param === "order" ? parseInt(value) : param === "included" ? !n.included : value }
                : n
        ));
    };

    const setAllIncluded = (value) => setNeedsOrdered(prev => prev.map(n => ({ ...n, included: value })));

    const setBlankIncluded = (code, value) =>
        setNeedsOrdered(prev => prev.map(n => n.inv.style_code === code ? { ...n, included: value } : n));

    const setColorIncluded = (code, cl, value) =>
        setNeedsOrdered(prev => prev.map(n =>
            n.inv.style_code === code && n.inv.color_name === cl ? { ...n, included: value } : n
        ));

    const sub = async () => {
        if (!order.poNumber || !order.company) { alert("PO Number and Company are required"); return; }
        const res = await axios.post("/api/admin/inventory/order", {
            order,
            needsOrdered,
            items: type === "Inventory Order" ? [] : items,
        });
        if (res?.data) {
            setBlanks(res.data.combined);
            setItems(res.data.items);
            setOpen(false);
        }
    };

    const totalItems    = needsOrdered.length;
    const totalIncluded = needsOrdered.filter(n => n.included).length;
    const totalQty      = needsOrdered.reduce((acc, n) => acc + (n.included ? n.order : 0), 0);

    const isInventoryOrder = type === "Inventory Order";

    return (
        <Dialog open={open} onClose={() => setOpen(false)} maxWidth="lg" fullWidth scroll="paper">
            {/* Title */}
            <DialogTitle sx={{ py: 1.5, borderBottom: "1px solid", borderColor: "divider" }}>
                <Stack direction="row" alignItems="center" spacing={1.5}>
                    <Box sx={{
                        width: 32, height: 32, borderRadius: 1.5, flexShrink: 0,
                        background: isInventoryOrder
                            ? "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)"
                            : "linear-gradient(135deg, #ef4444 0%, #f97316 100%)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                        <ChecklistIcon sx={{ color: "#fff", fontSize: 18 }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1.2 }}>
                            {isInventoryOrder ? "Create Inventory Order" : "Create Out Of Stock Order"}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {isInventoryOrder ? "Order items that are below minimum stock levels" : "Order items needed to fulfill existing orders"}
                        </Typography>
                    </Box>
                    <IconButton size="small" onClick={() => setOpen(false)}><CloseIcon fontSize="small" /></IconButton>
                </Stack>
            </DialogTitle>

            <DialogContent sx={{ p: 2 }}>
                {loading ? (
                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", py: 10, gap: 2 }}>
                        <CircularProgress size={52} />
                        <Typography variant="h6" color="text.secondary">Loading inventory…</Typography>
                    </Box>
                ) : (
                    <Stack spacing={2}>
                        {/* Order Info */}
                        <Card variant="outlined" sx={{ borderRadius: 2 }}>
                            <Box sx={{ px: 2, py: 1.25, borderBottom: "1px solid", borderColor: "divider" }}>
                                <Typography variant="subtitle2" fontWeight={700} color="text.secondary">ORDER DETAILS</Typography>
                            </Box>
                            <Box sx={{ p: 2 }}>
                                <Grid2 container spacing={1.5}>
                                    <Grid2 size={{ xs: 12, sm: 6 }}>
                                        <TextField fullWidth size="small" label="PO Number" required
                                            value={order.poNumber} onChange={(e) => updateOrder("poNumber", e.target.value)} />
                                    </Grid2>
                                    <Grid2 size={{ xs: 12, sm: 6 }}>
                                        <TextField fullWidth size="small" label="Company / Vendor" required
                                            value={order.company} onChange={(e) => updateOrder("company", e.target.value)} />
                                    </Grid2>
                                    <Grid2 size={{ xs: 12, sm: 6 }}>
                                        <TextField fullWidth size="small" label="Date Ordered" type="date"
                                            InputLabelProps={{ shrink: true }}
                                            value={order.dateOrdered} onChange={(e) => updateOrder("dateOrdered", e.target.value)} />
                                    </Grid2>
                                    <Grid2 size={{ xs: 12, sm: 6 }}>
                                        <TextField fullWidth size="small" label="Expected Delivery" type="date"
                                            InputLabelProps={{ shrink: true }}
                                            value={order.dateExpected} onChange={(e) => updateOrder("dateExpected", e.target.value)} />
                                    </Grid2>
                                </Grid2>
                            </Box>
                        </Card>

                        {/* Items section */}
                        <Card variant="outlined" sx={{ borderRadius: 2 }}>
                            {/* Items header */}
                            <Box sx={{ px: 2, py: 1.25, borderBottom: "1px solid", borderColor: "divider", display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
                                <Typography variant="subtitle2" fontWeight={700} color="text.secondary">ITEMS TO ORDER</Typography>
                                <Chip
                                    label={`${totalIncluded} / ${totalItems} selected`}
                                    size="small"
                                    color={totalIncluded > 0 ? "primary" : "default"}
                                    variant={totalIncluded > 0 ? "filled" : "outlined"}
                                />
                                {totalQty > 0 && <Chip label={`${totalQty} units`} size="small" color="success" />}
                                <Stack direction="row" spacing={0.75} sx={{ ml: "auto" }}>
                                    <Button size="small" variant="outlined" onClick={() => setAllIncluded(true)}>Select All</Button>
                                    <Button size="small" variant="outlined" color="inherit" onClick={() => setAllIncluded(false)}>Deselect All</Button>
                                    <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={() => setAddModal(true)}>
                                        Add Items
                                    </Button>
                                </Stack>
                            </Box>

                            {/* Column headers */}
                            <Box sx={{ px: 2, py: 0.75, bgcolor: "action.hover" }}>
                                <Grid2 container spacing={1} alignItems="center">
                                    <Grid2 size={0.5} />
                                    <Grid2 size={2}><Typography variant="caption" fontWeight={700} color="text.secondary">SIZE</Typography></Grid2>
                                    <Grid2 size={isInventoryOrder ? 6 : 5.5}>
                                        <Typography variant="caption" fontWeight={700} color="text.secondary">SKU</Typography>
                                    </Grid2>
                                    <Grid2 size={1.5}><Typography variant="caption" fontWeight={700} color="text.secondary">QTY</Typography></Grid2>
                                    <Grid2 size={2.5}><Typography variant="caption" fontWeight={700} color="text.secondary">LOCATION</Typography></Grid2>
                                </Grid2>
                            </Box>

                            {/* Blank → color accordions */}
                            {blankCodes.map(code => {
                                const codeItems = needsOrdered.filter(n => n.inv.style_code === code);
                                const codeIncluded = codeItems.filter(n => n.included).length;
                                const allIncluded = codeIncluded === codeItems.length;
                                const someIncluded = codeIncluded > 0 && !allIncluded;
                                return (
                                    <Accordion
                                        key={code}
                                        expanded={expandedBlank === code}
                                        onChange={() => setExpandedBlank(expandedBlank === code ? "" : code)}
                                        disableGutters
                                        sx={{ "&:before": { display: "none" }, borderTop: "1px solid", borderColor: "divider" }}
                                    >
                                        <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 2, minHeight: 44 }}>
                                            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ flex: 1, mr: 1 }}>
                                                <Checkbox
                                                    size="small"
                                                    checked={allIncluded}
                                                    indeterminate={someIncluded}
                                                    onClick={(e) => { e.stopPropagation(); setBlankIncluded(code, !allIncluded); }}
                                                />
                                                <Chip label={code} size="small" color="primary" variant="outlined" sx={{ fontWeight: 700, fontFamily: "monospace" }} />
                                                <Chip
                                                    label={`${codeIncluded} / ${codeItems.length}`}
                                                    size="small"
                                                    variant="outlined"
                                                    color={codeIncluded > 0 ? "success" : "default"}
                                                    sx={{ ml: "auto" }}
                                                />
                                            </Stack>
                                        </AccordionSummary>
                                        <AccordionDetails sx={{ p: 0 }}>
                                            {colors.map(cl => {
                                                const colorItems = needsOrdered.filter(n => n.inv.style_code === code && n.inv.color_name === cl);
                                                if (!colorItems.length) return null;
                                                const colorIncluded = colorItems.filter(n => n.included).length;
                                                const allColorIncluded = colorIncluded === colorItems.length;
                                                const someColorIncluded = colorIncluded > 0 && !allColorIncluded;
                                                return (
                                                    <Accordion
                                                        key={cl}
                                                        expanded={expandedColor === `${code}-${cl}`}
                                                        onChange={() => setExpandedColor(expandedColor === `${code}-${cl}` ? "" : `${code}-${cl}`)}
                                                        disableGutters
                                                        sx={{ "&:before": { display: "none" }, borderTop: "1px solid", borderColor: "divider" }}
                                                    >
                                                        <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 3, minHeight: 40, bgcolor: "action.hover" }}>
                                                            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ flex: 1, mr: 1 }}>
                                                                <Checkbox
                                                                    size="small"
                                                                    checked={allColorIncluded}
                                                                    indeterminate={someColorIncluded}
                                                                    onClick={(e) => { e.stopPropagation(); setColorIncluded(code, cl, !allColorIncluded); }}
                                                                />
                                                                <Typography variant="body2" fontWeight={600} sx={{ textTransform: "capitalize" }}>{cl}</Typography>
                                                                <Chip
                                                                    label={`${colorIncluded} / ${colorItems.length}`}
                                                                    size="small"
                                                                    variant="outlined"
                                                                    color={colorIncluded > 0 ? "success" : "default"}
                                                                    sx={{ ml: "auto" }}
                                                                />
                                                            </Stack>
                                                        </AccordionSummary>
                                                        <AccordionDetails sx={{ px: 2, py: 1 }}>
                                                            <Stack spacing={0.5}>
                                                                {colorItems.map(no => (
                                                                    <Box
                                                                        key={no.inv._id}
                                                                        sx={{
                                                                            borderRadius: 1.5, px: 1, py: 0.75,
                                                                            bgcolor: no.included ? "success.50" : "transparent",
                                                                            borderLeft: no.included ? "3px solid" : "3px solid transparent",
                                                                            borderColor: no.included ? "success.main" : "transparent",
                                                                            transition: "all 0.15s",
                                                                        }}
                                                                    >
                                                                        <Grid2 container spacing={1} alignItems="center">
                                                                            <Grid2 size={0.5}>
                                                                                <Checkbox
                                                                                    size="small"
                                                                                    checked={no.included}
                                                                                    onChange={() => updateItem(no.inv._id, "included")}
                                                                                    sx={{ p: 0 }}
                                                                                />
                                                                            </Grid2>
                                                                            <Grid2 size={2}>
                                                                                <Chip
                                                                                    label={no.inv.size_name}
                                                                                    size="small"
                                                                                    variant={no.included ? "filled" : "outlined"}
                                                                                    color={no.included ? "success" : "default"}
                                                                                    sx={{ fontWeight: 700, textTransform: "uppercase", width: "100%" }}
                                                                                />
                                                                            </Grid2>
                                                                            <Grid2 size={isInventoryOrder ? 6 : 5.5}>
                                                                                <Typography
                                                                                    variant="caption"
                                                                                    sx={{ fontFamily: "monospace", color: no.included ? "text.primary" : "text.disabled" }}
                                                                                >
                                                                                    {no.inv.style_code}-{no.inv.color_name}-{no.inv.size_name}
                                                                                </Typography>
                                                                            </Grid2>
                                                                            <Grid2 size={1.5}>
                                                                                <TextField
                                                                                    size="small"
                                                                                    type="number"
                                                                                    fullWidth
                                                                                    value={no.order}
                                                                                    disabled={!no.included}
                                                                                    onChange={(e) => updateItem(no.inv._id, "order", e.target.value)}
                                                                                    inputProps={{ min: 0, style: { textAlign: "center" } }}
                                                                                />
                                                                            </Grid2>
                                                                            <Grid2 size={2.5}>
                                                                                <TextField
                                                                                    size="small"
                                                                                    fullWidth
                                                                                    placeholder="Location"
                                                                                    value={no.location ?? ""}
                                                                                    disabled={!no.included}
                                                                                    onChange={(e) => updateItem(no.inv._id, "location", e.target.value)}
                                                                                />
                                                                            </Grid2>
                                                                        </Grid2>
                                                                    </Box>
                                                                ))}
                                                            </Stack>
                                                        </AccordionDetails>
                                                    </Accordion>
                                                );
                                            })}
                                        </AccordionDetails>
                                    </Accordion>
                                );
                            })}

                            {blankCodes.length === 0 && (
                                <Box sx={{ py: 6, textAlign: "center" }}>
                                    <Typography color="text.secondary">No items need to be ordered.</Typography>
                                </Box>
                            )}
                        </Card>
                    </Stack>
                )}
            </DialogContent>

            {!loading && (
                <DialogActions sx={{ px: 2, py: 1.5, borderTop: "1px solid", borderColor: "divider" }}>
                    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ width: "100%" }}>
                        {/* Summary */}
                        <Stack direction="row" spacing={1}>
                            <Chip label={`${totalIncluded} items`} size="small" color="primary" variant="outlined" />
                            <Chip label={`${totalQty} units`} size="small" color="success" variant="outlined" />
                        </Stack>
                        <Box sx={{ flex: 1 }} />
                        <Button onClick={() => setOpen(false)}>Cancel</Button>
                        <Button
                            variant="contained"
                            onClick={sub}
                            disabled={totalIncluded === 0 || !order.poNumber || !order.company}
                        >
                            Submit Order
                        </Button>
                    </Stack>
                </DialogActions>
            )}

            <AddModal
                open={addModal} setOpen={setAddModal}
                setNeedsOrdered={setNeedsOrdered} needsOrdered={needsOrdered}
                blanks={blanks} setBlanks={setBlan}
                colors={colors} setColors={setColors}
                setBlankCodes={setBlankCodes} blankCodes={blankCodes}
                defaultLocation={defaultLocation}
            />
        </Dialog>
    );
}

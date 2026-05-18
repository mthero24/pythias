"use client";
import {
    Box, Typography, Button, Stack, Card, Chip, Collapse,
    IconButton, LinearProgress, Snackbar, Alert, CircularProgress, Tooltip,
} from "@mui/material";
import ViewListIcon from "@mui/icons-material/ViewList";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import PrintIcon from "@mui/icons-material/Print";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import axios from "axios";
import { useState } from "react";

function getBulkGroups(order) {
    const seen = new Set();
    const groups = [];
    for (const i of order.items) {
        if (i.bulkId && !seen.has(i.bulkId) && i.canceled == false) {
            seen.add(i.bulkId);
            groups.push(i.bulkId);
        }
    }
    return groups;
}

function itemInStock(item) {
    return item.type === "sublimation" || !!item.inventory?.inventory?.inStock?.includes(item._id.toString());
}

function orderStats(order) {
    const active = order.items.filter(i => i.canceled == false);
    const inStock = active.filter(itemInStock).length;
    return { total: active.length, inStock, outOfStock: active.length - inStock };
}

function StatusChip({ inStock, total }) {
    if (inStock === total)  return <Chip icon={<CheckCircleIcon />}  label="All In Stock"   size="small" sx={{ bgcolor: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0", fontWeight: 600, fontSize: "0.7rem" }} />;
    if (inStock === 0)      return <Chip icon={<ErrorOutlineIcon />} label="Out Of Stock"   size="small" sx={{ bgcolor: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", fontWeight: 600, fontSize: "0.7rem" }} />;
    return                         <Chip icon={<WarningAmberIcon />} label="Partially Stocked" size="small" sx={{ bgcolor: "#fffbeb", color: "#d97706", border: "1px solid #fde68a", fontWeight: 600, fontSize: "0.7rem" }} />;
}

function OrderRow({ order, index }) {
    const [open, setOpen] = useState(false);
    const [printing, setPrinting] = useState(false);
    const [printed, setPrinted] = useState(false);
    const [snack, setSnack] = useState(null);

    const { total, inStock, outOfStock } = orderStats(order);
    const pct = total > 0 ? Math.round((inStock / total) * 100) : 0;
    const bulkGroups = getBulkGroups(order);

    const print = async () => {
        setPrinting(true);
        const bulkItems = [];
        const seen = new Set();
        for (const bulkId of bulkGroups) {
            const items = order.items.filter(it => it.bulkId === bulkId && it.canceled == false);
            if (items.length > 0 && items[0].type !== "sublimation" && !seen.has(bulkId)) {
                seen.add(bulkId);
                bulkItems.push({
                    bulkId,
                    inventory: items[0].inventory?.inventory ?? null,
                    quantity: items.length,
                    totalQuantity: total,
                    blankCode: items[0].styleCode,
                    colorName: items[0].colorName,
                    sizeName: items[0].sizeName,
                    designSku: items[0].designSku,
                    sku: items[0].sku,
                    type: items[0].type,
                    poNumber: order.poNumber,
                    order,
                    design: items[0].design,
                    shippingType: order.shippingType,
                    items,
                });
            }
        }
        const res = await axios.post("/api/production/print-labels/bulk", { items: bulkItems, poNumber: order.poNumber }).catch(() => null);
        setPrinting(false);
        if (res?.data?.error === false) {
            setPrinted(true);
            setSnack({ severity: "success", msg: `Labels sent for ${order.poNumber}` });
        } else {
            setSnack({ severity: "error", msg: res?.data?.msg ?? "Print failed" });
        }
    };

    return (
        <>
            <Card
                variant="outlined"
                sx={{
                    borderRadius: 2,
                    borderColor: "#e2e8f0",
                    bgcolor: index % 2 === 0 ? "#fff" : "#f8fafc",
                    mb: 1,
                    overflow: "hidden",
                }}
            >
                {/* Main row */}
                <Box sx={{ px: 2.5, py: 1.75, display: "grid", gridTemplateColumns: "110px 1fr 80px 80px 80px auto auto", gap: 2, alignItems: "center" }}>
                    <Typography variant="body2" color="text.secondary">
                        {new Date(order.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </Typography>

                    <Typography variant="body2" fontWeight={700} sx={{ fontFamily: "monospace" }}>
                        {order.poNumber}
                    </Typography>

                    <Tooltip title="Total items">
                        <Stack alignItems="center" spacing={0}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: 0.5 }}>Items</Typography>
                            <Typography variant="body2" fontWeight={700}>{total}</Typography>
                        </Stack>
                    </Tooltip>

                    <Tooltip title="In stock">
                        <Stack alignItems="center" spacing={0}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: 0.5 }}>In Stock</Typography>
                            <Typography variant="body2" fontWeight={700} sx={{ color: inStock === total ? "#16a34a" : inStock === 0 ? "#dc2626" : "#d97706" }}>{inStock}</Typography>
                        </Stack>
                    </Tooltip>

                    <Tooltip title="Out of stock">
                        <Stack alignItems="center" spacing={0}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: 0.5 }}>OOS</Typography>
                            <Typography variant="body2" fontWeight={700} sx={{ color: outOfStock > 0 ? "#dc2626" : "#16a34a" }}>{outOfStock}</Typography>
                        </Stack>
                    </Tooltip>

                    <StatusChip inStock={inStock} total={total} />

                    <Stack direction="row" spacing={0.5} alignItems="center">
                        <Button
                            size="small"
                            variant="contained"
                            startIcon={printing ? <CircularProgress size={14} sx={{ color: "#fff" }} /> : <PrintIcon fontSize="small" />}
                            disabled={printing}
                            onClick={print}
                            sx={{
                                bgcolor: printed ? "#16a34a" : "#6366f1",
                                "&:hover": { bgcolor: printed ? "#15803d" : "#4f46e5" },
                                "&:disabled": { bgcolor: "#6366f1", opacity: 0.6, color: "#fff" },
                                fontWeight: 600,
                                fontSize: "0.75rem",
                                px: 1.5,
                                minWidth: 80,
                            }}
                        >
                            {printing ? "Sending…" : printed ? "Sent ✓" : "Print"}
                        </Button>

                        <IconButton size="small" onClick={() => setOpen(p => !p)} sx={{ color: "#6b7280" }}>
                            {open ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                        </IconButton>
                    </Stack>
                </Box>

                {/* Progress bar */}
                <LinearProgress
                    variant="determinate"
                    value={pct}
                    sx={{
                        height: 3,
                        bgcolor: "#f1f5f9",
                        "& .MuiLinearProgress-bar": {
                            bgcolor: inStock === total ? "#16a34a" : inStock === 0 ? "#dc2626" : "#f59e0b",
                        },
                    }}
                />

                {/* Expanded detail */}
                <Collapse in={open}>
                    <Box sx={{ borderTop: "1px solid #e2e8f0", bgcolor: "#f8fafc" }}>
                        {/* Detail header */}
                        <Box sx={{
                            px: 2.5, py: 1,
                            display: "grid",
                            gridTemplateColumns: "140px 1fr 60px 60px 100px 60px 80px",
                            gap: 1,
                        }}>
                            {["Bulk ID", "SKU / Inventory", "Qty", "In Stock", "Needs Order", "Ordered", "Printed"].map(h => (
                                <Typography key={h} variant="caption" fontWeight={700} color="text.secondary"
                                    sx={{ textTransform: "uppercase", letterSpacing: 0.5, fontSize: "0.62rem" }}>
                                    {h}
                                </Typography>
                            ))}
                        </Box>

                        {bulkGroups.map((bulkId, bi) => {
                            const items = order.items.filter(i => i.bulkId === bulkId && i.canceled == false);
                            const inv = items[0]?.inventory?.inventory;
                            const isSub = items[0]?.type === "sublimation";
                            const groupInStock = isSub ? items.length : items.filter(i => inv?.inStock?.includes(i._id.toString())).length;
                            const needsOrdered = isSub ? 0 : items.filter(i => inv?.attached?.includes(i._id.toString())).length;
                            const ordered = isSub ? 0 : (inv?.orders?.map(o => o.items.filter(i => items.map(it => it._id.toString()).includes(i.toString())).length).reduce((a, c) => a + c, 0) ?? 0);
                            const labelsOut = items.filter(i => i.labelPrinted).length;
                            const skuDisplay = isSub ? items[0]?.sku : inv?.inventory_id;

                            return (
                                <Box
                                    key={bulkId}
                                    sx={{
                                        px: 2.5, py: 1,
                                        display: "grid",
                                        gridTemplateColumns: "140px 1fr 60px 60px 100px 60px 80px",
                                        gap: 1,
                                        alignItems: "center",
                                        borderTop: "1px solid #e2e8f0",
                                        bgcolor: bi % 2 === 0 ? "#fff" : "#f8fafc",
                                    }}
                                >
                                    <Typography variant="body2" sx={{ fontFamily: "monospace", fontSize: "0.72rem", color: "#374151", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                        {bulkId}
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontFamily: "monospace", fontSize: "0.72rem", color: "#374151", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                        {skuDisplay ?? "—"}
                                    </Typography>
                                    <Typography variant="body2" fontWeight={600} textAlign="center">{items.length}</Typography>
                                    <Typography variant="body2" fontWeight={600} textAlign="center" sx={{ color: groupInStock === items.length ? "#16a34a" : groupInStock === 0 ? "#dc2626" : "#d97706" }}>
                                        {groupInStock}
                                    </Typography>
                                    <Typography variant="body2" fontWeight={600} textAlign="center" sx={{ color: needsOrdered > 0 ? "#d97706" : "#6b7280" }}>
                                        {needsOrdered}
                                    </Typography>
                                    <Typography variant="body2" fontWeight={600} textAlign="center" sx={{ color: ordered > 0 ? "#2563eb" : "#6b7280" }}>
                                        {ordered}
                                    </Typography>
                                    <Typography variant="body2" fontWeight={600} textAlign="center" sx={{ color: labelsOut > 0 ? "#16a34a" : "#6b7280" }}>
                                        {labelsOut}/{items.length}
                                    </Typography>
                                </Box>
                            );
                        })}
                    </Box>
                </Collapse>
            </Card>

            <Snackbar open={!!snack} autoHideDuration={3500} onClose={() => setSnack(null)} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
                <Alert severity={snack?.severity} variant="filled" onClose={() => setSnack(null)} sx={{ width: "100%" }}>
                    {snack?.msg}
                </Alert>
            </Snackbar>
        </>
    );
}

export function BulkMain({ orders }) {
    const allStats = orders.reduce((acc, o) => {
        const { total, inStock, outOfStock } = orderStats(o);
        acc.items += total;
        acc.inStock += inStock;
        acc.outOfStock += outOfStock;
        return acc;
    }, { items: 0, inStock: 0, outOfStock: 0 });

    return (
        <Box sx={{ bgcolor: "#f8fafc", minHeight: "100vh" }}>
            {/* Header */}
            <Box sx={{ bgcolor: "#fff", borderBottom: "1px solid #e2e8f0", px: 3, py: 2 }}>
                <Stack direction="row" alignItems="center" spacing={1.5}>
                    <Box sx={{
                        width: 36, height: 36, borderRadius: 2, flexShrink: 0,
                        background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                        <ViewListIcon sx={{ color: "#fff", fontSize: 20 }} />
                    </Box>
                    <Box>
                        <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: -0.5, lineHeight: 1.2 }}>
                            Bulk Orders
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {orders.length} pending order{orders.length !== 1 ? "s" : ""}
                        </Typography>
                    </Box>
                </Stack>
            </Box>

            {/* Summary stats */}
            <Box sx={{ px: 3, py: 2, display: "flex", gap: 2, flexWrap: "wrap" }}>
                {[
                    { label: "Total Items", value: allStats.items, color: "#6366f1" },
                    { label: "In Stock",    value: allStats.inStock,    color: "#16a34a" },
                    { label: "Out Of Stock",value: allStats.outOfStock, color: allStats.outOfStock > 0 ? "#dc2626" : "#16a34a" },
                ].map(stat => (
                    <Card key={stat.label} variant="outlined" sx={{ borderRadius: 2, px: 2.5, py: 1.5, borderColor: "#e2e8f0", minWidth: 120 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.6, fontSize: "0.62rem" }}>
                            {stat.label}
                        </Typography>
                        <Typography variant="h5" fontWeight={800} sx={{ color: stat.color, lineHeight: 1.2 }}>
                            {stat.value}
                        </Typography>
                    </Card>
                ))}
            </Box>

            {/* Column headers */}
            <Box sx={{ px: 3, pb: 0.5, display: "grid", gridTemplateColumns: "110px 1fr 80px 80px 80px auto auto", gap: 2, alignItems: "center" }}>
                {["Date", "PO Number", "Items", "In Stock", "OOS", "Status", ""].map((h, i) => (
                    <Typography key={i} variant="caption" fontWeight={700} color="text.secondary"
                        sx={{ textTransform: "uppercase", letterSpacing: 0.6, fontSize: "0.62rem" }}>
                        {h}
                    </Typography>
                ))}
            </Box>

            {/* Orders */}
            <Box sx={{ px: 3, pb: 3 }}>
                {orders.length === 0 ? (
                    <Card variant="outlined" sx={{ borderRadius: 2, p: 4, textAlign: "center", borderStyle: "dashed" }}>
                        <CheckCircleIcon sx={{ fontSize: 40, color: "#16a34a", mb: 1 }} />
                        <Typography variant="h6" fontWeight={700} color="text.secondary">No bulk orders pending</Typography>
                    </Card>
                ) : (
                    orders.map((order, i) => <OrderRow key={order._id} order={order} index={i} />)
                )}
            </Box>
        </Box>
    );
}

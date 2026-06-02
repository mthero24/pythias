"use client";
import { useState, useEffect, useRef } from "react";
import {
    Box, Grid2, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions,
    Card, Divider, Chip, Accordion, AccordionDetails, AccordionSummary, TextField,
    Stack, IconButton, InputAdornment, CircularProgress,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import axios from "axios";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import SearchIcon from "@mui/icons-material/Search";
import HistoryIcon from "@mui/icons-material/History";

function OrderCard({ o, editable, edit, orderEdit, setEdit, setOrderEdit, updateQuantity, deleteItem, setConfirmReceive, receiving }) {
    return (
        <Card variant="outlined" sx={{ borderRadius: 2 }}>
            <Box sx={{ px: 2, py: 1.5, display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap", borderBottom: "1px solid", borderColor: "divider" }}>
                <Chip label={o.poNumber} color="primary" variant="outlined" sx={{ fontWeight: 700, fontFamily: "monospace" }} />
                <Typography variant="body2" fontWeight={600}>{o.vendor}</Typography>
                <Chip label={`Ordered: ${new Date(o.dateOrdered).toLocaleDateString("en-US")}`} size="small" variant="outlined" />
                {o.dateExpected && (
                    <Chip label={`Expected: ${new Date(o.dateExpected).toLocaleDateString("en-US")}`} size="small" variant="outlined" color="info" />
                )}
                {o.received
                    ? <Chip icon={<CheckCircleIcon />} label="Received" size="small" color="success" />
                    : editable && (
                        <Button
                            size="small"
                            variant={edit && orderEdit === o._id.toString() ? "contained" : "outlined"}
                            sx={{ ml: "auto" }}
                            onClick={() => { setEdit(p => !p); setOrderEdit(o._id.toString()); }}
                        >
                            {edit && orderEdit === o._id.toString() ? "Done" : "Edit"}
                        </Button>
                    )
                }
            </Box>

            <Box sx={{ p: 1 }}>
                {o.locations.map(l => (
                    <Accordion key={l._id} variant="outlined" sx={{ mb: 0.5, borderRadius: "8px !important", "&:before": { display: "none" } }}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Stack direction="row" alignItems="center" spacing={1} sx={{ flex: 1 }}>
                                <Typography variant="body2" fontWeight={600}>{l.name.replace(/ /g, "")}</Typography>
                                {l.received && <Chip icon={<CheckCircleIcon />} label="Received" size="small" color="success" />}
                                <Chip label={`${l.items?.length ?? 0} items`} size="small" variant="outlined" sx={{ ml: "auto", mr: 1 }} />
                            </Stack>
                        </AccordionSummary>
                        <AccordionDetails sx={{ pt: 0 }}>
                            {editable && !l.received && !o.received && (
                                <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1 }}>
                                    <Button size="small" variant="contained" color="success"
                                        disabled={receiving}
                                        onClick={() => setConfirmReceive({ o, l })}>
                                        Mark Received
                                    </Button>
                                </Box>
                            )}
                            {l.items?.map(i => (
                                <Box key={i._id} sx={{ mb: 0.5 }}>
                                    <Grid2 container spacing={1} alignItems="center">
                                        <Grid2 size={5}>
                                            <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
                                                {i.inventory?.style_code}-{i.inventory?.color_name}-{i.inventory?.size_name}
                                            </Typography>
                                        </Grid2>
                                        <Grid2 size={4}>
                                            {editable && edit && orderEdit === o._id.toString() && !o.received
                                                ? <TextField size="small" type="number" value={i.quantity}
                                                    onChange={(e) => updateQuantity(o._id.toString(), l._id.toString(), i._id.toString(), e.target.value)} />
                                                : <Chip label={i.quantity} size="small" variant="outlined" />
                                            }
                                        </Grid2>
                                        <Grid2 size={2}>
                                            <Typography variant="caption" color="text.secondary">{l.name}</Typography>
                                        </Grid2>
                                        <Grid2 size={1} sx={{ display: "flex", justifyContent: "center" }}>
                                            {editable && edit && orderEdit === o._id.toString() && !o.received && (
                                                <DeleteIcon sx={{ cursor: "pointer", color: "error.main", fontSize: 18 }}
                                                    onClick={() => deleteItem(o._id.toString(), l._id.toString(), i._id.toString())} />
                                            )}
                                        </Grid2>
                                    </Grid2>
                                </Box>
                            ))}
                        </AccordionDetails>
                    </Accordion>
                ))}
            </Box>
        </Card>
    );
}

export function DisplayModal({ open, setOpen }) {
    const [orders, setOrders]             = useState([]);
    const [edit, setEdit]                 = useState(false);
    const [orderEdit, setOrderEdit]       = useState(null);
    const [confirmReceive, setConfirmReceive] = useState(null);
    const [receiving, setReceiving]           = useState(false);
    const [view, setView]                 = useState("open");
    const [allOrders, setAllOrders]       = useState([]);
    const [allTotal, setAllTotal]         = useState(0);
    const [allSkip, setAllSkip]           = useState(0);
    const [allSearch, setAllSearch]       = useState("");
    const [allLoading, setAllLoading]     = useState(false);
    const debounceRef = useRef(null);

    useEffect(() => {
        if (!open) return;
        axios.get("/api/admin/inventory/order").then(res => {
            if (res?.data) setOrders(res.data.orders);
        });
        setView("open");
        setAllOrders([]);
        setAllSearch("");
        setAllSkip(0);
    }, [open]);

    const fetchAll = async (search, skip, append) => {
        setAllLoading(true);
        try {
            const res = await axios.get("/api/admin/inventory/order", {
                params: { all: "true", q: search, skip },
            });
            if (res?.data) {
                setAllOrders(prev => append ? [...prev, ...res.data.orders] : res.data.orders);
                setAllTotal(res.data.total);
                setAllSkip(skip + res.data.orders.length);
            }
        } finally {
            setAllLoading(false);
        }
    };

    const switchToAll = () => {
        setView("all");
        if (allOrders.length === 0) fetchAll("", 0, false);
    };

    const handleSearchChange = (val) => {
        setAllSearch(val);
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setAllSkip(0);
            fetchAll(val, 0, false);
        }, 400);
    };

    const markReceived = async ({ order, location }) => {
        setReceiving(true);
        const res = await axios.put("/api/admin/inventory/order", { id: order._id, location: location.name })
            .catch(() => null);
        setReceiving(false);
        setConfirmReceive(null);
        if (res?.data?.error === false) setOrders(res.data.orders);
        else alert("Something went wrong marking order received — do not click Receive again, contact support");
    };

    const updateQuantity = async (orderId, locationId, itemId, quantity) => {
        const o  = orders.find(or => or._id.toString() === orderId);
        const lo = o.locations.find(loc => loc._id.toString() === locationId);
        const it = lo.items.find(itm => itm._id.toString() === itemId);
        it.quantity = parseInt(quantity);
        setOrders([...orders.filter(or => or._id.toString() !== orderId), o]);
        const res = await axios.put("/api/admin/inventory/create-order/edit", { orderId: o._id, items: o.locations })
            .catch(() => null);
        if (!res?.data || res.data.error !== false) alert("Something went wrong updating quantity, please refresh");
    };

    const deleteItem = async (orderId, locationId, itemId) => {
        const o  = orders.find(or => or._id.toString() === orderId);
        const lo = o.locations.find(loc => loc._id.toString() === locationId);
        lo.items = lo.items.filter(itm => itm._id.toString() !== itemId);
        setOrders([...orders.filter(or => or._id.toString() !== orderId), o]);
        const res = await axios.post("/api/admin/inventory/create-order/edit", { orderId: o._id, items: o.locations })
            .catch(() => null);
        if (!res?.data || res.data.error !== false) alert("Something went wrong deleting item, please refresh");
    };

    const cardProps = { edit, orderEdit, setEdit, setOrderEdit, updateQuantity, deleteItem, setConfirmReceive, receiving };

    return (
        <>
            <Dialog open={open} onClose={() => setOpen(false)} maxWidth="lg" fullWidth scroll="paper">
                <DialogTitle sx={{ py: 1.5, borderBottom: "1px solid", borderColor: "divider" }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <LocalShippingIcon color="primary" />
                        <Typography variant="h6" fontWeight={700} sx={{ flex: 1 }}>Inventory Orders</Typography>
                        <Stack direction="row" spacing={0.75}>
                            <Button size="small"
                                variant={view === "open" ? "contained" : "outlined"}
                                onClick={() => setView("open")}
                                sx={{ minWidth: 70 }}
                            >
                                Open
                            </Button>
                            <Button size="small"
                                variant={view === "all" ? "contained" : "outlined"}
                                startIcon={<HistoryIcon />}
                                onClick={switchToAll}
                            >
                                All Orders
                            </Button>
                        </Stack>
                        <IconButton size="small" onClick={() => setOpen(false)}><CloseIcon fontSize="small" /></IconButton>
                    </Stack>
                </DialogTitle>

                {view === "all" && (
                    <Box sx={{ px: 2, pt: 1.5, pb: 0 }}>
                        <TextField
                            fullWidth size="small"
                            placeholder="Search by PO number or vendor…"
                            value={allSearch}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") { clearTimeout(debounceRef.current); setAllSkip(0); fetchAll(allSearch, 0, false); } }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon fontSize="small" sx={{ color: "text.disabled", cursor: "pointer" }}
                                            onClick={() => { clearTimeout(debounceRef.current); setAllSkip(0); fetchAll(allSearch, 0, false); }} />
                                    </InputAdornment>
                                ),
                                endAdornment: allLoading
                                    ? <InputAdornment position="end"><CircularProgress size={16} /></InputAdornment>
                                    : null,
                            }}
                        />
                    </Box>
                )}

                <DialogContent sx={{ p: 2 }}>
                    {view === "open" ? (
                        <Stack spacing={2}>
                            {orders.length === 0 && (
                                <Typography color="text.secondary" textAlign="center" py={4}>No open orders</Typography>
                            )}
                            {orders.map(o => (
                                <OrderCard key={o._id} o={o} editable={true} {...cardProps} />
                            ))}
                        </Stack>
                    ) : (
                        <Stack spacing={2}>
                            {allOrders.length === 0 && !allLoading && (
                                <Typography color="text.secondary" textAlign="center" py={4}>No orders found</Typography>
                            )}
                            {allOrders.map(o => (
                                <OrderCard key={o._id} o={o} editable={false} {...cardProps} />
                            ))}
                            {allOrders.length < allTotal && (
                                <Button variant="outlined" disabled={allLoading}
                                    onClick={() => fetchAll(allSearch, allSkip, true)}>
                                    {allLoading
                                        ? <CircularProgress size={18} />
                                        : `Load More (${allTotal - allOrders.length} remaining)`}
                                </Button>
                            )}
                        </Stack>
                    )}
                </DialogContent>

                <DialogActions>
                    <Button onClick={() => setOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={!!confirmReceive} onClose={() => !receiving && setConfirmReceive(null)} maxWidth="xs" fullWidth>
                <DialogTitle fontWeight={700}>Confirm Receipt</DialogTitle>
                <DialogContent>
                    {receiving ? (
                        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, py: 2 }}>
                            <CircularProgress size={40} color="success" />
                            <Typography color="text.secondary">Marking received and printing labels…</Typography>
                        </Box>
                    ) : (
                        <>
                            <Typography>Are you sure you want to mark this location as received?</Typography>
                            {confirmReceive && <Chip label={confirmReceive.l.name} sx={{ mt: 1 }} />}
                        </>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmReceive(null)} disabled={receiving}>Cancel</Button>
                    <Button variant="contained" color="success" disabled={receiving}
                        onClick={() => markReceived({ order: confirmReceive.o, location: confirmReceive.l })}>
                        {receiving ? "Processing…" : "Mark Received"}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}

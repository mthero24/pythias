import { useState, useEffect } from "react";
import { Box, Grid2, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, Card, Divider, Chip, Accordion, AccordionDetails, AccordionSummary, TextField, Stack, IconButton } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import axios from "axios";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";

export function DisplayModal({ open, setOpen }) {
    const [orders, setOrders]         = useState([]);
    const [showItems, setShowItems]   = useState("");
    const [edit, setEdit]             = useState(false);
    const [orderEdit, setOrderEdit]   = useState(null);
    const [confirmReceive, setConfirmReceive] = useState(null);

    useEffect(() => {
        const getOrders = async () => {
            const res = await axios.get("/api/admin/inventory/order");
            if (res?.data) setOrders(res.data.orders);
        };
        if (open) getOrders();
    }, [open]);

    const markReceived = async ({ order, location }) => {
        const res = await axios.put("/api/admin/inventory/order", { id: order._id, location: location.name })
            .catch(() => alert("Something went wrong marking order received — do not click Receive again, contact support"));
        if (res?.data?.error === false) setOrders(res.data.orders);
        else alert("Something went wrong marking order received — do not click Receive again, contact support");
    };

    const updateQuantity = async (orderId, locationId, itemId, quantity) => {
        const o = orders.find(or => or._id.toString() === orderId);
        const lo = o.locations.find(loc => loc._id.toString() === locationId);
        const it = lo.items.find(itm => itm._id.toString() === itemId);
        it.quantity = parseInt(quantity);
        setOrders([...orders.filter(or => or._id.toString() !== orderId), o]);
        const res = await axios.put("/api/admin/inventory/create-order/edit", { orderId: o._id, items: o.locations })
            .catch(() => alert("Something went wrong updating quantity, please refresh"));
        if (!res?.data || res.data.error !== false) alert("Something went wrong updating quantity, please refresh");
    };

    const deleteItem = async (orderId, locationId, itemId) => {
        const o = orders.find(or => or._id.toString() === orderId);
        const lo = o.locations.find(loc => loc._id.toString() === locationId);
        lo.items = lo.items.filter(itm => itm._id.toString() !== itemId);
        setOrders([...orders.filter(or => or._id.toString() !== orderId), o]);
        const res = await axios.post("/api/admin/inventory/create-order/edit", { orderId: o._id, items: o.locations })
            .catch(() => alert("Something went wrong deleting item, please refresh"));
        if (!res?.data || res.data.error !== false) alert("Something went wrong deleting item, please refresh");
    };

    return (
        <>
            <Dialog open={open} onClose={() => setOpen(false)} maxWidth="lg" fullWidth scroll="paper">
                <DialogTitle sx={{ py: 1.5 }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <LocalShippingIcon color="primary" />
                        <Typography variant="h6" fontWeight={700} sx={{ flex: 1 }}>Inventory Orders</Typography>
                        <IconButton size="small" onClick={() => setOpen(false)}><CloseIcon fontSize="small" /></IconButton>
                    </Stack>
                </DialogTitle>
                <Divider />
                <DialogContent sx={{ p: 2 }}>
                    <Grid2 container spacing={2}>
                        {orders.map(o => (
                            <Grid2 size={12} key={o._id}>
                                <Card variant="outlined" sx={{ borderRadius: 2 }}>
                                    {/* Order header */}
                                    <Box sx={{ px: 2, py: 1.5, display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap", borderBottom: "1px solid", borderColor: "divider" }}>
                                        <Chip label={o.poNumber} color="primary" variant="outlined" sx={{ fontWeight: 700, fontFamily: "monospace" }} />
                                        <Typography variant="body2" fontWeight={600}>{o.vendor}</Typography>
                                        <Chip label={`Ordered: ${new Date(o.dateOrdered).toLocaleDateString("en-US")}`} size="small" variant="outlined" />
                                        {o.dateExpected && (
                                            <Chip label={`Expected: ${new Date(o.dateExpected).toLocaleDateString("en-US")}`} size="small" variant="outlined" color="info" />
                                        )}
                                        <Button
                                            size="small"
                                            variant={edit && orderEdit === o._id.toString() ? "contained" : "outlined"}
                                            sx={{ ml: "auto" }}
                                            onClick={() => { setEdit(!edit); setOrderEdit(o._id.toString()); }}
                                        >
                                            {edit && orderEdit === o._id.toString() ? "Done" : "Edit"}
                                        </Button>
                                    </Box>

                                    {/* Locations */}
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
                                                    <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1 }}>
                                                        {!l.received && (
                                                            <Button
                                                                size="small"
                                                                variant="contained"
                                                                color="success"
                                                                onClick={() => setConfirmReceive({ o, l })}
                                                            >
                                                                Mark Received
                                                            </Button>
                                                        )}
                                                    </Box>
                                                    {l.items?.map(i => (
                                                        <Box key={i._id} sx={{ mb: 0.5 }}>
                                                            <Grid2 container spacing={1} alignItems="center">
                                                                <Grid2 size={5}>
                                                                    <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
                                                                        {i.inventory?.style_code}-{i.inventory?.color_name}-{i.inventory?.size_name}
                                                                    </Typography>
                                                                </Grid2>
                                                                <Grid2 size={4}>
                                                                    {edit && orderEdit === o._id.toString()
                                                                        ? <TextField
                                                                            size="small"
                                                                            type="number"
                                                                            value={i.quantity}
                                                                            onChange={(e) => updateQuantity(o._id.toString(), l._id.toString(), i._id.toString(), e.target.value)}
                                                                          />
                                                                        : <Chip label={i.quantity} size="small" variant="outlined" />
                                                                    }
                                                                </Grid2>
                                                                <Grid2 size={2}>
                                                                    <Typography variant="caption" color="text.secondary">{l.name}</Typography>
                                                                </Grid2>
                                                                <Grid2 size={1} sx={{ display: "flex", justifyContent: "center" }}>
                                                                    {edit && orderEdit === o._id.toString() && (
                                                                        <DeleteIcon
                                                                            sx={{ cursor: "pointer", color: "error.main", fontSize: 18 }}
                                                                            onClick={() => deleteItem(o._id.toString(), l._id.toString(), i._id.toString())}
                                                                        />
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
                            </Grid2>
                        ))}
                    </Grid2>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* Confirm receive dialog */}
            <Dialog open={!!confirmReceive} onClose={() => setConfirmReceive(null)} maxWidth="xs" fullWidth>
                <DialogTitle fontWeight={700}>Confirm Receipt</DialogTitle>
                <DialogContent>
                    <Typography>Are you sure you want to mark this location as received?</Typography>
                    {confirmReceive && (
                        <Chip label={confirmReceive.l.name} sx={{ mt: 1 }} />
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmReceive(null)}>Cancel</Button>
                    <Button
                        variant="contained"
                        color="success"
                        onClick={() => { markReceived({ order: confirmReceive.o, location: confirmReceive.l }); setConfirmReceive(null); }}
                    >
                        Mark Received
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}

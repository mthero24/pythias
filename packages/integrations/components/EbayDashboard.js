"use client";
import {
    Box, Container, Typography, Stack, Paper, Divider, Chip, Button, Tab, Tabs,
    Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
    CircularProgress, Alert, TextField, Avatar, Dialog, DialogTitle,
    DialogContent, DialogActions, IconButton, Tooltip, Select, MenuItem,
    FormControl, InputLabel, Rating, LinearProgress,
} from "@mui/material";
import { useState, useCallback, useEffect } from "react";
import axios from "axios";
import SyncIcon         from "@mui/icons-material/Sync";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import StorefrontIcon   from "@mui/icons-material/Storefront";
import InventoryIcon    from "@mui/icons-material/Inventory2";
import BarChartIcon     from "@mui/icons-material/BarChart";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import MessageIcon      from "@mui/icons-material/Message";
import ThumbUpIcon      from "@mui/icons-material/ThumbUp";
import GavelIcon        from "@mui/icons-material/Gavel";
import CampaignIcon     from "@mui/icons-material/Campaign";
import StoreIcon        from "@mui/icons-material/Store";
import ArrowBackIcon    from "@mui/icons-material/ArrowBack";
import SendIcon         from "@mui/icons-material/Send";
import EditIcon         from "@mui/icons-material/Edit";
import CloseIcon        from "@mui/icons-material/Close";
import CheckIcon        from "@mui/icons-material/Check";
import Link             from "next/link";

const EBAY_RED  = "#E53238";
const EBAY_BLUE = "#0064D2";
const EBAY_GOLD = "#F5AF02";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n) { return typeof n === "number" ? n.toLocaleString() : (n ?? "—"); }
function fmtUSD(n) {
    if (n == null) return "—";
    const v = parseFloat(n);
    return isNaN(v) ? "—" : `$${v.toFixed(2)}`;
}
function fmtDate(d) {
    if (!d) return "—";
    return new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function Panel({ loading, error, children }) {
    if (loading) return (
        <Box sx={{ py: 6, textAlign: "center" }}>
            <CircularProgress size={28} sx={{ color: EBAY_RED }} />
            <Typography variant="caption" color="text.secondary" display="block" mt={1.5}>Loading…</Typography>
        </Box>
    );
    if (error) return <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>{error}</Alert>;
    return children;
}

function StatusChip({ label, color = "default" }) {
    const MAP = {
        AWAITING_SHIPMENT: { label: "Awaiting Shipment", color: "#fef3c7", text: "#92400e" },
        IN_PROGRESS:       { label: "In Progress",       color: "#dbeafe", text: "#1e40af" },
        FULFILLED:         { label: "Fulfilled",         color: "#d1fae5", text: "#065f46" },
        CANCELLED:         { label: "Cancelled",         color: "#fee2e2", text: "#991b1b" },
        ACTIVE:            { label: "Active",            color: "#d1fae5", text: "#065f46" },
        INACTIVE:          { label: "Inactive",          color: "#f3f4f6", text: "#6b7280" },
        RUNNING:           { label: "Running",           color: "#d1fae5", text: "#065f46" },
        PAUSED:            { label: "Paused",            color: "#fef9c3", text: "#854d0e" },
        ENDED:             { label: "Ended",             color: "#f3f4f6", text: "#6b7280" },
        POSITIVE:          { label: "Positive",          color: "#d1fae5", text: "#065f46" },
        NEUTRAL:           { label: "Neutral",           color: "#fef3c7", text: "#92400e" },
        NEGATIVE:          { label: "Negative",          color: "#fee2e2", text: "#991b1b" },
        OPEN:              { label: "Open",              color: "#fee2e2", text: "#991b1b" },
        CLOSED:            { label: "Closed",            color: "#f3f4f6", text: "#6b7280" },
        PENDING_PAYOUT:    { label: "Pending",           color: "#dbeafe", text: "#1e40af" },
        SUCCEEDED:         { label: "Paid",              color: "#d1fae5", text: "#065f46" },
        INITIATED:         { label: "Initiated",         color: "#ede9fe", text: "#5b21b6" },
    };
    const s = MAP[label] ?? { label: label ?? "—", color: "#f3f4f6", text: "#374151" };
    return <Chip label={s.label} size="small" sx={{ bgcolor: s.color, color: s.text, fontWeight: 600, fontSize: "0.7rem", border: "none" }} />;
}

// ─── Overview Panel ───────────────────────────────────────────────────────────

function OverviewPanel({ connectionId }) {
    const [identity, setIdentity] = useState(null);
    const [store,    setStore]    = useState(null);
    const [loading,  setLoading]  = useState(true);
    const [error,    setError]    = useState("");

    useEffect(() => {
        setLoading(true);
        Promise.all([
            axios.get(`/api/integrations/ebay/identity?connectionId=${connectionId}`).catch(() => null),
            axios.get(`/api/integrations/ebay/store?connectionId=${connectionId}`).catch(() => null),
        ]).then(([id, st]) => {
            setIdentity(id?.data);
            setStore(st?.data);
        }).catch(e => setError(e.message))
        .finally(() => setLoading(false));
    }, [connectionId]);

    return (
        <Panel loading={loading} error={error}>
            <Stack spacing={3} sx={{ pt: 1 }}>
                {identity && (
                    <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary" mb={1.5}>Account</Typography>
                        <Stack spacing={1}>
                            <Row label="Username"  value={identity.username} />
                            <Row label="Type"      value={identity.accountType} />
                            <Row label="Email"     value={identity.email} />
                            <Row label="Status"    value={<StatusChip label={identity.userAccountStatus?.toUpperCase()} />} />
                        </Stack>
                    </Paper>
                )}
                {store && (
                    <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary" mb={1.5}>Store</Typography>
                        <Stack spacing={1}>
                            <Row label="Name"        value={store.name} />
                            <Row label="Description" value={store.description} />
                            <Row label="Category"    value={store.storeCategoryName} />
                            <Row label="URL"         value={store.storeWebURL
                                ? <a href={store.storeWebURL} target="_blank" rel="noopener noreferrer" style={{ color: EBAY_BLUE }}>{store.storeWebURL}</a>
                                : null} />
                        </Stack>
                    </Paper>
                )}
            </Stack>
        </Panel>
    );
}

function Row({ label, value }) {
    return (
        <Stack direction="row" spacing={2}>
            <Typography variant="body2" color="text.secondary" sx={{ width: 120, flexShrink: 0 }}>{label}</Typography>
            <Typography variant="body2" fontWeight={500}>{value ?? "—"}</Typography>
        </Stack>
    );
}

// ─── Orders Panel ─────────────────────────────────────────────────────────────

function OrdersPanel({ connectionId }) {
    const [orders,     setOrders]     = useState([]);
    const [loading,    setLoading]    = useState(false);
    const [error,      setError]      = useState("");
    const [fetched,    setFetched]    = useState(false);
    const [shipTarget, setShipTarget] = useState(null);
    const [tracking,   setTracking]   = useState("");
    const [carrier,    setCarrier]    = useState("usps");
    const [shipping,   setShipping]   = useState(false);
    const [shipError,  setShipError]  = useState("");

    const pull = useCallback(async () => {
        setLoading(true); setError(""); setFetched(true);
        try {
            const res = await axios.get(`/api/integrations/ebay/orders?connectionId=${connectionId}`);
            setOrders(res.data.orders ?? []);
        } catch (e) {
            setError(e.response?.data?.error ?? "Failed to pull orders");
        } finally { setLoading(false); }
    }, [connectionId]);

    useEffect(() => { pull(); }, [pull]);

    const ship = async () => {
        if (!tracking || !shipTarget) return;
        setShipping(true); setShipError("");
        try {
            const lineItemIds = (shipTarget.lineItems ?? []).map(li => li.lineItemId);
            await axios.post("/api/integrations/ebay/orders", {
                connectionId,
                orderId: shipTarget.orderId,
                trackingNumber: tracking,
                carrier,
                lineItemIds,
            });
            setOrders(prev => prev.filter(o => o.orderId !== shipTarget.orderId));
            setShipTarget(null);
        } catch (e) {
            setShipError(e.response?.data?.error ?? "Ship failed");
        } finally { setShipping(false); }
    };

    return (
        <Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography variant="subtitle1" fontWeight={700}>Unfulfilled Orders</Typography>
                <Button variant="outlined" size="small" startIcon={<SyncIcon />} onClick={pull} disabled={loading}>
                    {loading ? "Refreshing…" : "Refresh"}
                </Button>
            </Box>
            <Panel loading={loading} error={error}>
                {!fetched ? (
                    <Typography color="text.secondary" variant="body2">Click "Pull Orders" to load open orders.</Typography>
                ) : orders.length === 0 ? (
                    <Alert severity="success">No unfulfilled orders.</Alert>
                ) : (
                    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                        <Table size="small">
                            <TableHead>
                                <TableRow sx={{ bgcolor: "action.hover" }}>
                                    <TableCell sx={{ fontWeight: 700 }}>Order ID</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Buyer</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Items</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Total</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }} />
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {orders.map(o => (
                                    <TableRow key={o.orderId} hover>
                                        <TableCell sx={{ fontFamily: "monospace", fontSize: "0.75rem" }}>{o.orderId?.slice(-12)}</TableCell>
                                        <TableCell>{fmtDate(o.creationDate)}</TableCell>
                                        <TableCell>{o.buyer?.username ?? "—"}</TableCell>
                                        <TableCell>{o.lineItems?.length ?? 0}</TableCell>
                                        <TableCell>{fmtUSD(o.pricingSummary?.total?.value)}</TableCell>
                                        <TableCell><StatusChip label={o.orderFulfillmentStatus} /></TableCell>
                                        <TableCell>
                                            <Button size="small" variant="contained"
                                                sx={{ bgcolor: EBAY_BLUE, "&:hover": { bgcolor: "#0053b3" } }}
                                                startIcon={<LocalShippingIcon fontSize="small" />}
                                                onClick={() => { setShipTarget(o); setTracking(""); setCarrier("usps"); setShipError(""); }}>
                                                Ship
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Panel>

            <Dialog open={!!shipTarget} onClose={() => setShipTarget(null)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ fontWeight: 700 }}>Ship Order</DialogTitle>
                <DialogContent>
                    {shipError && <Alert severity="error" sx={{ mb: 2 }}>{shipError}</Alert>}
                    <Stack spacing={2} sx={{ pt: 1 }}>
                        <FormControl size="small" fullWidth>
                            <InputLabel>Carrier</InputLabel>
                            <Select value={carrier} label="Carrier" onChange={e => setCarrier(e.target.value)}>
                                {["usps","ups","fedex","dhl","ontrac","lasership","amazon"].map(c => (
                                    <MenuItem key={c} value={c}>{c.toUpperCase()}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <TextField size="small" label="Tracking Number" value={tracking} onChange={e => setTracking(e.target.value)} fullWidth />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
                    <Button onClick={() => setShipTarget(null)} disabled={shipping}>Cancel</Button>
                    <Button variant="contained" onClick={ship} disabled={shipping || !tracking}
                        startIcon={shipping ? <CircularProgress size={14} color="inherit" /> : <CheckIcon />}
                        sx={{ bgcolor: EBAY_BLUE }}>
                        {shipping ? "Submitting…" : "Confirm Ship"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

// ─── Listings Panel ───────────────────────────────────────────────────────────

function sanitizeForKey(str) { return String(str).replace(/[^a-zA-Z0-9]/g, "").slice(0, 40) || "group"; }

function ListingsPanel({ connectionId }) {
    const [tab,     setTab]     = useState("items");
    const [items,   setItems]   = useState([]);
    const [offers,  setOffers]  = useState([]);
    const [total,   setTotal]   = useState(0);
    const [loading, setLoading] = useState(false);
    const [error,   setError]   = useState("");
    const [fetched, setFetched] = useState(false);
    const [editing, setEditing] = useState(null);
    const [editPrice, setEditPrice] = useState("");
    const [editQty,   setEditQty]   = useState("");
    const [saving,      setSaving]      = useState(false);
    const [publishing,  setPublishing]  = useState(null);
    const [deleting,    setDeleting]    = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(null); // { type: "offer"|"item", id, label }
    const [offerTarget, setOfferTarget] = useState(null);
    const [offerForm,   setOfferForm]   = useState({ categoryId: "", price: "", title: "", fulfillmentPolicyId: "", paymentPolicyId: "", returnPolicyId: "", merchantLocationKey: "", imageUrl: "", department: "Unisex Adults" });
    const [selectedSkus, setSelectedSkus] = useState([]);
    const [policies,    setPolicies]    = useState(null);
    const [creating,    setCreating]    = useState(false);
    const [aspects,     setAspects]     = useState(null);
    const [aspectsLoading, setAspectsLoading] = useState(false);

    const pull = useCallback(async () => {
        setLoading(true); setError(""); setFetched(true);
        try {
            const res = await axios.get(`/api/integrations/ebay/listings?connectionId=${connectionId}&tab=${tab}`);
            if (tab === "offers") {
                setOffers(res.data.offers ?? []); setTotal(res.data.total ?? 0);
            } else {
                setItems(res.data.items ?? []); setTotal(res.data.total ?? 0);
            }
        } catch (e) {
            setError(e.response?.data?.error ?? "Failed to load listings");
        } finally { setLoading(false); }
    }, [connectionId, tab]);

    useEffect(() => { pull(); }, [pull]);

    const openCreateOffer = async (item, multi = false) => {
        setOfferTarget(item ?? { sku: "__group__" });
        setSelectedSkus(multi ? items.map(i => i.sku) : (item ? [item.sku] : []));
        setOfferForm({ categoryId: "", price: "", title: item?.product?.title ?? "", fulfillmentPolicyId: "", paymentPolicyId: "", returnPolicyId: "", merchantLocationKey: "" });
        if (!policies) {
            try {
                const res = await axios.get(`/api/integrations/ebay/policies?connectionId=${connectionId}`);
                setPolicies(res.data);
            } catch { setPolicies({}); }
        }
    };

    const createOffer = async () => {
        setCreating(true); setError("");
        const isGroup = selectedSkus.length > 1;
        const groupKey = isGroup ? `grp${sanitizeForKey(offerForm.title || selectedSkus[0])}` : null;
        try {
            await axios.post("/api/integrations/ebay/listings", {
                connectionId,
                createOffer: {
                    ...(isGroup
                        ? { groupKey, groupTitle: offerForm.title || "Custom Print Item", variantSKUs: selectedSkus, groupImageUrls: offerForm.imageUrl ? [offerForm.imageUrl] : [], groupAspects: { Department: [offerForm.department || "Unisex Adults"] } }
                        : { sku: offerTarget.sku }),
                    categoryId:          offerForm.categoryId,
                    listingDescription:  offerForm.title || "Custom Print Item",
                    price:               parseFloat(offerForm.price),
                    fulfillmentPolicyId: offerForm.fulfillmentPolicyId || undefined,
                    paymentPolicyId:     offerForm.paymentPolicyId    || undefined,
                    returnPolicyId:      offerForm.returnPolicyId     || undefined,
                    merchantLocationKey: offerForm.merchantLocationKey || undefined,
                    publish: true,
                },
            });
            setOfferTarget(null);
            setTab("offers");
            setFetched(false);
        } catch (e) {
            setError(e.response?.data?.error ?? "Create offer failed");
        } finally { setCreating(false); }
    };

    const publishOffer = async (offerId) => {
        setPublishing(offerId);
        try {
            await axios.post("/api/integrations/ebay/listings", { connectionId, offerId });
            setOffers(prev => prev.map(o => o.offerId === offerId ? { ...o, status: "PUBLISHED" } : o));
        } catch (e) {
            setError(e.response?.data?.error ?? "Publish failed");
        } finally { setPublishing(null); }
    };

    const confirmAndDelete = async () => {
        if (!confirmDelete) return;
        const { type, id } = confirmDelete;
        setConfirmDelete(null);
        setDeleting(id);
        try {
            if (type === "offer") {
                await axios.delete(`/api/integrations/ebay/listings?connectionId=${connectionId}&offerId=${id}`);
                setOffers(prev => prev.filter(o => o.offerId !== id));
            } else {
                await axios.delete(`/api/integrations/ebay/listings?connectionId=${connectionId}&sku=${encodeURIComponent(id)}`);
                setItems(prev => prev.filter(i => i.sku !== id));
            }
        } catch (e) {
            setError(e.response?.data?.error ?? "Delete failed");
        } finally { setDeleting(null); }
    };

    const saveOffer = async () => {
        setSaving(true);
        try {
            await axios.put("/api/integrations/ebay/listings", {
                connectionId,
                offerId: editing.offerId,
                ...(editPrice !== "" ? { price: parseFloat(editPrice) } : {}),
                ...(editQty   !== "" ? { quantity: parseInt(editQty) } : {}),
            });
            setOffers(prev => prev.map(o => o.offerId === editing.offerId
                ? { ...o,
                    pricingSummary: editPrice !== "" ? { price: { value: editPrice } } : o.pricingSummary,
                    availableQuantity: editQty !== "" ? parseInt(editQty) : o.availableQuantity,
                  }
                : o
            ));
            setEditing(null);
        } catch (e) {
            setError(e.response?.data?.error ?? "Save failed");
        } finally { setSaving(false); }
    };

    return (
        <Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ minHeight: 36 }}>
                    <Tab value="items" label="Inventory Items" sx={{ minHeight: 36, py: 0 }} />
                    <Tab value="offers" label="Offers / Listings" sx={{ minHeight: 36, py: 0 }} />
                </Tabs>
                <Button variant="outlined" size="small" startIcon={<SyncIcon />} onClick={pull} disabled={loading}>
                    {loading ? "Loading…" : "Refresh"}
                </Button>
            </Box>
            <Panel loading={loading} error={error}>
                {!fetched ? (
                    <Typography color="text.secondary" variant="body2">Click "Load" to fetch your {tab === "offers" ? "offers" : "inventory items"}.</Typography>
                ) : tab === "items" ? (
                    items.length === 0 ? <Alert severity="info">No inventory items found.</Alert> : (
                        <Box>
                            <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1 }}>
                                <Button variant="contained" size="small"
                                    onClick={() => openCreateOffer(null, true)}
                                    sx={{ bgcolor: EBAY_RED, "&:hover": { bgcolor: "#c0282d" }, fontSize: "0.78rem" }}>
                                    Create Group Listing ({items.length} variants)
                                </Button>
                            </Box>
                            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: "action.hover" }}>
                                            <TableCell sx={{ fontWeight: 700 }}>SKU</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Title</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Condition</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Qty</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }} />
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {items.map(item => (
                                            <TableRow key={item.sku} hover>
                                                <TableCell sx={{ fontFamily: "monospace", fontSize: "0.75rem" }}>{item.sku}</TableCell>
                                                <TableCell>{item.product?.title ?? "—"}</TableCell>
                                                <TableCell>{item.condition}</TableCell>
                                                <TableCell>{item.availability?.shipToLocationAvailability?.quantity ?? "—"}</TableCell>
                                                <TableCell>
                                                    <Stack direction="row" spacing={0.5}>
                                                        <Button size="small" variant="outlined"
                                                            onClick={() => openCreateOffer(item)}
                                                            sx={{ fontSize: "0.7rem", px: 1 }}>
                                                            Single Offer
                                                        </Button>
                                                        <IconButton size="small" color="error"
                                                            disabled={deleting === item.sku}
                                                            onClick={() => setConfirmDelete({ type: "item", id: item.sku, label: item.sku })}>
                                                            <CloseIcon fontSize="small" />
                                                        </IconButton>
                                                    </Stack>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Box>
                    )
                ) : (
                    offers.length === 0 ? <Alert severity="info">No offers found.</Alert> : (
                        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ bgcolor: "action.hover" }}>
                                        <TableCell sx={{ fontWeight: 700 }}>SKU</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Price</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Qty</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }} />
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {offers.map(offer => (
                                        <TableRow key={offer.offerId} hover>
                                            <TableCell sx={{ fontFamily: "monospace", fontSize: "0.75rem" }}>{offer.sku}</TableCell>
                                            <TableCell>{fmtUSD(offer.pricingSummary?.price?.value)}</TableCell>
                                            <TableCell>{offer.availableQuantity ?? "—"}</TableCell>
                                            <TableCell><StatusChip label={offer.status?.toUpperCase()} /></TableCell>
                                            <TableCell>
                                                <Stack direction="row" spacing={0.5}>
                                                    {offer.status?.toUpperCase() !== "PUBLISHED" && (
                                                        <Button size="small" variant="contained"
                                                            disabled={publishing === offer.offerId}
                                                            onClick={() => publishOffer(offer.offerId)}
                                                            sx={{ bgcolor: "#16a34a", "&:hover": { bgcolor: "#15803d" }, fontSize: "0.7rem", px: 1 }}>
                                                            {publishing === offer.offerId ? "…" : "Publish"}
                                                        </Button>
                                                    )}
                                                    <IconButton size="small" onClick={() => {
                                                        setEditing(offer);
                                                        setEditPrice(offer.pricingSummary?.price?.value ?? "");
                                                        setEditQty(String(offer.availableQuantity ?? ""));
                                                    }}>
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>
                                                    <IconButton size="small" color="error"
                                                        disabled={deleting === offer.offerId}
                                                        onClick={() => setConfirmDelete({ type: "offer", id: offer.offerId, label: offer.sku })}>
                                                        <CloseIcon fontSize="small" />
                                                    </IconButton>
                                                </Stack>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )
                )}
            </Panel>

            <Dialog open={!!editing} onClose={() => setEditing(null)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ fontWeight: 700 }}>Edit Offer — {editing?.sku}</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ pt: 1 }}>
                        <TextField size="small" label="Price (USD)" type="number" value={editPrice} onChange={e => setEditPrice(e.target.value)} fullWidth />
                        <TextField size="small" label="Available Quantity" type="number" value={editQty} onChange={e => setEditQty(e.target.value)} fullWidth />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
                    <Button onClick={() => setEditing(null)} disabled={saving}>Cancel</Button>
                    <Button variant="contained" onClick={saveOffer} disabled={saving}
                        startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <CheckIcon />}
                        sx={{ bgcolor: EBAY_BLUE }}>
                        {saving ? "Saving…" : "Save"}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={!!offerTarget} onClose={() => setOfferTarget(null)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ fontWeight: 700 }}>
                    {selectedSkus.length > 1 ? `Create Group Listing — ${selectedSkus.length} variants` : `Create Offer — ${offerTarget?.sku}`}
                </DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ pt: 1 }}>
                        <TextField size="small" label="Listing Title *" value={offerForm.title}
                            onChange={e => setOfferForm(f => ({ ...f, title: e.target.value }))} fullWidth />
                        <TextField size="small" label="eBay Category ID *" value={offerForm.categoryId}
                            onChange={e => { setOfferForm(f => ({ ...f, categoryId: e.target.value })); setAspects(null); }}
                            onBlur={async e => {
                                const cid = e.target.value.trim();
                                if (!cid) return;
                                setAspectsLoading(true);
                                try {
                                    const res = await axios.get(`/api/integrations/ebay/aspects?connectionId=${connectionId}&categoryId=${cid}`);
                                    setAspects(res.data.aspects ?? []);
                                } catch { setAspects([]); }
                                finally { setAspectsLoading(false); }
                            }}
                            helperText="Find at ebay.com/sch/categories.html" fullWidth />
                        {aspectsLoading && <Typography variant="caption" color="text.secondary">Loading required aspects…</Typography>}
                        {aspects && aspects.length > 0 && (
                            <Box sx={{ bgcolor: "action.hover", borderRadius: 1, p: 1.5 }}>
                                <Typography variant="caption" fontWeight={700} display="block" mb={0.5}>Required aspects for this category:</Typography>
                                {aspects.filter(a => a.required).map(a => (
                                    <Typography key={a.name} variant="caption" display="block" sx={{ color: "#dc2626" }}>
                                        • {a.name}
                                    </Typography>
                                ))}
                                {aspects.filter(a => !a.required).slice(0, 5).map(a => (
                                    <Typography key={a.name} variant="caption" display="block" color="text.secondary">
                                        • {a.name} (recommended)
                                    </Typography>
                                ))}
                            </Box>
                        )}
                        <TextField size="small" label="Price (USD) *" type="number" value={offerForm.price}
                            onChange={e => setOfferForm(f => ({ ...f, price: e.target.value }))} fullWidth />
                        {policies?.fulfillmentPolicies?.length > 0 ? (
                            <FormControl size="small" fullWidth>
                                <InputLabel>Fulfillment Policy</InputLabel>
                                <Select value={offerForm.fulfillmentPolicyId} label="Fulfillment Policy"
                                    onChange={e => setOfferForm(f => ({ ...f, fulfillmentPolicyId: e.target.value }))}>
                                    <MenuItem value="">— none —</MenuItem>
                                    {policies.fulfillmentPolicies.map(p => <MenuItem key={p.fulfillmentPolicyId} value={p.fulfillmentPolicyId}>{p.name}</MenuItem>)}
                                </Select>
                            </FormControl>
                        ) : (
                            <TextField size="small" label="Fulfillment Policy ID" value={offerForm.fulfillmentPolicyId}
                                onChange={e => setOfferForm(f => ({ ...f, fulfillmentPolicyId: e.target.value }))} fullWidth />
                        )}
                        {policies?.paymentPolicies?.length > 0 ? (
                            <FormControl size="small" fullWidth>
                                <InputLabel>Payment Policy</InputLabel>
                                <Select value={offerForm.paymentPolicyId} label="Payment Policy"
                                    onChange={e => setOfferForm(f => ({ ...f, paymentPolicyId: e.target.value }))}>
                                    <MenuItem value="">— none —</MenuItem>
                                    {policies.paymentPolicies.map(p => <MenuItem key={p.paymentPolicyId} value={p.paymentPolicyId}>{p.name}</MenuItem>)}
                                </Select>
                            </FormControl>
                        ) : (
                            <TextField size="small" label="Payment Policy ID" value={offerForm.paymentPolicyId}
                                onChange={e => setOfferForm(f => ({ ...f, paymentPolicyId: e.target.value }))} fullWidth />
                        )}
                        {policies?.returnPolicies?.length > 0 ? (
                            <FormControl size="small" fullWidth>
                                <InputLabel>Return Policy</InputLabel>
                                <Select value={offerForm.returnPolicyId} label="Return Policy"
                                    onChange={e => setOfferForm(f => ({ ...f, returnPolicyId: e.target.value }))}>
                                    <MenuItem value="">— none —</MenuItem>
                                    {policies.returnPolicies.map(p => <MenuItem key={p.returnPolicyId} value={p.returnPolicyId}>{p.name}</MenuItem>)}
                                </Select>
                            </FormControl>
                        ) : (
                            <TextField size="small" label="Return Policy ID" value={offerForm.returnPolicyId}
                                onChange={e => setOfferForm(f => ({ ...f, returnPolicyId: e.target.value }))} fullWidth />
                        )}
                        <TextField size="small" label="Merchant Location Key" value={offerForm.merchantLocationKey}
                            onChange={e => setOfferForm(f => ({ ...f, merchantLocationKey: e.target.value }))} fullWidth />
                        {selectedSkus.length > 1 && (
                            <TextField size="small" label="Image URL (required for group listing)" value={offerForm.imageUrl}
                                onChange={e => setOfferForm(f => ({ ...f, imageUrl: e.target.value }))}
                                helperText="Paste a direct image URL (JPG/PNG). eBay requires at least one image." fullWidth />
                        )}
                        {selectedSkus.length > 1 && (
                            <FormControl size="small" fullWidth>
                                <InputLabel>Department</InputLabel>
                                <Select value={offerForm.department || "Unisex Adults"} label="Department"
                                    onChange={e => setOfferForm(f => ({ ...f, department: e.target.value }))}>
                                    {["Men","Women","Unisex Adults","Boys","Girls","Unisex Kids"].map(d => (
                                        <MenuItem key={d} value={d}>{d}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        )}
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
                    <Button onClick={() => setOfferTarget(null)} disabled={creating}>Cancel</Button>
                    <Button variant="contained" onClick={createOffer}
                        disabled={creating || !offerForm.categoryId || !offerForm.price || (selectedSkus.length > 1 && !offerForm.imageUrl)}
                        startIcon={creating ? <CircularProgress size={14} color="inherit" /> : <CheckIcon />}
                        sx={{ bgcolor: EBAY_BLUE }}>
                        {creating ? "Creating…" : "Create & Publish"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete confirmation */}
            <Dialog open={!!confirmDelete} onClose={() => setConfirmDelete(null)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 1, color: "#dc2626" }}>
                    <CloseIcon sx={{ fontSize: 20 }} /> Confirm Delete
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ pt: 0.5 }}>
                        Are you sure you want to permanently delete{" "}
                        <Box component="span" sx={{ fontFamily: "monospace", fontWeight: 700, bgcolor: "action.hover", px: 0.75, py: 0.25, borderRadius: 0.5 }}>
                            {confirmDelete?.label}
                        </Box>?
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1.5 }}>
                        {confirmDelete?.type === "offer"
                            ? "This removes the offer from eBay. The inventory item will remain."
                            : "This removes the inventory item from eBay. Any associated offer must be deleted separately."}
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
                    <Button onClick={() => setConfirmDelete(null)} variant="outlined" size="small">Cancel</Button>
                    <Button variant="contained" size="small" onClick={confirmAndDelete}
                        disabled={!!deleting}
                        startIcon={deleting ? <CircularProgress size={13} color="inherit" /> : null}
                        sx={{ bgcolor: "#dc2626", "&:hover": { bgcolor: "#b91c1c" } }}>
                        {deleting ? "Deleting…" : "Delete"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

// ─── Analytics Panel ──────────────────────────────────────────────────────────

function AnalyticsPanel({ connectionId }) {
    const [standards, setStandards] = useState(null);
    const [traffic,   setTraffic]   = useState(null);
    const [loading,   setLoading]   = useState(false);
    const [error,     setError]     = useState("");
    const [fetched,   setFetched]   = useState(false);

    const pull = useCallback(async () => {
        setLoading(true); setError(""); setFetched(true);
        try {
            const [s, t] = await Promise.all([
                axios.get(`/api/integrations/ebay/analytics?connectionId=${connectionId}&type=standards`).catch(() => null),
                axios.get(`/api/integrations/ebay/analytics?connectionId=${connectionId}&type=traffic`).catch(() => null),
            ]);
            setStandards(s?.data);
            setTraffic(t?.data);
        } catch (e) {
            setError(e.response?.data?.error ?? "Failed to load analytics");
        } finally { setLoading(false); }
    }, [connectionId]);

    useEffect(() => { pull(); }, [pull]);

    return (
        <Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography variant="subtitle1" fontWeight={700}>Seller Analytics</Typography>
                <Button variant="outlined" size="small" startIcon={<SyncIcon />} onClick={pull} disabled={loading}>
                    {loading ? "Loading…" : "Refresh"}
                </Button>
            </Box>
            <Panel loading={loading} error={error}>
                {!fetched ? (
                    <Typography color="text.secondary" variant="body2">Click "Load" to fetch analytics data.</Typography>
                ) : (
                    <Stack spacing={3}>
                        {standards && (
                            <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
                                <Typography variant="subtitle2" fontWeight={700} mb={2}>Seller Standards</Typography>
                                <Stack spacing={1}>
                                    <Row label="Level"            value={standards.standardsLevel} />
                                    <Row label="Evaluation Cycle" value={standards.evaluationCycle} />
                                    <Row label="Defect Rate"      value={standards.defaultProgramName} />
                                </Stack>
                            </Paper>
                        )}
                        {traffic && traffic.dimensionValueData?.length > 0 && (
                            <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
                                <Typography variant="subtitle2" fontWeight={700} mb={2}>Traffic Report (Last 30 Days)</Typography>
                                <TableContainer>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow sx={{ bgcolor: "action.hover" }}>
                                                <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                                                {(traffic.metricData ?? []).map(m => (
                                                    <TableCell key={m.name} sx={{ fontWeight: 700 }}>{m.name?.replace(/_/g, " ")}</TableCell>
                                                ))}
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {traffic.dimensionValueData.slice(0, 14).map((row, i) => (
                                                <TableRow key={i} hover>
                                                    <TableCell>{row.dimensionKey}</TableCell>
                                                    {(row.metricValueData ?? []).map((m, j) => (
                                                        <TableCell key={j}>{fmt(m.value)}</TableCell>
                                                    ))}
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Paper>
                        )}
                        {!standards && !traffic && (
                            <Alert severity="info">No analytics data available for this account.</Alert>
                        )}
                    </Stack>
                )}
            </Panel>
        </Box>
    );
}

// ─── Finances Panel ───────────────────────────────────────────────────────────

function FinancesPanel({ connectionId }) {
    const [tab,     setTab]     = useState("transactions");
    const [data,    setData]    = useState([]);
    const [loading, setLoading] = useState(false);
    const [error,   setError]   = useState("");
    const [fetched, setFetched] = useState(false);

    const pull = useCallback(async () => {
        setLoading(true); setError(""); setFetched(true);
        try {
            const res = await axios.get(`/api/integrations/ebay/finances?connectionId=${connectionId}&type=${tab}`);
            setData(tab === "payouts" ? (res.data.payouts ?? []) : (res.data.transactions ?? []));
        } catch (e) {
            setError(e.response?.data?.error ?? "Failed to load finances");
        } finally { setLoading(false); }
    }, [connectionId, tab]);

    useEffect(() => { pull(); }, [pull]);

    return (
        <Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ minHeight: 36 }}>
                    <Tab value="transactions" label="Transactions" sx={{ minHeight: 36, py: 0 }} />
                    <Tab value="payouts"      label="Payouts"      sx={{ minHeight: 36, py: 0 }} />
                </Tabs>
                <Button variant="outlined" size="small" startIcon={<SyncIcon />} onClick={pull} disabled={loading}>
                    {loading ? "Loading…" : "Refresh"}
                </Button>
            </Box>
            <Panel loading={loading} error={error}>
                {!fetched ? (
                    <Typography color="text.secondary" variant="body2">Click "Load" to fetch {tab}.</Typography>
                ) : data.length === 0 ? (
                    <Alert severity="info">No {tab} found.</Alert>
                ) : tab === "transactions" ? (
                    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                        <Table size="small">
                            <TableHead>
                                <TableRow sx={{ bgcolor: "action.hover" }}>
                                    <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Amount</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Fee</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {data.map((t, i) => (
                                    <TableRow key={i} hover>
                                        <TableCell>{fmtDate(t.transactionDate)}</TableCell>
                                        <TableCell>{t.transactionType}</TableCell>
                                        <TableCell sx={{ fontWeight: 600, color: parseFloat(t.amount?.value) >= 0 ? "#16a34a" : "#dc2626" }}>
                                            {fmtUSD(t.amount?.value)}
                                        </TableCell>
                                        <TableCell>{fmtUSD(t.totalFeeBasisAmount?.value)}</TableCell>
                                        <TableCell><StatusChip label={t.transactionStatus?.toUpperCase()} /></TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                ) : (
                    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                        <Table size="small">
                            <TableHead>
                                <TableRow sx={{ bgcolor: "action.hover" }}>
                                    <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Amount</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Currency</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {data.map((p, i) => (
                                    <TableRow key={i} hover>
                                        <TableCell>{fmtDate(p.lastAttemptedPayoutDate)}</TableCell>
                                        <TableCell sx={{ fontWeight: 600, color: "#16a34a" }}>{fmtUSD(p.amount?.value)}</TableCell>
                                        <TableCell>{p.amount?.currency}</TableCell>
                                        <TableCell><StatusChip label={p.payoutStatus?.toUpperCase()} /></TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Panel>
        </Box>
    );
}

// ─── Messages Panel ───────────────────────────────────────────────────────────

function MessagesPanel({ connectionId }) {
    const [conversations, setConversations] = useState([]);
    const [selected,      setSelected]      = useState(null);
    const [messages,      setMessages]      = useState([]);
    const [replyText,     setReplyText]     = useState("");
    const [loading,       setLoading]       = useState(false);
    const [msgLoading,    setMsgLoading]    = useState(false);
    const [sending,       setSending]       = useState(false);
    const [error,         setError]         = useState("");
    const [fetched,       setFetched]       = useState(false);

    const pull = useCallback(async () => {
        setLoading(true); setError(""); setFetched(true);
        try {
            const res = await axios.get(`/api/integrations/ebay/messages?connectionId=${connectionId}`);
            setConversations(res.data.conversations ?? []);
        } catch (e) {
            setError(e.response?.data?.error ?? "Failed to load messages");
        } finally { setLoading(false); }
    }, [connectionId]);

    useEffect(() => { pull(); }, [pull]);

    const openConversation = async (conv) => {
        setSelected(conv); setMsgLoading(true);
        try {
            const res = await axios.get(`/api/integrations/ebay/messages?connectionId=${connectionId}&conversationId=${conv.conversationId}`);
            setMessages(res.data.messages ?? []);
        } catch { setMessages([]); }
        finally { setMsgLoading(false); }
    };

    const sendReply = async () => {
        if (!replyText.trim() || !selected) return;
        setSending(true);
        try {
            await axios.post("/api/integrations/ebay/messages", {
                connectionId, conversationId: selected.conversationId, text: replyText,
            });
            setReplyText("");
            await openConversation(selected);
        } catch (e) {
            setError(e.response?.data?.error ?? "Send failed");
        } finally { setSending(false); }
    };

    return (
        <Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                {selected ? (
                    <Button size="small" startIcon={<ArrowBackIcon />} onClick={() => setSelected(null)}>
                        Back to Conversations
                    </Button>
                ) : (
                    <Typography variant="subtitle1" fontWeight={700}>Messages</Typography>
                )}
                {!selected && (
                    <Button variant="outlined" size="small" startIcon={<SyncIcon />} onClick={pull} disabled={loading}>
                        {loading ? "Loading…" : "Refresh"}
                    </Button>
                )}
            </Box>
            <Panel loading={loading} error={error}>
                {!selected ? (
                    !fetched ? (
                        <Typography color="text.secondary" variant="body2">Click "Load" to fetch conversations.</Typography>
                    ) : conversations.length === 0 ? (
                        <Alert severity="info">No conversations found.</Alert>
                    ) : (
                        <Stack spacing={1}>
                            {conversations.map(conv => (
                                <Paper key={conv.conversationId} variant="outlined" sx={{ p: 2, borderRadius: 2, cursor: "pointer", "&:hover": { bgcolor: "action.hover" } }}
                                    onClick={() => openConversation(conv)}>
                                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                                        <Box>
                                            <Typography variant="body2" fontWeight={600}>{conv.subject ?? "No subject"}</Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {conv.buyerUsername} · {fmtDate(conv.lastMessageDate)}
                                            </Typography>
                                        </Box>
                                        {conv.unreadMessageCount > 0 && (
                                            <Chip size="small" label={conv.unreadMessageCount} color="error" />
                                        )}
                                    </Stack>
                                </Paper>
                            ))}
                        </Stack>
                    )
                ) : (
                    <Box>
                        <Typography variant="body2" fontWeight={600} mb={2}>{selected.subject}</Typography>
                        {msgLoading ? <CircularProgress size={24} /> : (
                            <Stack spacing={1.5} sx={{ mb: 2, maxHeight: 400, overflowY: "auto" }}>
                                {messages.map((m, i) => (
                                    <Box key={i} sx={{
                                        alignSelf: m.senderRole === "SELLER" ? "flex-end" : "flex-start",
                                        bgcolor: m.senderRole === "SELLER" ? "#dbeafe" : "#f3f4f6",
                                        borderRadius: 2, px: 2, py: 1.5, maxWidth: "75%",
                                    }}>
                                        <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                                            {m.senderRole === "SELLER" ? "You" : m.senderRole} · {fmtDate(m.creationDate)}
                                        </Typography>
                                        <Typography variant="body2">{m.body}</Typography>
                                    </Box>
                                ))}
                            </Stack>
                        )}
                        <Stack direction="row" spacing={1}>
                            <TextField size="small" fullWidth placeholder="Type a reply…" value={replyText}
                                onChange={e => setReplyText(e.target.value)}
                                onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendReply()} multiline maxRows={3} />
                            <IconButton onClick={sendReply} disabled={sending || !replyText.trim()} color="primary">
                                {sending ? <CircularProgress size={20} /> : <SendIcon />}
                            </IconButton>
                        </Stack>
                    </Box>
                )}
            </Panel>
        </Box>
    );
}

// ─── Feedback Panel ───────────────────────────────────────────────────────────

function FeedbackPanel({ connectionId }) {
    const [feedback, setFeedback] = useState([]);
    const [summary,  setSummary]  = useState(null);
    const [loading,  setLoading]  = useState(false);
    const [error,    setError]    = useState("");
    const [fetched,  setFetched]  = useState(false);

    const pull = useCallback(async () => {
        setLoading(true); setError(""); setFetched(true);
        try {
            const res = await axios.get(`/api/integrations/ebay/feedback?connectionId=${connectionId}`);
            setFeedback(res.data.feedback ?? []);
            setSummary(res.data.summary);
        } catch (e) {
            setError(e.response?.data?.error ?? "Failed to load feedback");
        } finally { setLoading(false); }
    }, [connectionId]);

    useEffect(() => { pull(); }, [pull]);

    return (
        <Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography variant="subtitle1" fontWeight={700}>Seller Feedback</Typography>
                <Button variant="outlined" size="small" startIcon={<SyncIcon />} onClick={pull} disabled={loading}>
                    {loading ? "Loading…" : "Refresh"}
                </Button>
            </Box>
            <Panel loading={loading} error={error}>
                {!fetched ? (
                    <Typography color="text.secondary" variant="body2">Click "Load" to fetch feedback.</Typography>
                ) : (
                    <Stack spacing={3}>
                        {summary && (
                            <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
                                <Stack direction="row" spacing={4} flexWrap="wrap">
                                    <Box sx={{ textAlign: "center" }}>
                                        <Typography variant="h3" fontWeight={800} color={EBAY_BLUE}>{summary.feedbackScore ?? "—"}</Typography>
                                        <Typography variant="caption" color="text.secondary">Feedback Score</Typography>
                                    </Box>
                                    <Box sx={{ textAlign: "center" }}>
                                        <Typography variant="h5" fontWeight={700} color="#16a34a">{summary.positiveFeedbackPercent?.toFixed(1) ?? "—"}%</Typography>
                                        <Typography variant="caption" color="text.secondary">Positive</Typography>
                                    </Box>
                                    {[
                                        { label: "Positive", value: summary.positiveFeedbackPeriodData?.find(p => p.period === "YEAR")?.count },
                                        { label: "Neutral",  value: summary.neutralFeedbackPeriodData?.find(p => p.period === "YEAR")?.count },
                                        { label: "Negative", value: summary.negativeFeedbackPeriodData?.find(p => p.period === "YEAR")?.count },
                                    ].map(s => (
                                        <Box key={s.label} sx={{ textAlign: "center" }}>
                                            <Typography variant="h6" fontWeight={700}>{s.value ?? "—"}</Typography>
                                            <Typography variant="caption" color="text.secondary">{s.label} (year)</Typography>
                                        </Box>
                                    ))}
                                </Stack>
                            </Paper>
                        )}
                        {feedback.length === 0 ? (
                            <Alert severity="info">No feedback found.</Alert>
                        ) : (
                            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: "action.hover" }}>
                                            <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Buyer</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Comment</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {feedback.map((f, i) => (
                                            <TableRow key={i} hover>
                                                <TableCell>{fmtDate(f.feedbackCreationDate)}</TableCell>
                                                <TableCell>{f.reviewerFeedbackId ?? "—"}</TableCell>
                                                <TableCell><StatusChip label={f.feedbackType?.toUpperCase()} /></TableCell>
                                                <TableCell sx={{ maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                    {f.feedbackText ?? "—"}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}
                    </Stack>
                )}
            </Panel>
        </Box>
    );
}

// ─── Disputes Panel ───────────────────────────────────────────────────────────

function DisputesPanel({ connectionId }) {
    const [disputes,  setDisputes]  = useState([]);
    const [selected,  setSelected]  = useState(null);
    const [loading,   setLoading]   = useState(false);
    const [error,     setError]     = useState("");
    const [fetched,   setFetched]   = useState(false);

    const pull = useCallback(async () => {
        setLoading(true); setError(""); setFetched(true);
        try {
            const res = await axios.get(`/api/integrations/ebay/disputes?connectionId=${connectionId}`);
            setDisputes(res.data.disputes ?? []);
        } catch (e) {
            setError(e.response?.data?.error ?? "Failed to load disputes");
        } finally { setLoading(false); }
    }, [connectionId]);

    useEffect(() => { pull(); }, [pull]);

    const openDispute = async (d) => {
        try {
            const res = await axios.get(`/api/integrations/ebay/disputes?connectionId=${connectionId}&disputeId=${d.paymentDisputeId}`);
            setSelected(res.data);
        } catch { setSelected(d); }
    };

    return (
        <Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                {selected ? (
                    <Button size="small" startIcon={<ArrowBackIcon />} onClick={() => setSelected(null)}>Back</Button>
                ) : (
                    <Typography variant="subtitle1" fontWeight={700}>Payment Disputes</Typography>
                )}
                {!selected && (
                    <Button variant="outlined" size="small" startIcon={<SyncIcon />} onClick={pull} disabled={loading}>
                        {loading ? "Loading…" : "Refresh"}
                    </Button>
                )}
            </Box>
            <Panel loading={loading} error={error}>
                {!selected ? (
                    !fetched ? (
                        <Typography color="text.secondary" variant="body2">Click "Load" to fetch disputes.</Typography>
                    ) : disputes.length === 0 ? (
                        <Alert severity="success">No open disputes.</Alert>
                    ) : (
                        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ bgcolor: "action.hover" }}>
                                        <TableCell sx={{ fontWeight: 700 }}>ID</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Reason</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Amount</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }} />
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {disputes.map(d => (
                                        <TableRow key={d.paymentDisputeId} hover>
                                            <TableCell sx={{ fontFamily: "monospace", fontSize: "0.72rem" }}>{d.paymentDisputeId?.slice(-10)}</TableCell>
                                            <TableCell>{fmtDate(d.openDate)}</TableCell>
                                            <TableCell>{d.reason ?? "—"}</TableCell>
                                            <TableCell>{fmtUSD(d.amount?.value)}</TableCell>
                                            <TableCell><StatusChip label={d.paymentDisputeStatus?.toUpperCase()} /></TableCell>
                                            <TableCell>
                                                <Button size="small" variant="outlined" onClick={() => openDispute(d)}>View</Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )
                ) : (
                    <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
                        <Typography variant="subtitle2" fontWeight={700} mb={2}>Dispute Details</Typography>
                        <Stack spacing={1}>
                            <Row label="ID"       value={selected.paymentDisputeId} />
                            <Row label="Reason"   value={selected.reason} />
                            <Row label="Amount"   value={fmtUSD(selected.amount?.value)} />
                            <Row label="Status"   value={<StatusChip label={selected.paymentDisputeStatus?.toUpperCase()} />} />
                            <Row label="Opened"   value={fmtDate(selected.openDate)} />
                            <Row label="Deadline" value={fmtDate(selected.sellerResponseDeadline)} />
                            <Row label="Note"     value={selected.note} />
                        </Stack>
                        {selected.evidence?.length > 0 && (
                            <Box mt={2}>
                                <Typography variant="caption" color="text.secondary">Evidence submitted: {selected.evidence.length} items</Typography>
                            </Box>
                        )}
                    </Paper>
                )}
            </Panel>
        </Box>
    );
}

// ─── Marketing Panel ──────────────────────────────────────────────────────────

const todayISO = () => new Date().toISOString().slice(0, 16);

const BLANK_CAMPAIGN  = { name: "", bidPercentage: "5.0", startDate: todayISO(), endDate: "" };
const BLANK_PROMOTION = { name: "", percentageOff: "10", startDate: todayISO(), endDate: "" };

function MarketingPanel({ connectionId }) {
    const [tab,       setTab]       = useState("campaigns");
    const [campaigns, setCampaigns] = useState([]);
    const [promos,    setPromos]    = useState([]);
    const [loading,   setLoading]   = useState(false);
    const [error,     setError]     = useState("");
    const [fetched,   setFetched]   = useState(false);
    const [dialog,    setDialog]    = useState(null); // "campaign" | "promotion"
    const [form,      setForm]      = useState({});
    const [saving,    setSaving]    = useState(false);
    const [formErr,   setFormErr]   = useState("");

    const pull = useCallback(async () => {
        setLoading(true); setError(""); setFetched(true);
        try {
            const res = await axios.get(`/api/integrations/ebay/marketing?connectionId=${connectionId}&type=${tab}`);
            if (tab === "promotions") setPromos(res.data.promotions ?? []);
            else setCampaigns(res.data.campaigns ?? []);
        } catch (e) {
            setError(e.response?.data?.error ?? "Failed to load marketing");
        } finally { setLoading(false); }
    }, [connectionId, tab]);

    useEffect(() => { pull(); }, [pull]);

    const openDialog = (type) => {
        setFormErr("");
        setForm(type === "campaign" ? { ...BLANK_CAMPAIGN, startDate: todayISO() } : { ...BLANK_PROMOTION, startDate: todayISO() });
        setDialog(type);
    };

    const save = async () => {
        if (!form.name?.trim()) { setFormErr("Name is required"); return; }
        if (!form.startDate)    { setFormErr("Start date is required"); return; }
        if (dialog === "promotion" && (!form.percentageOff || Number(form.percentageOff) < 1 || Number(form.percentageOff) > 99)) {
            setFormErr("Discount must be between 1 and 99%"); return;
        }
        if (dialog === "campaign" && (!form.bidPercentage || Number(form.bidPercentage) < 1)) {
            setFormErr("Bid percentage must be at least 1%"); return;
        }
        setSaving(true); setFormErr("");
        try {
            const payload = { ...form, startDate: new Date(form.startDate).toISOString() };
            if (payload.endDate) payload.endDate = new Date(payload.endDate).toISOString();
            else delete payload.endDate;
            await axios.post("/api/integrations/ebay/marketing", { connectionId, type: dialog, ...payload });
            setDialog(null);
            await pull();
        } catch (e) {
            setFormErr(e.response?.data?.error ?? "Failed to create");
        } finally { setSaving(false); }
    };

    const f = (key) => (e) => setForm(prev => ({ ...prev, [key]: e.target.value }));

    return (
        <Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ minHeight: 36 }}>
                    <Tab value="campaigns"   label="Ad Campaigns"  sx={{ minHeight: 36, py: 0 }} />
                    <Tab value="promotions"  label="Promotions"    sx={{ minHeight: 36, py: 0 }} />
                </Tabs>
                <Stack direction="row" spacing={1}>
                    <Button variant="contained" size="small"
                        onClick={() => openDialog(tab === "campaigns" ? "campaign" : "promotion")}
                        sx={{ bgcolor: EBAY_RED, "&:hover": { bgcolor: "#c0282d" }, fontSize: "0.75rem" }}>
                        + Create {tab === "campaigns" ? "Campaign" : "Promotion"}
                    </Button>
                    <Button variant="outlined" size="small" startIcon={<SyncIcon />} onClick={pull} disabled={loading}>
                        {loading ? "Loading…" : "Refresh"}
                    </Button>
                </Stack>
            </Box>
            <Panel loading={loading} error={error}>
                {!fetched ? (
                    <Typography color="text.secondary" variant="body2">Click "Load" to fetch {tab}.</Typography>
                ) : tab === "campaigns" ? (
                    campaigns.length === 0 ? <Alert severity="info">No ad campaigns found. Create one above.</Alert> : (
                        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ bgcolor: "action.hover" }}>
                                        <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Budget</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Ad Rate</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Start</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>End</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {campaigns.map(c => (
                                        <TableRow key={c.campaignId} hover>
                                            <TableCell sx={{ fontWeight: 600 }}>{c.campaignName}</TableCell>
                                            <TableCell>{c.campaignType}</TableCell>
                                            <TableCell>{fmtUSD(c.budget?.dailyBudget?.value)}</TableCell>
                                            <TableCell>{c.adGroupBidDeliveryPreferences?.adRate ?? c.fundingStrategy?.bidPercentage ?? "—"}{c.fundingStrategy?.bidPercentage ? "%" : ""}</TableCell>
                                            <TableCell><StatusChip label={c.campaignStatus?.toUpperCase()} /></TableCell>
                                            <TableCell>{fmtDate(c.startDate)}</TableCell>
                                            <TableCell>{c.endDate ? fmtDate(c.endDate) : "Ongoing"}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )
                ) : (
                    promos.length === 0 ? <Alert severity="info">No promotions found. Create one above.</Alert> : (
                        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ bgcolor: "action.hover" }}>
                                        <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Discount</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Start</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>End</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {promos.map(p => (
                                        <TableRow key={p.promotionId} hover>
                                            <TableCell sx={{ fontWeight: 600 }}>{p.name}</TableCell>
                                            <TableCell>{p.promotionType}</TableCell>
                                            <TableCell>{p.percentageOff != null ? `${p.percentageOff}%` : "—"}</TableCell>
                                            <TableCell><StatusChip label={p.status?.toUpperCase()} /></TableCell>
                                            <TableCell>{fmtDate(p.startDate)}</TableCell>
                                            <TableCell>{p.endDate ? fmtDate(p.endDate) : "Ongoing"}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )
                )}
            </Panel>

            {/* Create Campaign dialog */}
            <Dialog open={dialog === "campaign"} onClose={() => setDialog(null)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ fontWeight: 700 }}>Create Ad Campaign</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ pt: 1 }}>
                        {formErr && <Alert severity="error" sx={{ fontSize: "0.8rem" }}>{formErr}</Alert>}
                        <TextField size="small" label="Campaign Name *" value={form.name ?? ""} onChange={f("name")} fullWidth />
                        <TextField size="small" label="Bid Percentage (%) *" type="number" value={form.bidPercentage ?? "5.0"} onChange={f("bidPercentage")} fullWidth
                            inputProps={{ min: 1, max: 100, step: 0.1 }}
                            helperText="eBay Promoted Listings standard ad rate (1–100%)" />
                        <TextField size="small" label="Start Date *" type="datetime-local" value={form.startDate ?? ""} onChange={f("startDate")} fullWidth
                            InputLabelProps={{ shrink: true }} />
                        <TextField size="small" label="End Date (optional)" type="datetime-local" value={form.endDate ?? ""} onChange={f("endDate")} fullWidth
                            InputLabelProps={{ shrink: true }} helperText="Leave blank for no end date" />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setDialog(null)} disabled={saving}>Cancel</Button>
                    <Button variant="contained" onClick={save} disabled={saving}
                        startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <CheckIcon />}
                        sx={{ bgcolor: EBAY_RED, "&:hover": { bgcolor: "#c0282d" } }}>
                        {saving ? "Creating…" : "Create Campaign"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Create Promotion dialog */}
            <Dialog open={dialog === "promotion"} onClose={() => setDialog(null)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ fontWeight: 700 }}>Create Markdown Promotion</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ pt: 1 }}>
                        {formErr && <Alert severity="error" sx={{ fontSize: "0.8rem" }}>{formErr}</Alert>}
                        <TextField size="small" label="Promotion Name *" value={form.name ?? ""} onChange={f("name")} fullWidth />
                        <TextField size="small" label="Discount (%) *" type="number" value={form.percentageOff ?? "10"} onChange={f("percentageOff")} fullWidth
                            inputProps={{ min: 1, max: 99, step: 1 }}
                            helperText="Markdown percentage off original price (1–99%)" />
                        <TextField size="small" label="Start Date *" type="datetime-local" value={form.startDate ?? ""} onChange={f("startDate")} fullWidth
                            InputLabelProps={{ shrink: true }} />
                        <TextField size="small" label="End Date (optional)" type="datetime-local" value={form.endDate ?? ""} onChange={f("endDate")} fullWidth
                            InputLabelProps={{ shrink: true }} helperText="Leave blank for no end date" />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setDialog(null)} disabled={saving}>Cancel</Button>
                    <Button variant="contained" onClick={save} disabled={saving}
                        startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <CheckIcon />}
                        sx={{ bgcolor: EBAY_RED, "&:hover": { bgcolor: "#c0282d" } }}>
                        {saving ? "Creating…" : "Create Promotion"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

// ─── Policies Panel ───────────────────────────────────────────────────────────

const CARRIERS = ["USPS", "UPS", "FedEx", "DHL"];
const USPS_SERVICES = ["USPSFirstClass", "USPSPriority", "USPSParcel", "USPSGroundAdvantage"];
const UPS_SERVICES  = ["UPSGround", "UPS2ndDayAir", "UPSNextDayAir"];
const FEDEX_SERVICES = ["FedExGround", "FedEx2Day", "FedExPriorityOvernight"];

function getServices(carrier) {
    if (carrier === "UPS")   return UPS_SERVICES;
    if (carrier === "FedEx") return FEDEX_SERVICES;
    return USPS_SERVICES;
}

const BLANK_FULFILLMENT = { name: "", handlingTimeDays: 3, shippingCarrier: "USPS", shippingService: "USPSPriority", shippingCost: "4.99", additionalCost: "2.00", freeShipping: false };
const BLANK_PAYMENT     = { name: "", immediatePay: true };
const BLANK_RETURN      = { name: "", returnsAccepted: true, returnDays: 30, payer: "BUYER", refundMethod: "MONEY_BACK" };

function PolicySection({ title, policies, nameKey, idKey, onCreate, onDelete, onRecreate, recreating }) {
    return (
        <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography variant="subtitle2" fontWeight={700}>{title}</Typography>
                <Stack direction="row" spacing={1}>
                    {onRecreate && (
                        <Button size="small" variant="outlined" color="warning" onClick={onRecreate} disabled={recreating}
                            sx={{ fontSize: "0.72rem" }}>
                            {recreating ? "…" : "Recreate Default"}
                        </Button>
                    )}
                    <Button size="small" variant="contained" onClick={onCreate}
                        sx={{ bgcolor: EBAY_BLUE, "&:hover": { bgcolor: "#0051a8" }, fontSize: "0.75rem" }}>
                        + Create
                    </Button>
                </Stack>
            </Box>
            {policies.length === 0 ? (
                <Alert severity="info" sx={{ fontSize: "0.8rem" }}>No {title.toLowerCase()} found. Create one to start listing.</Alert>
            ) : (
                <TableContainer>
                    <Table size="small" sx={{ tableLayout: "fixed" }}>
                        <colgroup>
                            <col style={{ width: "40%" }} />
                            <col style={{ width: "52%" }} />
                            <col style={{ width: "8%" }} />
                        </colgroup>
                        <TableHead>
                            <TableRow sx={{ bgcolor: "action.hover" }}>
                                <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>ID</TableCell>
                                <TableCell />
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {policies.map(p => (
                                <TableRow key={p[idKey]} hover>
                                    <TableCell sx={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p[nameKey]}</TableCell>
                                    <TableCell sx={{ fontFamily: "monospace", fontSize: "0.72rem", color: "text.secondary", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p[idKey]}</TableCell>
                                    <TableCell align="right">
                                        <IconButton size="small" color="error" onClick={() => onDelete?.(p[idKey])}>
                                            <CloseIcon sx={{ fontSize: 14 }} />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </Paper>
    );
}

function PoliciesPanel({ connectionId }) {
    const [policies,  setPolicies]  = useState(null);
    const [loading,   setLoading]   = useState(false);
    const [error,     setError]     = useState("");
    const [fetched,   setFetched]   = useState(false);
    const [saving,    setSaving]    = useState(false);
    const [dialog,    setDialog]    = useState(null); // "fulfillment" | "payment" | "return"
    const [form,      setForm]      = useState({});
    const [formErr,   setFormErr]   = useState("");

    const pull = useCallback(async () => {
        setLoading(true); setError(""); setFetched(true);
        try {
            const res = await axios.get(`/api/integrations/ebay/policies?connectionId=${connectionId}`);
            setPolicies(res.data);
        } catch (e) {
            setError(e.response?.data?.error ?? "Failed to load policies");
        } finally { setLoading(false); }
    }, [connectionId]);

    useEffect(() => { pull(); }, [pull]);

    const openDialog = (type) => {
        setFormErr("");
        if (type === "fulfillment") setForm({ ...BLANK_FULFILLMENT });
        if (type === "payment")     setForm({ ...BLANK_PAYMENT });
        if (type === "return")      setForm({ ...BLANK_RETURN });
        setDialog(type);
    };

    const save = async () => {
        if (!form.name?.trim()) { setFormErr("Name is required"); return; }
        setSaving(true); setFormErr("");
        try {
            await axios.post("/api/integrations/ebay/policies", { connectionId, type: dialog, ...form });
            setDialog(null);
            await pull();
        } catch (e) {
            setFormErr(e.response?.data?.error ?? "Failed to create policy");
        } finally { setSaving(false); }
    };

    const recreateDefaultFulfillment = async () => {
        setSaving(true); setError("");
        try {
            for (const p of policies?.fulfillmentPolicies ?? []) {
                await axios.delete(`/api/integrations/ebay/policies?connectionId=${connectionId}&policyId=${p.fulfillmentPolicyId}`).catch(() => {});
            }
            await axios.post("/api/integrations/ebay/policies", {
                connectionId, type: "fulfillment", name: "Default Shipping Policy",
                handlingTimeDays: 3, shippingCarrier: "USPS", shippingService: "USPSPriority",
                shippingCost: "4.99", additionalCost: "2.00", freeShipping: false,
            });
            await pull();
        } catch (e) {
            setError(e.response?.data?.error ?? "Recreate failed");
        } finally { setSaving(false); }
    };

    const f = (key) => (e) => {
        const val = e.target.type === "checkbox" ? e.target.checked : e.target.value;
        setForm(prev => {
            const next = { ...prev, [key]: val };
            if (key === "shippingCarrier") next.shippingService = getServices(val)[0];
            return next;
        });
    };

    return (
        <Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                <Typography variant="subtitle1" fontWeight={700}>Business Policies</Typography>
                <Button variant="outlined" size="small" startIcon={<SyncIcon />} onClick={pull} disabled={loading}>
                    {loading ? "Loading…" : "Refresh"}
                </Button>
            </Box>
            <Panel loading={loading && !fetched} error={error}>
                <Stack spacing={3}>
                    <PolicySection
                        title="Fulfillment Policies"
                        policies={policies?.fulfillmentPolicies ?? []}
                        nameKey="name" idKey="fulfillmentPolicyId"
                        onCreate={() => openDialog("fulfillment")}
                        onDelete={async id => { try { await axios.delete(`/api/integrations/ebay/policies?connectionId=${connectionId}&policyId=${id}`); await pull(); } catch (e) { setError(e.response?.data?.error ?? "Delete failed"); } }}
                        onRecreate={recreateDefaultFulfillment}
                        recreating={saving}
                    />
                    <PolicySection
                        title="Payment Policies"
                        policies={policies?.paymentPolicies ?? []}
                        nameKey="name" idKey="paymentPolicyId"
                        onCreate={() => openDialog("payment")}
                    />
                    <PolicySection
                        title="Return Policies"
                        policies={policies?.returnPolicies ?? []}
                        nameKey="name" idKey="returnPolicyId"
                        onCreate={() => openDialog("return")}
                    />
                </Stack>
            </Panel>

            {/* Fulfillment dialog */}
            <Dialog open={dialog === "fulfillment"} onClose={() => setDialog(null)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ fontWeight: 700 }}>Create Fulfillment Policy</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ pt: 1 }}>
                        {formErr && <Alert severity="error" sx={{ fontSize: "0.8rem" }}>{formErr}</Alert>}
                        <TextField size="small" label="Policy Name *" value={form.name ?? ""} onChange={f("name")} fullWidth />
                        <TextField size="small" label="Handling Time (days)" type="number" value={form.handlingTimeDays ?? 1} onChange={f("handlingTimeDays")} fullWidth inputProps={{ min: 0, max: 30 }} />
                        <FormControl size="small" fullWidth>
                            <InputLabel>Carrier</InputLabel>
                            <Select value={form.shippingCarrier ?? "USPS"} label="Carrier" onChange={f("shippingCarrier")}>
                                {CARRIERS.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                            </Select>
                        </FormControl>
                        <FormControl size="small" fullWidth>
                            <InputLabel>Service</InputLabel>
                            <Select value={form.shippingService ?? ""} label="Service" onChange={f("shippingService")}>
                                {getServices(form.shippingCarrier ?? "USPS").map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                            </Select>
                        </FormControl>
                        <TextField size="small" label="Shipping Cost (USD)" type="number" value={form.shippingCost ?? "4.99"} onChange={f("shippingCost")} fullWidth inputProps={{ min: 0, step: 0.01 }} />
                        <TextField size="small" label="Additional Item Cost (USD)" type="number" value={form.additionalCost ?? "2.00"} onChange={f("additionalCost")} fullWidth inputProps={{ min: 0, step: 0.01 }} />
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <input type="checkbox" id="freeShip" checked={!!form.freeShipping} onChange={f("freeShipping")} />
                            <Typography component="label" htmlFor="freeShip" variant="body2">Free Shipping</Typography>
                        </Box>
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setDialog(null)} disabled={saving}>Cancel</Button>
                    <Button variant="contained" onClick={save} disabled={saving} startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <CheckIcon />} sx={{ bgcolor: EBAY_BLUE }}>
                        {saving ? "Saving…" : "Create"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Payment dialog */}
            <Dialog open={dialog === "payment"} onClose={() => setDialog(null)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ fontWeight: 700 }}>Create Payment Policy</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ pt: 1 }}>
                        {formErr && <Alert severity="error" sx={{ fontSize: "0.8rem" }}>{formErr}</Alert>}
                        <TextField size="small" label="Policy Name *" value={form.name ?? ""} onChange={f("name")} fullWidth />
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <input type="checkbox" id="immPay" checked={!!form.immediatePay} onChange={f("immediatePay")} />
                            <Typography component="label" htmlFor="immPay" variant="body2">Require Immediate Payment</Typography>
                        </Box>
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setDialog(null)} disabled={saving}>Cancel</Button>
                    <Button variant="contained" onClick={save} disabled={saving} startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <CheckIcon />} sx={{ bgcolor: EBAY_BLUE }}>
                        {saving ? "Saving…" : "Create"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Return dialog */}
            <Dialog open={dialog === "return"} onClose={() => setDialog(null)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ fontWeight: 700 }}>Create Return Policy</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ pt: 1 }}>
                        {formErr && <Alert severity="error" sx={{ fontSize: "0.8rem" }}>{formErr}</Alert>}
                        <TextField size="small" label="Policy Name *" value={form.name ?? ""} onChange={f("name")} fullWidth />
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <input type="checkbox" id="retAccepted" checked={!!form.returnsAccepted} onChange={f("returnsAccepted")} />
                            <Typography component="label" htmlFor="retAccepted" variant="body2">Accept Returns</Typography>
                        </Box>
                        {form.returnsAccepted && (
                            <>
                                <TextField size="small" label="Return Window (days)" type="number" value={form.returnDays ?? 30} onChange={f("returnDays")} fullWidth inputProps={{ min: 14, max: 60 }} />
                                <FormControl size="small" fullWidth>
                                    <InputLabel>Return Shipping Paid By</InputLabel>
                                    <Select value={form.payer ?? "BUYER"} label="Return Shipping Paid By" onChange={f("payer")}>
                                        <MenuItem value="BUYER">Buyer</MenuItem>
                                        <MenuItem value="SELLER">Seller</MenuItem>
                                    </Select>
                                </FormControl>
                                <FormControl size="small" fullWidth>
                                    <InputLabel>Refund Method</InputLabel>
                                    <Select value={form.refundMethod ?? "MONEY_BACK"} label="Refund Method" onChange={f("refundMethod")}>
                                        <MenuItem value="MONEY_BACK">Money Back</MenuItem>
                                        <MenuItem value="MERCHANDISE_CREDIT">Store Credit</MenuItem>
                                    </Select>
                                </FormControl>
                            </>
                        )}
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setDialog(null)} disabled={saving}>Cancel</Button>
                    <Button variant="contained" onClick={save} disabled={saving} startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <CheckIcon />} sx={{ bgcolor: EBAY_BLUE }}>
                        {saving ? "Saving…" : "Create"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

const TABS = [
    { value: "overview",    label: "Overview",    icon: <StorefrontIcon fontSize="small" /> },
    { value: "orders",      label: "Orders",      icon: <LocalShippingIcon fontSize="small" /> },
    { value: "listings",    label: "Listings",    icon: <InventoryIcon fontSize="small" /> },
    { value: "analytics",   label: "Analytics",   icon: <BarChartIcon fontSize="small" /> },
    { value: "finances",    label: "Finances",    icon: <AccountBalanceIcon fontSize="small" /> },
    { value: "messages",    label: "Messages",    icon: <MessageIcon fontSize="small" /> },
    { value: "feedback",    label: "Feedback",    icon: <ThumbUpIcon fontSize="small" /> },
    { value: "disputes",    label: "Disputes",    icon: <GavelIcon fontSize="small" /> },
    { value: "marketing",   label: "Marketing",   icon: <CampaignIcon fontSize="small" /> },
    { value: "policies",    label: "Policies",    icon: <CheckIcon fontSize="small" /> },
];

export function EbayDashboard({ connections }) {
    const [activeConn, setActiveConn] = useState(connections?.[0]?._id ?? null);
    const [tab, setTab] = useState("overview");
    const conn = connections?.find(c => c._id === activeConn);

    if (!connections?.length) {
        return (
            <Box sx={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Box sx={{ textAlign: "center", p: 6 }}>
                    <Box sx={{ width: 64, height: 64, borderRadius: "50%", bgcolor: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 3 }}>
                        <StoreIcon sx={{ color: EBAY_RED, fontSize: 32 }} />
                    </Box>
                    <Typography variant="h5" fontWeight={800} mb={1}>No eBay Connection</Typography>
                    <Typography color="text.secondary" mb={3} sx={{ maxWidth: 360, mx: "auto" }}>
                        Connect your eBay seller account to manage orders, listings, and more.
                    </Typography>
                    <Button variant="contained" href="/api/integrations/ebay/oauth/init"
                        sx={{ bgcolor: EBAY_RED, "&:hover": { bgcolor: "#c0282d" }, px: 3 }}>
                        Connect with eBay
                    </Button>
                </Box>
            </Box>
        );
    }

    return (
        <Box sx={{ width: "100%", minHeight: "100vh", bgcolor: "#f8f9fb", display: "flex", flexDirection: "column" }}>
            {/* Header bar */}
            <Box sx={{ bgcolor: "#fff", borderBottom: "1px solid", borderColor: "divider", px: { xs: 2, md: 4 }, py: 2 }}>
                <Box sx={{ maxWidth: 1400, mx: "auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
                    <Stack direction="row" alignItems="center" spacing={2}>
                        <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: EBAY_RED, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <StoreIcon sx={{ color: "#fff", fontSize: 22 }} />
                        </Box>
                        <Box>
                            <Stack direction="row" alignItems="center" spacing={1}>
                                <Typography variant="h6" fontWeight={800} letterSpacing={-0.3} lineHeight={1.2}>eBay Dashboard</Typography>
                                {conn?.sandbox && (
                                    <Chip label="SANDBOX" size="small" sx={{ bgcolor: "#fef3c7", color: "#92400e", fontWeight: 700, fontSize: "0.6rem", height: 18 }} />
                                )}
                            </Stack>
                            <Typography variant="caption" color="text.secondary">
                                {conn?.sandbox ? "Sandbox" : "Production"} · {conn?.displayName ?? "eBay Store"}
                            </Typography>
                        </Box>
                    </Stack>
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" rowGap={1}>
                        {connections.length > 1 && (
                            <FormControl size="small" sx={{ minWidth: 180 }}>
                                <InputLabel>Account</InputLabel>
                                <Select value={activeConn} label="Account" onChange={e => setActiveConn(e.target.value)}>
                                    {connections.map(c => (
                                        <MenuItem key={c._id} value={c._id}>
                                            {c.displayName ?? "eBay Store"}{c.sandbox ? " (Sandbox)" : ""}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        )}
                        <Button variant="contained" size="small" href="/api/integrations/ebay/oauth/init"
                            sx={{ bgcolor: EBAY_RED, "&:hover": { bgcolor: "#c0282d" }, fontSize: "0.75rem" }}>
                            + Add Account
                        </Button>
                        <Button component={Link} href="/admin/integrations" size="small" variant="outlined" startIcon={<ArrowBackIcon />}
                            sx={{ fontSize: "0.75rem" }}>
                            Back
                        </Button>
                    </Stack>
                </Box>
            </Box>

            {/* Tab navigation */}
            <Box sx={{ bgcolor: "#fff", borderBottom: "1px solid", borderColor: "divider", px: { xs: 0, md: 2 } }}>
                <Box sx={{ maxWidth: 1400, mx: "auto" }}>
                    <Tabs
                        value={tab}
                        onChange={(_, v) => setTab(v)}
                        variant="scrollable"
                        scrollButtons="auto"
                        sx={{
                            "& .MuiTab-root": { minHeight: 48, fontSize: "0.8rem", fontWeight: 600, opacity: 0.65 },
                            "& .Mui-selected": { opacity: 1, color: EBAY_RED },
                            "& .MuiTabs-indicator": { bgcolor: EBAY_RED },
                        }}
                    >
                        {TABS.map(t => (
                            <Tab key={t.value} value={t.value} label={t.label} icon={t.icon} iconPosition="start" />
                        ))}
                    </Tabs>
                </Box>
            </Box>

            {/* Content */}
            {activeConn && (
                <Box sx={{ maxWidth: 1400, mx: "auto", width: "100%", px: { xs: 2, md: 4 }, py: 3 }}>
                    {tab === "overview"  && <OverviewPanel  connectionId={activeConn} />}
                    {tab === "orders"    && <OrdersPanel    connectionId={activeConn} />}
                    {tab === "listings"  && <ListingsPanel  connectionId={activeConn} />}
                    {tab === "analytics" && <AnalyticsPanel connectionId={activeConn} />}
                    {tab === "finances"  && <FinancesPanel  connectionId={activeConn} />}
                    {tab === "messages"  && <MessagesPanel  connectionId={activeConn} />}
                    {tab === "feedback"  && <FeedbackPanel  connectionId={activeConn} />}
                    {tab === "disputes"  && <DisputesPanel  connectionId={activeConn} />}
                    {tab === "marketing" && <MarketingPanel connectionId={activeConn} />}
                    {tab === "policies"  && <PoliciesPanel  connectionId={activeConn} />}
                </Box>
            )}
        </Box>
    );
}

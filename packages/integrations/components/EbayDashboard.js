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
    if (loading) return <Box sx={{ py: 6, textAlign: "center" }}><CircularProgress /></Box>;
    if (error) return <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>;
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
                    {loading ? "Pulling…" : fetched ? "Refresh" : "Pull Orders"}
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
    const [saving,  setSaving]  = useState(false);

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
                <Tabs value={tab} onChange={(_, v) => { setTab(v); setFetched(false); }} sx={{ minHeight: 36 }}>
                    <Tab value="items" label="Inventory Items" sx={{ minHeight: 36, py: 0 }} />
                    <Tab value="offers" label="Offers / Listings" sx={{ minHeight: 36, py: 0 }} />
                </Tabs>
                <Button variant="outlined" size="small" startIcon={<SyncIcon />} onClick={pull} disabled={loading}>
                    {loading ? "Loading…" : fetched ? "Refresh" : "Load"}
                </Button>
            </Box>
            <Panel loading={loading} error={error}>
                {!fetched ? (
                    <Typography color="text.secondary" variant="body2">Click "Load" to fetch your {tab === "offers" ? "offers" : "inventory items"}.</Typography>
                ) : tab === "items" ? (
                    items.length === 0 ? <Alert severity="info">No inventory items found.</Alert> : (
                        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ bgcolor: "action.hover" }}>
                                        <TableCell sx={{ fontWeight: 700 }}>SKU</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Title</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Condition</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Qty</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {items.map(item => (
                                        <TableRow key={item.sku} hover>
                                            <TableCell sx={{ fontFamily: "monospace", fontSize: "0.75rem" }}>{item.sku}</TableCell>
                                            <TableCell>{item.product?.title ?? "—"}</TableCell>
                                            <TableCell>{item.condition}</TableCell>
                                            <TableCell>{item.availability?.shipToLocationAvailability?.quantity ?? "—"}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
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
                                                <IconButton size="small" onClick={() => {
                                                    setEditing(offer);
                                                    setEditPrice(offer.pricingSummary?.price?.value ?? "");
                                                    setEditQty(String(offer.availableQuantity ?? ""));
                                                }}>
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
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

    return (
        <Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography variant="subtitle1" fontWeight={700}>Seller Analytics</Typography>
                <Button variant="outlined" size="small" startIcon={<SyncIcon />} onClick={pull} disabled={loading}>
                    {loading ? "Loading…" : fetched ? "Refresh" : "Load"}
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

    return (
        <Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Tabs value={tab} onChange={(_, v) => { setTab(v); setFetched(false); }} sx={{ minHeight: 36 }}>
                    <Tab value="transactions" label="Transactions" sx={{ minHeight: 36, py: 0 }} />
                    <Tab value="payouts"      label="Payouts"      sx={{ minHeight: 36, py: 0 }} />
                </Tabs>
                <Button variant="outlined" size="small" startIcon={<SyncIcon />} onClick={pull} disabled={loading}>
                    {loading ? "Loading…" : fetched ? "Refresh" : "Load"}
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
                        {loading ? "Loading…" : fetched ? "Refresh" : "Load"}
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

    return (
        <Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography variant="subtitle1" fontWeight={700}>Seller Feedback</Typography>
                <Button variant="outlined" size="small" startIcon={<SyncIcon />} onClick={pull} disabled={loading}>
                    {loading ? "Loading…" : fetched ? "Refresh" : "Load"}
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
                        {loading ? "Loading…" : fetched ? "Refresh" : "Load"}
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

function MarketingPanel({ connectionId }) {
    const [tab,       setTab]       = useState("campaigns");
    const [campaigns, setCampaigns] = useState([]);
    const [promos,    setPromos]    = useState([]);
    const [loading,   setLoading]   = useState(false);
    const [error,     setError]     = useState("");
    const [fetched,   setFetched]   = useState(false);

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

    return (
        <Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Tabs value={tab} onChange={(_, v) => { setTab(v); setFetched(false); }} sx={{ minHeight: 36 }}>
                    <Tab value="campaigns"   label="Ad Campaigns"  sx={{ minHeight: 36, py: 0 }} />
                    <Tab value="promotions"  label="Promotions"    sx={{ minHeight: 36, py: 0 }} />
                </Tabs>
                <Button variant="outlined" size="small" startIcon={<SyncIcon />} onClick={pull} disabled={loading}>
                    {loading ? "Loading…" : fetched ? "Refresh" : "Load"}
                </Button>
            </Box>
            <Panel loading={loading} error={error}>
                {!fetched ? (
                    <Typography color="text.secondary" variant="body2">Click "Load" to fetch {tab}.</Typography>
                ) : tab === "campaigns" ? (
                    campaigns.length === 0 ? <Alert severity="info">No ad campaigns found.</Alert> : (
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
                                            <TableCell>{c.adGroupBidDeliveryPreferences?.adRate ?? "—"}</TableCell>
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
                    promos.length === 0 ? <Alert severity="info">No promotions found.</Alert> : (
                        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ bgcolor: "action.hover" }}>
                                        <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
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
];

export function EbayDashboard({ connections }) {
    const [activeConn, setActiveConn] = useState(connections?.[0]?._id ?? null);
    const [tab, setTab] = useState("overview");
    const conn = connections?.find(c => c._id === activeConn);

    if (!connections?.length) {
        return (
            <Container maxWidth="sm" sx={{ py: 10, textAlign: "center" }}>
                <Typography variant="h5" fontWeight={700} mb={2}>No eBay Connection</Typography>
                <Typography color="text.secondary" mb={3}>Connect your eBay store to get started.</Typography>
                <Button variant="contained" href="/api/integrations/ebay/oauth/init" sx={{ bgcolor: EBAY_RED, "&:hover": { bgcolor: "#c0282d" } }}>
                    Connect with eBay
                </Button>
            </Container>
        );
    }

    return (
        <Box sx={{ width: "100%", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
            <Container maxWidth="xl" sx={{ py: 4, flex: 1 }}>
                {/* Header */}
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 2 }}>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                        <Box component="img" src="/ebay.svg" alt="eBay" sx={{ height: 32 }} onError={e => { e.target.style.display = "none"; }} />
                        <Box>
                            <Typography variant="h5" fontWeight={800} letterSpacing={-0.5}>eBay Dashboard</Typography>
                            <Typography variant="body2" color="text.secondary">
                                {conn?.sandbox ? "Sandbox" : "Production"} · {conn?.displayName ?? "eBay Store"}
                            </Typography>
                        </Box>
                        {conn?.sandbox && (
                            <Chip label="SANDBOX" size="small" sx={{ bgcolor: "#fef3c7", color: "#92400e", fontWeight: 700, fontSize: "0.65rem" }} />
                        )}
                    </Stack>
                    <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" rowGap={1}>
                        {connections.length > 1 && (
                            <FormControl size="small" sx={{ minWidth: 200 }}>
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
                        <Button variant="outlined" size="small"
                            href="/api/integrations/ebay/oauth/init?sandbox=1"
                            sx={{ borderColor: "#92400e", color: "#92400e" }}>
                            + Add Sandbox
                        </Button>
                        <Button variant="contained" size="small"
                            href="/api/integrations/ebay/oauth/init"
                            sx={{ bgcolor: EBAY_RED, "&:hover": { bgcolor: "#c0282d" } }}>
                            + Add Account
                        </Button>
                        <Button component={Link} href="/admin/integrations" size="small" variant="outlined" startIcon={<ArrowBackIcon />}>
                            Back
                        </Button>
                    </Stack>
                </Box>

                <Divider sx={{ mb: 3 }} />

                {/* Tabs */}
                <Tabs
                    value={tab}
                    onChange={(_, v) => setTab(v)}
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{ mb: 3, "& .MuiTab-root": { minHeight: 42, fontSize: "0.82rem" } }}
                >
                    {TABS.map(t => (
                        <Tab key={t.value} value={t.value} label={t.label} icon={t.icon} iconPosition="start" />
                    ))}
                </Tabs>

                {/* Panel */}
                {activeConn && (
                    <Box>
                        {tab === "overview"  && <OverviewPanel  connectionId={activeConn} />}
                        {tab === "orders"    && <OrdersPanel    connectionId={activeConn} />}
                        {tab === "listings"  && <ListingsPanel  connectionId={activeConn} />}
                        {tab === "analytics" && <AnalyticsPanel connectionId={activeConn} />}
                        {tab === "finances"  && <FinancesPanel  connectionId={activeConn} />}
                        {tab === "messages"  && <MessagesPanel  connectionId={activeConn} />}
                        {tab === "feedback"  && <FeedbackPanel  connectionId={activeConn} />}
                        {tab === "disputes"  && <DisputesPanel  connectionId={activeConn} />}
                        {tab === "marketing" && <MarketingPanel connectionId={activeConn} />}
                    </Box>
                )}
            </Container>
        </Box>
    );
}

"use client";
import {
    Box, Grid2, Card, CardActionArea, Container, Typography, Divider,
    Button, Chip, Stack, Paper, Avatar, Switch, IconButton,
    Collapse, Table, TableHead, TableBody, TableRow, TableCell,
    TableContainer, CircularProgress, Alert, Tooltip, Select, MenuItem,
    TextField, Dialog, DialogTitle, DialogContent, DialogActions,
} from "@mui/material";
import Image from "next/image";
import tiktok  from "./tiktoksm.jpeg";
import etsy    from "./etsy2.jpeg";
import amazon  from "./amazon.png";
import acenda  from "./Acenda.png";
import { TikTokModal }  from "./TikTokModal";
import { AcendaModal }  from "./AcendaModal";
import { WalmartModal } from "./WalmartModal";
import { FaireModal }   from "./FaireModal";
import { SheinModal }   from "./SheinModal";
import { TemuModal }    from "./TemuModal";
import { AmazonModal }  from "./AmazonModal";
import { MiraklModal }  from "./MiraklModal";
import { WixModal }         from "./WixModal";
import { WooCommerceModal } from "./WooCommerceModal";
import { SquarespaceModal } from "./SquarespaceModal";
import { MetaModal }        from "./MetaModal";
import { PinterestModal }   from "./PinterestModal";
import { OnBuyModal }       from "./OnBuyModal";
import { RakutenModal }     from "./RakutenModal";
import { WayfairModal }     from "./WayfairModal";
import { RithumModal }     from "./RithumModal";
import { TargetModal }  from "./TargetModal";
import { EbayModal }    from "./EbayModal";
import { NoonModal }    from "./NoonModal";
import { BolModal }     from "./BolModal";
import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import StorefrontIcon from "@mui/icons-material/Storefront";
import SyncIcon from "@mui/icons-material/Sync";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import axios from "axios";

// ─── Brand config ─────────────────────────────────────────────────────────────
const PLATFORMS = {
    shopify: { label: "Shopify",      color: "#96bf48", description: "Sell through your Shopify store with automatic order sync, product listings, and sales management." },
    tiktok:  { label: "TikTok Shop",  color: "#010101", description: "Sell directly on TikTok Shop with product listings and order sync." },
    etsy:    { label: "Etsy",         color: "#F56400", description: "Connect your Etsy storefront for listing management and orders." },
    amazon:  { label: "Amazon",       color: "#FF9900", description: "Sell on Amazon Marketplace with order sync, fulfillment confirmation, and product listings via SP-API." },
    acenda:  { label: "Acenda",       color: "#1565C0", description: "Sync inventory and catalog with your Acenda storefront." },
    walmart: { label: "Walmart",      color: "#0071CE", description: "List products on Walmart Marketplace and manage orders." },
    faire:   { label: "Faire",        color: "#10305A", description: "Wholesale marketplace connecting brands with independent retailers." },
    shein:   { label: "SHEIN",        color: "#000000", description: "List products on SHEIN's global marketplace via the Open Platform API." },
    temu:    { label: "Temu",         color: "#ff6500", description: "List products on Temu's global marketplace via the Partner Open Platform API." },
    mirakl:  { label: "Mirakl",      color: "#1d4ed8", description: "Sell on any Mirakl-powered marketplace (Carrefour, Best Buy Canada, and others) with order sync and fulfillment." },
    target:  { label: "Target Plus", color: "#CC0000", description: "Sell on Target Plus marketplace with order sync, fulfillment confirmation, and direct SP-API integration." },
    ebay:    { label: "eBay",        color: "#E53238", description: "List products on eBay and automatically pull orders and confirm shipments via the eBay Sell API." },
    noon:    { label: "Noon",        color: "#f59e0b", description: "Sell on Noon marketplace across UAE, Saudi Arabia, and Egypt with order sync and fulfillment." },
    wix:         { label: "Wix",              color: "#0C6EFC", description: "Sync products and pull orders from your Wix Store." },
    woocommerce: { label: "WooCommerce",      color: "#7f54b3", description: "Sync products and pull orders from your WooCommerce store via the REST API." },
    squarespace: { label: "Squarespace",      color: "#111827", description: "Pull orders and sync products with your Squarespace Commerce store." },
    bol:         { label: "bol.com",          color: "#0062B1", description: "Sell on bol.com, the leading marketplace in the Netherlands and Belgium, with order sync and fulfillment." },
    meta:        { label: "Meta Shops",       color: "#0866FF", description: "Sync your product catalog and pull orders from Facebook and Instagram Shops via the Meta Commerce Platform API." },
    pinterest:   { label: "Pinterest",        color: "#E60023", description: "Sync your product catalog to Pinterest Shopping via the Pinterest Catalog API. Orders happen on your storefront." },
    onbuy:       { label: "OnBuy",            color: "#5D11D4", description: "Pull orders and list products on OnBuy, the UK's fastest-growing marketplace." },
    rakuten:     { label: "Rakuten",          color: "#BF0000", description: "List products and pull orders on Rakuten Ichiba, Japan's leading marketplace, via the RMS API." },
    wayfair:     { label: "Wayfair",          color: "#7B2D8B", description: "Pull purchase orders from Wayfair and confirm shipments via the Wayfair Supplier GraphQL API." },
    rithum:          { label: "Rithum",        color: "#1a1a2e", description: "Formerly ChannelAdvisor/DSCO — pull orders and sync products across Zulily and other Rithum-powered channels." },
    channelengine:   { label: "ChannelEngine", color: "#0078d7", description: "Omni-channel hub: sync products, pull orders, confirm shipments, and manage returns across all your channels via ChannelEngine." },
    gs1:             { label: "GS1 US",        color: "#009a44", description: "Generate and manage GTINs/UPCs for your products via the GS1 US API. Required to assign valid UPCs when creating products." },
};

function platformColor(type) {
    return PLATFORMS[type]?.color ?? "#6b7280";
}

// ─── Platform card in the gallery ────────────────────────────────────────────
function PlatformCard({ logo, logoSrc, alt, name, description, onClick, href, comingSoon, connected, logoBg }) {
    const hasImage = logo || logoSrc;
    const inner = (
        <Box sx={{
            display: "flex", flexDirection: "column", alignItems: "center",
            gap: 1.5, height: "100%", p: 3, textAlign: "center",
        }}>
            <Box sx={{
                height: 64, display: "flex", alignItems: "center", justifyContent: "center",
                width: "100%", borderRadius: 1.5, bgcolor: logoBg ?? (hasImage ? "transparent" : "#f3f4f6"),
                px: 1.5,
            }}>
                {logo
                    ? <Image src={logo} alt={alt} width={200} height={64}
                        style={{ maxWidth: "100%", maxHeight: 64, width: "auto", height: "auto", objectFit: "contain" }} />
                    : logoSrc
                        ? <img src={logoSrc} alt={alt}
                            style={{ maxWidth: "100%", maxHeight: 64, width: "auto", height: "auto", objectFit: "contain" }} />
                        : <Typography sx={{ fontSize: "1.6rem", fontWeight: 900, color: logoBg ? "#fff" : "#9ca3af", lineHeight: 1 }}>
                            {name?.charAt(0)?.toUpperCase()}
                          </Typography>
                }
            </Box>
            <Typography variant="subtitle1" fontWeight={700}>{name}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1, fontSize: "0.8rem" }}>
                {description}
            </Typography>
            {connected
                ? <Chip label="Connected" size="small" icon={<CheckCircleOutlineIcon sx={{ fontSize: 14 }} />}
                    sx={{ bgcolor: "#d1fae5", color: "#065f46", fontWeight: 600, "& .MuiChip-icon": { color: "#065f46" } }} />
                : comingSoon
                    ? <Chip label="Coming Soon" size="small" sx={{ bgcolor: "#f3f4f6", color: "#6b7280", fontWeight: 600 }} />
                    : <Button
                        variant="outlined" size="small" startIcon={<AddIcon />}
                        sx={{ mt: "auto", pointerEvents: "none", borderRadius: 2 }}
                    >
                        Connect
                    </Button>
            }
        </Box>
    );

    if (comingSoon) {
        return (
            <Card variant="outlined" sx={{
                height: "100%", opacity: 0.6,
                borderRadius: 2, border: "1px solid #e5e7eb",
            }}>
                {inner}
            </Card>
        );
    }

    if (connected) {
        const connectedCard = (
            <Card variant="outlined" sx={{
                height: "100%", borderRadius: 2,
                border: "1px solid #6ee7b7",
                bgcolor: "#f0fdf4",
                ...(href ? { transition: "box-shadow .15s, transform .15s", "&:hover": { boxShadow: "0 4px 16px rgba(0,0,0,.1)", transform: "translateY(-2px)" } } : {}),
            }}>
                {href ? <CardActionArea component={Link} href={href} sx={{ height: "100%" }}>{inner}</CardActionArea> : inner}
            </Card>
        );
        return connectedCard;
    }

    if (href) {
        return (
            <Card variant="outlined" sx={{
                height: "100%", borderRadius: 2, border: "1px solid #e5e7eb",
                transition: "box-shadow .15s, transform .15s",
                "&:hover": { boxShadow: "0 4px 16px rgba(0,0,0,.12)", transform: "translateY(-2px)" },
            }}>
                <CardActionArea component={Link} href={href} target="_blank" sx={{ height: "100%" }}>
                    {inner}
                </CardActionArea>
            </Card>
        );
    }

    return (
        <Card variant="outlined" sx={{
            height: "100%", borderRadius: 2, border: "1px solid #e5e7eb",
            transition: "box-shadow .15s, transform .15s",
            "&:hover": { boxShadow: "0 4px 16px rgba(0,0,0,.12)", transform: "translateY(-2px)" },
        }}>
            <CardActionArea onClick={onClick} sx={{ height: "100%" }}>
                {inner}
            </CardActionArea>
        </Card>
    );
}

// ─── Etsy Orders Panel ────────────────────────────────────────────────────────
const ETSY_CARRIERS = ["usps","ups","fedex","dhl","ontrac","other"];

function EtsyOrdersPanel({ connectionId }) {
    const [orders, setOrders]     = useState([]);
    const [loading, setLoading]   = useState(false);
    const [error, setError]       = useState("");
    const [fetched, setFetched]   = useState(false);
    const [shipTarget, setShipTarget] = useState(null);
    const [carrier, setCarrier]   = useState("usps");
    const [tracking, setTracking] = useState("");
    const [shipping, setShipping] = useState(false);

    const pull = useCallback(async () => {
        setLoading(true); setError(""); setFetched(true);
        try {
            const res = await axios.get(`/api/integrations/etsy/orders?connectionId=${connectionId}`);
            setOrders(res.data.orders ?? []);
        } catch (e) {
            const d = e.response?.data;
            setError(typeof d?.error === "string" ? d.error : JSON.stringify(d) ?? "Failed to pull orders");
        } finally { setLoading(false); }
    }, [connectionId]);

    const ship = async () => {
        if (!tracking.trim()) return;
        setShipping(true);
        try {
            await axios.post("/api/integrations/etsy/orders", {
                connectionId, receiptId: shipTarget.receipt_id, trackingCode: tracking.trim(), carrier,
            });
            setOrders(prev => prev.filter(o => o.receipt_id !== shipTarget.receipt_id));
            setShipTarget(null); setTracking("");
        } catch (e) {
            const d = e.response?.data;
            setError(typeof d?.error === "string" ? d.error : "Ship failed");
        } finally { setShipping(false); }
    };

    return (
        <Box sx={{ px: 2.5, pb: 2 }}>
            <Divider sx={{ mb: 2 }} />
            <Stack direction="row" alignItems="center" spacing={2} mb={1.5}>
                <Typography variant="body2" fontWeight={600} color="text.secondary">Open Orders (paid, not shipped)</Typography>
                <Button size="small" variant="outlined"
                    startIcon={loading ? <CircularProgress size={12} /> : <SyncIcon sx={{ fontSize: 14 }} />}
                    onClick={pull} disabled={loading}>
                    {fetched ? "Refresh" : "Pull Now"}
                </Button>
                {fetched && !loading && (
                    <Chip label={`${orders.length} order${orders.length !== 1 ? "s" : ""}`} size="small"
                        sx={{ bgcolor: orders.length > 0 ? "#fef3c7" : "#d1fae5", color: orders.length > 0 ? "#92400e" : "#065f46", fontWeight: 600 }} />
                )}
            </Stack>
            {error && <Alert severity="error" sx={{ mb: 1.5 }} onClose={() => setError("")}>{error}</Alert>}
            {shipTarget && (
                <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 1.5, bgcolor: "#f0fdf4" }}>
                    <Typography variant="body2" fontWeight={600} mb={1}>
                        Ship Receipt #{shipTarget.receipt_id} — {shipTarget.name}
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <Select size="small" value={carrier} onChange={e => setCarrier(e.target.value)} sx={{ minWidth: 110 }}>
                            {ETSY_CARRIERS.map(c => <MenuItem key={c} value={c}>{c.toUpperCase()}</MenuItem>)}
                        </Select>
                        <TextField size="small" label="Tracking Code" value={tracking}
                            onChange={e => setTracking(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && ship()} sx={{ flexGrow: 1 }} />
                        <Button variant="contained" size="small" onClick={ship} disabled={shipping || !tracking.trim()}
                            startIcon={shipping ? <CircularProgress size={12} color="inherit" /> : <LocalShippingIcon sx={{ fontSize: 14 }} />}
                            sx={{ bgcolor: "#F56400", "&:hover": { bgcolor: "#d45200" } }}>
                            Ship
                        </Button>
                        <Button size="small" onClick={() => { setShipTarget(null); setTracking(""); }}>Cancel</Button>
                    </Stack>
                </Paper>
            )}
            {fetched && !loading && orders.length > 0 && (
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1.5 }}>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: "#f8fafc" }}>
                                <TableCell sx={{ fontWeight: 700 }}>Receipt #</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Customer</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Items</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Total</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {orders.map(o => (
                                <TableRow key={o.receipt_id} hover selected={shipTarget?.receipt_id === o.receipt_id}>
                                    <TableCell><Typography variant="body2" fontWeight={500}>#{o.receipt_id}</Typography></TableCell>
                                    <TableCell><Typography variant="body2">{o.name ?? "—"}</Typography></TableCell>
                                    <TableCell><Typography variant="body2">{(o.transactions ?? []).length}</Typography></TableCell>
                                    <TableCell>
                                        <Typography variant="body2">
                                            {o.grandtotal?.amount ? `$${(o.grandtotal.amount / o.grandtotal.divisor).toFixed(2)}` : "—"}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="caption" color="text.secondary">
                                            {o.create_timestamp ? new Date(o.create_timestamp * 1000).toLocaleDateString() : "—"}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Button size="small" variant="outlined"
                                            startIcon={<LocalShippingIcon sx={{ fontSize: 14 }} />}
                                            onClick={() => { setShipTarget(o); setTracking(""); }}
                                            sx={{ borderColor: "#F56400", color: "#F56400" }}>
                                            Ship
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
            {fetched && !loading && orders.length === 0 && !error && (
                <Typography variant="body2" color="text.secondary">No open orders found.</Typography>
            )}
        </Box>
    );
}

// ─── Acenda Orders Panel ───────────────────────────────────────────────────────
function AcendaOrdersPanel({ connectionId }) {
    const [orders, setOrders]   = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError]     = useState("");
    const [acking, setAcking]   = useState(null);
    const [fetched, setFetched] = useState(false);

    const pull = useCallback(async () => {
        setLoading(true); setError(""); setFetched(true);
        try {
            const res = await axios.get(`/api/integrations/acenda/orders?connectionId=${connectionId}&unacked=true`);
            setOrders(res.data.orders ?? []);
        } catch (e) {
            const d = e.response?.data;
            setError(typeof d?.error === "string" ? d.error : JSON.stringify(d) ?? "Failed to pull orders");
        } finally { setLoading(false); }
    }, [connectionId]);

    const acknowledge = async (orderId) => {
        setAcking(orderId);
        try {
            await axios.post("/api/integrations/acenda/orders", { connectionId, orderId });
            setOrders(prev => prev.filter(o => o.id !== orderId));
        } catch (e) {
            const d = e.response?.data;
            setError(typeof d?.error === "string" ? d.error : "Acknowledge failed");
        } finally { setAcking(null); }
    };

    return (
        <Box sx={{ px: 2.5, pb: 2 }}>
            <Divider sx={{ mb: 2 }} />
            <Stack direction="row" alignItems="center" spacing={2} mb={1.5}>
                <Typography variant="body2" fontWeight={600} color="text.secondary">
                    Unacknowledged Orders
                </Typography>
                <Button
                    size="small" variant="outlined" startIcon={loading ? <CircularProgress size={12} /> : <SyncIcon sx={{ fontSize: 14 }} />}
                    onClick={pull} disabled={loading}
                >
                    {fetched ? "Refresh" : "Pull Now"}
                </Button>
                {fetched && !loading && (
                    <Chip label={`${orders.length} order${orders.length !== 1 ? "s" : ""}`} size="small"
                        sx={{ bgcolor: orders.length > 0 ? "#fef3c7" : "#d1fae5", color: orders.length > 0 ? "#92400e" : "#065f46", fontWeight: 600 }} />
                )}
            </Stack>
            {error && <Alert severity="error" sx={{ mb: 1.5 }} onClose={() => setError("")}>{error}</Alert>}
            {fetched && !loading && orders.length > 0 && (
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1.5 }}>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: "#f8fafc" }}>
                                <TableCell sx={{ fontWeight: 700 }}>Order #</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Items</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Created</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {orders.map(o => (
                                <TableRow key={o.id} hover>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight={500}>{o.order_number ?? o.id}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip label={o.status ?? "—"} size="small"
                                            sx={{ bgcolor: "#dbeafe", color: "#1e40af", fontWeight: 600, fontSize: "0.7rem" }} />
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">{(o.line_items ?? o.items ?? []).length}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="caption" color="text.secondary">
                                            {o.created_at ? new Date(o.created_at).toLocaleDateString() : "—"}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Tooltip title="Mark as acknowledged (removes from queue)">
                                            <Button
                                                size="small" variant="outlined" color="success"
                                                startIcon={acking === o.id ? <CircularProgress size={12} /> : <CheckCircleOutlineIcon sx={{ fontSize: 14 }} />}
                                                disabled={acking === o.id}
                                                onClick={() => acknowledge(o.id)}
                                            >
                                                Acknowledge
                                            </Button>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
            {fetched && !loading && orders.length === 0 && !error && (
                <Typography variant="body2" color="text.secondary" sx={{ pl: 0.5 }}>
                    No unacknowledged orders found.
                </Typography>
            )}
        </Box>
    );
}

// ─── Walmart Orders Panel ─────────────────────────────────────────────────────
const WALMART_CARRIERS = ["USPS", "UPS", "FedEx", "DHL"];

function WalmartOrdersPanel({ connectionId }) {
    const [orders, setOrders]   = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError]     = useState("");
    const [fetched, setFetched] = useState(false);
    const [acking, setAcking]   = useState(null);
    const [shipTarget, setShipTarget] = useState(null);
    const [carrier, setCarrier] = useState("USPS");
    const [tracking, setTracking] = useState("");
    const [shipping, setShipping] = useState(false);

    const pull = useCallback(async () => {
        setLoading(true); setError(""); setFetched(true);
        try {
            const res = await axios.get(`/api/integrations/walmart/orders?connectionId=${connectionId}&released=true`);
            setOrders(res.data.orders ?? []);
        } catch (e) {
            const d = e.response?.data;
            setError(typeof d?.error === "string" ? d.error : JSON.stringify(d) ?? "Failed to pull orders");
        } finally { setLoading(false); }
    }, [connectionId]);

    const acknowledge = async (purchaseOrderId) => {
        setAcking(purchaseOrderId);
        try {
            await axios.post("/api/integrations/walmart/orders", { connectionId, purchaseOrderId, action: "acknowledge" });
            setOrders(prev => prev.filter(o => o.purchaseOrderId !== purchaseOrderId));
        } catch (e) {
            setError(typeof e.response?.data?.error === "string" ? e.response.data.error : "Acknowledge failed");
        } finally { setAcking(null); }
    };

    const ship = async () => {
        if (!tracking.trim() || !shipTarget) return;
        setShipping(true);
        try {
            const lines = (shipTarget.orderLines?.orderLine ?? []).map(l => ({
                lineNumber: l.lineNumber,
                quantity: parseInt(l.orderLineQuantity?.amount ?? "1", 10),
                trackingNumber: tracking.trim(),
                carrier,
            }));
            await axios.post("/api/integrations/walmart/orders", { connectionId, purchaseOrderId: shipTarget.purchaseOrderId, action: "ship", lines });
            setOrders(prev => prev.filter(o => o.purchaseOrderId !== shipTarget.purchaseOrderId));
            setShipTarget(null); setTracking("");
        } catch (e) {
            setError(typeof e.response?.data?.error === "string" ? e.response.data.error : "Ship failed");
        } finally { setShipping(false); }
    };

    return (
        <Box sx={{ px: 2.5, pb: 2 }}>
            <Divider sx={{ mb: 2 }} />
            <Stack direction="row" alignItems="center" spacing={2} mb={1.5}>
                <Typography variant="body2" fontWeight={600} color="text.secondary">Released Orders</Typography>
                <Button size="small" variant="outlined"
                    startIcon={loading ? <CircularProgress size={12} /> : <SyncIcon sx={{ fontSize: 14 }} />}
                    onClick={pull} disabled={loading}>
                    {fetched ? "Refresh" : "Pull Now"}
                </Button>
                {fetched && !loading && (
                    <Chip label={`${orders.length} order${orders.length !== 1 ? "s" : ""}`} size="small"
                        sx={{ bgcolor: orders.length > 0 ? "#fef3c7" : "#d1fae5", color: orders.length > 0 ? "#92400e" : "#065f46", fontWeight: 600 }} />
                )}
            </Stack>
            {error && <Alert severity="error" sx={{ mb: 1.5 }} onClose={() => setError("")}>{error}</Alert>}
            {shipTarget && (
                <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 1.5, bgcolor: "#e0f2fe" }}>
                    <Typography variant="body2" fontWeight={600} mb={1}>
                        Ship Order #{shipTarget.customerOrderId ?? shipTarget.purchaseOrderId}
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <Select size="small" value={carrier} onChange={e => setCarrier(e.target.value)} sx={{ minWidth: 110 }}>
                            {WALMART_CARRIERS.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                        </Select>
                        <TextField size="small" label="Tracking Number" value={tracking}
                            onChange={e => setTracking(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && ship()} sx={{ flexGrow: 1 }} />
                        <Button variant="contained" size="small" onClick={ship} disabled={shipping || !tracking.trim()}
                            startIcon={shipping ? <CircularProgress size={12} color="inherit" /> : <LocalShippingIcon sx={{ fontSize: 14 }} />}
                            sx={{ bgcolor: "#0071CE", "&:hover": { bgcolor: "#005fa3" } }}>
                            Ship
                        </Button>
                        <Button size="small" onClick={() => { setShipTarget(null); setTracking(""); }}>Cancel</Button>
                    </Stack>
                </Paper>
            )}
            {fetched && !loading && orders.length > 0 && (
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1.5 }}>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: "#f8fafc" }}>
                                <TableCell sx={{ fontWeight: 700 }}>Order #</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Customer</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Items</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {orders.map(o => (
                                <TableRow key={o.purchaseOrderId} hover selected={shipTarget?.purchaseOrderId === o.purchaseOrderId}>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight={500}>
                                            #{o.customerOrderId ?? o.purchaseOrderId}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">{o.shippingInfo?.postalAddress?.name ?? "—"}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">{(o.orderLines?.orderLine ?? []).length}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="caption" color="text.secondary">
                                            {o.orderDate ? new Date(o.orderDate).toLocaleDateString() : "—"}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Stack direction="row" spacing={0.5}>
                                            <Button size="small" variant="outlined"
                                                startIcon={acking === o.purchaseOrderId ? <CircularProgress size={12} /> : <CheckCircleOutlineIcon sx={{ fontSize: 14 }} />}
                                                disabled={acking === o.purchaseOrderId}
                                                onClick={() => acknowledge(o.purchaseOrderId)}
                                                color="success">
                                                Ack
                                            </Button>
                                            <Button size="small" variant="outlined"
                                                startIcon={<LocalShippingIcon sx={{ fontSize: 14 }} />}
                                                onClick={() => { setShipTarget(o); setTracking(""); }}
                                                sx={{ borderColor: "#0071CE", color: "#0071CE" }}>
                                                Ship
                                            </Button>
                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
            {fetched && !loading && orders.length === 0 && !error && (
                <Typography variant="body2" color="text.secondary">No released orders found.</Typography>
            )}
        </Box>
    );
}

// ─── SHEIN Orders Panel ───────────────────────────────────────────────────────
const SHEIN_CARRIERS = ["USPS", "UPS", "FedEx", "DHL", "OnTrac", "LSO", "Other"];

function SheinOrdersPanel({ connectionId }) {
    const [orders, setOrders]   = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError]     = useState("");
    const [fetched, setFetched] = useState(false);
    const [shipTarget, setShipTarget] = useState(null);
    const [carrier, setCarrier] = useState("USPS");
    const [tracking, setTracking] = useState("");
    const [shipping, setShipping] = useState(false);

    const pull = useCallback(async () => {
        setLoading(true); setError(""); setFetched(true);
        try {
            const res = await axios.get(`/api/integrations/shein/orders?connectionId=${connectionId}&status=unshipped`);
            setOrders(res.data.orders ?? []);
        } catch (e) {
            const d = e.response?.data;
            setError(typeof d?.error === "string" ? d.error : JSON.stringify(d) ?? "Failed to pull orders");
        } finally { setLoading(false); }
    }, [connectionId]);

    const ship = async () => {
        if (!tracking.trim() || !shipTarget) return;
        setShipping(true);
        try {
            await axios.post("/api/integrations/shein/orders", {
                connectionId,
                orderId: shipTarget.order_no ?? shipTarget.id,
                action: "ship",
                carrierCode: carrier,
                trackingNumber: tracking.trim(),
            });
            setOrders(prev => prev.filter(o => (o.order_no ?? o.id) !== (shipTarget.order_no ?? shipTarget.id)));
            setShipTarget(null); setTracking("");
        } catch (e) {
            const d = e.response?.data;
            setError(typeof d?.error === "string" ? d.error : "Ship failed");
        } finally { setShipping(false); }
    };

    return (
        <Box sx={{ px: 2.5, pb: 2 }}>
            <Divider sx={{ mb: 2 }} />
            <Stack direction="row" alignItems="center" spacing={2} mb={1.5}>
                <Typography variant="body2" fontWeight={600} color="text.secondary">Unshipped Orders</Typography>
                <Button size="small" variant="outlined"
                    startIcon={loading ? <CircularProgress size={12} /> : <SyncIcon sx={{ fontSize: 14 }} />}
                    onClick={pull} disabled={loading}>
                    {fetched ? "Refresh" : "Pull Now"}
                </Button>
                {fetched && !loading && (
                    <Chip label={`${orders.length} order${orders.length !== 1 ? "s" : ""}`} size="small"
                        sx={{ bgcolor: orders.length > 0 ? "#fef3c7" : "#d1fae5", color: orders.length > 0 ? "#92400e" : "#065f46", fontWeight: 600 }} />
                )}
            </Stack>
            {error && <Alert severity="error" sx={{ mb: 1.5 }} onClose={() => setError("")}>{error}</Alert>}
            {shipTarget && (
                <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 1.5, bgcolor: "#f5f5f5" }}>
                    <Typography variant="body2" fontWeight={600} mb={1}>
                        Ship Order #{shipTarget.order_no ?? shipTarget.id}
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <Select size="small" value={carrier} onChange={e => setCarrier(e.target.value)} sx={{ minWidth: 110 }}>
                            {SHEIN_CARRIERS.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                        </Select>
                        <TextField size="small" label="Tracking Number" value={tracking}
                            onChange={e => setTracking(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && ship()} sx={{ flexGrow: 1 }} />
                        <Button variant="contained" size="small" onClick={ship} disabled={shipping || !tracking.trim()}
                            startIcon={shipping ? <CircularProgress size={12} color="inherit" /> : <LocalShippingIcon sx={{ fontSize: 14 }} />}
                            sx={{ bgcolor: "#000", "&:hover": { bgcolor: "#222" } }}>
                            Ship
                        </Button>
                        <Button size="small" onClick={() => { setShipTarget(null); setTracking(""); }}>Cancel</Button>
                    </Stack>
                </Paper>
            )}
            {fetched && !loading && orders.length > 0 && (
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1.5 }}>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: "#f8fafc" }}>
                                <TableCell sx={{ fontWeight: 700 }}>Order #</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Items</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {orders.map(o => (
                                <TableRow key={o.order_no ?? o.id} hover selected={shipTarget?.order_no === o.order_no}>
                                    <TableCell><Typography variant="body2" fontWeight={500}>#{o.order_no ?? o.id}</Typography></TableCell>
                                    <TableCell>
                                        <Chip label={o.order_status ?? "—"} size="small"
                                            sx={{ bgcolor: "#f3f4f6", color: "#374151", fontWeight: 600, fontSize: "0.7rem" }} />
                                    </TableCell>
                                    <TableCell><Typography variant="body2">{(o.order_items ?? o.items ?? []).length}</Typography></TableCell>
                                    <TableCell>
                                        <Typography variant="caption" color="text.secondary">
                                            {o.create_time ? new Date(o.create_time * 1000).toLocaleDateString() : "—"}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Button size="small" variant="outlined"
                                            startIcon={<LocalShippingIcon sx={{ fontSize: 14 }} />}
                                            onClick={() => { setShipTarget(o); setTracking(""); }}
                                            sx={{ borderColor: "#000", color: "#000" }}>
                                            Ship
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
            {fetched && !loading && orders.length === 0 && !error && (
                <Typography variant="body2" color="text.secondary">No unshipped orders found.</Typography>
            )}
        </Box>
    );
}

// ─── Temu Orders Panel ────────────────────────────────────────────────────────
const TEMU_CARRIERS = ["USPS", "UPS", "FedEx", "DHL", "OnTrac", "Other"];

function TemuOrdersPanel({ connectionId }) {
    const [orders, setOrders]   = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError]     = useState("");
    const [fetched, setFetched] = useState(false);
    const [shipTarget, setShipTarget] = useState(null);
    const [carrier, setCarrier] = useState("USPS");
    const [tracking, setTracking] = useState("");
    const [shipping, setShipping] = useState(false);

    const pull = useCallback(async () => {
        setLoading(true); setError(""); setFetched(true);
        try {
            const res = await axios.get(`/api/integrations/temu/orders?connectionId=${connectionId}&orderStatus=1`);
            setOrders(res.data.orders ?? []);
        } catch (e) {
            const d = e.response?.data;
            setError(typeof d?.error === "string" ? d.error : JSON.stringify(d) ?? "Failed to pull orders");
        } finally { setLoading(false); }
    }, [connectionId]);

    const ship = async () => {
        if (!tracking.trim() || !shipTarget) return;
        setShipping(true);
        try {
            await axios.post("/api/integrations/temu/orders", {
                connectionId,
                orderSn: shipTarget.orderSn ?? shipTarget.order_sn ?? shipTarget.id,
                action: "ship",
                carrierCode: carrier,
                trackingNumber: tracking.trim(),
            });
            const key = shipTarget.orderSn ?? shipTarget.order_sn ?? shipTarget.id;
            setOrders(prev => prev.filter(o => (o.orderSn ?? o.order_sn ?? o.id) !== key));
            setShipTarget(null); setTracking("");
        } catch (e) {
            const d = e.response?.data;
            setError(typeof d?.error === "string" ? d.error : "Ship failed");
        } finally { setShipping(false); }
    };

    return (
        <Box sx={{ px: 2.5, pb: 2 }}>
            <Divider sx={{ mb: 2 }} />
            <Stack direction="row" alignItems="center" spacing={2} mb={1.5}>
                <Typography variant="body2" fontWeight={600} color="text.secondary">Pending Orders</Typography>
                <Button size="small" variant="outlined"
                    startIcon={loading ? <CircularProgress size={12} /> : <SyncIcon sx={{ fontSize: 14 }} />}
                    onClick={pull} disabled={loading}>
                    {fetched ? "Refresh" : "Pull Now"}
                </Button>
                {fetched && !loading && (
                    <Chip label={`${orders.length} order${orders.length !== 1 ? "s" : ""}`} size="small"
                        sx={{ bgcolor: orders.length > 0 ? "#fef3c7" : "#d1fae5", color: orders.length > 0 ? "#92400e" : "#065f46", fontWeight: 600 }} />
                )}
            </Stack>
            {error && <Alert severity="error" sx={{ mb: 1.5 }} onClose={() => setError("")}>{error}</Alert>}
            {shipTarget && (
                <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 1.5, bgcolor: "#fff5ee" }}>
                    <Typography variant="body2" fontWeight={600} mb={1}>
                        Ship Order {shipTarget.orderSn ?? shipTarget.order_sn ?? shipTarget.id}
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <Select size="small" value={carrier} onChange={e => setCarrier(e.target.value)} sx={{ minWidth: 110 }}>
                            {TEMU_CARRIERS.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                        </Select>
                        <TextField size="small" label="Tracking Number" value={tracking}
                            onChange={e => setTracking(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && ship()} sx={{ flexGrow: 1 }} />
                        <Button variant="contained" size="small" onClick={ship} disabled={shipping || !tracking.trim()}
                            startIcon={shipping ? <CircularProgress size={12} color="inherit" /> : <LocalShippingIcon sx={{ fontSize: 14 }} />}
                            sx={{ bgcolor: "#ff6500", "&:hover": { bgcolor: "#e05a00" } }}>
                            Ship
                        </Button>
                        <Button size="small" onClick={() => { setShipTarget(null); setTracking(""); }}>Cancel</Button>
                    </Stack>
                </Paper>
            )}
            {fetched && !loading && orders.length > 0 && (
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1.5 }}>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: "#f8fafc" }}>
                                <TableCell sx={{ fontWeight: 700 }}>Order #</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Items</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {orders.map(o => {
                                const key = o.orderSn ?? o.order_sn ?? o.id;
                                return (
                                    <TableRow key={key} hover selected={(shipTarget?.orderSn ?? shipTarget?.order_sn ?? shipTarget?.id) === key}>
                                        <TableCell><Typography variant="body2" fontWeight={500}>{key}</Typography></TableCell>
                                        <TableCell>
                                            <Chip label={o.orderStatus ?? o.order_status ?? "—"} size="small"
                                                sx={{ bgcolor: "#fff5ee", color: "#ff6500", fontWeight: 600, fontSize: "0.7rem" }} />
                                        </TableCell>
                                        <TableCell><Typography variant="body2">{(o.orderGoodsList ?? o.items ?? []).length}</Typography></TableCell>
                                        <TableCell>
                                            <Typography variant="caption" color="text.secondary">
                                                {o.createTime ? new Date(o.createTime).toLocaleDateString() : "—"}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Button size="small" variant="outlined"
                                                startIcon={<LocalShippingIcon sx={{ fontSize: 14 }} />}
                                                onClick={() => { setShipTarget(o); setTracking(""); }}
                                                sx={{ borderColor: "#ff6500", color: "#ff6500" }}>
                                                Ship
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
            {fetched && !loading && orders.length === 0 && !error && (
                <Typography variant="body2" color="text.secondary">No pending orders found.</Typography>
            )}
        </Box>
    );
}

// ─── Faire Orders Panel ────────────────────────────────────────────────────────
const FAIRE_CARRIERS = ["USPS", "UPS", "FEDEX", "DHL_EXPRESS", "DHL_ECOMMERCE", "CANADA_POST", "OTHER"];

function FaireOrdersPanel({ connectionId }) {
    const [orders, setOrders]   = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError]     = useState("");
    const [fetched, setFetched] = useState(false);
    const [shipTarget, setShipTarget] = useState(null);
    const [carrier, setCarrier] = useState("USPS");
    const [tracking, setTracking] = useState("");
    const [shipping, setShipping] = useState(false);

    const pull = useCallback(async () => {
        setLoading(true); setError(""); setFetched(true);
        try {
            const res = await axios.get(`/api/integrations/faire/orders?connectionId=${connectionId}&excludedStates=SHIPPED,CANCELED`);
            setOrders(res.data.orders ?? []);
        } catch (e) {
            const d = e.response?.data;
            setError(typeof d?.error === "string" ? d.error : JSON.stringify(d) ?? "Failed to pull orders");
        } finally { setLoading(false); }
    }, [connectionId]);

    const accept = async (orderId) => {
        try {
            await axios.post("/api/integrations/faire/orders", { connectionId, orderId, action: "accept" });
            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, state: "PROCESSING" } : o));
        } catch (e) {
            setError(typeof e.response?.data?.error === "string" ? e.response.data.error : "Accept failed");
        }
    };

    const ship = async () => {
        if (!tracking.trim() || !shipTarget) return;
        setShipping(true);
        try {
            await axios.post("/api/integrations/faire/orders", {
                connectionId, orderId: shipTarget.id, action: "ship",
                shipment: { carrier, tracking_code: tracking.trim() },
            });
            setOrders(prev => prev.filter(o => o.id !== shipTarget.id));
            setShipTarget(null); setTracking("");
        } catch (e) {
            setError(typeof e.response?.data?.error === "string" ? e.response.data.error : "Ship failed");
        } finally { setShipping(false); }
    };

    return (
        <Box sx={{ px: 2.5, pb: 2 }}>
            <Divider sx={{ mb: 2 }} />
            <Stack direction="row" alignItems="center" spacing={2} mb={1.5}>
                <Typography variant="body2" fontWeight={600} color="text.secondary">Open Orders</Typography>
                <Button size="small" variant="outlined"
                    startIcon={loading ? <CircularProgress size={12} /> : <SyncIcon sx={{ fontSize: 14 }} />}
                    onClick={pull} disabled={loading}>
                    {fetched ? "Refresh" : "Pull Now"}
                </Button>
                {fetched && !loading && (
                    <Chip label={`${orders.length} order${orders.length !== 1 ? "s" : ""}`} size="small"
                        sx={{ bgcolor: orders.length > 0 ? "#fef3c7" : "#d1fae5", color: orders.length > 0 ? "#92400e" : "#065f46", fontWeight: 600 }} />
                )}
            </Stack>
            {error && <Alert severity="error" sx={{ mb: 1.5 }} onClose={() => setError("")}>{error}</Alert>}
            {shipTarget && (
                <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 1.5, bgcolor: "#f0f4ff" }}>
                    <Typography variant="body2" fontWeight={600} mb={1}>
                        Ship Order {shipTarget.display_id ?? shipTarget.id}
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <Select size="small" value={carrier} onChange={e => setCarrier(e.target.value)} sx={{ minWidth: 140 }}>
                            {FAIRE_CARRIERS.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                        </Select>
                        <TextField size="small" label="Tracking Code" value={tracking}
                            onChange={e => setTracking(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && ship()} sx={{ flexGrow: 1 }} />
                        <Button variant="contained" size="small" onClick={ship} disabled={shipping || !tracking.trim()}
                            startIcon={shipping ? <CircularProgress size={12} color="inherit" /> : <LocalShippingIcon sx={{ fontSize: 14 }} />}
                            sx={{ bgcolor: "#10305A", "&:hover": { bgcolor: "#0c2347" } }}>
                            Ship
                        </Button>
                        <Button size="small" onClick={() => { setShipTarget(null); setTracking(""); }}>Cancel</Button>
                    </Stack>
                </Paper>
            )}
            {fetched && !loading && orders.length > 0 && (
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1.5 }}>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: "#f8fafc" }}>
                                <TableCell sx={{ fontWeight: 700 }}>Order #</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>State</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Items</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {orders.map(o => (
                                <TableRow key={o.id} hover selected={shipTarget?.id === o.id}>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight={500}>{o.display_id ?? o.id}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip label={o.state ?? "—"} size="small"
                                            sx={{ bgcolor: "#dbeafe", color: "#1e40af", fontWeight: 600, fontSize: "0.7rem" }} />
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">{(o.items ?? []).length}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="caption" color="text.secondary">
                                            {o.created_at ? new Date(o.created_at).toLocaleDateString() : "—"}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Stack direction="row" spacing={0.5}>
                                            {o.state === "NEW" && (
                                                <Button size="small" variant="outlined" color="success"
                                                    startIcon={<CheckCircleOutlineIcon sx={{ fontSize: 14 }} />}
                                                    onClick={() => accept(o.id)}>
                                                    Accept
                                                </Button>
                                            )}
                                            <Button size="small" variant="outlined"
                                                startIcon={<LocalShippingIcon sx={{ fontSize: 14 }} />}
                                                onClick={() => { setShipTarget(o); setTracking(""); }}
                                                sx={{ borderColor: "#10305A", color: "#10305A" }}>
                                                Ship
                                            </Button>
                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
            {fetched && !loading && orders.length === 0 && !error && (
                <Typography variant="body2" color="text.secondary">No open orders found.</Typography>
            )}
        </Box>
    );
}

// ─── Amazon Orders Panel ──────────────────────────────────────────────────────
const AMAZON_CARRIERS = ["UPS", "USPS", "FedEx", "DHL", "OnTrac", "Other"];

function AmazonOrdersPanel({ connectionId }) {
    const [orders, setOrders]         = useState([]);
    const [loading, setLoading]       = useState(false);
    const [error, setError]           = useState("");
    const [fetched, setFetched]       = useState(false);
    const [shipTarget, setShipTarget] = useState(null);
    const [carrier, setCarrier]       = useState("UPS");
    const [tracking, setTracking]     = useState("");
    const [shipping, setShipping]     = useState(false);

    const pull = useCallback(async () => {
        setLoading(true); setError(""); setFetched(true);
        try {
            const res = await axios.get(`/api/integrations/amazon/orders?connectionId=${connectionId}`);
            setOrders(res.data.orders ?? []);
        } catch (e) {
            setError(e.response?.data?.error ?? "Failed to pull orders");
        } finally { setLoading(false); }
    }, [connectionId]);

    const ship = async () => {
        if (!tracking.trim() || !shipTarget) return;
        setShipping(true);
        try {
            await axios.post("/api/integrations/amazon/orders", {
                connectionId,
                orderId:    shipTarget.AmazonOrderId,
                action:     "ship",
                trackingNumber: tracking.trim(),
                carrier,
                orderItems: (shipTarget.orderItems ?? []).map(i => ({
                    orderItemId: i.OrderItemId,
                    quantity:    parseInt(i.QuantityOrdered ?? "1", 10),
                })),
            });
            setOrders(prev => prev.filter(o => o.AmazonOrderId !== shipTarget.AmazonOrderId));
            setShipTarget(null); setTracking("");
        } catch (e) {
            setError(e.response?.data?.error ?? "Ship failed");
        } finally { setShipping(false); }
    };

    return (
        <Box sx={{ px: 2.5, pb: 2 }}>
            <Divider sx={{ mb: 2 }} />
            <Stack direction="row" alignItems="center" spacing={2} mb={1.5}>
                <Typography variant="body2" fontWeight={600} color="text.secondary">Unshipped Orders</Typography>
                <Button size="small" variant="outlined"
                    startIcon={loading ? <CircularProgress size={12} /> : <SyncIcon sx={{ fontSize: 14 }} />}
                    onClick={pull} disabled={loading}>
                    {fetched ? "Refresh" : "Pull Now"}
                </Button>
                {fetched && !loading && (
                    <Chip label={`${orders.length} order${orders.length !== 1 ? "s" : ""}`} size="small"
                        sx={{ bgcolor: orders.length > 0 ? "#fef3c7" : "#d1fae5", color: orders.length > 0 ? "#92400e" : "#065f46", fontWeight: 600 }} />
                )}
            </Stack>
            {error && <Alert severity="error" sx={{ mb: 1.5 }} onClose={() => setError("")}>{error}</Alert>}
            {shipTarget && (
                <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 1.5, bgcolor: "#fff8f0" }}>
                    <Typography variant="body2" fontWeight={600} mb={1}>
                        Ship Order {shipTarget.AmazonOrderId}
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <Select size="small" value={carrier} onChange={e => setCarrier(e.target.value)} sx={{ minWidth: 110 }}>
                            {AMAZON_CARRIERS.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                        </Select>
                        <TextField size="small" label="Tracking Number" value={tracking}
                            onChange={e => setTracking(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && ship()} sx={{ flexGrow: 1 }} />
                        <Button variant="contained" size="small" onClick={ship} disabled={shipping || !tracking.trim()}
                            startIcon={shipping ? <CircularProgress size={12} color="inherit" /> : <LocalShippingIcon sx={{ fontSize: 14 }} />}
                            sx={{ bgcolor: "#FF9900", "&:hover": { bgcolor: "#e88800" } }}>
                            Ship
                        </Button>
                        <Button size="small" onClick={() => { setShipTarget(null); setTracking(""); }}>Cancel</Button>
                    </Stack>
                </Paper>
            )}
            {fetched && !loading && orders.length > 0 && (
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1.5 }}>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: "#f8fafc" }}>
                                <TableCell sx={{ fontWeight: 700 }}>Order ID</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Buyer</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Items</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Total</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {orders.map(o => (
                                <TableRow key={o.AmazonOrderId} hover selected={shipTarget?.AmazonOrderId === o.AmazonOrderId}>
                                    <TableCell><Typography variant="body2" fontWeight={500}>{o.AmazonOrderId}</Typography></TableCell>
                                    <TableCell><Typography variant="body2">{o.BuyerInfo?.BuyerName ?? "—"}</Typography></TableCell>
                                    <TableCell><Typography variant="body2">{(o.orderItems ?? []).length}</Typography></TableCell>
                                    <TableCell>
                                        <Typography variant="body2">
                                            {o.OrderTotal ? `${o.OrderTotal.CurrencyCode} ${o.OrderTotal.Amount}` : "—"}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="caption" color="text.secondary">
                                            {o.PurchaseDate ? new Date(o.PurchaseDate).toLocaleDateString() : "—"}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Button size="small" variant="outlined"
                                            startIcon={<LocalShippingIcon sx={{ fontSize: 14 }} />}
                                            onClick={() => { setShipTarget(o); setTracking(""); }}
                                            sx={{ borderColor: "#FF9900", color: "#FF9900" }}>
                                            Ship
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
            {fetched && !loading && orders.length === 0 && !error && (
                <Typography variant="body2" color="text.secondary">No unshipped orders found.</Typography>
            )}
        </Box>
    );
}

// ─── Mirakl Orders Panel ─────────────────────────────────────────────────────
const MIRAKL_CARRIERS = ["USPS", "UPS", "FedEx", "DHL", "OnTrac", "LSO", "Other"];

function MiraklOrdersPanel({ connectionId }) {
    const [orders, setOrders]         = useState([]);
    const [loading, setLoading]       = useState(false);
    const [error, setError]           = useState("");
    const [fetched, setFetched]       = useState(false);
    const [shipTarget, setShipTarget] = useState(null);
    const [carrier, setCarrier]       = useState("USPS");
    const [tracking, setTracking]     = useState("");
    const [shipping, setShipping]     = useState(false);
    const [accepting, setAccepting]   = useState(null);

    const pull = useCallback(async () => {
        setLoading(true); setError(""); setFetched(true);
        try {
            const params = new URLSearchParams({ connectionId, orderStates: "WAITING_ACCEPTANCE,WAITING_DEBIT,WAITING_DEBIT_PAYMENT,SHIPPING", max: 100 });
            const res = await axios.get(`/api/integrations/mirakl/orders?${params}`);
            setOrders((res.data.orders ?? []).sort((a, b) => new Date(b.created_date ?? 0) - new Date(a.created_date ?? 0)));
        } catch (e) {
            const d = e.response?.data;
            setError(typeof d?.error === "string" ? d.error : JSON.stringify(d) ?? "Failed to pull orders");
        } finally { setLoading(false); }
    }, [connectionId]);

    const accept = async (orderId) => {
        setAccepting(orderId);
        try {
            await axios.post("/api/integrations/mirakl/orders", { connectionId, orderId, action: "accept" });
            setOrders(prev => prev.map(o => o.order_id === orderId
                ? { ...o, order_state: { ...o.order_state, state: "WAITING_DEBIT" } }
                : o));
        } catch (e) {
            setError(e.response?.data?.error ?? "Accept failed");
        } finally { setAccepting(null); }
    };

    const ship = async () => {
        if (!tracking.trim() || !shipTarget) return;
        setShipping(true);
        try {
            await axios.post("/api/integrations/mirakl/orders", {
                connectionId,
                orderId: shipTarget.order_id,
                action: "ship",
                carrier,
                trackingNumber: tracking.trim(),
            });
            setOrders(prev => prev.filter(o => o.order_id !== shipTarget.order_id));
            setShipTarget(null); setTracking("");
        } catch (e) {
            setError(e.response?.data?.error ?? "Ship failed");
        } finally { setShipping(false); }
    };

    return (
        <Box sx={{ px: 2.5, pb: 2 }}>
            <Divider sx={{ mb: 2 }} />
            <Stack direction="row" alignItems="center" spacing={2} mb={1.5}>
                <Typography variant="body2" fontWeight={600} color="text.secondary">Open Orders</Typography>
                <Button size="small" variant="outlined"
                    startIcon={loading ? <CircularProgress size={12} /> : <SyncIcon sx={{ fontSize: 14 }} />}
                    onClick={pull} disabled={loading}>
                    {fetched ? "Refresh" : "Pull Now"}
                </Button>
                {fetched && !loading && (
                    <Chip label={`${orders.length} order${orders.length !== 1 ? "s" : ""}`} size="small"
                        sx={{ bgcolor: orders.length > 0 ? "#fef3c7" : "#d1fae5", color: orders.length > 0 ? "#92400e" : "#065f46", fontWeight: 600 }} />
                )}
            </Stack>
            {error && <Alert severity="error" sx={{ mb: 1.5 }} onClose={() => setError("")}>{error}</Alert>}
            {shipTarget && (
                <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 1.5, bgcolor: "#eff6ff" }}>
                    <Typography variant="body2" fontWeight={600} mb={1}>
                        Ship Order {shipTarget.order_id}
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <Select size="small" value={carrier} onChange={e => setCarrier(e.target.value)} sx={{ minWidth: 110 }}>
                            {MIRAKL_CARRIERS.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                        </Select>
                        <TextField size="small" label="Tracking Number" value={tracking}
                            onChange={e => setTracking(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && ship()} sx={{ flexGrow: 1 }} />
                        <Button variant="contained" size="small" onClick={ship} disabled={shipping || !tracking.trim()}
                            startIcon={shipping ? <CircularProgress size={12} color="inherit" /> : <LocalShippingIcon sx={{ fontSize: 14 }} />}
                            sx={{ bgcolor: "#1d4ed8", "&:hover": { bgcolor: "#1e40af" } }}>
                            Ship
                        </Button>
                        <Button size="small" onClick={() => { setShipTarget(null); setTracking(""); }}>Cancel</Button>
                    </Stack>
                </Paper>
            )}
            {fetched && !loading && orders.length > 0 && (
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1.5 }}>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: "#f8fafc" }}>
                                <TableCell sx={{ fontWeight: 700 }}>Order ID</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>State</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Items</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {orders.map(o => {
                                const state = o.order_state?.state;
                                return (
                                    <TableRow key={o.order_id} hover selected={shipTarget?.order_id === o.order_id}>
                                        <TableCell><Typography variant="body2" fontWeight={500}>{o.order_id}</Typography></TableCell>
                                        <TableCell>
                                            <Chip label={state ?? "—"} size="small"
                                                sx={{ bgcolor: state === "WAITING_ACCEPTANCE" ? "#e0e7ff" : "#dbeafe", color: state === "WAITING_ACCEPTANCE" ? "#4338ca" : "#1e40af", fontWeight: 600, fontSize: "0.7rem" }} />
                                        </TableCell>
                                        <TableCell><Typography variant="body2">{(o.order_lines ?? []).length}</Typography></TableCell>
                                        <TableCell>
                                            <Typography variant="caption" color="text.secondary">
                                                {o.created_date ? new Date(o.created_date).toLocaleDateString() : "—"}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Stack direction="row" spacing={0.5}>
                                                {state === "WAITING_ACCEPTANCE" && (
                                                    <Button size="small" variant="outlined" color="success"
                                                        startIcon={accepting === o.order_id ? <CircularProgress size={12} /> : <CheckCircleOutlineIcon sx={{ fontSize: 14 }} />}
                                                        disabled={accepting === o.order_id}
                                                        onClick={() => accept(o.order_id)}>
                                                        Accept
                                                    </Button>
                                                )}
                                                {(state === "WAITING_DEBIT" || state === "WAITING_DEBIT_PAYMENT" || state === "SHIPPING") && (
                                                    <Button size="small" variant="outlined"
                                                        startIcon={<LocalShippingIcon sx={{ fontSize: 14 }} />}
                                                        onClick={() => { setShipTarget(o); setTracking(""); }}
                                                        sx={{ borderColor: "#1d4ed8", color: "#1d4ed8" }}>
                                                        Ship
                                                    </Button>
                                                )}
                                            </Stack>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
            {fetched && !loading && orders.length === 0 && !error && (
                <Typography variant="body2" color="text.secondary">No open orders found.</Typography>
            )}
        </Box>
    );
}

// ─── Target Orders Panel ─────────────────────────────────────────────────────
const TARGET_SHIPPING_METHODS = [
    "UPSGround", "UPSNextDayAir", "UPS2ndDayAir",
    "FedExGround", "FedExExpressSaver", "FedExPriorityOvernight",
    "USPSPriorityMail", "USPSFirstClassMail", "USPSParcelSelect",
];

function TargetOrdersPanel({ connectionId }) {
    const [orders, setOrders]         = useState([]);
    const [loading, setLoading]       = useState(false);
    const [error, setError]           = useState("");
    const [fetched, setFetched]       = useState(false);
    const [acking, setAcking]         = useState(null);
    const [shipTarget, setShipTarget] = useState(null);
    const [shippingMethod, setShippingMethod] = useState("UPSGround");
    const [tracking, setTracking]     = useState("");
    const [shipping, setShipping]     = useState(false);

    const pull = useCallback(async () => {
        setLoading(true); setError(""); setFetched(true);
        try {
            const res = await axios.get(`/api/integrations/target/orders?connectionId=${connectionId}`);
            setOrders(res.data.orders ?? []);
        } catch (e) {
            setError(e.response?.data?.error ?? "Failed to pull orders");
        } finally { setLoading(false); }
    }, [connectionId]);

    const acknowledge = async (orderId) => {
        setAcking(orderId);
        try {
            await axios.post("/api/integrations/target/orders", { connectionId, orderId, action: "acknowledge" });
            setOrders(prev => prev.map(o => o.id === orderId
                ? { ...o, status: "ACKNOWLEDGED_BY_SELLER" }
                : o));
        } catch (e) {
            setError(e.response?.data?.error ?? "Acknowledge failed");
        } finally { setAcking(null); }
    };

    const ship = async () => {
        if (!tracking.trim() || !shipTarget) return;
        setShipping(true);
        try {
            await axios.post("/api/integrations/target/orders", {
                connectionId,
                orderId:        shipTarget.id,
                action:         "ship",
                trackingNumber: tracking.trim(),
                shippingMethod,
                items: (shipTarget.order_lines ?? []).map(l => ({
                    order_line_number: l.order_line_number,
                    quantity:          l.quantity ?? 1,
                })),
            });
            setOrders(prev => prev.filter(o => o.id !== shipTarget.id));
            setShipTarget(null); setTracking("");
        } catch (e) {
            setError(e.response?.data?.error ?? "Ship failed");
        } finally { setShipping(false); }
    };

    return (
        <Box sx={{ px: 2.5, pb: 2 }}>
            <Divider sx={{ mb: 2 }} />
            <Stack direction="row" alignItems="center" spacing={2} mb={1.5}>
                <Typography variant="body2" fontWeight={600} color="text.secondary">Open Orders</Typography>
                <Button size="small" variant="outlined"
                    startIcon={loading ? <CircularProgress size={12} /> : <SyncIcon sx={{ fontSize: 14 }} />}
                    onClick={pull} disabled={loading}>
                    {fetched ? "Refresh" : "Pull Now"}
                </Button>
                {fetched && !loading && (
                    <Chip label={`${orders.length} order${orders.length !== 1 ? "s" : ""}`} size="small"
                        sx={{ bgcolor: orders.length > 0 ? "#fef3c7" : "#d1fae5", color: orders.length > 0 ? "#92400e" : "#065f46", fontWeight: 600 }} />
                )}
            </Stack>
            {error && <Alert severity="error" sx={{ mb: 1.5 }} onClose={() => setError("")}>{error}</Alert>}
            {shipTarget && (
                <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 1.5, bgcolor: "#fff5f5" }}>
                    <Typography variant="body2" fontWeight={600} mb={1}>
                        Ship Order {shipTarget.order_number} ({(shipTarget.order_lines ?? []).length} line{(shipTarget.order_lines ?? []).length !== 1 ? "s" : ""})
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                        <Select size="small" value={shippingMethod} onChange={e => setShippingMethod(e.target.value)} sx={{ minWidth: 160 }}>
                            {TARGET_SHIPPING_METHODS.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
                        </Select>
                        <TextField size="small" label="Tracking Number" value={tracking}
                            onChange={e => setTracking(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && ship()} sx={{ flexGrow: 1, minWidth: 160 }} />
                        <Button variant="contained" size="small" onClick={ship} disabled={shipping || !tracking.trim()}
                            startIcon={shipping ? <CircularProgress size={12} color="inherit" /> : <LocalShippingIcon sx={{ fontSize: 14 }} />}
                            sx={{ bgcolor: "#CC0000", "&:hover": { bgcolor: "#aa0000" } }}>
                            Ship
                        </Button>
                        <Button size="small" onClick={() => { setShipTarget(null); setTracking(""); }}>Cancel</Button>
                    </Stack>
                </Paper>
            )}
            {fetched && !loading && orders.length > 0 && (
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1.5 }}>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: "#f8fafc" }}>
                                <TableCell sx={{ fontWeight: 700 }}>Order #</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Lines</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Ship By</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {orders.map(o => (
                                <TableRow key={o.id} hover selected={shipTarget?.id === o.id}>
                                    <TableCell><Typography variant="body2" fontWeight={500}>{o.order_number ?? o.id}</Typography></TableCell>
                                    <TableCell>
                                        <Chip label={o.status ?? "—"} size="small"
                                            sx={{
                                                bgcolor: o.status === "RELEASED_FOR_SHIPMENT" ? "#fef3c7" : "#dbeafe",
                                                color:   o.status === "RELEASED_FOR_SHIPMENT" ? "#92400e" : "#1e40af",
                                                fontWeight: 600, fontSize: "0.7rem",
                                            }} />
                                    </TableCell>
                                    <TableCell><Typography variant="body2">{(o.order_lines ?? []).length}</Typography></TableCell>
                                    <TableCell>
                                        <Typography variant="caption" color="text.secondary">
                                            {o.requested_shipment_date ? new Date(o.requested_shipment_date).toLocaleDateString() : "—"}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Stack direction="row" spacing={0.5}>
                                            {o.status === "RELEASED_FOR_SHIPMENT" && (
                                                <Button size="small" variant="outlined" color="success"
                                                    startIcon={acking === o.id ? <CircularProgress size={12} /> : <CheckCircleOutlineIcon sx={{ fontSize: 14 }} />}
                                                    disabled={acking === o.id}
                                                    onClick={() => acknowledge(o.id)}>
                                                    Ack
                                                </Button>
                                            )}
                                            {o.status === "ACKNOWLEDGED_BY_SELLER" && (
                                                <Button size="small" variant="outlined"
                                                    startIcon={<LocalShippingIcon sx={{ fontSize: 14 }} />}
                                                    onClick={() => { setShipTarget(o); setTracking(""); }}
                                                    sx={{ borderColor: "#CC0000", color: "#CC0000" }}>
                                                    Ship
                                                </Button>
                                            )}
                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
            {fetched && !loading && orders.length === 0 && !error && (
                <Typography variant="body2" color="text.secondary">No open orders found.</Typography>
            )}
        </Box>
    );
}

// ─── eBay Orders Panel ────────────────────────────────────────────────────────
const EBAY_CARRIERS = ["USPS", "UPS", "FedEx", "DHL", "OnTrac", "Other"];

function EbayOrdersPanel({ connectionId }) {
    const [orders, setOrders]         = useState([]);
    const [loading, setLoading]       = useState(false);
    const [error, setError]           = useState("");
    const [fetched, setFetched]       = useState(false);
    const [shipTarget, setShipTarget] = useState(null);
    const [carrier, setCarrier]       = useState("USPS");
    const [tracking, setTracking]     = useState("");
    const [shipping, setShipping]     = useState(false);

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
        if (!tracking.trim() || !shipTarget) return;
        setShipping(true);
        try {
            const lineItemIds = (shipTarget.lineItems ?? []).map(l => l.lineItemId);
            await axios.post("/api/integrations/ebay/orders", {
                connectionId,
                orderId: shipTarget.orderId,
                trackingNumber: tracking.trim(),
                carrier,
                lineItemIds,
            });
            setOrders(prev => prev.filter(o => o.orderId !== shipTarget.orderId));
            setShipTarget(null); setTracking("");
        } catch (e) {
            setError(e.response?.data?.error ?? "Ship failed");
        } finally { setShipping(false); }
    };

    return (
        <Box sx={{ px: 2.5, pb: 2 }}>
            <Divider sx={{ mb: 2 }} />
            <Stack direction="row" alignItems="center" spacing={2} mb={1.5}>
                <Typography variant="body2" fontWeight={600} color="text.secondary">Awaiting Fulfillment</Typography>
                <Button size="small" variant="outlined"
                    startIcon={loading ? <CircularProgress size={12} /> : <SyncIcon sx={{ fontSize: 14 }} />}
                    onClick={pull} disabled={loading}>
                    {fetched ? "Refresh" : "Pull Now"}
                </Button>
                {fetched && !loading && (
                    <Chip label={`${orders.length} order${orders.length !== 1 ? "s" : ""}`} size="small"
                        sx={{ bgcolor: orders.length > 0 ? "#fef3c7" : "#d1fae5", color: orders.length > 0 ? "#92400e" : "#065f46", fontWeight: 600 }} />
                )}
            </Stack>
            {error && <Alert severity="error" sx={{ mb: 1.5 }} onClose={() => setError("")}>{error}</Alert>}
            {shipTarget && (
                <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 1.5, bgcolor: "#fff8f0" }}>
                    <Typography variant="body2" fontWeight={600} mb={1}>
                        Ship Order {shipTarget.orderId}
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <Select size="small" value={carrier} onChange={e => setCarrier(e.target.value)} sx={{ minWidth: 110 }}>
                            {EBAY_CARRIERS.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                        </Select>
                        <TextField size="small" label="Tracking Number" value={tracking}
                            onChange={e => setTracking(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && ship()} sx={{ flexGrow: 1 }} />
                        <Button variant="contained" size="small" onClick={ship} disabled={shipping || !tracking.trim()}
                            startIcon={shipping ? <CircularProgress size={12} color="inherit" /> : <LocalShippingIcon sx={{ fontSize: 14 }} />}
                            sx={{ bgcolor: "#E53238", "&:hover": { bgcolor: "#c0282d" } }}>
                            Ship
                        </Button>
                        <Button size="small" onClick={() => { setShipTarget(null); setTracking(""); }}>Cancel</Button>
                    </Stack>
                </Paper>
            )}
            {fetched && !loading && orders.length > 0 && (
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1.5 }}>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: "#f8fafc" }}>
                                <TableCell sx={{ fontWeight: 700 }}>Order ID</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Buyer</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Items</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {orders.map(o => (
                                <TableRow key={o.orderId} hover selected={shipTarget?.orderId === o.orderId}>
                                    <TableCell><Typography variant="body2" fontWeight={500}>{o.orderId}</Typography></TableCell>
                                    <TableCell><Typography variant="body2">{o.buyer?.username ?? "—"}</Typography></TableCell>
                                    <TableCell><Typography variant="body2">{(o.lineItems ?? []).length}</Typography></TableCell>
                                    <TableCell>
                                        <Typography variant="caption" color="text.secondary">
                                            {o.creationDate ? new Date(o.creationDate).toLocaleDateString() : "—"}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Button size="small" variant="outlined"
                                            startIcon={<LocalShippingIcon sx={{ fontSize: 14 }} />}
                                            onClick={() => { setShipTarget(o); setTracking(""); }}
                                            sx={{ borderColor: "#E53238", color: "#E53238" }}>
                                            Ship
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
            {fetched && !loading && orders.length === 0 && !error && (
                <Typography variant="body2" color="text.secondary">No orders awaiting fulfillment.</Typography>
            )}
        </Box>
    );
}

// ─── Noon Orders Panel ────────────────────────────────────────────────────────
const NOON_CARRIERS = ["USPS", "UPS", "FedEx", "DHL", "Aramex", "Other"];

function NoonOrdersPanel({ connectionId }) {
    const [orders, setOrders]         = useState([]);
    const [loading, setLoading]       = useState(false);
    const [error, setError]           = useState("");
    const [fetched, setFetched]       = useState(false);
    const [shipTarget, setShipTarget] = useState(null);
    const [carrier, setCarrier]       = useState("Aramex");
    const [tracking, setTracking]     = useState("");
    const [shipping, setShipping]     = useState(false);

    const pull = useCallback(async () => {
        setLoading(true); setError(""); setFetched(true);
        try {
            const res = await axios.get(`/api/integrations/noon/orders?connectionId=${connectionId}`);
            setOrders(res.data.orders ?? []);
        } catch (e) {
            setError(e.response?.data?.error ?? "Failed to pull orders");
        } finally { setLoading(false); }
    }, [connectionId]);

    const ship = async () => {
        if (!tracking.trim() || !shipTarget) return;
        setShipping(true);
        try {
            await axios.post("/api/integrations/noon/orders", {
                connectionId,
                orderId: shipTarget.id ?? shipTarget.order_id,
                trackingNumber: tracking.trim(),
                carrier,
            });
            const key = shipTarget.id ?? shipTarget.order_id;
            setOrders(prev => prev.filter(o => (o.id ?? o.order_id) !== key));
            setShipTarget(null); setTracking("");
        } catch (e) {
            setError(e.response?.data?.error ?? "Ship failed");
        } finally { setShipping(false); }
    };

    return (
        <Box sx={{ px: 2.5, pb: 2 }}>
            <Divider sx={{ mb: 2 }} />
            <Stack direction="row" alignItems="center" spacing={2} mb={1.5}>
                <Typography variant="body2" fontWeight={600} color="text.secondary">Pending Orders</Typography>
                <Button size="small" variant="outlined"
                    startIcon={loading ? <CircularProgress size={12} /> : <SyncIcon sx={{ fontSize: 14 }} />}
                    onClick={pull} disabled={loading}>
                    {fetched ? "Refresh" : "Pull Now"}
                </Button>
                {fetched && !loading && (
                    <Chip label={`${orders.length} order${orders.length !== 1 ? "s" : ""}`} size="small"
                        sx={{ bgcolor: orders.length > 0 ? "#fef3c7" : "#d1fae5", color: orders.length > 0 ? "#92400e" : "#065f46", fontWeight: 600 }} />
                )}
            </Stack>
            {error && <Alert severity="error" sx={{ mb: 1.5 }} onClose={() => setError("")}>{error}</Alert>}
            {shipTarget && (
                <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 1.5, bgcolor: "#fdf4e7" }}>
                    <Typography variant="body2" fontWeight={600} mb={1}>
                        Ship Order {shipTarget.id ?? shipTarget.order_id}
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <Select size="small" value={carrier} onChange={e => setCarrier(e.target.value)} sx={{ minWidth: 110 }}>
                            {NOON_CARRIERS.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                        </Select>
                        <TextField size="small" label="Tracking Number" value={tracking}
                            onChange={e => setTracking(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && ship()} sx={{ flexGrow: 1 }} />
                        <Button variant="contained" size="small" onClick={ship} disabled={shipping || !tracking.trim()}
                            startIcon={shipping ? <CircularProgress size={12} color="inherit" /> : <LocalShippingIcon sx={{ fontSize: 14 }} />}
                            sx={{ bgcolor: "#f59e0b", color: "#111", "&:hover": { bgcolor: "#d97706" } }}>
                            Ship
                        </Button>
                        <Button size="small" onClick={() => { setShipTarget(null); setTracking(""); }}>Cancel</Button>
                    </Stack>
                </Paper>
            )}
            {fetched && !loading && orders.length > 0 && (
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1.5 }}>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: "#f8fafc" }}>
                                <TableCell sx={{ fontWeight: 700 }}>Order ID</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Items</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {orders.map(o => {
                                const key = o.id ?? o.order_id;
                                return (
                                    <TableRow key={key} hover selected={(shipTarget?.id ?? shipTarget?.order_id) === key}>
                                        <TableCell><Typography variant="body2" fontWeight={500}>{key}</Typography></TableCell>
                                        <TableCell>
                                            <Chip label={o.status ?? "—"} size="small"
                                                sx={{ bgcolor: "#fdf4e7", color: "#92400e", fontWeight: 600, fontSize: "0.7rem" }} />
                                        </TableCell>
                                        <TableCell><Typography variant="body2">{(o.items ?? o.order_items ?? []).length}</Typography></TableCell>
                                        <TableCell>
                                            <Typography variant="caption" color="text.secondary">
                                                {o.created_at ? new Date(o.created_at).toLocaleDateString() : "—"}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Button size="small" variant="outlined"
                                                startIcon={<LocalShippingIcon sx={{ fontSize: 14 }} />}
                                                onClick={() => { setShipTarget(o); setTracking(""); }}
                                                sx={{ borderColor: "#f59e0b", color: "#92400e" }}>
                                                Ship
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
            {fetched && !loading && orders.length === 0 && !error && (
                <Typography variant="body2" color="text.secondary">No pending orders found.</Typography>
            )}
        </Box>
    );
}

// ─── Bol Orders Panel ─────────────────────────────────────────────────────────
// transporterCode values are bol.com specific carrier codes
const BOL_CARRIERS = [
    { label: "PostNL",  value: "TNT" },
    { label: "DPD",     value: "DPD-NL" },
    { label: "DHL",     value: "DHL" },
    { label: "UPS",     value: "UPS" },
    { label: "FedEx",   value: "FEDEX-NL" },
    { label: "GLS",     value: "GLS" },
];

function BolOrdersPanel({ connectionId }) {
    const [orders, setOrders]         = useState([]);
    const [loading, setLoading]       = useState(false);
    const [error, setError]           = useState("");
    const [fetched, setFetched]       = useState(false);
    const [shipTarget, setShipTarget] = useState(null);
    const [carrier, setCarrier]       = useState("TNT");
    const [tracking, setTracking]     = useState("");
    const [shipping, setShipping]     = useState(false);

    const pull = useCallback(async () => {
        setLoading(true); setError(""); setFetched(true);
        try {
            const res = await axios.get(`/api/integrations/bol/orders?connectionId=${connectionId}`);
            setOrders(res.data.orders ?? []);
        } catch (e) {
            setError(e.response?.data?.error ?? "Failed to pull orders");
        } finally { setLoading(false); }
    }, [connectionId]);

    const ship = async () => {
        if (!tracking.trim() || !shipTarget) return;
        setShipping(true);
        try {
            // bol. ships ALL items on the order in one shipment; send all orderItemIds
            const orderItems = (shipTarget.orderItems ?? []).map(i => i.orderItemId);
            await axios.post("/api/integrations/bol/orders", {
                connectionId,
                trackingNumber: tracking.trim(),
                transporterCode: carrier,
                orderItems,
            });
            setOrders(prev => prev.filter(o => o.orderId !== shipTarget.orderId));
            setShipTarget(null); setTracking("");
        } catch (e) {
            setError(e.response?.data?.error ?? "Ship failed");
        } finally { setShipping(false); }
    };

    return (
        <Box sx={{ px: 2.5, pb: 2 }}>
            <Divider sx={{ mb: 2 }} />
            <Stack direction="row" alignItems="center" spacing={2} mb={1.5}>
                <Typography variant="body2" fontWeight={600} color="text.secondary">Open Orders (FBR)</Typography>
                <Button size="small" variant="outlined"
                    startIcon={loading ? <CircularProgress size={12} /> : <SyncIcon sx={{ fontSize: 14 }} />}
                    onClick={pull} disabled={loading}>
                    {fetched ? "Refresh" : "Pull Now"}
                </Button>
                {fetched && !loading && (
                    <Chip label={`${orders.length} order${orders.length !== 1 ? "s" : ""}`} size="small"
                        sx={{ bgcolor: orders.length > 0 ? "#fef3c7" : "#d1fae5", color: orders.length > 0 ? "#92400e" : "#065f46", fontWeight: 600 }} />
                )}
            </Stack>
            {error && <Alert severity="error" sx={{ mb: 1.5 }} onClose={() => setError("")}>{error}</Alert>}
            {shipTarget && (
                <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 1.5, bgcolor: "#eff6ff" }}>
                    <Typography variant="body2" fontWeight={600} mb={1}>
                        Ship Order {shipTarget.orderId} — {(shipTarget.orderItems ?? []).length} item{(shipTarget.orderItems ?? []).length !== 1 ? "s" : ""}
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <Select size="small" value={carrier} onChange={e => setCarrier(e.target.value)} sx={{ minWidth: 110 }}>
                            {BOL_CARRIERS.map(c => <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>)}
                        </Select>
                        <TextField size="small" label="Track & Trace" value={tracking}
                            onChange={e => setTracking(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && ship()} sx={{ flexGrow: 1 }} />
                        <Button variant="contained" size="small" onClick={ship} disabled={shipping || !tracking.trim()}
                            startIcon={shipping ? <CircularProgress size={12} color="inherit" /> : <LocalShippingIcon sx={{ fontSize: 14 }} />}
                            sx={{ bgcolor: "#0062B1", "&:hover": { bgcolor: "#00509a" } }}>
                            Ship
                        </Button>
                        <Button size="small" onClick={() => { setShipTarget(null); setTracking(""); }}>Cancel</Button>
                    </Stack>
                </Paper>
            )}
            {fetched && !loading && orders.length > 0 && (
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1.5 }}>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: "#f8fafc" }}>
                                <TableCell sx={{ fontWeight: 700 }}>Order ID</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Items</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {orders.map(o => (
                                <TableRow key={o.orderId} hover selected={shipTarget?.orderId === o.orderId}>
                                    <TableCell><Typography variant="body2" fontWeight={500}>{o.orderId}</Typography></TableCell>
                                    <TableCell><Typography variant="body2">{(o.orderItems ?? []).length}</Typography></TableCell>
                                    <TableCell>
                                        <Typography variant="caption" color="text.secondary">
                                            {o.orderPlacedDateTime ? new Date(o.orderPlacedDateTime).toLocaleDateString() : "—"}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Button size="small" variant="outlined"
                                            startIcon={<LocalShippingIcon sx={{ fontSize: 14 }} />}
                                            onClick={() => { setShipTarget(o); setTracking(""); }}
                                            sx={{ borderColor: "#0062B1", color: "#0062B1" }}>
                                            Ship
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
            {fetched && !loading && orders.length === 0 && !error && (
                <Typography variant="body2" color="text.secondary">No open orders found.</Typography>
            )}
        </Box>
    );
}

// ─── Acenda Dashboard Panel ───────────────────────────────────────────────────
function AcendaDashboardPanel({ connectionId, manageHref }) {
    const [data, setData]       = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get(`/api/integrations/acenda/dashboard?connectionId=${connectionId}`)
            .then(r => setData(r.data))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [connectionId]);

    const stats = [
        { label: "Sales Channels", value: data?.channels?.length ?? 0 },
        { label: "Warehouses",     value: data?.warehouses?.length ?? 0 },
        { label: "Catalog Items",  value: data?.catalog?.length ?? 0 },
        { label: "Inventory SKUs", value: data?.inventoryTotal ?? 0 },
    ];

    return (
        <Box sx={{ px: 2.5, pb: 2, borderTop: "1px solid #f1f5f9" }}>
            <Stack direction="row" alignItems="center" spacing={2} mt={1.5} mb={1.5}>
                <Typography variant="body2" fontWeight={600} color="text.secondary">Acenda Dashboard</Typography>
                {manageHref && (
                    <Button component={Link} href={manageHref} size="small" variant="outlined"
                        sx={{ borderColor: "#1565C0", color: "#1565C0", borderRadius: 1.5, fontSize: "0.72rem" }}>
                        Open Full Dashboard
                    </Button>
                )}
                {loading && <CircularProgress size={14} />}
            </Stack>
            {data && (
                <Stack direction="row" spacing={2} flexWrap="wrap">
                    {stats.map(s => (
                        <Paper key={s.label} variant="outlined" sx={{ px: 2, py: 1, borderRadius: 1.5, textAlign: "center", minWidth: 100 }}>
                            <Typography variant="h6" fontWeight={700} color="#1565C0">{s.value}</Typography>
                            <Typography variant="caption" color="text.secondary">{s.label}</Typography>
                        </Paper>
                    ))}
                </Stack>
            )}
        </Box>
    );
}

// ─── WooCommerce Orders Panel ─────────────────────────────────────────────────
function WooCommerceOrdersPanel({ connectionId }) {
    const [loading, setLoading] = useState(false);
    const [result,  setResult]  = useState(null);
    const [error,   setError]   = useState("");

    const pull = async () => {
        setLoading(true); setError(""); setResult(null);
        try {
            const res = await axios.post(`/api/integrations/woocommerce/orders`, { connectionId });
            setResult(res.data);
        } catch (e) {
            setError(e.response?.data?.msg ?? "Failed to pull orders");
        } finally { setLoading(false); }
    };

    return (
        <Box sx={{ borderTop: "1px solid #f1f5f9", px: 2.5, py: 1.5 }}>
            <Stack direction="row" alignItems="center" spacing={2}>
                <Button variant="outlined" size="small" onClick={pull} disabled={loading}
                    startIcon={loading ? <CircularProgress size={12} color="inherit" /> : null}
                    sx={{ borderColor: "#7f54b3", color: "#7f54b3", borderRadius: 1.5 }}>
                    {loading ? "Pulling…" : "Pull Orders Now"}
                </Button>
                {result && <Typography variant="caption" color="success.main">{result.imported} order(s) imported</Typography>}
                {error  && <Typography variant="caption" color="error">{error}</Typography>}
            </Stack>
        </Box>
    );
}

// ─── Squarespace Orders Panel ─────────────────────────────────────────────────
function SquarespaceOrdersPanel({ connectionId }) {
    const [loading, setLoading] = useState(false);
    const [result,  setResult]  = useState(null);
    const [error,   setError]   = useState("");

    const pull = async () => {
        setLoading(true); setError(""); setResult(null);
        try {
            const res = await axios.post(`/api/integrations/squarespace/orders`, { connectionId });
            setResult(res.data);
        } catch (e) {
            setError(e.response?.data?.msg ?? "Failed to pull orders");
        } finally { setLoading(false); }
    };

    return (
        <Box sx={{ borderTop: "1px solid #f1f5f9", px: 2.5, py: 1.5 }}>
            <Stack direction="row" alignItems="center" spacing={2}>
                <Button variant="outlined" size="small" onClick={pull} disabled={loading}
                    startIcon={loading ? <CircularProgress size={12} color="inherit" /> : null}
                    sx={{ borderColor: "#111827", color: "#111827", borderRadius: 1.5 }}>
                    {loading ? "Pulling…" : "Pull Orders Now"}
                </Button>
                {result && <Typography variant="caption" color="success.main">{result.imported} order(s) imported</Typography>}
                {error  && <Typography variant="caption" color="error">{error}</Typography>}
            </Stack>
        </Box>
    );
}

// ─── Meta Orders Panel ────────────────────────────────────────────────────────
function MetaOrdersPanel({ connectionId }) {
    const [loading, setLoading] = useState(false);
    const [result,  setResult]  = useState(null);
    const [error,   setError]   = useState("");
    const pull = async () => {
        setLoading(true); setError(""); setResult(null);
        try {
            const res = await axios.post(`/api/integrations/meta/orders`, { connectionId });
            setResult(res.data);
        } catch (e) { setError(e.response?.data?.msg ?? "Failed to pull orders"); }
        finally { setLoading(false); }
    };
    return (
        <Box sx={{ borderTop: "1px solid #f1f5f9", px: 2.5, py: 1.5 }}>
            <Stack direction="row" alignItems="center" spacing={2}>
                <Button variant="outlined" size="small" onClick={pull} disabled={loading}
                    startIcon={loading ? <CircularProgress size={12} color="inherit" /> : null}
                    sx={{ borderColor: "#0866FF", color: "#0866FF", borderRadius: 1.5 }}>
                    {loading ? "Pulling…" : "Pull Orders Now"}
                </Button>
                {result && <Typography variant="caption" color="success.main">{result.imported} order(s) imported</Typography>}
                {error  && <Typography variant="caption" color="error">{error}</Typography>}
            </Stack>
        </Box>
    );
}

// ─── OnBuy Orders Panel ───────────────────────────────────────────────────────
function OnBuyOrdersPanel({ connectionId }) {
    const [loading, setLoading] = useState(false);
    const [result,  setResult]  = useState(null);
    const [error,   setError]   = useState("");
    const pull = async () => {
        setLoading(true); setError(""); setResult(null);
        try {
            const res = await axios.post(`/api/integrations/onbuy/orders`, { connectionId });
            setResult(res.data);
        } catch (e) { setError(e.response?.data?.msg ?? "Failed to pull orders"); }
        finally { setLoading(false); }
    };
    return (
        <Box sx={{ borderTop: "1px solid #f1f5f9", px: 2.5, py: 1.5 }}>
            <Stack direction="row" alignItems="center" spacing={2}>
                <Button variant="outlined" size="small" onClick={pull} disabled={loading}
                    startIcon={loading ? <CircularProgress size={12} color="inherit" /> : null}
                    sx={{ borderColor: "#5D11D4", color: "#5D11D4", borderRadius: 1.5 }}>
                    {loading ? "Pulling…" : "Pull Orders Now"}
                </Button>
                {result && <Typography variant="caption" color="success.main">{result.imported} order(s) imported</Typography>}
                {error  && <Typography variant="caption" color="error">{error}</Typography>}
            </Stack>
        </Box>
    );
}

// ─── Rakuten Orders Panel ─────────────────────────────────────────────────────
function RakutenOrdersPanel({ connectionId }) {
    const [loading, setLoading] = useState(false);
    const [result,  setResult]  = useState(null);
    const [error,   setError]   = useState("");
    const pull = async () => {
        setLoading(true); setError(""); setResult(null);
        try {
            const res = await axios.post(`/api/integrations/rakuten/orders`, { connectionId });
            setResult(res.data);
        } catch (e) { setError(e.response?.data?.msg ?? "Failed to pull orders"); }
        finally { setLoading(false); }
    };
    return (
        <Box sx={{ borderTop: "1px solid #f1f5f9", px: 2.5, py: 1.5 }}>
            <Stack direction="row" alignItems="center" spacing={2}>
                <Button variant="outlined" size="small" onClick={pull} disabled={loading}
                    startIcon={loading ? <CircularProgress size={12} color="inherit" /> : null}
                    sx={{ borderColor: "#BF0000", color: "#BF0000", borderRadius: 1.5 }}>
                    {loading ? "Pulling…" : "Pull Orders Now"}
                </Button>
                {result && <Typography variant="caption" color="success.main">{result.imported} order(s) imported</Typography>}
                {error  && <Typography variant="caption" color="error">{error}</Typography>}
            </Stack>
        </Box>
    );
}

// ─── Wayfair Orders Panel ─────────────────────────────────────────────────────
function WayfairOrdersPanel({ connectionId }) {
    const [loading, setLoading] = useState(false);
    const [result,  setResult]  = useState(null);
    const [error,   setError]   = useState("");
    const pull = async () => {
        setLoading(true); setError(""); setResult(null);
        try {
            const res = await axios.post(`/api/integrations/wayfair/orders`, { connectionId });
            setResult(res.data);
        } catch (e) { setError(e.response?.data?.msg ?? "Failed to pull orders"); }
        finally { setLoading(false); }
    };
    return (
        <Box sx={{ borderTop: "1px solid #f1f5f9", px: 2.5, py: 1.5 }}>
            <Stack direction="row" alignItems="center" spacing={2}>
                <Button variant="outlined" size="small" onClick={pull} disabled={loading}
                    startIcon={loading ? <CircularProgress size={12} color="inherit" /> : null}
                    sx={{ borderColor: "#7B2D8B", color: "#7B2D8B", borderRadius: 1.5 }}>
                    {loading ? "Pulling…" : "Pull Purchase Orders Now"}
                </Button>
                {result && <Typography variant="caption" color="success.main">{result.imported} order(s) imported</Typography>}
                {error  && <Typography variant="caption" color="error">{error}</Typography>}
            </Stack>
        </Box>
    );
}

// ─── Wix Orders Panel ─────────────────────────────────────────────────────────
function WixOrdersPanel({ connectionId }) {
    const [loading, setLoading] = useState(false);
    const [result,  setResult]  = useState(null);
    const [error,   setError]   = useState("");

    const pull = async () => {
        setLoading(true); setError(""); setResult(null);
        try {
            const res = await axios.post(`/api/integrations/wix/orders`, { connectionId });
            setResult(res.data);
        } catch (e) {
            setError(e.response?.data?.msg ?? "Failed to pull orders");
        } finally { setLoading(false); }
    };

    return (
        <Box sx={{ borderTop: "1px solid #f1f5f9", px: 2.5, py: 1.5 }}>
            <Stack direction="row" alignItems="center" spacing={2}>
                <Button variant="outlined" size="small" onClick={pull} disabled={loading}
                    startIcon={loading ? <CircularProgress size={12} color="inherit" /> : null}
                    sx={{ borderColor: "#0C6EFC", color: "#0C6EFC", borderRadius: 1.5 }}>
                    {loading ? "Pulling…" : "Pull Orders Now"}
                </Button>
                {result && <Typography variant="caption" color="success.main">{result.imported} order(s) imported</Typography>}
                {error  && <Typography variant="caption" color="error">{error}</Typography>}
            </Stack>
        </Box>
    );
}

// ─── Connection row ────────────────────────────────────────────────────────────
function ConnectionCard({ name, type, apiKey, organization, id, manageHref, pullOrdersEnabled: initialPullEnabled, onDeactivate }) {
    const normalizedType = type?.toLowerCase() ?? "";
    const isShopify = normalizedType === "shopify" || name?.startsWith("shopify-");
    const cfg   = isShopify ? PLATFORMS.shopify : (PLATFORMS[normalizedType] ?? {});
    const label = cfg.label ?? type ?? "Unknown";
    const color = cfg.color ?? "#6b7280";
    const displayLabel = isShopify ? name.replace(/^shopify-/, "") : name;
    const isAmazon  = normalizedType === "amazon";
    const isMirakl  = normalizedType === "mirakl";
    const isTarget  = normalizedType === "target";
    const isAcenda  = !isShopify && !isAmazon && !isMirakl && !isTarget && (normalizedType === "acenda" ||
        (!normalizedType && !!organization && !["walmart","faire","tiktok","etsy","shein","temu","amazon","mirakl","target"].includes(normalizedType)));
    const isEtsy    = normalizedType === "etsy";
    const isWalmart = normalizedType === "walmart";
    const isFaire   = normalizedType === "faire";
    const isShein   = normalizedType === "shein";
    const isTemu    = normalizedType === "temu";
    const isEbay    = normalizedType === "ebay";
    const isNoon    = normalizedType === "noon";
    const isBol     = normalizedType === "bol";
    const isWix         = normalizedType === "wix";
    const isWooCommerce = normalizedType === "woocommerce";
    const isSquarespace = normalizedType === "squarespace";
    const isMeta        = normalizedType === "meta";
    const isPinterest   = normalizedType === "pinterest";
    const isOnBuy       = normalizedType === "onbuy";
    const isRakuten     = normalizedType === "rakuten";
    const isWayfair     = normalizedType === "wayfair";
    const isRithum      = normalizedType === "rithum";

    const [pullEnabled, setPullEnabled] = useState(!!initialPullEnabled);
    const [toggling, setToggling]       = useState(false);
    const [confirming, setConfirming]   = useState(false);
    const [deactivating, setDeactivating] = useState(false);

    const maskedKey = apiKey
        ? `${"•".repeat(8)}${apiKey.slice(-4)}`
        : "—";

    const deactivate = async () => {
        setDeactivating(true);
        try {
            await axios.delete(`/api/admin/integrations?connectionId=${id}`);
            onDeactivate?.(id);
        } catch (e) {
            console.error("Deactivate failed", e);
            setDeactivating(false);
            setConfirming(false);
        }
    };

    const togglePullOrders = async (checked) => {
        setToggling(true);
        try {
            await axios.patch("/api/admin/integrations/settings", {
                connectionId: id,
                field: "pullOrdersEnabled",
                value: checked,
            });
            setPullEnabled(checked);
        } catch (e) {
            console.error("Toggle failed", e);
        } finally { setToggling(false); }
    };

    return (
        <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden", border: "1px solid #e5e7eb" }}>
            <Box sx={{ display: "flex", alignItems: "stretch" }}>
                <Box sx={{ width: 6, bgcolor: color, flexShrink: 0 }} />
                <Box sx={{ flexGrow: 1 }}>
                    {/* ── Main row ── */}
                    <Box sx={{
                        display: "flex", flexDirection: { xs: "column", sm: "row" },
                        alignItems: { sm: "center" }, justifyContent: "space-between",
                        px: 2.5, py: 2, gap: 2,
                    }}>
                        <Stack direction="row" alignItems="center" spacing={2}>
                            <Avatar sx={{ bgcolor: color, width: 38, height: 38, fontSize: "0.75rem", fontWeight: 700 }}>
                                {label.slice(0, 2).toUpperCase()}
                            </Avatar>
                            <Box>
                                <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
                                    <Typography fontWeight={700} fontSize="0.95rem">{displayLabel}</Typography>
                                    <Chip label={label} size="small"
                                        sx={{ bgcolor: `${color}18`, color, fontWeight: 600, fontSize: "0.7rem", border: "none" }} />
                                    <Chip label="Active" size="small"
                                        sx={{ bgcolor: "#d1fae5", color: "#065f46", fontWeight: 600, fontSize: "0.7rem", border: "none" }} />
                                </Stack>
                                <Typography variant="caption" color="text.secondary" sx={{ fontFamily: "monospace" }}>
                                    API Key: {maskedKey}
                                    {organization && <> &nbsp;·&nbsp; Org: {organization}</>}
                                </Typography>
                            </Box>
                        </Stack>

                        <Stack direction="row" alignItems="center" spacing={1.5} flexShrink={0} flexWrap="wrap">
                            {manageHref && !confirming && (
                                <Button
                                    component={Link} href={manageHref}
                                    variant="contained" size="small"
                                    endIcon={<OpenInNewIcon sx={{ fontSize: 14 }} />}
                                    sx={{ bgcolor: color, "&:hover": { bgcolor: color, filter: "brightness(0.88)" }, borderRadius: 1.5 }}
                                >
                                    Manage
                                </Button>
                            )}
                            {confirming ? (
                                <>
                                    <Typography variant="caption" color="error" fontWeight={600}>Remove this connection?</Typography>
                                    <Button size="small" variant="contained" color="error" onClick={deactivate}
                                        disabled={deactivating} sx={{ borderRadius: 1.5 }}
                                        startIcon={deactivating ? <CircularProgress size={12} color="inherit" /> : null}>
                                        Confirm
                                    </Button>
                                    <Button size="small" onClick={() => setConfirming(false)} disabled={deactivating} sx={{ borderRadius: 1.5 }}>
                                        Cancel
                                    </Button>
                                </>
                            ) : (
                                <Button variant="outlined" size="small" color="error" sx={{ borderRadius: 1.5 }}
                                    onClick={() => setConfirming(true)}>
                                    Deactivate
                                </Button>
                            )}
                        </Stack>
                    </Box>

                    {/* ── Pull Orders toggle strip ── */}
                    {(isAcenda || isEtsy || isWalmart || isFaire || isShein || isTemu || isAmazon || isMirakl || isTarget || isEbay || isNoon || isBol || isWix || isWooCommerce || isSquarespace || isMeta || isOnBuy || isRakuten || isWayfair || isRithum) && (() => {
                        const accentColor  = isEtsy ? "#F56400" : isWalmart ? "#0071CE" : isFaire ? "#10305A" : isShein ? "#000000" : isTemu ? "#ff6500" : isAmazon ? "#FF9900" : isMirakl ? "#1d4ed8" : isTarget ? "#CC0000" : isEbay ? "#E53238" : isNoon ? "#f59e0b" : isBol ? "#0062B1" : isWix ? "#0C6EFC" : isWooCommerce ? "#7f54b3" : isSquarespace ? "#111827" : isMeta ? "#0866FF" : isOnBuy ? "#5D11D4" : isRakuten ? "#BF0000" : isWayfair ? "#7B2D8B" : isRithum ? "#1a1a2e" : "#1565C0";
                        const bgEnabled    = isEtsy ? "#fff7ed" : isWalmart ? "#e0f2fe" : isFaire ? "#eef2f8" : isShein ? "#f3f4f6" : isTemu ? "#fff5ee" : isAmazon ? "#fff8f0" : isMirakl ? "#eff6ff" : isTarget ? "#fff5f5" : isEbay ? "#fff8f0" : isNoon ? "#fdf4e7" : isBol ? "#eff6ff" : isWix ? "#eef4ff" : isWooCommerce ? "#f5f0ff" : isSquarespace ? "#f3f4f6" : isMeta ? "#eff6ff" : isOnBuy ? "#f5f3ff" : isRakuten ? "#fff5f5" : isWayfair ? "#faf5ff" : isRithum ? "#f0f0f8" : "#eff6ff";
                        const platformName = isEtsy ? "Etsy" : isWalmart ? "Walmart" : isFaire ? "Faire" : isShein ? "SHEIN" : isTemu ? "Temu" : isAmazon ? "Amazon" : isMirakl ? "Mirakl" : isTarget ? "Target Plus" : isEbay ? "eBay" : isNoon ? "Noon" : isBol ? "bol.com" : isWix ? "Wix" : isWooCommerce ? "WooCommerce" : isSquarespace ? "Squarespace" : isMeta ? "Meta Shops" : isOnBuy ? "OnBuy" : isRakuten ? "Rakuten" : isWayfair ? "Wayfair" : isRithum ? "Rithum" : "Acenda";
                        return (
                            <Box sx={{
                                borderTop: "1px solid #f1f5f9",
                                bgcolor: pullEnabled ? bgEnabled : "#f8fafc",
                                px: 2.5, py: 1.25,
                                display: "flex", alignItems: "center", gap: 2,
                            }}>
                                <Switch
                                    checked={pullEnabled}
                                    onChange={e => togglePullOrders(e.target.checked)}
                                    disabled={toggling}
                                    size="small"
                                    sx={{
                                        "& .MuiSwitch-switchBase.Mui-checked": { color: accentColor },
                                        "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { bgcolor: accentColor },
                                    }}
                                />
                                <Box>
                                    <Typography variant="body2" fontWeight={600} color={pullEnabled ? accentColor : "text.secondary"}>
                                        Pull Orders {toggling && <CircularProgress size={10} sx={{ ml: 0.5 }} />}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {pullEnabled ? `Pulling open orders from ${platformName}` : `Enable to pull orders from ${platformName}`}
                                    </Typography>
                                </Box>
                            </Box>
                        );
                    })()}

                    {/* ── Acenda dashboard always-visible panel ── */}
                    {isAcenda && <AcendaDashboardPanel connectionId={id} manageHref={manageHref} />}

                    {/* ── Orders panels (expand when enabled) ── */}
                    {isAcenda && (
                        <Collapse in={pullEnabled}>
                            <AcendaOrdersPanel connectionId={id} />
                        </Collapse>
                    )}
                    {isEtsy && (
                        <Collapse in={pullEnabled}>
                            <EtsyOrdersPanel connectionId={id} />
                        </Collapse>
                    )}
                    {isWalmart && (
                        <Collapse in={pullEnabled}>
                            <WalmartOrdersPanel connectionId={id} />
                        </Collapse>
                    )}
                    {isFaire && (
                        <Collapse in={pullEnabled}>
                            <FaireOrdersPanel connectionId={id} />
                        </Collapse>
                    )}
                    {isShein && (
                        <Collapse in={pullEnabled}>
                            <SheinOrdersPanel connectionId={id} />
                        </Collapse>
                    )}
                    {isTemu && (
                        <Collapse in={pullEnabled}>
                            <TemuOrdersPanel connectionId={id} />
                        </Collapse>
                    )}
                    {isAmazon && (
                        <Collapse in={pullEnabled}>
                            <AmazonOrdersPanel connectionId={id} />
                        </Collapse>
                    )}
                    {isMirakl && (
                        <Collapse in={pullEnabled}>
                            <MiraklOrdersPanel connectionId={id} />
                        </Collapse>
                    )}
                    {isTarget && (
                        <Collapse in={pullEnabled}>
                            <TargetOrdersPanel connectionId={id} />
                        </Collapse>
                    )}
                    {isEbay && (
                        <Collapse in={pullEnabled}>
                            <EbayOrdersPanel connectionId={id} />
                        </Collapse>
                    )}
                    {isNoon && (
                        <Collapse in={pullEnabled}>
                            <NoonOrdersPanel connectionId={id} />
                        </Collapse>
                    )}
                    {isBol && (
                        <Collapse in={pullEnabled}>
                            <BolOrdersPanel connectionId={id} />
                        </Collapse>
                    )}
                    {isWix && (
                        <Collapse in={pullEnabled}>
                            <WixOrdersPanel connectionId={id} />
                        </Collapse>
                    )}
                    {isWooCommerce && (
                        <Collapse in={pullEnabled}>
                            <WooCommerceOrdersPanel connectionId={id} />
                        </Collapse>
                    )}
                    {isSquarespace && (
                        <Collapse in={pullEnabled}>
                            <SquarespaceOrdersPanel connectionId={id} />
                        </Collapse>
                    )}
                    {isMeta && (
                        <Collapse in={pullEnabled}>
                            <MetaOrdersPanel connectionId={id} />
                        </Collapse>
                    )}
                    {isOnBuy && (
                        <Collapse in={pullEnabled}>
                            <OnBuyOrdersPanel connectionId={id} />
                        </Collapse>
                    )}
                    {isRakuten && (
                        <Collapse in={pullEnabled}>
                            <RakutenOrdersPanel connectionId={id} />
                        </Collapse>
                    )}
                    {isWayfair && (
                        <Collapse in={pullEnabled}>
                            <WayfairOrdersPanel connectionId={id} />
                        </Collapse>
                    )}
                </Box>
            </Box>
        </Paper>
    );
}

// ─── TikTok connection row ─────────────────────────────────────────────────────
function TikTokConnectionCard({ shop, onDeactivate, adminBase = "/admin" }) {
    const color = "#010101";
    const [confirming, setConfirming]     = useState(false);
    const [deactivating, setDeactivating] = useState(false);
    const [authorizing, setAuthorizing]   = useState(false);

    const authorize = async () => {
        setAuthorizing(true);
        try {
            const res = await axios.post("/api/admin/integrations", { type: "tiktok", seller_name: shop.seller_name, provider: shop.provider });
            if (res.data?.url) window.location.href = res.data.url;
        } catch (e) {
            console.error("Authorize failed", e);
        } finally {
            setAuthorizing(false);
        }
    };

    const deactivate = async () => {
        setDeactivating(true);
        try {
            await axios.delete(`/api/admin/integrations?connectionId=${shop._id}&type=tiktok`);
            onDeactivate?.(shop._id);
        } catch (e) {
            console.error("Deactivate failed", e);
            setDeactivating(false);
            setConfirming(false);
        }
    };

    return (
        <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden", border: "1px solid #e5e7eb" }}>
            <Box sx={{ display: "flex", alignItems: "stretch" }}>
                <Box sx={{ width: 6, bgcolor: color, flexShrink: 0 }} />
                <Box sx={{
                    display: "flex", flexDirection: { xs: "column", sm: "row" },
                    alignItems: { sm: "center" }, justifyContent: "space-between",
                    flexGrow: 1, px: 2.5, py: 2, gap: 2,
                }}>
                    <Stack direction="row" alignItems="center" spacing={2}>
                        <Avatar sx={{ bgcolor: color, width: 38, height: 38, fontSize: "0.75rem", fontWeight: 700 }}>TT</Avatar>
                        <Box>
                            <Stack direction="row" alignItems="center" spacing={1}>
                                <Typography fontWeight={700} fontSize="0.95rem">{shop.seller_name}</Typography>
                                <Chip label="TikTok Shop" size="small"
                                    sx={{ bgcolor: "#010101", color: "#fff", fontWeight: 600, fontSize: "0.7rem" }} />
                                <Chip label="Active" size="small"
                                    sx={{ bgcolor: "#d1fae5", color: "#065f46", fontWeight: 600, fontSize: "0.7rem", border: "none" }} />
                            </Stack>
                            {(shop.shop_list ?? []).map(s => (
                                <Typography key={s.shop_name} variant="caption" color="text.secondary" display="block">
                                    {s.shop_name} · {s.region}
                                </Typography>
                            ))}
                        </Box>
                    </Stack>
                    <Stack direction="row" spacing={1} flexShrink={0} alignItems="center">
                        {!confirming && shop.access_token && (
                            <Button
                                component={Link} href={`${adminBase}/integrations/tiktok`}
                                variant="contained" size="small"
                                endIcon={<OpenInNewIcon sx={{ fontSize: 14 }} />}
                                sx={{ bgcolor: "#010101", color: "#fff", "&:hover": { bgcolor: "#333" }, borderRadius: 1.5 }}>
                                Manage
                            </Button>
                        )}
                        {!confirming && (
                            <Button variant="outlined" size="small"
                                onClick={authorize}
                                disabled={authorizing}
                                startIcon={authorizing ? <CircularProgress size={12} color="inherit" /> : null}
                                sx={{ borderColor: "#69C9D0", color: "#000", "&:hover": { bgcolor: "#e0fafa" }, borderRadius: 1.5 }}>
                                {shop.access_token ? "Reauthorize" : "Authorize"}
                            </Button>
                        )}
                        {confirming ? (
                            <>
                                <Typography variant="caption" color="error" fontWeight={600}>Remove this connection?</Typography>
                                <Button size="small" variant="contained" color="error" onClick={deactivate}
                                    disabled={deactivating} sx={{ borderRadius: 1.5 }}
                                    startIcon={deactivating ? <CircularProgress size={12} color="inherit" /> : null}>
                                    Confirm
                                </Button>
                                <Button size="small" onClick={() => setConfirming(false)} disabled={deactivating} sx={{ borderRadius: 1.5 }}>
                                    Cancel
                                </Button>
                            </>
                        ) : (
                            <Button variant="outlined" size="small" color="error" sx={{ borderRadius: 1.5 }}
                                onClick={() => setConfirming(true)}>
                                Deactivate
                            </Button>
                        )}
                    </Stack>
                </Box>
            </Box>
        </Paper>
    );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export function Main({ tiktokShops, apiKeyIntegrations, provider, source, etsyRedirectURI, shopifyAppUrl, channelEngineConnected, gs1Connected: gs1ConnectedProp, slug }) {
    const [tikTokOpen,  setTikTokOpen]  = useState(false);
    const [acendaOpen,  setAcendaOpen]  = useState(false);
    const [walmartOpen, setWalmartOpen] = useState(false);
    const [faireOpen,   setFaireOpen]   = useState(false);
    const [wixOpen,          setWixOpen]          = useState(false);
    const [wooCommerceOpen,  setWooCommerceOpen]  = useState(false);
    const [squarespaceOpen,  setSquarespaceOpen]  = useState(false);
    const [metaOpen,         setMetaOpen]         = useState(false);
    const [pinterestOpen,    setPinterestOpen]    = useState(false);
    const [onbuyOpen,        setOnBuyOpen]        = useState(false);
    const [rakutenOpen,      setRakutenOpen]      = useState(false);
    const [wayfairOpen,      setWayfairOpen]      = useState(false);
    const [rithumOpen,       setRithumOpen]       = useState(false);
    const [sheinOpen,   setSheinOpen]   = useState(false);
    const [temuOpen,    setTemuOpen]    = useState(false);
    const [amazonOpen,  setAmazonOpen]  = useState(false);
    const [miraklOpen,  setMiraklOpen]  = useState(false);
    const [targetOpen,  setTargetOpen]  = useState(false);
    const [ebayOpen,    setEbayOpen]    = useState(false);
    const [noonOpen,    setNoonOpen]    = useState(false);
    const [bolOpen,     setBolOpen]     = useState(false);
    const [gs1Open,     setGs1Open]     = useState(false);
    const [gs1IsConnected, setGs1IsConnected] = useState(!!gs1ConnectedProp);
    const [apiConnections, setApiConnections] = useState(apiKeyIntegrations || []);
    const [tiktokConnections, setTiktokConnections] = useState(tiktokShops || []);

    const allConnections = [
        ...tiktokConnections.map(t => ({ _type: "tiktok", ...t })),
        ...apiConnections,
    ];

    const connectedTypes = new Set(apiConnections.map(a => a.type?.toLowerCase()));
    const hasTikTok = tiktokConnections.length > 0;

    const adminBase = slug ? `/${slug}/admin` : "/admin";
    const manageHref = (api) => {
        const t = api.type?.toLowerCase();
        if (t === "walmart") return `${adminBase}/integrations/walmart?connectionId=${api._id}`;
        if (t === "faire")   return `${adminBase}/integrations/faire?connectionId=${api._id}`;
        if (t === "acenda" || (!t && !!api.organization)) return `${adminBase}/integrations/acenda?connectionId=${api._id}`;
        if (t === "shopify" || api.displayName?.startsWith("shopify-")) return `${adminBase}/integrations/shopify?connectionId=${api._id}`;
        if (t === "mirakl")  return `${adminBase}/integrations/mirakl?connectionId=${api._id}`;
        if (t === "ebay")    return `${adminBase}/integrations/ebay?connectionId=${api._id}`;
        return null;
    };

    return (
        <Box sx={{ bgcolor: "#f8fafc", minHeight: "100vh", pb: 6 }}>
            {/* Page header */}
            <Box sx={{ bgcolor: "#fff", borderBottom: "1px solid #e5e7eb", py: 3, px: { xs: 2, sm: 4 }, mb: 4 }}>
                <Container maxWidth="lg">
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                        <StorefrontIcon sx={{ color: "#6b7280" }} />
                        <Box>
                            <Typography variant="h5" fontWeight={700}>Integrations</Typography>
                            <Typography variant="body2" color="text.secondary">
                                Connect your selling channels and manage marketplace listings.
                            </Typography>
                        </Box>
                    </Stack>
                </Container>
            </Box>

            <Container maxWidth="lg">
                {/* ── Available integrations ── */}
                <Typography variant="overline" color="text.secondary" fontWeight={700} letterSpacing={1.2}>
                    Available Platforms
                </Typography>
                <Grid2 container spacing={2.5} sx={{ mt: 0.5, mb: 5 }}>
                    <Grid2 size={{ xs: 6, sm: 4, md: 2 }}>
                        <PlatformCard
                            logoSrc="/Shopify_logo_2018.png" alt="Shopify"
                            name="Shopify"
                            description={PLATFORMS.shopify.description}
                            connected={connectedTypes.has("shopify")}
                            href={connectedTypes.has("shopify") ? undefined : "https://apps.shopify.com/pythias-app"}
                        />
                    </Grid2>
                    <Grid2 size={{ xs: 6, sm: 4, md: 2 }}>
                        <PlatformCard
                            logo={tiktok} alt="TikTok Shop"
                            name="TikTok Shop"
                            description={PLATFORMS.tiktok.description}
                            connected={hasTikTok}
                            onClick={hasTikTok ? undefined : () => setTikTokOpen(true)}
                        />
                    </Grid2>
                    <Grid2 size={{ xs: 6, sm: 4, md: 2 }}>
                        <PlatformCard
                            logo={etsy} alt="Etsy"
                            name="Etsy"
                            description={PLATFORMS.etsy.description}
                            connected={connectedTypes.has("etsy")}
                            href={connectedTypes.has("etsy") ? undefined : (etsyRedirectURI || "#")}
                        />
                    </Grid2>
                    <Grid2 size={{ xs: 6, sm: 4, md: 2 }}>
                        <PlatformCard
                            logo={amazon} alt="Amazon"
                            name="Amazon"
                            description={PLATFORMS.amazon.description}
                            connected={connectedTypes.has("amazon")}
                            onClick={connectedTypes.has("amazon") ? undefined : () => setAmazonOpen(true)}
                        />
                    </Grid2>
                    <Grid2 size={{ xs: 6, sm: 4, md: 2 }}>
                        <PlatformCard
                            logo={acenda} alt="Acenda"
                            name="Acenda"
                            description={PLATFORMS.acenda.description}
                            connected={connectedTypes.has("acenda")}
                            onClick={connectedTypes.has("acenda") ? undefined : () => setAcendaOpen(true)}
                        />
                    </Grid2>
                    <Grid2 size={{ xs: 6, sm: 4, md: 2 }}>
                        <PlatformCard
                            logoSrc="/walmart.png" alt="Walmart"
                            name="Walmart"
                            description={PLATFORMS.walmart.description}
                            connected={connectedTypes.has("walmart")}
                            onClick={connectedTypes.has("walmart") ? undefined : () => setWalmartOpen(true)}
                        />
                    </Grid2>
                    <Grid2 size={{ xs: 6, sm: 4, md: 2 }}>
                        <PlatformCard
                            logoSrc="/faire.svg" alt="Faire"
                            name="Faire"
                            description={PLATFORMS.faire.description}
                            connected={connectedTypes.has("faire")}
                            onClick={connectedTypes.has("faire") ? undefined : () => setFaireOpen(true)}
                        />
                    </Grid2>
                    <Grid2 size={{ xs: 6, sm: 4, md: 2 }}>
                        <PlatformCard
                            logoSrc="/shein.svg" alt="SHEIN"
                            name="SHEIN"
                            description={PLATFORMS.shein.description}
                            connected={connectedTypes.has("shein")}
                            onClick={connectedTypes.has("shein") ? undefined : () => setSheinOpen(true)}
                        />
                    </Grid2>
                    <Grid2 size={{ xs: 6, sm: 4, md: 2 }}>
                        <PlatformCard
                            logoSrc="/temu.svg" alt="Temu"
                            name="Temu"
                            description={PLATFORMS.temu.description}
                            connected={connectedTypes.has("temu")}
                            onClick={connectedTypes.has("temu") ? undefined : () => setTemuOpen(true)}
                        />
                    </Grid2>
                    <Grid2 size={{ xs: 6, sm: 4, md: 2 }}>
                        <PlatformCard
                            logoSrc="/mirakl.png" alt="Mirakl"
                            name="Mirakl"
                            description={PLATFORMS.mirakl.description}
                            connected={connectedTypes.has("mirakl")}
                            onClick={connectedTypes.has("mirakl") ? undefined : () => setMiraklOpen(true)}
                            logoBg="#03182f"
                        />
                    </Grid2>
                    <Grid2 size={{ xs: 6, sm: 4, md: 2 }}>
                        <PlatformCard
                            logoSrc="/target-logo.png" alt="Target Plus"
                            name="Target Plus"
                            description={PLATFORMS.target.description}
                            connected={connectedTypes.has("target")}
                            comingSoon={!connectedTypes.has("target")}
                        />
                    </Grid2>
                    <Grid2 size={{ xs: 6, sm: 4, md: 2 }}>
                        <PlatformCard
                            logoSrc="/ebay.svg" alt="eBay"
                            name="eBay"
                            description={PLATFORMS.ebay.description}
                            connected={connectedTypes.has("ebay")}
                            onClick={connectedTypes.has("ebay") ? undefined : () => setEbayOpen(true)}
                        />
                    </Grid2>
                    <Grid2 size={{ xs: 6, sm: 4, md: 2 }}>
                        <PlatformCard
                            logoSrc="/noon.svg" alt="Noon"
                            name="Noon"
                            description={PLATFORMS.noon.description}
                            connected={connectedTypes.has("noon")}
                            onClick={connectedTypes.has("noon") ? undefined : () => setNoonOpen(true)}
                        />
                    </Grid2>
                    <Grid2 size={{ xs: 6, sm: 4, md: 2 }}>
                        <PlatformCard
                            logoSrc="/bol.svg" alt="bol.com"
                            name="bol.com"
                            description={PLATFORMS.bol.description}
                            connected={connectedTypes.has("bol")}
                            onClick={connectedTypes.has("bol") ? undefined : () => setBolOpen(true)}
                        />
                    </Grid2>
                    <Grid2 size={{ xs: 6, sm: 4, md: 2 }}>
                        <PlatformCard
                            logoSrc="/wix.svg" alt="Wix"
                            name="Wix"
                            description={PLATFORMS.wix.description}
                            connected={connectedTypes.has("wix")}
                            onClick={connectedTypes.has("wix") ? undefined : () => setWixOpen(true)}
                        />
                    </Grid2>
                    <Grid2 size={{ xs: 6, sm: 4, md: 2 }}>
                        <PlatformCard
                            logoSrc="/woocommerce.svg" alt="WooCommerce"
                            name="WooCommerce"
                            description={PLATFORMS.woocommerce.description}
                            connected={connectedTypes.has("woocommerce")}
                            onClick={connectedTypes.has("woocommerce") ? undefined : () => setWooCommerceOpen(true)}
                        />
                    </Grid2>
                    <Grid2 size={{ xs: 6, sm: 4, md: 2 }}>
                        <PlatformCard
                            logoSrc="/squarespace.svg" alt="Squarespace"
                            name="Squarespace"
                            description={PLATFORMS.squarespace.description}
                            connected={connectedTypes.has("squarespace")}
                            onClick={connectedTypes.has("squarespace") ? undefined : () => setSquarespaceOpen(true)}
                        />
                    </Grid2>
                    <Grid2 size={{ xs: 6, sm: 4, md: 2 }}>
                        <PlatformCard
                            logoSrc="/meta.svg" alt="Meta Shops"
                            name="Meta Shops"
                            description={PLATFORMS.meta.description}
                            connected={connectedTypes.has("meta")}
                            onClick={connectedTypes.has("meta") ? undefined : () => setMetaOpen(true)}
                        />
                    </Grid2>
                    <Grid2 size={{ xs: 6, sm: 4, md: 2 }}>
                        <PlatformCard
                            logoSrc="/pinterest.svg" alt="Pinterest"
                            name="Pinterest"
                            description={PLATFORMS.pinterest.description}
                            connected={connectedTypes.has("pinterest")}
                            onClick={connectedTypes.has("pinterest") ? undefined : () => setPinterestOpen(true)}
                        />
                    </Grid2>
                    <Grid2 size={{ xs: 6, sm: 4, md: 2 }}>
                        <PlatformCard
                            logoSrc="/onbuy.svg" alt="OnBuy"
                            name="OnBuy"
                            description={PLATFORMS.onbuy.description}
                            connected={connectedTypes.has("onbuy")}
                            onClick={connectedTypes.has("onbuy") ? undefined : () => setOnBuyOpen(true)}
                        />
                    </Grid2>
                    <Grid2 size={{ xs: 6, sm: 4, md: 2 }}>
                        <PlatformCard
                            logoSrc="/rakuten.svg" alt="Rakuten"
                            name="Rakuten"
                            description={PLATFORMS.rakuten.description}
                            connected={connectedTypes.has("rakuten")}
                            onClick={connectedTypes.has("rakuten") ? undefined : () => setRakutenOpen(true)}
                        />
                    </Grid2>
                    <Grid2 size={{ xs: 6, sm: 4, md: 2 }}>
                        <PlatformCard
                            logoSrc="/wayfair.svg" alt="Wayfair"
                            name="Wayfair"
                            description={PLATFORMS.wayfair.description}
                            connected={connectedTypes.has("wayfair")}
                            onClick={connectedTypes.has("wayfair") ? undefined : () => setWayfairOpen(true)}
                        />
                    </Grid2>
                    <Grid2 size={{ xs: 6, sm: 4, md: 2 }}>
                        <PlatformCard
                            logoSrc="/rithum.svg" alt="Rithum"
                            name="Rithum"
                            description={PLATFORMS.rithum.description}
                            connected={connectedTypes.has("rithum")}
                            onClick={connectedTypes.has("rithum") ? undefined : () => setRithumOpen(true)}
                        />
                    </Grid2>
                    {channelEngineConnected !== undefined && (
                        <Grid2 size={{ xs: 6, sm: 4, md: 2 }}>
                            <PlatformCard
                                logoSrc="/channelengine.png" alt="ChannelEngine"
                                name="ChannelEngine"
                                description={PLATFORMS.channelengine.description}
                                logoBg="#0078d7"
                                connected={!!channelEngineConnected}
                                href={channelEngineConnected ? `${adminBase}/integrations/channelengine` : undefined}
                            />
                        </Grid2>
                    )}
                    <Grid2 size={{ xs: 6, sm: 4, md: 2 }}>
                        <PlatformCard
                            logoSrc="/gs1.png" alt="GS1 US"
                            name="GS1 US"
                            description={PLATFORMS.gs1.description}
                            connected={gs1IsConnected}
                            href={gs1IsConnected ? "/admin/integrations/gs1" : undefined}
                            onClick={gs1IsConnected ? undefined : () => setGs1Open(true)}
                        />
                    </Grid2>
                </Grid2>

                {/* ── Active connections ── */}
                <Typography variant="overline" color="text.secondary" fontWeight={700} letterSpacing={1.2}>
                    Active Connections ({allConnections.length + (channelEngineConnected ? 1 : 0) + (gs1IsConnected ? 1 : 0)})
                </Typography>

                {allConnections.length === 0 && !channelEngineConnected && !gs1IsConnected ? (
                    <Paper variant="outlined" sx={{
                        mt: 1, p: 5, borderRadius: 2, textAlign: "center",
                        border: "1px dashed #d1d5db",
                    }}>
                        <StorefrontIcon sx={{ fontSize: 40, color: "#d1d5db", mb: 1 }} />
                        <Typography color="text.secondary">No connections yet. Select a platform above to get started.</Typography>
                    </Paper>
                ) : (
                    <Stack spacing={1.5} sx={{ mt: 1 }}>
                        {channelEngineConnected && (
                            <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden", border: "1px solid #e5e7eb" }}>
                                <Box sx={{ display: "flex", alignItems: "stretch" }}>
                                    <Box sx={{ width: 6, bgcolor: "#0078d7", flexShrink: 0 }} />
                                    <Box sx={{ flexGrow: 1, display: "flex", flexDirection: { xs: "column", sm: "row" }, alignItems: { sm: "center" }, justifyContent: "space-between", px: 2.5, py: 2, gap: 2 }}>
                                        <Stack direction="row" alignItems="center" spacing={2}>
                                            <Avatar sx={{ bgcolor: "#0078d7", width: 38, height: 38 }}>
                                                <img src="/channelengine.png" alt="ChannelEngine" style={{ width: 28, height: 28, objectFit: "contain" }} />
                                            </Avatar>
                                            <Box>
                                                <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
                                                    <Typography fontWeight={700} fontSize="0.95rem">ChannelEngine</Typography>
                                                    <Chip label="ChannelEngine" size="small" sx={{ bgcolor: "#0078d718", color: "#0078d7", fontWeight: 600, fontSize: "0.7rem" }} />
                                                    <Chip label="Active" size="small" sx={{ bgcolor: "#d1fae5", color: "#065f46", fontWeight: 600, fontSize: "0.7rem" }} />
                                                </Stack>
                                                <Typography variant="caption" color="text.secondary">
                                                    Connected via environment variables
                                                </Typography>
                                            </Box>
                                        </Stack>
                                        <Button
                                            component={Link} href={`${adminBase}/integrations/channelengine`}
                                            variant="contained" size="small"
                                            endIcon={<OpenInNewIcon sx={{ fontSize: 14 }} />}
                                            sx={{ bgcolor: "#0078d7", "&:hover": { bgcolor: "#0078d7", filter: "brightness(0.88)" }, borderRadius: 1.5 }}
                                        >
                                            Manage
                                        </Button>
                                    </Box>
                                </Box>
                            </Paper>
                        )}
                        {gs1IsConnected && (
                            <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden", border: "1px solid #e5e7eb" }}>
                                <Box sx={{ display: "flex", alignItems: "stretch" }}>
                                    <Box sx={{ width: 6, bgcolor: "#009a44", flexShrink: 0 }} />
                                    <Box sx={{ flexGrow: 1, display: "flex", flexDirection: { xs: "column", sm: "row" }, alignItems: { sm: "center" }, justifyContent: "space-between", px: 2.5, py: 2, gap: 2 }}>
                                        <Stack direction="row" alignItems="center" spacing={2}>
                                            <Avatar sx={{ bgcolor: "#fff", border: "1px solid #e5e7eb", width: 38, height: 38 }}>
                                                <img src="/gs1.png" alt="GS1 US" style={{ width: 30, height: 30, objectFit: "contain" }} />
                                            </Avatar>
                                            <Box>
                                                <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
                                                    <Typography fontWeight={700} fontSize="0.95rem">GS1 US</Typography>
                                                    <Chip label="UPC/GTIN" size="small" sx={{ bgcolor: "#009a4418", color: "#009a44", fontWeight: 600, fontSize: "0.7rem" }} />
                                                    <Chip label="Active" size="small" sx={{ bgcolor: "#d1fae5", color: "#065f46", fontWeight: 600, fontSize: "0.7rem" }} />
                                                </Stack>
                                                <Typography variant="caption" color="text.secondary">
                                                    UPC generation enabled
                                                </Typography>
                                            </Box>
                                        </Stack>
                                        <Button
                                            component={Link} href={`${adminBase}/integrations/gs1`}
                                            variant="outlined" size="small"
                                            endIcon={<OpenInNewIcon sx={{ fontSize: 14 }} />}
                                            sx={{ borderColor: "#009a44", color: "#009a44", "&:hover": { borderColor: "#007a35", bgcolor: "#009a4408" }, borderRadius: 1.5 }}
                                        >
                                            Dashboard
                                        </Button>
                                    </Box>
                                </Box>
                            </Paper>
                        )}
                        {tiktokConnections.map(tt => (
                            <TikTokConnectionCard key={tt._id} shop={tt} adminBase={adminBase}
                                onDeactivate={id => setTiktokConnections(prev => prev.filter(t => t._id !== id))} />
                        ))}
                        {apiConnections.map(api => (
                            <ConnectionCard
                                key={api._id}
                                id={api._id}
                                name={api.displayName}
                                type={api.type}
                                apiKey={api.apiKey}
                                organization={api.organization}
                                manageHref={manageHref(api)}
                                pullOrdersEnabled={api.pullOrdersEnabled}
                                onDeactivate={id => setApiConnections(prev => prev.filter(a => a._id !== id))}
                            />
                        ))}
                    </Stack>
                )}
            </Container>

            {/* Modals */}
            <TikTokModal  open={tikTokOpen}  setOpen={setTikTokOpen}  provider={provider} />
            <AcendaModal  open={acendaOpen}  setOpen={setAcendaOpen}  provider={provider} apiConnections={apiConnections} setConnections={setApiConnections} />
            <WalmartModal open={walmartOpen} setOpen={setWalmartOpen} provider={provider} apiConnections={apiConnections} setConnections={setApiConnections} />
            <FaireModal   open={faireOpen}   setOpen={setFaireOpen}   provider={provider} apiConnections={apiConnections} setConnections={setApiConnections} />
            <WixModal     open={wixOpen}     setOpen={setWixOpen}     provider={provider} apiConnections={apiConnections} setConnections={setApiConnections} />
            <SheinModal   open={sheinOpen}   setOpen={setSheinOpen}   provider={provider} apiConnections={apiConnections} setConnections={setApiConnections} />
            <TemuModal    open={temuOpen}    setOpen={setTemuOpen}    provider={provider} apiConnections={apiConnections} setConnections={setApiConnections} />
            <AmazonModal  open={amazonOpen}  setOpen={setAmazonOpen}  provider={provider} setConnections={setApiConnections} />
            <MiraklModal  open={miraklOpen}  setOpen={setMiraklOpen}  provider={provider} apiConnections={apiConnections} setConnections={setApiConnections} />
            <TargetModal  open={targetOpen}  setOpen={setTargetOpen}  provider={provider} setConnections={setApiConnections} />
            <EbayModal    open={ebayOpen}    setOpen={setEbayOpen} />
            <NoonModal    open={noonOpen}    setOpen={setNoonOpen}    provider={provider} setConnections={setApiConnections} />
            <BolModal          open={bolOpen}          setOpen={setBolOpen}          provider={provider} setConnections={setApiConnections} />
            <WooCommerceModal  open={wooCommerceOpen}  setOpen={setWooCommerceOpen}  provider={provider} apiConnections={apiConnections} setConnections={setApiConnections} />
            <SquarespaceModal  open={squarespaceOpen}  setOpen={setSquarespaceOpen}  provider={provider} apiConnections={apiConnections} setConnections={setApiConnections} />
            <MetaModal         open={metaOpen}         setOpen={setMetaOpen}         provider={provider} apiConnections={apiConnections} setConnections={setApiConnections} />
            <PinterestModal    open={pinterestOpen}    setOpen={setPinterestOpen}    provider={provider} apiConnections={apiConnections} setConnections={setApiConnections} />
            <OnBuyModal        open={onbuyOpen}        setOpen={setOnBuyOpen}        provider={provider} apiConnections={apiConnections} setConnections={setApiConnections} />
            <RakutenModal      open={rakutenOpen}      setOpen={setRakutenOpen}      provider={provider} apiConnections={apiConnections} setConnections={setApiConnections} />
            <WayfairModal      open={wayfairOpen}      setOpen={setWayfairOpen}      provider={provider} apiConnections={apiConnections} setConnections={setApiConnections} />
            <RithumModal       open={rithumOpen}       setOpen={setRithumOpen}       provider={provider} apiConnections={apiConnections} setConnections={setApiConnections} />
            <Gs1Modal open={gs1Open} setOpen={setGs1Open} onConnected={() => setGs1IsConnected(true)} />
        </Box>
    );
}

function Gs1Modal({ open, setOpen, onConnected }) {
    const [apiKey, setApiKey]               = useState("");
    const [secondaryKey, setSecondaryKey]   = useState("");
    const [accountNumber, setAccountNumber] = useState("");
    const [saving, setSaving]               = useState(false);
    const [error, setError]                 = useState("");
    const loaded = useRef(false);

    useEffect(() => {
        if (open && !loaded.current) {
            loaded.current = true;
            fetch("/api/admin/settings/gs1").then(r => r.json()).then(d => {
                if (!d.error && d.gs1) {
                    setApiKey(d.gs1.apiKey ?? "");
                    setSecondaryKey(d.gs1.secondaryKey ?? "");
                    setAccountNumber(d.gs1.accountNumber ?? "");
                }
            });
        }
        if (!open) loaded.current = false;
    }, [open]);

    const save = async () => {
        if (!apiKey) { setError("Primary API Key is required"); return; }
        setSaving(true); setError("");
        try {
            const res = await fetch("/api/admin/settings/gs1", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ apiKey, secondaryKey, accountNumber }),
            });
            const d = await res.json();
            if (d.error) { setError(d.msg ?? "Save failed"); }
            else { onConnected?.(); setOpen(false); }
        } catch { setError("Save failed"); }
        finally { setSaving(false); }
    };

    return (
        <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ fontWeight: 700, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Stack direction="row" alignItems="center" spacing={1.5}>
                    <img src="/gs1.png" alt="GS1 US" style={{ height: 28, objectFit: "contain" }} />
                    <span>GS1 US Settings</span>
                </Stack>
                <IconButton size="small" onClick={() => setOpen(false)}><CloseIcon fontSize="small" /></IconButton>
            </DialogTitle>
            <DialogContent dividers>
                <Stack spacing={2} sx={{ pt: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                        Enter your GS1 US credentials to enable GTIN/UPC generation. Products will not receive UPCs until this is configured.
                    </Typography>
                    <Button size="small" variant="text" href="https://www.gs1us.org/tools/gs1-company-database-gepir" target="_blank" rel="noopener noreferrer"
                        endIcon={<OpenInNewIcon sx={{ fontSize: 12 }} />}
                        sx={{ alignSelf: "flex-start", p: 0, fontSize: "0.72rem", color: "#009a44", minWidth: 0, textTransform: "none" }}>
                        Get GS1 US API credentials
                    </Button>
                    {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}
                    <TextField fullWidth size="small" label="GS1 Primary API Key" type="password"
                        value={apiKey} onChange={e => setApiKey(e.target.value)}
                        helperText="Your GS1 US primary product key" autoComplete="off" />
                    <TextField fullWidth size="small" label="GS1 Secondary Key" type="password"
                        value={secondaryKey} onChange={e => setSecondaryKey(e.target.value)}
                        helperText="Your GS1 US secondary product key" autoComplete="off" />
                    <TextField fullWidth size="small" label="Account Number"
                        value={accountNumber} onChange={e => setAccountNumber(e.target.value)}
                        helperText="X-Product-Owner-Account-Id used in API requests" />
                </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={() => setOpen(false)}>Cancel</Button>
                <Button variant="contained" onClick={save} disabled={saving || !apiKey}
                    sx={{ bgcolor: "#009a44", "&:hover": { bgcolor: "#007a35" } }}
                    startIcon={saving ? <CircularProgress size={14} color="inherit" /> : null}
                >
                    Save
                </Button>
            </DialogActions>
        </Dialog>
    );
}

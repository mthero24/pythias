"use client";
import {
    Box, Grid2, Card, CardActionArea, Container, Typography,
    Button, Chip, Stack, Paper, Avatar, TextField, Dialog, DialogTitle,
    DialogContent, DialogActions, IconButton, CircularProgress, Alert,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import StorefrontIcon from "@mui/icons-material/Storefront";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CloseIcon from "@mui/icons-material/Close";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";

const PLATFORMS = {
    shopify:      { label: "Shopify",       color: "#96bf48", description: "Sell through your Shopify store with automatic order sync, product listings, and sales management." },
    tiktok:       { label: "TikTok Shop",   color: "#010101", description: "Sell directly on TikTok Shop with product listings and order sync." },
    etsy:         { label: "Etsy",          color: "#F56400", description: "Connect your Etsy storefront for listing management and orders." },
    amazon:       { label: "Amazon",        color: "#FF9900", description: "Sell on Amazon Marketplace with order sync, fulfillment confirmation, and product listings via SP-API." },
    acenda:       { label: "Acenda",        color: "#1565C0", description: "Sync inventory and catalog with your Acenda storefront." },
    walmart:      { label: "Walmart",       color: "#0071CE", description: "List products on Walmart Marketplace and manage orders." },
    faire:        { label: "Faire",         color: "#10305A", description: "Wholesale marketplace connecting brands with independent retailers." },
    shein:        { label: "SHEIN",         color: "#000000", description: "List products on SHEIN's global marketplace via the Open Platform API." },
    temu:         { label: "Temu",          color: "#ff6500", description: "List products on Temu's global marketplace via the Partner Open Platform API." },
    mirakl:       { label: "Mirakl",        color: "#1d4ed8", description: "Sell on any Mirakl-powered marketplace with order sync and fulfillment." },
    target:       { label: "Target Plus",   color: "#CC0000", description: "Sell on Target Plus marketplace with order sync, fulfillment confirmation, and direct SP-API integration." },
    ebay:         { label: "eBay",          color: "#E53238", description: "List products on eBay and automatically pull orders and confirm shipments via the eBay Sell API." },
    noon:         { label: "Noon",          color: "#f59e0b", description: "Sell on Noon marketplace across UAE, Saudi Arabia, and Egypt with order sync and fulfillment." },
    wix:          { label: "Wix",           color: "#0C6EFC", description: "Sync products and pull orders from your Wix Store." },
    woocommerce:  { label: "WooCommerce",   color: "#7f54b3", description: "Sync products and pull orders from your WooCommerce store via the REST API." },
    squarespace:  { label: "Squarespace",   color: "#111827", description: "Pull orders and sync products with your Squarespace Commerce store." },
    bol:          { label: "bol.com",       color: "#0062B1", description: "Sell on bol.com, the leading marketplace in the Netherlands and Belgium." },
    meta:         { label: "Meta Shops",    color: "#0866FF", description: "Sync your product catalog and pull orders from Facebook and Instagram Shops." },
    pinterest:    { label: "Pinterest",     color: "#E60023", description: "Sync your product catalog to Pinterest Shopping via the Pinterest Catalog API." },
    onbuy:        { label: "OnBuy",         color: "#5D11D4", description: "Pull orders and list products on OnBuy, the UK's fastest-growing marketplace." },
    rakuten:      { label: "Rakuten",       color: "#BF0000", description: "List products and pull orders on Rakuten Ichiba via the RMS API." },
    wayfair:      { label: "Wayfair",       color: "#7B2D8B", description: "Pull purchase orders from Wayfair and confirm shipments via the Supplier GraphQL API." },
    rithum:       { label: "Rithum",        color: "#1a1a2e", description: "Formerly ChannelAdvisor/DSCO — pull orders and sync products across Zulily and Rithum-powered channels." },
    channelengine:{ label: "ChannelEngine", color: "#0078d7", description: "Omni-channel hub: sync products, pull orders, confirm shipments, and manage returns across all channels." },
    gs1:          { label: "GS1 US",        color: "#009a44", description: "Generate and manage GTINs/UPCs for your products via the GS1 US API. Required to assign valid UPCs when creating products." },
};

const LOGO_SRCS = {
    shopify:     "/Shopify_logo_2018.png",
    tiktok:      "/tiktoksm.jpeg",
    etsy:        "/etsy2.jpeg",
    amazon:      "/amazon.png",
    acenda:      "/Acenda.png",
    walmart:     "/walmart.png",
    faire:       "/faire.svg",
    shein:       "/shein.svg",
    temu:        "/temu.svg",
    mirakl:      "/mirakl.png",
    target:      "/target-logo.png",
    ebay:        "/ebay.svg",
    noon:        "/noon.svg",
    wix:         "/wix.svg",
    woocommerce: "/woocommerce.svg",
    squarespace: "/squarespace.svg",
    bol:         "/bol.svg",
    meta:        "/meta.svg",
    pinterest:   "/pinterest.svg",
    onbuy:       "/onbuy.svg",
    rakuten:     "/rakuten.svg",
    wayfair:     "/wayfair.svg",
    rithum:      "/rithum.svg",
    channelengine: "/channelengine.png",
    gs1:           "/gs1.png",
};

const LOGO_BG = { mirakl: "#03182f" };

function PlatformCard({ type, name, description, connected, connectHref, comingSoon, logoBg, onClick }) {
    const logoSrc = LOGO_SRCS[type];

    const inner = (
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1.5, height: "100%", p: 3, textAlign: "center" }}>
            <Box sx={{
                height: 64, display: "flex", alignItems: "center", justifyContent: "center",
                width: "100%", borderRadius: 1.5, bgcolor: logoBg ?? (logoSrc ? "transparent" : "#f3f4f6"), px: 1.5,
            }}>
                {logoSrc
                    ? <img src={logoSrc} alt={name} style={{ maxWidth: "100%", maxHeight: 64, width: "auto", height: "auto", objectFit: "contain" }} />
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
                    : <Button variant="outlined" size="small" startIcon={<AddIcon />}
                        sx={{ mt: "auto", pointerEvents: "none", borderRadius: 2 }}>
                        Connect
                      </Button>
            }
        </Box>
    );

    if (comingSoon) {
        return (
            <Card variant="outlined" sx={{ height: "100%", opacity: 0.6, borderRadius: 2, border: "1px solid #e5e7eb" }}>
                {inner}
            </Card>
        );
    }

    if (connected) {
        return (
            <Card variant="outlined" sx={{
                height: "100%", borderRadius: 2, border: "1px solid #6ee7b7", bgcolor: "#f0fdf4",
                ...(connectHref ? { transition: "box-shadow .15s, transform .15s", "&:hover": { boxShadow: "0 4px 16px rgba(0,0,0,.1)", transform: "translateY(-2px)" } } : {}),
            }}>
                {connectHref
                    ? <CardActionArea component={Link} href={connectHref} sx={{ height: "100%" }}>{inner}</CardActionArea>
                    : inner}
            </Card>
        );
    }

    if (onClick) {
        return (
            <Card variant="outlined" sx={{
                height: "100%", borderRadius: 2, border: "1px solid #e5e7eb",
                transition: "box-shadow .15s, transform .15s",
                "&:hover": { boxShadow: "0 4px 16px rgba(0,0,0,.12)", transform: "translateY(-2px)" },
            }}>
                <CardActionArea onClick={onClick} sx={{ height: "100%" }}>{inner}</CardActionArea>
            </Card>
        );
    }

    const href = connectHref || "#";
    return (
        <Card variant="outlined" sx={{
            height: "100%", borderRadius: 2, border: "1px solid #e5e7eb",
            transition: "box-shadow .15s, transform .15s",
            "&:hover": { boxShadow: "0 4px 16px rgba(0,0,0,.12)", transform: "translateY(-2px)" },
        }}>
            <CardActionArea component={Link} href={href} sx={{ height: "100%" }}>
                {inner}
            </CardActionArea>
        </Card>
    );
}

function Gs1Modal({ open, setOpen, onConnected }) {
    const [apiKey, setApiKey] = useState("");
    const [secondaryKey, setSecondaryKey] = useState("");
    const [accountNumber, setAccountNumber] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
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

export function PlatformIntegrationsPage({ connectedTypes = [], channelEngineConnected, gs1Connected: gs1ConnectedProp, slug }) {
    const connected = new Set(connectedTypes.map(t => t.toLowerCase()));
    const [gs1Open, setGs1Open] = useState(false);
    const [gs1IsConnected, setGs1IsConnected] = useState(!!gs1ConnectedProp);

    const manageHref = (type) => `/${slug}/integrations/${type}`;

    const totalActive = connected.size + (channelEngineConnected ? 1 : 0) + (gs1IsConnected ? 1 : 0);

    return (
        <Box sx={{ bgcolor: "#f8fafc", minHeight: "100vh", pb: 6 }}>
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
                <Typography variant="overline" color="text.secondary" fontWeight={700} letterSpacing={1.2}>
                    Available Platforms
                </Typography>
                <Grid2 container spacing={2.5} sx={{ mt: 0.5, mb: 5 }}>
                    {Object.entries(PLATFORMS).map(([type, p]) => {
                        const isGs1 = type === "gs1";
                        const isCe = type === "channelengine";
                        const isConnected = isGs1 ? gs1IsConnected : isCe ? !!channelEngineConnected : connected.has(type);
                        return (
                            <Grid2 key={type} size={{ xs: 6, sm: 4, md: 2 }}>
                                <PlatformCard
                                    type={type}
                                    name={p.label}
                                    description={p.description}
                                    connected={isConnected}
                                    connectHref={isGs1 ? (gs1IsConnected ? `/${slug}/admin/integrations/gs1` : undefined) : isCe ? undefined : manageHref(type)}
                                    onClick={isGs1 && !gs1IsConnected ? () => setGs1Open(true) : undefined}
                                    logoBg={LOGO_BG[type]}
                                />
                            </Grid2>
                        );
                    })}
                </Grid2>

                <Typography variant="overline" color="text.secondary" fontWeight={700} letterSpacing={1.2}>
                    Active Connections ({totalActive})
                </Typography>

                {totalActive === 0 ? (
                    <Paper variant="outlined" sx={{
                        mt: 1, p: 5, borderRadius: 2, textAlign: "center", border: "1px dashed #d1d5db",
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
                                            <Avatar sx={{ bgcolor: "#f3f4f6", width: 38, height: 38, p: 0.5 }}>
                                                <img src="/channelengine.png" alt="ChannelEngine" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                                            </Avatar>
                                            <Box>
                                                <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
                                                    <Typography fontWeight={700} fontSize="0.95rem">ChannelEngine</Typography>
                                                    <Chip label="Active" size="small" sx={{ bgcolor: "#d1fae5", color: "#065f46", fontWeight: 600, fontSize: "0.7rem" }} />
                                                </Stack>
                                                <Typography variant="caption" color="text.secondary">
                                                    Connected via organization credentials
                                                </Typography>
                                            </Box>
                                        </Stack>
                                        <Button
                                            component={Link} href={manageHref("channelengine")}
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
                                            <Avatar sx={{ bgcolor: "#f3f4f6", width: 38, height: 38, p: 0.5 }}>
                                                <img src="/gs1.png" alt="GS1 US" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                                            </Avatar>
                                            <Box>
                                                <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
                                                    <Typography fontWeight={700} fontSize="0.95rem">GS1 US</Typography>
                                                    <Chip label="UPC/GTIN" size="small" sx={{ bgcolor: "#f0fdf4", color: "#065f46", fontWeight: 600, fontSize: "0.7rem" }} />
                                                    <Chip label="Active" size="small" sx={{ bgcolor: "#d1fae5", color: "#065f46", fontWeight: 600, fontSize: "0.7rem" }} />
                                                </Stack>
                                                <Typography variant="caption" color="text.secondary">
                                                    GS1 US API configured — UPCs enabled for new products
                                                </Typography>
                                            </Box>
                                        </Stack>
                                        <Button
                                            component={Link} href={`/${slug}/admin/integrations/gs1`}
                                            variant="outlined" size="small"
                                            endIcon={<OpenInNewIcon sx={{ fontSize: 14 }} />}
                                            sx={{ borderRadius: 1.5, color: "#009a44", borderColor: "#009a44",
                                                "&:hover": { borderColor: "#007a35", bgcolor: "#009a4408" } }}
                                        >
                                            Dashboard
                                        </Button>
                                    </Box>
                                </Box>
                            </Paper>
                        )}
                        {[...connected].map(type => {
                            const p = PLATFORMS[type];
                            if (!p) return null;
                            const logoSrc = LOGO_SRCS[type];
                            return (
                                <Paper key={type} variant="outlined" sx={{ borderRadius: 2, overflow: "hidden", border: "1px solid #e5e7eb" }}>
                                    <Box sx={{ display: "flex", alignItems: "stretch" }}>
                                        <Box sx={{ width: 6, bgcolor: PLATFORMS[type]?.color ?? "#6b7280", flexShrink: 0 }} />
                                        <Box sx={{ flexGrow: 1, display: "flex", flexDirection: { xs: "column", sm: "row" }, alignItems: { sm: "center" }, justifyContent: "space-between", px: 2.5, py: 2, gap: 2 }}>
                                            <Stack direction="row" alignItems="center" spacing={2}>
                                                <Avatar sx={{ bgcolor: LOGO_BG[type] ?? "#f3f4f6", width: 38, height: 38, p: logoSrc ? 0.5 : 0 }}>
                                                    {logoSrc
                                                        ? <img src={logoSrc} alt={p.label} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                                                        : <Typography sx={{ fontSize: "0.8rem", fontWeight: 900, color: "#6b7280" }}>{p.label.charAt(0)}</Typography>
                                                    }
                                                </Avatar>
                                                <Box>
                                                    <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
                                                        <Typography fontWeight={700} fontSize="0.95rem">{p.label}</Typography>
                                                        <Chip label="Active" size="small" sx={{ bgcolor: "#d1fae5", color: "#065f46", fontWeight: 600, fontSize: "0.7rem" }} />
                                                    </Stack>
                                                    <Typography variant="caption" color="text.secondary">{p.description.split(".")[0]}.</Typography>
                                                </Box>
                                            </Stack>
                                            <Button
                                                component={Link} href={manageHref(type)}
                                                variant="outlined" size="small"
                                                endIcon={<OpenInNewIcon sx={{ fontSize: 14 }} />}
                                                sx={{ borderRadius: 1.5 }}
                                            >
                                                Manage
                                            </Button>
                                        </Box>
                                    </Box>
                                </Paper>
                            );
                        })}
                    </Stack>
                )}
            </Container>

            <Gs1Modal open={gs1Open} setOpen={setGs1Open} onConnected={() => setGs1IsConnected(true)} />
        </Box>
    );
}

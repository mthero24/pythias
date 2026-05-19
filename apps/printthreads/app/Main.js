"use client";
import Image from "next/image";
import Link from "next/link";
import {
    Box, Container, Typography, Grid2, Card, CardActionArea,
    Stack, Chip, Divider,
} from "@mui/material";
import * as logo    from "@/public/log.png";
import * as shopify from "@/public/Shopify_logo_2018.png";
import * as amazon  from "@/public/amazon.png";
import * as walmart from "@/public/walmart.png";

import DashboardIcon from "@mui/icons-material/Dashboard";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import PrintIcon from "@mui/icons-material/Print";
import TrackChangesIcon from "@mui/icons-material/TrackChanges";
import TimelineIcon from "@mui/icons-material/Timeline";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import SearchIcon from "@mui/icons-material/Search";
import FolderIcon from "@mui/icons-material/Folder";
import CheckroomIcon from "@mui/icons-material/Checkroom";
import BrushIcon from "@mui/icons-material/Brush";
import InventoryIcon from "@mui/icons-material/Inventory2";
import HubIcon from "@mui/icons-material/Hub";
import AssignmentReturnIcon from "@mui/icons-material/AssignmentReturn";
import StorefrontIcon from "@mui/icons-material/Storefront";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";

const QUICK_LINKS = [
    { label: "Dashboard",        description: "Analytics and performance overview",        href: "/admin",                      icon: <DashboardIcon sx={{ fontSize: 28 }} />,         accent: "#8b5cf6" },
    { label: "Orders",           description: "View and manage customer orders",            href: "/orders",                     icon: <ShoppingCartIcon sx={{ fontSize: 28 }} />,      accent: "#6366f1" },
    { label: "Print Labels",     description: "Print production labels for items",          href: "/production/print-labels",    icon: <PrintIcon sx={{ fontSize: 28 }} />,             accent: "#f59e0b" },
    { label: "Ship Orders",      description: "Buy labels and ship pending orders",          href: "/production/shipping",        icon: <LocalShippingIcon sx={{ fontSize: 28 }} />,     accent: "#10b981" },
    { label: "Track Shipping",   description: "Track all outbound shipments",               href: "/production/shipping-labels", icon: <TrackChangesIcon sx={{ fontSize: 28 }} />,      accent: "#14b8a6" },
    { label: "Track Production", description: "Monitor labeled items in production",        href: "/production/track-labels",    icon: <TimelineIcon sx={{ fontSize: 28 }} />,           accent: "#3b82f6" },
    { label: "Load DTF",         description: "Load DTF films onto press queue",            href: "/production/dtf-send",        icon: <AutoFixHighIcon sx={{ fontSize: 28 }} />,        accent: "#0ea5e9" },
    { label: "Find DTF",         description: "Locate DTF films by piece ID",               href: "/production/dtf-find",        icon: <SearchIcon sx={{ fontSize: 28 }} />,             accent: "#06b6d4" },
    { label: "Folder",           description: "Fold and sort finished garments",             href: "/production/roq-folder",      icon: <FolderIcon sx={{ fontSize: 28 }} />,             accent: "#f97316" },
    { label: "Blanks",           description: "Manage blank apparel catalog",               href: "/admin/blanks",               icon: <CheckroomIcon sx={{ fontSize: 28 }} />,          accent: "#ec4899" },
    { label: "Designs",          description: "Browse and manage design library",           href: "/admin/designs",              icon: <BrushIcon sx={{ fontSize: 28 }} />,              accent: "#84cc16" },
    { label: "Inventory",        description: "Manage blank and product inventory",         href: "/inventory",                  icon: <InventoryIcon sx={{ fontSize: 28 }} />,          accent: "#f97316" },
    { label: "Returns",          description: "Process and track customer returns",         href: "/production/returns",         icon: <AssignmentReturnIcon sx={{ fontSize: 28 }} />,   accent: "#ef4444" },
    { label: "Integrations",     description: "Manage marketplace connections",             href: "/admin/integrations",         icon: <HubIcon sx={{ fontSize: 28 }} />,                accent: "#6366f1" },
    { label: "Sales",            description: "Manage Shopify sales and discounts",          href: "/admin/sales",                icon: <LocalOfferIcon sx={{ fontSize: 28 }} />,         accent: "#f59e0b" },
];

const MARKETPLACES = [
    { src: shopify, alt: "Shopify",  href: "https://printthreads.com/" },
    { src: amazon,  alt: "Amazon",   href: "https://www.amazon.com" },
    { src: walmart, alt: "Walmart",  href: "https://www.walmart.com" },
];

export function Main() {
    return (
        <Box sx={{ backgroundColor: "background.default", minHeight: "100vh" }}>

            {/* Hero */}
            <Box sx={{
                background: "linear-gradient(135deg, #1a2332 0%, #111827 60%, #0f172a 100%)",
                pt: { xs: 6, md: 8 },
                pb: { xs: 5, md: 7 },
                px: 2,
                position: "relative",
                overflow: "hidden",
            }}>
                <Box sx={{
                    position: "absolute", top: -80, right: -80,
                    width: 360, height: 360, borderRadius: "50%",
                    background: "radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)",
                    pointerEvents: "none",
                }} />
                <Box sx={{
                    position: "absolute", bottom: -60, left: -40,
                    width: 280, height: 280, borderRadius: "50%",
                    background: "radial-gradient(circle, rgba(99,102,241,0.10) 0%, transparent 70%)",
                    pointerEvents: "none",
                }} />

                <Container maxWidth="lg">
                    <Stack alignItems="center" spacing={2.5}>
                        <Box sx={{
                            p: 2, borderRadius: 3,
                            background: "rgba(255,255,255,0.06)",
                            border: "1px solid rgba(255,255,255,0.10)",
                            display: "inline-flex",
                        }}>
                            <Image
                                src={logo}
                                alt="PrintThreads"
                                width={220}
                                height={80}
                                style={{ width: "auto", height: 64, objectFit: "contain" }}
                            />
                        </Box>
                        <Box sx={{ textAlign: "center" }}>
                            <Typography variant="h4" sx={{ fontWeight: 800, color: "#fff", mb: 1, fontSize: { xs: "1.6rem", md: "2.1rem" } }}>
                                Production Management
                            </Typography>
                            <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.55)", maxWidth: 480, mx: "auto", lineHeight: 1.7 }}>
                                Manage orders, production, shipping, and marketplace integrations from one place.
                            </Typography>
                        </Box>
                        <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="center" sx={{ gap: 1 }}>
                            {["Orders", "Production", "Shipping", "Integrations"].map(tag => (
                                <Chip key={tag} label={tag} size="small" sx={{
                                    backgroundColor: "rgba(99,102,241,0.18)",
                                    color: "#a5b4fc",
                                    border: "1px solid rgba(99,102,241,0.30)",
                                    fontWeight: 500, fontSize: "0.72rem",
                                }} />
                            ))}
                        </Stack>
                    </Stack>
                </Container>
            </Box>

            {/* Quick access */}
            <Container maxWidth="lg" sx={{ py: { xs: 4, md: 5 } }}>
                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>Quick Access</Typography>
                    <Box sx={{ flex: 1, height: 1, backgroundColor: "divider" }} />
                </Stack>
                <Grid2 container spacing={2}>
                    {QUICK_LINKS.map(({ label, description, href, icon, accent }) => (
                        <Grid2 key={href} size={{ xs: 6, sm: 4, md: 3, lg: 2.4 }}>
                            <Card variant="outlined" sx={{
                                height: "100%", borderRadius: 2.5,
                                transition: "box-shadow 150ms, border-color 150ms, transform 150ms",
                                "&:hover": { boxShadow: `0 4px 20px ${accent}22`, borderColor: `${accent}55`, transform: "translateY(-2px)" },
                            }}>
                                <CardActionArea component={Link} href={href} sx={{ height: "100%", p: 2.5, display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                                    <Box sx={{ width: 48, height: 48, borderRadius: 2, backgroundColor: `${accent}18`, display: "flex", alignItems: "center", justifyContent: "center", color: accent, mb: 1.75, flexShrink: 0 }}>
                                        {icon}
                                    </Box>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5, lineHeight: 1.3 }}>{label}</Typography>
                                    <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5 }}>{description}</Typography>
                                </CardActionArea>
                            </Card>
                        </Grid2>
                    ))}
                </Grid2>
            </Container>

            <Divider />

            {/* Marketplace partners */}
            <Container maxWidth="lg" sx={{ py: { xs: 4, md: 5 } }}>
                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>Marketplace Partners</Typography>
                    <Box sx={{ flex: 1, height: 1, backgroundColor: "divider" }} />
                </Stack>
                <Grid2 container spacing={2} alignItems="center">
                    {MARKETPLACES.map(({ src, alt, href }) => (
                        <Grid2 key={alt} size={{ xs: 4, sm: 3, md: 2 }}>
                            <Card variant="outlined" sx={{ borderRadius: 2, overflow: "hidden", transition: "box-shadow 150ms, border-color 150ms", "&:hover": { boxShadow: 3, borderColor: "primary.light" } }}>
                                <CardActionArea component="a" href={href} target="_blank" rel="noopener noreferrer" sx={{ p: 2, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 72 }}>
                                    <Image src={src} alt={alt} width={120} height={48} style={{ width: "100%", height: "auto", maxHeight: 44, objectFit: "contain" }} />
                                </CardActionArea>
                            </Card>
                        </Grid2>
                    ))}
                </Grid2>
            </Container>

            <Divider />
            <Box sx={{ py: 2.5, px: 3, mt: 1, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}>
                <Typography variant="caption" color="text.disabled">© {new Date().getFullYear()} PrintThreads. All rights reserved.</Typography>
                <Typography variant="caption" color="text.disabled">Powered by Pythias Technologies</Typography>
            </Box>
        </Box>
    );
}

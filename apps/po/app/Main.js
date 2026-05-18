"use client";
import Image from "next/image";
import Link from "next/link";
import {
    Box, Container, Typography, Grid2, Card, CardActionArea,
    Stack, Chip, Divider,
} from "@mui/material";
import * as logo from "@/public/images/logowhite.png";

import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import LabelIcon from "@mui/icons-material/Label";
import TrackChangesIcon from "@mui/icons-material/TrackChanges";
import TimelineIcon from "@mui/icons-material/Timeline";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import SearchIcon from "@mui/icons-material/Search";
import FolderIcon from "@mui/icons-material/Folder";
import InventoryIcon from "@mui/icons-material/Inventory2";
import SettingsIcon from "@mui/icons-material/Settings";
import FormatColorFillIcon from "@mui/icons-material/FormatColorFill";
import ColorLensIcon from "@mui/icons-material/ColorLens";

const QUICK_LINKS = [
    { label: "Print Labels",        description: "Print production labels for items",         href: "/print-labels",        icon: <LabelIcon sx={{ fontSize: 28 }} />,            accent: "#f59e0b" },
    { label: "Orders",              description: "View and manage customer orders",            href: "/orders",              icon: <ShoppingCartIcon sx={{ fontSize: 28 }} />,      accent: "#6366f1" },
    { label: "Ship Orders",         description: "Buy labels and ship pending orders",         href: "/shipping",            icon: <LocalShippingIcon sx={{ fontSize: 28 }} />,     accent: "#10b981" },
    { label: "Track Shipping",      description: "Track all outbound shipments",               href: "/shipping-labels",     icon: <TrackChangesIcon sx={{ fontSize: 28 }} />,      accent: "#14b8a6" },
    { label: "Track Production",    description: "Monitor labeled items in production",        href: "/track-labels",        icon: <TimelineIcon sx={{ fontSize: 28 }} />,           accent: "#8b5cf6" },
    { label: "Load DTF",            description: "Load DTF films onto press queue",            href: "/dtf-send",            icon: <AutoFixHighIcon sx={{ fontSize: 28 }} />,        accent: "#3b82f6" },
    { label: "Find DTF",            description: "Locate DTF films by piece ID",               href: "/dtf-find",            icon: <SearchIcon sx={{ fontSize: 28 }} />,             accent: "#0ea5e9" },
    { label: "Folder",              description: "Fold and sort finished garments",            href: "/roq-folder",          icon: <FolderIcon sx={{ fontSize: 28 }} />,             accent: "#f97316" },
    { label: "Embroidery",          description: "Manage embroidery production queue",         href: "/embroidery",          icon: <FormatColorFillIcon sx={{ fontSize: 28 }} />,    accent: "#ec4899" },
    { label: "Sublimation",         description: "Manage sublimation production queue",        href: "/sublimation",         icon: <ColorLensIcon sx={{ fontSize: 28 }} />,           accent: "#06b6d4" },
    { label: "Inventory",           description: "Manage blank and product inventory",         href: "/inventory",           icon: <InventoryIcon sx={{ fontSize: 28 }} />,           accent: "#84cc16" },
    { label: "Line Settings",       description: "Heat press temperature & time settings",     href: "/production-settings", icon: <SettingsIcon sx={{ fontSize: 28 }} />,            accent: "#64748b" },
];

export function Main() {
    return (
        <Box sx={{ backgroundColor: "background.default", minHeight: "100vh" }}>

            {/* Hero */}
            <Box sx={{
                background: "linear-gradient(135deg, #0c1220 0%, #0f172a 60%, #0c1628 100%)",
                pt: { xs: 6, md: 8 },
                pb: { xs: 5, md: 7 },
                px: 2,
                position: "relative",
                overflow: "hidden",
            }}>
                <Box sx={{
                    position: "absolute", top: -80, right: -80,
                    width: 360, height: 360, borderRadius: "50%",
                    background: "radial-gradient(circle, rgba(212,175,55,0.12) 0%, transparent 70%)",
                    pointerEvents: "none",
                }} />
                <Box sx={{
                    position: "absolute", bottom: -60, left: -40,
                    width: 280, height: 280, borderRadius: "50%",
                    background: "radial-gradient(circle, rgba(212,175,55,0.07) 0%, transparent 70%)",
                    pointerEvents: "none",
                }} />

                <Container maxWidth="lg">
                    <Stack alignItems="center" spacing={2.5}>
                        <Box sx={{
                            p: 2,
                            borderRadius: 3,
                            background: "rgba(255,255,255,0.05)",
                            border: "1px solid rgba(255,255,255,0.10)",
                            display: "inline-flex",
                        }}>
                            <Image
                                src={logo}
                                alt="Print Oracle"
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
                                Manage production, orders, shipping, and inventory from one place.
                            </Typography>
                        </Box>
                        <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="center" sx={{ gap: 1 }}>
                            {["Production", "Orders", "Shipping", "Inventory"].map(tag => (
                                <Chip
                                    key={tag}
                                    label={tag}
                                    size="small"
                                    sx={{
                                        backgroundColor: "rgba(212,175,55,0.15)",
                                        color: "#d4af37",
                                        border: "1px solid rgba(212,175,55,0.30)",
                                        fontWeight: 500,
                                        fontSize: "0.72rem",
                                    }}
                                />
                            ))}
                        </Stack>
                    </Stack>
                </Container>
            </Box>

            {/* Quick access */}
            <Container maxWidth="lg" sx={{ py: { xs: 4, md: 5 } }}>
                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: "text.primary" }}>
                        Quick Access
                    </Typography>
                    <Box sx={{ flex: 1, height: 1, backgroundColor: "divider" }} />
                </Stack>

                <Grid2 container spacing={2}>
                    {QUICK_LINKS.map(({ label, description, href, icon, accent }) => (
                        <Grid2 key={href} size={{ xs: 6, sm: 4, md: 3, lg: 2.4 }}>
                            <Card
                                variant="outlined"
                                sx={{
                                    height: "100%",
                                    borderRadius: 2.5,
                                    transition: "box-shadow 150ms, border-color 150ms, transform 150ms",
                                    "&:hover": {
                                        boxShadow: `0 4px 20px ${accent}22`,
                                        borderColor: `${accent}55`,
                                        transform: "translateY(-2px)",
                                    },
                                }}
                            >
                                <CardActionArea component={Link} href={href} sx={{ height: "100%", p: 2.5, display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                                    <Box sx={{
                                        width: 48, height: 48, borderRadius: 2,
                                        backgroundColor: `${accent}18`,
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        color: accent,
                                        mb: 1.75,
                                        flexShrink: 0,
                                    }}>
                                        {icon}
                                    </Box>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5, lineHeight: 1.3 }}>
                                        {label}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5 }}>
                                        {description}
                                    </Typography>
                                </CardActionArea>
                            </Card>
                        </Grid2>
                    ))}
                </Grid2>
            </Container>

            {/* Footer */}
            <Divider />
            <Box sx={{
                py: 2.5, px: 3, mt: 1,
                display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1,
            }}>
                <Typography variant="caption" color="text.disabled">
                    © {new Date().getFullYear()} Print Oracle. All rights reserved.
                </Typography>
                <Typography variant="caption" color="text.disabled">
                    Powered by Pythias Technologies
                </Typography>
            </Box>
        </Box>
    );
}

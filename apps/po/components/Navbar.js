"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import {
    AppBar, Avatar, Box, Toolbar, IconButton, Drawer,
    List, ListItemButton, ListItemIcon, ListItemText,
    Divider, Typography, Tooltip,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import LogoutIcon from "@mui/icons-material/Logout";
import LocalPrintshopIcon from "@mui/icons-material/LocalPrintshop";
import LabelIcon from "@mui/icons-material/Label";
import ViewListIcon from "@mui/icons-material/ViewList";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import SearchIcon from "@mui/icons-material/Search";
import FolderIcon from "@mui/icons-material/Folder";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import TrackChangesIcon from "@mui/icons-material/TrackChanges";
import TimelineIcon from "@mui/icons-material/Timeline";
import InventoryIcon from "@mui/icons-material/Inventory2";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import EditIcon from "@mui/icons-material/Edit";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import FormatColorFillIcon from "@mui/icons-material/FormatColorFill";
import ColorLensIcon from "@mui/icons-material/ColorLens";
import StorefrontIcon from "@mui/icons-material/Storefront";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import BarChartIcon from "@mui/icons-material/BarChart";
import SettingsIcon from "@mui/icons-material/Settings";
import SystemUpdateAltIcon from "@mui/icons-material/SystemUpdateAlt";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import logo from "@/public/images/logowhite.png";
const BG = "#0f172a";

const NAV_GROUPS = [
    {
        label: "Production",
        items: [
            { label: "Production",      href: "/",              icon: <LocalPrintshopIcon fontSize="small" /> },
            { label: "Print Labels",    href: "/print-labels",  icon: <LabelIcon fontSize="small" /> },
            { label: "Bulk Orders",     href: "/bulk",          icon: <ViewListIcon fontSize="small" /> },
            { label: "Load DTF",        href: "/dtf-send",      icon: <AutoFixHighIcon fontSize="small" /> },
            { label: "Find DTF",        href: "/dtf-find",      icon: <SearchIcon fontSize="small" /> },
            { label: "Folder",          href: "/roq-folder",    icon: <FolderIcon fontSize="small" /> },
            { label: "Embroidery",      href: "/embroidery",    icon: <FormatColorFillIcon fontSize="small" /> },
            { label: "Sublimation",     href: "/sublimation",   icon: <ColorLensIcon fontSize="small" /> },
        ],
    },
    {
        label: "Shipping",
        items: [
            { label: "Orders",           href: "/orders",          icon: <ShoppingCartIcon fontSize="small" /> },
            { label: "Ship Orders",      href: "/shipping",        icon: <LocalShippingIcon fontSize="small" /> },
            { label: "Track Shipping",   href: "/shipping-labels", icon: <TrackChangesIcon fontSize="small" /> },
            { label: "Track Production", href: "/track-labels",    icon: <TimelineIcon fontSize="small" /> },
        ],
    },
    {
        label: "Inventory",
        items: [
            { label: "Inventory",          href: "/inventory",          icon: <InventoryIcon fontSize="small" /> },
        ],
    },
    {
        label: "Other",
        items: [
            { label: "Edit Data",       href: "/edit-data",           icon: <EditIcon fontSize="small" /> },
            { label: "Clockwise",       href: "/clockwise",           icon: <AccessTimeIcon fontSize="small" /> },
            { label: "Sales",           href: "/admin/sales",         icon: <LocalOfferIcon fontSize="small" />,        adminOnly: true },
            { label: "Reports",         href: "/admin/reports",       icon: <BarChartIcon fontSize="small" />,          adminOnly: true },
            { label: "Line Settings",   href: "/production-settings", icon: <SettingsIcon fontSize="small" />,          adminOnly: true },
            { label: "Activity",        href: "/activity",            icon: <BarChartIcon fontSize="small" />,          adminOnly: true },
            { label: "Analytics",       href: "/analytics",           icon: <TrendingUpIcon fontSize="small" />,        adminOnly: true },
            { label: "Live Users",      href: "/live",                icon: <FiberManualRecordIcon fontSize="small" sx={{ color: "#22c55e" }} />, adminOnly: true },
            { label: "Downloads",       href: "/downloads",           icon: <SystemUpdateAltIcon fontSize="small" /> },
        ],
    },
];

export default function ButtonAppBar() {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [avatar, setAvatar]         = useState(null);
    const pathname                    = usePathname();
    const { data: session }           = useSession();
    const isAdmin = session?.user?.role === "admin";

    useEffect(() => {
        if (!session?.user) return;
        axios.get("/api/account").then(res => {
            if (!res.data.error && res.data.user?.avatar) setAvatar(res.data.user.avatar);
        }).catch(() => {});
    }, [session?.user?.userName]);

    const initials  = session?.user
        ? ((session.user.firstName?.[0] ?? "") + (session.user.lastName?.[0] ?? "")).toUpperCase() || session.user.userName?.[0]?.toUpperCase() || "?"
        : "?";
    const avatarSx  = avatar?.startsWith("#") ? { bgcolor: avatar } : {};
    const avatarSrc = avatar?.startsWith("http") ? avatar : undefined;

    return (
        <>
            <AppBar
                position="sticky"
                elevation={0}
                sx={{ bgcolor: BG, borderBottom: "1px solid rgba(255,255,255,0.07)" }}
            >
                <Toolbar sx={{ gap: 1 }}>
                    <IconButton
                        size="large" edge="start" color="inherit"
                        onClick={() => setDrawerOpen(true)}
                        sx={{ mr: 0.5 }}
                    >
                        <MenuIcon />
                    </IconButton>

                    <Box sx={{ flex: 1 }}>
                        <Link href="/" style={{ display: "inline-flex", alignItems: "center" }}>
                            <Image
                                src={logo}
                                width={150} height={34} alt="Print Oracle"
                                style={{ objectFit: "contain" }}
                                priority
                            />
                        </Link>
                    </Box>

                    <Tooltip title="My account">
                        <IconButton component={Link} href="/account" size="small" sx={{ mr: 0.5, p: 0.25 }}>
                            <Avatar src={avatarSrc} sx={{ width: 30, height: 30, fontSize: "0.72rem", fontWeight: 700, bgcolor: avatarSx.bgcolor ?? "#6366f1", ...avatarSx }}>
                                {!avatarSrc && initials}
                            </Avatar>
                        </IconButton>
                    </Tooltip>

                    <Tooltip title="Sign out">
                        <IconButton
                            color="inherit"
                            onClick={() => signOut({ callbackUrl: "https://www.printoracle.com/" })}
                            sx={{ opacity: 0.7, "&:hover": { opacity: 1 } }}
                        >
                            <LogoutIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Toolbar>
            </AppBar>

            <Drawer
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                PaperProps={{
                    sx: {
                        width: 268,
                        bgcolor: BG,
                        color: "#fff",
                        border: "none",
                        display: "flex",
                        flexDirection: "column",
                    },
                }}
            >
                {/* Logo */}
                <Box sx={{ px: 2.5, py: 2, borderBottom: "1px solid rgba(255,255,255,0.07)", flexShrink: 0 }}>
                    <Link href="/" onClick={() => setDrawerOpen(false)} style={{ display: "inline-flex" }}>
                        <Image
                            src={logo}
                            width={150} height={34} alt="Print Oracle"
                            style={{ objectFit: "contain" }}
                        />
                    </Link>
                </Box>

                {/* Nav */}
                <Box sx={{
                    flex: 1, overflowY: "auto", py: 1,
                    scrollbarWidth: "thin",
                    scrollbarColor: "rgba(255,255,255,0.12) transparent",
                    "&::-webkit-scrollbar": { width: 4 },
                    "&::-webkit-scrollbar-track": { background: "transparent" },
                    "&::-webkit-scrollbar-thumb": { background: "rgba(255,255,255,0.12)", borderRadius: 4 },
                    "&::-webkit-scrollbar-thumb:hover": { background: "rgba(255,255,255,0.22)" },
                }}>
                    {NAV_GROUPS.map((group, gi) => (
                        <Box key={group.label}>
                            {gi > 0 && <Divider sx={{ borderColor: "rgba(255,255,255,0.06)", my: 0.5, mx: 2 }} />}
                            <Typography
                                variant="caption"
                                sx={{
                                    display: "block", px: 2.5, pt: 1.5, pb: 0.5,
                                    color: "rgba(255,255,255,0.3)",
                                    fontWeight: 700,
                                    textTransform: "uppercase",
                                    letterSpacing: 0.8,
                                    fontSize: "0.62rem",
                                }}
                            >
                                {group.label}
                            </Typography>
                            <List dense disablePadding sx={{ px: 1 }}>
                                {group.items.filter(item => !item.adminOnly || isAdmin).map(item => {
                                    const active = pathname === item.href;
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={() => setDrawerOpen(false)}
                                            style={{ textDecoration: "none" }}
                                        >
                                            <ListItemButton
                                                sx={{
                                                    borderRadius: 1.5,
                                                    px: 1.5, py: 0.6, mb: 0.25,
                                                    bgcolor: active ? "rgba(0,121,220,0.18)" : "transparent",
                                                    "&:hover": {
                                                        bgcolor: active
                                                            ? "rgba(0,121,220,0.25)"
                                                            : "rgba(255,255,255,0.05)",
                                                    },
                                                    transition: "background 0.15s",
                                                }}
                                            >
                                                <ListItemIcon sx={{ minWidth: 34, color: active ? "#60a5fa" : "rgba(255,255,255,0.4)" }}>
                                                    {item.icon}
                                                </ListItemIcon>
                                                <ListItemText
                                                    primary={item.label}
                                                    slotProps={{ primary: { sx: {
                                                        fontSize: "0.875rem",
                                                        fontWeight: active ? 600 : 400,
                                                        color: active ? "#f1f5f9" : "rgba(255,255,255,0.65)",
                                                    }}}}
                                                />
                                                {active && (
                                                    <Box sx={{ width: 3, height: 18, borderRadius: 2, bgcolor: "#3b82f6", flexShrink: 0 }} />
                                                )}
                                            </ListItemButton>
                                        </Link>
                                    );
                                })}
                            </List>
                        </Box>
                    ))}
                </Box>

                {/* Footer */}
                <Box sx={{ borderTop: "1px solid rgba(255,255,255,0.07)", px: 1, py: 1, flexShrink: 0 }}>
                    <Link href="/account" onClick={() => setDrawerOpen(false)} style={{ textDecoration: "none" }}>
                        <ListItemButton sx={{ borderRadius: 1.5, px: 1.5, py: 0.75, mb: 0.5, "&:hover": { bgcolor: "rgba(255,255,255,0.05)" } }}>
                            <ListItemIcon sx={{ minWidth: 36 }}>
                                <Avatar src={avatarSrc} sx={{ width: 26, height: 26, fontSize: "0.65rem", fontWeight: 700, bgcolor: avatarSx.bgcolor ?? "#6366f1", ...avatarSx }}>
                                    {!avatarSrc && initials}
                                </Avatar>
                            </ListItemIcon>
                            <ListItemText
                                primary={session?.user ? (session.user.firstName || session.user.userName) : "Account"}
                                secondary={session?.user?.userName ? `@${session.user.userName}` : undefined}
                                slotProps={{
                                    primary: { sx: { fontSize: "0.82rem", fontWeight: 500, color: "rgba(255,255,255,0.82)" } },
                                    secondary: { sx: { fontSize: "0.7rem", color: "rgba(255,255,255,0.38)" } },
                                }}
                            />
                        </ListItemButton>
                    </Link>
                    <ListItemButton
                        onClick={() => signOut({ callbackUrl: "https://www.printoracle.com/" })}
                        sx={{ borderRadius: 1.5, px: 1.5, py: 0.75, "&:hover": { bgcolor: "rgba(239,68,68,0.12)" } }}
                    >
                        <ListItemIcon sx={{ minWidth: 34, color: "rgba(239,68,68,0.75)" }}>
                            <LogoutIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText
                            primary="Sign out"
                            slotProps={{ primary: { sx: { fontSize: "0.82rem", fontWeight: 500, color: "rgba(239,68,68,0.85)" } } }}
                        />
                    </ListItemButton>
                </Box>
            </Drawer>
        </>
    );
}

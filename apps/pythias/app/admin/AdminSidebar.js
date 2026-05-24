"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
    Box, List, ListItemButton, ListItemIcon, ListItemText,
    Typography, Button, Divider, Drawer, AppBar, Toolbar, IconButton,
    useMediaQuery, useTheme,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import DashboardIcon from "@mui/icons-material/Dashboard";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import BarChartIcon from "@mui/icons-material/BarChart";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import ArticleIcon from "@mui/icons-material/Article";
import KeyIcon from "@mui/icons-material/Key";
import PlayCircleIcon from "@mui/icons-material/PlayCircle";
import Link from "next/link";

const DRAWER_WIDTH = 240;

const NAV_ITEMS = [
    { label: "Dashboard",        href: "/admin",                  icon: <DashboardIcon fontSize="small" /> },
    { label: "Live Users",       href: "/admin/live",             icon: <FiberManualRecordIcon fontSize="small" sx={{ color: "#22c55e" }} /> },
    { label: "Analytics",        href: "/admin/analytics",        icon: <BarChartIcon fontSize="small" /> },
    { label: "Contact Messages", href: "/admin/contact-messages", icon: <MailOutlineIcon fontSize="small" /> },
    { label: "Articles",         href: "/admin/articles",         icon: <ArticleIcon fontSize="small" /> },
    { label: "Tutorials",        href: "/admin/tutorials",        icon: <PlayCircleIcon fontSize="small" /> },
    { label: "API Tokens",       href: "/admin/api-tokens",       icon: <KeyIcon fontSize="small" /> },
];

function SidebarContent({ onClose }) {
    const pathname = usePathname();
    const { data: session } = useSession();
    const user = session?.user;

    return (
        <Box sx={{
            width: DRAWER_WIDTH,
            height: "100%",
            bgcolor: "#0f172a",
            display: "flex",
            flexDirection: "column",
            borderRight: "1px solid rgba(255,255,255,0.07)",
        }}>
            {/* Brand header */}
            <Box sx={{ px: 2.5, py: 3, display: "flex", alignItems: "center", gap: 1.5 }}>
                <Box sx={{
                    width: 38, height: 38, bgcolor: "#D3A73D", borderRadius: 1.5,
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                    <Typography sx={{ color: "#0f172a", fontWeight: 800, fontSize: 14, letterSpacing: 0.5 }}>
                        PT
                    </Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
                    <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: 15, lineHeight: 1.2 }}>
                        Pythias
                    </Typography>
                    <Typography sx={{ color: "rgba(255,255,255,0.45)", fontSize: 11, lineHeight: 1.3 }}>
                        Admin Panel
                    </Typography>
                </Box>
                {onClose && (
                    <IconButton onClick={onClose} size="small" sx={{ color: "rgba(255,255,255,0.5)" }}>
                        <CloseIcon fontSize="small" />
                    </IconButton>
                )}
            </Box>

            <Divider sx={{ borderColor: "rgba(255,255,255,0.07)" }} />

            {/* Nav items */}
            <List sx={{ px: 1.5, py: 1.5, flex: 1 }}>
                {NAV_ITEMS.map((item) => {
                    const isActive = item.href === "/admin"
                        ? pathname === "/admin"
                        : pathname?.startsWith(item.href);

                    return (
                        <ListItemButton
                            key={item.href}
                            component={Link}
                            href={item.href}
                            onClick={onClose}
                            sx={{
                                borderRadius: 1.5, mb: 0.5, px: 1.5, py: 0.9,
                                borderLeft: isActive ? "3px solid #D3A73D" : "3px solid transparent",
                                bgcolor: isActive ? "rgba(211,167,61,0.08)" : "transparent",
                                color: isActive ? "#fff" : "rgba(255,255,255,0.78)",
                                "&:hover": { bgcolor: "rgba(255,255,255,0.06)", color: "#fff" },
                                transition: "all 0.15s ease",
                            }}
                        >
                            <ListItemIcon sx={{ minWidth: 32, color: isActive ? "#D3A73D" : "rgba(255,255,255,0.55)" }}>
                                {item.icon}
                            </ListItemIcon>
                            <ListItemText
                                primary={item.label}
                                primaryTypographyProps={{ fontSize: 13.5, fontWeight: isActive ? 600 : 400 }}
                            />
                        </ListItemButton>
                    );
                })}
            </List>

            <Divider sx={{ borderColor: "rgba(255,255,255,0.07)" }} />

            {/* Footer */}
            <Box sx={{ px: 2.5, py: 2 }}>
                {user && (
                    <Box sx={{ mb: 1.5 }}>
                        <Typography sx={{ color: "#fff", fontSize: 13, fontWeight: 600, lineHeight: 1.3 }}>
                            {user.firstName || user.name || user.userName}
                        </Typography>
                        <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>
                            {user.userName || user.email}
                        </Typography>
                    </Box>
                )}
                <Button
                    fullWidth size="small"
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    sx={{
                        color: "rgba(255,255,255,0.55)", justifyContent: "flex-start",
                        fontSize: 12, py: 0.5, px: 1, borderRadius: 1, textTransform: "none",
                        "&:hover": { color: "#ef4444", bgcolor: "rgba(239,68,68,0.08)" },
                    }}
                >
                    Sign Out
                </Button>
            </Box>
        </Box>
    );
}

export default function AdminSidebar() {
    const [mobileOpen, setMobileOpen] = useState(false);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));

    return (
        <>
            {/* Mobile top bar */}
            {isMobile && (
                <AppBar position="fixed" sx={{ bgcolor: "#0f172a", boxShadow: "none", borderBottom: "1px solid rgba(255,255,255,0.07)", zIndex: theme.zIndex.drawer + 1 }}>
                    <Toolbar sx={{ gap: 1.5 }}>
                        <IconButton edge="start" onClick={() => setMobileOpen(true)} sx={{ color: "rgba(255,255,255,0.8)" }}>
                            <MenuIcon />
                        </IconButton>
                        <Box sx={{ width: 28, height: 28, bgcolor: "#D3A73D", borderRadius: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Typography sx={{ color: "#0f172a", fontWeight: 800, fontSize: 11 }}>PT</Typography>
                        </Box>
                        <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>
                            Pythias Admin
                        </Typography>
                    </Toolbar>
                </AppBar>
            )}

            {/* Mobile spacer so content doesn't hide under AppBar */}
            {isMobile && <Toolbar />}

            {/* Desktop: permanent sidebar */}
            {!isMobile && (
                <Box sx={{ width: DRAWER_WIDTH, flexShrink: 0, position: "sticky", top: 0, height: "100vh" }}>
                    <SidebarContent />
                </Box>
            )}

            {/* Mobile: temporary drawer */}
            <Drawer
                variant="temporary"
                open={mobileOpen}
                onClose={() => setMobileOpen(false)}
                ModalProps={{ keepMounted: true }}
                sx={{
                    display: { xs: "block", md: "none" },
                    "& .MuiDrawer-paper": { width: DRAWER_WIDTH, bgcolor: "transparent", border: "none" },
                }}
            >
                <SidebarContent onClose={() => setMobileOpen(false)} />
            </Drawer>
        </>
    );
}

"use client";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
    Box,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Typography,
    Button,
    Divider,
} from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import BarChartIcon from "@mui/icons-material/BarChart";
import Link from "next/link";

const NAV_ITEMS = [
    { label: "Dashboard", href: "/admin", icon: <DashboardIcon fontSize="small" /> },
    {
        label: "Live Users",
        href: "/admin/live",
        icon: <FiberManualRecordIcon fontSize="small" sx={{ color: "#22c55e" }} />,
    },
    { label: "Analytics", href: "/admin/analytics", icon: <BarChartIcon fontSize="small" /> },
];

export default function AdminSidebar() {
    const pathname = usePathname();
    const { data: session } = useSession();

    const user = session?.user;

    return (
        <Box
            sx={{
                width: 240,
                minWidth: 240,
                height: "100vh",
                position: "sticky",
                top: 0,
                bgcolor: "#0f172a",
                display: "flex",
                flexDirection: "column",
                borderRight: "1px solid rgba(255,255,255,0.07)",
                flexShrink: 0,
            }}
        >
            {/* Brand header */}
            <Box sx={{ px: 2.5, py: 3, display: "flex", alignItems: "center", gap: 1.5 }}>
                <Box
                    sx={{
                        width: 38,
                        height: 38,
                        bgcolor: "#D3A73D",
                        borderRadius: 1.5,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                    }}
                >
                    <Typography sx={{ color: "#0f172a", fontWeight: 800, fontSize: 14, letterSpacing: 0.5 }}>
                        PT
                    </Typography>
                </Box>
                <Box>
                    <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: 15, lineHeight: 1.2 }}>
                        Pythias
                    </Typography>
                    <Typography sx={{ color: "rgba(255,255,255,0.45)", fontSize: 11, lineHeight: 1.3 }}>
                        Admin Panel
                    </Typography>
                </Box>
            </Box>

            <Divider sx={{ borderColor: "rgba(255,255,255,0.07)" }} />

            {/* Nav items */}
            <List sx={{ px: 1.5, py: 1.5, flex: 1 }}>
                {NAV_ITEMS.map((item) => {
                    const isActive =
                        item.href === "/admin"
                            ? pathname === "/admin"
                            : pathname?.startsWith(item.href);

                    return (
                        <ListItemButton
                            key={item.href}
                            component={Link}
                            href={item.href}
                            sx={{
                                borderRadius: 1.5,
                                mb: 0.5,
                                px: 1.5,
                                py: 0.9,
                                borderLeft: isActive ? "3px solid #D3A73D" : "3px solid transparent",
                                bgcolor: isActive ? "rgba(211,167,61,0.08)" : "transparent",
                                color: isActive ? "#fff" : "rgba(255,255,255,0.78)",
                                "&:hover": { bgcolor: "rgba(255,255,255,0.06)", color: "#fff" },
                                transition: "all 0.15s ease",
                            }}
                        >
                            <ListItemIcon
                                sx={{
                                    minWidth: 32,
                                    color: isActive ? "#D3A73D" : "rgba(255,255,255,0.55)",
                                }}
                            >
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

            {/* Footer */}
            <Divider sx={{ borderColor: "rgba(255,255,255,0.07)" }} />
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
                    fullWidth
                    size="small"
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    sx={{
                        color: "rgba(255,255,255,0.55)",
                        justifyContent: "flex-start",
                        fontSize: 12,
                        py: 0.5,
                        px: 1,
                        borderRadius: 1,
                        textTransform: "none",
                        "&:hover": { color: "#ef4444", bgcolor: "rgba(239,68,68,0.08)" },
                    }}
                >
                    Sign Out
                </Button>
            </Box>
        </Box>
    );
}

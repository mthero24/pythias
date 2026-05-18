import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { User } from "@pythias/mongo";
import {
    Box,
    Paper,
    Typography,
    Stack,
    Chip,
} from "@mui/material";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dashboard — Pythias Admin" };

function StatCard({ title, value, subtitle, href, accentColor = "#D3A73D", indicator }) {
    const content = (
        <Paper
            elevation={0}
            sx={{
                flex: 1,
                minWidth: 200,
                p: 2.5,
                borderLeft: `4px solid ${accentColor}`,
                border: "1px solid rgba(0,0,0,0.08)",
                borderLeftColor: accentColor,
                borderRadius: 2,
                bgcolor: "#fff",
                cursor: href ? "pointer" : "default",
                transition: "box-shadow 0.15s ease",
                "&:hover": href ? { boxShadow: "0 4px 16px rgba(0,0,0,0.1)" } : {},
            }}
        >
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                {indicator && (
                    <Box
                        sx={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            bgcolor: indicator,
                            flexShrink: 0,
                        }}
                    />
                )}
                <Typography sx={{ fontSize: 12, fontWeight: 600, color: "rgba(0,0,0,0.45)", textTransform: "uppercase", letterSpacing: 0.8 }}>
                    {title}
                </Typography>
            </Stack>
            <Typography sx={{ fontSize: 32, fontWeight: 700, color: "#0f172a", lineHeight: 1.2 }}>
                {value}
            </Typography>
            {subtitle && (
                <Typography sx={{ fontSize: 12, color: "rgba(0,0,0,0.45)", mt: 0.5 }}>
                    {subtitle}
                </Typography>
            )}
        </Paper>
    );

    if (href) {
        return (
            <Link href={href} style={{ flex: 1, minWidth: 200, textDecoration: "none" }}>
                {content}
            </Link>
        );
    }

    return content;
}

export default async function AdminDashboard() {
    const headersList = await headers();
    const user = headersList.get("user");
    if (!user) redirect("/login");

    const since = new Date(Date.now() - 5 * 60 * 1000);
    const onlineUsers = await User.find({ lastSeen: { $gte: since } })
        .select("userName firstName lastName currentPage lastSeen")
        .lean();

    return (
        <Box sx={{ p: 3, maxWidth: 900 }}>
            {/* Page title */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: "#0f172a", lineHeight: 1.2 }}>
                    Dashboard
                </Typography>
                <Typography sx={{ color: "rgba(0,0,0,0.45)", mt: 0.5, fontSize: 14 }}>
                    Pythias Admin Panel
                </Typography>
            </Box>

            {/* Stat cards */}
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 4 }}>
                <StatCard
                    title="Online Now"
                    value={onlineUsers.length}
                    subtitle="Active in last 5 minutes"
                    indicator="#22c55e"
                    accentColor="#22c55e"
                />
                <StatCard
                    title="Analytics"
                    value="View"
                    subtitle="Traffic &amp; event data"
                    href="/admin/analytics"
                    accentColor="#D3A73D"
                />
                <StatCard
                    title="Live View"
                    value="Open"
                    subtitle="Real-time user presence"
                    href="/admin/live"
                    accentColor="#C19F66"
                />
            </Stack>

            {/* Who's Online */}
            <Box>
                <Typography sx={{ fontWeight: 600, fontSize: 15, color: "#0f172a", mb: 1.5 }}>
                    Who&apos;s Online
                </Typography>

                {onlineUsers.length === 0 ? (
                    <Paper
                        elevation={0}
                        sx={{
                            p: 3,
                            textAlign: "center",
                            bgcolor: "rgba(0,0,0,0.02)",
                            border: "1px dashed rgba(0,0,0,0.12)",
                            borderRadius: 2,
                        }}
                    >
                        <Typography sx={{ color: "rgba(0,0,0,0.35)", fontSize: 13 }}>
                            No users active in the last 5 minutes.
                        </Typography>
                    </Paper>
                ) : (
                    <Stack spacing={1}>
                        {onlineUsers.map((u) => (
                            <Paper
                                key={u.userName}
                                elevation={0}
                                sx={{
                                    px: 2,
                                    py: 1.5,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 2,
                                    border: "1px solid rgba(0,0,0,0.07)",
                                    borderRadius: 1.5,
                                    bgcolor: "#fff",
                                }}
                            >
                                <Box
                                    sx={{
                                        width: 8,
                                        height: 8,
                                        borderRadius: "50%",
                                        bgcolor: "#22c55e",
                                        flexShrink: 0,
                                    }}
                                />
                                <Box sx={{ flex: 1 }}>
                                    <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>
                                        {u.firstName || u.userName}
                                    </Typography>
                                    <Typography sx={{ fontSize: 11, color: "rgba(0,0,0,0.4)" }}>
                                        @{u.userName}
                                    </Typography>
                                </Box>
                                {u.currentPage && (
                                    <Chip
                                        label={u.currentPage}
                                        size="small"
                                        sx={{
                                            fontSize: 11,
                                            height: 22,
                                            bgcolor: "rgba(211,167,61,0.1)",
                                            color: "#8a6820",
                                            fontFamily: "monospace",
                                        }}
                                    />
                                )}
                            </Paper>
                        ))}
                    </Stack>
                )}
            </Box>
        </Box>
    );
}

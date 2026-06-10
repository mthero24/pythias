"use client";
import { Box, Typography, Button } from "@mui/material";
import Link from "next/link";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { useParams } from "next/navigation";

export default function Error({ error, reset }) {
    const { slug } = useParams();

    const isPermission = error?.message?.toLowerCase().includes("permission") ||
                         error?.message?.toLowerCase().includes("unauthorized") ||
                         error?.message?.toLowerCase().includes("forbidden");

    return (
        <Box sx={{
            minHeight: "100vh",
            bgcolor: "#f8fafc",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            px: 3,
        }}>
            <Box sx={{ textAlign: "center", maxWidth: 440 }}>
                <Box sx={{
                    width: 72, height: 72, borderRadius: 4, mx: "auto", mb: 3,
                    background: "linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                    <LockOutlinedIcon sx={{ color: "#fff", fontSize: 36 }} />
                </Box>

                <Typography variant="h5" fontWeight={700} sx={{ mb: 1, color: "#0f172a" }}>
                    {isPermission ? "Access Denied" : "Something went wrong"}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                    {isPermission
                        ? "You don't have permission to view this page. Contact an administrator if you need access."
                        : "An unexpected error occurred. Try again or go back to the dashboard."}
                </Typography>

                <Box sx={{ display: "flex", gap: 2, justifyContent: "center", flexWrap: "wrap" }}>
                    <Button
                        onClick={reset}
                        variant="outlined"
                        size="large"
                        sx={{ fontWeight: 600, borderRadius: 2, px: 3 }}
                    >
                        Try Again
                    </Button>
                    <Button
                        component={Link}
                        href={slug ? `/${slug}` : "/login"}
                        variant="contained"
                        size="large"
                        sx={{
                            bgcolor: "#6366f1",
                            "&:hover": { bgcolor: "#4f46e5" },
                            fontWeight: 600,
                            borderRadius: 2,
                            px: 3,
                        }}
                    >
                        Go to Dashboard
                    </Button>
                </Box>
            </Box>
        </Box>
    );
}

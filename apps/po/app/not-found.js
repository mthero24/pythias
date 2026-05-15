import { Box, Typography, Button } from "@mui/material";
import Link from "next/link";
import SearchOffIcon from "@mui/icons-material/SearchOff";

export default function NotFound() {
    return (
        <Box sx={{
            minHeight: "100vh",
            bgcolor: "#f8fafc",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            px: 3,
        }}>
            <Box sx={{ textAlign: "center", maxWidth: 420 }}>
                {/* Icon */}
                <Box sx={{
                    width: 72, height: 72, borderRadius: 4, mx: "auto", mb: 3,
                    background: "linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                    <SearchOffIcon sx={{ color: "#fff", fontSize: 36 }} />
                </Box>

                {/* 404 */}
                <Typography
                    variant="h1"
                    sx={{
                        fontWeight: 900,
                        fontSize: { xs: "5rem", sm: "7rem" },
                        lineHeight: 1,
                        letterSpacing: -4,
                        background: "linear-gradient(135deg, #3b82f6, #6366f1)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        mb: 1,
                    }}
                >
                    404
                </Typography>

                <Typography variant="h5" fontWeight={700} sx={{ mb: 1, color: "#0f172a" }}>
                    Page not found
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                    The page you&apos;re looking for doesn&apos;t exist or has been moved.
                </Typography>

                <Button
                    component={Link}
                    href="/"
                    variant="contained"
                    size="large"
                    sx={{
                        bgcolor: "#6366f1",
                        "&:hover": { bgcolor: "#4f46e5" },
                        fontWeight: 600,
                        borderRadius: 2,
                        px: 4,
                    }}
                >
                    Go home
                </Button>
            </Box>
        </Box>
    );
}

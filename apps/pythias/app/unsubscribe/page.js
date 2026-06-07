import { Box, Container, Typography, Button } from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import Link from "next/link";

export const metadata = { title: "Unsubscribed — Pythias Technologies", robots: { index: false } };

export default function UnsubscribePage({ searchParams }) {
    const done = searchParams?.done === "1";
    return (
        <Box sx={{ minHeight: "80vh", display: "flex", alignItems: "center", bgcolor: "#f8faff" }}>
            <Container maxWidth="sm" sx={{ textAlign: "center", py: 10 }}>
                <CheckCircleOutlineIcon sx={{ fontSize: 64, color: "#6366f1", mb: 2 }} />
                <Typography variant="h4" fontWeight={800} gutterBottom>
                    {done ? "You've been unsubscribed" : "Unsubscribe"}
                </Typography>
                <Typography color="text.secondary" sx={{ mb: 4, lineHeight: 1.7 }}>
                    {done
                        ? "You won't receive any more marketing emails from Pythias Technologies. If this was a mistake, contact us at info@pythiastechnologies.com."
                        : "Use the unsubscribe link in any email we've sent you to opt out."}
                </Typography>
                <Button component={Link} href="/" variant="contained"
                    sx={{ bgcolor: "#6366f1", "&:hover": { bgcolor: "#4f46e5" }, borderRadius: 2, fontWeight: 700 }}>
                    Back to home
                </Button>
            </Container>
        </Box>
    );
}

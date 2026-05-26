import { Box, Container, Typography, Button, Divider } from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CalendarMonthIcon      from "@mui/icons-material/CalendarMonth";
import EmailIcon              from "@mui/icons-material/Email";
import GroupsIcon             from "@mui/icons-material/Groups";
import Link                   from "next/link";
import IframeBreaker          from "./IframeBreaker";
import BookingConversion      from "./BookingConversion";

export const metadata = {
    title: "Demo Confirmed — Pythias Technologies",
    description: "Your demo is booked. Here's what happens next.",
    robots: { index: false, follow: false },
};

const NEXT_STEPS = [
    {
        icon: <CalendarMonthIcon sx={{ fontSize: 28, color: "#6366f1" }} />,
        title: "Check your email",
        body: "A calendar invite with the meeting link has been sent to you. Add it to your calendar so you don't miss it.",
    },
    {
        icon: <EmailIcon sx={{ fontSize: 28, color: "#6366f1" }} />,
        title: "We'll send a prep guide",
        body: "Expect a short email from our team with a few questions so we can tailor the demo specifically to your operation.",
    },
    {
        icon: <GroupsIcon sx={{ fontSize: 28, color: "#6366f1" }} />,
        title: "Bring your team",
        body: "The more the merrier. Invite anyone who will be using the platform — production staff, shipping leads, or your ops manager.",
    },
];

export default function DemoConfirmedPage() {
    return (
        <>
            {/* Breaks out of Google Calendar iframe on redirect */}
            <IframeBreaker />
            <BookingConversion />

            <Box sx={{ minHeight: "80vh", display: "flex", alignItems: "center", py: { xs: 6, md: 10 }, bgcolor: "#f8faff" }}>
                <Container maxWidth="sm">
                    {/* ── Hero ── */}
                    <Box sx={{ textAlign: "center", mb: 6 }}>
                        <CheckCircleOutlineIcon sx={{ fontSize: 72, color: "#6366f1", mb: 2 }} />
                        <Typography variant="h3" fontWeight={800} gutterBottom sx={{ color: "#1a1a1a" }}>
                            {"You're on the calendar!"}
                        </Typography>
                        <Typography variant="h6" sx={{ color: "#555", lineHeight: 1.7 }}>
                            {"Thanks for booking a demo with Pythias Technologies. We’re looking forward to showing you what the platform can do for your business."}
                        </Typography>
                    </Box>

                    <Divider sx={{ mb: 5 }} />

                    {/* ── Next steps ── */}
                    <Typography variant="overline" fontWeight={700} color="text.secondary" display="block" mb={3} letterSpacing={2}>
                        What happens next
                    </Typography>

                    <Box sx={{ display: "flex", flexDirection: "column", gap: 3, mb: 6 }}>
                        {NEXT_STEPS.map((step, i) => (
                            <Box key={i} sx={{ display: "flex", gap: 2.5, alignItems: "flex-start" }}>
                                <Box sx={{
                                    width: 52, height: 52, borderRadius: 2,
                                    bgcolor: "#eef2ff", display: "flex",
                                    alignItems: "center", justifyContent: "center", flexShrink: 0,
                                }}>
                                    {step.icon}
                                </Box>
                                <Box>
                                    <Typography fontWeight={700} gutterBottom>{step.title}</Typography>
                                    <Typography variant="body2" color="text.secondary" lineHeight={1.7}>{step.body}</Typography>
                                </Box>
                            </Box>
                        ))}
                    </Box>

                    <Divider sx={{ mb: 4 }} />

                    {/* ── CTA ── */}
                    <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                        <Button
                            component={Link}
                            href="/"
                            variant="contained"
                            size="large"
                            sx={{
                                bgcolor: "#6366f1", borderRadius: 2, fontWeight: 700,
                                "&:hover": { bgcolor: "#4f46e5" },
                            }}
                        >
                            Back to home
                        </Button>
                        <Button
                            component={Link}
                            href="/services"
                            variant="outlined"
                            size="large"
                            sx={{ borderRadius: 2, fontWeight: 700, borderColor: "#6366f1", color: "#6366f1" }}
                        >
                            Explore features
                        </Button>
                    </Box>
                </Container>
            </Box>
        </>
    );
}

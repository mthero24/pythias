import {
    Box, Container, Typography, Stack, Divider, Button,
} from "@mui/material";
import {
    RocketLaunch, Handshake, Visibility, EmojiObjects,
} from "@mui/icons-material";
import Link from "next/link";

export const metadata = {
    title: "About Us | Pythias Technologies",
    description: "Learn about Pythias Technologies — the team building the future of print-on-demand fulfillment software.",
};

const VALUES = [
    {
        icon: <RocketLaunch sx={{ fontSize: 28 }} />,
        color: "#D3A73D",
        title: "Built for Operators",
        desc: "We build software for the people on the floor — not just the people in the boardroom. Every feature starts with a real workflow problem.",
    },
    {
        icon: <Visibility sx={{ fontSize: 28 }} />,
        color: "#6366f1",
        title: "Full Visibility",
        desc: "You should always know where every order stands. We obsess over real-time data so nothing falls through the cracks.",
    },
    {
        icon: <Handshake sx={{ fontSize: 28 }} />,
        color: "#10b981",
        title: "Partnership First",
        desc: "We grow when our clients grow. That means honest pricing, responsive support, and building features that actually ship.",
    },
    {
        icon: <EmojiObjects sx={{ fontSize: 28 }} />,
        color: "#f59e0b",
        title: "Relentless Improvement",
        desc: "The print industry moves fast. We ship updates constantly and listen closely to the teams using our platform every day.",
    },
];

const STATS = [
    { value: "50+",    label: "Platform Integrations" },
    { value: "< 2 wks", label: "Average Onboarding" },
    { value: "24/7",   label: "Support Coverage" },
    { value: "100%",   label: "U.S.-Based Team" },
];

export default function AboutPage() {
    return (
        <Box sx={{ bgcolor: "#f8fafc", minHeight: "100vh" }}>

            {/* Hero */}
            <Box sx={{
                background: "linear-gradient(155deg, #0f172a 0%, #111827 55%, #0c1628 100%)",
                py: { xs: 10, md: 14 },
                position: "relative",
                overflow: "hidden",
            }}>
                <Box sx={{ position: "absolute", top: -100, right: -80, width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(211,167,61,0.12) 0%, transparent 65%)", pointerEvents: "none" }} />
                <Box sx={{ position: "absolute", bottom: -60, left: -40, width: 350, height: 350, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 65%)", pointerEvents: "none" }} />
                <Container maxWidth="lg" sx={{ position: "relative", textAlign: "center" }}>
                    <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#D3A73D", mb: 2 }}>
                        About Pythias Technologies
                    </Typography>
                    <Typography
                        variant="h1"
                        sx={{ fontSize: { xs: "2.4rem", md: "3.4rem" }, fontWeight: 800, color: "#fff", lineHeight: 1.12, letterSpacing: "-0.03em", mb: 3, maxWidth: 760, mx: "auto" }}
                    >
                        We built the platform we{" "}
                        <Box component="span" sx={{ background: "linear-gradient(90deg, #D3A73D, #f0c66a)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                            wished existed.
                        </Box>
                    </Typography>
                    <Typography sx={{ fontSize: { xs: "1rem", md: "1.15rem" }, color: "rgba(255,255,255,0.58)", lineHeight: 1.78, maxWidth: 620, mx: "auto" }}>
                        Pythias Technologies was founded by people who understand print fulfillment from the inside out.
                        We saw the chaos of disconnected tools, manual tracking, and missed orders — and built something better.
                    </Typography>
                </Container>
            </Box>

            {/* Stats bar */}
            <Box sx={{ bgcolor: "#fff", borderBottom: "1px solid #e5e7eb" }}>
                <Container maxWidth="lg">
                    <Stack
                        direction={{ xs: "grid", sm: "row" }}
                        sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4,1fr)" } }}
                        divider={<Divider orientation="vertical" flexItem sx={{ display: { xs: "none", md: "block" } }} />}
                    >
                        {STATS.map((s) => (
                            <Box key={s.label} sx={{ py: 4, px: 3, textAlign: "center" }}>
                                <Typography sx={{ fontSize: "2rem", fontWeight: 800, color: "#D3A73D", lineHeight: 1 }}>{s.value}</Typography>
                                <Typography sx={{ fontSize: "0.8rem", color: "#6b7280", fontWeight: 500, mt: 0.75 }}>{s.label}</Typography>
                            </Box>
                        ))}
                    </Stack>
                </Container>
            </Box>

            {/* Mission */}
            <Box sx={{ py: { xs: 8, md: 12 } }}>
                <Container maxWidth="lg">
                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: { xs: 6, md: 10 }, alignItems: "center" }}>
                        <Box>
                            <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#D3A73D", mb: 1.5 }}>
                                Our Mission
                            </Typography>
                            <Typography variant="h2" sx={{ fontSize: { xs: "1.8rem", md: "2.4rem" }, fontWeight: 800, color: "#111827", letterSpacing: "-0.02em", mb: 2.5, lineHeight: 1.2 }}>
                                Automate the work. Amplify the results.
                            </Typography>
                            <Typography sx={{ color: "#4b5563", lineHeight: 1.8, fontSize: "1.0625rem", mb: 2 }}>
                                Print shops are run by skilled people doing skilled work. But too much of their time gets eaten by
                                manual data entry, chasing order statuses, and stitching together spreadsheets.
                            </Typography>
                            <Typography sx={{ color: "#4b5563", lineHeight: 1.8, fontSize: "1.0625rem" }}>
                                Our mission is to give those hours back — by connecting your production floor, marketplaces, shipping
                                carriers, and team into one automated system that runs in the background while you focus on what you do best.
                            </Typography>
                        </Box>
                        <Box sx={{
                            bgcolor: "#0f172a",
                            borderRadius: 5,
                            p: { xs: 4, md: 6 },
                            position: "relative",
                            overflow: "hidden",
                        }}>
                            <Box sx={{ position: "absolute", top: -40, right: -40, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(211,167,61,0.18) 0%, transparent 70%)", pointerEvents: "none" }} />
                            <Typography sx={{ color: "rgba(255,255,255,0.45)", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", mb: 2 }}>
                                Southfield, MI
                            </Typography>
                            <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: { xs: "1.4rem", md: "1.75rem" }, lineHeight: 1.25, mb: 2 }}>
                                Headquartered in Michigan. Built for print shops everywhere.
                            </Typography>
                            <Divider sx={{ borderColor: "rgba(255,255,255,0.1)", my: 3 }} />
                            <Stack spacing={1.5}>
                                {[
                                    "21440 Melrose Ave, Southfield MI 48075",
                                    "(844) 579-8442",
                                    "info@pythiastechnologies.com",
                                ].map((line) => (
                                    <Typography key={line} sx={{ color: "rgba(255,255,255,0.65)", fontSize: "0.9rem" }}>
                                        {line}
                                    </Typography>
                                ))}
                            </Stack>
                        </Box>
                    </Box>
                </Container>
            </Box>

            {/* Values */}
            <Box sx={{ py: { xs: 8, md: 12 }, bgcolor: "#fff" }}>
                <Container maxWidth="lg">
                    <Box sx={{ textAlign: "center", mb: { xs: 6, lg: 8 } }}>
                        <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#D3A73D", mb: 1.5 }}>
                            What We Stand For
                        </Typography>
                        <Typography variant="h2" sx={{ fontSize: { xs: "2rem", md: "2.5rem" }, fontWeight: 800, color: "#111827", letterSpacing: "-0.02em" }}>
                            Our values
                        </Typography>
                    </Box>

                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 3 }}>
                        {VALUES.map((v) => (
                            <Box key={v.title} sx={{
                                border: "1px solid #e5e7eb", borderRadius: 4, p: 4,
                                transition: "box-shadow 0.2s, transform 0.2s",
                                "&:hover": { boxShadow: "0 8px 28px rgba(0,0,0,0.08)", transform: "translateY(-3px)" },
                            }}>
                                <Box sx={{
                                    width: 52, height: 52, borderRadius: 3, mb: 2.5,
                                    bgcolor: `${v.color}18`,
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    color: v.color,
                                }}>
                                    {v.icon}
                                </Box>
                                <Typography sx={{ fontWeight: 700, fontSize: "1.0625rem", color: "#111827", mb: 1 }}>
                                    {v.title}
                                </Typography>
                                <Typography sx={{ fontSize: "0.9rem", color: "#6b7280", lineHeight: 1.7 }}>
                                    {v.desc}
                                </Typography>
                            </Box>
                        ))}
                    </Box>
                </Container>
            </Box>

            {/* CTA */}
            <Box sx={{ py: { xs: 8, md: 12 }, bgcolor: "#f8fafc" }}>
                <Container maxWidth="md" sx={{ textAlign: "center" }}>
                    <Typography variant="h2" sx={{ fontSize: { xs: "2rem", md: "2.75rem" }, fontWeight: 800, color: "#111827", letterSpacing: "-0.02em", mb: 2 }}>
                        Ready to see it in action?
                    </Typography>
                    <Typography sx={{ color: "#6b7280", fontSize: "1.0625rem", lineHeight: 1.7, mb: 5, maxWidth: 520, mx: "auto" }}>
                        Book a free demo and we&apos;ll walk you through exactly how Pythias can fit your operation.
                    </Typography>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="center">
                        <Button
                            component={Link}
                            href="/#calendar-booking-section"
                            variant="contained"
                            size="large"
                            sx={{
                                bgcolor: "#D3A73D", color: "#111", fontWeight: 700, px: 4, py: 1.5, borderRadius: 2,
                                "&:hover": { bgcolor: "#b8860b", boxShadow: "0 6px 20px rgba(211,167,61,0.45)" },
                                boxShadow: "0 4px 16px rgba(211,167,61,0.35)",
                            }}
                        >
                            Book a Demo
                        </Button>
                        <Button
                            component={Link}
                            href="/contact"
                            variant="outlined"
                            size="large"
                            sx={{ borderColor: "#d1d5db", color: "#374151", fontWeight: 600, px: 4, py: 1.5, borderRadius: 2, "&:hover": { borderColor: "#9ca3af", bgcolor: "#f9fafb" } }}
                        >
                            Contact Us
                        </Button>
                    </Stack>
                </Container>
            </Box>

        </Box>
    );
}

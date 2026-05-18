import { Box, Container, Typography, Button, Stack, Chip, Divider } from "@mui/material";
import { ArrowBack, CalendarMonth } from "@mui/icons-material";
import Link from "next/link";

const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

export function ServiceHero({ label, title, subtitle, accent, icon, color = "#D3A73D" }) {
    return (
        <Box sx={{
            position: "relative", overflow: "hidden",
            background: "linear-gradient(155deg, #0f172a 0%, #111827 55%, #0c1628 100%)",
            py: { xs: 10, md: 14 }, px: 3,
        }}>
            <Box sx={{ position: "absolute", top: -100, right: -80, width: 500, height: 500, borderRadius: "50%", background: `radial-gradient(circle, ${color}22 0%, transparent 65%)`, pointerEvents: "none" }} />
            <Box sx={{ position: "absolute", bottom: -60, left: -40, width: 350, height: 350, borderRadius: "50%", background: `radial-gradient(circle, ${color}10 0%, transparent 65%)`, pointerEvents: "none" }} />
            <Container maxWidth="md" sx={{ position: "relative", textAlign: "center" }}>
                <Button
                    component={Link}
                    href="/services"
                    startIcon={<ArrowBack sx={{ fontSize: 16 }} />}
                    sx={{ color: "rgba(255,255,255,0.45)", mb: 4, fontSize: "0.82rem", "&:hover": { color: "#fff" } }}
                >
                    All Services
                </Button>
                <Box sx={{ fontSize: "3rem", mb: 2 }}>{icon}</Box>
                <Chip
                    label={label}
                    size="small"
                    sx={{ mb: 3, bgcolor: `${color}22`, color, border: `1px solid ${color}44`, fontWeight: 600, letterSpacing: "0.04em", fontSize: "0.72rem", textTransform: "uppercase" }}
                />
                <Typography variant="h1" sx={{ fontSize: { xs: "2.2rem", md: "3rem" }, fontWeight: 800, color: "#fff", lineHeight: 1.14, letterSpacing: "-0.03em", mb: 2.5 }}>
                    {title}{" "}
                    <Box component="span" sx={{ background: `linear-gradient(90deg, ${color}, #f0c66a)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                        {accent}
                    </Box>
                </Typography>
                <Typography sx={{ fontSize: "1.1rem", color: "rgba(255,255,255,0.58)", lineHeight: 1.78, maxWidth: 620, mx: "auto", mb: 5 }}>
                    {subtitle}
                </Typography>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="center">
                    <Button
                        component={Link}
                        href="/#calendar-booking-section"
                        variant="contained"
                        size="large"
                        startIcon={<CalendarMonth />}
                        sx={{ bgcolor: color, color: "#111", fontWeight: 700, px: 3.5, "&:hover": { bgcolor: color, filter: "brightness(0.88)", boxShadow: `0 6px 20px ${color}55` }, boxShadow: `0 4px 16px ${color}44` }}
                    >
                        Book a Demo
                    </Button>
                    <Button
                        component={Link}
                        href="/services"
                        variant="outlined"
                        size="large"
                        sx={{ borderColor: "rgba(255,255,255,0.25)", color: "#fff", px: 3.5, "&:hover": { borderColor: "#fff", bgcolor: "rgba(255,255,255,0.06)" } }}
                    >
                        View All Services
                    </Button>
                </Stack>
            </Container>
        </Box>
    );
}

export function ServiceFeatures({ features, color = "#D3A73D" }) {
    return (
        <Box sx={{ py: { xs: 8, md: 12 }, px: 3, background: "#fff" }}>
            <Container maxWidth="lg">
                <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color, mb: 1.5, textAlign: "center" }}>
                    Key Features
                </Typography>
                <Typography variant="h2" sx={{ fontSize: { xs: "1.8rem", md: "2.5rem" }, fontWeight: 800, color: "#111827", letterSpacing: "-0.02em", mb: 2, textAlign: "center" }}>
                    Everything included
                </Typography>
                <Typography sx={{ color: "#6b7280", maxWidth: 520, mx: "auto", lineHeight: 1.7, mb: 8, textAlign: "center" }}>
                    Built for real print shop workflows — every feature is designed around how your floor actually operates.
                </Typography>
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "1fr 1fr 1fr" }, gap: 3 }}>
                    {features.map((f) => (
                        <Box key={f.title} sx={{ display: "flex", gap: 2.5, alignItems: "flex-start" }}>
                            <Box sx={{ flexShrink: 0, width: 44, height: 44, borderRadius: 2.5, bgcolor: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", color, fontSize: "1.4rem" }}>
                                {f.icon}
                            </Box>
                            <Box>
                                <Typography sx={{ fontWeight: 700, fontSize: "0.9375rem", color: "#111827", mb: 0.5 }}>{f.title}</Typography>
                                <Typography sx={{ fontSize: "0.875rem", color: "#6b7280", lineHeight: 1.62 }}>{f.desc}</Typography>
                            </Box>
                        </Box>
                    ))}
                </Box>
            </Container>
        </Box>
    );
}

export function ServiceSteps({ steps, color = "#D3A73D" }) {
    return (
        <Box sx={{ py: { xs: 8, md: 12 }, px: 3, background: "#f8fafc" }}>
            <Container maxWidth="lg">
                <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color, mb: 1.5, textAlign: "center" }}>
                    How It Works
                </Typography>
                <Typography variant="h2" sx={{ fontSize: { xs: "1.8rem", md: "2.5rem" }, fontWeight: 800, color: "#111827", letterSpacing: "-0.02em", mb: 8, textAlign: "center" }}>
                    Simple from day one
                </Typography>
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: `repeat(${Math.min(steps.length, 4)}, 1fr)` }, gap: 4 }}>
                    {steps.map((step, i) => (
                        <Box key={step.title} sx={{ position: "relative" }}>
                            <Box sx={{
                                width: 48, height: 48, borderRadius: "50%",
                                background: `linear-gradient(135deg, ${color} 0%, #f0c66a 100%)`,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                color: "#111", fontWeight: 900, fontSize: "1rem", mb: 2.5,
                                boxShadow: `0 4px 16px ${color}44`,
                            }}>
                                {String(i + 1).padStart(2, "0")}
                            </Box>
                            <Typography sx={{ fontWeight: 700, fontSize: "1rem", color: "#111827", mb: 1 }}>{step.title}</Typography>
                            <Typography sx={{ fontSize: "0.9rem", color: "#6b7280", lineHeight: 1.65 }}>{step.desc}</Typography>
                        </Box>
                    ))}
                </Box>
            </Container>
        </Box>
    );
}

export function ServiceCTA({ title, sub, color = "#D3A73D" }) {
    return (
        <Box sx={{ py: { xs: 8, md: 12 }, px: 3, background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)", textAlign: "center" }}>
            <Container maxWidth="sm">
                <Typography variant="h2" sx={{ fontSize: { xs: "1.8rem", md: "2.5rem" }, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em", mb: 2 }}>
                    {title}
                </Typography>
                <Typography sx={{ color: "rgba(255,255,255,0.55)", lineHeight: 1.7, mb: 4, fontSize: "1.0625rem" }}>
                    {sub}
                </Typography>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="center">
                    <Button
                        component={Link}
                        href="/#calendar-booking-section"
                        variant="contained"
                        size="large"
                        sx={{ bgcolor: color, color: "#111", fontWeight: 700, px: 4, py: 1.5, "&:hover": { bgcolor: color, filter: "brightness(0.88)" }, boxShadow: `0 4px 16px ${color}44` }}
                    >
                        Book a Demo
                    </Button>
                    <Button
                        component={Link}
                        href="/#lead-capture-section"
                        variant="outlined"
                        size="large"
                        sx={{ borderColor: "rgba(255,255,255,0.25)", color: "#fff", px: 4, py: 1.5, "&:hover": { borderColor: "#fff", bgcolor: "rgba(255,255,255,0.06)" } }}
                    >
                        Get Early Access
                    </Button>
                </Stack>
            </Container>
        </Box>
    );
}

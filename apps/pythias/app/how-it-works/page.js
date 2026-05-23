import {
    Box, Container, Typography, Stack, Button,
    Accordion, AccordionSummary, AccordionDetails, Divider,
} from "@mui/material";
import {
    LinkRounded, SyncRounded, AutorenewRounded, TrendingUpRounded,
    CheckCircleOutline, ExpandMore,
} from "@mui/icons-material";
import Link from "next/link";

export const metadata = {
    title: "How It Works | Pythias Technologies",
    description: "Learn how Pythias Technologies gets your print-on-demand operation up and running in under two weeks — from equipment hookup to full automation.",
};

const STEPS = [
    {
        icon: <LinkRounded sx={{ fontSize: 30 }} />,
        title: "Connect Your Equipment",
        desc: "Integrate your Brother GTX printers, folding machines, and other production equipment in minutes using our guided setup wizard. Our team handles the technical side on-site.",
        details: [
            "On-site setup by our team",
            "Brother GTX & DTG printer support",
            "Folding machine integration",
            "Custom equipment on request",
        ],
    },
    {
        icon: <SyncRounded sx={{ fontSize: 30 }} />,
        title: "Sync Inventory & Listings",
        desc: "Connect all your marketplace accounts and sync product listings across Amazon, Etsy, Walmart, Shopify, TikTok, and more. Your inventory stays accurate across every channel automatically.",
        details: [
            "6+ marketplace connections",
            "Real-time inventory sync",
            "Listing management",
            "SKU mapping & routing",
        ],
    },
    {
        icon: <AutorenewRounded sx={{ fontSize: 30 }} />,
        title: "Automate Order Fulfillment",
        desc: "Orders automatically flow into production, get assigned to the right queue, printed and packed, then shipped with integrated USPS, FedEx, and UPS label generation — zero manual steps.",
        details: [
            "Auto order import from all channels",
            "Smart production queue routing",
            "Automated label generation",
            "Tracking synced back to marketplace",
        ],
    },
    {
        icon: <TrendingUpRounded sx={{ fontSize: 30 }} />,
        title: "Grow Your Business",
        desc: "Scale effortlessly with automated workflows, real-time analytics, and intelligent inventory management. The more orders you take, the more Pythias saves you time.",
        details: [
            "Unlimited order volume",
            "Analytics & reporting dashboard",
            "Team role management",
            "Ongoing support & updates",
        ],
    },
];

const TIMELINE = [
    { day: "Day 1–2",  label: "Kickoff & Account Setup",       desc: "We configure your account, connect your marketplaces, and map your SKUs." },
    { day: "Day 3–5",  label: "Equipment Integration",          desc: "Our team connects your printers and production equipment on-site." },
    { day: "Day 6–8",  label: "Order Flow Testing",             desc: "We run test orders through every channel to verify routing and labels." },
    { day: "Day 9–12", label: "Team Training",                  desc: "We train your operators, managers, and admin staff on the full platform." },
    { day: "Day 13–14", label: "Go Live",                       desc: "Flip the switch. Real orders flow through Pythias with our team on standby." },
];

const FAQS = [
    {
        question: "What printers are supported?",
        answer: "We specialize in Brother GTX printer integration, including the GTX series and DTG printers. We also support most popular folding machines and can integrate with other production equipment upon request.",
    },
    {
        question: "Does it work with Etsy, Amazon, and other marketplaces?",
        answer: "Yes. We integrate with all major marketplaces including Amazon, Etsy, Walmart, TikTok, Shopify, Kohl's, and more. Orders automatically sync and flow through your production workflow.",
    },
    {
        question: "How fast is onboarding?",
        answer: "Most customers are up and running within 1–2 weeks. Our team comes to your warehouse and handles the technical setup, printer integration, and marketplace connections. We provide full training and support throughout.",
    },
    {
        question: "What's included in the monthly fee?",
        answer: "Everything. Unlimited orders, all integrations, 24/7 support, software updates, printer connectivity, shipping software, inventory management, and analytics. No hidden fees or per-transaction costs.",
    },
    {
        question: "Do you provide technical support?",
        answer: "Yes, we provide 24/7 technical support via chat, email, phone, and dedicated Slack channels. Our team includes print production experts who understand your workflow and can help optimize your operations.",
    },
];

export default function HowItWorksPage() {
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
                        How It Works
                    </Typography>
                    <Typography
                        variant="h1"
                        sx={{ fontSize: { xs: "2.4rem", md: "3.4rem" }, fontWeight: 800, color: "#fff", lineHeight: 1.12, letterSpacing: "-0.03em", mb: 3, maxWidth: 720, mx: "auto" }}
                    >
                        Up and running in{" "}
                        <Box component="span" sx={{ background: "linear-gradient(90deg, #D3A73D, #f0c66a)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                            under two weeks.
                        </Box>
                    </Typography>
                    <Typography sx={{ fontSize: { xs: "1rem", md: "1.15rem" }, color: "rgba(255,255,255,0.58)", lineHeight: 1.78, maxWidth: 560, mx: "auto", mb: 5 }}>
                        Our team handles the setup — you focus on production. Here&apos;s exactly what the process looks like.
                    </Typography>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="center">
                        <Button
                            component={Link}
                            href="/#calendar-booking-section"
                            variant="contained"
                            size="large"
                            sx={{ bgcolor: "#D3A73D", color: "#111", fontWeight: 700, px: 4, py: 1.5, borderRadius: 2, "&:hover": { bgcolor: "#b8860b" }, boxShadow: "0 4px 16px rgba(211,167,61,0.35)" }}
                        >
                            Book a Demo
                        </Button>
                        <Button
                            component={Link}
                            href="/features"
                            variant="outlined"
                            size="large"
                            sx={{ borderColor: "rgba(255,255,255,0.25)", color: "#fff", fontWeight: 600, px: 4, py: 1.5, borderRadius: 2, "&:hover": { borderColor: "#fff", bgcolor: "rgba(255,255,255,0.06)" } }}
                        >
                            See All Features
                        </Button>
                    </Stack>
                </Container>
            </Box>

            {/* 4 Steps */}
            <Box sx={{ py: { xs: 8, md: 12 } }}>
                <Container maxWidth="lg">
                    <Box sx={{ textAlign: "center", mb: { xs: 6, lg: 8 } }}>
                        <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#D3A73D", mb: 1.5 }}>
                            The Process
                        </Typography>
                        <Typography variant="h2" sx={{ fontSize: { xs: "2rem", md: "2.5rem" }, fontWeight: 800, color: "#111827", letterSpacing: "-0.02em" }}>
                            Four steps to full automation.
                        </Typography>
                    </Box>

                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 3 }}>
                        {STEPS.map((step, i) => (
                            <Box key={step.title} sx={{
                                bgcolor: "#fff", border: "1px solid #e5e7eb", borderRadius: 4, p: 4,
                                transition: "box-shadow 0.2s, transform 0.2s",
                                "&:hover": { boxShadow: "0 8px 28px rgba(0,0,0,0.08)", transform: "translateY(-3px)" },
                            }}>
                                <Stack direction="row" spacing={2} alignItems="flex-start" mb={2.5}>
                                    <Box sx={{ flexShrink: 0, position: "relative" }}>
                                        <Box sx={{
                                            width: 56, height: 56, borderRadius: "50%",
                                            bgcolor: "rgba(211,167,61,0.1)",
                                            border: "1px solid rgba(211,167,61,0.25)",
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            color: "#D3A73D",
                                        }}>
                                            {step.icon}
                                        </Box>
                                        <Box sx={{
                                            position: "absolute", top: -8, right: -8,
                                            width: 22, height: 22, borderRadius: "50%",
                                            bgcolor: "#D3A73D",
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            fontSize: "0.65rem", fontWeight: 800, color: "#111",
                                        }}>
                                            {String(i + 1).padStart(2, "0")}
                                        </Box>
                                    </Box>
                                    <Box>
                                        <Typography sx={{ fontWeight: 700, fontSize: "1.0625rem", color: "#111827", mb: 0.75 }}>
                                            {step.title}
                                        </Typography>
                                        <Typography sx={{ fontSize: "0.875rem", color: "#6b7280", lineHeight: 1.65 }}>
                                            {step.desc}
                                        </Typography>
                                    </Box>
                                </Stack>
                                <Divider sx={{ my: 2 }} />
                                <Stack spacing={0.75}>
                                    {step.details.map((d) => (
                                        <Stack key={d} direction="row" spacing={1} alignItems="center">
                                            <CheckCircleOutline sx={{ fontSize: 16, color: "#10b981", flexShrink: 0 }} />
                                            <Typography sx={{ fontSize: "0.825rem", color: "#374151" }}>{d}</Typography>
                                        </Stack>
                                    ))}
                                </Stack>
                            </Box>
                        ))}
                    </Box>
                </Container>
            </Box>

            {/* Onboarding Timeline */}
            <Box sx={{ py: { xs: 8, md: 10 }, bgcolor: "#0f172a", position: "relative", overflow: "hidden" }}>
                <Box sx={{ position: "absolute", top: -60, right: -60, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(211,167,61,0.1) 0%, transparent 65%)", pointerEvents: "none" }} />
                <Container maxWidth="lg" sx={{ position: "relative" }}>
                    <Box sx={{ textAlign: "center", mb: { xs: 6, lg: 7 } }}>
                        <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#D3A73D", mb: 1.5 }}>
                            Onboarding Timeline
                        </Typography>
                        <Typography variant="h2" sx={{ fontSize: { xs: "2rem", md: "2.5rem" }, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>
                            What to expect, day by day.
                        </Typography>
                    </Box>

                    <Box sx={{ maxWidth: 720, mx: "auto" }}>
                        {TIMELINE.map((t, i) => (
                            <Stack key={t.day} direction="row" spacing={3} alignItems="flex-start" sx={{ mb: i < TIMELINE.length - 1 ? 0 : 0 }}>
                                {/* Line + dot */}
                                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                                    <Box sx={{
                                        width: 14, height: 14, borderRadius: "50%", bgcolor: "#D3A73D",
                                        border: "2px solid rgba(211,167,61,0.3)", mt: 0.5, flexShrink: 0,
                                    }} />
                                    {i < TIMELINE.length - 1 && (
                                        <Box sx={{ width: 2, flex: 1, bgcolor: "rgba(211,167,61,0.2)", my: 0.5, minHeight: 32 }} />
                                    )}
                                </Box>
                                <Box sx={{ pb: i < TIMELINE.length - 1 ? 3 : 0 }}>
                                    <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: "#D3A73D", letterSpacing: "0.05em", textTransform: "uppercase", mb: 0.25 }}>
                                        {t.day}
                                    </Typography>
                                    <Typography sx={{ fontWeight: 700, color: "#fff", fontSize: "1rem", mb: 0.5 }}>
                                        {t.label}
                                    </Typography>
                                    <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.875rem", lineHeight: 1.65 }}>
                                        {t.desc}
                                    </Typography>
                                </Box>
                            </Stack>
                        ))}
                    </Box>
                </Container>
            </Box>

            {/* FAQ */}
            <Box sx={{ py: { xs: 8, md: 12 }, bgcolor: "#fff" }}>
                <Container maxWidth="md">
                    <Box sx={{ textAlign: "center", mb: { xs: 5, lg: 7 } }}>
                        <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#D3A73D", mb: 1.5 }}>
                            FAQ
                        </Typography>
                        <Typography variant="h2" sx={{ fontSize: { xs: "2rem", md: "2.5rem" }, fontWeight: 800, color: "#111827", letterSpacing: "-0.02em", mb: 2 }}>
                            Common questions.
                        </Typography>
                        <Typography sx={{ color: "#6b7280", fontSize: "1.0625rem" }}>
                            Everything you need to know about getting started with Pythias.
                        </Typography>
                    </Box>

                    <Box>
                        {FAQS.map((faq) => (
                            <Accordion
                                key={faq.question}
                                sx={{
                                    mb: 2, border: "1px solid #e5e7eb",
                                    borderRadius: "12px !important",
                                    "&:before": { display: "none" },
                                    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                                }}
                            >
                                <AccordionSummary expandIcon={<ExpandMore />} sx={{ px: 3, py: 1.5 }}>
                                    <Typography sx={{ fontWeight: 600, color: "#111827", fontSize: "1rem" }}>
                                        {faq.question}
                                    </Typography>
                                </AccordionSummary>
                                <AccordionDetails sx={{ px: 3, pb: 2.5 }}>
                                    <Typography sx={{ color: "#6b7280", lineHeight: 1.75 }}>
                                        {faq.answer}
                                    </Typography>
                                </AccordionDetails>
                            </Accordion>
                        ))}
                    </Box>
                </Container>
            </Box>

            {/* CTA */}
            <Box sx={{ py: { xs: 8, md: 12 }, bgcolor: "#f8fafc" }}>
                <Container maxWidth="md" sx={{ textAlign: "center" }}>
                    <Typography variant="h2" sx={{ fontSize: { xs: "2rem", md: "2.75rem" }, fontWeight: 800, color: "#111827", letterSpacing: "-0.02em", mb: 2 }}>
                        Ready to get started?
                    </Typography>
                    <Typography sx={{ color: "#6b7280", fontSize: "1.0625rem", lineHeight: 1.7, mb: 5, maxWidth: 500, mx: "auto" }}>
                        Book a free demo and we&apos;ll walk through exactly how Pythias fits your operation — no commitment required.
                    </Typography>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="center">
                        <Button
                            component={Link}
                            href="/#calendar-booking-section"
                            variant="contained"
                            size="large"
                            sx={{ bgcolor: "#D3A73D", color: "#111", fontWeight: 700, px: 4, py: 1.5, borderRadius: 2, "&:hover": { bgcolor: "#b8860b", boxShadow: "0 6px 20px rgba(211,167,61,0.45)" }, boxShadow: "0 4px 16px rgba(211,167,61,0.35)" }}
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

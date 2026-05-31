import { Box, Container, Typography, Stack, Button, Divider } from "@mui/material";
import {
    PrintRounded, LocalShippingRounded, InventoryRounded, StorefrontRounded,
    BarChartRounded, GroupsRounded, LabelRounded, TrackChangesRounded,
    IntegrationInstructionsRounded, SupportAgentRounded, LockRounded, DevicesRounded,
} from "@mui/icons-material";
import Link from "next/link";

export const metadata = {
    title: "Features",
    description: "Explore all the features of the Pythias print-on-demand fulfillment platform — production, shipping, inventory, marketplaces, analytics, and more.",
    alternates: { canonical: "https://pythiastechnologies.com/features" },
};

const CORE_FEATURES = [
    {
        icon: <PrintRounded sx={{ fontSize: 30 }} />,
        color: "#D3A73D",
        title: "Production Queue Management",
        desc: "DTF, embroidery, sublimation, and screen print queues organized by deadline, type, and priority. Your floor always knows exactly what to work on next.",
        bullets: ["Priority-based queue sorting", "Print type routing", "Deadline tracking", "Multi-station support"],
    },
    {
        icon: <LocalShippingRounded sx={{ fontSize: 30 }} />,
        color: "#6366f1",
        title: "Shipping & Carrier Integration",
        desc: "Auto-generate USPS, FedEx, and UPS labels the moment an order ships. Tracking numbers sync back to every marketplace automatically — no copy-paste.",
        bullets: ["USPS, FedEx & UPS", "Batch label printing", "Auto tracking sync", "Rate comparison"],
    },
    {
        icon: <InventoryRounded sx={{ fontSize: 30 }} />,
        color: "#10b981",
        title: "Inventory & Stock Control",
        desc: "Real-time blank inventory tracking with automated reorder alerts. Always know what's in stock before orders hit your floor.",
        bullets: ["Real-time stock levels", "Reorder alerts", "Supplier management", "SKU tracking"],
    },
    {
        icon: <StorefrontRounded sx={{ fontSize: 30 }} />,
        color: "#ef4444",
        title: "Multi-Marketplace Orders",
        desc: "Amazon, Etsy, Walmart, TikTok, Shopify, and Kohl's — all orders unified in a single production view. One dashboard, every channel.",
        bullets: ["6+ marketplace integrations", "Unified order view", "Auto order import", "Channel tagging"],
    },
    {
        icon: <BarChartRounded sx={{ fontSize: 30 }} />,
        color: "#8b5cf6",
        title: "Analytics & Reporting",
        desc: "Daily output reports, line efficiency metrics, order status dashboards, and custom date-range exports to track what matters most.",
        bullets: ["Production output reports", "Efficiency metrics", "Custom date ranges", "CSV exports"],
    },
    {
        icon: <GroupsRounded sx={{ fontSize: 30 }} />,
        color: "#14b8a6",
        title: "Team Collaboration",
        desc: "Built-in messaging, role-based access, activity logs, and shift management keep your entire floor aligned — from operators to managers.",
        bullets: ["Role-based access", "Activity logs", "Built-in messaging", "Shift management"],
    },
    {
        icon: <LabelRounded sx={{ fontSize: 30 }} />,
        color: "#f59e0b",
        title: "Label & Barcode Printing",
        desc: "Print production labels, packing slips, and barcodes for any order directly from your dashboard. No third-party tools needed.",
        bullets: ["Production labels", "Packing slips", "Barcode generation", "Bulk printing"],
    },
    {
        icon: <TrackChangesRounded sx={{ fontSize: 30 }} />,
        color: "#3b82f6",
        title: "Order Tracking & Visibility",
        desc: "Real-time tracking from production start to delivery. Every person on your team — and every marketplace — always knows where an order stands.",
        bullets: ["Real-time status updates", "Production milestones", "Customer-facing tracking", "Exception alerts"],
    },
];

const PLATFORM_FEATURES = [
    {
        icon: <IntegrationInstructionsRounded sx={{ fontSize: 26 }} />,
        color: "#6366f1",
        title: "50+ Integrations",
        desc: "Printers, carriers, marketplaces, and tools — all connected out of the box.",
    },
    {
        icon: <SupportAgentRounded sx={{ fontSize: 26 }} />,
        color: "#10b981",
        title: "24/7 Support",
        desc: "Chat, email, phone, and dedicated Slack channels staffed by print production experts.",
    },
    {
        icon: <LockRounded sx={{ fontSize: 26 }} />,
        color: "#D3A73D",
        title: "Role-Based Security",
        desc: "Control exactly what each team member can see and do across your entire operation.",
    },
    {
        icon: <DevicesRounded sx={{ fontSize: 26 }} />,
        color: "#ef4444",
        title: "Works on Any Device",
        desc: "Access your dashboard from the production floor, the office, or anywhere else.",
    },
];

const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Pythias Technologies",
    applicationCategory: "BusinessApplication",
    description: "All-in-one print-on-demand fulfillment platform — production queues, shipping automation, inventory management, multi-marketplace integration, analytics, and team tools.",
    featureList: CORE_FEATURES.map(f => f.title).join(", "),
    offers: { "@type": "Offer", seller: { "@type": "Organization", name: "Pythias Technologies" } },
    url: "https://pythiastechnologies.com/features",
};

const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home",     item: "https://pythiastechnologies.com" },
        { "@type": "ListItem", position: 2, name: "Features", item: "https://pythiastechnologies.com/features" },
    ],
};

export default function FeaturesPage() {
    return (
        <Box sx={{ bgcolor: "#f8fafc", minHeight: "100vh" }}>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

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
                        Platform Features
                    </Typography>
                    <Typography
                        variant="h1"
                        sx={{ fontSize: { xs: "2.4rem", md: "3.4rem" }, fontWeight: 800, color: "#fff", lineHeight: 1.12, letterSpacing: "-0.03em", mb: 3, maxWidth: 760, mx: "auto" }}
                    >
                        Everything you need to run{" "}
                        <Box component="span" sx={{ background: "linear-gradient(90deg, #D3A73D, #f0c66a)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                            your print shop.
                        </Box>
                    </Typography>
                    <Typography sx={{ fontSize: { xs: "1rem", md: "1.15rem" }, color: "rgba(255,255,255,0.58)", lineHeight: 1.78, maxWidth: 580, mx: "auto", mb: 5 }}>
                        Powerful features designed to automate every aspect of your workflow — from first order to final delivery.
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
                            href="/contact"
                            variant="outlined"
                            size="large"
                            sx={{ borderColor: "rgba(255,255,255,0.25)", color: "#fff", fontWeight: 600, px: 4, py: 1.5, borderRadius: 2, "&:hover": { borderColor: "#fff", bgcolor: "rgba(255,255,255,0.06)" } }}
                        >
                            Talk to Sales
                        </Button>
                    </Stack>
                </Container>
            </Box>

            {/* Core Features */}
            <Box sx={{ py: { xs: 8, md: 12 } }}>
                <Container maxWidth="lg">
                    <Box sx={{ textAlign: "center", mb: { xs: 6, lg: 8 } }}>
                        <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#D3A73D", mb: 1.5 }}>
                            Core Features
                        </Typography>
                        <Typography variant="h2" sx={{ fontSize: { xs: "2rem", md: "2.5rem" }, fontWeight: 800, color: "#111827", letterSpacing: "-0.02em", mb: 2 }}>
                            Built for every part of your operation.
                        </Typography>
                        <Typography sx={{ color: "#6b7280", maxWidth: 540, mx: "auto", lineHeight: 1.7, fontSize: "1.0625rem" }}>
                            From the moment an order comes in to the moment it ships, Pythias handles it.
                        </Typography>
                    </Box>

                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 3 }}>
                        {CORE_FEATURES.map((f) => (
                            <Box key={f.title} sx={{
                                bgcolor: "#fff", border: "1px solid #e5e7eb", borderRadius: 4, p: 4,
                                transition: "box-shadow 0.2s, transform 0.2s",
                                "&:hover": { boxShadow: "0 8px 28px rgba(0,0,0,0.08)", transform: "translateY(-3px)" },
                            }}>
                                <Stack direction="row" spacing={2} alignItems="flex-start" mb={2}>
                                    <Box sx={{
                                        width: 52, height: 52, borderRadius: 3, flexShrink: 0,
                                        bgcolor: `${f.color}18`,
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        color: f.color,
                                    }}>
                                        {f.icon}
                                    </Box>
                                    <Box>
                                        <Typography sx={{ fontWeight: 700, fontSize: "1.0625rem", color: "#111827", mb: 0.5 }}>
                                            {f.title}
                                        </Typography>
                                        <Typography sx={{ fontSize: "0.875rem", color: "#6b7280", lineHeight: 1.65 }}>
                                            {f.desc}
                                        </Typography>
                                    </Box>
                                </Stack>
                                <Divider sx={{ my: 2 }} />
                                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
                                    {f.bullets.map((b) => (
                                        <Stack key={b} direction="row" spacing={0.75} alignItems="center">
                                            <Box sx={{ width: 5, height: 5, borderRadius: "50%", bgcolor: f.color, flexShrink: 0 }} />
                                            <Typography sx={{ fontSize: "0.8rem", color: "#374151" }}>{b}</Typography>
                                        </Stack>
                                    ))}
                                </Box>
                            </Box>
                        ))}
                    </Box>
                </Container>
            </Box>

            {/* Platform-wide features */}
            <Box sx={{ py: { xs: 8, md: 10 }, bgcolor: "#0f172a", position: "relative", overflow: "hidden" }}>
                <Box sx={{ position: "absolute", top: -60, right: -60, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(211,167,61,0.1) 0%, transparent 65%)", pointerEvents: "none" }} />
                <Container maxWidth="lg" sx={{ position: "relative" }}>
                    <Box sx={{ textAlign: "center", mb: { xs: 6, lg: 7 } }}>
                        <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#D3A73D", mb: 1.5 }}>
                            Platform-Wide
                        </Typography>
                        <Typography variant="h2" sx={{ fontSize: { xs: "2rem", md: "2.5rem" }, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>
                            Built to support your whole team.
                        </Typography>
                    </Box>
                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "repeat(4,1fr)" }, gap: 3 }}>
                        {PLATFORM_FEATURES.map((f) => (
                            <Box key={f.title} sx={{
                                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
                                borderRadius: 4, p: 3.5, textAlign: "center",
                                transition: "background 0.2s",
                                "&:hover": { background: "rgba(255,255,255,0.07)" },
                            }}>
                                <Box sx={{
                                    width: 52, height: 52, borderRadius: 3, mx: "auto", mb: 2,
                                    bgcolor: `${f.color}20`,
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    color: f.color,
                                }}>
                                    {f.icon}
                                </Box>
                                <Typography sx={{ fontWeight: 700, color: "#fff", fontSize: "1rem", mb: 1 }}>{f.title}</Typography>
                                <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.875rem", lineHeight: 1.65 }}>{f.desc}</Typography>
                            </Box>
                        ))}
                    </Box>
                </Container>
            </Box>

            {/* CTA */}
            <Box sx={{ py: { xs: 8, md: 12 }, bgcolor: "#f8fafc" }}>
                <Container maxWidth="md" sx={{ textAlign: "center" }}>
                    <Typography variant="h2" sx={{ fontSize: { xs: "2rem", md: "2.75rem" }, fontWeight: 800, color: "#111827", letterSpacing: "-0.02em", mb: 2 }}>
                        See every feature live.
                    </Typography>
                    <Typography sx={{ color: "#6b7280", fontSize: "1.0625rem", lineHeight: 1.7, mb: 5, maxWidth: 500, mx: "auto" }}>
                        Book a free demo and we&apos;ll walk through exactly how Pythias fits your workflow — no commitment required.
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
                            href="/how-it-works"
                            variant="outlined"
                            size="large"
                            sx={{ borderColor: "#d1d5db", color: "#374151", fontWeight: 600, px: 4, py: 1.5, borderRadius: 2, "&:hover": { borderColor: "#9ca3af", bgcolor: "#f9fafb" } }}
                        >
                            How It Works
                        </Button>
                    </Stack>
                </Container>
            </Box>

        </Box>
    );
}

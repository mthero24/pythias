import { Box, Container, Typography, Card, CardContent, Button, Chip } from "@mui/material";
import { ArrowForward } from "@mui/icons-material";
import Link from "next/link";

export const metadata = {
    title: "Services | Pythias Technologies — Print-on-Demand Automation Platform",
    description: "Explore Pythias Technologies' full suite of print-on-demand automation services: production queue management, shipping integration, inventory control, multi-marketplace sync, analytics, team tools, and label printing.",
    keywords: "print on demand software, DTF queue management, shipping label automation, inventory management, multi-marketplace integration, Shopify fulfillment, Etsy fulfillment, Amazon fulfillment, print shop software",
    openGraph: {
        title: "Services | Pythias Technologies",
        description: "The complete platform for print-on-demand operations — from production floor to shipping carrier.",
        type: "website",
        url: "https://pythiastechnologies.com/services",
    },
    alternates: { canonical: "https://pythiastechnologies.com/services" },
};

const SERVICES = [
    {
        href: "/services/production",
        icon: "🖨️",
        color: "#D3A73D",
        tag: "Production",
        title: "Production Queue Management",
        desc: "Manage DTF, embroidery, sublimation, and screen print queues with automated job routing, deadline tracking, and Brother GTX printer integration.",
        highlights: ["DTF & Embroidery queues", "Heat press settings", "Batch processing", "Brother GTX integration"],
    },
    {
        href: "/services/shipping",
        icon: "🚚",
        color: "#6366f1",
        tag: "Shipping",
        title: "Shipping & Fulfillment",
        desc: "Auto-generate USPS, FedEx, and UPS labels the moment an order completes. Sync tracking back to every marketplace automatically — no manual steps.",
        highlights: ["USPS, FedEx & UPS labels", "Auto-tracking sync", "Batch shipping", "Rate comparison"],
    },
    {
        href: "/services/inventory",
        icon: "📦",
        color: "#10b981",
        tag: "Inventory",
        title: "Inventory Management",
        desc: "Real-time blank inventory tracking across all SKUs. Automated reorder alerts, supplier management, and low-stock notifications prevent costly stockouts.",
        highlights: ["Real-time stock levels", "Automated reorders", "Supplier management", "Multi-location support"],
    },
    {
        href: "/services/marketplace",
        icon: "🛒",
        color: "#ef4444",
        tag: "Marketplace",
        title: "Multi-Marketplace Integration",
        desc: "One dashboard for every channel — Shopify, Amazon, Etsy, Walmart, TikTok Shop, and Kohl's. Orders route to production automatically.",
        highlights: ["Shopify, Amazon, Etsy", "TikTok Shop & Walmart", "Auto order routing", "Listing sync"],
    },
    {
        href: "/services/analytics",
        icon: "📊",
        color: "#8b5cf6",
        tag: "Analytics",
        title: "Analytics & Reporting",
        desc: "Daily output reports, line efficiency metrics, marketplace revenue breakdowns, and custom date-range exports — all in real time.",
        highlights: ["Daily output reports", "Line efficiency KPIs", "Revenue by channel", "Custom exports"],
    },
    {
        href: "/services/team",
        icon: "👥",
        color: "#14b8a6",
        tag: "Team",
        title: "Team & Collaboration",
        desc: "Role-based access, built-in messaging, time tracking, badge scanning login, and activity logs to keep every shift running smoothly.",
        highlights: ["Role-based access", "Built-in messaging", "Time tracking", "Badge scan login"],
    },
    {
        href: "/services/labels",
        icon: "🏷️",
        color: "#f59e0b",
        tag: "Labels",
        title: "Label & Barcode Printing",
        desc: "Print production labels, packing slips, barcodes, and QR codes for any order directly from the dashboard — no third-party tools needed.",
        highlights: ["Production labels", "Packing slips", "Barcode & QR codes", "Bulk label printing"],
    },
    {
        href: "/services/design",
        icon: "🎨",
        color: "#ec4899",
        tag: "Design",
        title: "Design & Product Management",
        desc: "Create, organize, and publish your entire product design library from one place. Approval workflows, version control, and one-click push to every connected marketplace.",
        highlights: ["Design library & versioning", "Approval workflows", "SKU & variant mapping", "One-click marketplace publish"],
    },
    {
        href: "/services/image-creation",
        icon: "🤖",
        color: "#0ea5e9",
        tag: "Automation",
        title: "Automated Product Image Creation",
        desc: "AI-powered mockup generation across every product, color, and size variant — the moment a design is uploaded. No manual compositing, no third-party tools.",
        highlights: ["AI mockup generation", "Bulk variant rendering", "Background removal", "Direct listing export"],
    },
];

export default function ServicesPage() {
    return (
        <Box sx={{ bgcolor: "#fff", minHeight: "100vh" }}>
            {/* Hero */}
            <Box sx={{
                position: "relative", overflow: "hidden",
                background: "linear-gradient(155deg, #0f172a 0%, #111827 55%, #0c1628 100%)",
                py: { xs: 10, md: 14 }, px: 3, textAlign: "center",
            }}>
                <Box sx={{ position: "absolute", top: -80, right: -80, width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(211,167,61,0.12) 0%, transparent 65%)", pointerEvents: "none" }} />
                <Container maxWidth="md" sx={{ position: "relative" }}>
                    <Chip label="Our Services" size="small" sx={{ mb: 3, bgcolor: "rgba(211,167,61,0.15)", color: "#D3A73D", border: "1px solid rgba(211,167,61,0.3)", fontWeight: 600, letterSpacing: "0.05em", fontSize: "0.72rem", textTransform: "uppercase" }} />
                    <Typography variant="h1" sx={{ fontSize: { xs: "2.4rem", md: "3.25rem" }, fontWeight: 800, color: "#fff", lineHeight: 1.12, letterSpacing: "-0.03em", mb: 2.5 }}>
                        Everything your print shop needs,{" "}
                        <Box component="span" sx={{ background: "linear-gradient(90deg, #D3A73D, #f0c66a)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                            built in.
                        </Box>
                    </Typography>
                    <Typography sx={{ fontSize: "1.1rem", color: "rgba(255,255,255,0.58)", lineHeight: 1.78, maxWidth: 580, mx: "auto" }}>
                        Pythias Technologies covers every part of your operation — from the moment an order lands to the moment it ships.
                    </Typography>
                </Container>
            </Box>

            {/* Service cards */}
            <Container maxWidth="lg" sx={{ py: { xs: 8, md: 12 } }}>
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr", lg: "1fr 1fr 1fr" }, gap: 3 }}>
                    {SERVICES.map((s) => (
                        <Card
                            key={s.href}
                            component={Link}
                            href={s.href}
                            variant="outlined"
                            sx={{
                                textDecoration: "none", display: "flex", flexDirection: "column",
                                borderRadius: 4, border: "1px solid #f3f4f6",
                                transition: "box-shadow 0.2s, transform 0.2s, border-color 0.2s",
                                "&:hover": { boxShadow: "0 12px 40px rgba(0,0,0,0.1)", transform: "translateY(-4px)", borderColor: s.color },
                            }}
                        >
                            <CardContent sx={{ p: 3.5, flex: 1, display: "flex", flexDirection: "column" }}>
                                <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 2 }}>
                                    <Box sx={{ fontSize: "2rem" }}>{s.icon}</Box>
                                    <Chip label={s.tag} size="small" sx={{ bgcolor: `${s.color}18`, color: s.color, fontWeight: 600, fontSize: "0.7rem" }} />
                                </Box>
                                <Typography sx={{ fontWeight: 800, fontSize: "1.0625rem", color: "#111827", mb: 1.25 }}>{s.title}</Typography>
                                <Typography sx={{ fontSize: "0.875rem", color: "#6b7280", lineHeight: 1.65, mb: 2.5, flex: 1 }}>{s.desc}</Typography>
                                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mb: 2.5 }}>
                                    {s.highlights.map((h) => (
                                        <Chip key={h} label={h} size="small" sx={{ bgcolor: "#f8fafc", color: "#374151", fontSize: "0.7rem", border: "1px solid #e5e7eb" }} />
                                    ))}
                                </Box>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, color: s.color, fontWeight: 700, fontSize: "0.875rem" }}>
                                    Learn more <ArrowForward sx={{ fontSize: 16 }} />
                                </Box>
                            </CardContent>
                        </Card>
                    ))}
                </Box>
            </Container>

            {/* Bottom CTA */}
            <Box sx={{ py: { xs: 8, md: 10 }, px: 3, background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)", textAlign: "center" }}>
                <Container maxWidth="sm">
                    <Typography variant="h2" sx={{ fontSize: { xs: "1.8rem", md: "2.25rem" }, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em", mb: 2 }}>
                        Ready to see it in action?
                    </Typography>
                    <Typography sx={{ color: "rgba(255,255,255,0.55)", lineHeight: 1.7, mb: 4 }}>
                        Book a demo and we&apos;ll walk you through the platform with your actual workflow in mind.
                    </Typography>
                    <Button component={Link} href="/#calendar-booking-section" variant="contained" size="large" sx={{ bgcolor: "#D3A73D", color: "#111", fontWeight: 700, px: 4, py: 1.5, "&:hover": { bgcolor: "#b8860b" }, boxShadow: "0 4px 16px rgba(211,167,61,0.4)" }}>
                        Book a Demo
                    </Button>
                </Container>
            </Box>
        </Box>
    );
}

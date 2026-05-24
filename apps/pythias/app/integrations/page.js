import { Box, Container, Typography, Chip, Grid, Card, CardContent, Button } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import Link from "next/link";

export const metadata = {
    title: "Integrations | Pythias Technologies — Connect Every Channel You Sell On",
    description: "Pythias connects your print-on-demand fulfillment to Amazon, Walmart, eBay, Etsy, Shopify, TikTok Shop, Faire, SHEIN, Temu, Noon, bol.com, and more — with automatic order sync and shipping confirmation.",
    keywords: "print on demand integrations, Amazon fulfillment, Walmart marketplace, eBay seller, Etsy fulfillment, Shopify print on demand, TikTok Shop, Faire wholesale, SHEIN vendor, marketplace integration",
    openGraph: {
        title: "Integrations | Pythias Technologies",
        description: "Connect your print-on-demand operation to every marketplace — automatic order sync, production routing, and shipping confirmation.",
        type: "website",
        url: "https://pythiastechnologies.com/integrations",
    },
    alternates: { canonical: "https://pythiastechnologies.com/integrations" },
};

// ─── Integration data ─────────────────────────────────────────────────────────
const CATEGORIES = [
    {
        label: "Major Marketplaces",
        description: "The largest US and global shopping destinations, fully automated.",
        integrations: [
            {
                name: "Amazon",
                logo: "/amazon.png",
                logoBg: null,
                status: "live",
                description: "Pull orders, route to production, and confirm shipment via SP-API. Supports FBM and multi-channel fulfillment.",
                highlight: "SP-API",
            },
            {
                name: "Walmart",
                logo: "/walmart.png",
                logoBg: null,
                status: "live",
                description: "Sync orders, acknowledge, and confirm shipment on Walmart Marketplace. Includes listing management and feed tracking.",
                highlight: "Full API",
            },
            {
                name: "eBay",
                logo: "/ebay.svg",
                logoBg: null,
                status: "live",
                description: "Pull unfulfilled eBay orders and confirm shipments via the eBay Sell Fulfillment API. OAuth-based, no manual CSV.",
                highlight: "Sell API",
            },
            {
                name: "Target Plus",
                logo: "/target-logo.png",
                logoBg: null,
                status: "live",
                description: "Receive and fulfill Target Plus marketplace orders with acknowledgment, shipment confirmation, and tracking sync.",
                highlight: "Direct API",
            },
        ],
    },
    {
        label: "Boutique & Handmade",
        description: "Curated marketplaces for independent sellers and handmade goods.",
        integrations: [
            {
                name: "Etsy",
                logo: "/etsy.jpeg",
                logoBg: null,
                status: "live",
                description: "Pull open Etsy receipts, mark orders as shipped with tracking, and sync fulfillment status — all via OAuth.",
                highlight: "OAuth API",
            },
            {
                name: "Faire",
                logo: "/faire.svg",
                logoBg: null,
                status: "live",
                description: "Accept wholesale Faire orders, confirm shipments with tracking, and sync inventory levels across your catalog.",
                highlight: "Wholesale",
            },
        ],
    },
    {
        label: "Social Commerce",
        description: "Sell where your customers are scrolling.",
        integrations: [
            {
                name: "TikTok Shop",
                logo: "/tiktok.jpeg",
                logoBg: null,
                status: "live",
                description: "Connect your TikTok Shop seller account and route orders directly into your production queue for fulfillment.",
                highlight: "Shop API",
            },
            {
                name: "SHEIN",
                logo: "/shein.svg",
                logoBg: null,
                status: "live",
                description: "Receive SHEIN Open Platform orders, print and ship, then confirm fulfillment — all automated from one dashboard.",
                highlight: "Open Platform",
            },
            {
                name: "Temu",
                logo: "/temu.svg",
                logoBg: null,
                status: "live",
                description: "Pull Temu Partner Open Platform orders and confirm shipments with carrier and tracking number automatically.",
                highlight: "POP API",
            },
        ],
    },
    {
        label: "Your Own Store",
        description: "Bring your D2C storefront into the same production workflow.",
        integrations: [
            {
                name: "Shopify",
                logo: "/Shopify_logo_2018.png",
                logoBg: "#96bf48",
                status: "live",
                description: "Install the Pythias Shopify app and every new order flows into production automatically — no copy-paste, no CSV.",
                highlight: "App Store",
                href: "https://apps.shopify.com/pythias-app",
            },
            {
                name: "Acenda",
                logo: "/etsy.jpeg", // placeholder — Acenda logo not publicly available
                logoBg: "#1565C0",
                status: "live",
                description: "Sync your Acenda catalog and receive orders via the Acenda Ship Advice API with automatic acknowledgment.",
                highlight: "Ship Advice",
            },
        ],
    },
    {
        label: "Multi-Marketplace Platforms",
        description: "One connection that unlocks dozens of channels at once.",
        integrations: [
            {
                name: "Mirakl",
                logo: "/mirakl.png",
                logoBg: "#03182f",
                status: "live",
                description: "A single Mirakl connection opens Best Buy (US & Canada), Bloomingdale's, Carrefour, Castorama, Fnac, Conrad, Bunnings, and more.",
                highlight: "50+ Markets",
            },
        ],
    },
    {
        label: "International Marketplaces",
        description: "Reach buyers across the Middle East and Europe.",
        integrations: [
            {
                name: "Noon",
                logo: "/noon.svg",
                logoBg: null,
                status: "live",
                description: "Sell across UAE, Saudi Arabia, and Egypt on Noon — orders pull automatically and shipment confirmation syncs back.",
                highlight: "UAE · SA · EG",
            },
            {
                name: "bol.com",
                logo: "/bol.svg",
                logoBg: null,
                status: "live",
                description: "The leading marketplace in the Netherlands and Belgium. OAuth2 integration with PostNL, DPD, DHL, and more carriers.",
                highlight: "NL · BE",
            },
        ],
    },
    {
        label: "Coming Soon",
        description: "On our roadmap — integrations we're building or evaluating.",
        integrations: [
            {
                name: "Zulily",
                logoText: "Z",
                logoBg: "#7c3aed",
                status: "soon",
                description: "Zulily relaunched in 2024 under new ownership. Integration routes through the Rithum/DSCO platform — in evaluation.",
                highlight: "Rithum/DSCO",
            },
            {
                name: "Macy's",
                logoText: "M",
                logoBg: "#cc0000",
                status: "soon",
                description: "Powered by Mirakl — available when you connect your Mirakl integration and configure the Macy's seller portal.",
                highlight: "via Mirakl",
            },
            {
                name: "Nordstrom",
                logoText: "N",
                logoBg: "#111827",
                status: "soon",
                description: "Nordstrom's marketplace runs on Mirakl, making it accessible through your existing Mirakl connection.",
                highlight: "via Mirakl",
            },
        ],
    },
];

// ─── Integration card ─────────────────────────────────────────────────────────
function IntegrationCard({ name, logo, logoText, logoBg, status, description, highlight, href }) {
    const isLive = status === "live";

    const card = (
        <Card
            variant="outlined"
            sx={{
                height: "100%",
                borderRadius: 2.5,
                border: isLive ? "1px solid #e5e7eb" : "1px dashed #d1d5db",
                opacity: isLive ? 1 : 0.7,
                transition: "box-shadow 0.2s, transform 0.2s",
                ...(isLive && {
                    "&:hover": {
                        boxShadow: "0 6px 24px rgba(0,0,0,0.1)",
                        transform: "translateY(-3px)",
                    },
                }),
            }}
        >
            <CardContent sx={{ p: 2.5, height: "100%", display: "flex", flexDirection: "column" }}>
                {/* Logo */}
                <Box sx={{
                    height: 56, mb: 2, display: "flex", alignItems: "center", justifyContent: "center",
                    bgcolor: logoBg ?? "transparent", borderRadius: logoBg ? 1.5 : 0,
                    px: logoBg ? 1.5 : 0,
                }}>
                    {logo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={logo} alt={name} style={{ maxHeight: 48, maxWidth: "100%", objectFit: "contain", width: "auto" }} />
                    ) : (
                        <Typography sx={{ fontSize: "1.8rem", fontWeight: 900, color: "#fff", lineHeight: 1 }}>
                            {logoText}
                        </Typography>
                    )}
                </Box>

                {/* Name + badge */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1, flexWrap: "wrap" }}>
                    <Typography variant="subtitle1" fontWeight={700} fontSize="0.95rem">
                        {name}
                    </Typography>
                    {isLive ? (
                        <Chip
                            label={highlight}
                            size="small"
                            icon={<CheckCircleIcon sx={{ fontSize: "12px !important" }} />}
                            sx={{ bgcolor: "#d1fae5", color: "#065f46", fontWeight: 600, fontSize: "0.65rem", "& .MuiChip-icon": { color: "#065f46" } }}
                        />
                    ) : (
                        <Chip label="Coming Soon" size="small"
                            sx={{ bgcolor: "#f3f4f6", color: "#6b7280", fontWeight: 600, fontSize: "0.65rem" }} />
                    )}
                </Box>

                {/* Description */}
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.65, fontSize: "0.82rem", flexGrow: 1 }}>
                    {description}
                </Typography>
            </CardContent>
        </Card>
    );

    if (href) {
        return (
            <Box component={Link} href={href} target="_blank" rel="noopener noreferrer" sx={{ textDecoration: "none", display: "block", height: "100%" }}>
                {card}
            </Box>
        );
    }
    return card;
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function IntegrationsPage() {
    return (
        <Box component="main">
            {/* Hero */}
            <Box sx={{
                background: "linear-gradient(155deg, #0f172a 0%, #111827 55%, #0c1628 100%)",
                py: { xs: 9, md: 13 },
                textAlign: "center",
            }}>
                <Container maxWidth="md">
                    <Typography sx={{
                        fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.1em",
                        textTransform: "uppercase", color: "#D3A73D", mb: 2,
                    }}>
                        Integrations
                    </Typography>
                    <Typography variant="h1" sx={{
                        fontSize: { xs: "2.2rem", md: "3.2rem" }, fontWeight: 800,
                        color: "#fff", lineHeight: 1.15, mb: 2.5,
                    }}>
                        Connect Every Channel<br />You Sell On
                    </Typography>
                    <Typography sx={{
                        color: "rgba(255,255,255,0.58)", fontSize: { xs: "1rem", md: "1.15rem" },
                        lineHeight: 1.8, maxWidth: 580, mx: "auto", mb: 4,
                    }}>
                        Pythias pulls orders from every marketplace into one production queue — so your team prints, ships, and tracks everything from a single dashboard.
                    </Typography>
                    <Box sx={{ display: "flex", gap: 2, justifyContent: "center", flexWrap: "wrap" }}>
                        <Button
                            component={Link} href="/#calendar-booking-section"
                            variant="contained"
                            sx={{
                                bgcolor: "#D3A73D", color: "#111", fontWeight: 700, px: 3.5, py: 1.2,
                                "&:hover": { bgcolor: "#b8860b" }, borderRadius: 2,
                            }}
                        >
                            Book a Demo
                        </Button>
                        <Button
                            component={Link} href="/features"
                            variant="outlined"
                            sx={{
                                borderColor: "rgba(255,255,255,0.25)", color: "#fff", fontWeight: 600,
                                px: 3.5, py: 1.2, borderRadius: 2,
                                "&:hover": { borderColor: "#fff", bgcolor: "rgba(255,255,255,0.06)" },
                            }}
                        >
                            See All Features
                        </Button>
                    </Box>
                </Container>
            </Box>

            {/* Stats strip */}
            <Box sx={{ bgcolor: "#D3A73D", py: 2.5 }}>
                <Container maxWidth="lg">
                    <Box sx={{
                        display: "flex", justifyContent: "center", flexWrap: "wrap",
                        gap: { xs: 3, md: 6 }, textAlign: "center",
                    }}>
                        {[
                            { value: "15+", label: "Marketplace Integrations" },
                            { value: "50+", label: "Channels via Mirakl" },
                            { value: "1", label: "Unified Dashboard" },
                            { value: "Real-time", label: "Order Sync" },
                        ].map(s => (
                            <Box key={s.label}>
                                <Typography sx={{ fontSize: "1.5rem", fontWeight: 800, color: "#111", lineHeight: 1 }}>{s.value}</Typography>
                                <Typography sx={{ fontSize: "0.78rem", fontWeight: 600, color: "#333", mt: 0.25 }}>{s.label}</Typography>
                            </Box>
                        ))}
                    </Box>
                </Container>
            </Box>

            {/* Integration categories */}
            <Box sx={{ bgcolor: "#fff", py: { xs: 7, md: 10 } }}>
                <Container maxWidth="xl">
                    {CATEGORIES.map((cat, ci) => (
                        <Box key={cat.label} sx={{ mb: ci < CATEGORIES.length - 1 ? { xs: 7, md: 9 } : 0 }}>
                            {/* Category header */}
                            <Box sx={{ mb: 4 }}>
                                <Typography variant="overline" sx={{
                                    color: "#D3A73D", fontWeight: 700, letterSpacing: "0.12em", fontSize: "0.7rem",
                                }}>
                                    {cat.label}
                                </Typography>
                                <Typography variant="h2" sx={{
                                    fontSize: { xs: "1.5rem", md: "1.9rem" }, fontWeight: 700,
                                    color: "#111827", mt: 0.5,
                                }}>
                                    {cat.label}
                                </Typography>
                                <Typography variant="body1" color="text.secondary" sx={{ mt: 0.75, maxWidth: 560 }}>
                                    {cat.description}
                                </Typography>
                            </Box>

                            {/* Cards */}
                            <Grid container spacing={2.5}>
                                {cat.integrations.map(intg => (
                                    <Grid item xs={12} sm={6} md={4} lg={3} key={intg.name}>
                                        <IntegrationCard {...intg} />
                                    </Grid>
                                ))}
                            </Grid>
                        </Box>
                    ))}
                </Container>
            </Box>

            {/* How it works strip */}
            <Box sx={{ bgcolor: "#f8fafc", py: { xs: 7, md: 10 }, borderTop: "1px solid #f1f5f9" }}>
                <Container maxWidth="lg">
                    <Box sx={{ textAlign: "center", mb: 6 }}>
                        <Typography sx={{
                            fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.1em",
                            textTransform: "uppercase", color: "#D3A73D", mb: 1.5,
                        }}>
                            How It Works
                        </Typography>
                        <Typography variant="h2" sx={{
                            fontSize: { xs: "1.8rem", md: "2.4rem" }, fontWeight: 800, color: "#111827",
                        }}>
                            One queue. Every channel.
                        </Typography>
                    </Box>
                    <Grid container spacing={4}>
                        {[
                            {
                                step: "01",
                                title: "Order comes in",
                                desc: "A customer places an order on Amazon, Etsy, Shopify, or any connected marketplace. Pythias pulls it within minutes.",
                            },
                            {
                                step: "02",
                                title: "Routes to production",
                                desc: "The order enters the correct production queue — DTF, embroidery, sublimation — with the right art file and size breakdown.",
                            },
                            {
                                step: "03",
                                title: "Ships automatically",
                                desc: "Your team prints and ships. Pythias generates the label, captures the tracking, and pushes confirmation back to the marketplace.",
                            },
                        ].map(s => (
                            <Grid item xs={12} md={4} key={s.step}>
                                <Box sx={{ textAlign: "center" }}>
                                    <Typography sx={{
                                        fontSize: "3rem", fontWeight: 900, color: "#D3A73D",
                                        lineHeight: 1, mb: 1.5, fontFamily: "monospace",
                                    }}>
                                        {s.step}
                                    </Typography>
                                    <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>{s.title}</Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>{s.desc}</Typography>
                                </Box>
                            </Grid>
                        ))}
                    </Grid>
                </Container>
            </Box>

            {/* CTA */}
            <Box sx={{
                background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
                py: { xs: 8, md: 10 }, textAlign: "center",
            }}>
                <Container maxWidth="sm">
                    <Typography variant="h2" sx={{
                        fontSize: { xs: "1.8rem", md: "2.4rem" }, fontWeight: 800,
                        color: "#fff", mb: 2,
                    }}>
                        Ready to connect your channels?
                    </Typography>
                    <Typography sx={{ color: "rgba(255,255,255,0.58)", mb: 4, lineHeight: 1.7 }}>
                        {`Book a 30-minute demo and we'll show you how Pythias handles your specific marketplaces from day one.`}
                    </Typography>
                    <Button
                        component={Link} href="/#calendar-booking-section"
                        variant="contained"
                        size="large"
                        sx={{
                            bgcolor: "#D3A73D", color: "#111", fontWeight: 700, px: 4, py: 1.4,
                            fontSize: "1rem", borderRadius: 2,
                            "&:hover": { bgcolor: "#b8860b", boxShadow: "0 4px 20px rgba(211,167,61,0.4)" },
                        }}
                    >
                        Book a Demo
                    </Button>
                </Container>
            </Box>
        </Box>
    );
}

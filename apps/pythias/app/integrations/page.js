import { Box, Container, Typography, Chip, Grid2, Card, CardContent, Button } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import Link from "next/link";

export const metadata = {
    title: "Integrations — Every Marketplace and Supplier Connected",
    description: "Pythias connects your print-on-demand fulfillment to Amazon, Walmart, eBay, Etsy, Shopify, TikTok Shop, and more — plus direct supplier integrations with SanMar and S&S Activewear for automatic purchase orders.",
    keywords: "print on demand integrations, Amazon fulfillment, Walmart marketplace, eBay seller, Etsy fulfillment, Shopify print on demand, TikTok Shop, SanMar integration, SS Activewear integration, supplier catalog integration",
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
                href: "https://sell.amazon.com",
            },
            {
                name: "Walmart",
                logo: "/walmart.png",
                logoBg: null,
                status: "live",
                description: "Sync orders, acknowledge, and confirm shipment on Walmart Marketplace. Includes listing management and feed tracking.",
                highlight: "Full API",
                href: "https://marketplace.walmart.com",
            },
            {
                name: "Target Plus",
                logo: "/target-logo.png",
                logoBg: null,
                status: "live",
                description: "Receive and fulfill Target Plus marketplace orders with acknowledgment, shipment confirmation, and tracking sync.",
                highlight: "Direct API",
                href: "https://partners.target.com",
            },
            {
                name: "eBay",
                logo: "/ebay.svg",
                logoBg: null,
                status: "live",
                description: "Full eBay Sell API integration — pull orders, ship with tracking, manage listings, analytics, finances, messages, feedback, and disputes from one dashboard.",
                highlight: "Full API",
                href: "https://www.ebay.com/sl/sell",
            },
            {
                name: "Wayfair",
                logo: "/wayfair.svg",
                logoBg: null,
                status: "live",
                description: "One of the largest home goods marketplaces in North America. Direct integration via Wayfair's Supplier GraphQL API for dropship purchase orders.",
                highlight: "GraphQL API",
                href: "https://partners.wayfair.com",
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
                href: "https://www.etsy.com/sell",
            },
            {
                name: "Faire",
                logo: "/faire.svg",
                logoBg: null,
                status: "live",
                description: "Accept wholesale Faire orders, confirm shipments with tracking, and sync inventory levels across your catalog.",
                highlight: "Wholesale",
                href: "https://www.faire.com/brand",
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
                href: "https://seller-us.tiktok.com",
            },
            {
                name: "SHEIN",
                logo: "/shein.svg",
                logoBg: null,
                status: "live",
                description: "Receive SHEIN Open Platform orders, print and ship, then confirm fulfillment — all automated from one dashboard.",
                highlight: "Open Platform",
                href: "https://seller.shein.com",
            },
            {
                name: "Temu",
                logo: "/temu.svg",
                logoBg: null,
                status: "live",
                description: "Pull Temu Partner Open Platform orders and confirm shipments with carrier and tracking number automatically.",
                highlight: "POP API",
                href: "https://seller.temu.com",
            },
            {
                name: "Meta Shops",
                logo: "/meta.svg",
                logoBg: null,
                status: "live",
                description: "Sell across Facebook and Instagram from a single connection using the Meta Commerce Platform Shop API.",
                highlight: "Shop API",
                href: "https://www.facebook.com/business/shops",
            },
            {
                name: "Pinterest Shopping",
                logo: "/pinterest.svg",
                logoBg: null,
                status: "live",
                description: "Sync your product catalog with Pinterest and capture orders through Pinterest's native shopping experience.",
                highlight: "Shopping API",
                href: "https://business.pinterest.com/en/sell",
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
                name: "Wix",
                logo: "/wix.svg",
                logoBg: null,
                status: "live",
                description: "Connect your Wix store with an API key and pull orders directly into your production queue with automatic fulfillment sync.",
                highlight: "REST API",
                href: "https://www.wix.com/upgrade/ecommerce",
            },
            {
                name: "WooCommerce",
                logo: "/woocommerce.svg",
                logoBg: null,
                status: "live",
                description: "Connect your WooCommerce store via the REST API using consumer keys. Pull orders and push product listings automatically.",
                highlight: "REST API",
                href: "https://woo.com",
            },
            {
                name: "Squarespace",
                logo: "/squarespace.svg",
                logoBg: null,
                status: "live",
                description: "Link your Squarespace Commerce store with a developer API key to pull pending orders and sync products.",
                highlight: "Commerce API",
                href: "https://www.squarespace.com/ecommerce-website",
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
                description: "A single Mirakl connection opens Zalando, Otto, Allegro, Catch, Macy's, Nordstrom, Best Buy (US & Canada), Bloomingdale's, Carrefour, Castorama, Fnac, Conrad, Bunnings, and 50+ more channels — all through one API.",
                highlight: "50+ Markets",
                href: "https://www.mirakl.com",
            },
            {
                name: "Acenda",
                logo: "/acenda.png",
                logoBg: null,
                status: "live",
                description: "A single Acenda connection reaches Kohl's, Target Plus, Macy's, Nordstrom, Bloomingdale's, Wayfair, Home Depot, Lowe's, Best Buy, Costco, Dick's Sporting Goods, and 150+ more channels.",
                highlight: "150+ Channels",
                href: "https://www.acenda.com",
            },
            {
                name: "Rithum",
                logo: "/rithum.svg",
                logoBg: null,
                status: "live",
                description: "Formerly ChannelAdvisor/DSCO — a single Rithum connection unlocks Zulily and other Rithum-powered dropship channels.",
                highlight: "Dropship Platform",
                href: "https://www.rithum.com",
            },
        ],
    },
    {
        label: "International Marketplaces",
        description: "Reach buyers across the Middle East, Europe, and Asia-Pacific.",
        integrations: [
            {
                name: "Noon",
                logo: "/noon.svg",
                logoBg: null,
                status: "live",
                description: "Sell across UAE, Saudi Arabia, and Egypt on Noon — orders pull automatically and shipment confirmation syncs back.",
                highlight: "UAE · SA · EG",
                href: "https://sell.noon.com",
            },
            {
                name: "bol.com",
                logo: "/bol.svg",
                logoBg: null,
                status: "live",
                description: "The leading marketplace in the Netherlands and Belgium. OAuth2 integration with PostNL, DPD, DHL, and more carriers.",
                highlight: "NL · BE",
                href: "https://partnerplatform.bol.com",
            },
            {
                name: "Rakuten",
                logo: "/rakuten.svg",
                logoBg: null,
                status: "live",
                description: "Japan's leading e-commerce platform with 100M+ members globally. Direct integration via the Rakuten Marketplace Seller API.",
                highlight: "Seller API",
                href: "https://marketplace.rakuten.com",
            },
            {
                name: "OnBuy",
                logo: "/onbuy.svg",
                logoBg: null,
                status: "live",
                description: "The UK's fastest-growing marketplace and a strong Amazon alternative for British shoppers. Direct seller API integration.",
                highlight: "UK Market",
                href: "https://www.onbuy.com/gb/sell-on-onbuy/",
            },
        ],
    },
    {
        label: "Supplier Catalogs",
        description: "Connect your blank suppliers to order inventory directly from your production dashboard — no manual POs.",
        integrations: [
            {
                name: "SanMar",
                logo: "/sanmar.svg",
                logoBg: "#1a4c8b",
                status: "live",
                description: "Connect your SanMar account to browse their full catalog of 3,000+ styles, link blanks to SanMar style codes, and automatically submit purchase orders when you restock from the inventory page.",
                highlight: "SOAP API",
                href: "https://www.sanmar.com",
            },
            {
                name: "S&S Activewear",
                logo: "/ssactivewear.svg",
                logoBg: "#d32f2f",
                status: "live",
                description: "Connect your S&S Activewear account to link blanks to S&S style codes and submit purchase orders automatically from the inventory page — including Alpha Broder catalog access.",
                highlight: "REST API",
                href: "https://www.ssactivewear.com",
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

const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Pythias Marketplace Integrations",
    description: "Marketplace and platform integrations available in Pythias Technologies.",
    url: "https://pythiastechnologies.com/integrations",
    numberOfItems: CATEGORIES.reduce((sum, c) => sum + c.integrations.length, 0),
    itemListElement: CATEGORIES.flatMap((cat, ci) =>
        cat.integrations.map((intg, ii) => ({
            "@type": "ListItem",
            position: CATEGORIES.slice(0, ci).reduce((s, c) => s + c.integrations.length, 0) + ii + 1,
            name: intg.name,
            description: intg.description,
        }))
    ),
};

const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home",         item: "https://pythiastechnologies.com" },
        { "@type": "ListItem", position: 2, name: "Integrations", item: "https://pythiastechnologies.com/integrations" },
    ],
};

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function IntegrationsPage() {
    return (
        <Box component="main">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
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
                            { value: "18+", label: "Marketplace Integrations" },
                            { value: "200+", label: "Channels via Mirakl & Acenda" },
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
                            <Grid2 container spacing={2.5}>
                                {cat.integrations.map(intg => (
                                    <Grid2 size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={intg.name}>
                                        <IntegrationCard {...intg} />
                                    </Grid2>
                                ))}
                            </Grid2>
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
                    <Grid2 container spacing={4}>
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
                            <Grid2 size={{ xs: 12, md: 4 }} key={s.step}>
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
                            </Grid2>
                        ))}
                    </Grid2>
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

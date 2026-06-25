"use client";
import { useState } from "react";
import { Box, Container, Typography } from "@mui/material";
import {
    LinkRounded, SyncRounded, AutorenewRounded, TrendingUpRounded,
    StorefrontRounded, InventoryRounded, LocalShippingRounded, BarChartRounded,
} from "@mui/icons-material";

const SERVICES = {
    fulfillment: {
        label: "Fulfillment Cloud",
        color: "#D3A73D",
        tagline: "Sell across 18+ marketplaces and run your own production floor — all from one platform.",
        audience: "Right for you if: you own printers, embroidery machines, or other production equipment and want to manage everything in one place.",
        steps: [
            {
                icon: <LinkRounded sx={{ fontSize: 28 }} />,
                title: "Connect Stores & Equipment",
                description: "Link your marketplaces (Amazon, Etsy, TikTok, Shopify, and 15+ more) and connect your production hardware — DTF printers, embroidery machines, GTX printers — using our guided setup.",
            },
            {
                icon: <AutorenewRounded sx={{ fontSize: 28 }} />,
                title: "Orders Flow Into Your Queue",
                description: "When a customer buys on any connected channel, the order routes to your production floor — automatically queued by deadline, print type, and priority. No manual sorting.",
            },
            {
                icon: <LocalShippingRounded sx={{ fontSize: 28 }} />,
                title: "Print, Pack & Ship",
                description: "Your team fulfills the order on your own equipment. Integrated USPS, FedEx, and UPS label generation ships it directly to the customer with tracking synced back to every marketplace.",
            },
            {
                icon: <TrendingUpRounded sx={{ fontSize: 28 }} />,
                title: "Scale Your Operation",
                description: "Track production output, inventory levels, revenue by channel, and team performance from one analytics dashboard. Optionally accept overflow orders from Commerce Cloud sellers as a fulfillment partner.",
            },
        ],
    },
    commerce: {
        label: "Commerce Cloud",
        color: "#6366f1",
        tagline: "Sell across 18+ marketplaces. Vetted fulfillment partners physically print, pack, and ship every order for you.",
        audience: "Right for you if: you want to sell printed products without owning any equipment, warehouse space, or production staff.",
        steps: [
            {
                icon: <StorefrontRounded sx={{ fontSize: 28 }} />,
                title: "Connect Your Stores",
                description: "Link TikTok Shop, Shopify, Etsy, Amazon, Walmart Marketplace, and 15+ more in minutes. Orders from every channel flow into one dashboard.",
            },
            {
                icon: <InventoryRounded sx={{ fontSize: 28 }} />,
                title: "Build Your Product Catalog",
                description: "Browse blanks stocked by fulfillment partners, upload your artwork, and set your retail prices. Nothing is printed or purchased until a customer places an order.",
            },
            {
                icon: <LocalShippingRounded sx={{ fontSize: 28 }} />,
                title: "Orders Route Automatically",
                description: "When a customer buys, Commerce Cloud selects the best fulfillment partner — fastest route, best price — and sends them the job. The partner prints, packs, and ships it directly to your customer.",
            },
            {
                icon: <BarChartRounded sx={{ fontSize: 28 }} />,
                title: "Track & Scale",
                description: "Tracking updates flow back to every marketplace automatically. Monitor revenue, margin, and fulfillment metrics across all your channels from one analytics dashboard.",
            },
        ],
    },
    storefront: {
        label: "Storefront Cloud",
        color: "#0e9f6e",
        tagline: "Launch your own AI-built online store — production, marketing, and analytics built in, with checkout flowing straight into fulfillment.",
        audience: "Right for you if: you want your own branded store and direct customer relationships, not just marketplace listings.",
        steps: [
            {
                icon: <AutorenewRounded sx={{ fontSize: 28 }} />,
                title: "Describe Your Store",
                description: "Tell the AI what you sell and it builds your store — sections, pages, copy, and real product photos. Pick a theme, then edit anything with a sentence.",
            },
            {
                icon: <InventoryRounded sx={{ fontSize: 28 }} />,
                title: "Add Products & Collections",
                description: "Import your catalog, organize collections with fast faceted search, and set your retail prices. Reviews, SEO, and a universal product feed are built in.",
            },
            {
                icon: <LocalShippingRounded sx={{ fontSize: 28 }} />,
                title: "Customers Check Out",
                description: "A modern single-page checkout with wallets and tax converts the sale — and the order flows straight into Pythias fulfillment, no integration glue.",
            },
            {
                icon: <BarChartRounded sx={{ fontSize: 28 }} />,
                title: "Grow On Autopilot",
                description: "Built-in email & SMS marketing, abandoned-cart and post-purchase automations, A/B testing, and true profit analytics — plus an optional white-label mobile app.",
            },
        ],
    },
};

export default function HowItWorksSection() {
    const [active, setActive] = useState("fulfillment");
    const svc = SERVICES[active];

    return (
        <Box
            component="section"
            id="how-it-works-section"
            sx={{
                py: { xs: 8, lg: 12 },
                background: "linear-gradient(155deg, #0f172a 0%, #111827 55%, #0c1628 100%)",
                position: "relative",
                overflow: "hidden",
            }}
        >
            <Box sx={{ position: "absolute", top: -60, right: -60, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(211,167,61,0.1) 0%, transparent 65%)", pointerEvents: "none" }} />
            <Box sx={{ position: "absolute", bottom: -40, left: -40, width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(211,167,61,0.06) 0%, transparent 65%)", pointerEvents: "none" }} />

            <Container maxWidth="lg" sx={{ position: "relative" }}>
                {/* Header */}
                <Box sx={{ textAlign: "center", mb: { xs: 5, lg: 7 } }}>
                    <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#D3A73D", mb: 1.5 }}>
                        How It Works
                    </Typography>
                    <Typography
                        variant="h2"
                        sx={{ fontSize: { xs: "2rem", md: "2.5rem", lg: "2.875rem" }, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em", mb: 2 }}
                    >
                        Three products. One platform.
                    </Typography>
                    <Typography sx={{ color: "rgba(255,255,255,0.5)", maxWidth: 560, mx: "auto", lineHeight: 1.7, fontSize: "1.0625rem" }}>
                        Choose the path that fits your business — or run all three together.
                    </Typography>
                </Box>

                {/* Tab toggle */}
                <Box sx={{ display: "flex", justifyContent: "center", gap: 1.5, mb: 5, flexWrap: "wrap" }}>
                    {Object.entries(SERVICES).map(([key, s]) => (
                        <Box
                            key={key}
                            component="button"
                            onClick={() => setActive(key)}
                            sx={{
                                px: 3, py: 1.25, borderRadius: 3, fontWeight: 700, fontSize: "0.9rem",
                                border: "1.5px solid",
                                cursor: "pointer",
                                transition: "all 0.15s",
                                borderColor: active === key ? s.color : "rgba(255,255,255,0.15)",
                                bgcolor: active === key ? `${s.color}22` : "transparent",
                                color: active === key ? s.color : "rgba(255,255,255,0.5)",
                                "&:hover": { borderColor: s.color, color: s.color },
                            }}
                        >
                            {s.label}
                        </Box>
                    ))}
                </Box>

                {/* Active service tagline */}
                <Box sx={{ textAlign: "center", mb: 5 }}>
                    <Typography sx={{ color: "#fff", fontWeight: 600, fontSize: "1.05rem", mb: 0.75 }}>
                        {svc.tagline}
                    </Typography>
                    <Typography sx={{ color: svc.color, fontSize: "0.82rem", fontWeight: 600, letterSpacing: "0.02em" }}>
                        {svc.audience}
                    </Typography>
                </Box>

                {/* Steps grid */}
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: { xs: 4, md: 5 }, mb: 7 }}>
                    {svc.steps.map((step, i) => (
                        <Box
                            key={step.title}
                            sx={{
                                display: "flex", gap: 3, alignItems: "flex-start",
                                background: "rgba(255,255,255,0.04)",
                                border: "1px solid rgba(255,255,255,0.07)",
                                borderRadius: 4, p: 3.5,
                                transition: "background 0.2s",
                                "&:hover": { background: "rgba(255,255,255,0.07)" },
                            }}
                        >
                            <Box sx={{ flexShrink: 0, position: "relative" }}>
                                <Box sx={{
                                    width: 56, height: 56, borderRadius: "50%",
                                    bgcolor: `${svc.color}1a`,
                                    border: `1px solid ${svc.color}4d`,
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    color: svc.color,
                                }}>
                                    {step.icon}
                                </Box>
                                <Box sx={{
                                    position: "absolute", top: -8, right: -8,
                                    width: 22, height: 22, borderRadius: "50%",
                                    bgcolor: svc.color,
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    fontSize: "0.65rem", fontWeight: 800, color: "#111",
                                }}>
                                    {String(i + 1).padStart(2, "0")}
                                </Box>
                            </Box>
                            <Box>
                                <Typography sx={{ fontWeight: 700, color: "#fff", fontSize: "1.0625rem", mb: 1 }}>
                                    {step.title}
                                </Typography>
                                <Typography sx={{ color: "rgba(255,255,255,0.5)", lineHeight: 1.68, fontSize: "0.9rem" }}>
                                    {step.description}
                                </Typography>
                            </Box>
                        </Box>
                    ))}
                </Box>

                {/* Differentiator callout */}
                <Box sx={{ border: "1px solid rgba(255,255,255,0.1)", borderRadius: 4, overflow: "hidden" }}>
                    {/* Header row */}
                    <Box sx={{ px: 3.5, py: 2, borderBottom: "1px solid rgba(255,255,255,0.08)", bgcolor: "rgba(255,255,255,0.03)", textAlign: "center" }}>
                        <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.8rem", fontWeight: 600 }}>
                            Not sure which is right for you?
                        </Typography>
                    </Box>

                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
                        {/* Commerce Cloud */}
                        <Box sx={{ p: 3.5, borderRight: { md: "1px solid rgba(255,255,255,0.1)" }, borderBottom: { xs: "1px solid rgba(255,255,255,0.1)", md: "none" } }}>
                            <Typography sx={{ color: "#6366f1", fontWeight: 700, fontSize: "0.78rem", letterSpacing: "0.08em", textTransform: "uppercase", mb: 1 }}>
                                Commerce Cloud
                            </Typography>
                            <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "0.975rem", mb: 0.75 }}>
                                You sell. Partners produce.
                            </Typography>
                            <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.875rem", lineHeight: 1.65 }}>
                                No equipment, no warehouse, no staff. Design products, set prices, sell across 18+ marketplaces. Vetted fulfillment partners print, pack, and ship every order.
                            </Typography>
                        </Box>

                        {/* Fulfillment Cloud */}
                        <Box sx={{ p: 3.5 }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                                <Typography sx={{ color: "#D3A73D", fontWeight: 700, fontSize: "0.78rem", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                                    Fulfillment Cloud
                                </Typography>
                                <Box sx={{ bgcolor: "rgba(211,167,61,0.15)", border: "1px solid rgba(211,167,61,0.3)", borderRadius: 1, px: 0.75, py: "2px" }}>
                                    <Typography sx={{ color: "#D3A73D", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.06em" }}>
                                        INCLUDES COMMERCE CLOUD
                                    </Typography>
                                </Box>
                            </Box>
                            <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "0.975rem", mb: 0.75 }}>
                                You sell. You produce.
                            </Typography>
                            <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.875rem", lineHeight: 1.65 }}>
                                Everything in Commerce Cloud — plus tools to run your own production floor. Manage job queues, equipment, inventory, and shipping from one platform. You can also accept overflow orders from other Commerce Cloud sellers.
                            </Typography>
                        </Box>
                    </Box>
                </Box>
            </Container>
        </Box>
    );
}

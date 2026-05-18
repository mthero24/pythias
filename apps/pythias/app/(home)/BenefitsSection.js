"use client";
import { Box, Container, Typography, Card, CardContent, Stack } from "@mui/material";
import { AutoAwesome, LocalShipping, Inventory, Store } from "@mui/icons-material";

const benefits = [
  {
    icon: <AutoAwesome sx={{ fontSize: 28 }} />,
    title: "Automated Production",
    description: "Connect Brother GTX printers and folding machines. Job queuing, status tracking, and quality control workflows — fully automated.",
    gradient: "linear-gradient(135deg, #D3A73D 0%, #f0c66a 100%)",
  },
  {
    icon: <LocalShipping sx={{ fontSize: 28 }} />,
    title: "Simplified Shipping",
    description: "Integrated USPS, FedEx, UPS, and more. Auto-generate labels, sync tracking, and deliver notifications without lifting a finger.",
    gradient: "linear-gradient(135deg, #6366f1 0%, #818cf8 100%)",
  },
  {
    icon: <Inventory sx={{ fontSize: 28 }} />,
    title: "Smart Inventory",
    description: "Real-time stock tracking across all products and materials. Automated reorder points and supplier management prevent stockouts.",
    gradient: "linear-gradient(135deg, #10b981 0%, #34d399 100%)",
  },
  {
    icon: <Store sx={{ fontSize: 28 }} />,
    title: "Marketplace Integration",
    description: "Sell on Amazon, Etsy, Walmart, Shopify, TikTok, and more from one dashboard. Orders route and fulfill automatically.",
    gradient: "linear-gradient(135deg, #ef4444 0%, #f87171 100%)",
  },
];

export default function BenefitsSection() {
  return (
    <Box
      component="section"
      sx={{ py: { xs: 8, lg: 12 }, background: "#fff" }}
    >
      <Container maxWidth="lg">
        <Box sx={{ textAlign: "center", mb: { xs: 5, lg: 8 } }}>
          <Typography
            sx={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#D3A73D", mb: 1.5 }}
          >
            Why Pythias
          </Typography>
          <Typography
            variant="h2"
            sx={{ fontSize: { xs: "2rem", md: "2.5rem", lg: "2.875rem" }, fontWeight: 800, color: "#111827", letterSpacing: "-0.02em", mb: 2 }}
          >
            Why Choose Pythias Technologies?
          </Typography>
          <Typography sx={{ color: "#6b7280", maxWidth: 560, mx: "auto", lineHeight: 1.7, fontSize: "1.0625rem" }}>
            Everything you need to automate and scale your print-on-demand business — all in one platform.
          </Typography>
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "repeat(4,1fr)" }, gap: 3 }}>
          {benefits.map((b) => (
            <Card
              key={b.title}
              variant="outlined"
              sx={{
                height: "100%",
                borderRadius: 4,
                border: "1px solid #f3f4f6",
                transition: "box-shadow 0.2s, transform 0.2s",
                "&:hover": { boxShadow: "0 12px 40px rgba(0,0,0,0.1)", transform: "translateY(-4px)" },
              }}
            >
              <CardContent sx={{ p: 3.5 }}>
                <Box
                  sx={{
                    width: 56, height: 56, borderRadius: 3,
                    background: b.gradient,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#fff", mb: 2.5,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                  }}
                >
                  {b.icon}
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: "#111827", mb: 1.25, fontSize: "1rem" }}>
                  {b.title}
                </Typography>
                <Typography sx={{ color: "#6b7280", lineHeight: 1.65, fontSize: "0.9rem" }}>
                  {b.description}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Container>
    </Box>
  );
}

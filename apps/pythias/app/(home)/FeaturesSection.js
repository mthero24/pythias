import { Box, Container, Typography, Chip } from "@mui/material";
import {
  PrintRounded,
  LocalShippingRounded,
  InventoryRounded,
  StorefrontRounded,
  BarChartRounded,
  GroupsRounded,
  LabelRounded,
  TrackChangesRounded,
} from "@mui/icons-material";

const features = [
  { icon: <PrintRounded />,         color: "#D3A73D", title: "Production Queue Management",    desc: "DTF, embroidery, sublimation, and screen print queues organized by deadline, type, and priority." },
  { icon: <LocalShippingRounded />, color: "#6366f1", title: "Shipping & Carrier Integration",  desc: "Auto-generate USPS, FedEx, and UPS labels on order completion. Tracking syncs back to every marketplace." },
  { icon: <InventoryRounded />,     color: "#10b981", title: "Inventory & Stock Control",       desc: "Real-time blank inventory tracking, automated reorder alerts, and supplier management in one place." },
  { icon: <StorefrontRounded />,    color: "#ef4444", title: "Multi-Marketplace Orders",        desc: "Amazon, Etsy, Walmart, TikTok, Shopify, and Kohl's — all orders unified in a single production view." },
  { icon: <BarChartRounded />,      color: "#8b5cf6", title: "Analytics & Reporting",           desc: "Daily output reports, line efficiency metrics, order status dashboards, and custom date-range exports." },
  { icon: <GroupsRounded />,        color: "#14b8a6", title: "Team Collaboration",              desc: "Built-in messaging, role-based access, activity logs, and shift management keep your floor aligned." },
  { icon: <LabelRounded />,         color: "#f59e0b", title: "Label & Barcode Printing",        desc: "Print production labels, packing slips, and barcodes for any order directly from your dashboard." },
  { icon: <TrackChangesRounded />,  color: "#3b82f6", title: "Order Tracking & Visibility",     desc: "Real-time tracking from production start to delivery. Customers and staff always know where orders stand." },
];

export default function FeaturesSection() {
  return (
    <Box
      component="section"
      id="features-section"
      sx={{ py: { xs: 8, lg: 12 }, background: "#f8fafc" }}
    >
      <Container maxWidth="lg">
        <Box sx={{ textAlign: "center", mb: { xs: 6, lg: 8 } }}>
          <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#D3A73D", mb: 1.5 }}>
            Features
          </Typography>
          <Typography
            variant="h2"
            sx={{ fontSize: { xs: "2rem", md: "2.5rem", lg: "2.875rem" }, fontWeight: 800, color: "#111827", letterSpacing: "-0.02em", mb: 2 }}
          >
            Everything you need to run your print shop.
          </Typography>
          <Typography sx={{ color: "#6b7280", maxWidth: 560, mx: "auto", lineHeight: 1.7, fontSize: "1.0625rem" }}>
            Powerful features designed to automate every aspect of your workflow — from first order to final delivery.
          </Typography>
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "repeat(4,1fr)" }, gap: 2.5 }}>
          {features.map((f) => (
            <Box
              key={f.title}
              sx={{
                bgcolor: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: 4,
                p: 3,
                transition: "box-shadow 0.2s, transform 0.2s",
                "&:hover": { boxShadow: "0 8px 28px rgba(0,0,0,0.09)", transform: "translateY(-3px)" },
              }}
            >
              <Box sx={{
                width: 48, height: 48, borderRadius: 2.5, mb: 2,
                bgcolor: `${f.color}18`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: f.color, fontSize: "1.5rem",
              }}>
                {f.icon}
              </Box>
              <Typography sx={{ fontWeight: 700, fontSize: "0.9375rem", color: "#111827", mb: 1 }}>
                {f.title}
              </Typography>
              <Typography sx={{ fontSize: "0.855rem", color: "#6b7280", lineHeight: 1.62 }}>
                {f.desc}
              </Typography>
            </Box>
          ))}
        </Box>
      </Container>
    </Box>
  );
}

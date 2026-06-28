import { Box, Container, Typography, Card } from "@mui/material";
import Image from "next/image";
import Link from "next/link";
import TestimonialsGrid from "../testimonials/TestimonialsGrid";

// Real, verifiable proof only — no fabricated testimonials. The founder's track record
// (TShirtPalace $1M -> $10M) is true, and TestimonialsGrid renders real customer video
// testimonials (e.g. Premier) from /api/testimonials.
const logos = [
  { name: "Amazon",  src: "/images/integrations/Amazon_logo.svg.webp", width: 100, height: 30 },
  { name: "Etsy",    src: "/images/integrations/Etsy_logo.svg.png",    width: 80,  height: 30 },
  { name: "Walmart", src: "/images/integrations/Walmart_logo_(2008).svg.png", width: 120, height: 30 },
  { name: "Target",  src: "/images/integrations/Target_logo.svg.png",  width: 100, height: 30 },
  { name: "eBay",    src: "/images/integrations/EBay_logo.svg.png",    width: 80,  height: 30 },
  { name: "Shopify", src: "/images/integrations/Shopify_logo_2018.svg.png", width: 120, height: 30 },
];

export default function TestimonialsSection() {
  return (
    <Box component="section" sx={{ padding: { xs: "4rem 0", lg: "6rem 0" }, background: "white" }}>
      <Container maxWidth="lg">
        <Box sx={{ textAlign: "center", marginBottom: { xs: 4, lg: 5 } }}>
          <Typography component="h2" sx={{ fontSize: { xs: "2rem", md: "2.5rem", lg: "3rem" }, fontWeight: 700, marginBottom: 2, color: "#1a1a1a" }}>
            Built on a proven track record
          </Typography>
          <Typography variant="h6" sx={{ color: "#666666", maxWidth: "640px", margin: "0 auto", lineHeight: 1.6 }}>
            Pythias didn&apos;t start in a pitch deck — it started on a real production floor.
          </Typography>
        </Box>

        {/* TShirtPalace track record */}
        <Card sx={{ p: { xs: 3, md: 4 }, mb: { xs: 4, lg: 5 }, border: "1px solid #f0f0f0", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", display: "grid", gridTemplateColumns: { xs: "1fr", md: "auto 1fr" }, gap: { xs: 2, md: 4 }, alignItems: "center" }}>
          <Typography sx={{ fontSize: { xs: "2.6rem", md: "3.6rem" }, fontWeight: 800, lineHeight: 1, color: "#D3A73D", whiteSpace: "nowrap" }}>
            $1M → $10M
          </Typography>
          <Box>
            <Typography sx={{ fontSize: "1.05rem", lineHeight: 1.7, color: "#333" }}>
              Pythias began as the operations system built for <strong>TShirtPalace</strong>. The shop scaled
              from <strong>$1M to $10M a year</strong> by fixing the production floor — pulling every order into
              one queue, automating labels and tracking — not by buying more equipment. That system became Pythias.
            </Typography>
            <Typography variant="body2" sx={{ color: "#666", mt: 1 }}>
              Founder Michael Thero built it in the field, then turned it into the platform you&apos;re looking at.
            </Typography>
          </Box>
        </Card>

        {/* Real customer video testimonials (Premier, etc.) */}
        <Box sx={{ textAlign: "center", mb: 3 }}>
          <Typography component="h3" sx={{ fontSize: { xs: "1.4rem", md: "1.8rem" }, fontWeight: 700, color: "#1a1a1a" }}>
            Hear from the shops that use Pythias
          </Typography>
        </Box>
        <TestimonialsGrid />
        <Box sx={{ textAlign: "center", mt: 3, mb: { xs: 4, lg: 5 } }}>
          <Link href="/testimonials" style={{ color: "#D3A73D", fontWeight: 700, textDecoration: "none" }}>
            See all customer stories →
          </Link>
        </Box>

        {/* Marketplace integration strip (factual — these are real integrations) */}
        <Box sx={{ padding: { xs: 2, md: 3 }, backgroundColor: "#f8f9fa", borderRadius: 3, textAlign: "center" }}>
          <Typography variant="subtitle2" sx={{ color: "#666666", marginBottom: 2, fontWeight: 500 }}>
            Integrated with leading marketplaces
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", gap: { xs: 3, md: 5 }, flexWrap: "wrap" }}>
            {logos.map((logo, index) => (
              <Box key={index} sx={{ display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.7, transition: "opacity 0.3s ease", "&:hover": { opacity: 1 } }}>
                <Image src={logo.src} alt={`${logo.name} integration`} width={logo.width} height={logo.height} style={{ maxWidth: "100%", height: "auto", filter: "grayscale(100%)" }} />
              </Box>
            ))}
          </Box>
        </Box>
      </Container>
    </Box>
  );
}

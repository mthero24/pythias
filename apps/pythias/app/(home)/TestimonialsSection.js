import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
} from "@mui/material";
import { Star } from "@mui/icons-material";
import Image from "next/image";

const testimonials = [
  {
    name: "Mason Katty",
    company: "TShirtPalace",
    image:
      "https://images.unsplash.com/photo-1494790108755-2616b612b589?w=150&h=150&fit=crop&auto=format",
    rating: 5,
    quote:
      "Pythias Technologies cut our shipping time by 40% and eliminated manual order processing. Our team can now focus on growing the business instead of managing chaos.",
    metric: "40% faster shipping",
  },
  {
    name: "Mike Rodriguez",
    company: "Print Plus Solutions",
    image:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&auto=format",
    rating: 5,
    quote:
      "The Brother GTX integration was seamless. We went from manual job tracking to fully automated production in just one week. Game changer for our POD business.",
    metric: "Automated 100% of production",
  },
  {
    name: "Emily Chen",
    company: "Marketplace Masters",
    image:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&auto=format",
    rating: 5,
    quote:
      "Managing orders from Etsy, Amazon, and Walmart used to be a nightmare. Now everything flows automatically through one system. Revenue up 60% in 3 months.",
    metric: "60% revenue increase",
  },
  {
    name: "David Thompson",
    company: "Quick Print Pro",
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&auto=format",
    rating: 5,
    quote:
      "The inventory management alone saved us thousands in overstock and stockouts. Real-time tracking across all our products has transformed our operations.",
    metric: "Eliminated stockouts",
  },
];

const logos = [
  {
    name: "Amazon",
    src: "/images/integrations/Amazon_logo.svg.webp",
    width: 100,
    height: 30,
  },
  {
    name: "Etsy",
    src: "/images/integrations/Etsy_logo.svg.png",
    width: 80,
    height: 30,
  },
  {
    name: "Walmart",
    src: "/images/integrations/Walmart_logo_(2008).svg.png",
    width: 120,
    height: 30,
  },
  {
    name: "Target",
    src: "/images/integrations/Target_logo.svg.png",
    width: 100,
    height: 30,
  },
  {
    name: "eBay",
    src: "/images/integrations/EBay_logo.svg.png",
    width: 80,
    height: 30,
  },
  {
    name: "Shopify",
    src: "/images/integrations/Shopify_logo_2018.svg.png",
    width: 120,
    height: 30,
  },
];

export default function TestimonialsSection() {
  return (
    <Box
      component="section"
      sx={{
        padding: { xs: "4rem 0", lg: "6rem 0" },
        background: "white",
      }}
    >
      <Container maxWidth="xl">
        <Box sx={{ textAlign: "center", marginBottom: { xs: 4, lg: 6 } }}>
          <Typography
            variant="h2"
            component="h2"
            sx={{
              fontSize: { xs: "2rem", md: "2.5rem", lg: "3rem" },
              fontWeight: 700,
              marginBottom: 2,
              color: "#1a1a1a",
            }}
          >
            Trusted by Print-On-Demand Businesses
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: "#666666",
              maxWidth: "600px",
              margin: "0 auto",
              lineHeight: 1.6,
            }}
          >
            See how businesses like yours are scaling with Pythias Technologies
          </Typography>
        </Box>

        <Grid
          container
          spacing={{ xs: 3, md: 4 }}
          sx={{ marginBottom: { xs: 4, lg: 6 } }}
        >
          {testimonials.map((testimonial, index) => (
            <Grid item xs={12} md={6} key={index}>
              <Card
                sx={{
                  height: "100%",
                  padding: 3,
                  border: "1px solid #f0f0f0",
                  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
                  transition: "transform 0.3s ease",
                  "&:hover": {
                    transform: "translateY(-5px)",
                  },
                }}
              >
                <CardContent sx={{ padding: "0 !important" }}>
                  <Box sx={{ display: "flex", gap: 1, marginBottom: 2 }}>
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star
                        key={i}
                        sx={{ color: "#ffd700", fontSize: "1.25rem" }}
                      />
                    ))}
                  </Box>

                  <Typography
                    variant="body1"
                    sx={{
                      fontStyle: "italic",
                      lineHeight: 1.7,
                      marginBottom: 3,
                      color: "#333333",
                    }}
                  >
                    "{testimonial.quote}"
                  </Typography>

                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Avatar
                      src={testimonial.image}
                      alt={testimonial.name}
                      sx={{ width: 50, height: 50 }}
                    />
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        variant="subtitle1"
                        sx={{ fontWeight: 600, color: "#1a1a1a" }}
                      >
                        {testimonial.name}
                      </Typography>
                      <Typography variant="body2" sx={{ color: "#666666" }}>
                        {testimonial.company}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        backgroundColor: "#f8f9fa",
                        padding: "0.5rem 1rem",
                        borderRadius: 2,
                        textAlign: "center",
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{ fontWeight: 600, color: "#1a1a1a" }}
                      >
                        {testimonial.metric}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Logo Strip */}
        <Box
          sx={{
            padding: { xs: 2, md: 3 },
            backgroundColor: "#f8f9fa",
            borderRadius: 3,
            textAlign: "center",
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{
              color: "#666666",
              marginBottom: 2,
              fontWeight: 500,
            }}
          >
            Integrated with leading marketplaces
          </Typography>
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: { xs: 3, md: 5 },
              flexWrap: "wrap",
            }}
          >
            {logos.map((logo, index) => (
              <Box
                key={index}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: 0.7,
                  transition: "opacity 0.3s ease",
                  "&:hover": {
                    opacity: 1,
                  },
                }}
              >
                <Image
                  src={logo.src}
                  alt={`${logo.name} integration`}
                  width={logo.width}
                  height={logo.height}
                  style={{
                    maxWidth: "100%",
                    height: "auto",
                    filter: "grayscale(100%)",
                  }}
                />
              </Box>
            ))}
          </Box>
        </Box>
      </Container>
    </Box>
  );
}

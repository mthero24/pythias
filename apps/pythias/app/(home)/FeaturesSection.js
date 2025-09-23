import { Box, Container, Typography, Grid } from "@mui/material";
import Image from "next/image";

const features = [
  {
    title: "Production Integration",
    description:
      "Connect directly with Brother GTX printers and folding machines. Automated job queuing, status tracking, and quality control workflows keep your production running smoothly.",
    image:
      "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=500&h=300&fit=crop&auto=format",
    imageAlt: "3D printer and manufacturing setup",
    reverse: false,
  },
  {
    title: "Shipping & Fulfillment",
    description:
      "Integrated USPS and FedEx shipping software with automated label generation, tracking, and delivery notifications. Streamline your entire fulfillment process.",
    image:
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&h=300&fit=crop&auto=format",
    imageAlt: "Shipping and logistics warehouse",
    reverse: true,
  },
  {
    title: "Smart Inventory Management",
    description:
      "Real-time stock tracking across all products and materials. Automated reorder points, supplier management, and inventory forecasting to prevent stockouts.",
    image:
      "https://images.unsplash.com/photo-1553413077-190dd305871c?w=500&h=300&fit=crop&auto=format",
    imageAlt: "Warehouse inventory management system",
    reverse: false,
  },
  {
    title: "Multi-Marketplace Fulfillment",
    description:
      "Unified dashboard for managing orders from Amazon, Etsy, Walmart, Target, and more. Automatic order routing and marketplace-specific packaging requirements.",
    image:
      "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=500&h=300&fit=crop&auto=format",
    imageAlt: "E-commerce dashboard with multiple marketplace logos",
    reverse: true,
  },
];

export default function FeaturesSection() {
  return (
    <Box
      component="section"
      sx={{
        padding: { xs: "4rem 0", lg: "6rem 0" },
        background: "#fafafa",
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
            Everything You Need to Run Your Print-on-Demand Business
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: "#666666",
              maxWidth: "700px",
              margin: "0 auto",
              lineHeight: 1.6,
            }}
          >
            Powerful features designed to automate every aspect of your workflow
          </Typography>
        </Box>

        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: { xs: 6, lg: 8 },
          }}
        >
          {features.map((feature, index) => (
            <Grid
              container
              spacing={{ xs: 4, md: 6 }}
              alignItems="center"
              key={index}
              direction={{
                xs: "column",
                md: feature.reverse ? "row-reverse" : "row",
              }}
            >
              <Grid item xs={12} md={6}>
                <Box
                  sx={{
                    textAlign: { xs: "center", md: "left" },
                  }}
                >
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 600,
                      marginBottom: 2,
                      color: "#1a1a1a",
                      fontSize: { xs: "1.75rem", md: "2rem" },
                    }}
                  >
                    {feature.title}
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      color: "#666666",
                      lineHeight: 1.7,
                      fontSize: "1.125rem",
                    }}
                  >
                    {feature.description}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box
                  sx={{
                    position: "relative",
                    borderRadius: 3,
                    overflow: "hidden",
                    boxShadow: "0 10px 40px rgba(0, 0, 0, 0.1)",
                    transition: "transform 0.3s ease",
                    "&:hover": {
                      transform: "translateY(-5px)",
                    },
                  }}
                >
                  <Image
                    src={feature.image}
                    alt={feature.imageAlt}
                    width={500}
                    height={300}
                    style={{
                      width: "100%",
                      height: "auto",
                      display: "block",
                    }}
                  />
                </Box>
              </Grid>
            </Grid>
          ))}
        </Box>
      </Container>
    </Box>
  );
}

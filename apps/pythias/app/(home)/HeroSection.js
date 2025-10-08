import Image from "next/image";
import { Box, Container, Typography, Button, Grid } from "@mui/material";
import Logo from "../../public/logo_vertical.png";

export default function HeroSection() {
  return (
    <Box
      component="section"
      sx={{
        padding: { xs: "4rem 0 6rem 0", lg: "6rem 0 8rem 0" },
        background: "linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%)",
        minHeight: "calc(100vh - 80px)",
        display: "flex",
        alignItems: "center",
      }}
    >
      <Container maxWidth="xl">
        <Grid
          container
          spacing={{ xs: 3, md: 4, lg: 6 }}
          alignItems="center"
          sx={{ minHeight: "500px" }}
        >
          {/* Text Content */}
          <Grid item xs={12} md={6}>
            <Box
              sx={{
                textAlign: { xs: "center", md: "left" },
                maxWidth: "100%",
              }}
            >
              <Typography
                variant="h1"
                component="h1"
                gutterBottom
                sx={{
                  fontSize: { xs: "2.5rem", md: "3.5rem", lg: "4rem" },
                  fontWeight: 700,
                  lineHeight: 1.2,
                  marginBottom: "1.5rem",
                  color: "#1a1a1a",
                }}
              >
                All-in-One Print-on-Demand Software
              </Typography>

              <Typography
                variant="h5"
                component="p"
                gutterBottom
                sx={{
                  fontSize: { xs: "1.25rem", md: "1.375rem", lg: "1.5rem" },
                  lineHeight: 1.6,
                  color: "#666666",
                  marginBottom: "2.5rem",
                  maxWidth: { xs: "600px", md: "none" },
                  marginLeft: { xs: "auto", md: 0 },
                  marginRight: { xs: "auto", md: 0 },
                }}
              >
                Automate production, inventory, shipping, and
                fulfillment—everything you need in one platform.
              </Typography>

              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  justifyContent: { xs: "center", md: "flex-start" },
                  flexWrap: "wrap",
                }}
              >
                <Button variant="contained" size="large">
                  Book a Demo
                </Button>
                <Button variant="outlined" size="large">
                  Learn More
                </Button>
              </Box>
            </Box>
          </Grid>

          {/* Image Content */}
          <Grid item xs={12} md={6}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Box
                sx={{
                  position: "relative",
                  background: "black",
                  borderRadius: "20px",
                  padding: 4,
                  boxShadow: "0 10px 40px rgba(0, 0, 0, 0.1)",
                  transition: "transform 0.3s ease",
                  "&:hover": {
                    transform: "translateY(-5px)",
                  },
                }}
              >
                <Image
                  src={Logo}
                  alt="Pythias Technologies"
                  width={400}
                  height={500}
                  priority
                  style={{
                    width: "100%",
                    height: "auto",
                    maxWidth: "300px",
                  }}
                />
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

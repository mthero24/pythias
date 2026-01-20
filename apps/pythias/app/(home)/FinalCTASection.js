"use client";
import { Theme } from "../../lib/theme";
import { Box, Container, Typography, Button } from "@mui/material";

export default function FinalCTASection() {
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };
  return (
    <Box
      component="section"
      sx={{
        padding: { xs: "4rem 0", lg: "6rem 0" },
        background: "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)",
        color: "white",
        textAlign: "center",
      }}
    >
      <Container maxWidth="md">
        <Typography
          variant="h2"
          component="h2"
          sx={{
            fontSize: { xs: "2rem", md: "2.5rem", lg: "3.5rem" },
            fontWeight: 700,
            marginBottom: 3,
            color: "white",
            lineHeight: 1.2,
          }}
        >
          Stop Managing Chaos.{" "}
          <Box component="span" sx={{ color: Theme.colors.secondary }}>
            Start Automating
          </Box>{" "}
          Your Print-On-Demand Business.
        </Typography>

        <Typography
          variant="h6"
          sx={{
            color: "#cccccc",
            marginBottom: 4,
            lineHeight: 1.6,
            maxWidth: "600px",
            margin: "0 auto 2rem auto",
          }}
        >
          Join hundreds of businesses that have streamlined their operations
          with Pythias Technologies
        </Typography>

        <Box
          sx={{
            display: "flex",
            gap: 3,
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <Button
            variant="contained"
            size="large"
            onClick={() => scrollToSection("calendar-booking-section")}
            sx={{
              backgroundColor: Theme.colors.secondary,
              padding: "1rem 2.5rem",
              fontSize: "1.125rem",
              "&:hover": {
                backgroundColor: "#A67C52",
              },
            }}
          >
            Get Started Today
          </Button>
          <Button
            variant="outlined"
            size="large"
            onClick={() => scrollToSection("calendar-booking-section")}
            sx={{
              borderColor: "white",
              color: "white",
              padding: "1rem 2.5rem",
              fontSize: "1.125rem",
              "&:hover": {
                backgroundColor: "white",
                color: "#1a1a1a",
              },
            }}
          >
            Schedule Demo
          </Button>
        </Box>

        <Typography
          variant="body2"
          sx={{
            color: "#999999",
            marginTop: 3,
            fontStyle: "italic",
          }}
        >
          14-day free trial • Setup in under 2 weeks • No long-term contracts
        </Typography>
      </Container>
    </Box>
  );
}

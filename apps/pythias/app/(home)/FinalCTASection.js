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

        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
          <Button
            component="a"
            href="/pricing"
            variant="contained"
            size="large"
            sx={{
              backgroundColor: Theme.colors.secondary,
              padding: "1rem 2.5rem",
              fontSize: "1.125rem",
              fontWeight: 700,
              "&:hover": { backgroundColor: "#b8860b" },
            }}
          >
            See Pricing
          </Button>
          <Typography variant="body2" sx={{ color: "#999999", fontStyle: "italic" }}>
            30-min demo &nbsp;·&nbsp; No commitment &nbsp;·&nbsp; Setup in under 2 weeks
          </Typography>
          <Button
            variant="text"
            onClick={() => scrollToSection("calendar-booking-section")}
            sx={{ color: "#cccccc", textDecoration: "underline", fontSize: "0.9rem", "&:hover": { color: "#fff" } }}
          >
            Book a free demo →
          </Button>
        </Box>
      </Container>
    </Box>
  );
}

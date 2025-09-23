import { Box, Container, Typography, Grid } from "@mui/material";
import { Theme } from "../../lib/theme";
import {
  Link as LinkIcon,
  Sync,
  Autorenew,
  TrendingUp,
} from "@mui/icons-material";

const steps = [
  {
    number: "01",
    icon: <LinkIcon />,
    title: "Connect Your Printers & Machines",
    description:
      "Seamlessly integrate your Brother GTX printers, folding machines, and other production equipment with our platform.",
  },
  {
    number: "02",
    icon: <Sync />,
    title: "Sync Your Inventory & Listings",
    description:
      "Connect your marketplace accounts and synchronize product listings across Amazon, Etsy, Walmart, Target, and more.",
  },
  {
    number: "03",
    icon: <Autorenew />,
    title: "Automate Order Fulfillment & Shipping",
    description:
      "Orders automatically flow to production, get printed, packed, and shipped with integrated USPS and FedEx solutions.",
  },
  {
    number: "04",
    icon: <TrendingUp />,
    title: "Grow Your Print-on-Demand Business",
    description:
      "Scale effortlessly with automated workflows, real-time analytics, and intelligent inventory management.",
  },
];

export default function HowItWorksSection() {
  return (
    <Box
      component="section"
      sx={{
        padding: { xs: "4rem 0", lg: "6rem 0" },
        background: "#1a1a1a",
        color: "white",
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
              color: "white",
            }}
          >
            How It Works
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: "#cccccc",
              maxWidth: "600px",
              margin: "0 auto",
              lineHeight: 1.6,
            }}
          >
            Simple steps to automate your entire print-on-demand workflow
          </Typography>
        </Box>

        <Grid container spacing={{ xs: 4, md: 6 }}>
          {steps.map((step, index) => (
            <Grid item xs={12} md={6} key={index}>
              <Box
                sx={{
                  display: "flex",
                  gap: 3,
                  alignItems: "flex-start",
                }}
              >
                <Box
                  sx={{
                    flexShrink: 0,
                    width: 80,
                    height: 80,
                    backgroundColor: "white",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#1a1a1a",
                    fontSize: "1.5rem",
                    position: "relative",
                  }}
                >
                  {step.icon}
                  <Box
                    sx={{
                      position: "absolute",
                      top: -10,
                      right: -10,
                      width: 30,
                      height: 30,
                      backgroundColor: Theme.colors.secondary,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.875rem",
                      fontWeight: 700,
                      color: "white",
                    }}
                  >
                    {step.number}
                  </Box>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 600,
                      marginBottom: 1.5,
                      color: "white",
                    }}
                  >
                    {step.title}
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      color: "#cccccc",
                      lineHeight: 1.7,
                    }}
                  >
                    {step.description}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}

import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
} from "@mui/material";
import {
  AutoAwesome,
  LocalShipping,
  Inventory,
  Store,
} from "@mui/icons-material";

const benefits = [
  {
    icon: <AutoAwesome />,
    title: "Automated Production",
    description:
      "Integrate seamlessly with Brother GTX printers & folding machines for streamlined workflow.",
  },
  {
    icon: <LocalShipping />,
    title: "Simplified Shipping",
    description:
      "Connect directly with USPS, FedEx & more for automated shipping and tracking.",
  },
  {
    icon: <Inventory />,
    title: "Smart Inventory Management",
    description:
      "Track stock levels and sync across all platforms in real-time.",
  },
  {
    icon: <Store />,
    title: "Marketplace Integration",
    description:
      "Sell and fulfill orders from Amazon, Etsy, Walmart, Target & more platforms.",
  },
];

export default function BenefitsSection() {
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
            Why Choose Pythias Technologies?
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
            Everything you need to automate and scale your print-on-demand
            business
          </Typography>
        </Box>

        <Grid
          container
          spacing={{ xs: 3, md: 4 }}
          sx={{ marginBottom: { xs: 4, lg: 6 } }}
        >
          {benefits.map((benefit, index) => (
            <Grid item xs={12} sm={6} lg={3} key={index}>
              <Card
                sx={{
                  height: "100%",
                  textAlign: "center",
                  padding: 3,
                  border: "1px solid #f0f0f0",
                  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
                  transition: "transform 0.3s ease, box-shadow 0.3s ease",
                  "&:hover": {
                    transform: "translateY(-8px)",
                    boxShadow: "0 8px 30px rgba(0, 0, 0, 0.12)",
                  },
                }}
              >
                <CardContent sx={{ padding: "0 !important" }}>
                  <Box
                    sx={{
                      backgroundColor: "#f8f9fa",
                      borderRadius: "50%",
                      width: 80,
                      height: 80,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 1.5rem auto",
                      color: "#1a1a1a",
                      fontSize: "2rem",
                    }}
                  >
                    {benefit.icon}
                  </Box>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 600,
                      marginBottom: 1.5,
                      color: "#1a1a1a",
                    }}
                  >
                    {benefit.title}
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      color: "#666666",
                      lineHeight: 1.6,
                    }}
                  >
                    {benefit.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Box sx={{ textAlign: "center" }}>
          <Button variant="contained" size="large">
            See How It Works
          </Button>
        </Box>
      </Container>
    </Box>
  );
}

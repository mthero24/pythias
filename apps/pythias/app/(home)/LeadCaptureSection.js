import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Grid,
} from "@mui/material";

/*
https://formspree.io/register

*/

export default function LeadCaptureSection() {
  return (
    <Box
      component="section"
      sx={{
        padding: { xs: "4rem 0", lg: "6rem 0" },
        background: "#fafafa",
      }}
    >
      <Container maxWidth="md">
        <Box sx={{ textAlign: "center", marginBottom: { xs: 4, lg: 5 } }}>
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
            Ready to Streamline Your Print-On-Demand Workflow?
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
            Get a free demo of Pythias Technologies and see how it can save you
            time and money
          </Typography>
        </Box>

        <Box
          component="form"
          action="https://formspree.io/f/xyznljnl"
          method="POST"
          sx={{
            backgroundColor: "white",
            padding: { xs: 3, md: 4 },
            borderRadius: 3,
            boxShadow: "0 10px 40px rgba(0, 0, 0, 0.1)",
          }}
        >
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                name="name"
                label="Full Name"
                variant="outlined"
                required
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                name="email"
                label="Email Address"
                type="email"
                variant="outlined"
                required
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                name="company"
                label="Company Name"
                variant="outlined"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                name="orderVolume"
                label="Monthly Order Volume"
                select
                SelectProps={{ native: true }}
                variant="outlined"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                  },
                }}
              >
                <option value="">Select Volume</option>
                <option value="0-100">0-100 orders/month</option>
                <option value="100-500">100-500 orders/month</option>
                <option value="500-1000">500-1,000 orders/month</option>
                <option value="1000+">1,000+ orders/month</option>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                name="challenges"
                label="Tell us about your current workflow challenges"
                multiline
                rows={4}
                variant="outlined"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                  },
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ textAlign: "center" }}>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  sx={{
                    padding: "1rem 3rem",
                    fontSize: "1.125rem",
                    borderRadius: 2,
                  }}
                >
                  Book My Demo
                </Button>
                <Typography
                  variant="body2"
                  sx={{
                    color: "#666666",
                    marginTop: 2,
                    fontStyle: "italic",
                  }}
                >
                  Free 30-minute consultation • No sales pressure • Custom
                  workflow analysis
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Container>
    </Box>
  );
}

import { Box, Container, Typography } from "@mui/material";

export default function CalendarBookingSection() {
  return (
    <Box
      component="section"
      sx={{
        padding: { xs: "4rem 0", lg: "6rem 0" },
        background: "white",
      }}
    >
      <Container maxWidth="lg">
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
            Book Your Live Demo
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
            Ready to see Pythias Technologies in action? Schedule a personalized
            30-minute demo where we'll show you exactly how our platform can
            streamline your operations
          </Typography>
        </Box>

        <Box
          sx={{
            backgroundColor: "#fafafa",
            borderRadius: 3,
            padding: { xs: 2, md: 3 },
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
          }}
        >
          <Box
            component="iframe"
            src="https://calendar.google.com/calendar/appointments/schedules/AcZssZ2V9w52W8h2JOJYdAnFCczT6MVLIbWNyCuO9GyGrOZvzPL87MDGYb-YSWfL0NPcXWRuIMJ436LU?gv=true"
            sx={{
              border: 0,
              width: "100%",
              height: { xs: "500px", md: "600px" },
              borderRadius: 2,
              backgroundColor: "white",
            }}
          />
        </Box>

        <Box sx={{ textAlign: "center", marginTop: 3 }}>
          <Typography
            variant="body2"
            sx={{
              color: "#666666",
              fontStyle: "italic",
            }}
          >
            Can't find a suitable time? Contact us directly and we'll arrange a
            demo at your convenience
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}

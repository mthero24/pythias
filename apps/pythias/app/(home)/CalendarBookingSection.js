"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Container, Typography, Button } from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";

const POLL_INTERVAL = 8_000; // 8 seconds — short enough to catch most iCal updates

async function fetchUids() {
  try {
    const res = await fetch("/api/calendar/appointments", { cache: "no-store" });
    if (!res.ok) return null;
    const { events } = await res.json();
    return new Set((events ?? []).map((e) => e.uid));
  } catch {
    return null;
  }
}

function fireBookingEvents() {
  try {
    window.gtag?.("event", "conversion_event_book_appointment");
    window.gtag?.("event", "conversion", {
      send_to: "AW-18171939038",
    });
  } catch {}
}

export default function CalendarBookingSection() {
  const router        = useRouter();
  const baseUids      = useRef(null);
  const intervalId    = useRef(null);
  const redirected    = useRef(false);
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const initial = await fetchUids();
      if (cancelled) return;
      baseUids.current = initial ?? new Set();

      // Show the manual fallback button after 10 s — the user has had time to book
      const showTimer = setTimeout(() => {
        if (!redirected.current) setShowButton(true);
      }, 10_000);

      intervalId.current = setInterval(async () => {
        if (redirected.current) return;
        const current = await fetchUids();
        if (!current || !baseUids.current) return;

        for (const uid of current) {
          if (!baseUids.current.has(uid)) {
            redirected.current = true;
            clearInterval(intervalId.current);
            clearTimeout(showTimer);
            fireBookingEvents();
            router.push("/demo-confirmed");
            return;
          }
        }
      }, POLL_INTERVAL);

      return () => clearTimeout(showTimer);
    }

    init();

    return () => {
      cancelled = true;
      clearInterval(intervalId.current);
    };
  }, [router]);

  function handleManualConfirm() {
    if (redirected.current) return;
    redirected.current = true;
    clearInterval(intervalId.current);
    fireBookingEvents();
    router.push("/demo-confirmed");
  }

  return (
    <Box
      component="section"
      id="calendar-booking-section"
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
            {`Ready to see Pythias Technologies in action? Schedule a personalized
                30-minute demo where we'll show you exactly how our platform can
                streamline your operations and boost your sales.`}
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
            loading="lazy"
            title="Book a demo with Pythias Technologies"
            sx={{
              border: 0,
              width: "100%",
              height: { xs: "500px", md: "600px" },
              borderRadius: 2,
              backgroundColor: "white",
            }}
          />
        </Box>

        {/* Manual confirm — appears ~10 s after page load so a just-booked visitor can proceed immediately */}
        <Box
          sx={{
            textAlign: "center",
            marginTop: 3,
            minHeight: 56,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 1.5,
          }}
        >
          {showButton && (
            <Button
              variant="contained"
              size="large"
              startIcon={<CheckCircleOutlineIcon />}
              onClick={handleManualConfirm}
              sx={{
                bgcolor: "#6366f1",
                fontWeight: 700,
                px: 4,
                borderRadius: 2,
                "&:hover": { bgcolor: "#4f46e5" },
              }}
            >
              {"I just booked my demo →"}
            </Button>
          )}
          <Typography
            variant="body2"
            sx={{ color: "#666666", fontStyle: "italic" }}
          >
            {`Can't find a suitable time? Contact us directly and we'll arrange a demo at your convenience.`}
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}

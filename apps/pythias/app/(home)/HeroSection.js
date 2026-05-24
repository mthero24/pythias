import { Box, Container, Typography, Button, Stack, Chip } from "@mui/material";
import { RocketLaunch, CalendarMonth } from "@mui/icons-material";
import Image from "next/image";
import Logo from "../../public/logo_vertical.png";

const STATS = [
  { value: "50+",  label: "Integrations" },
  { value: "24/7", label: "Support" },
  { value: "< 2 wks", label: "Onboarding" },
];

export default function HeroSection() {
  return (
    <Box
      component="section"
      sx={{
        position: "relative",
        overflow: "hidden",
        background: "linear-gradient(155deg, #0f172a 0%, #111827 55%, #0c1628 100%)",
        minHeight: { xs: "auto", md: "calc(100vh - 80px)" },
        display: "flex",
        alignItems: "center",
        py: { xs: 10, md: 14 },
      }}
    >
      {/* Background glows */}
      <Box sx={{ position: "absolute", top: -120, right: -80, width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(211,167,61,0.12) 0%, transparent 65%)", pointerEvents: "none" }} />
      <Box sx={{ position: "absolute", bottom: -80, left: -60, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(211,167,61,0.07) 0%, transparent 65%)", pointerEvents: "none" }} />
      <Box sx={{ position: "absolute", top: "35%", left: "40%", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 65%)", pointerEvents: "none" }} />

      <Container maxWidth="xl" sx={{ position: "relative" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 4, lg: 8 }, flexDirection: { xs: "column", md: "row" } }}>

          {/* Text */}
          <Box sx={{ flex: 1, textAlign: { xs: "center", md: "left" } }}>
            <Chip
              label="All-in-One Print-on-Demand Platform"
              size="small"
              sx={{
                mb: 3,
                bgcolor: "rgba(211,167,61,0.15)",
                color: "#D3A73D",
                border: "1px solid rgba(211,167,61,0.3)",
                fontWeight: 600,
                letterSpacing: "0.04em",
                fontSize: "0.72rem",
                textTransform: "uppercase",
              }}
            />

            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: "2.4rem", md: "3.2rem", lg: "4rem" },
                fontWeight: 800,
                color: "#fff",
                lineHeight: 1.12,
                letterSpacing: "-0.03em",
                mb: 2.5,
              }}
            >
              Automate your entire{" "}
              <Box component="span" sx={{ background: "linear-gradient(90deg, #D3A73D, #f0c66a)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                print operation.
              </Box>
            </Typography>

            <Typography
              sx={{ fontSize: { xs: "1.05rem", md: "1.2rem" }, color: "rgba(255,255,255,0.58)", lineHeight: 1.78, mb: 4, maxWidth: 560, mx: { xs: "auto", md: 0 } }}
            >
              From order intake to shipping label — Pythias connects your production
              floor, marketplaces, printers, and shipping carriers into a single automated workflow.
            </Typography>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent={{ xs: "center", md: "flex-start" }} sx={{ mb: 6 }}>
              <Button
                component="a"
                href="#calendar-booking-section"
                variant="contained"
                size="large"
                startIcon={<CalendarMonth />}
                sx={{
                  bgcolor: "#D3A73D",
                  color: "#111",
                  fontWeight: 700,
                  px: 3.5,
                  py: 1.5,
                  fontSize: "1rem",
                  "&:hover": { bgcolor: "#b8860b", boxShadow: "0 6px 20px rgba(211,167,61,0.45)" },
                  boxShadow: "0 4px 16px rgba(211,167,61,0.35)",
                }}
              >
                Book a Demo
              </Button>
              <Button
                component="a"
                href="#lead-capture-section"
                variant="outlined"
                size="large"
                startIcon={<RocketLaunch />}
                sx={{
                  borderColor: "rgba(255,255,255,0.25)",
                  color: "#fff",
                  fontWeight: 600,
                  px: 3.5,
                  py: 1.5,
                  fontSize: "1rem",
                  "&:hover": { borderColor: "#fff", bgcolor: "rgba(255,255,255,0.06)" },
                }}
              >
                Get Early Access
              </Button>
            </Stack>

            {/* Stats */}
            <Stack direction="row" spacing={0} divider={<Box sx={{ width: "1px", bgcolor: "rgba(255,255,255,0.1)" }} />} sx={{ justifyContent: { xs: "center", md: "flex-start" } }}>
              {STATS.map((s) => (
                <Box key={s.label} sx={{ px: 3, "&:first-of-type": { pl: 0 } }}>
                  <Typography sx={{ fontSize: "1.5rem", fontWeight: 800, color: "#D3A73D", lineHeight: 1 }}>{s.value}</Typography>
                  <Typography sx={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.45)", fontWeight: 500, mt: 0.5 }}>{s.label}</Typography>
                </Box>
              ))}
            </Stack>
          </Box>

          {/* Logo / visual */}
          <Box sx={{ flexShrink: 0, display: "flex", justifyContent: "center" }}>
            <Box sx={{
              position: "relative",
              background: "linear-gradient(135deg, rgba(211,167,61,0.15) 0%, rgba(211,167,61,0.05) 100%)",
              border: "1px solid rgba(211,167,61,0.2)",
              borderRadius: 6,
              p: { xs: 4, md: 6 },
              backdropFilter: "blur(8px)",
              boxShadow: "0 24px 64px rgba(0,0,0,0.4), 0 0 0 1px rgba(211,167,61,0.1)",
            }}>
              <Image
                src={Logo}
                alt="Pythias Technologies"
                width={260}
                height={320}
                priority
                style={{ width: "100%", maxWidth: 260, height: "auto" }}
              />
            </Box>
          </Box>

        </Box>
      </Container>
    </Box>
  );
}

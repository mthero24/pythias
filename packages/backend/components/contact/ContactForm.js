"use client";
import { useState } from "react";
import {
  Box, Container, Typography, TextField, Button, Stack,
  Alert, Snackbar, Divider, Paper, CircularProgress,
} from "@mui/material";
import PhoneIcon from "@mui/icons-material/Phone";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import EmailIcon from "@mui/icons-material/Email";

export function ContactForm({
  apiUrl = "/api/contact",
  companyName = "Premier Printing",
  phone = "(844) 579-8442",
  address = "21440 Melrose Ave, Southfield MI 48075",
  email = "info@premierprinting.net",
  tagline = "Your full-service print fulfillment partner.",
}) {
  const [form, setForm] = useState({ name: "", company: "", phone: "", email: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [snack, setSnack] = useState({ open: false, msg: "", sev: "success" });

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      setSnack({ open: true, msg: "Please fill in all required fields.", sev: "error" });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.msg);
      setForm({ name: "", company: "", phone: "", email: "", message: "" });
      setSnack({ open: true, msg: "Message sent! We'll be in touch soon.", sev: "success" });
    } catch (err) {
      setSnack({ open: true, msg: err.message || "Something went wrong.", sev: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Box sx={{ minHeight: "100vh", background: "#f8fafc", py: { xs: 5, md: 10 } }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ textAlign: "center", mb: 7 }}>
          <Typography variant="h3" fontWeight={800} letterSpacing={-1} gutterBottom>
            Contact Us
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 560, mx: "auto" }}>
            Have a question or want to work together? Send us a message and we'll get back to you shortly.
          </Typography>
        </Box>

        <Stack direction={{ xs: "column", md: "row" }} spacing={5} alignItems="flex-start">
          {/* Company info card */}
          <Box sx={{ width: { xs: "100%", md: 320 }, flexShrink: 0 }}>
            <Paper elevation={0} sx={{
              border: "1px solid #e2e8f0", borderRadius: 3, p: 4,
              background: "linear-gradient(160deg,#7c3aed 0%,#6d28d9 100%)",
              color: "#fff",
            }}>
              <Typography variant="h6" fontWeight={800} mb={0.5}>{companyName}</Typography>
              <Typography variant="body2" sx={{ opacity: 0.8, mb: 4 }}>
                {tagline}
              </Typography>

              <Stack spacing={3}>
                <Stack direction="row" spacing={1.5} alignItems="flex-start">
                  <PhoneIcon sx={{ fontSize: 20, mt: 0.25, opacity: 0.85 }} />
                  <Box>
                    <Typography variant="caption" sx={{ opacity: 0.7, display: "block" }}>Phone</Typography>
                    <Typography variant="body1" fontWeight={600}>{phone}</Typography>
                  </Box>
                </Stack>

                <Stack direction="row" spacing={1.5} alignItems="flex-start">
                  <LocationOnIcon sx={{ fontSize: 20, mt: 0.25, opacity: 0.85 }} />
                  <Box>
                    <Typography variant="caption" sx={{ opacity: 0.7, display: "block" }}>Address</Typography>
                    <Typography variant="body1" fontWeight={600} sx={{ lineHeight: 1.5 }}>
                      {address}
                    </Typography>
                  </Box>
                </Stack>

                <Stack direction="row" spacing={1.5} alignItems="flex-start">
                  <EmailIcon sx={{ fontSize: 20, mt: 0.25, opacity: 0.85 }} />
                  <Box>
                    <Typography variant="caption" sx={{ opacity: 0.7, display: "block" }}>Email</Typography>
                    <Typography variant="body1" fontWeight={600}>{email}</Typography>
                  </Box>
                </Stack>
              </Stack>

              <Divider sx={{ borderColor: "rgba(255,255,255,.2)", my: 4 }} />
              <Typography variant="body2" sx={{ opacity: 0.75 }}>
                Mon – Fri &nbsp;·&nbsp; 8am – 5pm EST
              </Typography>
            </Paper>
          </Box>

          {/* Form */}
          <Paper elevation={0} sx={{
            flex: 1, border: "1px solid #e2e8f0", borderRadius: 3, p: { xs: 3, md: 5 },
          }}>
            <Box component="form" onSubmit={handleSubmit}>
              <Stack spacing={3}>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <TextField
                    label="Full Name *" fullWidth value={form.name}
                    onChange={set("name")} autoComplete="name"
                  />
                  <TextField
                    label="Company Name" fullWidth value={form.company}
                    onChange={set("company")} autoComplete="organization"
                  />
                </Stack>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <TextField
                    label="Phone Number" fullWidth value={form.phone}
                    onChange={set("phone")} autoComplete="tel" type="tel"
                  />
                  <TextField
                    label="Email Address *" fullWidth value={form.email}
                    onChange={set("email")} autoComplete="email" type="email"
                  />
                </Stack>
                <TextField
                  label="Message *" fullWidth multiline rows={6}
                  value={form.message} onChange={set("message")}
                  placeholder="Tell us about your project or question…"
                />
                <Button
                  type="submit" variant="contained" size="large"
                  disabled={submitting}
                  startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : null}
                  sx={{
                    alignSelf: "flex-start", px: 5, py: 1.5, borderRadius: 2, fontWeight: 700,
                    background: "linear-gradient(135deg,#7c3aed,#6d28d9)",
                    "&:hover": { background: "#6d28d9" },
                  }}
                >
                  {submitting ? "Sending…" : "Send Message"}
                </Button>
              </Stack>
            </Box>
          </Paper>
        </Stack>
      </Container>

      <Snackbar
        open={snack.open} autoHideDuration={5000}
        onClose={() => setSnack(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={snack.sev} onClose={() => setSnack(s => ({ ...s, open: false }))}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}

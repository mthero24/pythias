"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  Box, Container, Typography, TextField, Button,
  Grid, CircularProgress, Alert, Snackbar,
} from "@mui/material";

function savePartial(data) {
  if (!data.email?.trim()) return;
  navigator.sendBeacon?.(
    "/api/contact/partial",
    new Blob([JSON.stringify(data)], { type: "application/json" })
  );
}

export default function LeadCaptureSection() {
  const [form, setForm] = useState({ name: "", email: "", company: "", orderVolume: "", challenges: "" });
  const [submitting, setSubmitting] = useState(false);
  const [snack, setSnack] = useState({ open: false, msg: "", sev: "success" });
  const debounceRef  = useRef(null);
  const submittedRef = useRef(false);
  const formRef      = useRef(form);

  // Keep ref in sync so event listeners always see latest form state
  useEffect(() => { formRef.current = form; }, [form]);

  // Debounced auto-save whenever email is filled and form changes
  useEffect(() => {
    if (!form.email?.trim()) return;
    if (submittedRef.current) return;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      savePartial(form);
    }, 2500);
    return () => clearTimeout(debounceRef.current);
  }, [form]);

  // Save on page hide / tab close
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden" && !submittedRef.current) {
        savePartial(formRef.current);
      }
    };
    const handleBeforeUnload = () => {
      if (!submittedRef.current) savePartial(formRef.current);
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name || !form.email) {
      setSnack({ open: true, msg: "Please fill in your name and email.", sev: "error" });
      return;
    }
    setSubmitting(true);
    const message = [
      form.challenges && `Workflow challenges: ${form.challenges}`,
      form.orderVolume && `Monthly order volume: ${form.orderVolume}`,
    ].filter(Boolean).join("\n\n") || "Requested more information.";

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, email: form.email, company: form.company, message }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      submittedRef.current = true;
      setForm({ name: "", email: "", company: "", orderVolume: "", challenges: "" });
      setSnack({ open: true, msg: "Thanks! We'll be in touch soon.", sev: "success" });
    } catch (err) {
      setSnack({ open: true, msg: err.message || "Something went wrong.", sev: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Box
      component="section"
      id="lead-capture-section"
      sx={{ padding: { xs: "4rem 0", lg: "6rem 0" }, background: "#fafafa" }}
    >
      <Container maxWidth="md">
        <Box sx={{ textAlign: "center", marginBottom: { xs: 4, lg: 5 } }}>
          <Typography
            variant="h2"
            component="h2"
            sx={{ fontSize: { xs: "2rem", md: "2.5rem", lg: "3rem" }, fontWeight: 700, marginBottom: 2, color: "#1a1a1a" }}
          >
            Get More Information About Pythias Technologies
          </Typography>
          <Typography variant="h6" sx={{ color: "#666666", maxWidth: "600px", margin: "0 auto", lineHeight: 1.6 }}>
            Interested in learning more? Fill out the form below and we&apos;ll send
            you detailed information about our platform, pricing, and how it can benefit your business.
          </Typography>
        </Box>

        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{ backgroundColor: "white", padding: { xs: 3, md: 4 }, borderRadius: 3, boxShadow: "0 10px 40px rgba(0,0,0,0.1)" }}
        >
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth name="name" label="Full Name" variant="outlined" required
                value={form.name} onChange={set("name")}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth name="email" label="Email Address" type="email" variant="outlined" required
                value={form.email} onChange={set("email")}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth name="company" label="Company Name" variant="outlined"
                value={form.company} onChange={set("company")}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth name="orderVolume" label="Monthly Order Volume"
                select SelectProps={{ native: true }} variant="outlined"
                value={form.orderVolume} onChange={set("orderVolume")}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
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
                fullWidth name="challenges" label="Tell us about your current workflow challenges"
                multiline rows={4} variant="outlined"
                value={form.challenges} onChange={set("challenges")}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
              />
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ textAlign: "center" }}>
                <Button
                  type="submit" variant="contained" size="large" disabled={submitting}
                  startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : null}
                  sx={{ padding: "1rem 3rem", fontSize: "1.125rem", borderRadius: 2 }}
                >
                  {submitting ? "Sending…" : "Get More Information"}
                </Button>
                <Typography variant="body2" sx={{ color: "#666666", marginTop: 2, fontStyle: "italic" }}>
                  No obligation · Detailed information packet · Custom pricing available
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>
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

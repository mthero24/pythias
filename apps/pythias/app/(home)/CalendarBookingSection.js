"use client";
import { useState, useEffect, useCallback } from "react";
import {
    Box, Container, Typography, Button, TextField,
    CircularProgress, Grid,
} from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import CheckCircleIcon     from "@mui/icons-material/CheckCircle";
import VideoCallIcon        from "@mui/icons-material/VideoCall";
import ArrowBackIcon        from "@mui/icons-material/ArrowBack";

// ── Constants ─────────────────────────────────────────────────────────────────
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAY_LABELS  = ["Su","Mo","Tu","We","Th","Fr","Sa"];
const WEEKDAY_NAMES = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const GOLD  = "#D3A73D";
const DARK  = "#111827";
const LIGHT_BG = "#fafafa";

function formatTime(t24) {
    const [h, m] = t24.split(":").map(Number);
    return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

function formatDateLong(dateStr) {
    const [y, mo, d] = dateStr.split("-").map(Number);
    const dt = new Date(y, mo - 1, d);
    return `${WEEKDAY_NAMES[dt.getDay()]}, ${MONTH_NAMES[dt.getMonth()]} ${d}, ${y}`;
}

function toDateStr(y, m, d) {
    return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function todayStr() {
    const n = new Date();
    return toDateStr(n.getFullYear(), n.getMonth(), n.getDate());
}

// ── CalendarGrid ──────────────────────────────────────────────────────────────
function CalendarGrid({ year, month, selectedDate, onSelect }) {
    const today      = todayStr();
    const firstDow   = new Date(year, month, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells      = [];

    // Leading empty cells
    for (let i = 0; i < firstDow; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);

    const isWeekend = (d) => {
        const dow = new Date(year, month, d).getDay();
        return dow === 0 || dow === 6;
    };
    const isPast = (d) => toDateStr(year, month, d) < today;
    const isSelected = (d) => toDateStr(year, month, d) === selectedDate;

    return (
        <Box>
            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", mb: 1 }}>
                {DAY_LABELS.map((l) => (
                    <Box key={l} sx={{ textAlign: "center", py: 1, fontSize: "0.75rem", fontWeight: 700, color: l === "Su" || l === "Sa" ? "#d1d5db" : "#6b7280" }}>
                        {l}
                    </Box>
                ))}
            </Box>
            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px" }}>
                {cells.map((d, i) => {
                    if (!d) return <Box key={`empty-${i}`} />;
                    const disabled = isWeekend(d) || isPast(d);
                    const selected = isSelected(d);
                    return (
                        <Box
                            key={d}
                            onClick={() => !disabled && onSelect(toDateStr(year, month, d))}
                            sx={{
                                aspectRatio: "1",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                borderRadius: "50%",
                                fontSize: "0.875rem",
                                fontWeight: selected ? 700 : 500,
                                cursor:     disabled ? "default" : "pointer",
                                color:      disabled ? "#d1d5db" : selected ? "#111" : DARK,
                                bgcolor:    selected ? GOLD : "transparent",
                                transition: "background 0.15s, color 0.15s",
                                "&:hover":  disabled ? {} : { bgcolor: selected ? GOLD : "rgba(211,167,61,0.12)" },
                            }}
                        >
                            {d}
                        </Box>
                    );
                })}
            </Box>
        </Box>
    );
}

// ── TimeSlotPicker ────────────────────────────────────────────────────────────
function TimeSlotPicker({ date, selectedTime, onSelect }) {
    const [slots, setSlots]   = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!date) return;
        setLoading(true);
        fetch(`/api/calendar/slots?date=${date}`)
            .then((r) => r.json())
            .then((data) => { setSlots(data.slots ?? []); setLoading(false); })
            .catch(() => setLoading(false));
    }, [date]);

    if (loading) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                <CircularProgress size={28} sx={{ color: GOLD }} />
            </Box>
        );
    }

    const available = slots.filter((s) => s.available);
    if (available.length === 0) {
        return (
            <Typography sx={{ color: "#6b7280", textAlign: "center", py: 3, fontSize: "0.9rem" }}>
                No available slots on this day. Please choose another date.
            </Typography>
        );
    }

    return (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, pt: 1 }}>
            {slots.map(({ time, available: avail }) => (
                <Button
                    key={time}
                    variant={selectedTime === time ? "contained" : "outlined"}
                    disabled={!avail}
                    onClick={() => avail && onSelect(time)}
                    sx={{
                        minWidth: 100,
                        fontSize: "0.8rem",
                        fontWeight: 600,
                        borderRadius: 2,
                        ...(selectedTime === time
                            ? { bgcolor: GOLD, color: "#111", borderColor: GOLD, "&:hover": { bgcolor: "#b8860b" } }
                            : avail
                            ? { color: DARK, borderColor: "#e5e7eb", "&:hover": { borderColor: GOLD, color: GOLD, bgcolor: "rgba(211,167,61,0.06)" } }
                            : { color: "#d1d5db", borderColor: "#f3f4f6" }),
                    }}
                >
                    {formatTime(time)}
                </Button>
            ))}
        </Box>
    );
}

// ── BookingForm ───────────────────────────────────────────────────────────────
function BookingForm({ date, time, onBack, onConfirmed }) {
    const [form, setForm]         = useState({ name: "", email: "", company: "", phone: "" });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError]       = useState("");

    const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");
        if (!form.name.trim())  return setError("Name is required.");
        if (!form.email.trim()) return setError("Email is required.");

        setSubmitting(true);
        try {
            const res  = await fetch("/api/calendar/book", {
                method:  "POST",
                headers: { "Content-Type": "application/json" },
                body:    JSON.stringify({ ...form, date, startTime: time }),
            });
            const data = await res.json();
            if (!res.ok) { setError(data.error || "Booking failed. Please try again."); setSubmitting(false); return; }
            // Real lead captured (demo booked + saved) — fire GA4 conversion only on success.
            try { window.gtag?.("event", "generate_lead", { method: "demo_booking" }); } catch {}
            onConfirmed({ meetLink: data.meetLink, date, startTime: data.startTime, name: form.name.trim(), email: form.email.trim() });
        } catch {
            setError("Network error. Please try again.");
            setSubmitting(false);
        }
    }

    const fieldSx = { mb: 2, "& .MuiOutlinedInput-root": { borderRadius: 2, "&:hover fieldset": { borderColor: GOLD }, "&.Mui-focused fieldset": { borderColor: GOLD } }, "& label.Mui-focused": { color: GOLD } };

    return (
        <Box component="form" onSubmit={handleSubmit} noValidate>
            {/* Selected slot summary */}
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3, p: 2, bgcolor: "rgba(211,167,61,0.08)", borderRadius: 2, border: "1px solid rgba(211,167,61,0.2)" }}>
                <Box>
                    <Typography sx={{ fontWeight: 700, color: DARK, fontSize: "0.9rem" }}>{formatDateLong(date)}</Typography>
                    <Typography sx={{ color: "#6b7280", fontSize: "0.8rem" }}>{formatTime(time)} Eastern Time · 30 min</Typography>
                </Box>
                <Button
                    size="small"
                    onClick={onBack}
                    startIcon={<ArrowBackIcon fontSize="small" />}
                    sx={{ color: GOLD, fontWeight: 600, fontSize: "0.8rem", "&:hover": { bgcolor: "rgba(211,167,61,0.06)" } }}
                >
                    Change
                </Button>
            </Box>

            <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                    <TextField required fullWidth label="Your name" value={form.name} onChange={set("name")} sx={fieldSx} />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField required fullWidth label="Email address" type="email" value={form.email} onChange={set("email")} sx={fieldSx} />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Company (optional)" value={form.company} onChange={set("company")} sx={fieldSx} />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Phone (optional)" value={form.phone} onChange={set("phone")} sx={fieldSx} />
                </Grid>
            </Grid>

            {error && (
                <Typography sx={{ color: "#ef4444", fontSize: "0.85rem", mb: 2, mt: -1 }}>{error}</Typography>
            )}

            <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={submitting}
                sx={{ mt: 1, py: 1.5, bgcolor: GOLD, color: "#111", fontWeight: 700, fontSize: "1rem", borderRadius: 2, "&:hover": { bgcolor: "#b8860b" }, "&:disabled": { bgcolor: "#e5c97a", color: "#666" } }}
            >
                {submitting ? <CircularProgress size={22} sx={{ color: "#111" }} /> : "Book My Demo →"}
            </Button>

            <Typography sx={{ fontSize: "0.75rem", color: "#9ca3af", textAlign: "center", mt: 1.5 }}>
                No commitment · No credit card · Cancel anytime
            </Typography>
        </Box>
    );
}

// ── Confirmation ──────────────────────────────────────────────────────────────
function Confirmation({ booking }) {
    return (
        <Box sx={{ textAlign: "center", py: 2 }}>
            <CheckCircleIcon sx={{ fontSize: 56, color: "#22c55e", mb: 2 }} />
            <Typography variant="h5" sx={{ fontWeight: 800, color: DARK, mb: 1 }}>
                You&apos;re booked!
            </Typography>
            <Typography sx={{ color: "#6b7280", mb: 3 }}>
                {formatDateLong(booking.date)} at {formatTime(booking.startTime)} ET
            </Typography>

            {booking.meetLink ? (
                <Button
                    variant="contained"
                    size="large"
                    href={booking.meetLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    startIcon={<VideoCallIcon />}
                    sx={{ bgcolor: "#1a73e8", color: "#fff", fontWeight: 700, px: 4, py: 1.5, borderRadius: 2, fontSize: "1rem", "&:hover": { bgcolor: "#1557b0" }, mb: 3 }}
                >
                    Save Your Google Meet Link
                </Button>
            ) : (
                <Typography sx={{ color: "#6b7280", mb: 3, fontStyle: "italic", fontSize: "0.9rem" }}>
                    Your Google Meet link will be emailed to you shortly.
                </Typography>
            )}

            <Typography sx={{ fontSize: "0.8rem", color: "#9ca3af" }}>
                A confirmation was sent to <strong>{booking.email}</strong>
            </Typography>
            <Typography sx={{ fontSize: "0.75rem", color: "#9ca3af", mt: 1 }}>
                Need to reschedule? Reply to that email or call (844) 579-8442.
            </Typography>
        </Box>
    );
}

// ── Main Section ──────────────────────────────────────────────────────────────
export default function CalendarBookingSection() {
    const now        = new Date();
    const [viewYear,  setViewYear]  = useState(now.getFullYear());
    const [viewMonth, setViewMonth] = useState(now.getMonth());
    const [selDate,   setSelDate]   = useState(null);
    const [selTime,   setSelTime]   = useState(null);
    const [step,      setStep]      = useState("date"); // "date" | "form" | "confirmed"
    const [booking,   setBooking]   = useState(null);

    const prevMonth = () => {
        if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
        else setViewMonth((m) => m - 1);
    };
    const nextMonth = () => {
        if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
        else setViewMonth((m) => m + 1);
    };

    // Don't allow navigating before current month
    const isMinMonth = viewYear === now.getFullYear() && viewMonth === now.getMonth();

    const handleDateSelect = useCallback((date) => {
        setSelDate(date);
        setSelTime(null);
    }, []);

    const handleTimeSelect = useCallback((time) => {
        setSelTime(time);
    }, []);

    const handleProceed = () => {
        if (selDate && selTime) setStep("form");
    };

    const handleConfirmed = (data) => {
        setBooking(data);
        setStep("confirmed");
    };

    const handleBack = () => {
        setStep("date");
        setSelTime(null);
    };

    return (
        <Box
            component="section"
            id="calendar-booking-section"
            sx={{ padding: { xs: "4rem 0", lg: "6rem 0" }, background: "#fff" }}
        >
            <Container maxWidth="lg">
                <Box sx={{ textAlign: "center", mb: { xs: 4, lg: 5 } }}>
                    <Typography
                        variant="h2"
                        component="h2"
                        sx={{ fontSize: { xs: "2rem", md: "2.5rem", lg: "3rem" }, fontWeight: 800, mb: 2, color: DARK, letterSpacing: "-0.02em" }}
                    >
                        Book Your Live Demo
                    </Typography>
                    <Typography
                        sx={{ color: "#6b7280", maxWidth: 520, margin: "0 auto", lineHeight: 1.7, fontSize: "1.0625rem" }}
                    >
                        Pick a time and we&apos;ll walk through your exact workflow — not a generic slide deck.
                        30 minutes, no commitment.
                    </Typography>
                </Box>

                <Box
                    sx={{
                        maxWidth: step === "confirmed" ? 520 : 780,
                        mx: "auto",
                        bgcolor: LIGHT_BG,
                        borderRadius: 3,
                        border: "1px solid #f0f0f0",
                        boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
                        p: { xs: 3, md: 4 },
                    }}
                >
                    {step === "confirmed" && booking ? (
                        <Confirmation booking={booking} />
                    ) : step === "form" ? (
                        <BookingForm
                            date={selDate}
                            time={selTime}
                            onBack={handleBack}
                            onConfirmed={handleConfirmed}
                        />
                    ) : (
                        /* Date + Time picker */
                        <>
                            {/* Month navigation */}
                            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                                <Button
                                    size="small"
                                    onClick={prevMonth}
                                    disabled={isMinMonth}
                                    sx={{ minWidth: 36, color: isMinMonth ? "#d1d5db" : DARK }}
                                >
                                    <ArrowBackIosNewIcon fontSize="small" />
                                </Button>
                                <Typography sx={{ fontWeight: 700, fontSize: "1rem", color: DARK }}>
                                    {MONTH_NAMES[viewMonth]} {viewYear}
                                </Typography>
                                <Button size="small" onClick={nextMonth} sx={{ minWidth: 36, color: DARK }}>
                                    <ArrowForwardIosIcon fontSize="small" />
                                </Button>
                            </Box>

                            <CalendarGrid
                                year={viewYear}
                                month={viewMonth}
                                selectedDate={selDate}
                                onSelect={handleDateSelect}
                            />

                            {/* Time slots */}
                            {selDate && (
                                <Box sx={{ mt: 3, pt: 3, borderTop: "1px solid #f0f0f0" }}>
                                    <Typography sx={{ fontWeight: 700, color: DARK, mb: 1.5, fontSize: "0.9rem" }}>
                                        {formatDateLong(selDate)} — Eastern Time
                                    </Typography>
                                    <TimeSlotPicker
                                        date={selDate}
                                        selectedTime={selTime}
                                        onSelect={handleTimeSelect}
                                    />
                                </Box>
                            )}

                            {/* Continue button */}
                            {selDate && selTime && (
                                <Box sx={{ mt: 3 }}>
                                    <Button
                                        variant="contained"
                                        fullWidth
                                        onClick={handleProceed}
                                        sx={{ py: 1.5, bgcolor: GOLD, color: "#111", fontWeight: 700, fontSize: "1rem", borderRadius: 2, "&:hover": { bgcolor: "#b8860b" } }}
                                    >
                                        Continue with {formatTime(selTime)} →
                                    </Button>
                                </Box>
                            )}

                            {!selDate && (
                                <Typography sx={{ textAlign: "center", color: "#9ca3af", fontSize: "0.8rem", mt: 2 }}>
                                    Select a weekday to see available times
                                </Typography>
                            )}
                        </>
                    )}
                </Box>

                <Typography sx={{ textAlign: "center", color: "#9ca3af", fontSize: "0.75rem", mt: 2, fontStyle: "italic" }}>
                    All times shown in Eastern Time (ET) · Mon–Fri 9 AM – 4 PM
                </Typography>
            </Container>
        </Box>
    );
}

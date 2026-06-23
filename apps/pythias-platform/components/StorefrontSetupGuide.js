"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, Box, Typography, Stack, LinearProgress, IconButton } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import CloseIcon from "@mui/icons-material/Close";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import Link from "next/link";

// In-app onboarding checklist for standalone Storefront Cloud sellers.
// `steps`: [{ key, label, desc, href, done }] computed server-side on the dashboard.
export default function StorefrontSetupGuide({ steps = [], storeKey = "default" }) {
    const lsKey = `sf_setup_dismissed_${storeKey}`;
    const [dismissed, setDismissed] = useState(true); // hidden until localStorage is read (avoids flash)
    useEffect(() => { setDismissed(localStorage.getItem(lsKey) === "1"); }, [lsKey]);

    if (!steps.length || dismissed) return null;

    const done = steps.filter((s) => s.done).length;
    const pct = Math.round((done / steps.length) * 100);
    const allDone = done === steps.length;

    return (
        <Card variant="outlined" sx={{ mb: 4, borderColor: "rgba(14,159,110,0.45)", bgcolor: "rgba(14,159,110,0.04)" }}>
            <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                        <Typography variant="h6" fontWeight={800}>Get your store ready</Typography>
                        <Typography variant="body2" color="text.secondary">
                            {allDone ? "You're all set — launch when you're ready. 🎉" : `${done} of ${steps.length} steps complete`}
                        </Typography>
                    </Box>
                    <IconButton size="small" onClick={() => { localStorage.setItem(lsKey, "1"); setDismissed(true); }} aria-label="Dismiss setup guide">
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </Stack>

                <LinearProgress
                    variant="determinate"
                    value={pct}
                    sx={{ my: 2, height: 8, borderRadius: 4, bgcolor: "rgba(14,159,110,0.12)", "& .MuiLinearProgress-bar": { bgcolor: "#0e9f6e" } }}
                />

                <Stack spacing={0.5}>
                    {steps.map((s) => (
                        <Box
                            key={s.key}
                            component={Link}
                            href={s.href}
                            sx={{
                                display: "flex", alignItems: "center", gap: 1.5, p: 1, borderRadius: 1,
                                textDecoration: "none", color: "inherit", "&:hover": { bgcolor: "action.hover" },
                            }}
                        >
                            {s.done
                                ? <CheckCircleIcon sx={{ color: "#0e9f6e" }} />
                                : <RadioButtonUncheckedIcon sx={{ color: "text.disabled" }} />}
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography
                                    variant="subtitle2"
                                    fontWeight={700}
                                    sx={{ textDecoration: s.done ? "line-through" : "none", color: s.done ? "text.secondary" : "text.primary" }}
                                >
                                    {s.label}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">{s.desc}</Typography>
                            </Box>
                            {!s.done && <ArrowForwardIcon fontSize="small" sx={{ color: "text.disabled" }} />}
                        </Box>
                    ))}
                </Stack>
            </CardContent>
        </Card>
    );
}

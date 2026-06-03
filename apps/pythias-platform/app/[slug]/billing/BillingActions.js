"use client";
import { useState } from "react";
import {
    Box, Button, Card, CardContent, CardActionArea, Chip, CircularProgress,
    Dialog, DialogTitle, DialogContent, DialogActions,
    Divider, Stack, Typography, Alert,
} from "@mui/material";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ComputerIcon from "@mui/icons-material/Computer";
import FactoryIcon from "@mui/icons-material/Factory";

const TIER_ORDER = ["starter", "professional", "business", "scale", "enterprise"];

const TIER_INFO = {
    starter:      { label: "Starter",      price: 199,   color: "#9e9e9e" },
    professional: { label: "Professional", price: 599,   color: "#1976d2" },
    business:     { label: "Business",     price: 1499,  color: "#7b1fa2" },
    scale:        { label: "Scale",        price: 3000,  color: "#e65100" },
    enterprise:   { label: "Enterprise",   price: 5500,  color: "#1b5e20" },
};

const TIER_HIGHLIGHTS = {
    starter:      ["500 orders/mo", "250 products", "2 integrations", "5 users"],
    professional: ["3,000 orders/mo", "1,500 products", "5 integrations", "10 users"],
    business:     ["15,000 orders/mo", "10,000 products", "All integrations", "25 users"],
    scale:        ["Unlimited orders", "Unlimited products", "All integrations", "50 users"],
    enterprise:   ["Unlimited everything", "Unlimited users", "Dedicated engineer", "30-day support"],
};

export default function BillingActions({ currentTier, hasStripeCustomer }) {
    const [upgradeOpen, setUpgradeOpen] = useState(false);
    const [selectedTier, setSelectedTier] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const currentIdx = TIER_ORDER.indexOf(currentTier);
    const upgradeTiers = TIER_ORDER.slice(currentIdx + 1).filter(t => t !== "enterprise");

    const handleUpgrade = async () => {
        if (!selectedTier) return;
        setLoading(true);
        setError("");
        try {
            const res = await fetch("/api/billing/portal", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tier: selectedTier }),
            });
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                setError(data.error || "Something went wrong");
                setLoading(false);
            }
        } catch {
            setError("Network error — please try again");
            setLoading(false);
        }
    };

    const handleManageBilling = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await fetch("/api/billing/portal", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({}),
            });
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                setError(data.error || "Something went wrong");
                setLoading(false);
            }
        } catch {
            setError("Network error — please try again");
            setLoading(false);
        }
    };

    const handleOnboarding = async (type) => {
        setLoading(true);
        setError("");
        try {
            const res = await fetch("/api/billing/onboarding", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type }),
            });
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                setError(data.error || "Something went wrong");
                setLoading(false);
            }
        } catch {
            setError("Network error — please try again");
            setLoading(false);
        }
    };

    return (
        <>
            {/* Plan action buttons */}
            <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                {upgradeTiers.length > 0 && (
                    <Button
                        variant="contained"
                        size="small"
                        startIcon={<ArrowUpwardIcon />}
                        onClick={() => { setSelectedTier(null); setError(""); setUpgradeOpen(true); }}
                    >
                        Upgrade plan
                    </Button>
                )}
                {hasStripeCustomer && (
                    <Button
                        variant="outlined"
                        size="small"
                        onClick={handleManageBilling}
                        disabled={loading}
                    >
                        Manage billing
                    </Button>
                )}
            </Stack>

            {error && <Alert severity="error" sx={{ mt: 1 }}>{error}</Alert>}

            {/* Onboarding add-ons */}
            <Box sx={{ mt: 4 }}>
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>Onboarding</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Get up and running faster with hands-on help from the Pythias team.
                </Typography>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                    {/* Remote */}
                    <Card variant="outlined" sx={{ flex: 1, borderRadius: 2 }}>
                        <CardContent>
                            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                                <ComputerIcon color="primary" />
                                <Typography variant="subtitle2" fontWeight={700}>Remote Onboarding</Typography>
                            </Stack>
                            <Typography variant="h6" fontWeight={800} sx={{ mb: 0.5 }}>$3,000</Typography>
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5 }}>
                                One-time fee
                            </Typography>
                            <Stack spacing={0.5} sx={{ mb: 2 }}>
                                {[
                                    "5 days (Mon–Fri), 4 hrs/day via Zoom",
                                    "Data import & migration assistance",
                                    "Printer & hardware configuration",
                                    "Marketplace connection setup",
                                    "Team training & walkthrough",
                                ].map(b => (
                                    <Stack key={b} direction="row" spacing={0.75} alignItems="flex-start">
                                        <CheckCircleIcon sx={{ fontSize: 14, color: "success.main", mt: "2px", flexShrink: 0 }} />
                                        <Typography variant="caption">{b}</Typography>
                                    </Stack>
                                ))}
                            </Stack>
                            <Button
                                fullWidth
                                variant="contained"
                                size="small"
                                disabled={loading}
                                onClick={() => handleOnboarding("remote")}
                                startIcon={loading ? <CircularProgress size={14} /> : null}
                            >
                                Purchase
                            </Button>
                        </CardContent>
                    </Card>

                    {/* On-site */}
                    <Card variant="outlined" sx={{ flex: 1, borderRadius: 2 }}>
                        <CardContent>
                            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                                <FactoryIcon color="secondary" />
                                <Typography variant="subtitle2" fontWeight={700}>On-Site Onboarding</Typography>
                            </Stack>
                            <Typography variant="h6" fontWeight={800} sx={{ mb: 0.5 }}>From $15,000</Typography>
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5 }}>
                                Custom quote
                            </Typography>
                            <Stack spacing={0.5} sx={{ mb: 2 }}>
                                {[
                                    "Dedicated engineer at your warehouse",
                                    "Complete production install",
                                    "Complete data migration",
                                    "On-site hardware & printer setup",
                                    "30-day post-launch dedicated support",
                                ].map(b => (
                                    <Stack key={b} direction="row" spacing={0.75} alignItems="flex-start">
                                        <CheckCircleIcon sx={{ fontSize: 14, color: "success.main", mt: "2px", flexShrink: 0 }} />
                                        <Typography variant="caption">{b}</Typography>
                                    </Stack>
                                ))}
                            </Stack>
                            <Button
                                fullWidth
                                variant="outlined"
                                size="small"
                                href="mailto:sales@pythiastechnologies.com?subject=On-Site%20Onboarding%20Inquiry"
                            >
                                Contact sales
                            </Button>
                        </CardContent>
                    </Card>
                </Stack>
            </Box>

            {/* Upgrade dialog */}
            <Dialog open={upgradeOpen} onClose={() => !loading && setUpgradeOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 700 }}>Upgrade your plan</DialogTitle>
                <DialogContent>
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                    <Stack spacing={1.5}>
                        {upgradeTiers.map(tier => {
                            const info = TIER_INFO[tier];
                            const isSelected = selectedTier === tier;
                            return (
                                <Card
                                    key={tier}
                                    variant="outlined"
                                    sx={{
                                        borderColor: isSelected ? "primary.main" : "divider",
                                        borderWidth: isSelected ? 2 : 1,
                                        borderRadius: 2,
                                        cursor: "pointer",
                                    }}
                                    onClick={() => setSelectedTier(tier)}
                                >
                                    <CardActionArea sx={{ p: 2 }}>
                                        <Stack direction="row" alignItems="center" justifyContent="space-between">
                                            <Box>
                                                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                                                    <Chip label={info.label} size="small" sx={{ bgcolor: info.color, color: "#fff", fontWeight: 700 }} />
                                                    <Typography variant="subtitle2" fontWeight={700}>${info.price}/mo</Typography>
                                                </Stack>
                                                <Stack direction="row" flexWrap="wrap" gap={0.5}>
                                                    {TIER_HIGHLIGHTS[tier].map(h => (
                                                        <Chip key={h} label={h} size="small" variant="outlined" />
                                                    ))}
                                                </Stack>
                                            </Box>
                                            {isSelected && <CheckCircleIcon color="primary" />}
                                        </Stack>
                                    </CardActionArea>
                                </Card>
                            );
                        })}
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setUpgradeOpen(false)} disabled={loading}>Cancel</Button>
                    <Button
                        variant="contained"
                        disabled={!selectedTier || loading}
                        onClick={handleUpgrade}
                        startIcon={loading ? <CircularProgress size={16} /> : null}
                    >
                        {loading ? "Redirecting…" : "Continue to checkout"}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}

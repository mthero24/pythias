"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Box, Card, CardContent, TextField, Button, Typography, Alert, Stack, Divider, Chip, IconButton, InputAdornment } from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { TIERS } from "@/lib/tiers";

const revealAdornment = (show, toggle) => ({
    endAdornment: (
        <InputAdornment position="end">
            <IconButton onClick={toggle} edge="end" size="small" tabIndex={-1} aria-label="toggle password visibility">
                {show ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
            </IconButton>
        </InputAdornment>
    ),
});

// ── Fulfillment Cloud tiers ───────────────────────────────────────────────────
const FC_TIER_OPTIONS = ['starter', 'professional', 'business', 'scale'];
const VALID_FC_TIERS  = new Set(FC_TIER_OPTIONS);

// ── Commerce Cloud tiers ─────────────────────────────────────────────────────
const CC_TIERS = [
    { key: "free",       label: "Free",       price: "$0/mo",   marginFee: "15% fee on margin", desc: "1 integration · 50 products · 1 user" },
    { key: "launch",     label: "Launch",     price: "$79/mo",  marginFee: "8% fee on margin",  desc: "3 integrations · 250 products · 5 users" },
    { key: "growth",     label: "Growth",     price: "$299/mo", marginFee: "5% fee on margin",  desc: "All integrations · 1,500 products · 15 users" },
    { key: "scale",      label: "Scale",      price: "$799/mo", marginFee: "2% fee on margin",  desc: "All integrations · unlimited products · 50 users" },
    { key: "enterprise", label: "Enterprise", price: "Custom",  marginFee: "Negotiated",         desc: "Unlimited everything · dedicated support" },
];

// ── Storefront Cloud tiers (standalone, self-fulfill — mirror lib/storefrontPlans.js) ─────────
const SF_TIERS = [
    { key: "starter",    label: "Starter",    price: "$49/mo",  desc: "1 storefront · unlimited products · email & SMS marketing" },
    { key: "pro",        label: "Pro",        price: "$149/mo", desc: "3 storefronts · AI autopilot · automations & A/B testing" },
    { key: "enterprise", label: "Enterprise", price: "$399/mo", desc: "5 storefronts · merchant of record · priority support" },
];
const VALID_SF_TIERS = new Set(SF_TIERS.map(t => t.key));

function RegisterForm() {
    const router       = useRouter();
    const searchParams = useSearchParams();
    const planParam    = searchParams.get("plan");
    const typeParam    = searchParams.get("type");
    const isCommerce   = typeParam === "commerce";
    const isStorefront = typeParam === "storefront";

    // Per-product branding: accent color, cloud label, and the simple tier list (commerce + storefront
    // share the same card shape; fulfillment pulls from lib/tiers).
    const accent      = isStorefront ? "#0e9f6e" : isCommerce ? "#6366f1" : "#b8860b";
    const accentHover = isStorefront ? "#0b8a5f" : isCommerce ? "#4f46e5" : "#9a7209";
    const cloudLabel  = isStorefront ? "Storefront Cloud" : isCommerce ? "Commerce Cloud" : "Fulfillment Cloud";
    const accentBtnSx = (isCommerce || isStorefront) ? { bgcolor: accent, "&:hover": { bgcolor: accentHover } } : {};
    const simpleTiers = isStorefront ? SF_TIERS : isCommerce ? CC_TIERS : null;
    const orgTypeValue = isStorefront ? "storefront" : isCommerce ? "commerce" : "fulfillment";

    const initialTier = isStorefront
        ? (VALID_SF_TIERS.has(planParam) ? planParam : "starter")
        : isCommerce
            ? (CC_TIERS.some(t => t.key === planParam) ? planParam : "free")
            : (VALID_FC_TIERS.has(planParam) ? planParam : "starter");

    const [step, setStep]     = useState(1);
    const [form, setForm]     = useState({
        orgName: "", slug: "", billingEmail: "", tier: initialTier,
        firstName: "", lastName: "", email: "", password: "", confirm: "",
    });
    const [error, setError]   = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

    async function handleSubmit(e) {
        e.preventDefault();
        if (form.password !== form.confirm) { setError("Passwords do not match"); return; }
        setLoading(true);
        setError("");
        try {
            const res = await fetch("/api/orgs", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...form, orgType: orgTypeValue }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) { setError(data.error || "Registration failed"); setLoading(false); return; }
            router.push("/login?registered=1");
        } catch (err) {
            setError("Could not reach the server. Please try again.");
            setLoading(false);
        }
    }

    const selectedSimpleTier = simpleTiers?.find(t => t.key === form.tier);
    const selectedFCTier = TIERS[form.tier];

    return (
        <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "background.default", py: 4 }}>
            <Card sx={{ width: "100%", maxWidth: 540 }}>
                <CardContent sx={{ p: 4 }}>
                    <Stack spacing={3}>
                        <Box>
                            <Chip
                                size="small"
                                label={cloudLabel}
                                sx={{
                                    mb: 1,
                                    bgcolor: isStorefront ? "rgba(14,159,110,0.12)" : isCommerce ? "rgba(99,102,241,0.12)" : "rgba(211,167,61,0.12)",
                                    color: accent,
                                    fontWeight: 700,
                                    fontSize: "0.7rem",
                                }}
                            />
                            <Typography variant="h5" fontWeight={700}>
                                {isStorefront ? "Launch your store" : isCommerce ? "Start selling" : "Start your free trial"}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {isStorefront
                                    ? "Build your own branded online store — you sell, you fulfill. 14 days free."
                                    : isCommerce
                                        ? "No monthly cost on the free plan — pay only when you make a sale."
                                        : "14 days free, no credit card required"}
                            </Typography>
                        </Box>

                        {error && <Alert severity="error">{error}</Alert>}

                        <form onSubmit={handleSubmit}>
                            <Stack spacing={2}>
                                {/* ── Step 1: Pick a plan ── */}
                                {step === 1 && (
                                    <>
                                        <Typography variant="subtitle2" color="text.secondary">Choose your plan</Typography>

                                        {simpleTiers ? (
                                            simpleTiers.map(t => (
                                                <Card
                                                    key={t.key}
                                                    variant="outlined"
                                                    onClick={() => setForm(f => ({ ...f, tier: t.key }))}
                                                    sx={{
                                                        cursor: "pointer",
                                                        borderColor: form.tier === t.key ? accent : "divider",
                                                        borderWidth: form.tier === t.key ? 2 : 1,
                                                        p: 1.5,
                                                    }}
                                                >
                                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                                        <Box>
                                                            <Typography variant="subtitle1" fontWeight={700}>{t.label}</Typography>
                                                            <Typography variant="caption" color="text.secondary">{t.desc}</Typography>
                                                        </Box>
                                                        <Box sx={{ textAlign: "right", flexShrink: 0, ml: 1 }}>
                                                            <Chip label={t.price} color={form.tier === t.key ? "primary" : "default"} size="small" sx={{ display: "block", mb: 0.5 }} />
                                                            {t.marginFee && <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.65rem" }}>{t.marginFee}</Typography>}
                                                        </Box>
                                                    </Stack>
                                                </Card>
                                            ))
                                        ) : (
                                            FC_TIER_OPTIONS.map(t => {
                                                const td = TIERS[t];
                                                return (
                                                    <Card
                                                        key={t}
                                                        variant="outlined"
                                                        onClick={() => setForm(f => ({ ...f, tier: t }))}
                                                        sx={{
                                                            cursor: "pointer",
                                                            borderColor: form.tier === t ? "primary.main" : "divider",
                                                            borderWidth: form.tier === t ? 2 : 1,
                                                            p: 1.5,
                                                        }}
                                                    >
                                                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                                                            <Box>
                                                                <Typography variant="subtitle1" fontWeight={700}>{td.label}</Typography>
                                                                <Typography variant="caption" color="text.secondary">
                                                                    {td.limits.ordersPerMonth === -1 ? "Unlimited" : td.limits.ordersPerMonth.toLocaleString()} orders/mo
                                                                    {" · "}{td.limits.users} users
                                                                </Typography>
                                                            </Box>
                                                            <Chip label={`$${td.price}/mo`} color={form.tier === t ? "primary" : "default"} size="small" />
                                                        </Stack>
                                                    </Card>
                                                );
                                            })
                                        )}

                                        <Button
                                            variant="contained"
                                            onClick={() => setStep(2)}
                                            fullWidth
                                            sx={accentBtnSx}
                                        >
                                            Continue with {simpleTiers ? selectedSimpleTier?.label : selectedFCTier?.label}
                                        </Button>
                                    </>
                                )}

                                {/* ── Step 2: Org details ── */}
                                {step === 2 && (
                                    <>
                                        <Typography variant="subtitle2" color="text.secondary">Organization details</Typography>
                                        <TextField label="Company name" value={form.orgName} onChange={set("orgName")} required fullWidth size="small" />
                                        <TextField
                                            label="URL slug"
                                            value={form.slug}
                                            onChange={set("slug")}
                                            required fullWidth size="small"
                                            helperText="Letters, numbers, and hyphens only"
                                            inputProps={{ pattern: "[a-z0-9-]+" }}
                                        />
                                        <TextField label="Billing email" type="email" value={form.billingEmail} onChange={set("billingEmail")} required fullWidth size="small" />
                                        <Stack direction="row" spacing={1}>
                                            <Button variant="outlined" onClick={() => setStep(1)} fullWidth>Back</Button>
                                            <Button variant="contained" onClick={() => setStep(3)} fullWidth
                                                sx={accentBtnSx}>
                                                Continue
                                            </Button>
                                        </Stack>
                                    </>
                                )}

                                {/* ── Step 3: Account ── */}
                                {step === 3 && (
                                    <>
                                        <Typography variant="subtitle2" color="text.secondary">Your account</Typography>
                                        <Stack direction="row" spacing={1}>
                                            <TextField label="First name" value={form.firstName} onChange={set("firstName")} required fullWidth size="small" />
                                            <TextField label="Last name"  value={form.lastName}  onChange={set("lastName")}  required fullWidth size="small" />
                                        </Stack>
                                        <TextField label="Email"            type="email"    value={form.email}    onChange={set("email")}    required fullWidth size="small" />
                                        <TextField label="Password" type={showPassword ? "text" : "password"} value={form.password} onChange={set("password")} required fullWidth size="small"
                                            InputProps={revealAdornment(showPassword, () => setShowPassword(s => !s))} />
                                        <TextField label="Confirm password" type={showPassword ? "text" : "password"} value={form.confirm} onChange={set("confirm")} required fullWidth size="small"
                                            InputProps={revealAdornment(showPassword, () => setShowPassword(s => !s))} />
                                        <Stack direction="row" spacing={1}>
                                            <Button variant="outlined" onClick={() => setStep(2)} fullWidth>Back</Button>
                                            <Button type="submit" variant="contained" fullWidth disabled={loading}
                                                sx={accentBtnSx}>
                                                {loading ? "Creating account..." : isStorefront ? "Launch my store" : isCommerce ? "Start selling" : "Start free trial"}
                                            </Button>
                                        </Stack>
                                    </>
                                )}
                            </Stack>
                        </form>

                        <Divider />
                        <Typography variant="body2" color="text.secondary" align="center">
                            Already have an account?{" "}
                            <a href="/login" style={{ color: "inherit", fontWeight: 600, textDecoration: "underline" }}>Sign in</a>
                        </Typography>
                    </Stack>
                </CardContent>
            </Card>
        </Box>
    );
}

export default function RegisterPage() {
    return (
        <Suspense>
            <RegisterForm />
        </Suspense>
    );
}

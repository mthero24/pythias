"use client";
import { useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Script from "next/script";
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
    const isFounder    = searchParams.get("founder") === "1";
    // Founding-offer tier (from the /founding page CTA): founder | early | ten
    const FOUNDER_OFFERS = {
        founder: "🎉 Founding Member — 25% off for life + free remote onboarding",
        early:   "🎉 Early-Bird Member — 20% off for a year + 50% off remote onboarding",
        ten:     "🎉 Early Adopter — 10% off for a year",
    };
    const founderBanner = isFounder ? (FOUNDER_OFFERS[searchParams.get("offer")] || FOUNDER_OFFERS.founder) : null;

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
        orgName: "", tier: initialTier, firstName: "", email: "", password: "",
    });
    const [error, setError]   = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

    // Abandoned-signup capture: the first time a valid email is entered, fire it off (once) so a
    // half-finished signup still becomes a lead Michael can follow up on.
    const partialSent = useRef(false);
    const firePartial = () => {
        if (partialSent.current || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) return;
        partialSent.current = true;
        fetch("/api/lead-partial", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: form.email.trim(), plan: form.tier, type: orgTypeValue }),
        }).catch(() => {});
    };

    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);
        setError("");
        // Derive the workspace slug from the company name (+ a short suffix so it's always unique) and
        // reuse the account email for billing — fewer fields = higher signup completion. Editable later.
        const baseSlug = (form.orgName || form.email.split("@")[0] || "shop")
            .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 32) || "shop";
        const slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;
        try {
            const res = await fetch("/api/orgs", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...form, slug, billingEmail: form.email, lastName: "", orgType: orgTypeValue, founder: isFounder }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) { setError(data.error || "Registration failed"); setLoading(false); return; }
            // OpenAI ads conversion — fires on a completed signup for ALL clouds (fulfillment/commerce/storefront).
            try { window.oaiq?.("measure", "registration_completed", { type: "customer_action" }); } catch {}
            // Google Ads "Sign-up" conversion WITH enhanced conversions — pass first-party data so the
            // gtag hashes it (SHA-256) client-side and improves match rate / attribution.
            try {
                window.gtag?.("set", "user_data", { email: form.email, address: { first_name: form.firstName } });
                window.gtag?.("event", "conversion", { send_to: "AW-18171939038/_VNDCKOcnMUcEN6Rh9lD" });
            } catch {}
            // Microsoft Advertising (Bing) — custom event a UET conversion goal can target.
            try { window.uetq = window.uetq || []; window.uetq.push("event", "signup", { event_category: "registration", event_label: orgTypeValue }); } catch {}
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
            {/* OpenAI ads pixel — loads oaiq so the registration_completed conversion can fire on success */}
            {process.env.NEXT_PUBLIC_OPENAI_PIXEL_ID && (
                <Script id="openai-pixel" strategy="afterInteractive">{`
                    !function(w,d,s,u){if(w.oaiq)return;var q=function(){q.q.push(arguments)};q.q=[];w.oaiq=q;var j=d.createElement(s);j.async=1;j.src=u;var f=d.getElementsByTagName(s)[0];f.parentNode.insertBefore(j,f)}(window,document,"script","https://bzrcdn.openai.com/sdk/oaiq.min.js");
                    oaiq("init",{pixelId:"${process.env.NEXT_PUBLIC_OPENAI_PIXEL_ID}"});
                `}</Script>
            )}
            {/* Google Ads tag — so the Sign-up conversion can fire on register-success.
                _gcl cookie is shared at the root domain, so an ad click on pythiastechnologies.com attributes here. */}
            <Script id="gads-js" strategy="afterInteractive" src="https://www.googletagmanager.com/gtag/js?id=AW-18171939038" />
            <Script id="gads-init" strategy="afterInteractive">{`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', 'AW-18171939038', { 'allow_enhanced_conversions': true });
            `}</Script>
            {/* Microsoft Advertising (Bing) UET tag — loads uetq so the signup conversion can fire on success. */}
            <Script id="ms-uet" strategy="afterInteractive">{`
                (function(w,d,t,r,u){var f,n,i;w[u]=w[u]||[],f=function(){var o={ti:"343257119", enableAutoSpaTracking:true};o.q=w[u],w[u]=new UET(o),w[u].push("pageLoad")},n=d.createElement(t),n.src=r,n.async=1,n.onload=n.onreadystatechange=function(){var s=this.readyState;s&&s!=="loaded"&&s!=="complete"||(f(),n.onload=n.onreadystatechange=null)},i=d.getElementsByTagName(t)[0],i.parentNode.insertBefore(n,i)})(window,document,"script","//bat.bing.com/bat.js","uetq");
            `}</Script>
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
                                {isFounder ? "Claim your founding spot" : isStorefront ? "Launch your store" : isCommerce ? "Start selling" : "Start your free trial"}
                            </Typography>
                            {isFounder && (
                                <Box sx={{ mt: 1.5, mb: 0.5, p: 1.5, borderRadius: 2, bgcolor: "rgba(184,134,11,0.10)", border: "1px solid rgba(184,134,11,0.35)" }}>
                                    <Typography variant="body2" fontWeight={700} sx={{ color: "#9a7209" }}>
                                        {founderBanner}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Pick your tier and sign up — we&apos;ll apply your discount automatically and personally get you set up.
                                    </Typography>
                                </Box>
                            )}
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

                                {/* ── Step 2: Account (company + you — trimmed to the essentials) ── */}
                                {step === 2 && (
                                    <>
                                        <Typography variant="subtitle2" color="text.secondary">Create your account</Typography>
                                        <TextField label="Company name" value={form.orgName} onChange={set("orgName")} required fullWidth size="small" autoFocus />
                                        <TextField label="Your first name" value={form.firstName} onChange={set("firstName")} required fullWidth size="small" />
                                        <TextField label="Email" type="email" value={form.email} onChange={set("email")} onBlur={firePartial} required fullWidth size="small" />
                                        <TextField label="Password" type={showPassword ? "text" : "password"} value={form.password} onChange={set("password")} required fullWidth size="small"
                                            InputProps={revealAdornment(showPassword, () => setShowPassword(s => !s))} />
                                        <Stack direction="row" spacing={1}>
                                            <Button variant="outlined" onClick={() => setStep(1)} fullWidth>Back</Button>
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

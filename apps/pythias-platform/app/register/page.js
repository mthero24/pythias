"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Box, Card, CardContent, TextField, Button, Typography, Alert, Stack, Divider, MenuItem, Select, InputLabel, FormControl, Chip } from "@mui/material";
import { TIERS } from "@/lib/tiers";

const TIER_OPTIONS = ['starter', 'professional', 'business', 'scale'];
const VALID_TIERS = new Set(TIER_OPTIONS);

function RegisterForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const planParam = searchParams.get("plan");
    const initialTier = VALID_TIERS.has(planParam) ? planParam : "starter";

    const [step, setStep] = useState(1);
    const [form, setForm] = useState({
        orgName: "", slug: "", billingEmail: "", tier: initialTier,
        firstName: "", lastName: "", email: "", password: "", confirm: "",
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

    async function handleSubmit(e) {
        e.preventDefault();
        if (form.password !== form.confirm) { setError("Passwords do not match"); return; }
        setLoading(true);
        setError("");
        const res = await fetch("/api/orgs", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.error || "Registration failed"); setLoading(false); return; }
        router.push("/login?registered=1");
    }

    const tier = TIERS[form.tier];

    return (
        <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "background.default", py: 4 }}>
            <Card sx={{ width: "100%", maxWidth: 520 }}>
                <CardContent sx={{ p: 4 }}>
                    <Stack spacing={3}>
                        <Box>
                            <Typography variant="h5" fontWeight={700}>Start your free trial</Typography>
                            <Typography variant="body2" color="text.secondary">14 days free, no credit card required</Typography>
                        </Box>

                        {error && <Alert severity="error">{error}</Alert>}

                        <form onSubmit={handleSubmit}>
                            <Stack spacing={2}>
                                {step === 1 && (
                                    <>
                                        <Typography variant="subtitle2" color="text.secondary">Choose your plan</Typography>
                                        {TIER_OPTIONS.map(t => {
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
                                        })}
                                        <Button variant="contained" onClick={() => setStep(2)} fullWidth>
                                            Continue with {tier.label}
                                        </Button>
                                    </>
                                )}

                                {step === 2 && (
                                    <>
                                        <Typography variant="subtitle2" color="text.secondary">Organization details</Typography>
                                        <TextField label="Company name" value={form.orgName} onChange={set("orgName")} required fullWidth size="small" />
                                        <TextField
                                            label="URL slug"
                                            value={form.slug}
                                            onChange={set("slug")}
                                            required
                                            fullWidth
                                            size="small"
                                            helperText="Letters, numbers, and hyphens only"
                                            inputProps={{ pattern: "[a-z0-9-]+" }}
                                        />
                                        <TextField label="Billing email" type="email" value={form.billingEmail} onChange={set("billingEmail")} required fullWidth size="small" />
                                        <Stack direction="row" spacing={1}>
                                            <Button variant="outlined" onClick={() => setStep(1)} fullWidth>Back</Button>
                                            <Button variant="contained" onClick={() => setStep(3)} fullWidth>Continue</Button>
                                        </Stack>
                                    </>
                                )}

                                {step === 3 && (
                                    <>
                                        <Typography variant="subtitle2" color="text.secondary">Your account</Typography>
                                        <Stack direction="row" spacing={1}>
                                            <TextField label="First name" value={form.firstName} onChange={set("firstName")} required fullWidth size="small" />
                                            <TextField label="Last name" value={form.lastName} onChange={set("lastName")} required fullWidth size="small" />
                                        </Stack>
                                        <TextField label="Email" type="email" value={form.email} onChange={set("email")} required fullWidth size="small" />
                                        <TextField label="Password" type="password" value={form.password} onChange={set("password")} required fullWidth size="small" />
                                        <TextField label="Confirm password" type="password" value={form.confirm} onChange={set("confirm")} required fullWidth size="small" />
                                        <Stack direction="row" spacing={1}>
                                            <Button variant="outlined" onClick={() => setStep(2)} fullWidth>Back</Button>
                                            <Button type="submit" variant="contained" fullWidth disabled={loading}>
                                                {loading ? "Creating account..." : "Start free trial"}
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

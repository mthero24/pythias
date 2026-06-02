"use client";
import { useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Box, Card, CardContent, TextField, Button, Typography, Alert, Stack, Divider } from "@mui/material";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);
        setError("");
        const res = await signIn("credentials", { email, password, redirect: false });
        if (res?.error) {
            setError("Invalid email or password");
            setLoading(false);
        } else {
            const session = await getSession();
            router.push(`/${session?.user?.orgSlug}/dashboard`);
        }
    }

    return (
        <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "background.default" }}>
            <Card sx={{ width: "100%", maxWidth: 420 }}>
                <CardContent sx={{ p: 4 }}>
                    <Stack spacing={3}>
                        <Box>
                            <Typography variant="h5" fontWeight={700}>Sign in to Pythias</Typography>
                            <Typography variant="body2" color="text.secondary">Print fulfillment platform</Typography>
                        </Box>

                        {error && <Alert severity="error">{error}</Alert>}

                        <form onSubmit={handleSubmit}>
                            <Stack spacing={2}>
                                <TextField
                                    label="Email"
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    required
                                    fullWidth
                                    size="small"
                                    autoComplete="email"
                                />
                                <TextField
                                    label="Password"
                                    type="password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    required
                                    fullWidth
                                    size="small"
                                    autoComplete="current-password"
                                />
                                <Button type="submit" variant="contained" fullWidth disabled={loading}>
                                    {loading ? "Signing in..." : "Sign in"}
                                </Button>
                            </Stack>
                        </form>

                        <Divider />
                        <Typography variant="body2" color="text.secondary" align="center">
                            New to Pythias?{" "}
                            <a href="/register" style={{ color: "inherit", fontWeight: 600, textDecoration: "underline" }}>
                                Start your free trial
                            </a>
                        </Typography>
                    </Stack>
                </CardContent>
            </Card>
        </Box>
    );
}

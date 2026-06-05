"use client";
import {
    Box, TextField, Button, InputAdornment, IconButton,
    Typography, Stack, Alert, CircularProgress, Divider,
} from "@mui/material";
import Visibility    from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { useState } from "react";
import { signIn } from "next-auth/react";
import axios from "axios";

const FEATURES = [
    "Manage orders and production in one place",
    "Real-time shipping and tracking",
    "Multi-marketplace integrations",
    "Team collaboration and activity logs",
];

export function Main({ type, name = "Premier Printing", initials = "PP", tagline = "Production Management", logo, redirectTo = "/account", onSuccess }) {
    const isRegister = type === "register";

    const [data, setData]             = useState({ userName: "", password: "", email: "", firstName: "", lastName: "" });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading]       = useState(false);
    const [error, setError]           = useState("");
    const [success, setSuccess]       = useState("");

    const set = (key) => (e) => setData(prev => ({ ...prev, [key]: e.target.value }));

    const handleSubmit = async () => {
        setError("");
        setSuccess("");
        if (!data.userName.trim() || !data.password) {
            setError("Username and password are required.");
            return;
        }
        setLoading(true);
        try {
            if (isRegister) {
                const res = await axios.post("/api/auth/register", { ...data });
                if (res.data.success) {
                    setSuccess(`Account for "${data.userName}" was created successfully.`);
                    setData({ userName: "", password: "", email: "", firstName: "", lastName: "" });
                } else {
                    setError(res.data.error ?? "Registration failed. Please try again.");
                }
            } else {
                const response = await signIn("credentials", {
                    userName: data.userName,
                    password: data.password,
                    redirect: false,
                });
                if (response?.ok) {
                    if (onSuccess) onSuccess();
                    else location.replace(redirectTo);
                } else {
                    setError(response?.error ?? "Invalid username or password.");
                }
            }
        } catch {
            setError("Something went wrong. Please try again.");
        }
        setLoading(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") handleSubmit();
    };

    return (
        <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#f7f8fc" }}>

            {/* ── Left branding panel ─────────────────────── */}
            <Box sx={{
                display: { xs: "none", md: "flex" },
                flexDirection: "column",
                justifyContent: "space-between",
                width: "42%",
                minHeight: "100vh",
                background: "linear-gradient(155deg, #1a1f2e 0%, #111827 55%, #0f172a 100%)",
                px: 6,
                py: 5,
                position: "relative",
                overflow: "hidden",
            }}>
                {/* Decorative blobs */}
                <Box sx={{ position: "absolute", top: -80, right: -80, width: 340, height: 340, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.22) 0%, transparent 70%)", pointerEvents: "none" }} />
                <Box sx={{ position: "absolute", bottom: -60, left: -40, width: 260, height: 260, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.14) 0%, transparent 70%)", pointerEvents: "none" }} />
                <Box sx={{ position: "absolute", top: "40%", right: "10%", width: 160, height: 160, borderRadius: "50%", background: "radial-gradient(circle, rgba(20,184,166,0.10) 0%, transparent 70%)", pointerEvents: "none" }} />

                {/* Brand mark */}
                <Box sx={{ position: "relative" }}>
                    {logo ? (
                        <Box component="img" src={logo} alt={name} sx={{ height: 48, objectFit: "contain" }} />
                    ) : (
                        <Stack direction="row" alignItems="center" spacing={1.5}>
                            <Box sx={{
                                width: 44, height: 44, borderRadius: 2.5,
                                background: "linear-gradient(135deg, #6366f1 0%, #14b8a6 100%)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                flexShrink: 0,
                            }}>
                                <Typography sx={{ color: "#fff", fontWeight: 900, fontSize: "1rem", letterSpacing: -0.5 }}>{initials}</Typography>
                            </Box>
                            <Box>
                                <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: "1.1rem", lineHeight: 1.1 }}>
                                    {name}
                                </Typography>
                                <Typography sx={{ color: "rgba(255,255,255,0.45)", fontSize: "0.72rem", fontWeight: 500 }}>
                                    {tagline}
                                </Typography>
                            </Box>
                        </Stack>
                    )}
                </Box>

                {/* Center content */}
                <Box sx={{ position: "relative" }}>
                    <Typography
                        sx={{
                            color: "#fff", fontWeight: 800,
                            fontSize: { md: "2rem", lg: "2.4rem" },
                            lineHeight: 1.2, letterSpacing: -0.5, mb: 1.5,
                        }}
                    >
                        Everything you need to run production.
                    </Typography>
                    <Typography sx={{ color: "rgba(255,255,255,0.50)", fontSize: "0.95rem", lineHeight: 1.7, mb: 3.5 }}>
                        Orders, shipping, printing, and marketplace management — all in one place.
                    </Typography>
                    <Stack spacing={1.25}>
                        {FEATURES.map(f => (
                            <Stack key={f} direction="row" alignItems="center" spacing={1.25}>
                                <CheckCircleOutlineIcon sx={{ color: "#14b8a6", fontSize: 18, flexShrink: 0 }} />
                                <Typography sx={{ color: "rgba(255,255,255,0.72)", fontSize: "0.875rem" }}>{f}</Typography>
                            </Stack>
                        ))}
                    </Stack>
                </Box>

                {/* Footer */}
                <Typography sx={{ color: "rgba(255,255,255,0.25)", fontSize: "0.72rem", position: "relative" }}>
                    © {new Date().getFullYear()} {name} · Powered by Pythias Technologies
                </Typography>
            </Box>

            {/* ── Right form panel ────────────────────────── */}
            <Box sx={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                px: { xs: 2, sm: 4 },
                py: 5,
                bgcolor: "#fff",
            }}>
                <Box sx={{ width: "100%", maxWidth: 400 }}>

                    {/* Mobile brand */}
                    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 4, display: { xs: "flex", md: "none" } }}>
                        <Box sx={{
                            width: 38, height: 38, borderRadius: 2,
                            background: "linear-gradient(135deg, #6366f1 0%, #14b8a6 100%)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                            <Typography sx={{ color: "#fff", fontWeight: 900, fontSize: "0.875rem" }}>PP</Typography>
                        </Box>
                        <Typography sx={{ fontWeight: 800, fontSize: "1rem", color: "#111827" }}>{name}</Typography>
                    </Stack>

                    {/* Heading */}
                    <Box sx={{ mb: 3.5 }}>
                        <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: -0.5, color: "#111827", mb: 0.5 }}>
                            {isRegister ? "Create account" : "Welcome back"}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {isRegister
                                ? "Fill in the details below to create a new account."
                                : "Sign in with your username and password."}
                        </Typography>
                    </Box>

                    {/* Error / success messages */}
                    {error && (
                        <Alert severity="error" onClose={() => setError("")} sx={{ mb: 2.5, borderRadius: 2 }}>
                            {error}
                        </Alert>
                    )}
                    {success && (
                        <Alert severity="success" onClose={() => setSuccess("")} sx={{ mb: 2.5, borderRadius: 2 }}>
                            {success}
                        </Alert>
                    )}

                    {/* Form */}
                    <Stack spacing={2}>
                        <TextField
                            fullWidth
                            label="Username"
                            size="medium"
                            value={data.userName}
                            onChange={set("userName")}
                            onKeyDown={handleKeyDown}
                            autoComplete="username"
                            autoFocus
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <PersonOutlineIcon sx={{ fontSize: 20, color: "text.disabled" }} />
                                    </InputAdornment>
                                ),
                            }}
                        />

                        {isRegister && (
                            <>
                                <Stack direction="row" spacing={1.5}>
                                    <TextField fullWidth label="First name" size="medium" value={data.firstName} onChange={set("firstName")} onKeyDown={handleKeyDown} />
                                    <TextField fullWidth label="Last name"  size="medium" value={data.lastName}  onChange={set("lastName")}  onKeyDown={handleKeyDown} />
                                </Stack>
                                <TextField fullWidth label="Email" type="email" size="medium" value={data.email} onChange={set("email")} onKeyDown={handleKeyDown} autoComplete="email" />
                            </>
                        )}

                        <TextField
                            fullWidth
                            label="Password"
                            size="medium"
                            type={showPassword ? "text" : "password"}
                            value={data.password}
                            onChange={set("password")}
                            onKeyDown={handleKeyDown}
                            autoComplete={isRegister ? "new-password" : "current-password"}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <LockOutlinedIcon sx={{ fontSize: 20, color: "text.disabled" }} />
                                    </InputAdornment>
                                ),
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            size="small"
                                            onClick={() => setShowPassword(s => !s)}
                                            onMouseDown={e => e.preventDefault()}
                                            edge="end"
                                        >
                                            {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />

                        <Button
                            fullWidth
                            variant="contained"
                            size="large"
                            onClick={handleSubmit}
                            disabled={loading}
                            sx={{
                                mt: 0.5,
                                py: 1.4,
                                fontSize: "0.9375rem",
                                fontWeight: 700,
                                borderRadius: 2.5,
                                background: loading ? undefined : "linear-gradient(90deg, #6366f1 0%, #4f46e5 100%)",
                                boxShadow: loading ? undefined : "0 4px 16px rgba(99,102,241,0.35)",
                                "&:hover": {
                                    background: "linear-gradient(90deg, #4f46e5 0%, #4338ca 100%)",
                                    boxShadow: "0 6px 20px rgba(99,102,241,0.45)",
                                },
                            }}
                        >
                            {loading
                                ? <CircularProgress size={22} sx={{ color: "#fff" }} />
                                : isRegister ? "Create account" : "Sign in"}
                        </Button>
                    </Stack>

                    <Divider sx={{ my: 3 }}>
                        <Typography variant="caption" color="text.disabled" sx={{ px: 1 }}>
                            {name} Production System
                        </Typography>
                    </Divider>

                    <Typography variant="caption" color="text.disabled" sx={{ display: "block", textAlign: "center", lineHeight: 1.6 }}>
                        Having trouble? Contact your system administrator.
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
}

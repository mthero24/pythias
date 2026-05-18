"use client";
import {
    Box, TextField, Button, InputAdornment, IconButton,
    Typography, Stack, Alert, CircularProgress, Divider, Chip,
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { useState } from "react";
import { signIn } from "next-auth/react";

const FEATURES = [
    "Manage production labels and orders",
    "DTF, embroidery, and sublimation queues",
    "Real-time shipping and tracking",
    "Heat press settings and line management",
];

export function Main() {
    const [mode, setMode]             = useState("type"); // "scan" | "type"
    const [scan, setScan]             = useState("");
    const [email, setEmail]           = useState("");
    const [password, setPassword]     = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading]       = useState(false);
    const [error, setError]           = useState("");

    const handleKeyDown = (e) => {
        if (e.key === "Enter") handleLogin();
    };

    const handleLogin = async () => {
        setError("");
        setLoading(true);
        let username, pw;
        try {
            if (mode === "scan") {
                const raw = scan.trim();
                username = `${raw.split("-")[0].toLowerCase().replace(/;/g, "")}@teeshirtpalace.com`;
                const rawPw = raw.split("-")[1]?.toLowerCase() ?? "";
                pw = "";
                for (let i = 0; i < rawPw.length; i++) {
                    if (rawPw[i] === ";") { pw += rawPw[i + 1]?.toUpperCase() ?? ""; i++; }
                    else pw += rawPw[i];
                }
            } else {
                username = email.trim();
                pw = password;
            }
            const res = await signIn("credentials", { userName: username, password: pw, redirect: false });
            if (res?.ok) {
                location.replace("/");
            } else {
                setError(res?.error ?? "Invalid credentials. Please try again.");
            }
        } catch {
            setError("Something went wrong. Please try again.");
        }
        setLoading(false);
    };

    return (
        <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#f7f8fc" }}>

            {/* Left branding panel */}
            <Box sx={{
                display: { xs: "none", md: "flex" },
                flexDirection: "column",
                justifyContent: "space-between",
                width: "42%",
                minHeight: "100vh",
                background: "linear-gradient(155deg, #0c1220 0%, #0f172a 55%, #0c1628 100%)",
                px: 6, py: 5,
                position: "relative", overflow: "hidden",
            }}>
                <Box sx={{ position: "absolute", top: -80, right: -80, width: 340, height: 340, borderRadius: "50%", background: "radial-gradient(circle, rgba(212,175,55,0.15) 0%, transparent 70%)", pointerEvents: "none" }} />
                <Box sx={{ position: "absolute", bottom: -60, left: -40, width: 260, height: 260, borderRadius: "50%", background: "radial-gradient(circle, rgba(212,175,55,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />

                <Box sx={{ position: "relative" }}>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                        <Box sx={{
                            width: 44, height: 44, borderRadius: 2.5,
                            background: "linear-gradient(135deg, #b8860b 0%, #d4af37 100%)",
                            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                        }}>
                            <Typography sx={{ color: "#fff", fontWeight: 900, fontSize: "1rem", letterSpacing: -0.5 }}>PO</Typography>
                        </Box>
                        <Box>
                            <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: "1.1rem", lineHeight: 1.1 }}>
                                Print Oracle
                            </Typography>
                            <Typography sx={{ color: "rgba(255,255,255,0.45)", fontSize: "0.72rem", fontWeight: 500 }}>
                                Production Management
                            </Typography>
                        </Box>
                    </Stack>
                </Box>

                <Box sx={{ position: "relative" }}>
                    <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: { md: "2rem", lg: "2.4rem" }, lineHeight: 1.2, letterSpacing: -0.5, mb: 1.5 }}>
                        Everything you need to run production.
                    </Typography>
                    <Typography sx={{ color: "rgba(255,255,255,0.50)", fontSize: "0.95rem", lineHeight: 1.7, mb: 3.5 }}>
                        Orders, labels, DTF, shipping, and more — all in one place.
                    </Typography>
                    <Stack spacing={1.25}>
                        {FEATURES.map(f => (
                            <Stack key={f} direction="row" alignItems="center" spacing={1.25}>
                                <CheckCircleOutlineIcon sx={{ color: "#d4af37", fontSize: 18, flexShrink: 0 }} />
                                <Typography sx={{ color: "rgba(255,255,255,0.72)", fontSize: "0.875rem" }}>{f}</Typography>
                            </Stack>
                        ))}
                    </Stack>
                </Box>

                <Typography sx={{ color: "rgba(255,255,255,0.25)", fontSize: "0.72rem", position: "relative" }}>
                    © {new Date().getFullYear()} Print Oracle · Powered by Pythias Technologies
                </Typography>
            </Box>

            {/* Right form panel */}
            <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", px: { xs: 2, sm: 4 }, py: 5, bgcolor: "#fff" }}>
                <Box sx={{ width: "100%", maxWidth: 400 }}>

                    {/* Mobile brand */}
                    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 4, display: { xs: "flex", md: "none" } }}>
                        <Box sx={{ width: 38, height: 38, borderRadius: 2, background: "linear-gradient(135deg, #b8860b 0%, #d4af37 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Typography sx={{ color: "#fff", fontWeight: 900, fontSize: "0.875rem" }}>PO</Typography>
                        </Box>
                        <Typography sx={{ fontWeight: 800, fontSize: "1rem", color: "#111827" }}>Print Oracle</Typography>
                    </Stack>

                    <Box sx={{ mb: 3.5 }}>
                        <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: -0.5, color: "#111827", mb: 0.5 }}>
                            Welcome back
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Sign in to access Print Oracle.
                        </Typography>
                    </Box>

                    {/* Mode toggle */}
                    <Stack direction="row" spacing={1} sx={{ mb: 2.5 }}>
                        <Chip
                            label="Email / Password"
                            icon={<PersonOutlineIcon sx={{ fontSize: 15 }} />}
                            onClick={() => setMode("type")}
                            variant={mode === "type" ? "filled" : "outlined"}
                            sx={{ cursor: "pointer", ...(mode === "type" ? { bgcolor: "#0f172a", color: "#fff", "& .MuiChip-icon": { color: "#fff" } } : {}) }}
                        />
                        <Chip
                            label="Scan Badge"
                            icon={<QrCodeScannerIcon sx={{ fontSize: 15 }} />}
                            onClick={() => setMode("scan")}
                            variant={mode === "scan" ? "filled" : "outlined"}
                            sx={{ cursor: "pointer", ...(mode === "scan" ? { bgcolor: "#0f172a", color: "#fff", "& .MuiChip-icon": { color: "#fff" } } : {}) }}
                        />
                    </Stack>

                    {error && (
                        <Alert severity="error" onClose={() => setError("")} sx={{ mb: 2.5, borderRadius: 2 }}>
                            {error}
                        </Alert>
                    )}

                    <Stack spacing={2}>
                        {mode === "scan" ? (
                            <TextField
                                fullWidth
                                label="Scan badge"
                                type="password"
                                size="medium"
                                value={scan}
                                onChange={e => setScan(e.target.value)}
                                onKeyDown={handleKeyDown}
                                autoFocus
                                placeholder="Focus here and scan…"
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <QrCodeScannerIcon sx={{ fontSize: 20, color: "text.disabled" }} />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        ) : (
                            <>
                                <TextField
                                    fullWidth
                                    label="Email"
                                    size="medium"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    autoComplete="email"
                                    autoFocus
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <PersonOutlineIcon sx={{ fontSize: 20, color: "text.disabled" }} />
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                                <TextField
                                    fullWidth
                                    label="Password"
                                    size="medium"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    autoComplete="current-password"
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <LockOutlinedIcon sx={{ fontSize: 20, color: "text.disabled" }} />
                                            </InputAdornment>
                                        ),
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton size="small" onClick={() => setShowPassword(s => !s)} onMouseDown={e => e.preventDefault()} edge="end">
                                                    {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            </>
                        )}

                        <Button
                            fullWidth variant="contained" size="large"
                            onClick={handleLogin}
                            disabled={loading}
                            sx={{
                                mt: 0.5, py: 1.4, fontSize: "0.9375rem", fontWeight: 700, borderRadius: 2.5,
                                background: loading ? undefined : "linear-gradient(90deg, #b8860b 0%, #d4af37 100%)",
                                boxShadow: loading ? undefined : "0 4px 16px rgba(184,134,11,0.35)",
                                "&:hover": { background: "linear-gradient(90deg, #a07709 0%, #c49b2e 100%)", boxShadow: "0 6px 20px rgba(184,134,11,0.45)" },
                            }}
                        >
                            {loading ? <CircularProgress size={22} sx={{ color: "#fff" }} /> : "Sign in"}
                        </Button>
                    </Stack>

                    <Divider sx={{ my: 3 }}>
                        <Typography variant="caption" color="text.disabled" sx={{ px: 1 }}>
                            Print Oracle Production System
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

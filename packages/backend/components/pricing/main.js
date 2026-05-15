"use client";
import {
    Box, Container, Typography, Stack, Card, TextField,
    InputAdornment, Grid2, CircularProgress,
} from "@mui/material";
import { useState, useRef, useCallback } from "react";
import PrintIcon        from "@mui/icons-material/Print";
import AttachMoneyIcon  from "@mui/icons-material/AttachMoney";
import CheckCircleIcon  from "@mui/icons-material/CheckCircle";
import axios from "axios";

export function PricingMain({ printTypes }) {
    const types = Array.isArray(printTypes) ? printTypes : Object.values(printTypes ?? {});

    return (
        <Box sx={{ backgroundColor: "background.default", minHeight: "100vh" }}>
            <Container maxWidth="md" sx={{ py: 4 }}>

                {/* Header */}
                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 4 }}>
                    <Box sx={{ width: 36, height: 36, borderRadius: 2, background: "linear-gradient(135deg, #6366f1 0%, #14b8a6 100%)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <AttachMoneyIcon sx={{ color: "#fff", fontSize: 22 }} />
                    </Box>
                    <Box>
                        <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: -0.5, lineHeight: 1.2 }}>Pricing</Typography>
                        <Typography variant="body2" color="text.secondary">
                            Additional cost per print type · auto-saves on change
                        </Typography>
                    </Box>
                </Stack>

                {types.length === 0 ? (
                    <Box sx={{ py: 12, textAlign: "center" }}>
                        <PrintIcon sx={{ fontSize: 48, color: "text.disabled", mb: 1.5 }} />
                        <Typography variant="body1" fontWeight={600} color="text.secondary">No print types found</Typography>
                        <Typography variant="body2" color="text.disabled">Add print types in Marketplace Data first</Typography>
                    </Box>
                ) : (
                    <Grid2 container spacing={2}>
                        {types.map((type) => (
                            <Grid2 key={type._id} size={{ xs: 12, sm: 6, md: 4 }}>
                                <PriceCard type={type} />
                            </Grid2>
                        ))}
                    </Grid2>
                )}
            </Container>
        </Box>
    );
}

function PriceCard({ type }) {
    const [price, setPrice]   = useState(type.price ?? 0);
    const [status, setStatus] = useState("idle"); // idle | saving | saved | error
    const timerRef            = useRef(null);
    const dirtyRef            = useRef(false);

    const save = useCallback(async (val) => {
        setStatus("saving");
        try {
            await axios.post("/api/admin/pricing", { typeId: type._id, price: parseFloat(val) || 0 });
            setStatus("saved");
            dirtyRef.current = false;
            setTimeout(() => setStatus(s => s === "saved" ? "idle" : s), 2500);
        } catch {
            setStatus("error");
            setTimeout(() => setStatus("idle"), 3000);
        }
    }, [type._id]);

    const handleChange = (e) => {
        const val = e.target.value;
        setPrice(val);
        dirtyRef.current = true;
        setStatus("idle");
        clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => save(val), 700);
    };

    const handleBlur = () => {
        if (!dirtyRef.current) return;
        clearTimeout(timerRef.current);
        save(price);
    };

    const statusColor = status === "saved" ? "success.main" : status === "error" ? "error.main" : "text.disabled";

    return (
        <Card variant="outlined" sx={{
            borderRadius: 3, overflow: "hidden",
            transition: "box-shadow 150ms, border-color 150ms",
            borderColor: status === "saved" ? "success.light" : status === "error" ? "error.light" : "divider",
            "&:hover": { boxShadow: "0 4px 16px rgba(0,0,0,0.08)" },
        }}>
            {/* Card header */}
            <Stack
                direction="row" alignItems="center" spacing={1.25}
                sx={{ px: 2, py: 1.5, borderBottom: "1px solid", borderColor: "inherit" }}
            >
                <Box sx={{ width: 28, height: 28, borderRadius: 1.5, bgcolor: "#6366f115", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <PrintIcon sx={{ fontSize: 15, color: "#6366f1" }} />
                </Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, flex: 1 }}>
                    {type.name}
                </Typography>
                {status === "saved" && (
                    <CheckCircleIcon sx={{ fontSize: 16, color: "success.main" }} />
                )}
                {status === "saving" && (
                    <CircularProgress size={14} sx={{ color: "text.disabled" }} />
                )}
                {status === "error" && (
                    <Typography variant="caption" color="error">Save failed</Typography>
                )}
            </Stack>

            {/* Price field */}
            <Box sx={{ px: 2, py: 2 }}>
                <TextField
                    fullWidth
                    size="small"
                    label="Additional price"
                    type="number"
                    value={price}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    inputProps={{ min: 0, step: 0.01, style: { fontFamily: "monospace", fontSize: "1rem" } }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <Typography sx={{ fontWeight: 600, color: "text.secondary" }}>$</Typography>
                            </InputAdornment>
                        ),
                    }}
                />
            </Box>
        </Card>
    );
}

"use client";
import { useState } from "react";
import { Button, CircularProgress, Tooltip, Box, Typography, Chip } from "@mui/material";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import axios from "axios";

/**
 * Drop-in upscale button for any image upload flow.
 *
 * Props:
 *   imageUrl   — current image URL (must be publicly accessible)
 *   onUpscaled — callback(newUrl: string) called when upscale completes
 *   apiRoute   — defaults to "/api/admin/upscale"
 *   factor     — 2 or 4 (default 4)
 *   size       — MUI button size
 */
export function UpscaleButton({
    imageUrl,
    onUpscaled,
    apiRoute         = "/api/admin/upscale",
    factor           = 4,
    removeBackground = false,
    size             = "small",
}) {
    const [loading, setLoading]   = useState(false);
    const [done,    setDone]      = useState(false);
    const [error,   setError]     = useState("");

    if (!imageUrl) return null;

    async function run() {
        setLoading(true); setError(""); setDone(false);
        try {
            const res = await axios.post(apiRoute, { url: imageUrl, factor, removeBackground });
            if (res.data?.url) {
                onUpscaled?.(res.data.url);
                setDone(true);
            } else {
                setError(res.data?.error || "Upscale failed");
            }
        } catch (e) {
            setError(e.response?.data?.error || e.message || "Upscale failed");
        } finally {
            setLoading(false);
        }
    }

    return (
        <Box sx={{ display: "inline-flex", flexDirection: "column", alignItems: "flex-start", gap: 0.5 }}>
            <Tooltip title={removeBackground ? `AI upscale ${factor}x + remove background — outputs transparent PNG` : `AI upscale ${factor}x — improves print quality for low-res images`}>
                <span>
                    <Button
                        size={size}
                        variant="outlined"
                        startIcon={loading
                            ? <CircularProgress size={12} color="inherit" />
                            : <AutoFixHighIcon fontSize="small" />
                        }
                        onClick={run}
                        disabled={loading || done}
                        sx={{
                            borderColor: done ? "#10b981" : "#8b5cf6",
                            color:       done ? "#10b981" : "#8b5cf6",
                            "&:hover": { borderColor: "#7c3aed", bgcolor: "rgba(139,92,246,0.05)" },
                            textTransform: "none",
                        }}
                    >
                        {loading
                            ? `Upscaling${removeBackground ? " + BG Remove" : ""}…`
                            : done
                                ? "Upscaled ✓"
                                : removeBackground ? `Upscale + Remove BG` : `AI Upscale ${factor}x`
                        }
                    </Button>
                </span>
            </Tooltip>
            {error && (
                <Typography variant="caption" color="error">{error}</Typography>
            )}
            {done && (
                <Chip
                    label="Image replaced with high-res version"
                    size="small"
                    sx={{ bgcolor: "#d1fae5", color: "#065f46", fontSize: "0.65rem" }}
                />
            )}
        </Box>
    );
}

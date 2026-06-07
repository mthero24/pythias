"use client";
import { useState, useEffect } from "react";
import { Box, Typography, Button, LinearProgress, IconButton, Stack } from "@mui/material";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import CloseIcon        from "@mui/icons-material/Close";
import axios from "axios";

export default function SetupGuideBanner({ slug }) {
    const [data,    setData]    = useState(null);
    const [hidden,  setHidden]  = useState(false);

    useEffect(() => {
        axios.get("/api/setup-guide")
            .then(r => setData(r.data))
            .catch(() => {});
    }, []);

    if (!data || data.allDone || hidden || data.dismissed) return null;

    const pct = Math.round((data.completed / data.total) * 100);

    const dismiss = async () => {
        setHidden(true);
        await axios.patch("/api/setup-guide", { dismissed: true }).catch(() => {});
    };

    return (
        <Box sx={{
            bgcolor: "#111827",
            color: "#fff",
            px: 3,
            py: 1.5,
            display: "flex",
            alignItems: "center",
            gap: 2,
            flexWrap: "wrap",
        }}>
            <RocketLaunchIcon sx={{ color: "#D3A73D", flexShrink: 0 }} />

            <Box sx={{ flex: 1, minWidth: 200 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" mb={0.5}>
                    <Typography variant="body2" fontWeight={600}>
                        Setup Guide — {data.completed} of {data.total} steps done
                    </Typography>
                    <Typography variant="caption" sx={{ color: "rgba(255,255,255,.5)" }}>{pct}%</Typography>
                </Stack>
                <LinearProgress
                    variant="determinate"
                    value={pct}
                    sx={{
                        height: 4, borderRadius: 2, bgcolor: "rgba(255,255,255,.15)",
                        "& .MuiLinearProgress-bar": { bgcolor: "#D3A73D" },
                    }}
                />
            </Box>

            <Button
                variant="outlined"
                size="small"
                href={`/${slug}/admin/setup-guide`}
                sx={{ color: "#D3A73D", borderColor: "#D3A73D", borderRadius: 1.5, whiteSpace: "nowrap", "&:hover": { bgcolor: "rgba(211,167,61,.1)" } }}
            >
                Continue setup
            </Button>

            <IconButton size="small" onClick={dismiss} sx={{ color: "rgba(255,255,255,.4)", "&:hover": { color: "#fff" } }}>
                <CloseIcon fontSize="small" />
            </IconButton>
        </Box>
    );
}

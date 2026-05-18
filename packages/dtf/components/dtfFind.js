"use client";
import { useState, useEffect, useCallback } from "react";
import { Box, Stack, Typography, Chip } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import FindInPageIcon from "@mui/icons-material/FindInPage";
import axios from "axios";
import { DTFBody } from "./DTFBody";
import { Footer } from "@pythias/backend";

export function DTFFind() {
    const [auto, setAuto]   = useState(true);
    const [stats, setStats] = useState({ sent: 0, found: 0 });

    const fetchStats = useCallback(async () => {
        try {
            const res = await axios.get("/api/production/dtf/stats");
            if (!res.data.error) setStats(res.data);
        } catch {}
    }, []);

    useEffect(() => {
        fetchStats();
        const interval = setInterval(fetchStats, 30_000);
        return () => clearInterval(interval);
    }, [fetchStats]);

    return (
        <>
            <Box sx={{ bgcolor: "background.default", minHeight: "100vh" }}>
                <Box sx={{ bgcolor: "background.paper", borderBottom: "1px solid", borderColor: "divider", px: { xs: 1, sm: "2%", md: "5%" }, py: 2 }}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Stack direction="row" alignItems="center" spacing={1.5}>
                            <Box sx={{ width: 36, height: 36, borderRadius: 2, background: "linear-gradient(135deg, #6366f1 0%, #14b8a6 100%)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                <SearchIcon sx={{ color: "#fff", fontSize: 20 }} />
                            </Box>
                            <Box>
                                <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: -0.5, lineHeight: 1.2 }}>Find DTF</Typography>
                                <Typography variant="body2" color="text.secondary">Scan a piece ID to look up its DTF details</Typography>
                            </Box>
                        </Stack>
                        <Chip
                            icon={<FindInPageIcon sx={{ fontSize: "16px !important" }} />}
                            label={`${stats.found} found`}
                            size="small"
                            sx={{ fontWeight: 700, fontSize: "0.78rem", bgcolor: "#f0fdf4", color: "#15803d", border: "1px solid #bbf7d0", "& .MuiChip-icon": { color: "#15803d" } }}
                        />
                    </Stack>
                </Box>
                <DTFBody auto={auto} setAuto={setAuto} type="find" onAction={fetchStats} />
            </Box>
            <Footer fixed={true} />
        </>
    );
}

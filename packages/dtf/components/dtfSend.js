"use client";
import { Box, Stack, Typography, Chip } from "@mui/material";
import PrintIcon from "@mui/icons-material/Print";
import SendIcon from "@mui/icons-material/Send";
import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { DTFBody } from "./DTFBody";
import { Printers } from "./printers";
import { Footer } from "@pythias/backend";

export function DTFSend({ printers }) {
    const [printer, setPrinter] = useState(printers ? printers[0] : "printer1");
    const [auto, setAuto]       = useState(true);
    const [stats, setStats]     = useState({ sent: 0, found: 0 });

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
                {/* Header + printer bar */}
                <Box sx={{ bgcolor: "background.paper", borderBottom: "1px solid", borderColor: "divider", px: { xs: 1, sm: "2%", md: "5%" }, py: 2 }}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                        <Stack direction="row" alignItems="center" spacing={1.5}>
                            <Box sx={{ width: 36, height: 36, borderRadius: 2, background: "linear-gradient(135deg, #14b8a6 0%, #6366f1 100%)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                <PrintIcon sx={{ color: "#fff", fontSize: 20 }} />
                            </Box>
                            <Box>
                                <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: -0.5, lineHeight: 1.2 }}>Load DTF</Typography>
                                <Typography variant="body2" color="text.secondary">Scan a piece ID to send to the DTF printer</Typography>
                            </Box>
                        </Stack>
                        <Chip
                            icon={<SendIcon sx={{ fontSize: "16px !important" }} />}
                            label={`${stats.sent} sent`}
                            size="small"
                            sx={{ fontWeight: 700, fontSize: "0.78rem", bgcolor: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe", "& .MuiChip-icon": { color: "#1d4ed8" } }}
                        />
                    </Stack>
                    <Printers printers={printers} printer={printer} setPrinter={setPrinter} setAuto={setAuto} />
                </Box>

                <DTFBody auto={auto} setAuto={setAuto} printer={printer} type="send" onAction={fetchStats} />
            </Box>
            <Footer fixed={true} />
        </>
    );
}

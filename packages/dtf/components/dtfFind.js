"use client";
import { useState } from "react";
import { Box, Stack, Typography } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { DTFBody } from "./DTFBody";
import { Footer } from "@pythias/backend";

export function DTFFind() {
    const [auto, setAuto] = useState(true);

    return (
        <>
            <Box sx={{ bgcolor: "background.default", minHeight: "100vh" }}>
                <Box sx={{ bgcolor: "background.paper", borderBottom: "1px solid", borderColor: "divider", px: { xs: 1, sm: "2%", md: "5%" }, py: 2 }}>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                        <Box sx={{ width: 36, height: 36, borderRadius: 2, background: "linear-gradient(135deg, #6366f1 0%, #14b8a6 100%)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <SearchIcon sx={{ color: "#fff", fontSize: 20 }} />
                        </Box>
                        <Box>
                            <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: -0.5, lineHeight: 1.2 }}>Find DTF</Typography>
                            <Typography variant="body2" color="text.secondary">Scan a piece ID to look up its DTF details</Typography>
                        </Box>
                    </Stack>
                </Box>
                <DTFBody auto={auto} setAuto={setAuto} type="find" />
            </Box>
            <Footer fixed={true} />
        </>
    );
}

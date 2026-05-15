"use client";
import { useState } from "react";
import { Box, Stack, Typography } from "@mui/material";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import { DTFBody } from "./DTFBody";
import { Printers } from "./printers";
import { Footer } from "@pythias/backend";

export function Main({ printers }) {
    const [printer, setPrinter] = useState("printer1");
    const [auto, setAuto]       = useState(true);

    return (
        <>
            <Box sx={{ bgcolor: "background.default", minHeight: "100vh" }}>
                {/* Header + printer bar */}
                <Box sx={{ bgcolor: "background.paper", borderBottom: "1px solid", borderColor: "divider", px: 2, py: 2 }}>
                    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
                        <Box sx={{ width: 36, height: 36, borderRadius: 2, background: "linear-gradient(135deg, #ec4899 0%, #6366f1 100%)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <AutoFixHighIcon sx={{ color: "#fff", fontSize: 20 }} />
                        </Box>
                        <Box>
                            <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: -0.5, lineHeight: 1.2 }}>Embroidery</Typography>
                            <Typography variant="body2" color="text.secondary">Scan a piece ID to send to the embroidery machine</Typography>
                        </Box>
                    </Stack>
                    <Printers printers={printers} printer={printer} setPrinter={setPrinter} setAuto={setAuto} />
                </Box>

                <DTFBody auto={auto} setAuto={setAuto} printer={printer} />
            </Box>
            <Footer fixed={true} />
        </>
    );
}

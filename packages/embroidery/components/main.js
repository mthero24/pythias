"use client";
import { useState } from "react";
import { Box, Stack, Typography, ToggleButtonGroup, ToggleButton } from "@mui/material";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import SewingMachineIcon from "@mui/icons-material/Toys";
import { DTFBody } from "./DTFBody";
import { Printers } from "./printers";
import { Footer } from "@pythias/backend";

export function Main({ printers, tajimaQueues }) {
    const [printer, setPrinter]           = useState("printer1");
    const [tajimaQueue, setTajimaQueue]   = useState(tajimaQueues?.[0] || "default");
    const [auto, setAuto]                 = useState(true);

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

                    {tajimaQueues?.length > 1 && (
                        <Box sx={{ mt: 1.5 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                                Tajima Machine Queue
                            </Typography>
                            <ToggleButtonGroup
                                value={tajimaQueue}
                                exclusive
                                onChange={(_, v) => { if (v) setTajimaQueue(v); }}
                                size="small"
                            >
                                {tajimaQueues.map(q => (
                                    <ToggleButton key={q} value={q} sx={{ px: 2, textTransform: "none", fontWeight: 600 }}>
                                        {q}
                                    </ToggleButton>
                                ))}
                            </ToggleButtonGroup>
                        </Box>
                    )}
                </Box>

                <DTFBody auto={auto} setAuto={setAuto} printer={printer} tajimaQueue={tajimaQueue} />
            </Box>
            <Footer fixed={true} />
        </>
    );
}

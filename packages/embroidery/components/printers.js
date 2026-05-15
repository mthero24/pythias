"use client";
import { Box, Typography, Card, Stack } from "@mui/material";
import PrintIcon from "@mui/icons-material/Print";

export function Printers({ printers, printer, setPrinter, setAuto }) {
    return (
        <Box>
            <Stack direction="row" flexWrap="wrap" gap={1} alignItems="center">
                {printers?.map((s) => {
                    const active = printer === s;
                    return (
                        <Card
                            key={s}
                            variant="outlined"
                            onClick={() => { setAuto(false); setPrinter(s); setAuto(true); }}
                            sx={{
                                px: 2.5, py: 1.25, cursor: "pointer", borderRadius: 2,
                                borderColor: active ? "#6366f1" : "divider",
                                borderWidth: active ? 2 : 1,
                                bgcolor: active ? "#6366f1" : "background.paper",
                                color: active ? "#fff" : "text.primary",
                                transition: "all 120ms",
                                "&:hover": { borderColor: "#6366f1", bgcolor: active ? "#5558e3" : "#f0f0ff" },
                            }}
                        >
                            <Stack direction="row" alignItems="center" spacing={0.75}>
                                <PrintIcon sx={{ fontSize: 16 }} />
                                <Typography variant="body2" sx={{ fontWeight: 700, textTransform: "capitalize" }}>
                                    {s.replace("printer", "emb")}
                                </Typography>
                            </Stack>
                        </Card>
                    );
                })}
            </Stack>
        </Box>
    );
}

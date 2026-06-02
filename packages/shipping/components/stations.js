"use client";
import { Stack, Box, Tooltip } from "@mui/material";
import ScaleIcon from "@mui/icons-material/Scale";
import ScaleOutlinedIcon from "@mui/icons-material/ScaleOutlined";

// stations can be string[] (legacy) or { name, hasScale }[]
function stationName(s) { return typeof s === "string" ? s : s.name; }
function stationHasScale(s) { return typeof s === "string" ? true : (s.hasScale ?? true); }

export function Stations({ stations, station, setStation, setAuto }) {
    if (!stations?.length) return null;
    return (
        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mt: 1.5 }}>
            {stations.map((s) => {
                const name = stationName(s);
                const hasScale = stationHasScale(s);
                const active = station === name;
                return (
                    <Tooltip key={name} title={hasScale ? "Scale connected" : "No scale"} placement="bottom" arrow>
                        <Box
                            onClick={() => { setStation(name); setAuto(true); }}
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 0.5,
                                px: 1.5,
                                py: 0.5,
                                borderRadius: 1.5,
                                cursor: "pointer",
                                fontSize: "0.8125rem",
                                fontWeight: active ? 700 : 500,
                                lineHeight: 1.5,
                                textTransform: "capitalize",
                                userSelect: "none",
                                transition: "background 0.12s, color 0.12s",
                                bgcolor: active ? "primary.main" : "background.paper",
                                color: active ? "#fff" : "text.primary",
                                border: "1px solid",
                                borderColor: active ? "primary.main" : "divider",
                                boxShadow: active ? 1 : 0,
                                "&:hover": { bgcolor: active ? "primary.dark" : "action.hover" },
                            }}
                        >
                            {hasScale
                                ? <ScaleIcon sx={{ fontSize: 13, opacity: active ? 0.9 : 0.55, flexShrink: 0 }} />
                                : <ScaleOutlinedIcon sx={{ fontSize: 13, opacity: 0.35, flexShrink: 0 }} />
                            }
                            {name}
                        </Box>
                    </Tooltip>
                );
            })}
        </Stack>
    );
}

export { stationName, stationHasScale };

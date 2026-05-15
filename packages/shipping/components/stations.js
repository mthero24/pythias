"use client";
import { Stack, Chip, Typography } from "@mui/material";

export function Stations({ stations, station, setStation, setAuto }) {
    if (!stations?.length) return null;
    return (
        <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1 }}>
            {stations.map((s) => (
                <Chip
                    key={s}
                    label={
                        <Typography sx={{ textTransform: "capitalize", fontWeight: station === s ? 700 : 500, fontSize: "0.875rem" }}>
                            {s}
                        </Typography>
                    }
                    onClick={() => { setStation(s); setAuto(true); }}
                    sx={{
                        bgcolor: station === s ? "primary.main" : "background.default",
                        color: station === s ? "#fff" : "text.primary",
                        border: "1px solid",
                        borderColor: station === s ? "primary.main" : "divider",
                        height: 36,
                        px: 0.5,
                        "&:hover": { bgcolor: station === s ? "primary.dark" : "action.hover" },
                    }}
                />
            ))}
        </Stack>
    );
}

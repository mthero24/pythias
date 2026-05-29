"use client";
import { Box, Typography, ButtonBase } from "@mui/material";
import MonitorIcon from "@mui/icons-material/Monitor";

export function Stations({ stations, station, setStation }) {
  if (!stations?.length) return null;
  return (
    <Box
      sx={{
        display: "flex",
        gap: 1,
        px: 2,
        py: 1.5,
        flexWrap: "wrap",
        bgcolor: "#fff",
        borderBottom: "1px solid #e5e7eb",
      }}
    >
      {stations.map((s) => {
        const active = station === s;
        return (
          <ButtonBase
            key={s}
            onClick={() => setStation(s)}
            sx={{
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              gap: 0.75,
              px: 2,
              py: 0.875,
              borderRadius: 2,
              border: "1.5px solid",
              borderColor: active ? "#6366f1" : "#e5e7eb",
              bgcolor: active ? "#6366f1" : "#fafafa",
              color: active ? "#fff" : "#374151",
              transition: "all 0.15s",
              "&:hover": {
                borderColor: active ? "#4f52d9" : "#a5b4fc",
                bgcolor: active ? "#4f52d9" : "#f0f0ff",
              },
            }}
          >
            <MonitorIcon sx={{ fontSize: "1rem", opacity: active ? 1 : 0.45 }} />
            <Typography
              sx={{
                fontSize: "0.8rem",
                fontWeight: active ? 700 : 500,
                textTransform: "capitalize",
                letterSpacing: "0.01em",
              }}
            >
              {s}
            </Typography>
          </ButtonBase>
        );
      })}
    </Box>
  );
}

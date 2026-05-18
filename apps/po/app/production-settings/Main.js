"use client";
import {
    Box, Container, Grid2, TextField, Typography,
    Button, Stack, Card, InputAdornment, Snackbar, Alert,
} from "@mui/material";
import { useState } from "react";
import axios from "axios";
import ThermostatIcon from "@mui/icons-material/Thermostat";
import WbSunnyIcon from "@mui/icons-material/WbSunny";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import PrintIcon from "@mui/icons-material/Print";
import IronIcon from "@mui/icons-material/Iron";
import SettingsIcon from "@mui/icons-material/Settings";

const TYPE_META = {
    light:   { label: "Light",   icon: WbSunnyIcon,  color: "#f59e0b", bg: "#fffbeb", border: "#fde68a" },
    dark:    { label: "Dark",    icon: DarkModeIcon, color: "#6366f1", bg: "#eef2ff", border: "#c7d2fe" },
    press:   { label: "Press",   icon: IronIcon,     color: "#10b981", bg: "#ecfdf5", border: "#a7f3d0" },
    pressed: { label: "Pressed", icon: IronIcon,     color: "#10b981", bg: "#ecfdf5", border: "#a7f3d0" },
    printed: { label: "Printed", icon: PrintIcon,    color: "#3b82f6", bg: "#eff6ff", border: "#bfdbfe" },
};

const SKIP = new Set(["_id", "__v", "aStyles"]);

const formatLabel = (key) => {
    const meta = TYPE_META[key];
    if (meta) return meta.label;
    return key.replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase());
};

export function SettingsMain({ temp }) {
    const [settings, setSettings] = useState(temp);
    const [saving, setSaving]     = useState({});
    const [saved, setSaved]       = useState({});
    const [snack, setSnack]       = useState(null);

    const update = (type, field, value) => {
        setSettings(prev => ({ ...prev, [type]: { ...prev[type], [field]: value } }));
        setSaved(prev => ({ ...prev, [type]: false }));
    };

    const save = async (type) => {
        setSaving(prev => ({ ...prev, [type]: true }));
        const res = await axios.post("/api/production/treatment-settings", settings).catch(() => null);
        setSaving(prev => ({ ...prev, [type]: false }));
        if (!res || res.data.error) {
            setSnack({ severity: "error", msg: res?.data?.msg ?? "Error saving settings" });
        } else {
            setSaved(prev => ({ ...prev, [type]: true }));
            setSnack({ severity: "success", msg: "Settings saved" });
        }
    };

    const keys = Object.keys(settings).filter(k => !SKIP.has(k));

    return (
        <Box sx={{ bgcolor: "#f8fafc", minHeight: "100vh" }}>
            <Box sx={{ bgcolor: "#fff", borderBottom: "1px solid #e2e8f0", px: 3, py: 2 }}>
                <Stack direction="row" alignItems="center" spacing={1.5}>
                    <Box sx={{
                        width: 36, height: 36, borderRadius: 2, flexShrink: 0,
                        background: "linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                        <ThermostatIcon sx={{ color: "#fff", fontSize: 20 }} />
                    </Box>
                    <Box>
                        <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: -0.5, lineHeight: 1.2 }}>
                            Production Line Settings
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Heat press temperature &amp; time settings
                        </Typography>
                    </Box>
                </Stack>
            </Box>

            <Container maxWidth="md" sx={{ py: 3 }}>
                <Grid2 container spacing={2}>
                    {keys.map(key => {
                        const meta    = TYPE_META[key] ?? { label: formatLabel(key), icon: SettingsIcon, color: "#6366f1", bg: "#eef2ff", border: "#c7d2fe" };
                        const Icon    = meta.icon;
                        const section = settings[key] ?? {};
                        return (
                            <Grid2 key={key} size={{ xs: 12, sm: 6 }}>
                                <Card variant="outlined" sx={{ borderRadius: 2, borderColor: meta.border, overflow: "hidden" }}>
                                    <Box sx={{ px: 2, py: 1.5, bgcolor: meta.bg, borderBottom: `1px solid ${meta.border}`, display: "flex", alignItems: "center", gap: 1 }}>
                                        <Icon sx={{ color: meta.color, fontSize: 20 }} />
                                        <Typography variant="subtitle1" fontWeight={700} sx={{ color: meta.color }}>
                                            {meta.label}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ p: 2 }}>
                                        <Grid2 container spacing={1.5} sx={{ mb: 1.5 }}>
                                            <Grid2 size={6}>
                                                <TextField
                                                    fullWidth size="small" type="number" label="Temperature"
                                                    value={section.temp ?? ""}
                                                    onChange={(e) => update(key, "temp", e.target.value)}
                                                    InputProps={{ endAdornment: <InputAdornment position="end">°F</InputAdornment> }}
                                                />
                                            </Grid2>
                                            <Grid2 size={6}>
                                                <TextField
                                                    fullWidth size="small" type="number" label="Time"
                                                    value={section.time ?? ""}
                                                    onChange={(e) => update(key, "time", e.target.value)}
                                                    InputProps={{ endAdornment: <InputAdornment position="end">sec</InputAdornment> }}
                                                />
                                            </Grid2>
                                        </Grid2>
                                        <Button
                                            fullWidth size="small" variant="contained"
                                            disabled={!!saving[key]}
                                            onClick={() => save(key)}
                                            sx={{
                                                bgcolor: meta.color,
                                                "&:hover": { bgcolor: meta.color, filter: "brightness(0.88)" },
                                                "&:disabled": { bgcolor: meta.color, opacity: 0.6, color: "#fff" },
                                            }}
                                        >
                                            {saving[key] ? "Saving…" : saved[key] ? "Saved ✓" : "Save"}
                                        </Button>
                                    </Box>
                                </Card>
                            </Grid2>
                        );
                    })}
                </Grid2>
            </Container>

            <Snackbar open={!!snack} autoHideDuration={3000} onClose={() => setSnack(null)} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
                <Alert severity={snack?.severity} variant="filled" onClose={() => setSnack(null)} sx={{ width: "100%" }}>
                    {snack?.msg}
                </Alert>
            </Snackbar>
        </Box>
    );
}

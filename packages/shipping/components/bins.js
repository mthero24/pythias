"use client";
import { Card, Typography, Box, Grid2, Chip } from "@mui/material";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import InventoryIcon from "@mui/icons-material/Inventory";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ErrorIcon from "@mui/icons-material/Error";

const DAY = 24 * 60 * 60 * 1000;

function getAge(date) {
    const ms = Date.now() - new Date(date).getTime();
    return ms / DAY;
}

function getWarning(ageDays) {
    if (ageDays >= 3) return {
        bg: "#fef2f2", bgHover: "#fee2e2",
        border: "#ef4444",
        textColor: "error.main",
        icon: <ErrorIcon sx={{ fontSize: 14, color: "#ef4444" }} />,
        label: "Late",
    };
    if (ageDays >= 2) return {
        bg: "#fff0e6", bgHover: "#ffe0cc",
        border: "#f97316",
        textColor: "warning.dark",
        icon: <WarningAmberIcon sx={{ fontSize: 14, color: "#f97316" }} />,
        label: "1 day to ship",
    };
    if (ageDays >= 1) return {
        bg: "#fffbeb", bgHover: "#fef3c7",
        border: "#f59e0b",
        textColor: "warning.main",
        icon: <WarningAmberIcon sx={{ fontSize: 14, color: "#f59e0b" }} />,
        label: "2 days to ship",
    };
    return null;
}

export function Bins({ bins, setBins, setOrder, setAuto, setBin, setShow, setAction, setShowNotes }) {
    if (!bins) return null;

    return (
        <Box sx={{ px: 2, mb: 2 }}>
            <Grid2 container spacing={2}>
                {Object.keys(bins).map((t) => {
                    const isReady = t === "readyToShip";
                    return (
                        <Grid2 size={{ xs: 12, sm: 6 }} key={t}>
                            <Card variant="outlined" sx={{ borderRadius: 3, overflow: "hidden" }}>
                                {/* Section header */}
                                <Box sx={{
                                    px: 2, py: 1.5,
                                    borderBottom: "1px solid",
                                    borderColor: "divider",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                }}>
                                    <Box sx={{
                                        width: 28, height: 28, borderRadius: 1.5,
                                        background: isReady
                                            ? "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)"
                                            : "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
                                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                                    }}>
                                        {isReady
                                            ? <LocalShippingIcon sx={{ color: "#fff", fontSize: 16 }} />
                                            : <InventoryIcon sx={{ color: "#fff", fontSize: 16 }} />
                                        }
                                    </Box>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                        {isReady ? "Ready To Ship" : "In Use"}
                                    </Typography>
                                    <Chip
                                        label={bins[t].filter(b => b.order).length}
                                        size="small"
                                        sx={{ ml: "auto", fontWeight: 700, bgcolor: isReady ? "success.main" : "warning.main", color: "#fff" }}
                                    />
                                </Box>

                                {/* Column headers */}
                                <Box sx={{ px: 2, py: 1, bgcolor: "action.hover" }}>
                                    <Grid2 container spacing={1} alignItems="center">
                                        <Grid2 size={1}><Typography variant="caption" fontWeight={700} color="text.secondary">Bin#</Typography></Grid2>
                                        <Grid2 size={{ xs: 4, md: 2 }}><Typography variant="caption" fontWeight={700} color="text.secondary">PO#</Typography></Grid2>
                                        <Grid2 size={{ xs: 4, md: 2 }}><Typography variant="caption" fontWeight={700} color="text.secondary">Type</Typography></Grid2>
                                        <Grid2 size={{ xs: 3, md: 1 }}><Typography variant="caption" fontWeight={700} color="text.secondary" textAlign="center" display="block">In Bin</Typography></Grid2>
                                        <Grid2 size={{ xs: 3, md: 2 }}><Typography variant="caption" fontWeight={700} color="text.secondary" textAlign="center" display="block">Left</Typography></Grid2>
                                        <Grid2 size={{ md: 2 }} display={{ xs: "none", md: "block" }}><Typography variant="caption" fontWeight={700} color="text.secondary">Status</Typography></Grid2>
                                        <Grid2 size={{ lg: 2 }} display={{ xs: "none", lg: "block" }}><Typography variant="caption" fontWeight={700} color="text.secondary">Date</Typography></Grid2>
                                    </Grid2>
                                </Box>

                                {/* Rows */}
                                <Box>
                                    {bins[t].map((b, i) => {
                                        if (!b.order) return null;
                                        const age = getAge(b.order.date);
                                        const warn = getWarning(age);
                                        const remaining = b.order.items.filter(item => !item.canceled && !item.shipped).length - b.items.length;
                                        return (
                                            <Box
                                                key={i}
                                                onClick={() => {
                                                    if (b.order.notes.length > 0) setShowNotes(true);
                                                    setOrder(b.order);
                                                    setBin(b);
                                                    setShow(true);
                                                    if (isReady) setAction("ship");
                                                }}
                                                sx={{
                                                    px: 2, py: 1,
                                                    cursor: "pointer",
                                                    borderTop: "1px solid",
                                                    borderColor: "divider",
                                                    bgcolor: warn ? warn.bg : i % 2 === 0 ? "background.paper" : "action.hover",
                                                    borderLeft: warn ? `3px solid ${warn.border}` : "3px solid transparent",
                                                    "&:hover": { bgcolor: warn ? warn.bgHover : "action.selected" },
                                                    transition: "background-color 0.15s",
                                                }}
                                            >
                                                <Grid2 container spacing={1} alignItems="center">
                                                    <Grid2 size={1}>
                                                        <Typography variant="body2" fontWeight={700} color={warn ? warn.textColor : "text.primary"}>
                                                            {b.number}
                                                        </Typography>
                                                    </Grid2>
                                                    <Grid2 size={{ xs: 4, md: 2 }}>
                                                        <Typography variant="body2" fontWeight={600} noWrap color={warn ? warn.textColor : "text.primary"}>
                                                            {b.order.poNumber}
                                                        </Typography>
                                                    </Grid2>
                                                    <Grid2 size={{ xs: 4, md: 2 }}>
                                                        <Typography variant="body2" noWrap color={warn ? warn.textColor : "text.secondary"}>
                                                            {b.order.shippingType}
                                                        </Typography>
                                                    </Grid2>
                                                    <Grid2 size={{ xs: 3, md: 1 }}>
                                                        <Typography variant="body2" fontWeight={600} textAlign="center" color={warn ? warn.textColor : "text.primary"}>
                                                            {b.items.length}
                                                        </Typography>
                                                    </Grid2>
                                                    <Grid2 size={{ xs: 3, md: 2 }}>
                                                        <Typography variant="body2" fontWeight={600} textAlign="center" color={remaining > 0 ? "warning.main" : "success.main"}>
                                                            {remaining}
                                                        </Typography>
                                                    </Grid2>
                                                    <Grid2 size={{ md: 2 }} display={{ xs: "none", md: "block" }}>
                                                        <Chip
                                                            label={b.order.status}
                                                            size="small"
                                                            sx={{ fontSize: "0.7rem", height: 20 }}
                                                        />
                                                    </Grid2>
                                                    <Grid2 size={{ lg: 2 }} display={{ xs: "none", lg: "block" }}>
                                                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                                            {warn?.icon}
                                                            <Typography variant="caption" color={warn ? warn.textColor : "text.secondary"}>
                                                                {new Date(b.order.date).toLocaleDateString("en-US")}
                                                            </Typography>
                                                        </Box>
                                                    </Grid2>
                                                </Grid2>
                                                {warn && (
                                                    <Box sx={{ mt: 0.25, display: "flex", alignItems: "center", gap: 0.5 }}>
                                                        {warn.icon}
                                                        <Typography variant="caption" sx={{ color: warn.textColor, fontWeight: 600 }}>
                                                            {warn.label}
                                                        </Typography>
                                                    </Box>
                                                )}
                                            </Box>
                                        );
                                    })}
                                </Box>
                            </Card>
                        </Grid2>
                    );
                })}
            </Grid2>
        </Box>
    );
}

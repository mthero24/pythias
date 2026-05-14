"use client";
import {
    Dialog, DialogTitle, DialogContent, Typography, Box, TextField,
    Grid2, Button, Stack, Card, CardContent, Divider, IconButton,
    CircularProgress, Chip,
} from "@mui/material";
import { BarChart } from "@mui/x-charts/BarChart";
import { useState, useEffect } from "react";
import axios from "axios";
import CloseIcon from "@mui/icons-material/Close";
import DownloadIcon from "@mui/icons-material/Download";
import BarChartIcon from "@mui/icons-material/BarChart";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";

const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

const PALETTE = ["#6366f1", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#06b6d4", "#f97316", "#84cc16"];

const fmtAxis  = v => v >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${v}`;
const fmtTip   = v => `$${parseFloat(v ?? 0).toFixed(2)}`;
const fmtTotal = v => v.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });

function ChartCard({ icon, title, subtitle, total, totalLabel, children, empty }) {
    return (
        <Card variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
            <Box sx={{ px: 3, pt: 2.5, pb: 1, display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                <Stack direction="row" spacing={1} alignItems="center">
                    <Box sx={{ color: "primary.main", display: "flex", alignItems: "center" }}>{icon}</Box>
                    <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.3 }}>{title}</Typography>
                        <Typography variant="caption" color="text.secondary">{subtitle}</Typography>
                    </Box>
                </Stack>
                {total != null && (
                    <Box sx={{ textAlign: "right" }}>
                        <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1, color: "primary.main" }}>
                            {fmtTotal(total)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">{totalLabel}</Typography>
                    </Box>
                )}
            </Box>
            <Divider />
            {empty ? (
                <Box sx={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Typography variant="body2" color="text.secondary">No data available</Typography>
                </Box>
            ) : (
                <Box sx={{ px: 1 }}>{children}</Box>
            )}
        </Card>
    );
}

export function ChartModal({ open, setOpen }) {
    const [months, setMonths]     = useState([]);
    const [licenses, setLicenses] = useState([]);
    const [loading, setLoading]   = useState(true);
    const [from, setFrom]         = useState("");
    const [to, setTo]             = useState("");

    useEffect(() => {
        if (!open) return;
        setLoading(true);
        axios.get("/api/admin/license").then(res => {
            setMonths(res.data.months);
            setLicenses(res.data.licenses);
        }).finally(() => setLoading(false));
    }, [open]);

    const csvLink = `/api/admin/license/csv${from || to ? `?from=${from}&to=${to}` : ""}`;

    const currentMonth = new Date().getMonth();
    const sortedMonths = [
        ...months.slice(currentMonth + 1),
        ...months.slice(0, currentMonth + 1),
    ];

    const xLabels = sortedMonths.map(m => MONTH_NAMES[m.number]?.slice(0, 3) ?? m.number);

    const dataOwed = licenses
        .filter(l => l.name)
        .map(l => ({
            label: l.name,
            id: l._id,
            valueFormatter: fmtTip,
            highlightScope: { highlighted: "item", faded: "global" },
            data: sortedMonths.map(m => {
                const ml = m.licenses.find(lic => lic._id === l._id);
                return ml ? (parseFloat(ml.totalOwed) || 0) : 0;
            }),
        }));

    const dataSold = licenses
        .filter(l => l.name)
        .map(l => ({
            label: l.name,
            id: l._id,
            valueFormatter: fmtTip,
            highlightScope: { highlighted: "item", faded: "global" },
            data: sortedMonths.map(m => {
                const ml = m.licenses.find(lic => lic._id === l._id);
                return ml ? (parseFloat(ml.sold) || 0) : 0;
            }),
        }));

    const yearOwedTotal = sortedMonths.reduce(
        (acc, m) => acc + m.licenses.reduce((a, l) => a + (parseFloat(l.totalOwed) || 0), 0), 0
    );
    const yearSoldTotal = sortedMonths.reduce(
        (acc, m) => acc + m.licenses.reduce((a, l) => a + (parseFloat(l.sold) || 0), 0), 0
    );

    const CHART_PROPS = {
        colors: PALETTE,
        xAxis: [{ data: xLabels, scaleType: "band", tickLabelStyle: { fontSize: 11 } }],
        yAxis: [{ width: 68, valueFormatter: fmtAxis, tickLabelStyle: { fontSize: 11 } }],
        grid: { horizontal: true },
        borderRadius: 5,
        margin: { top: 12, right: 16, bottom: 36, left: 0 },
        height: 300,
        slotProps: {
            legend: {
                direction: "row",
                position: { vertical: "bottom", horizontal: "middle" },
                padding: { bottom: 0 },
                itemMarkWidth: 10,
                itemMarkHeight: 10,
                markGap: 5,
                itemGap: 14,
                labelStyle: { fontSize: 11 },
            },
        },
    };

    return (
        <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xl" fullWidth PaperProps={{ sx: { height: "92vh" } }}>
            <DialogTitle sx={{ fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid", borderColor: "divider" }}>
                <Stack direction="row" alignItems="center" spacing={1.5}>
                    <BarChartIcon sx={{ color: "primary.main" }} />
                    <span>License Analytics</span>
                </Stack>
                <IconButton size="small" onClick={() => setOpen(false)}><CloseIcon fontSize="small" /></IconButton>
            </DialogTitle>

            <DialogContent sx={{ p: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                {loading ? (
                    <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Stack alignItems="center" spacing={2}>
                            <CircularProgress />
                            <Typography variant="body2" color="text.secondary">Loading analytics…</Typography>
                        </Stack>
                    </Box>
                ) : (
                    <Grid2 container sx={{ flex: 1, minHeight: 0 }}>

                        {/* Charts column */}
                        <Grid2 size={{ xs: 12, md: 8 }} sx={{ p: 3, overflowY: "auto", borderRight: "1px solid", borderColor: "divider", minHeight: 0, height: "100%" }}>
                            <Stack spacing={3}>
                                <ChartCard
                                    icon={<AttachMoneyIcon fontSize="small" />}
                                    title="Total Owed to License Holders"
                                    subtitle="Last 12 months"
                                    total={yearOwedTotal}
                                    totalLabel="12-month total"
                                    empty={dataOwed.length === 0}
                                >
                                    <BarChart series={dataOwed} {...CHART_PROPS} />
                                </ChartCard>

                                <ChartCard
                                    icon={<ShoppingCartIcon fontSize="small" />}
                                    title="Total Sold by License Holders"
                                    subtitle="Last 12 months"
                                    total={yearSoldTotal}
                                    totalLabel="12-month total"
                                    empty={dataSold.length === 0}
                                >
                                    <BarChart series={dataSold} {...CHART_PROPS} />
                                </ChartCard>
                            </Stack>
                        </Grid2>

                        {/* Sidebar */}
                        <Grid2 size={{ xs: 12, md: 4 }} sx={{ display: "flex", flexDirection: "column", backgroundColor: "background.default", minHeight: 0, height: "100%", overflow: "hidden" }}>

                            {/* CSV export — pinned */}
                            <Box sx={{ p: 3, pb: 1.5, flexShrink: 0 }}>
                                <Card variant="outlined" sx={{ borderRadius: 2 }}>
                                    <CardContent sx={{ p: 2 }}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>Export CSV</Typography>
                                        <Grid2 container spacing={1.5} sx={{ mb: 1.5 }}>
                                            <Grid2 size={6}>
                                                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>From</Typography>
                                                <TextField
                                                    type="date" size="small" fullWidth
                                                    value={from}
                                                    onChange={(e) => setFrom(e.target.value)}
                                                />
                                            </Grid2>
                                            <Grid2 size={6}>
                                                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>To</Typography>
                                                <TextField
                                                    type="date" size="small" fullWidth
                                                    value={to}
                                                    onChange={(e) => setTo(e.target.value)}
                                                />
                                            </Grid2>
                                        </Grid2>
                                        <Button href={csvLink} variant="contained" fullWidth startIcon={<DownloadIcon />} size="small">
                                            Download CSV
                                        </Button>
                                    </CardContent>
                                </Card>
                            </Box>

                            {/* Monthly breakdown — scrollable */}
                            <Box sx={{ flex: 1, overflowY: "auto", minHeight: 0, px: 3, pb: 3, "&::-webkit-scrollbar": { width: 4 }, "&::-webkit-scrollbar-thumb": { background: "rgba(0,0,0,0.15)", borderRadius: 2 } }}>
                                <Stack spacing={1.5}>
                                    {[...sortedMonths].reverse().map((month) => {
                                        const monthTotal = month.licenses.reduce((acc, l) => acc + (parseFloat(l.totalOwed) || 0), 0);
                                        const soldTotal  = month.licenses.reduce((acc, l) => acc + (parseFloat(l.sold) || 0), 0);
                                        const hasData    = month.licenses.some(l => l.sold > 0 || l.totalOwed > 0);
                                        if (!hasData) return null;

                                        return (
                                            <Card key={month.number} variant="outlined" sx={{ borderRadius: 2 }}>
                                                <CardContent sx={{ p: 2 }}>
                                                    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
                                                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                                            {MONTH_NAMES[month.number]}
                                                        </Typography>
                                                        <Stack direction="row" spacing={0.75}>
                                                            <Chip label={`Sold: $${soldTotal.toFixed(2)}`} size="small" variant="outlined" color="primary" sx={{ fontSize: "0.6rem", height: 18 }} />
                                                            <Chip label={`Owed: $${monthTotal.toFixed(2)}`} size="small" variant="outlined" color="warning" sx={{ fontSize: "0.6rem", height: 18 }} />
                                                        </Stack>
                                                    </Stack>

                                                    {/* Header row */}
                                                    <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", mb: 0.5, px: 0.5 }}>
                                                        {["Holder", "Sold", "Owed"].map(h => (
                                                            <Typography key={h} variant="caption" sx={{ fontWeight: 700, color: "text.secondary", textTransform: "uppercase", fontSize: "0.58rem", letterSpacing: 0.5 }}>{h}</Typography>
                                                        ))}
                                                    </Box>

                                                    <Stack spacing={0.25}>
                                                        {licenses.map((license) => {
                                                            const ml = month.licenses.find(l => l._id === license._id);
                                                            if (!ml) return null;
                                                            return (
                                                                <Box key={license._id} sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", px: 0.5, py: 0.5, borderRadius: 0.75, "&:hover": { backgroundColor: "action.hover" } }}>
                                                                    <Typography variant="caption" sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{license.name}</Typography>
                                                                    <Typography variant="caption">${parseFloat(ml.sold ?? 0).toFixed(2)}</Typography>
                                                                    <Typography variant="caption">${parseFloat(ml.totalOwed ?? 0).toFixed(2)}</Typography>
                                                                </Box>
                                                            );
                                                        })}

                                                        {/* Total row */}
                                                        <Divider sx={{ my: 0.5 }} />
                                                        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", px: 0.5, py: 0.25 }}>
                                                            <Typography variant="caption" sx={{ fontWeight: 700 }}>Total</Typography>
                                                            <Typography variant="caption" sx={{ fontWeight: 700 }}>${soldTotal.toFixed(2)}</Typography>
                                                            <Typography variant="caption" sx={{ fontWeight: 700 }}>${monthTotal.toFixed(2)}</Typography>
                                                        </Box>
                                                    </Stack>
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                                </Stack>
                            </Box>
                        </Grid2>
                    </Grid2>
                )}
            </DialogContent>
        </Dialog>
    );
}

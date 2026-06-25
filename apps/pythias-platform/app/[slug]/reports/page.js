"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
    Box, Container, Stack, Typography, Alert, Button,
    Card, CardContent, Grid2, Tabs, Tab, Table, TableHead, TableBody,
    TableRow, TableCell, TableSortLabel, TablePagination, Chip,
    CircularProgress, LinearProgress, Paper, Select, MenuItem,
    TextField, FormControl, Dialog, DialogTitle, DialogContent, DialogActions, InputAdornment,
} from "@mui/material";
import { LineChart, BarChart, PieChart } from "@mui/x-charts";
import DashboardIcon              from "@mui/icons-material/Dashboard";
import BarChartIcon               from "@mui/icons-material/BarChart";
import TrendingUpIcon             from "@mui/icons-material/TrendingUp";
import PrecisionManufacturingIcon from "@mui/icons-material/PrecisionManufacturing";
import AttachMoneyIcon            from "@mui/icons-material/AttachMoney";
import CategoryIcon               from "@mui/icons-material/Category";
import AutoGraphIcon              from "@mui/icons-material/AutoGraph";
import AddShoppingCartIcon        from "@mui/icons-material/AddShoppingCart";
import DownloadIcon               from "@mui/icons-material/Download";

const fmt = (n) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n ?? 0);
const fmtDate = (d) =>
    d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";
const fmtN = (n) => (n ?? 0).toLocaleString();

function KpiCard({ label, value, sub, color = "text.primary" }) {
    return (
        <Card variant="outlined" sx={{ height: "100%" }}>
            <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                <Typography variant="caption" color="text.secondary"
                    sx={{ textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 600, display: "block" }}>
                    {label}
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, color, mt: 0.5 }}>{value}</Typography>
                {sub && <Typography variant="caption" color="text.secondary">{sub}</Typography>}
            </CardContent>
        </Card>
    );
}

function ChartCard({ title, children, loading, minH = 260 }) {
    return (
        <Paper variant="outlined" sx={{ p: 2, height: "100%", position: "relative" }}>
            {loading && <LinearProgress sx={{ position: "absolute", top: 0, left: 0, right: 0, borderRadius: "4px 4px 0 0" }} />}
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>{title}</Typography>
            <Box sx={{ minHeight: minH }}>{children}</Box>
        </Paper>
    );
}

function NoData() {
    return (
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200 }}>
            <Typography variant="body2" color="text.secondary">No data for this period</Typography>
        </Box>
    );
}

function SortableTable({ columns, rows, defaultSort, defaultDir = "desc" }) {
    const [sortCol, setSortCol] = useState(defaultSort ?? columns[0]?.key);
    const [sortDir, setSortDir] = useState(defaultDir);
    const handleSort = (key) => {
        setSortDir((prev) => (sortCol === key ? (prev === "asc" ? "desc" : "asc") : "desc"));
        setSortCol(key);
    };
    const sorted = useMemo(() => {
        const col = columns.find((c) => c.key === sortCol);
        return [...rows].sort((a, b) => {
            const av = col?.getValue ? col.getValue(a) : a[sortCol];
            const bv = col?.getValue ? col.getValue(b) : b[sortCol];
            if (av == null && bv == null) return 0;
            if (av == null) return 1;
            if (bv == null) return -1;
            const cmp = typeof av === "string" ? av.localeCompare(bv) : av - bv;
            return sortDir === "asc" ? cmp : -cmp;
        });
    }, [rows, sortCol, sortDir, columns]);
    return (
        <Box sx={{ overflow: "auto" }}>
            <Table size="small" sx={{ minWidth: 600 }}>
                <TableHead>
                    <TableRow>
                        {columns.map((col) => (
                            <TableCell key={col.key} align={col.align ?? "left"}
                                sx={{ fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5, color: "text.secondary", bgcolor: "grey.50", py: 1, whiteSpace: "nowrap" }}>
                                <TableSortLabel active={sortCol === col.key} direction={sortCol === col.key ? sortDir : "asc"} onClick={() => handleSort(col.key)}>
                                    {col.label}
                                </TableSortLabel>
                            </TableCell>
                        ))}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {sorted.map((row, i) => (
                        <TableRow key={row._id ?? i} hover sx={{ "& td": { py: 0.75, fontSize: 13 } }}>
                            {columns.map((col) => (
                                <TableCell key={col.key} align={col.align ?? "left"}>
                                    {col.render ? col.render(row) : (col.getValue ? col.getValue(row) : row[col.key]) ?? "—"}
                                </TableCell>
                            ))}
                        </TableRow>
                    ))}
                    {sorted.length === 0 && (
                        <TableRow><TableCell colSpan={columns.length} align="center" sx={{ py: 4, color: "text.secondary" }}>No data for this period</TableCell></TableRow>
                    )}
                </TableBody>
            </Table>
        </Box>
    );
}

function PaginatedTable({ columns, rows, total, page, pageSize, loading, sortField, sortDir, onPageChange, onPageSizeChange, onSortChange }) {
    return (
        <Box sx={{ overflow: "auto", position: "relative" }}>
            {loading && <LinearProgress sx={{ position: "absolute", top: 0, left: 0, right: 0 }} />}
            <Table size="small" sx={{ minWidth: 600 }}>
                <TableHead>
                    <TableRow>
                        {columns.map((col) => (
                            <TableCell key={col.key} align={col.align ?? "left"}
                                sx={{ fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5, color: "text.secondary", bgcolor: "grey.50", py: 1, whiteSpace: "nowrap" }}>
                                {col.serverKey ? (
                                    <TableSortLabel active={sortField === col.serverKey} direction={sortField === col.serverKey ? sortDir : "asc"} onClick={() => onSortChange(col.serverKey)}>
                                        {col.label}
                                    </TableSortLabel>
                                ) : col.label}
                            </TableCell>
                        ))}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {rows.map((row, i) => (
                        <TableRow key={row._id ?? i} hover sx={{ "& td": { py: 0.75, fontSize: 13 } }}>
                            {columns.map((col) => (
                                <TableCell key={col.key} align={col.align ?? "left"}>
                                    {col.render ? col.render(row) : (col.getValue ? col.getValue(row) : row[col.key]) ?? "—"}
                                </TableCell>
                            ))}
                        </TableRow>
                    ))}
                    {rows.length === 0 && !loading && (
                        <TableRow><TableCell colSpan={columns.length} align="center" sx={{ py: 4, color: "text.secondary" }}>No data for this period</TableCell></TableRow>
                    )}
                </TableBody>
            </Table>
            <TablePagination
                component="div" count={total} page={page - 1} rowsPerPage={pageSize}
                rowsPerPageOptions={[25, 50, 100, 200]}
                onPageChange={(_, p) => onPageChange(p + 1)}
                onRowsPerPageChange={(e) => onPageSizeChange(parseInt(e.target.value, 10))}
            />
        </Box>
    );
}

const STAGE_PIE_COLORS = ["#9e9e9e", "#00bcd4", "#ff9800", "#2196f3", "#4caf50"];

const EMPTY_PROD = {
    total: 0, active: 0, shipped: 0, rePulled: 0, treated: 0, labelPrinted: 0, dtfLoad: 0, dtfFind: 0,
    avgDaysToLabel: null, avgDaysToPrint: null, avgDaysToShip: null,
    modeDtfLoad: null, modePrintLabels: null, modeDaysToShip: null,
};

function OverviewTab({ revenueByDay, byMarketplace, productionSummary, blanks, itemsLoading, blanksLoading }) {
    const ps = productionSummary ?? EMPTY_PROD;

    const stageData = useMemo(() => [
        { id: 0, value: ps.dtfFind,      label: "DTF Find"      },
        { id: 1, value: ps.dtfLoad,      label: "DTF Load"      },
        { id: 2, value: ps.labelPrinted, label: "Label Printed" },
        { id: 3, value: ps.treated,      label: "Treated"       },
        { id: 4, value: ps.rePulled,     label: "Re-Pulled"     },
        { id: 5, value: ps.shipped,      label: "Shipped"       },
    ].filter(d => d.value > 0).map((d, i) => ({ ...d, color: STAGE_PIE_COLORS[d.id] })), [ps]);

    const topMp      = byMarketplace.slice(0, 10);
    const topBlanks  = blanks.slice(0, 10);
    const mpHeight   = Math.max(240, topMp.length * 36 + 60);
    const blkHeight  = Math.max(240, topBlanks.length * 36 + 60);
    const revFormatter = (v) => `$${(v ?? 0).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

    return (
        <Grid2 container spacing={2}>
            <Grid2 size={{ xs: 12 }}>
                <ChartCard title="Revenue Over Time" minH={240}>
                    {revenueByDay.length > 0 ? (
                        <LineChart
                            dataset={revenueByDay}
                            xAxis={[{ dataKey: "date", scaleType: "band", tickLabelStyle: { fontSize: 10 }, tickMinStep: 1 }]}
                            series={[{ dataKey: "revenue", label: "Revenue", valueFormatter: revFormatter, color: "#2196f3" }]}
                            height={240}
                            margin={{ left: 72, right: 16, top: 16, bottom: 40 }}
                            yAxis={[{ valueFormatter: revFormatter }]}
                        />
                    ) : <NoData />}
                </ChartCard>
            </Grid2>
            <Grid2 size={{ xs: 12, md: 6 }}>
                <ChartCard title="Daily Orders" minH={240}>
                    {revenueByDay.length > 0 ? (
                        <BarChart
                            dataset={revenueByDay}
                            xAxis={[{ dataKey: "date", scaleType: "band", tickLabelStyle: { fontSize: 10 } }]}
                            series={[{ dataKey: "orders", label: "Orders", color: "#4caf50" }]}
                            height={240}
                            margin={{ left: 48, right: 16, top: 16, bottom: 40 }}
                        />
                    ) : <NoData />}
                </ChartCard>
            </Grid2>
            <Grid2 size={{ xs: 12, md: 6 }}>
                <ChartCard title="Item Stage Distribution" loading={itemsLoading} minH={240}>
                    {stageData.length > 0 ? (
                        <PieChart
                            series={[{ data: stageData, innerRadius: 50, outerRadius: 90, paddingAngle: 2, cornerRadius: 3,
                                highlightScope: { faded: "global", highlighted: "item" } }]}
                            height={240}
                            slotProps={{ legend: { direction: "row", position: { vertical: "bottom", horizontal: "middle" } } }}
                        />
                    ) : <NoData />}
                </ChartCard>
            </Grid2>
            <Grid2 size={{ xs: 12, md: 6 }}>
                <ChartCard title="Revenue by Marketplace" minH={mpHeight}>
                    {topMp.length > 0 ? (
                        <BarChart
                            layout="horizontal"
                            dataset={topMp}
                            yAxis={[{ dataKey: "marketplace", scaleType: "band", tickLabelStyle: { fontSize: 11 } }]}
                            series={[{ dataKey: "revenue", label: "Revenue", valueFormatter: revFormatter, color: "#9c27b0" }]}
                            height={mpHeight}
                            margin={{ left: 130, right: 16, top: 8, bottom: 30 }}
                            xAxis={[{ valueFormatter: revFormatter }]}
                        />
                    ) : <NoData />}
                </ChartCard>
            </Grid2>
            <Grid2 size={{ xs: 12, md: 6 }}>
                <ChartCard title="Top Blanks by Qty Sold" loading={blanksLoading} minH={blkHeight}>
                    {topBlanks.length > 0 ? (
                        <BarChart
                            layout="horizontal"
                            dataset={topBlanks.map(b => ({ ...b, label: `${b.styleCode || ""} ${b.colorName || ""} ${b.sizeName || ""}`.trim() }))}
                            yAxis={[{ dataKey: "label", scaleType: "band", tickLabelStyle: { fontSize: 10 } }]}
                            series={[{ dataKey: "qty", label: "Qty Sold", color: "#ff9800" }]}
                            height={blkHeight}
                            margin={{ left: 150, right: 16, top: 8, bottom: 30 }}
                        />
                    ) : <NoData />}
                </ChartCard>
            </Grid2>
            <Grid2 size={{ xs: 12, md: 6 }}>
                <ChartCard title="Revenue by Marketplace — Orders vs Avg Order Value" minH={240}>
                    {topMp.length > 0 ? (
                        <BarChart
                            dataset={topMp}
                            xAxis={[{ dataKey: "marketplace", scaleType: "band", tickLabelStyle: { fontSize: 10 } }]}
                            series={[{ dataKey: "orders", label: "Orders", color: "#2196f3" }]}
                            height={240}
                            margin={{ left: 48, right: 16, top: 16, bottom: 60 }}
                        />
                    ) : <NoData />}
                </ChartCard>
            </Grid2>
            <Grid2 size={{ xs: 12, md: 6 }}>
                <ChartCard title="Blanks COGS by Style" loading={blanksLoading} minH={240}>
                    {topBlanks.length > 0 ? (() => {
                        const byStyle = Object.entries(
                            topBlanks.reduce((m, b) => { m[b.styleCode || "?"] = (m[b.styleCode || "?"] || 0) + b.totalCogs; return m; }, {})
                        ).map(([styleCode, totalCogs]) => ({ styleCode, totalCogs })).sort((a, b) => b.totalCogs - a.totalCogs).slice(0, 8);
                        return (
                            <BarChart
                                layout="horizontal"
                                dataset={byStyle}
                                yAxis={[{ dataKey: "styleCode", scaleType: "band", tickLabelStyle: { fontSize: 11 } }]}
                                series={[{ dataKey: "totalCogs", label: "COGS", valueFormatter: revFormatter, color: "#f44336" }]}
                                height={240}
                                margin={{ left: 80, right: 16, top: 8, bottom: 30 }}
                                xAxis={[{ valueFormatter: revFormatter }]}
                            />
                        );
                    })() : <NoData />}
                </ChartCard>
            </Grid2>
        </Grid2>
    );
}

const STATUS_MAP = {
    shipped:  { label: "Shipped",  color: "success" },
    complete: { label: "Complete", color: "success" },
    canceled: { label: "Canceled", color: "error"   },
    cancelled:{ label: "Cancelled",color: "error"   },
    refunded: { label: "Refunded", color: "error"   },
    pending:  { label: "Pending",  color: "warning" },
    open:     { label: "Open",     color: "default" },
};

function orderChip(o) {
    if (o.cancelled) return <Chip size="small" label="Cancelled" color="error" />;
    const key = (o.status || "").toLowerCase();
    const { label, color } = STATUS_MAP[key] ?? { label: o.status || "Open", color: "default" };
    return <Chip size="small" label={label} color={color} />;
}

function daysToShip(o) {
    if (!o.date || !o.shippingInfo?.shippedAt) return null;
    return (new Date(o.shippingInfo.shippedAt) - new Date(o.date)) / (1000 * 60 * 60 * 24);
}

function SalesTab({ summary, ordersData, revenueByDay, onPageChange, onPageSizeChange, onSortChange, sortField, sortDir }) {
    const { orders, total, page, pageSize, loading } = ordersData;
    const avgOrder = summary.orderCount > 0 ? summary.totalRevenue / summary.orderCount : 0;

    const columns = [
        { key: "date",        serverKey: "date",        label: "Date",    render: (o) => fmtDate(o.date) },
        { key: "poNumber",    serverKey: "poNumber",    label: "PO #",    render: (o) => o.poNumber || o.orderId || "—" },
        { key: "marketplace", serverKey: "marketplace", label: "Channel", render: (o) => <Chip size="small" label={o.marketplace || "—"} variant="outlined" /> },
        { key: "productCost", serverKey: "productCost", label: "Revenue", align: "right", render: (o) => fmt((o.productCost||0) + (o.shippingCost||0) - (o.discountAmount||0)) },
        { key: "shipping",    label: "Shipping Paid",   align: "right",   render: (o) => fmt(o.shippingPaid) },
        { key: "blanksCogs",  label: "Blank COGS",      align: "right",   render: (o) => fmt(o.blanksCogs) },
        { key: "daysToShip",  label: "Days to Ship",    align: "right",   render: (o) => { const d = daysToShip(o); return d != null ? d.toFixed(1) : "—"; } },
        { key: "status",      label: "Status",          render: orderChip },
    ];

    const revFormatter = (v) => `$${(v ?? 0).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

    return (
        <>
            <Grid2 container spacing={2} sx={{ mb: 3 }}>
                <Grid2 size={{ xs: 6, md: 3 }}><KpiCard label="Gross Revenue"       value={fmt(summary.totalRevenue)}  color="success.main" /></Grid2>
                <Grid2 size={{ xs: 6, md: 3 }}><KpiCard label="Orders"              value={fmtN(summary.orderCount)} /></Grid2>
                <Grid2 size={{ xs: 6, md: 3 }}><KpiCard label="Avg Order Value"     value={fmt(summary.orderCount > 0 ? summary.totalRevenue / summary.orderCount : 0)} /></Grid2>
                <Grid2 size={{ xs: 6, md: 3 }}><KpiCard label="Cancelled" value={fmtN(summary.canceledCount)} color="error.main" /></Grid2>
            </Grid2>
            <Grid2 container spacing={2} sx={{ mb: 3 }}>
                <Grid2 size={{ xs: 12, md: 7 }}>
                    <ChartCard title="Revenue Over Time" minH={200}>
                        {revenueByDay.length > 0 ? (
                            <LineChart
                                dataset={revenueByDay}
                                xAxis={[{ dataKey: "date", scaleType: "band", tickLabelStyle: { fontSize: 10 } }]}
                                series={[{ dataKey: "revenue", label: "Revenue", valueFormatter: revFormatter, color: "#2196f3" }]}
                                height={200}
                                margin={{ left: 72, right: 16, top: 10, bottom: 40 }}
                                yAxis={[{ valueFormatter: revFormatter }]}
                            />
                        ) : <NoData />}
                    </ChartCard>
                </Grid2>
                <Grid2 size={{ xs: 12, md: 5 }}>
                    <ChartCard title="Orders by Day" minH={200}>
                        {revenueByDay.length > 0 ? (
                            <BarChart
                                dataset={revenueByDay}
                                xAxis={[{ dataKey: "date", scaleType: "band", tickLabelStyle: { fontSize: 10 } }]}
                                series={[{ dataKey: "orders", label: "Orders", color: "#4caf50" }]}
                                height={200}
                                margin={{ left: 40, right: 16, top: 10, bottom: 40 }}
                            />
                        ) : <NoData />}
                    </ChartCard>
                </Grid2>
            </Grid2>
            <Paper variant="outlined">
                <PaginatedTable
                    columns={columns} rows={orders} total={total} page={page} pageSize={pageSize}
                    loading={loading} sortField={sortField} sortDir={sortDir}
                    onPageChange={onPageChange} onPageSizeChange={onPageSizeChange} onSortChange={onSortChange}
                />
            </Paper>
        </>
    );
}

function itemStage(i) {
    if (!i.steps?.length) return "Pending";
    const latest = [...i.steps].sort((a, b) => new Date(b.date) - new Date(a.date))[0];
    const s = latest?.status || "Pending";
    return s.startsWith("In Bin") ? "In Bin" : s;
}

function stageColor(status) {
    if (!status || status === "Pending")                             return "default";
    if (status === "Cancelled")                                      return "error";
    if (status === "Shipped" || status === "PreShipped")             return "success";
    if (status === "Folded"  || status.startsWith("In Bin"))         return "primary";
    if (status === "Re-Pulled" || status === "Re-pull")              return "warning";
    if (status === "Treated" || status === "Treatment Machine")      return "secondary";
    if (status === "Printed" || status === "DTF Load"
        || status === "Embroidery Load")                             return "info";
    if (status === "DTF Find")                                       return "warning";
    return "default";
}

function fmtDays(val)     { return val != null ? val.toFixed(1) + "d" : "—"; }
function fmtModeDays(val) { return val != null ? `${val}d`             : "—"; }

function ProductionTab({ productionSummary, itemsData, itemsByDay, dueToShip, onPageChange, onPageSizeChange, onSortChange, sortField, sortDir }) {
    const ps = productionSummary ?? EMPTY_PROD;
    const { items, total, page, pageSize, loading } = itemsData;

    const stageData = useMemo(() => [
        { id: 0, value: ps.dtfFind,      label: "DTF Find"      },
        { id: 1, value: ps.dtfLoad,      label: "DTF Load"      },
        { id: 2, value: ps.labelPrinted, label: "Label Printed" },
        { id: 3, value: ps.treated,      label: "Treated"       },
        { id: 4, value: ps.rePulled,     label: "Re-Pulled"     },
        { id: 5, value: ps.shipped,      label: "Shipped"       },
    ].filter(d => d.value > 0).map(d => ({ ...d, color: STAGE_PIE_COLORS[d.id] })), [ps]);

    const columns = [
        { key: "date",      serverKey: "date",      label: "Date",     render: (i) => fmtDate(i.date) },
        { key: "styleCode", serverKey: "styleCode", label: "Style" },
        { key: "colorName", serverKey: "colorName", label: "Color" },
        { key: "sizeName",  serverKey: "sizeName",  label: "Size"  },
        { key: "pieceId",   serverKey: "pieceId",   label: "Piece ID" },
        { key: "stage",     label: "Stage", render: (i) => {
            const s = itemStage(i);
            return <Chip size="small" label={s} color={stageColor(s)} />;
        }},
    ];

    return (
        <>
            <Grid2 container spacing={2} sx={{ mb: 3 }}>
                <Grid2 size={{ xs: 4, sm: 2 }}><KpiCard label="Total Items"   value={fmtN(ps.total)} /></Grid2>
                <Grid2 size={{ xs: 4, sm: 2 }}><KpiCard label="DTF Find"     value={fmtN(ps.dtfFind)}      color="warning.main" /></Grid2>
                <Grid2 size={{ xs: 4, sm: 2 }}><KpiCard label="DTF Load"     value={fmtN(ps.dtfLoad)}      color="info.main" /></Grid2>
                <Grid2 size={{ xs: 4, sm: 2 }}><KpiCard label="Label Printed" value={fmtN(ps.labelPrinted)} color="info.main" /></Grid2>
                <Grid2 size={{ xs: 4, sm: 2 }}><KpiCard label="Treated"      value={fmtN(ps.treated)}      color="secondary.main" /></Grid2>
                <Grid2 size={{ xs: 4, sm: 2 }}><KpiCard label="Re-Pulled"    value={fmtN(ps.rePulled)}     color="warning.main" /></Grid2>
                <Grid2 size={{ xs: 4, sm: 2 }}><KpiCard label="Shipped"      value={fmtN(ps.shipped)}      color="success.main" /></Grid2>
            </Grid2>
            <Grid2 container spacing={2} sx={{ mb: 3 }}>
                <Grid2 size={{ xs: 4, sm: 2 }}><KpiCard label="Avg DTF Sent"      value={fmtDays(ps.avgDaysToLabel)} /></Grid2>
                <Grid2 size={{ xs: 4, sm: 2 }}><KpiCard label="Mode DTF Sent"     value={fmtModeDays(ps.modeDtfLoad)} /></Grid2>
                <Grid2 size={{ xs: 4, sm: 2 }}><KpiCard label="Avg Print Labels"  value={fmtDays(ps.avgDaysToPrint)} /></Grid2>
                <Grid2 size={{ xs: 4, sm: 2 }}><KpiCard label="Mode Print Labels" value={fmtModeDays(ps.modePrintLabels)} /></Grid2>
                <Grid2 size={{ xs: 4, sm: 2 }}><KpiCard label="Avg Days to Ship"  value={fmtDays(ps.avgDaysToShip)} /></Grid2>
                <Grid2 size={{ xs: 4, sm: 2 }}><KpiCard label="Mode Days to Ship" value={fmtModeDays(ps.modeDaysToShip)} /></Grid2>
            </Grid2>
            <Grid2 container spacing={2} sx={{ mb: 3 }}>
                <Grid2 size={{ xs: 12, md: 7 }}>
                    <ChartCard title="Items Received per Day" minH={200}>
                        {itemsByDay.length > 0 ? (
                            <BarChart
                                dataset={itemsByDay}
                                xAxis={[{ dataKey: "date", scaleType: "band", tickLabelStyle: { fontSize: 10 } }]}
                                series={[{ dataKey: "count", label: "Items", color: "#00bcd4" }]}
                                height={200}
                                margin={{ left: 48, right: 16, top: 10, bottom: 40 }}
                            />
                        ) : <NoData />}
                    </ChartCard>
                </Grid2>
                <Grid2 size={{ xs: 12, md: 5 }}>
                    <ChartCard title="Stage Distribution" minH={200}>
                        {stageData.length > 0 ? (
                            <PieChart
                                series={[{ data: stageData, innerRadius: 40, outerRadius: 75, paddingAngle: 2, cornerRadius: 3 }]}
                                height={200}
                                slotProps={{ legend: { direction: "row", position: { vertical: "bottom", horizontal: "middle" } } }}
                            />
                        ) : <NoData />}
                    </ChartCard>
                </Grid2>
            </Grid2>
            <Grid2 container spacing={2} sx={{ mb: 3 }}>
                <Grid2 size={{ xs: 12 }}>
                    <ChartCard title="Items Due to Ship — Next 7 Days" loading={dueToShip?.loading} minH={240}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                            Plan staffing to hit on-time ship dates.
                        </Typography>
                        {(dueToShip?.buckets?.length ?? 0) > 0 ? (
                            <BarChart
                                dataset={dueToShip.buckets}
                                xAxis={[{ dataKey: "label", scaleType: "band", tickLabelStyle: { fontSize: 10 } }]}
                                series={[{ dataKey: "count", label: "Items Due", color: "#3f51b5" }]}
                                height={220}
                                margin={{ left: 48, right: 16, top: 16, bottom: 40 }}
                            />
                        ) : <NoData />}
                    </ChartCard>
                </Grid2>
            </Grid2>
            <Paper variant="outlined">
                <PaginatedTable
                    columns={columns} rows={items} total={total} page={page} pageSize={pageSize}
                    loading={loading} sortField={sortField} sortDir={sortDir}
                    onPageChange={onPageChange} onPageSizeChange={onPageSizeChange} onSortChange={onSortChange}
                />
            </Paper>
        </>
    );
}

const MARKETPLACE_FEE_RATES = {
    amazon: 0.15, ebay: 0.13, etsy: 0.065, walmart: 0.15, target: 0.10,
    "target plus us marketplace": 0.10, faire: 0.25, tiktok: 0.08,
    "tik tok": 0.08, shopify: 0.02, kohls: 0.15, "kohl's": 0.15,
    acenda: 0.15, zulily: 0.20, tsc: 0.15,
};

function CostsTab({ summary, byMarketplace, cogsByMarketplace, ordersData, onPageChange, onPageSizeChange, onSortChange, sortField, sortDir, costItemsData, costItemsSortField, costItemsSortDir, onCostItemsPageChange, onCostItemsPageSizeChange, onCostItemsSortChange, detailView, onDetailViewChange, itemsByMarketplaceAndStyle = {}, inventoryValue }) {
    const { orders, total, page, pageSize, loading } = ordersData;

    const [feeRates, setFeeRates] = useState(MARKETPLACE_FEE_RATES);
    useEffect(() => {
        fetch("/api/reports/settings/fee-rates")
            .then(r => r.ok ? r.json() : null)
            .then(d => { if (d?.value) setFeeRates(d.value); })
            .catch(() => {});
    }, []);
    const [feeModalOpen, setFeeModalOpen] = useState(false);
    const [feeRatesDraft, setFeeRatesDraft] = useState({});
    const estimateFeeLocal = (order) => (order.productCost || 0) * (feeRates[(order.marketplace || "").toLowerCase()] ?? 0);
    const fmtRateLocal = (mp) => { const r = feeRates[(mp || "").toLowerCase()]; return r != null ? `~${(r * 100).toFixed(1)}%` : "—"; };

    const totalFees = useMemo(() =>
        byMarketplace.reduce((s, mp) => s + mp.revenue * (feeRates[(mp.marketplace || "").toLowerCase()] ?? 0), 0),
    [byMarketplace, feeRates]);
    const totalCogs = useMemo(() => Object.values(cogsByMarketplace).reduce((s, v) => s + v, 0), [cogsByMarketplace]);
    const platformCost = (summary.platformCostCents || 0) / 100;   // what they ACTUALLY paid Pythias this period (not projected/upcoming)
    const net = summary.totalRevenue - summary.totalShipping - totalFees - totalCogs - platformCost;
    const revFormatter = (v) => `$${(v ?? 0).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

    const mpRows = useMemo(() =>
        byMarketplace.map((mp) => {
            const rate = feeRates[(mp.marketplace || "").toLowerCase()] ?? 0;
            const fees = mp.revenue * rate;
            const cogs = cogsByMarketplace[mp.marketplace] || 0;
            return { ...mp, fees, cogs, net: mp.revenue - mp.shipping - fees - cogs };
        }),
    [byMarketplace, cogsByMarketplace, feeRates]);

    const netHeight = Math.max(240, mpRows.length * 36 + 60);

    const mpColumns = [
        { key: "marketplace", label: "Marketplace" },
        { key: "orders",   label: "Orders",       align: "right" },
        { key: "revenue",  label: "Revenue",      align: "right", render: (r) => fmt(r.revenue) },
        { key: "shipping", label: "Shipping",     align: "right", render: (r) => fmt(r.shipping) },
        { key: "rate",     label: "Fee Rate",     align: "right", getValue: (r) => feeRates[(r.marketplace || "").toLowerCase()] ?? -1, render: (r) => fmtRateLocal(r.marketplace) },
        { key: "fees",     label: "Est. MP Fees", align: "right", render: (r) => fmt(r.fees) },
        { key: "cogs",     label: "Blank COGS",   align: "right", render: (r) => fmt(r.cogs) },
        { key: "net",      label: "Net",          align: "right", render: (r) => (
            <Typography variant="body2" sx={{ fontWeight: 600, color: r.net >= 0 ? "success.main" : "error.main" }}>{fmt(r.net)}</Typography>
        )},
    ];

    const itemColumns = [
        { key: "date",         serverKey: "date",        label: "Date",       render: (i) => fmtDate(i.date) },
        { key: "marketplace",  serverKey: "marketplace", label: "Channel" },
        { key: "styleCode",    serverKey: "styleCode",   label: "Blank Code" },
        { key: "sizeName",     serverKey: "sizeName",    label: "Size" },
        { key: "colorName",    serverKey: "colorName",   label: "Color" },
        { key: "price",        serverKey: "price",       label: "Price Sold",  align: "right", render: (i) => fmt(i.price) },
        { key: "wholesaleCost",label: "Blank COGS",      align: "right",       render: (i) => fmt(i.wholesaleCost) },
        { key: "mpFee",        label: "Est. MP Fees",    align: "right",       render: (i) => fmt((i.price || 0) * (feeRates[(i.marketplace || "").toLowerCase()] ?? 0)) },
        { key: "net",          label: "Net",             align: "right",       render: (i) => {
            const mpFee = (i.price || 0) * (feeRates[(i.marketplace || "").toLowerCase()] ?? 0);
            const n = (i.price || 0) - (i.wholesaleCost || 0) - mpFee;
            return <Typography variant="body2" sx={{ color: n >= 0 ? "success.main" : "error.main" }}>{fmt(n)}</Typography>;
        }},
    ];

    const orderColumns = [
        { key: "date",        serverKey: "date",        label: "Date",        render: (o) => fmtDate(o.date) },
        { key: "poNumber",    serverKey: "poNumber",    label: "PO #",        render: (o) => o.poNumber || o.orderId || "—" },
        { key: "marketplace", serverKey: "marketplace", label: "Channel",     render: (o) => o.marketplace || "—" },
        { key: "productCost", serverKey: "productCost", label: "Revenue",     align: "right", render: (o) => fmt((o.productCost||0) + (o.shippingCost||0) - (o.discountAmount||0)) },
        { key: "shipping",    label: "Shipping Paid",   align: "right",       render: (o) => fmt(o.shippingPaid) },
        { key: "fees",        label: "Est. MP Fees",    align: "right",       render: (o) => fmt(estimateFeeLocal(o)) },
        { key: "blanksCogs",  label: "Blank COGS",      align: "right",       render: (o) => fmt(o.blanksCogs) },
        { key: "net",         label: "Net",             align: "right",       render: (o) => {
            const n = (o.productCost||0) + (o.shippingCost||0) - (o.discountAmount||0) - (o.shippingPaid||0) - estimateFeeLocal(o) - (o.blanksCogs||0);
            return <Typography variant="body2" sx={{ color: n >= 0 ? "success.main" : "error.main" }}>{fmt(n)}</Typography>;
        }},
    ];

    return (
        <>
            <Grid2 container spacing={2} sx={{ mb: 3 }}>
                <Grid2 size={{ xs: 6, sm: 4, md: 2 }}><KpiCard label="Gross Revenue"  value={fmt(summary.totalRevenue)}  color="success.main" /></Grid2>
                <Grid2 size={{ xs: 6, sm: 4, md: 2 }}><KpiCard label="Shipping Costs" value={fmt(summary.totalShipping)} color="warning.main" /></Grid2>
                <Grid2 size={{ xs: 6, sm: 4, md: 2 }}><KpiCard label="Est. MP Fees"   value={fmt(totalFees)}             color="error.main" /></Grid2>
                <Grid2 size={{ xs: 6, sm: 4, md: 2 }}><KpiCard label="Blank COGS"     value={fmt(totalCogs)}             color="warning.main" /></Grid2>
                <Grid2 size={{ xs: 6, sm: 4, md: 2 }}><KpiCard label="Platform Cost"  value={fmt(platformCost)}          color="error.main" sub="actually paid" /></Grid2>
                <Grid2 size={{ xs: 6, sm: 4, md: 2 }}><KpiCard label="Net Profit"     value={fmt(net)}                   color={net >= 0 ? "success.main" : "error.main"} /></Grid2>
            </Grid2>

            <Grid2 container spacing={2} sx={{ mb: 3 }}>
                <Grid2 size={{ xs: 12, md: 5 }}>
                    <ChartCard title="Cost Breakdown" minH={220}>
                        {summary.totalRevenue > 0 ? (
                            <PieChart
                                series={[{ data: [
                                    { id: 0, value: summary.totalShipping, label: "Shipping",   color: "#ff9800" },
                                    { id: 1, value: totalFees,             label: "MP Fees",    color: "#f44336" },
                                    { id: 2, value: totalCogs,             label: "Blank COGS", color: "#9c27b0" },
                                    { id: 3, value: platformCost,          label: "Platform",   color: "#3f51b5" },
                                    { id: 4, value: Math.max(0, net),      label: "Net",        color: "#4caf50" },
                                ].filter(d => d.value > 0), innerRadius: 40, outerRadius: 80, paddingAngle: 2 }]}
                                height={220}
                                slotProps={{ legend: { direction: "row", position: { vertical: "bottom", horizontal: "middle" } } }}
                            />
                        ) : <NoData />}
                    </ChartCard>
                </Grid2>
                <Grid2 size={{ xs: 12, md: 7 }}>
                    <ChartCard title="Net by Marketplace" minH={netHeight}>
                        {mpRows.length > 0 ? (
                            <BarChart
                                layout="horizontal"
                                dataset={[...mpRows].sort((a, b) => b.net - a.net)}
                                yAxis={[{ dataKey: "marketplace", scaleType: "band", tickLabelStyle: { fontSize: 11 } }]}
                                series={[{ dataKey: "net", label: "Net", valueFormatter: revFormatter, color: "#4caf50" }]}
                                height={netHeight}
                                margin={{ left: 130, right: 16, top: 8, bottom: 30 }}
                                xAxis={[{ valueFormatter: revFormatter }]}
                            />
                        ) : <NoData />}
                    </ChartCard>
                </Grid2>
            </Grid2>

            <Paper variant="outlined" sx={{ mb: 3 }}>
                <Box sx={{ px: 2, py: 1.5, borderBottom: "1px solid", borderColor: "divider", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>By Marketplace</Typography>
                    <Button size="small" variant="outlined" onClick={() => { setFeeRatesDraft(Object.fromEntries(Object.entries(feeRates).map(([k, v]) => [k, (v * 100).toFixed(1)]))); setFeeModalOpen(true); }}>Edit Fee Rates</Button>
                </Box>
                <SortableTable columns={mpColumns} rows={mpRows} defaultSort="revenue" />
            </Paper>

            <Paper variant="outlined">
                <Box sx={{ px: 2, borderBottom: "1px solid", borderColor: "divider", display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
                    <Tabs value={detailView} onChange={(_, v) => v && onDetailViewChange(v)} sx={{ minHeight: 40 }} TabIndicatorProps={{ sx: { height: 2 } }}>
                        <Tab label="Order Detail" value="orders" sx={{ minHeight: 40, py: 0.5, textTransform: "none", fontSize: "0.8125rem", fontWeight: 600 }} />
                        <Tab label="Items Detail" value="items"  sx={{ minHeight: 40, py: 0.5, textTransform: "none", fontSize: "0.8125rem", fontWeight: 600 }} />
                    </Tabs>
                </Box>
                {detailView === "orders" ? (
                    <PaginatedTable
                        columns={orderColumns} rows={orders} total={total} page={page} pageSize={pageSize}
                        loading={loading} sortField={sortField} sortDir={sortDir}
                        onPageChange={onPageChange} onPageSizeChange={onPageSizeChange} onSortChange={onSortChange}
                    />
                ) : (
                    <PaginatedTable
                        columns={itemColumns} rows={costItemsData?.items ?? []} total={costItemsData?.total ?? 0}
                        page={costItemsData?.page ?? 1} pageSize={costItemsData?.pageSize ?? 50}
                        loading={costItemsData?.loading ?? false} sortField={costItemsSortField} sortDir={costItemsSortDir}
                        onPageChange={onCostItemsPageChange} onPageSizeChange={onCostItemsPageSizeChange} onSortChange={onCostItemsSortChange}
                    />
                )}
            </Paper>

            <Dialog open={feeModalOpen} onClose={() => setFeeModalOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle>Marketplace Fee Rates</DialogTitle>
                <DialogContent>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 600 }}>Marketplace</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 600 }}>Rate</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {Object.keys(feeRatesDraft).map((mp) => (
                                <TableRow key={mp}>
                                    <TableCell sx={{ textTransform: "capitalize" }}>{mp}</TableCell>
                                    <TableCell align="right" sx={{ width: 100 }}>
                                        <TextField
                                            size="small"
                                            value={feeRatesDraft[mp] ?? ""}
                                            onChange={(e) => setFeeRatesDraft(d => ({ ...d, [mp]: e.target.value }))}
                                            InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                                            sx={{ width: 90 }}
                                        />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setFeeModalOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={() => {
                        const next = {};
                        for (const [k, v] of Object.entries(feeRatesDraft)) {
                            const n = parseFloat(v);
                            next[k] = isNaN(n) ? 0 : n / 100;
                        }
                        setFeeRates(next);
                        fetch("/api/reports/settings/fee-rates", {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ value: next }),
                        }).catch(() => {});
                        setFeeModalOpen(false);
                    }}>Save</Button>
                </DialogActions>
            </Dialog>
        </>
    );
}

function ForecastTab() {
    const [revForecast,   setRevForecast]   = useState(null);
    const [blkForecast,   setBlkForecast]   = useState(null);
    const [revLoading,    setRevLoading]    = useState(false);
    const [blkLoading,    setBlkLoading]    = useState(false);
    const [revComputing,  setRevComputing]  = useState(false);
    const [blkComputing,  setBlkComputing]  = useState(false);
    const [horizon,       setHorizon]       = useState(90);

    const loadRevForecast = useCallback(async (h) => {
        setRevLoading(true);
        try {
            const res  = await fetch(`/api/admin/dashboard/forecast?horizon=${h ?? horizon}`);
            const json = await res.json();
            if (!json.notReady) setRevForecast(json);
        } catch (e) { console.error(e); }
        finally { setRevLoading(false); }
    }, [horizon]);

    const loadBlkForecast = useCallback(async () => {
        setBlkLoading(true);
        try {
            const res  = await fetch("/api/admin/dashboard/blanks-forecast");
            const json = await res.json();
            if (!json.notReady) setBlkForecast(json);
        } catch (e) { console.error(e); }
        finally { setBlkLoading(false); }
    }, []);

    const computeRevForecast = async () => {
        setRevComputing(true);
        try {
            const res  = await fetch(`/api/admin/dashboard/forecast?horizon=${horizon}`, { method: "POST" });
            const json = await res.json();
            setRevForecast(json);
        } catch (e) { console.error(e); }
        finally { setRevComputing(false); }
    };

    const computeBlkForecast = async () => {
        setBlkComputing(true);
        try {
            const res  = await fetch("/api/admin/dashboard/blanks-forecast", { method: "POST" });
            const json = await res.json();
            setBlkForecast(json);
        } catch (e) { console.error(e); }
        finally { setBlkComputing(false); }
    };

    useEffect(() => { loadRevForecast(); loadBlkForecast(); }, [loadRevForecast, loadBlkForecast]);

    const revFormatter = (v) => `$${(v ?? 0).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
    const best = revForecast?.best;
    const proj = revForecast?.projections?.[best] ?? revForecast?.projections?.linear ?? {};
    const models = revForecast?.models ?? {};
    const combined = revForecast?.combined ?? [];

    // Build chart series from available models
    const MODEL_COLORS = { linear: "#2196f3", exponentialSmoothing: "#4caf50", movingAverage: "#ff9800", chronos: "#9c27b0", prophet: "#e91e63" };
    const MODEL_LABELS = { linear: "Linear", exponentialSmoothing: "Exp. Smoothing", movingAverage: "Moving Avg", chronos: "Chronos AI", prophet: "Prophet" };

    const chartDataset = combined.map(pt => ({ ...pt, date: pt.date?.slice(0, 10) }));
    const availModels  = Object.keys(MODEL_COLORS).filter(k => combined.some(pt => pt[k] != null));

    const blkRows = blkForecast?.rows ?? [];
    const needsReorder = blkRows.filter(r => r.needsReorder);

    const blkColumns = [
        { key: "styleCode", label: "Style" },
        { key: "colorName", label: "Color" },
        { key: "sizeName",  label: "Size"  },
        { key: "onHand",    label: "On Hand",    align: "right" },
        { key: "last30",    label: "Last 30d",   align: "right" },
        { key: "avgMonthly",label: "Avg/Mo",     align: "right", render: (r) => r.avgMonthly?.toFixed(1) ?? "—" },
        { key: "suggested", label: "Suggested",  align: "right", render: (r) => r.suggested > 0 ? <Typography variant="body2" color="warning.main" fontWeight={600}>{r.suggested}</Typography> : r.suggested },
        { key: "orderValue",label: "Order Value", align: "right", render: (r) => r.orderValue > 0 ? fmt(r.orderValue) : "—" },
        { key: "needsReorder", label: "Status",  render: (r) => r.needsReorder
            ? <Chip size="small" label="Reorder" color="error" />
            : <Chip size="small" label="OK" color="success" variant="outlined" /> },
    ];

    return (
        <>
            {/* Revenue Forecast */}
            <Box sx={{ mb: 4 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }} flexWrap="wrap" gap={1}>
                    <Typography variant="subtitle1" fontWeight={700}>Revenue Forecast</Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <FormControl size="small" sx={{ minWidth: 140 }}>
                            <Select value={horizon} onChange={(e) => { setHorizon(e.target.value); loadRevForecast(e.target.value); }}>
                                {[30, 60, 90, 180, 365].map(d => <MenuItem key={d} value={d}>{d} days out</MenuItem>)}
                            </Select>
                        </FormControl>
                        <Button size="small" variant="contained" onClick={computeRevForecast} disabled={revComputing}>
                            {revComputing ? <CircularProgress size={16} sx={{ mr: 1 }} /> : null}
                            {revComputing ? "Computing…" : "Run Forecast"}
                        </Button>
                    </Stack>
                </Stack>

                {revLoading ? (
                    <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}><CircularProgress /></Box>
                ) : !revForecast ? (
                    <Paper variant="outlined" sx={{ p: 4, textAlign: "center" }}>
                        <AutoGraphIcon sx={{ fontSize: 48, color: "text.disabled", mb: 1 }} />
                        <Typography color="text.secondary" variant="body2">No forecast computed yet. Click "Run Forecast" to generate projections.</Typography>
                    </Paper>
                ) : (
                    <>
                        <Grid2 container spacing={2} sx={{ mb: 2 }}>
                            <Grid2 size={{ xs: 6, sm: 3 }}><KpiCard label="Next 7 Days"   value={fmt(proj.week)}    /></Grid2>
                            <Grid2 size={{ xs: 6, sm: 3 }}><KpiCard label="Next 30 Days"  value={fmt(proj.month)}   /></Grid2>
                            <Grid2 size={{ xs: 6, sm: 3 }}><KpiCard label="Next 90 Days"  value={fmt(proj.quarter)} /></Grid2>
                            <Grid2 size={{ xs: 6, sm: 3 }}><KpiCard label="Next 365 Days" value={fmt(proj.year)}    sub={best ? `Best model: ${MODEL_LABELS[best] ?? best}` : undefined} /></Grid2>
                        </Grid2>

                        <Grid2 container spacing={2} sx={{ mb: 2 }}>
                            <Grid2 size={{ xs: 12, md: 8 }}>
                                <ChartCard title="Revenue — Historical + Forecast" minH={300}>
                                    {chartDataset.length > 0 ? (
                                        <LineChart
                                            dataset={chartDataset}
                                            xAxis={[{ dataKey: "date", scaleType: "band", tickLabelStyle: { fontSize: 9 }, tickMinStep: 7 }]}
                                            series={[
                                                { dataKey: "actual", label: "Actual", color: "#111827", valueFormatter: revFormatter },
                                                ...availModels.map(k => ({
                                                    dataKey: k,
                                                    label: MODEL_LABELS[k] ?? k,
                                                    color: MODEL_COLORS[k],
                                                    valueFormatter: revFormatter,
                                                    strokeDasharray: k === best ? undefined : "4 2",
                                                })),
                                            ]}
                                            height={300}
                                            margin={{ left: 72, right: 16, top: 16, bottom: 40 }}
                                            yAxis={[{ valueFormatter: revFormatter }]}
                                        />
                                    ) : <NoData />}
                                </ChartCard>
                            </Grid2>
                            <Grid2 size={{ xs: 12, md: 4 }}>
                                <ChartCard title="Model Accuracy (RMSE)" minH={300}>
                                    {Object.keys(models).length > 0 ? (
                                        <Box sx={{ pt: 1 }}>
                                            {Object.entries(models).map(([k, m]) => (
                                                <Box key={k} sx={{ mb: 1.5 }}>
                                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                                        <Stack direction="row" alignItems="center" spacing={0.75}>
                                                            <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: MODEL_COLORS[k] ?? "#999" }} />
                                                            <Typography variant="caption" fontWeight={k === best ? 700 : 400}>
                                                                {MODEL_LABELS[k] ?? k}{k === best ? " ★" : ""}
                                                            </Typography>
                                                        </Stack>
                                                        <Typography variant="caption" color="text.secondary">
                                                            RMSE: {m.rmse != null ? `$${m.rmse.toFixed(0)}` : "—"}
                                                        </Typography>
                                                    </Stack>
                                                    <LinearProgress
                                                        variant="determinate"
                                                        value={100 - Math.min(100, ((m.rmse ?? 0) / (Math.max(...Object.values(models).map(x => x.rmse ?? 0)) || 1)) * 100)}
                                                        sx={{ mt: 0.5, height: 6, borderRadius: 3, bgcolor: "grey.100", "& .MuiLinearProgress-bar": { bgcolor: MODEL_COLORS[k] ?? "#999" } }}
                                                    />
                                                </Box>
                                            ))}
                                        </Box>
                                    ) : <NoData />}
                                </ChartCard>
                            </Grid2>
                        </Grid2>
                    </>
                )}
            </Box>

            {/* Blank Inventory Forecast */}
            <Box>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }} flexWrap="wrap" gap={1}>
                    <Typography variant="subtitle1" fontWeight={700}>Blank Inventory Forecast</Typography>
                    <Button size="small" variant="contained" onClick={computeBlkForecast} disabled={blkComputing}>
                        {blkComputing ? <CircularProgress size={16} sx={{ mr: 1 }} /> : null}
                        {blkComputing ? "Computing…" : "Run Forecast"}
                    </Button>
                </Stack>

                {blkLoading ? (
                    <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}><CircularProgress /></Box>
                ) : !blkForecast ? (
                    <Paper variant="outlined" sx={{ p: 4, textAlign: "center" }}>
                        <AutoGraphIcon sx={{ fontSize: 48, color: "text.disabled", mb: 1 }} />
                        <Typography color="text.secondary" variant="body2">No inventory forecast computed yet. Click "Run Forecast" to analyze reorder needs.</Typography>
                    </Paper>
                ) : (
                    <>
                        <Grid2 container spacing={2} sx={{ mb: 2 }}>
                            <Grid2 size={{ xs: 6, sm: 3 }}><KpiCard label="SKUs Needing Reorder" value={fmtN(blkForecast.needsReorderCount)} color="error.main" /></Grid2>
                            <Grid2 size={{ xs: 6, sm: 3 }}><KpiCard label="Total Suggested Units" value={fmtN(blkForecast.totalSuggestedUnits)} /></Grid2>
                            <Grid2 size={{ xs: 6, sm: 3 }}><KpiCard label="Est. Order Value"      value={fmt(blkForecast.totalOrderValue)} color="warning.main" /></Grid2>
                            <Grid2 size={{ xs: 6, sm: 3 }}><KpiCard label="Total SKUs Analyzed"   value={fmtN(blkRows.length)} /></Grid2>
                        </Grid2>

                        <Paper variant="outlined" sx={{ mb: 2 }}>
                            <Box sx={{ px: 2, py: 1.5, borderBottom: "1px solid", borderColor: "divider" }}>
                                <Typography variant="subtitle2" fontWeight={600}>SKUs Needing Reorder ({needsReorder.length})</Typography>
                            </Box>
                            <SortableTable columns={blkColumns} rows={needsReorder} defaultSort="orderValue" defaultDir="desc" />
                        </Paper>

                        <Paper variant="outlined">
                            <Box sx={{ px: 2, py: 1.5, borderBottom: "1px solid", borderColor: "divider" }}>
                                <Typography variant="subtitle2" fontWeight={600}>All SKUs</Typography>
                            </Box>
                            <SortableTable columns={blkColumns} rows={blkRows} defaultSort="avgMonthly" defaultDir="desc" />
                        </Paper>
                    </>
                )}
            </Box>
        </>
    );
}

function BlanksTab({ blanks, loading }) {
    const totalQty  = useMemo(() => blanks.reduce((s, r) => s + r.qty, 0), [blanks]);
    const totalCogs = useMemo(() => blanks.reduce((s, r) => s + r.totalCogs, 0), [blanks]);
    const topRow    = blanks[0];
    const top10     = blanks.slice(0, 10);
    const top10Height = Math.max(240, top10.length * 36 + 60);
    const revFormatter = (v) => `$${(v ?? 0).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

    const columns = [
        { key: "styleCode", label: "Style" },
        { key: "colorName", label: "Color" },
        { key: "sizeName",  label: "Size"  },
        { key: "qty",       label: "Qty Sold",   align: "right" },
        { key: "unitCost",  label: "Unit Cost",  align: "right", render: (r) => fmt(r.unitCost) },
        { key: "totalCogs", label: "Total COGS", align: "right", render: (r) => fmt(r.totalCogs) },
    ];

    return (
        <>
            <Grid2 container spacing={2} sx={{ mb: 3 }}>
                <Grid2 size={{ xs: 6, md: 3 }}><KpiCard label="Unique SKUs"    value={fmtN(blanks.length)} /></Grid2>
                <Grid2 size={{ xs: 6, md: 3 }}><KpiCard label="Total Qty Sold" value={fmtN(totalQty)} /></Grid2>
                <Grid2 size={{ xs: 6, md: 3 }}><KpiCard label="Total COGS"     value={fmt(totalCogs)} color="warning.main" /></Grid2>
                <Grid2 size={{ xs: 6, md: 3 }}><KpiCard
                    label="Top Seller"
                    value={topRow ? `${topRow.styleCode || "—"} / ${topRow.colorName || "—"}` : "—"}
                    sub={topRow ? `${topRow.sizeName || ""} · ${fmtN(topRow.qty)} sold` : undefined}
                /></Grid2>
            </Grid2>
            <Grid2 container spacing={2} sx={{ mb: 3 }}>
                <Grid2 size={{ xs: 12, md: 6 }}>
                    <ChartCard title="Top 10 Blanks by Qty Sold" loading={loading} minH={top10Height}>
                        {top10.length > 0 ? (
                            <BarChart
                                layout="horizontal"
                                dataset={top10.map(b => ({ ...b, label: `${b.styleCode || ""} ${b.colorName || ""} ${b.sizeName || ""}`.trim() }))}
                                yAxis={[{ dataKey: "label", scaleType: "band", tickLabelStyle: { fontSize: 10 } }]}
                                series={[{ dataKey: "qty", label: "Qty Sold", color: "#ff9800" }]}
                                height={top10Height}
                                margin={{ left: 150, right: 16, top: 8, bottom: 30 }}
                            />
                        ) : <NoData />}
                    </ChartCard>
                </Grid2>
                <Grid2 size={{ xs: 12, md: 6 }}>
                    <ChartCard title="Top 10 Blanks by COGS" loading={loading} minH={top10Height}>
                        {top10.length > 0 ? (() => {
                            const byCogs = [...top10].sort((a, b) => b.totalCogs - a.totalCogs);
                            return (
                                <BarChart
                                    layout="horizontal"
                                    dataset={byCogs.map(b => ({ ...b, label: `${b.styleCode || ""} ${b.sizeName || ""}`.trim() }))}
                                    yAxis={[{ dataKey: "label", scaleType: "band", tickLabelStyle: { fontSize: 10 } }]}
                                    series={[{ dataKey: "totalCogs", label: "COGS", valueFormatter: revFormatter, color: "#f44336" }]}
                                    height={top10Height}
                                    margin={{ left: 100, right: 16, top: 8, bottom: 30 }}
                                    xAxis={[{ valueFormatter: revFormatter }]}
                                />
                            );
                        })() : <NoData />}
                    </ChartCard>
                </Grid2>
            </Grid2>
            <Paper variant="outlined" sx={{ position: "relative" }}>
                {loading && <LinearProgress sx={{ position: "absolute", top: 0, left: 0, right: 0 }} />}
                <SortableTable columns={columns} rows={blanks} defaultSort="qty" defaultDir="desc" />
            </Paper>
        </>
    );
}

function downloadCsv(filename, headers, rows) {
    const esc = (v) => {
        const s = v == null ? "" : String(v);
        return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const csv = [headers.map(esc).join(","), ...rows.map((r) => r.map(esc).join(","))].join("\r\n");
    Object.assign(document.createElement("a"), {
        href: URL.createObjectURL(new Blob([csv], { type: "text/csv" })),
        download: filename,
    }).click();
}

function isoDate(d) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; }
function todayStr()  { return isoDate(new Date()); }
function daysAgo(n)  { const d = new Date(); d.setDate(d.getDate() - n); return isoDate(d); }
function startOfWeek()      { const d = new Date(); d.setDate(d.getDate() - d.getDay()); return isoDate(d); }
function startOfLastWeek()  { const d = new Date(); d.setDate(d.getDate() - d.getDay() - 7); return isoDate(d); }
function endOfLastWeek()    { const d = new Date(); d.setDate(d.getDate() - d.getDay() - 1); return isoDate(d); }
function startOfMonth()     { const d = new Date(); d.setDate(1); return isoDate(d); }
function startOfLastMonth() { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - 1); return isoDate(d); }
function endOfLastMonth()   { const d = new Date(); d.setDate(0); return isoDate(d); }
function startOfYear()      { const d = new Date(); d.setMonth(0); d.setDate(1); return isoDate(d); }

const PRESETS = [
    { label: "Today",        getRange: () => [todayStr(), todayStr()] },
    { label: "Yesterday",    getRange: () => [daysAgo(1), daysAgo(1)] },
    { label: "This Week",    getRange: () => [startOfWeek(), todayStr()] },
    { label: "Last Week",    getRange: () => [startOfLastWeek(), endOfLastWeek()] },
    { label: "This Month",   getRange: () => [startOfMonth(), todayStr()] },
    { label: "Last Month",   getRange: () => [startOfLastMonth(), endOfLastMonth()] },
    { label: "Last 7 Days",  getRange: () => [daysAgo(7), todayStr()] },
    { label: "Last 30 Days", getRange: () => [daysAgo(30), todayStr()] },
    { label: "Last 90 Days", getRange: () => [daysAgo(90), todayStr()] },
    { label: "This Year",    getRange: () => [startOfYear(), todayStr()] },
    { label: "Custom",       custom: true },
];

export default function ReportsPage() {
    const [preset,      setPreset]      = useState("Last 30 Days");
    const [from,        setFrom]        = useState(() => daysAgo(30));
    const [to,          setTo]          = useState(() => todayStr());
    const [tab,         setTab]         = useState(0);
    const [data,        setData]        = useState(null);
    const [loading,     setLoading]     = useState(true);
    const [error,       setError]       = useState(null);
    const [marketplace, setMarketplace] = useState("All");

    const [ordersRows,      setOrdersRows]      = useState([]);
    const [ordersTotal,     setOrdersTotal]     = useState(0);
    const [ordersPage,      setOrdersPage]      = useState(1);
    const [ordersSize,      setOrdersSize]      = useState(50);
    const [ordersSortField, setOrdersSortField] = useState("date");
    const [ordersSortDir,   setOrdersSortDir]   = useState("desc");
    const [ordersLoading,   setOrdersLoading]   = useState(false);

    const [itemsRows,         setItemsRows]         = useState([]);
    const [itemsTotal,        setItemsTotal]         = useState(0);
    const [itemsPage,         setItemsPage]          = useState(1);
    const [itemsSize,         setItemsSize]          = useState(50);
    const [itemsSortField,    setItemsSortField]    = useState("date");
    const [itemsSortDir,      setItemsSortDir]      = useState("desc");
    const [itemsLoading,      setItemsLoading]      = useState(false);
    const [productionSummary, setProductionSummary] = useState(null);

    const [dueToShipBuckets, setDueToShipBuckets] = useState([]);
    const [dueToShipLoading, setDueToShipLoading] = useState(false);
    const dueToShipAbortRef = useRef(null);

    const [costDetailView,     setCostDetailView]     = useState("orders");
    const [costItemsRows,      setCostItemsRows]      = useState([]);
    const [costItemsTotal,     setCostItemsTotal]     = useState(0);
    const [costItemsPage,      setCostItemsPage]      = useState(1);
    const [costItemsSize,      setCostItemsSize]      = useState(50);
    const [costItemsSortField, setCostItemsSortField] = useState("date");
    const [costItemsSortDir,   setCostItemsSortDir]   = useState("desc");
    const [costItemsLoading,   setCostItemsLoading]   = useState(false);

    const [blanksRows,    setBlanksRows]    = useState([]);
    const [blanksLoading, setBlanksLoading] = useState(false);

    const abortRef          = useRef(null);
    const ordersAbortRef    = useRef(null);
    const itemsAbortRef     = useRef(null);
    const costItemsAbortRef = useRef(null);
    const blanksAbortRef    = useRef(null);

    const load = useCallback(async (f, t) => {
        if (abortRef.current) abortRef.current.abort();
        const controller = new AbortController();
        abortRef.current = controller;
        setData(null); setOrdersRows([]); setOrdersTotal(0);
        setItemsRows([]); setItemsTotal(0); setProductionSummary(null);
        setBlanksRows([]);
        setLoading(true); setError(null);
        try {
            const res  = await fetch(`/api/reports/dashboard?from=${f}&to=${t}`, { signal: controller.signal });
            const json = await res.json();
            if (!res.ok || json.error) throw new Error(json.msg || "Failed to load data");
            setData(json);
        } catch (e) {
            if (e.name === "AbortError") return;
            setError(e.message);
        } finally {
            if (abortRef.current === controller) setLoading(false);
        }
    }, []);

    const loadOrders = useCallback(async (f, t, mp, page, size, sortField, sortDir) => {
        if (ordersAbortRef.current) ordersAbortRef.current.abort();
        const controller = new AbortController();
        ordersAbortRef.current = controller;
        setOrdersLoading(true);
        try {
            const mpParam = mp && mp !== "All" ? `&marketplace=${encodeURIComponent(mp)}` : "";
            const res  = await fetch(`/api/reports/dashboard/orders?from=${f}&to=${t}${mpParam}&page=${page}&pageSize=${size}&sort=${sortField}&dir=${sortDir}`, { signal: controller.signal });
            const json = await res.json();
            if (!res.ok || json.error) throw new Error(json.msg);
            setOrdersRows(json.orders);
            setOrdersTotal(json.total);
        } catch (e) {
            if (e.name !== "AbortError") console.error("[orders]", e.message);
        } finally {
            if (ordersAbortRef.current === controller) setOrdersLoading(false);
        }
    }, []);

    const loadItems = useCallback(async (f, t, mp, page, size, sortField, sortDir) => {
        if (itemsAbortRef.current) itemsAbortRef.current.abort();
        const controller = new AbortController();
        itemsAbortRef.current = controller;
        setItemsLoading(true);
        try {
            const mpParam = mp && mp !== "All" ? `&marketplace=${encodeURIComponent(mp)}` : "";
            const res  = await fetch(`/api/reports/dashboard/items?from=${f}&to=${t}${mpParam}&page=${page}&pageSize=${size}&sort=${sortField}&dir=${sortDir}`, { signal: controller.signal });
            const json = await res.json();
            if (!res.ok || json.error) throw new Error(json.msg);
            setItemsRows(json.items);
            setItemsTotal(json.total);
            setProductionSummary(json.productionSummary);
        } catch (e) {
            if (e.name !== "AbortError") console.error("[items]", e.message);
        } finally {
            if (itemsAbortRef.current === controller) setItemsLoading(false);
        }
    }, []);

    const loadCostItems = useCallback(async (f, t, page, size, sortField, sortDir) => {
        if (costItemsAbortRef.current) costItemsAbortRef.current.abort();
        const controller = new AbortController();
        costItemsAbortRef.current = controller;
        setCostItemsLoading(true);
        try {
            const res  = await fetch(`/api/reports/cost-items?from=${f}&to=${t}&page=${page}&pageSize=${size}&sort=${sortField}&dir=${sortDir}`, { signal: controller.signal });
            const json = await res.json();
            if (!res.ok || json.error) throw new Error(json.msg);
            setCostItemsRows(json.items);
            setCostItemsTotal(json.total);
        } catch (e) {
            if (e.name !== "AbortError") console.error("[cost-items]", e.message);
        } finally {
            if (costItemsAbortRef.current === controller) setCostItemsLoading(false);
        }
    }, []);

    const loadDueToShip = useCallback(async () => {
        if (dueToShipAbortRef.current) dueToShipAbortRef.current.abort();
        const controller = new AbortController();
        dueToShipAbortRef.current = controller;
        setDueToShipLoading(true);
        try {
            const res  = await fetch(`/api/reports/dashboard/due-to-ship`, { signal: controller.signal });
            const json = await res.json();
            if (!res.ok || json.error) throw new Error(json.msg);
            setDueToShipBuckets(json.buckets ?? []);
        } catch (e) {
            if (e.name !== "AbortError") console.error("[due-to-ship]", e.message);
        } finally {
            if (dueToShipAbortRef.current === controller) setDueToShipLoading(false);
        }
    }, []);

    const loadBlanks = useCallback(async (f, t, mp) => {
        if (blanksAbortRef.current) blanksAbortRef.current.abort();
        const controller = new AbortController();
        blanksAbortRef.current = controller;
        setBlanksLoading(true);
        try {
            const mpParam = mp && mp !== "All" ? `&marketplace=${encodeURIComponent(mp)}` : "";
            const res  = await fetch(`/api/reports/dashboard/blanks?from=${f}&to=${t}${mpParam}`, { signal: controller.signal });
            const json = await res.json();
            if (!res.ok || json.error) throw new Error(json.msg);
            setBlanksRows(json.blanks);
        } catch (e) {
            if (e.name !== "AbortError") console.error("[blanks]", e.message);
        } finally {
            if (blanksAbortRef.current === controller) setBlanksLoading(false);
        }
    }, []);

    useEffect(() => { load(from, to); }, [from, to, load]);
    useEffect(() => { setOrdersPage(1); setItemsPage(1); setCostItemsPage(1); }, [from, to, marketplace]);
    useEffect(() => { loadOrders(from, to, marketplace, ordersPage, ordersSize, ordersSortField, ordersSortDir); }, [from, to, marketplace, ordersPage, ordersSize, ordersSortField, ordersSortDir, loadOrders]);
    useEffect(() => { loadItems(from, to, marketplace, itemsPage, itemsSize, itemsSortField, itemsSortDir); }, [from, to, marketplace, itemsPage, itemsSize, itemsSortField, itemsSortDir, loadItems]);
    useEffect(() => { loadCostItems(from, to, costItemsPage, costItemsSize, costItemsSortField, costItemsSortDir); }, [from, to, costItemsPage, costItemsSize, costItemsSortField, costItemsSortDir, loadCostItems]);
    useEffect(() => { loadBlanks(from, to, marketplace); }, [from, to, marketplace, loadBlanks]);
    useEffect(() => { loadDueToShip(); }, [loadDueToShip]);

    const handlePreset = (label) => {
        setPreset(label);
        const p = PRESETS.find((p) => p.label === label);
        if (p && !p.custom) { const [f, t] = p.getRange(); setFrom(f); setTo(t); }
    };

    const handleOrdersSort = useCallback((field) => {
        setOrdersSortDir((prev) => (ordersSortField === field ? (prev === "asc" ? "desc" : "asc") : "desc"));
        setOrdersSortField(field); setOrdersPage(1);
    }, [ordersSortField]);
    const handleOrdersPageSizeChange = useCallback((size) => { setOrdersSize(size); setOrdersPage(1); }, []);

    const handleItemsSort = useCallback((field) => {
        setItemsSortDir((prev) => (itemsSortField === field ? (prev === "asc" ? "desc" : "asc") : "desc"));
        setItemsSortField(field); setItemsPage(1);
    }, [itemsSortField]);
    const handleItemsPageSizeChange = useCallback((size) => { setItemsSize(size); setItemsPage(1); }, []);

    const handleCostItemsSort = useCallback((field) => {
        setCostItemsSortDir((prev) => (costItemsSortField === field ? (prev === "asc" ? "desc" : "asc") : "desc"));
        setCostItemsSortField(field); setCostItemsPage(1);
    }, [costItemsSortField]);
    const handleCostItemsPageSizeChange = useCallback((size) => { setCostItemsSize(size); setCostItemsPage(1); }, []);

    const summary             = data?.summary             ?? { totalRevenue: 0, orderCount: 0, canceledCount: 0, totalShipping: 0 };
    const byMarketplace       = data?.byMarketplace       ?? [];
    const itemCount           = data?.itemCount           ?? 0;
    const revenueByDay        = data?.revenueByDay        ?? [];
    const itemsByDay          = data?.itemsByDay          ?? [];
    const cogsByMarketplace   = data?.cogsByMarketplace   ?? {};
    const itemsByMarketplaceAndStyle = data?.itemsByMarketplaceAndStyle ?? {};

    const marketplaces = useMemo(() =>
        ["All", ...byMarketplace.map((mp) => mp.marketplace).filter(Boolean).sort()],
    [byMarketplace]);

    const ordersData    = { orders: ordersRows,   total: ordersTotal,    page: ordersPage,    pageSize: ordersSize,    loading: ordersLoading    };
    const itemsData     = { items: itemsRows,     total: itemsTotal,     page: itemsPage,     pageSize: itemsSize,     loading: itemsLoading     };
    const costItemsData = { items: costItemsRows, total: costItemsTotal, page: costItemsPage, pageSize: costItemsSize, loading: costItemsLoading };

    const handleDownload = useCallback(() => {
        if (tab === 0) return;
        const mpSlug  = marketplace !== "All" ? `-${marketplace}` : "";
        const mpParam = marketplace !== "All" ? `&marketplace=${encodeURIComponent(marketplace)}` : "";
        const slug    = [null, "sales", "production", "costs", "blanks"][tab];
        const name    = `${slug}${mpSlug}-${from}-to-${to}`;

        if (tab === 4) {
            downloadCsv(`${name}.csv`,
                ["Style", "Color", "Size", "Qty Sold", "Unit Cost", "Total COGS"],
                blanksRows.map((r) => [r.styleCode || "", r.colorName || "", r.sizeName || "", r.qty, (r.unitCost ?? 0).toFixed(2), (r.totalCogs ?? 0).toFixed(2)])
            );
        } else {
            let endpoint;
            if (tab === 2) endpoint = `/api/reports/dashboard/items?csv=1&from=${from}&to=${to}${mpParam}`;
            else if (tab === 3 && costDetailView === "items") endpoint = `/api/reports/cost-items?csv=1&from=${from}&to=${to}`;
            else endpoint = `/api/reports/dashboard/orders?csv=1&from=${from}&to=${to}${mpParam}`;
            Object.assign(document.createElement("a"), { href: endpoint, download: `${name}.csv` }).click();
        }
    }, [tab, costDetailView, blanksRows, marketplace, from, to]);

    const isInitialLoad = loading && !data;

    return (
        <Box sx={{ backgroundColor: "background.default", minHeight: "100vh" }}>
            <Container maxWidth="xl" sx={{ py: 3 }}>

                <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ sm: "center" }} justifyContent="space-between" spacing={2} sx={{ mb: 3 }}>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                        <BarChartIcon sx={{ color: "primary.main", fontSize: 28 }} />
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>Reports</Typography>
                            <Typography variant="caption" color="text.secondary">
                                {isInitialLoad ? "Loading…" : `${fmtN(summary.orderCount)} orders · ${fmtN(itemCount)} items`}
                            </Typography>
                        </Box>
                    </Stack>

                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                        <Button variant="outlined" size="small" startIcon={<DownloadIcon />} onClick={handleDownload}
                            disabled={isInitialLoad || !data || tab === 0}>
                            CSV
                        </Button>
                        <FormControl size="small" sx={{ minWidth: 140 }} disabled={isInitialLoad || !data}>
                            <Select value={marketplace} onChange={(e) => setMarketplace(e.target.value)} displayEmpty>
                                {marketplaces.map((mp) => <MenuItem key={mp} value={mp}>{mp}</MenuItem>)}
                            </Select>
                        </FormControl>
                        <FormControl size="small" sx={{ minWidth: 150 }}>
                            <Select value={preset} onChange={(e) => handlePreset(e.target.value)} displayEmpty>
                                {PRESETS.map((p) => <MenuItem key={p.label} value={p.label}>{p.label}</MenuItem>)}
                            </Select>
                        </FormControl>
                        <TextField size="small" type="date" value={from}
                            onChange={(e) => { setFrom(e.target.value); setPreset("Custom"); }}
                            inputProps={{ max: to }} sx={{ width: 150 }} />
                        <Typography variant="body2" color="text.secondary">–</Typography>
                        <TextField size="small" type="date" value={to}
                            onChange={(e) => { setTo(e.target.value); setPreset("Custom"); }}
                            inputProps={{ min: from, max: todayStr() }} sx={{ width: 150 }} />
                    </Stack>
                </Stack>

                <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
                    <Tabs value={tab} onChange={(_, v) => setTab(v)}>
                        <Tab icon={<BarChartIcon fontSize="small" />}              iconPosition="start" label="Overview" />
                        <Tab icon={<TrendingUpIcon fontSize="small" />}             iconPosition="start" label="Sales" />
                        <Tab icon={<PrecisionManufacturingIcon fontSize="small" />} iconPosition="start" label="Production" />
                        <Tab icon={<AttachMoneyIcon fontSize="small" />}            iconPosition="start" label="Costs" />
                        <Tab icon={<CategoryIcon fontSize="small" />}              iconPosition="start" label="Blanks" />
                        <Tab icon={<AutoGraphIcon fontSize="small" />}            iconPosition="start" label="Forecast" />
                    </Tabs>
                </Box>

                {isInitialLoad ? (
                    <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
                        <CircularProgress />
                    </Box>
                ) : error ? (
                    <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
                ) : (
                    <>
                        {tab === 0 && (
                            <OverviewTab
                                revenueByDay={revenueByDay}
                                byMarketplace={byMarketplace}
                                productionSummary={productionSummary}
                                blanks={blanksRows}
                                itemsLoading={itemsLoading}
                                blanksLoading={blanksLoading}
                            />
                        )}
                        {tab === 1 && (
                            <SalesTab
                                summary={summary} ordersData={ordersData} revenueByDay={revenueByDay}
                                sortField={ordersSortField} sortDir={ordersSortDir}
                                onPageChange={setOrdersPage} onPageSizeChange={handleOrdersPageSizeChange} onSortChange={handleOrdersSort}
                            />
                        )}
                        {tab === 2 && (
                            <ProductionTab
                                productionSummary={productionSummary} itemsData={itemsData} itemsByDay={itemsByDay}
                                dueToShip={{ buckets: dueToShipBuckets, loading: dueToShipLoading }}
                                sortField={itemsSortField} sortDir={itemsSortDir}
                                onPageChange={setItemsPage} onPageSizeChange={handleItemsPageSizeChange} onSortChange={handleItemsSort}
                            />
                        )}
                        {tab === 3 && (
                            <CostsTab
                                summary={summary} byMarketplace={byMarketplace} cogsByMarketplace={cogsByMarketplace}
                                ordersData={ordersData} sortField={ordersSortField} sortDir={ordersSortDir}
                                onPageChange={setOrdersPage} onPageSizeChange={handleOrdersPageSizeChange} onSortChange={handleOrdersSort}
                                costItemsData={costItemsData} costItemsSortField={costItemsSortField} costItemsSortDir={costItemsSortDir}
                                onCostItemsPageChange={setCostItemsPage} onCostItemsPageSizeChange={handleCostItemsPageSizeChange} onCostItemsSortChange={handleCostItemsSort}
                                detailView={costDetailView} onDetailViewChange={setCostDetailView}
                                itemsByMarketplaceAndStyle={itemsByMarketplaceAndStyle}
                            />
                        )}
                        {tab === 4 && <BlanksTab blanks={blanksRows} loading={blanksLoading} />}
                        {tab === 5 && <ForecastTab />}
                    </>
                )}

            </Container>
        </Box>
    );
}

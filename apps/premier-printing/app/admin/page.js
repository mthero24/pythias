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
import AssignmentReturnIcon       from "@mui/icons-material/AssignmentReturn";

const fmt = (n) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n ?? 0);
const fmtDate = (d) =>
    d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";
const fmtN = (n) => (n ?? 0).toLocaleString();

// ─── Shared components ────────────────────────────────────────────────────────

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

// Client-side sortable table — used for marketplace breakdowns, blanks
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

// Server-side paginated + sortable table
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

// ─── Overview (Charts) tab ────────────────────────────────────────────────────

const STAGE_PIE_COLORS = ["#9e9e9e", "#00bcd4", "#ff9800", "#2196f3", "#8b5cf6", "#f97316", "#4caf50"];

const EMPTY_PROD = {
    total: 0, active: 0, shipped: 0, rePulled: 0, labelPrinted: 0, dtfLoad: 0, dtfFind: 0, folded: 0, inBin: 0,
    avgDaysToLabel: null, avgDaysToPrint: null, avgDaysToShip: null,
    modeDtfLoad: null, modePrintLabels: null, modeDaysToShip: null,
};

const MP_COLORS = ["#2196f3","#4caf50","#ff9800","#e91e63","#9c27b0","#00bcd4","#f44336","#8bc34a","#ff5722","#607d8b","#795548","#ffc107"];

function OverviewTab({ revenueByDay, ordersByDayByMarketplace, byMarketplace, productionSummary, blanks, itemsLoading, blanksLoading }) {
    const ps = productionSummary ?? EMPTY_PROD;

    const stageData = useMemo(() => [
        { id: 0, value: ps.dtfFind,      label: "DTF Find"      },
        { id: 1, value: ps.dtfLoad,      label: "DTF Load"      },
        { id: 2, value: ps.labelPrinted, label: "Label Printed" },
        { id: 3, value: ps.rePulled,     label: "Re-Pulled"     },
        { id: 4, value: ps.folded,       label: "Folded"        },
        { id: 5, value: ps.inBin,        label: "In Bin"        },
        { id: 6, value: ps.shipped,      label: "Shipped"       },
    ].filter(d => d.value > 0).map((d, i) => ({ ...d, color: STAGE_PIE_COLORS[d.id] })), [ps]);

    const mpNames = useMemo(() => {
        const names = new Set();
        for (const row of ordersByDayByMarketplace) Object.keys(row).filter(k => k !== "date").forEach(k => names.add(k));
        return [...names].sort();
    }, [ordersByDayByMarketplace]);

    const topMp      = byMarketplace.slice(0, 10);
    const topBlanks  = blanks.slice(0, 10);
    const mpHeight   = Math.max(240, topMp.length * 36 + 60);
    const blkHeight  = Math.max(240, topBlanks.length * 36 + 60);

    const revFormatter = (v) => `$${(v ?? 0).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

    return (
        <Grid2 container spacing={2}>

            {/* Revenue over time — full width */}
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

            {/* Daily orders by marketplace — full width stacked */}
            <Grid2 size={{ xs: 12 }}>
                <ChartCard title="Daily Orders by Marketplace" minH={240}>
                    {ordersByDayByMarketplace.length > 0 && mpNames.length > 0 ? (
                        <BarChart
                            dataset={ordersByDayByMarketplace}
                            xAxis={[{ dataKey: "date", scaleType: "band", tickLabelStyle: { fontSize: 10 } }]}
                            series={mpNames.map((mp, i) => ({
                                dataKey: mp,
                                label: mp,
                                stack: "orders",
                                color: MP_COLORS[i % MP_COLORS.length],
                                valueFormatter: (v) => v ? `${v} orders` : "",
                            }))}
                            height={240}
                            margin={{ left: 48, right: 16, top: 16, bottom: 40 }}
                        />
                    ) : <NoData />}
                </ChartCard>
            </Grid2>

            {/* Item stage distribution */}
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

            {/* Revenue by marketplace */}
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

            {/* Top blanks by qty */}
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

            {/* Orders by marketplace — vertical */}
            <Grid2 size={{ xs: 12, md: 6 }}>
                <ChartCard title="Orders by Marketplace" minH={240}>
                    {topMp.length > 0 ? (
                        <BarChart
                            dataset={topMp}
                            xAxis={[{ dataKey: "marketplace", scaleType: "band", tickLabelStyle: { fontSize: 10 } }]}
                            series={[{ dataKey: "orders", label: "Orders", color: "#2196f3", valueFormatter: (v) => `${v ?? 0} orders` }]}
                            height={240}
                            margin={{ left: 48, right: 16, top: 16, bottom: 60 }}
                        />
                    ) : <NoData />}
                </ChartCard>
            </Grid2>

            {/* Blanks COGS by Style */}
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

// ─── Sales tab ────────────────────────────────────────────────────────────────

const STATUS_MAP = {
    shipped:  { label: "Shipped",  color: "success" },
    complete: { label: "Complete", color: "success" },
    canceled: { label: "Canceled", color: "error"   },
    refunded: { label: "Refunded", color: "error"   },
    pending:  { label: "Pending",  color: "warning" },
    open:     { label: "Open",     color: "default" },
};

function orderChip(o) {
    if (o.canceled) return <Chip size="small" label="Canceled" color="error" />;
    if (o.refunded) return <Chip size="small" label="Refunded" color="error" />;
    const key = (o.status || "").toLowerCase();
    const { label, color } = STATUS_MAP[key] ?? { label: o.status || "Open", color: "default" };
    return <Chip size="small" label={label} color={color} />;
}

function daysToShip(o) {
    if (!o.date || !o.shippingInfo?.shippedAt) return null;
    return (new Date(o.shippingInfo.shippedAt) - new Date(o.date)) / (1000 * 60 * 60 * 24);
}

function SalesTab({ summary, ordersData, revenueByDay, ordersByDayByMarketplace = [], onPageChange, onPageSizeChange, onSortChange, sortField, sortDir, salesItemsData, salesItemsSortField, salesItemsSortDir, onSalesItemsPageChange, onSalesItemsPageSizeChange, onSalesItemsSortChange }) {
    const { orders, total, page, pageSize, loading } = ordersData;
    const avgOrder = summary.orderCount > 0 ? summary.totalRevenue / summary.orderCount : 0;
    const [detailView, setDetailView] = useState("orders");

    const salesMpNames = useMemo(() => {
        const names = new Set();
        for (const row of ordersByDayByMarketplace) Object.keys(row).filter(k => k !== "date").forEach(k => names.add(k));
        return [...names].sort();
    }, [ordersByDayByMarketplace]);

    const columns = [
        { key: "date",        serverKey: "date",        label: "Date",        render: (o) => fmtDate(o.date) },
        { key: "poNumber",    serverKey: "poNumber",    label: "PO #",        render: (o) => o.poNumber || o.orderId || "—" },
        { key: "marketplace", serverKey: "marketplace", label: "Channel",     render: (o) => <Chip size="small" label={o.marketplace || "—"} variant="outlined" /> },
        { key: "total",       serverKey: "total",       label: "Revenue",      align: "center", render: (o) => fmt(o.total) },
        { key: "shipping",    label: "Shipping",         align: "center",       render: (o) => fmt(o.shippingCost) },
        { key: "blanksCogs",  label: "Blank COGS",       align: "center",       render: (o) => fmt(o.blanksCogs) },
        { key: "licenceFee",  label: "Licence Fees",     align: "center",       render: (o) => fmt(o.licenceFee) },
        { key: "daysToShip",  label: "Days to Ship",     align: "center",       render: (o) => { const d = daysToShip(o); return d != null ? d.toFixed(1) : "—"; } },
        { key: "status",      label: "Status",           render: orderChip },
    ];

    const revFormatter = (v) => `$${(v ?? 0).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

    return (
        <>
            <Grid2 container spacing={2} sx={{ mb: 3 }}>
                <Grid2 size={{ xs: 6, md: 3 }}><KpiCard label="Gross Revenue"       value={fmt(summary.totalRevenue)}  color="success.main" /></Grid2>
                <Grid2 size={{ xs: 6, md: 3 }}><KpiCard label="Orders"              value={fmtN(summary.orderCount)} /></Grid2>
                <Grid2 size={{ xs: 6, md: 3 }}><KpiCard label="Avg Order Value"     value={fmt(avgOrder)} /></Grid2>
                <Grid2 size={{ xs: 6, md: 3 }}><KpiCard label="Canceled / Refunded" value={fmtN(summary.canceledCount)} color="error.main" /></Grid2>
            </Grid2>

            <Grid2 container spacing={2} sx={{ mb: 3 }}>
                <Grid2 size={{ xs: 12 }}>
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
                <Grid2 size={{ xs: 12 }}>
                    <ChartCard title="Daily Orders by Marketplace" minH={200}>
                        {ordersByDayByMarketplace.length > 0 && salesMpNames.length > 0 ? (
                            <BarChart
                                dataset={ordersByDayByMarketplace}
                                xAxis={[{ dataKey: "date", scaleType: "band", tickLabelStyle: { fontSize: 10 } }]}
                                series={salesMpNames.map((mp, i) => ({
                                    dataKey: mp,
                                    label: mp,
                                    stack: "orders",
                                    color: MP_COLORS[i % MP_COLORS.length],
                                    valueFormatter: (v) => v ? `${v} orders` : "",
                                }))}
                                height={200}
                                margin={{ left: 48, right: 16, top: 10, bottom: 40 }}
                            />
                        ) : <NoData />}
                    </ChartCard>
                </Grid2>
            </Grid2>

            <Paper variant="outlined">
                <Box sx={{ px: 2, borderBottom: "1px solid", borderColor: "divider", display: "flex", alignItems: "flex-end" }}>
                    <Tabs value={detailView} onChange={(_, v) => v && setDetailView(v)} sx={{ minHeight: 40 }} TabIndicatorProps={{ sx: { height: 2 } }}>
                        <Tab label="Orders" value="orders" sx={{ minHeight: 40, py: 0.5, textTransform: "none", fontSize: "0.8125rem", fontWeight: 600 }} />
                        <Tab label="Items"  value="items"  sx={{ minHeight: 40, py: 0.5, textTransform: "none", fontSize: "0.8125rem", fontWeight: 600 }} />
                    </Tabs>
                </Box>
                {detailView === "orders" ? (
                    <PaginatedTable
                        columns={columns} rows={orders} total={total} page={page} pageSize={pageSize}
                        loading={loading} sortField={sortField} sortDir={sortDir}
                        onPageChange={onPageChange} onPageSizeChange={onPageSizeChange} onSortChange={onSortChange}
                    />
                ) : (
                    <PaginatedTable
                        columns={[
                            { key: "date",        serverKey: "date",        label: "Date",       render: (i) => fmtDate(i.date) },
                            { key: "marketplace", serverKey: "marketplace", label: "Channel" },
                            { key: "styleCode",   serverKey: "styleCode",   label: "Style" },
                            { key: "colorName",   serverKey: "colorName",   label: "Color" },
                            { key: "sizeName",    serverKey: "sizeName",    label: "Size" },
                            { key: "price",       serverKey: "price",       label: "Price", align: "center", render: (i) => fmt(i.price) },
                        ]}
                        rows={salesItemsData?.items ?? []}
                        total={salesItemsData?.total ?? 0}
                        page={salesItemsData?.page ?? 1}
                        pageSize={salesItemsData?.pageSize ?? 50}
                        loading={salesItemsData?.loading ?? false}
                        sortField={salesItemsSortField}
                        sortDir={salesItemsSortDir}
                        onPageChange={onSalesItemsPageChange}
                        onPageSizeChange={onSalesItemsPageSizeChange}
                        onSortChange={onSalesItemsSortChange}
                    />
                )}
            </Paper>
        </>
    );
}

// ─── Production tab ───────────────────────────────────────────────────────────

const STEP_PRIORITY = { "Printed": 1, "Label Printed": 1, "label Printed": 1, "DTF Load": 2, "Embroidery Load": 2, "DTF Find": 3, "Folded": 4, "Shipped": 6, "PreShipped": 6 };
function stepPriority(status) {
    if (!status) return 0;
    if (status.startsWith("In Bin")) return 5;
    return STEP_PRIORITY[status] ?? 0;
}
function itemStage(i) {
    if (!i.steps?.length) return "Pending";
    let steps = i.steps;
    const rePulls = steps.filter(s => s.status === "Re-Pulled");
    if (rePulls.length > 0) {
        const lastRePull = rePulls.reduce((a, b) => new Date(b.date) > new Date(a.date) ? b : a);
        const afterRePull = steps.filter(s => s.status !== "Re-Pulled" && new Date(s.date) > new Date(lastRePull.date));
        if (!afterRePull.length) return "Re-Pulled";
        steps = afterRePull;
    }
    const best = steps.reduce((b, s) => stepPriority(s.status) > stepPriority(b?.status) ? s : b, steps[0]);
    const s = best?.status || "Pending";
    return s.startsWith("In Bin") ? "In Bin" : s;
}

function stageColor(status) {
    if (!status || status === "Pending")                             return "default";
    if (status === "Canceled")                                       return "error";
    if (status === "Shipped" || status === "PreShipped")             return "success";
    if (status === "Folded"  || status.startsWith("In Bin"))         return "primary";
    if (status === "Re-Pulled")                                      return "warning";
    if (status === "Treated" || status === "Treatment Machine")      return "secondary";
    if (status === "Printed" || status === "DTF Load"
        || status === "Embroidery Load")                             return "info";
    if (status === "DTF Find")                                       return "warning";
    return "default";
}

function fmtDays(val)     { return val != null ? val.toFixed(1) + "d" : "—"; }
function fmtModeDays(val) { return val != null ? `${val}d`             : "—"; }

function ProductionTab({ productionSummary, itemsData, itemsByDay, onPageChange, onPageSizeChange, onSortChange, sortField, sortDir, urgentItems = [], urgentLoading, shipTally = [], shipTallyLoading }) {
    const ps = productionSummary ?? EMPTY_PROD;
    const { items, total, page, pageSize, loading } = itemsData;

    const rePullReasonsData = useMemo(() =>
        (ps.rePullReasons ?? []).map((r, id) => ({ id, value: r.count, label: r.reason ?? "Unknown" })),
    [ps]);

    const stageData = useMemo(() => [
        { id: 0, value: ps.dtfFind,      label: "DTF Find"      },
        { id: 1, value: ps.dtfLoad,      label: "DTF Load"      },
        { id: 2, value: ps.labelPrinted, label: "Label Printed" },
        { id: 3, value: ps.rePulled,     label: "Re-Pulled"     },
        { id: 4, value: ps.folded,       label: "Folded"        },
        { id: 5, value: ps.shipped,      label: "Shipped"       },
    ].filter(d => d.value > 0).map(d => ({ ...d, color: STAGE_PIE_COLORS[d.id] })), [ps]);

    const columns = [
        { key: "date",        serverKey: "date",      label: "Date",        render: (i) => fmtDate(i.date) },
        { key: "shipByDate",  serverKey: "shipByDate",label: "Ship By",     render: (i) => i.shipByDate ? fmtDate(i.shipByDate) : "—" },
        { key: "styleCode",   serverKey: "styleCode", label: "Style" },
        { key: "colorName",   serverKey: "colorName", label: "Color" },
        { key: "sizeName",    serverKey: "sizeName",  label: "Size"  },
        { key: "pieceId",     serverKey: "pieceId",   label: "Piece ID" },
        { key: "stage",       label: "Stage", render: (i) => {
            const s = itemStage(i);
            return <Chip size="small" label={s} color={stageColor(s)} />;
        }},
    ];

    return (
        <>
            {(urgentLoading || urgentItems.length > 0) && (
                <Paper variant="outlined" sx={{ mb: 3, borderColor: "warning.main", borderWidth: 2, overflow: "hidden" }}>
                    <Box sx={{ px: 2, py: 1, bgcolor: "warning.main" }}>
                        <Typography variant="subtitle2" sx={{ color: "warning.contrastText", fontWeight: 700 }}>
                            Due to Ship Within 24 Hours ({urgentLoading ? "…" : urgentItems.length})
                        </Typography>
                    </Box>
                    {urgentLoading ? (
                        <Box sx={{ p: 2 }}><LinearProgress /></Box>
                    ) : (
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>PO #</TableCell>
                                    <TableCell>Marketplace</TableCell>
                                    <TableCell>Piece ID</TableCell>
                                    <TableCell>Style</TableCell>
                                    <TableCell>Color / Size</TableCell>
                                    <TableCell>Ship By</TableCell>
                                    <TableCell>Last Step</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {urgentItems.map(i => {
                                    const stage = itemStage(i);
                                    return (
                                        <TableRow key={i.pieceId}>
                                            <TableCell>{i.order?.poNumber ?? "—"}</TableCell>
                                            <TableCell sx={{ textTransform: "capitalize" }}>{i.order?.marketplace ?? "—"}</TableCell>
                                            <TableCell>{i.pieceId}</TableCell>
                                            <TableCell>{i.styleCode ?? "—"}</TableCell>
                                            <TableCell>{[i.colorName, i.sizeName].filter(Boolean).join(" / ") || "—"}</TableCell>
                                            <TableCell sx={{ color: "warning.dark", fontWeight: 600 }}>{fmtDate(i.shipByDate)}</TableCell>
                                            <TableCell><Chip size="small" label={stage} color={stageColor(stage)} /></TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    )}
                </Paper>
            )}
            <Grid2 container spacing={2} sx={{ mb: 3 }}>
                <Grid2 size={{ xs: 4, sm: 2 }}><KpiCard label="Total Items"      value={fmtN(ps.total)} /></Grid2>
                <Grid2 size={{ xs: 4, sm: 2 }}><KpiCard label="Label Printed"    value={fmtN(ps.labelPrinted)}  color="info.main" /></Grid2>
                <Grid2 size={{ xs: 4, sm: 2 }}><KpiCard label="DTF Load"         value={fmtN(ps.dtfLoad)}       color="info.main" /></Grid2>
                <Grid2 size={{ xs: 4, sm: 2 }}><KpiCard label="DTF Find"         value={fmtN(ps.dtfFind)}       color="warning.main" /></Grid2>
                <Grid2 size={{ xs: 4, sm: 2 }}><KpiCard label="Folded"           value={fmtN(ps.folded)}        color="secondary.main" /></Grid2>
                <Grid2 size={{ xs: 4, sm: 2 }}><KpiCard label="In Bin"           value={fmtN(ps.inBin)}         color="primary.main" /></Grid2>
                <Grid2 size={{ xs: 4, sm: 2 }}><KpiCard label="Shipped"          value={fmtN(ps.shipped)}       color="success.main" /></Grid2>
                <Grid2 size={{ xs: 4, sm: 2 }}><KpiCard label="Re-Pulled"        value={fmtN(ps.rePulled)}      color="warning.main" /></Grid2>
                <Grid2 size={{ xs: 4, sm: 2 }}><KpiCard label="Avg DTF Sent"     value={fmtDays(ps.avgDaysToLabel)} /></Grid2>
                <Grid2 size={{ xs: 4, sm: 2 }}><KpiCard label="Avg Print Labels" value={fmtDays(ps.avgDaysToPrint)} /></Grid2>
                <Grid2 size={{ xs: 4, sm: 2 }}><KpiCard label="Avg Days to Ship" value={fmtDays(ps.avgDaysToShip)} /></Grid2>
                <Grid2 size={{ xs: 4, sm: 2 }}><KpiCard label="Mode Days to Ship" value={fmtModeDays(ps.modeDaysToShip)} /></Grid2>
            </Grid2>

            <Grid2 container spacing={2} sx={{ mb: 3 }}>
                <Grid2 size={{ xs: 12, md: 6 }}>
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
                <Grid2 size={{ xs: 12, md: 6 }}>
                    <ChartCard title="Re-Pull Reasons" minH={200}>
                        {rePullReasonsData.length > 0 ? (
                            <PieChart
                                series={[{ data: rePullReasonsData, innerRadius: 40, outerRadius: 75, paddingAngle: 2, cornerRadius: 3 }]}
                                height={200}
                                slotProps={{ legend: { direction: "row", position: { vertical: "bottom", horizontal: "middle" } } }}
                            />
                        ) : <NoData />}
                    </ChartCard>
                </Grid2>
                <Grid2 size={{ xs: 12 }}>
                    <ChartCard title="Items Due to Ship — Next 10 Days" loading={shipTallyLoading} minH={230}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                            Plan staffing to hit on-time ship dates.
                        </Typography>
                        {shipTally.length > 0 ? (
                            <BarChart
                                dataset={shipTally}
                                xAxis={[{ dataKey: "label", scaleType: "band", tickLabelStyle: { fontSize: 10 } }]}
                                series={[{ dataKey: "count", label: "Items to ship", color: "#ff7043" }]}
                                height={200}
                                margin={{ left: 48, right: 16, top: 10, bottom: 40 }}
                            />
                        ) : <NoData />}
                    </ChartCard>
                </Grid2>
                <Grid2 size={{ xs: 12 }}>
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

// ─── Costs tab ────────────────────────────────────────────────────────────────

const MARKETPLACE_FEE_RATES = {
    amazon:                       0.15,
    ebay:                         0.13,
    etsy:                         0.065,
    walmart:                      0.15,
    target:                       0.10,
    "target plus us marketplace": 0.10,
    faire:                        0.25,
    tiktok:                       0.08,
    "tik tok":                    0.08,
    shopify:                      0.02,
    kohls:                        0.15,
    "kohl's":                     0.15,
    acenda:                       0.15,
    zulily:                       0.20,
    tsc:                          0.15,
};

function estimateFee(order) {
    const rate = MARKETPLACE_FEE_RATES[(order.marketplace || "").toLowerCase()] ?? 0;
    return (order.total || 0) * rate;
}

function fmtRate(marketplace) {
    const rate = MARKETPLACE_FEE_RATES[(marketplace || "").toLowerCase()];
    return rate != null ? `~${(rate * 100).toFixed(1)}%` : "—";
}

function CostsTab({ summary, byMarketplace, cogsByMarketplace, licenceFeeByMarketplace, ordersData, onPageChange, onPageSizeChange, onSortChange, sortField, sortDir, costItemsData, costItemsSortField, costItemsSortDir, onCostItemsPageChange, onCostItemsPageSizeChange, onCostItemsSortChange, detailView, onDetailViewChange, itemCountByMarketplace = {}, itemsByMarketplaceAndStyle = {}, inventoryValue, totalServiceCost = 0, totalKlingCost = 0 }) {
    const { orders, total, page, pageSize, loading } = ordersData;

    const [feeRates, setFeeRates] = useState(MARKETPLACE_FEE_RATES);
    useEffect(() => {
        fetch("/api/admin/settings/fee-rates")
            .then(r => r.ok ? r.json() : null)
            .then(d => { if (d?.value) setFeeRates(d.value); })
            .catch(() => {});
    }, []);
    const [feeModalOpen, setFeeModalOpen] = useState(false);
    const [feeRatesDraft, setFeeRatesDraft] = useState({});
    const estimateFeeLocal = (order) => (order.total || 0) * (feeRates[(order.marketplace || "").toLowerCase()] ?? 0);
    const fmtRateLocal = (mp) => { const r = feeRates[(mp || "").toLowerCase()]; return r != null ? `~${(r * 100).toFixed(1)}%` : "—"; };

    const totalFees = useMemo(() =>
        byMarketplace.reduce((s, mp) => s + mp.revenue * (feeRates[(mp.marketplace || "").toLowerCase()] ?? 0), 0),
    [byMarketplace, feeRates]);
    const totalCogs = useMemo(() => Object.values(cogsByMarketplace).reduce((s, v) => s + v, 0), [cogsByMarketplace]);
    const totalLicenceFees = useMemo(() => Object.values(licenceFeeByMarketplace ?? {}).reduce((s, v) => s + v, 0), [licenceFeeByMarketplace]);
    const net = summary.totalRevenue - summary.totalShipping - totalFees - totalCogs - totalLicenceFees - totalServiceCost - totalKlingCost;

    const mpRows = useMemo(() =>
        byMarketplace.map((mp) => {
            const rate = feeRates[(mp.marketplace || "").toLowerCase()] ?? 0;
            const fees = mp.revenue * rate;
            const cogs = cogsByMarketplace[mp.marketplace] || 0;
            const licenceFee = (licenceFeeByMarketplace ?? {})[mp.marketplace] || 0;
            const items = (itemCountByMarketplace ?? {})[mp.marketplace] || 0;
            return { ...mp, fees, cogs, licenceFee, items, net: mp.revenue - mp.shipping - fees - cogs - licenceFee };
        }),
    [byMarketplace, cogsByMarketplace, licenceFeeByMarketplace, feeRates, itemCountByMarketplace]);

    const revFormatter = (v) => `$${(v ?? 0).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
    const netHeight = Math.max(240, mpRows.length * 36 + 60);

    const mpColumns = [
        { key: "marketplace", label: "Marketplace" },
        { key: "orders",   label: "Orders",       align: "center" },
        { key: "items",    label: "Items Sold",      align: "center", render: (r) => fmtN(r.items) },
        { key: "avgItems", label: "Avg Items/Order", align: "center", getValue: (r) => r.orders > 0 ? r.items / r.orders : 0, render: (r) => r.orders > 0 ? (r.items / r.orders).toFixed(1) : "—" },
        { key: "revenue",  label: "Revenue",         align: "center", render: (r) => fmt(r.revenue) },
        { key: "shipping", label: "Shipping",     align: "center", render: (r) => fmt(r.shipping) },
        { key: "rate",     label: "Fee Rate",     align: "center", getValue: (r) => feeRates[(r.marketplace || "").toLowerCase()] ?? -1, render: (r) => fmtRateLocal(r.marketplace) },
        { key: "fees",       label: "Est. MP Fees",  align: "center", render: (r) => fmt(r.fees) },
        { key: "cogs",       label: "Blank COGS",    align: "center", render: (r) => fmt(r.cogs) },
        { key: "licenceFee", label: "Licence Fees",  align: "center", render: (r) => fmt(r.licenceFee) },
        { key: "net",        label: "Net",            align: "center", render: (r) => (
            <Typography variant="body2" sx={{ fontWeight: 600, color: r.net >= 0 ? "success.main" : "error.main" }}>{fmt(r.net)}</Typography>
        )},
    ];

    const itemColumns = [
        { key: "date",         serverKey: "date",      label: "Date",        render: (i) => fmtDate(i.date) },
        { key: "marketplace",  serverKey: "marketplace", label: "Channel" },
        { key: "styleCode",    serverKey: "styleCode",   label: "Blank Code" },
        { key: "sizeName",     serverKey: "sizeName",  label: "Size" },
        { key: "colorName",    serverKey: "colorName", label: "Color" },
        { key: "price",        serverKey: "price",     label: "Price Sold",  align: "center", render: (i) => fmt(i.price) },
        { key: "wholesaleCost", label: "Blank COGS",   align: "center",       render: (i) => fmt(i.wholesaleCost) },
        { key: "licenceFee",   label: "Licence Fees",  align: "center",       render: (i) => fmt(i.licenceFee) },
        { key: "mpFee",        label: "Est. MP Fees",  align: "center",       render: (i) => fmt((i.price || 0) * (feeRates[(i.marketplace || "").toLowerCase()] ?? 0)) },
        { key: "net",          label: "Net",           align: "center",       render: (i) => {
            const mpFee = (i.price || 0) * (feeRates[(i.marketplace || "").toLowerCase()] ?? 0);
            const n = (i.price || 0) - (i.wholesaleCost || 0) - (i.licenceFee || 0) - mpFee;
            return <Typography variant="body2" sx={{ color: n >= 0 ? "success.main" : "error.main" }}>{fmt(n)}</Typography>;
        }},
    ];

    const orderColumns = [
        { key: "date",        serverKey: "date",        label: "Date",        render: (o) => fmtDate(o.date) },
        { key: "poNumber",    serverKey: "poNumber",    label: "PO #",        render: (o) => o.poNumber || o.orderId || "—" },
        { key: "marketplace", serverKey: "marketplace", label: "Channel",     render: (o) => o.marketplace || "—" },
        { key: "total",       serverKey: "total",       label: "Revenue",     align: "center", render: (o) => fmt(o.total) },
        { key: "shipping",    label: "Shipping",        align: "center",       render: (o) => fmt(o.shippingCost) },
        { key: "fees",        label: "Est. MP Fees",    align: "center",       render: (o) => fmt(estimateFeeLocal(o)) },
        { key: "blanksCogs",  label: "Blank COGS",      align: "center",       render: (o) => fmt(o.blanksCogs) },
        { key: "licenceFee",  label: "Licence Fees",    align: "center",       render: (o) => fmt(o.licenceFee) },
        { key: "net",         label: "Net",             align: "center",       render: (o) => {
            const n = (o.total || 0) - (o.shippingCost || 0) - estimateFeeLocal(o) - (o.blanksCogs || 0) - (o.licenceFee || 0);
            return <Typography variant="body2" sx={{ color: n >= 0 ? "success.main" : "error.main" }}>{fmt(n)}</Typography>;
        }},
    ];

    return (
        <>
            <Grid2 container spacing={2} sx={{ mb: 3 }}>
                <Grid2 size={{ xs: 6, sm: 4, md: 2 }}><KpiCard label="Gross Revenue"     value={fmt(summary.totalRevenue)}   color="success.main" /></Grid2>
                <Grid2 size={{ xs: 6, sm: 4, md: 2 }}><KpiCard label="Shipping Costs"    value={fmt(summary.totalShipping)}  color="warning.main" /></Grid2>
                <Grid2 size={{ xs: 6, sm: 4, md: 2 }}><KpiCard label="Est. MP Fees"      value={fmt(totalFees)}              color="error.main" /></Grid2>
                <Grid2 size={{ xs: 6, sm: 4, md: 2 }}><KpiCard label="Blank COGS"        value={fmt(totalCogs)}              color="warning.main" /></Grid2>
                <Grid2 size={{ xs: 6, sm: 4, md: 2 }}><KpiCard label="Licence Fees"      value={fmt(totalLicenceFees)}       color="secondary.main" /></Grid2>
                <Grid2 size={{ xs: 6, sm: 4, md: 2 }}><KpiCard label="Service Costs"     value={fmt(totalServiceCost)}       color="error.main" /></Grid2>
                <Grid2 size={{ xs: 6, sm: 4, md: 2 }}><KpiCard label="Kling AI Costs"    value={fmt(totalKlingCost)}         color="error.main" /></Grid2>
                <Grid2 size={{ xs: 6, sm: 4, md: 2 }}><KpiCard label="Net Revenue"       value={fmt(net)}                    color={net >= 0 ? "success.main" : "error.main"} /></Grid2>
                <Grid2 size={{ xs: 6, sm: 4, md: 2 }}><KpiCard label="Inventory at Cost" value={fmt(inventoryValue)}         color="info.main" /></Grid2>
            </Grid2>

            {/* Cost breakdown chart */}
            <Grid2 container spacing={2} sx={{ mb: 3 }}>
                <Grid2 size={{ xs: 12, md: 5 }}>
                    <ChartCard title="Cost Breakdown" minH={220}>
                        {summary.totalRevenue > 0 ? (
                            <PieChart
                                series={[{ data: [
                                    { id: 0, value: summary.totalShipping,   label: "Shipping",      color: "#ff9800" },
                                    { id: 1, value: totalFees,               label: "MP Fees",       color: "#f44336" },
                                    { id: 2, value: totalCogs,               label: "Blank COGS",    color: "#9c27b0" },
                                    { id: 3, value: totalLicenceFees,        label: "Licence Fees",  color: "#e91e63" },
                                    { id: 4, value: totalServiceCost,        label: "Service Costs", color: "#ef5350" },
                                    { id: 5, value: totalKlingCost,          label: "Kling AI",      color: "#b71c1c" },
                                    { id: 4, value: Math.max(0, net),        label: "Net",          color: "#4caf50" },
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

            {(() => {
                const STYLE_COLORS = ["#2196f3","#4caf50","#ff9800","#e91e63","#9c27b0","#00bcd4","#f44336","#8bc34a","#ff5722"];
                const styleTotals = {};
                for (const [, styles] of Object.entries(itemsByMarketplaceAndStyle)) {
                    for (const [style, count] of Object.entries(styles)) {
                        styleTotals[style] = (styleTotals[style] || 0) + count;
                    }
                }
                const topStyles = Object.entries(styleTotals).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([s]) => s);
                const dataset = Object.entries(itemsByMarketplaceAndStyle)
                    .map(([mp, styles]) => {
                        const row = { marketplace: mp };
                        let other = 0;
                        for (const [style, count] of Object.entries(styles)) {
                            if (topStyles.includes(style)) row[style] = count;
                            else other += count;
                        }
                        if (other > 0) row.Other = other;
                        return row;
                    })
                    .sort((a, b) => {
                        const sum = (r) => topStyles.reduce((s, k) => s + (r[k] || 0), 0) + (r.Other || 0);
                        return sum(b) - sum(a);
                    });
                const hasOther = dataset.some(r => r.Other > 0);
                const seriesKeys = [...topStyles, ...(hasOther ? ["Other"] : [])];
                const mpChartH = Math.max(200, dataset.length * 36 + 60);
                return (
                    <Paper variant="outlined" sx={{ mb: 3 }}>
                        <Box sx={{ px: 2, py: 1.5, borderBottom: "1px solid", borderColor: "divider" }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Items by Channel</Typography>
                        </Box>
                        {dataset.length > 0 ? (
                            <Box sx={{ px: 1 }}>
                                <BarChart
                                    layout="horizontal"
                                    dataset={dataset}
                                    yAxis={[{ dataKey: "marketplace", scaleType: "band", tickLabelStyle: { fontSize: 11 } }]}
                                    series={seriesKeys.map((k, i) => ({
                                        dataKey: k,
                                        label: k,
                                        stack: "total",
                                        color: STYLE_COLORS[i % STYLE_COLORS.length],
                                        valueFormatter: (v) => v ? fmtN(v) : "",
                                    }))}
                                    height={mpChartH}
                                    margin={{ left: 130, right: 16, top: 8, bottom: 30 }}
                                    xAxis={[{ valueFormatter: (v) => fmtN(v) }]}
                                />
                            </Box>
                        ) : <NoData />}
                    </Paper>
                );
            })()}

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
                        fetch("/api/admin/settings/fee-rates", {
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

// ─── Blanks tab ───────────────────────────────────────────────────────────────

function BlanksTab({ blanks, loading }) {
    const totalQty  = useMemo(() => blanks.reduce((s, r) => s + r.qty, 0), [blanks]);
    const totalCogs = useMemo(() => blanks.reduce((s, r) => s + r.totalCogs, 0), [blanks]);
    const topRow    = blanks[0];

    const top10 = blanks.slice(0, 10);
    const top10Height = Math.max(240, top10.length * 36 + 60);
    const revFormatter = (v) => `$${(v ?? 0).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

    const columns = [
        { key: "styleCode", label: "Style" },
        { key: "colorName", label: "Color" },
        { key: "sizeName",  label: "Size"  },
        { key: "qty",       label: "Qty Sold",   align: "center" },
        { key: "unitCost",  label: "Unit Cost",  align: "center", render: (r) => fmt(r.unitCost) },
        { key: "totalCogs", label: "Total COGS", align: "center", render: (r) => fmt(r.totalCogs) },
    ];

    return (
        <>
            <Grid2 container spacing={2} sx={{ mb: 3 }}>
                <Grid2 size={{ xs: 6, md: 3 }}><KpiCard label="Unique SKUs"     value={fmtN(blanks.length)} /></Grid2>
                <Grid2 size={{ xs: 6, md: 3 }}><KpiCard label="Total Qty Sold"  value={fmtN(totalQty)} /></Grid2>
                <Grid2 size={{ xs: 6, md: 3 }}><KpiCard label="Total COGS"      value={fmt(totalCogs)} color="warning.main" /></Grid2>
                <Grid2 size={{ xs: 6, md: 3 }}><KpiCard
                    label="Top Seller (Mode)"
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

// ─── Forecast tab ────────────────────────────────────────────────────────────

const MODEL_META = {
    linearRegression:     { label: "Linear Regression",     color: "#e65100" },
    exponentialSmoothing: { label: "Exp. Smoothing (Holt)", color: "#7b1fa2" },
    movingAverage:        { label: "Moving Average",        color: "#2e7d32" },
    chronos:              { label: "Chronos (AI)",          color: "#0277bd" },
    prophet:              { label: "Prophet (Seasonal)",    color: "#c62828" },
};

const HORIZON_OPTIONS = [
    { value: 14,   label: "14d"  },
    { value: 30,   label: "30d"  },
    { value: 60,   label: "60d"  },
    { value: 90,   label: "90d"  },
    { value: 365,  label: "1yr"  },
    { value: 730,  label: "2yr"  },
    { value: 1825, label: "5yr"  },
];

const YEAR_LABELS = { 365: "Yr 1 Revenue", 730: "Yr 2 Revenue", 1825: "Yr 5 Revenue" };
const bestModelKey = (best) => best === "linearRegression" ? "linear" : best === "exponentialSmoothing" ? "ema" : best === "chronos" ? "chronos" : best === "prophet" ? "prophet" : "ma";

function ForecastTab({ forecastData, loading, horizon, onHorizonChange, onRefresh }) {
    if (loading && !forecastData) {
        return <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>;
    }
    if (!forecastData) return null;
    if (forecastData.notReady) {
        return (
            <Box sx={{ textAlign: "center", py: 8 }}>
                <Typography color="text.secondary" sx={{ mb: 2 }}>
                    Forecast not yet computed. Click below to generate it now (takes about a minute), or wait for the scheduled cron to run automatically.
                </Typography>
                {loading
                    ? <CircularProgress size={28} />
                    : <Button variant="contained" onClick={onRefresh}>Compute Now</Button>
                }
            </Box>
        );
    }

    const { combined = [], combinedOrders = [], combinedMonthly = [], annualProjections = [], projections = {}, models = {}, best, trendPct, minDataWarning, computedAt } = forecastData;
    const revFormatter = (v) => v == null ? "" : `$${(v).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
    const trendColor   = trendPct >= 0 ? "success.main" : "error.main";
    const trendSign    = trendPct >= 0 ? "+" : "";

    const modelKeys    = Object.keys(MODEL_META).filter(k => models[k]);
    const useMonthly   = horizon > 90;
    const chartData    = useMonthly ? combinedMonthly : combined;
    const bKey         = bestModelKey(best);
    const bNetKey      = bKey + "Net";

    const [tablePage, setTablePage] = useState(0);
    useEffect(() => { setTablePage(0); }, [horizon]);

    const fcRows       = combined.filter(d => d.actual == null);
    const fcOrders     = combinedOrders.filter(d => d.actual == null);
    const rowsPerPage  = 14;
    const allTableRows = useMonthly ? combinedMonthly.filter(d => d.actual == null) : fcRows;
    const tableRows    = allTableRows.slice(tablePage * rowsPerPage, (tablePage + 1) * rowsPerPage);

    const sumKey = (arr, key, n) => Math.round(arr.slice(0, n).reduce((a, d) => a + (d[key] || 0), 0));
    const projData     = projections[bKey] ?? projections.linear ?? {};
    const projOrders  = { week: projData.week?.orders ?? 0,   month: projData.month?.orders ?? 0,   quarter: projData.quarter?.orders ?? 0,   year: projData.year?.orders ?? 0   };
    const projRevenue = { week: projData.week?.revenue ?? 0,  month: projData.month?.revenue ?? 0,  quarter: projData.quarter?.revenue ?? 0,  year: projData.year?.revenue ?? 0  };
    const ordDisplayMap = useMonthly
        ? combinedOrders.reduce((m, o) => { const k = o.date.slice(0, 7); m[k] = (m[k] || 0) + Math.round(o[bKey] || 0); return m; }, {})
        : Object.fromEntries(combinedOrders.map(o => [o.date, Math.round(o[bKey] || 0)]));

    return (
        <>
            {loading && <LinearProgress sx={{ mb: 1, borderRadius: 1 }} />}
            {minDataWarning && (
                <Alert severity="warning" sx={{ mb: 2 }}>Need at least 14 days of order history to generate forecasts.</Alert>
            )}

            {/* Horizon selector */}
            <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mr: 1 }}>Horizon:</Typography>
                {HORIZON_OPTIONS.map(o => (
                    <Button key={o.value} size="small"
                        variant={horizon === o.value ? "contained" : "outlined"}
                        onClick={() => onHorizonChange(o.value)}
                    >{o.label}</Button>
                ))}
                {computedAt && (
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                        Updated {fmtDate(computedAt)}
                    </Typography>
                )}
                {onRefresh && (
                    <Button size="small" variant="outlined" onClick={onRefresh} disabled={loading} sx={{ ml: "auto" }}>
                        {loading ? "Computing…" : "Refresh"}
                    </Button>
                )}
            </Stack>

            {/* Annual projections — always visible */}
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                Annual Projections — {MODEL_META[best]?.label ?? "Best Model"} (lowest RMSE)
            </Typography>
            <Grid2 container spacing={2} sx={{ mb: 3 }}>
                {annualProjections.map(yr => {
                    const pickBest = (obj) => { const v = obj?.[bKey] ?? 0; if (v > 0) return v; return Math.max(obj?.ema ?? 0, obj?.ma ?? 0, obj?.linear ?? 0); };
                    const gross = pickBest(yr.gross);
                    const net   = Math.min(gross, pickBest(yr.net));
                    return (
                        <Grid2 key={yr.days} size={{ xs: 12, sm: 4 }}>
                            <KpiCard
                                label={YEAR_LABELS[yr.days] ?? `${yr.days}d`}
                                value={`$${gross.toLocaleString()}`}
                                sub={`Net: $${net.toLocaleString()}`}
                                color={best ? MODEL_META[best].color : "text.primary"}
                            />
                        </Grid2>
                    );
                })}
            </Grid2>

            {/* Projected Orders */}
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                Projected Orders — {MODEL_META[best]?.label ?? "Best Model"}
            </Typography>
            <Grid2 container spacing={2} sx={{ mb: 3 }}>
                {[
                    { label: "Next Week",    orders: projOrders.week,    revenue: projRevenue.week    },
                    { label: "Next Month",   orders: projOrders.month,   revenue: projRevenue.month   },
                    { label: "Next Quarter", orders: projOrders.quarter, revenue: projRevenue.quarter },
                    { label: "Next Year",    orders: projOrders.year,    revenue: projRevenue.year    },
                ].map(({ label, orders, revenue }) => (
                    <Grid2 key={label} size={{ xs: 6, sm: 3 }}>
                        <KpiCard
                            label={label}
                            value={`${fmtN(orders)} orders`}
                            sub={fmt(revenue)}
                            color={best ? MODEL_META[best].color : "text.primary"}
                        />
                    </Grid2>
                ))}
            </Grid2>

            {/* Trend + per-model horizon KPIs */}
            <Grid2 container spacing={2} sx={{ mb: 3 }}>
                <Grid2 size={{ xs: 6, md: 2 }}>
                    <KpiCard label="30d Trend" value={`${trendSign}${(trendPct * 100).toFixed(1)}%`}
                        color={trendColor} sub="last 30d vs prior 30d" />
                </Grid2>
                {modelKeys.map(k => {
                    const m = models[k];
                    if (!m) return null;
                    return (
                        <Grid2 key={k} size={{ xs: 6, md: 2 }}>
                            <KpiCard
                                label={`${MODEL_META[k].label}${best === k ? " ★" : ""}`}
                                value={`$${(m.forecastTotal || 0).toLocaleString()}`}
                                sub={`${horizon}d · RMSE $${(m.rmseRev || 0).toLocaleString()}`}
                                color={best === k ? "success.main" : "text.primary"}
                            />
                        </Grid2>
                    );
                })}
            </Grid2>

            {/* Revenue forecast chart */}
            <Grid2 container spacing={2} sx={{ mb: 3 }}>
                <Grid2 size={{ xs: 12 }}>
                    <ChartCard title={`Gross Revenue Forecast — ${useMonthly ? "monthly view" : `next ${horizon} days`}`} minH={300}>
                        {chartData.length > 0 ? (
                            <LineChart
                                dataset={chartData}
                                xAxis={[{ dataKey: "date", scaleType: "band", tickLabelStyle: { fontSize: 9 }, tickMinStep: 1 }]}
                                series={[
                                    { dataKey: "actual",    label: "Actual Gross",   color: "#1565c0",                             connectNulls: false, showMark: false },
                                    { dataKey: "linear",    label: "Linear Regr.",   color: MODEL_META.linearRegression.color,     connectNulls: false, showMark: false },
                                    { dataKey: "ema",       label: "Exp. Smoothing", color: MODEL_META.exponentialSmoothing.color, connectNulls: false, showMark: false },
                                    { dataKey: "ma",        label: "Moving Avg",     color: MODEL_META.movingAverage.color,        connectNulls: false, showMark: false },
                                    ...(models.chronos ? [{ dataKey: "chronos", label: "Chronos (AI)",       color: MODEL_META.chronos.color,  connectNulls: false, showMark: false }] : []),
                                    ...(models.prophet ? [{ dataKey: "prophet", label: "Prophet (Seasonal)", color: MODEL_META.prophet.color,  connectNulls: false, showMark: false }] : []),
                                ]}
                                height={300}
                                margin={{ left: 76, right: 16, top: 16, bottom: 40 }}
                                yAxis={[{ valueFormatter: revFormatter }]}
                            />
                        ) : <NoData />}
                    </ChartCard>
                </Grid2>

                {/* Net revenue forecast chart */}
                <Grid2 size={{ xs: 12 }}>
                    <ChartCard title={`Net Revenue Forecast (Gross − Blank COGS) — ${useMonthly ? "monthly view" : `next ${horizon} days`}`} minH={260}>
                        {chartData.length > 0 ? (
                            <LineChart
                                dataset={chartData}
                                xAxis={[{ dataKey: "date", scaleType: "band", tickLabelStyle: { fontSize: 9 }, tickMinStep: 1 }]}
                                series={[
                                    { dataKey: "actualNet",  label: "Actual Net",      color: "#00695c",                             connectNulls: false, showMark: false },
                                    { dataKey: "linearNet",  label: "Linear Regr.",    color: MODEL_META.linearRegression.color,     connectNulls: false, showMark: false },
                                    { dataKey: "emaNet",     label: "Exp. Smoothing",  color: MODEL_META.exponentialSmoothing.color, connectNulls: false, showMark: false },
                                    { dataKey: "maNet",      label: "Moving Avg",      color: MODEL_META.movingAverage.color,        connectNulls: false, showMark: false },
                                    ...(models.chronos ? [{ dataKey: "chronosNet", label: "Chronos (AI)",       color: MODEL_META.chronos.color, connectNulls: false, showMark: false }] : []),
                                    ...(models.prophet ? [{ dataKey: "prophetNet", label: "Prophet (Seasonal)", color: MODEL_META.prophet.color, connectNulls: false, showMark: false }] : []),
                                ]}
                                height={260}
                                margin={{ left: 76, right: 16, top: 16, bottom: 40 }}
                                yAxis={[{ valueFormatter: revFormatter }]}
                            />
                        ) : <NoData />}
                    </ChartCard>
                </Grid2>

                {/* Orders forecast */}
                <Grid2 size={{ xs: 12, md: 6 }}>
                    <ChartCard title="Daily Order Count Forecast" minH={240}>
                        {combinedOrders.length > 0 ? (
                            <LineChart
                                dataset={combinedOrders}
                                xAxis={[{ dataKey: "date", scaleType: "band", tickLabelStyle: { fontSize: 9 } }]}
                                series={[
                                    { dataKey: "actual", label: "Actual",         color: "#1565c0",                             connectNulls: false, showMark: false },
                                    { dataKey: "linear", label: "Linear Regr.",   color: MODEL_META.linearRegression.color,     connectNulls: false, showMark: false },
                                    { dataKey: "ema",    label: "Exp. Smoothing", color: MODEL_META.exponentialSmoothing.color, connectNulls: false, showMark: false },
                                    { dataKey: "ma",     label: "Moving Avg",     color: MODEL_META.movingAverage.color,        connectNulls: false, showMark: false },
                                    ...(models.chronos ? [{ dataKey: "chronos", label: "Chronos (AI)",      color: MODEL_META.chronos.color,  connectNulls: false, showMark: false }] : []),
                                    ...(models.prophet ? [{ dataKey: "prophet", label: "Prophet (Seasonal)", color: MODEL_META.prophet.color, connectNulls: false, showMark: false }] : []),
                                ]}
                                height={240}
                                margin={{ left: 48, right: 16, top: 16, bottom: 40 }}
                            />
                        ) : <NoData />}
                    </ChartCard>
                </Grid2>

                {/* Forecast table */}
                <Grid2 size={{ xs: 12 }}>
                    <ChartCard title="Forecast Values" minH={240}>
                        <Box sx={{ overflowX: "auto" }}>
                            <Table size="small" sx={{ minWidth: 620 }}>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 600, fontSize: 11, bgcolor: "grey.50", whiteSpace: "nowrap" }}>Date</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 600, fontSize: 11, bgcolor: "grey.50", color: MODEL_META.linearRegression.color,     whiteSpace: "nowrap" }}>Linear</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 600, fontSize: 11, bgcolor: "grey.50", color: MODEL_META.exponentialSmoothing.color, whiteSpace: "nowrap" }}>EMA</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 600, fontSize: 11, bgcolor: "grey.50", color: MODEL_META.movingAverage.color,        whiteSpace: "nowrap" }}>MA</TableCell>
                                        {models.chronos && <TableCell align="right" sx={{ fontWeight: 600, fontSize: 11, bgcolor: "grey.50", color: MODEL_META.chronos.color,  whiteSpace: "nowrap" }}>Chronos</TableCell>}
                                        {models.prophet && <TableCell align="right" sx={{ fontWeight: 600, fontSize: 11, bgcolor: "grey.50", color: MODEL_META.prophet.color, whiteSpace: "nowrap" }}>Prophet</TableCell>}
                                        <TableCell align="right" sx={{ fontWeight: 600, fontSize: 11, bgcolor: "grey.50", color: "#00695c", whiteSpace: "nowrap" }}>Net (Best)</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 600, fontSize: 11, bgcolor: "grey.50", whiteSpace: "nowrap" }}>Orders</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {tableRows.map((row) => (
                                        <TableRow key={row.date} hover sx={{ "& td": { py: 0.5, fontSize: 12 } }}>
                                            <TableCell sx={{ whiteSpace: "nowrap" }}>{fmtDate(row.date)}</TableCell>
                                            <TableCell align="right" sx={{ color: MODEL_META.linearRegression.color     }}>{revFormatter(row.linear)}</TableCell>
                                            <TableCell align="right" sx={{ color: MODEL_META.exponentialSmoothing.color }}>{revFormatter(row.ema)}</TableCell>
                                            <TableCell align="right" sx={{ color: MODEL_META.movingAverage.color        }}>{revFormatter(row.ma)}</TableCell>
                                            {models.chronos && <TableCell align="right" sx={{ color: MODEL_META.chronos.color  }}>{revFormatter(row.chronos)}</TableCell>}
                                            {models.prophet && <TableCell align="right" sx={{ color: MODEL_META.prophet.color }}>{revFormatter(row.prophet)}</TableCell>}
                                            <TableCell align="right" sx={{ color: "#00695c" }}>{revFormatter(row[bNetKey])}</TableCell>
                                            <TableCell align="right">{ordDisplayMap[row.date] != null ? fmtN(ordDisplayMap[row.date]) : "—"}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Box>
                        <TablePagination
                            component="div"
                            count={allTableRows.length}
                            page={tablePage}
                            onPageChange={(_, p) => setTablePage(p)}
                            rowsPerPage={rowsPerPage}
                            rowsPerPageOptions={[rowsPerPage]}
                            sx={{ borderTop: 1, borderColor: "divider" }}
                        />
                    </ChartCard>
                </Grid2>

                {/* Model accuracy comparison */}
                <Grid2 size={{ xs: 12 }}>
                    <ChartCard title="Model RMSE Comparison (lower = better fit to historical data)" minH={160}>
                        {Object.keys(models).length > 0 ? (
                            <BarChart
                                dataset={modelKeys.map(k => ({ model: MODEL_META[k]?.label ?? k, rmse: models[k]?.rmseRev ?? 0 }))}
                                xAxis={[{ dataKey: "model", scaleType: "band" }]}
                                series={[{ dataKey: "rmse", label: "RMSE ($)", color: "#546e7a",
                                    valueFormatter: (v) => `$${(v || 0).toLocaleString()}` }]}
                                height={160}
                                margin={{ left: 60, right: 16, top: 10, bottom: 40 }}
                            />
                        ) : <NoData />}
                    </ChartCard>
                </Grid2>
            </Grid2>
        </>
    );
}

// ─── Blank Forecast Tab ───────────────────────────────────────────────────────

function BlankForecastTab({ forecastBlanksData, loading, onRefresh }) {
    const [filter, setFilter] = useState("reorder");
    const [search, setSearch] = useState("");

    if (loading && !forecastBlanksData) {
        return <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>;
    }
    if (!forecastBlanksData) return null;
    if (forecastBlanksData.notReady) {
        return (
            <Box sx={{ textAlign: "center", py: 8 }}>
                <Typography color="text.secondary" sx={{ mb: 2 }}>
                    Forecast not yet computed. Click below to generate it now (takes about a minute), or wait for the scheduled cron to run automatically.
                </Typography>
                {loading
                    ? <CircularProgress size={28} />
                    : <Button variant="contained" onClick={onRefresh}>Compute Now</Button>
                }
            </Box>
        );
    }

    const { rows = [], needsReorderCount = 0, totalSuggestedUnits = 0, totalOrderValue = 0, computedAt } = forecastBlanksData;

    const lc = (s) => (s || "").toLowerCase();
    const filtered = rows
        .filter(r => filter === "all" || r.needsReorder)
        .filter(r => !search || lc(r.styleCode).includes(lc(search)) || lc(r.colorName).includes(lc(search)) || lc(r.sizeName).includes(lc(search)));

    const mkOrd  = (demand, r) => Math.max(0, demand - (r.onHand || 0) - (r.pending || 0));
    const wkOrd  = r => mkOrd(Math.ceil((r.avgMonthly || 0) / 4.33), r);
    const moOrd  = r => mkOrd(Math.ceil(r.avgMonthly || 0), r);
    const qtrOrd = r => mkOrd(Math.ceil((r.avgMonthly || 0) * 3), r);
    const yrOrd  = r => mkOrd(r.proj12mo || 0, r);
    const totalWkOrd  = rows.reduce((a, r) => a + wkOrd(r),  0);
    const totalMoOrd  = rows.reduce((a, r) => a + moOrd(r),  0);
    const totalQtrOrd = rows.reduce((a, r) => a + qtrOrd(r), 0);
    const totalYrOrd  = rows.reduce((a, r) => a + yrOrd(r),  0);

    const chartRows = [...rows].filter(r => (r.suggested || 0) > 0).sort((a, b) => b.suggested - a.suggested).slice(0, 15);

    const columns = [
        { key: "styleCode", label: "Style" },
        { key: "colorName", label: "Color" },
        { key: "sizeName",  label: "Size" },
        { key: "last30",    label: "Last 30d",  align: "center" },
        { key: "last90",    label: "Last 90d",  align: "center" },
        { key: "avgMonthly",label: "Avg/Mo",    align: "center" },
        { key: "proj12mo",  label: "Proj 12mo", align: "center" },
        { key: "onHand",    label: "On Hand",   align: "center", render: (r) => r.onHand  ?? "—" },
        { key: "pending",   label: "Pending",   align: "center", render: (r) => r.pending ?? "—" },
        { key: "reorderAt", label: "Reorder At",align: "center", render: (r) => r.reorderAt ?? "—" },
        { key: "suggested", label: "Order Qty", align: "center", render: (r) => r.suggested != null ? (
            <Typography variant="body2" sx={{ fontWeight: 700, color: r.suggested > 0 ? "error.main" : "success.main" }}>{fmtN(r.suggested)}</Typography>
        ) : "—" },
        { key: "unitCost",   label: "Unit Cost",   align: "center", render: (r) => fmt(r.unitCost) },
        { key: "orderValue", label: "Order Value", align: "center", render: (r) => r.orderValue != null ? fmt(r.orderValue) : "—" },
        { key: "wkOrd",  label: "Wk Ord",  align: "center", getValue: r => wkOrd(r),  render: r => { const v = wkOrd(r);  return v > 0 ? <Typography variant="body2" sx={{ fontWeight: 600, color: "warning.main" }}>{fmtN(v)}</Typography> : "—"; } },
        { key: "moOrd",  label: "Mo Ord",  align: "center", getValue: r => moOrd(r),  render: r => { const v = moOrd(r);  return v > 0 ? fmtN(v) : "—"; } },
        { key: "qtrOrd", label: "Qtr Ord", align: "center", getValue: r => qtrOrd(r), render: r => { const v = qtrOrd(r); return v > 0 ? fmtN(v) : "—"; } },
        { key: "yrOrd",  label: "Yr Ord",  align: "center", getValue: r => yrOrd(r),  render: r => { const v = yrOrd(r);  return v > 0 ? fmtN(v) : "—"; } },
    ];

    return (
        <>
            {loading && <LinearProgress sx={{ mb: 1, borderRadius: 1 }} />}

            <Grid2 container spacing={2} sx={{ mb: 3 }}>
                <Grid2 size={{ xs: 12, sm: 4 }}>
                    <KpiCard label="SKUs Need Reorder" value={fmtN(needsReorderCount)} color="error.main" />
                </Grid2>
                <Grid2 size={{ xs: 12, sm: 4 }}>
                    <KpiCard label="Total Units to Order" value={fmtN(totalSuggestedUnits)} />
                </Grid2>
                <Grid2 size={{ xs: 12, sm: 4 }}>
                    <KpiCard label="Est. Order Value" value={fmt(totalOrderValue)} color="primary.main" />
                </Grid2>
            </Grid2>

            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                Inventory to Order (projected demand − on hand − pending)
            </Typography>
            <Grid2 container spacing={2} sx={{ mb: 3 }}>
                {[
                    { label: "Next Week",    value: totalWkOrd  },
                    { label: "Next Month",   value: totalMoOrd  },
                    { label: "Next Quarter", value: totalQtrOrd },
                    { label: "Next Year",    value: totalYrOrd  },
                ].map(({ label, value }) => (
                    <Grid2 key={label} size={{ xs: 6, sm: 3 }}>
                        <KpiCard label={label} value={`${fmtN(value)} units`}
                            color={value > 0 ? "warning.main" : "success.main"} />
                    </Grid2>
                ))}
            </Grid2>

            {chartRows.length > 0 && (
                <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>Top Blanks by Suggested Order (next 12 months)</Typography>
                    <BarChart
                        dataset={chartRows.map(r => ({ name: `${r.styleCode} ${r.colorName || ""} ${r.sizeName}`.trim(), qty: r.suggested }))}
                        xAxis={[{ scaleType: "band", dataKey: "name", tickLabelStyle: { fontSize: 10, angle: -35, textAnchor: "end" } }]}
                        series={[{ dataKey: "qty", label: "Suggested Order Qty", color: "#ef4444" }]}
                        height={300}
                        margin={{ bottom: 100, left: 60 }}
                        slotProps={{ legend: { hidden: true } }}
                    />
                </Paper>
            )}

            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ mb: 2 }}>
                <Button size="small" variant={filter === "reorder" ? "contained" : "outlined"} color="error"
                    onClick={() => setFilter("reorder")}>
                    Needs Reorder ({fmtN(needsReorderCount)})
                </Button>
                <Button size="small" variant={filter === "all" ? "contained" : "outlined"}
                    onClick={() => setFilter("all")}>
                    All SKUs ({fmtN(rows.length)})
                </Button>
                <TextField
                    size="small" placeholder="Search style / color / size…"
                    value={search} onChange={e => setSearch(e.target.value)}
                    sx={{ ml: 1, minWidth: 240 }}
                />
                {computedAt && (
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                        Updated {fmtDate(computedAt)}
                    </Typography>
                )}
                <Button size="small" variant="outlined" onClick={onRefresh} disabled={loading} sx={{ ml: "auto" }}>
                    {loading ? "Computing…" : "Refresh"}
                </Button>
            </Stack>

            <SortableTable columns={columns} rows={filtered} defaultSort="styleCode" defaultDir="asc" />
        </>
    );
}

// ─── CSV download (client-side) ───────────────────────────────────────────────

// ─── Returns tab ─────────────────────────────────────────────────────────────

function ReturnsTab({ returnsData, loading, onRefresh }) {
    if (loading && !returnsData) {
        return <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}><CircularProgress /></Box>;
    }

    const { topReturned = [], totalCount = 0 } = returnsData ?? {};

    const topChart = topReturned.slice(0, 10);
    const topHeight = Math.max(240, topChart.length * 36 + 60);

    const columns = [
        { key: "sku",       label: "SKU" },
        { key: "blankCode", label: "Style" },
        { key: "colorName", label: "Color" },
        { key: "sizeName",  label: "Size"  },
        { key: "designSku", label: "Design" },
        { key: "quantity",  label: "Qty in Returns", align: "center" },
    ];

    return (
        <>
            {loading && <LinearProgress sx={{ mb: 1, borderRadius: 1 }} />}

            <Grid2 container spacing={2} sx={{ mb: 3 }}>
                <Grid2 size={{ xs: 6, sm: 3 }}><KpiCard label="Total Returns"  value={fmtN(totalCount)} color="error.main" /></Grid2>
                <Grid2 size={{ xs: 6, sm: 3 }}><KpiCard label="Unique SKUs"    value={fmtN(topReturned.length)} /></Grid2>
                <Grid2 size={{ xs: 6, sm: 3 }}><KpiCard label="Top Returned"   value={topReturned[0] ? `${topReturned[0].blankCode || "—"} / ${topReturned[0].colorName || "—"}` : "—"} sub={topReturned[0] ? `${fmtN(topReturned[0].quantity)} in returns` : undefined} /></Grid2>
                <Grid2 size={{ xs: 6, sm: 3 }}>
                    <Card variant="outlined" sx={{ height: "100%" }}>
                        <CardContent sx={{ p: 2, "&:last-child": { pb: 2 }, display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
                            <Button size="small" variant="outlined" onClick={onRefresh} disabled={loading}>Refresh</Button>
                        </CardContent>
                    </Card>
                </Grid2>
            </Grid2>

            <Grid2 container spacing={2} sx={{ mb: 3 }}>
                <Grid2 size={{ xs: 12 }}>
                    <ChartCard title="Top Returned Items by Quantity" minH={topHeight}>
                        {topChart.length > 0 ? (
                            <BarChart
                                layout="horizontal"
                                dataset={topChart.map(r => ({ ...r, label: `${r.blankCode || r.sku || "—"} ${r.colorName || ""} ${r.sizeName || ""}`.trim() }))}
                                yAxis={[{ dataKey: "label", scaleType: "band", tickLabelStyle: { fontSize: 10 } }]}
                                series={[{ dataKey: "quantity", label: "Qty in Returns", color: "#ef4444", valueFormatter: (v) => `${v ?? 0}` }]}
                                height={topHeight}
                                margin={{ left: 160, right: 16, top: 8, bottom: 30 }}
                            />
                        ) : <NoData />}
                    </ChartCard>
                </Grid2>

                <Grid2 size={{ xs: 12, md: 6 }}>
                    <ChartCard title="Returns Over Time" minH={200}>
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200 }}>
                            <Typography variant="body2" color="text.secondary">Coming soon — more scan data needed</Typography>
                        </Box>
                    </ChartCard>
                </Grid2>

                <Grid2 size={{ xs: 12, md: 6 }}>
                    <ChartCard title="12-Month Projections" minH={200}>
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200 }}>
                            <Typography variant="body2" color="text.secondary">Coming soon — more scan data needed</Typography>
                        </Box>
                    </ChartCard>
                </Grid2>
            </Grid2>

            <Paper variant="outlined">
                <Box sx={{ px: 2, py: 1.5, borderBottom: "1px solid", borderColor: "divider" }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>All Return Inventory</Typography>
                </Box>
                <SortableTable columns={columns} rows={topReturned} defaultSort="quantity" defaultDir="desc" />
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

// ─── Date helpers ─────────────────────────────────────────────────────────────

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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Admin() {
    const [preset,      setPreset]      = useState("Last 30 Days");
    const [from,        setFrom]        = useState(() => daysAgo(30));
    const [to,          setTo]          = useState(() => todayStr());
    const [tab,         setTab]         = useState(0); // 0 = Overview (Charts)
    const [backfillRunning,   setBackfillRunning]   = useState(false);
    const [backfillResult,    setBackfillResult]    = useState(null);
    const [discountRunning,   setDiscountRunning]   = useState(false);
    const [discountResult,    setDiscountResult]    = useState(null);
    const [imageFixRunning,   setImageFixRunning]   = useState(false);
    const [imageFixResult,    setImageFixResult]    = useState(null);
    const runBackfillShipByDate = async () => {
        setBackfillRunning(true); setBackfillResult(null);
        try {
            const res = await fetch("/api/admin/backfill/ship-by-date", { method: "POST" });
            const d = await res.json();
            setBackfillResult(d.error ? `Error: ${d.msg}` : `Done — updated: ${d.updated}, skipped: ${d.skipped}`);
        } catch (e) { setBackfillResult(`Error: ${e.message}`); }
        finally { setBackfillRunning(false); }
    };
    const runBackfillDiscounts = async () => {
        setDiscountRunning(true); setDiscountResult(null);
        try {
            let batch = 0, totalUpdated = 0, totalSkipped = 0, grandTotal = 0;
            while (true) {
                setDiscountResult(`Batch ${batch + 1} running…`);
                const res = await fetch("/api/admin/backfill/discounts", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ batch }),
                });
                const d = await res.json();
                if (d.error) { setDiscountResult(`Error: ${d.msg}`); break; }
                grandTotal     = d.total;
                totalUpdated  += d.updated;
                totalSkipped  += d.skipped;
                setDiscountResult(`Batch ${batch + 1}: ${(batch + 1) * 1000 > grandTotal ? grandTotal : (batch + 1) * 1000}/${grandTotal} — updated: ${totalUpdated}`);
                if (!d.hasMore) {
                    setDiscountResult(`Done — ${grandTotal} orders, updated: ${totalUpdated}, skipped: ${totalSkipped}`);
                    break;
                }
                batch++;
            }
        } catch (e) { setDiscountResult(`Error: ${e.message}`); }
        finally { setDiscountRunning(false); }
    };
    const runFixImageUrls = async () => {
        setImageFixRunning(true); setImageFixResult(null);
        try {
            const res = await fetch("/api/admin/backfill/fix-image-urls", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
            const d = await res.json();
            setImageFixResult(d.error ? `Error: ${d.msg}` : `Done — fixed: ${d.updated}`);
        } catch (e) { setImageFixResult(`Error: ${e.message}`); }
        finally { setImageFixRunning(false); }
    };
    const [data,        setData]        = useState(null);
    const [loading,     setLoading]     = useState(true);
    const [error,       setError]       = useState(null);
    const [marketplace, setMarketplace] = useState("All");

    // Returns state
    const [returnsData,    setReturnsData]    = useState(null);
    const [returnsLoading, setReturnsLoading] = useState(false);
    const returnsLoadedRef = useRef(false);

    // Orders state
    const [ordersRows,      setOrdersRows]      = useState([]);
    const [ordersTotal,     setOrdersTotal]     = useState(0);
    const [ordersPage,      setOrdersPage]      = useState(1);
    const [ordersSize,      setOrdersSize]      = useState(50);
    const [ordersSortField, setOrdersSortField] = useState("date");
    const [ordersSortDir,   setOrdersSortDir]   = useState("desc");
    const [ordersLoading,   setOrdersLoading]   = useState(false);

    // Items state
    const [itemsRows,         setItemsRows]         = useState([]);
    const [itemsTotal,        setItemsTotal]         = useState(0);
    const [itemsPage,         setItemsPage]          = useState(1);
    const [itemsSize,         setItemsSize]          = useState(50);
    const [itemsSortField,    setItemsSortField]    = useState("date");
    const [itemsSortDir,      setItemsSortDir]      = useState("desc");
    const [itemsLoading,      setItemsLoading]      = useState(false);
    const [productionSummary, setProductionSummary] = useState(null);
    const [urgentItems,       setUrgentItems]       = useState([]);
    const [urgentLoading,     setUrgentLoading]     = useState(false);
    const [shipTally,         setShipTally]         = useState([]);
    const [shipTallyLoading,  setShipTallyLoading]  = useState(false);

    // Cost items state (CostsTab → Items Detail)
    const [costDetailView,     setCostDetailView]     = useState("orders");
    const [costItemsRows,      setCostItemsRows]      = useState([]);
    const [costItemsTotal,     setCostItemsTotal]     = useState(0);
    const [costItemsPage,      setCostItemsPage]      = useState(1);
    const [costItemsSize,      setCostItemsSize]      = useState(50);
    const [costItemsSortField, setCostItemsSortField] = useState("date");
    const [costItemsSortDir,   setCostItemsSortDir]   = useState("desc");
    const [costItemsLoading,   setCostItemsLoading]   = useState(false);

    // Blanks state
    const [blanksRows,    setBlanksRows]    = useState([]);
    const [blanksLoading, setBlanksLoading] = useState(false);

    // Forecast state
    const [forecastData,    setForecastData]    = useState(null);
    const [forecastLoading, setForecastLoading] = useState(false);
    const [horizon,         setHorizon]         = useState(30);

    // Blanks forecast state
    const [blankForecastData,    setBlankForecastData]    = useState(null);
    const [blankForecastLoading, setBlankForecastLoading] = useState(false);

    const abortRef             = useRef(null);
    const ordersAbortRef       = useRef(null);
    const itemsAbortRef        = useRef(null);
    const costItemsAbortRef    = useRef(null);
    const blanksAbortRef       = useRef(null);
    const forecastAbortRef     = useRef(null);
    const blankForecastAbortRef  = useRef(null);
    const blankForecastLoadedRef = useRef(false);
    const urgentAbortRef         = useRef(null);
    const shipTallyAbortRef      = useRef(null);

    const load = useCallback(async (f, t) => {
        if (abortRef.current) abortRef.current.abort();
        const controller = new AbortController();
        abortRef.current = controller;
        setData(null);
        setOrdersRows([]); setOrdersTotal(0);
        setItemsRows([]); setItemsTotal(0); setProductionSummary(null);
        setBlanksRows([]);
        setForecastData(null);
        setLoading(true); setError(null);
        try {
            const res  = await fetch(`/api/admin/dashboard?from=${f}&to=${t}`, { signal: controller.signal });
            const json = await res.json();
            if (!res.ok || json.error) throw new Error(json.msg || "Failed to load dashboard data");
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
            const res  = await fetch(`/api/admin/dashboard/orders?from=${f}&to=${t}${mpParam}&page=${page}&pageSize=${size}&sort=${sortField}&dir=${sortDir}`, { signal: controller.signal });
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
            const res  = await fetch(`/api/admin/dashboard/items?from=${f}&to=${t}${mpParam}&page=${page}&pageSize=${size}&sort=${sortField}&dir=${sortDir}`, { signal: controller.signal });
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
            const res  = await fetch(`/api/admin/cost-items?from=${f}&to=${t}&page=${page}&pageSize=${size}&sort=${sortField}&dir=${sortDir}`, { signal: controller.signal });
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

    const loadForecast = useCallback(async (mp, h, force = false) => {
        if (forecastAbortRef.current) forecastAbortRef.current.abort();
        const controller = new AbortController();
        forecastAbortRef.current = controller;
        setForecastLoading(true);
        try {
            const mpParam = mp && mp !== "All" ? `&marketplace=${encodeURIComponent(mp)}` : "";
            if (force && (!mp || mp === "All")) {
                await fetch("/api/admin/dashboard/forecast", { method: "POST", signal: controller.signal });
            }
            const res  = await fetch(`/api/admin/dashboard/forecast?horizon=${h}${mpParam}`, { signal: controller.signal });
            const json = await res.json();
            if (!res.ok || json.error) throw new Error(json.msg);
            setForecastData(json);
        } catch (e) {
            if (e.name !== "AbortError") console.error("[forecast]", e.message);
        } finally {
            if (forecastAbortRef.current === controller) setForecastLoading(false);
        }
    }, []);

    const loadBlanks = useCallback(async (f, t, mp) => {
        if (blanksAbortRef.current) blanksAbortRef.current.abort();
        const controller = new AbortController();
        blanksAbortRef.current = controller;
        setBlanksLoading(true);
        try {
            const mpParam = mp && mp !== "All" ? `&marketplace=${encodeURIComponent(mp)}` : "";
            const res  = await fetch(`/api/admin/dashboard/blanks?from=${f}&to=${t}${mpParam}`, { signal: controller.signal });
            const json = await res.json();
            if (!res.ok || json.error) throw new Error(json.msg);
            setBlanksRows(json.blanks);
        } catch (e) {
            if (e.name !== "AbortError") console.error("[blanks]", e.message);
        } finally {
            if (blanksAbortRef.current === controller) setBlanksLoading(false);
        }
    }, []);

    const loadUrgentItems = useCallback(async () => {
        if (urgentAbortRef.current) urgentAbortRef.current.abort();
        const controller = new AbortController();
        urgentAbortRef.current = controller;
        setUrgentLoading(true);
        try {
            const res  = await fetch("/api/admin/dashboard/urgent-items", { signal: controller.signal });
            const json = await res.json();
            if (!res.ok || json.error) throw new Error(json.msg);
            setUrgentItems(json.items);
        } catch (e) {
            if (e.name !== "AbortError") console.error("[urgent-items]", e.message);
        } finally {
            if (urgentAbortRef.current === controller) setUrgentLoading(false);
        }
    }, []);

    const loadShipTally = useCallback(async () => {
        if (shipTallyAbortRef.current) shipTallyAbortRef.current.abort();
        const controller = new AbortController();
        shipTallyAbortRef.current = controller;
        setShipTallyLoading(true);
        try {
            const res  = await fetch("/api/admin/dashboard/ship-tally", { signal: controller.signal });
            const json = await res.json();
            if (!res.ok || json.error) throw new Error(json.msg);
            setShipTally(json.rows);
        } catch (e) {
            if (e.name !== "AbortError") console.error("[ship-tally]", e.message);
        } finally {
            if (shipTallyAbortRef.current === controller) setShipTallyLoading(false);
        }
    }, []);

    const loadBlankForecast = useCallback(async (force = false) => {
        if (blankForecastAbortRef.current) blankForecastAbortRef.current.abort();
        const controller = new AbortController();
        blankForecastAbortRef.current = controller;
        setBlankForecastLoading(true);
        try {
            const res  = await fetch("/api/admin/dashboard/blanks-forecast", { method: force ? "POST" : "GET", signal: controller.signal });
            const json = await res.json();
            if (!res.ok || json.error) throw new Error(json.msg);
            setBlankForecastData(json);
        } catch (e) {
            if (e.name !== "AbortError") console.error("[blanks-forecast]", e.message);
        } finally {
            if (blankForecastAbortRef.current === controller) setBlankForecastLoading(false);
        }
    }, []);

    const loadReturns = useCallback(async (f, t) => {
        setReturnsLoading(true);
        try {
            const res  = await fetch(`/api/admin/dashboard/returns?from=${f}&to=${t}`);
            const json = await res.json();
            if (!res.ok || json.error) throw new Error(json.msg);
            setReturnsData(json);
        } catch (e) {
            console.error("[returns]", e.message);
        } finally {
            setReturnsLoading(false);
        }
    }, []);

    useEffect(() => { load(from, to); }, [from, to, load]);
    useEffect(() => { setOrdersPage(1); setItemsPage(1); setCostItemsPage(1); }, [from, to, marketplace]);
    useEffect(() => { loadOrders(from, to, marketplace, ordersPage, ordersSize, ordersSortField, ordersSortDir); }, [from, to, marketplace, ordersPage, ordersSize, ordersSortField, ordersSortDir, loadOrders]);
    useEffect(() => { loadItems(from, to, marketplace, itemsPage, itemsSize, itemsSortField, itemsSortDir); }, [from, to, marketplace, itemsPage, itemsSize, itemsSortField, itemsSortDir, loadItems]);
    useEffect(() => { loadUrgentItems(); }, [loadUrgentItems]);
    useEffect(() => { loadShipTally(); }, [loadShipTally]);
    useEffect(() => { loadCostItems(from, to, costItemsPage, costItemsSize, costItemsSortField, costItemsSortDir); }, [from, to, costItemsPage, costItemsSize, costItemsSortField, costItemsSortDir, loadCostItems]);
    useEffect(() => { loadBlanks(from, to, marketplace); }, [from, to, marketplace, loadBlanks]);
    useEffect(() => { loadForecast(marketplace, horizon); }, [marketplace, horizon, loadForecast]);
    useEffect(() => {
        if (tab === 6 && !blankForecastLoadedRef.current) { blankForecastLoadedRef.current = true; loadBlankForecast(); }
        if (tab === 7 && !returnsLoadedRef.current) { returnsLoadedRef.current = true; loadReturns(from, to); }
    }, [tab, loadBlankForecast]);

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

    // Derived data
    const summary                  = data?.summary                  ?? { totalRevenue: 0, orderCount: 0, canceledCount: 0, totalShipping: 0 };
    const byMarketplace            = data?.byMarketplace            ?? [];
    const orderMarketplaceMap      = data?.orderMarketplaceMap      ?? {};
    const items                    = data?.items                    ?? [];
    const inventoryValue           = data?.inventoryValue           ?? 0;
    const ordersByDayByMarketplace = data?.ordersByDayByMarketplace ?? [];
    const totalServiceCost    = data?.totalServiceCost    ?? 0;
    const totalKlingCost      = data?.totalKlingCost      ?? 0;
    const itemCount           = data?.itemCount           ?? 0;
    const revenueByDay        = data?.revenueByDay        ?? [];
    const itemsByDay          = data?.itemsByDay          ?? [];

    const marketplaces = useMemo(() =>
        ["All", ...byMarketplace.map((mp) => mp.marketplace).filter(Boolean).sort()],
    [byMarketplace]);

    const cogsByMarketplace          = data?.cogsByMarketplace          ?? {};
    const itemCountByMarketplace     = data?.itemCountByMarketplace     ?? {};
    const itemsByMarketplaceAndStyle = data?.itemsByMarketplaceAndStyle ?? {};

    const licenceFeeByMarketplace = data?.licenceFeeByMarketplace ?? {};

    const ordersData    = { orders: ordersRows,   total: ordersTotal,    page: ordersPage,    pageSize: ordersSize,    loading: ordersLoading    };
    const itemsData     = { items: itemsRows,     total: itemsTotal,     page: itemsPage,     pageSize: itemsSize,     loading: itemsLoading     };
    const costItemsData = { items: costItemsRows, total: costItemsTotal, page: costItemsPage, pageSize: costItemsSize, loading: costItemsLoading };

    const handleDownload = useCallback(() => {
        if (tab === 0 || tab === 5) return;
        const mpSlug  = marketplace !== "All" ? `-${marketplace}` : "";
        const mpParam = marketplace !== "All" ? `&marketplace=${encodeURIComponent(marketplace)}` : "";
        const slug    = [null, "sales", "production", "costs", "blanks", null, "blanks-forecast"][tab];
        const name    = `${slug}${mpSlug}-${from}-to-${to}`;

        if (tab === 4) {
            downloadCsv(`${name}.csv`,
                ["Style", "Color", "Size", "Qty Sold", "Unit Cost", "Total COGS"],
                blanksRows.map((r) => [r.styleCode || "", r.colorName || "", r.sizeName || "", r.qty, (r.unitCost ?? 0).toFixed(2), (r.totalCogs ?? 0).toFixed(2)])
            );
        } else if (tab === 6) {
            const rows = blankForecastData?.rows ?? [];
            downloadCsv(`${name}.csv`,
                ["Style", "Color", "Size", "Last 30d", "Last 90d", "Avg/Mo", "Proj 12mo", "On Hand", "Pending", "Reorder At", "Suggested Order", "Unit Cost", "Order Value"],
                rows.map(r => [r.styleCode||"", r.colorName||"", r.sizeName||"", r.last30, r.last90, r.avgMonthly, r.proj12mo, r.onHand??""  , r.pending??"", r.reorderAt??"", r.suggested??"", (r.unitCost??0).toFixed(2), (r.orderValue??0).toFixed(2)])
            );
        } else {
            let endpoint;
            if (tab === 2) endpoint = `/api/admin/dashboard/items?csv=1&from=${from}&to=${to}${mpParam}`;
            else if (tab === 3 && costDetailView === "items") endpoint = `/api/admin/cost-items?csv=1&from=${from}&to=${to}`;
            else endpoint = `/api/admin/dashboard/orders?csv=1&from=${from}&to=${to}${mpParam}`;
            Object.assign(document.createElement("a"), { href: endpoint, download: `${name}.csv` }).click();
        }
    }, [tab, costDetailView, blanksRows, blankForecastData, marketplace, from, to]);

    const isInitialLoad = loading && !data;

    return (
        <Box sx={{ backgroundColor: "background.default", minHeight: "100vh" }}>
            <Container maxWidth="xl" sx={{ py: 3 }}>

                <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ sm: "center" }} justifyContent="space-between" spacing={2} sx={{ mb: 3 }}>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                        <DashboardIcon sx={{ color: "primary.main", fontSize: 28 }} />
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>Dashboard</Typography>
                            <Typography variant="caption" color="text.secondary">
                                {isInitialLoad ? "Loading…" : `${fmtN(summary.orderCount)} orders · ${fmtN(itemCount)} items`}
                            </Typography>
                        </Box>
                    </Stack>

                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                        <Button variant="outlined" size="small" startIcon={<DownloadIcon />} onClick={handleDownload}
                            disabled={isInitialLoad || !data || tab === 0 || tab === 5 || (tab === 6 && !blankForecastData)}>
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
                        <Tab icon={<AutoGraphIcon fontSize="small" />}             iconPosition="start" label="Forecast" />
                        <Tab icon={<AddShoppingCartIcon fontSize="small" />}      iconPosition="start" label="Order Forecast" />
                        <Tab icon={<AssignmentReturnIcon fontSize="small" />}    iconPosition="start" label="Returns" />
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
                                ordersByDayByMarketplace={ordersByDayByMarketplace}
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
                                ordersByDayByMarketplace={ordersByDayByMarketplace}
                                sortField={ordersSortField} sortDir={ordersSortDir}
                                onPageChange={setOrdersPage} onPageSizeChange={handleOrdersPageSizeChange} onSortChange={handleOrdersSort}
                                salesItemsData={costItemsData}
                                salesItemsSortField={costItemsSortField} salesItemsSortDir={costItemsSortDir}
                                onSalesItemsPageChange={setCostItemsPage} onSalesItemsPageSizeChange={handleCostItemsPageSizeChange} onSalesItemsSortChange={handleCostItemsSort}
                            />
                        )}
                        {tab === 2 && (
                            <ProductionTab
                                productionSummary={productionSummary} itemsData={itemsData} itemsByDay={itemsByDay}
                                sortField={itemsSortField} sortDir={itemsSortDir}
                                onPageChange={setItemsPage} onPageSizeChange={handleItemsPageSizeChange} onSortChange={handleItemsSort}
                                urgentItems={urgentItems} urgentLoading={urgentLoading}
                                shipTally={shipTally} shipTallyLoading={shipTallyLoading}
                            />
                        )}
                        {tab === 3 && (
                            <CostsTab
                                summary={summary} byMarketplace={byMarketplace} cogsByMarketplace={cogsByMarketplace}
                                licenceFeeByMarketplace={licenceFeeByMarketplace}
                                ordersData={ordersData} sortField={ordersSortField} sortDir={ordersSortDir}
                                onPageChange={setOrdersPage} onPageSizeChange={handleOrdersPageSizeChange} onSortChange={handleOrdersSort}
                                costItemsData={costItemsData} costItemsSortField={costItemsSortField} costItemsSortDir={costItemsSortDir}
                                onCostItemsPageChange={setCostItemsPage} onCostItemsPageSizeChange={handleCostItemsPageSizeChange} onCostItemsSortChange={handleCostItemsSort}
                                detailView={costDetailView} onDetailViewChange={setCostDetailView}
                                itemCountByMarketplace={itemCountByMarketplace}
                                itemsByMarketplaceAndStyle={itemsByMarketplaceAndStyle}
                                inventoryValue={inventoryValue}
                                totalServiceCost={totalServiceCost} totalKlingCost={totalKlingCost}
                            />
                        )}
                        {tab === 4 && <BlanksTab blanks={blanksRows} loading={blanksLoading} />}
                        {tab === 5 && (
                            <ForecastTab
                                forecastData={forecastData}
                                loading={forecastLoading}
                                horizon={horizon}
                                onHorizonChange={setHorizon}
                                onRefresh={() => loadForecast(marketplace, horizon, true)}
                            />
                        )}
                        {tab === 6 && (
                            <BlankForecastTab
                                forecastBlanksData={blankForecastData}
                                loading={blankForecastLoading}
                                onRefresh={() => loadBlankForecast(true)}
                            />
                        )}
                        {tab === 7 && (
                            <ReturnsTab
                                returnsData={returnsData}
                                loading={returnsLoading}
                                onRefresh={() => { returnsLoadedRef.current = true; loadReturns(from, to); }}
                            />
                        )}
                    </>
                )}

            </Container>
        </Box>
    );
}

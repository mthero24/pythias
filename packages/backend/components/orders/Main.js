"use client";
import {
    Typography, Box, Grid2, TextField, Pagination, Container, Stack,
    Chip, Card, Collapse, Divider, InputAdornment, IconButton, Tooltip,
} from "@mui/material";
import { useState } from "react";
import { useRouter } from "next/navigation";
import SearchIcon from "@mui/icons-material/Search";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import { RetryImage } from "../reusable/RetryImage";

const STATUS_COLORS = {
    awaiting_shipment: { color: "warning", label: "Awaiting Shipment" },
    shipped: { color: "success", label: "Shipped" },
    cancelled: { color: "error", label: "Cancelled" },
    on_hold: { color: "default", label: "On Hold" },
};

const isMissingInfo = (o) =>
    o.status !== "shipped" &&
    o.items.some(
        (i) =>
            (i.design == undefined && !i.isBlank) ||
            (Object.keys(i.design ?? {}).length === 0 && !i.isBlank) ||
            i.color == undefined ||
            i.size == undefined ||
            i.sizeName == undefined ||
            (i.blank == undefined && i.styleV2 == undefined)
    );

export function Main({ ords, pages, page, q, filter, showAll, source }) {
    const router = useRouter();
    const [orders] = useState(ords);
    const [search, setSearch] = useState(q ?? "");
    const [opened, setOpened] = useState("");

    const buildUrl = ({ pg = 1, f = filter, all = showAll, sq = search } = {}) => {
        const params = new URLSearchParams();
        if (pg > 1) params.set("page", String(pg));
        if (f) params.set("filter", f);
        if (all) params.set("status", "all");
        if (sq?.trim()) params.set("q", sq.trim());
        const qs = params.toString();
        return `/orders${qs ? `?${qs}` : ""}`;
    };

    const performSearch = () => {
        location.href = buildUrl({ pg: 1 });
    };

    const handlePageChange = (_, value) => {
        location.href = buildUrl({ pg: value });
    };

    const activeFilter = filter ?? "none";

    const FILTERS = [
        { key: "none",        label: "All Types",       f: null },
        { key: "missinginfo", label: "Missing Info",     f: "missinginfo", icon: <WarningAmberIcon sx={{ fontSize: 14 }} /> },
        { key: "blank",       label: "Includes Blanks",  f: "blank" },
    ];

    return (
        <Box sx={{ width: "100%", maxWidth: "100%", overflowX: "hidden" }}>
            {/* Header */}
            <Box sx={{ bgcolor: "#fff", borderBottom: "1px solid #e2e8f0", px: 3, py: 2, mb: 0 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                        <Box sx={{
                            width: 36, height: 36, borderRadius: 2, flexShrink: 0,
                            background: "linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                            <ShoppingCartIcon sx={{ color: "#fff", fontSize: 20 }} />
                        </Box>
                        <Box>
                            <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: -0.5, lineHeight: 1.2 }}>
                                Orders
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {showAll ? "All statuses" : "Awaiting shipment"}
                                {filter === "missinginfo" ? " · Missing info" : filter === "blank" ? " · Includes blanks" : ""}
                                {q ? ` · "${q}"` : ""}
                            </Typography>
                        </Box>
                    </Stack>

                    <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center">
                        {/* Status toggle */}
                        <Chip
                            label="Awaiting Shipment"
                            size="small"
                            variant={!showAll ? "filled" : "outlined"}
                            color={!showAll ? "warning" : "default"}
                            onClick={() => { location.href = buildUrl({ pg: 1, all: false }); }}
                            sx={{ cursor: "pointer", fontWeight: !showAll ? 600 : 400 }}
                        />
                        <Chip
                            label="All Statuses"
                            size="small"
                            variant={showAll ? "filled" : "outlined"}
                            color={showAll ? "primary" : "default"}
                            onClick={() => { location.href = buildUrl({ pg: 1, all: true }); }}
                            sx={{ cursor: "pointer", fontWeight: showAll ? 600 : 400 }}
                        />
                        <Box sx={{ width: "1px", height: 20, bgcolor: "divider", display: { xs: "none", sm: "block" } }} />
                        {/* Type filters */}
                        {FILTERS.map((fi) => (
                            <Chip
                                key={fi.key}
                                label={fi.label}
                                icon={fi.icon}
                                size="small"
                                variant={activeFilter === fi.key ? "filled" : "outlined"}
                                color={activeFilter === fi.key ? "primary" : "default"}
                                onClick={() => { location.href = buildUrl({ pg: 1, f: fi.f }); }}
                                sx={{ cursor: "pointer", fontWeight: activeFilter === fi.key ? 600 : 400 }}
                            />
                        ))}
                    </Stack>
                </Box>
            </Box>

            <Container maxWidth="lg" sx={{ py: 3, minHeight: "90vh" }}>

                {/* Search */}
                <Box sx={{ mb: 2, p: 2, borderRadius: 2, background: "#fff", boxShadow: "0px 0px 10px rgba(0,0,0,.1)" }}>
                    <TextField
                        fullWidth
                        variant="outlined"
                        placeholder="Search by PO number, SKU, name…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") performSearch(); }}
                        size="small"
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end" sx={{ cursor: "pointer" }} onClick={performSearch}>
                                    <SearchIcon />
                                </InputAdornment>
                            ),
                        }}
                    />
                </Box>

                {/* Column headers */}
                <Box sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr 80px 60px 36px", md: "2fr 1fr 80px 80px 80px 36px" },
                    px: 2, py: 1,
                    borderRadius: 1,
                    backgroundColor: "background.default",
                    border: "1px solid", borderColor: "divider",
                    mb: 0.5,
                }}>
                    {["PO Number", "Status", "#Items", "Date", "Total", ""].map((col, i) => (
                        <Typography
                            key={i}
                            variant="caption"
                            sx={{
                                fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "text.secondary",
                                display: (i === 1 || i === 3 || i === 4) ? { xs: "none", md: "block" } : "block",
                            }}
                        >
                            {col}
                        </Typography>
                    ))}
                </Box>

                {/* Orders */}
                <Stack spacing={0.5}>
                    {orders.length === 0 && (
                        <Box sx={{ py: 10, textAlign: "center" }}>
                            <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>No orders found</Typography>
                        </Box>
                    )}
                    {orders.map((o) => {
                        const missing = isMissingInfo(o);
                        const isOpen = opened === o._id;
                        const statusInfo = STATUS_COLORS[o.status] ?? { color: "default", label: o.status };

                        return (
                            <Card
                                key={o._id}
                                variant="outlined"
                                sx={{
                                    borderRadius: 1.5,
                                    borderColor: missing ? "warning.light" : "divider",
                                    transition: "box-shadow 150ms",
                                    "&:hover": { boxShadow: 2 },
                                    overflow: "visible",
                                }}
                            >
                                {/* Row */}
                                <Box
                                    sx={{
                                        display: "grid",
                                        gridTemplateColumns: { xs: "1fr 80px 60px 36px", md: "2fr 1fr 80px 80px 80px 36px" },
                                        alignItems: "center",
                                        px: 2, py: 1.25,
                                        cursor: "pointer",
                                    }}
                                    onClick={() => router.push(`/orders/${o._id}`)}
                                >
                                    {/* PO Number */}
                                    <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 0 }}>
                                        {missing && (
                                            <Tooltip title="Missing item information">
                                                <WarningAmberIcon sx={{ fontSize: 16, color: "warning.main", flexShrink: 0 }} />
                                            </Tooltip>
                                        )}
                                        <Typography variant="body2" sx={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                            {o.poNumber}
                                        </Typography>
                                        <Typography variant="caption" color="text.disabled" sx={{ display: { xs: "none", sm: "block" }, whiteSpace: "nowrap" }}>
                                            {o.marketplace}
                                        </Typography>
                                    </Stack>

                                    {/* Status */}
                                    <Box sx={{ display: { xs: "none", md: "flex" }, alignItems: "center" }}>
                                        <Chip
                                            label={statusInfo.label}
                                            color={statusInfo.color}
                                            size="small"
                                            variant="outlined"
                                            sx={{ fontSize: "0.65rem", height: 20 }}
                                        />
                                    </Box>

                                    {/* Items */}
                                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center" }}>
                                        {o.items.length}
                                    </Typography>

                                    {/* Date */}
                                    <Typography variant="body2" color="text.secondary" sx={{ display: { xs: "none", md: "block" } }}>
                                        {new Date(o.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" })}
                                    </Typography>

                                    {/* Total */}
                                    <Typography variant="body2" sx={{ fontWeight: 500, display: { xs: "none", md: "block" } }}>
                                        ${parseFloat(o.total ?? 0).toFixed(2)}
                                    </Typography>

                                    {/* Expand toggle — stop propagation so click doesn't navigate */}
                                    <Box
                                        sx={{ display: "flex", justifyContent: "center" }}
                                        onClick={(e) => { e.stopPropagation(); setOpened(isOpen ? "" : o._id); }}
                                    >
                                        <IconButton size="small">
                                            {isOpen ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                                        </IconButton>
                                    </Box>
                                </Box>

                                {/* Expanded items */}
                                <Collapse in={isOpen} unmountOnExit>
                                    <Divider />
                                    <Box sx={{ px: 2, py: 1.5, backgroundColor: "background.default" }}>
                                        {/* Mobile status + total row */}
                                        <Stack direction="row" spacing={1} sx={{ mb: 1.5, display: { xs: "flex", md: "none" }, flexWrap: "wrap", alignItems: "center" }}>
                                            <Chip label={statusInfo.label} color={statusInfo.color} size="small" variant="outlined" sx={{ fontSize: "0.65rem", height: 20 }} />
                                            <Typography variant="caption" color="text.secondary">
                                                {new Date(o.date).toLocaleDateString("en-US")} · ${parseFloat(o.total ?? 0).toFixed(2)}
                                            </Typography>
                                        </Stack>

                                        <Stack spacing={1}>
                                            {o.items.map((item, idx) => {
                                                const itemMissing =
                                                    o.status !== "shipped" &&
                                                    ((item.design == undefined && !item.isBlank) ||
                                                        (Object.keys(item.design ?? {}).length === 0 && !item.isBlank) ||
                                                        item.color == undefined || item.size == undefined ||
                                                        item.sizeName == undefined || item.blank == undefined);

                                                const imageKeys = Object.keys(item.design ?? {}).filter(k => item.design[k] != undefined);

                                                return (
                                                    <Box
                                                        key={idx}
                                                        sx={{
                                                            display: "grid",
                                                            gridTemplateColumns: { xs: "56px 1fr", md: "56px 2fr 1fr 1fr 1fr" },
                                                            gap: 1.5,
                                                            alignItems: "center",
                                                            p: 1.25,
                                                            borderRadius: 1.5,
                                                            border: "1px solid",
                                                            borderColor: itemMissing ? "warning.light" : "divider",
                                                            backgroundColor: itemMissing ? "rgba(255,167,38,0.04)" : "#fff",
                                                        }}
                                                    >
                                                        {/* Image */}
                                                        <Box sx={{ width: 56, height: 56, borderRadius: 1, overflow: "hidden", backgroundColor: "background.default", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                                            {imageKeys.length > 0 ? (
                                                                <RetryImage
                                                                    src={source === "PO"
                                                                        ? `https://images4.tshirtpalace.com/images/productImages/SKU--${(item.colorName || "").toLowerCase()}-${(item.styleCode || "").toLowerCase()}-${imageKeys[0]}.webp?url=${item.design[imageKeys[0]]}&width=100`
                                                                        : `/api/renderImages/${item.styleCode}-${item.colorName}-${imageKeys[0]}.jpg?blank=${item.styleCode}&colorName=${item.colorName}&design=${item.design[imageKeys[0]]}&width=100&side=${imageKeys[0]}`}
                                                                    alt={item.sku}
                                                                    style={{ width: "100%", height: "100%", objectFit: "contain" }}
                                                                />
                                                            ) : (
                                                                <Box sx={{ width: "100%", height: "100%", backgroundColor: "divider" }} />
                                                            )}
                                                        </Box>

                                                        {/* Name / SKU / UPC */}
                                                        <Box sx={{ minWidth: 0 }}>
                                                            <Typography variant="body2" sx={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={item.name}>
                                                                {item.name || "—"}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary" sx={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                                {item.sku}
                                                            </Typography>
                                                            {item.upc && (
                                                                <Typography variant="caption" color="text.disabled" sx={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                                    UPC: {item.upc}
                                                                </Typography>
                                                            )}
                                                        </Box>

                                                        {/* Color */}
                                                        <Box sx={{ display: { xs: "none", md: "block" } }}>
                                                            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.25 }}>Color</Typography>
                                                            <Typography variant="body2">{item.colorName || <span style={{ color: "#f59e0b" }}>—</span>}</Typography>
                                                        </Box>

                                                        {/* Size */}
                                                        <Box sx={{ display: { xs: "none", md: "block" } }}>
                                                            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.25 }}>Size</Typography>
                                                            <Typography variant="body2">{item.sizeName || <span style={{ color: "#f59e0b" }}>—</span>}</Typography>
                                                        </Box>

                                                        {/* Blank */}
                                                        <Box sx={{ display: { xs: "none", md: "block" } }}>
                                                            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.25 }}>Blank</Typography>
                                                            <Typography variant="body2">{item.styleCode || <span style={{ color: "#f59e0b" }}>—</span>}</Typography>
                                                        </Box>
                                                    </Box>
                                                );
                                            })}
                                        </Stack>
                                    </Box>
                                </Collapse>
                            </Card>
                        );
                    })}
                </Stack>

                {/* Pagination */}
                <Stack spacing={2} sx={{ mt: 3, mb: 2, display: "flex", alignItems: "center" }}>
                    <Pagination
                        count={pages ?? 20}
                        page={page ?? 1}
                        onChange={handlePageChange}
                        shape="rounded"
                        showFirstButton
                        showLastButton
                    />
                </Stack>

            </Container>
        </Box>
    );
}

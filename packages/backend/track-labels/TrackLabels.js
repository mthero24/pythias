"use client";
import {
    Box, Container, Typography, Stack, Card, Grid2, Chip,
    InputAdornment, TextField, IconButton, Collapse, Divider,
} from "@mui/material";
import { useState } from "react";
import Link from "next/link";
import TrackChangesIcon     from "@mui/icons-material/TrackChanges";
import SearchIcon           from "@mui/icons-material/Search";
import CloseIcon            from "@mui/icons-material/Close";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon   from "@mui/icons-material/KeyboardArrowUp";
import LocalShippingIcon    from "@mui/icons-material/LocalShipping";
import ReplayIcon           from "@mui/icons-material/Replay";
import OpenInNewIcon        from "@mui/icons-material/OpenInNew";
import ScheduleIcon         from "@mui/icons-material/Schedule";
import { Footer } from "../components/reusable/Footer";
import { Repull } from "@pythias/repull";
import Image from "next/image";

export function TrackLabels({ items, source }) {
    const [opened, setOpened] = useState("");
    const [search, setSearch] = useState("");

    const q = search.trim().toLowerCase();
    const filtered = q
        ? items.filter(item =>
            item.pieceId?.toString().toLowerCase().includes(q) ||
            item.order?.poNumber?.toString().toLowerCase().includes(q) ||
            item.styleCode?.toLowerCase().includes(q) ||
            item.colorName?.toLowerCase().includes(q) ||
            item.sizeName?.toLowerCase().includes(q)
        )
        : items;

    return (
        <Box sx={{ backgroundColor: "background.default", minHeight: "100vh" }}>
            <Container maxWidth="xl" sx={{ py: 4 }}>

                {/* Header */}
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 4, flexWrap: "wrap", gap: 2 }}>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                        <Box sx={{ width: 36, height: 36, borderRadius: 2, background: "linear-gradient(135deg, #6366f1 0%, #14b8a6 100%)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <TrackChangesIcon sx={{ color: "#fff", fontSize: 20 }} />
                        </Box>
                        <Box>
                            <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: -0.5, lineHeight: 1.2 }}>Track Labels</Typography>
                            <Typography variant="body2" color="text.secondary">
                                {q ? `${filtered.length} of ${items.length}` : items.length} item{items.length !== 1 ? "s" : ""} in progress
                            </Typography>
                        </Box>
                    </Stack>
                    <TextField
                        size="small"
                        placeholder="Search by piece ID, PO, style, color, size…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        sx={{ width: 320 }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon fontSize="small" sx={{ color: "text.disabled" }} />
                                </InputAdornment>
                            ),
                            endAdornment: search ? (
                                <InputAdornment position="end">
                                    <IconButton size="small" edge="end" onClick={() => setSearch("")}>
                                        <CloseIcon sx={{ fontSize: 14 }} />
                                    </IconButton>
                                </InputAdornment>
                            ) : null,
                        }}
                    />
                </Box>

                {/* Empty state */}
                {filtered.length === 0 && (
                    <Box sx={{ py: 12, textAlign: "center" }}>
                        <SearchIcon sx={{ fontSize: 48, color: "text.disabled", mb: 1.5 }} />
                        <Typography variant="body1" fontWeight={600} color="text.secondary">
                            {q ? `No results for "${search}"` : "No items in progress"}
                        </Typography>
                    </Box>
                )}

                {/* Items */}
                <Stack spacing={2}>
                    {filtered.map((item) => {
                        const isOpen  = opened === item._id;
                        const lastStep = item.steps?.[item.steps.length - 1];

                        return (
                            <Card key={item._id} variant="outlined" sx={{
                                borderRadius: 3, overflow: "hidden",
                                borderColor: item.rePulled ? "warning.light" : "divider",
                                transition: "box-shadow 150ms",
                                "&:hover": { boxShadow: "0 4px 16px rgba(0,0,0,0.08)" },
                            }}>
                                {/* Repulled banner */}
                                {item.rePulled && (
                                    <Stack direction="row" alignItems="center" spacing={0.75}
                                        sx={{ bgcolor: "#fffbeb", borderBottom: "1px solid #fde68a", px: 2, py: 0.75 }}>
                                        <ReplayIcon sx={{ fontSize: 13, color: "#d97706" }} />
                                        <Typography variant="caption" sx={{ color: "#92400e", fontWeight: 600, fontSize: "0.68rem" }}>
                                            Repulled · {item.rePulled}{item.rePulledReasons?.[0] ? ` — ${item.rePulledReasons[0]}` : ""}
                                        </Typography>
                                    </Stack>
                                )}

                                {/* Main row */}
                                <Box sx={{ display: "flex", alignItems: "center", gap: 2.5, p: 2, flexWrap: "wrap" }}>

                                    {/* Images */}
                                    <Box sx={{ flexShrink: 0, position: "relative", width: 110 }}>
                                        {Object.keys(item.design ?? {})
                                            .sort((a, b) => a === "back" ? 1 : b === "back" ? -1 : 0)
                                            .map((key) => {
                                                if (!item.design[key]) return null;
                                                const src = source === "PO"
                                                    ? `https://images4.tshirtpalace.com/images/productImages/SKU--${item.colorName?.replace(/\//g, "")?.toLowerCase()}-${item.styleCode}-${key}.webp?url=${item.design[key]}&width=200`
                                                    : `https://${source}.pythiastechnologies.com/api/renderImages?colorName=${item.colorName}&blank=${item.styleCode}&design=${item.design[key]}&side=${key}&threadColor=${item.threadColorName}&width=${key === "back" ? 100 : 200}&v=${Date.now()}`;
                                                return key !== "back" ? (
                                                    <Box key={key} sx={{ bgcolor: "#f3f4f6", borderRadius: 2, overflow: "hidden" }}>
                                                        <Image src={src} alt={`${item.sku}-${key}`} width={200} height={200} style={{ width: "100%", height: "auto", display: "block" }} />
                                                    </Box>
                                                ) : (
                                                    <Box key={key} sx={{ position: "absolute", bottom: -6, right: -6, width: 48, bgcolor: "#f3f4f6", borderRadius: 1.5, overflow: "hidden", border: "2px solid #fff", boxShadow: "0 2px 6px rgba(0,0,0,0.14)" }}>
                                                        <Image src={src} alt={`${item.sku}-back`} width={100} height={100} style={{ width: "100%", height: "auto", display: "block" }} />
                                                    </Box>
                                                );
                                            })}
                                    </Box>

                                    {/* Piece info */}
                                    <Box sx={{ flex: 1, minWidth: 140 }}>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                                            Piece #{item.pieceId}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.75 }}>
                                            {new Date(item.date).toLocaleString()}
                                        </Typography>
                                        <Stack direction="row" flexWrap="wrap" gap={0.5}>
                                            {item.styleCode      && <Chip label={item.styleCode}      size="small" sx={{ height: 20, fontSize: "0.68rem" }} />}
                                            {item.colorName      && <Chip label={item.colorName}      size="small" sx={{ height: 20, fontSize: "0.68rem", bgcolor: "#f0fdf4", color: "#15803d" }} />}
                                            {item.sizeName       && <Chip label={item.sizeName}       size="small" sx={{ height: 20, fontSize: "0.68rem", bgcolor: "#eff6ff", color: "#1d4ed8" }} />}
                                            {item.threadColorName && <Chip label={item.threadColorName} size="small" sx={{ height: 20, fontSize: "0.68rem", bgcolor: "#fdf4ff", color: "#7e22ce" }} />}
                                            {item.type           && <Chip label={item.type}           size="small" sx={{ height: 20, fontSize: "0.68rem" }} />}
                                        </Stack>
                                    </Box>

                                    {/* Order info */}
                                    <Box sx={{ flex: 1, minWidth: 160 }}>
                                        <Link href={`/orders/${item.order?._id}`} target="_blank" style={{ textDecoration: "none" }}>
                                            <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 0.25 }}>
                                                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#6366f1" }}>
                                                    PO #{item.order?.poNumber}
                                                </Typography>
                                                <OpenInNewIcon sx={{ fontSize: 12, color: "#6366f1" }} />
                                            </Stack>
                                        </Link>
                                        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.75 }}>
                                            {new Date(item.order?.date).toLocaleString()}
                                        </Typography>
                                        <Stack direction="row" flexWrap="wrap" gap={0.5}>
                                            {item.order?.status && (
                                                <Chip label={item.order.status} size="small"
                                                    sx={{ height: 20, fontSize: "0.68rem", bgcolor: "#f0f9ff", color: "#0369a1" }} />
                                            )}
                                            {item.order?.preShipped && (
                                                <Chip icon={<LocalShippingIcon sx={{ fontSize: "12px !important" }} />} label="Pre-shipped" size="small"
                                                    sx={{ height: 20, fontSize: "0.68rem", bgcolor: "#f0fdf4", color: "#15803d" }} />
                                            )}
                                            {item.order?.shippingType && (
                                                <Chip label={item.order.shippingType} size="small"
                                                    sx={{ height: 20, fontSize: "0.68rem" }} />
                                            )}
                                        </Stack>
                                    </Box>

                                    {/* Last step + expand */}
                                    <Box sx={{ minWidth: 160, textAlign: "right" }}>
                                        {lastStep && (
                                            <>
                                                <Stack direction="row" alignItems="center" justifyContent="flex-end" spacing={0.5} sx={{ mb: 0.25 }}>
                                                    <ScheduleIcon sx={{ fontSize: 13, color: "text.disabled" }} />
                                                    <Typography variant="caption" sx={{ fontWeight: 600, color: "text.secondary" }}>
                                                        {lastStep.status}
                                                    </Typography>
                                                </Stack>
                                                <Typography variant="caption" color="text.disabled" sx={{ display: "block" }}>
                                                    {new Date(lastStep.date).toLocaleString()}
                                                </Typography>
                                            </>
                                        )}
                                        <IconButton size="small" onClick={() => setOpened(isOpen ? "" : item._id)}
                                            sx={{ mt: 0.75, color: "text.secondary" }}>
                                            {isOpen ? <KeyboardArrowUpIcon fontSize="small" /> : <KeyboardArrowDownIcon fontSize="small" />}
                                        </IconButton>
                                    </Box>
                                </Box>

                                {/* Expanded steps + notes */}
                                <Collapse in={isOpen}>
                                    <Divider />
                                    <Box sx={{ p: 2, bgcolor: "action.hover" }}>
                                        <Grid2 container spacing={2}>
                                            <Grid2 size={{ xs: 12, sm: 6 }}>
                                                <Typography variant="caption" sx={{ fontWeight: 700, color: "text.disabled", textTransform: "uppercase", letterSpacing: 0.5 }}>
                                                    Steps
                                                </Typography>
                                                <Stack spacing={1} sx={{ mt: 1 }}>
                                                    {item.steps?.map((step, i) => (
                                                        <Box key={i} sx={{ bgcolor: "#fff", borderRadius: 1.5, px: 1.5, py: 1, border: "1px solid", borderColor: "divider" }}>
                                                            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: "0.78rem" }}>
                                                                {i + 1}. {step.status}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.disabled">
                                                                {new Date(step.date).toLocaleString()}
                                                            </Typography>
                                                        </Box>
                                                    ))}
                                                </Stack>
                                            </Grid2>
                                            <Grid2 size={{ xs: 12, sm: 6 }}>
                                                <Typography variant="caption" sx={{ fontWeight: 700, color: "text.disabled", textTransform: "uppercase", letterSpacing: 0.5 }}>
                                                    Notes
                                                </Typography>
                                                <Stack spacing={1} sx={{ mt: 1 }}>
                                                    {item.order?.notes?.length ? item.order.notes.map((note, i) => (
                                                        <Box key={i} sx={{ bgcolor: "#fff", borderRadius: 1.5, px: 1.5, py: 1, border: "1px solid", borderColor: "divider" }}>
                                                            <Typography variant="body2" sx={{ fontSize: "0.78rem" }}>{note.note}</Typography>
                                                            <Typography variant="caption" color="text.disabled">
                                                                {new Date(note.date).toLocaleString()}
                                                            </Typography>
                                                        </Box>
                                                    )) : (
                                                        <Typography variant="caption" color="text.disabled">No notes</Typography>
                                                    )}
                                                </Stack>
                                            </Grid2>
                                        </Grid2>
                                    </Box>
                                </Collapse>
                            </Card>
                        );
                    })}
                </Stack>

                <Box sx={{ mt: 4 }}>
                    <Repull source={source} />
                </Box>
            </Container>
            <Footer />
        </Box>
    );
}

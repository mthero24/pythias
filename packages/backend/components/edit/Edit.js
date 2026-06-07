"use client";
import {
    Box, Container, TextField, Grid2, Typography, Button, Stack, Card,
    Divider, IconButton, Tooltip, InputAdornment, Dialog, DialogTitle,
    DialogActions, DialogContent, Chip,
} from "@mui/material";
import { useState, useRef } from "react";
import AddIcon  from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import SearchIcon        from "@mui/icons-material/Search";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import WcIcon            from "@mui/icons-material/Wc";
import StyleIcon         from "@mui/icons-material/Style";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import CategoryIcon      from "@mui/icons-material/Category";
import SellIcon          from "@mui/icons-material/Sell";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import StorefrontIcon    from "@mui/icons-material/Storefront";
import PrintIcon         from "@mui/icons-material/Print";
import ReplayIcon        from "@mui/icons-material/Replay";
import ListAltIcon       from "@mui/icons-material/ListAlt";
import LocationOnIcon    from "@mui/icons-material/LocationOn";
import axios from "axios";

const CATEGORY_META = {
    seasons:        { label: "Seasons",         Icon: CalendarMonthIcon,  color: "#f59e0b" },
    genders:        { label: "Genders",         Icon: WcIcon,             color: "#8b5cf6" },
    themes:         { label: "Themes",          Icon: StyleIcon,          color: "#ec4899" },
    sportUsedFor:   { label: "Sport Used For",  Icon: FitnessCenterIcon,  color: "#ef4444" },
    departments:    { label: "Departments",     Icon: CategoryIcon,       color: "#6366f1" },
    // brands removed — managed on the dedicated Brands page
    suppliers:      { label: "Suppliers",       Icon: LocalShippingIcon,  color: "#f97316" },
    vendors:        { label: "Vendors",         Icon: StorefrontIcon,     color: "#10b981" },
    printTypes:     { label: "Print Types",     Icon: PrintIcon,          color: "#14b8a6" },
    repullReasons:  { label: "Repull Reasons",  Icon: ReplayIcon,         color: "#6b7280" },
    categories:     { label: "Categories",      Icon: ListAltIcon,        color: "#84cc16" },
    printLocations: { label: "Print Locations", Icon: LocationOnIcon,     color: "#f43f5e" },
};

export function Edit({ data, priceFields = [], brandsPath = null }) {
    const [values, setValues]           = useState(data);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [globalSearch, setGlobalSearch] = useState("");

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        const res = await axios.delete(`/api/admin/oneoffs?id=${deleteTarget.id}&type=${deleteTarget.type}`);
        if (res.status === 200) {
            setValues(prev => ({ ...prev, [deleteTarget.type]: res.data[deleteTarget.type] }));
        }
        setDeleteTarget(null);
    };

    const handleAdd = async (key, value, price, onSuccess) => {
        if (!value?.trim()) return;
        const body = { type: key, value: value.trim() };
        if (price != null && price !== "") body.price = parseFloat(price);
        const res = await axios.post("/api/admin/oneoffs", body);
        if (res.data.error) {
            alert(res.data.msg ?? "Error saving item");
        } else {
            setValues(prev => ({ ...prev, [key]: res.data[key] }));
            onSuccess?.();
        }
    };

    const totalItems = Object.values(values ?? {}).reduce((sum, arr) => sum + (arr?.length ?? 0), 0);

    const globalQ = globalSearch.trim().toLowerCase();
    const visibleKeys = Object.keys(values ?? {}).filter(key => {
        if (!globalQ) return true;
        const meta = CATEGORY_META[key] ?? {};
        if (meta.label?.toLowerCase().includes(globalQ)) return true;
        return (values[key] ?? []).some(item => item.name?.toLowerCase().includes(globalQ));
    });

    return (
        <Box sx={{ backgroundColor: "background.default", minHeight: "100vh" }}>
            <Container maxWidth="lg" sx={{ py: 4 }}>

                {/* Header */}
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 3, flexWrap: "wrap", gap: 2 }}>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                        <Box sx={{ width: 36, height: 36, borderRadius: 2, background: "linear-gradient(135deg, #6366f1 0%, #10b981 100%)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <ListAltIcon sx={{ color: "#fff", fontSize: 20 }} />
                        </Box>
                        <Box>
                            <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: -0.5, lineHeight: 1.2 }}>Marketplace Data</Typography>
                            <Typography variant="body2" color="text.secondary">
                                {totalItems} value{totalItems !== 1 ? "s" : ""} across {Object.keys(values ?? {}).length} categories
                            </Typography>
                        </Box>
                    </Stack>
                    <TextField
                        size="small"
                        placeholder="Search all categories…"
                        value={globalSearch}
                        onChange={(e) => setGlobalSearch(e.target.value)}
                        sx={{ width: 240 }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon fontSize="small" sx={{ color: "text.disabled" }} />
                                </InputAdornment>
                            ),
                            endAdornment: globalSearch ? (
                                <InputAdornment position="end">
                                    <IconButton size="small" edge="end" onClick={() => setGlobalSearch("")}>
                                        <CloseIcon sx={{ fontSize: 14 }} />
                                    </IconButton>
                                </InputAdornment>
                            ) : null,
                        }}
                    />
                </Box>

                {/* Brands moved banner */}
                <Box sx={{ mb: 2, p: 1.5, bgcolor: "action.hover", borderRadius: 1.5, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <SellIcon fontSize="small" sx={{ color: "#0ea5e9" }} />
                        <Typography variant="body2" color="text.secondary">
                            Brands are now managed on their own page, including logo uploads.
                        </Typography>
                    </Stack>
                    {brandsPath && (
                        <Button size="small" variant="outlined" href={brandsPath} sx={{ borderRadius: 1.5, flexShrink: 0 }}>
                            Go to Brands
                        </Button>
                    )}
                </Box>

                {/* No results */}
                {visibleKeys.length === 0 && (
                    <Box sx={{ py: 12, textAlign: "center" }}>
                        <SearchIcon sx={{ fontSize: 48, color: "text.disabled", mb: 1.5 }} />
                        <Typography variant="body1" fontWeight={600} color="text.secondary">No matches for "{globalSearch}"</Typography>
                        <Typography variant="body2" color="text.disabled">Try a different search term</Typography>
                    </Box>
                )}

                <Grid2 container spacing={2}>
                    {visibleKeys.map((key) => {
                        const meta = CATEGORY_META[key] ?? { label: key, Icon: ListAltIcon, color: "#6b7280" };
                        const list = values[key] ?? [];
                        const matchedByLabel = globalQ && meta.label.toLowerCase().includes(globalQ);
                        const filteredByGlobal = globalQ && !matchedByLabel
                            ? list.filter(item => item.name?.toLowerCase().includes(globalQ))
                            : list;

                        return (
                            <Grid2 key={key} size={{ xs: 12, sm: 6, md: 4 }}>
                                <CategoryCard
                                    categoryKey={key}
                                    meta={meta}
                                    list={filteredByGlobal}
                                    totalCount={list.length}
                                    globalQ={globalQ}
                                    showPrice={priceFields.includes(key)}
                                    onAdd={(value, price, onSuccess) => handleAdd(key, value, price, onSuccess)}
                                    onDelete={(id, name) => setDeleteTarget({ type: key, id, name })}
                                />
                            </Grid2>
                        );
                    })}
                </Grid2>
            </Container>

            {/* Delete confirmation dialog */}
            <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    Remove Item
                    <IconButton size="small" onClick={() => setDeleteTarget(null)}>
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary">
                        Remove{" "}
                        <strong style={{ color: "#111827" }}>"{deleteTarget?.name}"</strong>
                        {" "}from {CATEGORY_META[deleteTarget?.type]?.label ?? deleteTarget?.type}? This cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
                    <Button variant="contained" color="error" onClick={confirmDelete}>Remove</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

function CategoryCard({ categoryKey, meta, list, totalCount, globalQ, showPrice = false, onAdd, onDelete }) {
    const { label, Icon, color } = meta;
    const [addVal, setAddVal]   = useState("");
    const [addPrice, setAddPrice] = useState("");
    const [search, setSearch]   = useState("");
    const inputRef              = useRef(null);

    const sorted = [...list].sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));

    const localQ = search.trim().toLowerCase();
    const displayed = localQ
        ? sorted.filter(item => item.name?.toLowerCase().includes(localQ))
        : sorted;

    const handleAdd = () => {
        onAdd(addVal, showPrice ? addPrice : null, () => {
            setAddVal("");
            setAddPrice("");
            inputRef.current?.focus();
        });
    };

    return (
        <Card variant="outlined" sx={{
            borderRadius: 3, overflow: "hidden",
            transition: "box-shadow 150ms",
            "&:hover": { boxShadow: "0 4px 16px rgba(0,0,0,0.08)" },
        }}>
            {/* Card header */}
            <Stack
                direction="row" alignItems="center" spacing={1.25}
                sx={{ px: 2, py: 1.5, borderBottom: "1px solid", borderColor: "divider" }}
            >
                <Box sx={{ width: 28, height: 28, borderRadius: 1.5, bgcolor: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon sx={{ fontSize: 15, color }} />
                </Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, flex: 1 }}>{label}</Typography>
                <Chip
                    label={totalCount}
                    size="small"
                    sx={{ height: 18, fontSize: "0.65rem", fontWeight: 700, bgcolor: `${color}15`, color, border: `1px solid ${color}30` }}
                />
            </Stack>

            {/* Add input */}
            <Box sx={{ px: 2, pt: 1.5, pb: 1 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                    <TextField
                        inputRef={inputRef}
                        size="small"
                        fullWidth
                        placeholder={`Add ${label.toLowerCase()}…`}
                        value={addVal}
                        onChange={(e) => setAddVal(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
                        InputProps={{
                            endAdornment: !showPrice ? (
                                <InputAdornment position="end">
                                    <Tooltip title="Add (Enter)">
                                        <span>
                                            <IconButton size="small" edge="end" onClick={handleAdd} disabled={!addVal.trim()} sx={{ color: addVal.trim() ? color : undefined }}>
                                                <AddIcon fontSize="small" />
                                            </IconButton>
                                        </span>
                                    </Tooltip>
                                </InputAdornment>
                            ) : null,
                        }}
                    />
                    {showPrice && (
                        <TextField
                            size="small"
                            placeholder="+$"
                            value={addPrice}
                            onChange={(e) => setAddPrice(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
                            sx={{ width: 80 }}
                            inputProps={{ type: "number", min: 0, step: 0.01 }}
                        />
                    )}
                    {showPrice && (
                        <Tooltip title="Add (Enter)">
                            <span>
                                <IconButton size="small" onClick={handleAdd} disabled={!addVal.trim()} sx={{ color: addVal.trim() ? color : undefined }}>
                                    <AddIcon fontSize="small" />
                                </IconButton>
                            </span>
                        </Tooltip>
                    )}
                </Stack>
            </Box>

            <Divider />

            {/* Per-card search (only when many items and no global search) */}
            {totalCount > 10 && !globalQ && (
                <Box sx={{ px: 2, pt: 1 }}>
                    <TextField
                        size="small" fullWidth
                        placeholder="Filter…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon sx={{ fontSize: 14, color: "text.disabled" }} />
                                </InputAdornment>
                            ),
                            endAdornment: search ? (
                                <InputAdornment position="end">
                                    <IconButton size="small" edge="end" onClick={() => setSearch("")}>
                                        <CloseIcon sx={{ fontSize: 12 }} />
                                    </IconButton>
                                </InputAdornment>
                            ) : null,
                            sx: { fontSize: "0.8rem" },
                        }}
                    />
                </Box>
            )}

            {/* Chips — wraps naturally, no inner scroll */}
            <Box sx={{ px: 2, pt: 1.25, pb: 1.75 }}>
                {displayed.length === 0 ? (
                    <Typography variant="caption" color="text.disabled">
                        {(localQ || globalQ) ? "No matches" : `No ${label.toLowerCase()} yet`}
                    </Typography>
                ) : (
                    <Stack direction="row" flexWrap="wrap" gap={0.75}>
                        {displayed.map((item, idx) => (
                            <Chip
                                key={item._id ?? idx}
                                label={item.price != null ? `${item.name} (+$${Number(item.price).toFixed(2)})` : item.name}
                                size="small"
                                onDelete={() => onDelete(item._id, item.name)}
                                deleteIcon={<CloseIcon />}
                                sx={{
                                    height: 26, fontSize: "0.78rem",
                                    bgcolor: `${color}12`,
                                    border: `1px solid ${color}28`,
                                    "& .MuiChip-deleteIcon": {
                                        fontSize: 13, color: `${color}60`,
                                        "&:hover": { color },
                                    },
                                }}
                            />
                        ))}
                    </Stack>
                )}
            </Box>
        </Card>
    );
}

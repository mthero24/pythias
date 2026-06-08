"use client";
import { useState, useEffect, useMemo } from "react";
import {
    Box, Typography, TextField, InputAdornment, Chip, CircularProgress,
    Card, CardContent, CardMedia, Collapse, Grid, Tooltip,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import HubIcon from "@mui/icons-material/Hub";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

function dollars(cents) {
    return `$${(cents / 100).toFixed(2)}`;
}

function priceRange(sizes) {
    const prices = sizes.flatMap(s => s.providers.map(p => p.wholesalePrice));
    if (!prices.length) return "—";
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return min === max ? dollars(min) : `${dollars(min)}–${dollars(max)}`;
}

function SizeRow({ size }) {
    const availableProviders = size.providers.filter(p => p.available);
    const lowestPrice = size.providers.reduce((min, p) =>
        p.available && p.wholesalePrice < min ? p.wholesalePrice : min,
        Infinity
    );

    return (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, py: 0.5, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <Typography sx={{ width: 48, fontWeight: 600, fontSize: "0.82rem", color: "#f0f0f0" }}>{size.size}</Typography>
            <Box sx={{ flex: 1, display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                {size.providers.map((p, i) => (
                    <Tooltip key={i} title={`${p.providerName} — ${dollars(p.wholesalePrice)} — ${p.leadTimeDays}d lead time`}>
                        <Chip
                            size="small"
                            label={p.providerName}
                            icon={p.available ? <CheckCircleIcon sx={{ fontSize: "12px !important", color: "#4caf50 !important" }} /> : undefined}
                            sx={{
                                height: 22,
                                fontSize: "0.68rem",
                                bgcolor: p.available ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.05)",
                                color: p.available ? "#a5b4fc" : "#666",
                                border: `1px solid ${p.available ? "rgba(99,102,241,0.4)" : "rgba(255,255,255,0.1)"}`,
                            }}
                        />
                    </Tooltip>
                ))}
            </Box>
            <Typography sx={{ fontSize: "0.78rem", color: availableProviders.length ? "#4caf50" : "#666", minWidth: 60, textAlign: "right" }}>
                {availableProviders.length ? dollars(lowestPrice) : "unavailable"}
            </Typography>
        </Box>
    );
}

function ColorSection({ colorData }) {
    const [open, setOpen] = useState(false);
    return (
        <Box sx={{ mb: 0.5 }}>
            <Box
                onClick={() => setOpen(o => !o)}
                sx={{ display: "flex", alignItems: "center", gap: 1, py: 0.75, cursor: "pointer", "&:hover": { bgcolor: "rgba(255,255,255,0.03)" }, borderRadius: 1, px: 1 }}
            >
                <Box sx={{ width: 16, height: 16, borderRadius: "50%", bgcolor: colorData.color.hexcode || "#888", border: "1px solid rgba(255,255,255,0.2)", flexShrink: 0 }} />
                <Typography sx={{ flex: 1, fontSize: "0.82rem", color: "#ccc" }}>{colorData.color.name}</Typography>
                <Typography sx={{ fontSize: "0.75rem", color: "#888" }}>{priceRange(colorData.sizes)}</Typography>
                {open ? <ExpandLessIcon sx={{ fontSize: 16, color: "#666" }} /> : <ExpandMoreIcon sx={{ fontSize: 16, color: "#666" }} />}
            </Box>
            <Collapse in={open}>
                <Box sx={{ pl: 2, pr: 1, pb: 1 }}>
                    {colorData.sizes.map(s => <SizeRow key={s.size} size={s} />)}
                </Box>
            </Collapse>
        </Box>
    );
}

function BlankCard({ blankData }) {
    const [open, setOpen] = useState(false);
    const totalAvailableProviders = new Set(
        blankData.colors.flatMap(c => c.sizes.flatMap(s => s.providers.filter(p => p.available).map(p => p.providerId)))
    ).size;

    return (
        <Card sx={{ bgcolor: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 2 }}>
            <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, mb: 1 }}>
                    {blankData.blank?.images?.[0] && (
                        <Box component="img" src={blankData.blank.images[0]} alt={blankData.blank.name}
                            sx={{ width: 48, height: 48, objectFit: "cover", borderRadius: 1, flexShrink: 0, bgcolor: "#2a2a2a" }}
                        />
                    )}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography fontWeight={700} sx={{ color: "#f0f0f0", fontSize: "0.9rem" }} noWrap>
                            {blankData.blank?.name || blankData.blank?.code}
                        </Typography>
                        <Typography sx={{ fontSize: "0.75rem", color: "#888" }}>
                            {blankData.colors.length} color{blankData.colors.length !== 1 ? "s" : ""} &middot; {totalAvailableProviders} provider{totalAvailableProviders !== 1 ? "s" : ""}
                        </Typography>
                    </Box>
                    <Box
                        onClick={() => setOpen(o => !o)}
                        sx={{ cursor: "pointer", color: "#6366f1", fontSize: "0.78rem", fontWeight: 600, display: "flex", alignItems: "center", gap: 0.4, flexShrink: 0 }}
                    >
                        {open ? "Hide" : "View"}
                        {open ? <ExpandLessIcon sx={{ fontSize: 14 }} /> : <ExpandMoreIcon sx={{ fontSize: 14 }} />}
                    </Box>
                </Box>
                <Collapse in={open}>
                    {blankData.colors.map(c => <ColorSection key={c.color?._id} colorData={c} />)}
                </Collapse>
            </CardContent>
        </Card>
    );
}

export default function ProviderCatalogPage() {
    const [catalog, setCatalog] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        fetch("/api/fulfillment/catalog")
            .then(r => r.json())
            .then(d => { if (!d.error) setCatalog(d.catalog); })
            .finally(() => setLoading(false));
    }, []);

    const filtered = useMemo(() => {
        if (!search.trim()) return catalog;
        const q = search.toLowerCase();
        return catalog.filter(b =>
            b.blank?.name?.toLowerCase().includes(q) ||
            b.blank?.code?.toLowerCase().includes(q) ||
            b.colors.some(c => c.color?.name?.toLowerCase().includes(q))
        );
    }, [catalog, search]);

    return (
        <Box sx={{ p: 3, maxWidth: 900, mx: "auto" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
                <HubIcon sx={{ color: "#6366f1", fontSize: 28 }} />
                <Box>
                    <Typography variant="h5" fontWeight={700} sx={{ color: "#f0f0f0" }}>Provider Catalog</Typography>
                    <Typography variant="caption" sx={{ color: "#888" }}>Browse blanks available from fulfillment providers</Typography>
                </Box>
            </Box>

            <TextField
                fullWidth
                size="small"
                placeholder="Search blanks or colors…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: "#666" }} /></InputAdornment> }}
                sx={{ mb: 3, "& .MuiOutlinedInput-root": { bgcolor: "#1a1a1a", "& fieldset": { borderColor: "#2a2a2a" }, "&:hover fieldset": { borderColor: "#444" }, "&.Mui-focused fieldset": { borderColor: "#6366f1" } }, input: { color: "#f0f0f0" } }}
            />

            {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                    <CircularProgress sx={{ color: "#6366f1" }} />
                </Box>
            ) : filtered.length === 0 ? (
                <Typography sx={{ color: "#666", textAlign: "center", py: 8 }}>
                    {search ? "No blanks match your search." : "No items in the provider catalog yet."}
                </Typography>
            ) : (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                    {filtered.map(b => <BlankCard key={b.blank?._id} blankData={b} />)}
                </Box>
            )}
        </Box>
    );
}

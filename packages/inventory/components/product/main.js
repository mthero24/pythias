"use client";
import { Typography, Grid2, Button, TextField, Box, Stack, Pagination, PaginationItem, MenuItem, Chip, InputAdornment, Collapse, IconButton, Tooltip, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, Alert, Select, FormControl, InputLabel } from "@mui/material";
import Image from "next/image";
import { useState } from "react";
import SearchIcon from "@mui/icons-material/Search";
import TuneIcon from "@mui/icons-material/Tune";
import DownloadIcon from "@mui/icons-material/Download";
import CloseIcon from "@mui/icons-material/Close";
import InventoryIcon from "@mui/icons-material/Inventory";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ImageNotSupportedIcon from "@mui/icons-material/ImageNotSupported";
import axios from "axios";

function ItemImage({ src, size = 72 }) {
    const [error, setError] = useState(false);
    if (!src || error) {
        return (
            <Box sx={{ width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "action.hover", borderRadius: 1.5, flexShrink: 0 }}>
                <ImageNotSupportedIcon sx={{ color: "text.disabled", fontSize: size * 0.45 }} />
            </Box>
        );
    }
    return <Image src={src} width={size} height={size} alt="product" style={{ objectFit: "cover", borderRadius: 6, background: "#e3e3e3", flexShrink: 0 }} onError={() => setError(true)} />;
}

function getImage(item) {
    for (const key of Object.keys(item.design?.images || {})) {
        const dimage = item.design?.images[key];
        if (!dimage) continue;
        const blankImage = item.blank?.images?.find(im => im.boxes && im.boxes[key] && im.color?.toString() === item.color?._id?.toString());
        if (!blankImage) return dimage;
        const filename = blankImage.image.split("/").pop().split(".")[0];
        return `/api/renderImage/${item.design.sku}-${item.blank.code}-${filename}-${item.color.name}-${key}.jpg`;
    }
    return null;
}

function navigate(query, page, filters) {
    window.location.href = `/inventory/product?q=${query}&page=${page}&filter=${JSON.stringify(filters)}`;
}

export function productMain({ inventory, q, totalCount, totalValue, p, blanks, fils, hasEbay = false }) {
    const [query, setQuery]           = useState(q || "");
    const [count]                     = useState(totalCount || 0);
    const [page, setPage]             = useState(p || 1);
    const [filterOpen, setFilterOpen] = useState(typeof fils === "string" || (typeof fils === "object" && fils !== null && Object.keys(fils).length > 0));
    const [filters, setFilters]       = useState(typeof fils === "string" ? JSON.parse(fils) : (typeof fils === "object" && fils !== null ? fils : {}));
    const [invs, setInvs]             = useState(inventory || []);

    // eBay listing dialog
    const [ebayTarget,      setEbayTarget]      = useState(null);
    const [ebayConnections, setEbayConnections] = useState([]);
    const [ebayConnection,  setEbayConnection]  = useState("");
    const [ebayPrice,       setEbayPrice]       = useState("");
    const [ebayBrand,       setEbayBrand]       = useState("");
    const [ebayBrands,      setEbayBrands]      = useState([]);
    const [ebayListing,     setEbayListing]     = useState(false);
    const [ebayError,       setEbayError]       = useState("");
    const [ebaySuccess,     setEbaySuccess]     = useState("");

    const openEbayDialog = async (item) => {
        setEbayTarget(item);
        setEbayPrice(item.size?.cost ? String(item.size.cost) : "");
        setEbayBrand("");
        setEbayError("");
        setEbaySuccess("");
        const [connsRes, brandsRes] = await Promise.allSettled([
            ebayConnections.length === 0 ? axios.get("/api/admin/integrations") : Promise.resolve(null),
            ebayBrands.length === 0      ? axios.get("/api/admin/brands")        : Promise.resolve(null),
        ]);
        if (connsRes.status === "fulfilled" && connsRes.value) {
            const conns = (connsRes.value.data.integration ?? []).filter(c => c.type === "ebay");
            setEbayConnections(conns);
            setEbayConnection(conns[0]?._id ?? "");
        } else if (ebayConnections.length > 0) {
            setEbayConnection(ebayConnections[0]?._id ?? "");
        }
        if (brandsRes.status === "fulfilled" && brandsRes.value) {
            setEbayBrands(brandsRes.value.data.brands ?? []);
        }
    };

    const submitEbayListing = async () => {
        if (!ebayConnection) { setEbayError("Select an eBay connection"); return; }
        if (!ebayPrice)      { setEbayError("Enter a price"); return; }
        setEbayListing(true); setEbayError(""); setEbaySuccess("");
        try {
            const res = await axios.post("/api/integrations/ebay/list-inventory", {
                connectionId: ebayConnection,
                variantSku:   ebayTarget.sku,
                price:        parseFloat(ebayPrice),
                brand:        ebayBrand || undefined,
            });
            const listingId = res.data?.listingId;
            setEbaySuccess(listingId ? `Listed! eBay ID: ${listingId}` : "Listed on eBay successfully!");
        } catch (e) {
            setEbayError(e.response?.data?.error ?? "Failed to list on eBay");
        } finally {
            setEbayListing(false);
        }
    };

    const applyFilter = (newFilters) => {
        setFilters(newFilters);
        navigate(query, 1, newFilters);
    };

    const saveQuantity = async (id, quantity) => {
        await axios.post("/api/admin/inventory/product/update", { id, quantity })
            .catch(() => alert("Error saving quantity"));
    };

    const saveLocation = async (id, location) => {
        await axios.post("/api/admin/inventory/product/update", { id, location })
            .catch(() => alert("Error saving location"));
    };

    const updateQuantity = (id, value) => {
        setInvs(prev => prev.map(i => i._id === id ? { ...i, quantity: parseInt(value) || 0 } : i));
    };

    const updateLocation = (id, value) => {
        setInvs(prev => prev.map(i => i._id === id ? { ...i, location: value } : i));
    };

    const [csvLoading, setCsvLoading] = useState(false);

    const downloadCsv = async () => {
        setCsvLoading(true);
        const res = await axios.get("/api/admin/inventory/product/export")
            .catch(() => { alert("Error downloading CSV"); setCsvLoading(false); return null; });
        if (!res) return;
        const cell = v => `"${String(v ?? "").replace(/"/g, '""')}"`;
        const rows = [
            ["SKU", "Design", "Blank", "Color", "Size", "Quantity", "Location"],
            ...res.data.items.map(i => [i.sku, i.designSku, i.blankCode, i.colorName, i.sizeName, i.quantity, i.location ?? ""]),
        ];
        const csv = rows.map(r => r.map(cell).join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "product-inventory.csv";
        a.click();
        URL.revokeObjectURL(url);
        setCsvLoading(false);
    };

    const activeFilterCount = Object.values(filters).filter(Boolean).length;

    return (
        <Box sx={{ bgcolor: "background.default", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
            {/* Header */}
            <Box sx={{ bgcolor: "background.paper", borderBottom: "1px solid", borderColor: "divider", px: 2, py: 2 }}>
                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
                    <Box sx={{ width: 36, height: 36, borderRadius: 2, background: "linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <InventoryIcon sx={{ color: "#fff", fontSize: 20 }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                        <Stack direction="row" alignItems="baseline" spacing={1.5}>
                            <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: -0.5, lineHeight: 1.2 }}>Product Inventory</Typography>
                            {totalValue > 0 && (
                                <Tooltip title="Total cost value of all in-stock product inventory (quantity × cost per size)">
                                    <Chip
                                        label={`$${totalValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                        size="small"
                                        color="success"
                                        variant="outlined"
                                        sx={{ fontWeight: 700, fontFamily: "monospace" }}
                                    />
                                </Tooltip>
                            )}
                        </Stack>
                        <Typography variant="body2" color="text.secondary">
                            {count > 0 ? `${count.toLocaleString()} items` : "Search or filter to browse"}
                        </Typography>
                    </Box>
                    <Stack direction="row" spacing={1}>
                        <Tooltip title="Download all in-stock product inventory as CSV">
                            <Button
                                variant="outlined"
                                size="small"
                                startIcon={csvLoading ? <CircularProgress size={14} color="inherit" /> : <DownloadIcon />}
                                onClick={downloadCsv}
                                disabled={csvLoading}
                            >
                                CSV
                            </Button>
                        </Tooltip>
                        <Button
                            variant={filterOpen ? "contained" : "outlined"}
                            size="small"
                            startIcon={<TuneIcon />}
                            onClick={() => setFilterOpen(!filterOpen)}
                            endIcon={activeFilterCount > 0 ? <Chip label={activeFilterCount} size="small" color="error" sx={{ height: 16, fontSize: "0.65rem", "& .MuiChip-label": { px: 0.5 } }} /> : undefined}
                        >
                            Filters
                        </Button>
                    </Stack>
                </Stack>

                {/* Search */}
                <TextField
                    fullWidth
                    placeholder="Search by SKU or design…"
                    size="small"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") navigate(query, 1, filters); }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon sx={{ color: "text.disabled", cursor: "pointer" }} onClick={() => navigate(query, 1, filters)} />
                            </InputAdornment>
                        ),
                    }}
                />

                {/* Filters */}
                <Collapse in={filterOpen}>
                    <Box sx={{ mt: 1.5 }}>
                        <Grid2 container spacing={1} alignItems="center">
                            <Grid2 size={{ xs: 12, sm: 4 }}>
                                <TextField select fullWidth size="small" label="Style Code" value={filters.blank ?? ""}
                                    onChange={(e) => applyFilter({ blank: e.target.value })}>
                                    {blanks?.map(b => <MenuItem key={b.code} value={b.code}>{b.code}</MenuItem>)}
                                </TextField>
                            </Grid2>
                            <Grid2 size={{ xs: 12, sm: 4 }}>
                                <TextField select fullWidth size="small" label="Color" value={filters.color ?? ""} disabled={!filters.blank}
                                    onChange={(e) => applyFilter({ ...filters, color: e.target.value })}>
                                    {blanks?.find(b => b.code === filters.blank)?.colors.map(c => <MenuItem key={c.name} value={c.name}>{c.name}</MenuItem>)}
                                </TextField>
                            </Grid2>
                            <Grid2 size={{ xs: 12, sm: 3 }}>
                                <TextField select fullWidth size="small" label="Size" value={filters.size ?? ""} disabled={!filters.blank}
                                    onChange={(e) => applyFilter({ ...filters, size: e.target.value })}>
                                    {blanks?.find(b => b.code === filters.blank)?.sizes.map(s => <MenuItem key={s.name} value={s.name}>{s.name}</MenuItem>)}
                                </TextField>
                            </Grid2>
                            <Grid2 size={{ xs: 12, sm: 1 }} sx={{ display: "flex", justifyContent: "flex-end" }}>
                                <Tooltip title="Clear all filters">
                                    <IconButton size="small" onClick={() => applyFilter({})} disabled={activeFilterCount === 0}>
                                        <CloseIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            </Grid2>
                        </Grid2>
                    </Box>
                </Collapse>
            </Box>

            {/* List */}
            <Box sx={{ px: 2, py: 2, flex: 1 }}>
                {invs.length === 0 && (
                    <Box sx={{ textAlign: "center", py: 8, color: "text.secondary" }}>
                        <InventoryIcon sx={{ fontSize: 48, mb: 1, opacity: 0.3 }} />
                        <Typography>No results — try a different search or filter</Typography>
                    </Box>
                )}

                {/* Column headers */}
                {invs.length > 0 && (
                    <Grid2 container spacing={1} alignItems="center" sx={{ px: 1, mb: 0.5 }}>
                        <Grid2 size={1} />
                        <Grid2 size={2.5}><Typography variant="caption" fontWeight={700} color="text.secondary">SKU</Typography></Grid2>
                        <Grid2 size={1.5}><Typography variant="caption" fontWeight={700} color="text.secondary">Blank</Typography></Grid2>
                        <Grid2 size={1.5}><Typography variant="caption" fontWeight={700} color="text.secondary">Color</Typography></Grid2>
                        <Grid2 size={1}><Typography variant="caption" fontWeight={700} color="text.secondary">Size</Typography></Grid2>
                        <Grid2 size={1.5}><Typography variant="caption" fontWeight={700} color="text.secondary">Quantity</Typography></Grid2>
                        <Grid2 size={hasEbay ? 2 : 3}><Typography variant="caption" fontWeight={700} color="text.secondary">Location</Typography></Grid2>
                        {hasEbay && <Grid2 size={1} />}
                    </Grid2>
                )}

                <Stack spacing={0.75}>
                    {invs.map(item => {
                        const image = getImage(item);
                        const outOfStock = item.quantity === 0;
                        return (
                            <Box
                                key={item._id}
                                sx={{
                                    bgcolor: outOfStock ? "#fef2f2" : "background.paper",
                                    border: "1px solid",
                                    borderColor: outOfStock ? "#fca5a5" : "divider",
                                    borderLeft: outOfStock ? "3px solid #ef4444" : "3px solid transparent",
                                    borderRadius: 2,
                                    px: 1.5,
                                    py: 1,
                                }}
                            >
                                <Grid2 container spacing={1} alignItems="center">
                                    <Grid2 size={1} sx={{ display: "flex", justifyContent: "center" }}>
                                        <ItemImage src={image} size={64} />
                                    </Grid2>
                                    <Grid2 size={2.5}>
                                        <Typography variant="body2" sx={{ fontFamily: "monospace", fontWeight: 600, wordBreak: "break-all", fontSize: "0.75rem" }}>
                                            {item.sku}
                                        </Typography>
                                        {item.design?.sku && (
                                            <Typography variant="caption" color="text.secondary">Design: {item.design.sku}</Typography>
                                        )}
                                    </Grid2>
                                    <Grid2 size={1.5}>
                                        <Chip label={item.blank?.code ?? "—"} size="small" color="primary" variant="outlined" sx={{ fontFamily: "monospace", fontWeight: 700 }} />
                                    </Grid2>
                                    <Grid2 size={1.5}>
                                        <Typography variant="body2" sx={{ textTransform: "capitalize" }}>{item.color?.name ?? "—"}</Typography>
                                    </Grid2>
                                    <Grid2 size={1}>
                                        <Chip label={item.size?.name ?? "—"} size="small" variant="outlined" sx={{ textTransform: "uppercase", fontWeight: 600 }} />
                                    </Grid2>
                                    <Grid2 size={1.5}>
                                        <Stack direction="row" alignItems="center" spacing={1}>
                                            <TextField
                                                size="small"
                                                type="number"
                                                value={item.quantity}
                                                inputProps={{ min: 0, style: { fontWeight: 700, color: outOfStock ? "#ef4444" : undefined } }}
                                                onChange={(e) => updateQuantity(item._id, e.target.value)}
                                                onBlur={(e) => saveQuantity(item._id, parseInt(e.target.value) || 0)}
                                                sx={{ width: 90 }}
                                            />
                                            {outOfStock && <Chip label="OOS" size="small" color="error" sx={{ fontWeight: 700, fontSize: "0.6rem", height: 18, "& .MuiChip-label": { px: 0.75 } }} />}
                                        </Stack>
                                    </Grid2>
                                    <Grid2 size={hasEbay ? 2 : 3}>
                                        <TextField
                                            size="small"
                                            fullWidth
                                            placeholder="Not set"
                                            value={item.location ?? ""}
                                            onChange={(e) => updateLocation(item._id, e.target.value)}
                                            onBlur={(e) => saveLocation(item._id, e.target.value)}
                                        />
                                    </Grid2>
                                    {hasEbay && <Grid2 size={1} sx={{ display: "flex", justifyContent: "center" }}>
                                        <Tooltip title="List this item on eBay">
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                onClick={() => openEbayDialog(item)}
                                                sx={{ minWidth: 0, px: 1, fontSize: "0.65rem", fontWeight: 700, borderColor: "#E53238", color: "#E53238", "&:hover": { bgcolor: "#fef2f2", borderColor: "#E53238" } }}
                                            >
                                                eBay
                                            </Button>
                                        </Tooltip>
                                    </Grid2>}
                                </Grid2>
                            </Box>
                        );
                    })}
                </Stack>
            </Box>

            {/* eBay listing dialog */}
            <Dialog open={hasEbay && !!ebayTarget} onClose={() => { if (!ebayListing) setEbayTarget(null); }} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ fontWeight: 700 }}>List on eBay</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        {ebayTarget && (
                            <Typography variant="body2" color="text.secondary" sx={{ fontFamily: "monospace" }}>
                                {ebayTarget.sku}
                            </Typography>
                        )}
                        {ebayConnections.length > 1 && (
                            <FormControl size="small" fullWidth>
                                <InputLabel>eBay Account</InputLabel>
                                <Select value={ebayConnection} label="eBay Account" onChange={e => setEbayConnection(e.target.value)}>
                                    {ebayConnections.map(c => (
                                        <MenuItem key={c._id} value={c._id}>{c.displayName}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        )}
                        <TextField
                            label="Price"
                            size="small"
                            fullWidth
                            type="number"
                            inputProps={{ min: 0, step: 0.01 }}
                            value={ebayPrice}
                            onChange={e => setEbayPrice(e.target.value)}
                            InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                        />
                        <FormControl size="small" fullWidth>
                            <InputLabel>Brand (optional)</InputLabel>
                            <Select
                                value={ebayBrand}
                                label="Brand (optional)"
                                onChange={e => setEbayBrand(e.target.value)}
                            >
                                <MenuItem value=""><em>None (uses product brand)</em></MenuItem>
                                {ebayBrands.map(b => (
                                    <MenuItem key={b._id ?? b.name} value={b.name}>{b.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        {ebayError   && <Alert severity="error"   sx={{ py: 0 }}>{ebayError}</Alert>}
                        {ebaySuccess && <Alert severity="success" sx={{ py: 0 }}>{ebaySuccess}</Alert>}
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEbayTarget(null)} disabled={ebayListing}>Cancel</Button>
                    <Button
                        variant="contained"
                        disabled={ebayListing || !!ebaySuccess}
                        onClick={submitEbayListing}
                        sx={{ bgcolor: "#E53238", "&:hover": { bgcolor: "#c42028" } }}
                        startIcon={ebayListing ? <CircularProgress size={14} color="inherit" /> : null}
                    >
                        {ebayListing ? "Listing…" : "List on eBay"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Pagination */}
            {count > 0 && (
                <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
                    <Pagination
                        count={Math.ceil(count / 50)}
                        page={page}
                        variant="outlined"
                        shape="rounded"
                        showFirstButton
                        showLastButton
                        renderItem={(item) => (
                            <PaginationItem slots={{ previous: ArrowBackIcon, next: ArrowForwardIcon }} {...item} />
                        )}
                        onChange={(e, value) => {
                            setPage(value);
                            navigate(query, value, filters);
                        }}
                    />
                </Box>
            )}
        </Box>
    );
}

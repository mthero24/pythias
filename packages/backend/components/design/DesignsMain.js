"use client";
import {
    Box, Grid2, Typography, Card, CardContent, CardActionArea, Button,
    Container, Pagination, Stack, InputAdornment, TextField, Chip, Divider, Tooltip
} from "@mui/material";
import { useState } from "react";
import axios from "axios";
import Link from "next/link";
import { Footer } from "../reusable/Footer";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";

const MAX_THUMBS = 5;

export function Main({ designs, ct, query, pa, canEdit = true }) {
    const [designss, setDesigns] = useState(designs);
    const [search, setSearch] = useState(query ?? "");
    const [page, setPage] = useState(pa ? parseInt(pa) : 1);
    const [count, setCount] = useState(ct);
    const [searching, setSearching] = useState(false);

    const createDesign = async () => {
        let res = await axios.post("/api/admin/designs", {});
        if (res.data.error) alert(res.data.msg);
        else location.href = `/admin/design/${res.data.design._id}`;
    };

    const handlePageChange = (_, value) => {
        location.href = `/admin/designs?page=${value}${search ? `&q=${search}` : ""}`;
    };

    const runSearch = async () => {
        setSearching(true);
        try {
            const res = await axios.get(`/api/admin/designs?${search ? `q=${search}&` : ""}page=1`);
            if (res.data.error) { alert(res.data.msg); return; }
            const newCount = res.data.designs[0]?.meta?.count?.total ?? res.data.count;
            if (newCount != null) setCount(newCount);
            setDesigns(res.data.designs);
            setPage(1);
        } finally {
            setSearching(false);
        }
    };

    return (
        <Box sx={{ width: "100%", maxWidth: "100%", overflowX: "hidden" }}>
            <Container maxWidth="lg" sx={{ minHeight: "90vh" }}>

                {/* Header */}
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, flexWrap: "wrap", gap: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Designs{" "}
                        <Typography component="span" variant="h6" color="text.secondary" sx={{ fontWeight: 400 }}>
                            ({count})
                        </Typography>
                    </Typography>
                    {canEdit && (
                        <Button variant="contained" startIcon={<AddIcon />} onClick={createDesign}>
                            Create Design
                        </Button>
                    )}
                </Box>

                {/* Search */}
                <Box sx={{ mb: 2, p: 2, borderRadius: 2, background: "#fff", boxShadow: "0px 0px 10px rgba(0,0,0,.1)" }}>
                    <TextField
                        fullWidth
                        variant="outlined"
                        placeholder="Search by SKU or name…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") runSearch(); }}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end" sx={{ cursor: "pointer" }} onClick={runSearch}>
                                    <SearchIcon />
                                </InputAdornment>
                            ),
                        }}
                    />
                </Box>

                {/* Grid */}
                <Grid2 container spacing={2}>
                    {designss.length === 0 && (
                        <Typography sx={{ textAlign: "center", width: "100%", fontWeight: "bold", fontSize: "1.5rem", py: 8 }}>
                            No designs found
                        </Typography>
                    )}
                    {designss.map((d) => {
                        // Collect image URLs
                        const imageEntries = Object.values(d.images ?? {})
                            .filter(Boolean)
                            .map(url => url.replace("images1.pythiastechnologies.com", "images2.pythiastechnologies.com/origin"));
                        const [primaryUrl, ...others] = imageEntries;

                        return (
                            <Grid2 key={d._id} size={{ xs: 6, sm: 4, md: 3 }}>
                                <Card
                                    variant="outlined"
                                    sx={{
                                        height: "100%", display: "flex", flexDirection: "column",
                                        borderRadius: 2,
                                        transition: "box-shadow 150ms",
                                        "&:hover": { boxShadow: 4 },
                                    }}
                                >
                                    <Link href={`/admin/design/${d._id}`} target="_blank" style={{ textDecoration: "none", display: "flex", flexDirection: "column", flex: 1 }}>
                                        {/* Primary image */}
                                        <Box sx={{
                                            position: "relative",
                                            aspectRatio: "1 / 1",
                                            backgroundColor: "background.default",
                                            overflow: "hidden",
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                        }}>
                                            <img
                                                src={primaryUrl ? `${primaryUrl}?width=400` : "/missingImage.jpg"}
                                                alt={d.name}
                                                style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
                                            />
                                            <Box sx={{
                                                position: "absolute", top: 6, right: 6,
                                                opacity: 0, transition: "opacity 150ms",
                                                ".MuiCard-root:hover &": { opacity: 1 },
                                            }}>
                                                <Tooltip title="Open design" placement="top">
                                                    <Box sx={{ backgroundColor: "rgba(255,255,255,0.9)", borderRadius: 1, p: 0.4, display: "flex" }}>
                                                        <OpenInNewIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                                                    </Box>
                                                </Tooltip>
                                            </Box>
                                        </Box>

                                        {/* Thumbnail strip */}
                                        {others.length > 0 && (
                                            <>
                                                <Divider />
                                                <Box sx={{ display: "flex", gap: 0.5, px: 1, py: 0.75, flexWrap: "nowrap", overflowX: "auto" }}>
                                                    {others.slice(0, MAX_THUMBS).map((img, i) => (
                                                        <Box
                                                            key={i}
                                                            sx={{
                                                                width: 40, height: 40, flexShrink: 0,
                                                                border: "1px solid", borderColor: "divider",
                                                                borderRadius: 0.75, overflow: "hidden",
                                                                backgroundColor: "background.default",
                                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                            }}
                                                        >
                                                            <img src={`${img}?width=100`} alt="" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                                                        </Box>
                                                    ))}
                                                    {others.length > MAX_THUMBS && (
                                                        <Box sx={{
                                                            width: 40, height: 40, flexShrink: 0,
                                                            border: "1px solid", borderColor: "divider",
                                                            borderRadius: 0.75, backgroundColor: "background.default",
                                                            display: "flex", alignItems: "center", justifyContent: "center",
                                                        }}>
                                                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: "0.65rem" }}>
                                                                +{others.length - MAX_THUMBS}
                                                            </Typography>
                                                        </Box>
                                                    )}
                                                </Box>
                                            </>
                                        )}

                                        <Divider />

                                        {/* Info */}
                                        <CardContent sx={{ p: "10px !important" }}>
                                            <Typography
                                                variant="body2"
                                                sx={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "text.primary" }}
                                                title={d.name}
                                            >
                                                {d.name || "—"}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" sx={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                {d.sku}
                                            </Typography>
                                            {d.products?.length > 0 && (
                                                <Chip
                                                    size="small"
                                                    label={`${d.products.length} product${d.products.length === 1 ? "" : "s"}`}
                                                    sx={{ mt: 0.75, fontSize: "0.62rem", height: 18 }}
                                                    variant="outlined"
                                                />
                                            )}
                                        </CardContent>
                                    </Link>
                                </Card>
                            </Grid2>
                        );
                    })}
                </Grid2>

                {/* Pagination */}
                <Stack spacing={2} sx={{ mt: 3, mb: 2, display: "flex", alignItems: "center" }}>
                    <Pagination
                        count={Math.ceil(count / 50)}
                        page={page}
                        onChange={handlePageChange}
                        shape="rounded"
                        showFirstButton
                        showLastButton
                    />
                </Stack>

            </Container>
            <Footer />
        </Box>
    );
}

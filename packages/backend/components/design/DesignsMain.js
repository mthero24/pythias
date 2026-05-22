"use client";
import {
    Box, Grid2, Typography, Card, CardContent, CardActionArea, Button,
    Container, Pagination, Stack, InputAdornment, TextField, Chip, Divider, Tooltip,
    Dialog, DialogTitle, DialogContent, DialogActions, Alert, CircularProgress,
} from "@mui/material";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import Link from "next/link";
import { Footer } from "../reusable/Footer";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import BrushIcon from "@mui/icons-material/Brush";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import DownloadIcon from "@mui/icons-material/Download";

const MAX_THUMBS = 5;

export function Main({ designs, ct, query, pa, canEdit = true }) {
    const [designss, setDesigns] = useState(designs);
    const [search, setSearch] = useState(query ?? "");
    const [page, setPage] = useState(pa ? parseInt(pa) : 1);
    const [count, setCount] = useState(ct);
    const [searching, setSearching] = useState(false);
    const initialQueryRef = useRef(query ?? "");
    const [csvOpen, setCsvOpen] = useState(false);
    const [csvFile, setCsvFile] = useState(null);
    const [csvLoading, setCsvLoading] = useState(false);
    const [csvResult, setCsvResult] = useState(null);
    const [csvLocations, setCsvLocations] = useState([]);
    const csvInputRef = useRef(null);

    useEffect(() => {
        if (search === initialQueryRef.current) return;
        const t = setTimeout(runSearch, 400);
        return () => clearTimeout(t);
    }, [search]);

    const openCsvDialog = async () => {
        setCsvFile(null);
        setCsvResult(null);
        setCsvOpen(true);
        try {
            const res = await axios.get("/api/admin/print-locations");
            setCsvLocations(res.data.printLocations.map(l => l.name));
        } catch {
            setCsvLocations(["front", "back"]);
        }
    };
    const closeCsvDialog = () => { if (!csvLoading) setCsvOpen(false); };

    const downloadTemplate = () => {
        const locations = csvLocations.length > 0 ? csvLocations : ["front", "back"];
        const imageColumns = locations.map(l => `image_${l}`);
        const headers = ["sku", "title", "printType", ...imageColumns];
        const example = [
            "ABC123DEFG",
            "My Design Title",
            "DTF",
            ...imageColumns.map((_, i) => i === 0 ? "https://example.com/my-design.png" : ""),
        ];
        const csv = [headers, example]
            .map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(","))
            .join("\r\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "design-import-template.csv";
        a.click();
        URL.revokeObjectURL(url);
    };

    const uploadCSV = async () => {
        if (!csvFile) return;
        setCsvLoading(true);
        setCsvResult(null);
        try {
            const form = new FormData();
            form.append("file", csvFile);
            const res = await axios.post("/api/admin/designs/csv-ingest", form);
            setCsvResult(res.data);
        } catch (e) {
            setCsvResult({ error: true, msg: e?.response?.data?.msg || e.message });
        } finally {
            setCsvLoading(false);
        }
    };

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
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                        <Box sx={{ width: 36, height: 36, borderRadius: 2, background: "linear-gradient(135deg, #9333ea 0%, #7c3aed 100%)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <BrushIcon sx={{ color: "#fff", fontSize: 20 }} />
                        </Box>
                        <Box>
                            <Stack direction="row" alignItems="baseline" spacing={1}>
                                <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: -0.5, lineHeight: 1.2 }}>Designs</Typography>
                                <Chip label={count} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
                            </Stack>
                            <Typography variant="body2" color="text.secondary">Browse and manage artwork designs</Typography>
                        </Box>
                    </Stack>
                    {canEdit && (
                        <Stack direction="row" spacing={1}>
                            <Button variant="outlined" startIcon={<UploadFileIcon />} onClick={openCsvDialog}>
                                Import CSV
                            </Button>
                            <Button variant="contained" startIcon={<AddIcon />} onClick={createDesign}>
                                Create Design
                            </Button>
                        </Stack>
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
                                            <Chip
                                                size="small"
                                                label={`${d.productCount ?? 0} product${(d.productCount ?? 0) === 1 ? "" : "s"}`}
                                                sx={{ mt: 0.75, fontSize: "0.62rem", height: 18 }}
                                                variant="outlined"
                                            />
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
                        count={Math.ceil(count / 48)}
                        page={page}
                        onChange={handlePageChange}
                        shape="rounded"
                        showFirstButton
                        showLastButton
                    />
                </Stack>

            </Container>
            <Footer />

            {/* CSV Import Dialog */}
            <Dialog open={csvOpen} onClose={closeCsvDialog} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 700 }}>Import Designs from CSV</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        {/* Template download */}
                        <Box sx={{ p: 2, borderRadius: 2, border: "1px solid", borderColor: "divider", backgroundColor: "background.default" }}>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                Download the template to see the required format. Required: <strong>sku, title</strong>. Optional: <strong>printType</strong>, then one column per print location (e.g. <strong>image_front, image_back</strong>) — add as many as needed.
                            </Typography>
                            <Button
                                variant="outlined"
                                size="small"
                                startIcon={<DownloadIcon />}
                                onClick={downloadTemplate}
                            >
                                Download Template
                            </Button>
                        </Box>

                        {/* File picker */}
                        <Box
                            onClick={() => csvInputRef.current?.click()}
                            sx={{
                                p: 3, borderRadius: 2, border: "2px dashed", borderColor: csvFile ? "primary.main" : "divider",
                                backgroundColor: csvFile ? "primary.50" : "background.default",
                                textAlign: "center", cursor: "pointer",
                                transition: "border-color 150ms, background-color 150ms",
                                "&:hover": { borderColor: "primary.main" },
                            }}
                        >
                            <UploadFileIcon sx={{ fontSize: 36, color: csvFile ? "primary.main" : "text.disabled", mb: 1 }} />
                            <Typography variant="body2" color={csvFile ? "primary.main" : "text.secondary"} sx={{ fontWeight: 600 }}>
                                {csvFile ? csvFile.name : "Click to select a CSV file"}
                            </Typography>
                            <input
                                ref={csvInputRef}
                                type="file"
                                accept=".csv,text/csv"
                                style={{ display: "none" }}
                                onChange={e => { setCsvFile(e.target.files?.[0] ?? null); setCsvResult(null); }}
                            />
                        </Box>

                        {/* Result */}
                        {csvResult && !csvResult.error && (
                            <Alert severity="success">
                                <strong>{csvResult.created}</strong> created · <strong>{csvResult.updated}</strong> updated
                                {csvResult.errors?.length > 0 && (
                                    <Box sx={{ mt: 1 }}>
                                        <Typography variant="caption" color="error.main" sx={{ display: "block", fontWeight: 600 }}>
                                            {csvResult.errors.length} row{csvResult.errors.length !== 1 ? "s" : ""} skipped:
                                        </Typography>
                                        {csvResult.errors.map((e, i) => (
                                            <Typography key={i} variant="caption" sx={{ display: "block" }}>{e}</Typography>
                                        ))}
                                    </Box>
                                )}
                            </Alert>
                        )}
                        {csvResult?.error && (
                            <Alert severity="error">{csvResult.msg}</Alert>
                        )}
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={closeCsvDialog} disabled={csvLoading}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={uploadCSV}
                        disabled={!csvFile || csvLoading}
                        startIcon={csvLoading ? <CircularProgress size={16} color="inherit" /> : <UploadFileIcon />}
                    >
                        {csvLoading ? "Importing…" : "Import"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

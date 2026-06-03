"use client";
import { useState, useEffect, useCallback } from "react";
import {
    Box, Container, Typography, Stack, TextField, Button, Card,
    Table, TableHead, TableRow, TableCell, TableBody, Chip, InputAdornment,
    IconButton, Pagination, CircularProgress, MenuItem, Select, FormControl, InputLabel,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import { useOrg } from "@/components/OrgProvider";
import { CreateNFProduct } from "@pythias/backend";

export default function ProductsPage() {
    const { org } = useOrg() ?? {};
    const base = org?.slug ? `/${org.slug}` : "";
    const [products, setProducts] = useState([]);
    const [count, setCount] = useState(0);
    const [page, setPage] = useState(1);
    const [q, setQ] = useState("");
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("all");
    const [loading, setLoading] = useState(true);

    const [createOpen, setCreateOpen] = useState(false);
    const [createProduct, setCreateProduct] = useState({ blanks: [], colors: [], productImages: [], variantsArray: [] });
    const [createStage, setCreateStage] = useState("Select Blank");
    const [brands, setBrands] = useState([]);
    const [seasons, setSeasons] = useState([]);
    const [genders, setGenders] = useState([]);
    const [themes, setThemes] = useState([]);
    const [sportUsedFor, setSportUsedFor] = useState([]);

    const PER_PAGE = 50;

    const load = useCallback(async (pg = page, sq = search, f = filter) => {
        setLoading(true);
        const params = new URLSearchParams({ page: pg, ...(sq && { q: sq }), ...(f !== "all" && { active: f }) });
        const res = await fetch(`/api/admin/products?${params}`).then(r => r.json());
        if (!res.error) { setProducts(res.products); setCount(res.count); }
        setLoading(false);
    }, [page, search, filter]);

    useEffect(() => { load(1, search, filter); }, [search, filter]);

    function handleSearch(e) {
        e.preventDefault();
        setPage(1);
        setSearch(q);
    }

    function handleCreateOpen() {
        fetch("/api/admin/brands").then(r => r.json()).then(d => setBrands(d.brands ?? [])).catch(() => {});
        fetch("/api/admin/oneoffs").then(r => r.json()).then(d => {
            setGenders(d.genders ?? []);
            setThemes(d.themes ?? []);
            setSportUsedFor(d.sportUsedFor ?? []);
            setSeasons(d.seasons ?? []);
        }).catch(() => {});
        setCreateOpen(true);
    }

    return (
        <Box sx={{ bgcolor: "background.default", minHeight: "100vh" }}>
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                    <Typography variant="h5" fontWeight={700}>Products</Typography>
                    <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreateOpen}>New Product</Button>
                </Stack>

                <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 3 }}>
                    <form onSubmit={handleSearch} style={{ flex: 1 }}>
                        <TextField
                            fullWidth size="small" placeholder="Search by title or SKU…"
                            value={q} onChange={e => setQ(e.target.value)}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton type="submit" size="small"><SearchIcon fontSize="small" /></IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </form>
                    <FormControl size="small" sx={{ minWidth: 130 }}>
                        <InputLabel>Status</InputLabel>
                        <Select label="Status" value={filter} onChange={e => { setFilter(e.target.value); setPage(1); }}>
                            <MenuItem value="all">All</MenuItem>
                            <MenuItem value="true">Active</MenuItem>
                            <MenuItem value="false">Inactive</MenuItem>
                        </Select>
                    </FormControl>
                </Stack>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {count} product{count !== 1 ? "s" : ""}
                </Typography>

                <Card variant="outlined">
                    {loading ? (
                        <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}><CircularProgress size={28} /></Box>
                    ) : (
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Title</TableCell>
                                    <TableCell>SKU</TableCell>
                                    <TableCell>Design</TableCell>
                                    <TableCell>Blank</TableCell>
                                    <TableCell align="center">Variants</TableCell>
                                    <TableCell align="center">Status</TableCell>
                                    <TableCell />
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {products.map(p => (
                                    <TableRow key={p._id} hover>
                                        <TableCell sx={{ fontWeight: 600, maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                            {p.title}
                                        </TableCell>
                                        <TableCell sx={{ fontFamily: "monospace", fontSize: 12 }}>{p.sku}</TableCell>
                                        <TableCell sx={{ fontSize: 12, color: "text.secondary" }}>{p.designRef?.sku ?? "—"}</TableCell>
                                        <TableCell sx={{ fontSize: 12, color: "text.secondary" }}>{p.blank?.code ?? "—"}</TableCell>
                                        <TableCell align="center">
                                            <Chip label={p.variants?.length ?? 0} size="small" variant="outlined" />
                                        </TableCell>
                                        <TableCell align="center">
                                            <Chip
                                                label={p.active ? "Active" : "Inactive"}
                                                size="small"
                                                color={p.active ? "success" : "default"}
                                                variant="outlined"
                                            />
                                        </TableCell>
                                        <TableCell align="right">
                                            <IconButton size="small" href={`${base}/products/${p._id}`}>
                                                <EditIcon fontSize="small" />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {products.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={7} align="center" sx={{ py: 4, color: "text.secondary" }}>
                                            No products found.{" "}
                                            <span onClick={handleCreateOpen} style={{ cursor: "pointer", textDecoration: "underline" }}>Create your first product →</span>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </Card>

                {count > PER_PAGE && (
                    <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
                        <Pagination
                            count={Math.ceil(count / PER_PAGE)}
                            page={page}
                            onChange={(_, v) => { setPage(v); load(v, search, filter); }}
                        />
                    </Box>
                )}
            </Container>

            <CreateNFProduct
                open={createOpen}
                setOpen={(v) => {
                    setCreateOpen(v);
                    if (!v) load(1, search, filter);
                }}
                product={createProduct}
                setProduct={setCreateProduct}
                stage={createStage}
                setStage={setCreateStage}
                brands={brands}
                setBrands={setBrands}
                seasons={seasons}
                setSeasons={setSeasons}
                genders={genders}
                setGenders={setGenders}
                themes={themes}
                setThemes={setThemes}
                sportUsedFor={sportUsedFor}
                setSportUsedFor={setSportUsedFor}
                CreateSku={null}
            />
        </Box>
    );
}

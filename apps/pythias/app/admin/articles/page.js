"use client";
import { useState, useEffect } from "react";
import {
    Box, Typography, Table, TableBody, TableCell, TableHead, TableRow,
    Chip, IconButton, Paper, Tooltip, TextField, InputAdornment,
} from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import DeleteIcon from "@mui/icons-material/Delete";
import SearchIcon from "@mui/icons-material/Search";

export default function AdminArticlesPage() {
    const [articles, setArticles] = useState([]);
    const [search, setSearch]     = useState("");

    async function load() {
        const res = await fetch("/api/admin/articles?limit=100");
        const data = await res.json();
        setArticles(data.articles || []);
    }

    useEffect(() => { load(); }, []);

    async function remove(id) {
        if (!confirm("Delete this article?")) return;
        await fetch(`/api/admin/articles?id=${id}`, { method: "DELETE" });
        load();
    }

    const filtered = articles.filter((a) =>
        !search || a.title?.toLowerCase().includes(search.toLowerCase()) || a.slug?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1100 }}>
            <Box sx={{ display: "flex", alignItems: { xs: "flex-start", sm: "center" }, flexDirection: { xs: "column", sm: "row" }, justifyContent: "space-between", gap: 2, mb: 4 }}>
                <Box>
                    <Typography variant="h5" fontWeight={700}>Articles</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {articles.length} total — published via webhook or API.
                    </Typography>
                </Box>
                <TextField
                    size="small" placeholder="Search…" value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
                    sx={{ width: { xs: "100%", sm: 240 } }}
                />
            </Box>

            <Paper variant="outlined" sx={{ borderRadius: 2, overflowX: "auto" }}>
                <Table sx={{ minWidth: 600 }}>
                    <TableHead>
                        <TableRow sx={{ bgcolor: "#f8faff" }}>
                            <TableCell sx={{ fontWeight: 700 }}>Title</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Slug</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Tags</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Published</TableCell>
                            <TableCell />
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filtered.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ color: "text.secondary", py: 4 }}>
                                    No articles found.
                                </TableCell>
                            </TableRow>
                        )}
                        {filtered.map((a) => (
                            <TableRow key={a._id} hover>
                                <TableCell sx={{ fontWeight: 600, maxWidth: 300 }}>
                                    <Typography noWrap sx={{ maxWidth: 280, fontSize: 14 }}>{a.title}</Typography>
                                </TableCell>
                                <TableCell sx={{ fontFamily: "monospace", fontSize: 12, color: "text.secondary" }}>
                                    {a.slug}
                                </TableCell>
                                <TableCell>
                                    <Chip label={a.published ? "Published" : "Draft"} size="small" color={a.published ? "success" : "default"} />
                                </TableCell>
                                <TableCell>
                                    {a.tags?.slice(0, 2).map((tag) => (
                                        <Chip key={tag} label={tag} size="small" sx={{ mr: 0.5, fontSize: 11 }} />
                                    ))}
                                </TableCell>
                                <TableCell sx={{ fontSize: 13, color: "text.secondary" }}>
                                    {a.publishedAt ? new Date(a.publishedAt).toLocaleDateString() : "—"}
                                </TableCell>
                                <TableCell align="right">
                                    <Tooltip title="View article">
                                        <IconButton size="small" href={`/blog/${a.slug}`} target="_blank">
                                            <OpenInNewIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Delete">
                                        <IconButton size="small" color="error" onClick={() => remove(a._id)}>
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Paper>
        </Box>
    );
}

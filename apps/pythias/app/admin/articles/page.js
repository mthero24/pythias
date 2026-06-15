"use client";
import { useState, useEffect } from "react";
import {
    Box, Typography, Table, TableBody, TableCell, TableHead, TableRow,
    Chip, IconButton, Paper, Tooltip, TextField, InputAdornment,
    Button, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, Alert,
} from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import DeleteIcon from "@mui/icons-material/Delete";
import SearchIcon from "@mui/icons-material/Search";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import LightbulbOutlinedIcon from "@mui/icons-material/LightbulbOutlined";

export default function AdminArticlesPage() {
    const [articles, setArticles] = useState([]);
    const [search, setSearch]     = useState("");
    const [topic, setTopic]       = useState("");
    const [generating, setGenerating] = useState(false);
    const [error, setError]       = useState("");
    const [preview, setPreview]   = useState(null); // generated article shown for review
    const [ideas, setIdeas]       = useState([]);
    const [loadingIdeas, setLoadingIdeas] = useState(false);
    const [bulkRunning, setBulkRunning]   = useState(false);
    const [bulkProgress, setBulkProgress] = useState({ done: 0, total: 0 });

    async function load() {
        const res = await fetch("/api/admin/articles?limit=100");
        const data = await res.json();
        setArticles(data.articles || []);
    }

    useEffect(() => { load(); }, []);

    async function generate(topicArg) {
        const t = (typeof topicArg === "string" ? topicArg : topic).trim();
        if (!t || generating) return;
        setGenerating(true);
        setError("");
        try {
            const res = await fetch("/api/admin/articles/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ topic: t }),
            });
            const data = await res.json();
            if (!res.ok || data.error) { setError(data.msg || "Generation failed"); return; }
            setTopic("");
            setPreview(data.article); // open review dialog
            load();
        } catch (e) {
            setError("Could not reach the server.");
        } finally {
            setGenerating(false);
        }
    }

    async function suggestIdeas() {
        if (loadingIdeas) return;
        setLoadingIdeas(true);
        setError("");
        try {
            const res = await fetch("/api/admin/articles/ideas", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ count: 10 }),
            });
            const data = await res.json();
            if (!res.ok || data.error) { setError(data.msg || "Could not generate ideas"); return; }
            setIdeas(data.ideas || []);
        } catch (e) {
            setError("Could not reach the server.");
        } finally {
            setLoadingIdeas(false);
        }
    }

    async function generateAll() {
        if (!ideas.length || bulkRunning || generating) return;
        setBulkRunning(true);
        setError("");
        const total = ideas.length;
        let done = 0, failed = 0;
        setBulkProgress({ done, total });
        for (const idea of ideas) {
            try {
                const res = await fetch("/api/admin/articles/generate", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ topic: idea.topic }),
                });
                const data = await res.json().catch(() => ({}));
                if (!res.ok || data.error) failed++;
            } catch { failed++; }
            done++;
            setBulkProgress({ done, total });
        }
        setBulkRunning(false);
        setIdeas([]);
        if (failed) setError(`${failed} of ${total} idea(s) failed to generate.`);
        load();
    }

    async function togglePublish(a) {
        await fetch("/api/admin/articles", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ _id: a._id, published: !a.published }),
        });
        if (preview && preview._id === a._id) setPreview({ ...preview, published: !a.published });
        load();
    }

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
            <Box sx={{ display: "flex", alignItems: { xs: "flex-start", sm: "center" }, flexDirection: { xs: "column", sm: "row" }, justifyContent: "space-between", gap: 2, mb: 3 }}>
                <Box>
                    <Typography variant="h5" fontWeight={700}>Articles</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {articles.length} total — generate drafts with AI, review, then publish.
                    </Typography>
                </Box>
                <TextField
                    size="small" placeholder="Search…" value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
                    sx={{ width: { xs: "100%", sm: 240 } }}
                />
            </Box>

            {/* AI generation bar */}
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, mb: 3, bgcolor: "#fbfcff" }}>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>Generate a draft with AI</Typography>
                <Box sx={{ display: "flex", gap: 1, flexDirection: { xs: "column", sm: "row" } }}>
                    <TextField
                        size="small" fullWidth
                        placeholder='Topic or keyword, e.g. "how to reduce print shop turnaround time"'
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") generate(); }}
                        disabled={generating}
                    />
                    <Button
                        variant="outlined"
                        onClick={suggestIdeas}
                        disabled={loadingIdeas || generating}
                        startIcon={loadingIdeas ? <CircularProgress size={16} /> : <LightbulbOutlinedIcon />}
                        sx={{ whiteSpace: "nowrap" }}
                    >
                        {loadingIdeas ? "Thinking…" : "Suggest ideas"}
                    </Button>
                    <Button
                        variant="contained"
                        onClick={() => generate()}
                        disabled={generating || !topic.trim()}
                        startIcon={generating ? <CircularProgress size={16} color="inherit" /> : <AutoAwesomeIcon />}
                        sx={{ whiteSpace: "nowrap", minWidth: 160 }}
                    >
                        {generating ? "Generating…" : "Generate draft"}
                    </Button>
                </Box>
                {error && <Alert severity="error" sx={{ mt: 1.5 }} onClose={() => setError("")}>{error}</Alert>}
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                    Creates a <strong>draft</strong> grounded in real Pythias facts (no fabricated stats or competitor claims). Review it, then publish.
                </Typography>

                {ideas.length > 0 && (
                    <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 1 }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1 }}>
                            <Typography variant="caption" fontWeight={700} color="text.secondary">
                                Suggested topics{bulkRunning ? ` — generating ${bulkProgress.done}/${bulkProgress.total}…` : ""}
                            </Typography>
                            <Box sx={{ display: "flex", gap: 0.5 }}>
                                <Button size="small" variant="contained" disabled={bulkRunning || generating}
                                    startIcon={bulkRunning ? <CircularProgress size={14} color="inherit" /> : <AutoAwesomeIcon />}
                                    onClick={generateAll}>
                                    {bulkRunning ? `${bulkProgress.done}/${bulkProgress.total}` : `Generate all ${ideas.length} drafts`}
                                </Button>
                                <Button size="small" onClick={() => setIdeas([])} disabled={bulkRunning}>Clear</Button>
                            </Box>
                        </Box>
                        {ideas.map((idea, i) => (
                            <Paper key={i} variant="outlined" sx={{ p: 1.25, borderRadius: 1.5, display: "flex", gap: 1, alignItems: "center", justifyContent: "space-between" }}>
                                <Box sx={{ minWidth: 0 }}>
                                    <Typography variant="body2" fontWeight={600} noWrap>{idea.title}</Typography>
                                    {idea.rationale && <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>{idea.rationale}</Typography>}
                                </Box>
                                <Box sx={{ display: "flex", gap: 0.5, flexShrink: 0 }}>
                                    <Button size="small" onClick={() => setTopic(idea.topic)}>Use</Button>
                                    <Button size="small" variant="contained" disabled={generating} onClick={() => generate(idea.topic)}>Generate</Button>
                                </Box>
                            </Paper>
                        ))}
                    </Box>
                )}
            </Paper>

            <Paper variant="outlined" sx={{ borderRadius: 2, overflowX: "auto" }}>
                <Table sx={{ minWidth: 640 }}>
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
                                <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                                    <Button size="small" variant="text" onClick={() => setPreview(a)} sx={{ mr: 0.5 }}>Review</Button>
                                    <Button size="small" variant={a.published ? "outlined" : "contained"} color={a.published ? "warning" : "success"} onClick={() => togglePublish(a)} sx={{ mr: 0.5 }}>
                                        {a.published ? "Unpublish" : "Publish"}
                                    </Button>
                                    <Tooltip title="View article">
                                        <span>
                                            <IconButton size="small" href={`/blog/${a.slug}`} target="_blank" disabled={!a.published}>
                                                <OpenInNewIcon fontSize="small" />
                                            </IconButton>
                                        </span>
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

            {/* Review dialog */}
            <Dialog open={Boolean(preview)} onClose={() => setPreview(null)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                {preview && (
                    <>
                        <DialogTitle sx={{ fontWeight: 700 }}>
                            {preview.title}
                            <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontWeight: 400 }}>
                                /blog/{preview.slug} · {preview.published ? "Published" : "Draft"}
                            </Typography>
                        </DialogTitle>
                        <DialogContent dividers>
                            {preview.metaDescription && (
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontStyle: "italic" }}>
                                    {preview.metaDescription}
                                </Typography>
                            )}
                            <Box
                                dangerouslySetInnerHTML={{ __html: preview.content || "" }}
                                sx={{ "& h2": { fontSize: "1.3rem", fontWeight: 700, mt: 3 }, "& h3": { fontSize: "1.1rem", fontWeight: 700, mt: 2 }, "& p": { lineHeight: 1.7, mb: 1.5 }, "& ul,& ol": { pl: 3 }, "& a": { color: "#6366f1" } }}
                            />
                        </DialogContent>
                        <DialogActions sx={{ px: 3, py: 2 }}>
                            <Button onClick={() => setPreview(null)}>Close</Button>
                            <Button
                                variant={preview.published ? "outlined" : "contained"}
                                color={preview.published ? "warning" : "success"}
                                onClick={() => togglePublish(preview)}
                            >
                                {preview.published ? "Unpublish" : "Publish"}
                            </Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>
        </Box>
    );
}

"use client";
import { useState, useEffect, useRef } from "react";
import {
    Box, Container, Typography, Button, Stack, Paper, Table, TableHead,
    TableBody, TableRow, TableCell, Chip, CircularProgress, Alert,
    TextField, IconButton, Tooltip, LinearProgress,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import MusicNoteIcon from "@mui/icons-material/MusicNote";

const CATEGORIES = ["upbeat", "corporate", "ambient", "cinematic"];

export default function MusicPage() {
    const [tracks, setTracks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [seeding, setSeeding] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [seedResults, setSeedResults] = useState(null);
    const [error, setError] = useState("");
    const [name, setName] = useState("");
    const [playing, setPlaying] = useState(null);
    const fileRef = useRef(null);
    const audioRef = useRef(null);

    const load = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/music-tracks");
            const data = await res.json();
            setTracks(data.tracks || []);
        } catch {
            setError("Failed to load tracks");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const handleSeed = async () => {
        setSeeding(true);
        setSeedResults(null);
        setError("");
        try {
            const res = await fetch("/api/admin/music-tracks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "seed" }),
            });
            const data = await res.json();
            setSeedResults(data.results || []);
            await load();
        } catch (e) {
            setError(e.message || "Seeding failed");
        } finally {
            setSeeding(false);
        }
    };

    const handleUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!name.trim()) { setError("Enter a track name before uploading"); e.target.value = ""; return; }
        setUploading(true);
        setError("");
        try {
            const form = new FormData();
            form.append("file", file);
            form.append("name", name.trim());
            const res = await fetch("/api/admin/music-tracks", { method: "POST", body: form });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setName("");
            await load();
        } catch (e) {
            setError(e.message || "Upload failed");
        } finally {
            setUploading(false);
            e.target.value = "";
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Delete this track?")) return;
        try {
            const res = await fetch(`/api/admin/music-tracks?id=${id}`, { method: "DELETE" });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            await load();
        } catch (e) {
            setError(e.message || "Delete failed");
        }
    };

    const togglePlay = (url) => {
        if (playing === url) {
            audioRef.current?.pause();
            setPlaying(null);
        } else {
            if (audioRef.current) {
                audioRef.current.src = url;
                audioRef.current.play().catch(() => {});
            }
            setPlaying(url);
        }
    };

    const seededCategories = new Set(tracks.filter(t => t.isDefault).map(t => t.category));

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <audio ref={audioRef} onEnded={() => setPlaying(null)} style={{ display: "none" }} />

            <Stack direction="row" alignItems="center" spacing={1.5} mb={3}>
                <MusicNoteIcon color="secondary" />
                <Typography variant="h5" fontWeight={700}>Music Tracks</Typography>
            </Stack>

            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}

            {/* Seed defaults */}
            <Paper variant="outlined" sx={{ p: 2.5, mb: 3 }}>
                <Typography variant="subtitle2" fontWeight={700} mb={0.5}>Default Tracks</Typography>
                <Typography variant="body2" color="text.secondary" mb={2}>
                    Downloads CC0-licensed tracks from OpenGameArt.org and uploads them to storage. Run this once to populate the default background music options.
                </Typography>

                <Stack direction="row" spacing={1} flexWrap="wrap" rowGap={1} mb={2}>
                    {CATEGORIES.map(cat => (
                        <Chip
                            key={cat}
                            label={cat}
                            size="small"
                            color={seededCategories.has(cat) ? "success" : "default"}
                            variant={seededCategories.has(cat) ? "filled" : "outlined"}
                            sx={{ textTransform: "capitalize" }}
                        />
                    ))}
                </Stack>

                {seedResults && (
                    <Box mb={2}>
                        {seedResults.map(r => (
                            <Alert key={r.name} severity={r.success ? "success" : "warning"} sx={{ mb: 0.5, py: 0 }}>
                                {r.name}: {r.success ? `Uploaded to ${r.url}` : r.error}
                            </Alert>
                        ))}
                    </Box>
                )}

                <Button
                    variant="contained"
                    startIcon={seeding ? <CircularProgress size={16} color="inherit" /> : <AutoFixHighIcon />}
                    onClick={handleSeed}
                    disabled={seeding}
                >
                    {seeding ? "Downloading & uploading…" : "Seed Defaults"}
                </Button>
            </Paper>

            {/* Upload custom track */}
            <Paper variant="outlined" sx={{ p: 2.5, mb: 3 }}>
                <Typography variant="subtitle2" fontWeight={700} mb={1.5}>Upload Custom Track</Typography>
                <input ref={fileRef} type="file" accept="audio/*" style={{ display: "none" }} onChange={handleUpload} />
                <Stack direction="row" spacing={1.5} alignItems="flex-end">
                    <TextField
                        label="Track Name"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        size="small"
                        sx={{ minWidth: 220 }}
                    />
                    <Button
                        variant="outlined"
                        startIcon={uploading ? <CircularProgress size={16} /> : <CloudUploadIcon />}
                        onClick={() => fileRef.current?.click()}
                        disabled={uploading || !name.trim()}
                    >
                        {uploading ? "Uploading…" : "Choose File"}
                    </Button>
                </Stack>
                <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                    Supports MP3, M4A, OGG, WAV
                </Typography>
            </Paper>

            {/* Track list */}
            <Paper variant="outlined">
                {loading && <LinearProgress />}
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 600, fontSize: 11, textTransform: "uppercase", color: "text.secondary" }}>Name</TableCell>
                            <TableCell sx={{ fontWeight: 600, fontSize: 11, textTransform: "uppercase", color: "text.secondary" }}>Category</TableCell>
                            <TableCell sx={{ fontWeight: 600, fontSize: 11, textTransform: "uppercase", color: "text.secondary" }}>Type</TableCell>
                            <TableCell sx={{ fontWeight: 600, fontSize: 11, textTransform: "uppercase", color: "text.secondary" }}>Preview</TableCell>
                            <TableCell />
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {tracks.length === 0 && !loading && (
                            <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ py: 4, color: "text.secondary" }}>
                                    No tracks yet. Seed defaults or upload a custom track above.
                                </TableCell>
                            </TableRow>
                        )}
                        {tracks.map(t => (
                            <TableRow key={t._id} hover>
                                <TableCell sx={{ fontSize: 13, fontWeight: 600 }}>{t.name}</TableCell>
                                <TableCell>
                                    {t.category
                                        ? <Chip label={t.category} size="small" sx={{ textTransform: "capitalize" }} />
                                        : <Typography variant="caption" color="text.secondary">—</Typography>
                                    }
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={t.isDefault ? "Default" : "Custom"}
                                        size="small"
                                        color={t.isDefault ? "primary" : "secondary"}
                                        variant="outlined"
                                    />
                                </TableCell>
                                <TableCell>
                                    <Button
                                        size="small"
                                        variant={playing === t.url ? "contained" : "outlined"}
                                        color="secondary"
                                        onClick={() => togglePlay(t.url)}
                                    >
                                        {playing === t.url ? "Stop" : "Play"}
                                    </Button>
                                </TableCell>
                                <TableCell align="right">
                                    <Tooltip title="Delete">
                                        <IconButton size="small" color="error" onClick={() => handleDelete(t._id)}>
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Paper>
        </Container>
    );
}

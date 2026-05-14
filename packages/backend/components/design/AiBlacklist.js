"use client";
import {
    Box, Typography, TextField, Button, Chip, Stack, Card, CardContent,
    Divider, CircularProgress, InputAdornment, IconButton, Tooltip, Container,
} from "@mui/material";
import { useState, useEffect } from "react";
import axios from "axios";
import AddIcon from "@mui/icons-material/Add";
import BlockIcon from "@mui/icons-material/Block";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import SearchIcon from "@mui/icons-material/Search";
import { Footer } from "../reusable/Footer";

export function AiBlacklistMain() {
    const [items, setItems] = useState([]);
    const [phrase, setPhrase] = useState("");
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(false);
    const [filter, setFilter] = useState("");

    useEffect(() => {
        axios.get("/api/admin/ai-blacklist")
            .then(res => setItems(res.data.items ?? []))
            .finally(() => setLoading(false));
    }, []);

    const addPhrase = async () => {
        const trimmed = phrase.trim();
        if (!trimmed) return;
        setAdding(true);
        try {
            const res = await axios.post("/api/admin/ai-blacklist", { phrase: trimmed });
            if (res.data.error) { alert(res.data.msg); return; }
            setItems(prev => [...prev, res.data.item].sort((a, b) => a.name.localeCompare(b.name)));
            setPhrase("");
        } finally {
            setAdding(false);
        }
    };

    const removePhrase = async (id) => {
        const res = await axios.delete(`/api/admin/ai-blacklist?id=${id}`);
        if (res.data.error) { alert(res.data.msg); return; }
        setItems(prev => prev.filter(i => i._id !== id));
    };

    const filtered = filter
        ? items.filter(i => i.name.toLowerCase().includes(filter.toLowerCase()))
        : items;

    return (
        <Box sx={{ width: "100%", maxWidth: "100%", overflowX: "hidden" }}>
            <Container maxWidth="md" sx={{ py: 4, minHeight: "90vh" }}>

                {/* Header */}
                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
                    <Box sx={{ width: 40, height: 40, borderRadius: 1.5, backgroundColor: "error.main", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <BlockIcon sx={{ color: "#fff", fontSize: 22 }} />
                    </Box>
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>AI Description Blacklist</Typography>
                        <Typography variant="caption" color="text.secondary">
                            Words and phrases the AI will never use in generated descriptions or tags
                        </Typography>
                    </Box>
                </Stack>

                <Stack spacing={3}>

                    {/* Add new */}
                    <Card variant="outlined" sx={{ borderRadius: 2 }}>
                        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                            <Stack direction="row" alignItems="flex-start" spacing={1.5} sx={{ mb: 2 }}>
                                <BlockIcon sx={{ color: "primary.main", mt: 0.25, fontSize: 20 }} />
                                <Box>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>Add Banned Word or Phrase</Typography>
                                    <Typography variant="caption" color="text.secondary">Enter a single word or multi-word phrase to block from AI output</Typography>
                                </Box>
                            </Stack>
                            <Divider sx={{ mb: 2 }} />
                            <Stack direction="row" spacing={1}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    placeholder='e.g. "t-shirt" or "perfect gift"'
                                    value={phrase}
                                    onChange={(e) => setPhrase(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === "Enter") addPhrase(); }}
                                    disabled={adding}
                                />
                                <Button
                                    variant="contained"
                                    startIcon={adding ? <CircularProgress size={16} color="inherit" /> : <AddIcon />}
                                    onClick={addPhrase}
                                    disabled={!phrase.trim() || adding}
                                    sx={{ whiteSpace: "nowrap", minWidth: 120 }}
                                >
                                    Add
                                </Button>
                            </Stack>
                        </CardContent>
                    </Card>

                    {/* List */}
                    <Card variant="outlined" sx={{ borderRadius: 2 }}>
                        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                                <Stack direction="row" alignItems="flex-start" spacing={1.5}>
                                    <BlockIcon sx={{ color: "primary.main", mt: 0.25, fontSize: 20 }} />
                                    <Box>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                                            Blacklisted{" "}
                                            <Typography component="span" variant="subtitle1" color="text.secondary" sx={{ fontWeight: 400 }}>
                                                ({items.length})
                                            </Typography>
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">Click × to remove a word or phrase</Typography>
                                    </Box>
                                </Stack>
                                {items.length > 6 && (
                                    <TextField
                                        size="small"
                                        placeholder="Filter…"
                                        value={filter}
                                        onChange={(e) => setFilter(e.target.value)}
                                        sx={{ width: 180 }}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <SearchIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                )}
                            </Stack>
                            <Divider sx={{ mb: 2 }} />

                            {loading ? (
                                <Box sx={{ py: 4, display: "flex", justifyContent: "center" }}>
                                    <CircularProgress size={28} />
                                </Box>
                            ) : filtered.length === 0 ? (
                                <Box sx={{ py: 5, textAlign: "center" }}>
                                    <BlockIcon sx={{ fontSize: 36, color: "text.disabled", mb: 1 }} />
                                    <Typography variant="body2" color="text.secondary">
                                        {filter ? "No matches found." : "No banned words yet. Add one above."}
                                    </Typography>
                                </Box>
                            ) : (
                                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                                    {filtered.map((item) => (
                                        <Chip
                                            key={item._id}
                                            label={item.name}
                                            onDelete={() => removePhrase(item._id)}
                                            deleteIcon={
                                                <Tooltip title="Remove">
                                                    <DeleteOutlineIcon />
                                                </Tooltip>
                                            }
                                            variant="outlined"
                                            color="error"
                                            sx={{ fontWeight: 500 }}
                                        />
                                    ))}
                                </Box>
                            )}
                        </CardContent>
                    </Card>

                    {/* Info card */}
                    <Card variant="outlined" sx={{ borderRadius: 2, borderColor: "info.light", backgroundColor: "rgba(2,136,209,0.04)" }}>
                        <CardContent sx={{ p: 2 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                                <strong>How it works:</strong> When the AI generates a description or tags for a design, every word and phrase in this list is appended to the prompt as an explicit exclusion instruction. The AI is instructed to avoid all of them in both the description and the tag list.
                            </Typography>
                        </CardContent>
                    </Card>

                </Stack>
            </Container>
            <Footer />
        </Box>
    );
}

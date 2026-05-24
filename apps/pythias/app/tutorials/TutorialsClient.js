"use client";
import { useState } from "react";
import {
    Box, Typography, Chip, Card, CardContent, CardMedia, Grid,
    Dialog, DialogContent, IconButton, Stack,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import PlayCircleIcon from "@mui/icons-material/PlayCircle";

export default function TutorialsClient({ tutorials }) {
    const [activeCategory, setActiveCategory] = useState("All");
    const [playing, setPlaying]               = useState(null);

    const categories = ["All", ...new Set(tutorials.map(t => t.category).sort())];

    const filtered = activeCategory === "All"
        ? tutorials
        : tutorials.filter(t => t.category === activeCategory);

    return (
        <>
            {/* Category filter bar */}
            <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mb: 5 }}>
                {categories.map(cat => (
                    <Chip
                        key={cat}
                        label={cat}
                        clickable
                        onClick={() => setActiveCategory(cat)}
                        sx={{
                            fontWeight: activeCategory === cat ? 700 : 400,
                            bgcolor: activeCategory === cat ? "#D3A73D" : "rgba(211,167,61,0.1)",
                            color:   activeCategory === cat ? "#111"    : "#D3A73D",
                            border:  "1px solid rgba(211,167,61,0.3)",
                            "&:hover": { bgcolor: activeCategory === cat ? "#b8860b" : "rgba(211,167,61,0.2)" },
                        }}
                    />
                ))}
            </Stack>

            {/* Count */}
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {filtered.length} tutorial{filtered.length !== 1 ? "s" : ""}
                {activeCategory !== "All" ? ` in ${activeCategory}` : ""}
            </Typography>

            {/* Grid */}
            <Grid container spacing={3}>
                {filtered.map(t => (
                    <Grid item xs={12} sm={6} md={4} key={t._id}>
                        <Card
                            onClick={() => setPlaying(t)}
                            sx={{
                                height: "100%",
                                cursor: "pointer",
                                border: "1px solid #f0f0f0",
                                boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                                transition: "transform 0.2s, box-shadow 0.2s",
                                "&:hover": { transform: "translateY(-4px)", boxShadow: "0 8px 28px rgba(0,0,0,0.12)" },
                            }}
                        >
                            {/* Thumbnail */}
                            <Box sx={{ position: "relative", bgcolor: "#0f172a" }}>
                                {t.thumbnailUrl ? (
                                    <CardMedia component="img" image={t.thumbnailUrl} alt={t.title}
                                        sx={{ height: 180, objectFit: "cover", opacity: 0.85 }} />
                                ) : (
                                    <Box sx={{ height: 180, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                        <PlayCircleIcon sx={{ fontSize: 56, color: "rgba(255,255,255,0.3)" }} />
                                    </Box>
                                )}
                                {/* Play overlay */}
                                <Box sx={{
                                    position: "absolute", inset: 0, display: "flex",
                                    alignItems: "center", justifyContent: "center",
                                    bgcolor: "rgba(0,0,0,0.3)",
                                    opacity: 0, transition: "opacity 0.2s",
                                    "&:hover": { opacity: 1 },
                                }}>
                                    <PlayCircleIcon sx={{ fontSize: 64, color: "#fff" }} />
                                </Box>
                                <Chip
                                    label={t.category}
                                    size="small"
                                    sx={{
                                        position: "absolute", top: 10, left: 10,
                                        bgcolor: "rgba(211,167,61,0.9)", color: "#111",
                                        fontWeight: 600, fontSize: 11,
                                    }}
                                />
                            </Box>

                            <CardContent sx={{ p: 2.5 }}>
                                <Typography variant="h6" sx={{ fontWeight: 700, fontSize: "1rem", mb: 1, color: "#111827", lineHeight: 1.35 }}>
                                    {t.title}
                                </Typography>
                                {t.description && (
                                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                                        {t.description}
                                    </Typography>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>
                ))}

                {filtered.length === 0 && (
                    <Grid item xs={12}>
                        <Box sx={{ textAlign: "center", py: 10, color: "text.secondary" }}>
                            <Typography>No tutorials in this category yet.</Typography>
                        </Box>
                    </Grid>
                )}
            </Grid>

            {/* Video player modal */}
            <Dialog open={!!playing} onClose={() => setPlaying(null)} maxWidth="md" fullWidth
                PaperProps={{ sx: { bgcolor: "#0f172a", borderRadius: 3 } }}>
                <DialogContent sx={{ p: 0, position: "relative" }}>
                    <IconButton onClick={() => setPlaying(null)}
                        sx={{ position: "absolute", top: 12, right: 12, zIndex: 1, color: "#fff", bgcolor: "rgba(0,0,0,0.5)", "&:hover": { bgcolor: "rgba(0,0,0,0.8)" } }}>
                        <CloseIcon />
                    </IconButton>
                    {playing && (
                        <>
                            <Box
                                component="video"
                                src={playing.videoUrl}
                                controls
                                autoPlay
                                sx={{ width: "100%", display: "block", maxHeight: "70vh" }}
                            />
                            <Box sx={{ px: 3, py: 2.5 }}>
                                <Chip label={playing.category} size="small"
                                    sx={{ bgcolor: "rgba(211,167,61,0.2)", color: "#D3A73D", mb: 1 }} />
                                <Typography variant="h6" sx={{ color: "#fff", fontWeight: 700, mb: 0.5 }}>
                                    {playing.title}
                                </Typography>
                                {playing.description && (
                                    <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.6)", lineHeight: 1.7 }}>
                                        {playing.description}
                                    </Typography>
                                )}
                            </Box>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}

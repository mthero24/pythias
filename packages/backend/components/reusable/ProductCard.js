"use client";
import {
    Box, Grid2, Typography, Button, Divider, Card, CardContent, Chip,
    IconButton, Stack, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions,
    CircularProgress, LinearProgress, Alert,
} from "@mui/material";
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import StorefrontIcon from '@mui/icons-material/Storefront';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VideocamIcon from '@mui/icons-material/Videocam';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SlowMotionVideoIcon from '@mui/icons-material/SlowMotionVideo';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CloseIcon from '@mui/icons-material/Close';
import DeleteModal from "./DeleteModal";
import { useState, useRef, useEffect } from "react";
import { useCSV } from "../reusable/CSVProvider";
import { MUSIC_TRACKS } from "../shared/videoTracks";
import axios from "axios";

const _videoPolls = new Map();

function startBackgroundPoll(productId, taskId, musicUrl, onDone) {
    if (_videoPolls.has(productId)) {
        _videoPolls.get(productId).onDone = onDone;
        return;
    }
    const entry = { onDone };
    const url = `/api/admin/ai-product-video?taskId=${encodeURIComponent(taskId)}${musicUrl ? `&musicUrl=${encodeURIComponent(musicUrl)}` : ""}`;
    entry.id = setInterval(async () => {
        try {
            const r = await fetch(url);
            const d = await r.json();
            if (d.status === "done" || d.status === "failed") {
                clearInterval(entry.id);
                _videoPolls.delete(productId);
                entry.onDone(d.status === "done" ? d.videoUrl : null);
            }
        } catch {}
    }, 10000);
    _videoPolls.set(productId, entry);
}

const VideoModal = ({ open, onClose, product, onVideoSaved, onPollStart }) => {
    const productId = product._id?.toString();
    const [videoUrl, setVideoUrl] = useState(product.video ?? null);
    const [generating, setGenerating] = useState(() => _videoPolls.has(product._id?.toString()));
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState("");
    const [selectedTrackId, setSelectedTrackId] = useState("none");
    const [tracks, setTracks] = useState(MUSIC_TRACKS);
    const uploadRef = useRef(null);

    useEffect(() => {
        fetch("/api/admin/music-tracks")
            .then(r => r.json())
            .then(data => {
                if (data.tracks?.length) {
                    const custom = data.tracks.map(t => ({ id: t._id, name: t.name, url: t.url }));
                    setTracks([MUSIC_TRACKS[0], ...custom]);
                }
            })
            .catch(() => {});
    }, []);

    const musicUrl = tracks.find(t => t.id === selectedTrackId)?.url ?? null;

    // Fires every time the dialog opens — restores spinner and re-subscribes to any running poll
    useEffect(() => {
        if (!open) return;
        if (_videoPolls.has(productId)) {
            setGenerating(true);
            _videoPolls.get(productId).onDone = (url) => {
                if (url) saveVideo(url); // eslint-disable-line no-use-before-define
                else { setError("Video generation failed"); setGenerating(false); }
            };
        }
    }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        setError("");
        try {
            const form = new FormData();
            form.append("video", file);
            const res = await fetch("/api/admin/product-video-upload", { method: "POST", body: form });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            await saveVideo(data.videoUrl);
        } catch (e) {
            setError(e.message ?? "Upload failed");
        } finally {
            setUploading(false);
            e.target.value = "";
        }
    };

    const handleClose = () => {
        if (!_videoPolls.has(productId)) setGenerating(false);
        setError("");
        onClose();
    };

    const generate = async (type) => {
        setGenerating(true);
        setError("");

        const imageUrls = (product.productImages ?? [])
            .map(i => i.image)
            .filter(Boolean)
            .slice(0, 5);

        if (!imageUrls.length) {
            setError("No product images found to generate a video from.");
            setGenerating(false);
            return;
        }

        try {
            const res = await fetch("/api/admin/ai-product-video", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type, imageUrl: imageUrls[0], imageUrls, musicUrl: musicUrl || undefined, productId }),
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);

            if (type === "slideshow") {
                await saveVideo(data.videoUrl);
            } else {
                startBackgroundPoll(productId, data.taskId, musicUrl, (videoUrl) => {
                    if (videoUrl) saveVideo(videoUrl);
                    else { setError("Video generation failed"); setGenerating(false); }
                });
                onPollStart?.();
            }
        } catch (e) {
            setError(e.message ?? "Video generation failed");
            setGenerating(false);
        }
    };

    const saveVideo = async (url) => {
        setVideoUrl(url);
        setGenerating(false);
        try {
            await axios.post("/api/admin/products", { products: [{ ...product, video: url, pendingVideoTask: null }] });
            onVideoSaved(url);
        } catch (e) {
            console.error("Failed to save video URL to product:", e);
        }
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: 1.5, px: 3 }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                    <VideocamIcon fontSize="small" color="secondary" />
                    <Typography variant="h6" fontWeight={700}>Product Video</Typography>
                </Stack>
                <IconButton size="small" onClick={handleClose}><CloseIcon /></IconButton>
            </DialogTitle>

            <DialogContent dividers sx={{ p: 3 }}>
                <input ref={uploadRef} type="file" accept="video/*" style={{ display: "none" }} onChange={handleUpload} />
                {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}

                {videoUrl ? (
                    <Box>
                        <video
                            src={videoUrl}
                            controls
                            loop
                            autoPlay
                            muted
                            style={{ width: "100%", borderRadius: 8, background: "#000", maxHeight: 400 }}
                        />
                        <Box mt={2}>
                            <Typography variant="caption" color="text.secondary" display="block" mb={0.75}>Background Music</Typography>
                            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mb: 1.5 }}>
                                {tracks.map(t => (
                                    <Chip key={t.id} label={t.name} size="small" clickable
                                        variant={selectedTrackId === t.id ? "filled" : "outlined"}
                                        color={selectedTrackId === t.id ? "secondary" : "default"}
                                        onClick={() => setSelectedTrackId(t.id)}
                                    />
                                ))}
                            </Box>
                            <Stack direction="row" spacing={1} flexWrap="wrap" rowGap={1}>
                                <Button size="small" variant="outlined" startIcon={<SlowMotionVideoIcon />}
                                    onClick={() => generate("slideshow")} disabled={generating || uploading}>
                                    New Slideshow
                                </Button>
                                <Button size="small" variant="outlined" color="secondary" startIcon={<AutoAwesomeIcon />}
                                    onClick={() => generate("ai")} disabled={generating || uploading}>
                                    New AI Video
                                </Button>
                                <Button size="small" variant="outlined" color="inherit" startIcon={<CloudUploadIcon />}
                                    onClick={() => uploadRef.current?.click()} disabled={generating || uploading}>
                                    {uploading ? "Uploading…" : "Upload Video"}
                                </Button>
                            </Stack>
                        </Box>
                        {(generating || uploading) && (
                            <Box sx={{ mt: 1.5 }}>
                                <LinearProgress color="secondary" sx={{ borderRadius: 1 }} />
                                {generating && <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>Generating new video — this may take 1–2 minutes</Typography>}
                            </Box>
                        )}
                    </Box>
                ) : (generating || uploading) ? (
                    <Box sx={{ py: 3, textAlign: "center" }}>
                        <CircularProgress color="secondary" sx={{ mb: 2 }} />
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            {uploading ? "Uploading video…" : "Generating video… this may take 1–2 minutes"}
                        </Typography>
                        <LinearProgress color="secondary" sx={{ mt: 1, borderRadius: 1 }} />
                    </Box>
                ) : (
                    <Box sx={{ py: 2 }}>
                        <Typography variant="body2" color="text.secondary" mb={2}>
                            No video yet. Generate one from your product images or upload your own.
                        </Typography>
                        <Box mb={2}>
                            <Typography variant="caption" color="text.secondary" display="block" mb={0.75}>Background Music</Typography>
                            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                                {tracks.map(t => (
                                    <Chip key={t.id} label={t.name} size="small" clickable
                                        variant={selectedTrackId === t.id ? "filled" : "outlined"}
                                        color={selectedTrackId === t.id ? "secondary" : "default"}
                                        onClick={() => setSelectedTrackId(t.id)}
                                    />
                                ))}
                            </Box>
                        </Box>
                        <Stack direction="row" spacing={1.5} flexWrap="wrap" rowGap={1}>
                            <Button variant="outlined" startIcon={<SlowMotionVideoIcon />} onClick={() => generate("slideshow")}>
                                Quick Slideshow
                            </Button>
                            <Button variant="outlined" color="secondary" startIcon={<AutoAwesomeIcon />} onClick={() => generate("ai")}>
                                AI Video (Kling)
                            </Button>
                            <Button variant="outlined" color="inherit" startIcon={<CloudUploadIcon />} onClick={() => uploadRef.current?.click()}>
                                Upload Video
                            </Button>
                        </Stack>
                    </Box>
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 1.5 }}>
                <Button onClick={handleClose} variant="outlined">Close</Button>
            </DialogActions>
        </Dialog>
    );
};

export const ProductCard = ({ p, setProduct, setCreateProduct, setNFProduct, marketPlaces, setMarketplaceModal, setStart, des, setDesign, updateDesign, setPreview, source, printTypes, licenses, canEdit = true, allBlanks, allColors }) => {
    const [deleteModal, setDeleteModal] = useState(false);
    const [deleteImage, setDeleteImage] = useState({});
    const [deleteTitle, setDeleteTitle] = useState("");
    const [deleteFunction, setDeleteFunction] = useState({});
    const [type, setType] = useState("");
    const [videoModal, setVideoModal] = useState(false);
    const [productVideo, setProductVideo] = useState(p.video ?? null);
    const [videoGenerating, setVideoGenerating] = useState(
        () => !!p.pendingVideoTask?.taskId || _videoPolls.has(p._id?.toString())
    );

    useEffect(() => {
        const task = p.pendingVideoTask;
        if (!task?.taskId) return;
        const pid = p._id?.toString();
        if (_videoPolls.has(pid)) return;
        setVideoGenerating(true);
        startBackgroundPoll(pid, task.taskId, task.musicUrl ?? null, async (videoUrl) => {
            setVideoGenerating(false);
            if (!videoUrl) return;
            setProductVideo(videoUrl);
            setDesign(d => ({
                ...d,
                products: (d.products ?? []).map(prod =>
                    prod._id === p._id ? { ...prod, video: videoUrl } : prod
                ),
            }));
            try {
                await axios.post("/api/admin/products", {
                    products: [{ ...p, video: videoUrl, pendingVideoTask: null }],
                });
            } catch {}
        });
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const deleteProduct = async (product) => {
        let res = await axios.delete(`/api/admin/products?product=${product._id}`)
        if (res.data.error) alert(res.data.msg)
        else {
            let d = { ...des }
            d.products = d.products?.filter(p => p._id !== product._id)
            setDesign({ ...d })
            updateDesign({ ...d })
        }
    }

    const { csvData, setCsvData, setAdded, setNotAdded, setShow } = useCSV();

    const preCacheImages = async (product) => {
        for (let image of (product.productImages || [])) {
            if (image.image) try { await axios.get(image.image.replace("=400", "=2400")); } catch (e) {}
        }
        for (let v of (product.variantsArray || [])) {
            for (let img of (v.images || [])) try { await axios.get(img.replace("=400", "=2400")); } catch (e) {}
            if (v.image) try { await axios.get(v.image.replace("=400", "=2400")); } catch (e) {}
        }
    }

    const checkForIds = async ({ product, marketPlace }) => {
        if (!product || !marketPlace) return;
        const mp = marketPlaces?.find(m => m.name.toLowerCase() === marketPlace.toLowerCase());
        if (!mp?.connections?.length) return;
        const res = await axios.get("/api/admin/integrations", { params: { provider: "premierPrinting" } });
        const connections = res.data.integration || [];
        for (let c of connections) {
            if (c.displayName.toLowerCase().includes("acenda") && mp.connections.includes(c._id.toString())) {
                await axios.post("/api/integrations/acenda", { connection: c, product });
            }
        }
    }

    const addProductToCsv = async (marketPlace, product) => {
        setShow(true);
        checkForIds({ product, marketPlace });
        const updatedCsvData = { ...csvData };
        if (!updatedCsvData.products) updatedCsvData.products = {};
        if (!updatedCsvData.products[marketPlace]) updatedCsvData.products[marketPlace] = [];
        if (!updatedCsvData.products[marketPlace].find(p => p._id === product._id)) {
            updatedCsvData.products[marketPlace].push({ _id: product._id });
            preCacheImages(product);
            setCsvData(updatedCsvData);
            setAdded(true);
        } else {
            setNotAdded(true);
        }
    }

    const defaultColorId = (p.defaultColor?._id ?? p.defaultColor)?.toString() ?? (p.colors?.[0]?._id ?? p.colors?.[0])?.toString();
    const imgSide = i => i.side ?? i.sides ?? (i.sku?.toLowerCase().match(/-(back|modelback)$/) ? "back" : null);
    const isBack = i => { const s = imgSide(i); return s === "back" || s === "modelBack"; };
    const primaryImage = p.productImages?.find(i => (i.color?._id ?? i.color)?.toString() === defaultColorId && !isBack(i))?.image
        ?? p.productImages?.find(i => !isBack(i))?.image;
    const backImage = p.productImages?.find(i => (i.color?._id ?? i.color)?.toString() === defaultColorId && isBack(i))?.image;
    const variantCount = p.variantsArray?.length ?? 0;
    const isCombined = p.blanks?.length > 1;

    return (
        <Grid2 size={{ xs: 6, sm: 4, md: 3 }}>
            <Card variant="outlined" sx={{ height: "100%", display: "flex", flexDirection: "column", borderRadius: 2, position: "relative", transition: "box-shadow 150ms", "&:hover": { boxShadow: 4 } }}>
                {canEdit && (
                    <Tooltip title="Delete" placement="top">
                        <IconButton size="small" onClick={() => { setDeleteFunction({ onDelete: deleteProduct }); setDeleteTitle("Are You Sure You Want To Delete This Product?"); setDeleteImage({ ...p }); setDeleteModal(true); }} sx={{ position: "absolute", top: 6, right: 6, zIndex: 2, backgroundColor: "rgba(255,255,255,0.85)", color: "#780606", "&:hover": { backgroundColor: "rgba(255,255,255,1)" } }}>
                            <DeleteIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                )}

                <Box sx={{ position: "relative", aspectRatio: "1 / 1", backgroundColor: "background.default", overflow: "hidden" }}>
                    <img src={primaryImage || "/missingImage.jpg"} alt={p.title} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                    {backImage && (
                        <Box sx={{ position: "absolute", bottom: 6, left: 6, width: 56, height: 56, borderRadius: 1, overflow: "hidden", border: "1px solid rgba(0,0,0,0.12)", backgroundColor: "#fff" }}>
                            <img src={backImage} alt="back view" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                        </Box>
                    )}
                    {productVideo && (
                        <Tooltip title="View video" placement="top">
                            <IconButton
                                size="small"
                                onClick={() => setVideoModal(true)}
                                sx={{ position: "absolute", bottom: 6, right: 6, zIndex: 2, backgroundColor: "rgba(0,0,0,0.6)", color: "#fff", "&:hover": { backgroundColor: "rgba(0,0,0,0.85)" } }}
                            >
                                <VideocamIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    )}
                </Box>

                <Divider />

                <CardContent sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 1, p: "12px !important" }}>
                    <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={p.title}>{p.title}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>{p.sku}</Typography>
                    </Box>

                    <Stack direction="row" flexWrap="wrap" gap={0.5}>
                        <Chip size="small" label={isCombined ? "Combined" : "Single"} sx={{ fontSize: "0.65rem", height: 20, backgroundColor: isCombined ? "#1a1a1a" : "#6a95bf", color: "#fff" }} />
                        {variantCount > 0 && <Chip size="small" label={`${variantCount} variant${variantCount === 1 ? "" : "s"}`} sx={{ fontSize: "0.65rem", height: 20 }} />}
                    </Stack>

                    <Box>
                        <Typography variant="caption" sx={{ color: "text.secondary", textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600, display: "block", marginBottom: 0.5 }}>Marketplaces</Typography>
                        {p.marketPlacesArray?.length > 0 ? (
                            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                                {p.marketPlacesArray.map(m => {
                                    const name = marketPlaces?.find(mp => mp._id.toString() === (m._id ? m._id.toString() : m.toString()))?.name;
                                    return name ? (
                                        <Chip key={m._id ?? m} size="small" label={name} clickable icon={<StorefrontIcon sx={{ fontSize: "0.7rem !important" }} />} onClick={() => addProductToCsv(name, p)} sx={{ fontSize: "0.65rem", height: 22, backgroundColor: "#87AE73", color: "#fff", "& .MuiChip-icon": { color: "#fff" } }} />
                                    ) : null;
                                })}
                            </Box>
                        ) : (
                            <Typography variant="caption" color="text.secondary">None</Typography>
                        )}
                    </Box>

                    {canEdit && (
                        <Stack spacing={0.75} sx={{ marginTop: "auto", pt: 1 }}>
                            <Stack direction="row" spacing={0.75}>
                                <Button fullWidth size="small" variant="contained" startIcon={<StorefrontIcon />} onClick={() => { setMarketplaceModal(true); setProduct({ ...p }); }}>Markets</Button>
                                <Button fullWidth size="small" variant="outlined" startIcon={<EditIcon />} onClick={() => {
                                    const resolveId = x => (x?._id ?? x)?.toString();
                                    const prod = { ...p };
                                    if (allBlanks) prod.blanks = (p.blanks || []).map(b => allBlanks.find(bl => bl._id?.toString() === resolveId(b)) ?? b).filter(Boolean);
                                    if (allColors) {
                                        prod.colors = (p.colors || []).map(c => allColors.find(co => co._id?.toString() === resolveId(c)) ?? c).filter(Boolean);
                                        prod.threadColors = (p.threadColors || []).map(c => allColors.find(co => co._id?.toString() === resolveId(c)) ?? c).filter(Boolean);
                                        if (p.defaultColor) prod.defaultColor = allColors.find(co => co._id?.toString() === resolveId(p.defaultColor)) ?? p.defaultColor;
                                    }
                                    setProduct(prod);
                                    setCreateProduct(true);
                                }}>Edit</Button>
                            </Stack>
                            <Stack direction="row" spacing={0.75}>
                                <Button fullWidth size="small" variant="outlined" color="secondary" startIcon={<VisibilityIcon />} onClick={() => { setProduct({ ...p }); setCreateProduct(true); setPreview(true); }}>Preview</Button>
                                <Tooltip title={videoGenerating ? "Generating new video — click to check progress" : productVideo ? "View / regenerate video" : "Generate product video"}>
                                    <Button
                                        fullWidth size="small"
                                        variant={productVideo ? "contained" : videoGenerating ? "outlined" : "outlined"}
                                        color={productVideo && !videoGenerating ? "secondary" : videoGenerating ? "warning" : "inherit"}
                                        startIcon={
                                            videoGenerating
                                                ? <Box sx={{ position: "relative", display: "flex", alignItems: "center" }}>
                                                    <VideocamIcon fontSize="small" />
                                                    <CircularProgress size={10} color="warning" sx={{ position: "absolute", top: -3, right: -5 }} />
                                                  </Box>
                                                : <VideocamIcon />
                                        }
                                        onClick={() => setVideoModal(true)}
                                        sx={{ minWidth: 0 }}
                                    >
                                        {videoGenerating ? "Generating…" : "Video"}
                                    </Button>
                                </Tooltip>
                            </Stack>
                        </Stack>
                    )}
                </CardContent>

                <DeleteModal open={deleteModal} setOpen={setDeleteModal} title={deleteTitle} onDelete={deleteFunction.onDelete} deleteImage={deleteImage} type={type} />

                <VideoModal
                    open={videoModal}
                    onClose={() => setVideoModal(false)}
                    product={p}
                    onPollStart={() => setVideoGenerating(true)}
                    onVideoSaved={(url) => {
                        setVideoGenerating(false);
                        setProductVideo(url);
                        setDesign(d => ({
                            ...d,
                            products: (d.products ?? []).map(prod =>
                                prod._id === p._id ? { ...prod, video: url } : prod
                            ),
                        }));
                    }}
                />
            </Card>
        </Grid2>
    );
};

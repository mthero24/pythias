"use client";
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, Typography, Box, Stack, Chip, TextField,
    CircularProgress, Card, CardContent, Divider, IconButton, ToggleButton, ToggleButtonGroup,
    Tooltip, Checkbox, FormControlLabel, Alert, Grid2, Slider, LinearProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import VideocamIcon from "@mui/icons-material/Videocam";
import SlowMotionVideoIcon from "@mui/icons-material/SlowMotionVideo";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { useState, useRef, useEffect } from "react";
import { MUSIC_TRACKS } from "../shared/videoTracks";

function hexLuminance(hex) {
    const h = (hex ?? "").replace("#", "");
    if (h.length < 6) return 0.5;
    const r = parseInt(h.slice(0, 2), 16) / 255;
    const g = parseInt(h.slice(2, 4), 16) / 255;
    const b = parseInt(h.slice(4, 6), 16) / 255;
    const lin = c => c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

// Perceptual RGB distance (0–441). Values below ~80 are visually similar colors.
function colorDistance(hex1, hex2) {
    const p = h => { const s = (h ?? "").replace("#", ""); return [parseInt(s.slice(0,2),16)||0, parseInt(s.slice(2,4),16)||0, parseInt(s.slice(4,6),16)||0]; };
    const [r1,g1,b1] = p(hex1), [r2,g2,b2] = p(hex2);
    // Weight channels by human perception (same weights as luminance)
    return Math.sqrt(2*(r1-r2)**2 + 4*(g1-g2)**2 + 3*(b1-b2)**2);
}

// Samples the design image and returns { tone, dominantHex, palette }.
// palette = up to 5 distinct prominent colors found in the design.
async function analyzeDesignImage(url) {
    const fallback = { tone: "unknown", dominantHex: null, palette: [] };
    if (!url || typeof document === "undefined") return fallback;
    return new Promise(resolve => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            try {
                const canvas = document.createElement("canvas");
                const scale = Math.min(1, 80 / Math.max(img.naturalWidth, img.naturalHeight));
                canvas.width = Math.round(img.naturalWidth * scale);
                canvas.height = Math.round(img.naturalHeight * scale);
                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
                let lumSum = 0, rSum = 0, gSum = 0, bSum = 0, count = 0;
                // Bucket pixels into 6-bit color bins (64 levels per channel) for palette extraction
                const bins = {};
                for (let i = 0; i < data.length; i += 4) {
                    if (data[i + 3] < 30) continue;
                    const r = data[i], g = data[i + 1], b = data[i + 2];
                    const lin = c => { const n = c / 255; return n <= 0.04045 ? n / 12.92 : Math.pow((n + 0.055) / 1.055, 2.4); };
                    lumSum += 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
                    rSum += r; gSum += g; bSum += b;
                    count++;
                    // Quantize to 5-bit per channel for binning
                    const key = `${r >> 3},${g >> 3},${b >> 3}`;
                    bins[key] = (bins[key] ?? { r: 0, g: 0, b: 0, n: 0 });
                    bins[key].r += r; bins[key].g += g; bins[key].b += b; bins[key].n++;
                }
                if (count === 0) return resolve(fallback);
                const avg = lumSum / count;
                const tone = avg < 0.25 ? "dark" : avg > 0.65 ? "light" : "unknown";
                const toHex = n => Math.round(n / count).toString(16).padStart(2, "0");
                const dominantHex = `#${toHex(rSum)}${toHex(gSum)}${toHex(bSum)}`;

                // Build palette: pick top bins by pixel count, ensuring each is visually distinct
                const sorted = Object.values(bins).sort((a, b) => b.n - a.n);
                const palette = [];
                for (const bin of sorted) {
                    if (palette.length >= 5) break;
                    const hex = `#${Math.round(bin.r/bin.n).toString(16).padStart(2,"0")}${Math.round(bin.g/bin.n).toString(16).padStart(2,"0")}${Math.round(bin.b/bin.n).toString(16).padStart(2,"0")}`;
                    if (palette.every(p => colorDistance(p, hex) > 40)) palette.push(hex);
                }

                resolve({ tone, dominantHex, palette });
            } catch { resolve(fallback); }
        };
        img.onerror = () => resolve(fallback);
        img.src = url;
    });
}

// Score a garment hex against the design palette (1–10).
// Uses luminance contrast + minimum color distance from all prominent design colors.
function scoreGarmentColor(garmentHex, designTone, palette) {
    const hex = garmentHex ? `#${garmentHex.replace("#", "")}` : null;
    if (!hex || hex.replace("#", "").length < 6) return null;
    const garmentLum = hexLuminance(hex);

    // Hard fails — design tone vs garment lightness
    if (designTone === "dark"  && garmentLum < 0.12) return 1;
    if (designTone === "light" && garmentLum > 0.72) return 1;

    if (palette.length === 0) return null;

    // Closest design color to this garment — if too close, it will clash
    const minDist = Math.min(...palette.map(p => colorDistance(p, hex)));
    if (minDist < 50) return 2; // garment color appears in the design

    // Average distance from all design palette colors (higher = more neutral/safe)
    const avgDist = palette.reduce((s, p) => s + colorDistance(p, hex), 0) / palette.length;

    // Luminance contrast against the closest design palette color
    const closestPaletteHex = palette.reduce((best, p) => colorDistance(p, hex) < colorDistance(best, hex) ? p : best, palette[0]);
    const lumContrast = Math.abs(garmentLum - hexLuminance(closestPaletteHex));

    // Weighted score: 55% lum contrast, 45% avg color distance
    const raw = lumContrast * 0.55 + Math.min(avgDist / 300, 1) * 0.45;
    return Math.max(3, Math.min(10, Math.round(raw * 7) + 3));
}

// Resolve a color ref (ObjectId string or populated object) against a colors array
const resolveColor = (ref, allColors) => {
    if (!ref) return null;
    if (typeof ref === "object" && ref.name) return ref;
    const id = ref._id?.toString() ?? ref.toString();
    return allColors?.find(c => c._id?.toString() === id) ?? null;
};

function ColorSwatch({ color, selected, onClick, score }) {
    const hex = color.hexcode ? `#${color.hexcode.replace("#", "")}` : "#cccccc";
    const scoreBg = score == null ? null : score >= 8 ? "#22c55e" : score >= 5 ? "#f59e0b" : "#ef4444";
    return (
        <Tooltip title={score != null ? `${color.name} — ${score}/10` : color.name}>
            <Box
                onClick={onClick}
                sx={{
                    width: 36, height: 36, borderRadius: "50%",
                    background: hex,
                    border: selected ? "3px solid #6366f1" : "2px solid #e2e8f0",
                    cursor: "pointer",
                    position: "relative",
                    transition: "transform 0.1s",
                    "&:hover": { transform: "scale(1.15)" },
                    boxShadow: selected ? "0 0 0 2px #fff, 0 0 0 4px #6366f1" : "none",
                }}
            >
                {selected && (
                    <CheckCircleIcon sx={{
                        position: "absolute", bottom: -4, right: -4,
                        fontSize: 14, color: "#6366f1", background: "#fff", borderRadius: "50%",
                    }} />
                )}
                {score != null && (
                    <Box sx={{
                        position: "absolute", top: -6, right: -6,
                        minWidth: 18, height: 18, borderRadius: "9px",
                        background: scoreBg, border: "1.5px solid #fff",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        px: "3px",
                        fontSize: "0.6rem", fontWeight: 800, color: "#fff", lineHeight: 1,
                        pointerEvents: "none",
                    }}>
                        {score}
                    </Box>
                )}
            </Box>
        </Tooltip>
    );
}

export function AiProductModal({ open, onClose, design, blanks, colors, marketPlaces, brands, onConfirm, source, slug }) {
    const [selectedBlankIds, setSelectedBlankIds] = useState([]);
    const [maxColors, setMaxColors] = useState(4);
    const [selectedTheme, setSelectedTheme] = useState("default");
    const [selectedBrand, setSelectedBrand] = useState(null);
    const [selectedMarketplaceIds, setSelectedMarketplaceIds] = useState([]);
    const [filterDepartment, setFilterDepartment] = useState(null);
    const [filterCategory, setFilterCategory] = useState(null);
    const [generating, setGenerating] = useState(false);
    const [results, setResults] = useState(null);
    const [toggledColors, setToggledColors] = useState({}); // blankId → Set of colorIds
    const [editedProduct, setEditedProduct] = useState(null);
    const [editedProducts, setEditedProducts] = useState({}); // individual mode: blankId → product data
    const [error, setError] = useState("");
    const [combined, setCombined] = useState(false);
    const [videoUrl, setVideoUrl] = useState(null);
    const [videoGenerating, setVideoGenerating] = useState(false);
    const [videoUploading, setVideoUploading] = useState(false);
    const [videoError, setVideoError] = useState("");
    const [selectedVideoTrackId, setSelectedVideoTrackId] = useState("none");
    const [videoTracks, setVideoTracks] = useState(MUSIC_TRACKS);
    const [includeBack, setIncludeBack] = useState(true);
    const contentRef = useRef(null);
    const videoPollRef = useRef(null);

    useEffect(() => {
        fetch("/api/admin/music-tracks")
            .then(r => r.json())
            .then(data => {
                if (data.tracks?.length) {
                    const custom = data.tracks.map(t => ({ id: t._id, name: t.name, url: t.url }));
                    setVideoTracks([MUSIC_TRACKS[0], ...custom]);
                }
            })
            .catch(() => {});
    }, []);
    const videoUploadRef = useRef(null);

    const handleVideoUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setVideoUploading(true);
        setVideoError("");
        try {
            const form = new FormData();
            form.append("video", file);
            const res = await fetch("/api/admin/product-video-upload", { method: "POST", body: form });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setVideoUrl(data.videoUrl);
        } catch (e) {
            setVideoError(e.message ?? "Upload failed");
        } finally {
            setVideoUploading(false);
            e.target.value = "";
        }
    };

    useEffect(() => {
        if (results) contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    }, [results]);

    const allBlanks = blanks ?? [];

    const toggleBlank = (id) => setSelectedBlankIds(prev =>
        prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
    const toggleMarketplace = (id) => setSelectedMarketplaceIds(prev =>
        prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
    const toggleColor = (blankId, colorId) => {
        setToggledColors(prev => {
            const set = new Set(prev[blankId] ?? []);
            set.has(colorId) ? set.delete(colorId) : set.add(colorId);
            return { ...prev, [blankId]: set };
        });
    };

    const getBlankColors = (blank) =>
        (blank?.colors ?? []).map(c => resolveColor(c, colors)).filter(Boolean);

    const handleGenerate = async () => {
        setGenerating(true);
        setError("");
        setResults(null);
        setEditedProduct(null);
        setEditedProducts({});
        try {
            const imageUrl = design?.images?.front
                ?? Object.values(design?.images ?? {}).find(v => typeof v === "string" && v.startsWith("http"));

            const selectedBlanks = allBlanks.filter(b => selectedBlankIds.includes(b._id?.toString()));

            const mpPayload = (marketPlaces ?? [])
                .filter(mp => selectedMarketplaceIds.includes(mp._id?.toString()))
                .map(mp => ({
                    _id: mp._id.toString(),
                    name: mp.name,
                    dropDowns: Object.fromEntries(
                        Object.entries(mp.productDropDowns ?? {})
                            .filter(([k]) => k !== "titleGenerator" && k !== "required")
                    ),
                }));

            // Apply titleGenerator template for a marketplace given product data and blank
            const applyTg = (mp, product, blank) => {
                const tgPrompt = mp.productDropDowns?.titleGenerator?.prompt;
                if (!tgPrompt) return null;
                const result = tgPrompt
                    .replace("{design}", design?.name ?? "")
                    .replace("{blank}", blank?.name ?? "")
                    .replace("{gender}", product?.gender ?? "")
                    .replace("{brand}", "")
                    .replace("{season}", "")
                    .replace("{theme}", "")
                    .replace("{sportUsedFor}", "")
                    .replace(/(\s*-\s*){2,}/g, " - ")
                    .replace(/^\s*-\s*/, "")
                    .replace(/\s*-\s*$/, "")
                    .replace(/\s{2,}/g, " ")
                    .trim();
                return result || null;
            };

            const { tone: designTone, dominantHex: designHex, palette: designPalette } = await analyzeDesignImage(imageUrl);

            const filterColorsForDesign = (cols) => cols.filter(c => {
                const score = scoreGarmentColor(c.hexcode, designTone, designPalette);
                return score == null || score >= 7;
            });

            // Compute algorithmic color scores for all colors in a blank using the design palette
            const computeScores = (blank) =>
                getBlankColors(blank).map(c => {
                    const score = scoreGarmentColor(c.hexcode, designTone, designPalette);
                    return score != null ? { colorId: c._id.toString(), score } : null;
                }).filter(Boolean);

            if (combined || selectedBlanks.length <= 1) {
                // Combined mode: one API call for all blanks
                const blanksPayload = selectedBlanks.map(b => ({
                    blankId: b._id.toString(),
                    blankName: b.name,
                    colors: filterColorsForDesign(getBlankColors(b))
                        .map(c => ({ _id: c._id.toString(), name: c.name, hexcode: c.hexcode ?? "", score: scoreGarmentColor(c.hexcode, designTone, designPalette) ?? 7 }))
                        .sort((a, b) => b.score - a.score),
                }));
                const res = await fetch("/api/admin/ai-product", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        imageUrl,
                        designName: design?.name,
                        designDescription: design?.description ?? "",
                        blankDescriptions: selectedBlanks.map(b => b.description).filter(Boolean),
                        blanks: blanksPayload,
                        maxColors,
                        brand: selectedBrand?.name ?? "",
                        marketplaces: mpPayload,
                    }),
                });
                const data = await res.json();
                if (data.error) throw new Error(data.error);

                // Inject algorithmic color scores
                (data.blanks ?? []).forEach(rb => {
                    const blank = selectedBlanks.find(b => b._id.toString() === rb.blankId);
                    if (blank) rb.colorScores = computeScores(blank);
                });

                const marketplaceData = { ...(data.marketplaceData ?? {}) };
                const firstBlank = selectedBlanks[0];
                (marketPlaces ?? []).filter(mp => selectedMarketplaceIds.includes(mp._id?.toString())).forEach(mp => {
                    const generated = applyTg(mp, data.product, firstBlank);
                    if (generated) marketplaceData[mp.name] = { ...(marketplaceData[mp.name] ?? {}), title: generated };
                });

                const toggled = {};
                (data.blanks ?? []).forEach(rb => {
                    const blank = selectedBlanks.find(b => b._id.toString() === rb.blankId);
                    const validIds = new Set(getBlankColors(blank ?? {}).map(c => c._id.toString()));
                    toggled[rb.blankId] = new Set((rb.selectedColorIds ?? []).filter(id => validIds.has(id)));
                });
                setToggledColors(toggled);
                setResults({ ...data, marketplaceData });
                setEditedProduct({ ...data.product, tags: data.product?.tags ?? [] });
            } else {
                // Individual mode: parallel API call per blank so each gets tailored data
                const calls = await Promise.all(
                    selectedBlanks.map(async b => {
                        const r = await fetch("/api/admin/ai-product", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                imageUrl,
                                designName: design?.name,
                                designDescription: design?.description ?? "",
                                blankDescriptions: [b.description].filter(Boolean),
                                blanks: [{
                                    blankId: b._id.toString(),
                                    blankName: b.name,
                                    colors: filterColorsForDesign(getBlankColors(b))
                                        .map(c => ({ _id: c._id.toString(), name: c.name, hexcode: c.hexcode ?? "", score: scoreGarmentColor(c.hexcode, designTone, designPalette) ?? 7 }))
                                        .sort((a, b) => b.score - a.score),
                                }],
                                maxColors,
                                brand: selectedBrand?.name ?? "",
                                marketplaces: mpPayload,
                            }),
                        });
                        const d = await r.json();
                        return { blankId: b._id.toString(), blank: b, data: d };
                    })
                );

                const failed = calls.find(c => c.data.error);
                if (failed) throw new Error(failed.data.error);

                const allBlanksResult = [];
                const perBlank = {};
                const toggled = {};
                const newEditedProducts = {};

                for (const { blankId, blank, data } of calls) {
                    if (data.blanks?.[0]) {
                        const rb = data.blanks[0];
                        rb.colorScores = computeScores(blank);
                        allBlanksResult.push(rb);
                        const validIds = new Set(getBlankColors(blank).map(c => c._id.toString()));
                        toggled[blankId] = new Set((rb.selectedColorIds ?? []).filter(id => validIds.has(id)));
                    }
                    const mpData = { ...(data.marketplaceData ?? {}) };
                    (marketPlaces ?? []).filter(mp => selectedMarketplaceIds.includes(mp._id?.toString())).forEach(mp => {
                        const generated = applyTg(mp, data.product, blank);
                        if (generated) mpData[mp.name] = { ...(mpData[mp.name] ?? {}), title: generated };
                    });
                    perBlank[blankId] = { product: data.product ?? {}, marketplaceData: mpData };
                    newEditedProducts[blankId] = { ...(data.product ?? {}), tags: data.product?.tags ?? [] };
                }

                setToggledColors(toggled);
                setResults({ blanks: allBlanksResult, perBlank });
                setEditedProducts(newEditedProducts);
            }
        } catch (e) {
            setError(e.message ?? "Generation failed");
        } finally {
            setGenerating(false);
        }
    };

    const isPlatform = source === "platform";
    const renderBase = isPlatform
        ? `https://platform.pythiastechnologies.com/api/renderImages`
        : `/api/renderImages`;
    const renderSuffix = isPlatform && slug ? `&orgSlug=${slug}` : "";
    const designSides = Object.keys(design?.images ?? {});
    const sidesStr = designSides.length > 0 ? designSides.join("_") : "front";

    const blankDepartments = [...new Set(allBlanks.map(b => b.department).filter(Boolean))];
    const blankCategories = [...new Set(allBlanks.flatMap(b => b.category ?? []).filter(Boolean))];

    // Themes available across currently-selected blanks (excluding "model" and "default" which are structural)
    const availableThemes = [...new Set(
        allBlanks
            .filter(b => selectedBlankIds.includes(b._id?.toString()))
            .flatMap(b => (b.images ?? []).map(img => img.imageGroup).filter(g => g && g !== "default"))
    )].sort();
    const filteredBlanks = allBlanks.filter(b =>
        (!filterDepartment || b.department === filterDepartment) &&
        (!filterCategory || (b.category ?? []).includes(filterCategory))
    );

    const cdn = (url) => url?.replace("https://images1.pythiastechnologies.com", "https://images2.pythiastechnologies.com/origin") ?? url;

    const getBlankPreviewUrl = (blank) => {
        const designImages = designSides.length > 0 ? designSides : ["front"];

        if (blank.images?.length > 0) {
            // Use first image's color (matches BlankStage convention)
            const colorRef = blank.images[0].color;
            const colorId = colorRef?._id?.toString() ?? colorRef?.toString();
            const colorName = colors.find(c => c._id?.toString() === colorId)?.name;

            if (colorName) {
                // Prefer image with a design-side print box
                const bm = blank.images.find(im =>
                    Object.keys(im.boxes ?? {}).some(e => designImages.includes(e))
                );
                if (bm) {
                    const codeKey = blank.code.replace(/-/g, "_");
                    const fileBase = bm.image.split("/").pop().split(".")[0];
                    return encodeURI(`${renderBase}/${design.sku}-${codeKey}-${fileBase}-${colorName.replace(/\//g, "_")}-${sidesStr}.jpg?width=200${renderSuffix}`);
                }
            }

            // No boxes found — show plain blank image from CDN
            const fallbackImg = blank.images[0]?.image;
            if (fallbackImg) return `${cdn(fallbackImg)}?width=200`;
        }

        // No blank.images — try multiImages
        const firstSide = Object.keys(blank.multiImages ?? {})[0];
        if (firstSide) {
            const img = blank.multiImages[firstSide]?.[0]?.image;
            if (img) return `${cdn(img)}?width=200`;
        }

        return null;
    };

    const makeRenderUrl = (blank, img, color, sides) => {
        const codeKey = blank.code.replace(/-/g, "_");
        const fileBase = img.image.split("/").pop().split(".")[0];
        const image = encodeURI(`${renderBase}/${design.sku}-${codeKey}-${fileBase}-${color.name.replace(/\//g, "_")}-${sides}.jpg?width=400${renderSuffix}`);
        const sku = `${design.printType}_${design.sku}_${color.sku ?? color.name.toLowerCase().replace(/\s+/g, "_")}_${codeKey}_${fileBase}-${color.name.replace(/\//g, "_")}-${sides}`;
        return { image, blank: blank._id, color: color._id, sku, side: sides };
    };

    // Select up to 3 rendered product images per color: (1) model/lifestyle front, (2) garment/flat front, (3) back.
    // globalUsed tracks images already picked across all colors/blanks so each gets different images where possible.
    const selectImagesForColor = (blank, colorId, color, globalUsed) => {
        const picked = [];
        const usedLocal = new Set();

        const primarySides = designSides.length > 0 ? designSides : ["front"];
        const frontSide = primarySides.includes("front") ? "front" : primarySides[0] ?? "front";

        const matchesColor = m => !m.color || (m.color._id ?? m.color).toString() === colorId;
        const isColorSpecific = m => m.color && (m.color._id ?? m.color).toString() === colorId;

        const allImages   = blank.images ?? [];
        const colorImages = allImages.filter(m => isColorSpecific(m));
        const anyImages   = allImages.filter(m => matchesColor(m));

        const hasBoxForSide = (m, side) => Object.keys(m.boxes ?? {}).includes(side);
        const isModel   = m => m.isModel === true || m.imageGroup === "model";
        const isGarment = m => !isModel(m);

        // Prefer globally unused images; fall back to globally used if pool is exhausted.
        const pick = (pool, sides) => {
            const fresh = pool.find(m => !usedLocal.has(m.image) && !globalUsed.has(m.image));
            const bm    = fresh ?? pool.find(m => !usedLocal.has(m.image));
            if (bm) {
                usedLocal.add(bm.image);
                globalUsed.add(bm.image);
                picked.push(makeRenderUrl(blank, bm, color, sides));
            }
        };

        // Slot 1 — model/lifestyle: color-specific first, then unassigned
        const modelPool = [
            ...colorImages.filter(m => isModel(m) && hasBoxForSide(m, frontSide)),
            ...anyImages.filter(m => isModel(m) && hasBoxForSide(m, frontSide) && !isColorSpecific(m)),
        ];
        pick(modelPool, sidesStr);

        // Slot 2 — garment/flat: color-specific, prefer selected theme then default; fall back to a second model image
        const garmentByTheme = colorImages.filter(m => isGarment(m) && m.imageGroup === selectedTheme && primarySides.some(s => hasBoxForSide(m, s)));
        const garmentPool = garmentByTheme.length > 0
            ? garmentByTheme
            : colorImages.filter(m => isGarment(m) && (!m.imageGroup || m.imageGroup === "default") && primarySides.some(s => hasBoxForSide(m, s)));
        if (garmentPool.length > 0) {
            pick(garmentPool, sidesStr);
        } else {
            const modelFallback = [
                ...colorImages.filter(m => isModel(m) && hasBoxForSide(m, frontSide)),
                ...anyImages.filter(m => isModel(m) && hasBoxForSide(m, frontSide) && !isColorSpecific(m)),
            ];
            pick(modelFallback, sidesStr);
        }

        // Slot 3 — back: model back first, then themed flat, then any.
        // Images with only a back box use "back"; images with front+back boxes use sidesStr (join).
        if (includeBack) {
            const backPool = [
                ...colorImages.filter(m => isModel(m)   && hasBoxForSide(m, "back")),
                ...anyImages.filter(m  => isModel(m)    && hasBoxForSide(m, "back") && !isColorSpecific(m)),
                ...colorImages.filter(m => isGarment(m) && hasBoxForSide(m, "back") && m.imageGroup === selectedTheme),
                ...colorImages.filter(m => isGarment(m) && hasBoxForSide(m, "back")),
                ...anyImages.filter(m  => isGarment(m)  && hasBoxForSide(m, "back") && !isColorSpecific(m)),
            ];
            const backImg = backPool.find(m => !usedLocal.has(m.image) && !globalUsed.has(m.image))
                ?? backPool.find(m => !usedLocal.has(m.image));
            if (backImg) {
                const backBoxes = Object.keys(backImg.boxes ?? {});
                const backSide = backBoxes.some(b => b !== "back" && primarySides.includes(b)) ? sidesStr : "back";
                usedLocal.add(backImg.image);
                globalUsed.add(backImg.image);
                picked.push(makeRenderUrl(blank, backImg, color, backSide));
            }
        }

        return picked;
    };

    const handleConfirm = () => {
        if (!results) return;
        const blankSelections = (results.blanks ?? []).map(rb => {
            const blank = allBlanks.find(b => b._id.toString() === rb.blankId);
            if (!blank) return null;
            const allBlankColors = getBlankColors(blank);
            const selectedIds = toggledColors[rb.blankId] ?? new Set();
            const selectedColors = allBlankColors.filter(c => selectedIds.has(c._id.toString()));
            const scoreMap = Object.fromEntries((rb.colorScores ?? []).map(s => [s.colorId, s.score]));
            const defaultColor = [...selectedColors].sort((a, b) =>
                (scoreMap[b._id.toString()] ?? 0) - (scoreMap[a._id.toString()] ?? 0)
            )[0] ?? null;
            return {
                blank,
                colors: selectedColors,
                defaultColor,
            };
        }).filter(Boolean);

        // Build all image maps across every blank selection
        const variantImages = {};           // [blank.code][color.name] = { image, sku }
        const variantSecondaryImages = {};  // [blank.code][color.name] = [{ image, sku }, ...]
        const _variantUrls = {};            // internal: "blankCode__colorName" → [url, ...]
        const productImages = [];
        const productImageSet = new Set();
        const globalUsed = new Set();       // tracks images used across all colors/blanks
        blankSelections.forEach(bs => {
            const bCode = bs.blank.code;
            if (!variantImages[bCode]) variantImages[bCode] = {};
            if (!variantSecondaryImages[bCode]) variantSecondaryImages[bCode] = {};
            bs.colors.forEach(c => {
                const cid = c._id.toString();
                const imgObjs = selectImagesForColor(bs.blank, cid, c, globalUsed);
                if (imgObjs.length > 0) {
                    variantImages[bCode][c.name] = { image: imgObjs[0].image, sku: imgObjs[0].sku };
                }
                variantSecondaryImages[bCode][c.name] = imgObjs.slice(1).map(o => ({ image: o.image, sku: o.sku }));
                _variantUrls[`${bCode}__${c.name}`] = imgObjs.map(o => o.image);
                imgObjs.forEach(o => {
                    if (!productImageSet.has(o.image)) {
                        productImageSet.add(o.image);
                        productImages.push(o);
                    }
                });
            });
        });

        const firstBlankSel = blankSelections[0]?.blank;
        const gender = editedProduct?.gender ?? "";
        const marketplaceValues = {};
        (marketPlaces ?? []).forEach(mp => {
            const mpData = results.marketplaceData?.[mp.name];
            if (!mpData) return;
            const tgPrompt = mp.productDropDowns?.titleGenerator?.prompt;
            const titleGeneratorValue = tgPrompt
                ? tgPrompt
                    .replace("{design}", design?.name ?? "")
                    .replace("{blank}", firstBlankSel?.name ?? "")
                    .replace("{gender}", gender)
                    .replace("{brand}", "")
                    .replace("{season}", "")
                    .replace("{theme}", "")
                    .replace("{sportUsedFor}", "")
                    .replace(/\s{2,}/g, " ")
                    .trim()
                : null;
            marketplaceValues[mp._id.toString()] = {
                ...mpData,
                name: mp.name,
                ...(titleGeneratorValue ? { titleGenerator: titleGeneratorValue } : {}),
            };
        });

        const marketPlacesArray = Object.keys(marketplaceValues);

        const baseProduct = {
            design,
            threadColors: [],
            variants: [],
            title: editedProduct?.title ?? "",
            description: editedProduct?.description ?? "",
            tags: editedProduct?.tags ?? [],
            gender,
            category: editedProduct?.category ?? [],
            brand: selectedBrand?.name ?? "",
            marketplaceValues,
            marketPlacesArray,
        };

        let products;
        if (combined || blankSelections.length <= 1) {
            // One combined product with all blanks
            const allSelectedColors = blankSelections.flatMap(b => b.colors)
                .filter((c, i, arr) => arr.findIndex(x => x._id.toString() === c._id.toString()) === i);
            const allSizes = blankSelections.flatMap(b => b.blank.sizes ?? [])
                .filter((s, i, arr) => arr.findIndex(x => x.name === s.name) === i);
            // Build a combined score map across all blanks to pick the best default color
            const combinedScoreMap = Object.fromEntries(
                (results.blanks ?? []).flatMap(rb => (rb.colorScores ?? []).map(s => [s.colorId, s.score]))
            );
            const defaultColor = [...allSelectedColors].sort((a, b) =>
                (combinedScoreMap[b._id.toString()] ?? 0) - (combinedScoreMap[a._id.toString()] ?? 0)
            )[0] ?? null;
            products = [{
                ...baseProduct,
                blanks: blankSelections,
                colors: allSelectedColors,
                defaultColor,
                sizes: allSizes,
                video: videoUrl ?? undefined,
                productImages,
                variantImages,
                variantSecondaryImages,
                _variantUrls,
            }];
        } else {
            // One product per blank, each with its own AI-generated data
            products = blankSelections.map(bs => {
                const bCode = bs.blank.code;
                const bIdStr = bs.blank._id?.toString();
                const perBlankData = editedProducts[bIdStr] ?? {};
                const perBlankMpData = results.perBlank?.[bIdStr]?.marketplaceData ?? {};
                const bGender = perBlankData.gender ?? "";

                const bMarketplaceValues = {};
                (marketPlaces ?? []).forEach(mp => {
                    const mpData = perBlankMpData[mp.name];
                    if (!mpData) return;
                    const tgPrompt = mp.productDropDowns?.titleGenerator?.prompt;
                    const titleGeneratorValue = tgPrompt
                        ? tgPrompt
                            .replace("{design}", design?.name ?? "")
                            .replace("{blank}", bs.blank?.name ?? "")
                            .replace("{gender}", bGender)
                            .replace("{brand}", "")
                            .replace("{season}", "")
                            .replace("{theme}", "")
                            .replace("{sportUsedFor}", "")
                            .replace(/\s{2,}/g, " ")
                            .trim()
                        : null;
                    bMarketplaceValues[mp._id.toString()] = {
                        ...mpData,
                        name: mp.name,
                        ...(titleGeneratorValue ? { titleGenerator: titleGeneratorValue } : {}),
                    };
                });

                return {
                    design,
                    threadColors: [],
                    variants: [],
                    brand: selectedBrand?.name ?? "",
                    blanks: [bs],
                    colors: bs.colors,
                    defaultColor: bs.defaultColor,
                    sizes: bs.blank.sizes ?? [],
                    video: videoUrl ?? undefined,
                    title: perBlankData.title ?? "",
                    description: perBlankData.description ?? "",
                    tags: perBlankData.tags ?? [],
                    gender: bGender,
                    category: perBlankData.category ?? [],
                    marketplaceValues: bMarketplaceValues,
                    marketPlacesArray: Object.keys(bMarketplaceValues),
                    productImages: productImages.filter(o => o.blank?.toString() === bIdStr),
                    variantImages: { [bCode]: variantImages[bCode] ?? {} },
                    variantSecondaryImages: { [bCode]: variantSecondaryImages[bCode] ?? {} },
                    _variantUrls: Object.fromEntries(Object.entries(_variantUrls).filter(([k]) => k.startsWith(`${bCode}__`))),
                };
            });
        }

        handleClose();
        onConfirm(products);
    };

    const handleClose = () => {
        clearInterval(videoPollRef.current);
        setResults(null);
        setEditedProduct(null);
        setEditedProducts({});
        setToggledColors({});
        setSelectedBlankIds([]);
        setSelectedMarketplaceIds([]);
        setSelectedBrand(null);
        setSelectedTheme("default");
        setFilterDepartment(null);
        setFilterCategory(null);
        setError("");
        setCombined(false);
        setVideoUrl(null);
        setVideoGenerating(false);
        setVideoUploading(false);
        setVideoError("");
        setSelectedVideoTrackId("none");
        setIncludeBack(true);
        onClose();
    };

    // Collect rendered image URLs for the current selection (used for video generation)
    const getVideoImageUrls = () => {
        const urls = [];
        const seen = new Set();
        (results?.blanks ?? []).forEach(rb => {
            const blank = allBlanks.find(b => b._id.toString() === rb.blankId);
            if (!blank) return;
            const toggled = [...(toggledColors[rb.blankId] ?? new Set())];
            toggled.slice(0, 2).forEach(colorId => {
                const color = (blank.colors ?? []).map(c => resolveColor(c, colors)).find(c => c?._id?.toString() === colorId);
                if (!color) return;
                selectImagesForColor(blank, colorId, color, new Set()).forEach(o => {
                    if (!seen.has(o.image)) { seen.add(o.image); urls.push(o.image); }
                });
            });
        });
        return urls.slice(0, 5);
    };

    const handleGenerateVideo = async (type) => {
        clearInterval(videoPollRef.current);
        setVideoGenerating(true);
        setVideoError("");
        setVideoUrl(null);
        const imageUrls = getVideoImageUrls();
        if (!imageUrls.length) {
            setVideoError("No product images found — ensure colors are selected.");
            setVideoGenerating(false);
            return;
        }
        const musicUrl = videoTracks.find(t => t.id === selectedVideoTrackId)?.url ?? null;
        try {
            const res = await fetch("/api/admin/ai-product-video", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type, imageUrl: imageUrls[0], imageUrls, musicUrl: musicUrl || undefined }),
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            if (type === "slideshow") {
                setVideoUrl(data.videoUrl);
                setVideoGenerating(false);
            } else {
                const pollUrl = `/api/admin/ai-product-video?taskId=${data.taskId}${musicUrl ? `&musicUrl=${encodeURIComponent(musicUrl)}` : ""}`;
                videoPollRef.current = setInterval(async () => {
                    try {
                        const p = await fetch(pollUrl);
                        const pd = await p.json();
                        if (pd.status === "done") {
                            clearInterval(videoPollRef.current);
                            setVideoUrl(pd.videoUrl);
                            setVideoGenerating(false);
                        } else if (pd.status === "failed") {
                            clearInterval(videoPollRef.current);
                            setVideoError(pd.error || "Video generation failed");
                            setVideoGenerating(false);
                        }
                    } catch { /* keep polling */ }
                }, 10000);
            }
        } catch (e) {
            setVideoError(e.message ?? "Video generation failed");
            setVideoGenerating(false);
        }
    };

    const configStep = !results;

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth
            PaperProps={{ sx: { height: "88vh", maxHeight: 780, display: "flex", flexDirection: "column" } }}>
            <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: 1.5, px: 3, borderBottom: "1px solid", borderColor: "divider" }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                    <AutoAwesomeIcon color="secondary" fontSize="small" />
                    <Typography variant="h6" fontWeight={700}>AI Product Creator</Typography>
                </Stack>
                <IconButton size="small" onClick={handleClose}><CloseIcon /></IconButton>
            </DialogTitle>

            <DialogContent ref={contentRef} sx={{ flex: 1, overflowY: "auto", p: 3 }}>
                {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}

                {configStep ? (
                    <Stack spacing={3}>
                        {/* Blank selection */}
                        <Box>
                            <Typography variant="subtitle2" fontWeight={700} mb={1}>
                                Select Blanks
                                <Typography component="span" variant="caption" color="text.secondary" ml={1}>
                                    ({selectedBlankIds.length} selected)
                                </Typography>
                            </Typography>

                            {/* Filters */}
                            {(blankDepartments.length > 0 || blankCategories.length > 0) && (
                                <Stack spacing={0.75} mb={1.25}>
                                    {blankDepartments.length > 0 && (
                                        <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" rowGap={0.5}>
                                            <Typography variant="caption" sx={{ color: "text.secondary", textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600, minWidth: 68, flexShrink: 0 }}>Dept</Typography>
                                            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                                                {blankDepartments.map(d => (
                                                    <Chip key={d} label={d} size="small" clickable
                                                        color={filterDepartment === d ? "secondary" : "default"}
                                                        variant={filterDepartment === d ? "filled" : "outlined"}
                                                        onClick={() => setFilterDepartment(filterDepartment === d ? null : d)}
                                                    />
                                                ))}
                                            </Box>
                                        </Stack>
                                    )}
                                    {blankCategories.length > 0 && (
                                        <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" rowGap={0.5}>
                                            <Typography variant="caption" sx={{ color: "text.secondary", textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600, minWidth: 68, flexShrink: 0 }}>Category</Typography>
                                            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                                                {blankCategories.map(c => (
                                                    <Chip key={c} label={c} size="small" clickable
                                                        color={filterCategory === c ? "secondary" : "default"}
                                                        variant={filterCategory === c ? "filled" : "outlined"}
                                                        onClick={() => setFilterCategory(filterCategory === c ? null : c)}
                                                    />
                                                ))}
                                            </Box>
                                        </Stack>
                                    )}
                                </Stack>
                            )}

                            {filteredBlanks.length === 0 ? (
                                <Typography variant="body2" color="text.secondary">No blanks match the selected filters.</Typography>
                            ) : (
                                <Grid2 container spacing={0.75}>
                                    {filteredBlanks.map(b => {
                                        const id = b._id?.toString();
                                        const selected = selectedBlankIds.includes(id);
                                        const previewUrl = getBlankPreviewUrl(b);
                                        const blankColors = getBlankColors(b);
                                        return (
                                            <Grid2 size={{ xs: 4, sm: 3, md: 2 }} key={id}>
                                                <Card
                                                    variant="outlined"
                                                    onClick={() => toggleBlank(id)}
                                                    sx={{
                                                        cursor: "pointer",
                                                        border: "2px solid",
                                                        borderColor: selected ? "secondary.main" : "divider",
                                                        borderRadius: 1.5,
                                                        overflow: "hidden",
                                                        position: "relative",
                                                        transition: "border-color 150ms, box-shadow 150ms",
                                                        "&:hover": { borderColor: "secondary.main", boxShadow: 1 },
                                                    }}
                                                >
                                                    <Checkbox
                                                        size="small"
                                                        checked={selected}
                                                        sx={{
                                                            position: "absolute", top: 2, right: 2, zIndex: 1,
                                                            padding: 0.25,
                                                            backgroundColor: "rgba(255,255,255,0.85)",
                                                            borderRadius: 0.75,
                                                        }}
                                                    />
                                                    <Box sx={{
                                                        aspectRatio: "1 / 1",
                                                        backgroundColor: "background.default",
                                                        display: "flex", alignItems: "center", justifyContent: "center",
                                                        p: 0.5, overflow: "hidden",
                                                    }}>
                                                        {previewUrl ? (
                                                            <img
                                                                src={previewUrl}
                                                                alt={b.name}
                                                                style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
                                                                onError={e => {
                                                                    e.currentTarget.style.display = "none";
                                                                    const fb = e.currentTarget.nextElementSibling;
                                                                    if (fb) fb.style.display = "block";
                                                                }}
                                                            />
                                                        ) : null}
                                                        <Typography variant="caption" color="text.disabled" textAlign="center"
                                                            sx={{ fontSize: "0.6rem", display: previewUrl ? "none" : "block", px: 0.5 }}>
                                                            {b.code}
                                                        </Typography>
                                                    </Box>
                                                    <Box sx={{ px: 0.75, py: 0.5, borderTop: "1px solid", borderColor: "divider" }}>
                                                        <Typography noWrap sx={{ display: "block", fontWeight: 600, fontSize: "0.65rem", lineHeight: 1.3 }}>{b.name}</Typography>
                                                        <Typography noWrap sx={{ display: "block", fontSize: "0.6rem", color: "text.secondary" }}>{blankColors.length} colors</Typography>
                                                    </Box>
                                                </Card>
                                            </Grid2>
                                        );
                                    })}
                                </Grid2>
                            )}
                        </Box>

                        {/* Product type: combined vs individual — visible when 2+ blanks selected */}
                        {selectedBlankIds.length >= 2 && (
                            <>
                                <Divider />
                                <Box>
                                    <Typography variant="subtitle2" fontWeight={700} mb={0.5}>Product Type</Typography>
                                    <ToggleButtonGroup
                                        value={combined ? "combined" : "individual"}
                                        exclusive
                                        onChange={(_, v) => { if (v !== null) setCombined(v === "combined"); }}
                                        size="small"
                                        sx={{ mb: 1 }}
                                    >
                                        <ToggleButton value="combined">Combined (1 product)</ToggleButton>
                                        <ToggleButton value="individual">Individual ({selectedBlankIds.length} products)</ToggleButton>
                                    </ToggleButtonGroup>
                                    <Typography variant="caption" color="text.secondary" display="block">
                                        {combined
                                            ? "All selected blanks will be combined into a single product"
                                            : `${selectedBlankIds.length} separate products will be created, one per blank`}
                                    </Typography>
                                </Box>
                            </>
                        )}

                        <Divider />

                        {/* Max colors */}
                        <Box>
                            <Typography variant="subtitle2" fontWeight={700} mb={0.5}>
                                Colors per blank: <Typography component="span" color="secondary.main" fontWeight={800}>{maxColors}</Typography>
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="block" mb={1.5}>
                                AI will select the best {maxColors} colors for each blank based on the design
                            </Typography>
                            <Stack direction="row" alignItems="center" spacing={2}>
                                <Slider
                                    value={maxColors}
                                    onChange={(_, v) => setMaxColors(v)}
                                    min={1} max={12} step={1}
                                    marks sx={{ flex: 1, color: "secondary.main" }}
                                />
                                <TextField
                                    size="small" type="number"
                                    value={maxColors}
                                    onChange={e => setMaxColors(Math.max(1, Math.min(12, parseInt(e.target.value) || 1)))}
                                    inputProps={{ min: 1, max: 12 }}
                                    sx={{ width: 70 }}
                                />
                            </Stack>
                        </Box>

                        <Divider />

                        {/* Image theme */}
                        {availableThemes.length > 0 && (
                            <Box>
                                <Typography variant="subtitle2" fontWeight={700} mb={1}>
                                    Image Theme
                                    <Typography component="span" variant="caption" color="text.secondary" ml={1}>(optional)</Typography>
                                </Typography>
                                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                                    <Chip
                                        label="default"
                                        size="small"
                                        variant={selectedTheme === "default" ? "filled" : "outlined"}
                                        color={selectedTheme === "default" ? "secondary" : "default"}
                                        onClick={() => setSelectedTheme("default")}
                                        sx={{ cursor: "pointer" }}
                                    />
                                    {availableThemes.map(t => (
                                        <Chip
                                            key={t}
                                            label={t}
                                            size="small"
                                            variant={selectedTheme === t ? "filled" : "outlined"}
                                            color={selectedTheme === t ? "secondary" : "default"}
                                            onClick={() => setSelectedTheme(t)}
                                            sx={{ cursor: "pointer" }}
                                        />
                                    ))}
                                </Box>
                            </Box>
                        )}

                        <Divider />

                        {/* Image options */}
                        <Box>
                            <Typography variant="subtitle2" fontWeight={700} mb={1}>Image Options</Typography>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={includeBack}
                                        onChange={e => setIncludeBack(e.target.checked)}
                                        size="small"
                                        color="secondary"
                                    />
                                }
                                label={
                                    <Box>
                                        <Typography variant="body2" fontWeight={500}>Include back image</Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            Adds a back-view image as a secondary gallery image per color
                                        </Typography>
                                    </Box>
                                }
                            />
                        </Box>

                        <Divider />

                        {/* Brand selection */}
                        {(brands ?? []).length > 0 && (
                            <>
                                <Divider />
                                <Box>
                                    <Typography variant="subtitle2" fontWeight={700} mb={1}>
                                        Brand
                                        <Typography component="span" variant="caption" color="error.main" ml={1}>*required</Typography>
                                    </Typography>
                                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                                        {(brands ?? []).map(b => {
                                            const id = b._id?.toString();
                                            const sel = selectedBrand?._id?.toString() === id;
                                            return (
                                                <Chip
                                                    key={id}
                                                    label={b.name}
                                                    size="small"
                                                    variant={sel ? "filled" : "outlined"}
                                                    color={sel ? "secondary" : "default"}
                                                    onClick={() => setSelectedBrand(sel ? null : b)}
                                                    sx={{ cursor: "pointer" }}
                                                />
                                            );
                                        })}
                                    </Box>
                                </Box>
                            </>
                        )}

                        {/* Marketplace selection */}
                        {(marketPlaces ?? []).length > 0 && (
                            <Box>
                                <Typography variant="subtitle2" fontWeight={700} mb={1}>
                                    Generate Marketplace Listings
                                    <Typography component="span" variant="caption" color="text.secondary" ml={1}>(optional)</Typography>
                                </Typography>
                                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                                    {(marketPlaces ?? []).map(mp => {
                                        const id = mp._id?.toString();
                                        const sel = selectedMarketplaceIds.includes(id);
                                        return (
                                            <Chip
                                                key={id}
                                                label={mp.name}
                                                size="small"
                                                variant={sel ? "filled" : "outlined"}
                                                color={sel ? "secondary" : "default"}
                                                onClick={() => toggleMarketplace(id)}
                                                sx={{ cursor: "pointer" }}
                                            />
                                        );
                                    })}
                                </Box>
                            </Box>
                        )}
                    </Stack>
                ) : results.perBlank ? (
                    // ── Individual mode results: per-blank card with all data ──
                    <Stack spacing={3}>
                        {(results.blanks ?? []).map(rb => {
                            const blank = allBlanks.find(b => b._id.toString() === rb.blankId);
                            if (!blank) return null;
                            const bIdStr = rb.blankId;
                            const allColors = getBlankColors(blank);
                            const toggled = toggledColors[bIdStr] ?? new Set();
                            const bProduct = editedProducts[bIdStr] ?? {};
                            const bMpData = results.perBlank[bIdStr]?.marketplaceData ?? {};
                            return (
                                <Card key={bIdStr} variant="outlined" sx={{ borderRadius: 2 }}>
                                    <CardContent>
                                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1}>
                                            <Box>
                                                <Typography variant="subtitle2" fontWeight={700}>{blank.name}</Typography>
                                                <Typography variant="caption" color="text.secondary">{rb.reasoning}</Typography>
                                            </Box>
                                            <Chip label={`${toggled.size} color${toggled.size !== 1 ? "s" : ""}`} size="small" color="secondary" variant="outlined" />
                                        </Stack>
                                        <Typography variant="caption" color="text.disabled" display="block" mb={1}>
                                            Click to toggle. AI-selected shown with ring. Score dot: <Box component="span" sx={{ color: "#22c55e", fontWeight: 700 }}>green</Box> = great, <Box component="span" sx={{ color: "#f59e0b", fontWeight: 700 }}>amber</Box> = ok, <Box component="span" sx={{ color: "#ef4444", fontWeight: 700 }}>red</Box> = poor.
                                        </Typography>
                                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, mb: 2 }}>
                                            {(() => {
                                                const scoreMap = Object.fromEntries((rb.colorScores ?? []).map(s => [s.colorId, s.score]));
                                                return [...allColors].sort((a, b) => (scoreMap[b._id.toString()] ?? 0) - (scoreMap[a._id.toString()] ?? 0)).map(c => {
                                                    const cid = c._id.toString();
                                                    return (
                                                        <ColorSwatch key={cid} color={c} selected={toggled.has(cid)} onClick={() => toggleColor(bIdStr, cid)} score={scoreMap[cid] ?? null} />
                                                    );
                                                });
                                            })()}
                                        </Box>

                                        <Divider sx={{ mb: 2 }} />

                                        {/* Per-blank product info */}
                                        <Stack spacing={1.5}>
                                            <TextField
                                                size="small" label="Title" fullWidth
                                                value={bProduct.title ?? ""}
                                                onChange={e => setEditedProducts(p => ({ ...p, [bIdStr]: { ...p[bIdStr], title: e.target.value } }))}
                                            />
                                            <TextField
                                                size="small" label="Description" fullWidth multiline rows={2}
                                                value={bProduct.description ?? ""}
                                                onChange={e => setEditedProducts(p => ({ ...p, [bIdStr]: { ...p[bIdStr], description: e.target.value } }))}
                                            />
                                            <Stack direction="row" spacing={1}>
                                                <TextField
                                                    size="small" label="Gender" sx={{ flex: 1 }}
                                                    value={bProduct.gender ?? ""}
                                                    onChange={e => setEditedProducts(p => ({ ...p, [bIdStr]: { ...p[bIdStr], gender: e.target.value } }))}
                                                />
                                                <TextField
                                                    size="small" label="Categories" sx={{ flex: 2 }}
                                                    value={(bProduct.category ?? []).join(", ")}
                                                    onChange={e => setEditedProducts(p => ({ ...p, [bIdStr]: { ...p[bIdStr], category: e.target.value.split(",").map(s => s.trim()).filter(Boolean) } }))}
                                                />
                                            </Stack>
                                            <Box>
                                                <Typography variant="caption" color="text.secondary" mb={0.5} display="block">Tags</Typography>
                                                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                                                    {(bProduct.tags ?? []).map((t, i) => (
                                                        <Chip key={i} label={t} size="small"
                                                            onDelete={() => setEditedProducts(p => ({ ...p, [bIdStr]: { ...p[bIdStr], tags: p[bIdStr].tags.filter((_, j) => j !== i) } }))}
                                                        />
                                                    ))}
                                                </Box>
                                            </Box>
                                            {/* Per-blank marketplace data */}
                                            {Object.keys(bMpData).length > 0 && (
                                                <Box sx={{ mt: 0.5 }}>
                                                    <Typography variant="caption" fontWeight={700} color="secondary.main" textTransform="uppercase" display="block" mb={0.75}>Marketplace Listings</Typography>
                                                    <Stack spacing={1}>
                                                        {Object.entries(bMpData).map(([mpName, mpData]) => (
                                                            <Box key={mpName} sx={{ pl: 1.5, borderLeft: "2px solid", borderColor: "secondary.light" }}>
                                                                <Typography variant="caption" fontWeight={700} display="block" mb={0.5}>{mpName}</Typography>
                                                                <TextField
                                                                    size="small" label="Title" fullWidth sx={{ mb: 0.75 }}
                                                                    value={mpData.title ?? ""}
                                                                    onChange={e => setResults(r => ({
                                                                        ...r,
                                                                        perBlank: { ...r.perBlank, [bIdStr]: { ...r.perBlank[bIdStr], marketplaceData: { ...r.perBlank[bIdStr].marketplaceData, [mpName]: { ...mpData, title: e.target.value } } } }
                                                                    }))}
                                                                />
                                                                <TextField
                                                                    size="small" label="Description" fullWidth multiline rows={2}
                                                                    value={mpData.description ?? ""}
                                                                    onChange={e => setResults(r => ({
                                                                        ...r,
                                                                        perBlank: { ...r.perBlank, [bIdStr]: { ...r.perBlank[bIdStr], marketplaceData: { ...r.perBlank[bIdStr].marketplaceData, [mpName]: { ...mpData, description: e.target.value } } } }
                                                                    }))}
                                                                />
                                                            </Box>
                                                        ))}
                                                    </Stack>
                                                </Box>
                                            )}
                                        </Stack>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </Stack>
                ) : (
                    // ── Combined mode results ──────────────────────────────
                    <Stack spacing={3}>
                        {(results.blanks ?? []).map(rb => {
                            const blank = allBlanks.find(b => b._id.toString() === rb.blankId);
                            if (!blank) return null;
                            const allColors = getBlankColors(blank);
                            const toggled = toggledColors[rb.blankId] ?? new Set();
                            return (
                                <Card key={rb.blankId} variant="outlined" sx={{ borderRadius: 2 }}>
                                    <CardContent>
                                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1}>
                                            <Box>
                                                <Typography variant="subtitle2" fontWeight={700}>{blank.name}</Typography>
                                                <Typography variant="caption" color="text.secondary">{rb.reasoning}</Typography>
                                            </Box>
                                            <Chip label={`${toggled.size} color${toggled.size !== 1 ? "s" : ""}`} size="small" color="secondary" variant="outlined" />
                                        </Stack>
                                        <Typography variant="caption" color="text.disabled" display="block" mb={1}>
                                            Click to toggle. AI-selected shown with ring. Score dot: <Box component="span" sx={{ color: "#22c55e", fontWeight: 700 }}>green</Box> = great, <Box component="span" sx={{ color: "#f59e0b", fontWeight: 700 }}>amber</Box> = ok, <Box component="span" sx={{ color: "#ef4444", fontWeight: 700 }}>red</Box> = poor.
                                        </Typography>
                                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
                                            {(() => {
                                                const scoreMap = Object.fromEntries((rb.colorScores ?? []).map(s => [s.colorId, s.score]));
                                                return [...allColors].sort((a, b) => (scoreMap[b._id.toString()] ?? 0) - (scoreMap[a._id.toString()] ?? 0)).map(c => {
                                                    const cid = c._id.toString();
                                                    return (
                                                        <ColorSwatch key={cid} color={c} selected={toggled.has(cid)} onClick={() => toggleColor(rb.blankId, cid)} score={scoreMap[cid] ?? null} />
                                                    );
                                                });
                                            })()}
                                        </Box>
                                    </CardContent>
                                </Card>
                            );
                        })}

                        <Divider />

                        {editedProduct && (
                            <Box>
                                <Typography variant="subtitle2" fontWeight={700} mb={1.5}>Product Info</Typography>
                                <Stack spacing={1.5}>
                                    <TextField
                                        size="small" label="Title" fullWidth
                                        value={editedProduct.title ?? ""}
                                        onChange={e => setEditedProduct(p => ({ ...p, title: e.target.value }))}
                                    />
                                    <TextField
                                        size="small" label="Description" fullWidth multiline rows={3}
                                        value={editedProduct.description ?? ""}
                                        onChange={e => setEditedProduct(p => ({ ...p, description: e.target.value }))}
                                    />
                                    <Stack direction="row" spacing={1}>
                                        <TextField
                                            size="small" label="Gender" sx={{ flex: 1 }}
                                            value={editedProduct.gender ?? ""}
                                            onChange={e => setEditedProduct(p => ({ ...p, gender: e.target.value }))}
                                        />
                                        <TextField
                                            size="small" label="Categories (comma-separated)" sx={{ flex: 2 }}
                                            value={(editedProduct.category ?? []).join(", ")}
                                            onChange={e => setEditedProduct(p => ({ ...p, category: e.target.value.split(",").map(s => s.trim()).filter(Boolean) }))}
                                        />
                                    </Stack>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary" mb={0.5} display="block">Tags</Typography>
                                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                                            {(editedProduct.tags ?? []).map((t, i) => (
                                                <Chip key={i} label={t} size="small"
                                                    onDelete={() => setEditedProduct(p => ({ ...p, tags: p.tags.filter((_, j) => j !== i) }))}
                                                />
                                            ))}
                                        </Box>
                                    </Box>
                                </Stack>
                            </Box>
                        )}

                        {results.marketplaceData && Object.keys(results.marketplaceData).length > 0 && (
                            <>
                                <Divider />
                                <Box>
                                    <Typography variant="subtitle2" fontWeight={700} mb={1.5}>Marketplace Listings</Typography>
                                    <Stack spacing={1.5}>
                                        {Object.entries(results.marketplaceData).map(([mpName, mpData]) => (
                                            <Card key={mpName} variant="outlined" sx={{ borderRadius: 2 }}>
                                                <CardContent sx={{ pb: "12px !important" }}>
                                                    <Typography variant="caption" fontWeight={700} color="secondary.main" textTransform="uppercase" display="block" mb={1}>{mpName}</Typography>
                                                    <Stack spacing={1}>
                                                        <TextField
                                                            size="small" label="Title" fullWidth
                                                            value={mpData.title ?? ""}
                                                            onChange={e => setResults(r => ({ ...r, marketplaceData: { ...r.marketplaceData, [mpName]: { ...mpData, title: e.target.value } } }))}
                                                        />
                                                        <TextField
                                                            size="small" label="Description" fullWidth multiline rows={2}
                                                            value={mpData.description ?? ""}
                                                            onChange={e => setResults(r => ({ ...r, marketplaceData: { ...r.marketplaceData, [mpName]: { ...mpData, description: e.target.value } } }))}
                                                        />
                                                        <Box>
                                                            <Typography variant="caption" color="text.secondary" mb={0.5} display="block">Tags</Typography>
                                                            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                                                                {(mpData.tags ?? []).map((t, i) => (
                                                                    <Chip key={i} label={t} size="small"
                                                                        onDelete={() => setResults(r => ({ ...r, marketplaceData: { ...r.marketplaceData, [mpName]: { ...mpData, tags: mpData.tags.filter((_, j) => j !== i) } } }))}
                                                                    />
                                                                ))}
                                                            </Box>
                                                        </Box>
                                                    </Stack>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </Stack>
                                </Box>
                            </>
                        )}
                    </Stack>
                )}
                {/* Video generation — shown in results step only */}
                {!configStep && (
                    <Box sx={{ mt: 3 }}>
                        <input ref={videoUploadRef} type="file" accept="video/*" style={{ display: "none" }} onChange={handleVideoUpload} />
                        <Divider sx={{ mb: 2 }} />
                        <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                            <VideocamIcon fontSize="small" color="secondary" />
                            <Typography variant="subtitle2" fontWeight={700}>Product Video</Typography>
                            <Typography variant="caption" color="text.secondary">(optional)</Typography>
                        </Stack>

                        {videoError && (
                            <Alert severity="error" sx={{ mb: 1.5 }} onClose={() => setVideoError("")}>{videoError}</Alert>
                        )}

                        {videoUrl ? (
                            <Box>
                                <video
                                    src={videoUrl}
                                    controls
                                    loop
                                    style={{ width: "100%", maxHeight: 320, borderRadius: 8, background: "#000" }}
                                />
                                <Box mt={1.5}>
                                    <Typography variant="caption" color="text.secondary" display="block" mb={0.75}>Background Music</Typography>
                                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mb: 1 }}>
                                        {videoTracks.map(t => (
                                            <Chip key={t.id} label={t.name} size="small" clickable
                                                variant={selectedVideoTrackId === t.id ? "filled" : "outlined"}
                                                color={selectedVideoTrackId === t.id ? "secondary" : "default"}
                                                onClick={() => setSelectedVideoTrackId(t.id)}
                                            />
                                        ))}
                                    </Box>
                                    <Stack direction="row" spacing={1} flexWrap="wrap" rowGap={1}>
                                        <Button size="small" variant="outlined" startIcon={<SlowMotionVideoIcon />}
                                            onClick={() => handleGenerateVideo("slideshow")} disabled={videoGenerating || videoUploading}>
                                            New Slideshow
                                        </Button>
                                        <Button size="small" variant="outlined" startIcon={<AutoAwesomeIcon />}
                                            onClick={() => handleGenerateVideo("ai")} disabled={videoGenerating || videoUploading}>
                                            New AI Video
                                        </Button>
                                        <Button size="small" variant="outlined" color="inherit" startIcon={<CloudUploadIcon />}
                                            onClick={() => videoUploadRef.current?.click()} disabled={videoGenerating || videoUploading}>
                                            {videoUploading ? "Uploading…" : "Upload Video"}
                                        </Button>
                                    </Stack>
                                </Box>
                            </Box>
                        ) : (videoGenerating || videoUploading) ? (
                            <Box>
                                <Stack direction="row" alignItems="center" spacing={1.5} mb={1}>
                                    <CircularProgress size={16} color="secondary" />
                                    <Typography variant="body2" color="text.secondary">
                                        {videoUploading ? "Uploading video…" : "Generating video… this may take a minute or two"}
                                    </Typography>
                                </Stack>
                                <LinearProgress color="secondary" sx={{ borderRadius: 1 }} />
                            </Box>
                        ) : (
                            <Box>
                                <Typography variant="caption" color="text.secondary" display="block" mb={0.75}>Background Music</Typography>
                                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mb: 1.5 }}>
                                    {videoTracks.map(t => (
                                        <Chip key={t.id} label={t.name} size="small" clickable
                                            variant={selectedVideoTrackId === t.id ? "filled" : "outlined"}
                                            color={selectedVideoTrackId === t.id ? "secondary" : "default"}
                                            onClick={() => setSelectedVideoTrackId(t.id)}
                                        />
                                    ))}
                                </Box>
                                <Stack direction="row" spacing={1.5} flexWrap="wrap" rowGap={1}>
                                    <Button size="small" variant="outlined" startIcon={<SlowMotionVideoIcon />}
                                        onClick={() => handleGenerateVideo("slideshow")}>
                                        Quick Slideshow
                                    </Button>
                                    <Button size="small" variant="outlined" color="secondary" startIcon={<AutoAwesomeIcon />}
                                        onClick={() => handleGenerateVideo("ai")}>
                                        AI Video (Kling)
                                    </Button>
                                    <Button size="small" variant="outlined" color="inherit" startIcon={<CloudUploadIcon />}
                                        onClick={() => videoUploadRef.current?.click()}>
                                        Upload Video
                                    </Button>
                                </Stack>
                            </Box>
                        )}
                    </Box>
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2, borderTop: "1px solid", borderColor: "divider", gap: 1 }}>
                {results && (
                    <Button
                        variant="outlined" size="small"
                        onClick={() => { setResults(null); setEditedProduct(null); setEditedProducts({}); setToggledColors({}); }}
                    >
                        Back
                    </Button>
                )}
                <Box sx={{ flex: 1 }} />
                <Button onClick={handleClose} variant="outlined">Cancel</Button>
                {configStep ? (
                    <Button
                        variant="contained" color="secondary"
                        startIcon={generating ? <CircularProgress size={14} color="inherit" /> : <AutoAwesomeIcon />}
                        onClick={handleGenerate}
                        disabled={generating || selectedBlankIds.length === 0 || ((brands ?? []).length > 0 && !selectedBrand)}
                    >
                        {generating ? "Analyzing…" : "Generate"}
                    </Button>
                ) : (
                    <Button
                        variant="contained" color="secondary"
                        onClick={handleConfirm}
                        disabled={!results}
                    >
                        Create Product
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
}

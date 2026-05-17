"use client";
import { Stage, Layer, Transformer, Rect, Image as KonvaImage, Line } from "react-konva";
import {
    Box, Button, Typography, Stack, Chip, Divider, Paper,
    Dialog, DialogTitle, DialogContent, DialogActions,
    IconButton, TextField, CircularProgress, Switch, FormControlLabel,
    Tooltip, Alert, Badge,
} from "@mui/material";
import React, { useEffect, useRef, useState } from "react";
import { Uploader2 } from "../reusable/uploader2";
import useImage from "use-image";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import Image from "next/image";
import { EditablePolygon } from "@pythias/backend";
import CropIcon from "@mui/icons-material/Crop";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import CloseIcon from "@mui/icons-material/Close";
import PanToolIcon from "@mui/icons-material/PanTool";
import ZoomInMapIcon from "@mui/icons-material/ZoomInMap";
import RestartAltIcon from "@mui/icons-material/RestartAlt";

const CANVAS = 400;

// TODO: move S3 upload to a server-side API route to avoid client-side credential exposure
const s3 = new S3Client({
    credentials: {
        accessKeyId: process.env.NEXT_PUBLIC_WASABI_KEY_ID || "",
        secretAccessKey: process.env.NEXT_PUBLIC_WASABI_SECRET || "",
    },
    region: "us-west-1",
    endpoint: "https://s3.us-west-1.wasabisys.com/",
});

const SUBLIMATION_FEATURES = [
    "frontBody", "backBody", "sleeveLeftNoCuff", "sleeveLeftWithCuff",
    "sleeveRightNoCuff", "sleeveRightWithCuff", "collar", "poloCollar",
    "poloPocket", "background", "hoodOutside", "hoodInside", "cuffLeft", "cuffRight",
];

const emptyFeatures = () => Object.fromEntries(SUBLIMATION_FEATURES.map(k => [k, { layers: [] }]));
const EMPTY_BOX = { x: 10, y: 10, width: 300, height: 300, rotation: 0 };

const degToRad = (a) => (a / 180) * Math.PI;
const getCorner = (px, py, dx, dy, angle) => {
    const d = Math.sqrt(dx * dx + dy * dy);
    angle += Math.atan2(dy, dx);
    return { x: px + d * Math.cos(angle), y: py + d * Math.sin(angle) };
};
const getClientRect = ({ x, y, width, height, rotation = 0 }) => {
    const rad = degToRad(rotation);
    const pts = [
        getCorner(x, y, 0, 0, rad), getCorner(x, y, width, 0, rad),
        getCorner(x, y, width, height, rad), getCorner(x, y, 0, height, rad),
    ];
    const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
    return { x: Math.min(...xs), y: Math.min(...ys), width: Math.max(...xs) - Math.min(...xs), height: Math.max(...ys) - Math.min(...ys) };
};

function URLImage({ src, ...rest }) {
    const [img] = useImage(src, "anonymous");
    return <KonvaImage image={img} {...rest} />;
}

// ─────────────────────────────────────────────────────────────────────────────

export function ImageEditModal({ open, onClose, blank, setBlank, update, color, printLocations, selectedImageSrc, setSelectedImageSrc }) {
    // ── image & canvas state ──────────────────────────────────────────────────
    const [image, setImage]               = useState({ color: color?._id, image: null, boxes: {} });
    const [originalImage, setOriginalImage] = useState(null);
    const [rectangles, setRectangles]     = useState([]);
    const [active, setActive]             = useState(""); // active print-location id
    const [activeBox, setActiveBox]       = useState(EMPTY_BOX); // controlled dimension inputs
    const [step, setStep]                 = useState(""); // "crop" | "location" | "addImage" | "setImage" | "cropAdd"
    const [addImage, setAddImage]         = useState(null);
    const [overlayImg, setOverlayImg]     = useState(null); // { image, x, y, width, height, rotation }
    const [cropAdd, setCropAdd]           = useState(false);
    const [pan, setPan]                   = useState(false);

    // ── sublimation ───────────────────────────────────────────────────────────
    const [hasSublimation, setHasSublimation]   = useState(false);
    const [features, setFeatures]               = useState(emptyFeatures);
    const [featureSelected, setFeatureSelected] = useState("frontBody");
    const [sublimPoints, setSublimPoints]       = useState([]);
    const [sublimModalOpen, setSublimModalOpen] = useState(false);
    const [layerSelected, setLayerSelected]     = useState(null);

    // ── save state ────────────────────────────────────────────────────────────
    const [saving, setSaving]       = useState(false);
    const [saveError, setSaveError] = useState("");

    // ── misc ──────────────────────────────────────────────────────────────────
    const [copyBoxesOpen, setCopyBoxesOpen] = useState(false);
    const [reloadUploader, setReloadUploader] = useState(false);

    // ── konva refs ────────────────────────────────────────────────────────────
    const stageRef       = useRef();
    const transformerRef = useRef();
    const rectRef        = useRef();
    const overlayRef     = useRef();
    const boxRef         = useRef(); // ref to active Rect node
    const isSelecting    = useRef(false);
    const [selBox, setSelBox] = useState({ visible: false, x1: 0, y1: 0, x2: 0, y2: 0 });

    // ── sync props → state when modal opens ──────────────────────────────────
    useEffect(() => {
        if (!open) return;
        const src = selectedImageSrc;
        let img = src ? { ...src } : { color: color?._id, image: null, boxes: {} };
        if (!img.sublimationBoxes) img.sublimationBoxes = emptyFeatures();
        for (const k of SUBLIMATION_FEATURES) {
            if (!img.sublimationBoxes[k]) img.sublimationBoxes[k] = { layers: [] };
        }
        img.color = color?._id;
        setImage(img);
        setFeatures(img.sublimationBoxes ? { ...img.sublimationBoxes } : emptyFeatures());
        setSublimPoints([]);
        setActive(""); setRectangles([]); setStep("");
        setAddImage(null); setOverlayImg(null); setCropAdd(false);
        setSaveError(""); setPan(false);
    }, [open, selectedImageSrc, color?._id]);

    // ── transformer sync ──────────────────────────────────────────────────────
    useEffect(() => {
        if (!transformerRef.current) return;
        if (step === "setImage") {
            // KonvaImage ref is assigned during commit; wait one tick to be safe
            const t = setTimeout(() => {
                if (!transformerRef.current) return;
                if (overlayRef.current) {
                    transformerRef.current.nodes([overlayRef.current]);
                    transformerRef.current.getLayer()?.batchDraw();
                }
            }, 0);
            return () => clearTimeout(t);
        }
        if (rectRef.current) {
            transformerRef.current.nodes([rectRef.current]);
        } else {
            transformerRef.current.nodes([]);
        }
        transformerRef.current.getLayer()?.batchDraw();
    }, [rectangles, step, overlayImg]);

    // ── addImage → place on canvas as a resizable KonvaImage ─────────────────
    useEffect(() => {
        if (!addImage) return;
        const aspect = addImage.height > 0 ? addImage.width / addImage.height : 1;
        const startW = Math.min(Math.round(CANVAS * 0.55), addImage.width || Math.round(CANVAS * 0.55));
        const startH = Math.round(startW / aspect);
        setOverlayImg({
            image: addImage,
            x: Math.round((CANVAS - startW) / 2),
            y: Math.round((CANVAS - startH) / 2),
            width: startW,
            height: startH,
            rotation: 0,
        });
        setRectangles([]);
        setStep("setImage");
    }, [addImage]);

    // ── canvas handlers ───────────────────────────────────────────────────────
    const handleMouseDown = (e) => {
        if (e.target !== e.target.getStage()) return;
        isSelecting.current = true;
        const pos = e.target.getStage().getPointerPosition();
        setSelBox({ visible: true, x1: pos.x, y1: pos.y, x2: pos.x, y2: pos.y });
    };
    const handleMouseMove = (e) => {
        if (!isSelecting.current) return;
        const pos = e.target.getStage().getPointerPosition();
        setSelBox(s => ({ ...s, x2: pos.x, y2: pos.y }));
    };
    const handleMouseUp = () => {
        if (!isSelecting.current) return;
        isSelecting.current = false;
        setTimeout(() => setSelBox(s => ({ ...s, visible: false })));
    };

    const handleDragMove = (e) => {
        const rect = e.target;
        const clamped = {
            x: Math.max(0, Math.min(CANVAS - rect.width(), rect.x())),
            y: Math.max(0, Math.min(CANVAS - rect.height(), rect.y())),
        };
        rect.x(clamped.x); rect.y(clamped.y);
        setRectangles(prev => prev.map(r => r.id === rect.id() ? { ...r, ...clamped } : r));
    };

    const handleDragEnd = (e) => {
        const x = Math.round(e.target.x());
        const y = Math.round(e.target.y());
        setRectangles(prev => prev.map(r => r.id === e.target.id() ? { ...r, x, y } : r));
        setActiveBox(prev => ({ ...prev, x, y }));
    };

    const handleTransformEnd = (e) => {
        const node = e.target;
        const scaleX = node.scaleX(), scaleY = node.scaleY();
        node.scaleX(1); node.scaleY(1);
        const w = Math.max(5, Math.round(node.width() * scaleX));
        const h = Math.max(5, Math.round(node.height() * scaleY));
        const rot = Math.round(node.rotation());
        node.width(w); node.height(h);
        setRectangles(prev => prev.map(r => r.id === node.id() ? { ...r, width: w, height: h, rotation: rot } : r));
        setActiveBox(prev => ({ ...prev, width: w, height: h, rotation: rot }));
    };

    const handleWheel = (e) => {
        e.evt.preventDefault();
        const scaleBy = 1.05;
        const stage = stageRef.current;
        const oldScale = stage.scaleX();
        const pointer = stage.getPointerPosition();
        const mousePointTo = {
            x: (pointer.x - stage.x()) / oldScale,
            y: (pointer.y - stage.y()) / oldScale,
        };
        const dir = e.evt.deltaY > 0 ? 1 : -1;
        const newScale = dir > 0 ? oldScale * scaleBy : oldScale / scaleBy;
        stage.scale({ x: newScale, y: newScale });
        stage.position({ x: pointer.x - mousePointTo.x * newScale, y: pointer.y - mousePointTo.y * newScale });
    };

    const resetView = () => {
        if (stageRef.current) { stageRef.current.scale({ x: 1, y: 1 }); stageRef.current.position({ x: 0, y: 0 }); }
    };

    // ── location actions ──────────────────────────────────────────────────────
    const handleLocationClick = (loc) => {
        const saved = image.boxes?.[loc.name];
        const data = saved ? { x: saved.x || 10, y: saved.y || 10, width: saved.width || 300, height: saved.height || 300, rotation: saved.rotation || 0 } : { ...EMPTY_BOX };
        setActive(loc.name);
        setActiveBox(data);
        setRectangles([{
            ...data, id: loc.name, name: "rect",
            fill: "rgba(59,130,246,0.12)",
            stroke: "#3b82f6", strokeWidth: 2,
            dash: [8, 4], draggable: true,
        }]);
        setStep("location");
    };

    const updateBoxField = (field, val) => {
        const num = parseInt(val) || 0;
        setActiveBox(prev => ({ ...prev, [field]: num }));
        setRectangles(prev => prev.map(r => r.id === active ? { ...r, [field]: num } : r));
    };

    const handleSaveLocation = () => {
        const rect = rectangles.find(r => r.id === active);
        const box = rect
            ? { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height), rotation: Math.round(rect.rotation || 0) }
            : activeBox;
        setImage(prev => ({ ...prev, boxes: { ...(prev.boxes || {}), [active]: box } }));
        setRectangles([]);
        setStep("");
        setActive("");
    };

    const handleRemoveLocation = () => {
        setImage(prev => {
            const boxes = { ...(prev.boxes || {}) };
            delete boxes[active];
            return { ...prev, boxes };
        });
        setActive(""); setRectangles([]); setStep("");
    };

    // ── crop ──────────────────────────────────────────────────────────────────
    const startCrop = () => {
        setRectangles([{
            x: 10, y: 10, width: 380, height: 380,
            id: "crop", name: "rect",
            fill: "transparent", stroke: "#f59e0b",
            strokeWidth: 2, dash: [8, 4], draggable: true, rotation: 0,
        }]);
        setStep("crop"); setActive("");
    };

    const applyCrop = async () => {
        const crop = rectangles.find(r => r.id === "crop");
        if (!crop || !stageRef.current) return;
        setRectangles([]);
        await new Promise(r => setTimeout(r, 80));
        const dataURL = stageRef.current.toDataURL({ x: crop.x, y: crop.y, width: crop.width, height: crop.height, pixelRatio: 2 });
        setImage(prev => ({ ...prev, image: dataURL }));
        setStep(""); setActive("");
    };

    // ── overlay image ─────────────────────────────────────────────────────────
    const applyOverlay = async () => {
        transformerRef.current?.nodes([]);
        await new Promise(r => setTimeout(r, 50));
        if (!stageRef.current) return;
        const dataURL = stageRef.current.toDataURL({ x: 0, y: 0, width: CANVAS, height: CANVAS, pixelRatio: 2 });
        setImage(prev => ({ ...prev, image: dataURL }));
        setAddImage(null); setOverlayImg(null); setRectangles([]); setStep("");
    };

    const cancelOverlay = () => {
        setAddImage(null); setOverlayImg(null); setRectangles([]); setStep("");
    };

    const startCropAdd = () => {
        if (!overlayImg) return;
        transformerRef.current?.nodes([]);
        // Default crop rect to the overlay image bounds so user can see what they're cropping
        setRectangles([{
            x: overlayImg.x, y: overlayImg.y,
            width: overlayImg.width, height: overlayImg.height,
            id: "crop", name: "rect",
            fill: "rgba(245,158,11,0.08)", stroke: "#f59e0b",
            strokeWidth: 2, dash: [8, 4], draggable: true,
        }]);
        setCropAdd(true); setStep("cropAdd");
    };

    const applyCropAdd = () => {
        if (!overlayImg) return;
        const crop = rectangles.find(r => r.id === "crop");
        if (!crop) return;

        // Map the crop rect from stage coords back to source image pixel coords
        const src = overlayImg.image;
        const scaleX = overlayImg.width  / src.width;
        const scaleY = overlayImg.height / src.height;
        const srcX = Math.max(0, (crop.x - overlayImg.x) / scaleX);
        const srcY = Math.max(0, (crop.y - overlayImg.y) / scaleY);
        const srcW = Math.min(src.width  - srcX, crop.width  / scaleX);
        const srcH = Math.min(src.height - srcY, crop.height / scaleY);

        const PR = 2;
        const canvas = document.createElement("canvas");
        canvas.width  = Math.round(crop.width  * PR);
        canvas.height = Math.round(crop.height * PR);
        const ctx = canvas.getContext("2d");
        ctx.drawImage(src, srcX, srcY, srcW, srcH, 0, 0, canvas.width, canvas.height);

        const newImg = new window.Image();
        newImg.src = canvas.toDataURL();
        newImg.onload = () => {
            setOverlayImg({
                image: newImg,
                x: Math.round(crop.x), y: Math.round(crop.y),
                width: Math.round(crop.width), height: Math.round(crop.height),
                rotation: 0,
            });
            setRectangles([]);
            setCropAdd(false);
            setStep("setImage");
        };
    };

    // ── save ──────────────────────────────────────────────────────────────────
    const handleSaveImage = async () => {
        if (!image.image) return;
        setSaving(true); setSaveError("");
        try {
            let finalImage = { ...image };
            // If base64 (after crop / new upload), push to S3 first
            if (image.image.startsWith("data:")) {
                const key = `blanks/${Date.now()}.jpg`;
                await s3.send(new PutObjectCommand({
                    Bucket: "images1.pythiastechnologies.com",
                    Key: key,
                    Body: Buffer.from(image.image.split(",")[1], "base64"),
                    ACL: "public-read",
                    ContentEncoding: "base64",
                    ContentDisposition: "inline",
                    ContentType: "image/jpeg",
                }));
                await new Promise(r => setTimeout(r, 500));
                finalImage.image = `https://images1.pythiastechnologies.com/${key}`;
            }
            finalImage.color = color?._id;
            let b = { ...blank, images: [...(blank.images || [])] };
            // Replace if updating existing, otherwise add
            const existingIdx = selectedImageSrc?.image
                ? b.images.findIndex(img => img.image === selectedImageSrc.image)
                : -1;
            if (existingIdx !== -1) b.images[existingIdx] = finalImage;
            else b.images.push(finalImage);
            setBlank(b);
            await update({ blank: b, action: existingIdx !== -1 ? "blank_image_edit" : "blank_image_add" });
            handleClose();
        } catch (e) {
            setSaveError(e.message || "Failed to save image");
        } finally {
            setSaving(false);
        }
    };

    const handleClose = () => { setSelectedImageSrc(null); onClose(); };

    // ── mode description ──────────────────────────────────────────────────────
    const modeHint = {
        crop:     "Drag / resize the yellow box, then click Apply Crop",
        location: active ? `Drag or resize the box, or type exact values below` : "",
        addImage: "Use the uploader to add an overlay image",
        setImage: "Position / resize the overlay, then click Apply",
        cropAdd:  "Draw a crop region on the overlay, then click Apply Crop",
    }[step] || (image.image ? "Click a print location to set its bounding box" : "Upload an image to get started");

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth
            PaperProps={{ sx: { height: "92vh", maxHeight: 840, display: "flex", flexDirection: "column" } }}>

            <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: 1.5, px: 3, borderBottom: "1px solid", borderColor: "divider" }}>
                <Typography variant="h6" fontWeight={700}>
                    Edit Image {color?.name ? <span style={{ color: "#6b7280", fontWeight: 400 }}>— {color.name}</span> : ""}
                </Typography>
                <IconButton size="small" onClick={handleClose}><CloseIcon /></IconButton>
            </DialogTitle>

            <DialogContent sx={{ display: "flex", p: 0, overflow: "hidden", flex: 1 }}>
                {/* ── LEFT: canvas panel ─────────────────────────────────── */}
                <Box sx={{
                    flex: "0 0 auto", display: "flex", flexDirection: "column",
                    p: 2, gap: 1.5, borderRight: "1px solid", borderColor: "divider",
                    width: CANVAS + 48, overflowY: "auto",
                }}>
                    {/* Uploader — shown when no image yet OR in addImage mode */}
                    {!reloadUploader && (step === "addImage" || !image.image) && (
                        <Uploader2 afterFunction={async (data) => {
                            if (step === "addImage") {
                                const img = new window.Image();
                                img.src = data.url; img.crossOrigin = "anonymous";
                                img.onload = () => setAddImage(img);
                            } else {
                                setImage(prev => ({ ...prev, image: data.url }));
                                setOriginalImage(data.url);
                                setStep("");
                            }
                        }} />
                    )}

                    {/* Konva canvas */}
                    {image.image && step !== "addImage" && (
                        <Box sx={{ position: "relative" }}>
                            <Stage
                                ref={stageRef}
                                width={CANVAS} height={CANVAS}
                                style={{ background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: 6, display: "block", cursor: pan ? "grab" : "default" }}
                                draggable={pan}
                                onMouseDown={handleMouseDown}
                                onMousemove={handleMouseMove}
                                onMouseup={handleMouseUp}
                                onClick={(e) => {
                                    if (e.target === e.target.getStage()) return;
                                    boxRef.current = e.target;
                                }}
                                onContextMenu={(e) => {
                                    e.evt.preventDefault();
                                    setRectangles(prev => prev.filter(r => r.id !== e.target.id()));
                                }}
                                onWheel={handleWheel}
                            >
                                {/* Base image */}
                                <Layer>
                                    <URLImage src={image.image} x={0} y={0} width={CANVAS} height={CANVAS} />
                                </Layer>

                                {/* Active rect + transformer */}
                                <Layer>
                                    {/* Overlay image — draggable/resizable in setImage, static in cropAdd */}
                                    {(step === "setImage" || step === "cropAdd") && overlayImg && (
                                        <KonvaImage
                                            ref={overlayRef}
                                            image={overlayImg.image}
                                            x={overlayImg.x}
                                            y={overlayImg.y}
                                            width={overlayImg.width}
                                            height={overlayImg.height}
                                            rotation={overlayImg.rotation}
                                            draggable={step === "setImage"}
                                            onDragEnd={(e) => step === "setImage" && setOverlayImg(prev => ({
                                                ...prev,
                                                x: Math.round(e.target.x()),
                                                y: Math.round(e.target.y()),
                                            }))}
                                            onTransformEnd={(e) => {
                                                if (step !== "setImage") return;
                                                const node = e.target;
                                                const sx = node.scaleX(), sy = node.scaleY();
                                                node.scaleX(1); node.scaleY(1);
                                                const w = Math.max(5, Math.round(node.width() * sx));
                                                const h = Math.max(5, Math.round(node.height() * sy));
                                                node.width(w); node.height(h);
                                                setOverlayImg(prev => ({ ...prev, width: w, height: h, rotation: Math.round(node.rotation()) }));
                                            }}
                                        />
                                    )}
                                    {rectangles.map(rect => (
                                        <Rect
                                            key={rect.id}
                                            id={rect.id}
                                            name={rect.name}
                                            x={rect.x} y={rect.y}
                                            width={rect.width} height={rect.height}
                                            rotation={rect.rotation || 0}
                                            fill={rect.fill || "rgba(59,130,246,0.12)"}
                                            stroke={rect.stroke || "#3b82f6"}
                                            strokeWidth={rect.strokeWidth || 2}
                                            dash={rect.dash || [8, 4]}
                                            draggable
                                            ref={node => { rectRef.current = node; }}
                                            onDragMove={handleDragMove}
                                            onDragEnd={handleDragEnd}
                                            onTransformEnd={handleTransformEnd}
                                        />
                                    ))}
                                    <Transformer
                                        ref={transformerRef}
                                        flipEnabled={false}
                                        rotateEnabled
                                        boundBoxFunc={(oldBox, newBox) => {
                                            if (Math.abs(newBox.width) < 5 || Math.abs(newBox.height) < 5) return oldBox;
                                            if (Math.abs(newBox.width) > CANVAS || Math.abs(newBox.height) > CANVAS) return oldBox;
                                            return newBox;
                                        }}
                                    />
                                    {selBox.visible && (
                                        <Rect
                                            x={Math.min(selBox.x1, selBox.x2)} y={Math.min(selBox.y1, selBox.y2)}
                                            width={Math.abs(selBox.x2 - selBox.x1)} height={Math.abs(selBox.y2 - selBox.y1)}
                                            fill="rgba(59,130,246,0.15)"
                                        />
                                    )}
                                </Layer>

                                {/* Sublimation overlay */}
                                {hasSublimation && (
                                    <Layer>
                                        {sublimPoints.map((pts, i) => (
                                            <Line key={i} points={pts} closed stroke="rgba(239,68,68,0.8)" strokeWidth={2} lineJoin="round" />
                                        ))}
                                    </Layer>
                                )}
                            </Stage>
                        </Box>
                    )}

                    {/* Mode hint */}
                    <Typography variant="caption" color="text.secondary" sx={{ minHeight: 18 }}>
                        {modeHint}
                    </Typography>

                    {/* Canvas utility icons */}
                    {image.image && step !== "addImage" && (
                        <Stack direction="row" spacing={0.5} alignItems="center">
                            <Tooltip title="Reset zoom & pan"><IconButton size="small" onClick={resetView}><ZoomInMapIcon fontSize="small" /></IconButton></Tooltip>
                            <Tooltip title={pan ? "Disable pan mode" : "Enable pan mode"}>
                                <IconButton size="small" color={pan ? "primary" : "default"} onClick={() => setPan(p => !p)}>
                                    <PanToolIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                            {originalImage && (
                                <Tooltip title="Restore original image">
                                    <IconButton size="small" onClick={() => { setImage(prev => ({ ...prev, image: originalImage })); setStep(""); setRectangles([]); }}>
                                        <RestartAltIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            )}
                            <Typography variant="caption" color="text.disabled" sx={{ ml: 0.5 }}>
                                Scroll to zoom · Right-click rect to remove
                            </Typography>
                        </Stack>
                    )}

                    {/* Step action buttons */}
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                        {step === "crop" && (
                            <>
                                <Button size="small" variant="contained" color="warning" startIcon={<CropIcon />} onClick={applyCrop}>Apply Crop</Button>
                                <Button size="small" variant="outlined" onClick={() => { setRectangles([]); setStep(""); }}>Cancel</Button>
                            </>
                        )}
                        {step === "setImage" && (
                            <>
                                <Button size="small" variant="contained" onClick={applyOverlay}>Apply Overlay</Button>
                                <Button size="small" variant="outlined" onClick={startCropAdd}>Crop Overlay First</Button>
                                <Button size="small" variant="outlined" color="inherit" onClick={cancelOverlay}>Cancel</Button>
                            </>
                        )}
                        {cropAdd && step === "cropAdd" && (
                            <>
                                <Button size="small" variant="contained" color="warning" startIcon={<CropIcon />} onClick={applyCropAdd}>Apply Crop</Button>
                                <Button size="small" variant="outlined" onClick={() => { setRectangles([]); setCropAdd(false); setStep("setImage"); }}>Cancel Crop</Button>
                            </>
                        )}
                    </Stack>
                </Box>

                {/* ── RIGHT: controls panel ──────────────────────────────── */}
                <Box sx={{ flex: 1, display: "flex", flexDirection: "column", p: 2.5, gap: 2.5, overflowY: "auto", minWidth: 0 }}>

                    {/* Print Locations */}
                    {!hasSublimation && printLocations?.length > 0 && (
                        <Box>
                            <Typography variant="subtitle2" fontWeight={700} mb={1.25}>
                                Print Locations
                                <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                                    ({Object.keys(image.boxes || {}).length} of {printLocations.length} configured)
                                </Typography>
                            </Typography>
                            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                                {printLocations.map((loc) => {
                                    const hasBox = !!(image.boxes?.[loc.name]);
                                    const isActive = active === loc.name;
                                    return (
                                        <Chip
                                            key={loc.name}
                                            label={loc.name}
                                            size="small"
                                            variant={isActive ? "filled" : "outlined"}
                                            color={isActive ? "primary" : hasBox ? "success" : "default"}
                                            icon={hasBox ? <CheckCircleOutlineIcon sx={{ fontSize: "0.85rem !important" }} /> : undefined}
                                            onClick={() => handleLocationClick(loc)}
                                            sx={{ cursor: "pointer", fontWeight: isActive ? 700 : 400, fontSize: "0.72rem" }}
                                        />
                                    );
                                })}
                            </Box>
                        </Box>
                    )}

                    {/* Active location editor */}
                    {step === "location" && active && (
                        <Paper variant="outlined" sx={{ p: 2, borderColor: "primary.main", borderRadius: 2 }}>
                            <Typography variant="subtitle2" fontWeight={700} color="primary.main" mb={1.5}>
                                Editing: <em>{active}</em>
                            </Typography>
                            <Stack spacing={1.5}>
                                <Stack direction="row" spacing={1}>
                                    <TextField
                                        size="small" label="X" type="number"
                                        value={activeBox.x}
                                        onChange={e => updateBoxField("x", e.target.value)}
                                        inputProps={{ min: 0, max: CANVAS }} sx={{ flex: 1 }}
                                    />
                                    <TextField
                                        size="small" label="Y" type="number"
                                        value={activeBox.y}
                                        onChange={e => updateBoxField("y", e.target.value)}
                                        inputProps={{ min: 0, max: CANVAS }} sx={{ flex: 1 }}
                                    />
                                </Stack>
                                <Stack direction="row" spacing={1}>
                                    <TextField
                                        size="small" label="Width" type="number"
                                        value={activeBox.width}
                                        onChange={e => updateBoxField("width", e.target.value)}
                                        inputProps={{ min: 5, max: CANVAS }} sx={{ flex: 1 }}
                                    />
                                    <TextField
                                        size="small" label="Height" type="number"
                                        value={activeBox.height}
                                        onChange={e => updateBoxField("height", e.target.value)}
                                        inputProps={{ min: 5, max: CANVAS }} sx={{ flex: 1 }}
                                    />
                                </Stack>
                                <TextField
                                    size="small" label="Rotation (°)" type="number"
                                    value={activeBox.rotation}
                                    onChange={e => updateBoxField("rotation", e.target.value)}
                                    inputProps={{ min: -180, max: 180 }}
                                />
                                <Stack direction="row" spacing={1}>
                                    <Button
                                        size="small" variant="contained"
                                        startIcon={<CheckCircleOutlineIcon />}
                                        onClick={handleSaveLocation} fullWidth
                                    >
                                        Save Box
                                    </Button>
                                    <Button
                                        size="small" variant="outlined" color="error"
                                        startIcon={<DeleteOutlineIcon />}
                                        onClick={handleRemoveLocation} fullWidth
                                        disabled={!image.boxes?.[active]}
                                    >
                                        Remove
                                    </Button>
                                </Stack>
                            </Stack>
                        </Paper>
                    )}

                    {/* Overlay image position controls */}
                    {step === "setImage" && overlayImg && (
                        <Paper variant="outlined" sx={{ p: 2, borderColor: "warning.main", borderRadius: 2 }}>
                            <Typography variant="subtitle2" fontWeight={700} color="warning.main" mb={1.5}>
                                Overlay Position &amp; Size
                            </Typography>
                            <Stack spacing={1.5}>
                                <Stack direction="row" spacing={1}>
                                    <TextField size="small" label="X" type="number"
                                        value={overlayImg.x}
                                        onChange={e => setOverlayImg(prev => ({ ...prev, x: parseInt(e.target.value) || 0 }))}
                                        sx={{ flex: 1 }} />
                                    <TextField size="small" label="Y" type="number"
                                        value={overlayImg.y}
                                        onChange={e => setOverlayImg(prev => ({ ...prev, y: parseInt(e.target.value) || 0 }))}
                                        sx={{ flex: 1 }} />
                                </Stack>
                                <Stack direction="row" spacing={1}>
                                    <TextField size="small" label="Width" type="number"
                                        value={overlayImg.width}
                                        onChange={e => setOverlayImg(prev => ({ ...prev, width: Math.max(5, parseInt(e.target.value) || 5) }))}
                                        inputProps={{ min: 5 }} sx={{ flex: 1 }} />
                                    <TextField size="small" label="Height" type="number"
                                        value={overlayImg.height}
                                        onChange={e => setOverlayImg(prev => ({ ...prev, height: Math.max(5, parseInt(e.target.value) || 5) }))}
                                        inputProps={{ min: 5 }} sx={{ flex: 1 }} />
                                </Stack>
                                <TextField size="small" label="Rotation (°)" type="number"
                                    value={overlayImg.rotation}
                                    onChange={e => setOverlayImg(prev => ({ ...prev, rotation: parseInt(e.target.value) || 0 }))}
                                    inputProps={{ min: -180, max: 180 }} />
                            </Stack>
                        </Paper>
                    )}

                    <Divider />

                    {/* Tools */}
                    <Box>
                        <Typography variant="subtitle2" fontWeight={700} mb={1}>Tools</Typography>
                        <Stack spacing={1}>
                            {image.image && (
                                <Button size="small" variant="outlined" startIcon={<CropIcon />}
                                    onClick={startCrop} disabled={step === "crop"}>
                                    Crop Image
                                </Button>
                            )}
                            {image.image && (
                                <Button size="small" variant="outlined" startIcon={<AddPhotoAlternateIcon />}
                                    onClick={async () => {
                                        setStep("addImage");
                                        setReloadUploader(true);
                                        await new Promise(r => setTimeout(r, 100));
                                        setReloadUploader(false);
                                    }}
                                    disabled={step === "addImage"}>
                                    Overlay Image
                                </Button>
                            )}
                            <Button size="small" variant="outlined" startIcon={<ContentCopyIcon />}
                                onClick={() => setCopyBoxesOpen(true)}>
                                Copy Boxes from Another Color
                            </Button>
                        </Stack>
                    </Box>

                    <Divider />

                    {/* Sublimation */}
                    <Box>
                        <FormControlLabel
                            control={<Switch checked={hasSublimation} onChange={e => setHasSublimation(e.target.checked)} size="small" />}
                            label={<Typography variant="body2" fontWeight={600}>Sublimation Mapping</Typography>}
                        />

                        {hasSublimation && (
                            <Box sx={{ mt: 1.5 }}>
                                <Typography variant="caption" color="text.secondary" display="block" mb={1}>Select a feature to configure its layers</Typography>
                                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mb: 1.5 }}>
                                    {SUBLIMATION_FEATURES.map(key => (
                                        <Chip key={key} label={key} size="small"
                                            variant={featureSelected === key ? "filled" : "outlined"}
                                            color={featureSelected === key ? "secondary" : "default"}
                                            onClick={() => {
                                                setFeatureSelected(key);
                                                const pts = (image.sublimationBoxes?.[key]?.layers || []).map(l => l.points || []);
                                                setSublimPoints(pts);
                                            }}
                                            sx={{ fontSize: "0.68rem", cursor: "pointer" }}
                                        />
                                    ))}
                                </Box>

                                {featureSelected && (
                                    <>
                                        <Button size="small" variant="outlined" fullWidth sx={{ mb: 1 }}
                                            onClick={() => {
                                                setFeatures(prev => {
                                                    const fea = { ...prev };
                                                    const feat = { ...fea[featureSelected] };
                                                    feat.layers = [...(feat.layers || []), {
                                                        type: "layer",
                                                        name: `Layer ${(feat.layers || []).length + 1}`,
                                                        lines: [], sublimated: true,
                                                    }];
                                                    fea[featureSelected] = feat;
                                                    return fea;
                                                });
                                            }}>
                                            + Add Layer to {featureSelected}
                                        </Button>
                                        <Stack spacing={0.75} sx={{ maxHeight: 180, overflowY: "auto" }}>
                                            {(features[featureSelected]?.layers || []).map((layer, idx) => (
                                                <Paper key={idx} variant="outlined" sx={{
                                                    px: 1.5, py: 1, cursor: "pointer", borderRadius: 1.5,
                                                    bgcolor: layerSelected === layer.name ? "action.selected" : "transparent",
                                                    "&:hover": { bgcolor: "action.hover" },
                                                }}>
                                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                                        <Typography variant="body2" onClick={() => { setLayerSelected(layer.name); setSublimModalOpen(true); }}>
                                                            {layer.name}
                                                        </Typography>
                                                        <IconButton size="small" color="error" onClick={() => {
                                                            setFeatures(prev => {
                                                                const fea = { ...prev };
                                                                const feat = { ...fea[featureSelected] };
                                                                feat.layers = feat.layers.filter((_, i) => i !== idx);
                                                                fea[featureSelected] = feat;
                                                                return fea;
                                                            });
                                                        }}>
                                                            <DeleteOutlineIcon fontSize="small" />
                                                        </IconButton>
                                                    </Stack>
                                                </Paper>
                                            ))}
                                        </Stack>
                                    </>
                                )}
                            </Box>
                        )}
                    </Box>

                    {saveError && (
                        <Alert severity="error" onClose={() => setSaveError("")}>{saveError}</Alert>
                    )}
                </Box>
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2, borderTop: "1px solid", borderColor: "divider", gap: 1 }}>
                <Button onClick={handleClose} variant="outlined">Cancel</Button>
                <Button
                    variant="contained"
                    disabled={!image.image || saving}
                    onClick={handleSaveImage}
                    startIcon={saving ? <CircularProgress size={15} color="inherit" /> : null}
                >
                    {saving ? "Saving…" : "Save Image"}
                </Button>
            </DialogActions>

            <CopyBoxesModal
                open={copyBoxesOpen}
                onClose={() => setCopyBoxesOpen(false)}
                blank={blank} image={image} setImage={setImage}
            />
            <EditablePolygon
                open={sublimModalOpen} setOpen={setSublimModalOpen}
                blank={blank} setBlank={setBlank}
                image={image} setImage={setImage}
                area={featureSelected} layer={layerSelected}
            />
        </Dialog>
    );
}

// ─── Copy Boxes Modal ──────────────────────────────────────────────────────────
function CopyBoxesModal({ open, onClose, blank, image, setImage }) {
    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography fontWeight={700}>Copy Boxes from Another Color</Typography>
                <IconButton size="small" onClick={onClose}><CloseIcon /></IconButton>
            </DialogTitle>
            <DialogContent dividers>
                {blank.images?.length ? (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, pt: 1 }}>
                        {[...blank.images]
                            .sort((a, b) => String(a.color).localeCompare(String(b.color)))
                            .map((img, idx) => {
                                const boxCount = Object.keys(img.boxes || {}).length;
                                const isCurrentImage = image._id && img._id === image._id;
                                return (
                                    <Paper
                                        key={idx}
                                        variant="outlined"
                                        onClick={() => {
                                            if (!img.boxes) return;
                                            setImage(prev => ({
                                                ...prev,
                                                boxes: { ...(prev.boxes || {}), ...img.boxes },
                                            }));
                                            onClose();
                                        }}
                                        sx={{
                                            p: 1, cursor: boxCount > 0 ? "pointer" : "default", borderRadius: 2,
                                            border: isCurrentImage ? "2px solid #3b82f6" : "1px solid #e2e8f0",
                                            opacity: boxCount === 0 ? 0.5 : 1,
                                            "&:hover": boxCount > 0 ? { bgcolor: "action.hover", borderColor: "primary.main" } : {},
                                            width: 140,
                                        }}
                                    >
                                        <Box sx={{ position: "relative", width: 120, height: 120, mb: 0.75 }}>
                                            <Image
                                                src={`${img.image?.replace("images1.pythieastechnologies.com", "images2.pythieastechnologies.com/origin")}?width=200&height=200`}
                                                alt="" width={120} height={120}
                                                style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 4 }}
                                            />
                                            {/* Box previews */}
                                            <Stage width={120} height={120} style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}>
                                                {Object.entries(img.boxes || {}).map(([key, rect], i) => (
                                                    <Layer key={i}>
                                                        <Rect
                                                            x={(rect.x || 0) * 0.3} y={(rect.y || 0) * 0.3}
                                                            width={(rect.width || 0) * 0.3} height={(rect.height || 0) * 0.3}
                                                            rotation={rect.rotation || 0}
                                                            stroke="#3b82f6" strokeWidth={1.5} dash={[4, 3]}
                                                        />
                                                    </Layer>
                                                ))}
                                            </Stage>
                                        </Box>
                                        <Typography variant="caption" fontWeight={600} display="block" noWrap>
                                            {boxCount} box{boxCount !== 1 ? "es" : ""}
                                        </Typography>
                                        {isCurrentImage && (
                                            <Typography variant="caption" color="primary" display="block">current</Typography>
                                        )}
                                    </Paper>
                                );
                            })}
                    </Box>
                ) : (
                    <Typography color="text.secondary" sx={{ py: 3, textAlign: "center" }}>No other images available</Typography>
                )}
            </DialogContent>
        </Dialog>
    );
}

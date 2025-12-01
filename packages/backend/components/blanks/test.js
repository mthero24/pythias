"use client";
import React, { useState, useRef, useEffect, useCallback, use } from "react";
import { Stage, Layer, Line, Circle, Group, Image as KonvaImage } from "react-konva";
import {Box, Modal, Button,} from "@mui/material"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import axios from "axios";
const s3 = new S3Client({
    credentials: {
        accessKeyId: 'XWHXU4FP7MT2V842ITN9',
        secretAccessKey: 'kf78BeufoEwwhSdecZCdcpZVJsIng6v5WFJM1Nm3'
    }, region: "us-west-1", profile: "wasabi", endpoint: "https://s3.us-west-1.wasabisys.com/"
}); // for S3
import AddCircleIcon from '@mui/icons-material/AddCircle';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import { set } from "mongoose";
// simple hook to load an HTMLImage
function useHTMLImage(src) {
    const [image, setImage] = useState(null);

    useEffect(() => {
        if (!src) return;
        const img = new window.Image();
        img.crossOrigin = "anonymous"; // optional for remote images
        img.src = src;
        img.onload = () => setImage(img);
    }, [src]);

    return image;
}

export function EditablePolygon({blank, image, setImage, setBlank, area, layer, open, setOpen}){
    const CANVAS_SIZE = 400;

    // flat points: [x1, y1, x2, y2, ...]
    const [points, setPoints] = useState([
        100, 100,
        300, 120,
        280, 280,
        120, 300,
    ]);
    useEffect(() => {
        // load initial points from props
        if (blank && image && area && layer) {
            image.sublimationBoxes = image.sublimationBoxes || {};
            image.sublimationBoxes[area] = image.sublimationBoxes[area] || { layers: [] };
            let lay = image.sublimationBoxes[area].layers.find(lay=> lay.name === layer);
            console.log("lay", lay)
            setPoints(lay && lay.points? lay.points : [        
                100, 100,
                300, 120,
                280, 280,
                120, 300,
            ]);
        }
    }, [blank, image, area, layer]);
    const stageRef = useRef(null);
    const clipGroupRef = useRef(null);

    // zoom / pan state for main editor
    const [scale, setScale] = useState(1);
    const [stagePos, setStagePos] = useState({ x: 0, y: 0 });

    // load your image here
    let imageUrl = useHTMLImage(image?.image); // change if needed

    // ------------- geometry / polygon helpers -------------

    const handleDragMove = (index, e) => {
        const { x, y } = e.target.position();
        const newPoints = points.slice();
        newPoints[index * 2] = x;
        newPoints[index * 2 + 1] = y;
        setPoints(newPoints);
    };

    const distToSegmentSquared = (ax, ay, bx, by, cx, cy) => {
        const abx = bx - ax;
        const aby = by - ay;
        const acx = cx - ax;
        const acy = cy - ay;

        const abLenSq = abx * abx + aby * aby;
        if (abLenSq === 0) {
            const dx = cx - ax;
            const dy = cy - ay;
            return dx * dx + dy * dy;
        }

        let t = (acx * abx + acy * aby) / abLenSq;
        t = Math.max(0, Math.min(1, t));
        const px = ax + t * abx;
        const py = ay + t * aby;

        const dx = cx - px;
        const dy = cy - py;
        return dx * dx + dy * dy;
    };

    const screenToWorld = (pointer, stageX, stageY, scale) => {
        return {
            x: (pointer.x - stageX) / scale,
            y: (pointer.y - stageY) / scale,
        };
    };

    const handleStageMouseDown = useCallback(
        (e) => {
            const target = e.target;

            // don't add a point if clicking on an anchor
            if (target.getClassName && target.getClassName() === "Circle") {
                return;
            }

            const stage = stageRef.current;
            if (!stage) return;

            const pointer = stage.getPointerPosition();
            if (!pointer) return;

            // convert to world coords (image space)
            const { x: cx, y: cy } = screenToWorld(pointer, stagePos.x, stagePos.y, scale);

            if (points.length < 4) return;

            const numVerts = points.length / 2;

            let bestIndex = 0;
            let bestDist = Infinity;

            for (let i = 0; i < numVerts; i++) {
                const i2 = (i + 1) % numVerts;
                const ax = points[i * 2];
                const ay = points[i * 2 + 1];
                const bx = points[i2 * 2];
                const by = points[i2 * 2 + 1];

                const d2 = distToSegmentSquared(ax, ay, bx, by, cx, cy);
                if (d2 < bestDist) {
                    bestDist = d2;
                    bestIndex = i;
                }
            }

            const newPoints = points.slice();
            const insertPos = (bestIndex + 1) * 2;
            newPoints.splice(insertPos, 0, cx, cy);
            setPoints(newPoints);
        },
        [points, scale, stagePos]
    );

    const update = async ({ blank }) => {
        console.log("update", blank)
        let res = await axios.post("/api/admin/blanks", { blank });
        if (res.data.error) {
            alert("Error saving blank")
        }
    }

    const handleExport = async () => {
        if (!clipGroupRef.current) return;

        const dataURL = clipGroupRef.current.toDataURL({
            pixelRatio: 2,
            mimeType: "image/png",
        });
        let url = `blanks/pieces/${Date.now()}.png`
        let params = {
            Bucket: "images1.pythiastechnologies.com",
            Key: url,
            Body: await Buffer.from(dataURL.replace(/^data:image\/\w+;base64,/, ""), 'base64'),
            ACL: "public-read",
            ContentEncoding: "base64",
            ContentDisposition: "inline",
            ContentType: "image/png",
        };
        const data = await s3.send(new PutObjectCommand(params));
        let wholeUrl = `https://images1.pythiastechnologies.com/${url}`;
        let bla = { ...blank };
        let img = bla.images.find(img=> img._id.toString() === image._id.toString())
        img.sublimationBoxes = img.sublimationBoxes || {};
        img.sublimationBoxes[area] = img.sublimationBoxes[area] || { layers: [] };
        let lay = img.sublimationBoxes[area].layers.find(lay=> lay.name === layer);
        if(!lay){
            lay = { name: layer, points, url: wholeUrl };
            img.sublimationBoxes[area].layers.push(lay);
        }else{
            lay.points = points;
            lay.url = wholeUrl;
        }
        setBlank(bla);
        setImage(img);
        setOpen(false);
        setScale(1);
        setStagePos({ x: 0, y: 0 });
        update({ blank: bla });
        console.log("Exported polygon cutout image:", `https://images1.pythiastechnologies.com/${url}`);
        
    };

    // ----------------- zoom handlers -----------------

    const handleWheel = (e) => {
        e.evt.preventDefault();
        const stage = stageRef.current;
        if (!stage) return;

        const oldScale = scale;
        const pointer = stage.getPointerPosition();
        if (!pointer) return;

        const scaleBy = 1.05;
        const direction = e.evt.deltaY > 0 ? -1 : 1;
        const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;
        const clampedScale = Math.max(0.3, Math.min(5, newScale));

        const mousePointTo = {
            x: (pointer.x - stagePos.x) / oldScale,
            y: (pointer.y - stagePos.y) / oldScale,
        };

        const newPos = {
            x: pointer.x - mousePointTo.x * clampedScale,
            y: pointer.y - mousePointTo.y * clampedScale,
        };

        setScale(clampedScale);
        setStagePos(newPos);
    };

    const zoomIn = () => {
        const stage = stageRef.current;
        if (!stage) return;
        const center = { x: stage.width() / 2, y: stage.height() / 2 };
        const oldScale = scale;
        const scaleBy = 1.1;
        const newScale = Math.min(5, oldScale * scaleBy);

        const mousePointTo = {
            x: (center.x - stagePos.x) / oldScale,
            y: (center.y - stagePos.y) / oldScale,
        };

        const newPos = {
            x: center.x - mousePointTo.x * newScale,
            y: center.y - mousePointTo.y * newScale,
        };

        setScale(newScale);
        setStagePos(newPos);
    };

    const zoomOut = () => {
        const stage = stageRef.current;
        if (!stage) return;
        const center = { x: stage.width() / 2, y: stage.height() / 2 };
        const oldScale = scale;
        const scaleBy = 1.1;
        const newScale = Math.max(0.3, oldScale / scaleBy);

        const mousePointTo = {
            x: (center.x - stagePos.x) / oldScale,
            y: (center.y - stagePos.y) / oldScale,
        };

        const newPos = {
            x: center.x - mousePointTo.x * newScale,
            y: center.y - mousePointTo.y * newScale,
        };

        setScale(newScale);
        setStagePos(newPos);
    };

    return (
        <Modal open={open} onClose={() => {
                setOpen(false)
                setScale(1);
                setStagePos({ x: 0, y: 0 });
            }} >
            <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 1000, height: 800, bgcolor: 'background.paper', boxShadow: 24, p: 4, outline: 'none' }}>
                <Box sx={{ marginBottom: 1, display: "flex", gap: 1, alignItems: "center", justifyContent: "flex-start", paddingLeft: 7 }}>
                    <AddCircleIcon onClick={zoomIn}>+</AddCircleIcon>
                    <RemoveCircleIcon onClick={zoomOut}>-</RemoveCircleIcon>
                    <span>Zoom: {(scale * 100).toFixed(0)}%</span>
                </Box>

                {/* MAIN EDITOR (zoomable) */}
                <Box sx={{display: "flex", flexDirection: "row", justifyContent: "center", gap: 3}}>
                    <Stage
                        width={CANVAS_SIZE}
                        height={CANVAS_SIZE}
                        ref={stageRef}
                        scaleX={scale}
                        scaleY={scale}
                        x={stagePos.x}
                        y={stagePos.y}
                        onWheel={handleWheel}
                        onMouseDown={handleStageMouseDown}
                        style={{ border: "1px solid #ccc" }}
                    >
                        <Layer>
                            {/* group that clips the image to the polygon */}
                            <Group
                                ref={clipGroupRef}
                                clipFunc={(ctx) => {
                                    if (!points.length) return;
                                    ctx.beginPath();
                                    ctx.moveTo(points[0], points[1]);
                                    for (let i = 2; i < points.length; i += 2) {
                                        ctx.lineTo(points[i], points[i + 1]);
                                    }
                                    ctx.closePath();
                                }}
                            >
                                {imageUrl && (
                                    <KonvaImage
                                        image={imageUrl}
                                        x={0}
                                        y={0}
                                        width={CANVAS_SIZE}
                                        height={CANVAS_SIZE}
                                    />
                                )}
                            </Group>

                            {/* visual polygon outline */}
                            <Line
                                points={points}
                                closed
                                stroke="red"
                                strokeWidth={2}
                                lineJoin="round"
                            />

                            {/* draggable anchors */}
                            {points.map((p, i) => {
                                if (i % 2 !== 0) return null;
                                const x = points[i];
                                const y = points[i + 1];
                                const index = i / 2;

                                return (
                                    <Circle
                                        key={i}
                                        x={x}
                                        y={y}
                                        radius={5}
                                        fill="white"
                                        stroke="blue"
                                        strokeWidth={1}
                                        draggable
                                        onDragMove={(e) => handleDragMove(index, e)}
                                        onMouseEnter={() => (document.body.style.cursor = "pointer")}
                                        onMouseLeave={() => (document.body.style.cursor = "default")}
                                    />
                                );
                            })}
                        </Layer>
                    </Stage>

                    {/* FULL-IMAGE PREVIEW (always shows entire image & polygon) */}
                    <Box sx={{ marginTop: 1 }}>
                        <Stage
                            width={CANVAS_SIZE}
                            height={CANVAS_SIZE}
                            // no zoom/pan here
                            style={{ border: "1px solid #eee" }}
                        >
                            <Layer>
                                {imageUrl && (
                                    <KonvaImage
                                        image={imageUrl}
                                        x={0}
                                        y={0}
                                        width={CANVAS_SIZE}
                                        height={CANVAS_SIZE}
                                    />
                                )}
                                <Line
                                    points={points}
                                    closed
                                    stroke="rgba(255,0,0,0.7)"
                                    strokeWidth={2}
                                    lineJoin="round"
                                />
                            </Layer>
                        </Stage>
                    </Box>
                </Box>
                <Box sx={{ marginTop: 2, display: "flex", justifyContent: "center" }}>
                    <Button variant="contained" onClick={handleExport}>Save</Button>
                </Box>
            </Box>
        </Modal>
    );
}

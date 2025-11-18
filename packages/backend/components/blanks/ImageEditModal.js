import { Stage, Layer, Transformer, Rect, Image as KonvaImage, Line } from "react-konva";
import {Box, Modal, Button, Typography, TextField, Grid2, Checkbox, MenuItem} from "@mui/material";
import React, { use, useEffect, useRef, useState } from "react";
import { Uploader2 } from "../reusable/uploader2";
import useImage from 'use-image';
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import Image from "next/image";
import { Check } from "@mui/icons-material";
const s3 = new S3Client({ credentials:{
    accessKeyId:'XWHXU4FP7MT2V842ITN9',
   secretAccessKey:'kf78BeufoEwwhSdecZCdcpZVJsIng6v5WFJM1Nm3'
}, region: "us-west-1", profile: "wasabi", endpoint: "https://s3.us-west-1.wasabisys.com/"  }); // for S3
const degToRad = (angle) => (angle / 180) * Math.PI;

const getCorner = (pivotX, pivotY, diffX, diffY, angle) => {
    const distance = Math.sqrt(diffX * diffX + diffY * diffY);
    angle += Math.atan2(diffY, diffX);
    const x = pivotX + distance * Math.cos(angle);
    const y = pivotY + distance * Math.sin(angle);
    return { x, y };
};

const getClientRect = (element) => {
    const { x, y, width, height, rotation = 0 } = element;
    const rad = degToRad(rotation);

    const p1 = getCorner(x, y, 0, 0, rad);
    const p2 = getCorner(x, y, width, 0, rad);
    const p3 = getCorner(x, y, width, height, rad);
    const p4 = getCorner(x, y, 0, height, rad);

    const minX = Math.min(p1.x, p2.x, p3.x, p4.x);
    const minY = Math.min(p1.y, p2.y, p3.y, p4.y);
    const maxX = Math.max(p1.x, p2.x, p3.x, p4.x);
    const maxY = Math.max(p1.y, p2.y, p3.y, p4.y);

    return {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
    };
};

export function ImageEditModal({ open, onClose, blank, setBlank, update, color, printLocations, selectedImageSrc, setSelectedImageSrc }) {
    //console.log("selectedImageSrc", selectedImageSrc)
    const [rectangles, setRectangles] = useState([]);
    const [selectedIds, setSelectedIds] = useState([]);
    const [selectionRectangle, setSelectionRectangle] = useState({
        visible: false,
        x1: 0,
        y1: 0,
        x2: 0,
        y2: 0,
    });
    const isSelecting = useRef(false);
    const transformerRef = useRef();
    const boxRef = useRef();
    const imageTransRef = useRef();
    const rectRefs = useRef(new Map());
    const stageRef = useRef();
    const widthRef = useRef();
    const heightRef = useRef();
    const xRef = useRef();
    const yRef = useRef();
    const [image, setImage] = useState(selectedImageSrc ? {...selectedImageSrc} : {color: color?._id, image: null, boxes: {}});
    const [reload, setReload] = useState(false);
    const [originalImage, setOriginalImage] = useState(null);
    const [step, setStep] = useState(""); // 1: Upload, 2: Edit
    const [addImage, setAddImage] = useState(null);
    const [cropAdd, setCropAdd] = useState(false);
    const [reloadTransformers, setReloadTransformers] = useState(false);
    const [active, setActive] = useState("");
    const [copyBoxesOpen, setCopyBoxesOpen] = useState(false);
    const [hasSublimation, setHasSublimation] = useState(false);
    const sublimationBoxes = [{name:"front"}, {name:"back"}, {name:"leftSleeve"}, {name:"rightSleeve"}, {name:"collar"}];
    const [subSelected, setSubSelected] = useState("")
    const [count, setCount] = useState(0)
    const [tool, setTool] = useState('erraser');
    const [lines, setLines] = useState([]);
    const [showArea, setShowArea] = useState(false);
    const [points, setPoints] = useState([]);
    const [pan, setPan] = useState(false);
    const isDrawing = useRef(false);
    useEffect(() => {
        console.log(color, "color");
        let img = {...image}
        if(img){
            if(!img.sublimationBoxes) img.sublimationBoxes = {}
            for(let sub of sublimationBoxes){
                img.sublimationBoxes[sub.name]= []
            }
            img.color = color?._id
            setImage(img);

        }
    }, [color, open]);
    useEffect(() => {
        let img
        console.log(color, selectedImageSrc)
        if(selectedImageSrc) img = {...selectedImageSrc}
        else img = {color: color?._id, image: null, boxes: {}}
        setImage(img);
    }, [selectedImageSrc]);
    useEffect(() => {
        if(!transformerRef.current) {
            setReloadTransformers(true);
            setTimeout(() => {
                setReloadTransformers(false);
            }, 100);
        }
        if (selectedIds.length && transformerRef.current) {
            // Get the nodes from the refs Map
            const nodes = selectedIds
                .map(id => rectRefs.current.get(id))
                .filter(node => node);

            transformerRef.current.nodes(nodes);
        } else if (transformerRef.current) {
            // Clear selection
            transformerRef.current.nodes([]);
        }
    }, [selectedIds]);
    useEffect(() => {
        if (addImage) {
            let scaleX = 100 / addImage.width;
            let scaleY = 100 / addImage.height;
            let rects = [...rectangles]
            rects = [{ x: 50, y: 50, width: 100, height: 100, id: "addImage", name: 'rect', fillPatternImage: addImage, fillPatternScaleX: scaleX, fillPatternScaleY: scaleY, draggable: true, }]
            setRectangles(rects);
            setStep("setImage")
        }
    }, [addImage]);
    const handleStageClick = (e) => {
        // If we are selecting with rect, do nothing
        if (selectionRectangle.visible) {
            return;
        }
        // If click on empty area - remove all selections
        if (e.target === e.target.getStage()) {
            setSelectedIds([]);
            return;
        }

        // Do nothing if clicked NOT on our rectangles
        if (!e.target.hasName('rect')) {
            setSelectedIds([]);
            return;
        }
        const clickedId = e.target.id();
        boxRef.current = e.target;
        // Do we pressed shift or ctrl?
        const metaPressed = e.evt.shiftKey || e.evt.ctrlKey || e.evt.metaKey;
        const isSelected = selectedIds.includes(clickedId);
        setSelectedIds([clickedId]);
        // if (!metaPressed && !isSelected) {
        //     // If no key pressed and the node is not selected
        //     // select just one
        //     setSelectedIds([clickedId]);
        // } else if (metaPressed && isSelected) {
        //     // If we pressed keys and node was selected
        //     // we need to remove it from selection
        //     setSelectedIds(selectedIds.filter(id => id !== clickedId));
        // } else if (metaPressed && !isSelected) {
        //     // Add the node into selection
        //     setSelectedIds([...selectedIds, clickedId]);
        // }
    };
    const sublimationHandleMouseDown = (e) => {
        if(pan) return;
        isDrawing.current = true;
        const stage = e.target.getStage();
        const pointerPos = stage.getPointerPosition();
        const stageTransform = stage.getAbsoluteTransform().copy();
        const absolutePointerPos = stageTransform.invert().point(pointerPos);
        setLines([...lines, { tool, points: [absolutePointerPos.x, absolutePointerPos.y] }]);
    };

    const sublimationHandleMouseMove = (e) => {
        // no drawing - skipping
        if (!isDrawing.current) {
            return;
        }
        const stage = e.target.getStage();
        const pointerPos = stage.getPointerPosition();
        const stageTransform = stage.getAbsoluteTransform().copy();
        const absolutePointerPos = stageTransform.invert().point(pointerPos);
        let lastLine = lines[lines.length - 1];
        // add point
        lastLine.points = lastLine.points.concat([absolutePointerPos.x, absolutePointerPos.y]);
        // replace last
        lines.splice(lines.length - 1, 1, lastLine);
        setLines(lines.concat());
    };

    const sublimationHandleMouseUp = () => {
        isDrawing.current = false;
    };
    const handleMouseDown = (e) => {
        // Do nothing if we mousedown on any shape
        if (e.target !== e.target.getStage()) {
            return;
        }

        // Start selection rectangle
        isSelecting.current = true;
        const pos = e.target.getStage().getPointerPosition();
        setSelectionRectangle({
            visible: true,
            x1: pos.x,
            y1: pos.y,
            x2: pos.x,
            y2: pos.y,
        });
    };

    const handleMouseMove = (e) => {
        // Do nothing if we didn't start selection
        if (!isSelecting.current) {
            return;
        }

        const pos = e.target.getStage().getPointerPosition();
        setSelectionRectangle({
            ...selectionRectangle,
            x2: pos.x,
            y2: pos.y,
        });
    };

    const handleMouseUp = () => {
        // Do nothing if we didn't start selection
        if (!isSelecting.current) {
            return;
        }
        isSelecting.current = false;

        // Update visibility in timeout, so we can check it in click event
        setTimeout(() => {
            setSelectionRectangle({
                ...selectionRectangle,
                visible: false,
            });
        });

        const selBox = {
            x: Math.min(selectionRectangle.x1, selectionRectangle.x2),
            y: Math.min(selectionRectangle.y1, selectionRectangle.y2),
            width: Math.abs(selectionRectangle.x2 - selectionRectangle.x1),
            height: Math.abs(selectionRectangle.y2 - selectionRectangle.y1),
        };

        const selected = rectangles.filter(rect => {
            // Check if rectangle intersects with selection box
            return Konva.Util.haveIntersection(selBox, getClientRect(rect));
        });
        setSelectedIds(selected.map(rect => rect.id));
    };

    const handleDragEnd = (e) => {
        const id = e.target.id();
        setRectangles(prevRects => {
            const newRects = [...prevRects];
            const index = newRects.findIndex(r => r.id === id);
            if (xRef.current) xRef.current.value = parseInt(e.target.x());
            if (yRef.current) yRef.current.value = parseInt(e.target.y());
            if (index !== -1) {
                newRects[index] = {
                    ...newRects[index],
                    x: e.target.x(),
                    y: e.target.y()
                };
            }
            return newRects;
        });
    };
    const handleDragMove = (e) => {
        const rect = e.target;
        let newRects = [...rectangles];
        const index = newRects.findIndex(r => r.id === rect.id());
        let newX = rect.x();
        let newY = rect.y();

        // Define boundaries (Stage dimensions minus rectangle size)
        const minX = 0;
        const maxX = 400 - e.target.width();
        const minY = 0;
        const maxY = 400 - e.target.height();

        // Clamp the position within the boundaries
        if (newX < minX) {
            newX = minX;
        }
        if (newX > maxX) {
            newX = maxX;
        }
        if (newY < minY) {
            newY = minY;
        }
        if (newY > maxY) {
            newY = maxY;
        }

        rect.x(newX);
        rect.y(newY);
        if (index !== -1) {
            newRects[index] = {
                ...newRects[index],
                x: newX,
                y: newY
            }
        }
        setRectangles(newRects);
        // Optional: Update React state to persist position, but do so carefully
        // setPosition({ x: newX, y: newY }); 
    };
    const handleExportPartial = async() => {
        let crop = rectangles.find(r => r.id === "crop");
        setRectangles([]);
        await new Promise(r => setTimeout(r, 100))
        let region = {
            x: crop.x,
            y: crop.y,
            width: crop.width,
            height: crop.height,
            pixelRatio: 2
        }
        if (stageRef.current) {
            const dataURL = stageRef.current.toDataURL({
               ...region
            });
            let img = {...image}
            img.image = dataURL
            setImage({...img});
        }
    };
    const URLImage = ({ src, ...rest }) => {
        const [image] = useImage(src, 'anonymous'); // 'anonymous' for cross-origin images
        return <KonvaImage image={image} {...rest} />;
    };
    return (
        <Modal open={open} onClose={()=>{onClose(); setSelectedImageSrc(null)}} aria-labelledby="modal-modal-title" aria-describedby="modal-modal-description">
            <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 600, bgcolor: 'background.paper', boxShadow: 24, p: 4, outline: 'none' }}>
                <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Button variant="contained" color="primary" onClick={async () => {setCopyBoxesOpen(true)}}>
                        Copy Boxes from Another Image
                    </Button>
                    <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                        <Checkbox checked={hasSublimation} onChange={(e) => { setHasSublimation(e.target.checked) }} />Sublimation
                    </Box>
                </Box>
                <Box sx={{display: hasSublimation ? "none" : "flex", flexDirection: "row", alignItems: "center", justifyContent: "flex-start", overflowX: "auto", mt: 2, height: "180px"}}>
                    { <Box width={120} height={150} padding={1} sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", border: "1px solid #ccc", borderRadius: "4px", marginRight: 1, cursor: "pointer" }} onClick={() => { 
                        let rects = [...rectangles]
                        if (!rects.find(r => r.id === "crop")) rects = [{
                            x: 10, y: 10, width: 350, height: 350, id: "crop", name: 'rect', fill: 'transparent', stroke: '#00f', dash: [10, 10], strokeWidth: 2, draggable: true,
                            rotation: 0, }]
                        setRectangles(rects)
                        setStep("crop")
                     }}>
                        <Button>Crop</Button>
                    </Box>}
                    {printLocations && printLocations.length > 0 && printLocations.map((loc, idx) => (
                        <Box key={idx} width={120} height={150} padding={1} sx={{display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", border: "1px solid #ccc", borderRadius: "4px", marginRight: 1, backgroundColor: image.boxes && image.boxes[loc.name] != undefined ? '#959da5ff' : 'transparent'}} onClick={() => {
                            let rects = [...rectangles]
                            if (!rects.find(r => r.id === loc.name)){
                                if(image.boxes && image.boxes[loc.name]){
                                    let box = image.boxes[loc.name]
                                    console.log("using saved box", box)
                                    rects=[{
                                        x: box.x, y: box.y, width: box.width, height: box.height, rotation: box.rotation, id: loc.name, name: 'rect', fill: '#c58686ff', stroke: '#00f', dash: [10, 10], strokeWidth: 2, draggable: true,
                                    }]
                                    setRectangles([...rects])
                                    setStep("location")
                                    return;
                                }
                                rects=[{
                                    x: 10, y: 10, width: 300, height: 300, id: loc.name, name: 'rect', fill: '#c58686ff', stroke: '#00f', dash: [10, 10], strokeWidth: 2, draggable: true,
                                    rotation: 0, }]
                            }
                            setActive(loc.name)
                            setRectangles([...rects])
                            setStep("location")
                        }}>
                            <Button>{loc.name}</Button>
                            <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', mt: 1 }}>
                                <input ref={active == loc.name ? xRef : null} placeholder="X" id={`x-${loc.name}`} defaultValue={image.boxes ? image.boxes[loc.name]?.x : 0} style={{ width: "50px" }} onChange={(e) => {
                                    let rects = [...rectangles];
                                    let index = rects.findIndex(r => r.id === loc.name);
                                    if (index !== -1) {
                                        rects[index] = {
                                            ...rects[index],
                                            x: parseInt(e.target.value) || rects[index].x
                                        };
                                        xRef.current = e.target;
                                        setRectangles(rects);
                                    }
                                }} />
                                <input ref={active == loc.name ? yRef : null} placeholder="Y" id={`y-${loc.name}`} defaultValue={image.boxes ? image.boxes[loc.name]?.y : 0} style={{ width: "50px" }} onChange={(e) => {
                                    let rects = [...rectangles];
                                    let index = rects.findIndex(r => r.id === loc.name);
                                    if (index !== -1) {
                                        rects[index] = {
                                            ...rects[index],
                                            y: parseInt(e.target.value) || rects[index].y
                                        };
                                        yRef.current = e.target;
                                        setRectangles(rects);
                                    }
                                }} />
                            </Box>
                            <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', mt: 1 }}>
                                <input ref={active == loc.name ? widthRef : null} placeholder="Width" id={`width-${loc.name}`} defaultValue={image.boxes? image.boxes[loc.name]?.width:  0} style={{ width: "50px" }} onChange={(e)=>{
                                    let rects = [...rectangles];
                                    let index = rects.findIndex(r => r.id === loc.name);
                                    if (index !== -1) {
                                        rects[index] = {
                                            ...rects[index],
                                            width: parseInt(e.target.value) || rects[index].width
                                        };
                                        widthRef.current = e.target;
                                        setRectangles(rects);
                                    }
                                }} />
                                <input ref={active == loc.name ? heightRef : null} placeholder="Height" id={`height-${loc.name}`} defaultValue={image.boxes ? image.boxes[loc.name]?.height : 0} style={{ width: "50px" }} onChange={(e)=>{
                                    let rects = [...rectangles];
                                    let index = rects.findIndex(r => r.id === loc.name);
                                    if (index !== -1) {
                                        rects[index] = {
                                            ...rects[index],
                                            height: parseInt(e.target.value) || rects[index].height
                                        };
                                        heightRef.current = e.target;
                                        setRectangles(rects);
                                    }
                                }} />
                            </Box>
                            <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', mt: 1 }}>
                                <Button variant="contained" size="small" color="primary" onClick={()=>{
                                    let img = { ...image }
                                    let newBoxes = {}
                                    for(let b in Object.keys(img.boxes)){
                                        if(b !== loc.name)newBoxes[b] = img.boxes[b]
                                    }
                                    img.boxes = newBoxes
                                    setImage({...img});
                                }} >Remove</Button>
                            </Box>
                        </Box>
                    ))}
                </Box>
                <Box sx={{ mt: 2, mb: 2 }}>
                    {hasSublimation && <Box sx={{ display: hasSublimation ? "flex" : "none", flexDirection: "row", alignItems: "center", justifyContent: "flex-start", overflowX: "auto", mt: 2, height: "25px" }}>
                        <TextField
                            select
                            onChange={(e)=>{
                                console.log(e.target.value)
                                setTool(e.target.value)
                            }}
                            label="Tool">
                            <MenuItem key="eraser" value="eraser">Eraser</MenuItem>
                            <MenuItem key="pen" value="pen">Pen</MenuItem>
                        </TextField>
                        <Button sx={{ ml: 2 }} onClick={() => { setLines([]); setPoints([]); }}>Clear</Button>
                        <Button sx={{ ml: 2 }} onClick={() => { setPan(!pan) }}>{pan ? "Stop Pan" : "Start Pan"}</Button>
                    </Box>}
                </Box>
                {!reload && <Uploader2 afterFunction={async (data) => {   
                    if(step == "addImage") {
                        const img = new window.Image();
                        img.src = data.url; // Replace with your image URL
                        img.onload = () => {
                            setAddImage(img);
                        };
                        return;
                    }else {
                        let img = {...image}
                        img.image = data.url
                        setImage({...img});
                        setOriginalImage(data.url);
                    }
                }} />}
                {image.image && step !== "addImage" && <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', overflow: 'hidden', position: "relative", top: -415, marginBottom: "-400px" }}>
                    <Stage  width={400} height={400}
                         style={{background: "#f0f0f0", border: '1px solid #ccc', cursor: pan ? "grab" : "default" }}
                        draggable={pan}
                        onMouseDown={hasSublimation ? sublimationHandleMouseDown : handleMouseDown}
                        onMousemove={hasSublimation ? sublimationHandleMouseMove : handleMouseMove}
                        onMouseup={hasSublimation ? sublimationHandleMouseUp : handleMouseUp}
                        onContextMenu={(e) => {
                            // stop default scrolling
                            console.log("wheel down")
                            e.evt.preventDefault();
                            console.log(e.target)
                            let rects = [...rectangles];
                            rects = rects.filter(r => r.id !== e.target.id())
                            setRectangles([...rects]);
                        }}
                        onWheel={(e) => {
                            // stop default scrolling
                            const scaleBy = 1.01;
                            e.evt.preventDefault();
                            console.log(stageRef.current)
                            const oldScale = stageRef.current.scaleX();
                            const pointer = stageRef.current.getPointerPosition();

                            const mousePointTo = {
                                x: (pointer.x - stageRef.current.x()) / oldScale,
                                y: (pointer.y - stageRef.current.y()) / oldScale,
                            };

                            // how to scale? Zoom in? Or zoom out?
                            let direction = e.evt.deltaY > 0 ? 1 : -1;

                            // when we zoom on trackpad, e.evt.ctrlKey is true
                            // in that case lets revert direction
                            if (e.evt.ctrlKey) {
                                direction = -direction;
                            }

                            const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;

                            stageRef.current.scale({ x: newScale, y: newScale });

                            const newPos = {
                                x: pointer.x - mousePointTo.x * newScale,
                                y: pointer.y - mousePointTo.y * newScale,
                            };
                            stageRef.current.position(newPos);
                        }}
                        onClick={handleStageClick} ref={stageRef}>
                        <Layer>
                            <URLImage src={image.image} x={0} y={0} width={400} height={400} />
                        </Layer>
                        {!hasSublimation &&[...rectangles].map((rect, i) => (
                            <Layer key={i}>
                                {console.log("rect render", rect.width, rect.height)}
                                <Rect
                                    key={rect.id}
                                    id={rect.id}
                                    name={rect.name}
                                    x={rect.x}
                                    y={rect.y}
                                    width={rect.width}
                                    height={rect.height}
                                    rotation={rect.rotation}
                                    fill={rect.fill}
                                    fillPatternImage={rect.fillPatternImage}
                                    fillPatternScaleX={rect.fillPatternScaleX} // Optional: Adjust image scale
                                    fillPatternScaleY={rect.fillPatternScaleY} // Optional: Adjust image scale
                                    stroke={rect.stroke}
                                    dash={[10, 10]}
                                    strokeWidth={2}
                                    draggable
                                    ref={node => {
                                        if (node) {
                                            rectRefs.current.set(rect.id, node);
                                        }
                                    }}
                                    onDragMove={handleDragMove}
                                    onDragEnd={handleDragEnd}
                                    onTransformEnd={(e) => {
                                        // Get the transformed node
                                        const node = transformerRef.current;
                                        // Get the scale and rotation
                                        const scaleX = stageRef.current.scaleX();
                                        const scaleY = stageRef.current.scaleY();
                                        // Reset the scale to 1 and update the new dimensions
                                        let index = 0;
                                        if (cropAdd) index = 1;
                                        if (widthRef.current) widthRef.current.value = parseInt(Math.max(5, node.width() * scaleX));
                                        if (heightRef.current) heightRef.current.value = parseInt(Math.max(5, node.height() * scaleY));
                                        // Get the scale and rotation
                                      }}
                                />
                                {!reloadTransformers && <Transformer
                                    ref={transformerRef}
                                    flipEnabled={false}
                                    boundBoxFunc={(oldBox, newBox) => {
                                        console.log("boundBoxFunc", oldBox, newBox)
                                        const newRects = [...rectangles];
                                        let newRect = newRects.find(b => b.id === boxRef.current.id())
                                        if (addImage) {
                                            newRect.fillPatternImage = addImage;
                                            newRect.fillPatternScaleX = addImage.width / newBox.width;
                                            newRect.fillPatternScaleY = addImage.height / newBox.height;
                                        }
                                        // limit resize
                                        if (Math.abs(newBox.width) < 5 || Math.abs(newBox.height) < 5) {
                                            newRect.width = oldBox.width;
                                            newRect.height = oldBox.height;
                                            newRect.rotation = oldBox.rotation;
                                            setRectangles([...newRects])
                                            return oldBox;
                                        }
                                        if (Math.abs(newBox.width) > stageRef.current.width() || Math.abs(newBox.height) > stageRef.current.height()) {
                                            newRect.width = oldBox.width;
                                            newRect.height = oldBox.height;
                                            newRect.rotation = oldBox.rotation;
                                            setRectangles([...newRects])
                                            return oldBox;
                                        }
                                        newRect.width = newBox.width;
                                        newRect.height = newBox.height;
                                        newRect.rotation = newBox.rotation;
                                        setRectangles([...newRects]);
                                        return newBox;
                                    }}
                                    
                                />}
                                {selectionRectangle.visible && (
                                    <Rect
                                        x={Math.min(selectionRectangle.x1, selectionRectangle.x2)}
                                        y={Math.min(selectionRectangle.y1, selectionRectangle.y2)}
                                        width={Math.abs(selectionRectangle.x2 - selectionRectangle.x1)}
                                        height={Math.abs(selectionRectangle.y2 - selectionRectangle.y1)}
                                        fill="rgba(0,0,255,0.5)"
                                    />
                                )}
                            </Layer>
                        ))}
                        {hasSublimation && <Layer>
                            {lines.map((line, i) => (
                                <Line
                                    key={i}
                                    points={line.points}
                                    stroke="#df4b26"
                                    strokeWidth={.2}
                                    tension={0.1}
                                    lineCap="round"
                                    lineJoin="round"
                                    globalCompositeOperation={
                                        line.tool === 'eraser' ? 'destination-out' : 'source-over'
                                    }
                                />
                            ))}
                            {rectangles.map((rect, i) => (
                                <Rect
                                    key={i}
                                    x={rect.x}
                                    y={rect.y}
                                    width={rect.width}
                                    height={rect.height}
                                    fill={rect.fill}
                                    rotation={rect.rotation}
                                />
                            ))}
                        </Layer>}
                    </Stage>
                </Box>}
                {step === "crop" && <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                    <Button variant="contained" color="primary" onClick={async() => {
                        handleExportPartial();
                    }}>
                        Crop
                    </Button>
                    <Button variant="contained" color="primary" onClick={async () => {
                        let img = {...image}
                        img.image = originalImage
                        setImage({...img});
                    }}>
                        Reset
                    </Button>
                </Box>}
                {step === "location" && <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                    <Button variant="contained" color="primary" onClick={async() => {
                        
                        let rect = rectangles[0];
                        let img = {...image}
                        if(hasSublimation){
                            if(!img.sublimationBoxes) img.sublimationBoxes = {}
                            console.log("saving sublimation box", rect)
                            img.sublimationBoxes[rect.id] = { x: rect.x, y: rect.y, width: rect.width, height: rect.height, rotation: rect.rotation }
                            setImage({...img});
                            setRectangles([]);
                        }else{
                            if(!img.boxes) img.boxes = {}
                            console.log("saving box", rect)
                            img.boxes[rect.id] = { x: rect.x, y: rect.y, width: rect.width, height: rect.height, rotation: rect.rotation }
                            setImage({...img});
                            setRectangles([]);
                        }
                    }}>
                        save Box
                    </Button>
                </Box>}
                {hasSublimation && <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                    <Button variant="contained" color="primary" onClick={async () => {
                        setShowArea(!showArea)
                        console.log("saving all sublimation boxes")
                        //console.log(points)
                        let points = []
                        let rectangles = []
                        for(let line of lines){
                            console.log("line", line)
                            let points = []
                            for(let i = 0; i < line.points.length; i+=2){
                                let x = parseInt(line.points[i])
                                let y = line.points[i+1]
                                points.push([x, y])
                            }
                            let xValues = []
                            for(let line of points){
                                if(xValues.includes(line[0])) continue;
                                xValues.push(line[0])
                            }
                            xValues.sort((a,b) => a - b)
                            for(let x of xValues){
                                let minY = Math.min(...points.filter(p => p[0] === x).map(p => p[1]))
                                let maxY = Math.max(...points.filter(p => p[0] === x).map(p => p[1]))
                                let height = maxY - minY
                                console.log("x", x, "minY", minY, "maxY", maxY, height)
                                rectangles.push({ x: x, y: minY, width: 1, height: height, id: `sublimation-${x}`, name: 'rect', fill: '#c58686ff', rotation: 0, })
                            }
                        }
                        //console.log("rectangles", rectangles)
                        // for(let line of poi){
                        //     rectangles.push({ x: line[0], y: line[1], width: 1, height: .5, id: `sublimation-${line[0]}-${line[1]}`, name: 'rect', fill: '#c58686ff', stroke: '#00f', dash: [10, 10], strokeWidth: 2, draggable: true,
                        //     rotation: 0, })
                        // }
                        if(showArea) setRectangles([...rectangles])
                        else setRectangles([])
                    }}>
                        Show Area
                    </Button>
                </Box>}
                {step === "setImage" && <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                    <Button variant="contained" color="primary" onClick={async() => {
                        transformerRef.current.nodes([])
                        let region = {
                            x: 0,
                            y: 0,
                            width: 400,
                            height: 400,
                            pixelRatio: 2
                        }
                        if (stageRef.current) {
                            const dataURL = stageRef.current.toDataURL({
                                ...region
                            });
                            let img = { ...image }
                            img.image = dataURL
                            setImage({ ...img });
                            setAddImage(null);
                            setRectangles([]);
                            setStep("")
                        }
                    }}>
                        save Image Position
                    </Button>
                    <Button variant="contained" color="primary" onClick={async () => {
                        transformerRef.current.nodes([])
                        let rects = [...rectangles]
                        rects.push({ x: 10, y: 10, width: 100, height: 100, id: "crop", name: 'rect', fill: 'transparent', stroke: '#00f', dash: [10, 10], strokeWidth: 2, draggable: true,})
                        setRectangles(rects)
                        setCropAdd(true)
                        setStep("cropAdd")
                    }}>
                        crop Rectangle
                    </Button>
                </Box>}
                {cropAdd && <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                    <Button variant="contained" color="primary" onClick={async() => {
                        transformerRef.current.nodes([])
                        let crop = rectangles.find(r => r.id === "crop");
                        setRectangles(rectangles.filter(r => r.id !== "crop"));
                        await new Promise(r => setTimeout(r, 100))
                        let region = {
                            x: crop.x,
                            y: crop.y,
                            width: crop.width,
                            height: crop.height,
                            pixelRatio: 2
                        }
                        if (stageRef.current) {
                            const dataURL = stageRef.current.toDataURL({
                                ...region
                            });
                            const img = new window.Image();
                            img.src = dataURL; // Replace with your image URL
                            img.onload = () => {
                                setAddImage(img);
                            };
                            setCropAdd(false);
                            setStep("setImage")
                        }
                    }}>
                        save crop
                    </Button>
                </Box>}
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                    <Button variant="contained" color="primary" onClick={async ()=>{
                        setStep("addImage")
                        setReload(true)
                        await new Promise(r => setTimeout(r, 1000))
                        setReload(false)
                    }}>
                        Add Image
                    </Button>
                    <Button variant="contained" color="primary" onClick={async ()=>{
                        console.log("image to save", image, selectedImageSrc)
                        if(selectedImageSrc.image){
                            console.log("updating existing image")
                            let b = { ...blank }
                            if (!b.images) b.images = []
                            b.images = b.images.filter(img => img.image !== selectedImageSrc.image)
                            let img = { ...image }
                            b.images.push(img)
                            setBlank(b)
                            setImage({ color: color?._id, image: null, boxes: {} })
                            setRectangles([])
                            setSelectedImageSrc(null);
                            update({ blank: b });
                        }else{
                            console.log("saving new image")
                            let url = `blanks/${Date.now()}.jpg`
                            let params = {
                                Bucket: "images1.pythiastechnologies.com",
                                Key: url,
                                Body: Buffer.from(image.image.split(",")[1], "base64"),
                                ACL: "public-read",
                                ContentEncoding: "base64",
                                ContentDisposition: "inline",
                                ContentType: "image/jpeg",
                            };
                            const data = await s3.send(new PutObjectCommand(params));
                            await new Promise(r => setTimeout(r, 1000))
                            image.image = `https://images1.pythiastechnologies.com/${url}`
                            image.color = color?._id
                            console.log("uploaded image", data, image)
                            let b = {...blank}
                            if(!b.images) b.images = []
                            let img = {...image}
                            b.images.push(img)
                            setBlank(b)
                            setImage({color: color?._id, image: null, boxes: {}})
                            setRectangles([])
                            update({blank: b});
                        }
                    }}>
                        Save Image
                    </Button>
                </Box>
                <CopyBoxesModal open={copyBoxesOpen} onClose={() => setCopyBoxesOpen(false)} blank={blank} image={image} setImage={setImage}/>
            </Box>
        </Modal>
    );
}

const CopyBoxesModal = ({ open, onClose, blank, image, setImage}) => {
    const style ={
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '80%',
        bgcolor: 'background.paper',
        boxShadow: 24,
        p: 4,
    }
    return(
        <Modal open={open} onClose={onClose} aria-labelledby="modal-modal-title" aria-describedby="modal-modal-description">
            <Box sx={style}>
                <Typography id="modal-modal-title" variant="h6" component="h2">
                    Copy Boxes from Another Image
                </Typography>
                <Grid2 container spacing={2} sx={{ mt: 2, maxHeight: '70vh', overflowY: 'auto' }}>
                    {blank.images && blank.images.length > 0 ? blank.images.sort((a, b) => a.color.localeCompare(b.color)).map((img, idx) => (
                        <Grid2 size={2} key={idx} sx={{cursor: 'pointer', border: image._id == img._id ? '3px solid blue' : '1px solid #ccc', p: 1}} onClick={()=>{
                            let newImage = {...image}
                            if(!newImage.boxes) newImage.boxes = {}
                            for(let box of Object.keys(img.boxes)){
                                console.log("copying box", box, img.boxes)
                                newImage.boxes[box] = img.boxes[box]
                            }
                            setImage(newImage);
                            onClose();
                        }}>
                        
                            <Image src={`${img.image ? `${img.image.replace('images1.pythieastechnologies.com', 'images2.pythieastechnologies.com/origin')}?width=200&height=200` : ''}`} alt={img.name} width={200} height={200} style={{ width: "200px", height: "auto", maxHeight: "200px" }} />
                            <Stage width={200} height={200} style={{ position: "relative", top: "auto", left: "auto", marginTop: "-200px", pointerEvents: "none" }}>
                                {Object.keys(img.boxes ? img.boxes : {}).map((key, i) => {
                                    const rect = img.boxes[key];
                                    if(!rect) return null;
                                    return (
                                        <Layer key={i}>
                                            <Rect
                                                key={i}
                                                id={i}
                                                x={rect.x / 2}
                                                y={rect.y / 2}
                                                width={rect.width / 2}
                                                height={rect.height / 2}
                                                rotation={rect.rotation}
                                                stroke="#000"
                                                dash={[5, 5]}
                                            />
                                        </Layer>
                                    )
                                })}
                            </Stage>
                        </Grid2>
                    )) : <Typography>No images available</Typography>}
                </Grid2>
            </Box>
        </Modal>
    )
}
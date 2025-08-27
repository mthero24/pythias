import { Stage, Layer, Transformer, Rect } from "react-konva";
import {Box, Modal, Button, Typography, TextField} from "@mui/material";
import React, { useEffect, useRef, useState } from "react";

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

export function ImageEditModal({ open, onClose, imageSrc, onSave, printLocations }) {
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
    const rectRefs = useRef(new Map());
    useEffect(() => {
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
            return;
        }
        const clickedId = e.target.id();
        // Do we pressed shift or ctrl?
        const metaPressed = e.evt.shiftKey || e.evt.ctrlKey || e.evt.metaKey;
        const isSelected = selectedIds.includes(clickedId);

        if (!metaPressed && !isSelected) {
            // If no key pressed and the node is not selected
            // select just one
            setSelectedIds([clickedId]);
        } else if (metaPressed && isSelected) {
            // If we pressed keys and node was selected
            // we need to remove it from selection
            setSelectedIds(selectedIds.filter(id => id !== clickedId));
        } else if (metaPressed && !isSelected) {
            // Add the node into selection
            setSelectedIds([...selectedIds, clickedId]);
        }
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
        // Optional: Update React state to persist position, but do so carefully
        // setPosition({ x: newX, y: newY }); 
    };

    const handleTransformEnd = (e) => {
        // Find which rectangle(s) were transformed
        const id = e.target.id();
        const node = e.target;

        setRectangles(prevRects => {
            const newRects = [...rectangles];

            // Update each transformed node
            const index = newRects.findIndex(r => r.id === id);
            console.log(index, 'transform end index');
            if (index !== -1) {
                const scaleX = node.scaleX();
                const scaleY = node.scaleY();

                // Reset scale
                node.scaleX(1);
                node.scaleY(1);

                // Update the state with new values
                newRects[index] = {
                    ...newRects[index],
                    x: node.x(),
                    y: node.y(),
                    width: node.width() * scaleX,
                    height: node.height() * scaleY,
                    rotation: node.rotation(),
                };
            }
            console.log(newRects[index], 'transform end');
            setRectangles([...newRects]);
            return newRects;
        });
    };
    return (
        <Modal open={open} onClose={onClose} aria-labelledby="modal-modal-title" aria-describedby="modal-modal-description">
            <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 600, bgcolor: 'background.paper', boxShadow: 24, p: 4, outline: 'none' }}>
                <Typography id="modal-modal-title" variant="h6" component="h2">
                    Add Image
                </Typography>
                <Box sx={{display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "flex-start", overflowX: "auto", mt: 2}}>
                    <Box width={120} height={100} padding={1} sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", border: "1px solid #ccc", borderRadius: "4px", marginRight: 1, cursor: "pointer" }} onClick={() => { 
                        let rects = [...rectangles]
                        if (!rects.find(r => r.id === "crop")) rects.push({
                            x: 10, y: 10, width: 350, height: 350, id: "crop", name: 'rect', fill: 'transparent', stroke: '#00f', dash: [10, 10], strokeWidth: 2, draggable: true,
                            rotation: 0, })
                        setRectangles(rects)
                     }}>
                        <Button>Crop</Button>
                    </Box>
                    {printLocations && printLocations.length > 0 && printLocations.map((loc, idx) => (
                        <Box key={idx} width={120} height={100} padding={1} sx={{display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", border: "1px solid #ccc", borderRadius: "4px", marginRight: 1}}>
                            <Button>{loc.name}</Button>
                            <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', mt: 1 }}>
                                <input placeholder="Width" style={{ width: "50px" }} />
                                <input placeholder="Height" style={{ width: "50px" }} />
                            </Box>
                        </Box>
                    ))}
                </Box>
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', overflow: 'hidden' }}>
                    <Stage width={400} height={400} 
                        onMouseDown={handleMouseDown}
                        onMousemove={handleMouseMove}
                        onMouseup={handleMouseUp}
                        onClick={handleStageClick}>
                        {rectangles.map((rect, i) => (
                            <Layer key={i}>
                                <Rect
                                    key={rect.id}
                                    id={rect.id}
                                    name={rect.name}
                                    x={rect.x}
                                    y={rect.y}
                                    width={rect.width}
                                    height={rect.height}
                                    fill="transparent"
                                    stroke="#00f"
                                    dash={[10, 10]}
                                    strokeWidth={2}
                                    draggable
                                    ref={node => {
                                        if (node) {
                                            rectRefs.current.set(rect.id, node);
                                        }
                                    }}
                                    onDragMove={handleDragMove}
                                    onTransformEnd={handleTransformEnd}
                                />
                                <Transformer
                                    ref={transformerRef}
                                    boundBoxFunc={(oldBox, newBox) => {
                                        // Limit resize
                                        if (newBox.width < 5 || newBox.height < 5) {
                                            return oldBox;
                                        }
                                        return newBox;
                                    }}
                                />
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
                    </Stage>
                </Box>
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button variant="contained" color="primary" onClick={onSave}>
                        Save
                    </Button>
                </Box>
            </Box>
        </Modal>
    );
}
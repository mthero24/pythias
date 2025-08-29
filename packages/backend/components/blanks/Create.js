"use client";
import {
    Box,
    Button,
    Checkbox,
    Container,
    Grid2,
    Modal,
    TextField,
    Typography,
    Fab,
    IconButton,
    Card,
    Divider,
} from "@mui/material";
import React, { useEffect, useRef, useState } from "react";
import "cropperjs/dist/cropper.css";
import EyeDropper from "./EyeDropper";

import axios from "axios";
import { Stage, Layer, Transformer, Rect } from "react-konva";
import CreatableSelect from "react-select/creatable";
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import AddIcon from '@mui/icons-material/Add';
import {Footer} from "../reusable/Footer";
import { ImageEditModal } from "./ImageEditModal";
import "jimp";
export function Create({ colors, blanks, bla, printPricing, locations, vendors, departments, categories, brands, suppliers, printTypes }) {
    console.log(locations, "locations")
    const [imageGroups, setImageGroups] = useState([])
    const [blank, setBlank] = useState(bla? {...bla}: {});
    const [bulletPointsOpen, setBulletPointsOpen] = useState(false)
    const [sizesOpen, setSizesOpen] = useState(false)
    const [printLocations, setPrintLocations] = useState(locations)
    const [isImageEditModalOpen, setIsImageEditModalOpen] = useState(false);
    const [selectedImageSrc, setSelectedImageSrc] = useState(null);
    const [imageColor, setImageColor] = useState({id: null, name: null, hexcode: null});
    const handleImageSave = () => {
        // Handle saving the edited image here
    };
    return (
        <Box>
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                <Box sx={{ p: 2, mb: 2, alignContent: "center", backgroundColor: "#fff", borderRadius: 2, boxShadow: 3 }}>
                    <Grid2 container spacing={2} sx={{width: "100%"}}>
                        <Grid2 size={{xs: 6, sm: 3}}>
                            <TextField label="Name" fullWidth value={blank.name ? blank.name : ""} onChange={(e) => setBlank({...blank, name: e.target.value, slug: e.target.value.trim().replace(/ /g, "-").toLowerCase()})}/>
                        </Grid2>
                        <Grid2 size={{xs: 6, sm: 3}}>
                            <TextField label="Code" fullWidth value={blank.code ? blank.code : ""} onChange={(e) => setBlank({ ...blank, code: e.target.value })} />
                        </Grid2>
                        <Grid2 size={{xs: 6, sm: 3}}>
                            <TextField label="Handling Time (days)" fullWidth value={blank.handlingTime ? blank.handlingTime : ""} onChange={(e) => setBlank({ ...blank, handlingTime: e.target.value })} />
                        </Grid2>
                        <Grid2 size={{ xs: 6, sm: 3 }}>
                            <TextField label="Slug" disabled fullWidth value={blank.slug ? blank.slug : ""} onChange={(e) => setBlank({ ...blank, slug: e.target.value })} />
                        </Grid2>
                        <Grid2 size={{ xs: 6, sm: 4 }}>
                            <CreatableSelect placeholder="Vendor..." options={[{ label: "Select Vendor...", value: "" }, ...vendors.map(v=> ({ value: v._id, label: v.name }))]} />
                        </Grid2>
                        <Grid2 size={{ xs: 6, sm: 4 }}>
                            <CreatableSelect placeholder="Department..." options={[{ label: "Select Department...", value: "" }, ...departments.map(d=> ({ value: d._id, label: d.name }))]} />
                        </Grid2>
                        <Grid2 size={{ xs: 6, sm: 4 }}>
                            <CreatableSelect placeholder="Category..." isMulti options={[{ label: "Select Category...", value: "" }, ...categories.map(c=> ({ value: c._id, label: c.name }))]} />
                        </Grid2>
                        <Grid2 size={{ xs: 6, sm: 4 }}>
                            <CreatableSelect placeholder="Brand..." options={[{ label: "Select Brand...", value: "" }, ...brands.map(b=> ({ value: b._id, label: b.name }))]} />
                        </Grid2>
                        <Grid2 size={{ xs: 6, sm: 4 }}>
                            <CreatableSelect placeholder="Supplier..." isMulti options={[{ label: "Select Supplier...", value: "" }, ...suppliers.map(s=> ({ value: s._id, label: s.name }))]} />
                        </Grid2>
                        <Grid2 size={{ xs: 6, sm: 4 }}>
                            <CreatableSelect placeholder="Print Types..." isMulti options={[{ label: "Select Print Type...", value: "" }, ...printTypes.map(pt=> ({ value: pt._id, label: pt.name }))]} />
                        </Grid2>
                        <Grid2 size={12}>
                            <TextField placeholder="Description" multiline rows={4} fullWidth value={blank.description ? blank.description : ""} onChange={(e) => setBlank({ ...blank, description: e.target.value })} />
                            <Button>Generate Description</Button>
                        </Grid2>
                        <Grid2 size={12}>
                            <Box sx={{ border: "1px solid #ccc", padding: "1%", borderRadius: 2 }}>
                                <Box sx={{display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between", }}>
                                    <Box>
                                        <Typography variant="h6">Bullet Points</Typography>
                                        <Button onClick={() => setBulletPointsOpen(!bulletPointsOpen)}>Add Bullet Point</Button>
                                    </Box>
                                    <Box>
                                        {bulletPointsOpen ? <KeyboardArrowUpIcon sx={{ cursor: "pointer" }} onClick={() => setBulletPointsOpen(false)} /> : <KeyboardArrowDownIcon sx={{ cursor: "pointer" }} onClick={() => setBulletPointsOpen(true)} />}
                                    </Box>
                                </Box>
                                <Box>
                                    {bulletPointsOpen && blank.bulletPoints && blank.bulletPoints.length > 0 && blank.bulletPoints.map((b, i) => (
                                        <Box key={i} gap={2} sx={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "1%", border: "1px solid #ccc", padding: "2%", borderRadius: 2 }}>
                                            <TextField label="Title" fullWidth value={b.title} onChange={(e) => { }} />
                                            <TextField label="Description" multiline fullWidth value={b.description} onChange={(e) => { }} />
                                        </Box>
                                    ))}
                                </Box>
                            </Box>
                        </Grid2>
                        <Grid2 size={12}>
                            <Box sx={{ border: "1px solid #ccc", padding: "1%", borderRadius: 2 }}>
                                <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between", }}>
                                    <Box>
                                        <Typography variant="h6">Sizes</Typography>
                                        <Button onClick={() => setSizesOpen(!sizesOpen)}>Add Size</Button>
                                    </Box>
                                    <Box>
                                        {sizesOpen ? <KeyboardArrowUpIcon sx={{ cursor: "pointer" }} onClick={() => setSizesOpen(false)} /> : <KeyboardArrowDownIcon sx={{ cursor: "pointer" }} onClick={() => setSizesOpen(true)} />}
                                    </Box>
                                </Box>
                                <Box>
                                    <Grid2 container spacing={2} sx={{marginTop: "1%"}}>
                                        {sizesOpen && blank.sizes && blank.sizes.length > 0 && blank.sizes.map((s, i) => (
                                            <Grid2 item xs={12} sm={6} md={4} key={i}>
                                                <Box gap={2} sx={{ border: "1px solid #ccc", padding: "2%", borderRadius: 2, display: "flex", flexDirection: "column", alignItems: "center" }}>
                                                    <TextField label="Size" fullWidth value={s.name} onChange={(e) => { }} />
                                                    <TextField label="Retail Price" fullWidth value={s.retailPrice} onChange={(e) => { }} />
                                                    <TextField label="Weight (lbs)" fullWidth value={s.weight} onChange={(e) => { }} />
                                                    <Button variant="outlined" fullWidth color="error" onClick={() => { }}>Remove Size</Button>
                                                </Box>
                                            </Grid2>
                                        ))}
                                    </Grid2>
                                </Box>
                            </Box>
                        </Grid2>
                        <Grid2 size={12}>
                            <CreatableSelect placeholder="Colors" options={[...colors.map(c => ({ value: c, label: <Box>
                                        <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
                                            <Box sx={{ width: 20, height: 20, backgroundColor: c.hexcode, border: "1px solid #000", marginRight: 1 }}></Box>
                                            <Typography>{c.name}</Typography>
                                        </Box>
                                    </Box> }))]} 

                                    isMulti
                                    value={blank.colors ? blank.colors.map(ac => ({ value: ac, label: <Box>
                                        <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
                                            <Box sx={{ width: 20, height: 20, backgroundColor: ac.hexcode, border: "1px solid #000", marginRight: 1 }}></Box>
                                            <Typography>{ac.name}</Typography>
                                        </Box>
                                    </Box> })) : []}
                                    onChange={(newValue) => {
                                       setBlank({ ...blank, colors: newValue ? newValue.map(nv => nv.value) : [] });
                                    }}
                                />
                        </Grid2>
                        <Grid2 size={12}>
                            <CreatableSelect placeholder="Print Locations" isMulti options={[...printLocations.map(pl => ({ value: pl, label: pl.name }))]} value={blank.printLocations ? blank.printLocations.map(pl => ({ value: pl._id, label: pl.name })) : []} onChange={(newValue) => { setBlank({ ...blank, printLocations: newValue ? newValue.map(nv => nv.value) : [] }); }} />
                        </Grid2>
                        <Grid2 size={12}>
                            <Typography variant="h6">Images</Typography>
                            {blank.colors && blank.colors.length > 0 && blank.colors.map((color, idx) => {
                                let images = blank.images.filter(img=> img.color.toString() === color._id.toString())
                                return (
                                    <Box key={idx}>
                                        <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", marginTop: "2%" }}>
                                            <Box sx={{ width: 20, height: 20, backgroundColor: color.hexcode, border: "1px solid #000", marginRight: 1 }}></Box>
                                            <Typography variant="subtitle1">{color.name}</Typography>
                                            <EyeDropper
                                                onColorChange={(hex) =>
                                                    console.log(hex)
                                                }
                                            />
                                        </Box>
                                        <Grid2 container spacing={1}>
                                            <Grid2 size={2}>
                                                <Box sx={{ width: 100, height: 100, border: "1px dashed #1989df", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }} onClick={() => { setImageColor(color); setIsImageEditModalOpen(true); }}>
                                                    <Typography variant="caption"><AddIcon sx={{ color: "#1989df"}} /></Typography>
                                                </Box>
                                            </Grid2>
                                            {images.map((img, imgIdx) => (
                                                <Grid2 size={1} key={imgIdx}>
                                                    <img src={`${img.image ? img.image : ''}`} alt={img.name} style={{ width: "100%", height: "auto", maxHeight: "100px" }} />
                                                </Grid2>
                                            ))}
                                        </Grid2>
                                    </Box>
                                )
                            })}
                        </Grid2>
                    </Grid2>
                </Box>
            </Container>
            <ImageEditModal open={isImageEditModalOpen} color={imageColor} blank={blank} setBlank={setBlank} onClose={() => setIsImageEditModalOpen(false)} imageSrc={selectedImageSrc} onSave={handleImageSave} printLocations={blank.printLocations} />
            <Footer />
        </Box>
    )
}
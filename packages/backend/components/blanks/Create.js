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
    CardMedia,
    Divider,
} from "@mui/material";
import React, { useEffect, useRef, useState } from "react";
import "cropperjs/dist/cropper.css";
import EyeDropper from "./EyeDropper";
import DeleteIcon from '@mui/icons-material/Delete';
import axios from "axios";
import { Stage, Layer, Rect } from "react-konva";
import CreatableSelect from "react-select/creatable";
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import AddIcon from '@mui/icons-material/Add';
import {Footer} from "../reusable/Footer";
import { ImageEditModal } from "./ImageEditModal";
import Image from "next/image";
import { UploadSizeGuide } from "./uploadSizeGuide";
import { UploadVideo } from "./uploadVideo";
import { DeleteImageModal } from "./deleteImageModal";
import { DeleteBlankModal } from "./deleteBlankModal";
export function Create({ colors, blanks, bla, printPricing, locations, vendors, departments, categories, brands, suppliers, printTypes }) {
    //console.log(locations, "locations")
    const [imageGroups, setImageGroups] = useState([])
    const [blank, setBlank] = useState(bla? {...bla}: {});
    const [bulletPointsOpen, setBulletPointsOpen] = useState(false)
    const [sizesOpen, setSizesOpen] = useState(false)
    const [sizesGuideOpen, setSizesGuideOpen] = useState(false)
    const [printLocations, setPrintLocations] = useState(locations)
    const [isImageEditModalOpen, setIsImageEditModalOpen] = useState(false);
    const [selectedImageSrc, setSelectedImageSrc] = useState(null);
    const [imageColor, setImageColor] = useState({id: null, name: null, hexcode: null});
    const [bulletModalOpen, setBulletModalOpen] = useState(false);
    const [sizesModalOpen, setSizesModalOpen] = useState(false);
    const [sizeGuideModalOpen, setSizeGuideModalOpen] = useState(false);
    const [videoOpen, setVideoOpen] = useState(false);
    const [videoModalOpen, setVideoModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [imageToDelete, setImageToDelete] = useState(null);
    const [deleteBlankModalOpen, setDeleteBlankModalOpen] = useState(false);
    const handleImageSave = () => {
        // Handle saving the edited image here
    };
    const generateDescription = async () => {
        // console.log("generateDescription()");
        // console.log(name, description);
        let result = await axios.post("/api/ai/", {
            prompt: `generate me a description for a ${blank.name} using this data: ${blank.description}. limit to under 300 characters.`,
        });
        // console.log(result);
        let bla = {...blank};
        bla.description = result.data;
        setBlank(bla);
        update({blank: bla})
    };
    const update = async ({blank})=>{
        console.log("update", blank)
        let res = await axios.post("/api/admin/blanks", { blank });
        if(res.data.error){
            alert("Error saving blank")
        }
    }
    return (
        <Box>
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "flex-end", alignItems: "center", marginBottom: "2%" }}>
                    <Button variant="outlined" color="warning" onClick={()=> setDeleteBlankModalOpen(true)}>Delete</Button>
                </Box>
                <Box sx={{ p: 2, mb: 2, alignContent: "center", backgroundColor: "#fff", borderRadius: 2, boxShadow: 3 }}>
                    <Grid2 container spacing={2} sx={{width: "100%"}}>
                        <Grid2 size={{xs: 6, sm: 3}}>
                            <TextField label="Name" fullWidth value={blank.name ? blank.name : ""} onChange={(e) => {
                                let bla = {...blank};
                                bla.name = e.target.value;
                                bla.slug = e.target.value.trim().replace(/ /g, "-").toLowerCase();
                                console.log(bla, "blank name")
                                setBlank(bla);
                                update({blank: bla});
                            }}/>
                        </Grid2>
                        <Grid2 size={{xs: 6, sm: 3}}>
                            <TextField label="Code" fullWidth value={blank.code ? blank.code : ""} onChange={(e) => {
                                let bla = {...blank};
                                bla.code = e.target.value;
                                setBlank(bla);
                                update({blank: bla});
                            }} />
                        </Grid2>
                        <Grid2 size={{xs: 6, sm: 3}}>
                            <TextField label="Handling Time (days)" fullWidth value={blank.handlingTime ? `${blank.handlingTime.min}-${blank.handlingTime.max} days` : ""} onChange={(e) => {
                                let bla = {...blank};
                                bla.handlingTime = e.target.value;
                                setBlank(bla);                           
                                update({blank: bla});
                            }} />
                        </Grid2>
                        <Grid2 size={{ xs: 6, sm: 3 }}>
                            <TextField label="Slug" disabled fullWidth value={blank.slug ? blank.slug : ""} onChange={(e) => {
                                let bla = {...blank};
                                bla.slug = e.target.value;
                                setBlank(bla);
                                update({blank: bla});
                            }} />
                        </Grid2>
                        <Grid2 size={{ xs: 6, sm: 4 }}>
                            <CreatableSelect placeholder="Vendor..." options={[{ label: "Select Vendor...", value: "" }, ...vendors.map(v=> ({ value: v.name, label: v.name }))]} value={blank.vendor ? { value: blank.vendor, label: blank.vendor } : null} onChange={(selected) => {
                                let bla = {...blank};
                                bla.vendor = selected.value;
                                setBlank(bla);
                                update({blank: bla});
                            }} />
                        </Grid2>
                        <Grid2 size={{ xs: 6, sm: 4 }}>
                            <CreatableSelect placeholder="Department..." options={[{ label: "Select Department...", value: "" }, ...departments.map(d=> ({ value: d.name, label: d.name }))]} value={blank.department ? { value: blank.department, label: blank.department } : null} onChange={(selected) => {
                                let bla = {...blank};
                                bla.department = selected.value;
                                setBlank(bla);
                                update({blank: bla});
                            }} />
                        </Grid2>
                        <Grid2 size={{ xs: 6, sm: 4 }}>
                            <CreatableSelect placeholder="Category..." isMulti options={[{ label: "Select Category...", value: "" }, ...categories.map(c=> ({ value: c.name, label: c.name }))]} value={blank.category ? blank.category.map(c => ({ value: c, label: c })) : null} onChange={(selected) => {
                                let bla = {...blank};
                                bla.category = selected.map(s => s.value);
                                setBlank(bla);
                                update({blank: bla});
                            }} />
                        </Grid2>
                        <Grid2 size={{ xs: 6, sm: 4 }}>
                            <CreatableSelect placeholder="Brand..." options={[{ label: "Select Brand...", value: "" }, ...brands.map(b=> ({ value: b.name, label: b.name }))]} value={blank.brand ? { value: blank.brand, label: blank.brand } : null} onChange={(selected) => {
                                let bla = {...blank};
                                bla.brand = selected.value;
                                setBlank(bla);
                                update({blank: bla});
                            }} />
                        </Grid2>
                        <Grid2 size={{ xs: 6, sm: 4 }}>
                            <CreatableSelect placeholder="Supplier..." isMulti options={[{ label: "Select Supplier...", value: "" }, ...suppliers.map(s=> ({ value: s.name, label: s.name }))]} value={blank.supplier ? blank.supplier.map(s => ({ value: s, label: s })) : null} onChange={(selected) => {
                                let bla = {...blank};
                                bla.supplier = selected.map(s => s.value);
                                setBlank(bla);
                                update({blank: bla});
                            }} />
                        </Grid2>
                        <Grid2 size={{ xs: 6, sm: 4 }}>
                            <CreatableSelect placeholder="Print Types..." isMulti options={[{ label: "Select Print Type...", value: "" }, ...printTypes.map(pt=> ({ value: pt._id, label: pt.name }))]} value={blank.printType ? blank.printType.map(p=> {return printTypes.filter(pt=> pt._id == p)[0]}).map(pt => ({ value: pt?._id, label: pt?.name })) : null} onChange={(selected) => {
                                let bla = {...blank};
                                bla.printType = selected.map(s => s.value);
                                setBlank(bla);
                                update({blank: bla});
                            }} />
                        </Grid2>
                        <Grid2 size={12}>
                            <TextField placeholder="Description" multiline rows={4} fullWidth value={blank.description ? blank.description : ""} onChange={(e) => setBlank({ ...blank, description: e.target.value })} />
                            <Button onClick={generateDescription}>Generate Description</Button>
                        </Grid2>
                        <Grid2 size={12}>
                            <Box sx={{ border: "1px solid #ccc", padding: "1%", borderRadius: 2 }}>
                                <Box sx={{display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between", }}>
                                    <Box>
                                        <Typography variant="h6">Bullet Points</Typography>
                                        <Button onClick={() => setBulletModalOpen(true)}>Add Bullet Point</Button>
                                    </Box>
                                    <Box>
                                        {bulletPointsOpen ? <KeyboardArrowUpIcon sx={{ cursor: "pointer" }} onClick={() => setBulletPointsOpen(false)} /> : <KeyboardArrowDownIcon sx={{ cursor: "pointer" }} onClick={() => setBulletPointsOpen(true)} />}
                                    </Box>
                                </Box>
                                <Box>
                                    {bulletPointsOpen && blank.bulletPoints && blank.bulletPoints.length > 0 && blank.bulletPoints.map((b, i) => (
                                        <Box sx={{ border: "1px solid #ccc", padding: "1%", borderRadius: 2, marginTop: "1%" }} key={i}>
                                            <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "flex-end", alignItems: "flex-end", gap: 2 }}>
                                                <DeleteIcon sx={{ cursor: "pointer", color: "#8a261fff" }} onClick={() => {
                                                    let bla = {...blank};
                                                    bla.bulletPoints = bla.bulletPoints.filter((bp, index) => index !== i);
                                                    setBlank(bla);
                                                    update({blank: bla});
                                                }} />
                                            </Box>
                                            <Box gap={2} sx={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "1%", }}>
                                                <TextField label="Title" fullWidth value={b.title} onChange={(e) => { }} />
                                                <TextField label="Description" multiline fullWidth value={b.description} onChange={(e) => { }} />
                                            </Box>
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
                                        <Button onClick={() => setSizesModalOpen(true)}>Add Size</Button>
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
                                                    <Button variant="outlined" fullWidth color="error" onClick={() => { 
                                                        let bla = {...blank};
                                                        bla.sizes = bla.sizes.filter((sz, index) => index !== i);
                                                        setBlank(bla);
                                                        update({blank: bla});
                                                    }}>Remove Size</Button>
                                                </Box>
                                            </Grid2>
                                        ))}
                                    </Grid2>
                                </Box>
                            </Box>
                        </Grid2>
                        <Grid2 size={12}>
                            <Box sx={{ border: "1px solid #ccc", padding: "1%", borderRadius: 2 }}>
                                <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between", }}>
                                    <Box>
                                        <Typography variant="h6">Size Guide</Typography>
                                        <Button onClick={() => { console.log(true); setSizeGuideModalOpen(true); }}>Add Size Guide</Button>
                                    </Box>
                                    <Box>
                                        {sizesGuideOpen ? <KeyboardArrowUpIcon sx={{ cursor: "pointer" }} onClick={() => setSizesGuideOpen(false)} /> : <KeyboardArrowDownIcon sx={{ cursor: "pointer" }} onClick={() => setSizesGuideOpen(true)} />}
                                    </Box>
                                </Box>
                                <Box>
                                    <Grid2 container spacing={2} sx={{ marginTop: "1%" }}>
                                        {sizesGuideOpen && blank.sizeGuide && blank.sizeGuide.images && blank.sizeGuide.images.length > 0 && blank.sizeGuide.images.map((img, i) => (
                                            <Grid2 item xs={12} sm={6} md={4} key={i}>
                                                <Box gap={2} sx={{ border: "1px solid #ccc", padding: "2%", borderRadius: 2, display: "flex", flexDirection: "column", alignItems: "center" }}>
                                                    <Image src={`${img ? `${img}` : ''}`} alt={"size Guide"} width={200} height={200} style={{ width: "200px", height: "auto", maxHeight: "200px" }} />
                                                    <Button variant="outlined" fullWidth color="error" onClick={() => {
                                                        let bla = { ...blank };
                                                        bla.sizeGuide.images = bla.sizeGuide.images.filter((img, index) => index !== i);
                                                        setBlank(bla);
                                                        update({ blank: bla });
                                                    }}>Remove Size Guide</Button>
                                                </Box>
                                            </Grid2>
                                        ))}
                                    </Grid2>
                                </Box>
                            </Box>
                        </Grid2>
                        <Grid2 size={12}>
                            <Box sx={{ border: "1px solid #ccc", padding: "1%", borderRadius: 2 }}>
                                <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between", }}>
                                    <Box>
                                        <Typography variant="h6">Videos</Typography>
                                        <Button onClick={() => { console.log(true); setVideoModalOpen(true); }}>Add Video</Button>
                                    </Box>
                                    <Box>
                                        {videoOpen ? <KeyboardArrowUpIcon sx={{ cursor: "pointer" }} onClick={() => setVideoOpen(false)} /> : <KeyboardArrowDownIcon sx={{ cursor: "pointer" }} onClick={() => setVideoOpen(true)} />}
                                    </Box>
                                </Box>
                                <Box>
                                    <Grid2 container spacing={2} sx={{ marginTop: "1%" }}>
                                        {videoOpen && blank.videos && blank.videos.length > 0 && blank.videos.map((video, i) => (
                                            <Grid2 item size={{ xs: 12, sm: 6, md: 4 }} key={i}>
                                                <Card>
                                                    <CardMedia
                                                        component="video"
                                                        width={"100%"}
                                                        height={"auto"}
                                                        src={video}
                                                        controls
                                                        />
                                                    </Card>
                                                    <Button variant="outlined" fullWidth color="error" onClick={() => {
                                                        let bla = { ...blank };
                                                        bla.videos = bla.videos.filter((vid, index) => index !== i);
                                                        setBlank(bla);
                                                        update({ blank: bla });
                                                    }}>Remove Video</Button>
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
                                        let bla = {...blank};
                                        bla.colors = newValue ? newValue.map(nv => nv.value) : [];
                                       setBlank(bla);
                                       update({blank: bla});
                                    }}
                                />
                        </Grid2>
                        <Grid2 size={12}>
                            <CreatableSelect placeholder="Print Locations" isMulti options={[...printLocations.map(pl => ({ value: pl, label: pl.name }))]} value={blank.printLocations ? blank.printLocations.map(pl => ({ value: pl, label: pl.name })) : []} onChange={(newValue) => { 
                                let bla = {...blank}; 
                                bla.printLocations = newValue ? newValue.map(nv => nv.value) : [];
                                setBlank(bla);
                                update({blank: bla});
                            }} />
                        </Grid2>
                        <Grid2 size={12}>
                            <Typography variant="h6">Images</Typography>
                            {blank.colors && blank.colors.length > 0 && blank.colors.map((color, idx) => {
                                let images = blank.images?.filter(img=> img.color?.toString() === color._id.toString())
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
                                                <Box sx={{ width: "100%", height: "200px", border: "1px dashed #1989df", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }} onClick={() => { setImageColor(color); setIsImageEditModalOpen(true); }}>
                                                    <Typography variant="caption"><AddIcon sx={{ color: "#1989df"}} /></Typography>
                                                </Box>
                                            </Grid2>
                                            {images.map((img, imgIdx) => (
                                                <Grid2 size={2.2} key={imgIdx} sx={{cursor: "pointer"}}>
                                                    <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "flex-end", position: "relative", top: 35, right: 2, zIndex: 1, marginTop: "-35px" }} onClick={() => {
                                                       setImageToDelete(img.image);
                                                       setDeleteModalOpen(true);
                                                    }}>
                                                        <IconButton size="small" color="error">
                                                            <DeleteIcon />
                                                        </IconButton>
                                                    </Box>
                                                    <Box onClick={() => { setSelectedImageSrc({ ...img }); setImageColor(color); setIsImageEditModalOpen(true); }}>
                                                        <Image src={`${img.image ? `${img.image.replace('images1.pythiastechnologies.com', 'images2.pythiastechnologies.com/origin')}?width=200&height=200` : ''}`} alt={img.name} width={200} height={200} style={{ width: "200px", height: "auto", maxHeight: "200px" }} />
                                                        <Stage width={200} height={200} style={{ position: "absolute", top: "auto", left: "auto", marginTop: "-200px", pointerEvents: "none" }}>
                                                            {Object.keys(img.boxes ? img.boxes : {}).map((key, i) => {
                                                                const rect = img.boxes[key];
                                                                if (!rect) return null;
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
                                                    </Box>
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
            <ImageEditModal open={isImageEditModalOpen} color={imageColor} blank={blank} setBlank={setBlank} onClose={() => setIsImageEditModalOpen(false)} imageSrc={selectedImageSrc} onSave={handleImageSave} printLocations={blank.printLocations} update={update} selectedImageSrc={{...selectedImageSrc}} setSelectedImageSrc={setSelectedImageSrc} />
            <BulletModal open={bulletModalOpen} onClose={() => setBulletModalOpen(false)} blank={blank} setBlank={setBlank} update={update} />
            <SizesModal open={sizesModalOpen} onClose={() => setSizesModalOpen(false)} blank={blank} setBlank={setBlank} update={update} />
            <UploadSizeGuide open={sizeGuideModalOpen} setOpen={setSizeGuideModalOpen} blank={blank} setBlank={setBlank} update={update} />
            <UploadVideo open={videoModalOpen} setOpen={setVideoModalOpen} blank={blank} setBlank={setBlank} update={update} />
            <DeleteImageModal open={deleteModalOpen} setOpen={setDeleteModalOpen} imageToDelete={imageToDelete} setImageToDelete={setImageToDelete} blank={blank} setBlank={setBlank} update={update} />
            <DeleteBlankModal open={deleteBlankModalOpen} setOpen={setDeleteBlankModalOpen} blank={blank} />
            <Footer />
        </Box>
    )
}

const BulletModal = ({ open, onClose, blank, setBlank, update }) => {
    const [bullet, setBullet] = useState({title: "", description: ""})
    return (<Modal open={open} onClose={onClose} aria-labelledby="modal-modal-title" aria-describedby="modal-modal-description">
        <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 400, bgcolor: 'background.paper', border: '2px solid #000', boxShadow: 24, p: 4 }}>
            <Typography id="modal-modal-title" variant="h6" component="h2">
                Add Bullet Point
            </Typography>
            <Box gap={2} sx={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "1%", padding: "2%"}}>
                <TextField label="Title" fullWidth value={bullet.title} onChange={(e) => setBullet({...bullet, title: e.target.value})} />
                <TextField label="Description" multiline fullWidth value={bullet.description} onChange={(e) => setBullet({...bullet, description: e.target.value})} />
            </Box>
            <Button variant="contained" onClick={() => {
                let bla = {...blank};
                if(!bla.bulletPoints) bla.bulletPoints = [];
                bla.bulletPoints.push(bullet);
                setBlank(bla);
                setBullet({title: "", description: ""});
                update({blank: bla})
                onClose();
            }}>Save</Button>
        </Box>
    </Modal>)
}

const SizesModal = ({ open, onClose, blank, setBlank, update }) => {
    const [size, setSize] = useState({name: "", retailPrice: "", weight: ""})
    return (<Modal open={open} onClose={onClose} aria-labelledby="modal-modal-title" aria-describedby="modal-modal-description">
        <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 400, bgcolor: 'background.paper', border: '2px solid #000', boxShadow: 24, p: 4 }}>
            <Typography id="modal-modal-title" variant="h6" component="h2">
                Add Size
            </Typography>
            <Box gap={2} sx={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "1%", padding: "2%", }}>
                <TextField label="name" fullWidth value={size.name} onChange={(e) => setSize({...size, name: e.target.value})} />
                <TextField label="Retail Price" fullWidth value={size.retailPrice} onChange={(e) => setSize({...size, retailPrice: e.target.value})} />
                <TextField label="Weight" fullWidth value={size.weight} onChange={(e) => setSize({...size, weight: e.target.value})} />
            </Box>
            <Button variant="contained" onClick={() => {
                let bla = {...blank};
                if(!bla.sizes) bla.sizes = [];
                bla.sizes.push(size);
                setSize({name: "", retailPrice: "", weight: ""});
                setBlank(bla);
                update({blank: bla});
                onClose();
            }}>Save</Button>
        </Box>
    </Modal>)
}
"use client";
import {
    Box,
    Button,
    Checkbox,
    Chip,
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
    FormControlLabel,
    Switch,
} from "@mui/material";
import React, { useEffect, useRef, useState } from "react";
import "cropperjs/dist/cropper.css";
import EyeDropper from "./EyeDropper";
import DeleteIcon from '@mui/icons-material/Delete';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import StraightenIcon from '@mui/icons-material/Straighten';
import PhotoSizeSelectLargeIcon from '@mui/icons-material/PhotoSizeSelectLarge';
import VideocamOutlinedIcon from '@mui/icons-material/VideocamOutlined';
import PaletteOutlinedIcon from '@mui/icons-material/PaletteOutlined';
import PhotoLibraryOutlinedIcon from '@mui/icons-material/PhotoLibraryOutlined';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
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

const SectionCard = ({ title, icon, children, action, collapsible, open, onToggle, count }) => (
    <Box sx={{ backgroundColor: "#fff", borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", mb: 2, overflow: "hidden" }}>
        <Box
            sx={{ px: 3, py: 2, display: "flex", alignItems: "center", gap: 1, borderBottom: "1px solid #f0f0f0", cursor: collapsible ? "pointer" : "default" }}
            onClick={collapsible ? onToggle : undefined}
        >
            <Box sx={{ color: "text.secondary", display: "flex", alignItems: "center" }}>{icon}</Box>
            <Typography variant="subtitle1" fontWeight={600}>{title}</Typography>
            {count !== undefined && <Chip label={count} size="small" variant="outlined" sx={{ fontSize: "0.7rem", height: 20 }} />}
            <Box sx={{ flexGrow: 1 }} />
            {action}
            {collapsible && (open ? <KeyboardArrowUpIcon sx={{ color: "text.secondary" }} /> : <KeyboardArrowDownIcon sx={{ color: "text.secondary" }} />)}
        </Box>
        {(!collapsible || open) && children}
    </Box>
);

export function Create({ colors, blanks, bla, printPricing, locations, vendors, departments, categories, brands, suppliers, printTypes }) {
    const [imageGroups, setImageGroups] = useState([])
    const [allColors, setAllColors] = useState(colors)
    const [blank, setBlank] = useState(bla? {...bla}: {});
    const originalBlank = useRef(bla ? { ...bla } : {});
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
    const [menuPortalTarget, setMenuPortalTarget] = useState(null);

    useEffect(() => { setMenuPortalTarget(document.body); }, []);

    const handleImageSave = () => {};

    const generateDescription = async () => {
        let result = await axios.post("/api/ai/", {
            prompt: `generate me a description for a ${blank.name} using this data: ${blank.description}. limit to under 300 characters.`,
        });
        let bla = {...blank};
        bla.description = result.data;
        setBlank(bla);
        update({blank: bla})
    };

    const debounceRef = useRef(null);

    const update = async ({blank, action})=>{
        let res = await axios.post("/api/admin/blanks", { blank, before: blank._id ? originalBlank.current : null, action });
        if(res.data.error){
            alert("Error saving blank")
        } else {
            originalBlank.current = { ...blank };
        }
    }

    const debouncedUpdate = (args) => {
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => update(args), 600);
    };

    return (
        <Box sx={{ backgroundColor: "#f5f7fa", minHeight: "100vh" }}>
            <Container maxWidth="lg" sx={{ pt: 3, pb: 6 }}>

                {/* ── Header ── */}
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3, p: 2.5, backgroundColor: "#fff", borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <Typography variant="h5" fontWeight={700}>{blank.name || "New Blank"}</Typography>
                        <Chip
                            label={blank.active ? "Active" : "Inactive"}
                            color={blank.active ? "success" : "default"}
                            size="small"
                        />
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Typography variant="body2" color="text.secondary">Active</Typography>
                        <Switch checked={!!blank.active} onChange={(e) => {
                            let bla = {...blank};
                            bla.active = e.target.checked;
                            setBlank(bla);
                            update({blank: bla});
                        }} />
                        <Button variant="outlined" color="error" size="small" startIcon={<DeleteIcon />} onClick={() => setDeleteBlankModalOpen(true)}>
                            Delete
                        </Button>
                    </Box>
                </Box>

                {/* ── Basic Information ── */}
                <SectionCard title="Basic Information" icon={<InfoOutlinedIcon sx={{ fontSize: 20 }} />}>
                    <Box sx={{ p: 3 }}>
                        <Grid2 container spacing={2}>
                            <Grid2 size={{ xs: 12, sm: 6, md: 3 }}>
                                <TextField label="Name" fullWidth value={blank.name ?? ""} onChange={(e) => {
                                    let bla = {...blank};
                                    bla.name = e.target.value;
                                    bla.slug = e.target.value.trim().replace(/ /g, "-").toLowerCase();
                                    setBlank(bla);
                                    debouncedUpdate({blank: bla});
                                }}/>
                            </Grid2>
                            <Grid2 size={{ xs: 12, sm: 6, md: 3 }}>
                                <TextField label="Code" fullWidth value={blank.code ?? ""} onChange={(e) => {
                                    let bla = {...blank};
                                    bla.code = e.target.value;
                                    setBlank(bla);
                                    debouncedUpdate({blank: bla});
                                }} />
                            </Grid2>
                            <Grid2 size={{ xs: 12, sm: 6, md: 3 }}>
                                <TextField label="Handling Time (days)" fullWidth value={blank.handlingTime ? `${blank.handlingTime.min}-${blank.handlingTime.max} days` : ""} onChange={(e) => {
                                    let bla = {...blank};
                                    bla.handlingTime = e.target.value;
                                    setBlank(bla);
                                    debouncedUpdate({blank: bla});
                                }} />
                            </Grid2>
                            <Grid2 size={{ xs: 12, sm: 6, md: 3 }}>
                                <TextField label="Slug" disabled fullWidth value={blank.slug ?? ""} />
                            </Grid2>

                            <Grid2 size={{ xs: 12, sm: 6, md: 4 }}>
                                <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: "block" }}>Vendor</Typography>
                                <CreatableSelect menuPortalTarget={menuPortalTarget} menuPosition="fixed" placeholder="Select vendor..." options={vendors.map(v => ({ value: v.name, label: v.name }))} value={blank.vendor ? { value: blank.vendor, label: blank.vendor } : null} onChange={(selected) => {
                                    let bla = {...blank};
                                    bla.vendor = selected.value;
                                    setBlank(bla);
                                    update({blank: bla});
                                }} />
                            </Grid2>
                            <Grid2 size={{ xs: 12, sm: 6, md: 4 }}>
                                <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: "block" }}>Department</Typography>
                                <CreatableSelect menuPortalTarget={menuPortalTarget} menuPosition="fixed" placeholder="Select department..." options={departments.map(d => ({ value: d.name, label: d.name }))} value={blank.department ? { value: blank.department, label: blank.department } : null} onChange={(selected) => {
                                    let bla = {...blank};
                                    bla.department = selected.value;
                                    setBlank(bla);
                                    update({blank: bla});
                                }} />
                            </Grid2>
                            <Grid2 size={{ xs: 12, sm: 6, md: 4 }}>
                                <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: "block" }}>Category</Typography>
                                <CreatableSelect menuPortalTarget={menuPortalTarget} menuPosition="fixed" placeholder="Select categories..." isMulti options={categories.map(c => ({ value: c.name, label: c.name }))} value={blank.category ? blank.category.map(c => ({ value: c, label: c })) : null} onChange={(selected) => {
                                    let bla = {...blank};
                                    bla.category = selected.map(s => s.value);
                                    setBlank(bla);
                                    update({blank: bla});
                                }} />
                            </Grid2>
                            <Grid2 size={{ xs: 12, sm: 6, md: 4 }}>
                                <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: "block" }}>Brand</Typography>
                                <CreatableSelect menuPortalTarget={menuPortalTarget} menuPosition="fixed" placeholder="Select brand..." options={brands.map(b => ({ value: b.name, label: b.name }))} value={blank.brand ? { value: blank.brand, label: blank.brand } : null} onChange={(selected) => {
                                    let bla = {...blank};
                                    bla.brand = selected.value;
                                    setBlank(bla);
                                    update({blank: bla});
                                }} />
                            </Grid2>
                            <Grid2 size={{ xs: 12, sm: 6, md: 4 }}>
                                <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: "block" }}>Supplier</Typography>
                                <CreatableSelect menuPortalTarget={menuPortalTarget} menuPosition="fixed" placeholder="Select suppliers..." isMulti options={suppliers.map(s => ({ value: s.name, label: s.name }))} value={blank.supplier ? blank.supplier.map(s => ({ value: s, label: s })) : null} onChange={(selected) => {
                                    let bla = {...blank};
                                    bla.supplier = selected.map(s => s.value);
                                    setBlank(bla);
                                    update({blank: bla});
                                }} />
                            </Grid2>
                            <Grid2 size={{ xs: 12, sm: 6, md: 4 }}>
                                <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: "block" }}>Print Types</Typography>
                                <CreatableSelect menuPortalTarget={menuPortalTarget} menuPosition="fixed" placeholder="Select print types..." isMulti options={printTypes.map(pt => ({ value: pt._id, label: pt.name }))} value={blank.printType ? blank.printType.map(p => printTypes.find(pt => pt._id == p)).filter(Boolean).map(pt => ({ value: pt._id, label: pt.name })) : null} onChange={(selected) => {
                                    let bla = {...blank};
                                    bla.printType = selected.map(s => s.value);
                                    setBlank(bla);
                                    update({blank: bla});
                                }} />
                            </Grid2>

                            <Grid2 size={12}>
                                <TextField placeholder="Description" multiline rows={3} fullWidth value={blank.description ?? ""} onChange={(e) => {
                                    let bla = {...blank};
                                    bla.description = e.target.value;
                                    setBlank(bla);
                                    debouncedUpdate({blank: bla});
                                }} />
                                <Button size="small" sx={{ mt: 0.5 }} onClick={generateDescription}>Generate with AI</Button>
                            </Grid2>
                        </Grid2>
                    </Box>
                </SectionCard>

                {/* ── Bullet Points ── */}
                <SectionCard
                    title="Bullet Points"
                    icon={<FormatListBulletedIcon sx={{ fontSize: 20 }} />}
                    collapsible open={bulletPointsOpen} onToggle={() => setBulletPointsOpen(v => !v)}
                    count={blank.bulletPoints?.length ?? 0}
                    action={
                        <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={(e) => { e.stopPropagation(); setBulletModalOpen(true); }}>
                            Add
                        </Button>
                    }
                >
                    <Box sx={{ px: 3, pb: 3, pt: 2 }}>
                        {blank.bulletPoints?.length > 0 ? (
                            <Grid2 container spacing={1.5}>
                                {blank.bulletPoints.map((b, i) => (
                                    <Grid2 size={{ xs: 12, sm: 6 }} key={i}>
                                        <Box sx={{ border: "1px solid #e0e0e0", borderRadius: 2, p: 2, display: "flex", flexDirection: "column", gap: 1 }}>
                                            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                                                <IconButton size="small" color="error" onClick={() => {
                                                    let bla = {...blank};
                                                    bla.bulletPoints = bla.bulletPoints.filter((_, index) => index !== i);
                                                    setBlank(bla);
                                                    update({blank: bla});
                                                }}>
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Box>
                                            <TextField label="Title" size="small" fullWidth value={b.title} onChange={(e) => {}} />
                                            <TextField label="Description" multiline size="small" fullWidth value={b.description} onChange={(e) => {}} />
                                        </Box>
                                    </Grid2>
                                ))}
                            </Grid2>
                        ) : (
                            <Box sx={{ py: 3, textAlign: "center", color: "text.secondary" }}>
                                <Typography variant="body2">No bullet points yet. Click Add to create one.</Typography>
                            </Box>
                        )}
                    </Box>
                </SectionCard>

                {/* ── Sizes ── */}
                <SectionCard
                    title="Sizes"
                    icon={<StraightenIcon sx={{ fontSize: 20 }} />}
                    collapsible open={sizesOpen} onToggle={() => setSizesOpen(v => !v)}
                    count={blank.sizes?.length ?? 0}
                    action={
                        <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={(e) => { e.stopPropagation(); setSizesModalOpen(true); }}>
                            Add
                        </Button>
                    }
                >
                    <Box sx={{ px: 3, pb: 3, pt: 2 }}>
                        {blank.sizes?.length > 0 ? (
                            <Grid2 container spacing={1.5}>
                                {blank.sizes.map((s, i) => (
                                    <Grid2 size={{ xs: 12, sm: 6, md: 4 }} key={i}>
                                        <Box sx={{ border: "1px solid #e0e0e0", borderRadius: 2, p: 2, display: "flex", flexDirection: "column", gap: 1.5 }}>
                                            <FormControlLabel control={<Checkbox size="small" checked={!!s.hidden} onChange={(e) => {
                                                let bla = {...blank};
                                                bla.sizes[i].hidden = e.target.checked;
                                                setBlank(bla);
                                                update({blank: bla});
                                            }} />} label={<Typography variant="caption">Hidden</Typography>} />
                                            <TextField label="Size" size="small" fullWidth value={s.name} onChange={(e) => {
                                                let bla = {...blank};
                                                bla.sizes[i].name = e.target.value;
                                                setBlank(bla);
                                                debouncedUpdate({blank: bla});
                                            }} />
                                            <TextField label="Retail Price" size="small" fullWidth value={s.retailPrice} onChange={(e) => {
                                                let bla = {...blank};
                                                bla.sizes[i].retailPrice = e.target.value;
                                                setBlank(bla);
                                                debouncedUpdate({blank: bla});
                                            }} />
                                            <TextField label="Wholesale Cost" size="small" fullWidth value={s.wholesaleCost} onChange={(e) => {
                                                let bla = {...blank};
                                                bla.sizes[i].wholesaleCost = e.target.value;
                                                setBlank(bla);
                                                debouncedUpdate({blank: bla});
                                            }} />
                                            <TextField label="Weight (oz)" size="small" fullWidth value={s.weight} onChange={(e) => {
                                                let bla = {...blank};
                                                bla.sizes[i].weight = e.target.value;
                                                setBlank(bla);
                                                debouncedUpdate({blank: bla});
                                            }} />
                                            <Button size="small" variant="outlined" color="error" fullWidth onClick={() => {
                                                let bla = {...blank};
                                                bla.sizes = bla.sizes.filter((_, index) => index !== i);
                                                setBlank(bla);
                                                update({blank: bla});
                                            }}>Remove</Button>
                                        </Box>
                                    </Grid2>
                                ))}
                            </Grid2>
                        ) : (
                            <Box sx={{ py: 3, textAlign: "center", color: "text.secondary" }}>
                                <Typography variant="body2">No sizes yet. Click Add to create one.</Typography>
                            </Box>
                        )}
                    </Box>
                </SectionCard>

                {/* ── Size Guide ── */}
                <SectionCard
                    title="Size Guide"
                    icon={<PhotoSizeSelectLargeIcon sx={{ fontSize: 20 }} />}
                    collapsible open={sizesGuideOpen} onToggle={() => setSizesGuideOpen(v => !v)}
                    count={blank.sizeGuide?.images?.length ?? 0}
                    action={
                        <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={(e) => { e.stopPropagation(); setSizeGuideModalOpen(true); }}>
                            Upload
                        </Button>
                    }
                >
                    <Box sx={{ px: 3, pb: 3, pt: 2 }}>
                        {blank.sizeGuide?.images?.length > 0 ? (
                            <Grid2 container spacing={1.5}>
                                {blank.sizeGuide.images.map((img, i) => (
                                    <Grid2 size={{ xs: 6, sm: 4, md: 3 }} key={i}>
                                        <Box sx={{ border: "1px solid #e0e0e0", borderRadius: 2, overflow: "hidden" }}>
                                            <Image src={img} alt="size guide" width={200} height={200} style={{ width: "100%", height: "auto" }} />
                                            <Box sx={{ p: 1 }}>
                                                <Button size="small" variant="outlined" color="error" fullWidth onClick={() => {
                                                    let bla = {...blank};
                                                    bla.sizeGuide.images = bla.sizeGuide.images.filter((_, index) => index !== i);
                                                    setBlank(bla);
                                                    update({blank: bla});
                                                }}>Remove</Button>
                                            </Box>
                                        </Box>
                                    </Grid2>
                                ))}
                            </Grid2>
                        ) : (
                            <Box sx={{ py: 3, textAlign: "center", color: "text.secondary" }}>
                                <Typography variant="body2">No size guide images yet.</Typography>
                            </Box>
                        )}
                    </Box>
                </SectionCard>

                {/* ── Videos ── */}
                <SectionCard
                    title="Videos"
                    icon={<VideocamOutlinedIcon sx={{ fontSize: 20 }} />}
                    collapsible open={videoOpen} onToggle={() => setVideoOpen(v => !v)}
                    count={blank.videos?.length ?? 0}
                    action={
                        <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={(e) => { e.stopPropagation(); setVideoModalOpen(true); }}>
                            Upload
                        </Button>
                    }
                >
                    <Box sx={{ px: 3, pb: 3, pt: 2 }}>
                        {blank.videos?.length > 0 ? (
                            <Grid2 container spacing={1.5}>
                                {blank.videos.map((video, i) => (
                                    <Grid2 size={{ xs: 12, sm: 6, md: 4 }} key={i}>
                                        <Box sx={{ border: "1px solid #e0e0e0", borderRadius: 2, overflow: "hidden" }}>
                                            <CardMedia component="video" src={video} controls sx={{ width: "100%", height: "auto" }} />
                                            <Box sx={{ p: 1 }}>
                                                <Button size="small" variant="outlined" color="error" fullWidth onClick={() => {
                                                    let bla = {...blank};
                                                    bla.videos = bla.videos.filter((_, index) => index !== i);
                                                    setBlank(bla);
                                                    update({blank: bla});
                                                }}>Remove</Button>
                                            </Box>
                                        </Box>
                                    </Grid2>
                                ))}
                            </Grid2>
                        ) : (
                            <Box sx={{ py: 3, textAlign: "center", color: "text.secondary" }}>
                                <Typography variant="body2">No videos yet.</Typography>
                            </Box>
                        )}
                    </Box>
                </SectionCard>

                {/* ── Colors & Print Locations ── */}
                <SectionCard title="Colors & Print Locations" icon={<PaletteOutlinedIcon sx={{ fontSize: 20 }} />}>
                    <Box sx={{ p: 3, display: "flex", flexDirection: "column", gap: 2.5 }}>
                        <Box>
                            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: "block", fontWeight: 500 }}>Colors</Typography>
                            <CreatableSelect
                                menuPortalTarget={menuPortalTarget}
                                menuPosition="fixed"
                                placeholder="Add colors..."
                                isMulti
                                options={allColors.map(c => ({
                                    value: c,
                                    label: (
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                            <Box sx={{ width: 16, height: 16, backgroundColor: c?.hexcode, border: "1px solid #ccc", borderRadius: "2px", flexShrink: 0 }} />
                                            <span>{c?.name}</span>
                                        </Box>
                                    )
                                }))}
                                value={blank.colors ? blank.colors.map(ac => ({
                                    value: ac,
                                    label: (
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                            <Box sx={{ width: 16, height: 16, backgroundColor: ac.hexcode, border: "1px solid #ccc", borderRadius: "2px", flexShrink: 0 }} />
                                            <span>{ac.name}</span>
                                        </Box>
                                    )
                                })) : []}
                                onChange={async (newValue) => {
                                    let bla = {...blank};
                                    bla.colors = newValue ? newValue.map(nv => nv.value) : [];
                                    bla.colors = bla.colors.filter((color, index, self) => index === self.findIndex(c => c._id === color._id));
                                    bla.colors = bla.colors.filter(c => c._id);
                                    for (let v of newValue) {
                                        if (!v.value._id) {
                                            let newColor = { name: v.value, hexCode: "#000", sku: v.value.substring(0, 5).toLowerCase() };
                                            if (newColor.name.includes("Plaid")) {
                                                newColor.sku = newColor.name.toLocaleLowerCase().replace(/ /g, "").replace(/light/g, "l").replace(/heather/g, "h").replace("vintage", "v").replace("and", "").replace("top", "").replace(/black/g, "bl").replace("plaid", "pl").replace(/white/g, "wh").replace("red", "re").substring(0, 7);
                                            } else {
                                                newColor.sku = newColor.name.toLocaleLowerCase().replace(/ /g, "").replace(/light/g, "l").replace(/heather/g, "h").replace("vintage", "v").replace("and", "").substring(0, 7);
                                            }
                                            let res = await axios.post("/api/admin/colors", { color: newColor });
                                            let all = [...allColors];
                                            all.push(res.data.color);
                                            setAllColors(all);
                                            bla.colors.push({ ...res.data.color });
                                        }
                                    }
                                    setBlank(bla);
                                    update({blank: bla});
                                }}
                            />
                        </Box>
                        <Box>
                            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: "block", fontWeight: 500 }}>Print Locations</Typography>
                            <CreatableSelect
                                menuPortalTarget={menuPortalTarget}
                                menuPosition="fixed"
                                placeholder="Add print locations..."
                                isMulti
                                options={printLocations.map(pl => ({ value: pl, label: pl.name }))}
                                value={blank.printLocations ? blank.printLocations.map(pl => ({ value: pl, label: pl.name })) : []}
                                onChange={(newValue) => {
                                    let bla = {...blank};
                                    bla.printLocations = newValue ? newValue.map(nv => nv.value) : [];
                                    setBlank(bla);
                                    update({blank: bla});
                                }}
                            />
                        </Box>
                    </Box>
                </SectionCard>

                {/* ── Images ── */}
                <Box sx={{ backgroundColor: "#fff", borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", mb: 2, overflow: "hidden" }}>
                    <Box sx={{ px: 3, py: 2, borderBottom: "1px solid #f0f0f0", display: "flex", alignItems: "center", gap: 1 }}>
                        <PhotoLibraryOutlinedIcon sx={{ color: "text.secondary", fontSize: 20 }} />
                        <Typography variant="subtitle1" fontWeight={600}>Images</Typography>
                        <Box sx={{ flexGrow: 1 }} />
                        <Typography variant="caption" color="text.secondary">
                            {blank.images?.length ?? 0} image{(blank.images?.length ?? 0) !== 1 ? "s" : ""} across {blank.colors?.length ?? 0} color{(blank.colors?.length ?? 0) !== 1 ? "s" : ""}
                        </Typography>
                    </Box>
                    <Box sx={{ p: 2 }}>
                        {(!blank.colors || blank.colors.length === 0) ? (
                            <Box sx={{ py: 5, textAlign: "center", color: "text.secondary" }}>
                                <PhotoLibraryOutlinedIcon sx={{ fontSize: 48, opacity: 0.25, mb: 1 }} />
                                <Typography variant="body2">Add colors above to manage images per color.</Typography>
                            </Box>
                        ) : (
                            blank.colors.map((color, idx) => {
                                const images = blank.images?.filter(img => img.color?.toString() === color._id?.toString()) ?? [];
                                const isHidden = blank.hiddenColors?.includes(color._id?.toString());
                                return (
                                    <Card key={idx} variant="outlined" sx={{ mb: 1.5, borderRadius: 2, "&:last-child": { mb: 0 } }}>
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 2, py: 1.5, borderBottom: "1px solid #f5f5f5" }}>
                                            <Box sx={{ width: 22, height: 22, backgroundColor: color.hexcode, border: "1px solid #ccc", borderRadius: "4px", flexShrink: 0 }} />
                                            <Typography variant="subtitle2" fontWeight={600} sx={{ flexGrow: 1 }}>{color.name}</Typography>
                                            <Chip label={`${images.length} image${images.length !== 1 ? "s" : ""}`} size="small" variant="outlined" sx={{ fontSize: "0.7rem", height: 20 }} />
                                            <EyeDropper onColorChange={async (hex) => {
                                                let bla = {...blank};
                                                let cols = bla.colors;
                                                for (let c of cols) {
                                                    if (c._id === color._id) {
                                                        let res = await axios.post("/api/admin/colors", { color: { ...c, hexcode: hex } });
                                                        setAllColors(allColors.map(ac => ac._id === c._id ? res.data.color : ac));
                                                        c.hexcode = hex;
                                                    }
                                                }
                                                bla.colors = cols;
                                                setBlank(bla);
                                                update({blank: bla});
                                            }} />
                                            <FormControlLabel
                                                control={
                                                    <Switch size="small" defaultChecked={!isHidden} onChange={(e) => {
                                                        let bla = {...blank};
                                                        if (!e.target.checked) {
                                                            bla.hiddenColors.push(color._id.toString());
                                                        } else {
                                                            bla.hiddenColors = bla.hiddenColors.filter(id => id !== color._id.toString());
                                                        }
                                                        setBlank(bla);
                                                        update({blank: bla});
                                                    }} />
                                                }
                                                label={<Typography variant="caption" color="text.secondary">{isHidden ? "Hidden" : "Visible"}</Typography>}
                                                labelPlacement="start"
                                                sx={{ mx: 0 }}
                                            />
                                        </Box>
                                        <Box sx={{ p: 1.5 }}>
                                            <Grid2 container spacing={1.5}>
                                                <Grid2 size={{ xs: 6, sm: 4, md: 2 }}>
                                                    <Box
                                                        onClick={() => { setSelectedImageSrc(null); setImageColor(color); setIsImageEditModalOpen(true); }}
                                                        sx={{
                                                            width: 160, height: 160,
                                                            border: "2px dashed #1989df",
                                                            borderRadius: 2,
                                                            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                                                            cursor: "pointer", gap: 0.5,
                                                            transition: "background-color 0.15s",
                                                            "&:hover": { backgroundColor: "#f0f7ff" },
                                                        }}
                                                    >
                                                        <AddPhotoAlternateIcon sx={{ color: "#1989df", fontSize: 28 }} />
                                                        <Typography variant="caption" color="primary" fontWeight={500}>Add Image</Typography>
                                                    </Box>
                                                </Grid2>
                                                {images.map((img, imgIdx) => (
                                                    <Grid2 size={{ xs: 6, sm: 4, md: 2 }} key={imgIdx}>
                                                        <Box sx={{ position: "relative", width: 160, height: 160, borderRadius: 2, overflow: "hidden", border: "1px solid #e0e0e0" }}>
                                                            <Box
                                                                onClick={() => { setSelectedImageSrc({ ...img }); setImageColor(color); setIsImageEditModalOpen(true); }}
                                                                sx={{ width: "100%", height: "100%", cursor: "pointer" }}
                                                            >
                                                                <Image
                                                                    src={img.image ? `${img.image.replace('images1.pythiastechnologies.com', 'images2.pythiastechnologies.com/origin')}?width=200&height=200` : ''}
                                                                    alt={img.name ?? "blank image"}
                                                                    width={160}
                                                                    height={160}
                                                                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                                                />
                                                                <Stage width={160} height={160} style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}>
                                                                    {Object.keys(img.boxes ?? {}).map((key, i) => {
                                                                        const rect = img.boxes[key];
                                                                        if (!rect) return null;
                                                                        // boxes stored at 400px edit canvas → scale to 160px thumbnail
                                                                        const s = 160 / 400;
                                                                        return (
                                                                            <Layer key={i}>
                                                                                <Rect x={rect.x * s} y={rect.y * s} width={rect.width * s} height={rect.height * s} rotation={rect.rotation} stroke="#ffffff" strokeWidth={1.5} dash={[4, 4]} />
                                                                            </Layer>
                                                                        );
                                                                    })}
                                                                </Stage>
                                                            </Box>
                                                            <IconButton
                                                                size="small"
                                                                sx={{
                                                                    position: "absolute", top: 4, right: 4,
                                                                    backgroundColor: "rgba(255,255,255,0.85)",
                                                                    "&:hover": { backgroundColor: "rgba(211,47,47,0.9)", color: "#fff" },
                                                                }}
                                                                onClick={(e) => { e.stopPropagation(); setImageToDelete(img.image); setDeleteModalOpen(true); }}
                                                            >
                                                                <DeleteIcon fontSize="small" />
                                                            </IconButton>
                                                        </Box>
                                                        {img.name && (
                                                            <Typography variant="caption" sx={{ display: "block", textAlign: "center", mt: 0.5, color: "text.secondary" }}>
                                                                {img.name}
                                                            </Typography>
                                                        )}
                                                    </Grid2>
                                                ))}
                                            </Grid2>
                                        </Box>
                                    </Card>
                                );
                            })
                        )}
                    </Box>
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
    return (
        <Modal open={open} onClose={onClose}>
            <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 440, bgcolor: 'background.paper', borderRadius: 2, boxShadow: 24, p: 4 }}>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Add Bullet Point</Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <TextField label="Title" fullWidth value={bullet.title} onChange={(e) => setBullet({...bullet, title: e.target.value})} />
                    <TextField label="Description" multiline rows={3} fullWidth value={bullet.description} onChange={(e) => setBullet({...bullet, description: e.target.value})} />
                </Box>
                <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, mt: 3 }}>
                    <Button variant="outlined" onClick={onClose}>Cancel</Button>
                    <Button variant="contained" onClick={() => {
                        let bla = {...blank};
                        if (!bla.bulletPoints) bla.bulletPoints = [];
                        bla.bulletPoints.push(bullet);
                        setBlank(bla);
                        setBullet({title: "", description: ""});
                        update({blank: bla});
                        onClose();
                    }}>Save</Button>
                </Box>
            </Box>
        </Modal>
    )
}

const SizesModal = ({ open, onClose, blank, setBlank, update }) => {
    const [size, setSize] = useState({name: "", retailPrice: "", weight: ""})
    return (
        <Modal open={open} onClose={onClose}>
            <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 440, bgcolor: 'background.paper', borderRadius: 2, boxShadow: 24, p: 4 }}>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Add Size</Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <TextField label="Name" fullWidth value={size.name} onChange={(e) => setSize({...size, name: e.target.value})} />
                    <TextField label="Retail Price" fullWidth value={size.retailPrice} onChange={(e) => setSize({...size, retailPrice: e.target.value})} />
                    <TextField label="Weight (oz)" fullWidth value={size.weight} onChange={(e) => setSize({...size, weight: e.target.value})} />
                </Box>
                <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, mt: 3 }}>
                    <Button variant="outlined" onClick={onClose}>Cancel</Button>
                    <Button variant="contained" onClick={() => {
                        let bla = {...blank};
                        if (!bla.sizes) bla.sizes = [];
                        bla.sizes.push(size);
                        setSize({name: "", retailPrice: "", weight: ""});
                        setBlank(bla);
                        update({blank: bla});
                        onClose();
                    }}>Save</Button>
                </Box>
            </Box>
        </Modal>
    )
}

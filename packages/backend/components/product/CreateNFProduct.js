"use client";
import { Modal, Box, Typography, Button, Card, CardContent, TextField, Divider, Grid2, Checkbox, Chip, Tooltip, Stack, CardActionArea, Stepper, Step, StepLabel, StepButton, IconButton, ToggleButton, ToggleButtonGroup, CircularProgress } from '@mui/material';
import CreatableSelect from 'react-select/creatable';
import {useState, useEffect, useRef} from 'react';
import LoaderOverlay from "../reusable/LoaderOverlay";
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import CheckIcon from '@mui/icons-material/Check';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import axios from 'axios';
import { ProductImageCarosel, VariantDisplay } from '../design/stages/previewStage';
import { CatalogProductCreate } from './CatalogProductCreate';
import { SourcingBrowser } from './SourcingBrowser';
import TravelExploreIcon from '@mui/icons-material/TravelExplore';

const STAGES = [
    { key: "Select Blank", label: "Blank" },
    { key: "Select Colors and Sizes", label: "Colors & Sizes" },
    { key: "Select Images", label: "Product Images" },
    { key: "Variant Images", label: "Variant Images" },
    { key: "Information", label: "Information" },
    { key: "Preview", label: "Preview" },
];

const tileBackground = "radial-gradient(ellipse at center, #ffffff 0%, #eef0f3 100%)";

const selectMenuPortalProps = {
    menuPortalTarget: typeof document !== "undefined" ? document.body : null,
    menuPosition: "fixed",
    styles: { menuPortal: (base) => ({ ...base, zIndex: 9999 }) },
};

const ImageTile = ({ image, selected, onClick, onZoom }) => (
    <Box onClick={onClick} sx={{ position: "relative", aspectRatio: "1 / 1", border: selected ? "2px solid" : "1px solid", borderColor: selected ? "primary.main" : "divider", borderRadius: 1, overflow: "hidden", cursor: "pointer", background: tileBackground, display: "flex", alignItems: "center", justifyContent: "center", transition: "border-color 150ms, box-shadow 150ms", "&:hover": { boxShadow: 3, "& .tile-zoom": { opacity: 1 }, "& .tile-img": { transform: "scale(1.18)" } } }}>
        <img className="tile-img" src={image.image} alt={image.sku || ""} loading="lazy" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", transition: "transform 200ms ease-out" }} />
        <Box sx={{ position: "absolute", top: 2, right: 2 }}>
            <Checkbox size="small" checked={selected} sx={{ padding: 0.25, backgroundColor: "rgba(255,255,255,0.85)", borderRadius: 1, "&:hover": { backgroundColor: "rgba(255,255,255,1)" } }} />
        </Box>
        <Tooltip title="Zoom" placement="top" arrow>
            <IconButton size="small" className="tile-zoom" onClick={(e) => { e.stopPropagation(); onZoom(image); }} sx={{ position: "absolute", top: 2, left: 2, padding: 0.25, backgroundColor: "rgba(255,255,255,0.85)", opacity: { xs: 1, md: 0 }, transition: "opacity 150ms", "&:hover": { backgroundColor: "rgba(255,255,255,1)" } }}>
                <ZoomInIcon fontSize="small" />
            </IconButton>
        </Tooltip>
        {image.side && (
            <Chip size="small" label={image.side} sx={{ position: "absolute", bottom: 2, left: 2, height: 16, fontSize: ".6rem", backgroundColor: "rgba(255,255,255,0.85)", "& .MuiChip-label": { paddingX: 0.75 } }} />
        )}
    </Box>
);

const ZoomModal = ({ image, onClose }) => (
    <Modal open={!!image} onClose={onClose} sx={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 2 }}>
        <Box sx={{ position: "relative", outline: "none", maxWidth: "92vw", maxHeight: "92vh", display: "flex", alignItems: "center", justifyContent: "center", background: tileBackground, borderRadius: 2, boxShadow: 24, padding: 1 }}>
            <IconButton onClick={onClose} sx={{ position: "absolute", top: 4, right: 4, zIndex: 2, backgroundColor: "rgba(255,255,255,0.9)", "&:hover": { backgroundColor: "rgba(255,255,255,1)" } }}>
                <CloseIcon />
            </IconButton>
            {image && (
                <img src={image.image?.replace("?width=400", "?width=1200").replace("?width=200", "?width=1200")} alt={image.sku || ""} style={{ maxWidth: "88vw", maxHeight: "88vh", objectFit: "contain", display: "block" }} />
            )}
            {image?.sku && (
                <Box sx={{ position: "absolute", bottom: 8, left: 8, right: 8, display: "flex", justifyContent: "center", pointerEvents: "none" }}>
                    <Chip size="small" label={image.sku} sx={{ backgroundColor: "rgba(0,0,0,0.65)", color: "#fff", maxWidth: "100%", "& .MuiChip-label": { whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } }} />
                </Box>
            )}
        </Box>
    </Modal>
);

const catalogEntriesToBlanks = (catalog) => {
    const sizeOrder = ["XS","S","M","L","XL","2XL","3XL","4XL"];
    return catalog.map(entry => {
        const colors = entry.colors.map(({ color }) => color);
        const sizeMap = {};
        for (const { sizes } of entry.colors) {
            for (const { size, providers } of sizes) {
                if (!sizeMap[size]) {
                    const minPrice = providers.length > 0 ? Math.min(...providers.map(p => p.wholesalePrice ?? 0)) : 0;
                    sizeMap[size] = { _id: size, name: size, wholesaleCost: minPrice, costPerItem: minPrice, retailPrice: 0, compareAtPrice: 0 };
                }
            }
        }
        const sizes = Object.values(sizeMap).sort((a, z) => sizeOrder.indexOf(a.name) - sizeOrder.indexOf(z.name));
        return { ...entry.blank, colors, sizes };
    });
};

export const CreateNFProduct = ({ open, product, setProduct, setOpen, stage, setStage, brands: brandsProp, setBrands, seasons, setSeasons, genders, setGenders, CreateSku, themes, setThemes, sportUsedFor, setSportUsedFor, orgType }) => {
    // Storefront resellers don't have blanks — default them straight to the buy-not-build ("Other") creator.
    const [type, setType] = useState(orgType === "storefront" ? "Other" : "From Blank");
    // Wholesale sourcing browser (CJ) → import prefills the catalog creator.
    const [sourcingOpen, setSourcingOpen] = useState(false);
    const [imported, setImported] = useState(null);
    const [importKey, setImportKey] = useState(0);
    const [blanks, setBlanks] = useState([]);
    const [localBrands, setLocalBrands] = useState(brandsProp || []);
    const [loading, setLoading] = useState(false);
    const [primaryImage, setPrimaryImage] = useState(true);
    const [upcs, setUpcs] = useState([])
    const [tempUpcs, setTempUpcs] = useState([])
    const [department, setDepartment] = useState(null)
    const [category, setCategory] = useState(null)
    const [zoomImage, setZoomImage] = useState(null)
    const [imageColorFilter, setImageColorFilter] = useState("all")
    const [markets, setMarkets] = useState([])
    const [generatingTags, setGeneratingTags] = useState(false)
    const targetRef = useRef(null)
    const departments = blanks.map(b => b.department).filter((value, index, self) => value && self.indexOf(value) === index)
    const categories = blanks.map(b => b.category?.[0]).filter((value, index, self) => value && self.indexOf(value) === index)
    const currentStepIndex = STAGES.findIndex(s => s.key === stage)
    useEffect(() => {
        scrollToTarget();
    }, [stage]);
    const scrollToTarget = () => {
        if (targetRef.current) {
            targetRef.current.scrollTop = 0;
        }
    };
    useEffect(() => {
        const fetchBlanks = async () => {
            try {
                if (orgType === "commerce") {
                    const response = await axios.get('/api/fulfillment/catalog');
                    setBlanks(catalogEntriesToBlanks(response.data.catalog || []));
                } else {
                    const response = await axios.get('/api/admin/blanks');
                    setBlanks(response.data.blanks);
                }
            } catch (error) {
                console.error("Error fetching blanks:", error);
            }
        };
        const fetchMarkets = async () => {
            try {
                const response = await axios.get('/api/marketplaces');
                setMarkets(response.data.marketplaces || []);
            } catch (error) {
                console.error("Error fetching marketplaces:", error);
            }
        };
        const fetchBrands = async () => {
            try {
                const response = await axios.get('/api/admin/brands');
                const fetched = response.data.brands || [];
                setLocalBrands(fetched);
                if (setBrands) setBrands(fetched);
            } catch (error) {
                console.error("Error fetching brands:", error);
            }
        };
        if(open) {
            fetchBlanks();
            fetchMarkets();
            fetchBrands();
        }
    },[open])
    let style = {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: "90%",
        height: "90%",
        bgcolor: 'background.paper',
        boxShadow: 24,
        p: 4,
        overflow: "auto"
    }
    useEffect(() => {
        const handleBeforeUnload = async (event) => {
            if (window.dataLayer?.[0]) {
                event.preventDefault(); // This line is crucial for displaying the prompt
                let res = await axios.post("/api/upc/releasehold", { upcs: window.dataLayer[0] }); // Release hold on temp UPCs if any
            }
            // Optional: Display a confirmation message to the user
            //event.preventDefault(); // This line is crucial for displaying the prompt
            //event.returnValue = 'Are you sure you want to leave?';
        };
        window.addEventListener('beforeunload', handleBeforeUnload);

        // Cleanup function: Remove the event listener when the component unmounts
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, []);    
    const getUpcs = async ({ blanks, design }) => {
        let res = await axios.post("/api/upc", { blanks, design }).catch(e => {
            console.error(e);
        });
        if (!res?.data?.upcs) return;
        setUpcs(res.data.upcs);
    }
    const getTempUpcs = async (count) => {
        let res = await axios.post("/api/upc", { count }).catch(e => {
            console.error(e);
        });
        if (!res?.data?.upcs) return;
        if (!window.dataLayer) window.dataLayer = [];
        setTempUpcs([...res.data.upcs]);
        window.dataLayer.push(res.data.upcs)
    }
    const releaseHold = async () => {
        let res = await axios.post("/api/upc/releasehold", { upcs: tempUpcs });
        window.dataLayer = [];
    }
    return (
        <>
        <Modal
            open={open}
            onClose={() => { setProduct({blanks: [], colors: [], productImages: [], variantsArray: []}); releaseHold(); setLoading(false); setStage("Select Blank"); setOpen(false)}}
            aria-labelledby="modal-modal-title"
            aria-describedby="modal-modal-description"
        >
            <Box sx={style} ref={targetRef}>
                <Box sx={{display: "flex", flexDirection: "row", justifyContent: "flex-end", alignItems: "center", padding: "1%"}}>
                    <CloseIcon onClick={() => { setProduct({blanks: [], colors: [], productImages: [], variantsArray: []}); releaseHold(); setStage("Select Blank"); setLoading(false); setOpen(false) }} sx={{ cursor: "pointer", color: "#780606"}} />
                </Box>
                <Typography variant="h5" textAlign="center">{product?._id ? "Edit Product" : "Create New Product"}</Typography>
                {/* Resellers (storefront) have no blanks — show only the buy-not-build creator. */}
                {orgType !== "storefront" && (
                    <Box sx={{padding: "2%", marginBottom: "2%", display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center"}}>
                        <Button fullWidth variant="outlined" sx={{background: type== "From Blank" ? "#e2e2e2" : "transparent"}} onClick={() => setType("From Blank")}>From Blank</Button>
                        <Button fullWidth variant="outlined" sx={{background: type== "Other" ? "#e2e2e2" : "transparent"}} onClick={() => setType("Other")}>Buy / Resell (UPC)</Button>
                    </Box>
                )}
                {type === "From Blank" && (
                    <Stepper activeStep={currentStepIndex < 0 ? 0 : currentStepIndex} alternativeLabel sx={{ marginBottom: 3 }} nonLinear>
                        {STAGES.map((s, idx) => (
                            <Step key={s.key} completed={idx < currentStepIndex}>
                                <StepButton onClick={() => { if (idx <= currentStepIndex) setStage(s.key); }} disabled={idx > currentStepIndex}>
                                    <StepLabel>{s.label}</StepLabel>
                                </StepButton>
                            </Step>
                        ))}
                    </Stepper>
                )}
                {type === "From Blank" && stage == "Select Blank" && (
                    <Box sx={{ padding: { xs: 1.5, sm: 2 } }}>
                        <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ xs: "stretch", md: "center" }} justifyContent="space-between" sx={{ marginBottom: 2 }}>
                            <Box>
                                <Typography variant="h6" sx={{ fontWeight: 600, lineHeight: 1.2 }}>Select Blank</Typography>
                                <Typography variant="caption" color="text.secondary">Pick a blank to base this product on.</Typography>
                            </Box>
                        </Stack>

                        <Stack spacing={1} sx={{ marginBottom: 2 }}>
                            {departments.length > 0 && (
                                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flexWrap: "wrap", rowGap: 0.75 }}>
                                    <Typography variant="caption" sx={{ color: "text.secondary", textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600, minWidth: 80 }}>Department</Typography>
                                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                                        {departments.map((d, i) => (
                                            <Chip key={i} label={d} size="small" clickable color={department === d ? "primary" : "default"} variant={department === d ? "filled" : "outlined"} onClick={() => setDepartment(department === d ? null : d)} />
                                        ))}
                                    </Box>
                                </Stack>
                            )}
                            {categories.length > 0 && (
                                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flexWrap: "wrap", rowGap: 0.75 }}>
                                    <Typography variant="caption" sx={{ color: "text.secondary", textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600, minWidth: 80 }}>Category</Typography>
                                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                                        {categories.map((c, i) => (
                                            <Chip key={i} label={c} size="small" clickable color={category === c ? "primary" : "default"} variant={category === c ? "filled" : "outlined"} onClick={() => setCategory(category === c ? null : c)} />
                                        ))}
                                    </Box>
                                </Stack>
                            )}
                        </Stack>

                        <Grid2 container spacing={1.5}>
                            {blanks && blanks.filter(b => (department ? b.department === department : true) && (category ? b.category?.[0] === category : true)).map((blank) => {
                                const selected = product?.blanks?.[0]?._id?.toString() === blank._id?.toString();
                                const thumb = blank.images?.[0]?.image
                                    ? `${blank.images[0].image.replace("https://images1.pythiastechnologies.com", "https://images2.pythiastechnologies.com/origin")}?width=400`
                                    : "/missingImage.jpg";
                                return (
                                    <Grid2 size={{ xs: 6, sm: 4, md: 3, lg: 2 }} key={blank._id}>
                                        <Card variant="outlined" sx={{ borderRadius: 2, borderColor: selected ? "primary.main" : "divider", borderWidth: selected ? 2 : 1, position: "relative", transition: "border-color 150ms, box-shadow 150ms", "&:hover": { boxShadow: 2 } }}>
                                            <CardActionArea onClick={() => {
                                                // Preserve product identity when editing so saving UPDATES instead of
                                                // creating a duplicate. Re-picking the same blank keeps the existing
                                                // product/edits; picking a different blank rebuilds but carries _id.
                                                const sameBlank = product?.blanks?.[0]?._id?.toString() === blank._id?.toString();
                                                let prod = (product?._id && sameBlank) ? { ...product } : {
                                                    ...(product?._id ? { _id: product._id, ids: product.ids } : {}),
                                                    title: blank.name,
                                                    blanks: [blank],
                                                    sku: blank.code,
                                                    vendor: blank.vendor,
                                                    department: blank.department,
                                                    category: blank.category,
                                                    colors: blank.colors,
                                                    tags: [],
                                                    defaultColor: blank.colors[0],
                                                    productImages: [],
                                                    priceTiers: [],
                                                    sizes: blank.sizes,
                                                    description: blank.description || "",
                                                    isNFProduct: true
                                                }
                                                setProduct(prod);
                                                setStage("Select Colors and Sizes");
                                            }}>
                                                <Box sx={{ position: "absolute", top: 4, right: 4, zIndex: 2 }}>
                                                    <Checkbox size="small" checked={selected} sx={{ padding: 0.5, backgroundColor: "rgba(255,255,255,0.7)", borderRadius: 1, "&:hover": { backgroundColor: "rgba(255,255,255,0.9)" } }} />
                                                </Box>
                                                <Box sx={{ aspectRatio: "1 / 1", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "background.default", padding: 1 }}>
                                                    <img src={thumb} alt={blank.name} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                                                </Box>
                                                <Divider />
                                                <Box sx={{ padding: 1 }}>
                                                    <Typography variant="body2" sx={{ fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={`${blank.name} - ${blank.code}`}>{blank.name}</Typography>
                                                    <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "block" }}>{blank.code}</Typography>
                                                </Box>
                                            </CardActionArea>
                                        </Card>
                                    </Grid2>
                                );
                            })}
                        </Grid2>
                    </Box>
                )}
                {type === "From Blank" && stage == "Select Colors and Sizes" && (
                    <Box>
                        {product && product.blanks[0] && (
                            <Box>
                                <Typography variant="h6" textAlign="center" sx={{marginBottom: "2%"}}>Select Colors and Sizes for {product.title}</Typography>
                                <Box sx={{ marginBottom: "2%" }}>
                                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1%" }}>
                                        <Typography variant="subtitle1">Colors ({product.colors?.length || 0} / {product.blanks[0].colors.length})</Typography>
                                        <Box sx={{ display: "flex", gap: 1 }}>
                                            <Button size="small" variant="outlined" onClick={() => {
                                                let prod = { ...product };
                                                prod.colors = [...product.blanks[0].colors];
                                                if (!prod.defaultColor || !prod.colors.find(c => c._id.toString() === prod.defaultColor._id.toString())) prod.defaultColor = prod.colors[0] || null;
                                                setProduct(prod);
                                            }}>Select All</Button>
                                            <Button size="small" variant="outlined" onClick={() => {
                                                let prod = { ...product };
                                                prod.colors = [];
                                                prod.defaultColor = null;
                                                setProduct(prod);
                                            }}>Clear</Button>
                                        </Box>
                                    </Box>
                                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
                                        {product.blanks[0].colors.map(c => {
                                            const selected = !!product.colors?.find(co => co._id.toString() === c._id.toString());
                                            return (
                                                <Tooltip key={c._id} title={c.name} placement="top" arrow>
                                                    <Box onClick={() => {
                                                        let prod = { ...product };
                                                        if (selected) {
                                                            prod.colors = (prod.colors || []).filter(co => co._id.toString() !== c._id.toString());
                                                            if (prod.defaultColor && prod.defaultColor._id.toString() === c._id.toString()) prod.defaultColor = prod.colors[0] || null;
                                                        } else {
                                                            prod.colors = [...(prod.colors || []), c];
                                                            if (!prod.defaultColor) prod.defaultColor = c;
                                                        }
                                                        setProduct(prod);
                                                    }} sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5, cursor: "pointer", width: 56 }}>
                                                        <Box sx={{ width: 48, height: 48, borderRadius: "50%", backgroundColor: c.hexcode, border: selected ? "3px solid" : "1px solid", borderColor: selected ? "primary.main" : "rgba(0,0,0,0.15)", boxShadow: selected ? 2 : 0, display: "flex", alignItems: "center", justifyContent: "center", transition: "transform 100ms", "&:hover": { transform: "scale(1.06)" } }}>
                                                            {selected && <CheckIcon sx={{ color: c.color_type == "dark" ? "#fff" : "#000", fontSize: "1.4rem" }} />}
                                                        </Box>
                                                        <Typography variant="caption" sx={{ fontSize: ".7rem", textAlign: "center", lineHeight: 1.1, maxWidth: 56, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</Typography>
                                                    </Box>
                                                </Tooltip>
                                            );
                                        })}
                                    </Box>
                                </Box>
                                {product.colors?.length > 0 && (
                                    <Box sx={{ marginBottom: "2%" }}>
                                        <Typography variant="subtitle1" sx={{ marginBottom: "1%" }}>Default Color</Typography>
                                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
                                            {product.colors.map(c => {
                                                const isDefault = !!(product.defaultColor && product.defaultColor._id.toString() === c._id.toString());
                                                return (
                                                    <Tooltip key={c._id} title={c.name} placement="top" arrow>
                                                        <Box onClick={() => {
                                                            let prod = { ...product };
                                                            prod.defaultColor = c;
                                                            setProduct(prod);
                                                        }} sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5, cursor: "pointer", width: 56 }}>
                                                            <Box sx={{ width: 48, height: 48, borderRadius: "50%", backgroundColor: c.hexcode, border: isDefault ? "3px solid" : "1px solid", borderColor: isDefault ? "primary.main" : "rgba(0,0,0,0.15)", boxShadow: isDefault ? 2 : 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                                {isDefault && <CheckIcon sx={{ color: c.color_type == "dark" ? "#fff" : "#000", fontSize: "1.4rem" }} />}
                                                            </Box>
                                                            <Typography variant="caption" sx={{ fontSize: ".7rem", textAlign: "center", lineHeight: 1.1, maxWidth: 56, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</Typography>
                                                        </Box>
                                                    </Tooltip>
                                                );
                                            })}
                                        </Box>
                                    </Box>
                                )}
                                <Box sx={{ marginBottom: "2%" }}>
                                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1%" }}>
                                        <Typography variant="subtitle1">Sizes ({product.sizes?.length || 0} / {product.blanks[0].sizes.length})</Typography>
                                        <Box sx={{ display: "flex", gap: 1 }}>
                                            <Button size="small" variant="outlined" onClick={() => {
                                                let prod = { ...product };
                                                prod.sizes = [...product.blanks[0].sizes];
                                                setProduct(prod);
                                            }}>Select All</Button>
                                            <Button size="small" variant="outlined" onClick={() => {
                                                let prod = { ...product };
                                                prod.sizes = [];
                                                setProduct(prod);
                                            }}>Clear</Button>
                                        </Box>
                                    </Box>
                                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                                        {product.blanks[0].sizes.map(s => {
                                            const selected = !!product.sizes?.find(si => si.name === s.name);
                                            return (
                                                <Chip key={s._id} label={s.name} color={selected ? "primary" : "default"} variant={selected ? "filled" : "outlined"} clickable onClick={() => {
                                                    let prod = { ...product };
                                                    if (selected) prod.sizes = (prod.sizes || []).filter(si => si.name !== s.name);
                                                    else prod.sizes = [...(prod.sizes || []), s];
                                                    setProduct(prod);
                                                }} sx={{ minWidth: 56, fontWeight: 500 }} />
                                            );
                                        })}
                                    </Box>
                                </Box>
                                <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "space-between", gap: 2, marginTop: "2%" }}>
                                    <Button fullWidth variant="outlined" onClick={() => setStage("Select Blank")}>Back</Button>
                                    <Button fullWidth variant="contained" disabled={!product.colors?.length || !product.sizes?.length || !product.defaultColor} onClick={() => {
                                        setStage("Select Images");
                                    }}>Next</Button>
                                </Box>
                            </Box>
                        )}
                    </Box>
                )}
                {type === "From Blank" && stage == "Select Images" && (
                    <Box sx={{ padding: { xs: 1, sm: 1.5 }, background: "linear-gradient(180deg, #f4f6fa 0%, #eceff5 100%)", minHeight: "100%", borderRadius: 2 }}>
                        {product && product.blanks[0] && (() => {
                            const cdn = (url) => url.replace("https://images1.pythiastechnologies.com", "https://images2.pythiastechnologies.com/origin");
                            const selectedColors = product.colors || [];
                            const allImages = (product.blanks[0].images || [])
                                .map(img => {
                                    const fullUrl = `${cdn(img.image)}?width=400`;
                                    const color = selectedColors.find(c => c._id.toString() === img.color?.toString()) || null;
                                    return { image: fullUrl, color, raw: img, rawColorId: img.color?.toString() || null, sku: color ? `${product.sku}-${color.sku ?? ""}` : product.sku };
                                })
                                .filter(im => !im.rawColorId || im.color);
                            // Seed an entry for every selected color so it appears in the picker even if blank.images has none for it.
                            const colorGroups = {};
                            for (const c of selectedColors) colorGroups[c._id.toString()] = { color: c, images: [] };
                            const noColor = [];
                            for (const im of allImages) {
                                if (im.color) {
                                    const key = im.color._id.toString();
                                    if (!colorGroups[key]) colorGroups[key] = { color: im.color, images: [] };
                                    colorGroups[key].images.push(im);
                                } else {
                                    noColor.push(im);
                                }
                            }
                            const totalSelected = product.productImages?.length || 0;
                            const totalAvailable = allImages.length;
                            const toggleImage = (im) => {
                                let prod = { ...product };
                                if (!prod.productImages) prod.productImages = [];
                                const existing = prod.productImages.find(p => p.image === im.image);
                                if (!existing) prod.productImages.push({ image: im.image, color: im.color, blank: prod.blanks[0]._id, sku: im.sku });
                                else prod.productImages = prod.productImages.filter(p => p.image !== im.image);
                                setProduct({ ...prod });
                            };
                            const setGroupSelection = (groupImages, select) => {
                                let prod = { ...product };
                                if (!prod.productImages) prod.productImages = [];
                                const urls = new Set(groupImages.map(g => g.image));
                                if (select) {
                                    const existing = new Set(prod.productImages.map(p => p.image));
                                    for (const g of groupImages) if (!existing.has(g.image)) prod.productImages.push({ image: g.image, color: g.color, blank: prod.blanks[0]._id, sku: g.sku });
                                } else {
                                    prod.productImages = prod.productImages.filter(p => !urls.has(p.image));
                                }
                                setProduct({ ...prod });
                            };
                            const renderGroup = (key, label, color, groupImages) => {
                                const selectedInGroup = groupImages.filter(g => product.productImages?.find(p => p.image === g.image)).length;
                                const allSelected = selectedInGroup === groupImages.length;
                                const showHeader = activeKey === "all" || groupImages.length > 12;
                                return (
                                    <Box key={key} sx={{ marginBottom: 1 }}>
                                        {showHeader && (
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, marginBottom: 0.5, flexWrap: "wrap" }}>
                                                {color?.hexcode && <Box sx={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: color.hexcode, border: "1px solid rgba(0,0,0,0.2)", flexShrink: 0 }} />}
                                                <Typography variant="caption" sx={{ fontWeight: 600, lineHeight: 1 }}>{label}</Typography>
                                                <Chip size="small" label={`${selectedInGroup}/${groupImages.length}`} sx={{ height: 16, fontSize: ".6rem" }} />
                                                <Button size="small" sx={{ textTransform: "none", padding: "0 6px", minHeight: 20, fontSize: ".7rem" }} onClick={() => setGroupSelection(groupImages, !allSelected)}>
                                                    {allSelected ? "Clear" : "Select all"}
                                                </Button>
                                            </Box>
                                        )}
                                        {!showHeader && (
                                            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 0.75, marginBottom: 0.5 }}>
                                                <Button size="small" sx={{ textTransform: "none", padding: "0 6px", minHeight: 20, fontSize: ".7rem" }} onClick={() => setGroupSelection(groupImages, !allSelected)}>
                                                    {allSelected ? "Clear all" : "Select all"}
                                                </Button>
                                            </Box>
                                        )}
                                        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(auto-fill, minmax(72px, 1fr))", sm: "repeat(auto-fill, minmax(84px, 1fr))" }, gap: 0.5 }}>
                                            {groupImages.map((im, j) => (
                                                <ImageTile key={`${im.sku || im.image}-${j}`} image={im} selected={!!product.productImages?.find(p => p.image === im.image)} onClick={() => toggleImage(im)} onZoom={setZoomImage} />
                                            ))}
                                        </Box>
                                    </Box>
                                );
                            };
                            const filterKeys = ["all", ...Object.keys(colorGroups), ...(noColor.length > 0 ? ["__no_color__"] : [])];
                            const activeKey = filterKeys.includes(imageColorFilter) ? imageColorFilter : "all";
                            const groupsToRender = activeKey === "all"
                                ? [...Object.entries(colorGroups).map(([k, v]) => [k, v.color?.name, v.color, v.images]), ...(noColor.length > 0 ? [["__no_color__", "Other", null, noColor]] : [])]
                                : activeKey === "__no_color__"
                                    ? [["__no_color__", "Other", null, noColor]]
                                    : (colorGroups[activeKey] ? [[activeKey, colorGroups[activeKey].color?.name, colorGroups[activeKey].color, colorGroups[activeKey].images]] : []);
                            return (
                                <>
                                    <Typography variant="subtitle1" sx={{ textAlign: "center", fontWeight: 600, marginBottom: 1, color: "text.primary" }}>Select Product Images</Typography>
                                    <Card variant="outlined" sx={{ marginBottom: 1.5, borderRadius: 2, backgroundColor: "#ffffff", borderColor: "rgba(15,23,42,0.08)", boxShadow: "0 1px 2px rgba(15,23,42,0.04)" }}>
                                        <CardContent sx={{ padding: { xs: 1, sm: 1.25 }, "&:last-child": { paddingBottom: { xs: 1, sm: 1.25 } } }}>
                                            <Box sx={{ position: "sticky", top: 0, zIndex: 2, backgroundColor: "#ffffff", paddingBottom: 1, marginBottom: 1, borderBottom: "1px solid rgba(15,23,42,0.06)" }}>
                                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1, marginBottom: 1 }}>
                                                    <Box>
                                                        <Typography variant="subtitle2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>{product.title}</Typography>
                                                        <Typography variant="caption" color="text.secondary">{product.blanks.map(b => b.code).join(" · ")}</Typography>
                                                    </Box>
                                                    <Chip label={`${totalSelected}/${totalAvailable} selected`} color={totalSelected > 0 ? "primary" : "default"} variant="outlined" size="small" />
                                                </Box>
                                                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                                                    <Chip
                                                        size="small"
                                                        label={`All (${totalAvailable})`}
                                                        color={activeKey === "all" ? "primary" : "default"}
                                                        variant={activeKey === "all" ? "filled" : "outlined"}
                                                        onClick={() => setImageColorFilter("all")}
                                                        sx={{ height: 24 }}
                                                    />
                                                    {Object.entries(colorGroups).map(([key, { color, images: groupImages }]) => {
                                                        const sel = groupImages.filter(g => product.productImages?.find(p => p.image === g.image)).length;
                                                        return (
                                                            <Chip
                                                                key={key}
                                                                size="small"
                                                                label={`${color.name} ${sel}/${groupImages.length}`}
                                                                color={activeKey === key ? "primary" : "default"}
                                                                variant={activeKey === key ? "filled" : "outlined"}
                                                                onClick={() => setImageColorFilter(key)}
                                                                avatar={color.hexcode ? <Box sx={{ width: 14, height: 14, borderRadius: "50%", backgroundColor: color.hexcode, border: "1px solid rgba(0,0,0,0.2)" }} /> : undefined}
                                                                sx={{ height: 24 }}
                                                            />
                                                        );
                                                    })}
                                                    {noColor.length > 0 && (
                                                        <Chip
                                                            size="small"
                                                            label={`Other (${noColor.length})`}
                                                            color={activeKey === "__no_color__" ? "primary" : "default"}
                                                            variant={activeKey === "__no_color__" ? "filled" : "outlined"}
                                                            onClick={() => setImageColorFilter("__no_color__")}
                                                            sx={{ height: 24 }}
                                                        />
                                                    )}
                                                </Box>
                                            </Box>
                                            {groupsToRender.map(([key, label, color, groupImages]) => renderGroup(key, label || "Other", color, groupImages))}
                                        </CardContent>
                                    </Card>
                                    <ZoomModal image={zoomImage} onClose={() => setZoomImage(null)} />
                                </>
                            );
                        })()}
                        {product && product.blanks[0] && (
                            <Grid2 container spacing={2} sx={{ justifyContent: "space-between", marginTop: 1.5 }}>
                                <Grid2 size="auto">
                                    <Button variant="outlined" size="large" sx={{ minWidth: 160 }} onClick={() => setStage("Select Colors and Sizes")}>Back</Button>
                                </Grid2>
                                <Grid2 size="auto">
                                    <Button variant="contained" size="large" sx={{ minWidth: 160 }} onClick={() => {
                                        let prod = {...product};
                                        if(!prod.colors?.length) prod.colors = product.blanks[0].colors;
                                        if(!prod.sizes?.length) prod.sizes = product.blanks[0].sizes;
                                        if(!prod.variantsArray) prod.variantsArray = [];
                                        prod.variantsArray = prod.variantsArray.filter(v => prod.colors.find(c => c?._id?.toString() === (v.color?._id ?? v.color)?.toString()) && prod.sizes.find(s => s?.name === (v.size?.name ?? v.size) || s?._id?.toString() === (v.size?._id ?? v.size)?.toString()));
                                        prod.productImages = (prod.productImages || []).filter(im => !im.color || prod.colors.find(c => c?._id?.toString() === (im.color?._id ?? im.color)?.toString()));
                                        for(let color of prod.colors){
                                            for(let size of prod.sizes){
                                                let sku = `${prod.sku}_${color.sku ?? color.name}_${size.sku ?? size.name}`;
                                                if(!prod.variantsArray.filter(v => v.sku === sku)[0]){
                                                    prod.variantsArray.push({
                                                        sku,
                                                        color: color,
                                                        size: size,
                                                        blank: prod.blanks[0],
                                                        price: size.retailPrice,
                                                        compareAtPrice: size.compareAtPrice,
                                                        costPerItem: size.costPerItem,
                                                        weight: size.weight,
                                                        image: "",
                                                        images: [],
                                                    });
                                                }else{
                                                    let variant = prod.variantsArray.filter(v => v.sku === sku)[0];
                                                    variant.color = color;
                                                    variant.size = size;
                                                    variant.blank = prod.blanks[0];
                                                    variant.price = size.retailPrice;
                                                    variant.compareAtPrice = size.compareAtPrice;
                                                    variant.costPerItem = size.costPerItem;
                                                    variant.weight = size.weight;
                                                }
                                            }
                                        }
                                        getUpcs({ blanks: [product.blanks[0]], design: null });
                                        setProduct({...prod});
                                        setStage("Variant Images");
                                    }}>Next</Button>
                                </Grid2>
                            </Grid2>
                        )}
                    </Box>
                )}
                {type === "From Blank" && stage == "Variant Images" && (
                    <Box sx={{ padding: { xs: 1, sm: 1.5 }, background: "linear-gradient(180deg, #f4f6fa 0%, #eceff5 100%)", minHeight: "100%", borderRadius: 2 }}>
                        {(() => {
                            const cdn = (url) => url.replace("https://images1.pythiastechnologies.com", "https://images2.pythiastechnologies.com/origin");
                            const selectedColors = product.colors || [];
                            const blankImages = product.blanks?.[0]?.images || [];
                            const imagesByColor = {};
                            for (const c of selectedColors) {
                                const colorImgs = blankImages
                                    .filter(img => img.color?.toString() === c._id.toString())
                                    .map(img => ({ image: `${cdn(img.image)}?width=400` }));
                                for (const pi of (product.productImages || [])) {
                                    if (pi.color?._id?.toString() === c._id.toString() && !colorImgs.find(x => x.image === pi.image)) {
                                        colorImgs.push({ image: pi.image });
                                    }
                                }
                                imagesByColor[c._id.toString()] = colorImgs;
                            }
                            const setPrimary = (color, url) => {
                                let prod = { ...product };
                                for (const v of prod.variantsArray.filter(v => v.color?._id?.toString() === color._id.toString())) {
                                    if (v.image === url) v.image = "";
                                    else {
                                        v.image = url;
                                        if (v.images) v.images = v.images.filter(i => i !== url);
                                    }
                                }
                                setProduct({ ...prod });
                            };
                            const toggleExtra = (color, url) => {
                                let prod = { ...product };
                                for (const v of prod.variantsArray.filter(v => v.color?._id?.toString() === color._id.toString())) {
                                    if (!v.images) v.images = [];
                                    if (v.image === url) continue;
                                    if (v.images.includes(url)) v.images = v.images.filter(i => i !== url);
                                    else v.images.push(url);
                                }
                                setProduct({ ...prod });
                            };
                            return (
                                <>
                                    <Typography variant="subtitle1" sx={{ textAlign: "center", fontWeight: 600, marginBottom: 0.5, color: "text.primary" }}>Select Variant Images</Typography>
                                    <Typography variant="caption" sx={{ display: "block", textAlign: "center", marginBottom: 1.5, color: "text.secondary" }}>Pick one <b>main</b> image per color, plus any <b>extras</b> for the gallery.</Typography>
                                    <Card variant="outlined" sx={{ marginBottom: 1.5, borderRadius: 2, backgroundColor: "#ffffff", borderColor: "rgba(15,23,42,0.08)", boxShadow: "0 1px 2px rgba(15,23,42,0.04)" }}>
                                        <CardContent sx={{ padding: { xs: 1.25, sm: 1.5 }, "&:last-child": { paddingBottom: { xs: 1.25, sm: 1.5 } } }}>
                                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1, marginBottom: 1.25, position: "sticky", top: 0, zIndex: 1, backgroundColor: "#fff", paddingY: 0.5 }}>
                                                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexWrap: "wrap" }}>
                                                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{product.title}</Typography>
                                                    <Typography variant="caption" color="text.secondary">{product.blanks?.map(b => b.code).join(" · ")}</Typography>
                                                </Box>
                                                <ToggleButtonGroup
                                                    size="small"
                                                    exclusive
                                                    value={primaryImage ? "main" : "extras"}
                                                    onChange={(_, v) => { if (v) setPrimaryImage(v === "main"); }}
                                                    sx={{ "& .MuiToggleButton-root": { textTransform: "none", paddingX: 1.25, paddingY: 0.25, fontSize: ".75rem", lineHeight: 1.2 } }}
                                                >
                                                    <ToggleButton value="main" color="primary">Set Main</ToggleButton>
                                                    <ToggleButton value="extras" color="warning">Add Extras</ToggleButton>
                                                </ToggleButtonGroup>
                                            </Box>
                                            {selectedColors.map(c => {
                                                const tiles = imagesByColor[c._id.toString()] || [];
                                                const variantsForColor = (product.variantsArray || []).filter(v => v.color?._id?.toString() === c._id.toString());
                                                const primaryUrl = variantsForColor[0]?.image || "";
                                                const extras = variantsForColor[0]?.images || [];
                                                return (
                                                    <Box key={c._id} sx={{ marginBottom: 1 }}>
                                                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, marginBottom: 0.75, flexWrap: "wrap" }}>
                                                            {c.hexcode && <Box sx={{ width: 14, height: 14, borderRadius: "50%", backgroundColor: c.hexcode, border: "1px solid rgba(0,0,0,0.2)", flexShrink: 0 }} />}
                                                            <Typography variant="subtitle2" sx={{ fontWeight: 600, lineHeight: 1 }}>{c.name}</Typography>
                                                            <Chip size="small" label={primaryUrl ? "main set" : "no main"} color={primaryUrl ? "primary" : "default"} variant={primaryUrl ? "filled" : "outlined"} sx={{ height: 18, fontSize: ".6rem" }} />
                                                            {extras.length > 0 && <Chip size="small" label={`+${extras.length} extra${extras.length === 1 ? "" : "s"}`} color="warning" variant="outlined" sx={{ height: 18, fontSize: ".6rem" }} />}
                                                        </Box>
                                                        {tiles.length === 0 ? (
                                                            <Box sx={{ padding: 1.5, textAlign: "center", border: "1px dashed", borderColor: "divider", borderRadius: 1 }}>
                                                                <Typography variant="caption" color="text.secondary">No images for this color.</Typography>
                                                            </Box>
                                                        ) : (
                                                            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(96px, 1fr))", gap: 0.5 }}>
                                                                {tiles.map((im, k) => {
                                                                    const isMain = primaryUrl === im.image;
                                                                    const extraIdx = extras.indexOf(im.image);
                                                                    const isExtra = extraIdx >= 0;
                                                                    return (
                                                                        <Box key={`${im.image}-${k}`} onClick={() => primaryImage ? setPrimary(c, im.image) : toggleExtra(c, im.image)} sx={{ position: "relative", aspectRatio: "1 / 1", border: isMain ? "2px solid" : isExtra ? "2px dashed" : "1px solid", borderColor: isMain ? "primary.main" : isExtra ? "warning.main" : "divider", borderRadius: 1, overflow: "hidden", cursor: "pointer", background: tileBackground, display: "flex", alignItems: "center", justifyContent: "center", transition: "border-color 150ms, box-shadow 150ms", "&:hover": { boxShadow: 2, "& .tile-zoom": { opacity: 1 }, "& .tile-img": { transform: "scale(1.18)" } } }}>
                                                                            <img className="tile-img" src={im.image} alt="" loading="lazy" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", transition: "transform 200ms ease-out" }} />
                                                                            {isMain && (
                                                                                <Chip size="small" label="MAIN" color="primary" sx={{ position: "absolute", top: 2, right: 2, height: 18, fontSize: ".6rem", fontWeight: 700, "& .MuiChip-label": { paddingX: 0.75 } }} />
                                                                            )}
                                                                            {isExtra && !isMain && (
                                                                                <Chip size="small" label={`#${extraIdx + 1}`} color="warning" sx={{ position: "absolute", top: 2, right: 2, height: 18, fontSize: ".6rem", fontWeight: 700, "& .MuiChip-label": { paddingX: 0.75 } }} />
                                                                            )}
                                                                            <Tooltip title="Zoom" placement="top" arrow>
                                                                                <IconButton size="small" className="tile-zoom" onClick={(e) => { e.stopPropagation(); setZoomImage({ image: im.image }); }} sx={{ position: "absolute", top: 2, left: 2, padding: 0.25, backgroundColor: "rgba(255,255,255,0.85)", opacity: { xs: 1, md: 0 }, transition: "opacity 150ms", "&:hover": { backgroundColor: "rgba(255,255,255,1)" } }}>
                                                                                    <ZoomInIcon fontSize="small" />
                                                                                </IconButton>
                                                                            </Tooltip>
                                                                        </Box>
                                                                    );
                                                                })}
                                                            </Box>
                                                        )}
                                                    </Box>
                                                );
                                            })}
                                        </CardContent>
                                        <ZoomModal image={zoomImage} onClose={() => setZoomImage(null)} />
                                    </Card>
                                </>
                            );
                        })()}
                        <Grid2 container spacing={2} sx={{ justifyContent: "space-between", marginTop: 1.5 }}>
                            <Grid2 size="auto">
                                <Button variant="outlined" size="large" sx={{ minWidth: 160 }} onClick={() => setStage("Select Images")}>Back</Button>
                            </Grid2>
                            <Grid2 size="auto">
                                <Button variant="contained" size="large" sx={{ minWidth: 160 }} onClick={() => {
                                    let numVariants = product.sizes.length * product.colors.length;
                                    if (numVariants > upcs.length) {
                                        getTempUpcs(numVariants - upcs.length);
                                    }
                                    setStage("Information");
                                }}>Next</Button>
                            </Grid2>
                        </Grid2>
                    </Box>
                )}
                {type === "From Blank" && stage == "Information" && (
                    <Grid2 size={12} sx={{ padding: { xs: 1, sm: 3 } }}>
                        <Typography variant="h6" sx={{ textAlign: "center", marginBottom: 2 }}>Product Information</Typography>
                        <Grid2 container spacing={3} sx={{ marginBottom: 3 }}>
                            <Grid2 size={12}>
                                <Typography variant="h5" sx={{ textAlign: "center", marginBottom: 1 }}>{product.title}</Typography>
                            </Grid2>
                            <Grid2 size={12}>
                                <Card variant="outlined">
                                    <CardContent>
                                        <Typography variant="subtitle1" sx={{ marginBottom: 2, fontWeight: 600 }}>Identity</Typography>
                                        <Grid2 container spacing={2}>
                                            <Grid2 size={12}>
                                                <TextField fullWidth label="Title" variant="outlined" value={product.title || ""} onChange={(e) => {
                                                    let prod = { ...product }
                                                    prod.title = e.target.value
                                                    setProduct({ ...prod })
                                                }} />
                                            </Grid2>
                                            <Grid2 size={12}>
                                                <TextField fullWidth label="Description" multiline minRows={3} variant="outlined" value={product.description || ""} onChange={(e) => {
                                                    let prod = { ...product }
                                                    prod.description = e.target.value
                                                    setProduct({ ...prod })
                                                }} />
                                            </Grid2>
                                            <Grid2 size={{ xs: 12, sm: 6 }}>
                                                <TextField fullWidth type="number" label="Sale (% off)" variant="outlined"
                                                    value={product.salePercent ?? 0}
                                                    helperText="Per-product discount on the storefront (overrides blank compare-at). 0 = no sale."
                                                    onChange={(e) => {
                                                        let prod = { ...product }
                                                        prod.salePercent = Math.max(0, Math.min(100, Number(e.target.value) || 0))
                                                        setProduct({ ...prod })
                                                    }} />
                                            </Grid2>
                                            <Grid2 size={12}>
                                                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 0.5 }}>
                                                    <Typography variant="caption">Tags</Typography>
                                                    <Button size="small" variant="outlined" disabled={generatingTags} startIcon={generatingTags ? <CircularProgress size={14} /> : <AutoFixHighIcon fontSize="small" />} onClick={async () => {
                                                        setGeneratingTags(true)
                                                        try {
                                                            let res = await axios.post("/api/ai", {
                                                                prompt: `Generate 10 product tags for a "${product.title}"${product.blanks?.[0]?.name ? ` (${product.blanks[0].name})` : ""}${product.description ? `. Description: ${product.description}` : ""}${product.brand ? `. Brand: ${product.brand}` : ""}${product.gender ? `. Gender: ${product.gender}` : ""}. Return only JSON {tags:[]}`
                                                            })
                                                            const cleaned = res.data.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
                                                            const { tags } = JSON.parse(cleaned)
                                                            let prod = { ...product }
                                                            const existing = new Set(prod.tags || [])
                                                            prod.tags = [...existing, ...tags.filter(t => !existing.has(t))]
                                                            setProduct({ ...prod })
                                                        } catch (e) {
                                                            console.error(e)
                                                            alert("Failed to generate tags. Please try again.")
                                                        }
                                                        setGeneratingTags(false)
                                                    }}>Generate with AI</Button>
                                                </Box>
                                                <CreatableSelect {...selectMenuPortalProps} isMulti placeholder="Tags" value={(product.tags || []).map(tag => ({ value: tag, label: tag }))} onChange={async (newValue) => {
                                                    let prod = { ...product }
                                                    prod.tags = (newValue || []).map(t => t.value)
                                                    setProduct({ ...prod })
                                                }} />
                                            </Grid2>
                                        </Grid2>
                                    </CardContent>
                                </Card>
                            </Grid2>
                            <Grid2 size={12}>
                                <Card variant="outlined">
                                    <CardContent>
                                        <Typography variant="subtitle1" sx={{ marginBottom: 2, fontWeight: 600 }}>Categorization</Typography>
                                        <Grid2 container spacing={2}>
                                            <Grid2 size={{ xs: 12, sm: 6 }}>
                                                <Typography variant="caption" sx={{ display: "block", marginBottom: .5 }}>Brand</Typography>
                                                <CreatableSelect {...selectMenuPortalProps} placeholder="Select Brand" options={[{ value: null, label: "Select Brand" }, ...localBrands.map(brand => ({ value: brand.name, label: brand.name }))]} value={product.brand ? { value: product.brand, label: product.brand } : null} onChange={async (newValue) => {
                                                    let prod = { ...product }
                                                    prod.brand = newValue.value
                                                    if (newValue.value && !localBrands.find(b => b.name === newValue.value)) {
                                                        let res = await axios.post("/api/admin/brands", { name: newValue.value })
                                                        if (res.data.error) alert(res.data.msg)
                                                        else {
                                                            setLocalBrands(res.data.brands)
                                                            if (setBrands) setBrands(res.data.brands)
                                                        }
                                                    }
                                                    setProduct({ ...prod })
                                                }} />
                                            </Grid2>
                                            <Grid2 size={{ xs: 12, sm: 6 }}>
                                                <Typography variant="caption" sx={{ display: "block", marginBottom: .5 }}>Gender</Typography>
                                                <CreatableSelect {...selectMenuPortalProps} placeholder="Select Gender" options={[{ value: null, label: "Select Gender" }, ...genders.map(gender => ({ value: gender.name, label: gender.name }))]} value={product.gender ? { value: product.gender, label: product.gender } : null} onChange={async (newValue) => {
                                                    let prod = { ...product }
                                                    prod.gender = newValue.value
                                                    if (newValue.value && !genders.filter(s => s.name == newValue.value)[0]) {
                                                        let res = await axios.post("/api/admin/oneoffs", { type: "gender", value: newValue.value })
                                                        if (res.data && res.data.error) alert(res.data.msg)
                                                        else setGenders(res.data.genders)
                                                    }
                                                    setProduct({ ...prod })
                                                }} />
                                            </Grid2>
                                        </Grid2>
                                    </CardContent>
                                </Card>
                            </Grid2>

                            {markets.map((market, k) => {
                                if (!(market.productDropDowns && Object.keys(market.productDropDowns).length > 0)) return null;
                                return (
                                    <Grid2 key={k} size={12}>
                                        <Card variant="outlined">
                                            <CardContent>
                                                <Typography variant="subtitle1" sx={{ marginBottom: 2, fontWeight: 600 }}>Marketplace · {market.name}</Typography>
                                                <Grid2 container spacing={2}>
                                                    {Object.keys(market.productDropDowns).map((category, l) => {
                                                        if (category !== "titleGenerator") return null;
                                                        const generated = (market.productDropDowns[category].prompt || "")
                                                            .replace("{design}", product.title || "")
                                                            .replace("{brand}", product.brand || "")
                                                            .replace("{season}", product.season || "")
                                                            .replace("{gender}", product.gender || "")
                                                            .replace("{theme}", product.theme || "")
                                                            .replace("{sportUsedFor}", product.sportUsedFor || "")
                                                            .replace("{blank}", product.blanks?.[0]?.name || "");
                                                        const current = product.marketplaceValues?.[market._id]?.[category] ?? generated;
                                                        return (
                                                            <Grid2 key={l} size={12}>
                                                                <TextField fullWidth label="Product Title" variant="outlined" value={current} onChange={(e) => {
                                                                    let prod = { ...product }
                                                                    if (!prod.marketplaceValues) prod.marketplaceValues = {}
                                                                    if (!prod.marketplaceValues[market._id]) prod.marketplaceValues[market._id] = {}
                                                                    prod.marketplaceValues[market._id].name = market.name
                                                                    prod.marketplaceValues[market._id][category] = e.target.value
                                                                    setProduct({ ...prod })
                                                                }} />
                                                            </Grid2>
                                                        );
                                                    })}
                                                    {Object.keys(market.productDropDowns).map((category, l) => {
                                                        if (category === "titleGenerator" || category === "required") return null;
                                                        const current = product.marketplaceValues?.[market._id]?.[category];
                                                        return (
                                                            <Grid2 key={l} size={{ xs: 12, sm: 4 }}>
                                                                <CreatableSelect {...selectMenuPortalProps} placeholder={`Select ${category}`} value={current ? { value: current, label: current } : null} options={[{ value: null, label: `Select ${category}` }, ...(market.productDropDowns[category] || []).map(option => ({ value: option, label: option }))]} onChange={async (newValue) => {
                                                                    let prod = { ...product }
                                                                    if (!prod.marketplaceValues) prod.marketplaceValues = {}
                                                                    if (!prod.marketplaceValues[market._id]) prod.marketplaceValues[market._id] = {}
                                                                    prod.marketplaceValues[market._id].name = market.name
                                                                    if (newValue.value == null || (market.productDropDowns[category] || []).filter(o => o == newValue.value)[0]) {
                                                                        prod.marketplaceValues[market._id][category] = newValue.value
                                                                    }
                                                                    setProduct({ ...prod })
                                                                }} />
                                                                <Typography variant="caption" color="#c73333">{market.required && market.required[category] == true ? "Required" : "Recommended"}</Typography>
                                                            </Grid2>
                                                        );
                                                    })}
                                                </Grid2>
                                            </CardContent>
                                        </Card>
                                    </Grid2>
                                );
                            })}
                        </Grid2>
                        <Grid2 container spacing={2} sx={{ padding: "2%", justifyContent: "space-between" }}>
                            <Grid2 size="auto">
                                <Button variant="outlined" size="large" sx={{ minWidth: 160 }} onClick={() => setStage("Variant Images")}>Back</Button>
                            </Grid2>
                            <Grid2 size="auto">
                                <Button variant="contained" size="large" sx={{ minWidth: 160 }} onClick={() => {
                                    let prod = { ...product };
                                    for (let v of prod.variantsArray) {
                                        let upc = upcs.filter(u => u.sku === v.sku)[0];
                                        if (!upc) upc = upcs.filter(u => u.sku === `${product.sku}_${v.color.name}_${v.size.name}`)[0];
                                        if (!upc) upc = upcs.filter(u => u.blank._id.toString() === v.blank._id.toString() && u.color._id.toString() === v.color._id.toString() && u.size.toString() === v.size.name.toString())[0];
                                        if (upc) {
                                            v.upc = upc.upc;
                                            v.gtin = upc.gtin;
                                        } else {
                                            upc = tempUpcs.filter(u => u.used != true)[0]
                                            if (upc) {
                                                v.upc = upc.upc;
                                                v.gtin = upc.gtin;
                                                tempUpcs.filter(u => u.used != true)[0].used = true
                                            }
                                        }
                                    }
                                    setProduct({ ...prod });
                                    setStage("Preview");
                                }}>Next</Button>
                            </Grid2>
                        </Grid2>
                    </Grid2>
                )}
                {type === "From Blank" && stage == "Preview" && (
                    <Box sx={{ padding: { xs: 2, sm: 3 }, maxWidth: 1200, margin: "0 auto" }}>
                        <Typography variant="h5" sx={{ textAlign: "center", fontWeight: 600, marginBottom: 3 }}>Preview</Typography>
                        <Card variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
                            <CardContent sx={{ padding: { xs: 2, sm: 3 } }}>
                                <Typography variant="h5" sx={{ textAlign: "center", fontWeight: 600, marginBottom: 2 }}>{product.title}</Typography>
                                <ProductImageCarosel productImages={product.productImages} defaultColor={product.defaultColor} />

                                <Card variant="outlined" sx={{ marginTop: 3, backgroundColor: "background.default" }}>
                                    <CardContent>
                                        <Typography variant="subtitle1" sx={{ marginBottom: 2, fontWeight: 600 }}>Details</Typography>
                                        <Grid2 container spacing={2}>
                                            <Grid2 size={{ xs: 12, sm: 6, md: 3 }}>
                                                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
                                                    <Typography variant="caption" sx={{ color: "text.secondary", textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600 }}>SKU</Typography>
                                                    <Typography variant="body2">{product.sku || "—"}</Typography>
                                                </Box>
                                            </Grid2>
                                            <Grid2 size={{ xs: 12, sm: 6, md: 3 }}>
                                                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
                                                    <Typography variant="caption" sx={{ color: "text.secondary", textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600 }}>Brand</Typography>
                                                    <Typography variant="body2">{product.brand || "—"}</Typography>
                                                </Box>
                                            </Grid2>
                                            {product.gender && <Grid2 size={{ xs: 12, sm: 6, md: 3 }}>
                                                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
                                                    <Typography variant="caption" sx={{ color: "text.secondary", textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600 }}>Gender</Typography>
                                                    <Typography variant="body2">{product.gender}</Typography>
                                                </Box>
                                            </Grid2>}
                                            <Grid2 size={{ xs: 12, sm: 6, md: 3 }}>
                                                <Typography variant="caption" sx={{ color: "text.secondary", textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600, display: "block", marginBottom: 0.5 }}>Default Color</Typography>
                                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                    {product.defaultColor?.hexcode && <Box sx={{ width: 16, height: 16, borderRadius: "50%", backgroundColor: product.defaultColor.hexcode, border: "1px solid rgba(0,0,0,0.2)" }} />}
                                                    <Typography variant="body2">{product.defaultColor?.name || "—"}</Typography>
                                                </Box>
                                            </Grid2>
                                            <Grid2 size={12}>
                                                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
                                                    <Typography variant="caption" sx={{ color: "text.secondary", textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600 }}>Description</Typography>
                                                    <Typography variant="body2">{product.description || "—"}</Typography>
                                                </Box>
                                            </Grid2>
                                            <Grid2 size={12}>
                                                <Typography variant="caption" sx={{ color: "text.secondary", textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600, display: "block", marginBottom: 0.75 }}>Tags</Typography>
                                                {product.tags && product.tags.length > 0 ? (
                                                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                                                        {product.tags.map((tag, i) => <Chip key={i} label={tag} size="small" />)}
                                                    </Box>
                                                ) : <Typography variant="body2" color="text.secondary">—</Typography>}
                                            </Grid2>
                                        </Grid2>
                                    </CardContent>
                                </Card>

                                {product.marketplaceValues && Object.keys(product.marketplaceValues).length > 0 && (
                                    <Card variant="outlined" sx={{ marginTop: 2, backgroundColor: "background.default" }}>
                                        <CardContent>
                                            <Typography variant="subtitle1" sx={{ marginBottom: 2, fontWeight: 600 }}>Marketplaces</Typography>
                                            <Stack spacing={2} divider={<Divider flexItem />}>
                                                {Object.keys(product.marketplaceValues).map(marketplaceId => {
                                                    const marketplace = product.marketplaceValues[marketplaceId];
                                                    const entries = Object.keys(marketplace).filter(k => k !== "name");
                                                    return (
                                                        <Box key={marketplaceId}>
                                                            <Chip label={marketplace.name} size="small" color="primary" sx={{ marginBottom: 1.5, fontWeight: 600 }} />
                                                            <Grid2 container spacing={1.5}>
                                                                {entries.map(category => (
                                                                    <Grid2 key={category} size={{ xs: 12, sm: 6, md: 4 }}>
                                                                        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
                                                                            <Typography variant="caption" sx={{ color: "text.secondary", textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600 }}>{category}</Typography>
                                                                            <Typography variant="body2" sx={{ wordBreak: "break-word" }}>{marketplace[category] || "—"}</Typography>
                                                                        </Box>
                                                                    </Grid2>
                                                                ))}
                                                            </Grid2>
                                                        </Box>
                                                    );
                                                })}
                                            </Stack>
                                        </CardContent>
                                    </Card>
                                )}

                                <Box sx={{ marginTop: 3 }}>
                                    <Typography variant="subtitle1" sx={{ marginBottom: 1.5, fontWeight: 600 }}>Variants</Typography>
                                    {product._id && <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "flex-end", marginBottom: 1 }}>
                                        <Button size="small" onClick={async () => {
                                            let res = await axios.post("/api/admin/inventory/product", { productId: product._id });
                                            if (res?.data?.product) setProduct(res.data.product);
                                        }}>Add Product Inventory</Button>
                                    </Box>}
                                    {product.colors.map(color => {
                                        const variants = product.variantsArray.filter(v => v.blank._id.toString() === product.blanks[0]._id.toString() && v.color._id.toString() === color._id.toString());
                                        return variants.length > 0 ? (
                                            <VariantDisplay key={`${product.blanks[0].code}-${color._id}`} blank={product.blanks[0].code} color={color.name} variants={variants} fullBlank={product.blanks[0]} product={product} setProduct={setProduct} />
                                        ) : null;
                                    })}
                                </Box>
                            </CardContent>
                        </Card>
                        <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "space-between", gap: 2, marginTop: 2 }}>
                            <Button fullWidth variant="outlined" onClick={() => setStage("Information")}>Back</Button>
                            <Button fullWidth variant="contained" disabled={loading} onClick={async () => {
                                setLoading(true)
                                let res = await axios.post("/api/admin/products", { products: [product] });
                                setLoading(false);
                                if (res.data.error) alert(res.data.msg)
                                else {
                                    setOpen(false);
                                    setProduct({ blanks: [], colors: [], productImages: [], variantsArray: [] });
                                    setStage("Select Blank");
                                }
                            }}>{loading ? "Saving..." : (product?._id ? "Save Changes" : "Create")}</Button>
                        </Box>
                    </Box>
                )}
                {type === "Other" && (
                    <Box>
                        <Box sx={{ textAlign: "center", marginBottom: 1.5 }}>
                            <Button variant="outlined" startIcon={<TravelExploreIcon />} onClick={() => setSourcingOpen(true)}>Find wholesale products to sell</Button>
                            {imported && <Typography variant="caption" sx={{ display: "block", marginTop: 0.5, color: "success.main" }}>Imported &ldquo;{imported.title?.slice(0, 50)}&rdquo; — set your price below and create.</Typography>}
                        </Box>
                        <CatalogProductCreate
                            key={importKey}
                            initial={imported}
                            onSaved={() => { setProduct({ blanks: [], colors: [], productImages: [], variantsArray: [] }); setStage("Select Blank"); setImported(null); setOpen(false); }}
                            onCancel={() => { setProduct({ blanks: [], colors: [], productImages: [], variantsArray: [] }); setStage("Select Blank"); setImported(null); setOpen(false); }}
                        />
                        <SourcingBrowser open={sourcingOpen} onClose={() => setSourcingOpen(false)} onImport={(prod) => { setImported(prod); setImportKey((k) => k + 1); setSourcingOpen(false); }} />
                    </Box>
                )}
            </Box>
        </Modal>
        {loading && <LoaderOverlay />}
        </>
    );
}
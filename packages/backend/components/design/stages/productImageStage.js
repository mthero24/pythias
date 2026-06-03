import { Box, Grid2, Button, Typography, Checkbox, Modal, Card, CardContent, Chip, Stack, IconButton, Tooltip, Select, MenuItem, FormControl, InputLabel } from "@mui/material";
import CreatableSelect from "react-select/creatable";
import { Uploader } from "../../reusable/premier/uploader";
import { useState, useEffect } from "react";
import CloseIcon from '@mui/icons-material/Close';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import { RetryImage } from "./RetryImage";

const tileBackground = "radial-gradient(ellipse at center, #ffffff 0%, #eef0f3 100%)";

const ImageTile = ({ image, selected, onClick, onZoom }) => (
    <Box onClick={onClick} sx={{ position: "relative", aspectRatio: "1 / 1", border: selected ? "2px solid" : "1px solid", borderColor: selected ? "primary.main" : "divider", borderRadius: 1, overflow: "hidden", cursor: "pointer", background: tileBackground, display: "flex", alignItems: "center", justifyContent: "center", transition: "border-color 150ms, box-shadow 150ms", "&:hover": { boxShadow: 2, "& .tile-zoom": { opacity: 1 } } }}>
        <RetryImage src={image.image} alt={image.sku || ""} loading="lazy" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
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
        {image.threadColor?.name && (
            <Chip size="small" label={image.threadColor.name} sx={{ position: "absolute", bottom: 2, right: 2, height: 16, fontSize: ".6rem", backgroundColor: "rgba(255,255,255,0.85)", "& .MuiChip-label": { paddingX: 0.75 } }} />
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
                <RetryImage src={image.image?.replace("?width=400", "?width=1200")} alt={image.sku || ""} style={{ maxWidth: "88vw", maxHeight: "88vh", objectFit: "contain", display: "block" }} />
            )}
            {image?.sku && (
                <Box sx={{ position: "absolute", bottom: 8, left: 8, right: 8, display: "flex", justifyContent: "center", pointerEvents: "none" }}>
                    <Chip size="small" label={image.sku} sx={{ backgroundColor: "rgba(0,0,0,0.65)", color: "#fff", maxWidth: "100%", "& .MuiChip-label": { whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } }} />
                </Box>
            )}
        </Box>
    </Modal>
);

export const ProductImageStage = ({ products, setProducts, setStage, design, source, images, setImages, imageGroups }) => {
    const [imageOpen, setImageOpen] = useState(false)
    const [reload, setReload] = useState(false)
    const [prod, setProd] = useState(null)
    const [zoomImage, setZoomImage] = useState(null)
    useEffect(() => {
        if (!reload) setReload(!reload)
    }, [reload])
    return (
        <Box sx={{ padding: { xs: 1, sm: 1.5 }, background: "linear-gradient(180deg, #f4f6fa 0%, #eceff5 100%)", minHeight: "100%", borderRadius: 2 }}>
            <Typography variant="subtitle1" sx={{ textAlign: "center", fontWeight: 600, marginBottom: 1.5, color: "text.primary" }}>Select Product Images</Typography>
            {products.map((product, i) => {
                const normUrl = url => url ? url.replace(/^https?:\/\/[^/]+/, "").replace(/%7D/gi, "").replace(/\?.*$/, "").replace(/\.jpg$/i, "") : url;
                const imgMatch = (a, b) => { const na = normUrl(a), nb = normUrl(b); return na === nb || nb.startsWith(na + "-") || na.startsWith(nb + "-"); };
                const productImageGroups = [...new Set(product.blanks.flatMap(b => (b.images || []).map(img => img.imageGroup || "default")))];
                const allImages = [...(images[product.id] || []), ...(product.tempImages || [])];
                const groups = {};
                const noColor = [];
                for (const img of allImages) {
                    const colorKey = img.color?._id?.toString() || img.color?.name;
                    if (colorKey) {
                        if (!groups[colorKey]) groups[colorKey] = { color: img.color, images: [] };
                        groups[colorKey].images.push(img);
                    } else {
                        noColor.push(img);
                    }
                }
                const isSelected = (storedImg, candidateImg) => imgMatch(storedImg.image, candidateImg.image);
                const totalSelected = product.productImages.length;
                const totalAvailable = allImages.length;
                const toggleImage = (i) => {
                    let prods = [...products];
                    let p = prods.filter(p => p.id == product.id)[0];
                    if (!p.productImages.find(img => isSelected(img, i))) p.productImages.push(i);
                    else p.productImages = p.productImages.filter(img => !isSelected(img, i));
                    setProducts([...prods]);
                };
                const setGroupSelection = (groupImages, select) => {
                    let prods = [...products];
                    let p = prods.filter(p => p.id == product.id)[0];
                    if (select) {
                        for (const g of groupImages) {
                            if (!p.productImages.find(im => isSelected(im, g))) p.productImages.push(g);
                        }
                    } else {
                        p.productImages = p.productImages.filter(im => !groupImages.find(g => isSelected(im, g)));
                    }
                    setProducts([...prods]);
                };
                const renderGroup = (key, label, color, groupImages) => {
                    const selectedInGroup = groupImages.filter(g => product.productImages.find(im => isSelected(im, g))).length;
                    const allSelected = selectedInGroup === groupImages.length;
                    return (
                        <Box key={key} sx={{ marginBottom: 1.5 }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, marginBottom: 0.75, flexWrap: "wrap" }}>
                                {color?.hexcode && <Box sx={{ width: 14, height: 14, borderRadius: "50%", backgroundColor: color.hexcode, border: "1px solid rgba(0,0,0,0.2)", flexShrink: 0 }} />}
                                <Typography variant="subtitle2" sx={{ fontWeight: 600, lineHeight: 1 }}>{label}</Typography>
                                <Chip size="small" label={`${selectedInGroup}/${groupImages.length}`} sx={{ height: 18, fontSize: ".65rem" }} />
                                <Button size="small" sx={{ textTransform: "none", padding: "0 6px", minHeight: 22, fontSize: ".75rem" }} onClick={() => setGroupSelection(groupImages, !allSelected)}>
                                    {allSelected ? "Clear" : "Select all"}
                                </Button>
                            </Box>
                            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(96px, 1fr))", gap: 0.5 }}>
                                {groupImages.map((img, j) => (
                                    <ImageTile key={`${img.sku || img.image}-${j}`} image={img} selected={!!product.productImages.find(im => isSelected(im, img))} onClick={() => toggleImage(img)} onZoom={setZoomImage} />
                                ))}
                            </Box>
                        </Box>
                    );
                };
                return (
                    <Card key={i} variant="outlined" sx={{ marginBottom: 1.5, borderRadius: 2, backgroundColor: "#ffffff", borderColor: "rgba(15,23,42,0.08)", boxShadow: "0 1px 2px rgba(15,23,42,0.04)" }}>
                        <CardContent sx={{ padding: { xs: 1.25, sm: 1.5 }, "&:last-child": { paddingBottom: { xs: 1.25, sm: 1.5 } } }}>
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1, marginBottom: 1.5 }}>
                                <Box>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>{product.design?.sku}</Typography>
                                    <Typography variant="caption" color="text.secondary">{product.blanks.map(b => b.code).join(" · ")}</Typography>
                                </Box>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                    {productImageGroups.length > 1 && (
                                        <FormControl size="small" sx={{ minWidth: 110 }}>
                                            <InputLabel sx={{ fontSize: "0.75rem" }}>Theme</InputLabel>
                                            <Select
                                                value={product.imageGroup || "default"}
                                                label="Theme"
                                                sx={{ fontSize: "0.75rem" }}
                                                onChange={e => {
                                                    let prods = [...products];
                                                    prods.find(p => p.id === product.id).imageGroup = e.target.value;
                                                    setProducts([...prods]);
                                                }}
                                            >
                                                {productImageGroups.map(g => <MenuItem key={g} value={g} sx={{ fontSize: "0.75rem" }}>{g}</MenuItem>)}
                                            </Select>
                                        </FormControl>
                                    )}
                                    <Chip label={`${totalSelected}/${totalAvailable} selected`} color={totalSelected > 0 ? "primary" : "default"} variant="outlined" size="small" />
                                    <Button variant="contained" size="small" startIcon={<AddPhotoAlternateIcon />} sx={{ textTransform: "none" }} onClick={() => { setImageOpen(true); setProd(product); }}>Add Image</Button>
                                </Box>
                            </Box>
                            {Object.entries(groups).map(([key, { color, images: groupImages }]) => renderGroup(key, color.name, color, groupImages))}
                            {noColor.length > 0 && renderGroup("__no_color__", "Other", null, noColor)}
                        </CardContent>
                    </Card>
                );
            })}
            <AddImageModal open={imageOpen} setOpen={setImageOpen} des={design} setDesign={() => {}} updateDesign={() => {}} colors={prod?.colors} reload={reload} setReload={setReload} threadColors={prod?.threadColors} product={prod} products={products} setProducts={setProducts} />
            <ZoomModal image={zoomImage} onClose={() => setZoomImage(null)} />
            <Grid2 container spacing={2} sx={{ justifyContent: "space-between", marginTop: 1.5 }}>
                <Grid2 size="auto">
                    <Button variant="outlined" size="large" sx={{ minWidth: 160 }} onClick={() => { setStage("colors") }}>Back</Button>
                </Grid2>
                <Grid2 size="auto">
                    <Button variant="contained" size="large" sx={{ minWidth: 160 }} onClick={() => { setStage("variant_images") }}>Next</Button>
                </Grid2>
            </Grid2>
        </Box>
    )
}

const AddImageModal = ({ open, setOpen, reload, setReload, setLoading, product, products, setProducts }) => {
    console.log(product, "product in AddImageModal")
    const [location, setLocation] = useState("front")
    const [threadColor, setThreadColor] = useState(null)
    const [color, setColor] = useState(null)
    const style = {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: "30%",
        height: "70vh",
        bgcolor: 'background.paper',
        border: '2px solid #000',
        boxShadow: 24,
        p: 4,
        overflow: "auto"
    };
    const updateImage = async ({ url, threadColor, color }) => {
        console.log(url, "url in updateImage")
        console.log(products, "products in updateImage")
        let prods = [...products]
        let p = prods.filter(p => p.id == product.id)[0]
        if(!p.tempImages) p.tempImages = []
        p.tempImages.push({ image: url, threadColor: threadColor, color: color, })
        setProducts([...prods])
        setReload(true)
    }
    return (
        product && <Modal
            open={open}
            onClose={() => { setOpen(false); setBlank(null); setUpc([]); setColor(null); setThreadColor(null) }}
            aria-labelledby="modal-modal-title"
            aria-describedby="modal-modal-description"
        >
            <Box sx={style}>
                <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "flex-end", alignItems: "center", padding: "1%", cursor: "pointer", "&:hover": { opacity: .6 } }} onClick={() => { setOpen(false); setBlank(null); setUpc([]); setColor(null); setThreadColor(null) }}>
                    <CloseIcon sx={{ color: "#780606" }} />
                </Box>
                <Typography textAlign={"center"}>Upload Images</Typography>
                <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "1%", }}>
                    {reload && <Uploader location={location} threadColor={threadColor} color={color} afterFunction={updateImage} setLoading={setLoading} setOpen={setOpen} />}
                    <Box sx={{ width: "100%", padding: "2%" }}>
                        <CreatableSelect
                            placeholder="Color"
                            options={[...product?.colors?.map(p => { return { value: p, label: p.name } }) ]}
                            value={color ? { value: color, label: color.name } : null}
                            onChange={(vals) => {
                                console.log(color, vals.value)
                                setColor(vals.value)
                                setReload(false)
                            }}
                        />
                        <CreatableSelect
                            placeholder="Thread Color"
                            options={[...product?.threadColors?.map(p => { return { value: p, label: p.name } })]}
                            value={threadColor ? { value: threadColor, label: threadColor.name } : null}
                            onChange={(vals) => {
                                console.log(threadColor, vals.value)
                                setThreadColor(vals.value)
                                setReload(false)
                            }}
                        />
                    </Box>
                </Box>
            </Box>
        </Modal>
    )
}
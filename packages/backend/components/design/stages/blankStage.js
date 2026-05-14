import { Box, Grid2, Button, Typography, Divider, FormControlLabel, Checkbox, Chip, ToggleButton, ToggleButtonGroup, Stack, Card, CardActionArea } from "@mui/material";
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import { useState } from "react";
import { RetryImage } from "./RetryImage";

export const BlankStage = ({products, setProducts, setStage, blanks, design, source, combined, setCombined, colors, sizes, setSizes, cols, setColors, getUpcs, showToast})=>{
    const [department, setDepartment] = useState(null)
    const [category, setCategory] = useState(null)
    const [departments] = useState(blanks.map(b => b.department).filter((value, index, self) => value && self.indexOf(value) === index))
    const [categories] = useState(blanks.map(b => b.category[0]).filter((value, index, self) => value && self.indexOf(value) === index))
    return (
        <Box sx={{ padding: { xs: 1.5, sm: 2 } }}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ xs: "stretch", md: "center" }} justifyContent="space-between" sx={{ marginBottom: 2 }}>
                <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, lineHeight: 1.2 }}>Select Blanks</Typography>
                    <Typography variant="caption" color="text.secondary">Pick one or more blanks for this product.</Typography>
                </Box>
                <ToggleButtonGroup
                    exclusive
                    size="small"
                    value={combined ? "combined" : "single"}
                    onChange={(_, val) => { if (val !== null) { setCombined(val === "combined"); setProducts([]); } }}
                >
                    <ToggleButton value="single" sx={{ textTransform: "none", paddingX: 2 }}>Single Products</ToggleButton>
                    <ToggleButton value="combined" sx={{ textTransform: "none", paddingX: 2 }}>Combined Product</ToggleButton>
                </ToggleButtonGroup>
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
            {blanks.filter(b => b.active && (department ? b.department === department : true) && (category ? b.category[0] === category : true)).map(b => {
                let designImages = Object.keys(design.images ? design.images : {})
                let styleImages = []
                let color;
                if(b.images && b.images.length > 0){
                   // console.log(designImages, "design images")
                    if(!color) color = b.images[0].color
                    for(let im of b.images){
                        //console.log(Object.keys(im.boxes? im.boxes: {}), designImages.join("-"), "checking image boxes")
                        if (Object.keys(im.boxes ? im.boxes : {}).filter(e => designImages.includes(e)).length > 0){
                            styleImages.push({ blankImage: im, designImages: design.images, sides: designImages.join("_"), colorName: colors.filter(c => c._id.toString() == color.toString())[0]?.name })
                            break;
                        }
                    }
                }else{
                    for (let di of designImages) {
                        if (di != null) {
                            if (b.multiImages && b.multiImages[di] && b.multiImages[di].length > 0) {
                                if (!color) {
                                    color = b.multiImages[di][0].color
                                    if (b.multiImages[di].filter(i => i.color.toString() == color.toString())[0] && b.multiImages[di].filter(i => i.color.toString() == color.toString())[0] != null) {
                                        styleImages.push({ blankImage: b.multiImages[di][0], designImage: design.images[di], side: di, colorName: colors.filter(c => c._id.toString() == color.toString())[0]?.name })
                                    }
                                } else {
                                    if (b.multiImages[di].filter(i => i.color.toString() == color.toString())[0] && b.multiImages[di].filter(i => i.color.toString() == color.toString())[0] != null) {
                                        styleImages.push({ blankImage: b.multiImages[di].filter(i => i.color.toString() == color.toString())[0], designImage: design.images[di], side: di, colorName: colors.filter(c => c._id.toString() == color.toString())[0]?.name })
                                    }
                                }
                            }
                        }
                    }
                }
                //console.log(styleImages, "Style images for blank", b.code);
                if (styleImages.length == 0 ) {
                        console.log("No style images found for blank", b.code);
                    return null;
                }
                return (
                    <Grid2 size={{ xs: 6, sm: 4, md: 3, lg: 2 }} key={b._id}>
                        {(() => {
                            const selected = products.filter(p => p.blanks.filter(blank => blank._id.toString() == b?._id?.toString())[0] != undefined).length > 0;
                            const premium = !!(design.blanks.filter(d => (d.blank._id ? d.blank._id : d.blank).toString() == b._id.toString())[0]?.colors?.length);
                            return (
                        <Card variant="outlined" sx={{ borderRadius: 2, borderColor: selected ? "primary.main" : "divider", borderWidth: selected ? 2 : 1, position: "relative", transition: "border-color 150ms, box-shadow 150ms", "&:hover": { boxShadow: 2 } }}>
                            <CardActionArea onClick={() => {
                        if(combined){
                            let p = {...products[0]}
                            if(!p.blanks) p.blanks = []
                            if(!p.sizes) p.sizes = []
                            if(!p.threadColors) p.threadColors = []
                            if(!p.productImages) p.productImages = []
                            if(!p.design) p.design = design
                            if(!p.colors) p.colors = []
                            if (p.blanks.filter(blank => blank?._id?.toString() == b?._id?.toString())[0]) {
                                p.blanks = p.blanks.filter(blank => blank?._id.toString() != b._id.toString())
                            } else {
                                p.blanks.push(b)
                            }
                            setProducts([{...p}])
                        }else{
                            let newProducts = [...products]
                            let product = newProducts.filter(p => p.blanks.filter(blank => blank?._id?.toString() == b?._id?.toString())[0])[0]
                            if (product) {
                                product.blanks = product.blanks.filter(blank => blank?._id.toString() != b?._id.toString())
                                if (product.blanks.length == 0) {
                                    newProducts = newProducts.filter(p => p.blanks.filter(blank => blank?._id.toString() != b?._id.toString())[0])
                                }
                            } else {
                                product = { blanks: [b], design: design, colors: [], sizes: [], threadColors: [], productImages: []}
                                newProducts.push(product)
                            }
                            setProducts(newProducts)
                        }
                            }}>
                                <Box sx={{ position: "absolute", top: 4, right: 4, zIndex: 2 }}>
                                    <Checkbox size="small" checked={selected} sx={{ padding: 0.5, backgroundColor: "rgba(255,255,255,0.7)", borderRadius: 1, "&:hover": { backgroundColor: "rgba(255,255,255,0.9)" } }} />
                                </Box>
                                {premium && (
                                    <Box sx={{ position: "absolute", top: 4, left: 4, zIndex: 2 }}>
                                        <WorkspacePremiumIcon sx={{ color: "#FFD700", fontSize: "1.5rem", filter: "drop-shadow(0 0 2px rgba(0,0,0,0.4))" }} />
                                    </Box>
                                )}
                                <Box sx={{ aspectRatio: "1 / 1", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "background.default", padding: 1 }}>
                                    {styleImages.map((si, i) => (
                                        <RetryImage key={i} src={`https://${source.includes("test") ? "test" : source}.pythiastechnologies.com/api/renderImages/${design.sku}-${b.code?.replace(/-/g, "_")}-${si.blankImage?.image.split("/")[si.blankImage?.image.split("/").length - 1].split(".")[0]}-${si.colorName?.replace(/\//g, "_")}-${si.side? si.side: si.sides}.jpg}?width=400`} alt={`${b.code} image`} style={{ maxWidth: `${100 / styleImages.length}%`, maxHeight: "100%", objectFit: "contain" }} />
                                    ))}
                                </Box>
                                <Divider />
                                <Box sx={{ padding: 1 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={`${b.name} - ${b.code}`}>{b.name}</Typography>
                                    <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "block" }}>{b.code}</Typography>
                                </Box>
                            </CardActionArea>
                        </Card>
                            );
                        })()}
                    </Grid2>
                )
            })}
            </Grid2>
            <Box sx={{ display: "flex", justifyContent: "flex-end", marginTop: 2 }}>
                <Button variant="contained" size="large" sx={{ minWidth: 160 }} onClick={() => {
                    if(products.length == 0) {
                        showToast?.("Please select at least one blank to continue.", "warning");
                        return;
                    }else{
                        let prods = [...products]
                        let colorsByProduct = {}
                        let sizesByProduct = {}
                        for (let p of prods){
                            p.id = p._id? p._id.toString() : p.id || Math.random().toString(36).substring(2, 15);
                            if(p.blanks.length == 0) {
                                showToast?.("Please select at least one blank.", "warning");
                                return;
                            }else{
                                let col = { ...cols }
                                let size = { ...sizes }
                                let colors = []
                                let siz = []
                                for (let b of p.blanks) {
                                    console.log(b.hiddenColors, "checking hidden colors for blank", b.code)
                                    for (let color of b.colors) {
                                        if(b.hiddenColors && b.hiddenColors.includes(color._id.toString())){
                                            continue;
                                        }
                                        else if (!colors.filter(c => c._id.toString() == color._id.toString())[0]) {
                                            colors.push(color)
                                        }
                                    }
                                    for (let s of b.sizes) {
                                       //console.log(s.hidden, "checking if size is hidden")
                                        if (!s.hidden) {
                                            if (!siz.filter(si => s.name == si.name)[0]) siz.push(s)
                                        }
                                    }
                                }
                                colorsByProduct[p.id] = colors
                                sizesByProduct[p.id] = siz
                                let newProductColors = [];
                                for (let c of p.colors) {
                                    if (colors.filter(co => co._id.toString() == c._id.toString())[0]) {
                                        newProductColors.push(c)
                                    }
                                }
                                p.sizes = siz
                                p.colors = newProductColors
                                console.log(p.sizes, "sizes for product", p.id)
                            }
                        }
                        setColors({...colorsByProduct})
                        setSizes({...sizesByProduct})
                        if (source == "simplysage") {
                            let blanks = []
                            for (let p of prods) {
                                for (let b of p.blanks) {
                                    if (!blanks.filter(bl => bl._id.toString() == b._id.toString())[0]) {
                                        blanks.push(b)
                                    }
                                }
                            }
                            getUpcs({ blanks, design })
                        }
                        let previousColors = []
                        for(let prod of prods){
                            for(let b of prod.blanks){
                               // console.log(design.blanks.map(b=> b.blank._id) )
                                if (design.blanks.filter(d => (d.blank._id ? d.blank._id : d.blank).toString() == b._id.toString())[0]){
                                    previousColors = design.blanks.filter(d => (d.blank._id ? d.blank._id : d.blank).toString() == b._id.toString())[0].colors
                                    console.log("Found design for blank", b._id.toString(), "in design", design._id.toString());
                                }
                            }
                        }
                        //console.log(previousColors)
                        setProducts([...prods])
                        setStage("colors")
                    }
                }}>Next</Button>
            </Box>
        </Box>
    )
}
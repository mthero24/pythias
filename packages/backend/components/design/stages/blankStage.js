import { Box, Grid2, Button, Typography, Divider, FormControlLabel, Checkbox } from "@mui/material";
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import { set } from "mongoose";

export const BlankStage = ({products, setProducts, setStage, blanks, design, source, combined, setCombined, colors, sizes, setSizes, cols, setColors, getUpcs})=>{
    return (
        <Grid2 container spacing={2} sx={{ marginBottom: "2%" }}>
            <Grid2 size={12}>
                <Typography variant="h5" sx={{ color: "#000", textAlign: "center", marginBottom: "1%" }}>Select Blanks</Typography>
                <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "center", marginBottom: "1%" }}>
                    <Button variant="outlined" sx={{ width: "50%", background: !combined ? "#e2e2e2" : "#fff" }} onClick={() => { setCombined(false); setProducts([]); }}>Single Products</Button>
                    <Button variant="outlined" sx={{ width: "50%", background: combined ? "#e2e2e2" : "#fff" }} onClick={() => { setCombined(true); setProducts([]); }}>Combined Product</Button>
                </Box>
                <Typography variant="body1" sx={{ color: "#000", textAlign: "center", marginBottom: "1%" }}>Select the blanks you want to use for this product. You can select multiple blanks.</Typography>
            </Grid2>
            {blanks.map(b => {
                let designImages = Object.keys(design.images ? design.images : {})
                let styleImages = []
                let color;
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
                if (styleImages.length == 0 || designImages.length != styleImages.length) return null;
                return (
                    <Grid2 size={{ sm: 6 * styleImages.length, md: 3 * styleImages.length }} key={b._id} onClick={() => {
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
                        <Box sx={{ border: "1px solid #000", borderRadius: "5px", padding: "1%", margin: ".5%", display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer", "&:hover": { background: "#f0f0f0", opacity: .7 } }}>
                            <Box sx={{ position: "relative", zIndex: 999, display: "flex", flexDirection: "row", justifyContent: "flex-end", alignItems: "center", width: "100%", marginBottom: "1%", }}>
                                {design.blanks.filter(d => d.blank._id.toString() == b._id.toString())[0] && design.blanks.filter(d => d.blank._id.toString() == b._id.toString())[0].colors && design.blanks.filter(d => d.blank._id.toString() == b._id.toString())[0].colors.length > 0 && <WorkspacePremiumIcon sx={{ color: "#FFD700", fontSize: "2rem"}} />}
                                <FormControlLabel control={<Checkbox checked={products.filter(p => p.blanks.filter(blank => blank?._id?.toString() == b?._id?.toString())[0] != undefined).length > 0} />} />
                            </Box>
                            <Box sx={{ marginTop: "-45px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1%" }}>
                                {styleImages.length > 0 && styleImages.map((si, i) => (
                                    <img key={i} src={`https://${source}.pythiastechnologies.com/api/renderImages/${design.sku}-${b.code?.replace(/-/g, "_")}-${si.blankImage?.image.split("/")[si.blankImage?.image.split("/").length - 1].split(".")[0]}-${si.colorName?.replace(/\//g, "_")}-${si.side}.jpg}?width=400`} alt={`${b.code} image`} width={400} height={400} style={{ width: "auto", height: "auto", maxHeight: styleImages.length > 1 ? "50%" : "100%", maxWidth: styleImages.length > 2 ? "33%" : styleImages.length > 1 ? "50%" : "100%" }} />
                                ))}
                            </Box>
                            <Divider />
                            <Box sx={{ width: "100%", textAlign: "center" }}>
                                <Typography sx={{ fontSize: '1rem', color: "black", whiteSpace: "nowrap", overflow: "hidden", display: "block", textOverflow: "ellipsis" }}>{b.name} - {b.code}</Typography>
                            </Box>
                        </Box>
                    </Grid2>
                )
            })}
            <Grid2 size={12}>
                <Button fullWidth sx={{ margin: "1% 2%", background: "#645D5B", color: "#ffffff" }} onClick={() => {
                    if(products.length == 0) {
                        alert("Please select at least one blank to continue.");
                        return;
                    }else{
                        let prods = [...products]
                        let colorsByProduct = {}
                        let sizesByProduct = {}
                        for (let p of prods){
                            p.id = p._id? p._id.toString() : p.id || Math.random().toString(36).substring(2, 15);
                            if(p.blanks.length == 0) {
                                alert("no blanks");
                                return;
                            }else{
                                let col = { ...cols }
                                let size = { ...sizes }
                                let colors = []
                                let siz = []
                                for (let b of p.blanks) {
                                    for (let color of b.colors) {
                                        if (!colors.filter(c => c._id.toString() == color._id.toString())[0]) {
                                            colors.push(color)
                                        }
                                    }
                                    for (let s of b.sizes) {
                                        if (!siz.filter(si => s.name == si.name)[0]) siz.push(s)
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
                                console.log(design.blanks.map(b=> b.blank._id) )
                                if (design.blanks.filter(d => d.blank._id.toString() == b._id.toString())[0]){
                                    previousColors = design.blanks.filter(d => d.blank._id.toString() == b._id.toString())[0].colors
                                    console.log("Found design for blank", b._id.toString(), "in design", design._id.toString());
                                }
                            }
                        }
                        console.log(previousColors)
                        setProducts([...prods])
                        setStage("colors")
                    }
                }}>Next</Button>
            </Grid2>
        </Grid2>
    )
}
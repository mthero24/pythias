import { Box, Grid2, Button, Typography, Card, Divider, } from "@mui/material";
import CreatableSelect from "react-select/creatable";
import CheckIcon from '@mui/icons-material/Check';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';


export const ColorStage = ({ products, setProducts, setStage, design, source, combined, colors, cols, sizes, setImages, upcs, getTempUpcs }) => {
    return (
        <Grid2 container spacing={2} sx={{ marginBottom: "2%" }}>
            <Grid2 size={12}>
                {products.map((product, i) => {
                return (<Box key={i}>
                    <Typography variant="h5" sx={{ color: "#000", textAlign: "center", marginBottom: "1%" }}>Select Colors {product.design?.sku}_{[product.blanks.map(b => b.code).join("_")]}</Typography>
                    <Grid2 container spacing={3}>
                        <Grid2 size={{ xs: 12, sm: 3, md: 3 }}>
                            <Card sx={{ padding: "2%", marginBottom: "2%", height: "100%" }}>
                                <Typography variant="body1" sx={{ color: "#000", textAlign: "center", marginBottom: "1%" }}>Select Thread colors </Typography>
                                <Box>
                                    <hr />
                                    <Grid2 container spacing={2} sx={{ marginTop: "2%" }}>
                                        {
                                            design.threadColors?.map(tc => { return colors.filter(c => c._id.toString() == tc.toString())[0] }).map(c => (
                                                <Grid2 key={c._id.toString()} size={3} sx={{ "&:hover": { cursor: 'pointer', opacity: .6 } }} onClick={() => {
                                                    let produs = [...products]
                                                    let p = produs.filter(p => p.id == product.id)[0] 
                                                    if (!p.threadColors.filter(co => co._id.toString() == c._id.toString())[0]) p.threadColors.push(c)
                                                    else {
                                                        let colors = [];
                                                        for (let co of p.threadColors) {
                                                            if (co._id.toString() != c._id.toString()) colors.push(co)
                                                        }
                                                        p.threadColors = colors
                                                    }
                                                    setProducts([...produs])
                                                }}>
                                                    <Box sx={{ background: c.hexcode, padding: "10%", width: "100%", height: "45px", borderRadius: "10px", boxShadow: `2px 2px 2px ${c.hexcode}` }}>
                                                        {product.threadColors.filter(co => co._id.toString() == c._id.toString())[0] && <CheckIcon sx={{ color: c.color_type == "dark" ? "#fff" : "#000", marginLeft: "10px", marginTop: "10px" }} />}
                                                    </Box>
                                                    <Typography sx={{ fontSize: ".6rem", textAlign: "center" }}>{c.name}</Typography>
                                                </Grid2>
                                            ))
                                        }
                                    </Grid2>
                                </Box>
                            </Card>
                        </Grid2>
                        <Grid2 size={{ xs: 12, sm: 9, md: 8 }}>
                            <Card sx={{ padding: "2%", marginBottom: "2%", height: "100%" }}>
                                <Typography variant="body1" sx={{ color: "#000", textAlign: "center", marginBottom: "1%" }}>Select the colors you want to use for this product. You can select multiple colors.</Typography>
                                <Box>
                                    <hr />
                                    <Grid2 container spacing={2} sx={{ marginTop: "2%" }}>
                                        {
                                            cols[product.id].map(c => (
                                                <Grid2 key={c._id} size={{ xs: 2, sm: 1.5, md: 1 }} sx={{ "&:hover": { cursor: 'pointer', opacity: .6 } }} onClick={() => {
                                                    let produs = [...products]
                                                    let p = produs.filter(p => p.id == product.id)[0] 
                                                    if (!p.colors.filter(co => co._id.toString() == c._id.toString())[0]) p.colors.push(c)
                                                    else {
                                                        let colors = [];
                                                        for (let co of p.colors) {
                                                            if (co._id.toString() != c._id.toString()) colors.push(co)
                                                        }
                                                        p.colors = colors
                                                    }
                                                    setProducts([...produs])
                                                }}>
                                                    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", background: c.hexcode, padding: "3%", width: "100%", height: "45px", borderRadius: "10px", boxShadow: `2px 2px 2px ${c.hexcode}` }}>
                                                        {product.colors.filter(co => co._id.toString() == c._id.toString())[0] && <CheckIcon sx={{ color: c.color_type == "dark" ? "#fff" : "#000", marginLeft: "10px", marginTop: "10px" }} />}
                                                    </Box>
                                                    <Typography sx={{ fontSize: ".6rem", textAlign: "center" }}>{c.name}</Typography>
                                                    {console.log(design, "design in ColorStage")}
                                                    {design.blanks?.filter(d => product.blanks.filter(pb => pb?._id?.toString() == (d.blank._id ? d.blank._id.toString() : d.blank.toString()))[0]) && design.blanks?.filter(d => product.blanks.filter(pb => pb?._id?.toString() == (d.blank._id ? d.blank._id.toString() : d.blank.toString()))[0])[0] && design.blanks?.filter(d => product.blanks.filter(pb => pb._id?.toString() == (d.blank._id ? d.blank._id.toString() : d.blank.toString()) )[0])[0].colors?.filter(cl => cl._id?.toString() == c._id?.toString())[0] && <Box sx={{display: "flex", alignItems: "center", justifyContent: "center"}}><WorkspacePremiumIcon sx={{ color: "#FFD700", fontSize: "2rem" }} /></Box>}
                                                </Grid2>
                                            ))
                                        }
                                    </Grid2>
                                </Box>
                            </Card>
                        </Grid2>
                        <Grid2 size={{ xs: 0, sm: 0, md: 1 }}></Grid2>
                        <Grid2 size={{ xs: 0, sm: 3, md: 3 }}></Grid2>
                        <Grid2 size={{ xs: 12, sm: 9, md: 8 }}>
                            <CreatableSelect
                                placeholder="Default Color"
                                options={product.colors.map(c => { return { value: c, label: <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "space-between", padding: "1% 15%" }}><Box sx={{ background: c.hexcode, padding: "1% 3%", width: { xs: "2%", md: "1%" }, height: "35px", borderRadius: "10px" }}></Box>{design.blanks.filter(d => product.blanks.filter(pb => pb._id.toString() == (d.blank._id ? d.blank._id : d.blank).toString())[0]) && design.blanks.filter(d => product.blanks.filter(pb => pb._id.toString() == (d.blank._id ? d.blank._id : d.blank).toString())[0])[0] && design.blanks.filter(d => product.blanks.filter(pb => pb._id.toString() == (d.blank._id ? d.blank._id : d.blank).toString())[0])[0].defaultColor && design.blanks.filter(d => product.blanks.filter(pb => pb._id.toString() == (d.blank._id ? d.blank._id : d.blank).toString())[0])[0].defaultColor.toString() == c._id.toString() && <WorkspacePremiumIcon sx={{ color: "#FFD700", fontSize: "2rem" }} />}<Box sx={{ padding: "2%" }}><Typography>{c.name}</Typography></Box></Box> } })}
                                value={product.defaultColor && {
                                    value: product.defaultColor, label: <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "space-between", padding: "1% 15%" }}><Box sx={{ background: product.defaultColor.hexcode, padding: { xs: "10%", md: "5%" }, width: "1%", height: "35px", borderRadius: "10px" }}></Box><Box sx={{ padding: "2%" }}><Typography>{product.defaultColor.name}</Typography></Box></Box>
                                }}
                                onChange={(val) => {
                                    let produs = [...products]
                                    let p = produs.filter(p => p.id == product.id)[0]
                                    p.defaultColor = val.value,
                                    setProducts([...produs])
                                }}
                            />
                        </Grid2>
                        <Grid2 size={{ xs: 0, sm: 0, md: 1 }}></Grid2>
                        <Grid2 size={{ xs: 0, sm: 3, md: 3 }}>

                        </Grid2>
                        <Grid2 size={{ xs: 12, sm: 9, md: 8 }}>
                            <Card sx={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: "2% 8%" }}>
                                <Typography variant="h5" sx={{ color: "#000", textAlign: "center", marginBottom: "1%" }}>Select Sizes</Typography>
                                <Grid2 container spacing={2}>
                                    {sizes[product.id.toString()].map(s => (
                                        <Grid2 size={{ xs: 3, md: 2 }} key={s._id}>

                                            <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "center" }}>
                                                <Box sx={{ width: "100%", padding: "5%", border: "1px solid #ccc", borderRadius: "5px", textAlign: "center", marginBottom: "5%", background: product.sizes.filter(si => si.name == s.name)[0] ? "#eee" : "#fff" }} onClick={() => {
                                                    let produs = [...products]
                                                    let p = produs.filter(p => p.id == product.id)[0] 
                                                    if (!p.sizes.filter(si => si.name == s.name)[0]) p.sizes.push(s)
                                                    else {
                                                        let sizes = []
                                                        for (let si of p.sizes) {
                                                            if (si.name != s.name) {
                                                                sizes.push(si)
                                                            }
                                                        }
                                                        p.sizes = sizes
                                                    }
                                                    setProducts([...produs])
                                                }}>
                                                    <Typography variant="body1">{s.name}</Typography>
                                                </Box>
                                            </Box>

                                        </Grid2>
                                    ))}
                                </Grid2>
                            </Card>
                        </Grid2>
                        <Grid2 size={{ xs: 0, sm: 0, md: 1 }}></Grid2>
                        <Grid2 size={12}>
                            <Box>
                                {combined && (
                                    <>
                                        <Typography variant="h5" sx={{ color: "#000", textAlign: "center", marginBottom: "1%" }}>Combined Product</Typography>
                                        {product.blanks.map((b, j) => (
                                            <Typography key={j} textAlign={"center"}>
                                                {console.log("Calculating variants for blank:", product.colors.filter(c => product.blanks.filter(bl => bl.code == b.code)[0].colors.filter(co => co._id.toString() == c._id.toString())[0]).length, product.sizes.filter(s => product.blanks.filter(bl => bl.code == b.code)[0].sizes.filter(si => si.name.toString() == s.name.toString())[0]).length)}
                                                {b.code}: {product.colors.filter(c => product.blanks.filter(bl => bl.code == b.code)[0].colors.filter(co => co._id.toString() == c._id.toString())[0]).length * product.sizes.filter(s => product.blanks.filter(bl => bl.code == b.code)[0].sizes.filter(si => si.name.toString() == s.name.toString())[0]).length} Variants
                                            </Typography>
                                            
                                        ))}
                                        <Typography textAlign={"center"}>Total Variants: {product.blanks.map((b, j) => {
                                            return product.colors.filter(c => product.blanks.filter(bl => bl.code == b.code)[0].colors.filter(co => co._id.toString() == c._id.toString())[0]).length * product.sizes.filter(s => product.blanks.filter(bl => bl.code == b.code)[0].sizes.filter(si => si._id.toString() == s._id.toString())[0]).length
                                        }).reduce((a, b) => a + b, 0)}</Typography>
                                    </>
                                )}
                                {!combined && <Typography textAlign={"center"}>Number of Variants: {product.blanks.length * product.colors.length * product.sizes.length * (product.threadColor && product.threadColors.length > 0 ? product.threadColors.length: 1)}</Typography>}
                            </Box>
                        </Grid2>
                    </Grid2>
                    <Divider sx={{ margin: "2% 0" }} />
                </Box>)
                })}
                <Grid2 container spacing={2} sx={{ padding: "2%" }}>
                    <Grid2 size={6}>
                        <Button fullWidth sx={{ margin: "1% 2%", background: "#645D5B", color: "#ffffff" }} onClick={() => { setStage("blanks") }}>Back</Button>
                    </Grid2>
                    <Grid2 size={6}>
                        <Button fullWidth sx={{ margin: "1% 2%", background: "#645D5B", color: "#ffffff" }} onClick={() => {
                            let imgs = {}
                            for (let product of products) {
                                let im = []
                                product.blanks.map(b => {
                                    if (product.threadColors.length > 0) {
                                        for (let tc of product.threadColors) {
                                            for (let ti of Object.keys(design.threadImages[tc.name] ? design.threadImages[tc.name] : {})) {
                                                for (let col of product.colors) {
                                                    for (let bm of b.multiImages[ti].filter(m => m.color.toString() == col._id.toString() && m.imageGroup.includes(product.imageGroup)).length > 0 ? b.multiImages[ti].filter(m => m.color.toString() == col._id.toString() && m.imageGroup.includes(product.imageGroup)) : b.multiImages[ti].filter(m => m.color.toString() == col._id.toString() && m.imageGroup.includes("default"))) {
                                                        im.push({ image: encodeURI(`https://${source}.pythiastechnologies.com/api/renderImages/${design.sku}-${b.code.replace(/-/g, "_")}-${bm.image.split("/")[bm.image.split("/").length - 1].split(".")[0]}-${col.name.replace(/\//g, "_")}-${ti}-${tc.name}.jpg}?width=400`), color: col, threadColor: tc, side: ti, blank: b, sku: `${design.printType}_${design.sku}_${col.sku}_${b.code.replace(/-/g, "_")}_${bm.image.split("/")[bm.image.split("/").length - 1].split(".")[0]}-${col.name.replace(/\//g, "_")}-${ti}-${tc.name}` })
                                                    }
                                                }
                                            }
                                        }
                                    } else {
                                        for (let ti of Object.keys(design.images ? design.images : {})) {
                                            for (let col of product.colors) {
                                                for (let bm of b.multiImages[ti].filter(m => m.color.toString() == col._id.toString() && m.imageGroup.includes(product.imageGroup)).length > 0 ? b.multiImages[ti].filter(m => m.color.toString() == col._id.toString() && m.imageGroup.includes(product.imageGroup)) : b.multiImages[ti].filter(m => m.color.toString() == col._id.toString() && m.imageGroup.includes("default"))) {
                                                    im.push({ image: encodeURI(`https://${source}.pythiastechnologies.com/api/renderImages/${design.sku}-${b.code.replace(/-/g, "_")}-${bm.image.split("/")[bm.image.split("/").length - 1].split(".")[0]}-${col.name.replace(/\//g, "_")}-${ti}.jpg}?width=400`), color: col, side: ti, blank: b, sku: `${design.printType}_${design.sku}_${col.sku}_${b.code.replace(/-/g, "_")}_${bm.image.split("/")[bm.image.split("/").length - 1].split(".")[0]}-${col.name.replace(/\//g, "_")}-${ti}` })

                                                }
                                            }
                                        }
                                    }
                                })
                                imgs[product.id] = im
                            }
                            if (source == "simplysage") {
                                let variantsLength = {}
                                for(let product of products){
                                    if(combined){
                                        for(let b of product.blanks){
                                            console.log("Calculating variants for blank:", product.colors.filter(c => product.blanks.filter(bl => bl.code == b.code)[0].colors.filter(co => co._id.toString() == c._id.toString())[0]).length, product.sizes.filter(s => product.blanks.filter(bl => bl.code == b.code)[0].sizes.filter(si => si._id.toString() == s._id.toString())[0]).length);
                                            variantsLength[b.code] = 0
                                            variantsLength[b.code] += product.colors.filter(c => product.blanks.filter(bl => bl.code == b.code)[0].colors.filter(co => co._id.toString() == c._id.toString())[0]).length * product.sizes.filter(s => product.blanks.filter(bl => bl.code == b.code)[0].sizes.filter(si => si.name.toString() == s.name.toString())[0]).length * (product.threadColor && product.threadColors.length > 0 ? product.threadColors.length : 1);
                                        }
                                    }else{
                                        variantsLength[b.code] += product.blanks.length * product.colors.length * product.sizes.length * (product.threadColor && product.threadColors.length > 0 ? product.threadColors.length : 1);
                                    }
                                }
                                console.log(variantsLength, upcs.length, "variantsLength, upcs.length")
                                let vLength = 0
                                for(let v of Object.keys(variantsLength)) vLength += variantsLength[v]
                                let used = 0
                                for(let p of products){
                                    for(let b of p.blanks){
                                        used += upcs.filter(u => u.blank._id.toString() == b._id.toString() && p.colors.map(c => c._id.toString()).includes(u.color._id.toString())).length
                                    }
                                }
                                if (vLength > used) {
                                    getTempUpcs(vLength - used)

                                }
                            }
                            setImages(imgs)
                            setStage("product_images")
                        }}>Next</Button>
                    </Grid2>
                </Grid2>
            </Grid2>
        </Grid2>
    )
}
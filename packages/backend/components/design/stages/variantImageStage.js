import { Box, Grid2, Button, Typography, Checkbox } from "@mui/material";
import { useState, } from "react";

export const VariantImageStage = ({products, setProducts, design, source, setStage }) => {
    return (
        <Grid2 size={12} sx={{padding: "0% 4%"}}>
            <Typography variant="h5" sx={{ color: "#000", textAlign: "center", marginBottom: "1%" }}>Select Variant Images</Typography>
            <Box>
                {products.map(product => <CreateVariantImages key={product.id} product={product} products={products} design={design.threadColors?.length > 0 ? design.threadImages : design.images} setProducts={setProducts} threadColors={design.threadColors?.length > 0? true: false} source={source}/>)}
            </Box>
            <Grid2 container spacing={2} sx={{ padding: "2%" }}>
                <Grid2 size={6}>
                    <Button fullWidth sx={{ margin: "1% 2%", background: "#645D5B", color: "#ffffff" }} onClick={() => { setStage("product_images") }}>Back</Button>
                </Grid2>
                <Grid2 size={6}>
                    <Button fullWidth sx={{ margin: "1% 2%", background: "#645D5B", color: "#ffffff" }} onClick={() => {
                        let prods = [...products]
                        for(let p of prods) {
                            p.title = p.title ? p.title : `${design.name} - ${p.blanks.map(b => b.name).join(" and ")}`
                            p.description = p.description && !p.description.includes("undefined") ? p.description : `${design.description} - ${p.blanks.map(b => b.description).join(" ")}`
                            p.tags = design.tags ? design.tags : []
                        }
                        setProducts([...prods])
                        setStage("information")
                    }}>Next</Button>
                </Grid2>
            </Grid2>  
        </Grid2>
    )
}

const CreateVariantImages = ({ product, products, setProducts, design, threadColors, source }) => {
    const [mainImage, setMainImage] = useState(true);
    console.log(design, "design in CreateVariantImages");
    let imgs = {}
    if (!threadColors) {
        for (let side of Object.keys(design ? design : {})) {
            for (let blank of product.blanks) {
                for (let color of product.colors) {
                    if(blank.images && blank.images.length > 0){
                        for (let img of blank.images?.filter(i => i.color.toString() == color._id.toString() && Object.keys(i.boxes ? i.boxes : {}).includes(side))) {
                            if (!imgs[blank.code]) imgs[blank.code] = {}
                            if (!imgs[blank.code][color.name]) imgs[blank.code][color.name] = []
                            if(imgs[blank.code][color.name].filter(i => i.sku == `${product.design.printType}_${product.design.sku}_${color.sku}_${blank.code.replace(/-/g, "_")}_${img.image.split("/")[img.image.split("/").length - 1].split(".")[0]}-${color.name.replace(/\//g, "_")}-${Object.keys(design ? design : {}).join("_")}`).length == 0){
                                imgs[blank.code][color.name].push({ image: encodeURI(`https://${source.includes("test") ? "test" : source}.pythiastechnologies.com/api/renderImages/${product.design.sku}-${blank.code.replace(/-/g, "_")}-${img.image.split("/")[img.image.split("/").length - 1].split(".")[0]}-${color.name.replace(/\//g, "_")}-${Object.keys(design ? design : {}).join("_")}.jpg?width=400`), sku: `${product.design.printType}_${product.design.sku}_${color.sku}_${blank.code.replace(/-/g, "_")}_${img.image.split("/")[img.image.split("/").length - 1].split(".")[0]}-${color.name.replace(/\//g, "_")}-${Object.keys(design ? design : {}).join("_")}` })
                            }

                        }
                    }else{
                        for (let img of blank.multiImages[side]?.filter(i => i.color.toString() == color._id.toString() && i.imageGroup?.includes(product.imageGroup)).length > 0 ? blank.multiImages[side]?.filter(i => i.color.toString() == color._id.toString() && i.imageGroup?.includes(product.imageGroup)) : blank.multiImages[side]?.filter(i => i.color.toString() == color._id.toString() && i.imageGroup?.includes("default"))) {
                            if (!imgs[blank.code]) imgs[blank.code] = {}
                            if (!imgs[blank.code][color.name]) imgs[blank.code][color.name] = []
                            imgs[blank.code][color.name].push({ image: encodeURI(`https://${source.includes("test") ? "test" : source}.pythiastechnologies.com/api/renderImages/${product.design.sku}-${blank.code.replace(/-/g, "_")}-${img.image.split("/")[img.image.split("/").length - 1].split(".")[0]}-${color.name.replace(/\//g, "_")}-${side}.jpg?width=400`), sku: `${product.design.printType}_${product.design.sku}_${color.sku}_${blank.code.replace(/-/g, "_")}_${img.image.split("/")[img.image.split("/").length - 1].split(".")[0]}-${color.name.replace(/\//g, "_")}-${side}` })

                        }
                    }
                }
            }
        }
    } else {
        for (let threadColor of Object.keys(design? design : {}).filter(tc=> product.threadColors.find(t => t.name == tc))) {
            for (let side of Object.keys(design[threadColor])) {
                for (let blank of product.blanks) {
                    for (let color of product.colors) {
                        if(blank.images && blank.images.length > 0){
                            for (let img of blank.images?.filter(i => i.color.toString() == color._id.toString() && Object.keys(i.boxes ? i.boxes : {}).includes(side))) {
                                if (!imgs[blank.code]) imgs[blank.code] = {}
                            
                                if (!imgs[blank.code][threadColor]) imgs[blank.code][threadColor] = {}
                                if (!imgs[blank.code][threadColor][color.name]) imgs[blank.code][threadColor][color.name] = []
                                if(imgs[blank.code][threadColor][color.name].filter(i => i.sku == `${product.design.printType}_${product.design.sku}_${color.sku}_${blank.code.replace(/-/g, "_")}_${img.image.split("/")[img.image.split("/").length - 1].split(".")[0]}-${color.name.replace(/\//g, "_")}-${side}-${threadColor}`).length == 0){
                                    imgs[blank.code][threadColor][color.name].push({ image: encodeURI(`https://${source.includes("test") ? "test" : source}.pythiastechnologies.com/api/renderImages/${product.design.sku}-${blank.code.replace(/-/g, "_")}-${img.image.split("/")[img.image.split("/").length - 1].split(".")[0]}-${color.name.replace(/\//g, "_")}-${side}-${threadColor}.jpg?width=400`), sku: `${product.design.printType}_${product.design.sku}_${color.sku}_${blank.code.replace(/-/g, "_")}_${img.image.split("/")[img.image.split("/").length - 1].split(".")[0]}-${color.name.replace(/\//g, "_")}-${side}-${threadColor}` })
                                }

                            }
                        }else{
                            for (let img of blank.multiImages[side]?.filter(i => i.color.toString() == color._id.toString() && i.imageGroup?.includes(product.imageGroup)).length > 0 ? blank.multiImages[side]?.filter(i => i.color.toString() == color._id.toString() && i.imageGroup?.includes(product.imageGroup)) : blank.multiImages[side]?.filter(i => i.color.toString() == color._id.toString() && i.imageGroup?.includes("default"))) {
                                if (!imgs[blank.code]) imgs[blank.code] = {}
                                if (!imgs[blank.code][threadColor]) imgs[blank.code][threadColor] = {}
                                if (!imgs[blank.code][threadColor][color.name]) imgs[blank.code][threadColor][color.name] = []
                                imgs[blank.code][threadColor][color.name].push({ image: encodeURI(`https://${source.includes("test") ? "test" : source}.pythiastechnologies.com/api/renderImages/${product.design.sku}-${blank.code.replace(/-/g, "_")}-${img.image.split("/")[img.image.split("/").length - 1].split(".")[0]}-${color.name.replace(/\//g, "_")}-${side}-${threadColor}.jpg?width=400`), sku: `${product.design.printType}_${product.design.sku}_${color.sku}_${blank.code.replace(/-/g, "_")}_${img.image.split("/")[img.image.split("/").length - 1].split(".")[0]}-${color.name.replace(/\//g, "_")}-${side}-${threadColor}` })

                            }
                        }
                    }
                }
            }
        }
    }
    return (
        <>
            {!threadColors && Object.keys(imgs).length > 0 && Object.keys(imgs).map((b, i) => (
                <Box key={i} sx={{ margin: "2%", padding: "2%", border: "1px solid #000", borderRadius: "5px" }}>
                    <Typography variant="h6" sx={{ color: "#000", textAlign: "center", marginBottom: "1%" }}>{b}</Typography>
                    <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "center", gap: 3, alignItems: "center", marginBottom: "1%" }}>
                        <Button variant="outlined" sx={{width: "50%", background: mainImage ? "#e2e2e2" : "#fff"}} onClick={() => setMainImage(true)}>Main Variant Image</Button>
                        <Button variant="outlined" sx={{width: "50%", background: !mainImage ? "#e2e2e2" : "#fff"}} onClick={() => setMainImage(false)}>Secondary Variant Images</Button>
                    </Box>
                    <Grid2 container spacing={2}>
                        {imgs[b] && Object.keys(imgs[b]).map((c, j) => (
                            <Grid2 key={j} size={6}>
                                <Typography variant="body1" sx={{ color: "#000", textAlign: "center", marginBottom: "1%" }}>{c}</Typography>
                                <Grid2 container spacing={2} sx={{ "&:hover": { cursor: "pointer", opacity: .7 } }}>
                                    {imgs[b][c].map((img, k) => (
                                        <Grid2 key={k} size={4} onClick={() => {
                                            let prods = [...products]
                                            let p = prods.filter(p => p.id == product.id)[0]
                                            if (!p.variantImages) p.variantImages = {}
                                            if (p.variantImages && !p.variantImages[b]) p.variantImages[b] = {}
                                            if (!p.variantSecondaryImages) p.variantSecondaryImages = {}
                                            if (p.variantSecondaryImages && !p.variantSecondaryImages[b]) p.variantSecondaryImages[b] = {}
                                            if (!p.variantSecondaryImages[b][c]) p.variantSecondaryImages[b][c] = []
                                            if( mainImage) {
                                                p.variantSecondaryImages[b][c] = p.variantSecondaryImages[b][c].filter(i => i.image != img.image)
                                                p.variantImages[b][c] = img
                                            } else {
                                                if (!p.variantSecondaryImages[b][c].find(i => i.image == img.image)) {
                                                    p.variantSecondaryImages[b][c].push(img)
                                                } else {
                                                    p.variantSecondaryImages[b][c] = p.variantSecondaryImages[b][c].filter(i => i.image != img.image)
                                                }
                                            }
                                            setProducts([...prods])
                                        }}>
                                            <img src={img.image} alt={img.sku} style={{ width: "100%", height: "auto" }} />
                                            {product.variantImages && product.variantImages[b] && product.variantImages[b][c] && product.variantImages[b][c]?.image == img.image && <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "flex-end", alignItems: "center", width: "100%", marginBottom: "1%", zIndex: 999, top: "-23%", position: "relative" }}>
                                                <Checkbox checked={true} />
                                            </Box>}
                                            {product.variantSecondaryImages && product.variantSecondaryImages[b] && product.variantSecondaryImages[b][c] && product.variantSecondaryImages[b][c].find(i => i.image == img.image) && <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "flex-end", alignItems: "center", width: "100%", marginBottom: "1%", zIndex: 999, top: "-23%", position: "relative" }}>
                                                <Checkbox checked={true} color="error" />
                                            </Box>}
                                        </Grid2>
                                    ))}
                                </Grid2>
                                <Grid2 container spacing={2} sx={{ "&:hover": { cursor: "pointer", opacity: .7 } }}>
                                    {product.tempImages && product.tempImages.filter(img=> img.color.name == c).map((img, k) => (
                                        <Grid2 key={k} size={4} onClick={() => {
                                            let prods = [...products]
                                            let p = prods.filter(p => p.id == product.id)[0]
                                            if (!p.variantImages) p.variantImages = {}
                                            if (p.variantImages && !p.variantImages[b]) p.variantImages[b] = {}
                                            if (!p.variantSecondaryImages) p.variantSecondaryImages = {}
                                            if (p.variantSecondaryImages && !p.variantSecondaryImages[b]) p.variantSecondaryImages[b] = {}
                                            if (!p.variantSecondaryImages[b][c]) p.variantSecondaryImages[b][c] = []
                                            if (mainImage) {
                                                p.variantSecondaryImages[b][c] = p.variantSecondaryImages[b][c].filter(i => i.image != img.image)
                                                p.variantImages[b][c] = img
                                            } else {
                                                if (!p.variantSecondaryImages[b][c].find(i => i.image == img.image)) {
                                                    p.variantSecondaryImages[b][c].push(img)
                                                } else {
                                                    p.variantSecondaryImages[b][c] = p.variantSecondaryImages[b][c].filter(i => i.image != img.image)
                                                }
                                            }
                                            setProducts([...prods])
                                        }}>
                                            <img src={img.image} alt={img.sku} style={{ width: "100%", height: "auto" }} />
                                            {product.variantImages && product.variantImages[b] && product.variantImages[b][c] && product.variantImages[b][c]?.image == img.image && <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "flex-end", alignItems: "center", width: "100%", marginBottom: "1%", zIndex: 999, top: "-23%", position: "relative" }}>
                                                <Checkbox checked={true} />
                                            </Box>}
                                            {product.variantSecondaryImages && product.variantSecondaryImages[b] && product.variantSecondaryImages[b][c] && product.variantSecondaryImages[b][c].find(i => i.image == img.image) && <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "flex-end", alignItems: "center", width: "100%", marginBottom: "1%", zIndex: 999, top: "-23%", position: "relative" }}>
                                                <Checkbox checked={true} color="error" />
                                            </Box>}
                                        </Grid2>
                                    ))}
                                </Grid2>
                            </Grid2>
                        ))}
                    </Grid2>
                </Box>
            ))}
            {threadColors && Object.keys(imgs).length > 0 && Object.keys(imgs).map((b, i) => (
                <Box key={i} sx={{ margin: "2%", padding: "2%", border: "1px solid #000", borderRadius: "5px" }}>
                    <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "center", gap: 3, alignItems: "center", marginBottom: "1%" }}>
                        <Button variant="outlined" sx={{ width: "50%", background: mainImage ? "#e2e2e2" : "#fff" }} onClick={() => setMainImage(true)}>Main Variant Image</Button>
                        <Button variant="outlined" sx={{ width: "50%", background: !mainImage ? "#e2e2e2" : "#fff" }} onClick={() => setMainImage(false)}>Secondary Variant Images</Button>
                    </Box>
                    <Typography variant="h6" sx={{ color: "#000", textAlign: "center", marginBottom: "1%" }}>{b}</Typography>
                    {Object.keys(imgs[b]).map((tc, j) => (
                        <Box key={j} sx={{ margin: "2%", padding: "2%", border: "1px solid #000", borderRadius: "5px" }}>
                            <Typography variant="h6" sx={{ color: "#000", textAlign: "center", marginBottom: "1%" }}>{tc}</Typography>
                            <Grid2 container spacing={2}>
                                {imgs[b][tc] && Object.keys(imgs[b][tc]).map((c, k) => (
                                    <Grid2 key={k} size={6}>
                                        <Typography variant="body1" sx={{ color: "#000", textAlign: "center", marginBottom: "1%" }}>{c}</Typography>
                                        <Grid2 container spacing={2} sx={{ "&:hover": { cursor: "pointer", opacity: .7 } }}>
                                            {imgs[b][tc][c].map((img, l) => (
                                                <Grid2 key={l} size={4} onClick={() => {
                                                    let prods = [...products]
                                                    let p = prods.filter(p => p.id == product.id)[0]
                                                    if (!p.variantImages) p.variantImages = {}
                                                    if (!p.variantImages[b]) p.variantImages[b] = {}
                                                    if (!p.variantImages[b][tc]) p.variantImages[b][tc] = {}
                                                    if (!p.variantSecondaryImages) p.variantSecondaryImages = {}
                                                    if (!p.variantSecondaryImages[b]) p.variantSecondaryImages[b] = {}
                                                    if (!p.variantSecondaryImages[b][tc]) p.variantSecondaryImages[b][tc] = {}
                                                    if (!p.variantSecondaryImages[b][tc][c]) p.variantSecondaryImages[b][tc][c] = []
                                                    if(mainImage){
                                                        p.variantImages[b][tc][c] = img
                                                        p.variantSecondaryImages[b][tc][c] = p.variantSecondaryImages[b][tc][c].filter(i => i.image != img.image)
                                                    }else {
                                                        if (!p.variantSecondaryImages[b][tc][c].find(i => i.image == img.image)) {
                                                            p.variantSecondaryImages[b][tc][c].push(img)
                                                        } else {
                                                            p.variantSecondaryImages[b][tc][c] = p.variantSecondaryImages[b][tc][c].filter(i => i.image != img.image)
                                                        }
                                                    }
                                                    setProducts([...prods])
                                                }}>
                                                    <img src={img.image} alt={img.sku} style={{ width: "100%", height: "auto" }} />
                                                    {product.variantImages && product.variantImages[b] && product.variantImages[b][tc] && product.variantImages[b][tc][c] && product.variantImages[b][tc][c].image == img.image && <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "flex-end", alignItems: "center", width: "100%", marginBottom: "1%", zIndex: 999, top: "-23%", position: "relative" }}>
                                                        <Checkbox checked={true} />
                                                    </Box>}
                                                    {product.variantSecondaryImages && product.variantSecondaryImages[b] && product.variantSecondaryImages[b][tc] && product.variantSecondaryImages[b][tc][c] && product.variantSecondaryImages[b][tc][c].find(i => i.image == img.image) && <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "flex-end", alignItems: "center", width: "100%", marginBottom: "1%", zIndex: 999, top: "-23%", position: "relative" }}>
                                                        <Checkbox checked={true} color="error" />
                                                    </Box>}
                                                </Grid2>
                                            ))}
                                        </Grid2>
                                    </Grid2>
                                ))}
                            </Grid2>
                        </Box>
                    ))}
                </Box>
            ))}
        </>
    )
}
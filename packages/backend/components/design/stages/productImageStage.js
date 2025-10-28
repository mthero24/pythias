import { Box, Grid2, Button, Typography, Checkbox, Modal } from "@mui/material";
import CreatableSelect from "react-select/creatable";
import { Uploader } from "../../reusable/premier/uploader";
import { useState, useEffect } from "react";
import CloseIcon from '@mui/icons-material/Close';
export const ProductImageStage = ({ products, setProducts, setStage, design, source, images,  setImages, imageGroups }) => {
    console.log(design, "design in ProductImageStage");
    const [imageOpen, setImageOpen] = useState(false)
    const [reload, setReload] = useState(false)
    const [prod, setProd] = useState(null)
    useEffect(()=>{
        if(!reload) setReload(!reload)
    }, [reload])
    return (
        <Grid2 size={12} sx={{ padding: "0% 4%" }}>
            {products.map((product, i) => (
                <Box key={i} sx={{ marginBottom: "2%", padding: "2%", border: "1px solid #ccc", borderRadius: "8px" }}>
                    <Box sx={{display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: "2%"}}>
                        {/* <Box sx={{width: "80%"}}>
                        <CreatableSelect
                            placeholder="Image Group"
                            options={imageGroups.map(g => { return { value: g, label: g } })}
                            value={product.imageGroup ? { value: product.imageGroup, label: product.imageGroup } : { value: "default", label: "default" }}
                            onChange={(val) => {
                                let prods = [...products]
                                let p = prods.filter(p => p.id == product.id)[0]
                                p.imageGroup = val.value
                                setProducts(prods)
                                let imgs = []
                                product.blanks.map(b => {
                                    if (product.threadColors.length > 0) {
                                        for (let tc of product.threadColors) {
                                            for (let col of product.colors) {
                                                for (let ti of Object.keys(design.threadImages[tc.name] ? design.threadImages[tc.name] : {})) {
                                                    for (let bm of b.multiImages[ti].filter(m => m.color.toString() == col._id.toString() && m.imageGroup.includes(val.value)).length > 0 ? b.multiImages[ti].filter(m => m.color.toString() == col._id.toString() && m.imageGroup.includes(val.value)) : b.multiImages[ti].filter(m => m.color.toString() == col._id.toString() && m.imageGroup.includes("default"))) {
                                                        imgs.push({ image: encodeURI(`https://${source.includes("test") ? "test" : source}.pythiastechnologies.com/api/renderImages/${design.sku}-${b.code.replace(/-/g, "_")}-${bm.image.split("/")[bm.image.split("/").length - 1].split(".")[0]}-${col.name.replace(/\//g, "_")}-${ti}-${tc.name}.jpg}?width=400`), color: col, threadColor: tc, side: ti, blank: b, sku: `${design.printType}_${design.sku}_${col.sku}_${b.code.replace(/-/g, "_")}_${bm.image.split("/")[bm.image.split("/").length - 1].split(".")[0]}-${col.name.replace(/\//g, "_")}-${ti}-${tc.name}` })
                                                    }
                                                }
                                            }
                                        }
                                    } else {
                                        for (let col of product.colors) {
                                            for (let ti of Object.keys(design.images ? design.images : {})) {
                                                for (let bm of b.multiImages[ti].filter(m => m.color.toString() == col._id.toString() && m.imageGroup.includes(val.value)).length > 0 ? b.multiImages[ti].filter(m => m.color.toString() == col._id.toString() && m.imageGroup.includes(val.value)) : b.multiImages[ti].filter(m => m.color.toString() == col._id.toString() && m.imageGroup.includes("default"))) {
                                                    imgs.push({ image: encodeURI(`https://${source.includes("test") ? "test" : source}.pythiastechnologies.com/api/renderImages/${design.sku}-${b.code.replace(/-/g, "_")}-${bm.image.split("/")[bm.image.split("/").length - 1].split(".")[0]}-${col.name.replace(/\//g, "_")}-${ti}.jpg}?width=400`), color: col, side: ti, blank: b, sku: `${design.printType}_${design.sku}_${col.sku}_${b.code.replace(/-/g, "_")}_${bm.image.split("/")[bm.image.split("/").length - 1].split(".")[0]}-${col.name.replace(/\//g, "_")}-${ti}` })
                                                }
                                            }
                                        }
                                    }
                                })
                                let ims = {...images }
                                ims[product.id] = imgs
                                    setImages(ims)
                                }}
                            />
                        </Box> */}
                        <Box>
                            <Button variant="outlined" onClick={()=> { setImageOpen(true); setProd(product); }}>Add Image</Button>
                            <AddImageModal open={imageOpen} setOpen={setImageOpen} des={design} setDesign={()=>{}} updateDesign={()=>{}} colors={prod?.colors} reload={reload} setReload={setReload} threadColors={prod?.threadColors} product={prod} products={products} setProducts={setProducts} />
                        </Box>
                    </Box>
                    <Typography variant="h5" sx={{ color: "#000", textAlign: "center", marginBottom: "1%" }}>Select Product Images</Typography>
                    <Grid2 container spacing={1} sx={{ marginBottom: "2%" }}>
                        {images[product.id].map((i, j) => (
                            <Grid2 key={j} size={{ xs: 6, sm: 3, md: 3 }} sx={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "1%", cursor: "pointer", "&:hover": { opacity: .7 } }} onClick={() => {
                                let prods = [...products]
                                let p = prods.filter(p => p.id == product.id)[0]
                                if (!p.productImages.filter(img => img.image == i.image)[0]) p.productImages.push(i)
                                else {
                                    let imgs = [];
                                    for (let img of p.productImages) {
                                        if (img.image != i.image) imgs.push(img)
                                    }
                                    p.productImages = imgs
                                }
                                setProducts([...prods])
                            }}>
                                <img src={i.image} alt={`${i.blank.code} image`} width={300} height={300} style={{ width: "auto", height: "auto", maxHeight: "100%", maxWidth: "100%", }} />
                                {product.productImages.filter(img => img.image == i.image)[0] && <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "flex-end", alignItems: "center", width: "100%", marginBottom: "1%", top: "-20%", position: "relative" }}>
                                    <Checkbox checked={true} />
                                </Box>}
                                {!product.productImages.filter(img => img.image == i.image)[0] && <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "flex-end", alignItems: "center", width: "100%", marginBottom: "1%", top: "-20%", position: "relative" }}>
                                    <Checkbox checked={false} />
                                </Box>}
                            </Grid2>
                            
                        ))}
                        {product.tempImages?.map((i, j) => (
                            <Grid2 key={j} size={{ xs: 6, sm: 3, md: 3 }} sx={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "1%", cursor: "pointer", "&:hover": { opacity: .7 } }} onClick={() => {
                                let prods = [...products]
                                let p = prods.filter(p => p.id == product.id)[0]
                                if (!p.productImages.filter(img => img.image == i.image)[0]) p.productImages.push(i)
                                else {
                                    let imgs = [];
                                    for (let img of p.productImages) {
                                        if (img.image != i.image) imgs.push(img)
                                    }
                                    p.productImages = imgs
                                }
                                setProducts([...prods])
                            }}>
                                <img src={i.image} alt={`${i.color} ${i.threadColor} image`} width={300} height={300} style={{ width: "auto", height: "auto", maxHeight: "100%", maxWidth: "100%", }} />
                                {product.productImages.filter(img => img.image == i.image)[0] && <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "flex-end", alignItems: "center", width: "100%", marginBottom: "1%", top: "-20%", position: "relative" }}>
                                    <Checkbox checked={true} />
                                </Box>}
                                {!product.productImages.filter(img => img.image == i.image)[0] && <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "flex-end", alignItems: "center", width: "100%", marginBottom: "1%", top: "-20%", position: "relative" }}>
                                    <Checkbox checked={false} />
                                </Box>}
                            </Grid2>
                        ))}
                    </Grid2>
                    
                </Box>
            ))}
            <Grid2 container spacing={2} sx={{ padding: "2%" }}>
                <Grid2 size={6}>
                    <Button fullWidth sx={{ margin: "1% 2%", background: "#645D5B", color: "#ffffff" }} onClick={() => { setStage("colors") }}>Back</Button>
                </Grid2>
                <Grid2 size={6}>
                    <Button fullWidth sx={{ margin: "1% 2%", background: "#645D5B", color: "#ffffff" }} onClick={() => {
                        setStage("variant_images")
                    }}>Next</Button>
                </Grid2>
            </Grid2>
        </Grid2>
    )
}

const AddImageModal = ({ open, setOpen, reload, setReload, loading, setLoading, des, setDesign, updateDesign, colors, threadColors, product, products, setProducts }) => {
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
        <Modal
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
                            options={[...product.colors?.map(p => { return { value: p.name, label: p.name } }) ]}
                            value={color ? { value: color, label: color } : null}
                            onChange={(vals) => {
                                console.log(color, vals.value)
                                setColor(vals.value)
                                setReload(false)
                            }}
                        />
                        <CreatableSelect
                            placeholder="Thread Color"
                            options={[...product.threadColors?.map(p => { return { value: p.name, label: p.name } })]}
                            value={threadColor ? { value: threadColor, label: threadColor } : null}
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
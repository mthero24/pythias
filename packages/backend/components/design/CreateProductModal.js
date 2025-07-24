import { Box, Grid2, TextField, Modal, Button, Typography, Card, Divider, FormControlLabel, Checkbox, List, CircularProgress, ListItemText, Avatar, ListItemAvatar, ListItem, ImageList, ImageListItem } from "@mui/material";
import CreatableSelect from "react-select/creatable";
import axios from "axios";
import { useState, useEffect } from "react";
import CheckIcon from '@mui/icons-material/Check';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import CloseIcon from '@mui/icons-material/Close';
export const CreateProductModal = ({ open, setOpen, product, setProduct, design, setDesign, updateDesign, blanks, colors, imageGroups, brands, genders, seasons, setSeasons, setGenders, setBrands, CreateSku, source, loading, setLoading }) => {
    const [cols, setColors] = useState([])
    const [sizes, setSizes] = useState([])
    const [images, setImages] = useState([])
    const [stage, setStage] = useState("blanks")
    const [upcs, setUpcs] = useState([])
    const [tempUpcs, setTempUpcs] = useState([])
    const style = {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: "90%",
        height: "90%",
        bgcolor: 'background.paper',
        border: '2px solid #000',
        boxShadow: 24,
        p: 4,
        overflowX: "auto",
        overflowY: "none",
    };
    useEffect(() => {
        const handleBeforeUnload = async (event) => {
            // Perform actions before the page unloads
            // e.g., save unsaved data, send analytics, clean up resources
            console.log(window.dataLayer[0], "window data layer")
            event.preventDefault(); // This line is crucial for displaying the prompt
            let res = await axios.post("/api/upc/releasehold", { upcs: window.dataLayer[0] }); // Release hold on temp UPCs if any
        // Optional: Display a confirmation message to the user
        // event.preventDefault(); // This line is crucial for displaying the prompt
        // event.returnValue = 'Are you sure you want to leave?';
        };
        window.addEventListener('beforeunload', handleBeforeUnload);

        // Cleanup function: Remove the event listener when the component unmounts
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, []);    
    for(let b of blanks){
        if (b.multiImages["modelFront"] && b.multiImages["modelFront"].length > 0) {
            for (let i of b.multiImages["modelFront"]){
                if (!b.multiImages["front"].filter(mi=> mi.image == i.image)[0]) {
                    b.multiImages["front"].push(i);
                }
            }
        }
        if (b.multiImages["modelBack"] && b.multiImages["modelBack"].length > 0) {
            for (let i of b.multiImages["modelBack"]){
                if (!b.multiImages["back"].filter(mi=> mi.image == i.image)[0]) {
                    b.multiImages["back"].push(i);
                }
            }
        }
    }
    const getUpcs = async ({ blanks, design }) => {
        let upcs = await axios.post("/api/upc", { blanks, design }).catch(e => {
            console.error(e);
        });
        setUpcs(upcs.data.upcs);
        console.log(upcs.data.upcs, "upcs")
    }
    const getTempUpcs = async (count) => {
        let tempUpcs = await axios.post("/api/upc", { count }).catch(e => {
            console.error(e);
        });
        if(!window.dataLayer) window.dataLayer = [];
        setTempUpcs([...tempUpcs.data.upcs]);
        window.dataLayer.push(tempUpcs.data.upcs)
        console.log(tempUpcs.data.upcs, "temp upcs")
    }
    const releaseHold = async () => {
        console.log("releasing hold on temp upcs", tempUpcs)
        let res = await axios.post("/api/upc/releasehold", { upcs: tempUpcs });
        console.log("release hold response", res)
    }
    product.tags = design.tags ? design.tags : []
    if (product.defaultColor && !product.defaultColor._id){
        product.defaultColor = colors.filter(c => c._id.toString() == product.defaultColor.toString())[0]
    }
    return (
        <Modal
            open={open}
            onClose={() => { setOpen(false); setUpcs([]); releaseHold(); setTempUpcs([]); setStage("blanks"); setProduct({  blanks: [], colors: [], threadColors: [], sizes: [], productImages: { blank: [], color: [], threadColor: [] } }) }}
            aria-labelledby="modal-modal-title"
            aria-describedby="modal-modal-description"
            id="create-product-modal"
        >
            <Box sx={style}>
                <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "flex-end", alignItems: "center", padding: "1%", cursor: "pointer", "&:hover": { opacity: .6 } }} onClick={() => { setOpen(false); setUpcs([]); releaseHold(); setTempUpcs([]); setStage("blanks"); setProduct({ blanks: [], colors: [], threadColors: [], sizes: [], productImages: { blank: [], color: [], threadColor: [] } }) }}>
                    <CloseIcon sx={{ color: "#780606" }} />
                </Box>
                <Typography variant="h4" sx={{ marginBottom: "2%", color: "#000", textAlign: "center" }}>Create Product</Typography>
                {stage == "blanks" && <Grid2 container spacing={2} sx={{ marginBottom: "2%" }}> 
                    <Grid2 size={12}>
                        <Typography variant="h5" sx={{ color: "#000", textAlign: "center", marginBottom: "1%" }}>Select Blanks</Typography>
                        <Typography variant="body1" sx={{ color: "#000", textAlign: "center", marginBottom: "1%" }}>Select the blanks you want to use for this product. You can select multiple blanks.</Typography>
                    </Grid2>
                    {blanks.map(b => {
                        let designImages = Object.keys(design.images ? design.images : {})
                        let styleImages = []
                        let color;
                        for(let di of designImages){
                            if(di != null){
                                if(b.multiImages && b.multiImages[di] && b.multiImages[di].length > 0){
                                    if (!color) {
                                        color = b.multiImages[di][0].color
                                        if (b.multiImages[di].filter(i => i.color.toString() == color.toString())[0] && b.multiImages[di].filter(i => i.color.toString() == color.toString())[0] != null) {
                                            styleImages.push({ blankImage: b.multiImages[di][0], designImage: design.images[di], side: di, colorName: colors.filter(c => c._id.toString() == color.toString())[0]?.name })
                                        }
                                    }else{
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
                                let p = { ...product }
                                let blank = p.blanks.filter(blank => blank?._id.toString() == b?._id.toString())[0]
                                if (blank) {
                                    p.blanks = p.blanks.filter(blank => blank?._id.toString() != b._id.toString())
                                } else {
                                    p.blanks.push(b)
                                }
                                setProduct({ ...p })
                            }}>
                                <Box sx={{ border: "1px solid #000", borderRadius: "5px", padding: "1%", margin: ".5%", display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer", "&:hover": { background: "#f0f0f0", opacity: .7 } }}>
                                    <Box sx={{ position: "relative", zIndex: 999,display: "flex", flexDirection: "row", justifyContent: "flex-end", alignItems: "center", width: "100%", marginBottom: "1%", }}>
                                        <FormControlLabel control={<Checkbox checked={product.blanks.filter(blank => blank?._id?.toString() == b?._id?.toString())[0] != undefined} />} />
                                    </Box>
                                    <Box sx={{ marginTop: "-45px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1%" }}>
                                        {styleImages.length > 0 && styleImages.map((si, i) => (
                                            <img key={i} src={`https://${source}.pythiastechnologies.com/api/renderImages/${design.sku}-${b.code?.replace(/-/g, "_")}-${si.blankImage?.image.split("/")[si.blankImage?.image.split("/").length - 1].split(".")[0]}-${si.colorName?.replace(/\//g, "_")}-${si.side}.jpg}?width=400`} alt={`${b.code} image`} width={400} height={400} style={{ width: "auto", height: "auto", maxHeight: styleImages.length > 1 ? "50%" : "100%", maxWidth: styleImages.length > 2 ? "33%" : styleImages.length > 1? "50%" : "100%" }} /> 
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
                        <Button fullWidth sx={{ margin: "1% 2%", background: "#645D5B", color: "#ffffff" }} onClick={()=>{
                            if(product.blanks.length > 0) {
                                let colors = []
                                let sizs= []
                                for(let b of product.blanks) {
                                    for (let color of b.colors) {
                                        if (!colors.filter(c => c._id.toString() == color._id.toString())[0]) {
                                            colors.push(color)
                                        }
                                    }
                                    for(let s of b.sizes){
                                        if(!sizs.filter(si=> s.name == si.name)[0]) sizs.push(s)
                                    }
                                }
                                let newProductColors = [];
                                for(let c of product.colors){
                                    if(colors.filter(co => co._id.toString() == c._id.toString())[0]) {
                                        newProductColors.push(c)
                                    }
                                }
                                let p = {...product}
                                p.sizes = sizs
                                p.colors = newProductColors
                                console.log(source, "source")
                                if(source == "simplysage") getUpcs({blanks: p.blanks, design})
                                document.getElementById('create-product-modal').scrollTop = 0;
                                setProduct({...p})
                                setSizes(sizs)
                                setColors(colors)
                                setStage("colors")
                            }
                        }}>Next</Button>
                    </Grid2>                    
                </Grid2>}
                {stage == "colors" && <Grid2 container spacing={2} sx={{ marginBottom: "2%" }}>
                    <Grid2 size={12}>
                        <Typography variant="h5" sx={{ color: "#000", textAlign: "center", marginBottom: "1%" }}>Select Colors</Typography>
                        <Grid2 container spacing={3}>
                            <Grid2 size={{xs: 12, sm: 3, md: 3}}>
                                <Card sx={{ padding: "2%", marginBottom: "2%", height: "100%" }}>
                                    <Typography variant="body1" sx={{ color: "#000", textAlign: "center", marginBottom: "1%" }}>Select Thread colors </Typography>
                                    <Box>
                                        <hr />
                                        <Grid2 container spacing={2} sx={{ marginTop: "2%" }}>
                                            {
                                                design.threadColors.map(tc => { return colors.filter(c => c._id.toString() == tc.toString())[0] }).map(c => (
                                                    <Grid2 key={c._id.toString()} size={1} sx={{ "&:hover": { cursor: 'pointer', opacity: .6 } }} onClick={() => {
                                                        let p = { ...product }
                                                        if (!p.threadColors.filter(co => co._id.toString() == c._id.toString())[0]) p.threadColors.push(c)
                                                        else {
                                                            let colors = [];
                                                            for (let co of p.threadColors) {
                                                                if (co._id.toString() != c._id.toString()) colors.push(co)
                                                            }
                                                            p.threadColors = colors
                                                        }
                                                        setProduct({ ...p })
                                                    }}>
                                                        <Box sx={{ background: c.hexcode, padding: "3%", width: "100%", height: "45px", borderRadius: "10px", boxShadow: `2px 2px 2px ${c.hexcode}` }}>
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
                            <Grid2 size={{xs: 12, sm: 9, md: 8}}>
                                <Card sx={{ padding: "2%", marginBottom: "2%", height: "100%" }}>
                                    <Typography variant="body1" sx={{ color: "#000", textAlign: "center", marginBottom: "1%" }}>Select the colors you want to use for this product. You can select multiple colors.</Typography>
                                    <Box>
                                        <hr />
                                        <Grid2 container spacing={2} sx={{ marginTop: "2%" }}>
                                            {
                                                cols.map(c => (
                                                    <Grid2 key={c._id} size={{xs: 2, sm: 1.5, md: 1}} sx={{ "&:hover": { cursor: 'pointer', opacity: .6 } }} onClick={() => {
                                                        let p = { ...product }
                                                        if (!p.colors.filter(co => co._id.toString() == c._id.toString())[0]) p.colors.push(c)
                                                        else {
                                                            let colors = [];
                                                            for (let co of p.colors) {
                                                                if (co._id.toString() != c._id.toString()) colors.push(co)
                                                            }
                                                            p.colors = colors
                                                        }
                                                        setProduct({ ...p })
                                                    }}>
                                                        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", background: c.hexcode, padding: "3%", width: "100%", height: "45px", borderRadius: "10px", boxShadow: `2px 2px 2px ${c.hexcode}` }}>
                                                            {product.colors.filter(co => co._id.toString() == c._id.toString())[0] && <CheckIcon sx={{ color: c.color_type == "dark" ? "#fff" : "#000", marginLeft: "10px", marginTop: "10px" }} />}
                                                        </Box>
                                                        <Typography sx={{ fontSize: ".6rem", textAlign: "center" }}>{c.name}</Typography>
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
                                    options={product.colors.map(c => { return { value: c, label: <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "space-between", padding: "1% 15%" }}><Box sx={{ background: c.hexcode, padding: "1% 15%", width: {xs: "2%", md: "1%"}, height: "35px", borderRadius: "10px" }}></Box><Box sx={{ padding: "2%" }}><Typography>{c.name}</Typography></Box></Box> } })}
                                    value={product.defaultColor && {
                                        value: product.defaultColor, label: <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "space-between", padding: "1% 15%" }}><Box sx={{ background: product.defaultColor.hexcode, padding: {xs: "10%", md: "5%"}, width: "1%", height: "35px", borderRadius: "10px" }}></Box><Box sx={{ padding: "2%" }}><Typography>{product.defaultColor.name}</Typography></Box></Box>
                                    }}
                                    onChange={(val) => {
                                        let p = { ...product }
                                        p.defaultColor = val.value,
                                            setProduct({ ...p })
                                    }}
                                />
                            </Grid2>
                            <Grid2 size={{ xs: 0, sm: 0, md: 1 }}></Grid2>
                            <Grid2 size={{ xs: 0, sm: 3, md: 3 }}>
                                
                            </Grid2>
                            <Grid2 size={{ xs: 12, sm: 9, md: 8 }}>
                                <Card sx={{display: "flex", flexDirection: "column", justifyContent: "center", padding: "2% 8%"}}>
                                    <Typography variant="h5" sx={{ color: "#000", textAlign: "center", marginBottom: "1%" }}>Select Sizes</Typography>
                                    <Grid2 container spacing={2}>
                                        {sizes.map(s => (
                                            <Grid2 size={{xs:3, md: 2}} key={s._id}>
                                                
                                                <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "center" }}>
                                                    <Box sx={{ width: "100%", padding: "5%", border: "1px solid #ccc", borderRadius: "5px", textAlign: "center", marginBottom: "5%", background: product.sizes.filter(si => si.name == s.name)[0] ? "#eee" : "#fff" }} onClick={() => {
                                                        let p = { ...product }
                                                        if (!p.sizes.filter(si => si.name == s.name)[0]) p.sizes.push(s)
                                                        else {
                                                            let sizes = []
                                                            for (let si of p.sizes) {
                                                                if (si.name != s.name) sizes.push(si)
                                                            }
                                                            p.sizes = sizes
                                                        }
                                                        setProduct({ ...p })
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
                        </Grid2>

                        <Box>
                            <Typography textAlign={"center"}>Number of Variants: {product.blanks.length * (product.threadColors.length > 0? product.threadColors.length: 1) * product.colors.length * product.sizes.length}</Typography>
                        </Box>
                        <Grid2 container spacing={2} sx={{padding: "2%"}}>
                            <Grid2 size={6}>
                                <Button fullWidth sx={{ margin: "1% 2%", background: "#645D5B", color: "#ffffff" }} onClick={()=>{setStage("blanks")}}>Back</Button>
                            </Grid2>
                            <Grid2 size={6}>
                                <Button fullWidth sx={{ margin: "1% 2%", background: "#645D5B", color: "#ffffff" }} onClick={()=>{
                                    let imgs = []
                                    product.blanks.map(b => {
                                        if (product.threadColors.length > 0) {
                                            for (let tc of product.threadColors) {
                                                for (let ti of Object.keys(design.threadImages[tc.name] ? design.threadImages[tc.name] : {})) {
                                                    for (let col of product.colors) {
                                                        for (let bm of b.multiImages[ti].filter(m => m.color.toString() == col._id.toString() && m.imageGroup.includes(product.imageGroup)).length > 0 ? b.multiImages[ti].filter(m => m.color.toString() == col._id.toString() && m.imageGroup.includes(product.imageGroup)) : b.multiImages[ti].filter(m => m.color.toString() == col._id.toString() && m.imageGroup.includes("default"))) {
                                                            imgs.push({ image: encodeURI(`https://${source}.pythiastechnologies.com/api/renderImages/${design.sku}-${b.code.replace(/-/g, "_")}-${bm.image.split("/")[bm.image.split("/").length - 1].split(".")[0]}-${col.name.replace(/\//g, "_")}-${ti}-${tc.name}.jpg}?width=400`), color: col, threadColor: tc, side: ti, blank: b, sku: `${design.printType}_${design.sku}_${col.sku}_${b.code.replace(/-/g, "_")}_${bm.image.split("/")[bm.image.split("/").length - 1].split(".")[0]}-${col.name.replace(/\//g, "_")}-${ti}-${tc.name}` })
                                                        }
                                                    }
                                                }
                                            }
                                        }else{
                                            for (let ti of Object.keys(design.images ? design.images : {})) {
                                                for (let col of product.colors) {
                                                    for (let bm of b.multiImages[ti].filter(m => m.color.toString() == col._id.toString() && m.imageGroup.includes(product.imageGroup)).length > 0 ? b.multiImages[ti].filter(m => m.color.toString() == col._id.toString() && m.imageGroup.includes(product.imageGroup)) : b.multiImages[ti].filter(m => m.color.toString() == col._id.toString() && m.imageGroup.includes("default"))) {
                                                        imgs.push({ image: encodeURI(`https://${source}.pythiastechnologies.com/api/renderImages/${design.sku}-${b.code.replace(/-/g, "_")}-${bm.image.split("/")[bm.image.split("/").length - 1].split(".")[0]}-${col.name.replace(/\//g, "_")}-${ti}.jpg}?width=400`), color: col, side: ti, blank: b, sku: `${design.printType}_${design.sku}_${col.sku}_${b.code.replace(/-/g, "_")}_${bm.image.split("/")[bm.image.split("/").length - 1].split(".")[0]}-${col.name.replace(/\//g, "_")}-${ti}` })
                                                        console.log(imgs, "image added");
                                                    }
                                                }
                                            }
                                        }
                                    })
                                    console.log(imgs, "images")
                                    console.log(product.imageGroup, "image group",)
                                    if(source == "simplysage") {
                                        let variantsLength = product.blanks.length * (product.threadColors.length > 0 ? product.threadColors.length : 1) * product.colors.length * product.sizes.length
                                        console.log(variantsLength, "variants length", upcs.length, "upcs length")
                                        if(variantsLength > upcs.length){
                                            getTempUpcs(variantsLength - upcs.length)
                                            
                                        }
                                    }
                                    document.getElementById('create-product-modal').scrollTop = 0;
                                    setImages(imgs)
                                    setStage("product_images")
                                }}>Next</Button>   
                            </Grid2>   
                        </Grid2>
                    </Grid2>
                </Grid2>}
                {stage == "product_images" && 
                    <Grid2 size={12} sx={{padding: "0% 4%"}}>
                        <CreatableSelect
                            placeholder="Image Group"
                            options={imageGroups.map(g => { return { value: g, label: g } })}
                            value={product.imageGroup ? { value: product.imageGroup, label: product.imageGroup } : { value: "default", label: "default" }}
                            onChange={(val) => {    
                                setProduct({...product, imageGroup: val ? val.value : null})
                                let imgs = []
                                product.blanks.map(b => {
                                    if (product.threadColors.length > 0) {
                                        for (let tc of product.threadColors) {
                                            for (let col of product.colors) {
                                                for (let ti of Object.keys(design.threadImages[tc.name] ? design.threadImages[tc.name] : {})) {
                                                    for (let bm of b.multiImages[ti].filter(m => m.color.toString() == col._id.toString() && m.imageGroup.includes(val.value)).length > 0 ? b.multiImages[ti].filter(m => m.color.toString() == col._id.toString() && m.imageGroup.includes(val.value)) : b.multiImages[ti].filter(m => m.color.toString() == col._id.toString() && m.imageGroup.includes("default"))) {
                                                        imgs.push({ image: encodeURI(`https://${source}.pythiastechnologies.com/api/renderImages/${design.sku}-${b.code.replace(/-/g, "_")}-${bm.image.split("/")[bm.image.split("/").length - 1].split(".")[0]}-${col.name.replace(/\//g, "_")}-${ti}-${tc.name}.jpg}?width=400`), color: col, threadColor: tc, side: ti, blank: b, sku: `${design.printType}_${design.sku}_${col.sku}_${b.code.replace(/-/g, "_")}_${bm.image.split("/")[bm.image.split("/").length - 1].split(".")[0]}-${col.name.replace(/\//g, "_")}-${ti}-${tc.name}` })
                                                    }
                                                }
                                            }
                                        }
                                    } else {
                                        for (let col of product.colors) {
                                            for (let ti of Object.keys(design.images ? design.images : {})) {
                                                for (let bm of b.multiImages[ti].filter(m => m.color.toString() == col._id.toString() && m.imageGroup.includes(val.value)).length > 0 ? b.multiImages[ti].filter(m => m.color.toString() == col._id.toString() && m.imageGroup.includes(val.value)) : b.multiImages[ti].filter(m => m.color.toString() == col._id.toString() && m.imageGroup.includes("default"))) {
                                                    imgs.push({ image: encodeURI(`https://${source}.pythiastechnologies.com/api/renderImages/${design.sku}-${b.code.replace(/-/g, "_")}-${bm.image.split("/")[bm.image.split("/").length - 1].split(".")[0]}-${col.name.replace(/\//g, "_")}-${ti}.jpg}?width=400`), color: col, side: ti, blank: b, sku: `${design.printType}_${design.sku}_${col.sku}_${b.code.replace(/-/g, "_")}_${bm.image.split("/")[bm.image.split("/").length - 1].split(".")[0]}-${col.name.replace(/\//g, "_")}-${ti}` })
                                                }
                                            }
                                        }
                                    }
                                })
                                setImages(imgs)
                            }}
                        />
                        <Typography variant="h5" sx={{ color: "#000", textAlign: "center", marginBottom: "1%" }}>Select Product Images</Typography>
                        <Grid2 container spacing={1} sx={{ marginBottom: "2%" }}>
                            {images.map((i, j) => (
                                <Grid2 key={j} size={{ xs: 6, sm: 3, md: 3 }} sx={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "1%", cursor: "pointer", "&:hover": {  opacity: .7 } }} onClick={() => {
                                    let p = { ...product }
                                    if(!p.productImages.filter(img => img.image == i.image)[0]) p.productImages.push(i)
                                    else{
                                        let imgs = [];
                                        for (let img of p.productImages) {
                                            if (img.image != i.image) imgs.push(img)
                                        }
                                        p.productImages = imgs
                                    }
                                    setProduct({ ...p })
                                }}>
                                    <img src={i.image} alt={`${i.blank.code} image`} width={300} height={300} style={{ width: "auto", height: "auto", maxHeight: "100%", maxWidth: "100%", }} />
                                    {product.productImages.filter(img => img.image == i.image)[0] && <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "flex-end", alignItems: "center", width: "100%", marginBottom: "1%",  top: "-20%", position: "relative" }}>
                                        <Checkbox checked={true} />
                                    </Box>}
                                    {!product.productImages.filter(img => img.image == i.image)[0] && <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "flex-end", alignItems: "center", width: "100%", marginBottom: "1%",  top: "-20%", position: "relative" }}>
                                        <Checkbox checked={false} />
                                    </Box>}
                                </Grid2>
                            ))}
                        </Grid2>
                        <Grid2 container spacing={2} sx={{ padding: "2%" }}>
                            <Grid2 size={6}>
                                <Button fullWidth sx={{ margin: "1% 2%", background: "#645D5B", color: "#ffffff" }} onClick={() => { setStage("colors") }}>Back</Button>
                            </Grid2>
                            <Grid2 size={6}>
                                <Button fullWidth sx={{ margin: "1% 2%", background: "#645D5B", color: "#ffffff" }} onClick={() => {
                                    document.getElementById('create-product-modal').scrollTop = 0;
                                    setStage("variant_images")
                                }}>Next</Button>
                            </Grid2>
                        </Grid2>  
                    </Grid2>
                }
                {stage == "variant_images" && 
                    <Grid2 size={12} sx={{padding: "0% 4%"}}>
                        <Typography variant="h5" sx={{ color: "#000", textAlign: "center", marginBottom: "1%" }}>Select Variant Images</Typography>
                        <Box>
                            <CreateVariantImages product={product} design={design.threadColors.length > 0 ? design.threadImages : design.images} setProduct={setProduct} threadColors={design.threadColors.length > 0? true: false} source={source}/>
                        </Box>
                        <Grid2 container spacing={2} sx={{ padding: "2%" }}>
                            <Grid2 size={6}>
                                <Button fullWidth sx={{ margin: "1% 2%", background: "#645D5B", color: "#ffffff" }} onClick={() => { setStage("product_images") }}>Back</Button>
                            </Grid2>
                            <Grid2 size={6}>
                                <Button fullWidth sx={{ margin: "1% 2%", background: "#645D5B", color: "#ffffff" }} onClick={() => {
                                    let p = { ...product }
                                    p.title = p.title ? p.title : `${design.name} - ${p.blanks.map(b => b.name).join(" and ")}`
                                    p.description = p.description ? p.description : `${design.description} - ${p.blanks.map(b => b.description).join(" ")}`
                                    setProduct({ ...p })
                                    document.getElementById('create-product-modal').scrollTop = 0;
                                    setStage("information")
                                }}>Next</Button>
                            </Grid2>
                        </Grid2>  
                    </Grid2>
                }
                {stage == "information" && 
                    <Grid2 size={12} sx={{padding: "0% 4%"}}>
                        <Typography variant="h6" sx={{ color: "#000", textAlign: "center", marginBottom: "1%" }}>Product Information</Typography>
                        <Grid2 container spacing={2} sx={{ marginBottom: "2%", padding: "2%" }}>
                            <Grid2 size={12}>    
                                <TextField fullWidth label="Title" variant="outlined" value={product.title} onChange={(e) => {
                                    let p = { ...product }
                                    p.title = e.target.value
                                    setProduct({ ...p })
                                }} />
                            </Grid2>
                            <Grid2 size={12}>
                                <TextField fullWidth label="Description" multiline variant="outlined" value={product.description} onChange={(e) => {
                                    let p = { ...product }
                                    p.description = e.target.value
                                    setProduct({ ...p })
                                }} />
                            </Grid2>
                            <Grid2 size={12}>
                                <CreatableSelect isMulti placeholder="Tags" options={design.tags.map(tag => {return { value: tag, label: tag }})} value={design.tags.map(tag => { return { value: tag, label: tag } })} onChange={async (newValue) => {
                                    let p = { ...product }
                                    p.brand = newValue.value
                                    if (!brands.filter(b => b.name == newValue.value)[0]) {
                                        let res = await axios.post("/api/admin/brands", { name: newValue.value })
                                        if (res.data.error) alert(res.data.msg)
                                        else {
                                            setBrands(res.data.brands)
                                        }
                                    }
                                    
                                    setProduct({ ...p })
                                }} />
                            </Grid2>
                            <Grid2 size={4}>
                                <CreatableSelect placeholder="Select Brand" options={brands.map(brand => ({ value: brand.name, label: brand.name }))} value={product.brand? { value: product.brand, label: product.brand } : null} onChange={async(newValue) => {
                                    let p = { ...product }
                                    p.brand = newValue.value
                                    if(!brands.filter(b => b.name == newValue.value)[0]) {
                                        let res = await axios.post("/api/admin/brands", { name: newValue.value })
                                        if (res.data.error) alert(res.data.msg)
                                        else {
                                            setBrands(res.data.brands)
                                        }
                                    }
                                    setProduct({ ...p })
                                }} />
                            </Grid2>
                            <Grid2 size={4}>
                                <CreatableSelect placeholder="Select Gender" options={genders.map(gender => ({ value: gender.name, label: gender.name }))} value={product.gender ? { value: product.gender, label: product.gender } : null} onChange={async(newValue) => {
                                    let p = { ...product }
                                    p.gender = newValue.value
                                    if (!genders.filter(s => s.name == newValue.value)[0]) {
                                        let res = await axios.post("/api/admin/oneoffs", { type: "gender", value: newValue.value })
                                        if (res.data && res.data.error) alert(res.data.msg)
                                        else setGenders(res.data.genders)
                                    }
                                    setProduct({ ...p })
                                }} />
                            </Grid2>
                            <Grid2 size={4}>
                                <CreatableSelect placeholder="Select Season" options={seasons.map(season => ({ value: season.name, label: season.name }))} value={product.season ? { value: product.season, label: product.season } : null} onChange={async (newValue) => {
                                    let p = { ...product }
                                    p.season = newValue.value
                                    if (!seasons.filter(s => s.name == newValue.value)[0]) {
                                        let res = await axios.post("/api/admin/oneoffs", { type: "season", value: newValue.value })
                                        if (res.data && res.data.error) alert(res.data.msg)
                                        else setSeasons(res.data.seasons)
                                    }
                                    setProduct({ ...p })
                                }} />
                            </Grid2>
                        </Grid2>
                        <Grid2 container spacing={2} sx={{ padding: "2%" }}>
                            <Grid2 size={6}>
                                <Button fullWidth sx={{ margin: "1% 2%", background: "#645D5B", color: "#ffffff" }} onClick={() => { setStage("variant_images") }}>Back</Button>
                            </Grid2>
                            <Grid2 size={6}>
                                <Button fullWidth sx={{ margin: "1% 2%", background: "#645D5B", color: "#ffffff" }} onClick={async () => {
                                    let variants = {};
                                    if(design.threadColors.length > 0) {
                                        for (let d of Object.keys(design.threadImages)){
                                            for(let blank of product.blanks){
                                                for(let color of product.colors){
                                                    if(blank.colors.filter(c => c._id.toString() == color._id.toString())[0]){
                                                        for(let size of product.sizes){
                                                            let upc
                                                            if (upcs?.filter(u => u.design._id.toString() == design._id.toString() && u.blank._id.toString() == blank._id.toString() && u.color._id.toString() == color._id.toString() && u.size == size.name)[0]) {
                                                                upc = upcs.filter(u => u.design._id.toString() == design._id.toString() && u.blank._id.toString() == blank._id.toString() && u.color._id.toString() == color._id.toString() && u.threadColor._id == colors.filter(tc => tc.name == d)[0]?._id && u.size == size.name)[0]
                                                            } else {
                                                                upc = tempUpcs.filter(u => u.used != true)[0]
                                                                if (upc) {
                                                                    tempUpcs.filter(u => u.used != true)[0].used = true
                                                                }
                                                            }
                                                            let img = product.variantImages[blank.code] && product.variantImages[blank.code][d] && product.variantImages[blank.code][d][color.name] && product.variantImages[blank.code][d][color.name].image
                                                            if(!variants[blank.code]) variants[blank.code] = {}
                                                            if(!variants[blank.code][d]) variants[blank.code][d] = {}
                                                            if(!variants[blank.code][d][color.name]) variants[blank.code][d][color.name] = []
                                                            variants[blank.code][d][color.name].push({ image: img, size: size, color: color, sku: await CreateSku({ blank, color, size, design, threadColor: d }), threadColor: colors.filter(tc => tc.name == d)[0], blank: blank, upc: upc?.upc, gtin: upc?.gtin })    
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }else{
                                        
                                        for (let blank of product.blanks) {
                                            for (let color of product.colors) {
                                                if (blank.colors.filter(c => c._id.toString() == color._id.toString())[0]) {
                                                    for (let size of product.sizes) {
                                                        let upc
                                                        if (upcs?.filter(u => u.design._id.toString() == design._id.toString() && u.blank._id.toString() == blank._id.toString() && u.color._id.toString() == color._id.toString() && u.size == size.name)[0]) {
                                                            upc = upcs.filter(u => u.design._id.toString() == design._id.toString() && u.blank._id.toString() == blank._id.toString() && u.color._id.toString() == color._id.toString() && u.size == size.name)[0]
                                                        }else{
                                                            upc = tempUpcs.filter(u => u.used != true)[0]
                                                            if(upc) {
                                                                tempUpcs.filter(u => u.used != true)[0].used = true
                                                            }
                                                        }
                                                        let img = product.variantImages && product.variantImages[blank.code] && product.variantImages[blank.code][color.name] && product.variantImages[blank.code][color.name].image
                                                        if (!variants[blank.code]) variants[blank.code] = {}
                                                        if (!variants[blank.code][color.name]) variants[blank.code][color.name] = []
                                                        variants[blank.code][color.name].push({ image: img, size: size, color: color, sku: await CreateSku({ blank, color, size, design, }), blank: blank, upc: upc?.upc, gtin: upc?.gtin })
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    let p = { ...product }
                                    p.variants = variants
                                    p.sku = `${design.sku}-${product.blanks.map(b => b.code).join("-")}`
                                    p.hasThreadColors = design.threadColors.length > 0 ? true : false
                                    document.getElementById('create-product-modal').scrollTop = 0;
                                    setProduct({ ...p })
                                    setStage("preview")
                                }}>Next</Button>
                            </Grid2>
                        </Grid2>  
                    </Grid2>
                }
                {stage == "preview" && <Box>
                    <Typography variant="h6" textAlign={"center"}>Preview</Typography>
                    <ProductImageCarosel productImages={product.productImages} />
                    <Box sx={{ padding: "2%" }}>
                        <List>
                            <ListItem>
                                <ListItemText primary={product.title} secondary={`SKU: ${product.sku} Brand: ${product.brand} ${product.gender ? `Gender: ${product.gender}`: ""} ${product.season ? `Season: ${product.season}`: ""}`} />
                            </ListItem>
                        </List>
                        <List>
                            <ListItem>
                                <ListItemText primary={"Description"} secondary={product.description}  />
                            </ListItem>
                        </List>
                        <List>
                            <ListItem>
                                <ListItemText primary={"Tags"} secondary={product.tags.join(", ")} />
                            </ListItem>
                        </List>
                    </Box>
                    <Box sx={{ padding: "2%" }}>
                        <Typography variant="h6">Variants</Typography>
                        {Object.keys(product.variants).length > 0 && Object.keys(product.variants).map(blank => (
                            <Box key={blank} sx={{ marginBottom: "2%" }}>
                                {!product.hasThreadColors && Object.keys(product.variants[blank]).map(color => (
                                    <Box key={color} sx={{ marginLeft: "2%" }}>
                                        <VariantDisplay blank={blank} color={color} variants={product.variants[blank][color]} />
                                    </Box>
                                ))}
                                {product.hasThreadColors && Object.keys(product.variants[blank]).map(threadColor => (
                                    <Box key={threadColor} sx={{ marginLeft: "2%" }}>
                                        {Object.keys(product.variants[blank][threadColor]).map(color => (
                                            <Box key={color} sx={{ marginLeft: "4%" }}>
                                                <VariantDisplay blank={blank} threadColor={threadColor} color={color} variants={product.variants[blank][threadColor][color]} />
                                            </Box>
                                        ))}
                                    </Box>
                                ))}
                            </Box>
                        ))}
                    </Box>
                    <Grid2 container spacing={2} sx={{ padding: "2%" }}>
                        <Grid2 size={6}>
                            <Button fullWidth sx={{ margin: "1% 2%", background: "#645D5B", color: "#ffffff" }} onClick={() => { setStage("information") }}>Back</Button>
                        </Grid2>
                        <Grid2 size={6}>
                            <Button disabled={loading} fullWidth sx={{ margin: "1% 2%", background: "#645D5B", color: "#ffffff" }} onClick={async () => {
                                setLoading(true)
                                document.getElementById('create-product-modal').scrollTop = 0;
                                let res = await axios.post("/api/admin/products", { product: product });
                                if (res.data.error) alert(res.data.msg)
                                else {
                                    let products = []
                                    products.push(res.data.product)
                                    for(let p of design.products? design.products: []){
                                        if(p._id.toString() != res.data.product._id.toString()) products.push(p)
                                    }
                                    let d = {...design}
                                    d.products = products
                                    setDesign({...d})
                                    updateDesign({...d})
                                    setProduct({ blanks: [], design: design, threadColors: [], colors: [], sizes: [], defaultColor: null, variants: [], productImages: [], variantImages: {} })
                                    setStage("blanks")
                                    setImages([])
                                    setSizes([])
                                    setColors([])
                                    setOpen(false)
                                    setLoading(false)
                                }
                            }}>{loading ? <Box sx={{ display: "flex", alignItems: "center", gap: "2" }}><CircularProgress color="inherit" size={24} /> <Typography variant="body2">Saving ...  </Typography></Box> : product._id != undefined ? "Save" : "Create"}</Button>
                        </Grid2>
                    </Grid2>  
                </Box>}
            </Box>
        </Modal>
    )
}
const VariantDisplay = ({ blank, threadColor, color, variants }) => {
    const [open, setOpen] = useState(false);
    return (
        <Card sx={{ margin: "1% 0%", padding: "1%", background: "#f0f0f0", borderRadius: "10px", boxShadow: "2px 2px 2px #ccc" }}>
            <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: "2%", cursor: "pointer", "&:hover": { opacity: .7 } }} onClick={() => setOpen(!open)}>
                <img src={variants[0].image?.replace("=400", "=75")} alt={`${blank} ${threadColor} ${color}`} width={75} height={75} style={{ width: "auto", height: "auto", maxHeight: "100%", maxWidth: "100%" }} />
                <Typography variant="body2">{blank}_{threadColor}_{color}</Typography>
                {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
            </Box>
            {open && (
                <Box sx={{ padding: "2%" }}>
                    <List>
                        {variants.map(variant => (
                            <ListItem key={variant.id}>
                                <ListItemAvatar>
                                    <Avatar>
                                        <img src={variant.image?.replace("=400", "=75")} alt={`${blank} ${threadColor} ${color}`} width={75} height={75} style={{ width: "auto", height: "auto", maxHeight: "100%", maxWidth: "100%" }} />
                                    </Avatar>
                                </ListItemAvatar>
                                <ListItemText primary={`${variant.sku}`} secondary={`Blank: ${variant.blank.name}, Color: ${variant.color.name}, Size: ${variant.size.name}`} />
                                {variant.upc && <ListItemText primary={`UPC: ${variant.upc}`} secondary={`GTIN: ${variant.gtin}`} />}
                            </ListItem>
                        ))}
                    </List>
                </Box>
            )}
        </Card>
    )
}
const ProductImageCarosel = ({ productImages }) => {
    const [image, setImage] = useState(0)
    const [loading, setLoading] = useState(true)
    return (
        <Grid2 container spacing={2} sx={{ padding: "2%" }}>
            <Grid2 size={{xs: 2, lg: 3}}></Grid2>
            <Grid2 size={1}>
                <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "center", padding: "2%", minHeight: "100%", "&:hover": { cursor: "pointer", background: "#f0f0f0" } }} onClick={() => { setLoading(true); setImage(image - 1 < 0 ? productImages.length - 1 : image - 1) }}>
                    <KeyboardArrowLeftIcon sx={{ fontSize: "2rem", color: "#645D5B", marginTop: "50%" }} />
                </Box>
            </Grid2>
            <Grid2 size={{ xs: 6, lg: 4 }}>
                <img onLoad={() => setLoading(false)} src={productImages[image]?.image} alt={productImages[image]?.sku} style={{ width: "100%", height: "auto", maxWidth: "100%", maxHeight: "100%" }} />
                {loading && <Box sx={{ display: 'flex', position: "relative", top: "-50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 999, background: "rgba(255, 255, 255, 0.8)", padding: "2%", borderRadius: "10px", alignItems: "center", justifyContent: "center", marginBottom: "-15%" }}>
                    <CircularProgress color="secondary" /> <Typography color={"#000"}>Loading ...</Typography>
                </Box>}
            </Grid2>
            <Grid2 size={1}>
                <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "center", padding: "2%", minHeight: "100%", "&:hover": { cursor: "pointer", background: "#f0f0f0" } }} onClick={() => { setLoading(true); setImage(image + 1 >= productImages.length ? 0 : image + 1) }}>
                    <KeyboardArrowRightIcon sx={{ fontSize: "2rem", color: "#645D5B", marginTop: "50%" }} />
                </Box>
            </Grid2>
            <Grid2 size={{ xs: 2, lg: 3 }}></Grid2>
            <Grid2 size={1}></Grid2>
            <Grid2 size={10}>
                <ImageList cols={12} gap={1}>
                    {productImages.map((variant, i) => (
                        <ImageListItem key={variant.sku} sx={{ width: "100%", height: "auto", cursor: "pointer", border: image == i ? "2px solid rgb(41, 6, 240)" : "none", opacity: image == i ? 0.6 : 1 }} onClick={() => { setLoading(true); setImage(i) }}>
                            <img src={variant.image} alt={variant.sku} />

                        </ImageListItem>
                    ))}
                </ImageList>
            </Grid2>
            <Grid2 size={1}></Grid2>
        </Grid2>
    )
}
const CreateVariantImages = ({ product, setProduct, design, threadColors, source }) => {
    let imgs = {}
    if (!threadColors) {
        for (let side of Object.keys(design ? design : {})) {
            for (let blank of product.blanks) {
                for (let color of product.colors) {
                    for (let img of blank.multiImages[side]?.filter(i => i.color.toString() == color._id.toString() && i.imageGroup.includes(product.imageGroup)).length > 0 ? blank.multiImages[side]?.filter(i => i.color.toString() == color._id.toString() && i.imageGroup.includes(product.imageGroup)) : blank.multiImages[side]?.filter(i => i.color.toString() == color._id.toString() && i.imageGroup.includes("default"))) {
                        if (!imgs[blank.code]) imgs[blank.code] = {}
                        if (!imgs[blank.code][color.name]) imgs[blank.code][color.name] = []
                        imgs[blank.code][color.name].push({ image: encodeURI(`https://${source}.pythiastechnologies.com/api/renderImages/${product.design.sku}-${blank.code.replace(/-/g, "_")}-${img.image.split("/")[img.image.split("/").length - 1].split(".")[0]}-${color.name.replace(/\//g, "_")}-${side}.jpg?width=400`), sku: `${product.design.printType}_${product.design.sku}_${color.sku}_${blank.code.replace(/-/g, "_")}_${img.image.split("/")[img.image.split("/").length - 1].split(".")[0]}-${color.name.replace(/\//g, "_")}-${side}` })

                    }
                }
            }
        }
    } else {
        for (let threadColor of Object.keys(design)) {
            for (let side of Object.keys(design[threadColor])) {
                for (let blank of product.blanks) {
                    for (let color of product.colors) {
                        for (let img of blank.multiImages[side]?.filter(i => i.color.toString() == color._id.toString() && i.imageGroup.includes(product.imageGroup)).length > 0 ? blank.multiImages[side]?.filter(i => i.color.toString() == color._id.toString() && i.imageGroup.includes(product.imageGroup)) : blank.multiImages[side]?.filter(i => i.color.toString() == color._id.toString() && i.imageGroup.includes("default"))) {
                            if (!imgs[blank.code]) imgs[blank.code] = {}
                            if (!imgs[blank.code][threadColor]) imgs[blank.code][threadColor] = {}
                            if (!imgs[blank.code][threadColor][color.name]) imgs[blank.code][threadColor][color.name] = []
                            imgs[blank.code][threadColor][color.name].push({ image: encodeURI(`https://${source}.pythiastechnologies.com/api/renderImages/${product.design.sku}-${blank.code.replace(/-/g, "_")}-${img.image.split("/")[img.image.split("/").length - 1].split(".")[0]}-${color.name.replace(/\//g, "_")}-${side}-${threadColor}.jpg?width=400`), sku: `${product.design.printType}_${product.design.sku}_${color.sku}_${blank.code.replace(/-/g, "_")}_${img.image.split("/")[img.image.split("/").length - 1].split(".")[0]}-${color.name.replace(/\//g, "_")}-${side}-${threadColor}` })

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
                    <Grid2 container spacing={2}>
                        {imgs[b] && Object.keys(imgs[b]).map((c, j) => (
                            <Grid2 key={j} size={6}>
                                <Typography variant="body1" sx={{ color: "#000", textAlign: "center", marginBottom: "1%" }}>{c}</Typography>
                                <Grid2 container spacing={2} sx={{ "&:hover": { cursor: "pointer", opacity: .7 } }}>
                                    {imgs[b][c].map((img, k) => (
                                        <Grid2 key={k} size={4} onClick={() => {
                                            let p = { ...product }
                                            if(!p.variantImages) p.variantImages = {}
                                            if (p.variantImages && !p.variantImages[b]) p.variantImages[b] = {}
                                            p.variantImages[b][c] = img
                                            setProduct({ ...p })
                                        }}>
                                            <img src={img.image} alt={img.sku} style={{ width: "100%", height: "auto" }} />
                                            {product.variantImages &&product.variantImages[b] && product.variantImages[b][c] && product.variantImages[b][c]?.image == img.image && <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "flex-end", alignItems: "center", width: "100%", marginBottom: "1%", zIndex: 999, top: "-23%", position: "relative" }}>
                                                <Checkbox checked={true} />
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
                                                    let p = { ...product }
                                                    if (!p.variantImages[b]) p.variantImages[b] = {}
                                                    if (!p.variantImages[b][tc]) p.variantImages[b][tc] = {}
                                                    p.variantImages[b][tc][c] = img
                                                    setProduct({ ...p })
                                                }}>
                                                    <img src={img.image} alt={img.sku} style={{ width: "100%", height: "auto" }} />
                                                    {product.variantImages[b] && product.variantImages[b][tc] && product.variantImages[b][tc][c] && product.variantImages[b][tc][c].image == img.image && <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "flex-end", alignItems: "center", width: "100%", marginBottom: "1%", zIndex: 999, top: "-23%", position: "relative" }}>
                                                        <Checkbox checked={true} />
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
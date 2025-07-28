import { Box, Grid2, TextField, Modal, Button, Typography, Card, Divider, FormControlLabel, Checkbox, List, CircularProgress, ListItemText, Avatar, ListItemAvatar, ListItem, ImageList, ImageListItem } from "@mui/material";
import CreatableSelect from "react-select/creatable";
import axios from "axios";
import { useState, useEffect, useRef } from "react";
import CheckIcon from '@mui/icons-material/Check';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';

export const PreviewStage = ({ design, setDesign, setStage, setImages, setSizes, setColors, setProducts, products, updateDesign, releaseHold, loading, setLoading, setUpcs, tempUpcs, setOpen }) => {
    return (
        <Box sx={{ padding: "2%" }}>
            {products.map((product, index) => (
                <Box key={index}>
                    <Typography variant="h6" textAlign={"center"}>Preview</Typography>
                    <ProductImageCarosel productImages={product.productImages} />
                    <Box sx={{ padding: "2%" }}>
                        <List>
                            <ListItem>
                                <ListItemText primary={product.title} secondary={`SKU: ${product.sku} Brand: ${product.brand} ${product.gender ? `Gender: ${product.gender}` : ""} ${product.season ? `Season: ${product.season}` : ""}`} />
                            </ListItem>
                        </List>
                        <List>
                            <ListItem>
                                <ListItemText primary={"Description"} secondary={product.description} />
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
                </Box>
            ))}
            <Grid2 container spacing={2} sx={{ padding: "2%" }}>
                <Grid2 size={6}>
                    <Button fullWidth sx={{ margin: "1% 2%", background: "#645D5B", color: "#ffffff" }} onClick={() => { setStage("information") }}>Back</Button>
                </Grid2>
                <Grid2 size={6}>
                    <Button disabled={loading} fullWidth sx={{ margin: "1% 2%", background: "#645D5B", color: "#ffffff" }} onClick={async () => {
                        setLoading(true)
                        let res = await axios.post("/api/admin/products", { products: products });
                        if (res.data.error) alert(res.data.msg)
                        else {
                            let prods = []
                            for (let p of res.data.products) {
                                if(design.products && design.products.length > 0) {
                                    let existingProduct = design.products.find(prod => prod._id && prod._id.toString() === p._id.toString());
                                    if (existingProduct) {

                                    } else {
                                        prods.push(p);
                                    }
                                }
                            }
                            let d = { ...design }
                            d.products = [...d.products, ...prods]
                            console.log(d.products, "updated products")
                            setDesign({ ...d })
                            updateDesign({ ...d })
                            setStage("blanks")
                            setProducts([])
                            setUpcs([])
                            setImages([])
                            releaseHold()
                            setSizes([])
                            setColors([])
                            setOpen(false)
                            setLoading(false)
                        }
                    }}>{loading ? <Box sx={{ display: "flex", alignItems: "center", gap: "2" }}><CircularProgress color="inherit" size={24} /> <Typography variant="body2">Saving ...  </Typography></Box> : "Create"}</Button>
                </Grid2>
            </Grid2>
        </Box>
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
                                {variant.images && variant.images.length > 0 && variant.images.map((img, i) => (
                                    <ListItemAvatar>
                                        <Avatar key={i}>
                                            <img src={img.image?.replace("=400", "=75")} alt={`${blank} ${threadColor} ${color}`} width={75} height={75} style={{ width: "auto", height: "auto", maxHeight: "100%", maxWidth: "100%" }} />
                                        </Avatar>
                                    </ListItemAvatar>
                                ))}
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
            <Grid2 size={{ xs: 2, lg: 3 }}></Grid2>
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
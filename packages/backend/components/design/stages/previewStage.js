import { Box, Grid2, TextField, Modal, Button, Typography, Card, CardContent, Chip, Stack, IconButton, Paper, Divider, FormControlLabel, Checkbox, List, CircularProgress, ListItemText, Avatar, ListItemAvatar, ListItem, ImageList, ImageListItem } from "@mui/material";
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import axios from "axios";
import { useState, useEffect, useRef } from "react";
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { set } from "mongoose";
import { RetryImage } from "./RetryImage";

const InfoRow = ({ label, value }) => (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
        <Typography variant="caption" sx={{ color: "text.secondary", textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600 }}>{label}</Typography>
        <Typography variant="body2" sx={{ color: "text.primary", wordBreak: "break-word" }}>{value || "—"}</Typography>
    </Box>
);


export const PreviewStage = ({ design, setDesign, setStage, setImages, colors, setSizes, setColors, setProducts, products, updateDesign, releaseHold, loading, setLoading, setUpcs, tempUpcs, setOpen, preview, setPreview, pageProducts, setPageProducts, showToast }) => {
    return (
        <Box sx={{ padding: { xs: 2, sm: 3 }, maxWidth: 1200, margin: "0 auto" }}>
            <Typography variant="h5" sx={{ textAlign: "center", fontWeight: 600, marginBottom: 3 }}>Preview</Typography>
            <Stack spacing={4}>
            {products.map((product, index) => (
                <Card key={index} variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
                    <CardContent sx={{ padding: { xs: 2, sm: 3 } }}>
                        <Typography variant="h5" sx={{ textAlign: "center", fontWeight: 600, marginBottom: 2 }}>{product.title}</Typography>
                        <ProductImageCarosel productImages={product.productImages} defaultColor={product.defaultColor} />

                        <Card variant="outlined" sx={{ marginTop: 3, backgroundColor: "background.default" }}>
                            <CardContent>
                                <Typography variant="subtitle1" sx={{ marginBottom: 2, fontWeight: 600 }}>Details</Typography>
                                <Grid2 container spacing={2}>
                                    <Grid2 size={{ xs: 12, sm: 6, md: 3 }}><InfoRow label="SKU" value={product.sku} /></Grid2>
                                    <Grid2 size={{ xs: 12, sm: 6, md: 3 }}><InfoRow label="Brand" value={product.brand} /></Grid2>
                                    {product.gender && <Grid2 size={{ xs: 12, sm: 6, md: 3 }}><InfoRow label="Gender" value={product.gender} /></Grid2>}
                                    {product.season && <Grid2 size={{ xs: 12, sm: 6, md: 3 }}><InfoRow label="Season" value={product.season} /></Grid2>}
                                    <Grid2 size={{ xs: 12, sm: 6, md: 3 }}>
                                        <Typography variant="caption" sx={{ color: "text.secondary", textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600, display: "block", marginBottom: 0.5 }}>Default Color</Typography>
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                            {product.defaultColor?.hex && <Box sx={{ width: 16, height: 16, borderRadius: "50%", backgroundColor: product.defaultColor.hex, border: "1px solid rgba(0,0,0,0.2)" }} />}
                                            <Typography variant="body2">{product.defaultColor?.name || "—"}</Typography>
                                        </Box>
                                    </Grid2>
                                    <Grid2 size={12}>
                                        <InfoRow label="Description" value={product.description} />
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
                                                                <InfoRow label={category} value={marketplace[category]} />
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
                        {!preview && Object.keys(product.variants).length > 0 && Object.keys(product.variants).map(blank => (
                            <Box key={blank} sx={{ marginBottom: "2%" }}>
                                {!product.hasThreadColors && Object.keys(product.variants[blank]).map(color => (
                                    <Box key={color} sx={{ marginLeft: "2%" }}>
                                        <VariantDisplay blank={blank} color={color} variants={product.variants[blank][color]} product={product} setProducts={setProducts} products={products} />
                                    </Box>
                                ))}
                                {product.hasThreadColors && Object.keys(product.variants[blank]).map(threadColor => (
                                    <Box key={threadColor} sx={{ marginLeft: "2%" }}>
                                        {Object.keys(product.variants[blank][threadColor]).map(color => (
                                            <Box key={color} sx={{ marginLeft: "4%" }}>
                                                {console.log(color)}
                                                <VariantDisplay blank={blank} threadColor={threadColor} color={color} variants={product.variants[blank][threadColor][color]} product={product} setProducts={setProducts} products={products} />
                                            </Box>
                                        ))}
                                    </Box>
                                ))}
                            </Box>
                        ))}
                        {preview && product.variantsArray && product.variantsArray && product.variantsArray.length > 0 && product.blanks.map(blank => {
                            return product.threadColors && product.threadColors.length > 0 ? (
                                <Box key={blank} sx={{ marginBottom: "2%" }}>
                                    <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "flex-end", alignItems: "center" }}>
                                        {!product.isNFProduct && <Button onClick={async () => {
                                            let res = await axios.post("/api/admin/inventory/product", { productId: product._id });
                                            setProducts([res.data.product]);
                                            let prods = []

                                            if (design.products && design.products.length > 0) {
                                                design.products = design.products.filter(prod => prod._id != res.data.product._id)
                                            }
                                            prods.push(res.data.product);

                                            let d = { ...design }
                                            d.products = [...design.products, ...prods]

                                            setDesign({ ...d })
                                            if (pageProducts) {
                                                console.log(pageProducts, "page products before update")
                                                let prods = [...pageProducts]
                                                let newProds = []
                                                for (let po of prods) {
                                                    if (res.data.product._id.toString() === po._id.toString()) {
                                                        newProds.push(res.data.product)
                                                    } else {
                                                        newProds.push(po)
                                                    }
                                                }
                                                console.log(newProds, "new products after update")
                                                setPageProducts([...newProds])
                                            }
                                        }} variant="contained" size="small" startIcon={<AddIcon />} sx={{ textTransform: "none" }}>Add Product Inventory</Button>}
                                    </Box>
                                    {product.threadColors && product.threadColors.length > 0 && product.threadColors.map(threadColor => (
                                        <Box key={threadColor.name} sx={{ marginLeft: "2%" }}>
                                            {product.colors.map(color => {
                                                const variants = product.variantsArray.filter(v => (v.blank?._id? v.blank._id.toString() : v.blank?.toString()) === blank._id.toString() && (v.threadColor?._id? v.threadColor._id.toString() : v.threadColor?.toString()) === threadColor?._id.toString() && (v.color?._id? v.color._id.toString() : v.color?.toString()) === color?._id.toString());
                                                return variants.length > 0 ? (
                                                    <VariantDisplay key={`${blank}-${threadColor}-${color}`} blank={blank.code} threadColor={threadColor.name} color={color.name} variants={variants} fullBlank={blank} product={product} setProducts={setProducts} preview={preview} />
                                                ) : null;
                                            })}
                                        </Box>
                                    ))}
                                    {!product.threadColors || product.threadColors.length === 0 && product.colors.map(color => {
                                        const variants = product.variantsArray.filter(v => (v.blank._id ? v.blank._id.toString() : v.blank?.toString()) === blank._id.toString() && (v.color?._id? v.color._id.toString(): v.color.toString()) === color._id.toString());
                                        return variants.length > 0 ? (
                                            <VariantDisplay key={`${blank.code}-${color.name}`} blank={blank.code} color={color.name} variants={variants} fullBlank={blank} product={product} setProducts={setProducts} preview={preview} design={design} setDesign={setDesign} />
                                        ) : null;
                                    })}
                                </Box>
                            ) : (
                                <Box key={blank.code} sx={{ marginBottom: "2%" }}>
                                    <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "flex-end", alignItems: "center" }}>
                                       {!product.isNFProduct && <Button onClick={async () => {
                                            let res = await axios.post("/api/admin/inventory/product", { productId: product._id });
                                            setProducts([res.data.product]);
                                            let prods = []
                                            
                                            if (design.products && design.products.length > 0) {
                                                design.products = design.products.filter(prod => prod._id != res.data.product._id)
                                            }
                                                prods.push(res.data.product);
                                            
                                            let d = { ...design }
                                            d.products = [...design.products, ...prods]

                                            setDesign({ ...d })
                                            if (pageProducts) {
                                                
                                                let prods = [...pageProducts]
                                                let newProds = []
                                                for (let po of prods) {
                                                    if (res.data.product._id.toString() === po._id.toString()) {
                                                        newProds.push(res.data.product)
                                                    } else {
                                                        newProds.push(po)
                                                    }
                                                }
                                                setPageProducts([...newProds])
                                            }
                                        }} variant="contained" size="small" startIcon={<AddIcon />} sx={{ textTransform: "none" }}>Add Product Inventory</Button>}
                                    </Box>
                                    {product.colors.map(color => {
                                        const variants = product.variantsArray.filter(v => (v.blank._id ? v.blank?._id.toString() : v.blank?.toString()) === blank._id.toString() && (v.color?._id? v.color._id.toString(): v.color?.toString()) === color._id.toString());
                                        return variants.length > 0 ? (
                                            <VariantDisplay key={`${blank.code}-${color.name}`} blank={blank.code} color={color.name} variants={variants} fullBlank={blank} product={product} setProducts={setProducts} preview={preview} pageProducts={pageProducts} setPageProducts={setPageProducts} design={design} setDesign={setDesign} />
                                        ) : null;
                                    })}
                                </Box>
                            );
                        })}
                        </Box>
                    </CardContent>
                </Card>
            ))}
            </Stack>
            {!preview && <Grid2 container spacing={2} sx={{ padding: "2%", justifyContent: "space-between", marginTop: 2 }}>
                <Grid2 size="auto">
                    <Button variant="outlined" size="large" sx={{ minWidth: 160 }} onClick={() => { setStage("information") }}>Back</Button>
                </Grid2>
                <Grid2 size="auto">
                    <Button variant="contained" color="primary" size="large" disabled={loading} sx={{ minWidth: 160 }} onClick={async () => {
                        setLoading(true)
                        let res = await axios.post("/api/admin/products", { products: products }).catch(err => {
                            console.log(err.response.data)
                            setLoading(false)
                            return { data: { error: true, msg: err.response.data?.msg || "Failed to save product" } };
                        });
                        if (res.data.error) {
                            showToast?.(res.data.msg || "Failed to save product", "error")
                            setLoading(false)
                        }
                        else {
                            showToast?.("Product saved", "success")
                            let prods = []
                            for (let p of res.data.products) {
                                if(design.products && design.products.length > 0) {
                                    design.products = design.products.filter(prod=> prod._id != p._id)
                                }
                                prods.push(p);
                            }
                            let d = { ...design }
                            d.products = [...design.products, ...prods]
                            if(pageProducts){
                                let prods = [...pageProducts]
                                let newProds = []
                                for(let po of prods){
                                    if(res.data.products.filter(p => p._id.toString() === po._id.toString()).length > 0) {
                                        newProds.push(res.data.products.filter(p => p._id.toString() === po._id.toString())[0])
                                    }else{
                                        newProds.push(po)
                                    }
                                }
                                setPageProducts([...newProds])
                            }
                            //console.log(d.products, "updated products")
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
            </Grid2>}
            {preview && <Box sx={{ display: "flex", justifyContent: "flex-end", padding: "2%" }}><Button variant="outlined" size="large" sx={{ minWidth: 160 }} onClick={() => { setPreview(false); setStage("blanks"); setProducts([]); setUpcs([]); setImages([]); setSizes([]); setColors([]); setOpen(false) }}>Close</Button></Box>}
        </Box>
    )
}

export const VariantDisplay = ({ blank, threadColor, color, variants, fullBlank, product, setProducts, products, setProduct, preview, pageProducts, setPageProducts, design, setDesign }) => {
    const [open, setOpen] = useState(false);
    const [removeOpen, setRemoveOpen] = useState(false);
    const [priceUpdate, setPriceUpdate] = useState(false);
    const [variant, setVariant] = useState({});
    const [inventoryOpen, setInventoryOpen] = useState(false);
    let removeVariants = async () => {
        let prod = { ...product };
        //console.log(prod, "product to update");
        if (prod.variants) {
            let newVariants = {};
            for (let b of Object.keys(prod.variants)) {
                newVariants[b] = {};
                if (threadColor) {
                    for (let tc of Object.keys(prod.variants[b])) {
                        newVariants[b][tc] = {};
                        for (let c of Object.keys(prod.variants[b][threadColor])) {
                            if (tc == threadColor && c == color) {

                            }
                            else newVariants[b][tc][c] = prod.variants[b][tc][c]
                        }
                    }
                } else {
                    for (let c of Object.keys(prod.variants[b])) {
                        if (c !== color)
                            newVariants[b][c] = prod.variants[b][c];
                    }
                }
            }
            prod.variants = newVariants
            let prods = []
            for (let p of products) {
                if (p._id.toString() === prod._id.toString()) {
                    prods.push(prod);
                } else {
                    prods.push(p);
                }
            }
            setProducts([...prods]);
        }
        else if (prod.variantsArray && prod.variantsArray.length > 0) {
            console.log("Removing variants from variantsArray", variants, "here ");
            if (variants[0]._id != undefined && variants[0]._id != null) {
                console.log("Removing variants from variantsArray", blank, threadColor, color);
                let vArray = prod.variantsArray.filter(v => !variants.map(va => va._id.toString()).includes(v._id.toString()));
                prod.variantsArray = vArray;
                console.log(vArray, "new variants array");
                let res = await axios.put("/api/admin/products", { product: prod });
                console.log(res.data, "updated product", setProducts, "set products");
                if(design && design.products && design.products.length > 0) {
                    let prods = []

                    if (design && design?.products && design?.products.length > 0) {
                        design.products = design.products.filter(prod => prod._id != res.data.product._id)
                    }
                    prods.push(res.data.product);

                    let d = { ...design }
                    d.products = [...design?.products, ...prods]

                    setDesign({ ...d })
                }
                if (pageProducts) {

                    let prods = [...pageProducts]
                    let newProds = []
                    for (let po of prods) {
                        if (res.data.product._id.toString() === po._id.toString()) {
                            newProds.push(res.data.product)
                        } else {
                            newProds.push(po)
                        }
                    }
                    console.log(newProds, "new products after update")
                    setPageProducts([...newProds])
                }
                setProducts([{...res.data.product}]);
            }else{
                //console.log("Removing variants from variantsArray", blank, threadColor, color, "herer");
                let vArray = prod.variantsArray.filter(v => !(v.blank.code === blank && v.threadColor === threadColor?.name && v.color.name === color));
                console.log(vArray, "new variants array");
                prod.variantsArray = vArray;
                if(setProducts)setProducts([prod]);
                else setProduct({...prod});
                let prods = []

                if (design.products && design.products.length > 0) {
                    design.products = design.products.filter(prod => prod._id != res.data.product._id)
                }
                prods.push(res.data.product);

                let d = { ...design }
                d.products = [...design.products, ...prods]

                setDesign({ ...d })
                if (pageProducts) {

                    let prods = [...pageProducts]
                    let newProds = []
                    for (let po of prods) {
                        if (res.data.product._id.toString() === po._id.toString()) {
                            newProds.push(res.data.product)
                        } else {
                            newProds.push(po)
                        }
                    }
                    setPageProducts([...newProds])
                }
                setProducts([res.data.product]);
            }
        }
        setRemoveOpen(false);
        console.log(removeOpen, "remove open after close");
    }
    return (
        <Card variant="outlined" sx={{ marginY: 1, borderRadius: 2, overflow: "hidden", transition: "box-shadow 150ms", "&:hover": { boxShadow: 2 } }}>
            <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 1.5, cursor: "pointer", "&:hover": { backgroundColor: "action.hover" } }} onClick={() => setOpen(!open)}>
                <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 1.5, flex: 1, minWidth: 0 }}>
                    <Box sx={{ width: 56, height: 56, borderRadius: 1, overflow: "hidden", flexShrink: 0, backgroundColor: "background.default", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <RetryImage src={variants && `${variants[0].image?.replace("https://images1.pythiastechnologies.com", "https://images2.pythiastechnologies.com/origin").replace("?width=400", "")}?width=75&height=75`} alt={`${blank} ${threadColor} ${color}`} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                    </Box>
                    <Box sx={{ minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{[blank, threadColor, color].filter(Boolean).join(" · ")}</Typography>
                        <Typography variant="caption" color="text.secondary">{variants.length} variant{variants.length === 1 ? "" : "s"}</Typography>
                    </Box>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <IconButton size="small" onClick={(e) => { e.stopPropagation(); setRemoveOpen(true); }} sx={{ color: "#780606" }}>
                        <DeleteIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small">{open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}</IconButton>
                </Box>
            </Box>
            {open && (
                <Box sx={{ padding: "2%" }}>
                    <List>
                        {variants.map((variant, i) => (
                            <ListItem key={i}>
                                <ListItemAvatar>
                                    <Avatar>
                                        <RetryImage src={`${variant.image?.replace("https://images1.pythiastechnologies.com", "https://images2.pythiastechnologies.com/origin").replace("?width=400", "")}?width=75&height=75`} alt={`${blank} ${threadColor} ${color}`} width={75} height={75} style={{ width: "auto", height: "auto", maxHeight: "100%", maxWidth: "100%" }} />
                                    </Avatar>
                                </ListItemAvatar>
                                {variant.images && variant.images.length > 0 && variant.images.map((img, i) => (
                                    <ListItemAvatar>
                                        <Avatar key={i}>
                                            <RetryImage src={img.image ? `${img.image.replace("https://images1.pythiastechnologies.com", "https://images2.pythiastechnologies.com/origin").replace("?width=400", "")}?width=75&height=75` : `${img.replace("https://images1.pythiastechnologies.com", "https://images2.pythiastechnologies.com/origin").replace("?width=400", "")}?width=75&height=75`} alt={`${blank} ${threadColor} ${color}`} width={75} height={75} style={{ width: "auto", height: "auto", maxHeight: "100%", maxWidth: "100%" }} />
                                        </Avatar>
                                    </ListItemAvatar>
                                ))}
                                <ListItemText primary={`${variant.sku}`} secondary={`Blank: ${variant.blank.name ? variant.blank.name : fullBlank ? fullBlank.name : "N/A"}, Color: ${variant.color.name ? variant.color.name : fullBlank ? fullBlank.colors.filter(c => c._id.toString() === variant.color.toString())[0]?.name : "N/A"}, Size: ${variant.size.name ? variant.size.name : fullBlank ? fullBlank.sizes.filter(s => s._id.toString() === variant.size.toString())[0]?.name : "N/A"}`} />
                                {variant.upc && <ListItemText primary={`UPC: ${variant.upc}`} secondary={`GTIN: ${variant.gtin}`} />}
                                {variant.productInventory && (
                                    <ListItemText sx={{ cursor: "pointer" }} onClick={() => {setInventoryOpen(true); setVariant(variant);}} primary={`Inventory: ${variant.productInventory ? variant.productInventory.quantity : "N/A"}`} secondary={`On Hold: ${variant.productInventory.inStock ? variant.productInventory.inStock.length : "0"} location: ${variant.productInventory.location ? variant.productInventory.location : "N/A"}`} />
                                )}
                                <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
                                    <Typography variant="body2" sx={{ marginRight: "10px" }}>Price: ${variant.price ? variant.price.toFixed(2) : variant.size && variant.size.retailPrice ? variant.size.retailPrice.toFixed(2) : product.blanks.filter(b => b._id.toString() === variant.blank.toString())[0].sizes.filter(s => s._id.toString() === variant.size.toString())[0] ? product.blanks.filter(b => b._id.toString() === variant.blank.toString())[0].sizes.filter(s => s._id.toString() === variant.size.toString())[0].retailPrice.toFixed(2) : "N/A"}</Typography>
                                    {preview &&<Button variant="outlined" color="primary" size="small" onClick={() => { setVariant({ ...variant }); setPriceUpdate(true); }}>Update</Button>}
                                </Box>
                            </ListItem>
                        ))}
                    </List>
                    <UpdatePriceModal open={priceUpdate} setOpen={setPriceUpdate} variant={variant} setVariant={setVariant} product={product} setProducts={setProducts} pageProducts={pageProducts} setPageProducts={setPageProducts} design={design} setDesign={setDesign} />
                    <InventoryModal open={inventoryOpen} setOpen={setInventoryOpen} variant={variant} setVariant={setVariant} product={product} setProducts={setProducts} pageProducts={pageProducts} setPageProducts={setPageProducts} design={design} setDesign={setDesign} />
                </Box>
            )}
            <RemoveVariants open={removeOpen} setOpen={setRemoveOpen} removeVariants={removeVariants} setProducts={setProducts} setPageProducts={setPageProducts} pageProducts={pageProducts} />
        </Card>
    )
}

const UpdatePriceModal = ({ open, setOpen, variant, setVariant, product, setProducts, pageProducts, setPageProducts, setDesign, design}) => {
    const style = {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: "50%",
        height: "23%",
        bgcolor: 'background.paper',
        border: '2px solid #000',
        boxShadow: 24,
        p: 4,
        overflowX: "auto",
        overflowY: "none",
    };
    return (
        <Modal open={open} onClose={() => setOpen(false)}>
            <Box sx={style}>
                <Typography variant="h6">Update Price for {variant.sku}</Typography>
                <Box sx={{ display: "flex", flexDirection: "row", padding: "2%" }}>
                    <TextField
                        sx={{ margin: "2%" }}
                        label="Price"
                        type="number"
                        defaultValue={variant.price ? variant.price : 0}
                        onChange={(e) => {
                            const newPrice = parseFloat(e.target.value);
                            let varnt = { ...variant };
                            varnt.price = isNaN(newPrice) ? 0 : newPrice;
                            setVariant({ ...varnt });
                        }}
                    />
                    <Button onClick={async () => {
                        // Handle update logic here
                        console.log("Updating price for variant:", variant, product);
                        console.log(product, "product in price modal")
                        let vIndex = product.variantsArray.findIndex(v => v._id.toString() === variant._id.toString());
                        product.variantsArray[vIndex] = variant;
                        let res = await axios.put("/api/admin/products", { product });
                        setProducts([res.data.product]);
                        let prods = []

                        if (design.products && design.products.length > 0) {
                            design.products = design.products.filter(prod => prod._id != res.data.product._id)
                        }
                        prods.push(res.data.product);

                        let d = { ...design }
                        d.products = [...design.products, ...prods]
                        setDesign({ ...d })
                        if (pageProducts) {
                            console.log(pageProducts, "page products before update")
                            let prods = [...pageProducts]
                            let newProds = []
                            for (let po of prods) {
                                if (res.data.product._id.toString() === po._id.toString()) {
                                    newProds.push(res.data.product)
                                } else {
                                    newProds.push(po)
                                }
                            }
                            console.log(newProds, "new products after update")
                            setPageProducts([...newProds])
                        }
                        setOpen(false);
                        setVariant({});
                    }}>Update</Button>
                </Box>
            </Box>
        </Modal>
    );
}
const RemoveVariants = ({open, setOpen, removeVariants, setProducts, setPageProducts, pageProducts}) => {
    const style = {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: "50%",
        height: "23%",
        bgcolor: 'background.paper',
        border: '2px solid #000',
        boxShadow: 24,
        p: 4,
        overflowX: "auto",
        overflowY: "none",
    };
    return (
        <Modal open={open} onClose={() => setOpen(false)}>
            <Box sx={style}>
                <Typography variant="h6">Remove Variants</Typography>
                <Box sx={{ display: "flex", flexDirection: "column", padding: "2%" }}>
                    <Typography>Are you sure you want to remove these variants?</Typography>
                    <Box sx={{ display: "flex", flexDirection: "row", padding: "2%" }}>
                        <Button onClick={() => removeVariants(setProducts, setPageProducts, pageProducts)}>Yes</Button>
                        <Button onClick={() => setOpen(false)}>No</Button>
                    </Box>
                </Box>
            </Box>
        </Modal>
    )
}

const InventoryModal = ({ open, setOpen, variant, setVariant, product, setProducts, pageProducts, setPageProducts, setDesign, design }) => {
    const style = {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: "50%",
        height: "23%",
        bgcolor: 'background.paper',
        border: '2px solid #000',
        boxShadow: 24,
        p: 4,
        overflowX: "auto",
        overflowY: "none",
    };
    return(
        <Modal open={open} onClose={() => setOpen(false)}>
            <Box sx={style}>
                <Typography variant="h6">Inventory for {variant.sku}</Typography>
                <Box sx={{ display: "flex", flexDirection: "row", padding: "2%" }}>
                    <TextField
                        sx={{ margin: "2%" }}
                        label="Quantity"
                        type="number"
                        value={variant.productInventory ? variant.productInventory.quantity : 0}
                        onChange={(e) => {
                            const newQuantity = parseInt(e.target.value);
                            let varnt = { ...variant };
                            varnt.productInventory = { ...varnt.productInventory, quantity: isNaN(newQuantity) ? 0 : newQuantity };
                            setVariant({ ...varnt });
                        }}
                    />
                    <TextField
                        sx={{margin: "2%"}}
                        label="Location"
                        value={variant.productInventory ? variant.productInventory.location : ""}
                        onChange={(e) => {
                            const newLocation = e.target.value;
                            let varnt = { ...variant };
                            varnt.productInventory = { ...varnt.productInventory, location: newLocation };
                            setVariant({ ...varnt });
                        }}
                    />
                    <Button onClick={async ()=>{
                        // Handle update logic here
                        console.log("Updating inventory for variant:", variant, product);
                        let res = await axios.put("/api/admin/inventory/product", { productId: product._id, variant: variant });
                        console.log(res.data, "response from inventory update");
                        if(res.data.error) showToast?.(res.data.msg, "error"); else showToast?.("Inventory updated", "success");
                        setProducts([res.data.product]);
                        let prods = []
                        
                        if (design.products && design.products.length > 0) {
                            design.products = design.products.filter(prod => prod._id != res.data.product._id)
                        }
                        prods.push(res.data.product);
                        
                        let d = { ...design }
                        d.products = [...design.products, ...prods]
                        setDesign({ ...d })
                        if (pageProducts) {
                            console.log(pageProducts, "page products before update")
                            let prods = [...pageProducts]
                            let newProds = []
                            for (let po of prods) {
                                if (res.data.product._id.toString() === po._id.toString()) {
                                    newProds.push(res.data.product)
                                } else {
                                    newProds.push(po)
                                }
                            }
                            console.log(newProds, "new products after update")
                            setPageProducts([...newProds])
                        }
                        setOpen(false);
                        setVariant({});
                    }}>Update</Button>
                </Box>
            </Box>
        </Modal>
    )
}
export const ProductImageCarosel = ({ productImages, defaultColor }) => {
    const [image, setImage] = useState(0)
    const [loading, setLoading] = useState(true)
    //console.log(productImages, "productImages")
    let order = productImages.sort((a, b) => a.color?.name?.localeCompare(b.color?.name)) 
    order = order.filter(img => img.color?.name === defaultColor?.name)
    order = [...order, ...productImages.filter(img => img.color?.name !== defaultColor?.name)]
    productImages = order;
    return (
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            <Box sx={{ position: "relative", width: "100%", maxWidth: 480, aspectRatio: "1 / 1", backgroundColor: "background.default", borderRadius: 2, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <RetryImage onLoad={() => setLoading(false)} src={productImages[image]?.image} alt={productImages[image]?.sku} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                {loading && (
                    <Box sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 1, background: "rgba(255,255,255,0.7)" }}>
                        <CircularProgress color="secondary" size={28} />
                        <Typography color="text.primary">Loading…</Typography>
                    </Box>
                )}
                <IconButton onClick={() => { setLoading(true); setImage(image - 1 < 0 ? productImages.length - 1 : image - 1) }} sx={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", backgroundColor: "rgba(255,255,255,0.85)", "&:hover": { backgroundColor: "rgba(255,255,255,1)" } }}>
                    <KeyboardArrowLeftIcon />
                </IconButton>
                <IconButton onClick={() => { setLoading(true); setImage(image + 1 >= productImages.length ? 0 : image + 1) }} sx={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", backgroundColor: "rgba(255,255,255,0.85)", "&:hover": { backgroundColor: "rgba(255,255,255,1)" } }}>
                    <KeyboardArrowRightIcon />
                </IconButton>
            </Box>
            <Box sx={{ width: "100%", maxWidth: 720, display: "flex", flexWrap: "wrap", gap: 1, justifyContent: "center" }}>
                {productImages.map((variant, i) => (
                    <Box key={i} onClick={() => { setLoading(true); setImage(i) }} sx={{ width: 56, height: 56, borderRadius: 1, overflow: "hidden", cursor: "pointer", border: image === i ? "2px solid" : "1px solid", borderColor: image === i ? "primary.main" : "divider", opacity: image === i ? 1 : 0.7, backgroundColor: "background.default", display: "flex", alignItems: "center", justifyContent: "center", transition: "opacity 150ms", "&:hover": { opacity: 1 } }}>
                        <RetryImage src={variant.image} alt={variant.sku} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                    </Box>
                ))}
            </Box>
        </Box>
    )
}
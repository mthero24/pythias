import { Box, Grid2, TextField, Modal, Button, Typography, Card, Divider, FormControlLabel, Checkbox, List, CircularProgress, ListItemText, Avatar, ListItemAvatar, ListItem, ImageList, ImageListItem } from "@mui/material";
import DeleteIcon from '@mui/icons-material/Delete';
import axios from "axios";
import { useState, useEffect, useRef } from "react";
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { set } from "mongoose";


export const PreviewStage = ({ design, setDesign, setStage, setImages, colors, setSizes, setColors, setProducts, products, updateDesign, releaseHold, loading, setLoading, setUpcs, tempUpcs, setOpen, preview, setPreview, pageProducts, setPageProducts }) => {
    return (
        <Box sx={{ padding: "2%" }}>
            {products.map((product, index) => (
                <Box key={index}>
                    <Typography variant="h6" textAlign={"center"}>Preview</Typography>
                    <ProductImageCarosel productImages={product.productImages} defaultColor={product.defaultColor} />
                    <Box sx={{ padding: "2%" }}>
                        <List>
                            <ListItem>
                                <ListItemText primary={product.title} secondary={`SKU: ${product.sku} Brand: ${product.brand} ${product.gender ? `Gender: ${product.gender}` : ""} ${product.season ? `Season: ${product.season}` : ""}`} />
                            </ListItem>
                        </List>
                        <List>
                            <ListItem>
                                <ListItemText primary={`Default Color: ${product.defaultColor?.name}`} />
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
                                        }}>Add Product Inventory</Button>}
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
                                        }}>Add Product Inventory</Button>}
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
                </Box>
            ))}
            {!preview && <Grid2 container spacing={2} sx={{ padding: "2%" }}>
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
            {preview && <Button fullWidth sx={{ margin: "1% 2%", background: "#645D5B", color: "#ffffff" }} onClick={() => { setPreview(false); setStage("blanks"); setProducts([]); setUpcs([]); setImages([]); setSizes([]); setColors([]); setOpen(false) }}>Back</Button>}
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
        <Card sx={{ margin: "1% 0%", padding: "1%", background: "#f0f0f0", borderRadius: "10px", boxShadow: "2px 2px 2px #ccc" }}>
            <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "flex-end", alignItems: "center", cursor: "pointer" }} >
                <DeleteIcon sx={{ color: "#780606" }} onClick={() => {
                    console.log("Remove Variants Clicked", removeOpen)
                    setRemoveOpen(true)
                }} />
            </Box>
            <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: "2%", cursor: "pointer", "&:hover": { opacity: .7 } }} onClick={() => setOpen(!open)}>
                <img src={variants && `${variants[0].image?.replace("https://images1.pythiastechnologies.com", "https://images2.pythiastechnologies.com/origin").replace("?width=400", "")}?width=75&height=75`} alt={`${blank} ${threadColor} ${color}`} width={75} height={75} style={{ width: "auto", height: "auto", maxHeight: "100%", maxWidth: "100%" }} />
                <Typography variant="body2">{blank}_{threadColor}_{color}</Typography>
                {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
            </Box>
            {open && (
                <Box sx={{ padding: "2%" }}>
                    <List>
                        {variants.map((variant, i) => (
                            <ListItem key={i}>
                                <ListItemAvatar>
                                    <Avatar>
                                        <img src={`${variant.image?.replace("https://images1.pythiastechnologies.com", "https://images2.pythiastechnologies.com/origin").replace("?width=400", "")}?width=75&height=75`} alt={`${blank} ${threadColor} ${color}`} width={75} height={75} style={{ width: "auto", height: "auto", maxHeight: "100%", maxWidth: "100%" }} />
                                    </Avatar>
                                </ListItemAvatar>
                                {variant.images && variant.images.length > 0 && variant.images.map((img, i) => (
                                    <ListItemAvatar>
                                        <Avatar key={i}>
                                            <img src={img.image ? `${img.image.replace("https://images1.pythiastechnologies.com", "https://images2.pythiastechnologies.com/origin").replace("?width=400", "")}width=75&height=75` : `${img.replace("https://images1.pythiastechnologies.com", "https://images2.pythiastechnologies.com/origin").replace("?width=400", "")}?width=75&height=75`} alt={`${blank} ${threadColor} ${color}`} width={75} height={75} style={{ width: "auto", height: "auto", maxHeight: "100%", maxWidth: "100%" }} />
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
                        if(res.data.error) alert(res.data.msg);
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
                        <ImageListItem key={i} sx={{ width: "100%", height: "auto", cursor: "pointer", border: image == i ? "2px solid rgb(41, 6, 240)" : "none", opacity: image == i ? 0.6 : 1 }} onClick={() => { setLoading(true); setImage(i) }}>
                            <img src={variant.image} alt={variant.sku} />

                        </ImageListItem>
                    ))}
                </ImageList>
            </Grid2>
            <Grid2 size={1}></Grid2>
        </Grid2>
    )
}
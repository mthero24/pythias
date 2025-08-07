import { Modal, Box, Typography, Button, Card, TextField, Divider, Grid2, Checkbox, List, ListItem, ListItemText} from '@mui/material';
import CreatableSelect from 'react-select/creatable';
import {useState, useEffect, useRef} from 'react';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import axios from 'axios';
import { set } from 'mongoose';
import { ProductImageCarosel, VariantDisplay } from '../design/stages/previewStage';

export const CreateNFProduct = ({ open, setOpen, brands, setBrands, seasons, setSeasons, genders, setGenders, CreateSku, themes, setThemes, sportUsedFor, setSportUsedFor }) => {
    const [type, setType] = useState("From Blank");
    const [blanks, setBlanks] = useState([]);
    const [product, setProduct] = useState({});
    const [loading, setLoading] = useState(false);
    const [stage, setStage] = useState("Select Blank");
    const [primaryImage, setPrimaryImage] = useState(true);
    const targetRef = useRef(null)
    useEffect(() => {
        scrollToTarget();
    }, [stage]);
    const scrollToTarget = () => {
        if (targetRef.current) {
            targetRef.current.scrollTop = 0;
        }
    };
    useEffect(() => {
        const fetchBlanks = async () => {
            try {
                const response = await axios.get('/api/admin/blanks');
                setBlanks(response.data.blanks);
            } catch (error) {
                console.error("Error fetching blanks:", error);
            }
        };
        if(open) {
            fetchBlanks();
        }
    },[open])
    let style = {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: "90%",
        height: "90%",
        bgcolor: 'background.paper',
        boxShadow: 24,
        p: 4,
        overflow: "auto"
    }

    return (
        <Modal
            open={open}
            onClose={() => { setProduct({}); setStage("Select Blank"); setOpen(false)}}
            aria-labelledby="modal-modal-title"
            aria-describedby="modal-modal-description"
        >
            <Box sx={style} ref={targetRef}>
                <Box sx={{display: "flex", flexDirection: "row", justifyContent: "flex-end", alignItems: "center", padding: "1%"}}>
                    <CloseIcon onClick={() => { setProduct({}); setStage("Select Blank"); setOpen(false) }} sx={{ cursor: "pointer", color: "#780606"}} />
                </Box>
                <Typography variant="h5" textAlign="center">Create New Product</Typography>
                <Box sx={{padding: "2%", marginBottom: "2%", display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center"}}>
                    <Button fullWidth variant="outlined" sx={{background: type== "From Blank" ? "#e2e2e2" : "transparent"}} onClick={() => setType("From Blank")}>From Blank</Button>
                    <Button fullWidth variant="outlined" sx={{background: type== "Other" ? "#e2e2e2" : "transparent"}} onClick={() => setType("Other")}>Other</Button>
                </Box>
                {type === "From Blank" && stage == "Select Blank" && (
                    <Box>
                        {/* Render blank selection UI here */}
                        <Grid2 container spacing={2}>
                            {blanks && blanks.map((blank) => {
                                let color = blank.colors && blank.colors.length > 0 ? blank.colors[0] : null;
                                console.log(color, "color", blank.colors.length)
                                let fontImages = []
                                let backImages = []
                                console.log(blank.multiImages, "multiImages")
                                for(let b of Object.keys(blank.multiImages)){
                                    for(let i of blank.multiImages[b]){
                                        if(!b.includes("back")){
                                            if(i.color.toString() == color?._id.toString()){
                                                fontImages.push(i);
                                                continue
                                            }
                                        }else{
                                            if(i.color.toString() == color?._id.toString()){
                                                backImages.push(i);
                                                continue
                                            }
                                        }
                                    }
                                    continue
                                }
                                console.log(fontImages, "fontImages")
                                console.log(backImages, "backImages")
                                return (
                                    <Grid2 size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={blank._id}>
                                        <Card sx={{marginBottom: "1%", padding: "1%", width: "100%", cursor: "pointer", "&:hover": { boxShadow: 4, opacity: 0.9}}} onClick={() => {
                                            let prod = {
                                                title: blank.name,
                                                blanks: [blank],
                                                sku: blank.code,
                                                vendor: blank.vendor,
                                                department: blank.department,
                                                category: blank.category,
                                                colors: blank.colors,
                                                tags: [],
                                                defaultColor: blank.colors[0],
                                                productImages: [],
                                                priceTiers: [],
                                                sizes: blank.sizes.map(s => ({ sizeId: s._id, name: s.name, price: 0, compareAtPrice: 0, costPerItem: 0, weight: 0 })),
                                                description: blank.description || "",
                                                isNFProduct: true
                                            }
                                            console.log(prod, "prod")
                                            setProduct(prod);
                                            setStage("Select Images");
                                        }}>
                                           <Box>
                                                {fontImages.length > 0 && (
                                                    <img src={`${fontImages[0].image.replace("https://images1.pythiastechnologies.com", "https://images2.pythiastechnologies.com/origin")}?width=200`} alt={blank.name} style={{ width: "100%", height: "200px", objectFit: "contain" }} />
                                                ) }
                                                {backImages.length > 0 && (
                                                    <Box sx={{position: "relative", marginBottom: "-85px", bottom: 100, width: "30%", border: "1px solid #ccc", borderRadius: "4px", overflow: "hidden"}}>
                                                        <img src={`${backImages[0].image.replace("https://images1.pythiastechnologies.com", "https://images2.pythiastechnologies.com/origin")}?width=200`} alt={blank.name} style={{ width: "100%", height: "auto", objectFit: "contain" }} />
                                                    </Box>
                                                )}
                                                {fontImages.length <= 0 && backImages.length <= 0 && (                                                   
                                                    <img src="/missingImage.jpg" alt="No Image Available" style={{ width: "100%", height: "200px", objectFit: "contain" }} />
                                                )}
                                           </Box>
                                            <Typography variant="body2" textAlign="center" sx={{whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"}}>{blank.name}</Typography>
                                        </Card>
                                    </Grid2>
                                );
                            })}
                        </Grid2>
                    </Box>
                )}
                {type === "From Blank" && stage == "Select Images" && (
                    <Box>
                        {/* Render product creation UI here */}
                        {product && product.blanks[0] && product.blanks[0].multiImages && (
                            <Box>
                                <Typography variant="h6" textAlign="center" sx={{marginBottom: "2%"}}>Select Product Images for {product.name}</Typography>
                                {Object.keys(product.blanks[0].multiImages).map((key) => (
                                    <Grid2 container spacing={2} key={key}>
                                        {product.blanks[0].multiImages[key].map((image) => (
                                            <Grid2 item xs={6} sm={4} md={3} key={image._id} sx={{cursor: "pointer"}} onClick={() => {
                                                let prod = {...product};
                                                console.log(prod.images, "prod.images")
                                                if(!prod.productImages) prod.productImages = [];
                                                console.log(image, "image.image")
                                                if(!prod.productImages.filter(img => img.image === image.image)[0]){
                                                    console.log("adding image", image.color, "color", product.colors.filter(color => color._id.toString() === image.color.toString())[0])
                                                    prod.productImages.push({image: image.image, color: product.colors.filter(color => color._id.toString() === image.color.toString())[0], blank: product.blanks[0]._id, sku: `${product.sku}-${image.color}-${key}`, side: key});

                                                }
                                                else{
                                                    prod.productImages = prod.productImages.filter(img => img.image !== image.image);
                                                }
                                                setProduct({...prod});
                                            }}>
                                                <Card sx={{margin: "1% 0"}}>
                                                    {product.productImages.filter(img => img.image === image.image)[0] &&
                                                    <Box sx={{position: "relative", top: 40, backgroundColor: "rgba(255, 255, 255, 0.7)", background: "transparent", padding: "2px", marginTop: "-40px"}}>
                                                            <Checkbox checked={true} />
                                                    </Box> }
                                                    {!product.productImages.filter(img => img.image === image.image)[0] &&
                                                        <Box sx={{ position: "relative", top: 40, backgroundColor: "rgba(255, 255, 255, 0.7)", background: "transparent", padding: "2px", marginTop: "-40px" }}>
                                                            <Checkbox checked={false} />
                                                        </Box>}
                                                    <img src={`${image.image.replace("https://images1.pythiastechnologies.com", "https://images2.pythiastechnologies.com/origin")}?width=200`} alt={key} style={{ width: "100%", height: "200px", objectFit: "contain" }} />
                                                    <Typography variant="body2" textAlign="center">{key}</Typography>
                                                </Card>
                                            </Grid2>
                                        ))}
                                    </Grid2>
                                ))}
                                <Box sx={{display: "flex", flexDirection: "row", justifyContent: "space-between", gap:2, marginTop: "2%"}}>
                                    <Button fullWidth variant="outlined" onClick={() => setStage("Select Blank")}>Back</Button>
                                    <Button fullWidth variant="contained" onClick={() => {
                                        // Handle the next stage
                                        let prod = {...product};
                                        prod.colors = product.blanks[0].colors;
                                        if(!prod.sizes) prod.sizes = product.blanks[0].sizes;
                                        if(!prod.variantsArray) prod.variantsArray = [];
                                        for(let color of prod.blanks[0].colors){
                                            for(let size of prod.sizes){
                                                let sku = `${prod.sku}_${color.name}_${size.name}`;
                                                if(!prod.variantsArray.filter(v => v.sku === sku)[0]){
                                                    prod.variantsArray.push({
                                                        sku,
                                                        color: color._id,
                                                        size: size,
                                                        blank: prod.blanks[0]._id,
                                                        price: size.retailPrice,
                                                        compareAtPrice: size.compareAtPrice,
                                                        costPerItem: size.costPerItem,
                                                        weight: size.weight,
                                                        image: "",
                                                        images: []
                                                    });
                                                }
                                            }
                                        }
                                        setProduct({...prod});
                                        setStage("Variant Images");
                                    }}>Next</Button>
                                </Box>
                            </Box>
                        )}
                    </Box>
                )}
                {type === "From Blank" && stage == "Variant Images" && (
                    <Box sx={{ display: "flex", flexDirection: "column", alignContent: "center", alignItems: "center", justifyContent: "center", width: "100%" }}>
                        {/* Render variant image selection UI here */}
                        <Typography variant="h6" textAlign="center" sx={{marginBottom: "1%",textAlign: "center"}}>Select Variant Images for {product.name}</Typography>
                        {console.log(product.colors)}
                        <Box sx={{display: "flex", flexDirection: "row", justifyContent: "space-between", width: "100%", marginBottom: "2%"}}>
                            <Button fullWidth variant="outlined" sx={{background: primaryImage ? "#e2e2e2" : "transparent"}} onClick={() => setPrimaryImage(true)}>Primary Image</Button>
                            <Button fullWidth variant="outlined" sx={{background: !primaryImage ? "#e2e2e2" : "transparent"}} onClick={() => {
                                // Handle the next stage
                                setPrimaryImage(false);
                            }}>Secondary Images</Button>
                        </Box>
                        {product.colors && product.colors.map((color) => (
                            <Box key={color._id} sx={{marginBottom: "2%"}}>
                                <Typography variant="subtitle1" sx={{marginBottom: "1%"}}>{color.name}</Typography>
                                <Box sx={{width: "100%"}}>
                                    {product.colors && product.colors.length > 0 && product.blanks[0].multiImages && Object.keys(product.blanks[0].multiImages).map((key) => (
                                        <Grid2 container spacing={2} key={key}>
                                            {product.blanks[0].multiImages[key].length > 0 && product.blanks[0].multiImages[key].filter(img => img.color.toString() === color._id.toString()).map((image) => (
                                                <Grid2 size={{ xs: 6, sm: 4, md: 3 }} key={image._id} sx={{cursor: "pointer", margin: "1% 0%"}} onClick={() => {
                                                    let prod = {...product};
                                                    if(primaryImage){
                                                        let variants = prod.variantsArray.filter(v => v.color._id.toString() === color._id.toString());
                                                        for(let v of variants){
                                                            v.image = image.image;
                                                        }
                                                    }else{
                                                        let variants = prod.variantsArray.filter(v => v.color._id.toString() === color._id.toString());
                                                        for(let v of variants){
                                                            if(!v.images) v.images = [];
                                                            if(v.image !== image.image){
                                                                if(!v.images.filter(img => img === image.image)[0]){
                                                                    v.images.push(image.image);
                                                                }else{
                                                                    v.images = v.images.filter(img => img !== image.image);
                                                                }
                                                            }
                                                        }
                                                    }
                                                    setProduct({...prod});
                                                }}>
                                                    <Card sx={{width: "100%"}}>
                                                        {product.variantsArray.filter(v => v.color._id.toString() === color._id.toString() && v.image === image.image)[0] &&
                                                        <Box sx={{position: "relative", top: 40, backgroundColor: "rgba(255, 255, 255, 0.7)", background: "transparent", padding: "2px", marginTop: "-40px"}}>
                                                            <Checkbox checked={true} /> 
                                                        </Box> }
                                                        {product.variantsArray.filter(v => v.color._id.toString() === color._id.toString() && v.images.includes(image.image))[0] &&
                                                            <Box sx={{ position: "relative", top: 40, backgroundColor: "rgba(255, 255, 255, 0.7)", background: "transparent", padding: "2px", marginTop: "-40px" }}>
                                                                <Checkbox checked={true} color="error" />
                                                            </Box>}
                                                        <img src={image.image} alt={image.alt} style={{ width: "100%", height: "auto" }} />
                                                        <Typography variant="body2" textAlign="center">{key}</Typography>
                                                    </Card>
                                                </Grid2>
                                            ))}
                                        </Grid2>
                                    ))}
                                </Box>
                            </Box>
                        ))}
                        <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "space-between", gap: 2, marginTop: "2%", width: "100%" }}>
                            <Button fullWidth variant="outlined" onClick={() => setStage("Select Images")}>Back</Button>
                            <Button fullWidth variant="contained" onClick={() => {
                                // Handle the next stage
                                setStage("Information");
                            }}>Next</Button>
                        </Box>
                    </Box>
                )}
                {type === "From Blank" && stage == "Information" && (
                    <Grid2 container spacing={2} sx={{ padding: "2%" }}>
                        <Grid2 size={12}>
                            <Typography variant="h5" sx={{ color: "#000", textAlign: "center", marginBottom: "1%" }}>{product.title}</Typography>
                        </Grid2>
                        <Grid2 size={12}>
                            <TextField fullWidth label="Title" variant="outlined" value={product.title} onChange={(e) => {
                                let prod = {...product}
                                prod.title = e.target.value
                                setProduct({...prod})
                            }} />
                        </Grid2>
                        <Grid2 size={12}>
                            <TextField fullWidth label="Description" multiline variant="outlined" value={product.description} onChange={(e) => {
                                let prod = { ...product }
                                prod.description = e.target.value
                                setProduct({ ...prod })
                            }} />
                        </Grid2>
                        <Grid2 size={12}>
                            <CreatableSelect isMulti placeholder="Tags" onChange={async (newValue) => {
                                let prod = { ...product }
                                prod.tags = [...prod.tags, newValue.value]
                                setProduct({ ...prod })
                            }} />
                        </Grid2>
                        <Grid2 size={4}>
                            <CreatableSelect placeholder="Select Brand" options={brands.map(brand => ({ value: brand.name, label: brand.name }))} value={product.brand ? { value: product.brand, label: product.brand } : null} onChange={async (newValue) => {
                                let prod = { ...product }
                                prod.brand = newValue.value
                                if (!brands.filter(b => b.name == newValue.value)[0]) {
                                    let res = await axios.post("/api/admin/brands", { name: newValue.value })
                                    if (res.data.error) alert(res.data.msg)
                                    else {
                                        setBrands(res.data.brands)
                                    }
                                }
                                setProduct({ ...prod })
                            }} />
                        </Grid2>
                        <Grid2 size={4}>
                            <CreatableSelect placeholder="Select Gender" options={genders.map(gender => ({ value: gender.name, label: gender.name }))} value={product.gender ? { value: product.gender, label: product.gender } : null} onChange={async (newValue) => {
                                let prod = { ...product }
                                prod.gender = newValue.value
                                if (!genders.filter(s => s.name == newValue.value)[0]) {
                                    let res = await axios.post("/api/admin/oneoffs", { type: "gender", value: newValue.value })
                                    if (res.data && res.data.error) alert(res.data.msg)
                                    else setGenders(res.data.genders)
                                }
                                setProduct({ ...prod })
                            }} />
                        </Grid2>
                        <Grid2 size={4}>
                            <CreatableSelect placeholder="Select Season" options={seasons.map(season => ({ value: season.name, label: season.name }))} value={product.season ? { value: product.season, label: product.season } : null} onChange={async (newValue) => {
                                let prod = { ...product }
                                prod.season = newValue.value
                                if (!seasons.filter(s => s.name == newValue.value)[0]) {
                                    let res = await axios.post("/api/admin/oneoffs", { type: "season", value: newValue.value })
                                    if (res.data && res.data.error) alert(res.data.msg)
                                    else setSeasons(res.data.seasons)
                                }
                                setProduct({ ...prod })
                            }} />
                        </Grid2>
                        <Grid2 size={4}>
                            <CreatableSelect placeholder="Select Theme" options={themes.map(theme => ({ value: theme.name, label: theme.name }))} value={product.theme ? { value: product.theme, label: product.theme } : null} onChange={async (newValue) => {
                                let prod = { ...product }
                                prod.theme = newValue.value
                                if (!themes.filter(s => s.name == newValue.value)[0]) {
                                    let res = await axios.post("/api/admin/oneoffs", { type: "theme", value: newValue.value })
                                    if (res.data && res.data.error) alert(res.data.msg)
                                    else setThemes(res.data.themes)
                                }
                                setProduct({ ...prod })
                            }} />
                        </Grid2>
                        <Grid2 size={4}>
                            <CreatableSelect placeholder="Select Sport Used For" options={sportUsedFor.map(sport => ({ value: sport.name, label: sport.name }))} value={product.sportUsedFor ? { value: product.sportUsedFor, label: product.sportUsedFor } : null} onChange={async (newValue) => {
                                let prod = { ...product }
                                prod.sportUsedFor = newValue.value
                                if (!sportUsedFor.filter(s => s.name == newValue.value)[0]) {
                                    let res = await axios.post("/api/admin/oneoffs", { type: "sportUsedFor", value: newValue.value })
                                    if (res.data && res.data.error) alert(res.data.msg)
                                    else setSportUsedFor(res.data.sportUsedFor)
                                }
                                setProduct({ ...prod })
                            }} />
                        </Grid2>
                        <Grid2 size={12}>
                            <Divider sx={{ margin: "1% 0" }} />
                            <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "space-between", gap: 2, marginTop: "2%", width: "100%" }}>
                                <Button fullWidth variant="outlined" onClick={() => setStage("Information")}>Back</Button>
                                <Button fullWidth variant="contained" onClick={() => {
                                    // Handle the next stage
                                    setStage("Preview");
                                }}>Next</Button>
                            </Box>
                        </Grid2>
                    </Grid2>
                )}
                {type === "From Blank" && stage == "Preview" && (
                    <Box sx={{ display: "flex", flexDirection: "column", alignContent: "center", alignItems: "center", justifyContent: "center", width: "100%" }}>
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
                                    <ListItemText primary={"Tags"} secondary={product.tags && product.tags.join(", ")} />
                                </ListItem>
                            </List>
                        </Box>
                        <Box key={product.blanks[0].code} sx={{ marginBottom: "2%" }}>
                            <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "flex-end", alignItems: "center" }}>
                                <Button onClick={async () => {
                                    let res = await axios.post("/api/admin/inventory/product", { productId: product._id });
                                    setProducts([res.data.product]);
                                }}>Add Product Inventory</Button>
                            </Box>
                            {product.colors.map(color => {
                                console.log(product)
                                const variants = product.variantsArray.filter(v => v.blank.toString() === product.blanks[0]._id.toString() && v.color.toString() === color._id.toString());
                                return variants.length > 0 ? (
                                    <VariantDisplay key={`${product.blanks[0].code}-${color}`} blank={product.blanks[0].code} color={color.name} variants={variants} fullBlank={product.blanks[0]} product={product} setProducts={setProducts} />
                                ) : null;
                            })}
                        </Box>
                        <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "space-between", gap: 2, marginTop: "2%", width: "100%" }}>
                            <Button fullWidth variant="outlined" onClick={() => setStage("Information")}>Back</Button>
                            <Button fullWidth variant="contained" onClick={() => {
                                // Handle the next stage
                                CreateSku(product);
                                setOpen(false);
                            }}>Create Product</Button>
                        </Box>
                    </Box>
                )}
                {type === "Other" && (
                    <Box>
                        {/* Render design selection UI here */}
                    </Box>
                )}
            </Box>
        </Modal>
    );
}
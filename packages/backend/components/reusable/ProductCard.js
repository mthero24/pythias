import {Box, Grid2, Typography, Button, Divider, List, ListItem, ListItemText} from "@mui/material";
import DeleteIcon from '@mui/icons-material/Delete';
import DeleteModal from "./DeleteModal";
import {useState} from "react";
import { useCSV } from "../reusable/CSVProvider";
import axios from "axios";
export const ProductCard = ({p, setProduct, setCreateProduct, marketPlaces, setMarketplaceModal, des, setDesign, updateDesign, setPreview }) => {
    const [deleteModal, setDeleteModal] = useState(false);
    const [deleteImage, setDeleteImage] = useState({});
    const [deleteTitle, setDeleteTitle] = useState("");
    const [deleteFunction, setDeleteFunction] = useState({});
    const [type, setType] = useState("");
    const deleteProduct = async (product) => {
           // console.log("Deleting product", product);
            let res = await axios.delete(`/api/admin/products?product=${product._id}`)
            if (res.data.error) alert(res.data.msg)
            else {
                let d = {...des}
                d.products = d.products.filter(p => p._id !== product._id)
                setDesign({...d})
                updateDesign({...d})
            }
        }
    const { csvData, setCsvData, setAdded, setNotAdded, setShow } = useCSV();
    let preCacheImages = async (product) => {
        if (product && product.productImages && product.productImages.length > 0) {
            for (let image of product.productImages) {
                if (image.image) {
                    try {
                        await axios.get(image.image.replace("=400", "=2400"));
                        //console.log("Pre-caching product image:", image.image);
                    } catch (error) {
                        console.error("Error pre-caching image:", error);
                    }
                }
            }
        }
        if (product.variantsArray && product.variantsArray.length > 0) {
            for (let variant of product.variantsArray) {
                if (variant.images && variant.images.length > 0) {
                    for (let image of variant.images) {
                        if (image) {
                            try {
                                await axios.get(image.replace("=400", "=2400"));
                                //console.log("Pre-caching variant image:", image);
                            } catch (error) {
                                console.error("Error pre-caching variant image:", error);
                            }
                        }
                    }
                }
                if (variant.image) {
                    try {
                        await axios.get(variant.image.replace("=400", "=2400"));
                        //console.log("Pre-caching variant image:", variant.image);
                    } catch (error) {
                        console.error("Error pre-caching variant image:", error);
                    }
                }
            }
        }
    }
    const checkForIds = async ({product, marketPlace}) => {
        if(product && marketPlace) {
            marketPlace = marketPlaces.filter(mp => mp.name.toLowerCase() === marketPlace.toLowerCase())[0];
            if(marketPlace && marketPlace.connections && marketPlace.connections.length > 0) {
                for(let connection of marketPlace.connections) {
                    let res = await axios.get("/api/admin/integrations", { params: { provider: "premierPrinting" } });
                    let connections = res.data.integration ? res.data.integration : [];
                    let mp = marketPlace
                    if (mp) {
                        console.log("Marketplace found in product:", mp);
                        console.log("connections", connections);
                        let prod = { ...product }
                        for (let c of connections) {
                            //console.log(c, "Connection in connections");
                            if (c.displayName.toLowerCase().includes("acenda") && mp.connections && mp.connections.includes(c._id.toString())) {
                                //console.log("Marketplace connection found:", c);
                                let res = await axios.post("/api/integrations/acenda", { connection: c, product });
                                //console.log(res, "Response from Acenda integration");
                                prod = res.data.product;
                            }
                        }
                        
                    }
                    
                }
            }
        }
    }
    const addProductToCsv = async (marketPlace, product) => {
        console.log("add Product to csv",)
        setShow(true);
        checkForIds({ product, marketPlace });
        const updatedCsvData = { ...csvData };
        if(!updatedCsvData.products) updatedCsvData.products = {}
        if (!updatedCsvData.products[marketPlace]) {
            updatedCsvData.products[marketPlace] = [];
        }
        if(!updatedCsvData.products[marketPlace].find(p => p._id === product._id)) {
            //console.log("Adding product to csv", product);
            updatedCsvData.products[marketPlace].push({_id: product._id});
            //console.log(updatedCsvData)
            preCacheImages(product);
            setCsvData(updatedCsvData);
            setAdded(true);
        }else{
            setNotAdded(true);
        }
    }
    return (
        <Grid2 size={{ xs: 6, sm: 4 }}>
            <Box sx={{ padding: "2%", background: "#fff", boxShadow: "0px 0px 10px rgba(0,0,0,.1)", borderRadius: "5px", marginBottom: "2%" }}>
                <Box sx={{ position: "relative", left: { xs: "80%", sm: "85%", md: "90%" }, bottom: { xs: -20, sm: -30, md: -50 }, padding: "2%", cursor: "pointer", marginTop: "-12%", "&:hover": { opacity: .5 } }} onClick={() => { setDeleteFunction({ onDelete: deleteProduct }); setDeleteTitle("Are You Sure You Want To Delete This Product?"); setDeleteImage({ ...p }); setDeleteModal(true) }}>
                    <DeleteIcon sx={{ color: "#780606" }} />
                </Box>
                <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "center" }}>
                    <img src={p?.productImages?.filter(i => i.color._id?.toString() == (p.defaultColor ? p.defaultColor._id ? p.defaultColor._id.toString() : p.defaultColor.toString() : p.colors[0]._id.toString()) && i.side != "back")[0]?.image} width={400} height={400} style={{ objectFit: "cover", borderRadius: "5px" }} />
                </Box>
                {p.productImages?.filter(i => i.color?._id?.toString() == (p.defaultColor ? p.defaultColor._id ? p.defaultColor._id.toString() : p.defaultColor.toString() : p.colors[0]._id.toString()) && (i.side == "back" || i.side == "modelBack"))[0] && <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "flex-start", alignItems: "center", position: "relative", zIndex: 1, top: -130, left: 0, padding: "2%", marginBottom: "-130px", }}>
                    <img src={p.productImages.filter(i => i.color._id.toString() == (p.defaultColor ? p.defaultColor._id ? p.defaultColor._id.toString() : p.defaultColor.toString() : p.colors[0]._id.toString()) && (i.side == "back" || i.side == "modelBack"))[0]?.image} width={120} height={120} style={{ objectFit: "cover", borderRadius: "100px" }} />
                </Box>}
                <Divider sx={{ margin: "2% 0" }} />
                <Box sx={{ display: "flex", flexDirection: "column", }}>
                    <List>
                        <ListItem>
                            <ListItemText sx={{ textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }} primary={p.title} secondary={p.sku} />
                        </ListItem>
                    </List>
                </Box>
                {p.blanks && p.blanks.length > 1 && 
                    <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center", background: "#000", color: "#fff", width: "50%" }}>
                        <Typography variant="body2" sx={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Combined Product</Typography>
                    </Box>
                }
                {p.blanks && p.blanks.length <= 1 &&
                    <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center", background: "#6a95bf", color: "#fff", width: "50%" }}>
                        <Typography variant="body2" sx={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Single Product</Typography>
                    </Box>
                }
                <Typography variant="body2" >Marketplaces:</Typography>
                <Grid2 container spacing={2}>
                    {p.marketPlacesArray && p.marketPlacesArray.length > 0 && p.marketPlacesArray.map(m => (
                        <Grid2 key={m._id? m._id: m} size={{ xs: 6, sm: 4 }}>
                            <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center", background: "#87AE73", cursor: "pointer" }} onClick={()=>{
                                addProductToCsv(marketPlaces.filter(mp => mp._id.toString() === (m._id ? m._id.toString() : m.toString()))[0]?.name, p)
                            }}>
                                <Typography variant="body2" sx={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{marketPlaces.filter(mp => mp._id.toString() === (m._id ? m._id.toString() : m.toString()))[0]?.name}</Typography>
                            </Box>
                        </Grid2>
                    ))}
                    {!p.marketPlacesArray || p.marketPlacesArray.length <= 0 && <Grid2 size={12}>
                        <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center" }}>
                            <Typography variant="body2">No Marketplaces Found</Typography>
                        </Box>
                    </Grid2>}
                </Grid2>
                <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: "1%" }}>
                    <Button sx={{}} variant="contained" color="primary" onClick={() => { setMarketplaceModal(true); setProduct({ ...p }) }} >Add To MarketPlace</Button>
                    <Button variant="outlined" color="secondary" onClick={() => { setProduct({ ...p }); setCreateProduct(true); }}>Edit Product</Button>
                </Box>
                <Button variant="outlined" fullWidth color="primary" sx={{ marginTop: "1%" }} onClick={() => { setProduct({ ...p }); setCreateProduct(true); setPreview(true); }}>Preview Product</Button>
                <DeleteModal open={deleteModal} setOpen={setDeleteModal} title={deleteTitle } onDelete={deleteFunction.onDelete} deleteImage={deleteImage} type={type} /> 
            </Box>
        </Grid2>
    );
};
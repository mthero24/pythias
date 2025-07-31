import {Box, Grid2, Typography, Button, Divider, List, ListItem, ListItemText} from "@mui/material";
import DeleteIcon from '@mui/icons-material/Delete';
import DeleteModal from "./DeleteModal";
import {useState} from "react";
export const ProductCard = ({p, setProduct, setCreateProduct, setMarketplaceModal, des, setDesign, setPreview }) => {
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
    return (
        <Grid2 size={{ xs: 6, sm: 4 }}>
            <Box sx={{ padding: "2%", background: "#fff", boxShadow: "0px 0px 10px rgba(0,0,0,.1)", borderRadius: "5px", marginBottom: "2%" }}>
                <Box sx={{ position: "relative", zIndex: 999, left: { xs: "80%", sm: "85%", md: "90%" }, bottom: { xs: -20, sm: -30, md: -50 }, padding: "2%", cursor: "pointer", marginTop: "-12%", "&:hover": { opacity: .5 } }} onClick={() => { setDeleteFunction({ onDelete: deleteProduct }); setDeleteTitle("Are You Sure You Want To Delete This Product?"); setDeleteImage({ ...p }); setDeleteModal(true) }}>
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
                <Typography variant="body2" >Marketplaces:</Typography>
                <Grid2 container spacing={2}>
                    {p.marketPlaces && Object.keys(p.marketPlaces).length > 0 && Object.keys(p.marketPlaces).map(m => (
                        <Grid2 key={m} size={{ xs: 6, sm: 4 }}>
                            <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center", background: "#87AE73" }}>
                                <Typography variant="body2" sx={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.marketPlaces[m].name}</Typography>
                            </Box>
                        </Grid2>
                    ))}
                    {!p.marketPlaces && <Grid2 size={12}>
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
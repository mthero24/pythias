"use client";
import { Box, Grid2, TextField, Modal, Button, Typography, Card, Container, Divider, FormControlLabel, Checkbox, ImageList, ImageListItem, CircularProgress, List, ListItemText, ListItem, ListItemAvatar, Avatar, CardContent } from "@mui/material";
import axios from "axios";
import {useState, useEffect} from "react";
import { Uploader } from "../reusable/premier/uploader";
import CreatableSelect from "react-select/creatable";
import { useRouter } from "next/navigation";
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import LoaderOverlay from "../reusable/LoaderOverlay";
import DeleteModal  from "../reusable/DeleteModal";
import {Footer} from "../reusable/Footer";
import { CreateProductModal } from "./CreateProductModal";
import { MarketplaceModal } from "../reusable/MarketPlaceModal";
export function Main({ design, bls, brands, mPs, pI, licenses, colors, printLocations, seas, gen, CreateSku, source }) {
    const router = useRouter()
    const [des, setDesign] = useState({...design})
    const [bran, setBrands] = useState(brands)
    const [marketPlaces, setMarketPlaces] = useState(mPs)
    const [loading, setLoading] = useState(true)
    const [blanks, setBlanks] = useState(bls)
    const [imageGroups, setImageGroups] = useState([])
    const [upcBlank, setUpcBlank] = useState(null)
    const [upcModal, setUpcModal] = useState(false)
    const [reload, setReload] = useState(true)
    const [imageLocations, setImageLocations] = useState(printLocations.map(l=>{return l.name}))
    const [addImageModal, setAddImageModal] = useState(false);
    const [addDSTModal, setAddDSTModal] = useState(false);
    const [deleteModal, setDeleteModal] = useState(false);
    const [deleteImage, setDeleteImage] = useState({})
    const [type, setType] = useState("image")
    const [deleteFunction, setDeleeFunction] = useState({})
    const [deleteTitle, setDeleteTitle] = useState("")
    const [createProduct, setCreateProduct] = useState(false)
    const [genders, setGenders] = useState(gen ? gen : []);
    const [seasons, setSeasons] = useState(seas ? seas : []);
    const [product, setProduct] = useState({ blanks: [], design: design, threadColors: [], colors: [], sizes: [], defaultColor: null, variants: [], productImages: [], variantImages: {} })
    const [marketplaceModal, setMarketplaceModal] = useState(false)
    useEffect(()=>{
        if(!reload) setReload(!reload)
    }, [reload])
    useEffect(()=>{
        if(blanks){
            let d = {...des}
            if(!d.blanks)d.blanks = [];
            if(!d.brands) d.brands = [];
            if(d.images == undefined) d.images = {};
            d.blanks= d.blanks.map(bl=>{
                let blank = blanks.filter(b=> b._id.toString() == (bl.blank?._id? bl.blank?._id.toString(): bl.blank?.toString()))[0]                
                bl.colors = bl.colors.map(c=> {return blank.colors.filter(bc=> bc._id.toString() == (c._id? c._id.toString(): c.toString()))[0]})
                bl.defaultColor = bl.colors.filter(c=> (c?._id?c?._id.toString(): c?.toString()) == (bl.defaultColor?._id? bl.defaultColor._id.toString(): bl.defaultColor?.toString()))[0]
                bl.colors = bl.colors.filter(c=> c != undefined)
                bl.blank = blank
                return bl
            })
            d.blanks.filter(b=> b.blank != undefined)
            d.brands = d.brands.map(br=>{
                let brand = brands.filter(b=> b._id.toString() == (br._id? br._id.toString(): br.toString()))[0]
                return brand
            })
            d.blanks = d.blanks.filter(b=> b.blank != undefined)
            setDesign({...d})
            let imGr = []
            blanks.map(b=>{
              if(b.multiImages){
                Object.keys(b.multiImages).map(i=>{
                    b.multiImages[i].map(im=>{
                      im.imageGroup?.map(g=>{
                        if(!imGr.includes(g)) imGr.push(g)
                      })
                    })
                })
              }
            })
            setImageGroups(imGr)
            setLoading(false)
          }
    },[blanks])
    const getAiDescription = async () => {
        //setLoading(true);
        let d = {...des}
        try {
            let title = des.name;
            let result = await axios.post("/api/ai", {
                prompt: `Generate a 100 word description & 10 tags for a print on demand design. The print on demand design is called: "${title}". The products it is printed on are dynamic so do not be specific and mention a product name, do not mention t-shirt. Return the data as a json object {tags:[],description}.`,
            });
            let { tags, description } = await JSON.parse(result.data);
            d.tags = tags
            d.description = description
            setDesign({...d})
            updateDesign({...d})
        } catch (err) {
        alert("Something went wrong...");
        }
        //setLoading(false);
    };
    
    let updateDesign = async (des)=>{
        let res = await axios.put("/api/admin/designs", {design: {...des}}).catch(e=>{console.log(e.response.data); res = e.response})
        if(res?.data?.error) alert(res.data.msg)
    }
    const updateImage = async ({url,location, threadColor})=>{
        let d = {...des}
        if(threadColor){
            if(!d.threadImages) d.threadImages = {}
            if(!d.threadImages[threadColor]) d.threadImages[threadColor] = {}
            d.threadImages[threadColor][location] = url
        }else{
            if(!d.images) d.images = {}
            d.images[location] = url
        }
        setDesign({...d})
        updateDesign({...d})
        setLoading(false)
        setAddImageModal(true)
    }
    const relocateImage = (url,location, oldLocation, threadColor,)=>{
        let d = {...des}
        let newImages = {}
        if(threadColor){
            if(!d.threadImages) d.threadImages = {}
            newImages[location] = url
            d.threadImages[threadColor] = newImages
        }else{
            newImages[location] = url
            d.images = newImages
        }
        setDesign({...d})
        updateDesign({...d})
    }
    const tagUpdate = (val)=>{
        let d ={...des}
        d.tags = val;
        setDesign({...d})
        updateDesign({...d})
    }
    let updateTitleSku =(key)=>{
        let d = {...des};
        d[key] = event.target.value;
        setDesign({...d})
        updateDesign({...d})
    }
    let updateBrands = async (vals)=>{
        let d = {...des};
        let brands = [];
        await vals.map(async v=>{
            let brand = bran.filter(b=> b.name == v)[0];
            if(brand) brands.push(brand)
            else{
                let res = await axios.post("/api/admin/brands", {name: v})
                if(res.data.error) alert(res.data.msg)
                else{
                   setBrands(res.data.brands)
                   brands.push(res.data.brand)
                }
            }
        })
        d.brands = brands
        for(let b of brands){
            if(b.name == "Urban Threads Co."){
                d = await updateMarketPlacesBrand({brand: b, marketplaces: ["Shopify", "Shein", "Temu"], d})
            }else if(b.name == "Simply Sage Market"){
                d = await updateMarketPlacesBrand({brand: b, marketplaces: ["Shopify", "target", "Kohl's", "Walmart", "Amazon"], d})
            }else if(b.name == "The Juniper Shop"){
                d = await updateMarketPlacesBrand({brand: b, marketplaces: ["Shopify", "target", "Kohl's"], d})
            }else if(b.name == "Juniper Shop Wholesale" || b.name == "Uplifting Threads Co Wholesale" || b.name == "Olive And Ivory" || b.name == "Olive and Ivory Wholesale" || b.name == "Olive And Ivory Wholesale"){
                d = await updateMarketPlacesBrand({brand: b, marketplaces: ["Shopify", "Faire"], d})
            }
        }
        setDesign({...d})
        updateDesign({...d})
    }
    const updateMarketPlacesBrand= async ({brand, marketplaces, d})=>{
        let mps = await marketplaces.map(async m=>{
            let mp = marketPlaces.filter(lp=> m == lp.name)[0]
            if(!mp) {
                let res = await axios.post("/api/admin/marketplaces", {name: m})
                mp = res.data.marketplace
                setMarketPlaces(res.data.marketPlaces)
            }
            return mp
        })
        mps = await Promise.all(mps)
        d.marketPlaces = mps;
        let b2ms = d.b2m
        let b2m = b2ms.filter(b=> b.brand== brand.name)[0]
        if(!b2m) {
            b2m = {
                brand: brand.name,
                marketPlaces: mps.map(m=> {return m.name})
            }
            b2ms.push(b2m)
        }
        else b2m.marketPlaces =  mps.map(m=> {return m.name})
        d.b2m = b2ms
        return {...d}
    }
    const updateMarketPlaces= async ({brand, marketplaces})=>{
        let mps = await marketplaces.map(async m=>{
            let mp = marketPlaces.filter(lp=> m == lp.name)[0]
            if(!mp) {
                let res = await axios.post("/api/admin/marketplaces", {name: m})
                mp = res.data.marketplace
                setMarketPlaces(res.data.marketPlaces)
            }
            return mp
        })
        mps = await Promise.all(mps)
        let d = {...des}
        d.marketPlaces = mps;
        let b2ms = d.b2m
        let b2m = b2ms.filter(b=> b.brand== brand.name)[0]
        if(!b2m) {
            b2m = {
                brand: brand.name,
                marketPlaces: mps.map(m=> {return m.name})
            }
            b2ms.push(b2m)
        }
        else b2m.marketPlaces =  mps.map(m=> {return m.name})
        d.b2m = b2ms
        setDesign({...d})
        updateDesign({...d})
    }

    const deleteDesignImage = ({location, threadColor})=>{
        let d = {...des}
        if(threadColor){
            let newImages = {}
            for(let i of Object.keys(d.threadImages)){
                for(let j of Object.keys(d.threadImages[i])){
                    if(i == threadColor && j == location){
                        continue;
                    }
                    if(!newImages[i]) newImages[i] = {}
                    newImages[i][j] = d.threadImages[i][j]
                }
            }
            d.threadImages = newImages;
        }else{
            let newImages = {}
            for(let i of Object.keys(d.images)){
                if(i != location){
                    newImages[i] = d.images[i]
                }
            }
            d.images = newImages;
        }
        setDesign({...d})
        updateDesign({...d})
    }
    const deleteDesign = async () => {
        let res = await axios.delete(`/api/admin/designs?design=${des._id}`)
        if (res.data.error) alert(res.data.msg)
        else {
            router.push("/admin/designs")
        }
    }
        return (
        <Box>
            <Container maxWidth="lg">
                <Box sx={{display: "flex", flexDirection: "row", justifyContent: "space-between"}}>
                    {!des.sendToMarketplaces && <Button sx={{ margin: "1% 2%", background: "#645D5B", color: "#ffffff"}} onClick={()=>{
                                    let d = {...des};
                                    d.sendToMarketplaces = true;
                                    setDesign({...d});
                                    updateDesign({...d})
                                    alert(`Design will resend to market places next time files are made`)
                    }}>Resend To Market Places</Button>}
                    <Button sx={{ margin: "1% 2%", background: "#780606", color: "#ffffff"}} onClick={()=>{
                        setDeleteTitle("Are you sure you want to delete this design?");
                        setDeleeFunction({onDelete: deleteDesign});
                        setDeleteModal(true);
                    }}>Delete</Button>
                </Box>
                <Card sx={{margin: "1% 0%"}}>
                    <Box sx={{display: "flex", flexDirection:"row", overflowX: "auto"}}>
                        {imageLocations.map((i, j) => (
                            <>
                                {des.images && des.images[i] &&
                                    <Box key={j} sx={{width: "400px", minWidth: "400px", maxWidth: "400px", margin: "0% 2%"}}>
                                        <Box sx={{ position: "relative", zIndex: 999, left: { sm: "80%", md: "90%" }, bottom: -35, padding: "2%", cursor: "pointer", "&:hover": { opacity: .5 } }} onClick={() => { setDeleteImage({ location: i, }); setDeleeFunction({ onDelete: deleteDesignImage }); setDeleteTitle("Are You Sure You Want To Delete This Image?"); setDeleteModal(true) }}>
                                            <DeleteIcon sx={{ color: "#780606"}} />
                                        </Box>
                                        <Box sx={{padding: "3%", background: "#e2e2e2", height: { sm: "150px", md: "350px" }, minHeight: "150px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                            <img src={des.images && des.images[i] ? `${des.images[i]?.replace("images1.pythiastechnologies.com", "images2.pythiastechnologies.com/origin")}?width=400` : "/missingImage.jpg"} alt={`${des.name} ${des.sku} design`} style={{ width: "auto", height: "auto", maxHeight: "100%", maxWidth: "100%", background: "#e2e2e2" }} />
                                        </Box>
                                        <Box sx={{borderTop: "1px solid black",marginTop: "3%"}}>
                                            <p style={{ textAlign: "center" }}>Default {i} Image</p>
                                        </Box>
                                    </Box>
                                }
                            </>
                        ))}
                        {des.threadColors && des.threadColors.length > 0 && <>
                            {des.threadColors.map(tc => (
                                <>
                                    {imageLocations.map((i, j) => (
                                        <>
                                            {des.threadImages && des.threadImages[colors.filter(c => (c._id ? c._id.toString() : c.toString()) == tc.toString())[0]?.name] && des.threadImages[colors.filter(c => (c._id ? c._id.toString() : c.toString()) == tc.toString())[0]?.name][i] && 
                                                <Box key={j} sx={{ width: "400px", minWidth: "400px", maxWidth: "400px", margin: "0% 2%" }}>
                                                    <Box sx={{ position: "relative", zIndex: 999, left: { sm: "80%", md: "90%" }, bottom: -35, padding: "2%", cursor: "pointer", "&:hover": { opacity: .5 } }} onClick={() => { setDeleeFunction({ onDelete: deleteDesignImage }); setDeleteTitle("Are You Sure You Want To Delete This Image?"); setDeleteImage({ location: i, threadColor: colors.filter(c => (c._id ? c._id.toString() : c.toString()) == tc.toString())[0].name }); setDeleteModal(true)}}>
                                                    <DeleteIcon sx={{ color: "#780606" }} />
                                                </Box>
                                                <Box sx={{ padding: "3%", background: "#e2e2e2", height: { sm: "150px", md: "350px" }, minHeight: "150px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                        <img src={`${des.threadImages[colors.filter(c => (c._id ? c._id.toString() : c.toString()) == tc.toString())[0].name][i].replace("images1.pythiastechnologies.com", "images2.pythiastechnologies.com/origin")}?width=400`} alt={`${i} image`} width={400} height={400} style={{ width: "auto", height: "auto", maxHeight: "100%", maxWidth: "100%", padding: "1%" }} />
                                                </Box>
                                                <Box sx={{ borderTop: "1px solid black", marginTop: "3%" }}>
                                                    <p style={{ textAlign: "center" }}>{colors.filter(c => (c._id ? c._id.toString() : c) == tc.toString())[0].name} {i} Image</p>
                                                </Box>
                                                </Box>
                                            }
                                        </>
                                    ))}
                                </>
                            ))}
                        </>}
                    </Box>
                </Card>
                <Grid2 container spacing={3} sx={{width: "98%", padding: ".5%"}}>
                    <Grid2 size={6}>
                        <Button fullWidth sx={{ margin: "1% 2%", background: "#645D5B", color: "#ffffff" }} onClick={()=>{setAddImageModal(true)}} >Add Images</Button>
                    </Grid2>
                    <Grid2 size={6}>
                            <Button fullWidth sx={{ margin: "1% 2%", background: "#645D5B", color: "#ffffff" }} onClick={() => { setAddDSTModal(true) }}>Add DSTs</Button>
                    </Grid2>
                </Grid2>
                <Grid2 container spacing={2} sx={{ background: "#fff", padding: "2%", margin: "2% 0%", boxShadow: "0px 0px 10px rgba(0,0,0,.1)", borderRadius: "5px", }}>
                    <Grid2 size={{xs: 7, sm: 8}}>
                        <TextField label="Title" fullWidth value={des?.name}
                        onChange={()=>updateTitleSku("name")}/>
                    </Grid2>
                    <Grid2 size={{xs: 5, sm: 4}}>
                        <TextField label="SKU" fullWidth value={des?.sku}
                        onChange={()=>updateTitleSku("sku")}/>
                    </Grid2>
                    <Grid2 size={{xs: 12, sm: 12}}>
                        <TextField placeholder="Description" fullWidth multiline rows={4} value={des?.description} onChange={()=>updateTitleSku("description")}/>
                        <Button size="small" sx={{fontSize: ".5rem", margin: "0%"}} onClick={getAiDescription}>Generate Description And Tags</Button>
                    </Grid2>
                    <Grid2 size={12}><hr/></Grid2>
                    <Grid2 size={{xs: 12, sm: 12}}>
                        <Typography>Tags</Typography>
                        <CreatableSelect
                            placeholder="Tags"
                            onChange={(val)=>{
                                tagUpdate(val.map(t=>{return t.value}))
                            }}
                            value={des.tags.map(t=>{
                                return {value: t, label: t }
                            })}
                            isMulti
                        />
                    </Grid2>
                    <Grid2 size={12}><hr/></Grid2>
                    <Grid2 size={12} sx={{marginBottom: "2%"}}>
                        <Grid2 container spacing={2}>
                            <Grid2 size={6}>
                                <CreatableSelect
                                    placeholder="Print Type"
                                    options={[{label: "Direct To Transfer", value: "DTF"}, {label: "Vinyl", value: "VIN"}, {label: "Embroidery", value: "EMB"}, {label: "Screen Print", value: "SCN"}]}
                                    value={{label: des.printType == "DTF"? "Direct To Transfer": des.printType == "VIN"? "Vinyl": des.printType == "EMB"? "Embroidery": des.printType == "SCN"? "Screen Print": "Direct To Transfer", value: des.printType? des.printType: "DTF"  }}
                                    onChange={(vals)=>{
                                        let d = {...des}
                                        d.printType = vals.value
                                        setDesign({...d})
                                        updateDesign({...d})
                                    }}
                                />
                            </Grid2>
                            <Grid2 size={6}>
                                <CreatableSelect
                                    placeholder="License Holder"
                                    options={[{label: "License Holder", value: null}, ...licenses.map(l=> {return {label: l.name, value: l._id}})]}
                                    value={des.licenseHolder? {label: licenses.filter(l=> l._id.toString() == des.licenseHolder.toString())[0]?.name, value: des.licenseHolder}: null}
                                    onChange={(vals)=>{
                                        let d = {...des}
                                        d.licenseHolder = vals.value
                                        setDesign({...d})
                                        updateDesign({...d})
                                    }}
                                />
                            </Grid2>
                        </Grid2>
                    </Grid2>
                </Grid2>
                <Grid2 container spacing={3} sx={{ width: "98%", padding: ".5%" }}>
                    <Grid2 size={12}>
                            <Button fullWidth sx={{ margin: "1% 1%", background: "#645D5B", color: "#ffffff" }} onClick={() => { setProduct({ blanks: [], design: design, threadColors: [], colors: [], sizes: [], defaultColor: null, variants: [], productImages: [], variantImages: {} });setCreateProduct(true)}} >Create Product</Button>
                    </Grid2>
                </Grid2>
                <Grid2 container spacing={3} sx={{ width: "98%", padding: ".5%" }}>
                    {des.products && des.products.length > 0 && des.products.map((p, i) => (
                        <Grid2 size={4} key={i}> 
                            <Box sx={{ padding: "2%", background: "#fff", boxShadow: "0px 0px 10px rgba(0,0,0,.1)", borderRadius: "5px", marginBottom: "2%" }}>
                                <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "center" }}>
                                    {console.log(p.productImages, p.defaultColor)}
                                    <img src={p.productImages?.filter(i => i.color._id?.toString() == p.defaultColor?.toString() && i.side != "back")[0]?.image} width={400} height={400} style={{ objectFit: "cover", borderRadius: "5px" }} />
                                </Box>
                                {p.productImages.filter(i => i.color?._id?.toString() == p.defaultColor?.toString() && (i.side == "back" || i.side == "modelBack"))[0] && <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "flex-start", alignItems: "center", position: "relative", zIndex: 1, top: -130, left: 0, padding: "2%", marginBottom: "-130px", }}>
                                    {console.log("back")}
                                    <img src={p.productImages.filter(i => i.color._id.toString() == p.defaultColor.toString() && (i.side == "back" || i.side == "modelBack"))[0]?.image} width={120} height={120} style={{ objectFit: "cover", borderRadius: "100px" }} />
                                </Box>}
                                <Divider sx={{ margin: "2% 0" }} />
                                <Box sx={{ display: "flex", flexDirection: "column",}}>
                                    <List>
                                        <ListItem>
                                            <ListItemText sx={{textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap"}} primary={p.title} secondary={p.sku} />
                                        </ListItem>
                                    </List>
                                </Box>
                                <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: "1%" }}>
                                    <Button variant="contained" color="primary" onClick={() => { setMarketplaceModal(true); setProduct(p) }} >Add To MarketPlace</Button>
                                    <Button variant="outlined" color="secondary" onClick={()=>{setProduct(p); setCreateProduct(true);}}>Edit Product</Button> 
                                </Box>
                            </Box>
                        </Grid2>
                    ))}
                </Grid2>
                <ModalUpc open={upcModal} setOpen={setUpcModal} blank={upcBlank} setBlank={setUpcBlank} design={des} colors={colors} />
                <AddImageModal open={addImageModal} setOpen={setAddImageModal} des={des} setDesign={setDesign} updateDesign={updateDesign} printLocations={printLocations} reload={reload} setReload={setReload} colors={colors} loading={loading} setLoading={setLoading}/>
                <AddDSTModal open={addDSTModal} setOpen={setAddDSTModal} des={des} setDesign={setDesign} updateDesign={updateDesign} printLocations={printLocations} reload={reload} setReload={setReload} colors={colors} loading={loading} setLoading={setLoading} setDeleteModal={setDeleteModal} setDeleteImage={setDeleteImage} setDeleteTitle={setDeleteTitle} setDeleeFunction={setDeleeFunction} />
                <DeleteModal open={deleteModal} setOpen={setDeleteModal} title={deleteTitle } onDelete={deleteFunction.onDelete} deleteImage={deleteImage} type={type} />
                <CreateProductModal open={createProduct} setOpen={setCreateProduct} product={product} setProduct={setProduct} blanks={blanks} design={des} setDesign={setDesign} updateDesign={updateDesign} colors={colors} imageGroups={imageGroups} brands={bran} genders={genders} seasons={seasons} setBrands={setBrands} setGenders={setGenders} setSeasons={setSeasons} CreateSku={CreateSku} source={source} loading={loading} setLoading={setLoading}/>
                {loading && <LoaderOverlay/>}
                <MarketplaceModal open={marketplaceModal} setOpen={setMarketplaceModal} product={product} setProduct={setProduct} marketPlaces={marketPlaces} setMarketPlaces={setMarketPlaces} sizes={blanks.map(b => {return b.sizes.map(s => {return s.name})})} />

            </Container>
            <Footer/>
        </Box>
    )
}

const AddDSTModal = ({ open, setOpen, reload, setReload, des, loading, setLoading, setDesign, updateDesign, printLocations, setDeleteModal, setDeleteImage, setDeleteTitle, setDeleeFunction }) => {
    const [location, setLocation] = useState("front")
    const style = {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: "60%",
        height: "50vh",
        bgcolor: 'background.paper',
        border: '2px solid #000',
        boxShadow: 24,
        p: 4,
        overflowX: "auto",
        overflowY: "none",
    };
    const updateEmbroidery = async ({ url, location }) => {
        let d = { ...des }
        if (!d.embroideryFiles) d.embroideryFiles = {};
        d.embroideryFiles[location] = url
        setDesign({ ...d })
        updateDesign({ ...d })
        setLoading(false)
        setReload(true)
        setOpen(true)
    }
    const relocateDST = (url, location, oldLocation, threadColor,) => {
        let d = { ...des }
        let newFiles = {}
        newFiles[location] = url
        d.embroideryFiles = newFiles
        setDesign({ ...d })
        updateDesign({ ...d })
    }
    const deleteEmbroideryFile = ({ location }) => {
        let d = { ...des }
        des.embroideryFiles[location] = null;
        setDesign({ ...d })
        updateDesign({ ...d })
    }
    return (
        <Modal
            open={open}
            onClose={() => { setOpen(false); setBlank(null); setUpc([]) }}
            aria-labelledby="modal-modal-title"
            aria-describedby="modal-modal-description"
        >
            <Box sx={style}>
                <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "flex-end", alignItems: "center", padding: "1%", cursor: "pointer", "&:hover": { opacity: .6 } }} onClick={() => setOpen(false)}>
                    <CloseIcon sx={{ color: "#780606" }} />
                </Box>
                <Grid2 container spacing={2}>
                    <Grid2 size={3}>
                        {reload && <Uploader location={location} afterFunction={updateEmbroidery} setLoading={setLoading} setOpen={setOpen} />}
                        <CreatableSelect
                            options={printLocations.map(p => { return { value: p.name, label: p.name } })}
                            value={{ value: location, label: location }}
                            onChange={(vals) => {
                                setLocation(vals.value)
                                setReload(false)
                            }}
                        />
                    </Grid2>
                    {printLocations.map((i, j) => (
                        <>
                            {des.embroideryFiles && des.embroideryFiles[i.name] && des.embroideryFiles[i.name] != null && <Grid2 size={3} key={j}>
                                <Box sx={{ position: "relative", zIndex: 999, left: { sm: "80%", md: "90%" }, bottom: -35, padding: "2%", cursor: "pointer", "&:hover": { opacity: .5 } }} onClick={() => { setDeleteImage({ location: i.name, }); setDeleeFunction({ onDelete: deleteEmbroideryFile }); setDeleteTitle("Are You Sure You Want To Delete This DST File?"); setDeleteModal(true) }}>
                                    <DeleteIcon sx={{ color: "#780606" }} />
                                </Box>
                                <img src={"/embplaceholder.jpg"} alt={`${i.name} image`} width={400} height={400} style={{ width: "100%", height: "auto" }} />
                                <p style={{ textAlign: "center" }}>{i.name} File</p>
                                <CreatableSelect
                                    options={printLocations.map(p => { return { value: p.name, label: p.name } })}
                                    value={{ value: i.name, label: i.name }}
                                    onChange={(vals) => {
                                        relocateDST(des.embroideryFiles[i.name], vals.value, i)
                                        setReload(false)
                                    }}
                                />
                            </Grid2>}
                        </>

                    ))}
                </Grid2>
            </Box>
        </Modal>
    )
}

const AddImageModal = ({ open, setOpen, reload, setReload, loading, setLoading, des, setDesign, updateDesign, printLocations, colors }) => {
    const [location, setLocation] = useState("front")
    const [threadColor, setThreadColor] = useState(null)
    const style = {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: "30%",
        height: "50vh",
        bgcolor: 'background.paper',
        border: '2px solid #000',
        boxShadow: 24,
        p: 4,
        overflow: "auto"
    };
    const updateImage = async ({ url, location, threadColor }) => {
        let d = { ...des }
        if (threadColor && threadColor != "default" && threadColor != null) {
            if (!d.threadImages) d.threadImages = {}
            if (!d.threadImages[threadColor]) d.threadImages[threadColor] = {}
            d.threadImages[threadColor][location] = url
        } else {
            if (!d.images) d.images = {}
            d.images[location] = url
        }
        setDesign({ ...d })
        updateDesign({ ...d })
        setLoading(false)
        setReload(true)
        setOpen(true)
    }
    return (
        <Modal
            open={open}
            onClose={() => { setOpen(false); setBlank(null); setUpc([]) }}
            aria-labelledby="modal-modal-title"
            aria-describedby="modal-modal-description"
        >
            <Box sx={style}>
                <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "flex-end", alignItems: "center", padding: "1%", cursor: "pointer", "&:hover": {opacity: .6} }} onClick={() => setOpen(false)}>
                    <CloseIcon sx={{ color: "#780606" }} />
                </Box>
                <Typography textAlign={"center"}>Upload Images</Typography>
                <CreatableSelect
                    placeholder="Thread Colors"
                    options={colors?.map(m => { return { value: m._id, label: m.name } })}
                    value={des?.threadColors?.map(m => { return { value: colors?.filter(c => (c._id ? c._id.toString() : c) == m.toString())[0]?._id, label: colors.filter(c => (c._id ? c._id.toString() : c) == m.toString())[0]?.name } })}
                    onChange={(vals) => {
                        let d = { ...des }
                        let newThread = []
                        for (let v of vals) {
                            newThread.push(v.value)
                        }
                        d.threadColors = newThread
                        for (let m of d.threadColors) {
                            if (!d.threadImages) d.threadImages = {}
                            if (!d.threadImages[colors.filter(c => (c._id ? c._id.toString() : c) == m.toString())[0]?.name]) {
                                d.threadImages[colors.filter(c => (c._id ? c._id.toString() : c) == m.toString())[0]?.name] = {}
                            }
                        }
                        setDesign({ ...d })
                        updateDesign({ ...d })
                        setReload(false)
                    }}
                    isMulti
                /> 
                <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "1%", }}>
                    {reload && <Uploader location={location} threadColor={threadColor} afterFunction={updateImage} setLoading={setLoading} setOpen={setOpen} />}
                    <Box sx={{ width: "100%", padding: "2%" }}>
                    <CreatableSelect
                        options={printLocations?.map(p => { return { value: p.name, label: p.name } })}
                        value={{ value: location, label: location }}
                        onChange={(vals) => {
                            setLocation(vals.value)
                            setReload(false)
                        }}
                    />
                        <CreatableSelect
                            options={des.threadColors && des.threadColors.length > 0? [...des?.threadColors?.map(p => { return { value: colors?.filter(c => c._id.toString() == p)[0].name, label: colors?.filter(c => c._id.toString() == p)[0].name } }) , { value: "default", label: "Default" }]: [{ value: "default", label: "Default" }]}
                            value={{ value: threadColor, label: threadColor? threadColor: "Default" }}
                            onChange={(vals) => {
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

const ModalUpc = ({open, setOpen, blank, setBlank, design, colors})=>{
    
    const style = {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: "90%",
        height: "80vh",
        bgcolor: 'background.paper',
        border: '2px solid #000',
        boxShadow: 24,
        p: 4,
        overflow: "auto"
      };
    return (
        <Modal
        open={open}
        onClose={()=>{setOpen(false); setBlank(null); setUpc([])}}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
            <Typography>Product Sku</Typography>
            <Box sx={{padding: "2%"}}>
                <Typography>{`${design.sku}_${blank?.blank?.code}`}</Typography>
            </Box>
            <hr/>
            <Typography>Variant Sku's</Typography>
            {design.threadColors?.length > 0 && design.threadColors.map(tr=>{
                return (blank?.colors.map(c=>{
                    return (blank?.blank.sizes.map(s=>{
                        return <Typography key={`${design.printType}_${design.sku}_${c.sku}_${s.name}_${blank.blank.code}_${tr.name}`}>{`${design.printType}_${design.sku}_${c.sku}_${s.name}_${blank.blank.code}_${colors.filter(c=> c._id.toString() == tr.toString())[0]?.name}`}</Typography>
                    }))
                }))
            })}
            {design.threadColors?.length == 0 && blank?.colors?.map(c=>{
                return blank.blank?.sizes?.map(s=>{
                    return (<Box sx={{padding: "2%"}} key={`${design.printType}_${design.sku}_${c.sku}_${s.name}_${blank.blank.code}`}>
                        <Typography>{`${design.printType}_${design.sku}_${c.sku}_${s.name}_${blank.blank.code}`}</Typography> 
                        <hr/>
                    </Box>)
                })
            })}
        </Box>
      </Modal>
    )
}
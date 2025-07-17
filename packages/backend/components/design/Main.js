"use client";
import {Box, Grid2, TextField, Modal, Button, Typography, Card, Container, Divider, FormControlLabel, Checkbox, Grid} from "@mui/material";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import axios from "axios";
import {useState, useEffect} from "react";
import { Uploader } from "../reusable/premier/uploader";
import CreatableSelect from "react-select/creatable";
import ProductImageOverlay from "../reusable/ProductImageOverlay";
import { useRouter } from "next/navigation";
import { AltImageModal } from "./AltImagesModal";
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import LoaderOverlay from "../reusable/LoaderOverlay";
import DeleteModal  from "../reusable/DeleteModal";
import {Footer} from "../reusable/Footer";
import CheckIcon from '@mui/icons-material/Check';
import { set } from "mongoose";
import { ConstructionOutlined, Create } from "@mui/icons-material";
export function Main({ design, bls, brands, mPs, pI, licenses, colors, printLocations, seas, gen }){
    const router = useRouter()
    const [des, setDesign] = useState({...design})
    const [bran, setBrands] = useState(brands)
    const [marketPlaces, setMarketPlaces] = useState(mPs)
    const [loading, setLoading] = useState(true)
    const [blanks, setBlanks] = useState(bls)
    const [imageGroups, setImageGroups] = useState([])
    const [imageGroupImages, setImageGroupImages] = useState([])
    const [imageBlank, setImageBlank] = useState({label: "Blank", value: null})
    const [imageColor, setImageColor] = useState({label: "Color", value: null})
    const [threadColor, setThreadColor] = useState(null)
    const [upcBlank, setUpcBlank] = useState(null)
    const [upcModal, setUpcModal] = useState(false)
    const [open, setOpen] = useState(false)
    const [blankForAlt, setBlankForAlt] = useState(null)
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
    useEffect(()=>{
        let images = []
        des.imageGroup && des.blanks.map((b, j)=>{
            if(imageBlank && imageBlank.value && b.blank.code.toString() == imageBlank.value.toString()){
                for(let side of Object.keys(design.images)){
                    Object.keys(b && b.blank && b.blank.multiImages? b.blank.multiImages: {}).filter(s=> s == side && design.images[side]).map((i,j)=>{
                        let color = b.colors.filter(c=> c.name == imageColor.value)[0]
                        let foundImages = false
                        let useImages = b && b.blank.multiImages[i].filter(im=> im.imageGroup.includes(des.imageGroup) && color?._id.toString() == im.color.toString())
                        useImages.map(im=>{
                            let image = im
                            image.side = i
                            image.style=b.blank.code
                            if(image.side == "modelFront") image.side = "front"
                            if(image.side == "modelBack") image.side = "back"
                            images.push(image)
                            foundImages = true
                        })
                    })
                }
                if(images.length == 0){
                   for(let side of Object.keys(design.images)){
                        Object.keys(
                          b && b.blank && b.blank.multiImages
                            ? b.blank.multiImages
                            : {}
                        )
                          .filter((s) => s == side && design.images[side])
                          .map((i, j) => {
                            let color = b.colors.filter(
                              (c) => c.name == imageColor.value
                            )[0];
                            let foundImages = false;
                            if (
                              b.blank.multiImages[i].filter(
                                (im) =>
                                  im.imageGroup.includes("default") &&
                                  color?._id.toString() == im.color.toString()
                              )[0]
                            ) {
                              let image = b.blank.multiImages[i].filter(
                                (im) =>
                                  im.imageGroup.includes("default") &&
                                  color?._id.toString() == im.color.toString()
                              )[0];
                              image.side = i;
                              image.style = b.blank.code;
                              if (image.side == "modelFront")
                                image.side = "front";
                              if (image.side == "modelBack")
                                image.side = "back";
                              images.push(image);
                              foundImages = true;
                            }
                          });
                    }
                }
            }
        })
        setImageGroupImages([...images])
    },[imageBlank, imageColor, threadColor])
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
    const updateBlanks = async ({values})=>{
        let d = {...des}
        let codes = values.map(b=>{return b})
        values.map(bl=>{
            if(!d.blanks) d.blanks = [];
            let blank = d.blanks?.filter(bla=> bla.blank.code == bl)[0]
            if(!blank){
                let blank = blanks.filter(b=> b.code == bl)[0]
                if(blank){
                    d.blanks.push({
                        blank
                    })
                }
            }
        })
        d.blanks = d.blanks.filter(b=> codes.includes(b.blank.code))
        setDesign({...d})
        updateDesign({...d})
    }
    const updateColors = ({blank, colors}) =>{
        let d = {...des}
        let b = d.blanks.filter(bl=> bl.blank._id.toString() == blank.blank._id.toString())[0]
        b.colors = b.blank.colors.filter(c=> colors.includes(c.name))
        setDesign({...d})
        updateDesign({...d})
    }
    const updateDefaultColor = ({blank, color}) =>{
        let d = {...des}
        let b = d.blanks.filter(bl=> bl.blank._id.toString() == blank.blank._id.toString())[0]
        b.defaultColor = b.blank.colors.filter(c=> color.value == c.name)[0]
        setDesign({...d})
        updateDesign({...d})
    }
    const setDefaultImages = ({id, side})=>{
        let d = {...des}
        let b = d.blanks.filter(bl=> bl.blank.code == imageBlank.value)[0]
        if(b.defaultImages == undefined) b.defaultImages = []
        let dI = b.defaultImages.filter(df=> df.color == b.colors.filter(c=> c.name == imageColor.value)[0]?._id)[0]
        let others = b.defaultImages.filter(df=> df.color != b.colors.filter(c=> c.name == imageColor.value)[0]?._id)
        if(!dI) dI = {id, side, color: b.colors.filter(c=> c.name == imageColor.value)[0]?._id}
        else {
            dI.id = id
            dI.side = side,
            dI.color = b.colors.filter(c=> c.name == imageColor.value)[0]?._id
        }
        others.push(dI)
        b.defaultImages = others
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
                                            {des.threadImages[colors.filter(c => (c._id ? c._id.toString() : c.toString()) == tc.toString())[0].name] && des.threadImages[colors.filter(c => (c._id ? c._id.toString() : c.toString()) == tc.toString())[0].name][i] && 
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
                        <Button fullWidth sx={{ margin: "1% 1%", background: "#645D5B", color: "#ffffff" }} onClick={()=>{setCreateProduct(true)}} >Create Product</Button>
                    </Grid2>
                </Grid2>
                <ModalUpc open={upcModal} setOpen={setUpcModal} blank={upcBlank} setBlank={setUpcBlank} design={des} colors={colors} />
                <AltImageModal open={open} setOpen={setOpen} blank={blankForAlt} design={des} setDesign={setDesign} updateDesign={updateDesign}  />
                <AddImageModal open={addImageModal} setOpen={setAddImageModal} des={des} setDesign={setDesign} updateDesign={updateDesign} printLocations={printLocations} reload={reload} setReload={setReload} colors={colors} loading={loading} setLoading={setLoading}/>
                <AddDSTModal open={addDSTModal} setOpen={setAddDSTModal} des={des} setDesign={setDesign} updateDesign={updateDesign} printLocations={printLocations} reload={reload} setReload={setReload} colors={colors} loading={loading} setLoading={setLoading} setDeleteModal={setDeleteModal} setDeleteImage={setDeleteImage} setDeleteTitle={setDeleteTitle} setDeleeFunction={setDeleeFunction} />
                <DeleteModal open={deleteModal} setOpen={setDeleteModal} title={deleteTitle } onDelete={deleteFunction.onDelete} deleteImage={deleteImage} type={type} />
                    <CreateProductModal open={createProduct} setOpen={setCreateProduct} blanks={blanks} design={des} colors={colors} imageGroups={imageGroups} brands={bran} genders={genders} seasons={seasons} setBrands={setBrands} />
                {loading && <LoaderOverlay/>}
            </Container>
            <Footer/>
        </Box>
    )
}
const CreateProductModal = ({ open, setOpen, design, blanks, colors, imageGroups, brands, genders, seasons, setSeasons, setGenders, setBrands }) => {
    const [product, setProduct] = useState({blanks: [], design: design, threadColors: [], colors: [], sizes:[], defaultColor: null, variants: [], productImages: [], variantImages: {}})
    const [cols, setColors] = useState([])
    const [sizes, setSizes] = useState([])
    const [images, setImages] = useState([])
    const [stage, setStage] = useState("blanks")
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
                            if(b.multiImages && b.multiImages[di] && b.multiImages[di].length > 0){
                                if (!color) {
                                    color = b.multiImages[di][0].color
                                    styleImages.push({ blankImage: b.multiImages[di][0], designImage: design.images[di], side: di, colorName: colors.filter(c => c._id.toString() == color.toString())[0].name })
                                }else{
                                    styleImages.push({ blankImage: b.multiImages[di].filter(i => i.color.toString() == color.toString())[0], designImage: design.images[di], side: di, colorName: colors.filter(c => c._id.toString() == color.toString())[0].name })
                                }
                            }
                        }
                        //console.log(styleImages)
                        if (styleImages.length == 0 || designImages.length != styleImages.length) return null;
                        return (
                            <Grid2 size={{ sm: 6 * styleImages.length, md: 3 * styleImages.length }} key={b._id} onClick={() => {
                                let p = { ...product }
                                //console.log(b)
                                let blank = p.blanks.filter(blank => blank?._id.toString() == b?._id.toString())[0]
                               // console.log(blank)
                                if (blank) {
                                    p.blanks = p.blanks.filter(blank => blank?._id.toString() != b._id.toString())
                                } else {
                                    //console.log("Adding blank")
                                    p.blanks.push(b)
                                }
                                setProduct({ ...p })
                            }}>
                                <Box sx={{ border: "1px solid #000", borderRadius: "5px", padding: "1%", margin: ".5%", display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer", "&:hover": { background: "#f0f0f0", opacity: .7 } }}>
                                    <Box sx={{ position: "relative", zIndex: 999,display: "flex", flexDirection: "row", justifyContent: "flex-end", alignItems: "center", width: "100%", marginBottom: "1%", }}>
                                        <FormControlLabel control={<Checkbox checked={product.blanks.filter(blank => blank?._id.toString() == b?._id.toString())[0] != undefined} />} />
                                    </Box>
                                    <Box sx={{ marginTop: "-45px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1%" }}>
                                        {styleImages.length > 0 && styleImages.map((si, i) => (
                                            <img src={`http://imperial.pythiastechnologies.com/api/renderImages/${design.sku}-${b.code.replace(/-/g, "_")}-${si.blankImage.image.split("/")[si.blankImage.image.split("/").length - 1].split(".")[0]}-${si.colorName.replace(/\//g, "_")}-${si.side}.jpg}?width=400`} alt={`${b.code} image`} width={400} height={400} style={{ width: "auto", height: "auto", maxHeight: "100%", maxWidth: "100%" }} /> 
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
                                        //console.log(color)
                                        if (!colors.filter(c => c._id.toString() == color._id.toString())[0]) {
                                            colors.push(color)
                                        }
                                    }
                                    for(let s of b.sizes){
                                        if(!sizs.filter(si=> s.name == si.name)[0]) sizs.push(s)
                                    }
                                }
                                //console.log(colors.length)
                                let p = {...product}
                                p.sizes = sizs
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
                        <Card sx={{ padding: "2%", marginBottom: "2%" }}>
                            <Typography variant="body1" sx={{ color: "#000", textAlign: "center", marginBottom: "1%" }}>Select the Thread colors you want to use for this product. You can select multiple colors.</Typography>
                            <Box>
                                <hr />
                                <Grid2 container spacing={2} sx={{ marginTop: "2%" }}>
                                    {
                                        design.threadColors.map(tc => { return colors.filter(c => c._id.toString() == tc.toString())[0]}).map(c => (
                                            <Grid2 size={{ xs: 3, sm: 1.5, md: 1, lg: .75, xl: .5 }} sx={{ "&:hover": { cursor: 'pointer', opacity: .6 } }} onClick={() => {
                                                let p = { ...product }
                                                if (!p.threadColors.filter(co => co._id.toString() == c._id.toString())[0]) p.threadColors.push(c)
                                                else {
                                                    let colors = [];
                                                    for (let co of p.threadColors) {
                                                        if (co._id.toString() != c._id.toString()) colors.push(co)
                                                    }
                                                    p.threadColors = colors
                                                }
                                                //console.log(p.colors)
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
                        <Card sx={{ padding: "2%", marginBottom: "2%" }}>
                            <Typography variant="body1" sx={{ color: "#000", textAlign: "center", marginBottom: "1%" }}>Select the colors you want to use for this product. You can select multiple colors.</Typography>
                            <Box>
                                <hr/>
                                <Grid2 container spacing={2} sx={{marginTop: "2%"}}>
                                    {
                                        cols.map(c=>(
                                            <Grid2 size={{xs: 3, sm: 1.5, md: 1, lg: .75, xl: .5}} sx={{"&:hover": {cursor: 'pointer', opacity: .6}}} onClick={()=>{
                                                let p = {...product}
                                                if(!p.colors.filter(co=> co._id.toString() == c._id.toString())[0]) p.colors.push(c)
                                                else{
                                                    let colors = [];
                                                    for(let co of p.colors){
                                                        if(co._id.toString() != c._id.toString()) colors.push(co)
                                                    }
                                                    p.colors = colors
                                                }
                                                //console.log(p.colors)
                                                setProduct({...p})
                                            }}>
                                                <Box sx={{background: c.hexcode, padding: "3%", width: "100%", height: "45px", borderRadius: "10px", boxShadow: `2px 2px 2px ${c.hexcode}`}}>
                                                    {product.colors.filter(co => co._id.toString() == c._id.toString())[0] && <CheckIcon sx={{ color: c.color_type == "dark"? "#fff": "#000", marginLeft: "10px", marginTop: "10px" }} />}
                                                </Box>
                                                <Typography sx={{ fontSize: ".6rem", textAlign: "center" }}>{c.name}</Typography>
                                            </Grid2>
                                        ))
                                    }
                                </Grid2>
                            </Box>
                        </Card>
                        <CreatableSelect 
                            placeholder= "Default Color"
                            options={product.colors.map(c => { return { value: c, label: <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "space-between", padding: "1% 15%" }}><Box sx={{ background: c.hexcode, padding: "3%", width: "1%", height: "35px", borderRadius: "10px" }}></Box><Box sx={{padding: "2%"}}><Typography>{c.name}</Typography></Box></Box>}})}
                            value={product.defaultColor && {
                                value: product.defaultColor, label: <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "space-between", padding: "1% 15%" }}><Box sx={{ background: product.defaultColor.hexcode, padding: "3%", width: "1%", height: "35px", borderRadius: "10px" }}></Box><Box sx={{ padding: "2%" }}><Typography>{product.defaultColor.name}</Typography></Box></Box> }}
                            onChange={(val)=>{
                                //console.log(val)
                                let p = {...product}
                                p.defaultColor = val.value,
                                setProduct({...p})
                            }}
                        />
                        <Box sx={{margin: "2% 0%"}}>
                            <Card>
                                <Typography variant="h5" sx={{ color: "#000", textAlign: "center", marginBottom: "1%" }}>Select Sizes</Typography>
                                <Grid2 container spacing={2}>
                                    {sizes.map(s=>(
                                        <Grid2 size={6} key={s._id}>
                                            <Box sx={{display: "flex", flexDirection: "row", justifyContent: "flex-start", padding: "0% 20%"}} onClick={()=>{
                                                let p = {...product}
                                                //console.log(s.name)
                                                if(!p.sizes.filter(si=> si.name == s.name)[0]) p.sizes.push(s)
                                                else{
                                                    let sizes = []
                                                    for(let si of p.sizes){
                                                        if(si.name != s.name) sizes.push(si)
                                                    }
                                                    p.sizes = sizes
                                                }
                                                setProduct({...p})
                                            }}>
                                                <FormControlLabel control={<Checkbox checked={product.sizes.filter(si=> si.name == s.name)[0]} />} />
                                                <Box sx={{ padding: "1%" }}><Typography>{s.name}</Typography></Box>
                                            </Box>
                                        </Grid2>
                                    ))}
                                </Grid2>
                            </Card>
                        </Box>
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
                                            console.log(product.threadColors.length)
                                            for (let tc of product.threadColors) {
                                                console.log(tc.name)
                                                for (let ti of Object.keys(design.threadImages[tc.name] ? design.threadImages[tc.name] : {})) {
                                                    console.log(ti, tc.name)
                                                    for (let col of product.colors) {
                                                        //console.log(design.threadImages[tc.name][ti], col.name)
                                                        for (let bm of b.multiImages[ti].filter(m => m.color.toString() == col._id.toString() && m.imageGroup == "default")) {
                                                            console.log(bm.image)
                                                            imgs.push({ image: encodeURI(`https://imperial.pythiastechnologies.com/api/renderImages/${design.sku}-${b.code.replace(/-/g, "_")}-${bm.image.split("/")[bm.image.split("/").length - 1].split(".")[0]}-${col.name.replace(/\//g, "_")}-${ti}-${tc.name}.jpg}?width=400`), color: col, threadColor: tc, side: ti, blank: b, sku: `${design.printType}_${design.sku}_${col.sku}_${b.code.replace(/-/g, "_")}_${bm.image.split("/")[bm.image.split("/").length - 1].split(".")[0]}-${col.name.replace(/\//g, "_")}-${ti}-${tc.name}` })
                                                        }
                                                    }
                                                }
                                            }
                                        }else{
                                            for (let ti of Object.keys(design.images ? design.images : {})) {
                                                for (let col of product.colors) {
                                                    //console.log(design.threadImages[tc.name][ti], col.name)
                                                    for (let bm of b.multiImages[ti].filter(m => m.color.toString() == col._id.toString() && m.imageGroup == "default")) {
                                                        console.log(bm.image)
                                                        imgs.push({ image: encodeURI(`https://imperial.pythiastechnologies.com/api/renderImages/${design.sku}-${b.code.replace(/-/g, "_")}-${bm.image.split("/")[bm.image.split("/").length - 1].split(".")[0]}-${col.name.replace(/\//g, "_")}-${ti}.jpg}?width=400`), color: col, side: ti, blank: b, sku: `${design.printType}_${design.sku}_${col.sku}_${b.code.replace(/-/g, "_")}_${bm.image.split("/")[bm.image.split("/").length - 1].split(".")[0]}-${col.name.replace(/\//g, "_")}-${ti}` })
                                                    }
                                                }
                                            }
                                        }
                                    })
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
                                        console.log(product.threadColors.length)
                                        for (let tc of product.threadColors) {
                                            console.log(tc.name)
                                            for (let ti of Object.keys(design.threadImages[tc.name] ? design.threadImages[tc.name] : {})) {
                                                console.log(ti, tc.name)
                                                for (let col of product.colors) {
                                                    //console.log(design.threadImages[tc.name][ti], col.name)
                                                    for (let bm of b.multiImages[ti].filter(m => m.color.toString() == col._id.toString() && m.imageGroup == val.value).length > 0 ? b.multiImages[ti].filter(m => m.color.toString() == col._id.toString() && m.imageGroup == val.value) : b.multiImages[ti].filter(m => m.color.toString() == col._id.toString() && m.imageGroup == "default")) {
                                                        console.log(bm.image)
                                                        imgs.push({ image: encodeURI(`https://imperial.pythiastechnologies.com/api/renderImages/${design.sku}-${b.code.replace(/-/g, "_")}-${bm.image.split("/")[bm.image.split("/").length - 1].split(".")[0]}-${col.name.replace(/\//g, "_")}-${ti}-${tc.name}.jpg}?width=400`), color: col, threadColor: tc, side: ti, blank: b, sku: `${design.printType}_${design.sku}_${col.sku}_${b.code.replace(/-/g, "_")}_${bm.image.split("/")[bm.image.split("/").length - 1].split(".")[0]}-${col.name.replace(/\//g, "_")}-${ti}-${tc.name}` })
                                                    }
                                                }
                                            }
                                        }
                                    } else {
                                        for (let ti of Object.keys(design.images ? design.images : {})) {
                                            for (let col of product.colors) {
                                                //console.log(design.threadImages[tc.name][ti], col.name)
                                                for (let bm of b.multiImages[ti].filter(m => m.color.toString() == col._id.toString() && m.imageGroup == val.value).length > 0 ? b.multiImages[ti].filter(m => m.color.toString() == col._id.toString() && m.imageGroup == val.value) : b.multiImages[ti].filter(m => m.color.toString() == col._id.toString() && m.imageGroup == "default") ) {
                                                    console.log(bm.image)
                                                    imgs.push({ image: encodeURI(`https://imperial.pythiastechnologies.com/api/renderImages/${design.sku}-${b.code.replace(/-/g, "_")}-${bm.image.split("/")[bm.image.split("/").length - 1].split(".")[0]}-${col.name.replace(/\//g, "_")}-${ti}.jpg}?width=400`), color: col, side: ti, blank: b, sku: `${design.printType}_${design.sku}_${col.sku}_${b.code.replace(/-/g, "_")}_${bm.image.split("/")[bm.image.split("/").length - 1].split(".")[0]}-${col.name.replace(/\//g, "_")}-${ti}` })
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
                                    console.log(i)
                                    let p = { ...product }
                                    if(!p.productImages.filter(img => img.sku == i.sku)[0]) p.productImages.push(i)
                                    else{
                                        let imgs = [];
                                        for (let img of p.productImages) {
                                            if (img.sku != i.sku) imgs.push(img)
                                        }
                                        p.productImages = imgs
                                    }
                                    console.log(p.productImages)
                                    setProduct({ ...p })
                                }}>
                                    <img src={i.image} alt={`${i.blank.code} image`} width={300} height={300} style={{ width: "auto", height: "auto", maxHeight: "100%", maxWidth: "100%", }} />
                                    {product.productImages.filter(img => img.image == i.image)[0] && <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "flex-end", alignItems: "center", width: "100%", marginBottom: "1%", zIndex: 999, top: "-20%", position: "relative" }}>
                                        <Checkbox checked={true} />
                                    </Box>}
                                    {!product.productImages.filter(img => img.image == i.image)[0] && <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "flex-end", alignItems: "center", width: "100%", marginBottom: "1%", zIndex: 999, top: "-20%", position: "relative" }}>
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
                                    //console.log(product.colors, product.sizes, product.threadColors, product.defaultColor)
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
                            <CreateVariantImages product={product} design={design.threadColors.length > 0 ? design.threadImages : design.images} setProduct={setProduct} threadColors={design.threadColors.length > 0? true: false}/>
                        </Box>
                        <Grid2 container spacing={2} sx={{ padding: "2%" }}>
                            <Grid2 size={6}>
                                <Button fullWidth sx={{ margin: "1% 2%", background: "#645D5B", color: "#ffffff" }} onClick={() => { setStage("product_images") }}>Back</Button>
                            </Grid2>
                            <Grid2 size={6}>
                                <Button fullWidth sx={{ margin: "1% 2%", background: "#645D5B", color: "#ffffff" }} onClick={() => {
                                    //console.log(product.colors, product.sizes, product.threadColors, product.defaultColor)
                                    let p = { ...product }
                                    p.title = p.title ? p.title : `${design.name} - ${p.blanks.map(b => b.name).join(" and ")}`
                                    p.description = p.description ? p.description : `${design.description} - ${p.blanks.map(b => b.description).join(" ")}`
                                    setProduct({ ...p })
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
                                    console.log(p.brand)
                                    setProduct({ ...p })
                                }} />
                            </Grid2>
                            <Grid2 size={4}>
                                <CreatableSelect placeholder="Select Gender" options={genders.map(gender => ({ value: gender.name, label: gender.name }))} value={product.gender ? { value: product.gender.name, label: product.gender.name } : null} onChange={async(newValue) => {
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
                                <CreatableSelect placeholder="Select Season" options={seasons.map(season => ({ value: season.name, label: season.name }))} value={product.season ? { value: product.season.name, label: product.season.name } : null} onChange={async (newValue) => {
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
                                <Button fullWidth sx={{ margin: "1% 2%", background: "#645D5B", color: "#ffffff" }} onClick={() => {
                                   
                                    setStage("information")
                                }}>Next</Button>
                            </Grid2>
                        </Grid2>  
                    </Grid2>
                }
            </Box>
        </Modal>
    )
}
 const CreateVariantImages = ({product, setProduct, design, threadColors}) => {
    let imgs = {}
   // console.log(product, design)
    if(!threadColors){
        for(let side of Object.keys(design? design : {})){
            console.log(side, "side")
            for(let blank of product.blanks){
                for (let color of product.colors) {
                    for(let img of blank.multiImages[side].filter(i => i.color.toString() == color._id.toString() && i.imageGroup == "default")){
                    // console.log(img, "img")
                        //console.log(color, "color")
                        if (!imgs[blank.code]) imgs[blank.code] = {}
                    // console.log(imgs[blank.code])
                        if (!imgs[blank.code][color.name]) imgs[blank.code][color.name] = []
                        //console.log(imgs[blank.code][color.name])
                        let image = design[side].replace(/\.jpg$/, `-${color.name.replace(/\//g, "_")}.jpg`)
                        imgs[blank.code][color.name].push({image: encodeURI(`https://imperial.pythiastechnologies.com/api/renderImages/${product.design.sku}-${blank.code.replace(/-/g, "_")}-${img.image.split("/")[img.image.split("/").length - 1].split(".")[0]}-${color.name.replace(/\//g, "_")}-${side}.jpg?width=400`), color: color, side: side, blank: blank, sku: `${product.design.printType}_${product.design.sku}_${color.sku}_${blank.code.replace(/-/g, "_")}_${img.image.split("/")[img.image.split("/").length - 1].split(".")[0]}-${color.name.replace(/\//g, "_")}-${side}`})
                        
                    }
                }
            }
        }
    }else{
        for(let threadColor of Object.keys(design)){
            for(let side of Object.keys(design[threadColor])){
                console.log(side, "side")
                for(let blank of product.blanks){
                    for (let color of product.colors) {
                        for(let img of blank.multiImages[side].filter(i => i.color.toString() == color._id.toString() && i.imageGroup == "default")){
                            // console.log(img, "img")
                            //console.log(color, "color")
                            if (!imgs[blank.code]) imgs[blank.code] = {}
                            // console.log(imgs[blank.code])
                            if (!imgs[blank.code][threadColor]) imgs[blank.code][threadColor] = {}
                            if (!imgs[blank.code][threadColor][color.name]) imgs[blank.code][threadColor][color.name] = []
                            //console.log(imgs[blank.code][color.name])
                            let image = design[threadColor][side].replace(/\.jpg$/, `-${color.name.replace(/\//g, "_")}-${threadColor}.jpg`)
                            imgs[blank.code][threadColor][color.name].push({image: encodeURI(`https://imperial.pythiastechnologies.com/api/renderImages/${product.design.sku}-${blank.code.replace(/-/g, "_")}-${img.image.split("/")[img.image.split("/").length - 1].split(".")[0]}-${color.name.replace(/\//g, "_")}-${side}-${threadColor}.jpg?width=400`), color: color, side: side, blank: blank, sku: `${product.design.printType}_${product.design.sku}_${color.sku}_${blank.code.replace(/-/g, "_")}_${img.image.split("/")[img.image.split("/").length - 1].split(".")[0]}-${color.name.replace(/\//g, "_")}-${side}-${threadColor}`})
                            
                        }
                    }
                }
            }
        }
    }
    console.log(imgs)
    return (
        <>
            {!threadColors && Object.keys(imgs).length > 0 && Object.keys(imgs).map((b, i) => (
                <Box key={i} sx={{ margin: "2%", padding: "2%", border: "1px solid #000", borderRadius: "5px" }}>
                    <Typography variant="h6" sx={{ color: "#000", textAlign: "center", marginBottom: "1%" }}>{b}</Typography>
                    <Grid2 container spacing={2}>
                        {imgs[b] && Object.keys(imgs[b]).map((c, j) => (
                            <Grid2 key={j} size={6}>
                                <Typography variant="body1" sx={{ color: "#000", textAlign: "center", marginBottom: "1%" }}>{c}</Typography>
                                <Grid2 container spacing={2} sx={{"&:hover": { cursor: "pointer", opacity: .7 } }}>
                                    {imgs[b][c].map((img, k) => (
                                        <Grid2 key={k} size={4} onClick={() => {
                                            let p = { ...product }
                                            if (!p.variantImages[b]) p.variantImages[b] = {}
                                            p.variantImages[b][c] = img
                                            console.log(p.variantImages, "product varoiant images")
                                            setProduct({ ...p })
                                        }}>
                                            <img src={img.image} alt={img.sku} style={{ width: "100%", height: "auto" }} />
                                            {product.variantImages[b] && product.variantImages[b][c] && product.variantImages[b][c].image == img.image && <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "flex-end", alignItems: "center", width: "100%", marginBottom: "1%", zIndex: 999, top: "-23%", position: "relative" }}>
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
                                        <Grid2 container spacing={2} sx={{"&:hover": { cursor: "pointer", opacity: .7 } }}>
                                            {imgs[b][tc][c].map((img, l) => (
                                                <Grid2 key={l} size={4} onClick={() => {
                                                    let p = { ...product }
                                                    if (!p.variantImages[b]) p.variantImages[b] = {}
                                                    if (!p.variantImages[b][tc]) p.variantImages[b][tc] = {}
                                                    p.variantImages[b][tc][c] = img
                                                    console.log(p.variantImages, "product varoiant images")
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
                    value={des.threadColors?.map(m => { return { value: colors.filter(c => (c._id ? c._id.toString() : c) == m.toString())[0]?._id, label: colors.filter(c => (c._id ? c._id.toString() : c) == m.toString())[0]?.name } })}
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
                        options={printLocations.map(p => { return { value: p.name, label: p.name } })}
                        value={{ value: location, label: location }}
                        onChange={(vals) => {
                            setLocation(vals.value)
                            setReload(false)
                        }}
                    />
                        <CreatableSelect
                            options={[...des.threadColors.map(p => { return { value: colors.filter(c => c._id.toString() == p)[0].name, label: colors.filter(c => c._id.toString() == p)[0].name } }), { value: "default", label: "Default" }]}
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
            {design.threadColors.length > 0 && design.threadColors.map(tr=>{
                return (blank?.colors.map(c=>{
                    return (blank?.blank.sizes.map(s=>{
                        return <Typography key={`${design.printType}_${design.sku}_${c.sku}_${s.name}_${blank.blank.code}_${tr.name}`}>{`${design.printType}_${design.sku}_${c.sku}_${s.name}_${blank.blank.code}_${colors.filter(c=> c._id.toString() == tr.toString())[0]?.name}`}</Typography>
                    }))
                }))
            })}
            {design.threadColors.length == 0 && blank?.colors?.map(c=>{
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
"use client";
import {Box, Grid2, TextField, Accordion, Modal, AccordionSummary, AccordionDetails, Button, Typography, Card, Container, Divider} from "@mui/material";
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
import { set } from "mongoose";
export function Main({design, bls, brands, mPs, pI, licenses, colors, printLocations}){
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
    const genders = ["Girls", "Boys", "Mens", "Womens"]
    useEffect(()=>{
        if(!reload) setReload(!reload)
    }, [reload])
    useEffect(()=>{
        console.log(blanks[0].colors)
        if(blanks){
            let d = {...des}
            if(!d.blanks)d.blanks = [];
            if(!d.brands) d.brands = [];
            if(d.images == undefined) d.images = {};
            console.log(blanks[0].colors[0])
            d.blanks= d.blanks.map(bl=>{
                let blank = blanks.filter(b=> b._id.toString() == (bl.blank?._id? bl.blank?._id.toString(): bl.blank?.toString()))[0]                
                bl.colors = bl.colors.map(c=> {return blank.colors.filter(bc=> bc._id.toString() == (c._id? c._id.toString(): c.toString()))[0]})
                console.log(bl.colors.filter(c=> (c?._id?c._id.toString(): c?.toString()) == (bl.defaultColor?._id? bl.defaultColor._id.toString(): bl.defaultColor?.toString()))[0])
                bl.defaultColor = bl.colors.filter(c=> (c?._id?c?._id.toString(): c?.toString()) == (bl.defaultColor?._id? bl.defaultColor._id.toString(): bl.defaultColor?.toString()))[0]
                console.log(bl.colors, bl.defaultColor, "default")
                bl.colors = bl.colors.filter(c=> c != undefined)
                bl.blank = blank
                return bl
            })
            d.blanks.filter(b=> b.blank != undefined)
            d.brands = d.brands.map(br=>{
                let brand = brands.filter(b=> b._id.toString() == (br._id? br._id.toString(): br.toString()))[0]
                return brand
            })
            console.log(d.brands, d.blanks, d.marketplaces)
            d.blanks = d.blanks.filter(b=> b.blank != undefined)
            setDesign({...d})
            let imGr = []
            blanks.map(b=>{
              if(b.multiImages){
                Object.keys(b.multiImages).map(i=>{
                    b.multiImages[i].map(im=>{
                      //console.log(im, "im")
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
                console.log(imageBlank, "useEffect")
                console.log(b.blank.code.toString(), imageBlank.value.toString(), b.blank.code.toString() == imageBlank.value.toString())
                console.log(imageColor)
                for(let side of Object.keys(design.images)){
                    Object.keys(b && b.blank && b.blank.multiImages? b.blank.multiImages: {}).filter(s=> s == side && design.images[side]).map((i,j)=>{
                        //console.log(i, b.blank.multiImages[i].filter(im=> im.imageGroup.includes(des.imageGroup) && b.colors[0]._id.toString() == im.color.toString())[0], "imagegroups")
                        console.log(des.imageGroup)
                        console.log(imageBlank)
                        console.log(imageColor)
                        let color = b.colors.filter(c=> c.name == imageColor.value)[0]
                        console.log(color, "color")
                        let foundImages = false
                        let useImages = b && b.blank.multiImages[i].filter(im=> im.imageGroup.includes(des.imageGroup) && color?._id.toString() == im.color.toString())
                        useImages.map(im=>{
                            let image = im
                            image.side = i
                            image.style=b.blank.code
                            if(image.side == "modelFront") image.side = "front"
                            if(image.side == "modelBack") image.side = "back"
                            console.log(image)
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
                            //console.log(i, b.blank.multiImages[i].filter(im=> im.imageGroup.includes(des.imageGroup) && b.colors[0]._id.toString() == im.color.toString())[0], "imagegroups")
                            console.log(des.imageGroup);
                            console.log(imageBlank);
                            console.log(imageColor);
                            let color = b.colors.filter(
                              (c) => c.name == imageColor.value
                            )[0];
                            console.log(color, "color");
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
            console.log(result.data, result.data.description);
            let { tags, description } = await JSON.parse(result.data);
            console.log(d, result.data['"description"'])
            d.tags = tags
            d.description = description
            console.log(d.tags, "description", description)
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
        console.log("updateImage")
        console.log(des.threadColors)
        let d = {...des}
        console.log(d.threadColors.length)
        if(threadColor){
            console.log(threadColor)
            if(!d.threadImages) d.threadImages = {}
            if(!d.threadImages[threadColor]) d.threadImages[threadColor] = {}
            d.threadImages[threadColor][location] = url
        }else{
            console.log(d.images, url, location)
            if(!d.images) d.images = {}
            console.log(d.images, url, location)
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
            console.log(d.images, url, location)
            console.log(d.images, url, location)
            newImages[location] = url
            d.images = newImages
        }
        setDesign({...d})
        updateDesign({...d})
    }
    const relocateDST = (url,location, oldLocation, threadColor,)=>{
        let d = {...des}
        let newFiles = {}
        newFiles[location] = url
        d.embroideryFiles = newFiles
        setDesign({...d})
        updateDesign({...d})
    }
    const updateEmbroidery = async ({url,location})=>{
        let d = {...des}
        if(!d.embroideryFiles)d.embroideryFiles = {};
        console.log(d, url, location)
        d.embroideryFiles[location] = url
        setDesign({...d})
        updateDesign({...d})
    }
    const tagUpdate = (val)=>{
        console.log(val)
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
            console.log(b.name)
            if(b.name == "Urban Threads Co."){
                d = await updateMarketPlacesBrand({brand: b, marketplaces: ["Shopify", "Shein", "Temu"], d})
                console.log(d.b2m)
            }else if(b.name == "Simply Sage Market"){
                d = await updateMarketPlacesBrand({brand: b, marketplaces: ["Shopify", "target", "Kohl's", "Walmart", "Amazon"], d})
                console.log(d.b2m)
            }else if(b.name == "The Juniper Shop"){
                d = await updateMarketPlacesBrand({brand: b, marketplaces: ["Shopify", "target", "Kohl's"], d})
                console.log(d.b2m)
            }else if(b.name == "Juniper Shop Wholesale" || b.name == "Uplifting Threads Co Wholesale" || b.name == "Olive And Ivory" || b.name == "Olive and Ivory Wholesale" || b.name == "Olive And Ivory Wholesale"){
                d = await updateMarketPlacesBrand({brand: b, marketplaces: ["Shopify", "Faire"], d})
                console.log(d.b2m)
            }
        }
        setDesign({...d})
        updateDesign({...d})
    }
    const updateMarketPlacesBrand= async ({brand, marketplaces, d})=>{
        console.log(brand, marketplaces)
        let mps = await marketplaces.map(async m=>{
            let mp = marketPlaces.filter(lp=> m == lp.name)[0]
            console.log(mp)
            if(!mp) {
                let res = await axios.post("/api/admin/marketplaces", {name: m})
                mp = res.data.marketplace
                setMarketPlaces(res.data.marketPlaces)
            }
            return mp
        })
        mps = await Promise.all(mps)
        d.marketPlaces = mps;
        console.log(d.marketPlaces)
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
        console.log(b2m, "b2m", brand.name)
        d.b2m = b2ms
        return {...d}
    }
    const updateMarketPlaces= async ({brand, marketplaces})=>{
        console.log(brand, marketplaces)
        let mps = await marketplaces.map(async m=>{
            let mp = marketPlaces.filter(lp=> m == lp.name)[0]
            console.log(mp)
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
        console.log(d.marketPlaces)
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
        console.log(b2m, "b2m", brand.name)
        d.b2m = b2ms
        setDesign({...d})
        updateDesign({...d})
    }
    const updateBlanks = async ({values})=>{
        let d = {...des}
        let codes = values.map(b=>{return b})
        //console.log(values, "values", codes, marketplace, "marketplace")
        values.map(bl=>{
            if(!d.blanks) d.blanks = [];
            let blank = d.blanks?.filter(bla=> bla.blank.code == bl)[0]
            console.log(blank, "not added")
            if(!blank){
               // console.log(blanks, bl.value)
                let blank = blanks.filter(b=> b.code == bl)[0]
                console.log(blank, "added")
                if(blank){
                    d.blanks.push({
                        blank
                    })
                }
            }
        })
        //console.log(codes, d.blanks)
        d.blanks = d.blanks.filter(b=> codes.includes(b.blank.code))
        setDesign({...d})
        updateDesign({...d})
    }
    const updateColors = ({blank, colors}) =>{
        let d = {...des}
        console.log(blank)
        let b = d.blanks.filter(bl=> bl.blank._id.toString() == blank.blank._id.toString())[0]
        b.colors = b.blank.colors.filter(c=> colors.includes(c.name))
        setDesign({...d})
        updateDesign({...d})
    }
    const updateDefaultColor = ({blank, color}) =>{
        let d = {...des}
        console.log(blank)
        let b = d.blanks.filter(bl=> bl.blank._id.toString() == blank.blank._id.toString())[0]
        console.log(color)
        b.defaultColor = b.blank.colors.filter(c=> color.value == c.name)[0]
        setDesign({...d})
        updateDesign({...d})
    }
    const setDefaultImages = ({id, side})=>{
        let d = {...des}
        console.log(id, "id")
        let b = d.blanks.filter(bl=> bl.blank.code == imageBlank.value)[0]
        console.log(b)
        if(b.defaultImages == undefined) b.defaultImages = []
        let dI = b.defaultImages.filter(df=> df.color == b.colors.filter(c=> c.name == imageColor.value)[0]?._id)[0]
        let others = b.defaultImages.filter(df=> df.color != b.colors.filter(c=> c.name == imageColor.value)[0]?._id)
        console.log(b.defaultImages, others, "others")
        if(!dI) dI = {id, side, color: b.colors.filter(c=> c.name == imageColor.value)[0]?._id}
        else {
            dI.id = id
            dI.side = side,
            dI.color = b.colors.filter(c=> c.name == imageColor.value)[0]?._id
        }
        others.push(dI)
        b.defaultImages = others
        console.log(b.defaultImages)
        setDesign({...d})
        updateDesign({...d})
    }
    const deleteDesignImage = ({location, threadColor})=>{
        let d = {...des}
        if(threadColor){
            d.threadImages[threadColor][location] = null;
        }else{
            des.images[location] = null;
        }
        setDesign({...d})
        updateDesign({...d})
    }
    const deleteEmbroideryFile = ({location})=>{
        let d = {...des}
        des.embroideryFiles[location] = null;
        setDesign({...d})
        updateDesign({...d})
    }
    return (
        <Container maxWidth="lg">
            {/* <Box sx={{display: "flex", flexDirection: "row", justifyContent: "space-between"}}>
                <Button sx={{ margin: "1% 2%", background: "#645D5B", color: "#ffffff"}} onClick={()=>{
                                let d = {...des};
                                d.published = !d.published;
                                setDesign({...d});
                                updateDesign({...d})
                                alert(`Design is ${d.published? "published": "unpublished"} and will be ${d.published? "uploaded to all": "removed from all"} market places shortly`)
                }}>{des.published? "Unpublish": "Publish"}</Button>
                {!des.sendToMarketplaces && <Button sx={{ margin: "1% 2%", background: "#645D5B", color: "#ffffff"}} onClick={()=>{
                                let d = {...des};
                                d.sendToMarketplaces = true;
                                setDesign({...d});
                                updateDesign({...d})
                                alert(`Design will resend to market places next time files are made`)
                }}>Resend To Market Places</Button>}
                <Button sx={{ margin: "1% 2%", background: "#780606", color: "#ffffff"}} onClick={async ()=>{
                    let res = await axios.delete(`/api/admin/designs?design=${des._id}`)
                    if(res.data.error) alert(res.data.msg)
                    else {
                        router.push("/admin/designs")
                    }
                }}>Delete</Button>
            </Box> */}
            <Card sx={{margin: "1% 0%"}}>
                <Box sx={{display: "flex", flexDirection:"row", overflowX: "auto"}}>
                    {imageLocations.map((i, j) => (
                        <>
                            {des.images && des.images[i] &&
                                <Box key={j} sx={{width: "400px", minWidth: "400px", maxWidth: "400px", margin: "0% 2%"}}>
                                    <Box sx={{ position: "relative", zIndex: 999, left: { sm: "80%", md: "90%" }, bottom: -35, padding: "2%", cursor: "pointer", "&:hover": { opacity: .5 } }} onClick={() => { deleteDesignImage({ location: i }) }}>
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
                                            <Box sx={{ position: "relative", zIndex: 999, left: { sm: "80%", md: "90%" }, bottom: -35, padding: "2%", cursor: "pointer", "&:hover": { opacity: .5 } }} onClick={() => { deleteDesignImage({ location: i, threadColor: colors.filter(c => (c._id ? c._id.toString() : c.toString()) == tc.toString())[0].name }) }}>
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
                    <Button fullWidth sx={{ margin: "1% 2%", background: "#645D5B", color: "#ffffff" }}>Add DSTs</Button>
                </Grid2>
            </Grid2>
            {/*<Accordion >
                <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls="panel1-content"
                    id="panel1-header"
                    sx={{padding: "2%"}}
                    >
                    <Typography component="span">Design Images</Typography>
                </AccordionSummary>
                    <AccordionDetails sx={{padding: "5%",}}>
                    <Grid2 container spacing={1} sx={{marginBottom: "5%"}}>
                        <Grid2 size={{xs: 6, sm: 3, md: 2}}>
                            <Box>
                                {reload && <Uploader location={location} afterFunction={updateImage} />}
                                <CreatableSelect
                                    options={printLocations.map(p => { return { value: p.name, label: p.name } })}
                                    value={{ value: location, label: location }}
                                    onChange={(vals) => {
                                        setLocation(vals.value)
                                        setReload(false)
                                    }}
                                />
                            </Box>
                        </Grid2>
                        {imageLocations.map((i, j)=>(
                            <>
                                {des.images && des.images[i] && <Grid2 size={{xs: 6, sm: 3, md: 3}} key={j}>

                                    <Box sx={{ padding: "3%", background: "#e2e2e2", height: { sm: "250px" }, minHeight: "250px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                        <img src={des.images && des.images[i] ? `${des.images[i]?.replace("images1.pythiastechnologies.com", "images2.pythiastechnologies.com/origin")}?width=400` : "/missingImage.jpg"} width={400} height={400} alt={`${des.name} ${des.sku} design`} style={{ width: "100%", height: "auto", maxHeight: "250px", background: "#e2e2e2" }} />
                                    </Box>
                                    <p style={{textAlign: "center"}}>{i} Image</p>
                                    <CreatableSelect
                                        options={printLocations.map(p=>{return {value: p.name, label: p.name}})}
                                        value={{value: i, label:i}}
                                        onChange={(vals)=>{
                                            relocateImage(des.images[i], vals.value, i)
                                            setReload(false)
                                        }}
                                    />
                                    <Button fullWidth onClick={()=>{deleteDesignImage({location: i})}}>Delete Image</Button>
                                </Grid2>}
                            </>
                        ))}
                    </Grid2>
                    <Box style={{marginBottom: "5%"}}>
                        {des.threadColors && des.threadColors.length > 0 && <Box>
                            {des.threadColors.map(tc=>(
                                <Box key={tc} style={{marginBottom: "5%"}}>
                                    <p>{colors.filter(c=> (c._id? c._id.toString(): c) == tc.toString())[0].name}</p>
                                    <Grid2 container spacing={1}>
                                        <Grid2 size={{xs: 6, sm: 3, md: 2}}>
                                            {reload && <Uploader location={location} afterFunction={updateImage} threadColor={colors.filter(c=> (c._id? c._id.toString(): c) == tc.toString())[0].name} />}
                                            <CreatableSelect
                                                options={[]}
                                                value={{value: location, label:location}}
                                                onChange={(vals)=>{
                                                    setLocation(vals.value)
                                                    setReload(false)
                                                }}
                                            />
                                        </Grid2>
                                        {imageLocations.map((i, j)=>(
                                            <>
                                                {des.threadImages[colors.filter(c=> (c._id? c._id.toString(): c.toString()) == tc.toString())[0].name] && des.threadImages[colors.filter(c=> (c._id? c._id.toString(): c.toString()) == tc.toString())[0].name][i] && <Grid2 size={{xs: 6, sm: 3, md: 3}} key={j}>
                                                    <Box sx={{ padding: "3%", background: "#e2e2e2", height: { sm: "100px" }, minHeight: "100px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                        <Box sx={{background: "#e2e2e2", display: "flex", flexDirection: "row", justifyContent: "center" }}>
                                                            <img src={`${des.threadImages[colors.filter(c => (c._id ? c._id.toString() : c.toString()) == tc.toString())[0].name][i].replace("images1.pythiastechnologies.com", "images2.pythiastechnologies.com/origin")}?width=400`} alt={`${i} image`} width={400} height={400} style={{width: "100%", height: "auto"}}/>
                                                        </Box>
                                                    </Box>
                                                    <p style={{textAlign: "center"}}>{i} Image</p>
                                                    <CreatableSelect
                                                        options={printLocations.map(p=>{return {value: p.name, label: p.name}})}
                                                        value={{value: i, label:i}}
                                                        onChange={(vals)=>{
                                                            relocateImage(des.images[i], vals.value, i, colors.filter(c=> (c._id? c._id.toString(): c.toString()) == tc.toString())[0].name)
                                                            setReload(false)
                                                        }}
                                                    />
                                                    <Button fullWidth onClick={()=>{deleteDesignImage({location: i})}}>Delete Image</Button>
                                                </Grid2>}
                                            </>
                                        ))}
                                    </Grid2>
                                </Box>
                            ))}
                        </Box>}
                    </Box>
                </AccordionDetails>
            </Accordion>
            <Accordion >
                <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls="panel1-content"
                    id="panel1-header"
                    sx={{padding: "2%"}}
                    >
                    <Typography component="span">Embroidery Files</Typography>
                </AccordionSummary>
                <AccordionDetails sx={{padding: "5%"}}>
                    <Grid2 container spacing={1}>
                        <Grid2 size={{xs: 6, sm: 3, md: 2}}>
                            {reload && <Uploader location={location} afterFunction={updateEmbroidery}  />}
                            <CreatableSelect
                                options={printLocations.map(p=>{return {value: p.name, label: p.name}})}
                                value={{value: location, label:location}}
                                onChange={(vals)=>{
                                    setLocation(vals.value)
                                    setReload(false)
                                }}
                            />
                        </Grid2>
                        {imageLocations.map((i, j)=>(
                            <>
                                {des.embroideryFiles && des.embroideryFiles[i] && <Grid2 size={{xs: 6, sm: 3, md: 2}} key={j}>
                                    <Image src={"/embplaceholder.jpg"} alt={`${i} image`} width={400} height={400} style={{width: "100%", height: "auto"}}/>
                                    <p style={{textAlign: "center"}}>{i} File</p>
                                    <CreatableSelect
                                        options={printLocations.map(p=>{return {value: p.name, label: p.name}})}
                                        value={{value: i, label:i}}
                                        onChange={(vals)=>{
                                            relocateDST(des.embroideryFiles[i], vals.value, i)
                                            setReload(false)
                                        }}
                                    />
                                    <Button fullWidth onClick={()=>{deleteEmbroideryFile({location: i})}}>Delete Image</Button>
                                </Grid2>}
                            </>

                        ))}
                    </Grid2>
                </AccordionDetails>
            </Accordion> */}
            <Card sx={{width: "100%", minHeight: "80vh", padding: "50% 2%", paddingTop: "3%" }}>
                <Grid2 container spacing={2}>
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
                    <Grid2 size={12}>
                        <Grid2 container spacing={2}>
                            <Grid2 size={6}>
                                <CreatableSelect
                                    placeholder="Print Type"
                                    options={[{label: "Direct To Transfer", value: "DTF"}, {label: "Vinyl", value: "VIN"}, {label: "Embroidery", value: "EMB"}, {label: "Screen Print", value: "SCN"}]}
                                    value={{label: des.printType == "DTF"? "Direct To Transfer": des.printType == "VIN"? "Vinyl": des.printType == "EMB"? "Embroidery": des.printType == "SCN"? "Screen Print": "Direct To Transfer", value: des.printType? des.printType: "DTF"  }}
                                    onChange={(vals)=>{
                                        console.log(vals)
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
                                        console.log(vals)
                                        let d = {...des}
                                        d.licenseHolder = vals.value
                                        setDesign({...d})
                                        updateDesign({...d})
                                    }}
                                />
                            </Grid2>
                            <Grid2 size={6}>
                                {console.log(des.gender, "gender")}
                                <CreatableSelect
                                    placeholder="Gender"
                                    options={[{label: "Gender", value: null}, ...genders.map(l=> {return {label: l, value: l}})]}
                                    value={des.gender? {label: des.gender, value: des.gender}: null}
                                    onChange={(vals)=>{
                                        console.log(vals)
                                        let d = {...des}
                                        d.gender = vals.value
                                        setDesign({...d})
                                        updateDesign({...d})
                                    }}
                                />
                            </Grid2>
                            <Grid2 size={6}>
                                {console.log(des.gender, "gender")}
                                <CreatableSelect
                                    placeholder="Season"
                                    options={[]}
                                    value={des.season? {label: des.season, value: des.season}: null}
                                    onChange={(vals)=>{
                                        console.log(vals)
                                        let d = {...des}
                                        d.season = vals.value
                                        setDesign({...d})
                                        updateDesign({...d})
                                    }}
                                />
                            </Grid2>
                        </Grid2>
                    </Grid2>
                    <Grid2 size={12}><hr/></Grid2>
                    <Grid2 size={{xs: 12, sm: 12}} >
                        <Typography>Brands</Typography>
                        {!loading &&
                        <CreatableSelect
                            placeholder="Brands"
                            options={bran.map(b=>{if(b.name)return {value: b.name, label: b.name}})}
                            isMulti
                            value={des.brands?.map(b=>{
                                return {value: b.name, label: b.name}
                            })}
                            onChange={(vals)=>{
                                updateBrands(vals.map(v=>{return v.value}))
                            }}
                        />
                        }
                    </Grid2>
                    <Grid2 size={{xs: 12, sm: 12}} >
                        {!loading && des.brands?.map(b=>(
                            <Accordion key={b._id}>
                            <AccordionSummary
                                expandIcon={<ExpandMoreIcon />}
                                aria-controls="panel1-content"
                                id="panel1-header"
                                sx={{padding: "2%"}}
                                >
                                <Typography component="span">{b.name}</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <CreatableSelect
                                    placeholder="Marketplaces"
                                    options={marketPlaces.map(m=>{return {value: m.name, label: m.name}})}
                                    value={des.b2m?.filter(b2m=> b2m.brand == b.name)[0]?.marketPlaces.map(m=>{return {value: m, label: m}})}
                                    onChange={(vals)=>{
                                        let values = vals.map(v=>{return v.value})
                                        console.log(values)
                                    updateMarketPlaces({brand: b, marketplaces:values})
                                    }}
                                isMulti
                            />
                            </AccordionDetails>
                        </Accordion>
                        ))}
                    </Grid2>
                    <Grid2 size={12}><hr/></Grid2>
                    <Grid2 size={{xs: 12, sm: 12}}>
                    {!loading && <><Typography>Blanks</Typography>
                        <CreatableSelect
                            placeholder="Blanks"
                            options={blanks.map(m=>{return {value: m.code, label: m.code}})}
                            value={des.blanks?.map(bl=> {return {value: bl.blank?.code, label: bl.blank?.code}})}
                            onChange={(vals)=>{
                                let values = vals.map(v=>{return v.value})
                                console.log(values)
                                updateBlanks({values})
                            }}
                            isMulti
                        />
                        </>
                    }
                    </Grid2>
                    <Grid2 size={{xs: 12, sm: 12}} >
                        {!loading && des.blanks?.map(b=>(
                            <Accordion key={b.blank._id}>
                            <AccordionSummary
                                expandIcon={<ExpandMoreIcon />}
                                aria-controls="panel1-content"
                                id="panel1-header"
                                sx={{padding: "2%"}}
                                >
                                <Typography component="span">{b.blank.name}</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <CreatableSelect
                                    placeholder="Colors"
                                    options={b.blank.colors?.map(m=>{return {value: m.name, label: m.name}})}
                                    value={b.colors?.map(m=>{return {value: m?.name, label: m?.name}})}
                                    onChange={(vals)=>{
                                        let values = vals.map(v=>{return v.value})
                                        console.log(values)
                                        updateColors({blank: b, colors:values})
                                    }}
                                isMulti
                            />
                            <Box sx={{margin: ".5% 0%"}}>
                                    {console.log(b.defaultColor?.name, b.blank.code)}
                                    <CreatableSelect
                                        placeholder="Default Color"
                                        options={b.colors?.map(m=>{return {value: m.name, label: m.name}})}
                                        value={b.defaultColor? {value: b.defaultColor?.name, label: b.defaultColor.name}: null}
                                        onChange={(vals)=>{
                                            updateDefaultColor({blank:b, color:vals})
                                        }}
                                    />
                                </Box>
                                <Button onClick={()=>{setUpcBlank(b); setUpcModal(true)}}>See Sku's</Button>
                                <Button onClick={() => {
                                    let colors = b.blank.colors.map(c => c.name);
                                    updateColors({ blank: b, colors: colors })
                                }}>Add All Colors</Button>
                            </AccordionDetails>
                        </Accordion>
                        ))}
                    </Grid2>
                    <Grid2 size={{xs: 3, sm: 3}} >
                        <CreatableSelect
                            placeholder="Image Group"
                            options={imageGroups.map(ig=>{return {value: ig, label: ig}})}
                            value={{value: des.imageGroup, label: des.imageGroup}}
                            onChange={(vals)=>{
                                console.log(vals)
                                let d = {...des}
                                d.imageGroup = vals.value
                                let images = []
                                d.imageGroup && d.blanks.map((b, j)=>{
                                    if(b.blank.multiImages)Object.keys(b.blank.multiImages).map((i,j)=>{
                                    //console.log(i, b.blank.multiImages[i].filter(im=> im.imageGroup.includes(d.imageGroup) && b.colors[0]._id.toString() == im.color.toString())[0], "imagegroups")
                                    let foundImages = false
                                        if(b.blank.multiImages[i].filter(im=> im.imageGroup.includes(d.imageGroup) && b.colors[0]._id.toString() == im.color.toString())[0]){
                                            let image = b.blank.multiImages[i].filter(im=> im.imageGroup.includes(d.imageGroup) && b.colors[0]._id.toString() == im.color.toString())[0]
                                            image.side = i
                                            if(image.side == "modelFront") image.side = "front"
                                            if(image.side == "modelBack") image.side = "back"
                                            images.push(image)
                                            foundImages = true
                                        }
                                        if(!foundImages ){
                                            if(b.blank.multiImages[i].filter(im=> im.imageGroup.includes("default") && b.colors[0]._id.toString() == im.color.toString())[0]){
                                                let image = b.blank.multiImages[i].filter(im=> im.imageGroup.includes("default") && b.colors[0]._id.toString() == im.color.toString())[0]
                                                image.side = i
                                                if(image.side == "modelFront") image.side = "front"
                                                if(image.side == "modelBack") image.side = "back"
                                                images.push(image)
                                                foundImages = true
                                            }
                                        }
                                    })
                                })
                                setImageGroupImages([])
                                setDesign({...d})
                                updateDesign({...d})
                            }}
                        />
                    </Grid2>
                    <Grid2 size={{xs: 3, sm: 3}} >
                        <CreatableSelect
                            placeholder="Blank"
                            options={[ ...des.blanks.map(b=>{ return {label: b.blank.name, value: b.blank.code}})]}
                            value={imageBlank? imageBlank: {label: "Blank", value: null}}
                            onChange={(val)=>{
                                setImageBlank(val)
                                setImageColor({})
                            }}
                        />
                    </Grid2>
                    <Grid2 size={{xs: 3, sm: 3}} >
                            {console.log(des.blanks, imageBlank.value)}
                            {console.log(des.blanks.filter(b=>b.blank.code== imageBlank.value))}
                            {imageBlank  &&  <CreatableSelect
                            placeholder="Color"
                            options={des.blanks.filter(b=>b.blank.code== imageBlank.value)[0]?.colors.map(c=>{ return {label: c.name, value: c.name}})}
                            value={imageColor? imageColor: {label: "Color", value: null}}
                            onChange={(val)=>{
                                setImageGroupImages([])
                                setImageColor(val)
                            }}
                        />}
                    </Grid2>
                {des.threadColors && des.threadColors.length > 0 &&  <Grid2 size={{xs: 3, sm: 3}} >
                            {console.log(des.blanks, imageBlank.value)}
                            {console.log(des.blanks.filter(b=>b.blank.code== imageBlank.value))}
                            {imageBlank  &&  <CreatableSelect
                            placeholder="Thread Color"
                            options={des.threadColors.map(c=> {return colors.filter(cl=> cl._id.toString() == c.toString())[0]})?.map(c=>{ return {label: c.name, value: c.name}})}
                            value={threadColor? {label: threadColor, value: threadColor}: {label: "Thread Color", value: null}}
                            onChange={(val)=>{
                                setImageGroupImages([])
                                setThreadColor(val.value)
                            }}
                        />}
                    </Grid2>}
                    <Grid2 size={12}>
                        <Grid2 container spacing={2}>
                            {imageGroupImages.map((i,j)=>(
                                <Grid2 size={{xs: 6, md: 4}} key={j}>
                                    <ProductImageOverlay
                                        imageGroup={des.imageGroup}
                                        box={
                                        i.box? i.box[0]: {}
                                        }
                                        id={i._id}
                                        style={i.style}
                                        colorName={imageColor}
                                        setDefaultImages={setDefaultImages}
                                        styleImage={i.image}
                                        side={i.side}
                                        dI={des.blanks.filter(b=> b.blank.code == imageBlank.value)[0].defaultImages?.filter(dI=> dI.color == i.color && dI.side == i.side)[0]?.id}
                                        designImage={threadColor? des.threadImages? des.threadImages[threadColor][i.side]? des.threadImages[threadColor][i.side]: null : null :des.images && des.images[i.side == "modalFront"? "front": i.side == "modalBack"? "back": i.side]? des.images[i.side == "modalFront"? "front": i.side == "modalBack"? "back": i.side]: null }
                                    />
                                </Grid2>
                            ))}
                        </Grid2>
                    </Grid2>
                </Grid2>
            </Card>
            <ModalUpc open={upcModal} setOpen={setUpcModal} blank={upcBlank} setBlank={setUpcBlank} design={des} colors={colors} />
            <AltImageModal open={open} setOpen={setOpen} blank={blankForAlt} design={des} setDesign={setDesign} updateDesign={updateDesign}  />
            <AddImageModal open={addImageModal} setOpen={setAddImageModal} des={des} setDesign={setDesign} updateDesign={updateDesign} printLocations={printLocations} reload={reload} setReload={setReload} colors={colors} loading={loading} setLoading={setLoading}/>
            {loading && <LoaderOverlay/>}
        </Container>
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
        console.log(loading, "loading")
        console.log("updateImage")
        console.log(des.threadColors)
        let d = { ...des }
        console.log(d.threadColors.length)
        if (threadColor) {
            console.log(threadColor)
            if (!d.threadImages) d.threadImages = {}
            if (!d.threadImages[threadColor]) d.threadImages[threadColor] = {}
            d.threadImages[threadColor][location] = url
        } else {
            console.log(d.images, url, location)
            if (!d.images) d.images = {}
            console.log(d.images, url, location)
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
                            //console.log(colors.filter(c=> (c._id? c._id.toString(): c) == m.toString())[0]?.name, "color name")
                            //console.log(d.threadImages[colors.filter(c=> (c._id? c._id.toString(): c) == m.toString())[0]?.name])
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
                {loading && <LoaderOverlay />}
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
                console.log(tr)
                return (blank?.colors.map(c=>{
                    return (blank?.blank.sizes.map(s=>{
                        return <Typography key={`${design.printType}_${design.sku}_${c.sku}_${s.name}_${blank.blank.code}_${tr.name}`}>{`${design.printType}_${design.sku}_${c.sku}_${s.name}_${blank.blank.code}_${colors.filter(c=> c._id.toString() == tr.toString())[0]?.name}`}</Typography>
                    }))
                }))
            })}
            {design.threadColors.length == 0 && blank?.colors?.map(c=>{
                return blank.blank?.sizes?.map(s=>{
                    console.log(`${design.printType}_${design.sku}_${c.sku}_${s.name}_${blank.blank.code}`)
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
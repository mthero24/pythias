"use client";
import {Box, Grid2, TextField, Accordion, Modal, AccordionSummary, AccordionDetails, Button, Typography, Card} from "@mui/material";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import axios from "axios";
import {useState, useEffect} from "react";
import { Uploader } from "@/components/premier/uploader";
import { theme, themeDark } from "@/components/UI/Theme";
import Theme from "@/components/Theme.json"
import CreatableSelect from "react-select/creatable";
import ProductImageOverlay from "@/components/ProductImageOverlay";
import { useRouter } from "next/navigation";
import { AltImageModal } from "./AltImagesModal";
export function Main({design, bls, brands, mPs, pI, licenses}){
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
    const [upcBlank, setUpcBlank] = useState(null)
    const [upcModal, setUpcModal] = useState(false)
    const [open, setOpen] = useState(false)
    const [blankForAlt, setBlankForAlt] = useState(null)
    const genders = ["Girls", "Boys", "Mens", "Womens"]
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
                console.log(bl.colors.filter(c=> c._id?.toString() == bl.defaultColor?.toString())[0])
                bl.defaultColor = bl.colors.filter(c=> (c._id?c._id.toString(): c.toString()) == (bl.defaultColor?._id? bl.defaultColor._id.toString(): bl.defaultColor?.toString()))[0]
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
                Object.keys(b && b.blank && b.blank.multiImages? b.blank.multiImages: {}).map((i,j)=>{
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
                    // if(!foundImages ){
                    //     if(b.blank.multiImages[i].filter(im=> im.imageGroup.includes("default") &&color?._id.toString() == im.color.toString())[0]){
                    //         let image = b.blank.multiImages[i].filter(im=> im.imageGroup.includes("default") && color?._id.toString() == im.color.toString())[0]
                    //         image.side = i
                    //         if(image.side == "modelFront") image.side = "front"
                    //         if(image.side == "modelBack") image.side = "back"
                    //         images.push(image)
                    //         foundImages = true
                    //     }
                    // }
                })
                if(images.length == 0){
                    Object.keys(b && b.blank && b.blank.multiImages? b.blank.multiImages: {}).map((i,j)=>{
                        //console.log(i, b.blank.multiImages[i].filter(im=> im.imageGroup.includes(des.imageGroup) && b.colors[0]._id.toString() == im.color.toString())[0], "imagegroups")
                        console.log(des.imageGroup)
                        console.log(imageBlank)
                        console.log(imageColor)
                        let color = b.colors.filter(c=> c.name == imageColor.value)[0]
                        console.log(color, "color")
                        let foundImages = false
                        if(b.blank.multiImages[i].filter(im=> im.imageGroup.includes("default") &&color?._id.toString() == im.color.toString())[0]){
                            let image = b.blank.multiImages[i].filter(im=> im.imageGroup.includes("default") && color?._id.toString() == im.color.toString())[0]
                            image.side = i
                            image.style=b.blank.code
                            if(image.side == "modelFront") image.side = "front"
                            if(image.side == "modelBack") image.side = "back"
                            images.push(image)
                            foundImages = true
                        }
                    })
                }
            }
        })
        setImageGroupImages([...images])
    },[imageBlank, imageColor])
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
    let imageLocations = ["front", "back", "upperSleeve", "lowerSleeve", "pocket", "center"]
    
    let updateDesign = async (des)=>{
        let res = await axios.put("/api/admin/designs", {design: {...des}}).catch(e=>{console.log(e.response.data); res = e.response})
        if(res?.data?.error) alert(res.data.msg)
    }
    const updateImage = async ({url,location})=>{
        let d = {...des}
        console.log(d.images, url, location)
        if(!d.images) d.images = {}
        console.log(d.images, url, location)
        d.images[location] = url
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
    const deleteDesignImage = ({location})=>{
        let d = {...des}
        des.images[location] = null;
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
        <Box sx={{display: "flex", flexDirection: "column", padding: "3%"}}>
            <Box sx={{display: "flex", flexDirection: "row", justifyContent: "space-between"}}>
            <Button sx={{margin: "1% 2%", background: theme.palette.primary.main, color: "#ffffff"}} onClick={()=>{
                            let d = {...des};
                            d.published = !d.published;
                            setDesign({...d});
                            updateDesign({...d})
                            alert(`Design is ${d.published? "published": "unpublished"} and will be ${d.published? "uploaded to all": "removed from all"} market places shortly`)
            }}>{des.published? "Unpublish": "Publish"}</Button>
            {!des.sendToMarketplaces && <Button sx={{margin: "1% 2%", background: theme.palette.primary.main, color: "#ffffff"}} onClick={()=>{
                            let d = {...des};
                            d.sendToMarketplaces = true;
                            setDesign({...d});
                            updateDesign({...d})
                            alert(`Design will resend to market places next time files are made`)
            }}>Resend To Market Places</Button>}
            <Button sx={{margin: "1% 2%", background: "#FF2400", color: "#ffffff"}} onClick={async ()=>{
                let res = await axios.delete(`/api/admin/designs?design=${des._id}`)
                if(res.data.error) alert(res.data.msg)
                else {
                    router.push("/admin/designs")
                }
            }}>Delete</Button>
            </Box>
            <Accordion >
                <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls="panel1-content"
                    id="panel1-header"
                    sx={{padding: "2%"}}
                    >
                    <Typography component="span">Design Images</Typography>
                </AccordionSummary>
                <AccordionDetails sx={{padding: "2%", height: "45vh"}}>
                    <Grid2 container spacing={1}>
                        
                        {imageLocations.map((i, j)=>(
                            <Grid2 size={{xs: 6, sm: 2, md: 2}} key={j}>
                                <Uploader location={i} afterFunction={updateImage} image={des.images? des.images[i]: null} />
                                <Button fullWidth onClick={()=>{deleteDesignImage({location: i})}}>Delete Image</Button>
                            </Grid2>
                        ))}
                        
                    </Grid2>
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
                <AccordionDetails sx={{padding: "2%", height: "35vh"}}>
                    <Grid2 container spacing={1}>
                        
                        {imageLocations.map((i, j)=>(
                            <Grid2 size={{xs: 6, sm: 2, md: 2}} key={j}>
                                <Uploader location={i} afterFunction={updateEmbroidery}  image={des.embroideryFiles && des.embroideryFiles[i]? "/embplaceholder.jpg": null}/>
                                <Button fullWidth onClick={()=>{deleteEmbroideryFile({location: i})}}>Delete File</Button>
                            </Grid2>
                        ))}
                    </Grid2>
                </AccordionDetails>
            </Accordion>
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
                                <Box sx={{display: "flex", flexDirection: "row", justifyContent: "space-between"}}>
                                    <Button onClick={()=>{setOpen(true); setBlankForAlt(b); console.log(b)}}>Add Alternative Images</Button>
                                    <Button onClick={()=>{
                                        setUpcBlank(b.blank)
                                        setUpcModal(true)
                                    }}>See Sku List</Button>
                                </Box>
                            </AccordionDetails>
                        </Accordion>
                        ))}
                    </Grid2>
                    <Grid2 size={{xs: 4, sm: 4}} >
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
                                setImageGroupImages([...images])
                                setDesign({...d})
                                updateDesign({...d})
                            }}
                         />
                    </Grid2>
                    <Grid2 size={{xs: 4, sm: 4}} >
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
                    <Grid2 size={{xs: 4, sm: 4}} >
                            {console.log(des.blanks, imageBlank.value)}
                            {console.log(des.blanks.filter(b=>b.blank.code== imageBlank.value))}
                            {imageBlank  &&  <CreatableSelect
                            placeholder="Blank"
                            options={des.blanks.filter(b=>b.blank.code== imageBlank.value)[0]?.colors.map(c=>{ return {label: c.name, value: c.name}})}
                            value={imageColor? imageColor: {label: "Color", value: null}}
                            onChange={(val)=>{
                                setImageGroupImages([])
                                setImageColor(val)
                            }}
                         />}
                    </Grid2>
                    <Grid2 size={12}>
                        <Grid2 container spacing={2}>
                            {imageGroupImages.map((i,j)=>(
                                <Grid2 size={{xs: 6, md: 4}} key={j}>
                                    <ProductImageOverlay
                                        imageGroup={des.imageGroup}
                                        box={
                                        i.box[0]
                                        }
                                        id={i._id}
                                        style={i.style}
                                        colorName={imageColor}
                                        setDefaultImages={setDefaultImages}
                                        styleImage={i.image}
                                        side={i.side}
                                        dI={des.blanks.filter(b=> b.blank.code == imageBlank.value)[0].defaultImages?.filter(dI=> dI.color == i.color && dI.side == i.side)[0]?.id}
                                        designImage={des.images && des.images[i.side == "modalFront"? "front": i.side == "modalBack"? "back": i.side]? des.images[i.side == "modalFront"? "front": i.side == "modalBack"? "back": i.side]: null }
                                    />
                                </Grid2>
                            ))}
                        </Grid2>
                    </Grid2>
                </Grid2>
            </Card>
            <ModalUpc open={upcModal} setOpen={setUpcModal} blank={upcBlank} setBlank={setUpcBlank} design={des} />
            <AltImageModal open={open} setOpen={setOpen} blank={blankForAlt} design={des} setDesign={setDesign} updateDesign={updateDesign}  />
        </Box>
    )
}

const ModalUpc = ({open, setOpen, blank, setBlank, design})=>{
    let [upc, setUpc] = useState([])
    let [edit, setEdit] = useState(null)
    let [type, setType] = useState(null)
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
    useEffect(()=>{
        const getUpcs = async()=>{
            let res = await axios.get(`/api/upc?design=${design._id}&blank=${blank._id}`)
            console.log(res.data)
            setUpc(res.data.upc)
        }
        getUpcs()
    }, [open])
    return (
        <Modal
        open={open}
        onClose={()=>{setOpen(false); setBlank(null); setUpc([])}}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
            <Grid2 container spacing={2} sx={{textAlign: "center", padding: ".5%"}}>
                <Grid2 size={3}>
                    <Typography>Sku</Typography>
                </Grid2>
                <Grid2 size={1}>
                    <Typography>GTIN</Typography>
                </Grid2>
                <Grid2 size={1}>
                    <Typography>UPC</Typography>
                </Grid2>
                <Grid2 size={2}>
                    <Typography>Design Name</Typography>
                </Grid2>
                <Grid2 size={2}>
                    <Typography>Blank Name</Typography>
                </Grid2>
                <Grid2 size={1}>
                    <Typography>Size</Typography>
                </Grid2>
                <Grid2 size={2}>
                    <Typography>Color</Typography>
                </Grid2>
            </Grid2>
          {upc.map((u, i)=>(
            <Card sx={{padding: "2%", background: i % 2 == 0? "#e2e2e2": "#ffffff"}} key={u._id}>
                <Grid2 container spacing={2} sx={{textAlign: "center"}}>
                    <Grid2 size={3}>
                        <Typography>{u.sku}</Typography>
                    </Grid2>
                    <Grid2 size={1}>
                        <Typography>{u.gtin}</Typography>
                    </Grid2>
                    <Grid2 size={1}>
                        <Typography>{u.upc}</Typography>
                    </Grid2>
                    <Grid2 size={2}>
                        <Typography>{u.design?.name}</Typography>
                    </Grid2>
                    <Grid2 size={2}>
                        <Typography>{u.blank?.name}</Typography>
                    </Grid2>
                    <Grid2 size={1}>
                        <Typography>{u.size}</Typography>
                    </Grid2>
                    <Grid2 size={2}>
                        {u.color && <Typography>{u.color?.name}</Typography>}
                        {!u.color && <Button>Add Color</Button>}
                    </Grid2>
                </Grid2>
            </Card>
          ))}
        </Box>
      </Modal>
    )
}
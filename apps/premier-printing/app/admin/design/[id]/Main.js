"use client";
import {Box, Grid2, TextField, Accordion, AccordionActions, AccordionSummary, AccordionDetails, Button, Typography, Card} from "@mui/material";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import axios from "axios";
import {useState, useEffect} from "react";
import { Uploader } from "@/components/premier/uploader";
import CreatableSelect from "react-select/creatable";

export function Main({design, blanks, brands, mPs, pI}){
    const [des, setDesign] = useState({...design})
    const [bran, setBrands] = useState(brands)
    const [marketPlaces, setMarketPlaces] = useState(mPs)
    const [loading, setLoading] = useState(true)
    const [imageGroups, setImageGroups] = useState([])
    useEffect(()=>{
        let d = {...des}
        console.log(blanks[0].colors[0])
        d.blanks= d.blanks.map(bl=>{
           // console.log("bl blank", bl.blank, blanks.filter(b=> b._id.toString() == (bl.blank._id? bl.blank._id.toString(): bl.blank.toString()))[0])
            let blank = blanks.filter(b=> b._id.toString() == (bl.blank?._id? bl.blank?._id.toString(): bl.blank?.toString()))[0]
            // if(typeof bl.sizes?[0] == "string") bl.sizes = blank.sizes?.filter(s=> bl.sizes?.includes(s._id.toString()))
            // console.log(bl.colors, blank.colors)
            // if(typeof bl.colors[0] == "string") bl.colors = blank.colors.filter(s=> bl.colors.includes(s._id.toString()))
            bl.blank = blank
            return bl
        })
        d.brands = d.brands.map(br=>{
            let brand = brands.filter(b=> b._id.toString() == (br._id? br._id.toString(): br.toString()))[0]
            return brand
        })
        console.log(d.brands, d.blanks, d.marketplaces)
        d.blanks = d.blanks.filter(b=> b.blank != undefined)
        setDesign({...d})
        setLoading(false)
        if(blanks){
            console.log(blanks)
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
            console.log(imGr, "image groups")
            setImageGroups(imGr)
          }
    },[])
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
    let imageLocations = ["front", "back", "leftSleeve", "rightSleeve", "pocket"]
    
    let updateDesign = async (des)=>{
        let res = await axios.put("/api/admin/designs", {design: {...des}}).catch(e=>{console.log(e.response.data); res = e.response})
        if(res?.data?.error) alert(res.data.msg)
    }
    const updateImage = async ({url,location})=>{
        let d = {...des}
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
        setDesign({...d})
        updateDesign({...d})
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
        if(!d.b2m) d.b2m = []
        let b2m = d.b2m.filter(b=> b.brand== brand.name)[0]
        if(!b2m) {
            b2m = []
            b2m.push({
                brand: brand.name,
                marketPlaces: mps.map(m=> {return m.name})
            })
            d.b2m.push(b2m)
        }
        else b2m.marketPlaces =  mps.map(m=> {return m.name})
        console.log(b2m, "b2m", brand.name)
        setDesign({...d})
        updateDesign({...d})
    }
    const updateBlanks = async ({brand, marketplace, values})=>{
        let d = {...des}
        let codes = values.map(b=>{return b})
        //console.log(values, "values", codes, marketplace, "marketplace")
        values.map(bl=>{
            console.log(bl, brand.name, marketplace, d.blanks)
            if(!d.blanks) d.blanks = [];
            let blank = d.blanks?.filter(bla=> bla.blank.code == bl && bla.brand == brand.name && bla.marketPlace == marketplace)[0]
            console.log(blank, "not added")
            if(!blank){
               // console.log(blanks, bl.value)
                let blank = blanks.filter(b=> b.code == bl)[0]
                console.log(blank, "added")
                if(blank){
                    d.blanks.push({
                        blank, brand: brand.name, marketPlace: marketplace
                    })
                }
            }
        })
        //console.log(codes, d.blanks)
        d.blanks = d.blanks.filter(b=> codes.includes(b.blank.code))
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
            <Accordion >
                <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls="panel1-content"
                    id="panel1-header"
                    sx={{padding: "2%"}}
                    >
                    <Typography component="span">Design Images</Typography>
                </AccordionSummary>
                <AccordionDetails sx={{padding: "2%", height: "35vh"}}>
                    <Grid2 container spacing={1}>
                        
                        {imageLocations.map((i, j)=>(
                            <Grid2 size={{xs: 6, sm: 2.4, md: 2.4}} key={j}>
                                <Uploader location={i} afterFunction={updateImage} image={des.images[i]} />
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
                            <Grid2 size={{xs: 6, sm: 2.4, md: 2.4}} key={j}>
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
                        <TextField label="Title" fullWidth value={des.name}
                        onChange={()=>updateTitleSku("name")}/>
                    </Grid2>
                    <Grid2 size={{xs: 5, sm: 4}}>
                        <TextField label="SKU" fullWidth value={des.sku}
                        onChange={()=>updateTitleSku("sku")}/>
                    </Grid2>
                    <Grid2 size={{xs: 12, sm: 12}}>
                        <TextField placeholder="Description" fullWidth multiline rows={4} value={des.description} onChange={()=>updateTitleSku("description")}/>
                        <Button size="small" sx={{fontSize: ".5rem", margin: "0%"}} onClick={getAiDescription}>Generate Description And Tags</Button>
                    </Grid2>
                    <Grid2 size={{xs: 12, sm: 12}}>
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
                    <Grid2 size={{xs: 12, sm: 12}} >
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
                        {des.brands.map(b=>(
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
                               {des.b2m?.filter(b2m=> b2m.brand == b.name)[0]?.marketPlaces.map(m=>(
                                     <Accordion key={m} sx={{marginTop: "1%"}}>
                                        <AccordionSummary
                                            expandIcon={<ExpandMoreIcon />}
                                            aria-controls="panel1-content"
                                            id="panel1-header"
                                            sx={{padding: "2%"}}
                                            >
                                            <Typography component="span">{m}</Typography>
                                        </AccordionSummary>
                                        <AccordionDetails> 
                                            <CreatableSelect
                                                placeholder="Blanks"
                                                options={blanks.map(m=>{return {value: m.code, label: m.code}})}
                                                value={des.blanks?.filter(bl=> bl.brand == b.name && bl.marketPlace == m)?.map(bl=> {return {value: bl.blank?.code, label: bl.blank?.code}})}
                                                onChange={(vals)=>{
                                                    let values = vals.map(v=>{return v.value})
                                                    console.log(values)
                                                    updateBlanks({brand: b, marketplace: m, values})
                                                }}
                                                isMulti
                                            />
                                            {console.log(des.blanks)}
                                        </AccordionDetails>
                                     </Accordion>
                               ))}                            
                            </AccordionDetails>
                        </Accordion>
                        ))}
                    </Grid2>
                    <Grid2 size={{xs: 12, sm: 12}} >
                        <Typography>Color Groups</Typography>
                        <CreatableSelect
                            placeholder="Color Groups"
                            //options={][}
                            //value={}
                            onChange={(vals)=>{
                                
                            }}
                            multi
                         />
                    </Grid2>
                    <Grid2 size={{xs: 12, sm: 12}} >
                        <Typography>Image Group</Typography>
                        <CreatableSelect
                            placeholder="Image Group"
                            options={imageGroups.map(ig=>{return {value: ig, label: ig}})}
                            value={{value: des.imageGroup, label: des.imageGroup}}
                            onChange={(vals)=>{
                                console.log(vals)
                                let d = {...des}
                                d.imageGroup = vals.value
                                setDesign({...d})
                                updateDesign()
                            }}
                         />
                    </Grid2>
                </Grid2>
            </Card>
        </Box>
    )
}
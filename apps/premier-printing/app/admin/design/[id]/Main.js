"use client";
import {Box, Grid2, TextField, Accordion, AccordionActions, AccordionSummary, AccordionDetails, Button, Typography, Card} from "@mui/material";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import axios from "axios";
import {useState} from "react";
import { Uploader } from "@/components/premier/uploader";
import CreatableSelect from "react-select/creatable";

export function Main({design, blanks, brands, marketPlaces}){
    const [des, setDesign] = useState(design)
    const [bran, setBrands] = useState(brands)
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
    let imageLocations = ["front", "back", "leftSleeve", "rightSleeve"]
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
        console.log(d.embroideryFiles, url, location)
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
                <AccordionDetails sx={{padding: "2%"}}>
                    <Grid2 container spacing={1}>
                        
                        {imageLocations.map(i=>(
                            <Uploader key={i} location={i} afterFunction={updateImage} image={des.images[i]} />
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
                <AccordionDetails sx={{padding: "2%"}}>
                    <Grid2 container spacing={1}>
                        
                        {imageLocations.map(i=>(
                            <Uploader key={i} location={i} afterFunction={updateEmbroidery}  />
                        ))}
                    </Grid2>
                </AccordionDetails>
            </Accordion>
            <Card sx={{width: "100%", minHeight: "80vh", padding: "6% 2%"}}>
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
                        <TextField placeholder="Description" fullWidth multiline rows={4} value={des.description}/>
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
                        <CreatableSelect
                            placeholder="Brands"
                            options={bran.map(b=>{return {value: b.name, label: b.name}})}
                            isMulti
                            value={des.brands?.map(b=>{
                                return {value: b.name, label: b.name}
                            })}
                            onChange={(vals)=>{
                                updateBrands(vals.map(v=>{return v.value}))
                            }}
                         />
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
                                    options={b.marketPlaces.map(m=>{return {value: m.name, label: m.name}})}
                                    value={b.marketPlaces.map(m=>{return {value: m.name, label: m.name}})}
                                   isMulti
                               />
                            
                            </AccordionDetails>
                        </Accordion>
                        ))}
                    </Grid2>
                </Grid2>
            </Card>
        </Box>
    )
}
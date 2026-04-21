"use client";
import {Box, Card, Container, Typography, Grid2, Divider, TextField, MenuItem, Button, Modal, Radio, RadioGroup, FormControlLabel,  FormControl, FormLabel  } from "@mui/material";
import Image from "next/image";
import AddCircleIcon from '@mui/icons-material/AddCircle';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import {Footer} from "../reusable/Footer";
import {useState} from "react";
import { MarketplaceModal } from "../reusable/MarketPlaceModal";
import axios from "axios"
export function BlanksComponent({blanks, mPs, source}){
    const [visibleBlanks, setVisibleBlanks] = useState(blanks);
    const [blank, setBlank] = useState({})
    const [marketPlaces, setMarketPlaces] = useState(mPs)
    const [marketplaceModal, setMarketplaceModal] = useState(false)
    const [aliasOpen, setAliasOpen] = useState(false)
    const [departments, setDepartments] = useState([...new Set(blanks.map(b => b.department).filter(d => d))])
    const [categories, setCategories] = useState([...new Set(blanks.map(b => b.category).flat().filter(c => c))])
    const handleSearch = ({ value }) => {
        //console.log(value);
        let filtered = blanks.filter(
            (s) =>
                s.code.toLowerCase().includes(value.toLowerCase()) ||
                s.name.toLowerCase().includes(value.toLowerCase())
        );
        setVisibleBlanks([...filtered]);
    };
    return (
        <Box >
            <Container maxWidth="lg" sx={{minHeight: "80vh", padding: "2%"}}>
                <Box sx={{display: "flex", flexDirection: "row", justifyContent: "flex-end", alignItems: "center", marginBottom: "2%"}}>
                    <Button variant="contained" href="/admin/blanks/create">Create New Blank</Button>
                    <Button variant="outlined" sx={{marginLeft: "2%"}} onClick={()=>{setAliasOpen(!aliasOpen)}} >Create Alias/Combined Blank</Button>
                </Box>
                <Box>
                    <TextField
                        label="Search Blanks"
                        fullWidth
                        variant="outlined"
                        sx={{background: "#ffffff"}}
                        onChange={(e) => handleSearch({ value: e.target.value })}
                    />
                    <Box sx={{height: "13vh", overflow: "scroll"}} >
                        <Grid2 container spacing={2} sx={{margin: "2% 0%"}}>
                            {departments.map(d=>(
                                <Grid2 item size={{ xs: 6, sm: 4, md: 2 }}>
                                    <Card key={d} sx={{padding: "2%", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center",cursor: "pointer", background: "#ffffff", "&:hover":{background: "#e2e2e2"}}} onClick={()=>{
                                        if(blanks.filter(b => b.department == d).length > 0){
                                            setVisibleBlanks(blanks.filter(b => b.department == d))
                                        }
                                    }}>
                                        <Typography variant="h6">{d}</Typography>
                                    </Card>
                                </Grid2>
                            ))}
                            {categories.map(c => (
                                <Grid2 item size={{ xs: 6, sm: 4, md: 2 }}>
                                    <Card key={c} sx={{ padding: "2%", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", cursor: "pointer", background: "#ffffff", "&:hover":{background: "#e2e2e2"} }} onClick={() => {
                                        if (blanks.filter(b => b.category.includes(c)).length > 0) {
                                            setVisibleBlanks(blanks.filter(b => b.category.includes(c)))
                                        }
                                    }}>
                                        <Typography variant="h6">{c}</Typography>
                                    </Card>
                                </Grid2>
                            ))}
                        </Grid2>
                        
                    </Box>
                </Box>
                <Grid2 container spacing={2} sx={{margin: "2% 0%"}}>
                    {visibleBlanks.map((blank) => {
                        console.log(blank.images, "blank images")
                        let frontImage = blank.images && blank.images.length > 0 ? blank.images[0] : null;
                        return (
                            <Grid2 item size={{xs: 6, sm: 4, md: 3}} key={blank.id}>
                            <Card sx={{padding: "2%", display: "flex", flexDirection: "column"}}>
                                <Box sx={{display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", }}>
                                    <Image src={frontImage ? `${frontImage?.image.replace("images1.pythiastechnologies.com", "images2.pythiastechnologies.com/origin")}?width=400`: ""} alt={blank.name} width={300} height={200} style={{width: "100%", height: "auto", }} />
                                </Box>
                                <Box>
                                    <Divider sx={{margin: "2% 0%"}} />
                                </Box>
                                <Typography variant="h6" sx={{textWrap: "nowrap", overflow: "hidden", textOverflow: "ellipsis",}}>{blank.code} - {blank.name}</Typography>
                                <Box sx={{display: "flex", flexDirection: "row", justifyContent: "space-between", marginTop: "2%"}}>
                                    <Box sx={{display: "flex", flexDirection: "column",}}>
                                            <Typography variant="body1" sx={{ textAlign: "left", fontSize: "0.8rem" }}>Sales: <span style={{ fontWeight: "bold", fontSize: "0.8rem" }}>{blank.sales}</span></Typography>
                                        <span style={{ fontSize: "0.6rem" }}>(Last 30 days)</span>
                                    </Box>
                                    <Box sx={{ display: "flex", flexDirection: "column", }}>
                                            <Typography variant="body1" sx={{ textAlign: "left", fontSize: "0.8rem" }}>Dept: <span style={{ fontWeight: "bold", fontSize: "0.8rem" }}>{blank.department}</span></Typography>
                                    </Box>
                                    <Box sx={{ display: "flex", flexDirection: "column", }}>
                                        <Typography variant="body1" sx={{ textAlign: "left", fontSize: "0.8rem" }}>Cat: <span style={{ fontWeight: "bold", fontSize: "0.8rem" }}>{blank.category && blank.category[0]}</span></Typography>
                                    </Box>
                                </Box>
                                <Box sx={{display: "flex", flexDirection: "row", justifyContent: "center", marginTop: "2%"}}>
                                    <Button variant="outlined" onClick={()=>{
                                        setBlank(blank)
                                        setMarketplaceModal(true)
                                    }}>Add To MarketPlace</Button>
                                    <Button variant="contained" sx={{ marginLeft: "2%" }} href={`/admin/blanks/production/${blank._id}`} target="_blank">Production Settings</Button>
                                </Box>
                                    <Button variant="outlined" sx={{ marginTop: "2%" }} href={`/admin/blanks/create?id=${blank._id}`} target="_blank">Edit Blank</Button>
                            </Card>
                        </Grid2>
                    )})}
                </Grid2>
                <MarketplaceModal open={marketplaceModal} setOpen={setMarketplaceModal} marketPlaces={marketPlaces} setMarketPlaces={setMarketPlaces} sizes={blanks?.map(b => { return b.sizes?.map(s => { return s.name }) })} blank={blank} setBlank={setBlank} source={source} />
                <AliasModal open={aliasOpen} setOpen={setAliasOpen} blanks={blanks} />
            </Container>
            <Footer />
        </Box>
    );
}

const AliasModal = ({blanks, open, setOpen}) =>{
    console.log(open, "open")
    const [selectedBlanks, setSelectedBlanks] = useState([])
    const [options, setOptions] = useState({})
    const [blankSizesToUse, setBlankSizesToUse] = useState({})
    const [blankColorsToUse, setBlankColorsToUse] = useState({})
    const [sizesToUse, setSizesToUse] = useState("")
    const [colorsToUse, setColorsToUse] = useState("")
    function combineArrays(arrays) {
    return arrays.reduce(
        (acc, curr) =>
        acc.flatMap(a => curr.map(b => [...a, b])),
        [[]]
    );
    }
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
    return  <Modal
            open={open}
            onClose={() => setOpen(false)}
            aria-labelledby="remove-marketplace-modal-title"
            aria-describedby="remove-marketplace-modal-description"
        >
            <Box sx={style}>
                <Typography id="remove-marketplace-modal-title" variant="h6" component="h2">
                    Create Alias
                </Typography>
                <Grid2 container spacing={2} sx={{padding: "2%", margin: "2%"}}>
                    <Grid2 size={3}>
                        <Typography>Blank 1</Typography>
                    </Grid2>
                    <Grid2 size={3}>
                        <TextField select fullWidth label={"Select Blank"} value={selectedBlanks[0]? selectedBlanks[0]._id.toString(): null} onChange={(e)=>{
                            console.log("change")
                            let selected = selectedBlanks
                            console.log(blanks)
                            let blank = blanks.find(b=> b._id.toString() == e.target.value)
                            let size = blankSizesToUse
                            setSizesToUse(blank._id.toString())
                            size[blank._id.toString()] = blank.sizes
                            setBlankSizesToUse({...size})
                            let color = blankColorsToUse
                            color[blank._id.toString()] = blank.colors
                            setBlankColorsToUse({...color})
                            selected[0] = blank
                            console.log(selected)
                            setSelectedBlanks([...selected])
                        }}>  
                            <MenuItem value={"select"}>Select</MenuItem>
                            {blanks.map(b=>{
                                return <MenuItem value={b._id}>{b.code}</MenuItem>
                            })}
                        </TextField>
                    </Grid2>
                    <Grid2 size={1}>
                        <Box sx={{display: "flex", alignItems: "center", alignContent: "center"}}>
                            <AddCircleIcon sx={{cursor: "pointer"}} onClick={()=>{
                                let selected = selectedBlanks
                                selected.push(null)
                                setSelectedBlanks([...selected])
                            }}/>
                        </Box>
                    </Grid2>
                </Grid2>
                {selectedBlanks.map((b,i)=>{
                    if(i == 0) return null
                    else return <Grid2 container spacing={2} sx={{padding: "2%", margin: "2%"}}>
                    <Grid2 size={3}>
                        <Typography>Blank {i + 1}</Typography>
                    </Grid2>
                    <Grid2 size={3}>
                        <TextField select fullWidth label={"Select Blank"} value={b? b._id.toString(): null} onChange={(e)=>{
                            console.log("change")
                            let selected = selectedBlanks
                            console.log(blanks)
                            let blank = blanks.find(b=> b._id.toString() == e.target.value)
                            let size = blankSizesToUse
                            size[blank._id.toString()] = blank.sizes
                            setBlankSizesToUse({...size})
                            selected[i] = blank
                            console.log(selected)
                            setSelectedBlanks([...selected])
                        }}>  
                            <MenuItem value={"select"}>Select</MenuItem>
                            {blanks.map(b=>{
                                return <MenuItem value={b._id}>{b.code}</MenuItem>
                            })}
                        </TextField>
                    </Grid2>
                    <Grid2 size={1}>
                        <Box sx={{display: "flex", alignItems: "center", alignContent: "center"}}>
                            <AddCircleIcon sx={{cursor: "pointer"}} onClick={()=>{
                                let selected = selectedBlanks
                                selected.push(null)
                                setSelectedBlanks([...selected])
                            }}/>
                        </Box>
                    </Grid2>
                    <Grid2 size={1}>
                        <Box sx={{display: "flex", alignItems: "center", alignContent: "center"}}>
                            <RemoveCircleOutlineIcon sx={{cursor: "pointer"}} onClick={()=>{
                                console.log("remove", i)
                                let selected = selectedBlanks
                                let newSelected = []
                                console.log(selected.length, "length")
                                for(let j = 0; j < selectedBlanks.length; j++){
                                    console.log(j != i)
                                    if(j != i )newSelected.push(selected[j])
                                }
                                setSelectedBlanks([...newSelected])
                                let sizeSelect = blankSizesToUse
                                let newSizeSelect = {}
                                for(let newb of newSelected){
                                    newSizeSelect[newb._id.toString()] = newb.sizes
                                }
                                setBlankSizesToUse({...newSizeSelect})
                                let ops = options
                                ops.sizes = blankSizesToUse[newSelected[0]._id]
                                
                                if(sizesToUse == "combined"){
                                    let sizes = []
                                    let blanks = Object.keys(newSizeSelect).map(b=> newSizeSelect[b])
                                    console.log(blanks)
                                    let si = combineArrays(blanks)
                                    console.log(si)
                                    let i = 0
                                    for(let s of si){
                                        let size = {
                                            name: s.map(si=> {return si.name}).join("/"),
                                            weight: s.map(si=> si.weight).reduce((accumulator, currentValue) => accumulator + currentValue, 0),
                                            retailPrice: s.map(si=> si.retailPrice).reduce((accumulator, currentValue) => accumulator + currentValue, 0),
                                            basePrice: s.map(si=> si.basePrice).reduce((accumulator, currentValue) => accumulator + currentValue, 0),
                                            cost: s.map(si=> si.cost).reduce((accumulator, currentValue) => accumulator + currentValue, 0),
                                            sku: i,
                                            wholeSaleCost: s.map(si=> si.wholeSaleCost).reduce((accumulator, currentValue) => accumulator + currentValue, 0),
                                            blankSizes: s
                                        }
                                        i++
                                        sizes.push(size)
                                    }
                                    console.log(sizes)
                                    ops.sizes = sizes
                                }else{
                                    for(let s of ops.sizes){
                                        s.blankSizes = [s]
                                        console.log(s, "size")
                                    }
                                }
                                setOptions({...ops})
                            }}/>
                        </Box>
                    </Grid2>
                </Grid2>
                })}
                <hr/>
                <Grid2 container spacing={2}>
                    <Grid2 size={4}>
                        <TextField label="Code" fullWidth value={options.code? options.code: selectedBlanks.map(b=> b?.code).join("-")} onChange={(e)=>{
                            let opts = options
                            opts.code = e.target.value
                            setOptions({...opts})
                        }}/>
                    </Grid2>
                    <Grid2 size={6}>
                        <FormControl sx={{alignItems: "center", display: "flex", textAlign: "center"}}>
                            <FormLabel>Use Data Details From?</FormLabel>
                            <RadioGroup row onChange={(e)=>{
                                let ops = options
                                ops.details = e.target.value
                                setOptions({...ops})
                            }}>
                                {selectedBlanks?.map((b, i)=>{
                                    if(!b)return null
                                    else if(!options.details) {
                                        let opts = options
                                        opts.details = b._id.toString()
                                    }
                                    return <FormControlLabel value={b?._id} control={<Radio />} label={b?.code} checked={options.details == b._id.toString()? true: false} />
                                })}
                            </RadioGroup>
                        </FormControl>
                    </Grid2>
                </Grid2>
                <hr/>
                <Grid2 container spacing={2}>
                    <Grid2 size={12}><Typography variant="h6" sx={{textAlign: "center"}}>Size Info</Typography></Grid2>
                    {selectedBlanks && selectedBlanks.length > 0 && selectedBlanks.map((b, i)=>{
                        if(!b) return null
                        return <Grid2 size={6} sx={{border: "1px solid #e2e2e2", padding: "1%"}} >
                            <Typography sx={{textAlign: "center", margin: ".5%"}}>{b.code}</Typography>
                            <Grid2 container spacing={2}>
                                {b.sizes.map(s=>{
                                    return <Grid2 size={2} sx={{border: "1px solid #E2E2E2", padding: "1%", textAlign: "center", backgroundColor: blankSizesToUse[b._id.toString()]?.find(si=> si._id.toString() == s._id.toString())?"#a7a4ca": "#ffffff", cursor: "pointer"}} onClick={()=>{
                                        let sizes = blankSizesToUse
                                        let size = sizes[b._id.toString()].find(si=> si._id.toString() == s._id.toString())
                                        console.log(size)
                                        if(!size) sizes[b._id.toString()].push(s)
                                        else sizes[b._id.toString()] = sizes[b._id.toString()].filter(si=> si._id.toString() != s._id.toString()) 
                                        setBlankSizesToUse({...sizes})
                                    }}>
                                        <Typography>{s.name}</Typography>
                                    </Grid2>
                                })}
                            </Grid2>
                        </Grid2>
                    })}
                </Grid2>
                <Grid2 container spacing={2}>
                    <Grid2 size={12}>
                        {selectedBlanks && selectedBlanks.length > 0 && <FormControl>
                            <FormLabel>Use Sizes</FormLabel>
                            <RadioGroup row onChange={(e)=>{
                                console.log(e.target.value)
                                setSizesToUse(e.target.value)
                                let ops = options
                                ops.sizes = blankSizesToUse[e.target.value]
                                if(e.target.value == "combined"){
                                    let sizes = []
                                    let blanks = Object.keys(blankSizesToUse).map(b=> blankSizesToUse[b])
                                    console.log(blanks)
                                    let si = combineArrays(blanks)
                                    console.log(si)
                                    let i = 0
                                    for(let s of si){
                                        let size = {
                                            name: s.map(si=> {return si.name}).join("/"),
                                            weight: s.map(si=> si.weight).reduce((accumulator, currentValue) => accumulator + currentValue, 0),
                                            retailPrice: s.map(si=> si.retailPrice).reduce((accumulator, currentValue) => accumulator + currentValue, 0),
                                            basePrice: s.map(si=> si.basePrice).reduce((accumulator, currentValue) => accumulator + currentValue, 0),
                                            cost: s.map(si=> si.cost).reduce((accumulator, currentValue) => accumulator + currentValue, 0),
                                            sku: i,
                                            wholeSaleCost: s.map(si=> si.wholeSaleCost).reduce((accumulator, currentValue) => accumulator + currentValue, 0),
                                            blankSizes: s
                                        }
                                        i++
                                        sizes.push(size)
                                    }
                                    console.log(sizes)
                                    ops.sizes = sizes
                                } else {
                                    for (let s of ops.sizes) {
                                        s.blankSizes = [s]
                                        console.log(s, "size")
                                    }
                                }
                                setOptions({...ops})
                            }}>
                                {selectedBlanks?.map((b, i)=>{
                                    if(!b)return null
                                    else if(b._id.toString() == sizesToUse){
                                        let opts = options
                                        opts.sizes = blankSizesToUse[b._id.toString()]
                                    }
                                    return <FormControlLabel value={b?._id} control={<Radio />} label={b?.code} checked={sizesToUse == b._id.toString()? true: false} />
                                })}
                                <FormControlLabel value={"combined"} control={<Radio />} label="Combine" checked ={sizesToUse == "combined"? true: false} />
                            </RadioGroup>
                        </FormControl>}
                    </Grid2>
                    <Grid2 size={12}>
                        <Grid2 container spacing={2}>
                            {options && options.sizes && options.sizes.map(s=>{
                                return <Grid2 size={2} sx={{border: "1px solid #E2E2E2", padding: "1%", textAlign: "center", backgroundColor: "#a7a4ca",}} >
                                            <Typography>{s.name}</Typography>
                                        </Grid2>
                            })}
                        </Grid2>
                    </Grid2>
                </Grid2>
                <hr/>
                <Grid2 container spacing={2}>
                    <Grid2 size={12}><Typography variant={"h6"} sx={{textAlign: "center"}}>Color Info</Typography></Grid2>
                    {selectedBlanks && selectedBlanks.length > 0 && selectedBlanks.map((b,i)=>{
                        if(!b)return null
                        else if(!blankColorsToUse[b._id.toString()]) blankColorsToUse[b._id.toString()] = b.colors
                        return <Grid2 size={6} key={b._id}>
                            <Grid2 container spacing={2}>
                                {b.colors.map((c,i)=>{
                                    return <Grid2 size={3} key={c._id}>
                                        <Box sx={{display: "flex", flexDirection: "row", alignContent: "center", alignItems: "center", gap: 1, cursor: "pointer"}} onClick={()=>{
                                            console.log(b)
                                            let colors = blankColorsToUse
                                            if(colors[b._id.toString()] && colors[b._id.toString()].find(cl=> cl._id.toString() == c._id.toString())){
                                                console.log("has color")
                                                let newColors = []
                                                for(let cl of colors[b._id.toString()]){
                                                    if(cl._id.toString() != c._id.toString()) newColors.push(cl)
                                                }
                                                colors[b._id.toString()] = newColors
                                            }else{
                                                colors[b._id.toString()].push(c)
                                            }
                                            setBlankColorsToUse({...colors})
                                        }}>
                                            <Box sx={{width: "25px", height: "25px", backgroundColor: c.hexcode, borderRadius: "25px", border: "1px solid #e2e2e2", alignItems: "center", display: "flex", alignContent: "center"}}>{blankColorsToUse && blankColorsToUse[b._id.toString()] && blankColorsToUse[b._id.toString()].find(cl=> cl._id.toString() == c._id.toString()) && <CheckCircleIcon sx={{color: "#09ed5d"}}/>}</Box>
                                            <Typography>{c.name}</Typography>
                                        </Box>
                                    </Grid2>
                                })}
                            </Grid2>
                        </Grid2>
                    })}
                </Grid2>
                <Grid2 container spacing={2}>
                    <Grid2 size={12}>
                        {selectedBlanks && selectedBlanks.length > 0 && <FormControl>
                            <FormLabel>Use Colors From</FormLabel>
                            <RadioGroup row onChange={(e)=>{
                                console.log(e.target.value)
                                setColorsToUse(e.target.value)
                                let ops = options
                                ops.colors = blankColorsToUse[e.target.value]
                                if(e.target.value == "combined"){
                                    let colors = []
                                    let blanks = Object.keys(blankColorsToUse).map(b=> blankColorsToUse[b])
                                    console.log(blanks)
                                    let si = combineArrays(blanks)
                                    console.log(si)
                                    let i = 0
                                    for(let s of si){
                                        let color = {
                                            name: s.map(si=> {return si.name}).join("/"),
                                            hexcode: s[0].hexcode,
                                            sku: i
                                        }
                                        i++
                                        colors.push(color)
                                    }
                                    console.log(colors)
                                    ops.colors = colors
                                }
                                setOptions({...ops})
                            }}>
                                {selectedBlanks?.map((b, i)=>{
                                    if(!b)return null
                                    else if(b._id.toString() == colorsToUse){
                                        let opts = options
                                        opts.colors = blankColorsToUse[b._id.toString()]
                                    }
                                    return <FormControlLabel value={b?._id} control={<Radio />} label={b?.code} checked={colorsToUse == b._id.toString()? true: false} />
                                })}
                                <FormControlLabel value={"combined"} control={<Radio />} label="Combine" checked ={colorsToUse == "combined"? true: false} />
                            </RadioGroup>
                        </FormControl>}
                    </Grid2>
                    <Grid2 size={12}>
                        <Grid2 container spacing={2} border={"2px solid #e2e2e2"} p={2}>
                            {options && options.colors && options.colors.map(c=>{
                                return<Grid2 size={3} key={c._id}>
                                        <Box sx={{display: "flex", flexDirection: "row", alignContent: "center", alignItems: "center", gap: 1,}} >
                                            <Box sx={{width: "25px", height: "25px", backgroundColor: c.hexcode, borderRadius: "25px", border: "1px solid #e2e2e2", alignItems: "center", display: "flex", alignContent: "center"}}></Box>
                                            <Typography>{c.name}</Typography>
                                        </Box>
                                    </Grid2>
                            })}
                        </Grid2>
                    </Grid2>
                </Grid2>
                <hr/>
                <Button variant="outlined" color="error" sx={{width: "50%", padding: "1%"}} onClick={async ()=>{
                    let res = await axios.post("/api/admin/blanks/alias", {options, selectedBlanks, sizesToUse, colorsToUse})
                    if(res && res.data && !res.data.error){
                        location.href = `/admin/blanks/create?id=${res.data.blank._id}`
                    }
                }} >
                    Create
                </Button>
                <Button variant="outlined" color="primary" sx={{ width: "50%", padding: "1%" }} onClick={() => setOpen(false)}>
                    Cancel
                </Button>
            </Box>
        </Modal>
}
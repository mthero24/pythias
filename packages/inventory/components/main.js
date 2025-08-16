"use client";
import {useState, useEffect} from "react";
import {Box, Grid2, TextField, Accordion, Modal, AccordionSummary, AccordionDetails, Button, Typography, Card, Container, Pagination, PaginationItem} from "@mui/material";
import axios from "axios";
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { OrderModal } from "./orderModal";
import { DisplayModal } from "./display";
import LoaderOverlay from "./LoaderOverlay";
import { Footer } from "@pythias/backend";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
export function Main({bla, it, defaultLocation, binType, cou, pa, q}){
    const [fullStyles, setFullStyles] = useState(bla)
    const [styles, setStyles] = useState(bla)
    const [items, setItems] = useState(it)
    const [open, setOpen] = useState(false)
    const [openDisplay, setOpenDisplay] = useState(false)
    const [orderType, setOrderType] = useState()
    const [page, setPage] = useState(pa? pa: 1)
    const [expanded, setExpanded] = useState("")
    const [expandedColor, setExpandedColor] = useState("")
    const [inventories, setInventories] = useState([]) 
    const [loading, setLoading] = useState(true)
    const [query, setQuery] = useState(q)
    const [count, setCount] = useState(cou)
    const save = async (inventory)=>{
        //console.log(inventory)
        let res = await axios.post("/api/admin/inventory", {inventory})
        if(res && res.data && !res.data.error){
            setFullStyles(res.data.combined)
            setItems(res.data.items)
        }else alert("Error")
    }
    //console.log(items.length)
    const updateInventory = async ({inventory, param})=>{
        let s = [...styles]
        //console.log(s)
        let blank = s.filter(s=> s.blank._id.toString() == inventory.blank.toString())[0]
        let inv = blank.inventories.filter(iv=> iv._id.toString() == inventory._id.toString())[0]

        inv[param] = param != "location" && param != "row" && param != "bin" && param != "shelf" && param != "unit"  ? parseInt(event.target.value): event.target.value;
        setStyles([...s])
        save(inv)
    }
    const search = async (term)=>{
        let res = await axios.get(`/api/admin/inventory?q=${term}`)
        if(res.data){
            setPage(1)
            setQuery(term)
            console.log(res.data.count, "count")
            setCount(res.data.count)
            return res.data.blanks
        }
    }
    return <Box>
        <Box sx={{display: "flex", flexDirection: "row", justifyContent: "space-between", padding: "2%"}}>
            <Typography variant="h3" sx={{marginLeft: "3%", marginBottom: "2%"}}>Inventory</Typography>
            <Button onClick={()=>{setLoading(true); setOrderType("Inventory Order"); setOpen(true)}}>Create Inventory Order</Button>
            <Button onClick={()=>{setLoading(true); setOrderType("Out Of Stock"); setOpen(true)}}>Create Out Of Stock Order</Button>
            <Button onClick={() => { setOpenDisplay(true) }}>Orders</Button>
        </Box>
        <Container sx={{minHeight: "70vh"}}>
            <Box sx={{marginBottom: "1%"}}>
                <TextField fullWidth placeholder="Filter.." sx={{background: "white"}} onChange={async ()=>{
                    let s2 = await search(event.target.value)
                    if(s2.length > 0){
                        setStyles([...s2])
                    }else{
                        setStyles([...fullStyles])
                    }
                }}/>
            </Box>
            {styles.map(s=>(
                <Accordion expanded={expanded === s.blank.code} key={s.blank._id} sx={{marginBottom: "2%"}} >
                    <AccordionSummary
                    onClick={()=>{setExpanded(expanded == s.blank.code? "": s.blank.code)}}
                    expandIcon={<ArrowDownwardIcon />}
                    aria-controls="panel1-content"
                    id="panel1-header"
                    >
                    <Typography component="span">{s.blank.code}  {">"} {s.blank.name} <br/>{s.blank.department}</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                    <Typography>
                       {s.blank.colors.map(si=>(
                            <Accordion expanded={expanded === s.blank.code && expandedColor == si.name}  key={si._id} >
                                <AccordionSummary
                                onClick={()=>{
                                    setExpandedColor(expandedColor == si.name? "": si.name); setInventories(s.inventories?.filter(i=>i.color_name == si.name))
                                }}
                                expandIcon={<ArrowDownwardIcon />}
                                aria-controls="panel1-content"
                                id="panel1-header"
                                >
                                <Typography component="span">{si.name}</Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <Grid2 container spacing={1} sx={{margin: '2%', textAlign: "center"}}>
                                            <Grid2 size={2}>
                                                <Typography>Size</Typography>
                                            </Grid2>
                                            <Grid2 size={1}>
                                                <Typography>Qty</Typography>
                                            </Grid2>
                                            <Grid2 size={1}>
                                                <Typography>Min</Typography>
                                            </Grid2>
                                            <Grid2 size={1}>
                                                <Typography>Order</Typography>
                                            </Grid2>
                                            <Grid2 size={1}>
                                                <Typography>Pend</Typography>
                                            </Grid2>
                                            <Grid2 size={1.5}>
                                                <Typography>Out Of Stock</Typography>
                                            </Grid2>
                                            {binType == "location" && <Grid2 size={2}>
                                                <Typography>Location</Typography>
                                            </Grid2>}
                                            
                                           {binType == "row" && <><Grid2 size={1}>
                                                <Typography>Row</Typography>
                                            </Grid2>
                                                <Grid2 size={1}>
                                                <Typography>Unit</Typography>
                                            </Grid2>
                                                <Grid2 size={1}>
                                                <Typography>Shelf</Typography>
                                            </Grid2>
                                                <Grid2 size={1}>
                                                <Typography>Bin</Typography>
                                            </Grid2></>}
                                            
                                        </Grid2>
                                    {expanded == s.blank.code && expandedColor == si.name && inventories?.sort((a,b)=>{
                                        if(a.size_name.length > b.size_name.length) return 1
                                        else if(a.size_name.length < b.size_name.length) return -1
                                        if(a.size_name > b.size_name) return -1
                                        else if(a.size_name < b.size_name) return 1
                                        else return 0
                                    }).map(i=>(
                                        <Grid2 container spacing={1} key={i._id} sx={{margin: '2%', textAlign: "center"}}>
                                            {console.log(i)}
                                            <Grid2 size={2}>
                                                <Typography>{i.size_name}</Typography>
                                            </Grid2>
                                            <Grid2 size={1}>
                                                <TextField fullWidth type="number" value={i.quantity} onChange={()=>{updateInventory({inventory: i, param:"quantity"})}}/>
                                            </Grid2>
                                            <Grid2 size={1}>
                                                <TextField fullWidth type="number"  value={i.order_at_quantity} onChange={()=>{updateInventory({inventory: i, param:"order_at_quantity"})}}/>
                                            </Grid2>
                                            <Grid2 size={1}>
                                                <TextField fullWidth type="number"  value={i.quantity_to_order} onChange={()=>{updateInventory({inventory: i, param:"quantity_to_order"})}}/>
                                            </Grid2>
                                            <Grid2 size={1}>
                                                <Typography>{i.pending_quantity}</Typography>
                                            </Grid2>
                                            <Grid2 size={1.5}>
                                                <Typography >{i.attached && i.attached.length > 0 ? i.attached.length : 0}</Typography>
                                            </Grid2>
                                           {binType == "location" && <Grid2 size={2}>
                                                <TextField fullWidth value={i.location} placeholder={"Not Set"} onChange={()=>{updateInventory({inventory: i, param:"location"})}}/>
                                            </Grid2>}
                                            {binType == "row" && <>
                                                <Grid2 size={1}>
                                                    <TextField fullWidth value={i.row} placeholder={"Not Set"} onChange={()=>{updateInventory({inventory: i, param:"row"})}}/>
                                                </Grid2>
                                                <Grid2 size={1}>
                                                    <TextField fullWidth value={i.unit} placeholder={"Not Set"} onChange={()=>{updateInventory({inventory: i, param:"unit"})}}/>
                                                </Grid2>
                                                <Grid2 size={1}>
                                                    <TextField fullWidth value={i.shelf} placeholder={"Not Set"} onChange={()=>{updateInventory({inventory: i, param:"shelf"})}}/>
                                                </Grid2>
                                                <Grid2 size={1}>
                                                    <TextField fullWidth value={i.bin} placeholder={"Not Set"} onChange={()=>{updateInventory({inventory: i, param:"bin"})}}/>
                                                </Grid2>
                                            </>}
                                        </Grid2>
                                    ))}
                                </AccordionDetails>
                            </Accordion>
                       ))}
                    </Typography>
                    </AccordionDetails>
                </Accordion>
            ))}
        </Container>
        <Box sx={{display: "flex", justifyContent: "center", alignContent:"center", margin: "1%"}}>
                <Pagination 
                count={count} 
                page={page}
                variant="outlined" 
                shape="rounded"
                renderItem={(item) => (
                    <PaginationItem
                    slots={{ previous: ArrowBackIcon, next: ArrowForwardIcon }}
                    {...item}
                    /> 
                )} 
                onChange={(event, value)=>{
                    window.location.href= `/inventory?page=${value}${query? `&q=${query}`: ""}`
                }}
                />
        </Box>
        <DisplayModal open={openDisplay} setOpen={setOpenDisplay} />
        <LoaderOverlay loading={loading}/>
        <OrderModal open={open} setOpen={setOpen} type={orderType} blanks={fullStyles} items={items} setBlanks={setFullStyles} setItems={setItems} defaultLocation={defaultLocation} setLoading={setLoading}/>
        <Footer fixed={true} />
    </Box>
}


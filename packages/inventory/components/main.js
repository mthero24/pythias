"use client";
import {useState, useEffect} from "react";
import {Box, Grid2, TextField, Accordion, Modal, AccordionSummary, AccordionDetails, Button, Typography, Card, Container} from "@mui/material";
import axios from "axios";
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
export function Main({bla, it}){
    const [fullStyles, setFullStyles] = useState(bla)
    const [styles, setStyles] = useState(bla)
    const [items, setItems] = useState(it)

    const save = async (inventory)=>{
        console.log(inventory)
        let res = await axios.post("/api/admin/inventory", {inventory})
        if(res && res.data && !res.data.error){
            setFullStyles(res.data.combined)
            setItems(res.data.items)
        }else alert("Error")
    }
    const updateInventory = async ({inventory, param})=>{
        let s = [...styles]
        console.log(s)
        let blank = s.filter(s=> s.blank._id.toString() == inventory.blank.toString())[0]
        let inv = blank.inventories.filter(iv=> iv._id.toString() == inventory._id.toString())[0]
        
        inv[param] = param != "location"? parseInt(event.target.value): event.target.value;
        setStyles([...s])
        save(inv)
    }
    return <Box>
        <Box sx={{display: "flex", flexDirection: "row", justifyContent: "space-between", padding: "2%"}}>
            <Typography variant="h3" sx={{marginLeft: "3%", marginBottom: "2%"}}>Inventory</Typography>
            <Button>Create Inventory Order</Button>
            <Button>Create Out Of Stock Order</Button>
        </Box>
        <Box sx={{display: "flex", flexDirection: "row", justifyContent: "flex-end", padding: "2%"}}>
            <Button>Orders</Button>
        </Box>
        <Container>
            <Box sx={{marginBottom: "2%"}}>
                <TextField fullWidth placeholder="Filter.." sx={{background: "white"}} onChange={()=>{
                    console.log(event.target.value.toLowerCase())
                    let s = [...fullStyles]
                    let s2 = s.filter(fs=> fs.blank?.name?.toLowerCase().includes(event.target.value?.toLowerCase()) || fs.blank?.code?.toLowerCase().includes(event.target.value?.toLowerCase()))
                    if(s2.length > 0){
                        setStyles([...s2])
                    }else{
                        setStyles([...fullStyles])
                    }
                }}/>
            </Box>
            {styles.map(s=>(
                <Accordion key={s.blank._id} sx={{marginBottom: "2%"}}>
                    <AccordionSummary
                    expandIcon={<ArrowDownwardIcon />}
                    aria-controls="panel1-content"
                    id="panel1-header"
                    >
                    <Typography component="span">{s.blank.code}  {">"} {s.blank.name} <br/>{s.blank.department}</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                    <Typography>
                       {s.blank.colors.map(si=>(
                            <Accordion key={si._id}>
                                <AccordionSummary
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
                                            <Grid2 size={1.5}>
                                                <Typography>Qty</Typography>
                                            </Grid2>
                                            <Grid2 size={1.5}>
                                                <Typography>Min</Typography>
                                            </Grid2>
                                            <Grid2 size={1.5}>
                                                <Typography>Order</Typography>
                                            </Grid2>
                                            <Grid2 size={1}>
                                                <Typography>Pend</Typography>
                                            </Grid2>
                                            <Grid2 size={1}>
                                                <Typography>Active</Typography>
                                            </Grid2>
                                            <Grid2 size={2}>
                                                <Typography>Location</Typography>
                                            </Grid2>
                                        </Grid2>
                                    {s.inventories?.filter(i=>i.color.name == si.name).map(i=>(
                                        <Grid2 container spacing={1} key={i._id} sx={{margin: '2%', textAlign: "center"}}>
                                            <Grid2 size={2}>
                                                <Typography>{i.size_name}</Typography>
                                            </Grid2>
                                            <Grid2 size={1.5}>
                                                <TextField fullWidth type="number" value={i.quantity} onChange={()=>{updateInventory({inventory: i, param:"quantity"})}}/>
                                            </Grid2>
                                            <Grid2 size={1.5}>
                                                <TextField fullWidth type="number"  value={i.order_at_quantity} onChange={()=>{updateInventory({inventory: i, param:"order_at_quantity"})}}/>
                                            </Grid2>
                                            <Grid2 size={1.5}>
                                                <TextField fullWidth type="number"  value={i.quantity_to_order} onChange={()=>{updateInventory({inventory: i, param:"quantity_to_order"})}}/>
                                            </Grid2>
                                            <Grid2 size={1}>
                                                <Typography>{i.pending_quantity}</Typography>
                                            </Grid2>
                                            <Grid2 size={1}>
                                                <Typography sx={{color: (i.quantity > items.filter(it=> it.sizeName == i.size_name && it.colorName == i.color_name && it.blank.toString() == i.blank.toString()).length)? "green": ((i.quantity + i.pending_quantity) > items.filter(it=> it.sizeName == i.size_name && it.colorName == i.color_name && it.blank.toString() == i.blank.toString()).length)? "yellow": items.filter(it=> it.sizeName == i.size_name && it.colorName == i.color_name && it.blank.toString() == i.blank.toString()).length > 0?  "red": "#000"}}>{items.filter(it=> it.sizeName == i.size_name && it.colorName == i.color_name && it.blank.toString() == i.blank.toString()).length}</Typography>
                                            </Grid2>
                                            <Grid2 size={2}>
                                                <TextField fullWidth value={i.location} placeholder={"Not Set"} onChange={()=>{updateInventory({inventory: i, param:"location"})}}/>
                                            </Grid2>
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
    </Box>
}


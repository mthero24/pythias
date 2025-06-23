import {useState, useEffect} from "react"
import {Box, Grid2, Typography, Button, Modal, TextField, FormControlLabel, Checkbox, Divider, Accordion, AccordionActions,AccordionSummary,AccordionDetails  } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LoaderOverlay from "./LoaderOverlay"
import axios from "axios";
export function OrderModal({open, setOpen, type, items, blanks, setBlanks, setItems, defaultLocation, setLoading}){
    const [needsOrdered, setNeedsOrdered] = useState([])
    const [order, setOrder] = useState({poNumber: "", company: "", dateOrdered: "", dateExpected: ""})
    const [blankCodes, setBlankCodes] = useState([])
    const [colors, setColors] = useState([])
    useEffect(()=>{
        console.log(open)
        setLoading(true)
        if(open){
            let no = []
            if(type == "Out Of Stock"){
                let bl = []
                let cl = []
                for(let blank of blanks){
                    for(let inv of blank.inventories){
                        let inStock = inv.quantity + inv.pending_quantity
                        let onOrder = items.filter(it=> it.sizeName == inv.size_name && it.colorName == inv.color_name && it.blank.toString() == inv.blank.toString()).length
                        //console.log(inStock - onOrder)
                        if(inStock - onOrder < 0) {
                            if(!bl.includes(inv.style_code))bl.push(inv.style_code)
                            if(!cl.includes(inv.color_name))cl.push(inv.color_name)
                            no.push({inv, order: (inStock - onOrder) * -1, included: true, location: defaultLocation})
                        }
                    }
                }
                setBlankCodes([...bl])
                setColors([...cl])
            }
            if(type == "Inventory Order"){
                let bl = []
                let cl = []
                for(let blank of blanks){
                    for(let inv of blank.inventories){
                        let inStock = inv.quantity + inv.pending_quantity 
                        //console.log(inStock - onOrder)
                        if(inStock - inv.order_at_quantity < 0) {
                            if(!bl.includes(inv.style_code))bl.push(inv.style_code)
                            if(!cl.includes(inv.color_name))cl.push(inv.color_name)
                            no.push({inv, order: inv.quantity_to_order + (inv.order_at_quantity - inStock) , included: true, location: defaultLocation})
                        }
                    }
                }
                setBlankCodes([...bl])
                setColors([...cl])
            }
            setNeedsOrdered([...no])
        }
        setLoading(false)
    }, [open])
    const updateOrder = (param)=>{
        let o = {...order}
        o[param] = event.target.value
        setOrder({...o})
    }
    const updateOrderItems = (id, param)=>{
        let no = [...needsOrdered]
        let inv = no.filter(n=> n.inv._id.toString() == id.toString())[0]
        if(param == "order") inv[param] = parseInt(event.target.value)
        else if(param == "included") inv[param] = !inv[param]
        else inv[param] = event.target.value
        setNeedsOrdered([...no])
    }
    const sub = async ()=>{
        if(order.poNumber && order.company){
            let res = await axios.post("/api/admin/inventory/order", {order, needsOrdered, items: type == "Inventory Order"? []: items})
            if(res && res.data){
                setBlanks(res.data.combined);
                setItems(res.data.items)
                setOpen(false)
            }
        }
        else alert("missing information")

    }
    const style = {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: "90%",
        bgcolor: 'background.paper',
        border: '2px solid #000',
        boxShadow: 24,
        p: 4,
        height: "90%",
        overflow: "auto"
    };
    return (
        <Modal
        open={open}
        onClose={()=>{setOpen(false)}}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
            <Typography id="modal-modal-title" variant="h6" component="h2">
                Order {type}
            </Typography>
            <Divider sx={{marginBottom: "3%"}}/>
            <Box>
                <Box>
                    <Grid2 container spacing={1}>
                        <Grid2 size={6}>
                            <TextField fullWidth label="PO Number" onChange={()=>{updateOrder("poNumber")}} value={order.poNumber}/>
                        </Grid2>
                        <Grid2 size={6}>
                            <TextField fullWidth label="Company" onChange={()=>{updateOrder("company")}} value={order.company}/>
                        </Grid2>
                        <Grid2 size={6}>
                            <Typography>Date Ordered</Typography>
                            <TextField type="date" fullWidth placeholder="Date Ordered" onChange={()=>{updateOrder("dateOrdered")}} value={order.dateOrdered}/>
                        </Grid2>
                        <Grid2 size={6}>
                            <Typography>Expected Delivery Date</Typography>
                            <TextField type="date" fullWidth placeholder="Date Expected" onChange={()=>{updateOrder("dateExpected")}} value={order.dateExpected}/>
                        </Grid2>
                    </Grid2>
                    <Divider sx={{marginTop: "3%"}}/>
                </Box>
                {blankCodes.map(code=>(
                    <Accordion key={code}>
                        <AccordionSummary
                            expandIcon={<ExpandMoreIcon />}
                            aria-controls="panel1-content"
                            id="panel1-header"
                            >
                            <Typography component="span">{code}</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            {colors.map(cl=>{
                                if(needsOrdered.filter(f=> f.inv.color_name == cl && f.inv.style_code == code).length > 0){
                                    return (
                                        <Accordion key={cl._id}>
                                            <AccordionSummary
                                            expandIcon={<ExpandMoreIcon />}
                                            aria-controls="panel1-content"
                                            id="panel1-header"
                                            >
                                            <Typography component="span">{cl}</Typography>
                                            </AccordionSummary>
                                            <AccordionDetails>
                                                {needsOrdered.filter(f=> f.inv.color_name == cl && f.inv.style_code == code).map(no=>(
                                                    <Grid2 container spacing={1} key={no.inv._id} sx={{padding: "2%"}}>
                                                        <Grid2 size={2}>
                                                            <FormControlLabel control={<Checkbox checked={no.included} onClick={()=>{
                                                                updateOrderItems(no.inv._id, "included")
                                                            }} />} />
                                                        </Grid2>
                                                        <Grid2 size={5}>
                                                            <Typography sx={{marginTop:"5%"}}>{no.inv.style_code}-{no.inv.color_name}-{no.inv.size_name}</Typography>
                                                        </Grid2>
                                                        <Grid2 size={2}>
                                                            <TextField type="number" onChange={()=>{
                                                                updateOrderItems(no.inv._id, "order")
                                                            }}  value={no.order}/>
                                                        </Grid2>
                                                        <Grid2 size={3}>
                                                            <TextField type="string" onChange={()=>{
                                                                updateOrderItems(no.inv._id, "location")
                                                            }}  value={no.location}/>
                                                        </Grid2>
                                                    </Grid2>
                                                ))}
                                            </AccordionDetails>
                                        </Accordion>
                                    )
                                }
                            })}
                        </AccordionDetails>
                    </Accordion>
                ))}
                <Divider sx={{marginTop: "3%"}}/>
                <Button onClick={()=>{sub()}} fullWidth>Submit</Button>
            </Box>
        </Box>
      </Modal>
    )
}
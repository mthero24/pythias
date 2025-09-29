import {useState, useEffect} from "react"
import {Box, Grid2, Typography, Button, Modal, TextField, FormControlLabel, Checkbox, Divider, Accordion, AccordionActions,AccordionSummary,AccordionDetails  } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { CircularProgress } from '@mui/material'
import axios from "axios";
export function OrderModal({open, setOpen, type, items, setBlanks, setItems, defaultLocation,}){
    const [needsOrdered, setNeedsOrdered] = useState([])
    const [order, setOrder] = useState({poNumber: "", company: "", dateOrdered: "", dateExpected: ""})
    const [blankCodes, setBlankCodes] = useState([])
    const [colors, setColors] = useState([])
    const [blanks, setBlan] = useState([])
    const [loading, setLoading] = useState(false)
    const [blanksExcluded, setBlanksExcluded] = useState([])
    const [blankColorsExcluded, setBlankColorsExcluded] = useState({})
    useEffect(()=>{
        console.log(open)
        const getBlanks = async()=>{
            setLoading(true)
           let res = await axios.get("/api/admin/inventory/create-order")
            if(res && res.data){
                setBlan(res.data.blanks)
            }
        }
        if(open){
            console.log(loading)
            if(blanks.length == 0)getBlanks()
            let no = []
            if(type == "Out Of Stock"){
                let bl = []
                let cl = []
                for(let blank of blanks){
                    for(let inv of blank.inventories){
                        let onOrder = (inv.attached ? inv.attached.length : 0)
                        //console.log(inStock - onOrder)
                        if(onOrder > 0) {
                            if(!bl.includes(inv.style_code))bl.push(inv.style_code)
                            if(!cl.includes(inv.color_name))cl.push(inv.color_name)
                            no.push({inv, order: (onOrder), included: true, location: defaultLocation})
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
            if(blanks && blanks.length > 0){
                setLoading(false)
            }
        }
    }, [open, blanks])
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
            {!loading && <Box>
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
                            <FormControlLabel control={<Checkbox checked={blanksExcluded.includes(code)? false: true} />} onClick={()=>{
                                let no = [...needsOrdered]
                                let bE = [...blanksExcluded]
                                if(blanksExcluded.includes(code)){
                                    bE = bE.filter(b=> b != code)
                                    let bC = { ...blankColorsExcluded }
                                    bC[code] = []
                                    let invs = no.filter(n => n.inv.style_code == code)
                                    invs.forEach(i => {
                                        if(!i.included) updateOrderItems(i.inv._id, "included")
                                    })
                                    setBlankColorsExcluded({ ...bC })
                                    setBlanksExcluded([...bE])
                                }else{
                                    bE.push(code)
                                    setBlanksExcluded([...bE])
                                    let invs = no.filter(n => n.inv.style_code == code)
                                    let bC = { ...blankColorsExcluded }
                                    if (!bC[code]) bC[code] = []
                                    invs.forEach(i => {
                                        if (!bC[code].includes(i.inv.color_name)) {
                                            bC[code].push(i.inv.color_name)
                                        }
                                        if(i.included) updateOrderItems(i.inv._id, "included")
                                    })
                                    setBlankColorsExcluded({ ...bC })
                                }
                                
                            }} />
                            <Typography component="span" sx={{marginTop: ".8%"}}> {code}</Typography>
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
                                                <FormControlLabel control={<Checkbox checked={blankColorsExcluded[code]?.includes(cl)? false: true} />} onClick={()=>{
                                                    let no = [...needsOrdered]
                                                    let bC = { ...blankColorsExcluded }
                                                    if (!bC[code]) bC[code] = []
                                                    if (bC[code].includes(cl)) {
                                                        bC[code] = bC[code].filter(c => c !== cl)
                                                        no.forEach(i => {
                                                            if (i.inv.color_name === cl && i.inv.style_code === code) {
                                                                if(!i.included) updateOrderItems(i.inv._id, "included")
                                                            }
                                                        })
                                                    } else {
                                                        bC[code].push(cl)
                                                        no.forEach(i => {
                                                            if (i.inv.color_name === cl && i.inv.style_code === code) {
                                                                if (i.included) updateOrderItems(i.inv._id, "included")
                                                            }
                                                        })
                                                    }
                                                    setBlankColorsExcluded({ ...bC })
                                                }}/>
                                                <Typography component="span" sx={{ marginTop: ".8%" }}>{cl}</Typography>
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
                <Typography sx={{ marginTop: "2%" }}>Total Item To Order: {needsOrdered.map(no => no.order).reduce((accumulator, currentValue) => accumulator + currentValue, 0)}</Typography> 
                <Divider sx={{marginTop: "3%"}}/>
                <Button onClick={()=>{sub()}} fullWidth>Submit</Button>
            </Box>}
            {loading && <Box sx={{display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center"}}><CircularProgress color="#e2e2e2" size={100} />
                  <Typography variant="h6" sx={{ display: "block", color: "#e2e2e2", marginTop: "20px", fontSize: "2.6rem", fontWeight: "bold" }}>
                    Loading...</Typography></Box>}
        </Box>
      </Modal>
    )
}
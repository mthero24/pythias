import {useState, useEffect} from "react"
import {Box, Grid2, Typography, Button, Modal, TextField, FormControlLabel, Checkbox, Divider, Accordion, AccordionActions,AccordionSummary,AccordionDetails  } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import axios from "axios";
export function DisplayModal({open, setOpen, type, items, blanks, setBlanks, setItems}){
    const [orders, setOrders] = useState([])
    useEffect(()=>{
       const getOrders = async ()=>{
            let res = await axios.get("/api/admin/inventory/order")
            if(res && res.data){
                console.log(res.data.orders)
                setOrders(res.data.orders)
            }
       }
       getOrders()
    }, [open])
    const markReceived = async ({order, location})=>{
        console.log(order, location)
        let res = await axios.put("/api/admin/inventory/order", {id: order._id, location: location.name})
        if(res){
            setOrders(res.data.orders)
        }
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
        height: "600px",
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
                {orders && orders.map(o=>(
                   <Accordion key={o._id}>
                        <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        aria-controls="panel1-content"
                        id="panel1-header"
                        >
                            <Grid2 container spacing={1}>
                                <Grid2 size={12}>
                                    <Typography sx={{width: "100%"}}>{o.poNumber}</Typography>
                                </Grid2>
                            </Grid2>
                        </AccordionSummary>
                        <AccordionDetails>
                           <Grid2 container spacing={1}>
                                <Grid2 size={4}>
                                    {o.vendor}
                                </Grid2>
                                <Grid2 size={4}>
                                    {new Date(o.dateOrdered).toLocaleDateString("En-us")}
                                </Grid2>
                                <Grid2 size={4}>
                                    {o.dateExpected && new Date(o.dateOrdered).toLocaleDateString("En-us")}
                                </Grid2>
                                <Grid2 size={12}>
                                    {o.locations.map(l=>(
                                        <Accordion key={l._id}>
                                            <AccordionSummary
                                            expandIcon={<ExpandMoreIcon />}
                                            aria-controls="panel1-content"
                                            id="panel1-header"
                                            >
                                            <Typography component="h2" sx={{width: "100%"}}>{l.name.replace(/ /g, "")}</Typography>
                                            </AccordionSummary>
                                            <AccordionDetails>
                                                <Box sx={{display: "flex", flexDirection: "row", justifyContent: "flex-end"}}>
                                                    {!l.received && <Button onClick={()=>{markReceived({order:o, location:l})}}>Receive</Button>}
                                                    {l.received && <Typography fontSize="1.3rem" fontWeight="bold">Already Received</Typography>}
                                                </Box>
                                                <Box sx={{display: "flex", flexDirection: "column", justifyContent: "center"}}>
                                                    
                                                        {l.items?.map(i=>(
                                                            <Grid2 container spacing={2}>
                                                                <Grid2 size={4}>
                                                                    <Typography>{i.inventory.style_code}-{i.inventory.color_name}-{i.inventory.size_name}</Typography>
                                                                </Grid2>
                                                                <Grid2 size={4}>
                                                                    <Typography>{i.quantity}</Typography>
                                                                </Grid2>
                                                                <Grid2 size={4}>
                                                                    <Typography>{l.name}</Typography>
                                                                </Grid2>
                                                                </Grid2>
                                                        ))}
                                                   
                                                </Box>
                                            </AccordionDetails>
                                        </Accordion>
                                    ))}
                                </Grid2>
                           </Grid2>
                        </AccordionDetails>
                    </Accordion>
                ))}  
            </Box>
        </Box>
      </Modal>
    )
}
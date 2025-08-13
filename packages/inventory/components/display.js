import {useState, useEffect} from "react"
import { Box, Grid2, Typography, Button, Modal, Card, CardContent, CardActions, Divider, Accordion, AccordionDetails, AccordionSummary } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import axios from "axios";
export function DisplayModal({open, setOpen, type, items, blanks, setBlanks, setItems}){
    const [orders, setOrders] = useState([])
    const [check,setCheck] = useState(false)
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
        let res = await axios.put("/api/admin/inventory/order", {id: order._id, location: location.name}).catch(e=>{alert("something went wrong marking order received do not click receive again contact support")})
        if(res && res.data && res.data.error == false){
            setOrders(res.data.orders)
        }else{
            alert("something went wrong marking order received do not click receive again contact support")
        }
    }
    const style = {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: "95%",
        bgcolor: 'background.paper',
        border: '2px solid #000',
        boxShadow: 24,
        p: 4,
        height: "95%",
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
            <Grid2 container spacing={1}>
                {orders && orders.map(o=>(
                    <Grid2 size={{xs: 12, sm: 12}} key={o._id}>
                        <Card>
                            <CardContent>
                                <Typography component="h2" sx={{width: "100%"}}>{o.poNumber}</Typography>
                                <Typography>{o.vendor}</Typography>
                                <Typography>{new Date(o.dateOrdered).toLocaleDateString("En-us")}</Typography>
                                {o.dateExpected && <Typography>{new Date(o.dateExpected).toLocaleDateString("En-us")}</Typography>}
                            </CardContent>
                            <Divider/>
                            <CardContent>
                                {o.locations.map(l => (
                                    <Accordion key={l._id}>
                                        <AccordionSummary
                                            expandIcon={<ExpandMoreIcon />}
                                            aria-controls="panel1-content"
                                            id="panel1-header"
                                        >
                                            <Typography component="h2" sx={{ width: "100%" }}>{l.name.replace(/ /g, "")}</Typography>
                                        </AccordionSummary>
                                        <AccordionDetails>
                                            <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "flex-end" }}>
                                                {!l.received && <Button onClick={() => { setCheck(true) }}>Receive</Button>}
                                                {l.received && <Typography fontSize="1.3rem" fontWeight="bold">Already Received</Typography>}
                                            </Box>
                                            <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>

                                                {l.items?.map(i => (
                                                    <Grid2 container spacing={2}>
                                                        <Grid2 size={4}>
                                                            <Typography>{i.inventory?.style_code}-{i.inventory?.color_name}-{i.inventory?.size_name}</Typography>
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
                            </CardContent>
                        </Card>
                    </Grid2>
                ))}  
            </Grid2>
            <CheckModal open={check} setOpen={setCheck} markReceived={markReceived}/>
        </Box>
      </Modal>
    )
}

const CheckModal = ({open, setOpen, markReceived})=>{
    const style = {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: "30%",
        bgcolor: 'background.paper',
        border: '2px solid #000',
        boxShadow: 24,
        p: 4,
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
            <Divider sx={{marginBottom: "3%"}}/>
            <Box>
                <Typography>Make sure you have the correct order selected.</Typography>
                <Button onClick={()=>{markReceived()}}>Mark Received</Button>
                <Button onClick={()=>{setOpen(false)}}>Cancel</Button>
            </Box>
        </Box>
      </Modal>
    )
}
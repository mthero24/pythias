"use client";
import {Card, Button, Typography, Grid2, Box} from "@mui/material"
import axios from "axios"
import {useState} from "react"

export function Refund({ords, pa}){
    const [page, setPage] = useState(pa? pa: 1)
    const [orders, setOrders] = useState(ords)
    const refund = async({order, label})=>{
        let res = await axios.post("/api/production/shipping/refund", {order, label, page})
        console.log(res)
        if(res.data.orders) setOrders(res.data.orders)
    }
    const hide = async({order, label})=>{
        let res = await axios.put("/api/production/shipping/refund", {order, label, page})
        console.log(res)
        if(res.data.orders) setOrders(res.data.orders)
    }
    return (
        <Box sx={{padding: "3%", background: "#e2e2e2"}}>
            <Card sx={{padding: "3%"}}>
                <Grid2 container spacing={2}>
                    <Grid2 size={1}>
                        <Typography>Order Date</Typography>
                    </Grid2>
                    <Grid2 size={2}>
                        <Typography>PO Number</Typography>
                    </Grid2>
                    <Grid2 size={2}>
                        <Typography>Tracking Number</Typography>
                    </Grid2>
                    <Grid2 size={4}>
                        <Typography>Last Scan</Typography>
                    </Grid2>
                    <Grid2 size={1}>
                        <Typography>Delivered</Typography>
                    </Grid2>
                </Grid2>
            </Card>
            <Card sx={{minHeight: "95vh"}}>
                {orders.map((o, i)=>(
                    o.shippingInfo.labels.filter(l=> !l.delivered ).map(l=>(
                        <Card key={l._id} sx={{padding: "3%", background: (i % 2 == 0? "#d2d2d2": "#fff")}}>
                            <Grid2 container spacing={2}>
                                <Grid2 size={1}>
                                    <Typography>{new Date(o.date).toLocaleDateString("en-US")}</Typography>
                                </Grid2>
                                <Grid2 size={2}>
                                    <Typography>{o.poNumber}</Typography>
                                </Grid2>
                                <Grid2 size={3}>
                                    <Typography>{l.trackingNumber}</Typography>
                                </Grid2>
                                <Grid2 size={3}>
                                    <Typography>{l.trackingInfo[0]}</Typography>
                                </Grid2>
                                <Grid2 size={1}>
                                    <Typography>{l.delivered? "true": "false"}</Typography>
                                </Grid2>
                                <Grid2 size={2}>
                                    <Button fullWidth sx={{background: "red", color: "#fff", margin: "1% 0%"}} onClick={()=>{refund({order: o, label: l})}}>Refund</Button>
                                    <Button fullWidth sx={{background: "blue", color: "#fff",margin: "1% 0%"}} onClick={()=>{hide({order: o, label: l})}}>Hide</Button>
                                </Grid2>
                            </Grid2>
                        </Card>
                    ))
                ))}
            </Card>
        </Box>
    )
}
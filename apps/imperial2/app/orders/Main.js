"use client";
import {Card, Typography, Box, Grid2, TextField, Pagination, PaginationItem, Link,} from "@mui/material"
import {useState} from "react"
import { useRouter } from "next/navigation";
import axios from "axios";
export function Main({ords, pages, page, q}){
    const router = useRouter()
    const [orders, setOrders] = useState(ords)
    const [search, setSearch] = useState(q)
    const performSearch = async()=>{
        let res = await axios.post("/api/orders", {search})
        if(res.data.error) alert(res.data.msg)
        else{
            setOrders(res.data.orders)
        }
    }
    const handleChange = (event, value) => {
        console.log(value)
        location.href = `/orders?page=${value}`
      };
    return (
        <Box sx={{padding: "3%", background: "#e2e2e2"}}>
             <Card sx={{padding: "2%", margin: "1% 0%"}}>
                <TextField placeholder="...Search" fullWidth onChange={()=>{setSearch(event.target.value)}} onKeyDown={()=>{if(event.key == 13 || event.key == "Enter") performSearch()}} />
            </Card>
            <Card sx={{minHeight: "100vh"}}>
            <Card sx={{padding: "3%", margin: "1% 1%", textAlign: "center"}} > 
                    <Grid2 container>
                            <Grid2 size={4}>
                                <Typography>PO Number</Typography>
                            </Grid2>
                            <Grid2 size={4}>
                                <Typography>Status</Typography>
                            </Grid2>
                            <Grid2 size={2}>
                                <Typography>#Items</Typography>
                            </Grid2>
                            <Grid2 size={2}>
                                <Typography>Date</Typography>
                            </Grid2>
                        </Grid2>
                    </Card>
                {orders.map(o=>(
                    <Card key={o.poNumber} sx={{padding: "3%", margin: "1% 1%", textAlign: "center", cursor: "pointer", background: o.items.map(i=> {
                        if(o.status != "shipped" && (i.design == undefined || Object.keys(i.design).length == 0) || i.color == undefined || i.size == undefined || i.blank == undefined) {
                            return true
                        }
                    }).filter(j=> j!= undefined).length > 0? "red": ""}} onClick={()=>router.push(`/orders/${o._id}`)}> 
                        <Grid2 container >
                            <Grid2 size={4}>
                                <Typography>{o.poNumber}</Typography>
                            </Grid2>
                            <Grid2 size={4}>
                                <Typography>{o.status}</Typography>
                            </Grid2>
                            <Grid2 size={2}>
                                <Typography>{o.items.length}</Typography>
                            </Grid2>
                            <Grid2 size={2}>
                                <Typography>{new Date(o.date).toLocaleDateString("en-US")}</Typography>
                            </Grid2>
                        </Grid2>
                    </Card>
                ))}
                <Box sx={{padding: "2%", display: "flex", flexDirection: "row", justifyContent: "center"}}>
                    <Pagination count={pages? pages: 20} color="secondary" size="large" boundaryCount={2} defaultPage={page? page: 1} 
                    onChange={handleChange}
                    />
                </Box>
            </Card>
        </Box>
    )
}

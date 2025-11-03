"use client";
import {Card, Typography, Box, Grid2, TextField, Pagination, PaginationItem, Link, Container, Grid} from "@mui/material"
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import {useState} from "react"
import { useRouter } from "next/navigation";
import Image from "next/image";
import axios from "axios";
export function Main({ords, pages, page, q, filter}){
    const router = useRouter()
    const [orders, setOrders] = useState(ords)
    const [search, setSearch] = useState(q)
    const [opened, setOpened] = useState("")
    const performSearch = async()=>{
        let res = await axios.post("/api/orders", {search})
        if(res.data.error) alert(res.data.msg)
        else{
            console.log(res.data.orders)
            setOrders(res.data.orders)
        }
    }
    const handleChange = (event, value) => {
        console.log(value)
        location.href = `/orders?page=${value}${filter? `&filter=${filter}`: ""}`
      };
    return (
        <Box sx={{padding: "3%", background: "#e2e2e2"}}>
            <Container maxWidth="lg">
                <Grid2 container spacing={2} sx={{marginBottom: "1%"}}>
                    <Grid2 size={{xs: 12, md: 3}}>
                        <Card sx={{padding: "2%", margin: "1% 0%", position: "sticky", top: "1%"}}>
                            <TextField placeholder="...Search" fullWidth onChange={()=>{setSearch(event.target.value)}} onKeyDown={()=>{if(event.key == 13 || event.key == "Enter") performSearch()}} />
                            <Box sx={{marginTop: "1%", padding: "1%", textAlign: "center"}}>
                                <Typography sx={{ cursor: "pointer", color: "blue" }} onClick={() => {
                                    location.href = "/orders?page=1&filter=missinginfo"
                                }}>Missing Information</Typography>
                                <Typography sx={{ cursor: "pointer", color: "blue" }} onClick={()=>{
                                    location.href= "/orders?page=1&filter=blank"
                                }}>Includes Blank Items</Typography>
                            </Box>
                        </Card>
                    </Grid2>
                    <Grid2 size={{ xs: 12, md: 9 }}>
                        <Card sx={{minHeight: "100vh"}}>
                        <Card sx={{padding: "3%", margin: "1% 1%", textAlign: "center"}} > 
                                <Grid2 container>
                                        <Grid2 size={{xs: 6, md: 3}}>
                                            <Typography>PO Number</Typography>
                                        </Grid2>
                                    <Grid2 size={{xs: 0, md: 3}} sx={{ display: { xs: "none", md: "block" } }}>
                                            <Typography>Status</Typography>
                                        </Grid2>
                                        <Grid2 size={2}>
                                            <Typography>#Items</Typography>
                                        </Grid2>
                                        <Grid2 size={2} sx={{display: {xs: "none", md: "block"}}}>
                                            <Typography>Date</Typography>
                                        </Grid2>
                                        <Grid2 size={1}>
                                            <Typography>Total</Typography>
                                        </Grid2>
                                    </Grid2>
                                </Card>
                            {orders.map(o=>(
                                <Card key={o.poNumber} sx={{padding: "3%", margin: "1% 1%", textAlign: "center", cursor: "pointer", background: o.items.map(i=> {
                                    if (o.status != "shipped" && ((i.design == undefined && !i.isBlank) || (Object.keys(i.design? i.design: {}).length == 0 && !i.isBlank)) || i.color == undefined || i.size == undefined || i.sizeName == undefined || i.blank == undefined) {
                                        return true
                                    }
                                }).filter(j=> j!= undefined).length > 0? "red": ""}}> 
                                    <Grid2 container >
                                        <Grid2 size={{ xs: 6, md: 3 }} onClick={() => router.push(`/orders/${o._id}`)}>
                                            <Typography sx={{textWrap: "none", textOverflow: "ellipsis", overflow: "hidden"}}>{o.poNumber}</Typography>
                                        </Grid2>
                                        <Grid2 size={{ xs: 0, md: 3 }} sx={{ display: { xs: "none", md: "block" } }} onClick={() => router.push(`/orders/${o._id}`)}>
                                            <Typography>{o.status}</Typography>
                                        </Grid2>
                                        <Grid2 size={2} onClick={() => router.push(`/orders/${o._id}`)}>
                                            <Typography>{o.items.length}</Typography>
                                        </Grid2>
                                        <Grid2 size={2} sx={{ display: { xs: "none", md: "block" } }} onClick={() => router.push(`/orders/${o._id}`)}>
                                            <Typography>{new Date(o.date).toLocaleDateString("en-US")}</Typography>
                                        </Grid2>
                                        <Grid2 size={1} onClick={() => router.push(`/orders/${o._id}`)}>
                                            <Typography>${parseFloat(o.total).toFixed(2)}</Typography>
                                        </Grid2>
                                        <Grid2 size={1}>
                                            <Box sx={{display: "flex", flexDirection: "row", justifyContent: "center"}} onClick={()=>{
                                                if(opened == o._id) setOpened("")
                                                else setOpened(o._id)
                                            }}>
                                                {opened == o._id ? <ArrowDropUpIcon sx={{cursor: "pointer"}} /> : <ArrowDropDownIcon sx={{cursor: "pointer"}}/>}
                                            </Box>
                                        </Grid2>
                                        {opened == o._id && 
                                            <Grid2 size={12} sx={{padding: "1%", textAlign: "center"}}>
                                                <Grid2 container>
                                                    <Grid2 size={12} sx={{padding: "1%", textAlign: "center"}}>
                                                        <Typography sx={{fontWeight: "bold", fontSize: ".9rem", textAlign: "center"}}>Marketplace: {o.marketplace}</Typography>
                                                    </Grid2>
                                                </Grid2>
                                                {o.items.map((i, index)=> (
                                                    
                                                    <Grid2 container key={index} sx={{borderTop: "1px solid grey", marginTop: "1%", paddingTop: "1%", fontSize: ".9rem", textAlign: "center"}} spacing={1}>
                                                        <Grid2 size={.8}>
                                                            {Object.keys(i.design ? i.design : {}).filter(k => i.design[k] != undefined).map(key => (
                                                                <Image key={key} src={`/api/renderImages/${i.styleCode}-${i.colorName}-${key}.jpg?blank=${i.styleCode}&colorName=${i.colorName}&design=${i.design[key]}&width=100&side=${key}`} alt={i.sku} width={100} height={100} style={{ width: "100%", height: "auto" }} />
                                                            ))}
                                                        </Grid2>
                                                        <Grid2 size={4} sx={{textWrap: "none", textOverflow: "ellipsis", overflow: "hidden"}}>
                                                            <Typography sx={{textWrap: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontSize: "small"}}>{i.name}</Typography>
                                                            <Typography sx={{ textWrap: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontSize: "small" }}>{i.sku}</Typography>
                                                            <Typography sx={{ textWrap: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontSize: "small" }}>{i.upc}</Typography>
                                                        </Grid2>
                                                        <Grid2 size={2.3}>
                                                            <Typography sx={{ textAlign: "left", padding: "10%", fontSize: "small" }}>Color: {i.colorName}</Typography>
                                                        </Grid2>
                                                        <Grid2 size={2.3}>
                                                            <Typography sx={{ textAlign: "left", padding: "10%", fontSize: "small" }}> Size: {i.sizeName}</Typography>
                                                        </Grid2>
                                                        <Grid2 size={2.3}>
                                                            <Typography sx={{ textAlign: "left", padding: "10%", fontSize: "small" }}> Blank: {i.styleCode}</Typography>
                                                        </Grid2>
                                                    </Grid2>
                                                ))}
                                            </Grid2>
                                        }
                                    </Grid2>
                                </Card>
                            ))}
                            <Box sx={{padding: "2%", display: "flex", flexDirection: "row", justifyContent: "center"}}>
                                <Pagination count={pages? pages: 20} color="secondary" size="large" boundaryCount={2} defaultPage={page? page: 1} 
                                onChange={handleChange}
                                />
                            </Box>
                        </Card>
                    </Grid2>
                </Grid2>
            </Container>
        </Box>
    )
}

"use client";
import {Box, Grid2, Typography, Card, Button, Container} from "@mui/material";
import {useState, useEffect} from "react";
import Image from "next/image"
import axios from "axios";
import Link from "next/link";
import { Uploader } from "@/components/premier/uploader";
import Theme from "@/components/Theme";
import Search from "./Search";
export function Main({designs, count, query, pa}){
    const [designss, setDesigns] = useState(designs)
    const [search, setSearch] = useState(query)
    const [page, setPage] = useState(pa? pa: 1)
    const [hasMore, setHasMore] = useState(true)
    const [checked, setChecked] = useState([])
    let updateDesign = async (des)=>{
        let res = await axios.put("/api/admin/designs", {design: {...des}}).catch(e=>{console.log(e.response.data); res = e.response})
        if(res?.data?.error) alert(res.data.msg)
    }
    useEffect(()=>{
        const getDesigns = async ()=>{
            let res = await axios.get(`/api/admin/designs?${search != "" && search != undefined? `q=${search}&`: ""}page=${page}`)
            if(res.data.error) alert(res.data.msg)
            else {
                console.log(res.data.designs.length)
                if(res.data.designs.length < 200) setHasMore(false)
                let ds = designss.concat(res.data.designs)
                console.log(ds.length)
                setDesigns([...ds])
            }
            setPerform(false)
        }
        if(page != 1 && page != undefined){
            getDesigns()
        }
    },[page])
    const createDesign = async()=>{
        let res = await axios.post("/api/admin/designs", {})
        if(res.data.error) alert(res.data.msg)
        else{
            location.href=`/admin/design/${res.data.design._id}`
        }
    }
    return (
        <Box sx={{padding: "1%", color: "black", minHeight: "vh",}}>
            <Container mazWidth="lg">
                <Box sx={{display: "flex",justifyContent: "space-between", padding: "1%"}}>
                    <Typography>There are total of {count} Designs</Typography>
                    <Button onClick={()=>{createDesign()}} sx={{background: Theme.colors.primary, color: "#ffffff", width: "100px", height: "30px", marginTop: ".8%", "&:hover": {background: Theme.colors.support}}}>Create</Button>
                </Box>
                <Search setSearch={setSearch} setDesigns={setDesigns} setHasMore={setHasMore} setPage={setPage} search={search}/>
                <Card sx={{width: "100%", height: "auto", padding: "1%", marginTop: "1%"}}>
                    <Box sx={{ minHeight: "80vh",}}>
                        <Grid2 container spacing={2}>
                            {designss && designss.map(d=>(
                                <Grid2 key={d._id} size={{xs: 6, sm: 4, md: 3}}>
                                    <Card sx={{width: "100%", padding: "3%", borderRadius: "9px", cursor: "pointer", height: "100%"}}>
                                        <Link href={`/admin/design/${d._id}`} target="_blank">
                                            <Box sx={{ padding: "3%", background: "#e2e2e2", height: { sm: "250px", md: "300px", lg: "350px" }, minHeight: "250px", display: "flex", alignItems: "center", justifyContent: "center"}}>
                                                <Image src={d.images && d.images[Object.keys(d.images)[0]] ? `${d.images[Object.keys(d.images)[0]]?.replace("images1.pythiastechnologies.com", "images2.pythiastechnologies.com/origin")}?width=400`: "/missingImage.jpg"} width={400} height={400} alt={`${d.name} ${d.sku} design`} style={{width: "100%", height: "auto", maxHeight: "250px", background: "#e2e2e2"}}/>
                                            </Box>
                                            <hr/>
                                            <Box sx={{padding: "3%"}}>
                                                <Typography sx={{fontSize: '0.8rem', color: "black"}}>SKU: {d.sku}</Typography>
                                                <Typography sx={{fontSize: '0.8rem', color: "black"}}>{d.name}</Typography>
                                            </Box>
                                        </Link>
                                        {console.log(d)}
                                        {(d.sendToMarketplaces == false || d.sendToMarketplaces == undefined) && !checked.includes(d._id.toString()) && <Button onClick={()=>{
                                            console.log(d)
                                            d.sendToMarketplaces = true
                                            console.log(d)
                                            updateDesign({...d})
                                            let c = [...checked]
                                            c.push(d._id.toString)
                                            setChecked(c)
                                        }}>Resend To Market Places</Button>}
                                    </Card>                                
                                </Grid2>
                            ))}
                        </Grid2>
                        {hasMore && <Button onClick={()=>{setPage(page + 1)}} fullWidth>Next Page</Button>}
                    </Box>
                </Card>
            </Container>
        </Box>
    )
}
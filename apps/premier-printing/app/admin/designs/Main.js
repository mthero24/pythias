"use client";
import {Box, Grid2, Typography, Card, Button, TextField} from "@mui/material";
import {useState, useEffect} from "react";
import Image from "next/image"
import axios from "axios";
import Link from "next/link";
import { Uploader } from "@/components/premier/uploader";
import Theme from "@/components/Theme";
export function Main({designs, count, query, pa}){
    const [designss, setDesigns] = useState(designs)
    const [search, setSearch] = useState(query)
    const [page, setPage] = useState(pa? pa: 1)
    const [perform, setPerform] = useState(false)
    const [hasMore, setHasMore] = useState(true)
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
    useEffect(()=>{
        const getDesigns = async ()=>{
            setPage(1)
            let res = await axios.get(`/api/admin/designs?${search != "" && search != undefined? `q=${search}&`: ""}page=${1}`)
            if(res.data.error) alert(res.data.msg)
            else {
                if(res.data.designs.length < 200) setHasMore(false)
                setDesigns([...res.data.designs])
            }
            setPerform(false)
        }
        if(perform){
            setHasMore(true)
            getDesigns()
        }
    },[perform])
    const createDesign = async()=>{
        let res = await axios.post("/api/admin/designs", {})
        if(res.data.error) alert(res.data.msg)
        else{
            location.href=`/admin/design/${res.data.design._id}`
        }
    }
    return (
        <Box sx={{padding: "1%", color: "black", minHeight: "vh",}}>
            <Box sx={{display: "flex",justifyContent: "space-between", padding: "1%"}}>
                <Typography>There are total of {count} Designs</Typography>
                <Button onClick={()=>{createDesign()}} sx={{background: Theme.colors.primary, color: "#ffffff", width: "100px", height: "30px", marginTop: ".8%", "&:hover": {background: Theme.colors.support}}}>Create</Button>
            </Box>
            <Card sx={{width: "100%", padding: "1%"}}>
                <TextField label="Search..." fullWidth onChange={()=>{setSearch(event.target.value)}} onKeyDown={()=>{if(event.key == 13 || event.key == "Enter") setPerform(true)}}/>
            </Card>
            <Card sx={{width: "100%", height: "auto", padding: "1%", marginTop: "1%"}}>
                <Box sx={{ minHeight: "80vh",}}>
                    <Grid2 container spacing={2}>
                        {designss && designss.map(d=>(
                            <Grid2 key={d._id} size={{xs: 6, sm: 4, md: 3}}>
                                <Link href={`/admin/design/${d._id}`}>
                                    <Card sx={{width: "100%", padding: "3%", borderRadius: "9px", cursor: "pointer", height: "100%"}}>
                                        <Box sx={{padding: "1% 3%", maxHeight: "250px", minHeight: "250px", height: "250px", background: "#e2e2e2"}}>
                                            <Image src={d.images?.front? d.images.front: d.images?.back? d.images?.back: d.images?.leftSleeve? d.images?.leftSleeve: d.images?.rightSleeve? d.images?.rightSleeve: d.images?.pocket? d.images?.pocket: "/missingImage.jpg"} width={150} height={150} alt={`${d.name} ${d.sku} design`} style={{width: "100%", height: "auto", maxHeight: "250px", background: "#e2e2e2"}}/>
                                        </Box>
                                        <hr/>
                                        <Box sx={{padding: "3%"}}>
                                            <Typography sx={{fontSize: '0.8rem', color: "black"}}>SKU: {d.sku}</Typography>
                                            <Typography sx={{fontSize: '0.8rem', color: "black"}}>{d.name}</Typography>
                                        </Box>
                                    </Card>
                                </Link>
                            </Grid2>
                        ))}
                    </Grid2>
                    {hasMore && <Button onClick={()=>{setPage(page + 1)}} fullWidth>Next Page</Button>}
                </Box>
            </Card>
        </Box>
    )
}
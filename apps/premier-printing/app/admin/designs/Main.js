"use client";
import {Box, Grid2, Typography, Card, Container, TextField} from "@mui/material";
import {useState, useEffect} from "react";
import Image from "next/image"
import axios from "axios";
import Link from "next/link";
import { Uploader } from "@/components/premier/uploader";

export function Main({designs}){
    const [designss, setDesigns] = useState(designs)
    useEffect(()=>{
        const getDesigns = async ()=>{
            let res = await axios.get("/api/designs")
            if(res.data.error) alert(res.data.msg)
            else setDesigns(res.data.designs)
        }
        getDesigns()
    },[])
    const createDesign = async({url})=>{
        let res = await axios.post("/api/admin/designs", {url})
        if(res.data.error) alert(res.data.msg)
        else{
            setDesigns(res.data.designs)
        }
    }
    return (
        <Box sx={{padding: "1%", color: "black", minHeight: "vh",}}>
            <Card sx={{width: "100%", padding: "1%"}}>
                <TextField label="Search..." fullWidth />
            </Card>
            <Card sx={{width: "100%", height: "auto", padding: "1%", marginTop: "1%"}}>
                <Box sx={{ minHeight: "80vh",}}>
                    <Grid2 container spacing={2}>
                        <Grid2 size={{xs: 6, sm: 4, md: 3}}>
                            <Uploader afterFunction={createDesign} vh={"100vh"}/>
                        </Grid2>
                        {designss && designss.map(d=>(
                            <Grid2 key={d._id} size={{xs: 6, sm: 4, md: 3}}>
                                <Link href={`/admin/design/${d._id}`}>
                                    <Card sx={{width: "100%", padding: "3%", borderRadius: "9px", cursor: "pointer", height: "100%", maxHeight: "300px"}}>
                                        <Box sx={{padding: "2%", height: "100%"}}>
                                            <Image src={d.images.front} width={200} height={200} alt={`${d.name} ${d.sku} design`} style={{width: "100%", height: "auto", maxHeight: "400px"}}/>
                                        </Box>
                                        <Box sx={{padding: "2%"}}>
                                            <Typography sx={{fontSize: '.8rem'}}>{d.name}</Typography>
                                        </Box>
                                    </Card>
                                </Link>
                            </Grid2>
                        ))}
                    </Grid2>
                </Box>
            </Card>
        </Box>
    )
}
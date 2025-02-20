"use client";
import {Box, Grid2, Typography, Card, Button, TextField} from "@mui/material";
import {useState, useEffect} from "react";
import Image from "next/image"
import axios from "axios";
import Link from "next/link";
import { Uploader } from "@/components/premier/uploader";
import Theme from "@/components/Theme";
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
    const createDesign = async()=>{
        let res = await axios.post("/api/admin/designs", {})
        if(res.data.error) alert(res.data.msg)
        else{
            location.href=`/design/${res.data.design._id}`
        }
    }
    return (
        <Box sx={{padding: "1%", color: "black", minHeight: "vh",}}>
            <Box sx={{display: "flex",justifyContent: "flex-end", padding: "1%"}}>
                <Button onClick={()=>{createDesign()}} sx={{background: Theme.colors.primary, color: "#ffffff", width: "100px", height: "30px", marginTop: ".8%", "&:hover": {background: Theme.colors.support}}}>Create</Button>
            </Box>
            <Card sx={{width: "100%", padding: "1%"}}>
                <TextField label="Search..." fullWidth />
            </Card>
            <Card sx={{width: "100%", height: "auto", padding: "1%", marginTop: "1%"}}>
                <Box sx={{ minHeight: "80vh",}}>
                    <Grid2 container spacing={2}>
                        {designss && designss.map(d=>(
                            <Grid2 key={d._id} size={{xs: 6, sm: 4, md: 3}}>
                                <Link href={`/admin/design/${d._id}`}>
                                    <Card sx={{width: "100%", padding: "3%", borderRadius: "9px", cursor: "pointer", height: "100%"}}>
                                        <Box sx={{padding: "1% 3%", maxHeight: "250px", minHeight: "250px", height: "200px"}}>
                                            <Image src={d.images?.front? d.images.front: d.images?.back? d.images?.back: d.images?.leftSleeve? d.images?.leftSleeve: d.images?.rightSleeve? d.images?.rightSleeve: d.images?.pocket? d.images?.pocket: "/missingImage.jpg"} width={150} height={150} alt={`${d.name} ${d.sku} design`} style={{width: "100%", height: "auto", maxHeight: "250px"}}/>
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
                </Box>
            </Card>
        </Box>
    )
}
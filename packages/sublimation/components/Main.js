"use client";
import {Card, Typography, Grid2, Box, Button} from "@mui/material";
import {useState} from "react";
import Image from "next/image"
import {createImage} from "../functions/image";
import { Stations } from "./stations";
import Link from "next/link";
import axios from "axios"
import {Footer} from "@pythias/backend";
export function Main({labels, stations, stat}){
    const [useLabels, setLabels] = useState(labels)
    console.log(stat)
    const [station, setStation] = useState(stat? stat: stations? stations[0]: "station1")
    console.log(station)
    const printSublimationSmall = async (item)=>{
        console.log(item)
        let res = await axios.post("/api/production/sublimation", {item})
        if(res.data.error) alert(res.data.msg)
        else alert("printed")
    }
    return (
        <Box sx={{
            display: "flex",
            flexDirection: "column",
            alignContent: "center",
            alignItems: "center",
            margin: ".1%",
            background: "#d2d2d2",
            padding: "1%",
            minHeight: "100vh",
        }}>
            <Stations stations={stations} station={station} setStation={setStation}  />
            <Grid2 container spacing={1} sx={{width: "100%"}}>
                {Object.keys(useLabels).map(l=>(
                    <Grid2 size={{xs: 12, md: 6}} key={l}>
                        <Card sx={{width: "100%",}}>
                            <Typography textAlign="center" fontSize='1.4rem' fontWeight={900}>{l.toUpperCase()} ({useLabels[l].length})</Typography>
                            <Grid2 container spacing={.3} sx={{padding: '1%'}}>
                                <Grid2 size={2}>
                                </Grid2>
                                <Grid2 size={8}>
                                    <Grid2 container spacing={.5}>
                                        <Grid2 size={{xs: 6, lg:3}} sx={{padding: '1%'}}>
                                            <Typography textAlign={"center"} fontSize="1rem" fontWeight={600}>PieceId</Typography>
                                        </Grid2>
                                        <Grid2 size={{xs: 6, lg:3}} sx={{padding: '1%'}}>
                                            <Typography textAlign={"center"} fontSize="1rem" fontWeight={600}>PO Number</Typography>
                                        </Grid2>
                                        <Grid2 size={{xs: 4, lg:2}} sx={{padding: '1%'}}>
                                            <Typography textAlign={"center"} fontSize="1rem" fontWeight={600}>Style Code</Typography>
                                        </Grid2>
                                        <Grid2 size={{xs: 4, lg:2}} sx={{padding: '1%'}}>
                                            <Typography textAlign={"center"} fontSize="1rem" fontWeight={600}>Color</Typography>
                                        </Grid2>
                                        <Grid2 size={{xs: 4, lg:2}}  sx={{padding: '1%'}}>
                                            <Typography textAlign={"center"} fontSize="1rem" fontWeight={600}>Size</Typography>
                                        </Grid2>
                                    </Grid2>
                                </Grid2>
                            </Grid2>
                            {useLabels[l].map(k=>(
                                <Card key={k._id} onClick={()=>{
                                    if(l == "sublimation"){
                                        printSublimationSmall(k)
                                    }
                                    }}>
                                    <Grid2 container spacing={.3} sx={{padding: '1%'}}>
                                        <Grid2 size={2}>
                                            <Image src={k.sku == "gift-message"? l.design.front: k.design?.front? `${createImage(k.colorName, k.styleCode, {url: k.design.front}, 400)}`: `${createImage(k.colorName, k.styleCode, {url: k.design.back, side: "back"}, 400)}` } alt="some image" width={400} height={400} style={{width: "100%", height: "auto"}}/>
                                        </Grid2>
                                        <Grid2 size={8} sx={{marginTop: {xs: "1%", lg: "5%"}}}>
                                            <Grid2 container spacing={.5}>
                                                <Grid2 size={{xs: 6, lg:3}} sx={{padding: '1%'}}>
                                                    <Typography textAlign={"center"} fontSize="1rem" fontWeight={600}>{k.pieceId}</Typography>
                                                </Grid2>
                                                <Grid2 size={{xs: 6, lg:3}} sx={{padding: '1%'}}>
                                                    <Typography textAlign={"center"} fontSize="1rem" fontWeight={600}>{k.order.poNumber}</Typography>
                                                </Grid2>
                                                <Grid2 size={{xs: 4, lg:2}} sx={{padding: '1%'}}>
                                                    <Typography textAlign={"center"} fontSize="1rem" fontWeight={600}>{k.styleCode}</Typography>
                                                </Grid2>
                                                <Grid2 size={{xs: 4, lg:2}} sx={{padding: '1%'}}>
                                                    <Typography textAlign={"center"} fontSize="1rem" fontWeight={600}>{k.colorName}</Typography>
                                                </Grid2>
                                                <Grid2 size={{xs: 4, lg:2}}  sx={{padding: '1%'}}>
                                                    <Typography textAlign={"center"} fontSize="1rem" fontWeight={600}>{k.sizeName}</Typography>
                                                </Grid2>
                                                <Grid2 size={6} >
                                                    <Button size="small" fullWidth sx={{background: "#007FDC", color: "#ffffff", marginLeft: ".5%"}} >Reprint</Button>
                                                </Grid2>
                                                <Grid2 size={6}>
                                                    <Link href={`/shipping?pieceId=${k.pieceId}&station=${station}`} target="_blank">
                                                        <Button size="small" fullWidth sx={{background: "#007DBA", color: "#ffffff", marginRight: ".5%"}}>{k.order.items.length > 1? "Bin": "Ship"}</Button>
                                                    </Link>
                                                </Grid2>
                                            </Grid2>
                                        </Grid2>
                                    </Grid2>
                                </Card>
                            ))}
                        </Card>
                    </Grid2>
                ))}
            </Grid2>
            <Footer fixed={true} />
        </Box>
    )
}
"use client";
import {Box, Container, TextField, Grid2, Typography} from "@mui/material";
import {useState} from "react";
import Link from "next/link";
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import {Footer} from "../components/reusable/Footer";
import Image from "next/image";
export function TrackLabels({items, source}){
    console.log(source, "source")
    const [opened, setOpened] = useState("")
    return (
        <Box>
            <Container sx={{padding: 2}}>
                <Typography variant="h4" mb={2}>Track Labels ({items.length} in progress)</Typography>
                <Grid2 container spacing={2}>
                    {items.map(item => (
                        <Grid2 size={12} key={item._id}>
                            <Box p={2} display="flex" justifyContent="space-between" alignItems="center" sx={{ background: "#fff", borderTopLeftRadius: 8, borderTopRightRadius: 8, border: 1, borderBottom: opened == item._id ? "none" : 1, borderBottomLeftRadius: opened == item._id ? "none" : 8, borderBottomRightRadius: opened == item._id ? "none" : 8, }}>
                                <Box display="flex" flexDirection="column" gap={1}>
                                    {Object.keys(item.design ? item.design : {}).sort((a,b)=>{
                                        return a !="back" && b == "back" ? -1 : a == "back" && b != "back" ? 1 : 0
                                    }).map(key => {
                                        if(key != "back" && item.design[key]){
                                            return (
                                                <Box key={key} sx={{ display: "flex", flexDirection: "column", justifyItems: "center", padding: "3%", borderRight: "1px solid black" }}>
                                                    <Image src={`https://${source}.pythiastechnologies.com/api/renderImages?colorName=${item.colorName}&blank=${item.styleCode}&design=${item.design[key]}&side=${key}&threadColor=${item.threadColorName}&width=200&v=${Date.now()}`} alt={item.sku} width={200} height={200} style={{ width: "100%", height: "auto" }} />
                                                </Box>
                                            )
                                        }
                                        else if(key == "back" && item.design[key]){
                                            return (
                                                <Box key={key} sx={{ display: "flex", flexDirection: "column", justifyItems: "center", padding: "3%", width: "85px", borderRadius: "20px", position: "relative", bottom: 100, left: 15, marginBottom: -12, }}>
                                                    <Image src={`https://${source}.pythiastechnologies.com/api/renderImages?colorName=${item.colorName}&blank=${item.styleCode}&design=${item.design[key]}&side=${key}&threadColor=${item.threadColorName}&width=100&v=${Date.now()}`} alt={item.sku} width={200} height={200} style={{ width: "100%", height: "auto", borderRadius: "20px" }} />
                                                </Box>
                                            )
                                        }   
                                    })}
                                </Box>
                                <Box>
                                    <Typography variant="h6">Piece ID: {item.pieceId}</Typography>
                                    <Typography variant="body2">{new Date(item.date).toLocaleString()}</Typography>
                                    <Typography variant="body2">{item.styleCode}, {item.colorName}, {item.sizeName}, {item.threadColorName ? item.threadColorName : ""} {item.type}</Typography>
                                    {item.rePulled && <Typography variant="body2" color="red">RePulled: {item.rePulled} - {item.rePulledReasons[0]}</Typography>}
                                </Box>
                                <Box>
                                    <Typography variant="h6"><Link href={`/orders/${item.order?._id}`} target="_blank">PoNumber: {item.order?.poNumber}</Link></Typography>
                                    <Typography variant="body2">status: {item.order?.status}</Typography>
                                    <Typography variant="body2">Preshipped: {item.order?.preShipped ? "Yes" : "No"}</Typography>
                                    <Typography variant="body2">{new Date(item.order?.date).toLocaleString()}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="body2">last Step: {item.steps[item.steps.length - 1]?.status}</Typography>
                                    <Typography variant="body2">{new Date(item.steps[item.steps.length - 1]?.date).toLocaleString()}</Typography>
                                </Box>
                                <Box onClick={() => setOpened(opened == item._id ? "" : item._id)} sx={{cursor: "pointer"}}>
                                    {opened == item._id ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                                </Box>
                            </Box>
                            {opened == item._id && <Box border={1} p={2} sx={{ background: "#fff", padding: 2, borderBottom: 1, borderLeft: 1, borderRight: 1, borderBottomLeftRadius: 8, borderBottomRightRadius: 8, }}><Grid2 container spacing={2}>
                                <Grid2 size={6}>
                                    {item.steps.map((step, index) => (
                                        <Box key={index} border={1} borderRadius={2} p={2} mb={2}>
                                            <Typography variant="body2">Step {index + 1}: {step.status}</Typography>
                                            <Typography variant="body2">{new Date(step.date).toLocaleString()}</Typography>
                                        </Box>
                                    ))}
                                </Grid2>
                                <Grid2 size={6}>
                                    {item.order.notes.map((note, index) => (
                                        <Box key={index} border={1} borderRadius={2} p={2} mb={2}>
                                            <Typography variant="body2">Note {index + 1}: {note.note}</Typography>
                                            <Typography variant="body2">{new Date(note.date).toLocaleString()}</Typography>
                                        </Box>
                                    ))}
                                </Grid2>
                            </Grid2></Box>}
                        </Grid2>
                    ))}
                </Grid2>
            </Container>
            <Footer />
        </Box>
    )
}
"use client";
import {Box, Grid2, Typography, Card, Button} from "@mui/material";
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import {useState} from "react";
import { AddModal } from "./addModal";
export function Main({licenses}){
    const [lh, setLh] = useState(licenses? licenses: [])
    const [li, setLi] = useState(null)
    const [open, setOpen] = useState(false)
    return (
        <Box sx={{padding: "3%", background: "#e2e2e2"}}>
            <Card sx={{width: "100%", minHeight: "90vh", padding: "3%"}}>
                <Box sx={{display: "flex", flexDirection: "row", justifyContent: "flex-end", margin: "2%"}}>
                    <Button sx={{background: "#d2d2d2", color: "#000"}} onClick={()=>{setOpen(true)}}>Create License</Button>
                </Box>
                <Card sx={{width: "100%", padding: "3%", textAlign: "center", marginBottom: "-1%"}}>
                    <Grid2 container spacing={1}>
                        <Grid2 size={3}>
                            License Name
                        </Grid2>
                        <Grid2 size={3}>
                            Type of License
                        </Grid2>
                        <Grid2 size={4}>
                            Payment Type
                        </Grid2>
                        <Grid2 size={1}>
                            Amount
                        </Grid2>
                    </Grid2>
                </Card>
                {lh.map((l, i)=>(
                    <Card key={l._id} sx={{width: "100%", padding: "3%", margin: ".5% 0%",textAlign: "center", background: i % 2 == 0? "#f2f2f2": ""}}>
                        <Grid2 container spacing={1}>
                            <Grid2 size={3}>
                                {l.name}
                            </Grid2>
                            <Grid2 size={3}>
                                {l.licenseType}
                            </Grid2>
                            <Grid2 size={4}>
                                {l.paymentType}
                            </Grid2>
                            <Grid2 size={1}>
                                {l.paymentType == "Flat Per Unit" || l.paymentType == "One Time"? "$": ""}{parseFloat(l.amount).toFixed(2)}{l.paymentType == "Percentage Per Unit"? "%": ""}
                            </Grid2>
                            <Grid2 size={1}>
                                <EditIcon sx={{color: "#", cursor: "pointer"}} onClick={()=>{setLi(l); setOpen(true)}}/>
                            </Grid2>
                        </Grid2>
                    </Card>
                ))}
            </Card>
            <AddModal open={open} setOpen={setOpen} li={li} setLi={setLi} setLicenses={setLh}/>
        </Box>
    )
}
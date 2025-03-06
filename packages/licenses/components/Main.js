"use client";
import {Box, Grid2, Typography, Card, Button} from "@mui/material";
import {useState} from "react";
import { AddModal } from "./addModal";
export function Main({licenses}){
    const [lh, setLh] = useState(licenses? licenses: [])
    const [open, setOpen] = useState(false)
    return (
        <Box sx={{padding: "3%", background: "#e2e2e2"}}>
            <Card sx={{width: "100%", minHeight: "90vh", padding: "3%"}}>
                <Box sx={{display: "flex", flexDirection: "row", justifyContent: "flex-end"}}>
                    <Button sx={{background: "#d2d2d2", color: "#000"}} onClick={()=>{setOpen(true)}}>Create License</Button>
                </Box>
                {lh.map(l=>(
                    <Card key={l._id} sx={{width: "100%", padding: "3%"}}>

                    </Card>
                ))}
            </Card>
            <AddModal open={open} setOpen={setOpen}/>
        </Box>
    )
}
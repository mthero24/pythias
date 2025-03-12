"use client";
import {Box, Modal, Fab, Typography, TextField} from "@mui/material" ;
import {useState} from "react";

export function Repull({}){
    let [open, setOpen] = useState(false)
    let [repull, setRepull] = useState({
        pieceId: "",
        reason: ""
    })

    return (
        <Fab sx={{position: "sticky", bottom: "50px", left: "25px", padding: "2%", zIndex: 999, background: "#000", color: "#fff", "&:hover": {background: "#fff", color: "#000",}}} onClick={()=>{setOpen(true)}}>Repull</Fab>
    )
}
"use client";
import {Scan} from "./scan"
import { BinSettings } from "./binSettings"
import { BinModal } from "./BinModal";
import {Box, Card, Typography, Grid2, Button} from "@mui/material"
import {useState}from "react"
import axios from "axios"
export function Main({binCount, binsInUse, source}){
    const [bin, setBin] = useState(null)
    const [auto, setAuto] = useState(true)
    const [bins, setBins] = useState(binsInUse? binsInUse: [])
    const [open, setOpen] =useState(false)
    const [labelModal, setLabelModal] = useState(false)
    let modalStyle = {
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "80%",
        height: "80vh",
        bgcolor: "background.paper",
        border: "2px solid #000",
        boxShadow: 24,
        p: 4,
        overflow: "auto"
      };
    const emptyBin = async (bin)=>{
        let res = await axios.delete(`/api/production/returns?bin=${bin._id}`)
        if(res.data.error) console.log(res.data.msg)
        else{
            setBins(res.data.bins)
            setOpen(false)
            setBin(null)
        }
    }
    return <Box sx={{padding: "3%", background: "#e2e2e2", minHeight: "92vh"}}>
        <Card sx={{padding: "2%", margin: "2%", display: "flex", flexBasis: "row", justifyContent: "space-between"}}>
            <BinSettings binCount={binCount} setAuto={setAuto} setBinss={setBins} modalStyle={modalStyle} />
            <Button sx={{background:"#d2d2d2", color: "#000"}}>Print Labels</Button>
        </Card>
        <Scan setBin={setBin} bin={bin} auto={auto} setAuto={setAuto} setBins={setBins} setOpen={setOpen} />
        <BinModal open={open} setOpen={setOpen} setAuto={setAuto} bin={bin} setBin={setBin} setBins={setBins} modalStyle={modalStyle} source={source}/>
        <Card sx={{padding: ".5%", margin: "2%", minHeight: "90vh"}}>
            <Card sx={{padding: "2%"}}>
                <Grid2 container spacing={2} sx={{textAlign: "center"}}>
                    <Grid2 size={2}>
                        <Typography>Bin Number</Typography>
                    </Grid2>
                    <Grid2 size={3}>
                        <Typography>Blank</Typography>
                    </Grid2>
                    <Grid2 size={3}>
                        <Typography>Color</Typography>
                    </Grid2>
                    <Grid2 size={2}>
                        <Typography>Size</Typography>
                    </Grid2>
                    <Grid2 size={2}>
                        
                    </Grid2>
                </Grid2>
            </Card>
            {bins.map((b, i)=>(
                <Card  sx={{padding: "2%", cursor: "pointer", background: i % 2 == 0? "#e2e2e2": ""}} onClick={()=>{setBin(b); setOpen(true)}} key={i}>
                     <Grid2 container spacing={2} sx={{textAlign: "center"}}>
                    <Grid2 size={2}>
                        <Typography>{b.number}</Typography>
                    </Grid2>
                    <Grid2 size={3}>
                        <Typography>{b.blank.code}</Typography>
                    </Grid2>
                    <Grid2 size={3}>
                        <Typography>{b.color.name}</Typography>
                    </Grid2>
                    <Grid2 size={2}>
                        <Typography>{b.size}</Typography>
                    </Grid2>
                    <Grid2 size={2}>
                        <Button onClick={()=>{
                            emptyBin(b)
                        }}>Empty Bin</Button>
                    </Grid2>
                </Grid2>
                </Card>
            ))}
        </Card>
    </Box>
}
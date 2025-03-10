import {Box, Modal, Grid2, Card, TextField, Typography, Button} from "@mui/material";
import {createImage} from "../functions/image";
import Image from "next/image";
import {useState} from "react";
import axios from "axios";
export function BinModal({open, setOpen, setAuto, bin, setBins, setBin, modalStyle, source}){
    let [qty, setQty] = useState(1)
    let update = async ()=>{
        let res = await axios.put("/api/production/returns", {bin, qty})
        if(res.data.error) console.log(res.data.msg)
        else{
            setBin(null)
            setQty(1)
            setBins(res.data.bins)
            setOpen(false)
            setAuto(true)
        }
    }
    return (
        <Modal
            open={open}
            onClose={()=>{setOpen(false); setBin(null)}}
            aria-labelledby="modal-modal-title"
            aria-describedby="modal-modal-description"
            >
            <Box sx={modalStyle}>
                <Typography sx={{textAlign: "center", fontSize: "2rem"}}>Bin: {bin?.number}</Typography>
                <Grid2 container spacing={2} sx={{padding: "2%"}}>
                    {Object.keys(bin?.design?.images? bin?.design?.images: {}).map(d=>(
                        <Grid2 size={{xs: 12, sm: 6}} key={d}>
                            <Image src={createImage(bin.color.name, bin.blank.code, {side: d, url: bin.design.images[d]}, source )} alt={bin.upc} width={400} height={400} style={{width: "100%", height: "auto", padding: "2%", background: "#e2e2e2"}}/>
                        </Grid2>
                    ))}
                </Grid2>
                <Grid2 container spacing={2} sx={{padding: "2%", textAlign: "center"}}>
                    <Grid2 size={6}>
                        <Typography>UPC: {bin?.upc}</Typography>
                    </Grid2>
                    <Grid2 size={6}>
                        <Typography>{bin?.sku}</Typography>
                    </Grid2>
                    <Grid2 size={12}>
                        <Typography>Design SKU: {bin?.design.sku}, Blank Code: {bin?.blank.code}</Typography>
                        <Typography>Size: {bin?.size}, Color: {bin?.color.name}</Typography>
                    </Grid2>
                </Grid2>
                <TextField fullWidth disabled value={bin?.quantity} label="Quantity In Bin" sx={{margin: "1%"}}/>
                <TextField fullWidth label="Quantity" type="number" value={qty} onChange={()=>{setQty(event.target.value)}} sx={{margin: "1%"}} onKeyDown={()=>{
                    if(event.key == 13 || event.key=="Enter") update()
                }}/>
                <TextField fullWidth label="New Quantity" disabled type="number" value={parseInt(qty) + parseInt(bin?.quantity)} onChange={()=>{setQty(event.target.value)}} sx={{margin: "1%"}}/>
                <Button fullWidth onClick={update}>Update</Button>
            </Box>
        </Modal>
    )
}
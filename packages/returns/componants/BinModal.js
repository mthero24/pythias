import {Box, Modal, Grid2, Card, TextField, Typography, Button} from "@mui/material";
import {createImage} from "../functions/image";
import Image from "next/image";
import {useState} from "react";
import axios from "axios";
export function BinModal({open, setOpen, setAuto, bin, setBins, setBin, modalStyle, source}){
    let [qty, setQty] = useState(1)
    let update = async (bin)=>{
        let res = await axios.put("/api/production/returns", {bin})
        if(res.data.error) console.log(res.data.msg)
    }
    console.log(bin)
    return (
        <Modal
            open={open}
            onClose={()=>{setOpen(false); setBin(null); setAuto(true);}}
            aria-labelledby="modal-modal-title"
            aria-describedby="modal-modal-description"
            >
            <Box sx={modalStyle}>
                <Typography sx={{textAlign: "center", fontSize: "2rem"}}>Bin: {bin?.number}</Typography>
                <Grid2 container spacing={2} sx={{padding: "2%", textAlign: "center"}}>
                    <Grid2 size={12}>
                        <Typography>Blank: {bin?.blank?.code}</Typography>
                        <Typography>Size: {bin?.size}, Color: {bin?.color?.name}</Typography>
                    </Grid2>
                </Grid2>
                {bin?.inventory.map(i=>(
                    <Grid2 container spacing={2} key={i?._id} sx={{padding: "2%", textAlign: "center"}}>
                        
                        <Grid2 size={2}>
                        {Object.keys(i?.design?.images? i?.design?.images: {}).map(d=>(
                            <Box>
                               { console.log(i.threadColor?.name, i.design.threadImages)}
                                {i.design?.images[d] != "" && i.design?.images[d] != undefined && <Image src={createImage(bin.color?.name, bin.blank?.code, {side: d, url: i.threadColor != undefined? i.design?.threadImages[i.threadColor.name][d]: i.design?.images[d]}, source )} alt={i.sku} width={400} height={400} style={{width: "100%", height: "auto", padding: "2%", background: "#e2e2e2"}}/>}
                            </Box>
                           
                        ))}
                        </Grid2>
                        <Grid2 size={source == "IM"? 0: 3}>
                            <Typography sx={{marginTop: "10%"}}>{i?.upc}</Typography>
                        </Grid2>
                        <Grid2 size={source == "IM"? 6: 3}>
                            <Typography sx={{marginTop: "10%"}}>{i?.sku}</Typography>
                        </Grid2>
                        <Grid2 size={2}>
                            <TextField fullWidth type={"number"} value={i?.quantity} label="Quantity In Bin" sx={{margin: "1%"}} onChange={()=>{
                                let bl = {...bin}
                                let change = bl.inventory.filter(iv=> iv._id.toString() == i._id.toString())[0]
                                change.quantity = parseInt(event.target.value)
                                console.log(change)
                                update(bin)
                                setBin({...bl})
                            }}/>
                        </Grid2>
                        <Grid2 size={12}>
                            <hr/>
                        </Grid2>
                    </Grid2>
                ))}
            </Box>
        </Modal>
    )
}
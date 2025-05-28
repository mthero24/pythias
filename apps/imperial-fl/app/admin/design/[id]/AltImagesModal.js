import {Box, Modal, Typography, Card, Grid2, Button} from "@mui/material"
import {useState, useEffect} from "react"
import { Uploader } from "@/components/premier/uploader";
import Image from "next/image"
const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: "90%",
    height: "90vh",
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4,
  };
  
export function AltImageModal({open, setOpen, blank, design, setDesign, updateDesign}){
    console.log(blank)
    const uploaded = async ({url,color, bl})=>{
        let des = {...design}
        if(!des.overrideImages) des.overrideImages = {}
        if(!des.overrideImages[bl]) des.overrideImages[bl] = {}
        if(!des.overrideImages[bl][color]) des.overrideImages[bl][color] = []
        des.overrideImages[bl][color].push(url)
        console.log(des.overrideImages[bl][color])
        setDesign({...des})
        await updateDesign({...des})
    }
    return (
        <Modal
        open={open}
        onClose={()=>{setOpen(false)}}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          {blank?.colors.map(c=>(
            <Card key={c.name} sx={{padding: ".5%", margin: ".5%"}}>
                <Typography key={c.name}>{c.name}</Typography>
                <Grid2 container spacing={2}>
                    {design && design.overrideImages && blank && design.overrideImages[blank.blank._id] && design.overrideImages[blank.blank._id][c._id] && design.overrideImages[blank.blank._id][c._id].map(i=>(
                        <Grid2 size={2} key={i}>
                            <Image src={i} alt={i} width={400} height={400} style={{width: "100%", height: "auto"}}/>
                            <Button fullWidth onClick={()=>{
                                let des = {...design}
                                des.overrideImages[blank.blank._id][c._id] = des.overrideImages[blank.blank._id][c._id].filter(im=> im != i)
                                setDesign({...des})
                                updateDesign({...des})
                            }}>Remove</Button>
                        </Grid2>
                    ))}
                    <Grid2 size={2}>
                        <Box sx={{width: "100%", minHeight: "100px", padding: "3%", margin: "2%"}}>
                            <Uploader location={null} afterFunction={uploaded} color={c._id} image={ null} bl={blank.blank._id} />
                        </Box>
                    </Grid2>
                </Grid2>
            </Card>
          ))}
        </Box>
      </Modal>
    )
}
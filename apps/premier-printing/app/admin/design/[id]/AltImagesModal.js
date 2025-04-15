import {Box, Modal, Typography, Card, Grid2} from "@mui/material"
import {useState, useEffect} from "react"
import { Uploader } from "@/components/premier/uploader";
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
  
export function AltImageModal({open, setOpen, blank, design}){
    console.log(blank)
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
                    <Grid2 size={2}>
                        <Box sx={{width: "100%", minHeight: "100px", padding: "3%", margin: "2%"}}>
                            <Uploader location={null} afterFunction={null} image={ null} />
                        </Box>
                    </Grid2>
                </Grid2>
            </Card>
          ))}
        </Box>
      </Modal>
    )
}
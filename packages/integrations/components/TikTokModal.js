import {Modal, Box, Typography, TextField,Button} from "@mui/material";
import {useState} from "react"
import axios from "axios"
import { redirect } from "next/navigation";
export function TikTokModal({open, setOpen, provider}){
    const [sellerName, setSellerName] = useState("")
    const style = {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: "80%",
        height: "80%",
        bgcolor: 'background.paper',
        border: '2px solid #000',
        boxShadow: 24,
        p: 4,
        overflow: "auto"
    };
    const sub = async ()=>{
        if(sellerName != ""){
            let res = await axios.post("/api/admin/integrations", {type: "tiktok", seller_name: sellerName, provider})
            if(res && !res.data.error) redirect(res.data.url)
            else(alert("something went wrong please try again later!"))
        }else{
            alert("Seller Name Required")
        }
    }

    return (
        <Box>
            <Modal
                open={open}
                onClose={()=>{setOpen(false)}}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
            >
                <Box sx={style}>
                    <Typography textAlign={"center"} fontSize={"1.4rem"} margin="2%">New Tik Tok Connection</Typography>
                    <TextField fullWidth label="Seller Name" value={sellerName} onChange={()=>{setSellerName(event.target.value)}}/>
                    <Button fullWidth sx={{background: "#0066CC", color: "#fff", marginTop: "2%"}} onClick={sub}>Connect</Button>
                </Box>
            </Modal>
        </Box>
    )
}
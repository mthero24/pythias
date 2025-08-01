import { Modal, Box, Typography, TextField, Button } from "@mui/material";
import { useState } from "react"
import axios from "axios"
import { redirect } from "next/navigation";
import { set } from "mongoose";
export function AcendaModal({ open, setOpen, provider, apiConnections, setConnections }) {
    const [sellerName, setSellerName] = useState("")
    const [displayName, setDisplayName] = useState("")
    const [apiKey, setApiKey] = useState("")
    const [apiSecret, setApiSecret] = useState("")
    const [organization, setOrganization] = useState("")
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
    const sub = async () => {
        if (displayName != "" && apiKey != "" && apiSecret != "" && organization != "") {
            let res = await axios.post("/api/admin/integrations", { type: "acenda", displayName, apiKey, apiSecret, organization, provider })
            if (res && !res.data.error) {
                setOpen(false)
                setConnections(res.data.integrations)
            } else if (res && res.data.error) alert(res.data.msg)
            else (alert("something went wrong please try again later!"))
        } else {
            alert("All fields are required")
        }
    }

    return (
        <Box>
            <Modal
                open={open}
                onClose={() => { setOpen(false) }}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
            >
                <Box sx={style}>
                    <Typography textAlign={"center"} fontSize={"1.4rem"} margin="2%">New Acenda Connection</Typography>
                    <TextField fullWidth label="Display Name" value={displayName} onChange={() => { setDisplayName(event.target.value) }} sx={{ margin: "1% 0%"}} />
                    <TextField fullWidth label="API Key" value={apiKey} onChange={() => { setApiKey(event.target.value) }} sx={{ margin: "1% 0%"}} />
                    <TextField fullWidth label="API Secret" value={apiSecret} onChange={() => { setApiSecret(event.target.value) }} sx={{margin: "1% 0%"}} />
                    <TextField fullWidth label="Organization" value={organization} onChange={() => { setOrganization(event.target.value) }} sx={{ margin: "1% 0%" }} />
                    <Button fullWidth sx={{ background: "#0066CC", color: "#fff", marginTop: "2%" }} onClick={sub}>Connect</Button>
                </Box>
            </Modal>
        </Box>
    )
}
import { Modal, Box, Typography, TextField, Button } from "@mui/material";
import { useState } from "react";
import axios from "axios";

export function WalmartModal({ open, setOpen, provider, apiConnections, setConnections }) {
    const [displayName, setDisplayName] = useState("");
    const [clientId, setClientId] = useState("");
    const [clientSecret, setClientSecret] = useState("");
    const [partnerId, setPartnerId] = useState("");

    const style = {
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "80%",
        maxWidth: 500,
        bgcolor: "background.paper",
        border: "2px solid #000",
        boxShadow: 24,
        p: 4,
        overflow: "auto",
    };

    const sub = async () => {
        if (!displayName || !clientId || !clientSecret || !partnerId) {
            return alert("All fields are required");
        }
        const res = await axios.post("/api/admin/integrations", {
            type: "walmart",
            displayName,
            apiKey: clientId,
            apiSecret: clientSecret,
            organization: partnerId,
            provider,
        });
        if (res?.data?.error) {
            alert(res.data.msg);
        } else {
            setConnections(res.data.integrations);
            setOpen(false);
        }
    };

    return (
        <Modal open={open} onClose={() => setOpen(false)}>
            <Box sx={style}>
                <Typography textAlign="center" fontSize="1.4rem" margin="2%">New Walmart Connection</Typography>
                <TextField fullWidth label="Display Name" value={displayName} onChange={e => setDisplayName(e.target.value)} sx={{ margin: "1% 0%" }} />
                <TextField fullWidth label="Client ID" value={clientId} onChange={e => setClientId(e.target.value)} sx={{ margin: "1% 0%" }} />
                <TextField fullWidth label="Client Secret" value={clientSecret} onChange={e => setClientSecret(e.target.value)} sx={{ margin: "1% 0%" }} />
                <TextField fullWidth label="Partner ID" value={partnerId} onChange={e => setPartnerId(e.target.value)} sx={{ margin: "1% 0%" }} />
                <Button fullWidth sx={{ background: "#0071CE", color: "#fff", marginTop: "2%" }} onClick={sub}>Connect</Button>
            </Box>
        </Modal>
    );
}

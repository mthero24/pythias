import { Modal, Box, Typography, TextField, Button, CircularProgress } from "@mui/material";
import { useState } from "react";
import axios from "axios";

export function TikTokModal({ open, setOpen, provider, orgId }) {
    const [sellerName, setSellerName] = useState("");
    const [loading, setLoading] = useState(false);

    const style = {
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "80%",
        maxWidth: 480,
        bgcolor: "background.paper",
        border: "2px solid #000",
        boxShadow: 24,
        p: 4,
        borderRadius: 2,
    };

    const sub = async () => {
        if (!sellerName.trim()) { alert("Seller Name Required"); return; }
        setLoading(true);
        try {
            const res = await axios.post("/api/admin/integrations", { type: "tiktok", seller_name: sellerName.trim(), provider, ...(orgId ? { orgId } : {}) });
            if (res?.data?.url) {
                window.location.href = res.data.url;
            } else {
                alert("Something went wrong, please try again later.");
            }
        } catch {
            alert("Something went wrong, please try again later.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box>
            <Modal
                open={open}
                onClose={()=>{setOpen(false)}}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
            >
                <Box sx={style}>
                    <Typography textAlign="center" fontSize="1.4rem" mb={2}>New TikTok Connection</Typography>
                    <TextField fullWidth label="Seller Name" value={sellerName} onChange={e => setSellerName(e.target.value)} />
                    <Button fullWidth disabled={loading} sx={{ background: "#0066CC", color: "#fff", mt: 2, "&:hover": { background: "#0052a3" } }} onClick={sub}>
                        {loading ? <CircularProgress size={20} color="inherit" /> : "Connect"}
                    </Button>
                </Box>
            </Modal>
        </Box>
    )
}
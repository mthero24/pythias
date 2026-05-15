"use client";
import { Button, Box, Typography, TextField, Stack, Dialog, DialogTitle, DialogContent, DialogActions, InputAdornment } from "@mui/material";
import { useState } from "react";
import axios from "axios";
import { BinSettings } from "./binSettings";
import { FeedBack } from "./feedback";
import ArticleIcon from "@mui/icons-material/Article";
import ReplayIcon from "@mui/icons-material/Replay";
import QrCodeIcon from "@mui/icons-material/QrCode";

export function Manifest({ binCount, setAuto, setBins, modalStyle }) {
    const [manifest, setManifest]           = useState(null);
    const [open, setOpen]                   = useState(false);
    const [refundOpen, setRefundOpen]       = useState(false);
    const [trackingNumber, setTrackingNumber] = useState("");

    const submitRefund = async () => {
        const res = await axios.put("/api/production/shipping/labels", { PIC: trackingNumber });
        if (res.data.error) alert(res.data.msg);
        else {
            alert(res.data.msg);
            setRefundOpen(false);
            setTrackingNumber("");
        }
    };

    const handleOpen = async () => {
        const result = await axios.get("/api/production/shipping/manifest").catch(e => console.log(e.response?.data));
        if (!result || result.data.error) {
            alert(result?.data?.msg ?? "Failed to load manifest");
        } else {
            setManifest(`data:image/jpg;base64,${result.data.manifest}`);
            setOpen(true);
        }
    };

    return (
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
            <Button
                variant="outlined"
                size="small"
                startIcon={<ArticleIcon />}
                onClick={handleOpen}
                sx={{ whiteSpace: "nowrap" }}
            >
                Manifest
            </Button>

            <Button
                variant="outlined"
                size="small"
                startIcon={<ReplayIcon />}
                onClick={() => setRefundOpen(true)}
                sx={{ whiteSpace: "nowrap" }}
            >
                Request Refund
            </Button>

            <Box sx={{ ml: "auto" }}>
                <FeedBack setAuto={setAuto} />
            </Box>
            <BinSettings binCount={binCount} setAuto={setAuto} setBinss={setBins} modalStyle={modalStyle} />

            {/* Manifest image dialog */}
            <Dialog open={open} onClose={() => { setOpen(false); setManifest(null); }} maxWidth="lg" fullWidth>
                <DialogTitle sx={{ fontWeight: 700 }}>Print Manifest</DialogTitle>
                <DialogContent>
                    {manifest && (
                        <Box sx={{ display: "flex", justifyContent: "center" }}>
                            <img src={manifest} alt="manifest" style={{ maxWidth: "100%", height: "auto" }} />
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => { setOpen(false); setManifest(null); }}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* Request refund dialog */}
            <Dialog open={refundOpen} onClose={() => { setRefundOpen(false); setTrackingNumber(""); }} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ fontWeight: 700 }}>Request Refund</DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        label="Tracking Number"
                        value={trackingNumber}
                        onChange={(e) => setTrackingNumber(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") submitRefund(); }}
                        sx={{ mt: 1 }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <QrCodeIcon sx={{ color: "text.disabled" }} />
                                </InputAdornment>
                            ),
                        }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => { setRefundOpen(false); setTrackingNumber(""); }}>Cancel</Button>
                    <Button variant="contained" onClick={submitRefund} disabled={!trackingNumber}>Submit</Button>
                </DialogActions>
            </Dialog>
        </Stack>
    );
}

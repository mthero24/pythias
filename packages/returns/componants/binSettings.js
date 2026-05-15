"use client";
import { Box, TextField, Button, ButtonGroup, Typography, Dialog, DialogTitle, DialogContent, Grid2, Stack, Chip, Divider, IconButton } from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CloseIcon from "@mui/icons-material/Close";
import { useState } from "react";
import axios from "axios";

export function BinSettings({ binCount, setAuto, setBinss }) {
    const [bins, setBins]             = useState(binCount);
    const [disabled, setDisabled]     = useState(true);
    const [update, setUpdate]         = useState();
    const [showBinMove, setShowBinMove] = useState(false);
    const [binsMoved, setBinsMoved]   = useState({});

    const closeMoveDialog = () => { setShowBinMove(false); setAuto(true); };

    const processUpdate = async () => {
        const isAdd = bins < update;
        const res = await axios.put("/api/production/returns/bins", {
            binCount: bins, newCount: update, type: isAdd ? "add" : "subtract", execute: isAdd,
        }).catch(e => { alert(e?.response?.data?.msg ?? "Error updating bins"); return null; });
        if (!res) return;
        if (res.data.error) { alert(res.data.msg); return; }

        setBinss(res.data.bins);
        setBins(res.data.binCount);
        setDisabled(true);

        if (!isAdd && Object.keys(res.data.movedBins ?? {}).length > 0) {
            setBinsMoved(res.data.movedBins);
            setShowBinMove(true);
        } else {
            setAuto(true);
        }
    };

    return (
        <Box sx={{ p: 0.5 }} onClick={() => { if (disabled) setAuto(true); }}>
            <ButtonGroup variant="contained">
                <TextField
                    label="Number Of Bins" type="number" fullWidth
                    value={update ?? bins}
                    disabled={disabled}
                    onChange={(e) => setUpdate(parseInt(e.target.value))}
                    onKeyDown={(e) => { if (e.key === "Enter") processUpdate(); }}
                />
                <Button onClick={() => { setDisabled(!disabled); setAuto(!!disabled); setUpdate(undefined); }}>
                    Edit
                </Button>
            </ButtonGroup>

            <Dialog open={showBinMove} onClose={closeMoveDialog} maxWidth="sm" fullWidth scroll="paper">
                <DialogTitle sx={{ py: 1.5, px: 2 }}>
                    <Stack direction="row" alignItems="center">
                        <Typography variant="h6" fontWeight={700} sx={{ flex: 1 }}>Move Bins</Typography>
                        <IconButton size="small" onClick={closeMoveDialog}><CloseIcon fontSize="small" /></IconButton>
                    </Stack>
                </DialogTitle>
                <Divider />
                <DialogContent sx={{ p: 2 }}>
                    <Stack spacing={1}>
                        {Object.keys(binsMoved).map(m => (
                            <Box
                                key={m}
                                sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 2, bgcolor: "action.hover", borderRadius: 2, px: 3, py: 1.5 }}
                            >
                                <Chip label={m.replace("mb", "")} size="small" variant="outlined" sx={{ fontWeight: 700, fontSize: "1rem", minWidth: 48 }} />
                                <ArrowForwardIcon color="action" />
                                <Chip label={binsMoved[m]} size="small" color="primary" variant="outlined" sx={{ fontWeight: 700, fontSize: "1rem", minWidth: 48 }} />
                            </Box>
                        ))}
                    </Stack>
                </DialogContent>
            </Dialog>
        </Box>
    );
}

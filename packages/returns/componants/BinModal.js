"use client";
import { Box, Dialog, DialogTitle, DialogContent, Grid2, TextField, Typography, Stack, Chip, Divider, IconButton } from "@mui/material";
import { createImage } from "../functions/image";
import Image from "next/image";
import { useState } from "react";
import CloseIcon from "@mui/icons-material/Close";
import axios from "axios";

export function BinModal({ open, setOpen, setAuto, bin, setBins, setBin, source }) {
    const update = async (bin) => {
        const res = await axios.put("/api/production/returns", { bin })
            .catch(() => alert("Error updating bin"));
        if (res?.data?.error) alert(res.data.msg);
    };

    return (
        <Dialog open={open} onClose={() => { setOpen(false); setBin(null); setAuto(true); }} maxWidth="md" fullWidth scroll="paper">
            <DialogTitle sx={{ py: 1.5, px: 2 }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography variant="h6" fontWeight={700} sx={{ flex: 1 }}>
                        Bin {bin?.number}
                    </Typography>
                    {bin?.blank?.code && <Chip label={bin.blank.code} size="small" color="primary" variant="outlined" sx={{ fontFamily: "monospace", fontWeight: 700 }} />}
                    {bin?.color?.name && <Chip label={bin.color.name} size="small" variant="outlined" sx={{ textTransform: "capitalize" }} />}
                    {bin?.size && <Chip label={bin.size} size="small" variant="outlined" sx={{ textTransform: "uppercase", fontWeight: 600 }} />}
                    <IconButton size="small" onClick={() => { setOpen(false); setBin(null); setAuto(true); }}>
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </Stack>
            </DialogTitle>
            <Divider />
            <DialogContent sx={{ p: 2 }}>
                <Stack spacing={1.5}>
                    {bin?.inventory.map(i => (
                        <Box key={i?._id} sx={{ bgcolor: "action.hover", borderRadius: 2, p: 1.5 }}>
                            <Grid2 container spacing={1.5} alignItems="center">
                                <Grid2 size={2}>
                                    {Object.keys(i?.design?.images ?? {}).map(d => {
                                        const imgSrc = i.design?.images[d];
                                        if (!imgSrc) return null;
                                        const url = i.threadColor
                                            ? i.design?.threadImages?.[i.threadColor.name]?.[d]
                                            : imgSrc;
                                        return (
                                            <Image
                                                key={d}
                                                src={createImage(bin.color?.name, bin.blank?.code, { side: d, url }, source)}
                                                alt={i.sku} width={100} height={100}
                                                style={{ width: "100%", height: "auto", borderRadius: 4, background: "#e2e2e2" }}
                                            />
                                        );
                                    })}
                                </Grid2>
                                {source !== "IM" && (
                                    <Grid2 size={3}>
                                        <Typography variant="body2" sx={{ fontFamily: "monospace" }}>{i?.upc}</Typography>
                                    </Grid2>
                                )}
                                <Grid2 size={source === "IM" ? 7 : 4}>
                                    <Typography variant="body2" fontWeight={600} sx={{ fontFamily: "monospace" }}>{i?.sku}</Typography>
                                </Grid2>
                                <Grid2 size={3}>
                                    <TextField
                                        fullWidth size="small" type="number"
                                        label="Qty in Bin"
                                        value={i?.quantity}
                                        onChange={(e) => {
                                            const bl = { ...bin };
                                            bl.inventory.find(iv => iv._id.toString() === i._id.toString()).quantity = parseInt(e.target.value);
                                            setBin({ ...bl });
                                            update(bl);
                                        }}
                                    />
                                </Grid2>
                            </Grid2>
                        </Box>
                    ))}
                </Stack>
            </DialogContent>
        </Dialog>
    );
}

"use client";
import {Box, Chip, Dialog, DialogContent, DialogTitle, IconButton, Typography, Grid2} from "@mui/material";
import React, {useEffect, useState} from "react";
import Image from "next/image";
import {Uploader} from "@pythias/backend";
import CloseIcon from '@mui/icons-material/Close';

const ZoneCard = ({ label, children }) => (
    <Box sx={{ border: "1px solid #e0e0e0", borderRadius: 2, overflow: "hidden", height: "100%" }}>
        <Box sx={{ px: 1.5, py: 0.75, backgroundColor: "#f5f7fa", borderBottom: "1px solid #e0e0e0", display: "flex", alignItems: "center" }}>
            <Typography variant="caption" sx={{ fontSize: "0.7rem", fontWeight: 600, color: "text.secondary" }}>{label}</Typography>
        </Box>
        <Box sx={{ p: 1 }}>{children}</Box>
    </Box>
);

export function SublimationImages({ design, setDesign, updateDesign, open, setOpen }) {
    const [reload, setReload] = useState(true);
    useEffect(() => {
        if (!reload) setReload(!reload);
    }, [reload]);

    const afterFunction = async ({ location, url }) => {
        let des = { ...design };
        if (!des.sublimationImages) des.sublimationImages = {};
        des.sublimationImages[location] = url;
        updateDesign(des);
        setDesign(des);
        setReload(false);
    };

    const zones = [
        { key: "frontBody",           label: "1 — Front Body" },
        { key: "backBody",            label: "2 — Back Body" },
        { key: "sleeveWithCuffRight", label: "3 — Sleeve w/Cuff Right" },
        { key: "sleeveWithCuffLeft",  label: "4 — Sleeve w/Cuff Left" },
        { key: "sleeveNoCuffRight",   label: "5 — Sleeve No Cuff Right" },
        { key: "sleeveNoCuffLeft",    label: "6 — Sleeve No Cuff Left" },
        { key: "hoodOutside",         label: "7/8 — Hood Exterior" },
        { key: "hoodInside",          label: "9/10 — Hood Interior" },
        { key: "cuffRight",           label: "11 — Cuff Right" },
        { key: "cuffLeft",            label: "12 — Cuff Left" },
        { key: "collar",              label: "13 — Collar" },
        { key: "poloCollar",          label: "14 — Polo Collar" },
        { key: "poloPocket",          label: "15 — Polo Pocket" },
    ];

    const uploadedCount = zones.filter(z => design.sublimationImages?.[z.key]).length;

    return (
        <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xl" fullWidth PaperProps={{ sx: { height: "92vh", borderRadius: 2 } }}>
            <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 2, borderBottom: "1px solid #f0f0f0" }}>
                <Typography variant="h6" fontWeight={700} sx={{ flexGrow: 1 }}>Sublimation Images</Typography>
                <Chip label={`${uploadedCount} / ${zones.length} uploaded`} size="small" variant="outlined" color={uploadedCount === zones.length ? "success" : "default"} />
                <IconButton size="small" onClick={() => setOpen(false)}>
                    <CloseIcon fontSize="small" />
                </IconButton>
            </DialogTitle>
            <DialogContent sx={{ p: 2, overflowY: "auto" }}>
                <Grid2 container spacing={2}>
                    {/* Reference guide */}
                    <Grid2 size={{ xs: 12, md: 4 }}>
                        <Box sx={{ border: "1px solid #e0e0e0", borderRadius: 2, overflow: "hidden", position: "sticky", top: 0 }}>
                            <Box sx={{ px: 1.5, py: 0.75, backgroundColor: "#f5f7fa", borderBottom: "1px solid #e0e0e0" }}>
                                <Typography variant="caption" fontWeight={600} color="text.secondary">Zone Reference Guide</Typography>
                            </Box>
                            <Box sx={{ p: 1 }}>
                                <Image src="/sublimation_guide.png" alt="Sublimation zone guide" width={400} height={400} style={{ width: "100%", height: "auto" }} />
                            </Box>
                        </Box>
                    </Grid2>

                    {/* Upload zones */}
                    <Grid2 size={{ xs: 12, md: 8 }}>
                        <Grid2 container spacing={1.5}>
                            {zones.map(zone => (
                                <Grid2 key={zone.key} size={{ xs: 6, sm: 4, md: 4 }}>
                                    <ZoneCard label={zone.label}>
                                        {reload && (
                                            <Uploader
                                                afterFunction={afterFunction}
                                                image={design.sublimationImages?.[zone.key]}
                                                location={zone.key}
                                            />
                                        )}
                                    </ZoneCard>
                                </Grid2>
                            ))}
                        </Grid2>
                    </Grid2>
                </Grid2>
            </DialogContent>
        </Dialog>
    );
}

"use client";
import { Box, Chip, Dialog, DialogContent, DialogTitle, IconButton, Typography, Grid2, CircularProgress } from "@mui/material";
import React, { useCallback, useState } from "react";
import Image from "next/image";
import CloseIcon from '@mui/icons-material/Close';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { useDropzone } from 'react-dropzone';
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
    credentials: {
        accessKeyId: 'XWHXU4FP7MT2V842ITN9',
        secretAccessKey: 'kf78BeufoEwwhSdecZCdcpZVJsIng6v5WFJM1Nm3',
    },
    region: "us-west-1",
    endpoint: "https://s3.us-west-1.wasabisys.com/",
});

const ACCEPT = {
    'image/png': ['.png'],
    'image/jpeg': ['.jpg', '.jpeg'],
};

function SublimationZone({ label, zoneKey, image, afterFunction }) {
    const [uploading, setUploading] = useState(false);

    const onDrop = useCallback(async (files) => {
        if (!files.length) return;
        setUploading(true);
        try {
            const file = files[0];
            const ext = file.name.split('.').pop();
            const key = `designs/${Date.now()}.${ext}`;
            await s3.send(new PutObjectCommand({
                Bucket: "images1.pythiastechnologies.com",
                Key: key,
                Body: await file.arrayBuffer(),
                ACL: "public-read",
                ContentDisposition: "inline",
                ContentType: file.type,
            }));
            await afterFunction({ location: zoneKey, url: `https://images1.pythiastechnologies.com/${key}` });
        } catch (e) {
            console.error("Upload error:", e);
        } finally {
            setUploading(false);
        }
    }, [zoneKey, afterFunction]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: ACCEPT });
    const uploaded = !!image;

    return (
        <Box
            {...getRootProps()}
            sx={{
                border: isDragActive
                    ? "2px solid #1989df"
                    : uploaded
                        ? "2px solid #86efac"
                        : "2px dashed #d1d5db",
                borderRadius: 2,
                overflow: "hidden",
                cursor: "pointer",
                bgcolor: isDragActive ? "#eef5ff" : "#fff",
                transition: "border-color 0.18s, background-color 0.18s",
                "&:hover": { borderColor: "#1989df" },
                "&:hover .zone-overlay": { opacity: 1 },
            }}
        >
            <input {...getInputProps()} />

            {/* Zone header */}
            <Box sx={{
                px: 1.5, py: 0.75,
                bgcolor: uploaded ? "#f0fdf4" : isDragActive ? "#eff6ff" : "#f8fafc",
                borderBottom: "1px solid #f0f0f0",
                display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
                <Typography variant="caption" fontWeight={600} color={uploaded ? "#16a34a" : "text.secondary"} sx={{ fontSize: "0.68rem", lineHeight: 1.3 }}>
                    {label}
                </Typography>
                {uploaded && <CheckCircleOutlineIcon sx={{ fontSize: 14, color: "#22c55e", flexShrink: 0 }} />}
            </Box>

            {/* Upload area */}
            <Box sx={{ minHeight: 90, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", p: 1 }}>
                {uploading ? (
                    <Box sx={{ textAlign: "center" }}>
                        <CircularProgress size={22} thickness={4} />
                        <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>Uploading…</Typography>
                    </Box>
                ) : image ? (
                    <>
                        <Image
                            src={image}
                            alt={label}
                            width={200} height={200}
                            style={{ width: "100%", height: "auto", display: "block", borderRadius: 4 }}
                        />
                        <Box
                            className="zone-overlay"
                            sx={{
                                position: "absolute", inset: 0,
                                bgcolor: "rgba(0,0,0,0.45)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                opacity: 0, transition: "opacity 0.18s",
                            }}
                        >
                            <Box sx={{ textAlign: "center", color: "#fff" }}>
                                <CloudUploadIcon sx={{ fontSize: 24 }} />
                                <Typography variant="caption" display="block" fontWeight={600}>Replace</Typography>
                            </Box>
                        </Box>
                    </>
                ) : isDragActive ? (
                    <Box sx={{ textAlign: "center", color: "#1989df", py: 1 }}>
                        <CloudUploadIcon sx={{ fontSize: 30, mb: 0.5 }} />
                        <Typography variant="caption" display="block" fontWeight={600}>Drop to upload</Typography>
                    </Box>
                ) : (
                    <Box sx={{ textAlign: "center", py: 1 }}>
                        <CloudUploadIcon sx={{ fontSize: 28, color: "#cbd5e1", mb: 0.5 }} />
                        <Typography variant="caption" display="block" color="text.disabled">Click or drop file</Typography>
                    </Box>
                )}
            </Box>
        </Box>
    );
}

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

export function SublimationImages({ design, setDesign, updateDesign, open, setOpen }) {
    const afterFunction = async ({ location, url }) => {
        const des = { ...design, sublimationImages: { ...(design.sublimationImages ?? {}), [location]: url } };
        updateDesign(des);
        setDesign(des);
    };

    const uploadedCount = zones.filter(z => design.sublimationImages?.[z.key]).length;

    return (
        <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xl" fullWidth PaperProps={{ sx: { height: "92vh", borderRadius: 2 } }}>
            <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 2, borderBottom: "1px solid #f0f0f0" }}>
                <Typography variant="h6" fontWeight={700} sx={{ flexGrow: 1 }}>Sublimation Images</Typography>
                <Chip
                    label={`${uploadedCount} / ${zones.length} uploaded`}
                    size="small"
                    variant="outlined"
                    color={uploadedCount === zones.length ? "success" : "default"}
                />
                <IconButton size="small" onClick={() => setOpen(false)}>
                    <CloseIcon fontSize="small" />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ p: 2, overflowY: "auto" }}>
                <Grid2 container spacing={2}>
                    {/* Reference guide */}
                    <Grid2 size={{ xs: 12, md: 4 }}>
                        <Box sx={{ border: "1px solid #e0e0e0", borderRadius: 2, overflow: "hidden", position: "sticky", top: 0 }}>
                            <Box sx={{ px: 1.5, py: 0.75, bgcolor: "#f8fafc", borderBottom: "1px solid #e0e0e0" }}>
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
                                <Grid2 key={zone.key} size={{ xs: 6, sm: 4 }}>
                                    <SublimationZone
                                        label={zone.label}
                                        zoneKey={zone.key}
                                        image={design.sublimationImages?.[zone.key]}
                                        afterFunction={afterFunction}
                                    />
                                </Grid2>
                            ))}
                        </Grid2>
                    </Grid2>
                </Grid2>
            </DialogContent>
        </Dialog>
    );
}

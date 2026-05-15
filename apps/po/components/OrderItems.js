"use client";
import { Box, Typography, Card, Grid2, Chip, Stack } from "@mui/material";
import { useState } from "react";
import Image from "next/image";
import ImageNotSupportedIcon from "@mui/icons-material/ImageNotSupported";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import { createImage } from "@/functions/createImage";

function SafeImage({ src, alt, width, height, style }) {
    const [error, setError] = useState(false);
    if (!src || error) {
        return (
            <Box sx={{
                width, height,
                display: "flex", alignItems: "center", justifyContent: "center",
                bgcolor: "action.hover", borderRadius: 1,
            }}>
                <ImageNotSupportedIcon sx={{ color: "text.disabled", fontSize: Math.min(width, height) * 0.5 }} />
            </Box>
        );
    }
    return <Image src={src} alt={alt} width={width} height={height} style={style} onError={() => setError(true)} />;
}

function StatusChip({ label, done }) {
    return (
        <Chip
            icon={done ? <CheckIcon sx={{ fontSize: "14px !important" }} /> : <CloseIcon sx={{ fontSize: "14px !important" }} />}
            label={label}
            size="small"
            color={done ? "success" : "default"}
            variant={done ? "filled" : "outlined"}
            sx={{ fontSize: "0.7rem", height: 22 }}
        />
    );
}

export function OrderItems({ order }) {
    const items = order.items.filter(i => !i.canceled && !i.shipped);
    return (
        <Card variant="outlined" sx={{ flex: 1, borderRadius: 2, overflow: "hidden" }}>
            <Box sx={{ px: 2, py: 1.25, borderBottom: "1px solid", borderColor: "divider" }}>
                <Typography variant="subtitle1" fontWeight={700}>
                    Order Items
                    <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                        ({items.length} pending)
                    </Typography>
                </Typography>
            </Box>
            <Box sx={{ p: 1 }}>
                {items.map((it, i) => {
                    const designKeys = Object.keys(it.design ?? {}).filter(k => it.design[k] && typeof it.design[k] === "string");
                    const firstKey = designKeys[0];
                    const imgSrc = firstKey
                        ? (it.sku?.includes("gift")
                            ? it.design.front?.replace("https//:", "https://")
                            : createImage(it.colorName, it.styleCode, { url: it.design[firstKey], side: firstKey }))
                        : null;

                    return (
                        <Card key={i} variant="outlined" sx={{ p: 1.5, mb: 1, borderRadius: 2, bgcolor: i % 2 === 0 ? "background.paper" : "action.hover" }}>
                            <Grid2 container spacing={1.5} alignItems="center">
                                <Grid2 size={{ xs: 4, sm: 3 }}>
                                    <SafeImage src={imgSrc} alt={it.pieceId} width={100} height={100} style={{ width: "100%", height: "auto", objectFit: "contain" }} />
                                </Grid2>
                                <Grid2 size={{ xs: 8, sm: 9 }}>
                                    <Typography variant="body2" fontWeight={700} sx={{ textTransform: "capitalize", mb: 0.5 }}>
                                        {it.pieceId}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1, textTransform: "capitalize" }}>
                                        {it.styleCode} · {it.colorName} · {it.sizeName}
                                        {it.threadColorName ? ` · Thread: ${it.threadColorName}` : ""}
                                    </Typography>
                                    <Stack direction="row" spacing={0.75} flexWrap="wrap">
                                        <StatusChip label="Treated" done={it.treated} />
                                        <StatusChip label="Printed" done={it.printed} />
                                        <StatusChip label="Folded" done={it.folded} />
                                        <StatusChip label="In Bin" done={it.inBin} />
                                    </Stack>
                                </Grid2>
                            </Grid2>
                        </Card>
                    );
                })}
                {items.length === 0 && (
                    <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: "center" }}>No pending items</Typography>
                )}
            </Box>
        </Card>
    );
}

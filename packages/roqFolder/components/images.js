"use client";
import { Box, Card, Typography, Grid2 } from "@mui/material";
import { createImage } from "../functions/image";
import Image from "next/image";

export function Images({ item, source }) {
    const sides = Object.keys(item.design ?? {});

    return (
        <Grid2 container spacing={2}>
            {/* Design sides */}
            {sides.map(d => (
                <Grid2 key={d} size={{ xs: 12, sm: sides.length === 1 ? 12 : 6, md: sides.length > 2 ? 4 : 6 }}>
                    <DesignCard label={d}>
                        <Image
                            src={createImage(item.colorName, item.styleCode, { url: item.design[d], side: d }, source)}
                            alt={d}
                            width={500}
                            height={500}
                            style={{ width: "100%", height: "auto", objectFit: "contain" }}
                        />
                    </DesignCard>
                </Grid2>
            ))}

            {/* Blank product image */}
            {item.isBlank && (
                <Grid2 size={{ xs: 12, sm: 6 }}>
                    <DesignCard label="Blank">
                        <Image
                            src={item.blank.images.filter(i => i.color === item.color)[0]?.image}
                            alt={item.pieceId}
                            width={500}
                            height={500}
                            style={{ width: "100%", height: "auto", objectFit: "contain" }}
                        />
                    </DesignCard>
                </Grid2>
            )}

            {/* Gift item */}
            {item.sku?.includes("gift") && item?.design?.front && (
                <Grid2 size={{ xs: 12, sm: 6 }}>
                    <DesignCard label="Gift — Front">
                        <Image
                            src={item.sku.includes("gift")
                                ? item.design.front.replace("https//:", "https://")
                                : createImage(item.colorName, item.styleCode, { url: item.design.front }, source)}
                            alt={item.pieceId}
                            width={500}
                            height={500}
                            style={{ width: "100%", height: "auto", objectFit: "contain" }}
                        />
                    </DesignCard>
                </Grid2>
            )}
        </Grid2>
    );
}

function DesignCard({ label, children }) {
    return (
        <Card variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
            <Box sx={{ px: 1.5, py: 0.75, borderBottom: "1px solid", borderColor: "divider" }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", textTransform: "capitalize" }}>
                    {label}
                </Typography>
            </Box>
            <Box sx={{ bgcolor: "#f3f4f6", p: 2, display: "flex", justifyContent: "center" }}>
                {children}
            </Box>
        </Card>
    );
}

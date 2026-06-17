"use client";
import { Grid2, Box, Card, Typography, Stack, Chip, Divider } from "@mui/material";
import { useState } from "react";
import Image from "next/image";
import { Scan } from "./scan";
import { createImage } from "../functions/image";
import { Repull } from "../../repull/exports";

const RAW_SIDES = [
    { key: "frontDesign",       label: "Front" },
    { key: "backDesign",        label: "Back" },
    { key: "upperSleeveDesign", label: "Upper Sleeve" },
    { key: "lowerSleeveDesign", label: "Lower Sleeve" },
    { key: "centerDesign",      label: "Center" },
    { key: "pocketDesign",      label: "Pocket" },
];

const COMBO_SIDES = [
    { key: "frontDesign",  comboKey: "frontCombo",  label: "Front Preview" },
    { key: "backDesign",   comboKey: "backCombo",   label: "Back Preview" },
    { key: "centerDesign", comboKey: "centerCombo", label: "Center Preview" },
];

export function DTFBody({ auto, setAuto, printer, type, onAction }) {
    const [submitted, setSubmitted] = useState(null);

    const hasRaw   = submitted && RAW_SIDES.some(s => submitted[s.key]);
    const hasCombo = submitted && COMBO_SIDES.some(s => submitted[s.key]);

    return (
        <Box sx={{ bgcolor: "background.default", minHeight: "70vh", py: 2, display: "flex", flexDirection: "column" }}>

            <Scan auto={auto} setAuto={setAuto} setSubmitted={setSubmitted} printer={printer} type={type} onAction={onAction} />

            {/* Item info chips */}
            {submitted?.item && (
                <Box sx={{ px: { xs: 1, sm: "2%", md: "5%" }, mb: 2 }}>
                    <Card variant="outlined" sx={{ borderRadius: 3, px: 2, py: 1.5 }}>
                        <Stack direction="row" flexWrap="wrap" gap={1} alignItems="center">
                            <Chip
                                label={submitted.item.pieceId}
                                size="small"
                                sx={{ fontFamily: "monospace", fontWeight: 700, bgcolor: "#eff6ff", color: "#1d4ed8" }}
                            />
                            {submitted.item.blank?.code && (
                                <Chip label={submitted.item.blank.code} size="small" sx={{ fontWeight: 600 }} />
                            )}
                            {submitted.item.colorName && (
                                <Chip label={submitted.item.colorName} size="small"
                                    sx={{ bgcolor: "#f0fdf4", color: "#15803d", fontWeight: 600 }} />
                            )}
                            {submitted.item.sizeName && (
                                <Chip label={submitted.item.sizeName} size="small"
                                    sx={{ bgcolor: "#eff6ff", color: "#1d4ed8", fontWeight: 600 }} />
                            )}
                            {submitted.item.threadColorName && (
                                <Chip label={`Thread: ${submitted.item.threadColorName}`} size="small"
                                    sx={{ bgcolor: "#fdf4ff", color: "#7e22ce", fontWeight: 600 }} />
                            )}
                        </Stack>
                    </Card>
                </Box>
            )}

            {/* Custom "create your own" placement proof — how the finished piece should look
                (art on the garment at the buyer's exact placement). Shown for any item that has one. */}
            {submitted?.proofs && Object.keys(submitted.proofs).length > 0 && (
                <Box sx={{ px: { xs: 1, sm: "2%", md: "5%" }, mb: 3 }}>
                    <SectionLabel>How it should look</SectionLabel>
                    <Grid2 container spacing={2}>
                        {Object.keys(submitted.proofs).map(loc => (
                            <Grid2 key={loc} size={{ xs: 12, sm: 6, md: 4 }}>
                                <Card variant="outlined" sx={{ borderRadius: 2, overflow: "hidden", borderColor: "primary.light" }}>
                                    <Box sx={{ px: 1.5, py: 0.75, borderBottom: "1px solid", borderColor: "divider", bgcolor: "#eef6ff" }}>
                                        <Typography variant="caption" sx={{ fontWeight: 700, color: "primary.main", textTransform: "capitalize" }}>{loc}</Typography>
                                    </Box>
                                    <Box sx={{ bgcolor: "#fff", p: 2, display: "flex", justifyContent: "center" }}>
                                        <img
                                            width={500} height={500} alt={`${loc} proof`}
                                            style={{ width: "100%", height: "auto", maxWidth: 500, objectFit: "contain" }}
                                            src={`${submitted.proofs[loc]}?width=500&height=500`}
                                        />
                                    </Box>
                                </Card>
                            </Grid2>
                        ))}
                    </Grid2>
                </Box>
            )}

            {/* Standard item — raw designs + garment previews */}
            {submitted?.type === undefined && submitted?.item && (
                <Box sx={{ px: { xs: 1, sm: "2%", md: "5%" } }}>
                    {hasRaw && (
                        <>
                            <SectionLabel>DTF Designs</SectionLabel>
                            <Grid2 container spacing={2} sx={{ mb: 3 }}>
                                {submitted.styleImage && (
                                    <Grid2 size={{ xs: 12, sm: 4, md: 3 }}>
                                        <DesignCard src={submitted.styleImage} label="Garment" />
                                    </Grid2>
                                )}
                                {RAW_SIDES.filter(s => submitted[s.key]).map(({ key, label }) => (
                                    <Grid2 key={key} size={{ xs: 12, sm: 4, md: 3 }}>
                                        <DesignCard src={submitted[key]} label={label} />
                                    </Grid2>
                                ))}
                            </Grid2>
                        </>
                    )}

                    {hasCombo && (
                        <>
                            <Divider sx={{ mb: 2 }} />
                            <SectionLabel>Garment Preview</SectionLabel>
                            <Grid2 container spacing={2}>
                                {COMBO_SIDES.filter(s => submitted[s.key]).map(({ key, comboKey, label }) => (
                                    <Grid2 key={key} size={{ xs: 12, sm: 6, md: 4 }}>
                                        <DesignCard
                                            label={label}
                                            src={submitted.source !== "PP"
                                                ? createImage(submitted.colorName, submitted.styleCode, { url: submitted[key] })
                                                : submitted[comboKey] || "/blank.jpg"}
                                        />
                                    </Grid2>
                                ))}
                            </Grid2>
                        </>
                    )}
                </Box>
            )}

            {/* New-style item — rendered vs raw side by side */}
            {submitted?.type === "new" && submitted.images && (
                <Box sx={{ px: { xs: 1, sm: "2%", md: "5%" } }}>
                    <SectionLabel>Designs</SectionLabel>
                    <Stack spacing={2}>
                        {Object.keys(submitted.images).map(im => (
                            <Card key={im} variant="outlined" sx={{ borderRadius: 3, overflow: "hidden" }}>
                                <Box sx={{ px: 2, py: 1, borderBottom: "1px solid", borderColor: "divider" }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 700, textTransform: "capitalize" }}>{im}</Typography>
                                </Box>
                                <Grid2 container>
                                    <Grid2 size={6} sx={{ bgcolor: "#f3f4f6", p: 2, display: "flex", justifyContent: "center" }}>
                                        <img
                                            width={400} height={400} alt={im}
                                            style={{ width: "100%", height: "auto", maxWidth: 400, objectFit: "contain" }}
                                            src={createImage(
                                                submitted.colorName,
                                                submitted.styleCode ?? submitted.blankCode,
                                                { sku: submitted.designSku, url: submitted.images[im], side: (im === "back" || im === "namePlate") ? "back" : "front", printArea: im },
                                                400,
                                                submitted.source
                                            )}
                                        />
                                    </Grid2>
                                    <Grid2 size={6} sx={{ bgcolor: "#f3f4f6", p: 2, display: "flex", justifyContent: "center", borderLeft: "1px solid", borderColor: "divider" }}>
                                        <img
                                            width={400} height={400} alt={`${im} raw`}
                                            style={{ width: "100%", height: "auto", maxWidth: 400, objectFit: "contain" }}
                                            src={`${submitted.images[im]
                                                ?.replace("https://s3.wasabisys.com/teeshirtpalace-node-dev/", "https://images2.teeshirtpalace.com/")
                                                ?.replace("https://s3.us-east-1.wasabisys.com/teeshirtpalace-node-dev/", "https://images2.teeshirtpalace.com/")
                                                ?.replace("s3.wasabisys.com/images2.tshirtpalace.com/", "images2.teeshirtpalace.com/")}?width=400&height=400`}
                                        />
                                    </Grid2>
                                </Grid2>
                            </Card>
                        ))}
                    </Stack>
                </Box>
            )}

            <Box sx={{ px: { xs: 1, sm: "2%", md: "5%" }, mt: "auto", pt: 3 }}>
                <Repull />
            </Box>
        </Box>
    );
}

function SectionLabel({ children }) {
    return (
        <Typography variant="caption" sx={{ fontWeight: 700, color: "text.disabled", textTransform: "uppercase", letterSpacing: 0.5, display: "block", mb: 1 }}>
            {children}
        </Typography>
    );
}

function DesignCard({ src, label }) {
    return (
        <Card variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
            <Box sx={{ px: 1.5, py: 0.75, borderBottom: "1px solid", borderColor: "divider" }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary" }}>{label}</Typography>
            </Box>
            <Box sx={{ bgcolor: "#f3f4f6", p: 2, display: "flex", justifyContent: "center" }}>
                <Image src={src} width={350} height={350} alt={label}
                    style={{ width: "100%", height: "auto", objectFit: "contain" }} />
            </Box>
        </Card>
    );
}

"use client";
import { Box, Typography, Card, Grid2, Chip, Stack } from "@mui/material";
import { createImage } from "../../functions/image";
import { SafeImage } from "./SafeImage";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";

export function Items({ order, source }) {
    return (
        <Card variant="outlined" sx={{ flex: 1, borderRadius: 2, overflow: "hidden" }}>
            <Box sx={{ px: 2, py: 1.25, borderBottom: "1px solid", borderColor: "divider" }}>
                <Typography variant="subtitle1" fontWeight={700}>
                    Order Items
                    <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                        ({order.items.filter(i => !i.canceled && !i.shipped).length} pending)
                    </Typography>
                </Typography>
            </Box>
            <Box sx={{ p: 1 }}>
                {order.items.filter(i => !i.canceled && !i.shipped).map((it, i) => (
                    <Card
                        key={i}
                        variant="outlined"
                        sx={{ p: 1.5, mb: 1, borderRadius: 2, bgcolor: i % 2 === 0 ? "background.paper" : "action.hover" }}
                    >
                        <Grid2 container spacing={1.5} alignItems="center">
                            <Grid2 size={{ xs: 4, sm: 3 }}>
                                {it.design && Object.keys(it.design)[0] && (
                                    <SafeImage
                                        src={it.sku?.includes("gift")
                                            ? it.design.front.replace("https//:", "https://")
                                            : createImage(it.colorName, it.styleCode, { url: it.design[Object.keys(it.design)[0]], side: Object.keys(it.design)[0], threadColor: it.threadColorName }, source)}
                                        alt={it.pieceId}
                                        width={100}
                                        height={100}
                                        style={{ width: "100%", height: "auto", objectFit: "contain" }}
                                    />
                                )}
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
                ))}
            </Box>
        </Card>
    );
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

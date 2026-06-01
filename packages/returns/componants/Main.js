"use client";
import { Scan } from "./scan";
import { Box, Card, Typography, Grid2, TextField, Stack, Chip, Divider, InputAdornment } from "@mui/material";
import { useState, useRef } from "react";
import axios from "axios";
import { Footer } from "@pythias/backend";
import AssignmentReturnIcon from "@mui/icons-material/AssignmentReturn";
import BlockIcon from "@mui/icons-material/Block";
import BuildIcon from "@mui/icons-material/Build";
import ImageNotSupportedIcon from "@mui/icons-material/ImageNotSupported";

export function Main({ blanks, source }) {
    const [variant, setVariant]     = useState(null);
    const [inventory, setInventory] = useState(null);
    const [auto, setAuto]           = useState(true);

    const updateInventory = async (inv) => {
        const res = await axios.put("/api/production/returns", { inventory: inv })
            .catch(() => alert("Error updating inventory"));
        if (res?.data?.inventory) setInventory(res.data.inventory);
    };

    const handleOos = async (e) => {
        if (e.key !== "Enter") return;
        const upc = e.target.value.trim();
        if (!upc) return;
        e.target.value = "";
        const res = await axios.post("/api/production/returns/outofstock", { upc })
            .catch(() => alert("Error marking out of stock"));
        console.log("outofstock response", res?.data);
        if (res?.data) { setVariant(res.data.variant); setInventory(res.data.productInventory); }
    };

    const handleToProd = async (e) => {
        if (e.key !== "Enter") return;
        const upc = e.target.value.trim();
        if (!upc) return;
        e.target.value = "";
        const res = await axios.put("/api/production/returns/outofstock", { upc })
            .catch(() => alert("Error sending to production"));
        if (res?.data) { setVariant(res.data.variant); setInventory(res.data.productInventory); }
    };

    const sizeName = variant
        ? variant.blank.sizes.find(s => s._id.toString() === variant.size.toString())?.name
        : null;

    return (
        <Box sx={{ bgcolor: "background.default", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
            {/* Header */}
            <Box sx={{ bgcolor: "background.paper", borderBottom: "1px solid", borderColor: "divider", px: 2, py: 2 }}>
                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
                    <Box sx={{ width: 36, height: 36, borderRadius: 2, background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <AssignmentReturnIcon sx={{ color: "#fff", fontSize: 20 }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: -0.5, lineHeight: 1.2 }}>Returns</Typography>
                        <Typography variant="body2" color="text.secondary">Scan a UPC to look up and update product inventory</Typography>
                    </Box>
                </Stack>

                <Grid2 container spacing={1.5}>
                    <Grid2 size={{ xs: 12, sm: 6 }}>
                        <TextField
                            fullWidth size="small" label="Out Of Stock (UPC)"
                            onKeyDown={handleOos}
                            InputProps={{ startAdornment: <InputAdornment position="start"><BlockIcon fontSize="small" color="error" /></InputAdornment> }}
                        />
                    </Grid2>
                    <Grid2 size={{ xs: 12, sm: 6 }}>
                        <TextField
                            fullWidth size="small" label="To Production (Piece ID)"
                            onKeyDown={handleToProd}
                            InputProps={{ startAdornment: <InputAdornment position="start"><BuildIcon fontSize="small" color="warning" /></InputAdornment> }}
                        />
                    </Grid2>
                </Grid2>
            </Box>

            {/* Scan */}
            <Box sx={{ px: 2, pt: 2 }}>
                <Scan blanks={blanks} setVariant={setVariant} setInventory={setInventory} auto={auto} setAuto={setAuto} />
            </Box>

            {/* Item info */}
            <Box sx={{ px: 2, py: 2, flex: 1 }}>
                {variant && inventory ? (
                    <Card variant="outlined" sx={{ borderRadius: 2 }}>
                        <Box sx={{ px: 2, py: 1.5, borderBottom: "1px solid", borderColor: "divider" }}>
                            <Typography variant="subtitle1" fontWeight={700}>Item Information</Typography>
                        </Box>
                        <Box sx={{ p: 2 }}>
                            <Grid2 container spacing={2} alignItems="flex-start">
                                {/* Image */}
                                <Grid2 size={{ xs: 12, sm: 3 }} sx={{ display: "flex", justifyContent: "center" }}>
                                    {variant.image ? (
                                        <img
                                            src={variant.image.replace("width=400", "width=400")}
                                            width={200} height={200} alt="Variant"
                                            style={{ objectFit: "cover", borderRadius: 8, background: "#e3e3e3" }}
                                        />
                                    ) : (
                                        <Box sx={{ width: 200, height: 200, display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "action.hover", borderRadius: 2 }}>
                                            <ImageNotSupportedIcon sx={{ color: "text.disabled", fontSize: 48 }} />
                                        </Box>
                                    )}
                                </Grid2>

                                {/* Details */}
                                <Grid2 size={{ xs: 12, sm: 5 }}>
                                    <Stack spacing={0.75}>
                                        {[
                                            { label: "SKU",   value: <Chip label={variant.sku} size="small" sx={{ fontFamily: "monospace", fontWeight: 700 }} /> },
                                            { label: "UPC",   value: <Chip label={variant.upc} size="small" variant="outlined" sx={{ fontFamily: "monospace" }} /> },
                                            { label: "Blank", value: <Chip label={variant.blank.code} size="small" color="primary" variant="outlined" sx={{ fontFamily: "monospace", fontWeight: 700 }} /> },
                                            { label: "Color", value: <Typography variant="body2" sx={{ textTransform: "capitalize" }}>{variant.color.name}</Typography> },
                                            { label: "Size",  value: <Chip label={sizeName ?? "—"} size="small" variant="outlined" sx={{ textTransform: "uppercase", fontWeight: 600 }} /> },
                                            { label: "Price", value: <Typography variant="body2" fontWeight={700}>${variant.price}</Typography> },
                                        ].map(({ label, value }) => (
                                            <Stack key={label} direction="row" alignItems="center" spacing={1}>
                                                <Typography variant="caption" color="text.secondary" sx={{ width: 48, flexShrink: 0 }}>{label}</Typography>
                                                {value}
                                            </Stack>
                                        ))}
                                    </Stack>
                                </Grid2>

                                {/* Editable fields */}
                                <Grid2 size={{ xs: 12, sm: 4 }}>
                                    <Stack spacing={1.5}>
                                        <TextField
                                            size="small" fullWidth label="Quantity" type="number"
                                            value={inventory.quantity}
                                            inputProps={{ min: 0 }}
                                            onChange={(e) => setInventory(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                                            onBlur={(e) => updateInventory({ ...inventory, quantity: parseInt(e.target.value) || 0 })}
                                        />
                                        <TextField
                                            size="small" fullWidth label="Location"
                                            placeholder="Not set"
                                            value={inventory.location ?? ""}
                                            onChange={(e) => setInventory(prev => ({ ...prev, location: e.target.value }))}
                                            onBlur={(e) => updateInventory({ ...inventory, location: e.target.value })}
                                        />
                                    </Stack>
                                </Grid2>
                            </Grid2>
                        </Box>
                    </Card>
                ) : (
                    <Box sx={{ textAlign: "center", py: 8, color: "text.secondary" }}>
                        <AssignmentReturnIcon sx={{ fontSize: 48, mb: 1, opacity: 0.3 }} />
                        <Typography>Scan a UPC or find an item manually to get started</Typography>
                    </Box>
                )}
            </Box>

            <Footer fixed={true} />
        </Box>
    );
}

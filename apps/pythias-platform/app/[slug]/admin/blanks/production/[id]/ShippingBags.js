import { Box, Grid, Typography, Card, CardContent, CardActionArea, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Stack, Chip } from "@mui/material"
import Image from "next/image"
import multiple from "./images/multipleSizesBags.jpg"
import boxes from "./images/boxes.webp"
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import EditIcon from '@mui/icons-material/Edit'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import { useState } from "react"

export function Standard({ blank, setBlank, save, dimensions, setDimensions }) {
    const [selected, setSelected] = useState(blank.singleShippingDimensions?.name)
    const [packageSelected, setPackageSelected] = useState(blank.singleShippingDimensions?.packageType)
    const [customOpen, setCustomOpen] = useState(false)
    const [customDims, setCustomDims] = useState({ width: "", length: "", height: "" })

    const packaging = {
        Mailer: {
            image: multiple,
            description: "Poly mailer bags — lightweight and flexible",
            small:       { image: multiple, width: 5,  length: 6,  height: 1 },
            medium:      { image: multiple, width: 10, length: 13, height: 1 },
            large:       { image: multiple, width: 14, length: 19, height: 2 },
            extra_large: { image: multiple, width: 19, length: 24, height: 4 },
            set_your_own:{ image: multiple, width: 0,  length: 0,  height: 0 },
        },
        Box: {
            image: boxes,
            description: "Rigid shipping boxes — ideal for delicate items",
            small:       { image: boxes, width: 7,  length: 7,  height: 4 },
            medium:      { image: boxes, width: 8,  length: 8,  height: 4 },
            large:       { image: boxes, width: 10, length: 10, height: 6 },
            extra_large: { image: boxes, width: 6,  length: 12, height: 6 },
            set_your_own:{ image: boxes, width: 0,  length: 0,  height: 0 },
        }
    }

    const applySize = (k, dims) => {
        const data = { ...dims, name: k, packageType: packageSelected }
        let b = { ...blank }
        b.singleShippingDimensions = data
        setBlank(b)
        save(b)
        setSelected(k)
        setDimensions(data)
    }

    const sizeLabel = (k) => k === "set_your_own" ? "Custom" : k.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())

    return (
        <Box>
            {/* Package type selection */}
            {!packageSelected && (
                <>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Choose a package type to get started.</Typography>
                    <Grid container spacing={2}>
                        {Object.keys(packaging).map(k => (
                            <Grid item xs={12} sm={6} key={k}>
                                <Card variant="outlined" sx={{ borderRadius: 2, transition: "box-shadow 150ms", "&:hover": { boxShadow: 4 } }}>
                                    <CardActionArea onClick={() => setPackageSelected(k)} sx={{ p: 2, textAlign: "center" }}>
                                        <Image src={packaging[k].image} alt={k} width={160} height={160} style={{ objectFit: "contain" }} />
                                        <Typography variant="h6" sx={{ fontWeight: 700, mt: 1 }}>{k}</Typography>
                                        <Typography variant="caption" color="text.secondary">{packaging[k].description}</Typography>
                                    </CardActionArea>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </>
            )}

            {/* Size selection */}
            {packageSelected && (
                <>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Chip label={packageSelected} color="primary" size="small" />
                            <Typography variant="body2" color="text.secondary">Select a size</Typography>
                        </Box>
                        <Button size="small" startIcon={<ArrowBackIcon />} onClick={() => setPackageSelected(null)}>Change type</Button>
                    </Box>

                    <Grid container spacing={1.5}>
                        {Object.keys(packaging[packageSelected]).filter(k => k !== "image" && k !== "description").map(k => {
                            const sz = packaging[packageSelected][k]
                            const isSelected = selected === k
                            const isCustom = k === "set_your_own"
                            const customSaved = isCustom && isSelected && blank.singleShippingDimensions

                            return (
                                <Grid item xs={6} sm={4} key={k}>
                                    <Card
                                        variant="outlined"
                                        sx={{
                                            borderRadius: 2,
                                            borderColor: isSelected ? "primary.main" : "divider",
                                            borderWidth: isSelected ? 2 : 1,
                                            transition: "box-shadow 150ms, border-color 150ms",
                                            "&:hover": { boxShadow: 3 },
                                            position: "relative",
                                        }}
                                    >
                                        {isSelected && (
                                            <CheckCircleIcon sx={{ position: "absolute", top: 6, right: 6, color: "primary.main", fontSize: 18 }} />
                                        )}
                                        <CardActionArea
                                            onClick={() => {
                                                if (isCustom) {
                                                    const existing = blank.singleShippingDimensions?.name === "set_your_own" ? blank.singleShippingDimensions : {}
                                                    setCustomDims({ width: existing.width || "", length: existing.length || "", height: existing.height || "" })
                                                    setCustomOpen(true)
                                                    return
                                                }
                                                applySize(k, sz)
                                            }}
                                            sx={{ p: 2, textAlign: "center" }}
                                        >
                                            <Typography variant="subtitle2" sx={{ fontWeight: 700, textTransform: "capitalize", mb: 0.5 }}>
                                                {sizeLabel(k)}
                                            </Typography>

                                            {isCustom ? (
                                                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5 }}>
                                                    {customSaved ? (
                                                        <Chip
                                                            size="small"
                                                            label={`${blank.singleShippingDimensions.width} × ${blank.singleShippingDimensions.length} × ${blank.singleShippingDimensions.height} in`}
                                                            color="primary"
                                                            variant="outlined"
                                                        />
                                                    ) : (
                                                        <Typography variant="caption" color="text.secondary">Set your own dimensions</Typography>
                                                    )}
                                                    <EditIcon sx={{ fontSize: 16, color: "text.secondary", mt: 0.5 }} />
                                                </Box>
                                            ) : (
                                                <Chip
                                                    size="small"
                                                    label={`${sz.width} × ${sz.length} × ${sz.height} in`}
                                                    variant={isSelected ? "filled" : "outlined"}
                                                    color={isSelected ? "primary" : "default"}
                                                />
                                            )}
                                        </CardActionArea>
                                    </Card>
                                </Grid>
                            )
                        })}
                    </Grid>
                </>
            )}

            {/* Custom size dialog */}
            <Dialog open={customOpen} onClose={() => setCustomOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ fontWeight: 700 }}>Custom Bag Size</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Enter the dimensions in inches.</Typography>
                    <Stack spacing={2}>
                        <TextField
                            label="Width (in)"
                            type="number"
                            inputProps={{ min: 0, step: 0.1 }}
                            value={customDims.width}
                            onChange={(e) => setCustomDims(prev => ({ ...prev, width: e.target.value }))}
                            fullWidth
                            size="small"
                        />
                        <TextField
                            label="Length (in)"
                            type="number"
                            inputProps={{ min: 0, step: 0.1 }}
                            value={customDims.length}
                            onChange={(e) => setCustomDims(prev => ({ ...prev, length: e.target.value }))}
                            fullWidth
                            size="small"
                        />
                        <TextField
                            label="Height (in)"
                            type="number"
                            inputProps={{ min: 0, step: 0.1 }}
                            value={customDims.height}
                            onChange={(e) => setCustomDims(prev => ({ ...prev, height: e.target.value }))}
                            fullWidth
                            size="small"
                        />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setCustomOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={() => {
                        const dims = {
                            width: parseFloat(customDims.width) || 0,
                            length: parseFloat(customDims.length) || 0,
                            height: parseFloat(customDims.height) || 0,
                            image: packaging[packageSelected].set_your_own.image,
                        }
                        applySize("set_your_own", dims)
                        setCustomOpen(false)
                    }}>Save</Button>
                </DialogActions>
            </Dialog>
        </Box>
    )
}

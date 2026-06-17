import { Box, Typography, Card, TextField, Grid2, Button, FormControlLabel, Checkbox, FormControl, FormLabel, RadioGroup, Radio, Divider, Chip, Stack, CircularProgress, Switch } from "@mui/material";
import Image from "next/image";
import { createImage } from "../../functions/image";
import { SafeImage } from "./SafeImage";
import * as multiple from "../../images/multipleSizesBags.jpg";
import * as boxes from "../../images/boxes.webp";
import * as fedexen from "../../images/fedexen.jpg";
import * as fedexpak from "../../images/fedexpak.jpg";
import { useState, useEffect } from "react";
import LoaderOverlay from "./LoaderOverlay";
import axios from "axios";
import ScaleIcon from "@mui/icons-material/Scale";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import PrintIcon               from "@mui/icons-material/Print";
import StorefrontIcon          from "@mui/icons-material/Storefront";

const IMAGE_MAP = {
    mailer:   multiple,
    box:      boxes,
    envelope: fedexen,
    pak:      fedexpak,
};

const getImage = (imageKey) => IMAGE_MAP[imageKey] ?? multiple;

export function Actions({ bin, setBins, item, order, action, setAction, shippingPrices, setShippingPrices, timer, weight, setWeight, setGetWeight, getWeight, loadingWeight, dimensions, setDimensions, close, station, closeTimer, setCloseTimer, setStopClose, stopClose, label, setLabel, source, onAction, multiBox, setMultiBox, boxes, setBoxes, addBox, setGetManualRates, blankWeight, trainingMode }) {
    const [shippingSelected, setShippingSelected] = useState({ name: "GroundAdvantage" });
    const [ignoreBadAddress, setIgnoreBadAddress] = useState(false);
    const [processing, setProcessing]             = useState(false);
    const [saterdayDelivery, setSaterdayDelivery] = useState(false);
    const [pickupDone,  setPickupDone]            = useState(false);

    useEffect(() => {
        if (shippingPrices) {
            const cheapest = [...shippingPrices].sort((a, b) => a.rate - b.rate)[0].service;
            setShippingSelected(cheapest);
        }
    }, [shippingPrices]);

    // ── Training mode: a trainee must scan every piece in the order before the label can print. ──
    const [scanned, setScanned] = useState([]);
    const [scanInput, setScanInput] = useState("");
    const [scanErr, setScanErr] = useState("");
    const requiredPieces = (order?.items || [])
        .filter(i => !i.canceled && !i.cancelled && i.pieceId)
        .map(i => String(i.pieceId).toUpperCase());
    const scannedSet = new Set(scanned);
    const scannedCount = requiredPieces.filter(p => scannedSet.has(p)).length;
    const allScanned = requiredPieces.length > 0 && scannedCount === requiredPieces.length;
    // Reset the checklist whenever the open order changes.
    useEffect(() => { setScanned([]); setScanInput(""); setScanErr(""); }, [order?._id]);
    const handleScan = (raw) => {
        const code = String(raw || "").trim().toUpperCase();
        setScanInput("");
        if (!code) return;
        if (!requiredPieces.includes(code)) {
            setScanErr(`✕ ${code} is NOT part of this order — wrong item, do not pack it.`);
            return;
        }
        setScanErr("");
        setScanned(prev => prev.includes(code) ? prev : [...prev, code]);
    };

    const ship = async () => {
        if (trainingMode && !allScanned) { setScanErr("Scan every item before shipping."); return; }
        setProcessing(true);
        const currentBox = weight > 0 && dimensions ? [{ weight, dimensions }] : [];
        const packages = multiBox ? [...boxes, ...currentBox] : null;
        const totalWeight = packages ? packages.reduce((s, p) => s + p.weight, 0) : weight;
        const shipDimensions = packages ? packages[0].dimensions : dimensions;
        const res = await axios.post("/api/production/shipping/labels", {
            address: order.shippingAddress,
            poNumber: order.poNumber,
            orderId: order._id,
            selectedShipping: shippingSelected,
            dimensions: shipDimensions, weight: totalWeight,
            packages,
            shippingType: order.shippingType,
            station, ignoreBadAddress,
            marketplace: order.marketplace,
            scannedPieceIds: scanned,
            items: order.items.map(i => ({
                itemDescription: i.sku,
                itemTotalValue: i.productCost,
                itemQuantity: parseInt(i.quantity),
                countryofOrigin: "US",
                weightUOM: "lb",
                itemTotalWeight: (totalWeight / order.items.length) / 16,
                saterdayDelivery,
            })),
        });
        if (res.data.error) {
            alert(res.data.msg);
            setProcessing(false);
        } else {
            setLabel(res.data.label);
            setBins(res.data.bins);
            setShippingPrices();
            setProcessing(false);
            onAction?.();
        }
    };

    const markPickedUp = async () => {
        setProcessing(true);
        try {
            const res = await axios.post("/api/production/shipping/pickup", { orderId: order._id });
            if (res.data.error) { alert(res.data.msg || "Failed"); }
            else { setPickupDone(true); setBins(res.data.bins); onAction?.(); }
        } finally { setProcessing(false); }
    };

    const reprint = async (lbl) => {
        const res = await axios.post("/api/production/shipping/labels/reprint", { label: lbl, station });
        if (res.data.error) alert(res.data.msg);
        else setLabel(res.data.label);
    };

    const reprintLabel = async () => {
        setStopClose(true);
        reprint(label);
        setLabel();
    };

    const updateDimensions = (field, value) => {
        setShippingPrices();
        setDimensions(prev => ({ ...prev, [field]: parseFloat(value) || 0 }));
    };

    return (
        <Card variant="outlined" sx={{ borderRadius: 3, overflow: "hidden" }}>
            {/* Place item in bin */}
            {action.includes("bin") && (
                <Box sx={{ p: 4, textAlign: "center" }}>
                    <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
                        <SafeImage
                            src={item?.design && Object.keys(item.design)[0]
                                ? (item.sku?.includes("gift")
                                    ? item.design.front.replace("https//:", "https://")
                                    : createImage(item?.colorName, item?.styleCode, { url: item.design[Object.keys(item.design)[0]], side: Object.keys(item.design)[0], threadColor: item.threadColorName }, source))
                                : null}
                            alt={item?.pieceId}
                            width={250}
                            height={250}
                            style={{ objectFit: "contain" }}
                        />
                    </Box>
                    <Typography variant="h5" fontWeight={600} color="text.secondary" gutterBottom>
                        Place Item In Bin
                    </Typography>
                    <Typography variant="h1" fontWeight={900} color="primary.main" sx={{ lineHeight: 1 }}>
                        {bin ? bin.number : "All Bins Full"}
                    </Typography>
                    {action === "bin/ship" && (
                        <Button
                            variant="contained"
                            size="large"
                            fullWidth
                            sx={{ mt: 3 }}
                            onClick={() => setAction("ship")}
                        >
                            Order is ready to ship — ship now?
                        </Button>
                    )}
                    {action === "bin/pickup" && (
                        <Box sx={{ mt: 3 }}>
                            <Box sx={{ display: "flex", justifyContent: "center", mb: 1 }}>
                                <StorefrontIcon sx={{ fontSize: 48, color: "success.main" }} />
                            </Box>
                            <Typography variant="h5" fontWeight={700} color="success.main" gutterBottom>
                                Ready for Pickup
                            </Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                All items are in bin — customer can pick up
                            </Typography>
                        </Box>
                    )}
                </Box>
            )}

            {/* In-store pickup flow — shown when bin is ready for pickup */}
            {(action === "bin/pickup" || (action === "ship" && order?.inStorePickup)) && (
                <Box sx={{ p: 4, textAlign: "center" }}>
                    {pickupDone ? (
                        <>
                            <CheckCircleOutlineIcon sx={{ fontSize: 72, color: "success.main", mb: 1 }} />
                            <Typography variant="h4" fontWeight={800} color="success.main">Picked Up!</Typography>
                        </>
                    ) : (
                        <>
                            <StorefrontIcon sx={{ fontSize: 64, color: "primary.main", mb: 2 }} />
                            <Typography variant="h5" fontWeight={700} gutterBottom>In-Store Pickup</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                Bin {bin?.number ?? "—"} · {order?.shippingAddress?.name ?? "Customer"}
                            </Typography>
                            <Button
                                variant="contained"
                                color="success"
                                size="large"
                                fullWidth
                                onClick={markPickedUp}
                                disabled={processing}
                                startIcon={processing ? <CircularProgress size={20} color="inherit" /> : <CheckCircleOutlineIcon />}
                            >
                                {processing ? "Processing…" : "Picked Up"}
                            </Button>
                        </>
                    )}
                </Box>
            )}

            {/* Ship flow */}
            {action === "ship" && !order?.inStorePickup && (
                <Box sx={{ p: 3 }}>
                    {trainingMode && (
                        <Box sx={{ mb: 2, p: 2, borderRadius: 2, border: "2px solid", borderColor: allScanned ? "success.main" : "warning.main", bgcolor: allScanned ? "#f1f8f4" : "#fff8e1" }}>
                            <Typography fontWeight={800} sx={{ mb: 0.25 }}>
                                Training mode — scan every item ({scannedCount}/{requiredPieces.length})
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                                Scan each piece's barcode before packaging. The label won't print until every item in this order is scanned.
                            </Typography>
                            <TextField
                                size="small" fullWidth autoFocus
                                label="Scan item barcode"
                                value={scanInput}
                                onChange={(e) => setScanInput(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleScan(scanInput); } }}
                                sx={{ mb: 1.5 }}
                            />
                            {scanErr && (
                                <Box sx={{ mb: 1.5, p: 1, borderRadius: 1, bgcolor: "error.main", color: "#fff", fontWeight: 700, fontSize: "0.9rem" }}>{scanErr}</Box>
                            )}
                            <Stack spacing={0.75}>
                                {requiredPieces.map((p) => {
                                    const it = (order.items || []).find(i => String(i.pieceId).toUpperCase() === p);
                                    const done = scannedSet.has(p);
                                    return (
                                        <Stack key={p} direction="row" alignItems="center" spacing={1} sx={{ p: 0.75, borderRadius: 1, bgcolor: done ? "#e8f5e9" : "#fafafa" }}>
                                            {done ? <CheckCircleOutlineIcon fontSize="small" sx={{ color: "success.main" }} /> : <Box sx={{ width: 18, height: 18, borderRadius: "50%", border: "2px solid #bbb", flexShrink: 0 }} />}
                                            <Typography variant="body2" sx={{ fontFamily: "monospace", fontWeight: 700 }}>{p}</Typography>
                                            <Typography variant="caption" color="text.secondary" sx={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                {[it?.colorName, it?.sizeName, it?.sku || it?.styleCode].filter(Boolean).join(" · ")}
                                            </Typography>
                                            {done && <Chip size="small" color="success" label="Scanned" />}
                                        </Stack>
                                    );
                                })}
                            </Stack>
                            {allScanned && <Typography sx={{ mt: 1, color: "success.main", fontWeight: 700 }}>✓ All items scanned — package &amp; ship.</Typography>}
                        </Box>
                    )}
                    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                        <Typography variant="subtitle1" fontWeight={700}>
                            Shipping Type: {order.shippingType}
                        </Typography>
                        <FormControlLabel
                            control={<Switch size="small" checked={!!multiBox} onChange={e => {
                                const on = e.target.checked;
                                if (!on && boxes.length > 0) {
                                    // Restore total weight and first box dimensions for single-box mode
                                    const total = blankWeight > 0
                                        ? blankWeight
                                        : boxes.reduce((s, b) => s + b.weight, 0) + (weight || 0);
                                    setWeight(total);
                                    setDimensions(boxes[0].dimensions);
                                }
                                setMultiBox(on);
                                setBoxes([]);
                            }} />}
                            label={<Typography variant="body2" color="text.secondary">Multiple Boxes</Typography>}
                            sx={{ mr: 0 }}
                        />
                    </Stack>

                    {/* Completed boxes list */}
                    {multiBox && boxes.length > 0 && (
                        <Box sx={{ mb: 2, p: 1.5, borderRadius: 1, bgcolor: "action.hover" }}>
                            <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 0.5, display: "block", mb: 0.75 }}>
                                Boxes Added ({boxes.length})
                            </Typography>
                            <Stack direction="row" flexWrap="wrap" useFlexGap spacing={0.75}>
                                {boxes.map((b, i) => (
                                    <Chip
                                        key={i}
                                        label={`Box ${i + 1}: ${b.weight}oz — ${b.dimensions.width}×${b.dimensions.length}×${b.dimensions.height}`}
                                        size="small"
                                        onDelete={() => setBoxes(prev => prev.filter((_, j) => j !== i))}
                                    />
                                ))}
                            </Stack>
                        </Box>
                    )}

                    {/* Countdown to weigh */}
                    {timer > 0 && !closeTimer && (
                        <Box sx={{ textAlign: "center", py: 5 }}>
                            <ScaleIcon sx={{ fontSize: 72, color: "primary.main", mb: 1 }} />
                            <Typography variant="h3" fontWeight={800} gutterBottom>Getting Weight In: {timer}</Typography>
                            <Typography variant="body1" color="text.secondary">
                                Ensure the scale is on and the order is on the scale!
                            </Typography>
                        </Box>
                    )}

                    {/* Weight + dimensions + rates */}
                    {timer === 0 && weight > 0 && (
                        <Box>
                            <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
                                {multiBox && blankWeight > 0 ? (
                                    <Stack spacing={0.5} alignItems="center">
                                        <Typography variant="body2" color="text.secondary">
                                            Total: {blankWeight}oz &nbsp;·&nbsp; Remaining after this box: <strong>{Math.max(0, blankWeight - boxes.reduce((s, b) => s + b.weight, 0) - weight)}oz</strong>
                                        </Typography>
                                        <Stack direction="row" alignItems="center" spacing={1}>
                                            <Chip icon={<ScaleIcon />} label={`Box ${boxes.length + 1}`} color="primary" size="small" />
                                            <TextField
                                                type="number"
                                                size="small"
                                                label="Weight (oz)"
                                                value={weight}
                                                onChange={e => setWeight(Math.max(0, parseFloat(e.target.value) || 0))}
                                                sx={{ width: 120 }}
                                                inputProps={{ min: 0 }}
                                            />
                                        </Stack>
                                    </Stack>
                                ) : (
                                    <Stack direction="row" alignItems="center" spacing={1}>
                                        <Chip
                                            icon={<ScaleIcon />}
                                            label={`${weight} oz`}
                                            color="primary"
                                            sx={{ fontWeight: 700, fontSize: "1.05rem", height: 38, px: 1.5 }}
                                        />
                                        {multiBox && (
                                            <Typography variant="caption" color="text.secondary">
                                                Box {boxes.length + 1}
                                            </Typography>
                                        )}
                                    </Stack>
                                )}
                            </Box>

                            {!dimensions && (order.shippingType === "Standard" || order.shippingType === "Expedited") && (
                                <Standard setDimensions={setDimensions} />
                            )}
                            {!dimensions && order.shippingType !== "Standard" && order.shippingType !== "Expedited" && (
                                <Expedited setDimensions={setDimensions} />
                            )}

                            {dimensions && (
                                <Box>
                                    <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
                                        <Image src={getImage(dimensions.imageKey)} width={140} height={140} alt="package" style={{ objectFit: "contain" }} />
                                    </Box>
                                    <Stack direction="row" spacing={1} justifyContent="center">
                                        <TextField
                                            type="number" label="Width" size="small" sx={{ width: 110 }}
                                            value={dimensions.width ?? 0}
                                            onChange={(e) => updateDimensions("width", e.target.value)}
                                        />
                                        <TextField
                                            type="number" label="Length" size="small" sx={{ width: 110 }}
                                            value={dimensions.length ?? 0}
                                            onChange={(e) => updateDimensions("length", e.target.value)}
                                        />
                                        <TextField
                                            type="number" label="Height" size="small" sx={{ width: 110 }}
                                            value={dimensions.height ?? 0}
                                            onChange={(e) => updateDimensions("height", e.target.value)}
                                        />
                                    </Stack>
                                    {multiBox && (
                                        <Stack direction="row" spacing={1} justifyContent="center" sx={{ mt: 2 }}>
                                            <Button variant="outlined" onClick={addBox}>
                                                + Add Box {boxes.length + 1}
                                            </Button>
                                            {boxes.length > 0 && (
                                                <Button variant="contained" onClick={() => setGetManualRates(true)}>
                                                    Get Rates ({boxes.length + 1} boxes)
                                                </Button>
                                            )}
                                        </Stack>
                                    )}
                                </Box>
                            )}
                        </Box>
                    )}

                    {/* No weight — loading or weigh again */}
                    {timer === 0 && weight === 0 && (
                        <Box sx={{ textAlign: "center", py: 3 }}>
                            {loadingWeight
                                ? <CircularProgress />
                                : (
                                    <Stack spacing={1} alignItems="center">
                                        {multiBox && boxes.length > 0 && (
                                            <Button variant="contained" size="large" onClick={() => setGetManualRates(true)}>
                                                Done — Get Rates ({boxes.length} {boxes.length === 1 ? "box" : "boxes"})
                                            </Button>
                                        )}
                                        <Button
                                            variant={multiBox && boxes.length > 0 ? "outlined" : "contained"}
                                            size="large"
                                            startIcon={<ScaleIcon />}
                                            onClick={() => setGetWeight(!getWeight)}
                                        >
                                            {multiBox && boxes.length > 0 ? `Weigh Box ${boxes.length + 1}` : "Weigh Again"}
                                        </Button>
                                    </Stack>
                                )
                            }
                        </Box>
                    )}

                    {/* Shipping rates */}
                    {shippingPrices && (
                        <Box sx={{ mt: 3 }}>
                            <Divider sx={{ mb: 2 }} />
                            <FormControl fullWidth>
                                <FormLabel sx={{ fontWeight: 700, fontSize: "0.95rem", mb: 1, color: "text.primary" }}>
                                    Shipping Rates
                                </FormLabel>
                                <RadioGroup
                                    value={shippingSelected?.name ?? ""}
                                    onChange={(e) => setShippingSelected(shippingPrices.filter(s => s.service.name === e.target.value)[0]?.service)}
                                >
                                    {[...shippingPrices].sort((a, b) => a.rate - b.rate).map((p, i) => (
                                        <FormControlLabel
                                            key={i}
                                            value={p.service.name}
                                            control={<Radio />}
                                            label={
                                                <Stack direction="row" spacing={1} alignItems="center">
                                                    <Typography variant="body2" fontWeight={600}>{p.label}</Typography>
                                                    <Chip label={`$${p.rate}`} size="small" color="primary" variant="outlined" sx={{ fontWeight: 700 }} />
                                                </Stack>
                                            }
                                        />
                                    ))}
                                </RadioGroup>
                                <FormControlLabel
                                    control={<Checkbox checked={saterdayDelivery} onChange={(e) => setSaterdayDelivery(e.target.checked)} />}
                                    label="Saturday Delivery"
                                />
                            </FormControl>
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1.5 }}>
                                <Button
                                    variant="contained"
                                    size="large"
                                    fullWidth
                                    onClick={ship}
                                    disabled={processing || (trainingMode && !allScanned)}
                                >
                                    {trainingMode && !allScanned ? `Scan all items (${scannedCount}/${requiredPieces.length})` : "Ship Order"}
                                </Button>
                                <FormControlLabel
                                    control={<Checkbox checked={ignoreBadAddress} onChange={(e) => setIgnoreBadAddress(e.target.checked)} size="small" />}
                                    label={<Typography variant="caption" color="text.secondary">Ignore Address</Typography>}
                                    sx={{ whiteSpace: "nowrap", mr: 0 }}
                                />
                            </Stack>
                            {processing && <LoaderOverlay open={processing} />}
                        </Box>
                    )}

                    {/* Closing countdown */}
                    {timer > 0 && closeTimer && dimensions && (
                        <Box sx={{ textAlign: "center", py: 4 }}>
                            <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
                                <Image src={getImage(dimensions.imageKey)} width={100} height={100} alt="package" style={{ objectFit: "contain" }} />
                            </Box>
                            <CheckCircleOutlineIcon sx={{ fontSize: 72, color: "success.main" }} />
                            <Typography variant="h4" fontWeight={800} color="success.main" gutterBottom>
                                Label Printed!
                            </Typography>
                            <Typography variant="h5" fontWeight={600} sx={{ mb: 2 }}>
                                Closing In: {timer}
                            </Typography>
                            <Button
                                variant="outlined"
                                startIcon={<PrintIcon />}
                                size="large"
                                onClick={reprintLabel}
                            >
                                Reprint Label
                            </Button>
                        </Box>
                    )}
                </Box>
            )}
        </Card>
    );
}

const Standard = ({ setDimensions }) => {
    const [packageSelected, setPackageSelected] = useState();

    const packaging = {
        Mailer: {
            imageKey: "mailer",
            small:      { imageKey: "mailer", width: 5,  length: 6,  height: 1 },
            medium:     { imageKey: "mailer", width: 10, length: 13, height: 1 },
            large:      { imageKey: "mailer", width: 14, length: 19, height: 2 },
            extra_large:{ imageKey: "mailer", width: 19, length: 24, height: 4 },
            set_your_own:{ imageKey: "mailer", width: 0, length: 0,  height: 0 },
        },
        Box: {
            imageKey: "box",
            small:      { imageKey: "box", width: 7,  length: 7,  height: 4 },
            medium:     { imageKey: "box", width: 8,  length: 8,  height: 4 },
            large:      { imageKey: "box", width: 10, length: 10, height: 6 },
            extra_large:{ imageKey: "box", width: 6,  length: 12, height: 6 },
            set_your_own:{ imageKey: "box", width: 0, length: 0,  height: 0 },
        },
    };

    return (
        <PackageSelector
            packaging={packaging}
            packageSelected={packageSelected}
            setPackageSelected={setPackageSelected}
            setDimensions={setDimensions}
        />
    );
};

const Expedited = ({ setDimensions }) => {
    const [packageSelected, setPackageSelected] = useState();

    const packaging = {
        Envelope: {
            imageKey: "envelope",
            oneRate: { imageKey: "envelope", width: 9,  length: 15, height: 1, packaging: "FEDEX_ENVELOPE" },
        },
        Pak: {
            imageKey: "pak",
            oneRate: { imageKey: "pak", width: 12, length: 16, height: 3, packaging: "FEDEX_PAK" },
        },
        Mailer: {
            imageKey: "mailer",
            small:      { imageKey: "mailer", width: 5,    length: 6,  height: 1, packaging: "YOUR_PACKAGING" },
            medium:     { imageKey: "mailer", width: 10,   length: 13, height: 1, packaging: "YOUR_PACKAGING" },
            large:      { imageKey: "mailer", width: 14.5, length: 19, height: 2, packaging: "YOUR_PACKAGING" },
            extra_large:{ imageKey: "mailer", width: 19,   length: 24, height: 4, packaging: "YOUR_PACKAGING" },
            set_your_own:{ imageKey: "mailer", width: 0,   length: 0,  height: 0, packaging: "YOUR_PACKAGING" },
        },
        Box: {
            imageKey: "box",
            small:      { imageKey: "box", width: 7,  length: 7,  height: 4, packaging: "YOUR_PACKAGING" },
            medium:     { imageKey: "box", width: 8,  length: 8,  height: 4, packaging: "YOUR_PACKAGING" },
            large:      { imageKey: "box", width: 10, length: 10, height: 6, packaging: "YOUR_PACKAGING" },
            extra_large:{ imageKey: "box", width: 6,  length: 12, height: 6, packaging: "YOUR_PACKAGING" },
            set_your_own:{ imageKey: "box", width: 0, length: 0,  height: 0, packaging: "YOUR_PACKAGING" },
        },
    };

    return (
        <PackageSelector
            packaging={packaging}
            packageSelected={packageSelected}
            setPackageSelected={setPackageSelected}
            setDimensions={setDimensions}
        />
    );
};

function PackageSelector({ packaging, packageSelected, setPackageSelected, setDimensions }) {
    return (
        <Box>
            <Grid2 container spacing={2}>
                {!packageSelected && Object.keys(packaging).map((k, i) => (
                    <Grid2 size={{ xs: 12, sm: 6 }} key={i}>
                        <Card
                            variant="outlined"
                            sx={{ cursor: "pointer", borderRadius: 2, textAlign: "center", p: 2, "&:hover": { borderColor: "primary.main", boxShadow: 2 }, transition: "box-shadow 0.15s, border-color 0.15s" }}
                            onClick={() => setPackageSelected(k)}
                        >
                            <Typography variant="subtitle1" fontWeight={700} gutterBottom>{k}</Typography>
                            <Box sx={{ display: "flex", justifyContent: "center" }}>
                                <Image src={getImage(packaging[k].imageKey)} alt={k} width={160} height={160} style={{ objectFit: "contain" }} />
                            </Box>
                        </Card>
                    </Grid2>
                ))}

                {packageSelected && Object.keys(packaging[packageSelected]).filter(k => k !== "imageKey").map((k, i) => (
                    <Grid2 size={{ xs: 6, sm: Math.floor(12 / (Object.keys(packaging[packageSelected]).length - 1)) }} key={i}>
                        <Card
                            variant="outlined"
                            sx={{ cursor: "pointer", borderRadius: 2, textAlign: "center", p: 1.5, "&:hover": { borderColor: "primary.main", boxShadow: 2 }, transition: "box-shadow 0.15s, border-color 0.15s" }}
                            onClick={() => setDimensions(packaging[packageSelected][k])}
                        >
                            <Typography variant="body2" fontWeight={700} gutterBottom sx={{ textTransform: "capitalize" }}>
                                {k.replace(/_/g, " ")}
                            </Typography>
                            <Box sx={{ display: "flex", justifyContent: "center" }}>
                                <Image src={getImage(packaging[packageSelected][k].imageKey)} alt={k} width={80} height={80} style={{ objectFit: "contain" }} />
                            </Box>
                            <Typography variant="caption" color="text.secondary">
                                {`${packaging[packageSelected][k].width}×${packaging[packageSelected][k].length}×${packaging[packageSelected][k].height}`}
                            </Typography>
                        </Card>
                    </Grid2>
                ))}
            </Grid2>

            {packageSelected && (
                <Button size="small" sx={{ mt: 1 }} onClick={() => setPackageSelected()}>← Back</Button>
            )}
        </Box>
    );
}

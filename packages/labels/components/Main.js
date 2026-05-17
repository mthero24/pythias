"use client";
import {
    Box, Container, Card, Grid2, Typography, Button, Fab, Select, TextField,
    MenuItem, InputLabel, FormControl, Stack, Chip, Divider, Collapse,
    IconButton, InputAdornment, Tooltip, Dialog, DialogTitle, DialogContent,
    DialogActions,
} from "@mui/material";
import PrintIcon          from "@mui/icons-material/Print";
import LabelIcon          from "@mui/icons-material/Label";
import SearchIcon         from "@mui/icons-material/Search";
import CloseIcon          from "@mui/icons-material/Close";
import HistoryIcon        from "@mui/icons-material/History";
import VisibilityIcon     from "@mui/icons-material/Visibility";
import CardGiftcardIcon   from "@mui/icons-material/CardGiftcard";
import StorefrontIcon     from "@mui/icons-material/Storefront";
import CheckCircleIcon    from "@mui/icons-material/CheckCircle";
import WarningAmberIcon   from "@mui/icons-material/WarningAmber";
import ErrorIcon          from "@mui/icons-material/Error";
import ReplayIcon         from "@mui/icons-material/Replay";
import SyncIcon           from "@mui/icons-material/Sync";
import { useEffect, useState } from "react";
import axios from "axios";
import { Sort } from "../functions/sort";
import { UntrackedLabels } from "./untracked";
import { Footer } from "@pythias/backend";
import LoaderOverlay from "./LoaderOverlay";

export function Main({ labels, rePulls, giftLabels = [], batches, source }) {
    const [useLabels, setLabels]         = useState(labels);
    const [rePull, setRePulls]           = useState(rePulls);
    const [gift, setGiftLabels]          = useState(giftLabels);
    const [batch, setBatches]            = useState(batches);
    const [selected, setSelected]        = useState([]);
    const [restore, setRestore]          = useState(false);
    const [showUntracked, setShoeUntracked] = useState(false);
    const [filter, setFilter]            = useState("");
    const [returnToQue, setReturnToQue]  = useState("");
    const [returnToInv, setReturnToInv]  = useState("");
    const [printTypes, setPrintTypes]    = useState([]);
    const [printTypeSelected, setPrintTypeSelected]     = useState("Select");
    const [styleCodeSelected, setStyleCodeSelected]     = useState("Select");
    const [styleCodes, setStyleCodes]    = useState([]);
    const [loading, setLoading]          = useState(false);
    const [pulling, setPulling]          = useState(false);
    const [marketplaceSelected, setMarketplaceSelected] = useState("Select");
    const [marketplaces, setMarketplaces] = useState([]);
    const [confirmReturnToQue, setConfirmReturnToQue] = useState(false);

    useEffect(() => {
        let pt = [], sc = [], mp = [];
        for (let lab of labels["Standard"]) {
            if (!pt.includes(lab.type?.toUpperCase())) pt.push(lab.type?.toUpperCase());
            if (!sc.includes(lab.styleCode)) sc.push(lab.styleCode);
            if (!mp.includes(lab.order.marketplace)) mp.push(lab.order.marketplace);
        }
        for (let lab of labels["Expedited"]) {
            if (!pt.includes(lab.type?.toUpperCase())) pt.push(lab.type?.toUpperCase());
            if (!sc.includes(lab.styleCode)) sc.push(lab.styleCode);
            if (!mp.includes(lab.order.marketplace)) mp.push(lab.order.marketplace);
        }
        setPrintTypes(pt);
        setStyleCodes(sc);
        setMarketplaces(mp);

        const getUpdate = async () => {
            let res = await axios.get("/api/production/print-labels/updatePage");
            if (!res.data || res.data.error) alert("could not update page");
            else {
                setLabels(res.data.labels);
                setBatches(res.data.batches);
                setGiftLabels(res.data.giftMessages);
                setRePulls(res.data.rePulls);
            }
            await new Promise(resolve => setTimeout(resolve, 5 * 60 * 1000));
            getUpdate();
        };
        getUpdate();
    }, []);

    const select = (pieceId) => {
        if (printTypeSelected !== "Select" || styleCodeSelected !== "Select") {
            setPrintTypeSelected("Select");
            setStyleCodeSelected("Select");
            selectBasedOnPTSC({ printType: "Select" });
        }
        let sel = [...selected];
        if (sel.includes(pieceId)) sel = sel.filter(s => s !== pieceId);
        else sel.push(pieceId);
        setSelected([...sel]);
    };

    const selectAllMarketPlaceOrders = () => {
        let sel = [...selected];
        Object.keys(useLabels).map(l => {
            sel.push(...useLabels[l].map(k => {
                if (k.order.poNumber.includes("RT") && k.inventory?.inventory?.quantity > 0) return k.pieceId;
            }));
        });
        sel = sel.filter(s => s != undefined);
        setFilter("RT1");
        setSelected([...sel]);
    };

    const selectBasedOnPTSC = ({ printType, styleCode, marketplace }) => {
        let sel = [];
        if (printType && printType !== "Select" && styleCodeSelected && styleCodeSelected !== "Select" && marketplaceSelected && marketplaceSelected !== "Select") {
            Object.keys(useLabels).map(l => { sel.push(...useLabels[l].map(k => { if ((k.type?.toLowerCase() == printType.toLowerCase()) && k.styleCode == styleCodeSelected && k.order.marketplace == marketplaceSelected && (k.inventory?.inventory?.quantity > 0 || source == "PP")) if (k.inventory?.inventory?.inStock) { if (k.inventory?.inventory?.inStock.includes(k._id) || source == "PP") return k.pieceId; } else return k.pieceId; })); });
        } else if (printType && printType !== "Select" && marketplaceSelected && marketplaceSelected !== "Select") {
            Object.keys(useLabels).map(l => { sel.push(...useLabels[l].map(k => { if ((k.type?.toLowerCase() == printType.toLowerCase()) && k.order.marketplace == marketplaceSelected && (k.inventory?.inventory?.quantity > 0 || source == "PP")) if (k.inventory?.inventory?.inStock) { if (k.inventory?.inventory?.inStock.includes(k._id) || source == "PP") return k.pieceId; } else return k.pieceId; })); });
        } else if (printType && printType !== "Select" && styleCodeSelected && styleCodeSelected !== "Select") {
            Object.keys(useLabels).map(l => { sel.push(...useLabels[l].map(k => { if ((k.type?.toLowerCase() == printType.toLowerCase()) && k.styleCode == styleCodeSelected && (k.inventory?.inventory?.quantity > 0 || source == "PP")) if (k.inventory?.inventory?.inStock) { if (k.inventory?.inventory?.inStock.includes(k._id) || source == "PP") return k.pieceId; } else return k.pieceId; })); });
        } else if (printType == "Select" && styleCodeSelected !== "Select" && marketplaceSelected && marketplaceSelected !== "Select") {
            Object.keys(useLabels).map(l => { sel.push(...useLabels[l].map(k => { if ((k.styleCode == styleCodeSelected) && k.order.marketplace == marketplaceSelected && k.inventory?.inventory?.quantity > 0) if (k.inventory?.inventory?.inStock) { if (k.inventory?.inventory?.inStock.includes(k._id) || source == "PP") return k.pieceId; } else return k.pieceId; })); });
        } else if (printType == "Select" && styleCodeSelected !== "Select") {
            Object.keys(useLabels).map(l => { sel.push(...useLabels[l].map(k => { if ((k.styleCode == styleCodeSelected) && (k.inventory?.inventory?.quantity > 0 || source == "PP")) if (k.inventory?.inventory?.inStock) { if (k.inventory?.inventory?.inStock.includes(k._id) || source == "PP") return k.pieceId; } else return k.pieceId; })); });
        } else if (printType == "Select" && marketplaceSelected && marketplaceSelected !== "Select") {
            Object.keys(useLabels).map(l => { sel.push(...useLabels[l].map(k => { if ((k.order.marketplace == marketplaceSelected) && (k.inventory?.inventory?.quantity > 0 || source == "PP")) if (k.inventory?.inventory?.inStock) { if (k.inventory?.inventory?.inStock.includes(k._id) || source == "PP") return k.pieceId; } else return k.pieceId; })); });
        } else if (printType) {
            Object.keys(useLabels).map(l => { sel.push(...useLabels[l].map(k => { if (((k.type?.toLowerCase() || k.designRef?.printType?.toLowerCase()) == printType.toLowerCase()) && (k.inventory?.inventory?.quantity > 0 || source == "PP")) if (k.inventory?.inventory?.inStock) { if (k.inventory?.inventory?.inStock.includes(k._id) || source == "PP") return k.pieceId; } else return k.pieceId; })); });
        }
        if (styleCode && styleCode !== "Select" && printTypeSelected && printTypeSelected !== "Select" && marketplaceSelected && marketplaceSelected !== "Select") {
            Object.keys(useLabels).map(l => { sel.push(...useLabels[l].map(k => { if ((k.type == printTypeSelected) && k.styleCode == styleCode && k.order.marketplace == marketplaceSelected && (k.inventory?.inventory?.quantity > 0 || source == "PP")) if (k.inventory?.inventory?.inStock) { if (k.inventory?.inventory?.inStock.includes(k._id) || source == "PP") return k.pieceId; } else return k.pieceId; })); });
        } else if (styleCode && styleCode !== "Select" && printTypeSelected && printTypeSelected !== "Select") {
            Object.keys(useLabels).map(l => { sel.push(...useLabels[l].map(k => { if ((k.type == printTypeSelected) && k.styleCode == styleCode && (k.inventory?.inventory?.quantity > 0 || source == "PP")) if (k.inventory?.inventory?.inStock) { if (k.inventory?.inventory?.inStock.includes(k._id) || source == "PP") return k.pieceId; } else return k.pieceId; })); });
        } else if (styleCode && styleCode !== "Select" && marketplaceSelected && marketplaceSelected !== "Select") {
            Object.keys(useLabels).map(l => { sel.push(...useLabels[l].map(k => { if (k.styleCode == styleCode && k.order.marketplace == marketplaceSelected && (k.inventory?.inventory?.quantity > 0 || source == "PP")) if (k.inventory?.inventory?.inStock) { if (k.inventory?.inventory?.inStock.includes(k._id) || source == "PP") return k.pieceId; } else return k.pieceId; })); });
        } else if (styleCode && styleCode == "Select" && printTypeSelected && printTypeSelected !== "Select" && marketplaceSelected && marketplaceSelected !== "Select") {
            Object.keys(useLabels).map(l => { sel.push(...useLabels[l].map(k => { if ((k.type?.toLowerCase() == printTypeSelected.toLowerCase()) && k.order.marketplace == marketplaceSelected && (k.inventory?.inventory?.quantity > 0 || source == "PP")) if (k.inventory?.inventory?.inStock) { if (k.inventory?.inventory?.inStock.includes(k._id) || source == "PP") return k.pieceId; } else return k.pieceId; })); });
        } else if (styleCode == "Select" && printTypeSelected !== "Select") {
            Object.keys(useLabels).map(l => { sel.push(...useLabels[l].map(k => { if ((k.type?.toLowerCase() == printTypeSelected.toLowerCase()) && (k.inventory?.inventory?.quantity > 0 || source == "PP")) if (k.inventory?.inventory?.inStock) { if (k.inventory?.inventory?.inStock.includes(k._id) || source == "PP") return k.pieceId; } else return k.pieceId; })); });
        } else if (styleCode == "Select" && marketplaceSelected && marketplaceSelected !== "Select") {
            Object.keys(useLabels).map(l => { sel.push(...useLabels[l].map(k => { if ((k.order.marketplace == marketplaceSelected) && (k.inventory?.inventory?.quantity > 0 || source == "PP")) if (k.inventory?.inventory?.inStock) { if (k.inventory?.inventory?.inStock.includes(k._id) || source == "PP") return k.pieceId; } else return k.pieceId; })); });
        } else if (styleCode) {
            Object.keys(useLabels).map(l => { sel.push(...useLabels[l].map(k => { if ((k.styleCode == styleCode) && (k.inventory?.inventory?.quantity > 0 || source == "PP")) if (k.inventory?.inventory?.inStock) { if (k.inventory?.inventory?.inStock.includes(k._id) || source == "PP") return k.pieceId; } else return k.pieceId; })); });
        }
        if (marketplace && marketplace !== "Select" && printTypeSelected && printTypeSelected !== "Select" && styleCodeSelected && styleCodeSelected !== "Select") {
            Object.keys(useLabels).map(l => { sel.push(...useLabels[l].map(k => { if ((k.order.marketplace == marketplace && k.type?.toLowerCase() == printTypeSelected.toLowerCase() && k.styleCode == styleCodeSelected) && (k.inventory?.inventory?.quantity > 0 || source == "PP")) if (k.inventory?.inventory?.inStock) { if (k.inventory?.inventory?.inStock.includes(k._id) || source == "PP") return k.pieceId; } else return k.pieceId; })); });
        } else if (marketplace && marketplace !== "Select" && printTypeSelected && printTypeSelected !== "Select") {
            Object.keys(useLabels).map(l => { sel.push(...useLabels[l].map(k => { if ((k.order.marketplace == marketplace && k.type?.toLowerCase() == printTypeSelected.toLowerCase()) && (k.inventory?.inventory?.quantity > 0 || source == "PP")) if (k.inventory?.inventory?.inStock) { if (k.inventory?.inventory?.inStock.includes(k._id) || source == "PP") return k.pieceId; } else return k.pieceId; })); });
        } else if (marketplace && marketplace !== "Select" && styleCodeSelected && styleCodeSelected !== "Select") {
            Object.keys(useLabels).map(l => { sel.push(...useLabels[l].map(k => { if ((k.order.marketplace == marketplace && k.styleCode == styleCodeSelected) && (k.inventory?.inventory?.quantity > 0 || source == "PP")) if (k.inventory?.inventory?.inStock) { if (k.inventory?.inventory?.inStock.includes(k._id) || source == "PP") return k.pieceId; } else return k.pieceId; })); });
        } else if (marketplace && marketplace == "Select" && printTypeSelected && printTypeSelected !== "Select" && styleCodeSelected && styleCodeSelected !== "Select") {
            Object.keys(useLabels).map(l => { sel.push(...useLabels[l].map(k => { if ((k.type?.toLowerCase() == printTypeSelected.toLowerCase() && k.styleCode == styleCodeSelected) && (k.inventory?.inventory?.quantity > 0 || source == "PP")) if (k.inventory?.inventory?.inStock) { if (k.inventory?.inventory?.inStock.includes(k._id) || source == "PP") return k.pieceId; } else return k.pieceId; })); });
        } else if (marketplace && marketplace == "Select" && printTypeSelected && printTypeSelected !== "Select") {
            Object.keys(useLabels).map(l => { sel.push(...useLabels[l].map(k => { if ((k.type?.toLowerCase() == printTypeSelected.toLowerCase()) && (k.inventory?.inventory?.quantity > 0 || source == "PP")) if (k.inventory?.inventory?.inStock) { if (k.inventory?.inventory?.inStock.includes(k._id) || source == "PP") return k.pieceId; } else return k.pieceId; })); });
        } else if (marketplace && marketplace == "Select" && styleCodeSelected && styleCodeSelected !== "Select") {
            Object.keys(useLabels).map(l => { sel.push(...useLabels[l].map(k => { if ((k.styleCode == styleCodeSelected) && (k.inventory?.inventory?.quantity > 0 || source == "PP")) if (k.inventory?.inventory?.inStock) { if (k.inventory?.inventory?.inStock.includes(k._id) || source == "PP") return k.pieceId; } else return k.pieceId; })); });
        } else if (marketplace) {
            Object.keys(useLabels).map(l => { sel.push(...useLabels[l].map(k => { if ((k.order.marketplace == marketplace) && (k.inventory?.inventory?.quantity > 0 || source == "PP")) if (k?.inventory?.inventory?.inStock) { if (k?.inventory?.inventory?.inStock?.includes(k._id) || source == "PP") return k.pieceId; } else return k.pieceId; })); });
        }
        sel = sel.filter(s => s != undefined);
        setSelected([...sel]);
    };

    const deselect = (type) => {
        setSelected(selected.filter(s => !useLabels[type].map(l => l.pieceId).includes(s)));
    };

    const afterPrint = (data) => {
        setLoading(false);
        setLabels(data.labels);
        setBatches(data.batches);
        setGiftLabels(data.giftMessages);
        setRePulls(data.rePulls);
        setSelected([]);
        setFilter("");
    };

    const print = async (type) => {
        setLoading(true);
        let items = [];
        if (type === "selected") {
            Object.keys(useLabels).map(l => { items.push(...useLabels[l].filter(s => selected.includes(s.pieceId))); });
            items = Sort(items, source);
        } else if (type === "gift") {
            items = gift;
        } else {
            if (source === "PP") {
                items.push(...useLabels[type]);
            } else {
                for (let l of useLabels[type]) {
                    if (l.inventory && l.inventory.inventory && l.inventory.inventory.inStock && l.inventory.inventory.inStock.length > 0 && l.inventory.inventory.inStock.includes(l._id)) items.push(l);
                    else if (l.inventory && l.inventory.productInventory && l.inventory.productInventory.inStock && l.inventory.productInventory.inStock.length > 0 && l.inventory.productInventory.inStock.includes(l._id)) items.push(l);
                }
            }
            items = Sort(items, source);
        }
        let res = await axios.post("/api/production/print-labels", { items });
        if (res.data.error) { setLoading(false); alert(res.data.msg); }
        else afterPrint(res.data);
    };

    const printBlanks = async (type) => {
        setLoading(true);
        let items = Sort(useLabels[type].filter(l => l.isBlank === true), source);
        let res = await axios.post("/api/production/print-labels", { items });
        if (res.data.error) { setLoading(false); alert(res.data.msg); }
        else afterPrint(res.data);
    };

    const printReturns = async (type) => {
        setLoading(true);
        let items = Sort(useLabels[type].filter(l => l.inventory && l.inventory.inventoryType === "productInventory"), source);
        let res = await axios.post("/api/production/print-labels", { items });
        if (res.data.error) { setLoading(false); alert(res.data.msg); }
        else afterPrint(res.data);
    };

    const restorePrint = async (options) => {
        let res = await axios.post("/api/production/print-labels/restore", options);
        if (res.data.error) alert(res.data.msg);
        else { setLabels(res.data.labels); setBatches(res.data.batches); setGiftLabels(res.data.giftMessages); setRePulls(res.data.rePulls); setSelected([]); setRestore(false); }
    };

    const returnToQueFunc = async () => {
        let res = await axios.post("/api/production/print-labels/return-to-que", { pieceId: returnToQue });
        if (res.data.error) alert(res.data.msg);
        else { setLabels(res.data.labels); setBatches(res.data.batches); setGiftLabels(res.data.giftMessages); setRePulls(res.data.rePulls); setReturnToQue(""); }
    };

    const returnInventory = async () => {
        let res = await axios.put("/api/production/print-labels/return-to-que", { pieceId: returnToInv });
        if (res.data.error) alert(res.data.msg);
        else { setLabels(res.data.labels); setBatches(res.data.batches); setGiftLabels(res.data.giftMessages); setRePulls(res.data.rePulls); setReturnToInv(""); }
    };

    const pullOrdersNow = async () => {
        setPulling(true);
        try {
            const res = await axios.post("/api/internal/pull-orders");
            if (res.data?.error) alert(`Pull orders failed: ${res.data.msg}`);
            else {
                const updated = await axios.get("/api/production/print-labels/updatePage");
                if (updated.data && !updated.data.error) {
                    setLabels(updated.data.labels);
                    setBatches(updated.data.batches);
                    setGiftLabels(updated.data.giftMessages);
                    setRePulls(updated.data.rePulls);
                }
            }
        } catch (e) {
            alert(`Pull orders error: ${e.message}`);
        } finally {
            setPulling(false);
        }
    };

    const totalLabels = Object.values(useLabels).reduce((sum, arr) => sum + arr.length, 0);

    return (
        <>
            <Box sx={{ backgroundColor: "background.default", minHeight: "100vh" }}>
                <Container maxWidth="xl" sx={{ py: 4 }}>

                    {/* Header */}
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 3, flexWrap: "wrap", gap: 2 }}>
                        <Stack direction="row" alignItems="center" spacing={1.5}>
                            <Box sx={{ width: 36, height: 36, borderRadius: 2, background: "linear-gradient(135deg, #6366f1 0%, #14b8a6 100%)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                <LabelIcon sx={{ color: "#fff", fontSize: 20 }} />
                            </Box>
                            <Box>
                                <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: -0.5, lineHeight: 1.2 }}>Print Labels</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {totalLabels} label{totalLabels !== 1 ? "s" : ""} queued
                                    {rePull > 0 && <> · <Box component="span" sx={{ color: "warning.main", fontWeight: 600 }}>{rePull} repulled</Box></>}
                                </Typography>
                            </Box>
                        </Stack>

                        {/* Utility buttons */}
                        <Stack direction="row" flexWrap="wrap" gap={1}>
                            {source !== "PP" && gift.length > 0 && (
                                <Button variant="outlined" size="small" startIcon={<CardGiftcardIcon />} onClick={() => print("gift")}>
                                    Gift Labels ({gift.length})
                                </Button>
                            )}
                            {source !== "PP" && (
                                <Button variant="outlined" size="small" startIcon={<StorefrontIcon />} onClick={selectAllMarketPlaceOrders}>
                                    Select Marketplace Orders
                                </Button>
                            )}
                            <Button variant="outlined" size="small" startIcon={<HistoryIcon />}
                                onClick={() => setRestore(!restore)}
                                sx={{ borderColor: restore ? "primary.main" : undefined, bgcolor: restore ? "primary.50" : undefined }}>
                                Restore Queue
                            </Button>
                            <Button variant="outlined" size="small" startIcon={<VisibilityIcon />}
                                onClick={() => setShoeUntracked(!showUntracked)}>
                                Untracked Labels
                            </Button>
                            {source === "PP" && (
                                <Button variant="outlined" size="small" color="secondary"
                                    startIcon={<SyncIcon sx={{ animation: pulling ? "spin 1s linear infinite" : "none", "@keyframes spin": { "100%": { transform: "rotate(360deg)" } } }} />}
                                    onClick={pullOrdersNow} disabled={pulling}>
                                    {pulling ? "Pulling…" : "Pull Orders Now"}
                                </Button>
                            )}
                        </Stack>
                    </Box>

                    {/* Utility inputs */}
                    <Card variant="outlined" sx={{ borderRadius: 3, p: 2, mb: 2 }}>
                        <Grid2 container spacing={2} alignItems="flex-end">
                            <Grid2 size={{ xs: 12, sm: 4 }}>
                                <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: 0.5 }}>
                                    <Typography variant="caption" sx={{ fontWeight: 600, color: "text.secondary" }}>Return Label to Queue</Typography>
                                    <Stack direction="row" alignItems="center" spacing={0.4}>
                                        <WarningAmberIcon sx={{ fontSize: 11, color: "warning.main" }} />
                                        <Typography variant="caption" sx={{ color: "warning.dark", fontWeight: 600, fontSize: "0.67rem" }}>Resets inventory to zero</Typography>
                                    </Stack>
                                </Stack>
                                <Stack direction="row" spacing={1}>
                                    <TextField size="small" fullWidth placeholder="Piece ID…" value={returnToQue}
                                        onChange={(e) => setReturnToQue(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === "Enter" && returnToQue.trim()) setConfirmReturnToQue(true); }} />
                                    <Button variant="contained" size="small" color="warning" onClick={() => setConfirmReturnToQue(true)} disabled={!returnToQue.trim()}>Go</Button>
                                </Stack>
                            </Grid2>
                            <Grid2 size={{ xs: 12, sm: 4 }}>
                                <Typography variant="caption" sx={{ fontWeight: 600, color: "text.secondary", display: "block", mb: 0.5 }}>Return Product to Inventory</Typography>
                                <Stack direction="row" spacing={1}>
                                    <TextField size="small" fullWidth placeholder="Piece ID…" value={returnToInv}
                                        onChange={(e) => setReturnToInv(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === "Enter") returnInventory(); }} />
                                    <Button variant="contained" size="small" onClick={returnInventory} disabled={!returnToInv.trim()}>Go</Button>
                                </Stack>
                            </Grid2>
                            <Grid2 size={{ xs: 12, sm: 4 }}>
                                <Typography variant="caption" sx={{ fontWeight: 600, color: "text.secondary", display: "block", mb: 0.5 }}>Select by Order Date</Typography>
                                <TextField size="small" fullWidth type="date"
                                    onChange={(e) => {
                                        let sel = [];
                                        const picked = new Date(new Date(e.target.value).getTime() + 24 * 60 * 60 * 1000).toLocaleDateString("en-US");
                                        Object.keys(useLabels).map(l => {
                                            sel.push(...useLabels[l].map(k => {
                                                if (new Date(k.order.date).toLocaleDateString("en-US") === picked) return k.pieceId;
                                            }));
                                        });
                                        setSelected(sel.filter(s => s != undefined));
                                    }} />
                            </Grid2>
                        </Grid2>
                    </Card>

                    {/* Restore / Batch section */}
                    <Collapse in={restore}>
                        <Card variant="outlined" sx={{ borderRadius: 3, p: 2, mb: 2 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: "text.secondary" }}>Recent Batches</Typography>
                            {batch?.length ? (
                                <Grid2 container spacing={2}>
                                    {batch.map(b => (
                                        <Grid2 size={{ xs: 12, sm: 4, md: 3 }} key={b._id}>
                                            <PrintBatchComponent batch={b} restorePrint={restorePrint} />
                                        </Grid2>
                                    ))}
                                </Grid2>
                            ) : (
                                <Typography variant="body2" color="text.disabled">No recent batches</Typography>
                            )}
                        </Card>
                    </Collapse>

                    {/* Untracked labels */}
                    <Collapse in={showUntracked}>
                        <Card variant="outlined" sx={{ borderRadius: 3, p: 2, mb: 2 }}>
                            <UntrackedLabels />
                        </Card>
                    </Collapse>

                    {/* Filters */}
                    <Card variant="outlined" sx={{ borderRadius: 3, p: 2, mb: 3 }}>
                        <Grid2 container spacing={2} alignItems="flex-end">
                            <Grid2 size={{ xs: 12, sm: 4 }}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Print Type</InputLabel>
                                    <Select label="Print Type" value={printTypeSelected}
                                        onChange={(e) => { setPrintTypeSelected(e.target.value); selectBasedOnPTSC({ printType: e.target.value }); }}>
                                        <MenuItem value="Select">All types</MenuItem>
                                        {printTypes.map(pt => <MenuItem key={pt} value={pt}>{pt}</MenuItem>)}
                                    </Select>
                                </FormControl>
                            </Grid2>
                            <Grid2 size={{ xs: 12, sm: 4 }}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Marketplace</InputLabel>
                                    <Select label="Marketplace" value={marketplaceSelected}
                                        onChange={(e) => { setMarketplaceSelected(e.target.value); selectBasedOnPTSC({ marketplace: e.target.value }); }}>
                                        <MenuItem value="Select">All marketplaces</MenuItem>
                                        {marketplaces.map(mp => <MenuItem key={mp} value={mp}>{mp}</MenuItem>)}
                                    </Select>
                                </FormControl>
                            </Grid2>
                            <Grid2 size={{ xs: 12, sm: 4 }}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Style Code</InputLabel>
                                    <Select label="Style Code" value={styleCodeSelected}
                                        onChange={(e) => { setStyleCodeSelected(e.target.value); selectBasedOnPTSC({ styleCode: e.target.value }); }}>
                                        <MenuItem value="Select">All styles</MenuItem>
                                        {styleCodes.map(sc => <MenuItem key={sc} value={sc}>{sc}</MenuItem>)}
                                    </Select>
                                </FormControl>
                            </Grid2>
                        </Grid2>
                        {selected.length > 0 && (
                            <Box sx={{ mt: 1.5, display: "flex", alignItems: "center", gap: 1 }}>
                                <Chip label={`${selected.length} selected`} size="small" color="primary" sx={{ fontWeight: 700 }} />
                                <Button size="small" onClick={() => setSelected([])} sx={{ fontSize: "0.72rem" }}>Clear selection</Button>
                            </Box>
                        )}
                    </Card>

                    {/* Label columns */}
                    <Grid2 container spacing={2}>
                        {useLabels && Object.keys(useLabels).map((l) => {
                            const inStockCount = useLabels[l].filter(item =>
                                (item.inventory?.inventoryType === "inventory" && item.inventory?.inventory?.inStock?.includes(item._id.toString())) ||
                                (item.inventory?.inventoryType === "productInventory" && item.inventory?.productInventory?.inStock?.includes(item._id.toString()))
                            ).length;
                            const outCount = useLabels[l].filter(item =>
                                item.inventory?.inventoryType === "inventory" && !item.inventory?.inventory?.inStock?.includes(item._id.toString())
                            ).length;

                            const displayed = useLabels[l].filter(s => {
                                if (!filter) return true;
                                return (
                                    s.pieceId?.toLowerCase().includes(filter.toLowerCase()) ||
                                    s.order?.poNumber?.toLowerCase().includes(filter.toLowerCase()) ||
                                    s.styleCode?.toLowerCase().includes(filter.toLowerCase())
                                );
                            });

                            return (
                                <Grid2 size={{ xs: 12, sm: source === "IM" ? 12 : 6 }} key={l}>
                                    <Card variant="outlined" sx={{ borderRadius: 3, overflow: "hidden" }}>
                                        {/* Column header */}
                                        <Box sx={{ px: 2, py: 1.5, borderBottom: "1px solid", borderColor: "divider", bgcolor: l === "Expedited" ? "#fff7ed" : "background.paper" }}>
                                            <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
                                                <Stack direction="row" alignItems="center" spacing={1}>
                                                    <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{l}</Typography>
                                                    <Chip label={`${useLabels[l].length} total`} size="small" sx={{ height: 20, fontSize: "0.68rem", fontWeight: 700 }} />
                                                </Stack>
                                                {source !== "PO" && (
                                                    <Stack direction="row" spacing={0.5}>
                                                        <Chip icon={<CheckCircleIcon sx={{ fontSize: "12px !important" }} />} label={`${inStockCount} in stock`} size="small"
                                                            sx={{ height: 20, fontSize: "0.68rem", bgcolor: "#f0fdf4", color: "#15803d" }} />
                                                        <Chip icon={<ErrorIcon sx={{ fontSize: "12px !important" }} />} label={`${outCount} out`} size="small"
                                                            sx={{ height: 20, fontSize: "0.68rem", bgcolor: "#fef2f2", color: "#dc2626" }} />
                                                    </Stack>
                                                )}
                                            </Stack>

                                            {/* Action buttons */}
                                            <Stack direction="row" flexWrap="nowrap" gap={0.75} sx={{ mt: 1 }}>
                                                {[
                                                    { label: "Print All",    action: () => print(l) },
                                                    { label: "Deselect All", action: () => deselect(l) },
                                                    { label: "Blanks",       action: () => printBlanks(l) },
                                                    { label: "Returns",      action: () => printReturns(l) },
                                                ].map(btn => (
                                                    <Button key={btn.label} size="small" variant="outlined" onClick={btn.action}
                                                        sx={{ fontSize: "0.7rem", py: 0.4, px: 1.2, whiteSpace: "nowrap", borderColor: "divider", color: "text.secondary",
                                                            "&:hover": { borderColor: "#6366f1", color: "#6366f1", bgcolor: "#6366f108" } }}>
                                                        {btn.label}
                                                    </Button>
                                                ))}
                                            </Stack>

                                            {/* Filter */}
                                            <TextField size="small" fullWidth placeholder="Filter by piece ID, PO, style…" value={filter}
                                                onChange={(e) => setFilter(e.target.value)}
                                                sx={{ mt: 1 }}
                                                InputProps={{
                                                    startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" sx={{ color: "text.disabled" }} /></InputAdornment>,
                                                    endAdornment: filter ? (
                                                        <InputAdornment position="end">
                                                            <IconButton size="small" edge="end" onClick={() => setFilter("")}><CloseIcon sx={{ fontSize: 14 }} /></IconButton>
                                                        </InputAdornment>
                                                    ) : null,
                                                }} />
                                        </Box>

                                        {/* Table header */}
                                        <Box sx={{ display: "grid", gridTemplateColumns: source === "IM" ? "140px 100px 120px 80px 100px 100px 60px 1fr" : "140px 100px 120px 80px 100px 60px 1fr", px: 2, py: 0.75, bgcolor: "#6366f1", color: "#fff", gap: 1 }}>
                                            {["In Stock", "Piece ID", "PO Number", "Style", "Color", ...(source === "IM" ? ["Thread"] : []), "Size", "Date"].map(h => (
                                                <Typography key={h} variant="caption" sx={{ fontWeight: 700, fontSize: "0.68rem", textAlign: "center" }}>{h}</Typography>
                                            ))}
                                        </Box>

                                        {/* Scrollable item list */}
                                        <Box sx={{ maxHeight: "55vh", overflowY: "auto" }}>
                                            {displayed.map((item, j) => {
                                                const isSelected = selected.includes(item.pieceId);
                                                const inv = item.inventory;
                                                const isInStock = inv?.inventoryType === "inventory"
                                                    ? inv?.inventory?.inStock?.includes(item._id.toString())
                                                    : inv?.inventoryType === "productInventory" && inv?.productInventory;
                                                const isOrdered = inv?.inventoryType === "inventory" && inv?.inventory?.orders?.some(o => o.items.includes(item._id.toString()));
                                                const stockColor = isSelected ? "#fff" : isInStock ? "#15803d" : isOrdered ? "#d97706" : "#dc2626";

                                                return (
                                                    <Box key={j} onClick={() => select(item.pieceId)}
                                                        sx={{
                                                            cursor: "pointer", borderBottom: "1px solid", borderColor: "divider",
                                                            bgcolor: isSelected ? "#6366f1" : j % 2 === 0 ? "#fafafa" : "#fff",
                                                            "&:hover": { bgcolor: isSelected ? "#5558e3" : "#f0f0ff" },
                                                            transition: "background-color 80ms",
                                                        }}>
                                                        <Box sx={{ display: "grid", gridTemplateColumns: source === "IM" ? "140px 100px 120px 80px 100px 100px 60px 1fr" : "140px 100px 120px 80px 100px 60px 1fr", px: 2, py: 1, gap: 1, alignItems: "center" }}>
                                                            {/* Stock status */}
                                                            <Box>
                                                                <Typography variant="caption" sx={{ fontWeight: 700, color: stockColor, fontSize: "0.68rem", display: "block" }}>
                                                                    {inv?.inventoryType === "inventory"
                                                                        ? inv?.inventory?.inStock?.includes(item._id.toString()) ? "In Stock" : inv?.inventory?.quantity > 0 ? "In Stock" : "Out of Stock"
                                                                        : inv?.inventoryType === "productInventory" && inv?.productInventory ? "Returns" : "Out of Stock"}
                                                                </Typography>
                                                                {inv?.inventoryType === "inventory" && inv?.inventory && (
                                                                    <Typography variant="caption" sx={{ fontSize: "0.62rem", color: isSelected ? "#fff" : "text.secondary", display: "block" }}>
                                                                        {inv.inventory.inStock?.length > 0 && `Pending: ${inv.inventory.inStock.length}`}
                                                                        {inv.inventory.attached?.length > 0 && ` · Need: ${inv.inventory.attached.length}`}
                                                                        {inv.inventory.orders?.length > 0 && ` · Ordered: ${inv.inventory.orders.reduce((s, o) => s + o.items.length, 0)}`}
                                                                        {` · Stock: ${inv.inventory.quantity}`}
                                                                    </Typography>
                                                                )}
                                                                {inv?.inventoryType === "productInventory" && inv?.productInventory && (
                                                                    <Typography variant="caption" sx={{ fontSize: "0.62rem", color: isSelected ? "#fff" : "text.secondary", display: "block" }}>
                                                                        Stock: {inv.productInventory.quantity}
                                                                    </Typography>
                                                                )}
                                                                {item.rePulled && (
                                                                    <Typography variant="caption" sx={{ fontSize: "0.62rem", color: isSelected ? "#ffe4e6" : "#dc2626", display: "block" }}>
                                                                        ↩ Repulled {item.rePulled}{item.rePulledReasons?.[0] ? ` — ${item.rePulledReasons[0]}` : ""}
                                                                    </Typography>
                                                                )}
                                                                {item.labelPrintedDates?.length > 0 && (
                                                                    <Typography variant="caption" sx={{ fontSize: "0.62rem", color: isSelected ? "#fed7aa" : "#ea580c", display: "block" }}>
                                                                        Last printed: {new Date(item.labelPrintedDates[item.labelPrintedDates.length - 1]).toLocaleDateString("en-US")}
                                                                    </Typography>
                                                                )}
                                                            </Box>
                                                            {/* Piece ID */}
                                                            <Typography sx={{ fontFamily: "monospace", fontSize: "0.72rem", textAlign: "center", color: isSelected ? "#fff" : "text.primary" }}>
                                                                {item.pieceId}
                                                            </Typography>
                                                            {/* PO Number */}
                                                            <Typography sx={{ fontFamily: "monospace", fontSize: "0.72rem", textAlign: "center", color: isSelected ? "#fff" : "text.primary" }}>
                                                                {item.order?.poNumber}
                                                            </Typography>
                                                            {/* Style-Type */}
                                                            <Typography sx={{ fontSize: "0.72rem", textAlign: "center", color: isSelected ? "#fff" : "text.secondary" }}>
                                                                {item.styleCode}{item.type ? `-${item.type}` : ""}
                                                            </Typography>
                                                            {/* Color */}
                                                            <Typography sx={{ fontSize: "0.72rem", textAlign: "center", color: isSelected ? "#fff" : "text.secondary" }}>
                                                                {item.colorName?.split("/")[0]}
                                                            </Typography>
                                                            {/* Thread (IM only) */}
                                                            {source === "IM" && (
                                                                <Typography sx={{ fontSize: "0.72rem", textAlign: "center", color: isSelected ? "#fff" : "text.secondary" }}>
                                                                    {item.threadColorName?.split("/")[0]} {item.designRef?.sku}
                                                                </Typography>
                                                            )}
                                                            {/* Size */}
                                                            <Typography sx={{ fontSize: "0.72rem", textAlign: "center", color: isSelected ? "#fff" : "text.secondary" }}>
                                                                {item.sizeName}
                                                            </Typography>
                                                            {/* Date */}
                                                            <Typography sx={{ fontSize: "0.68rem", textAlign: "center", color: isSelected ? "#e0e7ff" : "text.disabled" }}>
                                                                {new Date(item.date).toLocaleDateString("en-US")}
                                                            </Typography>
                                                        </Box>
                                                        {/* Location row */}
                                                        {(inv?.inventoryType === "inventory" && inv?.inventory?.row) && (
                                                            <Box sx={{ px: 2, pb: 0.75 }}>
                                                                <Typography sx={{ fontFamily: "monospace", fontSize: "0.65rem", color: isSelected ? "#c7d2fe" : "text.disabled" }}>
                                                                    Row: {inv.inventory.row} · Unit: {inv.inventory.unit} · Shelf: {inv.inventory.shelf} · Bin: {inv.inventory.bin}
                                                                </Typography>
                                                            </Box>
                                                        )}
                                                        {(inv?.inventoryType === "productInventory" && inv?.productInventory?.location) && (
                                                            <Box sx={{ px: 2, pb: 0.75 }}>
                                                                <Typography sx={{ fontFamily: "monospace", fontSize: "0.65rem", color: isSelected ? "#c7d2fe" : "text.disabled" }}>
                                                                    Location: {inv.productInventory.location}
                                                                </Typography>
                                                            </Box>
                                                        )}
                                                    </Box>
                                                );
                                            })}
                                            {displayed.length === 0 && (
                                                <Box sx={{ py: 6, textAlign: "center" }}>
                                                    <Typography variant="body2" color="text.disabled">No items match the filter</Typography>
                                                </Box>
                                            )}
                                        </Box>
                                    </Card>
                                </Grid2>
                            );
                        })}
                    </Grid2>
                </Container>
                <Footer />
            </Box>

            {/* Floating print FAB */}
            {selected.length > 0 && (
                <Fab color="primary" variant="extended" disabled={loading}
                    sx={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", zIndex: 1200, boxShadow: "0 8px 24px rgba(99,102,241,0.4)" }}
                    onClick={() => print("selected")}>
                    <PrintIcon sx={{ mr: 1 }} />
                    Print {selected.length} Selected
                </Fab>
            )}

            {loading && <LoaderOverlay />}

            {/* Return to Queue confirmation */}
            <Dialog open={confirmReturnToQue} onClose={() => setConfirmReturnToQue(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ fontWeight: 700, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    Return Label to Queue
                    <IconButton size="small" onClick={() => setConfirmReturnToQue(false)}><CloseIcon fontSize="small" /></IconButton>
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary">
                        Return piece <strong style={{ color: "#111827" }}>"{returnToQue}"</strong> to the print queue?
                    </Typography>
                    <Typography variant="body2" color="error" sx={{ mt: 1, fontWeight: 600 }}>
                        This will reset its inventory to zero.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button onClick={() => setConfirmReturnToQue(false)}>Cancel</Button>
                    <Button variant="contained" color="warning" onClick={() => { setConfirmReturnToQue(false); returnToQueFunc(); }}>
                        Confirm
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}

function PrintBatchComponent({ batch, restorePrint }) {
    const [lastIndexPrinted, setLastIndexPrinted] = useState(0);

    return (
        <Card variant="outlined" sx={{ borderRadius: 2, p: 1.5 }}>
            <Typography variant="caption" sx={{ fontFamily: "monospace", color: "text.disabled", display: "block" }}>
                ID: {batch.batchID}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {new Date(batch.date).toLocaleString()}
            </Typography>
            <Typography variant="caption" color="text.secondary">
                {batch.count} label{batch.count !== 1 ? "s" : ""}
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 1 }} alignItems="center">
                <TextField size="small" type="number" label="Last index" value={lastIndexPrinted}
                    onChange={(e) => setLastIndexPrinted(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") restorePrint({ batchID: batch.batchID, lastIndex: lastIndexPrinted }); }}
                    sx={{ flex: 1 }} />
                <Button variant="contained" size="small"
                    onClick={() => restorePrint({ batchID: batch.batchID, lastIndex: lastIndexPrinted })}>
                    Reprint
                </Button>
            </Stack>
        </Card>
    );
}

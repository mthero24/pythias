"use client";
import {
    Box, Container, Card, Grid2, Typography, Button, Fab, Select, TextField,
    MenuItem, InputLabel, FormControl, Stack, Chip, Divider, Collapse,
    IconButton, InputAdornment, Tooltip, Dialog, DialogTitle, DialogContent,
    DialogActions, LinearProgress,
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
import AddShoppingCartIcon from "@mui/icons-material/AddShoppingCart";
import { useEffect, useState } from "react";
import axios from "axios";
import { Sort } from "../functions/sort";
import { UntrackedLabels } from "./untracked";
import { Footer } from "@pythias/backend";
import LoaderOverlay from "./LoaderOverlay";

export function Main({ labels, rePulls, giftLabels = [], batches, source, printers = [], dtfPrinters = [], useShipByDate = false, stackInventoryLoc = false }) {
    const printerList = printers.length > 0 ? printers : [{ name: "printer1", format: "ZPL" }];
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
    const [updatingInv, setUpdatingInv]  = useState(false);
    const [marketplaceSelected, setMarketplaceSelected] = useState("Select");
    const [marketplaces, setMarketplaces] = useState([]);
    const [confirmReturnToQue, setConfirmReturnToQue] = useState(false);
    const [stockFilter, setStockFilter]   = useState(null);
    const [imageFilter, setImageFilter]   = useState(null);   // null | "printed" | "notPrinted" — OOS image already printed?
    const [selectedPrinter, setSelectedPrinter] = useState(printerList[0]?.name ?? "printer1");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo]     = useState("");
    const stackLocation = stackInventoryLoc;

    const [oosModalOpen,         setOosModalOpen]         = useState(false);
    const [oosConfirmOpen,       setOosConfirmOpen]       = useState(false);
    const [oosSelectedPrinters,  setOosSelectedPrinters]  = useState({}); // { [TYPE]: string[] }
    const [oosDateFrom,          setOosDateFrom]          = useState("");
    const [oosDateTo,            setOosDateTo]            = useState("");
    const [oosSending,           setOosSending]           = useState(false);
    const [oosSendProgress,      setOosSendProgress]      = useState(null); // null | { sent, total, done }

    useEffect(() => {
        let pt = [], sc = [], mp = [];
        for (let lab of labels["Standard"]) {
            if (!pt.includes(lab.type?.toUpperCase())) pt.push(lab.type?.toUpperCase());
            if (!sc.includes(lab.styleCode)) sc.push(lab.styleCode);
            if (!mp.includes(lab.order.marketplace)) mp.push(lab.order.marketplace);
        }
        for (let lab of labels["Expedited"] || labels["WholeSale"]) {
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
                if (k.order.poNumber.includes("RT") && k.stockStatus === "inStock") return k.pieceId;
            }));
        });
        sel = sel.filter(s => s != undefined);
        setFilter("RT1");
        setSelected([...sel]);
    };

    const selectBasedOnPTSC = ({ printType, styleCode, marketplace }) => {
        const effectivePT = printType !== undefined ? printType : printTypeSelected;
        const effectiveSC = styleCode !== undefined ? styleCode : styleCodeSelected;
        const effectiveMP = marketplace !== undefined ? marketplace : marketplaceSelected;

        let sel = [];
        Object.keys(useLabels).map(l => {
            sel.push(...useLabels[l].map(k => {
                if (effectivePT && effectivePT !== "Select") {
                    const t = k.type?.toLowerCase() || k.designRef?.printType?.toLowerCase();
                    if (t !== effectivePT.toLowerCase()) return;
                }
                if (effectiveSC && effectiveSC !== "Select" && k.styleCode !== effectiveSC) return;
                if (effectiveMP && effectiveMP !== "Select" && k.order.marketplace !== effectiveMP) return;
                if (k.stockStatus === "inStock" || source === "PP") return k.pieceId;
            }));
        });
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

    // Active list filters (stock status + OOS-image-printed + text search) — shared by the displayed
    // list AND the column Print button, so printing only labels the currently-filtered items.
    const matchesFilters = (s) => {
        const isReturns = s.inventory?.inventoryType === "productInventory" && !!s.inventory?.productInventory;
        if (stockFilter) {
            if (stockFilter === "inStock"  && s.stockStatus !== "inStock" && !isReturns) return false;
            if (stockFilter === "ordered"  && s.stockStatus !== "ordered")              return false;
            if (stockFilter === "attached" && s.stockStatus !== "attached")             return false;
            if (stockFilter === "noInv"    && (s.stockStatus || isReturns))            return false;
        }
        if (imageFilter === "printed"    && !s.oosImagePrinted) return false;
        if (imageFilter === "notPrinted" &&  s.oosImagePrinted) return false;
        if (!filter) return true;
        return (
            s.pieceId?.toLowerCase().includes(filter.toLowerCase()) ||
            s.order?.poNumber?.toLowerCase().includes(filter.toLowerCase()) ||
            s.styleCode?.toLowerCase().includes(filter.toLowerCase())
        );
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
                items.push(...useLabels[type].filter(matchesFilters));
            } else {
                for (let l of useLabels[type]) {
                    if ((l.stockStatus === "inStock" || (l.inventory?.inventoryType === "productInventory" && l.inventory?.productInventory)) && matchesFilters(l)) items.push(l);
                }
            }
            items = Sort(items, source);
        }
        let res = await axios.post("/api/production/print-labels", { items, printer: selectedPrinter });
        if (res.data.error) { setLoading(false); alert(res.data.msg); }
        else afterPrint(res.data);
    };

    const printBlanks = async (type) => {
        setLoading(true);
        let items = Sort(useLabels[type].filter(l => l.isBlank === true), source);
        let res = await axios.post("/api/production/print-labels", { items, printer: selectedPrinter });
        if (res.data.error) { setLoading(false); alert(res.data.msg); }
        else afterPrint(res.data);
    };

    const printReturns = async (type) => {
        setLoading(true);
        let items = Sort(useLabels[type].filter(l => l.inventory && l.inventory.inventoryType === "productInventory"), source);
        let res = await axios.post("/api/production/print-labels", { items, printer: selectedPrinter });
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

    const updateInventoryNow = async () => {
        setUpdatingInv(true);
        try {
            const res = await axios.post("/api/internal/update-inventory");
            if (res.data?.error) alert(`Update inventory failed: ${res.data.msg}`);
            else {
                setLabels(res.data.labels);
                setBatches(res.data.batches);
                setGiftLabels(res.data.giftMessages);
                setRePulls(res.data.rePulls);
            }
        } catch (e) {
            alert(`Update inventory error: ${e.message}`);
        } finally {
            setUpdatingInv(false);
        }
    };

    const toggleOosPrinter = (name, type) => {
        setOosSelectedPrinters(prev => {
            const cur = prev[type] ?? [];
            return {
                ...prev,
                [type]: cur.includes(name) ? cur.filter(p => p !== name) : [...cur, name],
            };
        });
    };

    const sendOOSImages = async () => {
        setOosSending(true);
        setOosSendProgress({ sent: 0, total: null, done: false }); // total filled in by server
        try {
            const res = await fetch("/api/production/dtf/oos", {
                method:  "POST",
                headers: { "Content-Type": "application/json" },
                body:    JSON.stringify({
                    printersByType: oosSelectedPrinters,
                    dateFrom:       oosDateFrom || null,
                    dateTo:         oosDateTo   || null,
                }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                alert(err.msg || "Failed to send OOS images");
                setOosSendProgress(null);
                return;
            }
            const reader  = res.body.getReader();
            const decoder = new TextDecoder();
            let buf = "";
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buf += decoder.decode(value, { stream: true });
                const lines = buf.split("\n");
                buf = lines.pop();
                for (const line of lines) {
                    if (!line.trim()) continue;
                    try {
                        const data = JSON.parse(line);
                        if (data.error) { alert(data.msg || "Error during send"); return; }
                        setOosSendProgress({ sent: data.sent, total: data.total, done: !!data.done });
                    } catch {}
                }
            }
        } catch (e) {
            alert(`Error sending OOS images: ${e.message}`);
            setOosSendProgress(null);
        } finally {
            setOosSending(false);
        }
    };

    const closeOosAfterSend = () => {
        setOosConfirmOpen(false);
        setOosModalOpen(false);
        setOosSendProgress(null);
        setOosSelectedPrinters({});
        setOosDateFrom("");
        setOosDateTo("");
    };

    const selectByDateRange = (from, to) => {
        if (!from && !to) { setSelected([]); return; }
        const sel = [];
        Object.keys(useLabels).forEach(l => {
            useLabels[l].forEach(k => {
                const raw = useShipByDate && k.shipByDate ? k.shipByDate : k.order?.date;
                if (!raw) return;
                const d = new Date(raw).toLocaleDateString("en-CA"); // YYYY-MM-DD
                if ((!from || d >= from) && (!to || d <= to)) sel.push(k.pieceId);
            });
        });
        setSelected(sel);
    };

    // Count OOS+ordered DTF-family items by type — exclude already-sent items
    const oosCountByType = (() => {
        const counts = {};
        for (const cat of Object.values(useLabels)) {
            for (const item of cat) {
                if (item.stockStatus !== "attached" && item.stockStatus !== "ordered") continue;
                const t = item.type?.toUpperCase();
                if (!t?.includes("DTF")) continue;
                if (item.isBlank) continue;
                if (item.steps?.some(s => s.status === "OOS Image Sent")) continue;
                if (oosDateFrom || oosDateTo) {
                    const raw = item.shipByDate || item.order?.date;
                    if (!raw) continue;
                    const d = new Date(raw).toLocaleDateString("en-CA");
                    if (oosDateFrom && d < oosDateFrom) continue;
                    if (oosDateTo   && d > oosDateTo)   continue;
                }
                counts[t] = (counts[t] ?? 0) + 1;
            }
        }
        return counts;
    })();
    const oosTotalCount = Object.values(oosCountByType).reduce((s, n) => s + n, 0);

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
                            {source !== "PP" && (
                                <Button variant="outlined" size="small" startIcon={<CardGiftcardIcon />}
                                    onClick={() => print("gift")} disabled={gift.length === 0}>
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
                                    onClick={pullOrdersNow} disabled={pulling || updatingInv}>
                                    {pulling ? "Pulling…" : "Pull Orders Now"}
                                </Button>
                            )}
                            {(source === "PP" || source === "po") && (
                                <Button variant="outlined" size="small" color="secondary"
                                    startIcon={<SyncIcon sx={{ animation: updatingInv ? "spin 1s linear infinite" : "none", "@keyframes spin": { "100%": { transform: "rotate(360deg)" } } }} />}
                                    onClick={updateInventoryNow} disabled={pulling || updatingInv}>
                                    {updatingInv ? "Updating…" : "Update Inventory"}
                                </Button>
                            )}
                            <Button variant="outlined" size="small" startIcon={<PrintIcon />}
                                onClick={() => setOosModalOpen(true)}
                                sx={{ borderColor: "error.light", color: "error.main", "&:hover": { borderColor: "error.main", bgcolor: "#fef2f2" } }}>
                                Print OOS Images
                            </Button>
                        </Stack>
                    </Box>

                    {/* Printer selector */}
                    <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
                        {printerList.map(p => {
                            const active = selectedPrinter === p.name;
                            return (
                                <Box key={p.name} onClick={() => setSelectedPrinter(p.name)}
                                    sx={{
                                        display: "flex", alignItems: "center", gap: 0.75,
                                        px: 1.5, py: 0.5, borderRadius: 1.5, cursor: "pointer",
                                        fontSize: "0.8125rem", fontWeight: active ? 700 : 500,
                                        lineHeight: 1.5, textTransform: "capitalize", userSelect: "none",
                                        transition: "background 0.12s, color 0.12s",
                                        bgcolor: active ? "primary.main" : "background.paper",
                                        color: active ? "#fff" : "text.primary",
                                        border: "1px solid",
                                        borderColor: active ? "primary.main" : "divider",
                                        boxShadow: active ? 1 : 0,
                                        "&:hover": { bgcolor: active ? "primary.dark" : "action.hover" },
                                    }}>
                                    <PrintIcon sx={{ fontSize: 13, opacity: active ? 0.9 : 0.55, flexShrink: 0 }} />
                                    {p.name}
                                    <Typography component="span" sx={{ fontSize: "0.68rem", opacity: active ? 0.8 : 0.5, ml: 0.25 }}>
                                        {p.format ?? "ZPL"}
                                    </Typography>
                                </Box>
                            );
                        })}
                    </Stack>

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
                                <Typography variant="caption" sx={{ fontWeight: 600, color: "text.secondary", display: "block", mb: 0.5 }}>
                                    Select by {useShipByDate ? "Ship By" : "Order"} Date
                                </Typography>
                                <Stack direction="row" spacing={0.75} alignItems="center">
                                    <TextField size="small" fullWidth type="date" label="From"
                                        InputLabelProps={{ shrink: true }}
                                        value={dateFrom}
                                        onChange={(e) => { setDateFrom(e.target.value); selectByDateRange(e.target.value, dateTo); }} />
                                    <Typography variant="body2" color="text.disabled" sx={{ flexShrink: 0 }}>–</Typography>
                                    <TextField size="small" fullWidth type="date" label="To"
                                        InputLabelProps={{ shrink: true }}
                                        value={dateTo}
                                        onChange={(e) => { setDateTo(e.target.value); selectByDateRange(dateFrom, e.target.value); }} />
                                </Stack>
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
                                item.stockStatus === "inStock" ||
                                (item.inventory?.inventoryType === "productInventory" && item.inventory?.productInventory)
                            ).length;
                            const orderedCount = useLabels[l].filter(item => item.stockStatus === "ordered").length;
                            const outCount = useLabels[l].filter(item => item.stockStatus === "attached").length;
                            const noInvCount = useLabels[l].filter(item =>
                                !item.stockStatus && !(item.inventory?.inventoryType === "productInventory" && item.inventory?.productInventory)
                            ).length;
                            // OOS image already printed vs not — so labels can be printed in two batches.
                            const imgPrintedCount    = useLabels[l].filter(item => item.oosImagePrinted).length;
                            const imgNotPrintedCount = useLabels[l].filter(item => !item.oosImagePrinted).length;

                            const displayed = useLabels[l].filter(matchesFilters);

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
                                                <Stack direction="row" spacing={0.5} flexWrap="wrap">
                                                    <Chip icon={<CheckCircleIcon sx={{ fontSize: "12px !important" }} />} label={`${inStockCount} in stock`} size="small"
                                                        onClick={() => setStockFilter(stockFilter === "inStock" ? null : "inStock")}
                                                        sx={{ height: 20, fontSize: "0.68rem", cursor: "pointer", bgcolor: stockFilter === "inStock" ? "#15803d" : "#f0fdf4", color: stockFilter === "inStock" ? "#fff" : "#15803d", outline: stockFilter === "inStock" ? "2px solid #15803d" : "none" }} />
                                                    {orderedCount > 0 && <Chip icon={<SyncIcon sx={{ fontSize: "12px !important" }} />} label={`${orderedCount} on order`} size="small"
                                                        onClick={() => setStockFilter(stockFilter === "ordered" ? null : "ordered")}
                                                        sx={{ height: 20, fontSize: "0.68rem", cursor: "pointer", bgcolor: stockFilter === "ordered" ? "#b45309" : "#fffbeb", color: stockFilter === "ordered" ? "#fff" : "#b45309", outline: stockFilter === "ordered" ? "2px solid #b45309" : "none" }} />}
                                                    {outCount > 0 && <Chip icon={<ErrorIcon sx={{ fontSize: "12px !important" }} />} label={`${outCount} out`} size="small"
                                                        onClick={() => setStockFilter(stockFilter === "attached" ? null : "attached")}
                                                        sx={{ height: 20, fontSize: "0.68rem", cursor: "pointer", bgcolor: stockFilter === "attached" ? "#dc2626" : "#fef2f2", color: stockFilter === "attached" ? "#fff" : "#dc2626", outline: stockFilter === "attached" ? "2px solid #dc2626" : "none" }} />}
                                                    {outCount > 0 && source === "po" && (
                                                        <Tooltip title="Order out-of-stock inventory">
                                                            <IconButton size="small" component="a" href="/inventory?order=oos" target="_blank" rel="noopener" sx={{ p: 0.25, color: "#dc2626" }}>
                                                                <AddShoppingCartIcon sx={{ fontSize: 15 }} />
                                                            </IconButton>
                                                        </Tooltip>
                                                    )}
                                                    {noInvCount > 0 && <Chip icon={<WarningAmberIcon sx={{ fontSize: "12px !important" }} />} label={`${noInvCount} no inv`} size="small"
                                                        onClick={() => setStockFilter(stockFilter === "noInv" ? null : "noInv")}
                                                        sx={{ height: 20, fontSize: "0.68rem", cursor: "pointer", bgcolor: stockFilter === "noInv" ? "#6b7280" : "#f9fafb", color: stockFilter === "noInv" ? "#fff" : "#6b7280", outline: stockFilter === "noInv" ? "2px solid #6b7280" : "none" }} />}
                                                    {imgPrintedCount > 0 && <Chip icon={<CheckCircleIcon sx={{ fontSize: "12px !important" }} />} label={`${imgPrintedCount} image printed`} size="small"
                                                        onClick={() => setImageFilter(imageFilter === "printed" ? null : "printed")}
                                                        sx={{ height: 20, fontSize: "0.68rem", cursor: "pointer", bgcolor: imageFilter === "printed" ? "#1d4ed8" : "#eff6ff", color: imageFilter === "printed" ? "#fff" : "#1d4ed8", outline: imageFilter === "printed" ? "2px solid #1d4ed8" : "none" }} />}
                                                    {imgNotPrintedCount > 0 && <Chip icon={<ErrorIcon sx={{ fontSize: "12px !important" }} />} label={`${imgNotPrintedCount} no image`} size="small"
                                                        onClick={() => setImageFilter(imageFilter === "notPrinted" ? null : "notPrinted")}
                                                        sx={{ height: 20, fontSize: "0.68rem", cursor: "pointer", bgcolor: imageFilter === "notPrinted" ? "#7c3aed" : "#f5f3ff", color: imageFilter === "notPrinted" ? "#fff" : "#7c3aed", outline: imageFilter === "notPrinted" ? "2px solid #7c3aed" : "none" }} />}
                                                </Stack>
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
                                            {["Status", "Piece ID", "PO Number", "Style", "Color", ...(source === "IM" ? ["Thread"] : []), "Size", "Date"].map(h => (
                                                <Typography key={h} variant="caption" sx={{ fontWeight: 700, fontSize: "0.68rem", textAlign: "center" }}>{h}</Typography>
                                            ))}
                                        </Box>

                                        {/* Scrollable item list */}
                                        <Box sx={{ maxHeight: "55vh", overflowY: "auto" }}>
                                            {displayed.map((item, j) => {
                                                const isSelected = selected.includes(item.pieceId);
                                                const inv = item.inventory;
                                                const isReturns = inv?.inventoryType === "productInventory" && !!inv?.productInventory;

                                                let stockLabel, stockColor;
                                                if (item.styleCode === "BUMP")            { stockLabel = "Ready";        stockColor = isSelected ? "#fff" : "#15803d"; }
                                                else if (item.stockStatus === "inStock")  { stockLabel = "In Stock";     stockColor = isSelected ? "#fff" : "#15803d"; }
                                                else if (item.stockStatus === "ordered")  { stockLabel = "On Order";     stockColor = isSelected ? "#fff" : "#b45309"; }
                                                else if (item.stockStatus === "attached") { stockLabel = "Out of Stock"; stockColor = isSelected ? "#fff" : "#dc2626"; }
                                                else if (isReturns)                       { stockLabel = "Returns";      stockColor = isSelected ? "#fff" : "#15803d"; }
                                                else                                      { stockLabel = "No Inventory"; stockColor = isSelected ? "#fff" : "#6b7280"; }

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
                                                                    {stockLabel}
                                                                </Typography>
                                                                {item.isBlank && (
                                                                    <Typography variant="caption" sx={{
                                                                        fontSize: "0.6rem", fontWeight: 700, display: "inline-block",
                                                                        px: 0.6, py: 0.1, borderRadius: 0.75,
                                                                        bgcolor: isSelected ? "rgba(255,255,255,0.18)" : "#f1f5f9",
                                                                        color:   isSelected ? "#fff" : "#475569",
                                                                        border: "1px solid", borderColor: isSelected ? "rgba(255,255,255,0.3)" : "#cbd5e1",
                                                                    }}>
                                                                        No Design
                                                                    </Typography>
                                                                )}
                                                                {inv?.inventoryType === "inventory" && inv?.inventory?.quantity !== undefined && (
                                                                    <Typography variant="caption" sx={{ fontSize: "0.62rem", color: isSelected ? "#fff" : "text.secondary", display: "block" }}>
                                                                        {`Stock: ${inv.inventory.quantity}`}
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
                                                                {item.steps?.some(s => s.status === "OOS Image Sent") && (
                                                                    <Typography variant="caption" sx={{ fontSize: "0.62rem", color: isSelected ? "#bfdbfe" : "#1d4ed8", display: "block", fontWeight: 600 }}>
                                                                        ✓ DTF image sent
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
                                                            <Box sx={{ textAlign: "center" }}>
                                                                <Typography sx={{ fontSize: "0.68rem", color: isSelected ? "#e0e7ff" : "text.disabled" }}>
                                                                    {new Date(item.shipByDate ?? item.date).toLocaleDateString("en-US")}
                                                                </Typography>
                                                                {item.shipByDate && (
                                                                    <Typography sx={{ fontSize: "0.58rem", color: isSelected ? "#c7d2fe" : "text.disabled", opacity: 0.75 }}>
                                                                        ship by
                                                                    </Typography>
                                                                )}
                                                            </Box>
                                                        </Box>
                                                        {/* Location row */}
                                                        {(inv?.inventoryType === "inventory" && inv?.inventory?.row) && (
                                                            <Box sx={{ px: 2, pb: 0.75 }}>
                                                                {stackLocation ? (
                                                                    <Box>
                                                                        {[["Aisle", inv.inventory.row], ["Unit", inv.inventory.unit], ["Shelf", inv.inventory.shelf], ["Bin", inv.inventory.bin]].map(([label, val]) => val != null && (
                                                                            <Typography key={label} sx={{ fontFamily: "monospace", fontSize: "0.65rem", color: isSelected ? "#c7d2fe" : "text.disabled" }}>
                                                                                {label}: {val}
                                                                            </Typography>
                                                                        ))}
                                                                    </Box>
                                                                ) : (
                                                                    <Typography sx={{ fontFamily: "monospace", fontSize: "0.65rem", color: isSelected ? "#c7d2fe" : "text.disabled" }}>
                                                                        Aisle: {inv.inventory.row} · Unit: {inv.inventory.unit} · Shelf: {inv.inventory.shelf} · Bin: {inv.inventory.bin}
                                                                    </Typography>
                                                                )}
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

            {/* Print OOS Images modal */}
            <Dialog open={oosModalOpen} onClose={() => !oosSending && setOosModalOpen(false)} maxWidth="sm" fullWidth disableEscapeKeyDown={oosSending}>
                <DialogTitle sx={{ fontWeight: 700, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    Print OOS Images
                    {!oosSending && <IconButton size="small" onClick={() => setOosModalOpen(false)}><CloseIcon fontSize="small" /></IconButton>}
                </DialogTitle>
                <DialogContent sx={{ pt: 1 }}>
                    {/* One printer-group per distinct DTF-family type found in the queue */}
                    {Object.keys(oosCountByType).length === 0 ? (
                        <Typography variant="body2" color="text.disabled" sx={{ mb: 2 }}>
                            No OOS or on-order DTF items in the current queue.
                        </Typography>
                    ) : (
                        Object.entries(oosCountByType).map(([type, count]) => {
                            const selected = oosSelectedPrinters[type] ?? [];
                            return (
                                <Box key={type} sx={{ mb: 2 }}>
                                    <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", display: "block", mb: 0.75 }}>
                                        {type} — {count} item{count !== 1 ? "s" : ""} queued
                                    </Typography>
                                    <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                                        {dtfPrinters.length === 0
                                            ? <Typography variant="caption" color="text.disabled">No DTF printers configured in settings</Typography>
                                            : dtfPrinters.map(name => {
                                                const active = selected.includes(name);
                                                return (
                                                    <Box key={name} onClick={() => toggleOosPrinter(name, type)}
                                                        sx={{
                                                            display: "flex", alignItems: "center", gap: 0.75,
                                                            px: 1.5, py: 0.5, borderRadius: 1.5, cursor: "pointer",
                                                            fontSize: "0.8125rem", fontWeight: active ? 700 : 500,
                                                            lineHeight: 1.5, textTransform: "capitalize", userSelect: "none",
                                                            transition: "background 0.12s, color 0.12s",
                                                            bgcolor: active ? "primary.main" : "background.paper",
                                                            color: active ? "#fff" : "text.primary",
                                                            border: "1px solid",
                                                            borderColor: active ? "primary.main" : "divider",
                                                            "&:hover": { bgcolor: active ? "primary.dark" : "action.hover" },
                                                        }}>
                                                        <PrintIcon sx={{ fontSize: 13, opacity: active ? 0.9 : 0.55, flexShrink: 0 }} />
                                                        {name}
                                                    </Box>
                                                );
                                            })
                                        }
                                    </Stack>
                                </Box>
                            );
                        })
                    )}

                    <Typography variant="caption" sx={{ fontWeight: 600, color: "text.secondary", display: "block", mb: 0.5, mt: 1 }}>
                        Date Range — optional (uses ship-by date when available, otherwise order date)
                    </Typography>
                    <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 2 }}>
                        <TextField size="small" fullWidth type="date" label="From" InputLabelProps={{ shrink: true }}
                            value={oosDateFrom}
                            onChange={(e) => setOosDateFrom(e.target.value)} />
                        <Typography variant="body2" color="text.disabled" sx={{ flexShrink: 0 }}>–</Typography>
                        <TextField size="small" fullWidth type="date" label="To" InputLabelProps={{ shrink: true }}
                            value={oosDateTo}
                            onChange={(e) => setOosDateTo(e.target.value)} />
                    </Stack>

                    {oosTotalCount > 0 && (
                        <Box sx={{ p: 1.5, borderRadius: 1.5, bgcolor: "#f0f9ff", border: "1px solid #bae6fd" }}>
                            {Object.entries(oosCountByType).map(([type, count]) => {
                                const prns = oosSelectedPrinters[type] ?? [];
                                if (!prns.length || !count) return null;
                                return (
                                    <Typography key={type} variant="body2" sx={{ color: "#0369a1", fontWeight: 600 }}>
                                        {count} {type} item{count !== 1 ? "s" : ""} → {prns.length} printer{prns.length !== 1 ? "s" : ""}
                                    </Typography>
                                );
                            })}
                            <Typography variant="caption" color="text.secondary">
                                A 24″-wide header image will be sent first to each selected printer.
                            </Typography>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button onClick={() => setOosModalOpen(false)} disabled={oosSending}>Cancel</Button>
                    <Button variant="contained" color="error"
                        onClick={() => setOosConfirmOpen(true)}
                        disabled={
                            oosTotalCount === 0 ||
                            !Object.entries(oosCountByType).some(
                                ([type, count]) => count > 0 && (oosSelectedPrinters[type]?.length ?? 0) > 0
                            )
                        }>
                        Submit
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Print OOS Images confirmation + live progress */}
            <Dialog
                open={oosConfirmOpen}
                onClose={() => !oosSending && !oosSendProgress?.sent && setOosConfirmOpen(false)}
                maxWidth="xs" fullWidth
                disableEscapeKeyDown={oosSending || (oosSendProgress && !oosSendProgress.done)}
            >
                <DialogTitle sx={{ fontWeight: 700, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    {oosSendProgress ? (oosSendProgress.done ? "Send Complete" : "Sending OOS Images…") : "Confirm Send OOS Images"}
                    {!oosSending && !oosSendProgress && (
                        <IconButton size="small" onClick={() => setOosConfirmOpen(false)}><CloseIcon fontSize="small" /></IconButton>
                    )}
                </DialogTitle>
                <DialogContent>
                    {oosSendProgress ? (
                        /* ── Progress view ── */
                        <Box>
                            {(oosSending || !oosSendProgress.done) && (
                                <Box sx={{ p: 1.5, mb: 2, borderRadius: 1.5, bgcolor: "#fffbeb", border: "1px solid #fcd34d", display: "flex", alignItems: "center", gap: 1 }}>
                                    <WarningAmberIcon sx={{ color: "#b45309", fontSize: 18, flexShrink: 0 }} />
                                    <Typography variant="body2" sx={{ color: "#92400e", fontWeight: 600 }}>
                                        Do not refresh or close this page until complete.
                                    </Typography>
                                </Box>
                            )}
                            <Typography variant="body2" sx={{ mb: 1.5, fontWeight: 600 }}>
                                {oosSendProgress.total === null
                                    ? "Preparing…"
                                    : `${oosSendProgress.sent} of ${oosSendProgress.total} item${oosSendProgress.total !== 1 ? "s" : ""} sent`
                                }
                            </Typography>
                            <LinearProgress
                                variant={oosSendProgress.total === null ? "indeterminate" : "determinate"}
                                value={oosSendProgress.total > 0 ? (oosSendProgress.sent / oosSendProgress.total) * 100 : 0}
                                sx={{ height: 10, borderRadius: 5, mb: 1 }}
                                color={oosSendProgress.done ? "success" : "primary"}
                            />
                            {oosSendProgress.done && (
                                <Typography variant="body2" color="success.main" sx={{ mt: 1, fontWeight: 600 }}>
                                    All images sent successfully.
                                </Typography>
                            )}
                        </Box>
                    ) : (
                        /* ── Pre-send confirmation view ── */
                        <Box>
                            {Object.entries(oosCountByType).map(([type, count]) => {
                                const prns = oosSelectedPrinters[type] ?? [];
                                if (!prns.length || !count) return null;
                                return (
                                    <Box key={type} sx={{ mb: 1.5 }}>
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                            <strong style={{ color: "#111827" }}>{count}</strong> {type} item{count !== 1 ? "s" : ""} →
                                        </Typography>
                                        <Stack direction="row" spacing={0.5} flexWrap="wrap">
                                            {prns.map(p => <Chip key={p} label={p} size="small" color="primary" />)}
                                        </Stack>
                                    </Box>
                                );
                            })}
                            {(oosDateFrom || oosDateTo) ? (
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                    Date range: <strong>{oosDateFrom || "any"}</strong> – <strong>{oosDateTo || "any"}</strong>
                                </Typography>
                            ) : (
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                    No date filter — all qualifying OOS items will be included.
                                </Typography>
                            )}
                            <Typography variant="body2" color="text.secondary">
                                A header image prints first on each printer. Items stay in the label queue and will show a blue "DTF image sent" indicator.
                            </Typography>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2 }}>
                    {oosSendProgress?.done ? (
                        <Button variant="contained" onClick={closeOosAfterSend}>Close</Button>
                    ) : (
                        <>
                            <Button onClick={() => setOosConfirmOpen(false)} disabled={oosSending}>Cancel</Button>
                            <Button variant="contained" color="error" onClick={sendOOSImages} disabled={oosSending}>
                                Confirm Send
                            </Button>
                        </>
                    )}
                </DialogActions>
            </Dialog>

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

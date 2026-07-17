"use client";
import { useState, useRef, useEffect } from "react";
import { Card, TextField, Box, InputAdornment, CircularProgress, Stack, ToggleButtonGroup, ToggleButton, Typography } from "@mui/material";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import RepeatIcon from "@mui/icons-material/Repeat";
import PrintIcon from "@mui/icons-material/Print";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import axios from "axios";
import { NoteSnackBar } from "./NoteSnackBar";

export function Scan({ auto, setAuto, order, setOrder, showNotes, setShowNotes, setItem, setBin, setShow, setActivate, pieceId, setBins, source, station, weight, setWeight, dimensions, setDimensions, onAction }) {
    const textFieldRef = useRef(null);
    const [scan, setScan]   = useState(pieceId);
    const [mode, setMode]   = useState(null); // null | "reship" | "reprint" | "preShip"
    const [loading, setLoading] = useState(false);

    const reship  = mode === "reship";
    const reprint = mode === "reprint";
    const preShip = mode === "preShip";

    const handleMode = (_, next) => {
        setMode(next);
        if (next === "reship") setAuto(true);
    };

    useEffect(() => {
        const update = async () => {
            const res = await axios.get("/api/production/shipping/update");
            if (res.data.error) alert(res.data.msg);
            else setBins(res.data.bins);
        };
        if (auto) {
            textFieldRef.current?.focus();
            setAuto(false);
            update();
        }
    }, [auto]);

    useEffect(() => {
        if (pieceId) {
            setScan(pieceId);
            GetInfo();
        }
    }, [pieceId]);

    const GetInfo = async (opts = {}) => {
        setLoading(true);
        const res = await axios.post("/api/production/shipping", { scan, reship, reprint, station, preShip, confirmReship: opts.confirmReship });
        setLoading(false);
        if (res.data.error) {
            // Delivered-order reship: confirm on the floor, then resend with confirmReship so the
            // reship proceeds (resets shipping + buys a new label).
            if (res.data.needsConfirmReship && !opts.confirmReship) {
                if (window.confirm(res.data.msg)) { GetInfo({ confirmReship: true }); return; }
                setScan("");
                setMode(null);
                return;
            }
            alert(res.data.msg);
            setScan("");
            setMode(null);
        } else {
            if (!reprint && !preShip) {
                if (res.data.item) {
                    if (res.data.item.order.notes?.length > 0) setShowNotes(true);
                    setItem(res.data.item);
                    setOrder(res.data.item.order);
                    setBin(res.data.bin);
                    if (res.data.weight) setWeight(res.data.weight);
                    if (res.data.dimensions) setDimensions(res.data.dimensions);
                } else if (res.data.order) {
                    if (res.data.order.notes?.length > 0) setShowNotes(true);
                    setOrder(res.data.order);
                    setBin(res.data.bin);
                } else if (res.data.bin) {
                    if (res.data.notes?.length > 0) setShowNotes(true);
                    setOrder(res.data.bin.order);
                    setBin(res.data.bin);
                }
                if (res.data.bins) setBins(res.data.bins);
                if (res.data.item || res.data.order || res.data.bin) {
                    setShow(true);
                    setActivate(res.data.activate);
                }
            } else if (reprint) {
                alert("label reprinted");
            } else if (preShip) {
                if (res.data.label.error) alert(`Error: ${res.data.label.msg}`);
                else alert(`Order Pre-Printed: ${res.data.label.trackingNumber}`);
            }
            setScan("");
            setMode(null);
            onAction?.();
        }
    };

    return (
        <Box sx={{ px: 2, mb: 2, mt: 2 }}>
            <NoteSnackBar notes={order?.notes ?? []} open={showNotes} setOpen={setShowNotes} />
            <Card variant="outlined" sx={{ borderRadius: 3, p: 2 }}>
                <Stack direction="row" alignItems="center" gap={2} flexWrap="wrap">
                    <TextField
                        label="Scan piece ID"
                        sx={{ flex: 1, minWidth: 200 }}
                        inputRef={textFieldRef}
                        autoFocus
                        value={scan ?? ""}
                        onChange={(e) => setScan(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") GetInfo(); }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    {loading
                                        ? <CircularProgress size={18} />
                                        : <QrCodeScannerIcon sx={{ color: "text.disabled" }} />
                                    }
                                </InputAdornment>
                            ),
                        }}
                    />
                    <ToggleButtonGroup
                        exclusive
                        value={mode}
                        onChange={handleMode}
                        size="small"
                        sx={{
                            "& .MuiToggleButton-root": {
                                px: 2, py: 0.75,
                                border: "1px solid rgba(0,0,0,0.12)",
                                borderRadius: "8px !important",
                                mx: 0.25,
                                gap: 0.75,
                                textTransform: "none",
                                fontWeight: 600,
                                fontSize: "0.8rem",
                                color: "text.secondary",
                                "&.Mui-selected": {
                                    bgcolor: "#6366f1",
                                    color: "#fff",
                                    borderColor: "#6366f1",
                                    "&:hover": { bgcolor: "#4f46e5" },
                                },
                                "&:hover": { bgcolor: "rgba(99,102,241,0.06)" },
                            },
                            "& .MuiToggleButtonGroup-grouped": {
                                borderRadius: "8px !important",
                                border: "1px solid rgba(0,0,0,0.12) !important",
                            },
                        }}
                    >
                        <ToggleButton value="reship">
                            <RepeatIcon sx={{ fontSize: 16 }} />
                            <Typography variant="inherit">ReShip</Typography>
                        </ToggleButton>
                        <ToggleButton value="reprint">
                            <PrintIcon sx={{ fontSize: 16 }} />
                            <Typography variant="inherit">RePrint</Typography>
                        </ToggleButton>
                        <ToggleButton value="preShip">
                            <LocalShippingIcon sx={{ fontSize: 16 }} />
                            <Typography variant="inherit">PreShip</Typography>
                        </ToggleButton>
                    </ToggleButtonGroup>
                </Stack>
            </Card>
        </Box>
    );
}

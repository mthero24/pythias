"use client";
import { useState, useRef, useEffect } from "react";
import { Card, TextField, Box, Checkbox, FormControlLabel, InputAdornment, CircularProgress, Stack } from "@mui/material";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import axios from "axios";
import { NoteSnackBar } from "./NoteSnackBar";

export function Scan({ auto, setAuto, order, setOrder, showNotes, setShowNotes, setItem, setBin, setShow, setActivate, pieceId, setBins, source, station, weight, setWeight, dimensions, setDimensions }) {
    const textFieldRef = useRef(null);
    const [scan, setScan]       = useState(pieceId);
    const [reship, setReship]   = useState(false);
    const [reprint, setReprint] = useState(false);
    const [preShip, setPreShip] = useState(false);
    const [loading, setLoading] = useState(false);

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

    const GetInfo = async () => {
        setLoading(true);
        const res = await axios.post("/api/production/shipping", { scan, reship, reprint, station, preShip });
        setLoading(false);
        if (res.data.error) {
            alert(res.data.msg);
            setScan("");
            setReship(false);
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
            setReship(false);
            setReprint(false);
            setPreShip(false);
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
                    <FormControlLabel
                        control={<Checkbox checked={reship} onChange={(e) => { setReship(e.target.checked); setAuto(true); }} />}
                        label="ReShip"
                        sx={{ whiteSpace: "nowrap", ml: 0 }}
                    />
                    <FormControlLabel
                        control={<Checkbox checked={reprint} onChange={(e) => setReprint(e.target.checked)} />}
                        label="RePrint"
                        sx={{ whiteSpace: "nowrap", ml: 0 }}
                    />
                    <FormControlLabel
                        control={<Checkbox checked={preShip} onChange={(e) => setPreShip(e.target.checked)} />}
                        label="PreShip"
                        sx={{ whiteSpace: "nowrap", ml: 0 }}
                    />
                </Stack>
            </Card>
        </Box>
    );
}

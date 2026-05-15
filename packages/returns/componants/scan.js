"use client";
import { useState, useRef, useEffect } from "react";
import { Box, Card, TextField, Button, MenuItem, Collapse, Stack, Grid2, InputAdornment } from "@mui/material";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import SearchIcon from "@mui/icons-material/Search";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp";
import axios from "axios";

export function Scan({ blanks, setVariant, setInventory, auto, setAuto }) {
    const textFieldRef          = useRef(null);
    const [scan, setScan]       = useState("");
    const [open, setOpen]       = useState(false);
    const [blank, setBlank]     = useState(null);
    const [color, setColor]     = useState(null);
    const [size, setSize]       = useState(null);
    const [design, setDesign]   = useState(null);

    useEffect(() => {
        if (auto) {
            textFieldRef.current?.focus();
            setAuto(false);
        }
    }, [auto]);

    const getInfo = async () => {
        if (!scan) return;
        setScan("");
        const res = await axios.post("/api/production/returns", { upc: scan })
            .catch(() => null);
        if (!res) return;
        if (res.data.error) alert(res.data.msg);
        else { setVariant(res.data.variant); setInventory(res.data.productInventory); }
    };

    const findItem = async () => {
        setVariant(null);
        setInventory(null);
        const res = await axios.post("/api/production/returns/find", {
            blank: blank._id, color: color._id, size: size._id, designSku: design,
        }).catch(() => null);
        if (!res) return;
        setVariant(res.data.variant);
        setInventory(res.data.productInventory);
        setBlank(null); setColor(null); setSize(null); setDesign(null);
        setOpen(false);
    };

    const canFind = blank && color && size && design;

    return (
        <Card variant="outlined" sx={{ borderRadius: 2, p: 2 }}>
            <Stack spacing={1.5}>
                <TextField
                    fullWidth size="small" label="Scan UPC"
                    inputRef={textFieldRef}
                    autoFocus
                    value={scan}
                    onChange={(e) => setScan(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") getInfo(); }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <QrCodeScannerIcon fontSize="small" sx={{ color: "text.disabled" }} />
                            </InputAdornment>
                        ),
                    }}
                />

                <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                    <Button
                        size="small"
                        onClick={() => setOpen(!open)}
                        startIcon={<SearchIcon />}
                        endIcon={open ? <ArrowDropUpIcon /> : <ArrowDropDownIcon />}
                    >
                        Find manually
                    </Button>
                </Box>

                <Collapse in={open}>
                    <Grid2 container spacing={1.5}>
                        <Grid2 size={{ xs: 6, sm: 3 }}>
                            <TextField select fullWidth size="small" label="Style Code" value={blank?._id ?? ""}
                                onChange={(e) => { setBlank(blanks.find(b => b._id === e.target.value)); setColor(null); setSize(null); }}>
                                {blanks.map(b => <MenuItem key={b._id} value={b._id}>{b.code}</MenuItem>)}
                            </TextField>
                        </Grid2>
                        <Grid2 size={{ xs: 6, sm: 3 }}>
                            <TextField select fullWidth size="small" label="Color" disabled={!blank} value={color?._id ?? ""}
                                onChange={(e) => setColor(blank.colors.find(c => c._id === e.target.value))}>
                                {blank?.colors.map(c => <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>)}
                            </TextField>
                        </Grid2>
                        <Grid2 size={{ xs: 6, sm: 3 }}>
                            <TextField select fullWidth size="small" label="Size" disabled={!blank} value={size?._id ?? ""}
                                onChange={(e) => setSize(blank.sizes.find(s => s._id === e.target.value))}>
                                {blank?.sizes.map(s => <MenuItem key={s._id} value={s._id}>{s.name}</MenuItem>)}
                            </TextField>
                        </Grid2>
                        <Grid2 size={{ xs: 6, sm: 3 }}>
                            <TextField fullWidth size="small" label="Design SKU" disabled={!blank}
                                value={design ?? ""}
                                onChange={(e) => setDesign(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter" && canFind) findItem(); }}
                            />
                        </Grid2>
                        {canFind && (
                            <Grid2 size={12} sx={{ display: "flex", justifyContent: "flex-end" }}>
                                <Button variant="contained" size="small" onClick={findItem}>Find Item</Button>
                            </Grid2>
                        )}
                    </Grid2>
                </Collapse>
            </Stack>
        </Card>
    );
}

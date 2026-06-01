"use client";
import { useState, useRef, useEffect } from "react";
import { Card, TextField, Box, InputAdornment, CircularProgress } from "@mui/material";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import axios from "axios";

export function Scan({ setSubmitted, auto, setAuto, printer, tajimaQueue }) {
    const textFieldRef = useRef(null);
    const [scan, setScan]       = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (auto) {
            textFieldRef.current?.focus();
            setAuto(false);
        }
    }, [auto]);

    const GetInfo = async () => {
        if (!scan?.trim()) return;
        setLoading(true);
        setScan("");
        setSubmitted(null);
        const res = await axios.post("/api/production/embroidery", { pieceId: scan, printer, tajimaQueue: tajimaQueue || "default" });
        setLoading(false);
        if (res.data.error) alert(res.data.msg);
        else setSubmitted(res.data);
    };

    return (
        <Box sx={{ px: { xs: 1, sm: "2%", md: "5%" }, mb: 2 }}>
            <Card variant="outlined" sx={{ borderRadius: 3, p: 2 }}>
                <TextField
                    label="Scan piece ID"
                    fullWidth
                    inputRef={textFieldRef}
                    autoFocus
                    value={scan}
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
            </Card>
        </Box>
    );
}

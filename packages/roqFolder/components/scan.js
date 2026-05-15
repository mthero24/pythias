"use client";
import { useState, useRef, useEffect } from "react";
import { Card, TextField, Box, Checkbox, FormControlLabel, Typography, InputAdornment, CircularProgress } from "@mui/material";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import axios from "axios";

export function Scan({ auto, setAuto, setItem }) {
    const textFieldRef = useRef(null);
    const [scan, setScan]             = useState("");
    const [shipSingles, setShipSingles] = useState(true);
    const [error, setError]           = useState(null);
    const [scans, setScans]           = useState([]);
    const [loading, setLoading]       = useState(false);

    useEffect(() => {
        if (auto) {
            textFieldRef.current?.focus();
            setAuto(false);
        }
    }, [auto]);

    const hasError = async (msg) => {
        for (let i = 0; i < 51; i++) {
            setError(i % 2 === 0 ? msg : null);
            await new Promise(resolve => setTimeout(resolve, 300));
        }
    };

    const GetInfo = async () => {
        if (!scan || scan.length === 0) return;
        setError(null);
        setItem(null);

        if (!scans.includes(scan)) {
            setScans(prev => [...prev.slice(-1), scan]);
            setLoading(true);
            const res = await axios.post("/api/production/roq-folder", { scan, shipSingles });
            setLoading(false);
            if (res.data.error) {
                hasError(res.data.msg);
                setScan("");
            } else {
                setItem(res.data.item);
                setScan("");
                setError(null);
            }
        } else {
            setScan("");
            setScans(prev => prev.slice(0, -1));
        }
    };

    return (
        <Box sx={{ px: 2, mb: 2, mt: 2 }}>
            <Card variant="outlined" sx={{ borderRadius: 3, p: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
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
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={shipSingles}
                                onChange={(e) => { setShipSingles(e.target.checked); setAuto(true); }}
                                sx={{ "& .MuiSvgIcon-root": { fontSize: 24 } }}
                            />
                        }
                        label="Ship Singles"
                        sx={{ whiteSpace: "nowrap", ml: 0 }}
                    />
                </Box>
            </Card>
            {error && (
                <Typography sx={{ fontSize: "2rem", fontWeight: 700, textAlign: "center", mt: 2, color: "#B22222" }}>
                    {error}!
                </Typography>
            )}
        </Box>
    );
}

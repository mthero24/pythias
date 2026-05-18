"use client";
import { useState, useRef, useEffect } from "react";
import { Card, TextField, Box, InputAdornment, CircularProgress, Alert, Collapse } from "@mui/material";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import axios from "axios";

export function Scan({ setSubmitted, auto, setAuto, printer, type, onAction }) {
    const textFieldRef = useRef(null);
    const [scan, setScan]       = useState("");
    const [loading, setLoading] = useState(false);
    const [toast, setToast]     = useState(null); // { severity, msg }
    const toastTimer            = useRef(null);

    const showToast = (severity, msg) => {
        clearTimeout(toastTimer.current);
        setToast({ severity, msg });
        if (severity !== "error") {
            toastTimer.current = setTimeout(() => setToast(null), 4000);
        }
    };

    useEffect(() => () => clearTimeout(toastTimer.current), []);

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
        setToast(null);
        try {
            let res;
            if (type === "send") res = await axios.post("/api/production/dtf", { pieceId: scan, printer });
            else res = await axios.get(`/api/production/dtf?pieceID=${scan}`);

            if (res.data.error) {
                showToast("error", res.data.msg);
            } else {
                setSubmitted(res.data);
                onAction?.();
                showToast("success", res.data.msg || "Done");
            }
        } catch {
            showToast("error", "Request failed. Check your connection.");
        }
        setLoading(false);
        textFieldRef.current?.focus();
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
                <Collapse in={!!toast} unmountOnExit>
                    <Alert
                        severity={toast?.severity ?? "info"}
                        onClose={() => { setToast(null); clearTimeout(toastTimer.current); }}
                        sx={{ mt: 1.5, borderRadius: 2 }}
                    >
                        {toast?.msg}
                    </Alert>
                </Collapse>
            </Card>
        </Box>
    );
}

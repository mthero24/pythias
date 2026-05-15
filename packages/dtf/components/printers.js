"use client";
import {
    Grid2, Box, Typography, Card, Dialog, DialogTitle, DialogContent,
    DialogActions, Button, Stack, IconButton,
} from "@mui/material";
import PrintIcon  from "@mui/icons-material/Print";
import CloseIcon  from "@mui/icons-material/Close";
import { useState } from "react";
import axios from "axios";

export function Printers({ printers, printer, setPrinter, setAuto }) {
    const [pendingModal, setPendingModal] = useState(false);

    return (
        <Box>
            <Stack direction="row" flexWrap="wrap" gap={1} alignItems="center">
                {printers?.map((s) => {
                    const active = printer === s;
                    return (
                        <Card
                            key={s}
                            variant="outlined"
                            onClick={() => { setAuto(false); setPrinter(s); setAuto(true); }}
                            sx={{
                                px: 2.5, py: 1.25, cursor: "pointer", borderRadius: 2,
                                borderColor: active ? "#6366f1" : "divider",
                                borderWidth: active ? 2 : 1,
                                bgcolor: active ? "#6366f1" : "background.paper",
                                color: active ? "#fff" : "text.primary",
                                transition: "all 120ms",
                                "&:hover": { borderColor: "#6366f1", bgcolor: active ? "#5558e3" : "#f0f0ff" },
                            }}
                        >
                            <Stack direction="row" alignItems="center" spacing={0.75}>
                                <PrintIcon sx={{ fontSize: 16 }} />
                                <Typography variant="body2" sx={{ fontWeight: 700, textTransform: "capitalize" }}>{s}</Typography>
                            </Stack>
                        </Card>
                    );
                })}
                <Card
                    variant="outlined"
                    onClick={() => setPendingModal(true)}
                    sx={{
                        px: 2.5, py: 1.25, cursor: "pointer", borderRadius: 2,
                        transition: "all 120ms",
                        "&:hover": { borderColor: "#6366f1", bgcolor: "#f0f0ff" },
                    }}
                >
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>Print Pending Items</Typography>
                </Card>
            </Stack>
            <PrintPendingModal open={pendingModal} setOpen={setPendingModal} printers={printers} />
        </Box>
    );
}

function PrintPendingModal({ open, setOpen, printers }) {
    const [usePrinters, setUsePrinters] = useState([]);

    const toggle = (p) => setUsePrinters(prev =>
        prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
    );

    const handlePrint = () => {
        axios.put("/api/production/dtf", { printers: usePrinters });
        setOpen(false);
        setUsePrinters([]);
    };

    return (
        <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ fontWeight: 700, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                Print Pending Items
                <IconButton size="small" onClick={() => setOpen(false)}><CloseIcon fontSize="small" /></IconButton>
            </DialogTitle>
            <DialogContent>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Select which printers to receive the pending items.
                </Typography>
                <Stack direction="row" flexWrap="wrap" gap={1}>
                    {printers?.map(p => {
                        const active = usePrinters.includes(p);
                        return (
                            <Card
                                key={p}
                                variant="outlined"
                                onClick={() => toggle(p)}
                                sx={{
                                    px: 2.5, py: 1.25, cursor: "pointer", borderRadius: 2,
                                    borderColor: active ? "#6366f1" : "divider",
                                    borderWidth: active ? 2 : 1,
                                    bgcolor: active ? "#6366f1" : "background.paper",
                                    color: active ? "#fff" : "text.primary",
                                    transition: "all 120ms",
                                    "&:hover": { borderColor: "#6366f1", bgcolor: active ? "#5558e3" : "#f0f0ff" },
                                }}
                            >
                                <Stack direction="row" alignItems="center" spacing={0.75}>
                                    <PrintIcon sx={{ fontSize: 16 }} />
                                    <Typography variant="body2" sx={{ fontWeight: 700, textTransform: "capitalize" }}>{p}</Typography>
                                </Stack>
                            </Card>
                        );
                    })}
                </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={() => setOpen(false)}>Cancel</Button>
                <Button variant="contained" onClick={handlePrint} disabled={usePrinters.length === 0}>
                    Print to {usePrinters.length || ""} Printer{usePrinters.length !== 1 ? "s" : ""}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

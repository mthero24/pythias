"use client";
import { Box, Stack, Typography, Chip } from "@mui/material";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import { Manifest } from "./manifest";
import { Stations, stationName, stationHasScale } from "./stations";
import { Bins } from "./bins";
import { Scan } from "./scan";
import { OrderModal } from "./orderModal";
import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Repull } from "../../repull/exports";
import { Footer } from "@pythias/backend";

export function Main({ stations, binCount, bins, pieceId, stat, source }) {
    const [station, setStation]       = useState(stat ?? stationName(stations?.[0]) ?? "station1");
    const stationObj = stations?.find(s => stationName(s) === station);
    const hasScale = stationHasScale(stationObj ?? station);
    const [order, setOrder]           = useState();
    const [item, setItem]             = useState();
    const [bin, setBin]               = useState();
    const [binss, setBins]            = useState(bins);
    const [auto, setAuto]             = useState(true);
    const [size, setSize]             = useState({ width: 900, height: 900 });
    const [show, setShow]             = useState(false);
    const [action, setAction]         = useState();
    const [showNotes, setShowNotes]   = useState(false);
    const [weight, setWeight]         = useState(0);
    const [dimensions, setDimensions] = useState();
    const [stats, setStats]           = useState({ shipped: 0, binned: 0 });

    const fetchStats = useCallback(async () => {
        try {
            const res = await axios.get("/api/production/shipping/stats");
            if (!res.data.error) setStats(res.data);
        } catch {}
    }, []);

    useEffect(() => {
        fetchStats();
        const interval = setInterval(fetchStats, 30_000);
        return () => clearInterval(interval);
    }, [fetchStats]);

    useEffect(() => {
        if (typeof window !== "undefined") {
            setSize({ width: window.innerWidth, height: window.innerHeight });
            const handleResize = () => setSize({ width: window.innerWidth, height: window.innerHeight });
            window.addEventListener("resize", handleResize);
            return () => window.removeEventListener("resize", handleResize);
        }
    }, []);

    const modalStyle = {
        position: "absolute",
        top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        width: { md: size.width - 100, xs: size.width - 25 },
        height: { md: size.height - 100, xs: size.height - 25 },
        bgcolor: "background.paper",
        border: "2px solid #000",
        boxShadow: 24,
        p: 4,
        overflow: "auto",
    };

    return (
        <>
            <Box sx={{ bgcolor: "background.default", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
                {/* Header */}
                <Box sx={{ bgcolor: "background.paper", borderBottom: "1px solid", borderColor: "divider", px: 2, py: 2 }}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                        <Stack direction="row" alignItems="center" spacing={1.5}>
                            <Box sx={{ width: 36, height: 36, borderRadius: 2, background: "linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                <LocalShippingIcon sx={{ color: "#fff", fontSize: 20 }} />
                            </Box>
                            <Box>
                                <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: -0.5, lineHeight: 1.2 }}>Ship Orders</Typography>
                                <Typography variant="body2" color="text.secondary">Scan a piece ID or bin to process shipping</Typography>
                            </Box>
                        </Stack>
                        <Stack direction="row" spacing={1}>
                            <Chip
                                icon={<CheckCircleIcon sx={{ fontSize: "16px !important" }} />}
                                label={`${stats.shipped} shipped`}
                                size="small"
                                sx={{ fontWeight: 700, fontSize: "0.78rem", bgcolor: "#dcfce7", color: "#16a34a", border: "1px solid #bbf7d0", "& .MuiChip-icon": { color: "#16a34a" } }}
                            />
                            <Chip
                                icon={<Inventory2Icon sx={{ fontSize: "16px !important" }} />}
                                label={`${stats.binned} binned`}
                                size="small"
                                sx={{ fontWeight: 700, fontSize: "0.78rem", bgcolor: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe", "& .MuiChip-icon": { color: "#2563eb" } }}
                            />
                        </Stack>
                    </Stack>
                    <Manifest binCount={binCount} setAuto={setAuto} setBins={setBins} modalStyle={modalStyle} style={modalStyle} />
                    <Stations stations={stations} station={station} setStation={setStation} setAuto={setAuto} />
                </Box>

                <Scan
                    auto={auto} order={order} showNotes={showNotes} setShowNotes={setShowNotes}
                    setAuto={setAuto} setOrder={setOrder} setItem={setItem} setBin={setBin}
                    setShow={setShow} setActivate={setAction} pieceId={pieceId} setBins={setBins}
                    source={source} station={station} weight={weight} setWeight={setWeight}
                    dimensions={dimensions} setDimensions={setDimensions} onAction={fetchStats}
                />

                <Bins
                    bins={binss} setBins={setBins} setOrder={setOrder} setAuto={setAuto}
                    setBin={setBin} setShow={setShow} setAction={setAction} setShowNotes={setShowNotes}
                />

                <Box sx={{ px: 2, mt: "auto", pt: 3 }}>
                    <Repull />
                </Box>

                <OrderModal
                    order={order} setOrder={setOrder} setShowNotes={setShowNotes}
                    item={item} setItem={setItem} bin={bin} setBin={setBin}
                    style={modalStyle} show={show} setShow={setShow} setAuto={setAuto}
                    setBins={setBins} action={action} setAction={setAction}
                    station={station} hasScale={hasScale} source={source}
                    weight={weight} setWeight={setWeight}
                    dimensions={dimensions} setDimensions={setDimensions} onAction={fetchStats}
                />
            </Box>
            <Footer fixed={true} />
        </>
    );
}

"use client";
import { Box, Stack, Typography, Chip } from "@mui/material";
import FolderIcon from "@mui/icons-material/Folder";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AutoAwesomeMotionIcon from "@mui/icons-material/AutoAwesomeMotion";
import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Scan } from "./scan";
import { Images } from "./images";
import { NoteSnackBar } from "./NoteSnackBar";
import { Repull } from "../../repull/exports";
import { Footer } from "@pythias/backend";

export const Main = ({ source }) => {
    const [auto, setAuto]           = useState(true);
    const [item, setItem]           = useState(null);
    const [showNotes, setShowNotes] = useState(false);
    const [stats, setStats]         = useState({ shipped: 0, folded: 0 });

    useEffect(() => {
        item?.order && item.order.notes.length > 0 ? setShowNotes(true) : setShowNotes(false);
    }, [item]);

    const fetchStats = useCallback(async () => {
        try {
            const res = await axios.get("/api/production/roq-folder/stats");
            if (!res.data.error) setStats(res.data);
        } catch {}
    }, []);

    useEffect(() => {
        fetchStats();
        const interval = setInterval(fetchStats, 30_000);
        return () => clearInterval(interval);
    }, [fetchStats]);

    return (
        <>
            <Box sx={{ bgcolor: "background.default", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
                {/* Header */}
                <Box sx={{ bgcolor: "background.paper", borderBottom: "1px solid", borderColor: "divider", px: 2, py: 2 }}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Stack direction="row" alignItems="center" spacing={1.5}>
                            <Box sx={{ width: 36, height: 36, borderRadius: 2, background: "linear-gradient(135deg, #f97316 0%, #6366f1 100%)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                <FolderIcon sx={{ color: "#fff", fontSize: 20 }} />
                            </Box>
                            <Box>
                                <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: -0.5, lineHeight: 1.2 }}>Folder</Typography>
                                <Typography variant="body2" color="text.secondary">Scan a piece ID to send to the folder machine</Typography>
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
                                icon={<AutoAwesomeMotionIcon sx={{ fontSize: "16px !important" }} />}
                                label={`${stats.folded} folded`}
                                size="small"
                                sx={{ fontWeight: 700, fontSize: "0.78rem", bgcolor: "#fff7ed", color: "#c2410c", border: "1px solid #fed7aa", "& .MuiChip-icon": { color: "#c2410c" } }}
                            />
                        </Stack>
                    </Stack>
                </Box>

                <Scan auto={auto} setAuto={setAuto} setItem={setItem} onAction={fetchStats} />

                {item && (
                    <Box sx={{ px: 2 }}>
                        <Images item={item} source={source} />
                        {item.order?.notes?.length > 0 && (
                            <NoteSnackBar notes={item.order.notes} open={showNotes} setOpen={setShowNotes} />
                        )}
                    </Box>
                )}

                <Box sx={{ px: 2, mt: "auto", pt: 3 }}>
                    <Repull />
                </Box>
            </Box>
            <Footer fixed={true} />
        </>
    );
};

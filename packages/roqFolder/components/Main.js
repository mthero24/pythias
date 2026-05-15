"use client";
import { Box, Stack, Typography } from "@mui/material";
import FolderIcon from "@mui/icons-material/Folder";
import { useState, useEffect } from "react";
import { Scan } from "./scan";
import { Images } from "./images";
import { NoteSnackBar } from "./NoteSnackBar";
import { Repull } from "../../repull/exports";
import { Footer } from "@pythias/backend";

export const Main = ({ source }) => {
    const [auto, setAuto]           = useState(true);
    const [item, setItem]           = useState(null);
    const [showNotes, setShowNotes] = useState(false);

    useEffect(() => {
        item?.order && item.order.notes.length > 0 ? setShowNotes(true) : setShowNotes(false);
    }, [item]);

    return (
        <>
            <Box sx={{ bgcolor: "background.default", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
                {/* Header */}
                <Box sx={{ bgcolor: "background.paper", borderBottom: "1px solid", borderColor: "divider", px: 2, py: 2 }}>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                        <Box sx={{ width: 36, height: 36, borderRadius: 2, background: "linear-gradient(135deg, #f97316 0%, #6366f1 100%)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <FolderIcon sx={{ color: "#fff", fontSize: 20 }} />
                        </Box>
                        <Box>
                            <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: -0.5, lineHeight: 1.2 }}>Folder</Typography>
                            <Typography variant="body2" color="text.secondary">Scan a piece ID to send to the folder machine</Typography>
                        </Box>
                    </Stack>
                </Box>

                <Scan auto={auto} setAuto={setAuto} setItem={setItem} />

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

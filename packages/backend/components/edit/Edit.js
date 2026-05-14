"use client";
import {
    Box, Container, TextField, Grid2, Typography, Button, Stack, Card, CardContent,
    Divider, IconButton, Tooltip, InputAdornment, Dialog, DialogTitle, DialogActions,
    DialogContent, Chip,
} from "@mui/material";
import { useState } from "react";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import CloseIcon from "@mui/icons-material/Close";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import WcIcon from "@mui/icons-material/Wc";
import StyleIcon from "@mui/icons-material/Style";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import CategoryIcon from "@mui/icons-material/Category";
import SellIcon from "@mui/icons-material/Sell";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import StorefrontIcon from "@mui/icons-material/Storefront";
import PrintIcon from "@mui/icons-material/Print";
import ReplayIcon from "@mui/icons-material/Replay";
import ListAltIcon from "@mui/icons-material/ListAlt";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import { Footer } from "../reusable/Footer";
import axios from "axios";

const CATEGORY_META = {
    seasons:        { label: "Seasons",         icon: <CalendarMonthIcon fontSize="small" /> },
    genders:        { label: "Genders",         icon: <WcIcon fontSize="small" /> },
    themes:         { label: "Themes",          icon: <StyleIcon fontSize="small" /> },
    sportUsedFor:   { label: "Sport Used For",  icon: <FitnessCenterIcon fontSize="small" /> },
    departments:    { label: "Departments",     icon: <CategoryIcon fontSize="small" /> },
    brands:         { label: "Brands",          icon: <SellIcon fontSize="small" /> },
    suppliers:      { label: "Suppliers",       icon: <LocalShippingIcon fontSize="small" /> },
    vendors:        { label: "Vendors",         icon: <StorefrontIcon fontSize="small" /> },
    printTypes:     { label: "Print Types",     icon: <PrintIcon fontSize="small" /> },
    repullReasons:  { label: "Repull Reasons",  icon: <ReplayIcon fontSize="small" /> },
    categories:     { label: "Categories",      icon: <ListAltIcon fontSize="small" /> },
    printLocations: { label: "Print Locations", icon: <LocationOnIcon fontSize="small" /> },
};

export function Edit({ data }) {
    const [values, setValues] = useState(data);
    const [add, setAdd] = useState({});
    const [deleteTarget, setDeleteTarget] = useState(null);

    const save = async ({ type, value }) => {
        if (!value?.trim()) return;
        const res = await axios.post("/api/admin/oneoffs", { type, value: value.trim() });
        if (res.data.error) {
            alert(res.data.msg ?? "Error saving item");
        } else {
            setValues(prev => ({ ...prev, [type]: res.data[type] }));
            setAdd(prev => ({ ...prev, [type]: "" }));
        }
    };

    const handleAdd = (key) => {
        const value = add[key]?.trim();
        if (!value) return;
        save({ type: key, value });
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        const res = await axios.delete(`/api/admin/oneoffs?id=${deleteTarget.id}&type=${deleteTarget.type}`);
        if (res.status === 200) {
            setValues(prev => ({ ...prev, [deleteTarget.type]: res.data[deleteTarget.type] }));
        }
        setDeleteTarget(null);
    };

    return (
        <Box sx={{ width: "100%", maxWidth: "100%", overflowX: "hidden" }}>
            <Container maxWidth="lg" sx={{ py: 4, minHeight: "90vh" }}>

                {/* Header */}
                <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>Edit Data</Typography>
                    <Typography variant="body2" color="text.secondary">
                        Manage lookup values used across designs and products
                    </Typography>
                </Box>

                <Grid2 container spacing={2}>
                    {values && Object.keys(values).map((key) => {
                        const meta = CATEGORY_META[key] ?? { label: key, icon: <ListAltIcon fontSize="small" /> };
                        const list = values[key] ?? [];

                        return (
                            <Grid2 key={key} size={{ xs: 12, sm: 6, md: 4 }}>
                                <Card variant="outlined" sx={{ borderRadius: 2, height: "100%", display: "flex", flexDirection: "column" }}>
                                    <CardContent sx={{ p: 2, flex: 1, display: "flex", flexDirection: "column" }}>

                                        {/* Card header */}
                                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                                            <Box sx={{ color: "primary.main" }}>{meta.icon}</Box>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 700, flex: 1 }}>
                                                {meta.label}
                                            </Typography>
                                            <Chip
                                                label={list.length}
                                                size="small"
                                                variant="outlined"
                                                sx={{ fontSize: "0.65rem", height: 18 }}
                                            />
                                        </Stack>

                                        {/* Add input */}
                                        <TextField
                                            size="small"
                                            fullWidth
                                            placeholder={`Add ${meta.label.toLowerCase()}…`}
                                            value={add[key] ?? ""}
                                            onChange={(e) => setAdd(prev => ({ ...prev, [key]: e.target.value }))}
                                            onKeyDown={(e) => { if (e.key === "Enter") handleAdd(key); }}
                                            sx={{ mb: 1.5 }}
                                            InputProps={{
                                                endAdornment: (
                                                    <InputAdornment position="end">
                                                        <Tooltip title="Add">
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => handleAdd(key)}
                                                                disabled={!add[key]?.trim()}
                                                                edge="end"
                                                            >
                                                                <AddIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </InputAdornment>
                                                ),
                                            }}
                                        />

                                        <Divider sx={{ mb: 1 }} />

                                        {/* Scrollable list */}
                                        <Box sx={{
                                            flex: 1,
                                            minHeight: 200,
                                            maxHeight: 260,
                                            overflowY: "auto",
                                            "&::-webkit-scrollbar": { width: 4 },
                                            "&::-webkit-scrollbar-thumb": { background: "rgba(0,0,0,0.15)", borderRadius: 2 },
                                        }}>
                                            {list.length === 0 ? (
                                                <Box sx={{ py: 4, textAlign: "center" }}>
                                                    <Typography variant="caption" color="text.disabled">
                                                        No {meta.label.toLowerCase()} yet
                                                    </Typography>
                                                </Box>
                                            ) : (
                                                <Stack spacing={0}>
                                                    {list.map((item, idx) => (
                                                        <Box
                                                            key={item._id ?? idx}
                                                            sx={{
                                                                display: "flex",
                                                                alignItems: "center",
                                                                justifyContent: "space-between",
                                                                px: 1,
                                                                py: 0.75,
                                                                borderRadius: 1,
                                                                "&:hover": { backgroundColor: "action.hover" },
                                                                "&:hover .delete-btn": { opacity: 1 },
                                                            }}
                                                        >
                                                            <Typography variant="body2" sx={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                                {item.name}
                                                            </Typography>
                                                            <IconButton
                                                                className="delete-btn"
                                                                size="small"
                                                                onClick={() => setDeleteTarget({ type: key, id: item._id, name: item.name })}
                                                                sx={{ opacity: 0, transition: "opacity 120ms", color: "error.main", ml: 0.5 }}
                                                            >
                                                                <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                                                            </IconButton>
                                                        </Box>
                                                    ))}
                                                </Stack>
                                            )}
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid2>
                        );
                    })}
                </Grid2>
            </Container>

            {/* Delete confirmation dialog */}
            <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    Remove Item
                    <IconButton size="small" onClick={() => setDeleteTarget(null)}>
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary">
                        Are you sure you want to remove{" "}
                        <Typography component="span" variant="body2" sx={{ fontWeight: 600, color: "text.primary" }}>
                            "{deleteTarget?.name}"
                        </Typography>
                        {" "}from {CATEGORY_META[deleteTarget?.type]?.label ?? deleteTarget?.type}?
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
                    <Button variant="contained" color="error" onClick={confirmDelete}>Remove</Button>
                </DialogActions>
            </Dialog>

            <Footer />
        </Box>
    );
}

"use client";
import {
    Grid2, Box, Container, Typography, TextField, Button,
    Dialog, DialogTitle, DialogContent, DialogActions,
    IconButton, Paper, Stack, Chip, Divider, InputAdornment, Tooltip,
} from '@mui/material';
import AddIcon    from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon   from '@mui/icons-material/Edit';
import CheckIcon  from '@mui/icons-material/Check';
import CloseIcon  from '@mui/icons-material/Close';
import StorefrontIcon from '@mui/icons-material/Storefront';
import TuneIcon   from '@mui/icons-material/Tune';
import { useEffect, useState } from 'react';
import axios from 'axios';

export function Main({ marketplaces }) {
    const [markets, setMarkets]                 = useState(marketplaces);
    const [categoryOpen, setCategoryOpen]       = useState(false);
    const [marketplace, setMarketplace]         = useState(null);
    const [categoryEdit, setCategoryEdit]       = useState("");
    const [activeValues, setActiveValues]       = useState({});
    const [titleGeneratorValues, setTitleGeneratorValues] = useState({});
    const [editing, setEditing]                 = useState({ marketplace: null, category: null, value: null });
    const [deleteCategory, setDeleteCategory]   = useState(false);
    const [removeOption, setRemoveOption]       = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState(null);
    const [optionToDelete, setOptionToDelete]   = useState(null);

    const saveTitleField = async (m, field, value, isPrompt = false) => {
        if (!value?.trim()) return;
        const res = await axios.put("/api/marketplaces", { marketplace: m._id, category: "titleGenerator", value, isPrompt });
        if (res.status === 200) setMarkets(res.data.marketplaces);
    };

    const addOption = async (m, key) => {
        const value = activeValues[m.name]?.[key];
        if (!value?.trim()) return;
        const res = await axios.put("/api/marketplaces", { marketplace: m._id, category: key, value });
        if (res.status === 200) {
            setMarkets(res.data.marketplaces);
            setActiveValues(prev => { const a = { ...prev }; if (a[m.name]) delete a[m.name][key]; return a; });
        }
    };

    const saveEditedOption = async (m, key, newValue, oldValue) => {
        const res = await axios.put("/api/marketplaces", { marketplace: m._id, category: key, value: newValue, oldValue });
        if (res.status === 200) {
            setMarkets(res.data.marketplaces);
            setEditing({ marketplace: null, category: null, value: "", oldValue: "" });
        }
    };

    const toggleRequired = async (m, key, current) => {
        const res = await axios.put("/api/marketplaces", { marketplace: m._id, category: "required", oldCategory: key, value: !current });
        if (res.status === 200) {
            setMarkets(res.data.marketplaces);
            setActiveValues(prev => { const a = { ...prev }; if (a[m.name]) delete a[m.name][key]; return a; });
        }
    };

    return (
        <Box sx={{ bgcolor: "#f5f7fa", minHeight: "100vh", pb: 6 }}>
            {/* Page header */}
            <Box sx={{ bgcolor: "#fff", borderBottom: "1px solid #e5e7eb", py: 3, px: { xs: 2, sm: 4 }, mb: 4 }}>
                <Container maxWidth="lg">
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                        <StorefrontIcon sx={{ color: "#6b7280" }} />
                        <Box>
                            <Typography variant="h5" fontWeight={700}>Marketplaces</Typography>
                            <Typography variant="body2" color="text.secondary">
                                Manage product dropdown categories and title generator settings per marketplace.
                            </Typography>
                        </Box>
                    </Stack>
                </Container>
            </Box>

            <Container maxWidth="lg">
                <Stack spacing={3}>
                    {markets.map((m, i) => {
                        const categories = Object.keys(m.productDropDowns || {}).filter(k => k !== "titleGenerator");
                        const titleGen   = m.productDropDowns?.titleGenerator ?? {};

                        return (
                            <Paper key={i} variant="outlined" sx={{ borderRadius: 2, border: "1px solid #e5e7eb", overflow: "hidden" }}>
                                {/* ── Marketplace header ── */}
                                <Box sx={{ px: 3, py: 2, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #f0f0f0", bgcolor: "#fafbfc" }}>
                                    <Stack direction="row" alignItems="center" spacing={1.5}>
                                        <StorefrontIcon sx={{ color: "#6b7280", fontSize: 20 }} />
                                        <Typography variant="h6" fontWeight={700}>{m.name}</Typography>
                                        <Chip label={`${categories.length} categor${categories.length !== 1 ? "ies" : "y"}`} size="small" variant="outlined" sx={{ fontSize: "0.7rem" }} />
                                    </Stack>
                                    <Button
                                        size="small" variant="contained" startIcon={<AddIcon />}
                                        onClick={() => { setMarketplace(m); setCategoryEdit(""); setCategoryOpen(true); }}
                                        sx={{ borderRadius: 1.5 }}
                                    >
                                        Add Category
                                    </Button>
                                </Box>

                                <Box sx={{ p: 3 }}>
                                    {/* ── Title Generator ── */}
                                    <Box sx={{ mb: 3, p: 2.5, border: "1px solid #e0e0e0", borderRadius: 2, bgcolor: "#fff" }}>
                                        <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                                            <TuneIcon sx={{ color: "text.secondary", fontSize: 18 }} />
                                            <Typography variant="subtitle2" fontWeight={700} color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 0.5, fontSize: "0.7rem" }}>
                                                Title Generator
                                            </Typography>
                                        </Stack>
                                        <Stack spacing={1.5}>
                                            <TextField
                                                size="small" fullWidth label="Label"
                                                value={titleGeneratorValues[m.name]?.label ?? titleGen.label ?? ""}
                                                onChange={(e) => setTitleGeneratorValues(prev => ({ ...prev, [m.name]: { ...prev[m.name], label: e.target.value } }))}
                                                onKeyDown={(e) => { if (e.key === "Enter") saveTitleField(m, "label", titleGeneratorValues[m.name]?.label); }}
                                                InputProps={{
                                                    endAdornment: (
                                                        <InputAdornment position="end">
                                                            <Tooltip title="Save label">
                                                                <IconButton size="small" onClick={() => saveTitleField(m, "label", titleGeneratorValues[m.name]?.label)}>
                                                                    <CheckIcon sx={{ fontSize: 16, color: "#4caf50" }} />
                                                                </IconButton>
                                                            </Tooltip>
                                                        </InputAdornment>
                                                    ),
                                                }}
                                            />
                                            <TextField
                                                size="small" fullWidth label="Prompt" multiline rows={2}
                                                value={titleGeneratorValues[m.name]?.titleGeneratorPrompt ?? titleGen.prompt ?? ""}
                                                onChange={(e) => setTitleGeneratorValues(prev => ({ ...prev, [m.name]: { ...prev[m.name], titleGeneratorPrompt: e.target.value } }))}
                                                InputProps={{
                                                    endAdornment: (
                                                        <InputAdornment position="end" sx={{ alignSelf: "flex-start", mt: 1 }}>
                                                            <Tooltip title="Save prompt">
                                                                <IconButton size="small" onClick={() => saveTitleField(m, "prompt", titleGeneratorValues[m.name]?.titleGeneratorPrompt, true)}>
                                                                    <CheckIcon sx={{ fontSize: 16, color: "#4caf50" }} />
                                                                </IconButton>
                                                            </Tooltip>
                                                        </InputAdornment>
                                                    ),
                                                }}
                                            />
                                        </Stack>
                                    </Box>

                                    {/* ── Category cards ── */}
                                    {categories.length > 0 ? (
                                        <Grid2 container spacing={2}>
                                            {categories.map((key, j) => {
                                                const isRequired = !!(m.required?.[key]);
                                                const values     = m.productDropDowns[key] ?? [];

                                                return (
                                                    <Grid2 size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={j}>
                                                        <Box sx={{ border: "1px solid #e0e0e0", borderRadius: 2, overflow: "hidden", height: "100%", display: "flex", flexDirection: "column", bgcolor: "#fff" }}>
                                                            {/* Category header */}
                                                            <Box sx={{ px: 1.5, py: 1, bgcolor: "#f8fafc", borderBottom: "1px solid #f0f0f0", display: "flex", alignItems: "center", gap: 1 }}>
                                                                <Typography variant="caption" fontWeight={700} sx={{ flexGrow: 1, textTransform: "capitalize" }}>{key}</Typography>
                                                                <Tooltip title={isRequired ? "Click to make Recommended" : "Click to make Required"}>
                                                                    <Chip
                                                                        label={isRequired ? "Required" : "Recommended"}
                                                                        size="small"
                                                                        onClick={() => toggleRequired(m, key, isRequired)}
                                                                        sx={{
                                                                            fontSize: "0.6rem", height: 18, cursor: "pointer", fontWeight: 600,
                                                                            bgcolor: isRequired ? "#fee2e2" : "#dbeafe",
                                                                            color:   isRequired ? "#b91c1c" : "#1d4ed8",
                                                                        }}
                                                                    />
                                                                </Tooltip>
                                                                <Tooltip title="Edit category name">
                                                                    <IconButton size="small" onClick={() => { setCategoryEdit(key); setMarketplace(m); setCategoryOpen(true); }}>
                                                                        <EditIcon sx={{ fontSize: 14, color: "#6b7280" }} />
                                                                    </IconButton>
                                                                </Tooltip>
                                                                <Tooltip title="Delete category">
                                                                    <IconButton size="small" onClick={() => { setCategoryToDelete(key); setMarketplace(m); setDeleteCategory(true); }}>
                                                                        <DeleteIcon sx={{ fontSize: 14, color: "#ef4444" }} />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            </Box>

                                                            {/* Add option input */}
                                                            <Box sx={{ px: 1.5, py: 1, borderBottom: "1px solid #f0f0f0" }}>
                                                                <TextField
                                                                    size="small" fullWidth placeholder="Add option…"
                                                                    value={activeValues[m.name]?.[key] ?? ""}
                                                                    onChange={(e) => setActiveValues(prev => ({ ...prev, [m.name]: { ...prev[m.name], [key]: e.target.value } }))}
                                                                    onKeyDown={(e) => { if (e.key === "Enter") addOption(m, key); }}
                                                                    InputProps={{
                                                                        endAdornment: (
                                                                            <InputAdornment position="end">
                                                                                <IconButton size="small" onClick={() => addOption(m, key)}>
                                                                                    <AddIcon sx={{ fontSize: 16 }} />
                                                                                </IconButton>
                                                                            </InputAdornment>
                                                                        ),
                                                                    }}
                                                                    sx={{ "& .MuiOutlinedInput-root": { fontSize: "0.8rem" } }}
                                                                />
                                                            </Box>

                                                            {/* Options list */}
                                                            <Box sx={{ flexGrow: 1, overflowY: "auto", maxHeight: 220 }}>
                                                                {values.length === 0 ? (
                                                                    <Box sx={{ py: 3, textAlign: "center" }}>
                                                                        <Typography variant="caption" color="text.disabled">No options yet</Typography>
                                                                    </Box>
                                                                ) : values.map((value, k) => {
                                                                    const isEditing = editing.marketplace === m._id && editing.category === key && editing.oldValue === value;
                                                                    return (
                                                                        <Box
                                                                            key={k}
                                                                            sx={{
                                                                                display: "flex", alignItems: "center", gap: 0.5,
                                                                                px: 1.5, py: 0.6,
                                                                                borderBottom: k < values.length - 1 ? "1px solid #f5f5f5" : "none",
                                                                                bgcolor: isEditing ? "#f0f9ff" : "transparent",
                                                                                "&:hover": { bgcolor: isEditing ? "#f0f9ff" : "#f8fafc" },
                                                                                "&:hover .row-actions": { opacity: 1 },
                                                                            }}
                                                                        >
                                                                            {isEditing ? (
                                                                                <>
                                                                                    <TextField
                                                                                        size="small" fullWidth
                                                                                        value={editing.value}
                                                                                        onChange={(e) => setEditing(prev => ({ ...prev, value: e.target.value }))}
                                                                                        onKeyDown={(e) => { if (e.key === "Enter") saveEditedOption(m, key, editing.value, value); }}
                                                                                        autoFocus
                                                                                        sx={{ "& .MuiOutlinedInput-root": { fontSize: "0.8rem" } }}
                                                                                    />
                                                                                    <IconButton size="small" onClick={() => saveEditedOption(m, key, editing.value, value)}>
                                                                                        <CheckIcon sx={{ fontSize: 14, color: "#4caf50" }} />
                                                                                    </IconButton>
                                                                                    <IconButton size="small" onClick={() => setEditing({ marketplace: null, category: null, value: "", oldValue: "" })}>
                                                                                        <CloseIcon sx={{ fontSize: 14, color: "#6b7280" }} />
                                                                                    </IconButton>
                                                                                </>
                                                                            ) : (
                                                                                <>
                                                                                    <Typography variant="body2" sx={{ flexGrow: 1, fontSize: "0.8rem" }}>{value}</Typography>
                                                                                    <Box className="row-actions" sx={{ display: "flex", gap: 0.25, opacity: 0, transition: "opacity 0.15s" }}>
                                                                                        <IconButton size="small" onClick={() => setEditing({ marketplace: m._id, category: key, value, oldValue: value })}>
                                                                                            <EditIcon sx={{ fontSize: 13, color: "#6b7280" }} />
                                                                                        </IconButton>
                                                                                        <IconButton size="small" onClick={() => { setOptionToDelete(value); setMarketplace(m); setCategoryToDelete(key); setRemoveOption(true); }}>
                                                                                            <DeleteIcon sx={{ fontSize: 13, color: "#ef4444" }} />
                                                                                        </IconButton>
                                                                                    </Box>
                                                                                </>
                                                                            )}
                                                                        </Box>
                                                                    );
                                                                })}
                                                            </Box>

                                                            {/* Option count footer */}
                                                            <Box sx={{ px: 1.5, py: 0.75, borderTop: "1px solid #f0f0f0", bgcolor: "#fafafa" }}>
                                                                <Typography variant="caption" color="text.disabled">
                                                                    {values.length} option{values.length !== 1 ? "s" : ""}
                                                                </Typography>
                                                            </Box>
                                                        </Box>
                                                    </Grid2>
                                                );
                                            })}
                                        </Grid2>
                                    ) : (
                                        <Box sx={{ py: 4, textAlign: "center", color: "text.secondary", border: "1px dashed #d1d5db", borderRadius: 2 }}>
                                            <Typography variant="body2">No categories yet. Click "Add Category" to create one.</Typography>
                                        </Box>
                                    )}
                                </Box>
                            </Paper>
                        );
                    })}
                </Stack>
            </Container>

            <AddCategoryModal
                marketplace={marketplace} setMarkets={setMarkets}
                open={categoryOpen} setOpen={setCategoryOpen}
                categoryEdit={categoryEdit} setCategoryEdit={setCategoryEdit}
            />
            <DeleteCategoryModal
                marketplace={marketplace} setMarkets={setMarkets}
                open={deleteCategory} setOpen={setDeleteCategory}
                category={categoryToDelete}
                setDeleteCategory={setDeleteCategory} setCategoryToDelete={setCategoryToDelete}
            />
            <RemoveOptionModal
                marketplace={marketplace} setMarkets={setMarkets}
                open={removeOption} setOpen={setRemoveOption}
                category={categoryToDelete} option={optionToDelete}
                setCategoryToDelete={setCategoryToDelete} setOptionToDelete={setOptionToDelete}
            />
        </Box>
    );
}

function AddCategoryModal({ marketplace, open, setOpen, setMarkets, categoryEdit, setCategoryEdit }) {
    const [category, setCategory] = useState(categoryEdit);
    const isEdit = !!(categoryEdit && categoryEdit !== "");

    useEffect(() => { setCategory(categoryEdit); }, [categoryEdit, open]);

    const handleClose = () => { setOpen(false); setCategoryEdit(""); };

    const handleSubmit = async () => {
        if (!category?.trim()) return;
        const res = await axios.put("/api/marketplaces", { marketplace: marketplace._id, category: category.trim(), oldCategory: categoryEdit });
        if (res.status === 200) {
            setCategory("");
            setCategoryEdit("");
            setOpen(false);
            setMarkets(res.data.marketplaces);
        }
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
            <DialogTitle sx={{ fontWeight: 700, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                {isEdit ? "Edit Category" : "Add Category"}
                <IconButton size="small" onClick={handleClose}><CloseIcon fontSize="small" /></IconButton>
            </DialogTitle>
            <DialogContent sx={{ pt: "12px !important" }}>
                <TextField
                    label="Category name" fullWidth size="small"
                    value={category} autoFocus
                    onChange={(e) => setCategory(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
                />
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={handleClose}>Cancel</Button>
                <Button variant="contained" onClick={handleSubmit} disabled={!category?.trim()}>
                    {isEdit ? "Save" : "Add"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

function DeleteCategoryModal({ marketplace, open, setOpen, setMarkets, category, setDeleteCategory, setCategoryToDelete }) {
    const handleClose = () => { setOpen(false); setCategoryToDelete(null); setDeleteCategory(null); };

    const handleConfirm = async () => {
        const res = await axios.post("/api/marketplaces", { marketplace: marketplace._id, category });
        if (res.status === 200) {
            setCategoryToDelete(null);
            setDeleteCategory(false);
            setMarkets(res.data.marketplaces);
            setOpen(false);
        }
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
            <DialogTitle sx={{ fontWeight: 700, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                Remove Category
                <IconButton size="small" onClick={handleClose}><CloseIcon fontSize="small" /></IconButton>
            </DialogTitle>
            <DialogContent>
                <Typography variant="body2" color="text.secondary">
                    Remove the category <strong style={{ color: "#111827" }}>"{category}"</strong> and all its options? This cannot be undone.
                </Typography>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={handleClose}>Cancel</Button>
                <Button variant="contained" color="error" onClick={handleConfirm}>Remove</Button>
            </DialogActions>
        </Dialog>
    );
}

function RemoveOptionModal({ marketplace, open, setOpen, setMarkets, category, setCategoryToDelete, option, setOptionToDelete }) {
    const handleClose = () => { setOpen(false); setCategoryToDelete(null); setOptionToDelete(null); };

    const handleConfirm = async () => {
        const res = await axios.put("/api/marketplaces", { marketplace: marketplace._id, category, oldValue: option });
        if (res.status === 200) {
            setCategoryToDelete(null);
            setOptionToDelete(null);
            setMarkets(res.data.marketplaces);
            setOpen(false);
        }
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
            <DialogTitle sx={{ fontWeight: 700, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                Remove Option
                <IconButton size="small" onClick={handleClose}><CloseIcon fontSize="small" /></IconButton>
            </DialogTitle>
            <DialogContent>
                <Typography variant="body2" color="text.secondary">
                    Remove <strong style={{ color: "#111827" }}>"{option}"</strong> from <strong style={{ color: "#111827" }}>{category}</strong>? This cannot be undone.
                </Typography>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={handleClose}>Cancel</Button>
                <Button variant="contained" color="error" onClick={handleConfirm}>Remove</Button>
            </DialogActions>
        </Dialog>
    );
}

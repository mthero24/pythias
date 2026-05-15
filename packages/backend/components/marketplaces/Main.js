"use client";
import { Grid2, Box, Container, Typography, TextField, MenuItem, Button, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, FormControl, FormLabel, FormControlLabel, FormGroup, Radio, RadioGroup } from '@mui/material';
import AddIcon    from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon   from '@mui/icons-material/Edit';
import CheckIcon  from '@mui/icons-material/Check';
import CloseIcon  from '@mui/icons-material/Close';
import { useEffect, useState } from 'react';
import axios from 'axios';
export function Main({marketplaces}){
    let [markets, setMarkets] = useState(marketplaces); 
    let [categoryOpen, setCategoryOpen] = useState(false);
    let [marketplace, setMarketplace] = useState(null);
    const [categoryEdit, setCategoryEdit] = useState("");
    let [activeValues, setActiveValues] = useState({});
    let [titleGeneratorValues, setTitleGeneratorValues] = useState({});
    let [editing, setEditing] = useState({marketplace: null, category: null, value: null});
    const [deleteCategory, setDeleteCategory] = useState(false);
    const [removeOption, setRemoveOption] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState(null);
    const [optionToDelete, setOptionToDelete] = useState(null);
    return <Container maxWidth="lg" sx={{mt: 4, mb: 4}}>
        {markets.map((m, i) => {
            return <Box key={i} sx={{mb: 2, p: 2, border: "1px solid black", borderRadius: "5px"}}>
                <Box sx={{display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center",  gap: 2,}}>
                    <Typography variant="h6">{m.name}</Typography>
                    <Box sx={{display: "flex", flexDirection: "row", gap: 1}}>
                        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => { setMarketplace(m); setCategoryOpen(true); }}>Add </Button>
                    </Box>
                </Box>
                <Grid2 container spacing={2}>
                    <Grid2 item size={12}>
                        <Typography variant="subtitle1">Title Generator</Typography>
                        <Box sx={{display: "flex", flexDirection: "row", gap: 1, alignItems: "center"}}>
                            <TextField fullWidth label="Label" value={titleGeneratorValues[m.name]?.label || (m.productDropDowns && m.productDropDowns.titleGenerator ? m.productDropDowns.titleGenerator.label : "")} variant="outlined" size="small" onChange={async (e) => { 
                                let t = {...titleGeneratorValues};
                                t[m.name] = t[m.name] || {};
                                t[m.name].label = e.target.value;
                                setTitleGeneratorValues({...t});
                            }} />   
                            <CheckIcon sx={{ color: "#4caf50", fontSize: "1.3rem", cursor: "pointer", display: "reletive", marginLeft: "-50px", zIndex: 9 }} onClick={async () => {
                                console.log(titleGeneratorValues)
                                let value = titleGeneratorValues[m.name]?.label
                                if (!value) return;
                                let res = await axios.put(`/api/marketplaces`, { marketplace: m._id, category: "titleGenerator", value })
                                if (res.status === 200) {
                                    setMarkets(res.data.marketplaces);
                                }
                            }} />
                        </Box>
                        <Box sx={{display: "flex", flexDirection: "row", gap: 1, alignItems: "center", marginTop: 1}}>
                            <TextField fullWidth label="Prompt" value={titleGeneratorValues[m.name] ? titleGeneratorValues[m.name].titleGeneratorPrompt :m.productDropDowns && m.productDropDowns.titleGenerator && m.productDropDowns.titleGenerator.prompt} variant="outlined" size="small" onChange={async (e)=>{
                                console.log(titleGeneratorValues)
                                titleGeneratorValues[m.name] = titleGeneratorValues[m.name] || {};
                                titleGeneratorValues[m.name].titleGeneratorPrompt = e.target.value;
                                setTitleGeneratorValues({...titleGeneratorValues});
                            }}/>
                            <CheckIcon sx={{ color: "#4caf50", fontSize: "1.3rem", cursor: "pointer", display: "reletive", marginLeft: "-50px", zIndex: 9}} onClick={async() => {
                                console.log(titleGeneratorValues)
                                let value = titleGeneratorValues[m.name]?.titleGeneratorPrompt
                                if(!value) return;
                                let res = await axios.put(`/api/marketplaces`, { marketplace: m._id, category: "titleGenerator", value, isPrompt: true })
                                if (res.status === 200) {
                                    setMarkets(res.data.marketplaces);
                                }
                            }} />
                        </Box>
                    </Grid2>
                    <Grid2 item size={12}>
                        <hr />
                    </Grid2>
                    {Object.keys(m.productDropDowns || {}).map((key, j) => {
                        if(key === "titleGenerator") return null;
                        return <Grid2 item size={3} key={j}>
                            <Box sx={{border: "1px solid gray", borderRadius: "5px",}}>
                                <Box sx={{display: "flex", flexDirection: "row", justifyContent: "flex-end", alignItems: "center",  gap: 2, p: 1}}>
                                    <FormControl>
                                        <RadioGroup
                                            aria-labelledby="demo-radio-buttons-group-label"
                                            value={m.required && m.required[key] && m.required[key] ? "Required" : "Recommended"}
                                            name="radio-buttons-group"
                                        onChange={async (e)=>{
                                            console.log(e.target.value)
                                            let res = await axios.put(`/api/marketplaces`, { marketplace: m._id, category: "required", oldCategory: key, value: e.target.value == "Required"? true: false })
                                            if (res.status === 200) {
                                                setMarkets(res.data.marketplaces);
                                                let a = activeValues
                                                if (a[m.name]) delete a[m.name][key]
                                                setActiveValues({ ...a })
                                            }

                                        }}>
                                            <FormControlLabel value="Recommended" control={<Radio />} label="Recommended" />
                                            <FormControlLabel value="Required" control={<Radio />} label="Required" />
                                        </RadioGroup>
                                    </FormControl>
                                    <EditIcon sx={{ fontSize: "1.1rem", color: "#8f88e9", cursor: "pointer" }} onClick={async () => {
                                        setCategoryEdit(key);
                                        setMarketplace(m);
                                        setCategoryOpen(true);
                                    }} />
                                    <DeleteIcon sx={{fontSize: "1rem", color: "#6e1717", cursor: "pointer"}} onClick={async () => {
                                        setCategoryToDelete(key);
                                        setMarketplace(m);
                                        setDeleteCategory(true);
                                    }} />
                                </Box>
                                <Box sx={{display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center",  gap: 2, p: 1}}>
                                    <TextField fullWidth label={key} value={activeValues[m.name]?.[key] || ""} variant="outlined" size="small" onChange={(e)=>{
                                        let a = activeValues
                                        if(!a[m.name]) a[m.name] = {}
                                        a[m.name][key] = e.target.value
                                        setActiveValues({...a})
                                    }} />
                                    <AddIcon sx={{ fontSize: "1.3rem", cursor: "pointer", display: "reletive", marginLeft: "-50px", zIndex: 9}} onClick={async() => {
                                        let value = activeValues[m.name]?.[key]
                                        if(!value) return;
                                        let res = await axios.put(`/api/marketplaces`, { marketplace: m._id, category: key, value })
                                        if(res.status === 200){
                                            setMarkets(res.data.marketplaces);
                                            let a = activeValues
                                            if(a[m.name]) delete a[m.name][key]
                                            setActiveValues({...a})
                                        }
                                    }}
                                    />
                                </Box>
                                <hr />
                                {m.productDropDowns[key].map((value, k) => {
                                    if(editing.marketplace === m._id && editing.category === key && editing.oldValue === value){
                                        return <Box key={k} sx={{display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center",  gap: 2, p: 1, backgroundColor: "#f5f5f5", marginBottom: "5px", borderRadius: "5px", border: "1px solid #e0e0e0"}}>
                                            <TextField fullWidth value={editing.value} onChange={(e)=>{
                                                setEditing({...editing, value: e.target.value})
                                            }} />
                                            <CheckIcon sx={{color: "#4caf50", cursor: "pointer", marginLeft: "-50px", zIndex: 9}} onClick={async () => {
                                                let res = await axios.put(`/api/marketplaces`, { marketplace: m._id, category: key, value: editing.value, oldValue: value })
                                                if(res.status === 200){
                                                    setMarkets(res.data.marketplaces);
                                                    setEditing({marketplace: null, category: null, value: "", oldValue: ""});
                                                }
                                            }} />
                                        </Box>
                                    }
                                    else return <Box key={k} sx={{display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center",  gap: 2, p: 1, backgroundColor: "#f5f5f5", marginBottom: "5px", borderRadius: "5px", border: "1px solid #e0e0e0", margin: "2px 6px"}}>
                                        <Typography>{value}</Typography>
                                        <Box sx={{display: "flex", flexDirection: "row", gap: 0.5, padding: "0px"}}>
                                            <EditIcon sx={{ fontSize: "1.1rem", color: "#8f88e9", cursor: "pointer"}} onClick={async () => {
                                                setEditing({marketplace: m._id, category: key, value, oldValue: value});
                                            }}/>
                                            <DeleteIcon sx={{ fontSize: "1.1rem", color: "#6e1717", cursor: "pointer"}} onClick={async () => {
                                                setOptionToDelete(value);
                                                setMarketplace(m);
                                                setCategoryToDelete(key);
                                                setRemoveOption(true);
                                            }} />
                                        </Box>
                                    </Box>
                                })}
                            </Box>
                        </Grid2>
                    })}
                </Grid2>
            </Box>
        })}
        <AddCategoryModal marketplace={marketplace} setMarkets={setMarkets} open={categoryOpen} setOpen={setCategoryOpen} categoryEdit={categoryEdit} setCategoryEdit={setCategoryEdit} />
        <DeleteCategoryModal marketplace={marketplace} setMarkets={setMarkets} open={deleteCategory} setOpen={setDeleteCategory} category={categoryToDelete} setDeleteCategory={setDeleteCategory} setCategoryToDelete={setCategoryToDelete}  />
        <RemoveOptionModal marketplace={marketplace} setMarkets={setMarkets} open={removeOption} setOpen={setRemoveOption} category={categoryToDelete} option={optionToDelete} setCategoryToDelete={setCategoryToDelete} setOptionToDelete={setOptionToDelete}/>
    </Container>
}

function AddCategoryModal({ marketplace, open, setOpen, setMarkets, categoryEdit, setCategoryEdit }) {
    const [category, setCategory] = useState(categoryEdit);
    const isEdit = !!(categoryEdit && categoryEdit !== "");

    useEffect(() => { setCategory(categoryEdit); }, [categoryEdit, open]);

    const handleClose = () => { setOpen(false); setCategoryEdit(""); };

    const handleSubmit = async () => {
        if (!category?.trim()) return;
        const res = await axios.put(`/api/marketplaces`, { marketplace: marketplace._id, category: category.trim(), oldCategory: categoryEdit });
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
                    label="Category name"
                    fullWidth
                    size="small"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
                    autoFocus
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
        const res = await axios.post(`/api/marketplaces`, { marketplace: marketplace._id, category });
        if (res.status === 200) {
            setCategoryToDelete(null);
            setDeleteCategory(false);
            setMarkets(res.data.marketplaces);
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
        const res = await axios.put(`/api/marketplaces`, { marketplace: marketplace._id, category, oldValue: option });
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
"use client";
import { Grid2, Box, Container, Typography, TextField, MenuItem, Button, Modal, FormControl, FormControlLabel, FormGroup, Checkbox} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useEffect, useState } from 'react';
import axios from 'axios';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
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
                                    <FormGroup>
                                        <FormControlLabel control={<Checkbox defaultChecked />} label="Recommended" />
                                        <FormControlLabel required control={<Checkbox />} label="Required" />
                                    </FormGroup>
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

function AddCategoryModal({marketplace, open, setOpen, setMarkets, categoryEdit, setCategoryEdit}){
    console.log("categoryEdit", categoryEdit)
    const [category, setCategory] = useState(categoryEdit);
    useEffect(() => {
        setCategory(categoryEdit);
    }, [categoryEdit])
    let style = {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 400,
        bgcolor: 'background.paper',
        border: '2px solid #000',
        boxShadow: 24,
        p: 4,
    };
    return (
        <Modal open={open} onClose={() => setOpen(false)}>
            <Box sx={style}>
                <Typography variant="h6">{categoryEdit && categoryEdit !== "" ? "Edit Category" : "Add Category"}</Typography>
                <Box sx={{ mt: 2 }}>
                    <TextField label="Category Name" fullWidth value={category} onChange={(e) => setCategory(e.target.value)} />
                </Box>
                <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end", gap: 1 }}>
                    <Button variant="contained" color="primary" onClick={async (e) => {
                        // Handle add category action
                        console.log("Adding category")

                        let res = await axios.put(`/api/marketplaces`, { marketplace: marketplace._id, category, oldCategory: categoryEdit })
                        console.log(res)
                        if (res.status === 200) {
                            // Handle successful addition
                            setCategory("");
                            setCategoryEdit("");
                            setOpen(false);
                            setMarkets(res.data.marketplaces);

                        }
                    }}>{categoryEdit && categoryEdit !== "" ? "Edit" : "Add"}</Button>
                    <Button variant="outlined" color="secondary" onClick={() => setOpen(false)}>Cancel</Button>
                </Box>
            </Box>
        </Modal>
    );
}
function DeleteCategoryModal({ marketplace, open, setOpen, setMarkets, category, setDeleteCategory, setCategoryToDelete }) {
    let style = {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 500,
        bgcolor: 'background.paper',
        border: '2px solid #000',
        boxShadow: 24,
        p: 4,
    };
    return (
        <Modal open={open} onClose={() => { setOpen(false); setCategoryToDelete(null); setDeleteCategory(null); }}>
            <Box sx={style}>
                <Typography variant="h6">Remove Category</Typography>
                <Typography>Are you sure you want to remove the category "{category}"?</Typography>
                <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end", gap: 1 }}>
                    <Button variant="contained" color="error" onClick={async (e) => {
                        // Handle remove category action
                        console.log("Removing category")

                        let res = await axios.post(`/api/marketplaces`, { marketplace: marketplace._id, category })
                        console.log(res)
                        if (res.status === 200) {
                            // Handle successful removal
                            setCategoryToDelete(null);
                            setDeleteCategory(false);
                            setMarkets(res.data.marketplaces);

                        }
                    }}>Remove</Button>
                    <Button variant="outlined" color="secondary" onClick={() => { setOpen(false); setCategoryToDelete(null); setDeleteCategory(null); }}>Cancel</Button>
                </Box>
            </Box>
        </Modal>
    );
}
function RemoveOptionModal({ marketplace, open, setOpen, setMarkets, category, setCategoryToDelete, option, setOptionToDelete }) {
    let style = {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 500,
        bgcolor: 'background.paper',
        border: '2px solid #000',
        boxShadow: 24,
        p: 4,
    };
    return (
        <Modal open={open} onClose={() => { setOpen(false); setCategoryToDelete(null); setOptionToDelete(null);  }}>
            <Box sx={style}>
                <Typography variant="h6">Remove Option</Typography>
                <Typography>Are you sure you want to remove the option "{option}"?</Typography>
                <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end", gap: 1 }}>
                    <Button variant="contained" color="error" onClick={async (e) => {
                        // Handle remove option action
                        console.log("Removing option")

                        let res = await axios.put(`/api/marketplaces`, { marketplace: marketplace._id, category, oldValue: option })
                        console.log(res)
                        if (res.status === 200) {
                            // Handle successful removal
                            setCategoryToDelete(null);
                            setOptionToDelete(null);
                            setMarkets(res.data.marketplaces);
                            setOpen(false);

                        }
                    }}>Remove</Button>
                    <Button variant="outlined" color="secondary" onClick={() => { setOpen(false); setCategoryToDelete(null); setOptionToDelete(null); }}>Cancel</Button>
                </Box>
            </Box>
        </Modal>
    );
}
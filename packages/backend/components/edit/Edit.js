"use client";
import {Box, Container, TextField, Grid2, Typography, Modal, Button} from "@mui/material";
import {useState} from "react";
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import {Footer} from "../reusable/Footer";
import axios from "axios";
import { set } from "mongoose";
export function Edit({data}) {
    const [values, setValues] = useState(data);
    const [add, setAdd] = useState({});
    const [open, setOpen] = useState(false);
    const [id, setId] = useState(null);
    const save = async ({type, value}) =>{
        let res = await axios.post("/api/admin/oneoffs", {type, value})
        console.log(res.data)
        if(res.data.error){
            console.error("Error saving one-off:", res.data.msg)
        } else {
            let vals = {...values}
            vals[type] = res.data[type]
            setValues({...vals})
        }
    }
    return (
        <Box>
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                <Grid2 container spacing={2}>
                    {values && Object.keys(values).map(key=>
                        <Grid2 size={{xs: 12, sm: 6}}>
                            <Box sx={{background: "#fff", padding: "2%", borderRadius: 2}}>
                                <Box sx={{display: "flex", flexDirection: "row", alignItems: "center"}}>
                                    <TextField label={key} fullWidth value={add[key]? add[key]: ""} onChange={(e) => setAdd({...add, [key]: e.target.value})} onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            let val = values
                                            val[key] = [...val[key], {name: add[key]}]
                                            setValues({...val});
                                            save({ type: key, value: add[key] })
                                            setAdd({ ...add, [key]: "" });
                                        }
                                    }} />
                                    <AddIcon sx={{cursor: "pointer", position: "relative", right: 30, marginRight: "-30px"}} onClick={() => {
                                        let val = values
                                        val[key] = [...val[key], { name: add[key] }]
                                        setValues({ ...val });
                                        save({ type: key, value: add[key] })
                                        setAdd({ ...add, [key]: "" });
                                    }} />
                                </Box>
                                <Box sx={{border: "1px solid #ccc", borderRadius: 1, padding: 2, minHeight: 300, maxHeight: 300, overflowY: "auto", mt: 1}}>
                                    {values[key].map((s) => (
                                        <Box key={s._id} sx={{p: 1, borderBottom: "1px solid #ccc", display: "flex", flexDirection: "row", justifyContent: "space-between"}}>
                                            <Typography variant="h6">{s.name}</Typography>
                                            <DeleteIcon sx={{cursor: "pointer"}} color="action" onClick={() => {
                                                setOpen(true);
                                                setId({type: key, id: s._id});
                                            }} />
                                        </Box>
                                    ))}
                                </Box>
                            </Box>
                        </Grid2>
                    )}
                </Grid2>
                <DeleteModal open={open} setOpen={setOpen} id={id} setId={setId} values={values} setValues={setValues} />
            </Container>
            <Footer />
        </Box>
    )
}


const DeleteModal = ({open, setOpen, id, setId, values, setValues}) => {
    let style= {
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
                <Typography variant="h6">Delete Item</Typography>
                <Typography>Are you sure you want to delete this item?</Typography>
                <Box sx={{ mt: 2 }}>
                    <Button variant="contained" color="primary" onClick={async () => {
                        // Handle delete action
                        console.log("Deleting", id)
                        let res = await axios.delete(`/api/admin/oneoffs?id=${id.id}&type=${id.type}`)
                        if (res.status === 200) {
                            // Handle successful deletion
                            let vals = { ...values }
                            vals[id.type] = res.data[id.type]
                            setValues({ ...vals })
                            setOpen(false);
                            setId(null);
                        }
                    }}>Delete</Button>
                    <Button variant="outlined" color="secondary" onClick={() => setOpen(false)}>Cancel</Button>
                </Box>
            </Box>
        </Modal>
    );
}

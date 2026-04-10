"use client";
import {Box, Card, Grid2, Typography, TextField, Modal, Button} from "@mui/material";
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import CreatableSelect from "react-select/creatable";
import {useState, useEffect} from "react";
import axios from "axios";
export function Main({colors}){
    const [cols, setColors] = useState(colors)
    const [open, setOpen] = useState(false)
    const [color, setColor] = useState(null)
    const updateColor = async (color)=>{
        console.log(color)
        let res = await axios.put("/api/admin/colors", {color})
        if(res.data.error) alert(res.data.msg)
        else setColors(res.data.colors)
    }
    return (
        <Box sx={{padding: "2%"}}>
            <Grid2 container spacing={2}>
                {cols.sort((a,b)=>{
                    if(a.name > b.name) return 1
                    if(a.name < b.name) return -1
                    else return 0
                }).map(c=>(
                    <Grid2 size={4} key={c._id}>
                        <Box sx={{background: c.hexcode, padding: "3%", minHeight: "200px", border: "1px solid black", borderRadius: "10px", boxShadow: "1px 1px 1px #e2e2e2"}}>
                            <Typography sx={{textAlign: "center", fontSize: "1.5rem", color: c.color_type == "dark"? "#fff": "#000",}}>{c.name}</Typography>
                            <Box sx={{margin: "1%", padding: "1%"}}>
                                <TextField label="name" fullWidth sx={{background: "#fff"}} value={c.name} onChange={()=>{
                                    let col = {...c}
                                    col.name = event.target.value
                                    updateColor({...col})
                                }}/>
                            </Box>
                            <Box sx={{margin: "1%", padding: "1%"}}>
                                <CreatableSelect
                                    placeholder="Color Type"
                                    options={[
                                        {label: "Dark", value: "dark"},
                                        {label: "Light", value: "light"}
                                    ]}
                                    onChange={(val)=>{
                                        let col = {...c}
                                        col.color_type = val.value
                                        updateColor({...col})
                                    }}
                                    value={{label: c.color_type == "light"? "Light": "Dark", value: c.color_type}}
                                />
                            </Box>
                            <Box sx={{margin: "1%", padding: "1%"}}>
                                <CreatableSelect
                                    placeholder="Color Family"
                                    options={[
                                        {label: "Black", value: "black"},
                                        {label: "Red", value: "red"},
                                        {label: "Yellow", value: "yellow"},
                                        {label: "Blue", value: "blue"},
                                        {label: "Green", value: "green"},
                                        {label: "Orange", value: "orange"},
                                        {label: "Purple", value: "purple"},
                                        {label: "Pink", value: "pink"},
                                        {label: "White", value: "white"},
                                    ]}
                                    onChange={(val)=>{
                                        let col = {...c}
                                        col.colorFamily = val.value
                                        updateColor({...col})
                                    }}
                                    value={c.colorFamily? {label: c.colorFamily, value: c.colorFamily}: null}
                                />
                            </Box>
                            {<Box sx={{display: "flex", flexDirection: "row", justifyContent: "flex-end"}}>
                                    <DeleteForeverIcon sx={{color: "red", cursor: "pointer"}} onClick={async ()=>{
                                            setColor(c)
                                            setOpen(true)
                                       
                                    }} />
                            </Box>}
                        </Box>
                    </Grid2>
                ))}
            </Grid2>
            <DeleteModal open={open} setOpen={setOpen} color={color} setColors={setColors} />
        </Box>
    )
}


export function DeleteModal({ open, setOpen, color, setColors }) {
    const handleDelete = async () => {
        let res = await axios.delete(`/api/admin/colors?id=${color._id}`).catch(e => {
            console.log(e.response.data)
        });
        setColors(res.data.colors)
        setOpen(false)
    };
    return (
        <Modal open={open} onClose={() => setOpen(false)} aria-labelledby="modal-modal-title" aria-describedby="modal-modal-description">
            <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 400, bgcolor: 'background.paper', border: '2px solid #000', boxShadow: 24, p: 4, }}>
                <Typography id="modal-modal-title" variant="h6" component="h2">Delete Color</Typography>
                <Typography id="modal-modal-description" sx={{ mt: 2 }}>Are you sure you want to delete {color.name}?</Typography>
                <Box sx={{ display: "flex", justifyContent: "flex-end", marginTop: 3 }}>
                    <Button variant="contained" color="error" onClick={handleDelete} sx={{ marginRight: 2 }}>Delete</Button>
                    <Button variant="outlined" onClick={() => setOpen(false)}>Cancel</Button>
                </Box>
            </Box>
        </Modal>
    )
}
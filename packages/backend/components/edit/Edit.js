"use client";
import {Box, Container, TextField, Grid2, Typography} from "@mui/material";
import {useState} from "react";
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
export function Edit({data}) {
    const [values, setValues] = useState(data);
    const [printTypes, setPrintTypes] = useState(data.printTypes);
    const [add, setAdd] = useState({});
    const save = async ({type, value}) =>{
        await axios.post("/api/admin/")
    }
    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Grid2 container spacing={2}>
                {data && Object.keys(data).map(key=>
                    <Grid2 size={{xs: 12, sm: 6}}>
                        <Box sx={{background: "#fff", padding: "2%", borderRadius: 2}}>
                            <Box sx={{display: "flex", flexDirection: "row", alignItems: "center"}}>
                                <TextField label={key} fullWidth value={add[key]? add[key]: ""} onChange={(e) => setAdd({...add, [key]: e.target.value})} onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        let val = values
                                        val[key] = [...val[key], {name: add[key]}]
                                        setValues({...val});
                                        setAdd({ ...add, [key]: "" });
                                    }
                                }} />
                                <AddIcon sx={{cursor: "pointer", position: "relative", right: 30, marginRight: "-30px"}} onClick={() => {
                                    let val = values
                                    val[key] = [...val[key], { name: add[key] }]
                                    setValues({ ...val });
                                    setAdd({ ...add, [key]: "" });
                                }} />
                            </Box>
                            <Box sx={{border: "1px solid #ccc", borderRadius: 1, padding: 2, minHeight: 300, maxHeight: 300, overflowY: "auto", mt: 1}}>
                                {values[key].map((s) => (
                                    <Box key={s._id} sx={{p: 1, borderBottom: "1px solid #ccc", display: "flex", flexDirection: "row", justifyContent: "space-between"}}>
                                        <Typography variant="h6">{s.name}</Typography>
                                        <DeleteIcon color="action" onClick={() => {
                                            let val = values
                                            val[key] = val[key].filter((item) => item._id !== s._id)
                                            setValues({ ...val });
                                        }} />
                                    </Box>
                                ))}
                            </Box>
                        </Box>
                    </Grid2>
                )}
            </Grid2>
        </Container>
    )
}
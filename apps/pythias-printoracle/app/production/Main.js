"use client";
import {
    TextField,
    Container,
    Grid2,
    Button,
    InputAdornment,
    Box
  } from "@mui/material";
import { useState } from "react";
import axios from "axios";

export function Main({temp}){
    const [lightEditable, setLightEditable] = useState("")
    const [settings, setSettings] = useState(temp)
    let updateSettings = ({type, variable})=>{
        console.log(type, variable)
        let set = {...settings}
        set[type][variable]  = event.target.value
        setSettings({...set})
    }
    let submit = async ()=>{
        setLightEditable("")
        let updated = await axios.post("/api/production/treatment-settings", settings)
        console.log(updated.data)
        if(updated.data.error){
            alert(updated.data.msg)
        }else alert("updated!")
    }
    
    return (
        <Container maxWidth="lg">
            <h1 style={{textAlign: "center"}}>Welcome To Print Oracle</h1>
            <h6 style={{textAlign: "center"}}>Our Moto: Work Hard Play Hard</h6>
            
            <Grid2 container spacing={2} sx={{marginTop: "10%"}}>
                {settings && Object.keys(settings).map((s, i)=>(
                    <Grid2 size={4} key={i}>
                        {s !== "_id" && s !== "__v" && s !== "aStyles" && 
                            (<Box>
                                <h3 style={{textAlign: "center", padding: '1%'}}>{s.includes("press")? s.replace("press", "Press "): s.includes("printed")? s.replace("printed", "Printed "): `${s.charAt(0).toUpperCase()}${s.substring(1, s.length)}`} Temps</h3>
                                <TextField label=""
                                sx={{width: '100%', marginBottom: "2%" }}
                                value={settings[s].temp}
                                type="number"
                                onChange={()=>{updateSettings({type: s, variable:"temp"})}}
                                InputProps={{
                                    startAdornment: <InputAdornment position="start">Temp:</InputAdornment>,
                                    readOnly: lightEditable == s? false: true
                                }} /> 
                                <TextField label=""
                                    sx={{width: '100%',  marginBottom: "2%" }}
                                    value={settings[s].time}
                                    type="number"
                                    onChange={()=>{updateSettings({type: s, variable:"time"})}}
                                    InputProps={{
                                    startAdornment: <InputAdornment position="start">Time:</InputAdornment>,
                                    readOnly: lightEditable == s? false: true
                                }} /> 
                                {lightEditable == s? <Button variant="contained" sx={{width: "100%"}} onClick={()=> submit("light")}>Update</Button>:  <Button variant="contained" sx={{width: "100%"}} onClick={()=> setLightEditable(s)}>Edit</Button>}
                            </Box>)
                        }
                    </Grid2>
                ))}
            </Grid2>
        </Container>
    )
}
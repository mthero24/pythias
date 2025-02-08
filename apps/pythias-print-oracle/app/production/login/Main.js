"use client";
import {Box, TextField, Button, FormControl, InputLabel, OutlinedInput, Grid2, InputAdornment, IconButton, Card} from "@mui/material";
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import {useState} from "react"
import * as login from '../../../public/login.png';
import * as register from '../../../public/register.png';
import Image from "next/image";
import { signIn } from "next-auth/react";
import axios from "axios";

export const Main = ({type})=>{
    const [showPassword, setShowPassword] = useState(false)
    const [data, setData] = useState("")
    const handleClickShowPassword = () => setShowPassword((show) => !show);
    
    const handleMouseDownPassword = (event) => {
      event.preventDefault();
    };
  
    const handleMouseUpPassword = (event) => {
      event.preventDefault();
    };
    const handleLogin = async()=>{
        let username = `${data.split("-")[0].toLowerCase().replace(/;/g, "")}@teeshirtpalace.com`
        let password = data.split("-")[1].toLowerCase()
        let newpassword = ""
        for(let i = 0; i < password.length; i++){
            if(password[i] == ";") {
                newpassword = newpassword + password[i + 1].toUpperCase()
                i++
            }
            else if(password[i] != ";") newpassword = newpassword + password[i]

        }
        const response = await signIn("credentials", {
            userName: username,
            password: newpassword,
            redirect: false,
        });
        if (response.ok) {
            return location.replace("/production");
        }else{
            return alert(response.error);
        }
        
    }
    const updateData = (label)=>{
        setData(event.target.value)
    }
    return(
        <Box sx={{backgroundImage: `url(/2270.jpg)`, backgroundRepeat: "no-repeat", backgroundPosition: "center", backgroundSize: "cover", width: "100%", height: "100vh" }}>
        <Grid2 container spacing={2}>
            <Grid2 size={{xs: 0, sm:2, md: 3, lg: 4}}>

            </Grid2>
            <Grid2 size={{xs: 12, sm:8, md: 6, lg: 4}}>
                <Box sx={{display: "flex", flexDirection: "column", alignContent: "center", background: "#fff", marginTop: "4%"}}>
                    <Box>
                        <Image src={type== "register"? register: login} width={400} height={400} alt="login" style={{width: "100%", height: "auto", padding: "3%"}}/>
                        <Card sx={{padding: "10%"}}>      
                            <TextField label="Scan" fullWidth type="password"  value={data} sx={{ marginBottom: "2%"}}  onChange={()=>{updateData()}} onKeyDown={()=>{
                                if(event.key == 13 || event.key == "Enter" || event.key == "ENTER") handleLogin()
                            }} />
                        </Card>
                    </Box>
                </Box>
            </Grid2>
            <Grid2 size={{xs: 0, sm:2, md: 3, lg: 4}}>

            </Grid2>
        </Grid2>
    </Box>
    )
}
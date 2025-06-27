"use client";
import {Box, TextField, Button, FormControl, InputLabel, OutlinedInput, Grid2, InputAdornment, IconButton, Card} from "@mui/material";
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import {useState} from "react"
import * as login from '../../public/login.png';
import * as register from '../../public/register.png';
import Image from "next/image";
import { signIn } from "next-auth/react";
import axios from "axios";

export const Main = ({type})=>{
    const [showPassword, setShowPassword] = useState(false)
    const [data, setData] = useState({userName: "", password: "", email: "", firstName: "", lastName: ""})
    const handleClickShowPassword = () => setShowPassword((show) => !show);
    
    const handleMouseDownPassword = (event) => {
      event.preventDefault();
    };
  
    const handleMouseUpPassword = (event) => {
      event.preventDefault();
    };
    const handleLogin = async()=>{
        if(type == "register"){
            let result = await axios.post("/api/auth/register", { ...data });
            console.log(result, "response");
            if (result.data.success) {
              alert(`The Account For ${data.userName} Was Created`)
            }else{
                alert(`Something Went Wrong The Account For ${data.userName} Was Not Created Please Try Again!
                    ${result.data.error}`)
            }
            console.log(response);
        }else{
            const response = await signIn("credentials", {
                userName: data.userName,
                password: data.password,
                redirect: false,
            });
            if (response.ok) {
                return location.replace("/account");
            }else{
                return alert(response.error);
            }
        }
    }
    const updateData = (label)=>{
        let update = {...data}
        update[label] = event.target.value
        setData({...update})
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
                            <TextField fullWidth label="User Name" value={data.userName} sx={{marginBottom: "2%"}} onChange={()=>{updateData("userName")}} />
                            {type == "register" && (
                                <Box>
                                    <TextField label="First Name"  value={data.firstName} sx={{width: "49%", marginRight: "2%", marginBottom: "2%"}}  onChange={()=>{updateData("firstName")}} />
                                    <TextField label="last Name"  value={data.lastName} sx={{width: "49%", marginBottom: "2%"}}  onChange={()=>{updateData("lastName")}}/>
                                    <TextField fullWidth label="Email" value={data.email} sx={{marginBottom: "2%"}}  onChange={()=>{updateData("email")}}/>
                                </Box>
                            )}
                            <FormControl fullWidth sx={{ width: '100%', marginBottom: "2%" }} variant="outlined">
                                <InputLabel htmlFor="outlined-adornment-password">Password</InputLabel>
                                <OutlinedInput
                                    id="outlined-adornment-password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={data.password}
                                    onChange={()=>{updateData("password")}}
                                    onKeyDown={()=>{
                                        if(event.key == "Enter" || event.key == 13 || event.key == "ENTER" || event.key == "enter"){
                                            handleLogin()
                                        }
                                    }}
                                    endAdornment={
                                    <InputAdornment position="end">
                                        <IconButton
                                        aria-label={
                                            showPassword ? 'hide the password' : 'display the password'
                                        }
                                        onClick={handleClickShowPassword}
                                        onMouseDown={handleMouseDownPassword}
                                        onMouseUp={handleMouseUpPassword}
                                        edge="end"
                                        >
                                        {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                    }
                                    label="Password"
                                />
                            </FormControl> 
                            <Button fullWidth sx={{background: "#565660", color: "#fff"}} onClick={handleLogin}>{type}</Button>
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
"use client";

import {Box, Typography, Accordion, AccordionDetails, AccordionSummary, Container, Checkbox, FormGroup, FormControlLabel, Grid2, Button, Modal, OutlinedInput, InputAdornment, FormControl, InputLabel, IconButton, TextField, Divider} from "@mui/material";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import CloseIcon from '@mui/icons-material/Close';
import {useState} from "react"
import axios from "axios";

export function Main({user}){
    const [users, setUsers] = useState(user);
    const [del, setDelete] = useState(false)
    const [us, setUser] = useState(null)
    const [password, setPassword] = useState(false)
    const [create, setCreate] = useState(false)
    let updatePermissions = async ({type, user, permission})=>{
        let us = {...user};
        if(!us.permissions) us.permissions = {};
        us.permissions[type] = permission;
        let res=  await axios.put("/api/users", {user: us})
        if(res.data.error) alert(res.data.msg)
        else{
            console.log(res.data.users)
            setUsers(res.data.users)
        }
    }
    return(
        <Container maxWidth="xl">
            <Box sx={{padding: "2%"}}>
                <Box sx={{display: "flex", flexDirection: "row", justifyContent: "space-between", padding: "0% 2%"}}>
                    <Typography fontSize="2rem" fontWeight={"bold"}>Users</Typography>
                    <Button sx={{color: "#fff", background: "#0cc898", margin: ".5%"}} onClick={()=>{setCreate(true)}}>Create</Button>
                </Box>
                <Box sx={{padding: ".5%"}}>
                    {users.map(u=>(
                        <Accordion key={u._id} sx={{margin: "1%"}}>
                            <AccordionSummary
                                expandIcon={<ExpandMoreIcon />}
                                aria-controls="panel1-content"
                                id="panel1-header"
                            >
                                <Box s>
                                   <Typography component="span">{u.userName}</Typography> 
                                   <br/>
                                   <Typography component="span">{u.email}</Typography>
                                </Box>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Grid2 container spacing={2}>
                                    <Grid2 size={6}>
                                        <Typography textAlign={"center"}>Permissions</Typography>
                                    </Grid2>
                                    <Grid2 size={6}>
                                        
                                    </Grid2>
                                    <Grid2 size={1}>

                                    </Grid2>
                                    <Grid2 size={2}>
                                        <FormGroup>
                                            <FormControlLabel  control={<Checkbox checked={u.permissions?.charts? u.permissions?.charts: false} onChange={()=>{
                                                updatePermissions({type: "charts", user: u, permission: event.target.checked})
                                            }}/>} label="Charts" />
                                            <FormControlLabel  control={<Checkbox checked={u.permissions?.register? u.permissions?.register: false} onChange={()=>{
                                                updatePermissions({type: "register", user: u, permission: event.target.checked})
                                            }}/>} label="Register" />
                                            <FormControlLabel  control={<Checkbox checked={u.permissions?.licenses? u.permissions?.licenses: false} onChange={()=>{
                                                updatePermissions({type: "licenses", user: u, permission: event.target.checked})
                                            }}/>} label="Licenses" />
                                            <FormControlLabel  control={<Checkbox checked={u.permissions?.inventory? u.permissions?.inventory: false} onChange={()=>{
                                                updatePermissions({type: "inventory", user: u, permission: event.target.checked})
                                            }}/>} label="Inventory" />
                                             <FormControlLabel  control={<Checkbox checked={u.permissions?.colors? u.permissions?.colors: false} onChange={()=>{
                                                updatePermissions({type: "colors", user: u, permission: event.target.checked})
                                            }}/>} label="Colors" />
                                        </FormGroup>
                                    </Grid2>
                                     <Grid2 size={2}>
                                         <FormGroup>
                                            <FormControlLabel  control={<Checkbox checked={u.permissions?.blanks? u.permissions?.blanks: false} onChange={()=>{
                                                updatePermissions({type: "blanks", user: u, permission: event.target.checked})
                                            }}/>} label="Blanks" />
                                            <FormControlLabel  control={<Checkbox checked={u.permissions?.designs? u.permissions?.designs: false} onChange={()=>{
                                                updatePermissions({type: "designs", user: u, permission: event.target.checked})
                                            }}/>} label="Designs" />
                                            <FormControlLabel  control={<Checkbox checked={u.permissions?.products? u.permissions?.products: false} onChange={()=>{
                                                updatePermissions({type: "products", user: u, permission: event.target.checked})
                                            }}/>} label="Products" />
                                            <FormControlLabel  control={<Checkbox checked={u.permissions?.users? u.permissions?.users: false} onChange={()=>{
                                                updatePermissions({type: "users", user: u, permission: event.target.checked})
                                            }}/>} label="Users" />
                                        </FormGroup>
                                    </Grid2>
                                    <Grid2 size={2}>
                                         <FormGroup>
                                            <FormControlLabel  control={<Checkbox checked={u.permissions?.upc? u.permissions?.upc: false} onChange={()=>{
                                                updatePermissions({type: "upc", user: u, permission: event.target.checked})
                                            }}/>} label="Fix Upc" />
                                            <FormControlLabel  control={<Checkbox checked={u.permissions?.orders? u.permissions?.orders: false} onChange={()=>{
                                                updatePermissions({type: "orders", user: u, permission: event.target.checked})
                                            }}/>} label="Orders" />
                                            <FormControlLabel  control={<Checkbox checked={u.permissions?.production? u.permissions?.production: false} onChange={()=>{
                                                updatePermissions({type: "production", user: u, permission: event.target.checked})
                                            }}/>} label="Production" />
                                            <FormControlLabel  control={<Checkbox checked={u.permissions?.integrations? u.permissions?.integrations: false} onChange={()=>{
                                                updatePermissions({type: "integrations", user: u, permission: event.target.checked})
                                            }}/>} label="Integrations" />
                                        </FormGroup>
                                    </Grid2>
                                    <Grid2 size={1}>

                                    </Grid2>
                                     <Grid2 size={4}>
                                        <Button sx={{background: "#17c79a", color: "#fff", padding: "2%", margin: ".5%"}} onClick={()=>{
                                            setUser(u)
                                            setPassword(true)
                                        }} >Reset Password</Button>
                                        <Button sx={{background: "#fc7470", color: "#fff", padding: "2%", margin: ".5%"}} onClick={()=>{
                                            setUser(u)
                                            setDelete(true)
                                        }}>Delete User</Button>
                                    </Grid2>
                                </Grid2>
                            </AccordionDetails>
                        </Accordion>
                    ))}
                </Box>
            </Box>
            <DeleteModal open={del} setOpen={setDelete} user={us} setUsers={setUsers}/>
            <ResetModal open={password} setOpen={setPassword} user={us} setUsers={setUsers} />
            <CreateModal open={create} setOpen={setCreate} setUsers={setUsers} />
        </Container>
    )
}

const DeleteModal = ({open, setOpen, setUsers, user})=>{
    const style = {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: "40%",
        bgcolor: 'background.paper',
        border: '2px solid #000',
        boxShadow: 24,
        p: 4,
    };
    let del = async ()=>{
        let res = await axios.delete(`/api/users?user=${user._id}`)
        if(res.data.error) alert(res.data.msg)
        else{
            setUsers(res.data.users)
            setOpen(false)
        }
    }
    return (
        <Modal
        open={open}
        onClose={()=>{setOpen(false)}}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
            <Box sx={{display: "flex", flexDirection: "row", justifyContent: "flex-end", "&:hover": {cursor: "pointer", opacity: 0.7},}}>
                <CloseIcon sx={{color: "#d2d2e2"}} onClick={()=>{setOpen(false)}}/>
            </Box>
            <Typography id="modal-modal-title" variant="h6" component="h2" textAlign={"center"}>
                Are You Sure You Want to Delete {user?.userName}?
            </Typography>
            <Button fullWidth sx={{color: "#fff", background: "#fc7470", margin: ".5%"}} onClick={del}>Delete</Button>
        </Box>
      </Modal>
    )
}
const ResetModal = ({open, setOpen, setUsers, user})=>{
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const style = {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: "40%",
        bgcolor: 'background.paper',
        border: '2px solid #000',
        boxShadow: 24,
        p: 4,
    };
    const handleClickShowPassword = () => setShowPassword((show) => !show);
    
    const handleMouseDownPassword = (event) => {
      event.preventDefault();
    };
  
    const handleMouseUpPassword = (event) => {
      event.preventDefault();
    };
    let reset = async ()=>{
        let res = await axios.post(`/api/users`, {user, password})
        if(res.data.error) alert(res.data.msg)
        else{
            setPassword("")
            setShowPassword(false)
            setUsers(res.data.users)
            setOpen(false)
        }
    }
    return (
        <Modal
        open={open}
        onClose={()=>{setOpen(false)}}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
            <Box sx={{display: "flex", flexDirection: "row", justifyContent: "flex-end", "&:hover": {cursor: "pointer", opacity: 0.7},}}>
                <CloseIcon sx={{color: "#d2d2e2"}} onClick={()=>{setOpen(false)}}/>
            </Box>
            <Typography id="modal-modal-title" variant="h6" component="h2" textAlign={"center"}>
                Reset Password for {user?.userName} 
            </Typography>
            <FormControl fullWidth sx={{ width: '100%', marginBottom: "2%" }} variant="outlined">
                <InputLabel htmlFor="outlined-adornment-password">Password</InputLabel>
                <OutlinedInput
                    id="outlined-adornment-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={()=>{setPassword(event.target.value)}}
                    onKeyDown={()=>{
                        if(event.key == "Enter" || event.key == 13 || event.key == "ENTER" || event.key == "enter"){
                            reset()
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
                        {showPassword ? <Visibility />: <VisibilityOff /> }
                        </IconButton>
                    </InputAdornment>
                    }
                    label="Password"
                />
            </FormControl> 
            <Button fullWidth sx={{color: "#fff", background: "#0cc898", margin: ".5%"}} onClick={reset}>Reset</Button>
        </Box>
      </Modal>
    )
}
const CreateModal = ({open, setOpen, setUsers,})=>{
    const style = {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: "40%",
        bgcolor: 'background.paper',
        border: '2px solid #000',
        boxShadow: 24,
        p: 4,
    };
    const [showPassword, setShowPassword] = useState(false)
    const [data, setData] = useState({userName: "", password: "", email: "", firstName: "", lastName: "", permissions: {}})
    const handleClickShowPassword = () => setShowPassword((show) => !show);
    
    const handleMouseDownPassword = (event) => {
      event.preventDefault();
    };
  
    const handleMouseUpPassword = (event) => {
      event.preventDefault();
    };
    const handleLogin = async()=>{
        let result = await axios.post("/api/auth/register", { ...data });
        console.log(result, "response");
        if (result.data.success) {
            setOpen(false)
            setData({userName: "", password: "", email: "", firstName: "", lastName: "", permissions: {}})
            setShowPassword(false)
            setUsers(result.data.users)
        }else{
            alert(`Something Went Wrong The Account For ${data.userName} Was Not Created Please Try Again!
                ${result.data.error}`)
        }
        console.log(response);
    }
    const updateData = (label)=>{
        let update = {...data}
        update[label] = event.target.value
        setData({...update})
    }
    const updatePermissions = ({type, permission})=>{
        let d = {...data}
        d.permissions[type] = permission
        setData({...d})
    }
    return (
        <Modal
        open={open}
        onClose={()=>{setOpen(false)}}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
            <Box sx={{display: "flex", flexDirection: "row", justifyContent: "flex-end", "&:hover": {cursor: "pointer", opacity: 0.7},}}>
                <CloseIcon sx={{color: "#d2d2e2"}} onClick={()=>{setOpen(false)}}/>
            </Box>
            <Typography id="modal-modal-title" variant="h6" component="h2" textAlign={"center"}>
                Create User
            </Typography>
            <Divider/>
            <Grid2 container spacing={2}>
                <Grid2 size={12}>
                    <Typography textAlign={"center"}>Permissions</Typography>
                </Grid2>
                <Grid2 size={1}></Grid2>
                <Grid2 size={3}>
                    <FormGroup>
                        <FormControlLabel  control={<Checkbox checked={data.permissions?.charts? data.permissions?.charts: false} onChange={()=>{
                            updatePermissions({type: "charts", permission: event.target.checked})
                        }}/>} label="Charts" />
                        <FormControlLabel  control={<Checkbox checked={data.permissions?.register? data.permissions?.register: false} onChange={()=>{
                            updatePermissions({type: "register", permission: event.target.checked})
                        }}/>} label="Register" />
                        <FormControlLabel  control={<Checkbox checked={data.permissions?.licenses? data.permissions?.licenses: false} onChange={()=>{
                            updatePermissions({type: "licenses", permission: event.target.checked})
                        }}/>} label="Licenses" />
                        <FormControlLabel  control={<Checkbox checked={data.permissions?.inventory? data.permissions?.inventory: false} onChange={()=>{
                            updatePermissions({type: "inventory", permission: event.target.checked})
                        }}/>} label="Inventory" />
                        <FormControlLabel  control={<Checkbox checked={data.permissions?.colors? data.permissions?.colors: false} onChange={()=>{
                            updatePermissions({type: "colors", permission: event.target.checked})
                        }}/>} label="Colors" />
                    </FormGroup>
                </Grid2>
                    <Grid2 size={3}>
                        <FormGroup>
                        <FormControlLabel  control={<Checkbox checked={data.permissions?.blanks? data.permissions?.blanks: false} onChange={()=>{
                            updatePermissions({type: "blanks", permission: event.target.checked})
                        }}/>} label="Blanks" />
                        <FormControlLabel  control={<Checkbox checked={data.permissions?.designs? data.permissions?.designs: false} onChange={()=>{
                            updatePermissions({type: "designs", permission: event.target.checked})
                        }}/>} label="Designs" />
                        <FormControlLabel  control={<Checkbox checked={data.permissions?.products? data.permissions?.products: false} onChange={()=>{
                            updatePermissions({type: "products", permission: event.target.checked})
                        }}/>} label="Products" />
                        <FormControlLabel  control={<Checkbox checked={data.permissions?.users? data.permissions?.users: false} onChange={()=>{
                            updatePermissions({type: "users", permission: event.target.checked})
                        }}/>} label="Users" />
                    </FormGroup>
                </Grid2>
                <Grid2 size={3}>
                        <FormGroup>
                        <FormControlLabel  control={<Checkbox checked={data.permissions?.upc? data.permissions?.upc: false} onChange={()=>{
                            updatePermissions({type: "upc", permission: event.target.checked})
                        }}/>} label="Fix Upc" />
                        <FormControlLabel  control={<Checkbox checked={data.permissions?.orders? data.permissions?.orders: false} onChange={()=>{
                            updatePermissions({type: "orders", permission: event.target.checked})
                        }}/>} label="Orders" />
                        <FormControlLabel  control={<Checkbox checked={data.permissions?.production? data.permissions?.production: false} onChange={()=>{
                            updatePermissions({type: "production", permission: event.target.checked})
                        }}/>} label="Production" />
                        <FormControlLabel  control={<Checkbox checked={data.permissions?.integrations? data.permissions?.integrations: false} onChange={()=>{
                            updatePermissions({type: "integrations", permission: event.target.checked})
                        }}/>} label="Integrations" />
                    </FormGroup>
                </Grid2>
                <Grid2 size={1}>

                </Grid2>
            </Grid2>
            <TextField fullWidth label="User Name" value={data.userName} sx={{marginBottom: "2%"}} onChange={()=>{updateData("userName")}} />
            <Box>
                <TextField label="First Name"  value={data.firstName} sx={{width: "49%", marginRight: "2%", marginBottom: "2%"}}  onChange={()=>{updateData("firstName")}} />
                <TextField label="last Name"  value={data.lastName} sx={{width: "49%", marginBottom: "2%"}}  onChange={()=>{updateData("lastName")}}/>
                <TextField fullWidth label="Email" value={data.email} sx={{marginBottom: "2%"}}  onChange={()=>{updateData("email")}}/>
            </Box>
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
                        {showPassword ? <Visibility /> : <VisibilityOff /> }
                        </IconButton>
                    </InputAdornment>
                    }
                    label="Password"
                />
            </FormControl> 
            <Button fullWidth sx={{background: "#565660", color: "#fff"}} onClick={handleLogin}>Create</Button>
        </Box>
      </Modal>
    )
}
import {Typography, Card, TextField, Grid2, Button, Alert} from "@mui/material";
import {useState, useEffect} from "react"
import CheckIcon from '@mui/icons-material/Check';
import axios from "axios"
export function Address({order, style, setBins}){
    const [address, setAddress] = useState(order.shippingAddress)
    const [showAlert, setShowAlert] = useState(false)
    useEffect(()=>{
        console.log(order.shippingAddress, "address")
        if(order) setAddress(order.shippingAddress)
    }, [order])
    const updateAddress = async ()=>{
        let res = await axios.post("/api/production/shipping/address", {id: order._id, shippingAddress: address})
        if(res.data.error) alert(res.data.msg)
        else {
            setShowAlert(true)
            await new Promise((resolve)=>{
                setTimeout(()=>{
                    resolve()
                },4000)
            })
            setShowAlert(false)
        }

    } 
    const checkAddress = async ()=>{
        let res = await axios.post("/api/production/shipping/check-address", {address})
        if(res.data.error) alert(res.data.msg)
            else {
                setShowAlert(true)
                await new Promise((resolve)=>{
                    setTimeout(()=>{
                        resolve()
                    },4000)
                })
                setShowAlert(false)
            }
    } 
    const onChange = (label)=>{
        let add = {...address}
        add[label] = event.target.value
        setAddress({...add})
    }
    return(
        <Grid2 size={{ xs: 12, sm: 12,md:6 }}>
            <Card sx={{padding: "1%", margin: "1%", height: style.height * 0.41, overflow: "auto"}}>
                <Grid2 size={{xs: 12, sm: 12}}>
                <Typography fontSize="1.1rem" fontWeight={600} textAlign="center">Shipping Address</Typography>
                </Grid2>
                <Grid2 container spacing={2}>
                    <Grid2 size={{xs: 12, sm: 6}}>
                        <TextField label="Customer Name" fullWidth value={address?.name} onChange={()=>{onChange("name")}}/>
                    </Grid2>
                    <Grid2 size={{xs: 12, sm: 6}}>
                        <TextField label="Customer Phone Number" fullWidth  value={address?.phoneNumber} onChange={()=>{onChange("phoneNumber")}} />
                    </Grid2>
                    <Grid2 size={{xs: 12, sm:8, md: 8}}>
                        <TextField label="Address Line 1" fullWidth value={address?.address1} onChange={()=>{onChange("address1")}} />
                    </Grid2>
                    <Grid2 size={{xs: 6, sm: 4, md: 4}}>
                        <TextField label="Address Line 2" fullWidth value={address?.address2} onChange={()=>{onChange("address2")}} />
                    </Grid2>
                    <Grid2 size={{xs: 6, sm: 3, md: 3}}>
                        <TextField label="City" value={address?.city} onChange={()=>{onChange("city")}} />
                    </Grid2>
                    <Grid2 size={{xs: 4, sm: 3, md: 3}}>
                        <TextField label="State/Region" value={address?.state} onChange={()=>{onChange("state")}} />
                    </Grid2>
                    <Grid2 size={{xs: 4, sm: 3, md: 3}}>
                        <TextField label="Postal Code" value={address?.zip} onChange={()=>{onChange("zip")}} />
                    </Grid2>
                    <Grid2 size={{xs: 4, sm: 3, md: 3}}>
                        <TextField label="Country" value={address?.country} onChange={()=>{onChange("country")}} />
                    </Grid2>
                    <Grid2 size={{xs: 12, md: 12}}>
                        <Button fullWidth sx={{background: "#0079DC", color: "#ffffff"}} onClick={updateAddress}>Update</Button>
                    </Grid2>
                    
                    {showAlert && 
                        <Grid2 size={{xs: 12, md: 12}}>
                            <Alert sx={{width: "100%"}} icon={<CheckIcon fontSize="inherit" />} severity="success">
                                Address Updated
                            </Alert>
                        </Grid2>
                    }
                </Grid2>
            </Card>
        </Grid2>
    )
}
import {Typography, Card, TextField, Grid2, Button} from "@mui/material";
import Image from "next/image"
import { createImage } from "../../functions/image";
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';

export function Address({order, style}){
    return(
        <Grid2 size={{ xs: 12, sm: 12,md:6 }}>
            <Card sx={{padding: "1%", margin: "1%", height: style.height * 0.41, overflow: "auto"}}>
                <Grid2 size={{xs: 12, sm: 12}}>
                <Typography fontSize="1.4rem" fontWeight={600} textAlign="center">Shipping Address</Typography>
                </Grid2>
                <Grid2 container spacing={2}>
                <Grid2 size={{xs: 12, sm: 6}}>
                    <TextField label="Customer Name" fullWidth value={order.shippingAddress.name} />
                </Grid2>
                <Grid2 size={{xs: 12, sm: 6}}>
                    <TextField label="Customer Phone Number" fullWidth  value={order.shippingAddress.phoneNumber} />
                </Grid2>
                <Grid2 size={{xs: 12, md: 8}}>
                    <TextField label="Address Line 1" fullWidth value={order.shippingAddress.address1} />
                </Grid2>
                <Grid2 size={{xs: 6, md: 4}}>
                    <TextField label="Address Line 2" fullWidth value={order.shippingAddress.address2} />
                </Grid2>
                <Grid2 size={{xs: 6, md: 3}}>
                    <TextField label="City" value={order.shippingAddress.city} />
                </Grid2>
                <Grid2 size={{xs: 4, md: 3}}>
                    <TextField label="State/Region" value={order.shippingAddress.state} />
                </Grid2>
                <Grid2 size={{xs: 4, md: 3}}>
                    <TextField label="Postal Code" value={order.shippingAddress.zip} />
                </Grid2>
                <Grid2 size={{xs: 4, md: 3}}>
                    <TextField label="Country" value={order.shippingAddress.country} />
                </Grid2>
                <Grid2 size={{xs: 12, md: 12}}>
                    <Button fullWidth sx={{background: "#0079DC", color: "#ffffff"}}>Update</Button>
                </Grid2>
                </Grid2>
            </Card>
        </Grid2>
    )
}
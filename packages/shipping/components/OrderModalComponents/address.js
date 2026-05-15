"use client";
import { Typography, Card, TextField, Grid2, Button, Alert, Box } from "@mui/material";
import { useState, useEffect } from "react";
import CheckIcon from "@mui/icons-material/Check";
import axios from "axios";

export function Address({ order }) {
    const [address, setAddress]     = useState(order.shippingAddress);
    const [showAlert, setShowAlert] = useState(false);

    useEffect(() => {
        if (order) setAddress(order.shippingAddress);
    }, [order]);

    const onChange = (field, value) => {
        setAddress(prev => ({ ...prev, [field]: value }));
    };

    const updateAddress = async () => {
        const res = await axios.post("/api/production/shipping/address", { id: order._id, shippingAddress: address });
        if (res.data.error) alert(res.data.msg);
        else {
            setShowAlert(true);
            await new Promise(resolve => setTimeout(resolve, 4000));
            setShowAlert(false);
        }
    };

    const checkAddress = async () => {
        const res = await axios.post("/api/production/shipping/check-address", { address });
        if (res.data.error) alert(res.data.msg);
        else {
            setShowAlert(true);
            await new Promise(resolve => setTimeout(resolve, 4000));
            setShowAlert(false);
        }
    };

    return (
        <Card variant="outlined" sx={{ flex: 1, borderRadius: 2, overflow: "hidden" }}>
            <Box sx={{ px: 2, py: 1.25, borderBottom: "1px solid", borderColor: "divider" }}>
                <Typography variant="subtitle1" fontWeight={700}>Shipping Address</Typography>
            </Box>
            <Box sx={{ p: 2 }}>
                <Grid2 container spacing={1.5}>
                    <Grid2 size={{ xs: 12, sm: 6 }}>
                        <TextField size="small" label="Name" fullWidth value={address?.name ?? ""} onChange={(e) => onChange("name", e.target.value)} />
                    </Grid2>
                    <Grid2 size={{ xs: 12, sm: 6 }}>
                        <TextField size="small" label="Phone Number" fullWidth value={address?.phoneNumber ?? ""} onChange={(e) => onChange("phoneNumber", e.target.value)} />
                    </Grid2>
                    <Grid2 size={{ xs: 12, sm: 8 }}>
                        <TextField size="small" label="Address Line 1" fullWidth value={address?.address1 ?? ""} onChange={(e) => onChange("address1", e.target.value)} />
                    </Grid2>
                    <Grid2 size={{ xs: 12, sm: 4 }}>
                        <TextField size="small" label="Address Line 2" fullWidth value={address?.address2 ?? ""} onChange={(e) => onChange("address2", e.target.value)} />
                    </Grid2>
                    <Grid2 size={{ xs: 6, sm: 3 }}>
                        <TextField size="small" label="City" fullWidth value={address?.city ?? ""} onChange={(e) => onChange("city", e.target.value)} />
                    </Grid2>
                    <Grid2 size={{ xs: 4, sm: 3 }}>
                        <TextField size="small" label="State" fullWidth value={address?.state ?? ""} onChange={(e) => onChange("state", e.target.value)} />
                    </Grid2>
                    <Grid2 size={{ xs: 4, sm: 3 }}>
                        <TextField size="small" label="Postal Code" fullWidth value={address?.zip ?? ""} onChange={(e) => onChange("zip", e.target.value)} />
                    </Grid2>
                    <Grid2 size={{ xs: 4, sm: 3 }}>
                        <TextField size="small" label="Country" fullWidth value={address?.country ?? ""} onChange={(e) => onChange("country", e.target.value)} />
                    </Grid2>
                    <Grid2 size={{ xs: 6 }}>
                        <Button fullWidth variant="outlined" onClick={checkAddress}>Verify Address</Button>
                    </Grid2>
                    <Grid2 size={{ xs: 6 }}>
                        <Button fullWidth variant="contained" onClick={updateAddress}>Save</Button>
                    </Grid2>
                    {showAlert && (
                        <Grid2 size={12}>
                            <Alert icon={<CheckIcon fontSize="inherit" />} severity="success">Address updated</Alert>
                        </Grid2>
                    )}
                </Grid2>
            </Box>
        </Card>
    );
}

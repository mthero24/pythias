"use client";
import {Box, Typography, TextField, Container } from "@mui/material";
import {useState} from "react";
import axios from "axios";
export function PricingMain({printTypes}) {
    const [types, setTypes] = useState(printTypes || {});
    const updatePrice = async (typeId, price) => {
        try {
            await axios.post('/api/admin/pricing', {
                typeId,
                price
            });
        } catch (error) {
            console.error("Error updating price:", error);
        }
    };
    return <Container>
        <Box sx={{p:2}}>
            <Typography variant="h5" gutterBottom>
                Pricing Configuration
            </Typography>
            {Object.keys(types).map((typeKey)=>{
                const type = types[typeKey];
                return <Box key={typeKey} sx={{mb:4, p:2, border: '1px solid #ccc', borderRadius: '8px'}}>
                    <Typography variant="h6" gutterBottom>
                        {type.name}
                    </Typography>
                    <TextField
                        label="Additional Price"
                        value={type.price}
                        onChange={(e) => {
                            setTypes({...types, [typeKey]: {...type, price: e.target.value}});
                            updatePrice(type._id, e.target.value);
                        }}
                        fullWidth
                    />
                </Box>;
            })}
        </Box>;
    </Container>
}
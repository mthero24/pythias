"use client";
import {Box, Typography, TextField} from "@mui/material";
import {useState}   from "react";

export function FromSanmarBlank() {
    return <Box sx={{display: "flex", flexDirection: "column", gap: 2}}>
        <Typography variant="h6">Sanmar Blank Details</Typography>
        <TextField label="Brand Name" name="brandName" />
    </Box>
}
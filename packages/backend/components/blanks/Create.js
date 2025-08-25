"use client";
import {
    Box,
    Button,
    Checkbox,
    Container,
    Grid2,
    Modal,
    TextField,
    Typography,
    Fab,
    IconButton,
    Card,
} from "@mui/material";
import React, { useEffect, useRef, useState } from "react";
import "cropperjs/dist/cropper.css";
import Select from "react-select";
import axios from "axios";
import CreatableSelect from "react-select/creatable";
import "jimp";
export function Create({ colors, blanks, bla, printPricing, locations }) {
    console.log(locations, "locations")
    const [imageGroups, setImageGroups] = useState([])
    const [blank, setBlank] = useState(bla? {...bla}: {});
    const [printLocations, setPrintLocations] = useState(locations)
    const [activeColors, setActiveColors] = useState(
        blank && blank.colors ? blank.colors : []
    );
   
    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ p: 2, mb: 2, alignContent: "center", backgroundColor: "#fff", borderRadius: 2, boxShadow: 3 }}>
                <Grid2 container spacing={2} sx={{width: "100%"}}>
                    <Grid2 size={{xs: 6, sm: 3}}>
                        <TextField label="Name" fullWidth value={blank.name ? blank.name : ""} onChange={(e) => setBlank({...blank, name: e.target.value, slug: e.target.value.trim().replace(/ /g, "-").toLowerCase()})}/>
                    </Grid2>
                    <Grid2 size={{xs: 6, sm: 3}}>
                        <TextField label="Code" fullWidth value={blank.code ? blank.code : ""} onChange={(e) => setBlank({ ...blank, code: e.target.value })} />
                    </Grid2>
                    <Grid2 size={{xs: 6, sm: 3}}>
                        <TextField label="Handling Time (days)" fullWidth value={blank.handlingTime ? blank.handlingTime : ""} onChange={(e) => setBlank({ ...blank, handlingTime: e.target.value })} />
                    </Grid2>
                    <Grid2 size={{ xs: 6, sm: 3 }}>
                        <TextField label="Slug" disabled fullWidth value={blank.slug ? blank.slug : ""} onChange={(e) => setBlank({ ...blank, slug: e.target.value })} />
                    </Grid2>
                    <Grid2 size={{ xs: 6, sm: 4 }}>
                        <CreatableSelect placeholder="Vendor..."/>
                    </Grid2>
                    <Grid2 size={{ xs: 6, sm: 4 }}>
                        <CreatableSelect placeholder="Department..." />
                    </Grid2>
                    <Grid2 size={{ xs: 6, sm: 4 }}>
                        <CreatableSelect placeholder="Category..." isMulti />
                    </Grid2>
                    <Grid2 size={{ xs: 6, sm: 4 }}>
                        <CreatableSelect placeholder="Brand..." />
                    </Grid2>
                    <Grid2 size={{ xs: 6, sm: 4 }}>
                        <CreatableSelect placeholder="Supplier..." isMulti />
                    </Grid2>
                    <Grid2 size={{ xs: 6, sm: 4 }}>
                        <CreatableSelect placeholder="Print Types..." isMulti />
                    </Grid2>
                </Grid2>
            </Box>
        </Container>
    )
}
"use client";
import {Card, Typography, Grid2, Box} from "@mui/material";
import {useState} from "react";
import {createImage} from "@pythias/dtf"
export function Main({labels}){
    const [useLabels, setLabels] = useState(labels)
    return (
        <Box sx={{
            display: "flex",
            flexDirection: "column",
            alignContent: "center",
            alignItems: "center",
            margin: ".1%",
            background: "#d2d2d2",
            padding: ".5%",
            minHeight: "100vh",
        }}>
            <Grid2 container spacing={1} sx={{width: "100%"}}>
                {Object.keys(useLabels).map(l=>(
                    <Grid2 size={{xs: 12, sm: 6, md: 6}} key={l}>
                        <Card sx={{width: "100%", padding: "1%"}}>
                            <Typography textAlign="center" fontSize='1.4rem' fontWeight={900}>{l.toUpperCase()}</Typography>
                            {useLabels[l].map(k=>(
                                <Card key={k._id}>
                                    <Grid2 container spacing={.3}>
                                        <Grid2 size={2}>
                                       
                                        </Grid2>
                                    </Grid2>
                                </Card>
                            ))}
                        </Card>
                    </Grid2>
                ))}
            </Grid2>
        </Box>
    )
}
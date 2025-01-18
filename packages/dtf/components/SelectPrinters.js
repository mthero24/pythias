"use client";
import {Grid2, Box, Typography, Card} from "@mui/material"
export function Printers({printers, printer, setPrinter}){
    return(
        <Box sx={{display: "flex", flexDirection: "row", justifyContent: "center", paddingTop: "1%", marginTop: "1%"}}>
            <Box sx={{width: "70%", height: {xs: "150px", md: "100px"}}}>
                <Grid2 container spacing={2}>
                    {printers && printers.map(p=>(
                        <Grid2 size={{md: 2, sm: 3, xs: 6}} key={p}>
                            <Card sx={{padding: "10%", background: printer == p? "#0079DC": "#FFF", color: printer == p? "#fff": "#000" }} onClick={()=>{setPrinter(p)}}>
                                <Typography textAlign="center" fontSize={"1.5rem"} textTransform={"capitalize"}>{p}</Typography>
                            </Card>
                        </Grid2>
                    ))}
                </Grid2>
            </Box>
        </Box>
    )
}
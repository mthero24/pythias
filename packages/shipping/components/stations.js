"use client";
import {Grid2, Box, Typography, Card} from "@mui/material"
export function Stations({stations, station, setStation}){
    return(
        <Box sx={{display: "flex", flexDirection: "row", justifyContent: "center", paddingTop: "1%", marginTop: "1%"}}>
            <Box sx={{width: "70%", height: {xs: "150px", md: "100px"}}}>
                <Grid2 container spacing={2}>
                    {stations && stations.map(s=>(
                        <Grid2 size={{md: 2, sm: 3, xs: 6}} key={s}>
                            <Card sx={{padding: "10%", background: station == s? "#0079DC": "#FFF", color: station == s? "#fff": "#000", cursor: "pointer" }} onClick={()=>{setStation(s)}}>
                                <Typography textAlign="center" fontSize={"1.5rem"} textTransform={"capitalize"}>{s}</Typography>
                            </Card>
                        </Grid2>
                    ))}
                </Grid2>
            </Box>
        </Box>
    )
}
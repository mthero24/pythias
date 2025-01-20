import {Box, Typography, Card, TextField, Grid2, Button} from "@mui/material";
import Image from "next/image"


export function Actions({bin, item, order, style}){
    console.log(style)
    return(
        <Grid2 size={{xs: 12}}>
            <Card sx={{height: `${style.height.xs *.4}px`, marginBottom: "1%"}}>
                
            </Card>
        </Grid2>
    )
}
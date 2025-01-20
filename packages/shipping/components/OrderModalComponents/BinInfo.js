import {Box, Typography, Card, TextField, Grid2, Button} from "@mui/material";
import Image from "next/image"
import { createImage } from "../../functions/image";
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';

export function BinInfo({bin}){
    return(
        <Grid2 size={{xs: 3}}>
            <Card sx={{padding: "5%", margin: "1%"}}>
                <Typography fontSize="1rem" textAlign="center" fontWeight={600}>Bin Number: {bin?.number}</Typography>
                <Box sx={{display: "flex", flexDirection: "row", justifyContent:"center"}}>
                    <Box sx={{padding: "2%"}}>
                        <Typography textAlign={"center"}>In Bin</Typography>
                        <Typography textAlign={"center"}>{bin?.items.length}</Typography>
                    </Box>
                    <Box sx={{padding: "2%"}}>
                        <Typography textAlign={"center"}>Remaining</Typography>
                        <Typography textAlign={"center"}>{bin?.order.items.filter(i=> !i.canceled && !i.shipped).length - bin?.items.length}</Typography>
                    </Box>
                </Box>
                <Button fullWidth>Clear</Button>
            </Card>
        </Grid2>
    )
}

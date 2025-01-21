import {Box, Typography, Card, Grid2, Button} from "@mui/material";
import axios from 'axios';
export function BinInfo({bin, close, setBins}){
    const Clear = async ()=>{
        let res = await axios.delete(`/api/production/shipping/bins?number=${bin.number}`)
        console.log(res)
        if(res.data.error) alert(res.data.msg)
        else {
            setBins(res.data.bins)
            close()
        }
    }
    return(
        <Grid2 size={{xs: 6, sm:3}}>
            <Card sx={{padding: "5%", margin: "1%"}}>
                <Typography fontSize="1rem" textAlign="center" fontWeight={600}>Bin Number: {bin?.number}</Typography>
                <Box sx={{display: "flex", flexDirection: "row", justifyContent:"center"}}>
                    <Box sx={{padding: "2%"}}>
                        <Typography textAlign={"center"} fontSize={".8rem"}>In Bin</Typography>
                        <Typography textAlign={"center"} fontSize={".8rem"}>{bin?.items.length}</Typography>
                    </Box>
                    <Box sx={{padding: "2%"}}>
                        <Typography textAlign={"center"} fontSize={".8rem"}>Remaining</Typography>
                        <Typography textAlign={"center"} fontSize={".8rem"}>{bin?.order.items.filter(i=> !i.canceled && !i.shipped).length - bin?.items.length}</Typography>
                    </Box>
                </Box>
                <Button onClick={Clear} fullWidth sx={{fontSize: ".7rem"}}>Clear</Button>
            </Card>
        </Grid2>
    )
}

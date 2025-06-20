import {Box, Grid2, Container, Typography, Divider} from "@mui/material";
import Image from "next/image"
import * as tiktok from "./tiktoksm.jpeg"
import * as etsy from "./etsy2.jpeg"
import * as amazon from "./amazon.png"
export function Main({}){
    return (
        <Container maxWidth={"lg"}>
            <Box sx={{padding: "3%"}}>
                <Grid2 container spacing={3}>
                    <Grid2 size={12}>
                        <Typography textAlign={"center"} fontSize={"1.4rem"}>Create New Connection</Typography>
                    </Grid2>
                    <Grid2 size={3}>
                        <Box sx={{padding: "4%", boxShadow: "1px 2px 1px #e2e2e2", "&:hover": {cursor: "pointer", boxShadow: "3px 4px 3px #e2e2e2", opacity: .8}}}>
                            <Image src={tiktok} alt={"tiktok"} width={600} height={600} style={{width: "100%", height: "auto"}}/>
                        </Box>
                    </Grid2>
                    <Grid2 size={3}>
                         <Box sx={{padding: "1%", boxShadow: "1px 2px 1px #e2e2e2", "&:hover": {cursor: "pointer", boxShadow: "3px 4px 3px #e2e2e2", opacity: .8}}}>
                            <Image src={etsy} alt={"etsy"} width={600} height={600} style={{width: "100%", height: "auto", background: "#fff"}}/>
                        </Box>
                    </Grid2>
                    <Grid2 size={3}>
                         <Box sx={{padding: "1%", boxShadow: "1px 2px 1px #e2e2e2", background: "#fff", "&:hover": {cursor: "pointer", boxShadow: "3px 4px 3px #e2e2e2", opacity: .8}}}>
                            <Image src={amazon} alt={"amazon"} width={600} height={600} style={{width: "100%", height: "auto"}}/>
                        </Box>
                    </Grid2>
                </Grid2>
            </Box>
            <Divider/>
            <Box sx={{padding: "3%"}}>
                    
            </Box>
        </Container>
    )
}
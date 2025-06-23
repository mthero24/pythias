"use client"
import {Box, Grid2, Container, Typography, Divider, Button} from "@mui/material";
import Image from "next/image"
import  tiktok from "./tiktoksm.jpeg"
import  etsy from "./etsy2.jpeg"
import  amazon from "./amazon.png"
import {TikTokModal} from "./TikTokModal";
import {useState} from "react";
export function Main({tiktokShops, provider}){
    let [tikTokOpen, setTikTokOpen] = useState(false)
    return (
        <Container maxWidth={"lg"}>
            <Box sx={{padding: "3%"}}>
                <Grid2 container spacing={3}>
                    <Grid2 size={12}>
                        <Typography textAlign={"center"} fontSize={"1.4rem"}>Create New Connection</Typography>
                    </Grid2>
                    <Grid2 size={3}>
                        <Box sx={{padding: "4%", boxShadow: "1px 2px 1px #e2e2e2", "&:hover": {cursor: "pointer", boxShadow: "3px 4px 3px #e2e2e2", opacity: .8}}} onClick={()=>{setTikTokOpen(true)}}>
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
            <TikTokModal open={tikTokOpen} setOpen={setTikTokOpen} provider={provider}/>
            <Divider/>
            <Box sx={{padding: "3%"}}>
                 <Typography textAlign={"center"} fontSize={"1.4rem"}>Connections</Typography>
                 {tiktokShops.map(tt=>(
                    <Box key={tt._id} sx={{background: "#fff", padding: "2%", borderRadius: "10px", margin: "1%", display: "flex", flexDirection: "row", justifyContent: "space-between"}}>
                        <Typography>Tik Tok - Seller Name: {tt.seller_name}</Typography>
                        <Box sx={{display: "flex", flexDirection: "row", justifyContent: "flex-start"}}>
                            <Button sx={{background: "#0066CC", color: "#fff"}}> {tt.access_token != undefined? "Reauthorize": "Authorize"}</Button>
                            <Button sx={{background: "red", color: "#fff"}}>Deactivate</Button>
                        </Box>
                    </Box>
                 ))}   
            </Box>
        </Container>
    )
}
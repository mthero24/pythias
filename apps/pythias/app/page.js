"use client";
import Image from "next/image";
import {Box, Typography} from "@mui/material"
import * as logo from "@/public/logo.png"
import ReactPlayer from 'react-player';
export default function Home() {
  return (
    <Box sx={{ background: "#e2e2e2", height: "100vh",}}>
      <Box sx={{background: "#000", display: "flex", flexDirection: "row", justifyContent: "space-between", padding: "1% 12%"}}>
        <Box sx={{width: "50%", padding: "3%"}}>
          <Image src={logo} alt="pythias technologies logo" width={700} height={700} style={{width: "60%", height: "auto"}} />
        </Box>
        <Box sx={{width: "50%", padding: "3% 1%", textAlign: "center", margin: "10% 1%", color: "#e2e2e2"}}>
          <Typography fontSize={{xs: ".8rem", sm: ".9rem", md: "1.4rem", fontFamily: "cursive"}}>Simplify Everything with One Platform.<br/> Automate, Scale, and Succeed.</Typography>
        </Box>
      </Box>
      <Box sx={{padding: "3%", background: "#e2e2e2"}}>
          <Typography color="#000000" textAlign="center" fontFamily="cursive" fontSize="2rem">Automate Your Garment Printing!<br/> DTG, DTf and Sublimation.</Typography>
          <Box sx={{display: "flex", flexDirection: "row", justifyContent: "flexStart", padding: "1%"}}>
            <Box sx={{width: "50%"}}>
              <ReactPlayer url={"https://www.youtube.com/watch?v=RhmkXc-YavU"} controls={true} style={{maxWidth: "100%"}} />
            </Box>
            <Box sx={{width: "50%", textAlign: "center", color: "#000000"}}>
                <Typography>Some Great text Here</Typography>
            </Box>
          </Box>
      </Box>
      <Box sx={{padding: "3%", background: "#fedd94"}}>
        <Typography color="#000000" textAlign="center" fontFamily="cursive" fontSize="2rem">Easily Manage Inventory!</Typography>
        <Box sx={{display: "flex", flexDirection: "row", justifyContent: "flexStart", padding: "1%"}}>
            <Box sx={{width: "50%", textAlign: "center", color: "#000000"}}>
                <Typography>Some Great text Here</Typography>
            </Box>
            <Box sx={{width: "50%"}}>
              <ReactPlayer url={"https://www.youtube.com/watch?v=Moumo_m5G_8"} controls={true} style={{maxWidth: "100%"}} />
            </Box>
          </Box>
      </Box>
      <Box sx={{padding: "3%", background: "#000000"}}>
        <Typography color="#fedd94" textAlign="center" fontFamily="cursive" fontSize="2rem">Make Shipping A Breeze!</Typography>
        <Box sx={{display: "flex", flexDirection: "row", justifyContent: "flexStart", padding: "1%"}}>
            <Box sx={{width: "50%"}}>
              <ReactPlayer url={"https://www.youtube.com/watch?v=Moumo_m5G_8"} controls={true} style={{maxWidth: "100%"}} />
            </Box>
            <Box sx={{width: "50%", textAlign: "center", color: "#fedd94"}}>
                <Typography>Some Great text Here</Typography>
            </Box>
          </Box>
      </Box>
    </Box>
     
  );
}

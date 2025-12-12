"use client"
import Image from "next/image";
import {Card, Typography, Container, Box} from "@mui/material";
import * as logo from "@/public/log.png";
import * as shopify from "@/public/Shopify_logo_2018.png";
import * as amazon from "@/public/amazon.png";
import * as walmart from "@/public/walmart.png";
import { theme, themeDark } from "@/components/UI/Theme";
import Link from "next/link"
import {Footer} from "@pythias/backend"
export function Main(){
    return (
    <Box sx={{background: "#e2e2e2", minHeight: "vh"}}>
    <Container maxWidth="lg" >
      <Card sx={{width: "100%", display: "flex", flexDirection: "row", justifyContent: "space-between", margin: "2% 0%",}}>
            <Box sx={{ padding: "4%", width: "55%", background: `#aaa0a0`, backgroundSize: 'cover',}}>
              <Image src={logo} alt="premier printing logo" width={300} height={300} style={{width: "100%", height: "auto"}} />
        </Box>
        <Box sx={{padding: "4%", width: "45%"}}>
          <Typography sx={{textAlign: "center", fontSize: "2rem", fontWeight: 600}}>Find Us On</Typography>
            <Box sx={{display: "flex", flexDirection: "column", alignItems: "center", alignContent: "center", padding: "1%"}}>
              
              <Box sx={{padding: "2%"}}>
                <Link href="https://printthreads.com/" target="_blank">
                  <Image src={shopify} alt="shopify logo" width={200} height={200} style={{width: "100%", height: "auto"}} />
                </Link>
              </Box>
              <Box sx={{padding: "2%"}}>
                <Link href="https://www.amazon.com/stores/SimplySageMarket/page/E2BCEA3C-F5F5-4C70-BFBB-B47E3901C7E8?ref_=ast_bln&store_ref=bl_ast_dp_brandLogo_sto" target="_blank">
                  <Image src={amazon} alt="amazon logo" width={200} height={200} style={{width: "100%", height: "auto"}} />
                </Link>
              </Box>
              <Box sx={{padding: "2%"}}>
                <Link href="https://www.walmart.com/search?q=simply+sage+market" target="_blank">
                  <Image src={walmart} alt="walmart logo" width={200} height={200} style={{width: "100%", height: "auto"}} />
                </Link>
              </Box>
           </Box>
        </Box>
      </Card>
    </Container>
    <Footer />
  </Box>
);
}
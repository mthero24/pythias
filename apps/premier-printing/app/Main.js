"use client"
import Image from "next/image";
import {Card, Typography, Container, Box} from "@mui/material";
import * as logo from "@/public/premierprinting-logo.png";
import * as target from "@/public/target-logo.png";
import * as tsc from "@/public/TSC-logo.jpeg";
import * as shopify from "@/public/Shopify_logo_2018.png";
import * as amazon from "@/public/amazon.png";
import * as faire from "@/public/faire.png";
import * as fashion from "@/public/fashiongo.png";
import * as kohls from "@/public/kohls.png";
import * as walmart from "@/public/walmart.png";
import * as shien from "@/public/shien.png";
import { theme, themeDark } from "@/components/UI/Theme";
import Link from "next/link"

export function Main(){
    return (
    <Box sx={{background: "#e2e2e2", minHeight: "vh"}}>
    <Container maxWidth="lg" >
      <Card sx={{width: "100%", display: "flex", flexDirection: "row", justifyContent: "space-between", margin: "2% 0%",}}>
        <Box sx={{padding: "4%", width: "55%",  backgroundImage: `url(/2270.jpg)`, backgroundSize: 'cover',}}>
          <Image src={logo} alt="premier printing logo" width={300} height={300} style={{width: "100%", height: "auto"}} />
        </Box>
        <Box sx={{padding: "4%", width: "45%"}}>
          <Typography sx={{textAlign: "center", fontSize: "2rem", fontWeight: 600}}>Find Us On</Typography>
            <Box sx={{display: "flex", flexDirection: "column", alignItems: "center", alignContent: "center", padding: "1%"}}>
              <Box sx={{padding: "2%"}}>
                <Link href="https://www.target.com/s?searchTerm=simpy+sage+market&tref=typeahead%7Cterm%7Csimpy+sage+market%7C%7C%7Chistory" target="_blank">
                  <Image src={target} alt="target logo" width={200} height={200} style={{width: "100%", height: "auto"}} />
                  </Link>
              </Box>
              <Box sx={{padding: "2%"}}>
                <Link href="https://www.tractorsupply.com/tsc/brand/Simply+Sage+Market?isIntSrch=written&srch=Simply%20Sage%20Market" target="_blank">
                  <Image src={tsc} alt="tractor supply logo" width={200} height={200} style={{width: "100%", height: "auto"}} />
                </Link>
              </Box>
              <Box sx={{padding: "2%"}}>
                <Link href="https://thejunipershopwholesale.com/" target="_blank">
                  <Image src={shopify} alt="shopify logo" width={200} height={200} style={{width: "100%", height: "auto"}} />
                </Link>
              </Box>
              <Box sx={{padding: "2%"}}>
                <Link href="https://www.amazon.com/stores/SimplySageMarket/page/E2BCEA3C-F5F5-4C70-BFBB-B47E3901C7E8?ref_=ast_bln&store_ref=bl_ast_dp_brandLogo_sto" target="_blank">
                  <Image src={amazon} alt="amazon logo" width={200} height={200} style={{width: "100%", height: "auto"}} />
                </Link>
              </Box>
              <Box sx={{padding: "2%"}}>
                <Link href="https://www.faire.com/search?q=olive_and_ivory_wholesale&refReqId=btq4zgg4pberbgwrk3dkp6s35&refType=SUGGESTIONS_SEARCH_QUERIES" target="_blank">
                  <Image src={faire} alt="faire logo" width={200} height={200} style={{width: "100%", height: "auto"}} />
                </Link>
              </Box>
              <Box sx={{padding: "2%"}}>
                <Link href="https://www.kohls.com/search.jsp?submit-search=web-regular&search=simply+sage+market&spa=5&kls_sbp=43715523261837335372514495555634757741" target="_blank">
                  <Image src={kohls} alt="kohls logo" width={200} height={200} style={{width: "100%", height: "auto"}} />
                </Link>
              </Box>
              <Box sx={{padding: "2%"}}>
                <Link href="https://www.walmart.com/search?q=simply+sage+market" target="_blank">
                  <Image src={walmart} alt="walmart logo" width={200} height={200} style={{width: "100%", height: "auto"}} />
                </Link>
              </Box>
              <Box sx={{padding: "2%"}}>
                <Link href="https://www.fashiongo.net/Search?q=olive%20and%20ivory%20wholesale" target="_blank">
                  <Image src={fashion} alt="Fashion go logo" width={200} height={200} style={{width: "100%", height: "auto"}} />
                </Link>
              </Box>
           </Box>
        </Box>
      </Card>
    </Container>
    <Box sx={{background: theme.palette.primary.faded, padding: "2%", width: "100%", position: "relative", bottom: 0}}>
      <Typography sx={{textAlign: "center", fontSize: ".9rem", color: "#fff"}}>©copyright 2025</Typography>
    </Box>
  </Box>
);
}
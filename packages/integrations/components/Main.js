"use client"
import {Box, Grid2, Card, Container, Typography, Divider, Button} from "@mui/material";
import Image from "next/image"
import  tiktok from "./tiktoksm.jpeg"
import  etsy from "./etsy2.jpeg"
import  amazon from "./amazon.png"
import acenda from "./Acenda.png"
import {TikTokModal} from "./TikTokModal";
import {useState} from "react";
import {AcendaModal} from "./AcendaModal";
import Link from "next/link";


export function Main({ tiktokShops, apiKeyIntegrations, provider, etsyRedirectURI }){
    const [tikTokOpen, setTikTokOpen] = useState(false)
    const [acendaOpen, setAcendaOpen] = useState(false)
    const [apiConnections, setApiConnections] = useState(apiKeyIntegrations || [])
    return (
        <Container maxWidth={"lg"}>
            <Box sx={{padding: "3%"}}>
                <Grid2 container spacing={3}>
                    <Grid2 size={12}>
                        <Typography textAlign={"center"} fontSize={"1.4rem"}>Create New Connection</Typography>
                    </Grid2>
                    <Grid2 size={3}>
                        <Card sx={{ padding: "4%", boxShadow: "1px 2px 1px #e2e2e2", height: "100%", "&:hover": { cursor: "pointer", boxShadow: "3px 4px 3px #e2e2e2", opacity: .8, } }} onClick={()=>{setTikTokOpen(true)}}>
                            <Box >
                                <Image src={tiktok} alt={"tiktok"} width={600} height={600} style={{width: "100%", height: "auto"}}/>
                            </Box>
                        </Card>
                    </Grid2>
                    <Grid2 size={3}>
                        <Card sx={{ padding: "4%", boxShadow: "1px 2px 1px #e2e2e2", height: "100%", "&:hover": { cursor: "pointer", boxShadow: "3px 4px 3px #e2e2e2", opacity: .8, } }} >
                            <Link href={""} target="_blank" style={{textDecoration: "none", color: "inherit"}}>
                                <Box >
                                    <Image src={etsy} alt={"etsy"} width={600} height={600} style={{width: "100%", height: "auto", background: "#fff"}}/>
                                </Box>
                            </Link>
                        </Card>
                    </Grid2>
                    <Grid2 size={3}>
                        <Card sx={{ padding: "4%", boxShadow: "1px 2px 1px #e2e2e2", height: "100%", "&:hover": { cursor: "pointer", boxShadow: "3px 4px 3px #e2e2e2", opacity: .8,  } }}>
                             <Box >
                                <Image src={amazon} alt={"amazon"} width={600} height={600} style={{width: "100%", height: "auto"}}/>
                            </Box>
                        </Card>
                    </Grid2>
                    <Grid2 size={3}>
                        <Card sx={{ padding: "4%", boxShadow: "1px 2px 1px #e2e2e2", height: "100%", "&:hover": { cursor: "pointer", boxShadow: "3px 4px 3px #e2e2e2", opacity: .8, } }} onClick={()=>{setAcendaOpen(true)}}>
                             <Box>
                                <Image src={acenda} alt={"acenda"} width={600} height={600} style={{width: "100%", height: "auto", objectFit: "cover"}}/>
                            </Box>
                        </Card>
                    </Grid2>
                </Grid2>
            </Box>
            <TikTokModal open={tikTokOpen} setOpen={setTikTokOpen} provider={provider}/>
            <AcendaModal open={acendaOpen} setOpen={setAcendaOpen} provider={provider} apiConnections={apiConnections} setConnections={setApiConnections}/>
            <Divider/>
            <Box sx={{padding: "3%"}}>
                 <Typography textAlign={"center"} fontSize={"1.4rem"}>Connections</Typography>
                 {tiktokShops.map(tt=>(
                    <Box key={tt._id} sx={{background: "#fff", padding: "2%", borderRadius: "10px", margin: "1%", display: "flex", flexDirection: "row", justifyContent: "space-between"}}>
                        <Box>
                            <Typography>Tik Tok - Seller Name: {tt.seller_name}</Typography>
                            <Typography sx={{fontSize: ".8rem", textAlign: "center"}} >Shops</Typography>
                            <Divider sx={{margin: "1%"}}/>
                            {tt.shop_list.map(l=>(
                                <Typography sx={{fontSize: ".8rem"}} key={l.shp_name}>{`Shop Name: ${l.shop_name} Region: ${l.region}`}</Typography>
                            ))}
                        </Box>
                        <Box sx={{display: "flex", flexDirection: "row", justifyContent: "flex-start"}}>
                            <Button sx={{background: "#0066CC", color: "#fff"}}> {tt.access_token != undefined? "Reauthorize": "Authorize"}</Button>
                            <Button sx={{background: "red", color: "#fff"}}>Deactivate</Button>
                        </Box>
                    </Box>
                 ))}  
                 {apiConnections.map(api=>(
                    <Box key={api._id} sx={{background: "#fff", padding: "2%", borderRadius: "10px", margin: "1%", display: "flex", flexDirection: "row", justifyContent: "space-between"}}>
                        <Box>
                            <Typography>{api.displayName}</Typography>
                             <Typography sx={{ fontSize: ".8rem", textAlign: "left" }} title="API Key">API Key: {"*".repeat(api.apiKey.substring(0, api.apiKey.length - 6).length)}{api.apiKey.substring(api.apiKey.length - 6, api.apiKey.length)}</Typography>
                            <Divider sx={{margin: "1%"}}/>
                             <Typography sx={{ fontSize: ".8rem", textAlign: "left" }} title="API Secret">API Secret: {"*".repeat(api.apiSecret.substring(0, api.apiSecret.length - 6).length)}{api.apiSecret.substring(api.apiSecret.length - 6, api.apiSecret.length)}</Typography>
                             <Typography sx={{ fontSize: ".8rem", textAlign: "left" }} title="Organization">Organization: {api.organization}</Typography>
                        </Box>
                        <Box sx={{display: "flex", flexDirection: "row", justifyContent: "flex-start"}}>
                            <Button sx={{background: "#0066CC", color: "#fff"}}> {api.access_token != undefined? "Reauthorize": "Authorize"}</Button>
                            <Button sx={{background: "red", color: "#fff"}}>Deactivate</Button>
                        </Box>
                    </Box>
                 ))}  
            </Box>
        </Container>
    )
}
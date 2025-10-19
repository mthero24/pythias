"use client";
import {Box, Card, Container, Typography, Grid2, Divider, TextField, Button} from "@mui/material";
import Image from "next/image";
import {Footer} from "../reusable/Footer";
import {useState} from "react";
import { MarketplaceModal } from "../reusable/MarketPlaceModal";
export function BlanksComponent({blanks, mPs, source}){
    const [visibleBlanks, setVisibleBlanks] = useState(blanks);
    const [blank, setBlank] = useState({})
    const [marketPlaces, setMarketPlaces] = useState(mPs)
    const [marketplaceModal, setMarketplaceModal] = useState(false)
    const handleSearch = ({ value }) => {
        //console.log(value);
        let filtered = blanks.filter(
            (s) =>
                s.code.toLowerCase().includes(value.toLowerCase()) ||
                s.name.toLowerCase().includes(value.toLowerCase())
        );
        setVisibleBlanks([...filtered]);
    };
    return (
        <Box>
            <Container maxWidth="lg" sx={{minHeight: "80vh", paddingTop: "2%"}}>
                <Box sx={{display: "flex", flexDirection: "row", justifyContent: "flex-end", alignItems: "center", marginBottom: "2%"}}>
                    <Button variant="contained" href="/admin/blanks/create">Create New Blank</Button>
                </Box>
                <Box>
                    <TextField
                        label="Search Blanks"
                        fullWidth
                        variant="outlined"
                        sx={{background: "#ffffff"}}
                        onChange={(e) => handleSearch({ value: e.target.value })}
                    />
                </Box>
                <Grid2 container spacing={2} sx={{margin: "2% 0%"}}>
                    {visibleBlanks.map((blank) => {
                        let frontImage = blank.images && blank.images.length > 0 ? blank.images[0] : (blank.multiImages && blank.multiImages["front"] ? blank.multiImages["front"][0] : null);
                        if(!frontImage && blank.multiImages){
                            let keys = Object.keys(blank.multiImages);
                            for(let k of keys){
                                if(blank.multiImages[k] && blank.multiImages[k].length > 0){
                                    frontImage = blank.multiImages[k][0];
                                    break;
                                }
                            }
                        }
                        return (
                            <Grid2 item size={{xs: 6, sm: 4, md: 3}} key={blank.id}>
                            <Card sx={{padding: "2%", display: "flex", flexDirection: "column"}}>
                                <Box sx={{display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", }}>
                                    <Image src={frontImage ? `${frontImage?.image.replace("images1.pythiastechnologies.com", "images2.pythiastechnologies.com/origin")}?width=400`: ""} alt={blank.name} width={300} height={200} />
                                </Box>
                                <Box>
                                    <Divider sx={{margin: "2% 0%"}} />
                                </Box>
                                <Typography variant="h6" sx={{textWrap: "nowrap", overflow: "hidden", textOverflow: "ellipsis",}}>{blank.code} - {blank.name}</Typography>
                                <Box sx={{display: "flex", flexDirection: "row", justifyContent: "space-between", marginTop: "2%"}}>
                                    <Box sx={{display: "flex", flexDirection: "column",}}>
                                            <Typography variant="body1" sx={{ textAlign: "left", fontSize: "0.8rem" }}>Sales: <span style={{ fontWeight: "bold", fontSize: "0.8rem" }}>{blank.sales}</span></Typography>
                                        <span style={{ fontSize: "0.6rem" }}>(Last 30 days)</span>
                                    </Box>
                                    <Box sx={{ display: "flex", flexDirection: "column", }}>
                                            <Typography variant="body1" sx={{ textAlign: "left", fontSize: "0.8rem" }}>Dept: <span style={{ fontWeight: "bold", fontSize: "0.8rem" }}>{blank.department}</span></Typography>
                                    </Box>
                                    <Box sx={{ display: "flex", flexDirection: "column", }}>
                                        <Typography variant="body1" sx={{ textAlign: "left", fontSize: "0.8rem" }}>Cat: <span style={{ fontWeight: "bold", fontSize: "0.8rem" }}>{blank.category && blank.category[0]}</span></Typography>
                                    </Box>
                                </Box>
                                <Box sx={{display: "flex", flexDirection: "row", justifyContent: "center", marginTop: "2%"}}>
                                    <Button variant="outlined" onClick={()=>{
                                        setBlank(blank)
                                        setMarketplaceModal(true)
                                    }}>Add To MarketPlace</Button>
                                    <Button variant="contained" sx={{ marginLeft: "2%" }} href={`/admin/blanks/production/${blank._id}`} target="_blank">Production Settings</Button>
                                </Box>
                                    <Button variant="outlined" sx={{ marginTop: "2%" }} href={`/admin/blanks/create?id=${blank._id}`} target="_blank">Edit Blank</Button>
                            </Card>
                        </Grid2>
                    )})}
                </Grid2>
                <MarketplaceModal open={marketplaceModal} setOpen={setMarketplaceModal} marketPlaces={marketPlaces} setMarketPlaces={setMarketPlaces} sizes={blanks?.map(b => { return b.sizes?.map(s => { return s.name }) })} blank={blank} setBlank={setBlank} source={source} />
            </Container>
            <Footer />
        </Box>
    );
}
"use client";
import {Scan} from "./scan"
import { BinSettings } from "./binSettings"
import { BinModal } from "./BinModal";
import {Box, Card, Typography, Grid2, Button, Container, TextField} from "@mui/material"
import {useState}from "react"
import axios from "axios"
import Image from "next/image";
import { Footer } from "@pythias/backend";
export function Main({source}){
    const [variant, setVariant] = useState(null)
    const [inventory, setInventory] = useState(null)
    const [auto, setAuto] = useState(true)
    const [open, setOpen] =useState(false)
    const [labelModal, setLabelModal] = useState(false)
    let modalStyle = {
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "80%",
        height: "80vh",
        bgcolor: "background.paper",
        border: "2px solid #000",
        boxShadow: 24,
        p: 4,
        overflow: "auto"
      };
    return (
        <Box sx={{ minHeight: "70vh", paddingTop: "2%"}}>
            <Container>
                <Scan setVariant={setVariant} setInventory={setInventory} auto={auto} setAuto={setAuto}  />
                <Box sx={{margin: "0% 2%", minHeight: "60vh"}}>
                    {variant && inventory && (
                        <Box>
                            <Card sx={{padding: "2%", marginBottom: "2%"}}>
                                <Typography variant="h6">Variant Information</Typography>
                                <Box sx={{display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "center", alignContent: "center", gap: "1rem", marginTop: "1rem"}}>
                                    <Image src={variant.image.replace("400", "600")} width={600} height={400} alt="Variant Image" />
                                </Box>
                                <Box sx={{display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "center", alignContent: "center", marginTop: "1rem"}}>
                                    <Grid2 container spacing={2} sx={{marginTop: "1rem"}}>
                                        <Grid2 xs={6}>
                                            <Typography><strong>SKU:</strong> {variant.sku}</Typography>
                                            <Typography><strong>UPC:</strong> {variant.upc}</Typography>
                                            <Typography><strong>Blank:</strong> {variant.blank.code}</Typography>
                                            <Typography><strong>Color:</strong> {variant.color.name}</Typography>
                                            <Typography><strong>Size:</strong> {variant.blank.sizes.filter(s=> s._id.toString() == variant.size.toString())[0].name}</Typography>
                                            <Typography><strong>Price:</strong> ${variant.price}</Typography>
                                        </Grid2>
                                        <Grid2 xs={6}>
                                            <Box sx={{display: "flex", flexDirection: "row", alignItems: "center", gap: "1rem"}}>
                                                <Typography><strong>Quantity:</strong></Typography>
                                                <TextField size="small" value={inventory.quantity} type={"number"} onChange={(e)=>{
                                                    let inv = {...inventory}
                                                    inv.quantity = parseInt(e.target.value)
                                                    setInventory(inv)
                                                }}/>
                                                <Box variant="contained" size={"large"} sx={{ marginLeft: "-22%", backgroundColor: "#1722b9ff", color: "#fff", padding: "2%", zIndex: 1, cursor: "pointer", borderTopRightRadius: "4px", borderBottomRightRadius: "4px" }}>Update</Box>
                                            </Box>
                                            <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "1rem", marginTop: "1rem" }}>
                                                <Typography><strong>Location:</strong></Typography>
                                                <TextField size="small" value={inventory.location} />
                                                <Box variant="contained" size={"large"} sx={{ marginLeft: "-22%", backgroundColor: "#1722b9ff", color: "#fff", padding: "2%", zIndex: 1, cursor: "pointer", borderTopRightRadius: "4px", borderBottomRightRadius: "4px" }}>Update</Box>
                                            </Box>
                                        </Grid2>
                                    </Grid2>
                                </Box>
                            </Card>
                        </Box>
                    )}
                </Box>
            </Container>
            <Footer fixed={true} />
        </Box>
    )
}
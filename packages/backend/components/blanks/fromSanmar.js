"use client";
import {Box, Typography, TextField, Button, Container, Grid2, Card} from "@mui/material";
import {useState}   from "react";
import Image from "next/image";
import axios from "axios";
export function FromSanmarBlank() {
    let [brandName, setBrandName] = useState("");
    const [products, setProducts] = useState({});
    return <Container>
        <Box sx={{display: "flex", flexDirection: "column", gap: 2}}>
            <Typography variant="h6">Sanmar Blank Details</Typography>
            <TextField label="Brand Name" name="brandName" value={brandName} onChange={e => setBrandName(e.target.value)} />
            <Button variant="contained" color="primary" onClick={async () => {
                let res = await axios.post("/api/admin/integrations/sanmar", {brandName});
                if(res && res.data && !res.data.error){
                    setProducts(res.data.productInfo.products);
                }
                console.log(res);
            }}>Submit</Button>
            <Typography variant="h6">Products</Typography>
            <Grid2 container spacing={2}>
                {Object.keys(products).map(style=>
                    <Grid2 size={{xs: 6, md: 4}} key={style} sx={{display: "flex", flexDirection: "column", gap: 1, alignItems: "center"}}>
                        <Box sx={{p: 2, width: "100%", backgroundColor: "#f5f5f5", borderRadius: 2, boxShadow: 1, cursor: "pointer", display: "flex", flexDirection: "column",}} onClick={async ()=>{
                            let res = await axios.put("/api/admin/integrations/sanmar", {product: products[style]});
                            if(res && res.data && !res.data.error){
                                location.href = `/admin/blanks/create?id=${res.data.blankId}`;
                            }
                        }}>
                            <Box sx={{display: "flex", flexDirection: "column", justifyContent: "center", mb: 1, alignItems: "center", alignContent: "center"}}>
                                <Image src={`http://localhost:3011/resize?url=${products[style][0].productImageInfo.productImage}&width=400&height=400`} alt={style} width={300} height={300} style={{ width: "100%", height: "auto", maxHeight: "300px", minHeight: "300px", background: "white" }} />
                            </Box>
                            <Box sx={{display: "flex", flexDirection: "column", gap: .5}}>
                                <Typography variant="h6" textAlign={"center"} title={products[style][0].productBasicInfo.productTitle} sx={{ width: "100%", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{products[style][0].productBasicInfo.productTitle}</Typography>
                                <Typography variant="body2" textAlign={"center"}>Brand: {products[style][0].productBasicInfo.brandName}, Style: {style}</Typography>
                                <Typography variant="body2" textAlign={"center"} sx={{ width: "100%", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} onClick={() => {}}>Colors: {Array.from(new Set(products[style].map(p=>p.productBasicInfo.color))).join(", ")}</Typography>
                                <Typography variant="body2" textAlign={"center"}>Available Sizes: {Array.from(new Set(products[style].map(p=>p.productBasicInfo.availableSizes))).join(", ")}</Typography>
                                <Typography variant="body2" textAlign={"center"}>Prices: {Math.min(...(Array.from(new Set(products[style].map(p=>parseFloat(p.productPriceInfo.piecePrice))))))} - {Math.max(...(Array.from(new Set(products[style].map(p=>parseFloat(p.productPriceInfo.piecePrice))))))}</Typography>
                            </Box>
                        </Box>
                    </Grid2>
                )}
            </Grid2>
        </Box>
    </Container>
}
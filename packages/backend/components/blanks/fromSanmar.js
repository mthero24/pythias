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
                        <Box sx={{p: 2, width: "100%", backgroundColor: "#f5f5f5", borderRadius: 2, boxShadow: 1}}>
                            <Box sx={{display: "flex", flexDirection: "column", justifyContent: "center", mb: 1, alignItems: "center", alignContent: "center"}}>
                                <Image src={products[style][0].productImageInfo.productImage} alt={style} width={600} height={600} style={{width: "100%", height: "auto"}} />
                            </Box>
                        </Box>
                    </Grid2>
                )}
            </Grid2>
        </Box>
    </Container>
}
"use client";
import {Box, Grid2, Typography, Button, Divider, List, ListItem, ListItemText, Container, Grid} from "@mui/material";
import {useState} from "react";
import { ProductCard } from "../reusable/ProductCard";
export const ProductsMain = ({prods}) => {
    const [products, setProducts] = useState(prods);
    return (
        <Container>
                <Typography variant="h4" sx={{ marginBottom: "2%" }}>Products</Typography>
                <Grid2 container spacing={2}>
                    {products.map((p, i) => (
                        <ProductCard 
                            key={i} 
                            p={p} 
                            setProduct={(product) => setProducts(products.map(prod => prod._id === product._id ? product : prod))} 
                            setCreateProduct={(create) => setProducts(products.map(prod => ({...prod, create})))}
                            setMarketplaceModal={(modal) => setProducts(products.map(prod => ({...prod, marketplaceModal: modal})))} 
                            des={{products}} 
                            setDesign={(design) => setProducts(products.map(prod => ({...prod, design})))} 
                            setPreview={(preview) => setProducts(products.map(prod => ({...prod, preview})))} 
                        />
                    ))}
                </Grid2>
        </Container>
    );
};
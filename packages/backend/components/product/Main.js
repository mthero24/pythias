"use client";
import {Box, Grid2, Typography, Button, Divider, List, ListItem, ListItemText, Container, Stack, Pagination} from "@mui/material";
import {useState} from "react";
import { ProductCard } from "../reusable/ProductCard";
import {Footer} from "../reusable/Footer";
export const ProductsMain = ({prods, co, pa}) => {
    const [products, setProducts] = useState(prods);
    const [count, setCount] = useState(co);
    const [page, setPage] = useState(pa);
    const [search, setSearch] = useState("");
    const handlePageChange = (event, value) => {
        console.log(value)
        location.href = `/admin/products?page=${value}${search ? `&q=${search}` : ''}`;
        // You would typically fetch new data for the selected page here
        // based on the 'value' (new page number)
        console.log(`Navigating to page: ${value}`);
    };
    return (
        <Box>
            <Container maxWidth="lg">
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
                                updateDesign={(design) => setProducts(products.map(prod => ({...prod, design})))}
                            />
                        ))}
                    </Grid2>
                    <Stack spacing={2} sx={{ margin: "1% 0%", display: "flex", alignItems: "center" }}>
                        <Pagination count={Math.ceil(count / 25)} page={page} onChange={handlePageChange} shape="rounded" showFirstButton showLastButton />
                    </Stack>
            </Container>
            <Footer />
        </Box>
    );
};
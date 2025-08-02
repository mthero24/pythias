"use client";
import {Box, Grid2, Typography, Button, Divider, List, ListItem, ListItemText, InputAdornment, TextField, Card, Container, Stack, Pagination, Grid} from "@mui/material";
import {useState, useEffect} from "react";
import { ProductCard } from "../reusable/ProductCard";
import {Footer} from "../reusable/Footer";
import SearchIcon from '@mui/icons-material/Search';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import CreatableSelect from "react-select/creatable";
import { CreateProductModal } from "../design/CreateProductModal";
import { MarketplaceModal } from "../reusable/MarketPlaceModal";
import LoaderOverlay from "../reusable/LoaderOverlay";
import {useCSV} from "../reusable/CSVProvider";
import { set } from "mongoose";
export const ProductsMain = ({prods, co, pa, blanks, seasons, genders, sportsUsedFor, brands, marketplaces, colors, themes, query, filter, CreateSku, source, totalProducts}) => {
    const [products, setProducts] = useState(prods);
    const [count, setCount] = useState(co);
    const [page, setPage] = useState(pa);
    const [search, setSearch] = useState(query);
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [filters, setFilters] = useState(filter || {});
    const [createProduct, setCreateProduct] = useState(false);
    const [marketplaceModal, setMarketplaceModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState({blanks: [], colors: [], productImages: [], variants: []});
    const [des, setDesign] = useState({});
    const [departments, setDepartments] = useState([]);
    const [categories, setCategories] = useState([]);
    const [bran, setBrands] = useState(brands || []);
    const [gen, setGenders] = useState(genders || []);
    const [seas, setSeasons] = useState(seasons || []);
    const [sport, setSportUsedFor] = useState(sportsUsedFor || []);
    const [them, setThemes] = useState(themes || []);
    const [preview, setPreview] = useState(false);
    const [loading, setLoading] = useState(false);
    const [market, setMarketPlaces] = useState(marketplaces || []);
    const [imageGroups, setImageGroups] = useState();
    const {setShow, setCSVData} = useCSV();
    setShow(true);
    useEffect(() => {
        let dept = [];
        let cat = [];
        for(let blank of blanks) {
            if(blank.department && !dept.includes(blank.department)) dept.push(blank.department);
            for(let c of blank.category) {
                if(!cat.includes(c)) cat.push(c);
            }
        }
        let imGr = []
        blanks.map(b => {
            if (b.multiImages) {
                Object.keys(b.multiImages).map(i => {
                    b.multiImages[i].map(im => {
                        im.imageGroup?.map(g => {
                            if (!imGr.includes(g)) imGr.push(g)
                        })
                    })
                })
            }
        })
        setImageGroups(imGr)
        setDepartments(dept);
        setCategories(cat);
    }, []);
    useEffect(() => {
        if (selectedProduct) {
            setDesign({...selectedProduct.design, products: [{...selectedProduct}]});
        }
    }, [selectedProduct]);
    const handlePageChange = (event, value) => {
        console.log(value)
        location.href = `/admin/products?page=${value}${search ? `&q=${search}` : ''}${filters ? `&filters=${JSON.stringify(filters)}` : ''}`;
        // You would typically fetch new data for the selected page here
        // based on the 'value' (new page number)
        console.log(`Navigating to page: ${value}`);
    };
    const applyFilters = () => {
        console.log(search, filters, "Applying filters");
        location.href = `/admin/products?page=1${search ? `&q=${search}` : ''}${filters ? `&filters=${JSON.stringify(filters)}` : ''}`;
    }
    let updateDesign = async (des) => {
        return null;
        // This function is a placeholder for updating the design.
    }
    return (
        <Box sx={{width: "100%", maxWidth: "100%", overflowX: "hidden", overflowY: "auto"}}>
            <Container maxWidth="lg" sx={{minHeight: "90vh"}}>
                    <Typography variant="h4" sx={{ marginBottom: "2%" }}>Products {totalProducts}</Typography>
                    <Card sx={{ padding: "2%", marginBottom: "2%" }}>
                        <TextField
                            fullWidth
                            variant="outlined"
                            placeholder="Search products..."
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end" sx={{ cursor: "pointer" }} onClick={() => handlePageChange(null, 1)}>
                                        <SearchIcon />
                                    </InputAdornment>
                                ),
                            }}
                            value={search}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handlePageChange(null, 1);
                                }
                            }}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <Box sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center", marginTop: "1%" }}>
                            <Typography variant="body2" sx={{ marginRight: "1%", cursor: "pointer", color: filtersOpen ? "primary.main" : "text.secondary" }} onClick={() => setFiltersOpen(!filtersOpen)}> Filters {filtersOpen ? <ArrowDropUpIcon /> : <ArrowDropDownIcon />} </Typography>
                        </Box>
                    </Card>
                    {filtersOpen && (
                        <Box sx={{ marginBottom: "2%", padding: "2%", backgroundColor: "#f5f5f5", borderRadius: "5px", background: "#fff", boxShadow: "0px 0px 10px rgba(0,0,0,.1)" }}>
                            <Grid2 container spacing={2} sx={{ marginTop: "1%" }}>
                                <Grid2 size={{ xs: 12, sm: 3 }}>
                                    <CreatableSelect
                                        placeholder="Filter By Blank ..."
                                        isClearable
                                        isMulti
                                        options={blanks.map(b => ({ value: b._id, label: b.code }))}
                                        value={filters.blanks && filters.blanks.$in ? filters.blanks.$in.map(b => ({ value: b, label: blanks.filter(bl=> bl._id.toString() === b.toString())[0]?.code })) : []}
                                        onChange={(selected) => {
                                            console.log("Filter BY Blank:", selected);
                                            let fil = {...filters };
                                            if (selected && selected.length > 0) {
                                                fil.blanks = {$in: selected.map(s => s.value)};
                                            }else{
                                                let newFil = {}
                                                for (let key in filters) {
                                                    if (key !== 'blanks') {
                                                        newFil[key] = filters[key];
                                                    }
                                                }
                                                fil = newFil;
                                            }
                                            setFilters({...fil});
                                        }}
                                    />
                                </Grid2>
                                <Grid2 size={{ xs: 12, sm: 3 }} sx={{ zIndex: 999 }}>
                                    <CreatableSelect
                                        placeholder="Filter By Department ..."
                                        isClearable
                                        isMulti
                                        options={departments.map(d => ({ value: d, label: d }))}
                                        value={filters.department && filters.department.$in ? filters.department.$in.map(d => ({ value: d, label: departments.filter(dep => dep === d)[0] })) : []}
                                        onChange={(selected) => {
                                            console.log("Filter BY Department:", selected);
                                            let fil = { ...filters };
                                            if (selected && selected.length > 0) {
                                                fil.department = { $in: selected.map(s => s.value) };
                                            } else {
                                                let newFil = {}
                                                for (let key in filters) {
                                                    if (key !== 'department') {
                                                        newFil[key] = filters[key];
                                                    }
                                                }
                                                fil = newFil;
                                            }
                                            setFilters({ ...fil });
                                        }}
                                    />
                                </Grid2>
                                <Grid2 size={{ xs: 12, sm: 3 }}>
                                    <CreatableSelect
                                        placeholder="Filter By Category ..."
                                        isClearable
                                        isMulti
                                        value={filters.category && filters.category.$in ? filters.category.$in.map(c => ({ value: c, label: categories.filter(cat => cat === c)[0] })) : []}
                                        options={categories.map(c => ({ value: c, label: c }))}
                                        onChange={(selected) => {
                                            console.log("Filter BY Category:", selected);
                                            let fil = { ...filters };
                                            if (selected && selected.length > 0) {
                                                fil.category = { $in: selected.map(s => s.value) };
                                            } else {
                                                let newFil = {}
                                                for (let key in filters) {
                                                    if (key !== 'category') {
                                                        newFil[key] = filters[key];
                                                    }
                                                }
                                                fil = newFil;
                                            }
                                            setFilters({ ...fil });
                                        }}
                                    />
                                </Grid2>
                                <Grid2 size={{ xs: 12, sm: 3 }}>
                                    <CreatableSelect
                                        placeholder="Filter By Brand ..."
                                        isClearable
                                        isMulti
                                        options={bran.map(b => ({ value: b.name, label: b.name }))}
                                        value={filters.brand && filters.brand.$in ? filters.brand.$in.map(b => ({ value: b, label: bran.filter(brand => brand.name === b)[0].name })) : []}
                                        onChange={(selected) => {
                                            console.log("Filter by brand:", selected);
                                            let fil = { ...filters };
                                            if (selected && selected.length > 0) {
                                                fil.brand = { $in: selected.map(s => s.value) };
                                            } else {
                                                let newFil = {}
                                                for (let key in filters) {
                                                    if (key !== 'brand') {
                                                        newFil[key] = filters[key];
                                                    }
                                                }
                                                fil = newFil;
                                            }
                                            setFilters({ ...fil });
                                        }}
                                    />
                                </Grid2>
                                <Grid2 size={{ xs: 12, sm: 3 }}>
                                    <CreatableSelect
                                        placeholder="Filter By Season ..."
                                        isClearable
                                        isMulti
                                        options={seas.map(s => ({ value: s.name, label: s.name }))}
                                        value={filters.season && filters.season.$in ? filters.season.$in.map(s => ({ value: s, label: s })) : []}
                                        onChange={(selected) => {
                                            console.log("Filter by season:", selected);
                                            let fil = { ...filters };
                                            if (selected && selected.length > 0) {
                                                fil.season = { $in: selected.map(s => s.value) };
                                            } else {
                                                let newFil = {}
                                                for (let key in filters) {
                                                    if (key !== 'season') {
                                                        newFil[key] = filters[key];
                                                    }
                                                }
                                                fil = newFil;
                                            }
                                            setFilters({ ...fil });
                                        }}
                                    />
                                </Grid2>
                                <Grid2 size={{ xs: 12, sm: 3 }}>
                                    <CreatableSelect
                                        placeholder="Filter By Gender ..."
                                        isClearable
                                        isMulti
                                        options={gen.map(g => ({ value: g.name, label: g.name }))}
                                        value={filters.gender && filters.gender.$in ? filters.gender.$in.map(g => ({ value: g, label: g })) : []}
                                        onChange={(selected) => {
                                            console.log("Filter by gender:", selected);
                                            let fil = { ...filters };
                                            if (selected && selected.length > 0) {
                                                fil.gender = { $in: selected.map(s => s.value) };
                                            } else {
                                                let newFil = {}
                                                for (let key in filters) {
                                                    if (key !== 'gender') {
                                                        newFil[key] = filters[key];
                                                    }
                                                }
                                                fil = newFil;
                                            }
                                            setFilters({ ...fil });
                                        }}
                                    />
                                </Grid2>
                                <Grid2 size={{ xs: 12, sm: 3 }}>
                                    <CreatableSelect
                                        placeholder="Filter By Sport ..."
                                        isClearable
                                        isMulti
                                        options={sport.map(s => ({ value: s.name, label: s.name }))}
                                        value={filters.sportUsedFor && filters.sportUsedFor.$in ? filters.sportUsedFor.$in.map(s => ({ value: s, label: s })) : []}
                                        onChange={(selected) => {
                                            console.log("Filter by sport:", selected);
                                            let fil = { ...filters };
                                            if (selected && selected.length > 0) {
                                                fil.sportUsedFor = { $in: selected.map(s => s.value) };
                                            } else {
                                                let newFil = {}
                                                for (let key in filters) {
                                                    if (key !== 'sportUsedFor') {
                                                        newFil[key] = filters[key];
                                                    }
                                                }
                                                fil = newFil;
                                            }
                                            setFilters({ ...fil });
                                        }}
                                    />
                                </Grid2>
                                <Grid2 size={{ xs: 12, sm: 3 }}>
                                    <CreatableSelect
                                        placeholder="Filter By marketplace ..."
                                        isClearable
                                        isMulti
                                        options={marketplaces?.map(m => ({ value: m._id, label: m.name }))}
                                        value={filters.marketPlacesArray && filters.marketPlacesArray.$in ? filters.marketPlacesArray.$in.map(m => ({ value: m, label: marketplaces.find(mkt => mkt._id.toString() === m.toString())?.name })) : []}
                                        onChange={(selected) => {
                                            console.log("Filter by marketplace:", selected);
                                            let fil = { ...filters };
                                            if (selected && selected.length > 0) {
                                                fil.marketPlacesArray = { $in: selected.map(s => s.value) };
                                            } else {
                                                let newFil = {}
                                                for (let key in filters) {
                                                    if (key !== 'marketPlacesArray') {
                                                        newFil[key] = filters[key];
                                                    }
                                                }
                                                fil = newFil;
                                            }
                                            setFilters({ ...fil });
                                        }}
                                    />
                                </Grid2>
                                <Grid2 size={12}>
                                    <Button fullWidth onClick={() => {applyFilters()}}>Apply Filters</Button>
                                </Grid2>
                            </Grid2>
                        </Box>
                    )}
                    <Grid2 container spacing={2}>
                        {products.length === 0 && <Typography sx={{ textAlign: "center", width: "100%", fontWeight: "bold", fontSize: "1.5rem" }}>No products found</Typography>}
                        {products.map((p, i) => {
                            return <ProductCard 
                                key={i} 
                                p={p} 
                                setProduct={setSelectedProduct} 
                                setCreateProduct={setCreateProduct}
                                setMarketplaceModal={setMarketplaceModal} 
                                design={{...p.design}} 
                                setDesign={setDesign} 
                                setPreview={setPreview} 
                                updateDesign={updateDesign}
                                blanks={blanks}
                                colors={colors}
                                imageGroups={imageGroups}
                                brands={bran}
                                genders={gen}
                                seasons={seas} 
                                setBrands={setBrands}
                                setGenders={setGenders}
                                setSeasons={setSeasons}
                                CreateSku={CreateSku} 
                                themes={them}
                                sportUsedFor={sport}
                                setThemes={setThemes}
                                setSportUsedFor={setSportUsedFor}
                                setProducts={setProducts}
                            />
                        })}
                    </Grid2>
                    <Stack spacing={2} sx={{ margin: "1% 0%", display: "flex", alignItems: "center" }}>
                        <Pagination count={Math.ceil(count / 25)} page={page} onChange={handlePageChange} shape="rounded" showFirstButton showLastButton />
                    </Stack>
                <CreateProductModal open={createProduct} setOpen={setCreateProduct} product={selectedProduct} setProduct={setSelectedProduct} blanks={blanks} design={des} setDesign={setDesign} updateDesign={updateDesign} colors={colors} imageGroups={imageGroups} brands={bran} genders={gen} seasons={seas} setBrands={setBrands} setGenders={setGenders} setSeasons={setSeasons} CreateSku={CreateSku} source={source} loading={loading} setLoading={setLoading} preview={preview} setPreview={setPreview} themes={them} sportUsedFor={sport} setThemes={setThemes} setSportUsedFor={setSportUsedFor} pageProducts={products} setPageProducts={setProducts} />
                    {loading && <LoaderOverlay/>}
                <MarketplaceModal open={marketplaceModal} setOpen={setMarketplaceModal} product={selectedProduct} setProduct={setSelectedProduct} marketPlaces={market} setMarketPlaces={setMarketPlaces} sizes={blanks.map(b => {return b.sizes.map(s => {return s.name})})} design={des} setDesign={setDesign} />
            </Container>
            <Footer />
        </Box>
    );
};
"use client";
import {Box, Grid2, Typography, Button, InputAdornment, TextField, Container, Stack, Pagination, Badge, Chip} from "@mui/material";
import {useState, useEffect} from "react";
import { ProductCard } from "../reusable/ProductCard";
import {Footer} from "../reusable/Footer";
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import AddIcon from '@mui/icons-material/Add';
import StorefrontIcon from '@mui/icons-material/Storefront';
import CreatableSelect from "react-select/creatable";
import { CreateProductModal } from "../design/CreateProductModal";
import { MarketplaceModal } from "../reusable/MarketPlaceModal";
import {useCSV} from "../reusable/CSVProvider";
import {CreateNFProduct} from "./CreateNFProduct";
import LoaderOverlay from "../reusable/LoaderOverlay";
export const ProductsMain = ({prods, co, pa, blanks, seasons, genders, sportsUsedFor, brands, marketplaces, colors, themes, query, filter, CreateSku, source, totalProducts, printTypes, licenses, canManageMarketplaces }) => {
    console.log(printTypes, licenses)
    const [products, setProducts] = useState(prods? prods : []);
    const [count, setCount] = useState(co);
    const [page, setPage] = useState(pa);
    const [search, setSearch] = useState(query? query: "");
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
    const [NFProduct, setNFProduct] = useState(false);
    const [start, setStart] = useState("Select Blank");
    const {setShow} = useCSV();
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
        setShow(true);
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
        <Box sx={{width: "100%", maxWidth: "100%", overflowX: "hidden"}}>
            <Container maxWidth="lg" sx={{minHeight: "90vh"}}>
                <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", mb: 2, flexWrap: "wrap", gap: 1 }}>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                        <Box sx={{ width: 36, height: 36, borderRadius: 2, background: "linear-gradient(135deg, #f59e0b 0%, #f97316 100%)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <StorefrontIcon sx={{ color: "#fff", fontSize: 20 }} />
                        </Box>
                        <Box>
                            <Stack direction="row" alignItems="baseline" spacing={1}>
                                <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: -0.5, lineHeight: 1.2 }}>Products</Typography>
                                <Chip label={totalProducts} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
                            </Stack>
                            <Typography variant="body2" color="text.secondary">Manage your product catalog</Typography>
                        </Box>
                    </Stack>
                    <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={() => setNFProduct(true)}>Create Product</Button>
                </Box>
                <Box sx={{ marginBottom: 2, padding: 2, borderRadius: 2, background: "#fff", boxShadow: "0px 0px 10px rgba(0,0,0,.1)" }}>
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
                        onKeyDown={(e) => { if (e.key === 'Enter') handlePageChange(null, 1); }}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 1 }}>
                        <Badge badgeContent={Object.keys(filters).length} color="primary">
                            <Button size="small" variant={filtersOpen ? "contained" : "outlined"} startIcon={<FilterListIcon />} onClick={() => setFiltersOpen(!filtersOpen)}>
                                Filters
                            </Button>
                        </Badge>
                        {Object.keys(filters).length > 0 && (
                            <Button size="small" color="error" onClick={() => { setFilters({}); location.href = `/admin/products?page=1${search ? `&q=${search}` : ''}`; }}>
                                Clear All Filters
                            </Button>
                        )}
                    </Box>
                    {filtersOpen && (
                        <Grid2 container spacing={2} sx={{ marginTop: 1.5 }}>
                            <Grid2 size={{ xs: 12, sm: 3 }}>
                                <CreatableSelect
                                    placeholder="Filter By Blank ..."
                                    isClearable isMulti
                                    options={blanks.map(b => ({ value: b._id, label: b.code }))}
                                    value={filters.blanks?.$in ? filters.blanks.$in.map(b => ({ value: b, label: blanks.find(bl => bl._id.toString() === b.toString())?.code })) : []}
                                    onChange={(selected) => {
                                        let fil = { ...filters };
                                        if (selected?.length) fil.blanks = { $in: selected.map(s => s.value) };
                                        else { fil = Object.fromEntries(Object.entries(fil).filter(([k]) => k !== 'blanks')); }
                                        setFilters(fil);
                                    }}
                                />
                            </Grid2>
                            <Grid2 size={{ xs: 12, sm: 3 }}>
                                <CreatableSelect
                                    placeholder="Filter By Department ..."
                                    isClearable isMulti
                                    options={departments.map(d => ({ value: d, label: d }))}
                                    value={filters.department?.$in ? filters.department.$in.map(d => ({ value: d, label: d })) : []}
                                    onChange={(selected) => {
                                        let fil = { ...filters };
                                        if (selected?.length) fil.department = { $in: selected.map(s => s.value) };
                                        else { fil = Object.fromEntries(Object.entries(fil).filter(([k]) => k !== 'department')); }
                                        setFilters(fil);
                                    }}
                                />
                            </Grid2>
                            <Grid2 size={{ xs: 12, sm: 3 }}>
                                <CreatableSelect
                                    placeholder="Filter By Category ..."
                                    isClearable isMulti
                                    options={categories.map(c => ({ value: c, label: c }))}
                                    value={filters.category?.$in ? filters.category.$in.map(c => ({ value: c, label: c })) : []}
                                    onChange={(selected) => {
                                        let fil = { ...filters };
                                        if (selected?.length) fil.category = { $in: selected.map(s => s.value) };
                                        else { fil = Object.fromEntries(Object.entries(fil).filter(([k]) => k !== 'category')); }
                                        setFilters(fil);
                                    }}
                                />
                            </Grid2>
                            <Grid2 size={{ xs: 12, sm: 3 }}>
                                <CreatableSelect
                                    placeholder="Filter By Brand ..."
                                    isClearable isMulti
                                    options={bran.map(b => ({ value: b.name, label: b.name }))}
                                    value={filters.brand?.$in ? filters.brand.$in.map(b => ({ value: b, label: b })) : []}
                                    onChange={(selected) => {
                                        let fil = { ...filters };
                                        if (selected?.length) fil.brand = { $in: selected.map(s => s.value) };
                                        else { fil = Object.fromEntries(Object.entries(fil).filter(([k]) => k !== 'brand')); }
                                        setFilters(fil);
                                    }}
                                />
                            </Grid2>
                            <Grid2 size={{ xs: 12, sm: 3 }}>
                                <CreatableSelect
                                    placeholder="Filter By Season ..."
                                    isClearable isMulti
                                    options={seas.map(s => ({ value: s.name, label: s.name }))}
                                    value={filters.season?.$in ? filters.season.$in.map(s => ({ value: s, label: s })) : []}
                                    onChange={(selected) => {
                                        let fil = { ...filters };
                                        if (selected?.length) fil.season = { $in: selected.map(s => s.value) };
                                        else { fil = Object.fromEntries(Object.entries(fil).filter(([k]) => k !== 'season')); }
                                        setFilters(fil);
                                    }}
                                />
                            </Grid2>
                            <Grid2 size={{ xs: 12, sm: 3 }}>
                                <CreatableSelect
                                    placeholder="Filter By Gender ..."
                                    isClearable isMulti
                                    options={gen.map(g => ({ value: g.name, label: g.name }))}
                                    value={filters.gender?.$in ? filters.gender.$in.map(g => ({ value: g, label: g })) : []}
                                    onChange={(selected) => {
                                        let fil = { ...filters };
                                        if (selected?.length) fil.gender = { $in: selected.map(s => s.value) };
                                        else { fil = Object.fromEntries(Object.entries(fil).filter(([k]) => k !== 'gender')); }
                                        setFilters(fil);
                                    }}
                                />
                            </Grid2>
                            <Grid2 size={{ xs: 12, sm: 3 }}>
                                <CreatableSelect
                                    placeholder="Filter By Sport ..."
                                    isClearable isMulti
                                    options={sport.map(s => ({ value: s.name, label: s.name }))}
                                    value={filters.sportUsedFor?.$in ? filters.sportUsedFor.$in.map(s => ({ value: s, label: s })) : []}
                                    onChange={(selected) => {
                                        let fil = { ...filters };
                                        if (selected?.length) fil.sportUsedFor = { $in: selected.map(s => s.value) };
                                        else { fil = Object.fromEntries(Object.entries(fil).filter(([k]) => k !== 'sportUsedFor')); }
                                        setFilters(fil);
                                    }}
                                />
                            </Grid2>
                            <Grid2 size={{ xs: 12, sm: 3 }}>
                                <CreatableSelect
                                    placeholder="Filter By Marketplace ..."
                                    isClearable isMulti
                                    options={marketplaces?.map(m => ({ value: m._id, label: m.name }))}
                                    value={filters.marketPlacesArray?.$in ? filters.marketPlacesArray.$in.map(m => ({ value: m, label: marketplaces.find(mkt => mkt._id.toString() === m.toString())?.name })) : []}
                                    onChange={(selected) => {
                                        let fil = { ...filters };
                                        if (selected?.length) fil.marketPlacesArray = { $in: selected.map(s => s.value) };
                                        else { fil = Object.fromEntries(Object.entries(fil).filter(([k]) => k !== 'marketPlacesArray')); }
                                        setFilters(fil);
                                    }}
                                />
                            </Grid2>
                            <Grid2 size={12}>
                                <Button fullWidth variant="contained" onClick={() => applyFilters()}>Apply Filters</Button>
                            </Grid2>
                        </Grid2>
                    )}
                </Box>
                
                <Grid2 container spacing={2}>
                    {products.length === 0 && <Typography sx={{ textAlign: "center", width: "100%", fontWeight: "bold", fontSize: "1.5rem" }}>No products found</Typography>}
                    {products.map((p, i) => {
                        return <ProductCard 
                            key={p._id} 
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
                            marketPlaces={marketplaces}
                            setNFProduct={setNFProduct}
                            setStart={setStart}
                            source={source}
                            printTypes={printTypes}
                            licenses={licenses}
                        />
                    })}
                </Grid2>
                <Stack spacing={2} sx={{ margin: "1% 0%", display: "flex", alignItems: "center" }}>
                    <Pagination count={Math.ceil((count || 0) / 24)} page={page} onChange={handlePageChange} shape="rounded" showFirstButton showLastButton />
                </Stack>
                <CreateProductModal open={createProduct} setOpen={setCreateProduct} product={selectedProduct} setProduct={setSelectedProduct} blanks={blanks} design={des} setDesign={setDesign} updateDesign={updateDesign} colors={colors} imageGroups={imageGroups} brands={bran} genders={gen} seasons={seas} setBrands={setBrands} setGenders={setGenders} setSeasons={setSeasons} CreateSku={CreateSku} source={source} loading={loading} setLoading={setLoading} preview={preview} setPreview={setPreview} themes={them} sportUsedFor={sport} setThemes={setThemes} setSportUsedFor={setSportUsedFor} pageProducts={products} setPageProducts={setProducts} printTypes={printTypes} licenses={licenses} />
                <MarketplaceModal open={marketplaceModal} setOpen={setMarketplaceModal} product={selectedProduct} setProduct={setSelectedProduct} marketPlaces={market} setMarketPlaces={setMarketPlaces} sizes={blanks.map(b => {return b.sizes.map(s => {return s.name})})} design={des} setDesign={setDesign} source={source} setProducts={setProducts} products={products} canManage={canManageMarketplaces} />
                <CreateNFProduct open={NFProduct} setOpen={setNFProduct} stage={start} setStage={setStart} product={selectedProduct} setProduct={setSelectedProduct} setProducts={setProducts} brands={brands} setBrands={setBrands} seasons={seasons} setSeasons={setSeasons} genders={genders} setGenders={setGenders} CreateSku={CreateSku} themes={themes} setThemes={setThemes} sportUsedFor={sportsUsedFor} setSportUsedFor={setSportUsedFor} />
            </Container>
            <Footer />
            {loading && <LoaderOverlay />}
        </Box>
    );
};
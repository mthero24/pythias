import { Box, Grid2, TextField, Modal, Button, Typography, Card, Container, IconButton, Divider, Checkbox, FormControlLabel, CircularProgress } from "@mui/material";
import DeleteIcon from '@mui/icons-material/Delete';
import DeleteModel from "../reusable/DeleteModal";
import axios from "axios";
import {useState, useEffect, use} from "react";
import CloseIcon from '@mui/icons-material/Close';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import EditNoteIcon from '@mui/icons-material/EditNote';
import Link from "next/link";
import { connect, set } from "mongoose";

export const csvFunctions = {
    productSku: (product) => {
        return product.sku ? product.sku : product.name.replace(/ /g, "-").toLowerCase();
    },
    productTitle: (product) => {
        return product.title ? product.title : product.sku;
    },
    productCategory: (product) => {
        return product.category ? product.category : "N/A";
    },
    productDescription: (product) => {
        return product.description ? product.description : "";
    },
    productDescriptionHtml: (product) => {
        return product.description ? `<p>${product.description}</p>` : "";
    },
    productTags: (product) => {
        return product.tags ? product.tags.join(", ") : "N/A";
    },
    productVendor: (product) => {
        return product.brand ? product.brand : "N/A";
    },
    productBrand: (product) => {
        return product.brand ? product.brand : "N/A";
    },
    productTheme: (product) => {
        return product.theme ? product.theme : "N/A";
    },
    productSportUsedFor: (product) => {
        return product.sportUsedFor ? product.sportUsedFor : "N/A";
    },
    variantColor: (variant, sizeConverer, numBlanks, blankName) => {
        return variant.color ? numBlanks > 1 ? `${variant.color.name} (${blankName})` : variant.color.name : "";
    },
    variantSize: (variant, sizeConverter) => {
        return variant.size ? sizeConverter[variant.size.name] ? sizeConverter[variant.size.name] : "" : "";
    },
    variantThreadColor: (variant) => {
        return variant.threadColor ? variant.threadColor.name : "N/A";
    },
    variantSku: (variant) => {
        return variant.sku ? variant.sku : ""
    },
    variantPrice: (variant) => {
        return variant.size ? `$${variant.size.retailPrice?.toFixed(2)}` : 0;
    },
    variantWeight: (variant) => {
        return variant.size ? `${variant.size.weight?.toFixed(2)}` : 0;
    },
    variantUpc: (variant) => {
        return variant.upc ? variant.upc : "N/A";
    },
    variantGtin: (variant) => {
        return variant.upc ? variant.upc : "N/A";
    },
    variantMarketPlaceId: (variant, sizeConverter, numBlanks, blankName, connection) => {
        //console.log("variant", variant, "connection", connection);
        if (variant.ids && variant.ids[connection]) {
            return variant.ids[connection];
        }
        return "N/A";
    },
    productMarketPlaceId: (product, index, connection) => {
       // console.log("product", product, "connection", connection);
        if (product.ids && product.ids[connection]) {
            return product.ids[connection];
        }
        return "N/A";
    },
    productImage: (product, index) => {
        if (product.productImages && product.productImages.length > index && product.productImages[index] && product.productImages[index].image) {
            return product.productImages[index].image;
        }
        return "N/A";
    },
    productImageAlt: (product) => {
        return product.name;
    },
    productGender: (product) => {
        return product.gender ? product.gender : "N/A";
    },
    productSeason: (product) => {
        return product.season ? product.season : "N/A";
    },
    variantImage: (variant, color, blankCode) => {
        return variant.image ? variant.image : "N/A";
    },
    variantImages: (variant, sizeConverter, numBlanks, blankName, index) => {
       //console.log("variant", variant.images, "index", index);
        return variant.images && variant.images.length > index ? variant.images[index] : "N/A";
    },
    variantColorFamily: (variant) => {
        return variant.color && variant.color.colorFamily ? variant.color.colorFamily : "N/A";
    }
};

export const MarketplaceModal = ({ open, setOpen, marketPlaces, setMarketPlaces, sizes, blank, setBlank, product, setProduct, design, setDesign, source, products, setProducts }) => {
    const [size, setSize] = useState([]);
    const [deleteModal, setDeleteModal] = useState(false);
    const [deleteTitle, setDeleteTitle] = useState();
    const [deleteFunction, setDeleteFunction] = useState({});
    const [deleteImage, setDeleteImage] = useState();
    const [marketplace, setMarketplace] = useState({ name: "", headers: [[]], defaultValues: {}, sizes: {} });
    const [connections, setConnections] = useState([]);
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        let sizeArray = [];
        for(let sizeArr of sizes? sizes : []) {
            for(let size of sizeArr) {
                if(!sizeArray.includes(size)) {
                    sizeArray.push(size);
                }
            }
        }
        setSize(sizeArray);
        const getConnections = async () => {
            //console.log("getConnections called");
            //console.log("source", source);
            let res = await axios.get("/api/admin/integrations", { params: { provider: source.includes("test")? "pythias-test": source } });
            //console.log(res.data);
            if(res.data && res.data.integration) {
                setLoading(true);
                //console.log("Connections found:", res.data.integration);
                let connections = res.data.integration ? res.data.integration : [];
                if (product && product.marketPlacesArray && product.marketPlacesArray.length > 0) {
                    let mp = marketPlaces.filter(m => product.marketPlacesArray.map(mp => mp._id ? mp._id.toString() : mp.toString()).includes(m._id.toString()));
                    if (mp) {
                        //console.log("Marketplace found in product:", mp);
                        //console.log("connections", connections);
                        let prod = {...product}
                        for (let m of mp) {
                            //console.log(m, "Marketplace in connections");
                            for( let c of connections) {
                                //console.log(c, "Connection in connections");
                                if (c.displayName.toLowerCase().includes("acenda") && m.connections && m.connections.includes(c._id.toString())) {
                                    //console.log("Marketplace connection found:", c);
                                    let res = await axios.post("/api/integrations/acenda", { connection: c, product });
                                    //console.log(res, "Response from Acenda integration");
                                    prod = res.data.product;
                                }
                            }
                        }
                        setProduct({...prod});
                    }
                }
                setLoading(false);
            }
            setConnections(res.data.integration);
        }
        if(open) {
            getConnections();
        }
    }, [open]);
    useEffect(() => {
        let preCacheImages = async () => {
            if (product && product.productImages && product.productImages.length > 0) {
                for (let image of product.productImages) {
                    if (image.image) {
                        try {
                            await axios.get(image.image.replace("=400", "=2400"));
                            //console.log("Pre-caching product image:", image.image);
                        } catch (error) {
                            console.error("Error pre-caching image:", error);
                        }
                    }
                }
            }
            if(product.variantsArray && product.variantsArray.length > 0) {
                for (let variant of product.variantsArray) {
                    if (variant.images && variant.images.length > 0) {
                        for (let image of variant.images) {
                            if (image) {
                                try {
                                    await axios.get(image.replace("=400", "=2400"));
                                    //console.log("Pre-caching variant image:", image);
                                } catch (error) {
                                    console.error("Error pre-caching variant image:", error);
                                }
                            }
                        }
                    }
                    if(variant.image) {
                        try {
                            await axios.get(variant.image.replace("=400", "=2400"));
                            //console.log("Pre-caching variant image:", variant.image);
                        } catch (error) {
                            console.error("Error pre-caching variant image:", error);
                        }
                    }
                }
            }
        }
        preCacheImages();
    },[product]);
    const [addMarketPlace, setAddMarketPlace] = useState(false);
    const style = {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: "90%",
        height: "90%",
        bgcolor: 'background.paper',
        border: '2px solid #000',
        boxShadow: 24,
        p: 4,
        overflowX: "auto",
        overflowY: "none",
    };
    const checkForIds = async ({ product }) => {
        //console.log("checkForIds product:", product);
        setLoading(true);
        if (product) {
            if (product && product.marketPlacesArray && product.marketPlacesArray.length > 0) {
                let mp = marketPlaces.filter(m => product.marketPlacesArray.map(mp => mp._id ? mp._id.toString() : mp.toString()).includes(m._id.toString()));
                //console.log("checkForIds mp:", mp);
                if (mp) {
                    //console.log("Marketplace found in product:", mp);
                   // console.log("connections", connections);
                    let prod = { ...product }
                    for (let m of mp) {
                       // console.log(m, "Marketplace in connections");
                        for (let c of connections) {
                            //console.log(c, "Connection in connections");
                            if (c.displayName.toLowerCase().includes("acenda") && m.connections && m.connections.includes(c._id.toString())) {
                               // console.log("Marketplace connection found:", c);
                                let res = await axios.post("/api/integrations/acenda", { connection: c, product });
                               // console.log(res, "Response from Acenda integration");
                                prod = res.data.product;
                            }
                        }
                    }
                    setProduct({ ...prod });
                    if(products && products.length > 0) {
                        let updatedProducts = products.map(p => {
                            if (p._id.toString() === product._id.toString()) {
                                return { ...prod };
                            }
                            return p;
                        });
                        setProducts(updatedProducts);
                    }
                }
            }
            setLoading(false);
        }
    }
    return (
        <Modal
            open={open}
            onClose={() => setOpen(false)}
            aria-labelledby="modal-modal-title"
            aria-describedby="modal-modal-description"
        >
            <Box sx={style}>
                { loading && <Box sx={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}><CircularProgress /></Box>}
                {!loading && (
                    <Box>
                        <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "flex-end", alignItems: "center", padding: "1%", cursor: "pointer", "&:hover": { opacity: .6 } }} onClick={() => setOpen(false)}>
                            <CloseIcon sx={{ color: "#780606" }} />
                        </Box>
                        <Typography id="modal-modal-title" textAlign={"center"} variant="h6" component="h2">
                            Add Product to Marketplace
                        </Typography>
                        <Box>
                            <Box sx={{ maxHeight: "60vh", overflowY: "auto" }}>
                                <Button variant="outlined" sx={{ margin: "1% 2%", color: "#0f0f0f" }} onClick={() => { setMarketplace({ name: "", headers: [[]], defaultValues: {}, sizes: {} }); setAddMarketPlace(true);}}>Create MarketPlace</Button>
                            </Box>
                            <Box sx={{width: "100%", overflow: "auto", display: "flex", flexDirection: "row", justifyContent: "flex-start", gap: "2%", alignItems: "center", padding: "1%" }}>
                                {marketPlaces && marketPlaces.map((mp, i) => {
                                    if(connections && connections.length > 0){
                                        mp.connections = mp.connections.map(c=> {
                                            //console.log(c)
                                            let conn = connections?.filter(conn=> conn?._id.toString() == c.toString())[0]
                                            //console.log(conn)
                                            if(conn)return conn
                                            return c
                                        })
                                    }
                                    return (
                                        <Card key={`${mp._id}-i`} sx={{ padding: "1%", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", minWidth: "150px", width: "150px", minHeight: "150px" }} >
                                            <Typography variant="p" sx={{ textAlign: "center", marginBottom: "1%", textAlign: "center" }}>{mp.name}</Typography>
                                            <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", marginBottom: "1%" }}>
                                                <Button fullWidth size="small" variant="outlined" sx={{ margin: "1% 2%", color: "#0f0f0f" }} onClick={() => { setMarketplace(mp); setAddMarketPlace(true); }}>Edit</Button>
                                                {product &&<Button fullWidth size="small" variant="outlined" sx={{ margin: "1% 2%", color: "#0f0f0f" }} onClick={async ()=>{
                                                    let p = { ...product };
                                                    if (!p.marketPlacesArray) p.marketPlacesArray = [];
                                                    if (!p.marketPlacesArray.map(m => m._id ? m._id.toString() : m.toString()).includes(mp._id.toString())) p.marketPlacesArray.push(mp);
                                                    if(design){
                                                        let d ={ ...design };
                                                        d.products = d.products.filter(pr => pr._id.toString() !== p._id.toString());
                                                        d.products.push(p);
                                                        setDesign({...d});
                                                    }
                                                    checkForIds({ product: p });
                                                   let res = await axios.post("/api/admin/products", { products: [p] }); 
                                                    setProduct({ ...p });
                                                    if (products && products.length > 0) {
                                                        let updatedProducts = products.map(prod => {
                                                            if (p._id.toString() === prod._id.toString()) {
                                                                return { ...p };
                                                            }
                                                            return prod;
                                                        });
                                                        setProducts(updatedProducts);
                                                    }
                                                }}>Select</Button>}
                                            </Box>
                                            
                                            {product && mp.connections && mp.connections.length > 0 && mp.connections.map((c, ci) => {
                                                console.log(product.marketPlacesArray, "marketplace array", mp, c)
                                                if (product.marketPlacesArray && product.marketPlacesArray.length > 0 && product.marketPlacesArray.filter(m=> m.toString() === mp._id.toString()[0])) {
                                                    return (
                                                        <Button key={`${c?._id}-ci`} fullWidth size="small" variant="outlined" sx={{ margin: "1% 2%", color: "#0f0f0f" }} onClick={async ()=>{
                                                            //console.log("Sending product to webhook for connection:", c);
                                                            if(c.displayName.includes("shopify")){
                                                            const headers = {
                                                                headers: {
                                                                    "Content-Type": "application/json",
                                                                    "Authorization": `Bearer ${c.accessToken}`
                                                                }
                                                            }
                                                            setLoading(true);
                                                            let res = await axios.post("http://localhost:59272/webhooks/products", {product, connection: c}, headers ).catch(e=> {
                                                                console.log(e, "error from webhook");
                                                                alert("Something Went Wron Please Try Again Later")
                                                                setLoading(false);
                                                            });
                                                            console.log(res, "res from webhook");
                                                            let p = { ...product };
                                                            if(res.data){
                                                                if(!p.ids) p.ids = {};
                                                                p.ids[c?.displayName] = res.data.productId;
                                                                for(let v of p.variantsArray){
                                                                    if(!v.ids) v.ids = {};
                                                                    v.ids[c?.displayName] = res.data.variantIds.filter(vId=> vId.sku === v.sku)[0]?.id;
                                                                }
                                                                let update = await axios.post("/api/admin/products", { products: [p] });
                                                                setProduct({...p});
                                                                if (products && products.length > 0) {
                                                                    let updatedProducts = products.map(prod => {
                                                                        if (p._id.toString() === prod._id.toString()) {
                                                                            return { ...p };
                                                                        }
                                                                        return prod;
                                                                    });
                                                                    setProducts(updatedProducts);
                                                                }
                                                                setLoading(false);
                                                            }else{
                                                                setLoading(false)
                                                            }
                                                        }
                                                    
                                                        }}>{product && product.ids && product?.ids[c?.displayName]? "Update": "Send"}</Button>
                                                    )
                                                    
                                                }
                                            })}
                                            {console.log("product.marketPlacesArray", product.marketPlacesArray && product.marketPlacesArray.filter(m => m.toString() === mp._id.toString())[0])}
                                            {product.marketPlacesArray && product.marketPlacesArray.filter(m=> m.toString() === mp._id.toString())[0] &&
                                                <Button key={mp._id} fullWidth size="small" color="warning" variant="outlined" sx={{ margin: "1% 2%", color: "#0f0f0f" }} onClick={async ()=>{
                                                    setLoading(true);
                                                    let p = { ...product };
                                                    console.log(p, "dssd")
                                                    if(mp.connections && mp.connections.length > 0) {
                                                        console.log("Removing connections from product:", mp.connections);
                                                    let shopifyConnections = mp.connections.filter(c => c.displayName.toLowerCase().includes("shopify"))[0];
                                                    if(shopifyConnections) {
                                                        const headers = {
                                                            headers: {
                                                                "Content-Type": "application/json",
                                                                "Authorization": `Bearer ${shopifyConnections.accessToken}`
                                                            }
                                                        }
                                                        setLoading(true);
                                                        if(p.ids && p.ids[shopifyConnections.displayName]) {
                                                            let res = await axios.post("http://localhost:59272/webhooks/product/delete", { id: p.ids && p.ids[shopifyConnections.displayName], connection: shopifyConnections }, headers).catch(e => {
                                                                console.log(e, "error from webhook");
                                                                alert("Something Went Wron Please Try Again Later")
                                                                setLoading(false);
                                                            });
                                                            if(p.ids && p.ids[shopifyConnections.displayName]) {
                                                                delete p.ids[shopifyConnections.displayName];
                                                            }
                                                            for(let v of p.variantsArray) {
                                                                if(v.ids && v.ids[shopifyConnections.displayName]) {
                                                                    delete v.ids[shopifyConnections.displayName];
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                                p.marketPlacesArray = p.marketPlacesArray.filter(m => m?.toString() !== mp?._id?.toString());
                                                console.log(p.marketPlacesArray, "on Remove")
                                                let res = await axios.post("/api/admin/products", { products: [p] });
                                                setProduct({...p});
                                                if (products && products.length > 0) {
                                                    let updatedProducts = products.map(prod => {
                                                        if (p._id.toString() === prod._id.toString()) {
                                                            return { ...p };
                                                        }
                                                        return prod;
                                                    });
                                                    setProducts([...updatedProducts]);
                                                }
                                                setLoading(false);
                                            }}>Remove</Button>}
                                        </Card>
                                    )
                                }
                            )}
                            </Box>
                            <Divider sx={{ margin: ".5% 0" }} />
                            <Typography variant="h6" sx={{ marginBottom: "1%" }}>Selected Marketplaces</Typography>
                            { product && product.marketPlacesArray && product.marketPlacesArray.length > 0 && marketPlaces.filter(m => product.marketPlacesArray.map(mp => (mp._id? mp._id.toString(): mp.toString())).includes(m._id.toString())).map((marketPlace) => {
                                    //console.log("market place connections", marketPlace.connections)
                                    if (connections && connections.length > 0) {
                                        marketPlace.connections = marketPlace.connections.map(c => {
                                            //console.log(c)
                                            let conn = connections?.filter(conn => conn?._id.toString() == c.toString())[0]
                                            //console.log(conn)
                                            if (conn) return conn
                                            return c
                                        })
                                    }
                                    return (
                                        <Box key={marketPlace._id}>
                                            {marketPlace.headers.map((header, index) => (
                                                <Box key={marketPlace._id + "-" + index} sx={{ display: "flex", flexDirection: "column", padding: "1%", borderBottom: "1px solid #eee", position: "relative", top: "-5%" }}>
                                                    <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "flex-end", alignItems: "center", position: "relative", }}>
                                                        {marketPlace.connections?.map(c => connections.filter(conn => conn._id.toString() === c.toString()).filter(c => c.displayName.toLowerCase().includes("acenda")[0])) && <Button variant="outlined" size="small" sx={{ margin: "1% 2%", color: "#0f0f0f" }} onClick={async () => {
                                                            let res = await axios.get("/api/integrations/acenda", { params: { connectionId: marketPlace.connections.map(c => connections.filter(conn => conn._id.toString() === c.toString()).filter(c => c.displayName.toLowerCase().includes("acenda"))[0])[0]?._id, productId: product._id } });
                                                        }}>Add Inventory</Button>}
                                                        <Button variant="outlined" size="small" sx={{ margin: "1% 2%", color: "#0f0f0f" }} href={`/api/download?marketPlace=${marketPlace._id}&product=${product._id}&header=${index}`} target="_blank">Download</Button>
                                                    </Box>
                                                    {marketPlace.connections?.filter(c => c?.displayName?.toLowerCase().includes("shopify"))[0] && <Card sx={{display: "flex", flexDirection: "column", padding: "5%"}}>
                                                        <Typography variant="h6" textAlign={"center"}>{marketPlace.connections?.filter(c => c?.displayName?.toLowerCase().includes("shopify"))[0].displayName}</Typography>
                                                        <Divider sx={{marginBottom: "2%"}} />
                                                        {product.ids && product.ids[marketPlace.connections?.filter(c => c?.displayName?.toLowerCase().includes("shopify"))[0].displayName] && <Typography>Shopify Id: {product.ids[marketPlace.connections?.filter(c => c?.displayName?.toLowerCase().includes("shopify"))[0].displayName]}</Typography>}
                                                        {product.ids && product.ids[marketPlace.connections?.filter(c => c?.displayName?.toLowerCase().includes("shopify"))[0].displayName] && product.variantsArray.map(v=>(
                                                            <Typography>{v.sku}: {v.ids && v.ids[marketPlace.connections?.filter(c => c?.displayName?.toLowerCase().includes("shopify"))[0].displayName]}</Typography>
                                                        ))}
                                                    </Card>}
                                                    {header.length > 0 && (
                                                        <MarketPlaceList marketPlace={marketPlace} header={header} addMarketPlace={addMarketPlace} products={[product]} productLine={marketPlace.hasProductLine ? marketPlace.hasProductLine[index] : false} />
                                                    )}
                                                </Box>
                                            ))}
                                        </Box>
                                    )
                                }
                            )}
                        </Box>
                        <AddMarketplaceModal open={addMarketPlace} setOpen={setAddMarketPlace} sizes={size} marketPlace={marketplace} setMarketPlace={setMarketplace} setDeleteModal={setDeleteModal} setDeleteTitle={setDeleteTitle} setDeleteImage={setDeleteImage} setOnDelete={setDeleteFunction} setMarketPlaces={setMarketPlaces} blank={blank} setBlank={setBlank} connections={connections} />
                        <DeleteModel open={deleteModal} setOpen={setDeleteModal} title={deleteTitle} onDelete={deleteFunction.onDelete} deleteImage={deleteImage} />
                    </Box>
                )}
            </Box>
        </Modal>
    )
}
export const MarketPlaceList = ({ marketPlace, header, addMarketPlace, products, productLine, connections }) => {
    let headers = {}
    for(let h of header) {
        headers[h.Label] = []
    }
    if(productLine) {
        for(let product of products){
            for (let b of product.blanks) {
                for (let h of Object.keys(headers)) {
                    let val = HeaderList({ product, mp: marketPlace, variant: {}, blankOverRides: product.blanks.filter(bl => bl.code == b.code)[0].marketPlaceOverrides ? product.blanks.filter(bl => bl.code == b.code)[0].marketPlaceOverrides[marketPlace.name] : [], headerLabel: h, color: "", blankCode: b.code, category: product.blanks.filter(bl => bl.code == b.code)[0].category[0], threadColor: "", numBlanks: product.blanks.length, blankName: b.name, type: "product" })
                    headers[h].push(val);
                }
            }
        }
    }
    for(let product of products) {
        let index = 0;
        if(product.threadColors && product.threadColors.length > 0) {
            for (let b of product.blanks) {
                for (let tc of product.threadColors) {
                    for (let c of product.colors) {
                        if (product.variantsArray.filter(v => v.blank.toString() == b._id.toString() && v.threadColor._id ? v.threadColor._id.toString() == tc._id.toString() : v.threadColor.toString() == tc._id.toString() && (v.color._id ? v.color._id.toString() : v.color.toString()) == c._id?.toString()).length > 0) {
                            for (let v of product.variantsArray.filter(v => v.blank.toString() == b._id.toString() && v.threadColor._id ? v.threadColor._id.toString() == tc._id.toString() : v.threadColor.toString() == tc._id.toString() && (v.color._id ? v.color._id.toString() : v.color.toString()) == c._id?.toString())) {
                                if (!v.size._id) v.size = b.sizes.filter(s => s._id.toString() == v.size)[0];
                                if (!v.color._id) v.color = c;
                                if (!v.threadColor._id) v.threadColor = tc;
                                //console.log(v, "variant in MarketPlaceList");
                                for (let h of Object.keys(headers)) {
                                    let val = HeaderList({ product, mp: marketPlace, variant: v, blankOverRides: product.blanks.filter(bl => bl.code == b.code)[0].marketPlaceOverrides ? product.blanks.filter(bl => bl.code == b.code)[0].marketPlaceOverrides[marketPlace.name]: [], headerLabel: h, index: index, color: c.name, blankCode: b.code, category: product.blanks.filter(bl => bl.code == b.code)[0].category[0], threadColor: tc.name, numBlanks: product.blanks.length, blankName: b.name, })
                                    headers[h].push(val);
                                }
                                index++;
                            }
                        }

                    }
                }
            }
        }else{
        // console.log(product, "product")
            for(let b of product.blanks) {
                for(let c of product.colors) {
                    //console.log(product.variantsArray)
                    if (product.variantsArray.filter(v => v.blank.toString() == b._id.toString() && (v.color._id ? v.color._id.toString() : v.color.toString()) == c._id.toString()).length > 0) {
                        for (let v of product.variantsArray.filter(v => v.blank.toString() == b._id.toString() && (v.color._id? v.color._id.toString(): v.color.toString()) == c._id.toString())) {
                            if (v.size && !v.size._id)v.size = b.sizes.filter(s => s._id.toString() == v.size)[0];
                            if(!v.color._id) v.color = c;
                            for(let h of Object.keys(headers)) {
                                let val = HeaderList({ product, mp: marketPlace, variant: v, blankOverRides: product.blanks.filter(bl => bl.code == b.code)[0]?.marketPlaceOverrides ? product.blanks.filter(bl => bl.code == b.code)[0]?.marketPlaceOverrides[marketPlace.name] : {}, headerLabel: h, index: index, color: c.name, blankCode: b.code, category: product.blanks.filter(bl => bl.code == b.code)[0]?.category[0], numBlanks: product.blanks.length, blankName: b.name })
                                headers[h].push(val);
                            }
                            index++;
                        }
                    }

                }
            }
        }
    }
    return (
        <Card sx={{ padding: "2%" }} >
            <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: "0% 1%" }}>
                <Typography variant="h6" sx={{ textAlign: "center", marginBottom: "1%", textAlign: "center" }}>{marketPlace.name}</Typography>
            </Box>
            <Box sx={{ overflowY: "auto", marginTop: "2%", display: "flex", flexDirection: "row" }}>
                <Box sx={{ maxHeight: "60vh", overflowY: "auto", marginTop: "2%", display: "flex", flexDirection: "row" }}>
                    {!addMarketPlace && Object.keys(headers).map((header, hIndex) => (
                        <Box key={`${header}-${hIndex}`} sx={{ minWidth: "30%", textAlign: "center" }}>
                            <Box sx={{ display: "flex", minWidth: "100%", justifyContent: "space-between", padding: "3%", border: "1px solid #eee" }}>
                                <Typography variant="body1" sx={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", padding: "2%" }} title={header}>{header}</Typography>
                            </Box>
                            {headers[header].map((value, index) => (
                                <Box key={index} sx={{ display: "flex", minWidth: "100%", justifyContent: "space-between", padding: "3%", border: "1px solid #eee" }}>
                                    <Typography variant="body1" sx={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", minHeight: "22px" }} title={value}>{value}</Typography>
                                </Box>
                            ))}
                        </Box>
                    ))}
                </Box>
            </Box>
        </Card>
    ); 
}

export const HeaderList = ({ product, mp, variant, blankOverRides, headerLabel, index, color, blankCode, threadColor, category, numBlanks, blankName, type }) => {

    let value = "N/A";
    if(type && type == "product") {
        if (mp.productDefaultValues[headerLabel] && headerLabel == "id") {
            //console.log(mp.productDefaultValues[headerLabel].split(",")[0], "mp.productDefaultValues[headerLabel].split(',')[0]");
           // console.log(csvFunctions[mp.productDefaultValues[headerLabel].split(",")[0]](product, index, mp.productDefaultValues[headerLabel].split(",")[1]));
            value = csvFunctions[mp.productDefaultValues[headerLabel].split(",")[0]](product, index, mp.productDefaultValues[headerLabel].split(",")[1]);
            //console.log(value, "value in HeaderList");
        }
        else if (mp.productDefaultValues && mp.productDefaultValues[headerLabel] && mp.productDefaultValues[headerLabel].includes("product") && csvFunctions[mp.productDefaultValues[headerLabel]]) {
            if (headerLabel == "Image Alt Text" && index >= product.productImages.length) {
                value = "N/A";
            }
            else value = csvFunctions[mp.productDefaultValues[headerLabel]](product, index, mp.productDefaultValues[headerLabel].split(",")[1]);
        }
        else if (mp.productDefaultValues && mp.productDefaultValues[headerLabel] && mp.productDefaultValues[headerLabel].includes("variant") && csvFunctions[mp.productDefaultValues[headerLabel].split(",")[0]]) {
            value = csvFunctions[mp.productDefaultValues[headerLabel].split(",")[0]](variant, mp.sizeConverter, numBlanks, blankName, mp.productDefaultValues[headerLabel].split(",")[1]);
        } else if (mp.productDefaultValues && mp.productDefaultValues[headerLabel] == "index") {
            if (index < product.productImages.length) {
                value = index + 1;
            }
        }
        else if (blankOverRides && blankOverRides[headerLabel]) {
            value = blankOverRides[headerLabel];
        } else if (headerLabel == "Category" || headerLabel == "Type") {
            value = category;
        } else if (mp.productDefaultValues && mp.productDefaultValues[headerLabel]) {
            value = mp.productDefaultValues[headerLabel];
            if (mp.productDefaultValues[headerLabel] == "Thread Color" && !threadColor) {
                value = "N/A";
            }
        }
    }
    else {
        if (mp.defaultValues && mp.defaultValues[headerLabel] && mp.defaultValues[headerLabel].includes("product") && csvFunctions[mp.defaultValues[headerLabel]]) {
            if (headerLabel == "Image Alt Text" && index >= product.productImages.length) {
                value = "N/A";
            }
            else value = csvFunctions[mp.defaultValues[headerLabel]](product, index);
        }
        else if (mp.defaultValues && mp.defaultValues[headerLabel] && mp.defaultValues[headerLabel].includes("variant") && csvFunctions[mp.defaultValues[headerLabel].split(",")[0]]) {
            value = csvFunctions[mp.defaultValues[headerLabel].split(",")[0]](variant, mp.sizeConverter, numBlanks, blankName, mp.defaultValues[headerLabel].split(",")[1]);
        } else if (mp.defaultValues && mp.defaultValues[headerLabel]== "index") {
            if(index < product.productImages.length) {
                value = index + 1;
            }
        }
        else if( blankOverRides && blankOverRides[headerLabel]) {
            value = blankOverRides[headerLabel];
        }else if(headerLabel == "Category" || headerLabel == "Type") {
            value = category;
        }else if (mp.defaultValues && mp.defaultValues[headerLabel]) {
            value = mp.defaultValues[headerLabel];
            if (mp.defaultValues[headerLabel] == "Thread Color" && !threadColor) {
                value = "N/A";
            }
        }
    }
    return value
}
const AddMarketplaceModal = ({ open, setOpen, sizes, marketPlace, setMarketPlace, setDeleteModal, setDeleteImage, setOnDelete, setDeleteTitle, setMarketPlaces, blank, setBlank, connections }) => {
    const [showSizeConverter, setShowSizeConverter] = useState(false);
    const [update, setUpdate] = useState(false);
    const [header, setHeader] = useState("");
    useEffect(() => {
        if (open ) {
            let sizeObj = {};
            for (let size of sizes) {
                sizeObj[size] = size;
            }
            let m = { ...marketPlace };
            m.sizeConverter = sizeObj;
            setMarketPlace({...m});
        }
    }, [open]);
    const style = {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: "90%",
        height: "90%",
        bgcolor: 'background.paper',
        border: '2px solid #000',
        boxShadow: 24,
        p: 4,
        overflowX: "auto",
        overflowY: "none",
    };
    const deleteCSV = (index) => {
        let m = { ...marketPlace };
        m.headers.splice(index, 1);
        setMarketPlace({ ...m });
    };
    const removeHeader = ({index, hIndex}) => {
        let m = { ...marketPlace };
        m.headers[index].splice(hIndex, 1);
        setMarketPlace({ ...m });
    }
    const createMarketplace = async () => {
        if (!marketPlace.name) {
            return alert("Please enter a marketplace name");
        }
        let res = await axios.post("/api/admin/marketplaces", {marketPlace, blank});
        if (res.data.error) {
            return alert("Error creating marketplace");
        }else {
           // console.log("res", res.data.marketPlaces);
            setMarketPlaces([...res.data.marketPlaces]);
            setOpen(false);
        }
    }
    return (
        <Modal
            open={open}
            onClose={() => setOpen(false)}
            aria-labelledby="modal-modal-title"
            aria-describedby="modal-modal-description"
        >
            <Box sx={style}>
                <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "flex-end", alignItems: "center", padding: "1%", cursor: "pointer", "&:hover": { opacity: .6 } }} onClick={() => setOpen(false)}>
                    <CloseIcon sx={{ color: "#780606" }} />
                </Box>
                <Container maxWidth="xl" sx={{ padding: "2%" }}>
                    <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", padding: "1%" }}>
                        <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "flex-start", alignItems: "center", marginLeft: "auto", width: "50%" }}>
                            <Typography id="modal-modal-title" variant="h4" component="h2">
                                {marketPlace._id ? "Update Marketplace" : "Create Marketplace"}
                            </Typography>
                        </Box>
                        <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "flex-end", alignItems: "center", marginLeft: "auto", width: "50%" }}>
                            <Button variant="outlined" sx={{ margin: "1% 2%", color: "#0f0f0f" }} onClick={() => {
                                let m = { ...marketPlace };
                                m.headers.push([]);
                                setMarketPlace({ ...m });
                            }}>Add CSV</Button>
                        </Box>
                    </Box>
                    <Box sx={{ mt: 2 }}>
                    <TextField
                            label="Marketplace Name"
                            variant="outlined"
                            fullWidth
                            value={marketPlace.name}
                            onChange={(e) => setMarketPlace({ ...marketPlace, name: e.target.value })}
                        />
                        <Typography variant="body1" sx={{ marginTop: "1%" }}>Select Connection:</Typography>
                        <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", overflowX: "auto", width: "100%" }}>
                            {connections && connections.length > 0 && connections.map((connection) => (
                                <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", marginTop: "1%", width: "20%", marginRight: "1%", padding: "1%", border: "1px solid #ccc", background: marketPlace.connections && marketPlace.connections.includes(connection._id.toString()) ? "#1976d2" : "#fff", color: marketPlace.connections && marketPlace.connections.includes(connection._id.toString()) ? "#fff" : "#000", "&:hover": { border: "1px solid #000", opacity: 0.8, cursor: "pointer" } }} key={connection._id} onClick={() => {
                                    let m = { ...marketPlace };
                                    if(!m.connections) m.connections = [];
                                    if(!m.connections.includes(connection._id.toString())) {
                                        m.connections.push(connection._id.toString());
                                    }else{
                                        m.connections = m.connections.filter(conn => conn !== connection._id.toString());
                                    }
                                   // console.log("marketPlace", m);
                                    setMarketPlace({ ...m });
                                }}>
                                    <Typography variant="body1" sx={{ marginRight: "1%" }}>{connection.displayName}</Typography>
                                </Box>
                            ))}
                        </Box>
                        {marketPlace.headers.map((header, index) => {
                            return(
                                <Card key={index} sx={{padding: "2%", margin: "1% 0%",}}>
                                    <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: ".5%" }}>
                                        <Box sx={{width: "50%" }}>
                                            <TextField placeholder="New Header" id={"newHeader"} />
                                            <Button variant="outlined" size="large" sx={{ margin: "1% 2%", color: "#0f0f0f" }} onClick={() => {
                                                let m = { ...marketPlace };
                                                m.headers[index].push({ id: document.getElementById("newHeader").value, Label: document.getElementById("newHeader").value });
                                                setMarketPlace({ ...m });
                                                document.getElementById("newHeader").value = "";
                                            }}>Add Header</Button>
                                            <FormControlLabel control={<Checkbox checked={marketPlace.hasProductLine ? marketPlace.hasProductLine[index] : false} onChange={(event)=>{
                                                //console.log(event.target.checked);
                                                let m = { ...marketPlace };
                                                if(!m.hasProductLine) m.hasProductLine = [];
                                                m.hasProductLine[index] = event.target.checked;
                                                setMarketPlace({ ...m });
                                            }} />} label="Add Product Line" />
                                        </Box>
                                         <IconButton onClick={() => {
                                            setDeleteImage(index);
                                            setOnDelete({onDelete: deleteCSV});
                                            setDeleteTitle("Are you sure you want to delete this CSV?");
                                           setDeleteModal(true);
                                        }}>
                                            <DeleteIcon sx={{ color: "#780606" }} />
                                        </IconButton>
                                    </Box>
                                    <Box sx={{ maxHeight: "60vh", overflowY: "auto", marginTop: "2%", display: "flex", flexDirection: "row", alignItems: "center" }}>
                                        {header.map((header, hIndex) => (
                                            <Box key={hIndex} sx={{ minWidth: "30%" }}>
                                                <Box sx={{ display: "flex", minWidth: "100%", justifyContent: "space-between", alignItems: "center", padding: "1%", border: "1px solid #eee" }}>
                                                    <IconButton>
                                                        <EditNoteIcon sx={{ color: "#0F0F0F" }}  onClick={() => {
                                                            setUpdate(true);
                                                            setHeader({ label: header.Label, index, hIndex});
                                                        }}/>
                                                    </IconButton>
                                                    <Typography variant="body1" sx={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={header.Label}>{header.Label}</Typography>
                                                    <IconButton onClick={() => {
                                                        setDeleteImage({ index, hIndex });
                                                        setOnDelete({ onDelete: removeHeader });
                                                        setDeleteTitle("Are you sure you want to remove this header?");
                                                        setDeleteModal(true);
                                                        
                                                    }}>
                                                        <DeleteIcon sx={{ color: "#780606" }} />
                                                    </IconButton>
                                                </Box>
                                                {marketPlace.hasProductLine && marketPlace.hasProductLine[index] && (
                                                    <Box sx={{ display: "flex", minWidth: "100%", justifyContent: "space-between", alignItems: "center", padding: "1%", border: "1px solid #eee" }}>
                                                        <TextField
                                                            label="Default Value"
                                                            variant="outlined"
                                                            fullWidth
                                                            value={blank && blank.marketPlaceOverrides && blank.marketPlaceOverrides[marketPlace.name] && blank.marketPlaceOverrides[marketPlace.name][header.id] ? blank.marketPlaceOverrides[marketPlace.name][header.id] : marketPlace.productDefaultValues ? marketPlace.productDefaultValues[header.id] : ""}
                                                            onChange={(e) => {
                                                                let m = { ...marketPlace };
                                                                if (blank) {
                                                                    let b = { ...blank };
                                                                    if (!b.marketPlaceOverrides) {
                                                                        b.marketPlaceOverrides = {};
                                                                    }
                                                                    if (!b.marketPlaceOverrides[marketPlace.name]) {
                                                                        b.marketPlaceOverrides[marketPlace.name] = {};
                                                                    }
                                                                    b.marketPlaceOverrides[marketPlace.name][header.id] = e.target.value;
                                                                    setBlank(b);
                                                                } else {
                                                                    if (!m.productDefaultValues) {
                                                                        m.productDefaultValues = {};
                                                                    }
                                                                    m.productDefaultValues[header.id] = e.target.value;
                                                                    setMarketPlace({ ...m });
                                                                }
                                                            }} />
                                                    </Box>
                                                )}
                                                <Box sx={{ display: "flex", minWidth: "100%", justifyContent: "space-between", alignItems: "center", padding: "1%", border: "1px solid #eee" }}>
                                                    <TextField
                                                        label="Default Value"
                                                        variant="outlined"
                                                        fullWidth
                                                        value={blank && blank.marketPlaceOverrides && blank.marketPlaceOverrides[marketPlace.name] && blank.marketPlaceOverrides[marketPlace.name][header.id] ? blank.marketPlaceOverrides[marketPlace.name][header.id]: marketPlace.defaultValues ? marketPlace.defaultValues[header.id] : ""}
                                                        onChange={(e) => {
                                                            let m = { ...marketPlace };
                                                            if(blank) {
                                                                let b = { ...blank };
                                                                if(!b.marketPlaceOverrides) {
                                                                    b.marketPlaceOverrides = {};
                                                                }
                                                                if(!b.marketPlaceOverrides[marketPlace.name]) {
                                                                    b.marketPlaceOverrides[marketPlace.name] = {};
                                                                }
                                                                b.marketPlaceOverrides[marketPlace.name][header.id] = e.target.value;
                                                                setBlank(b);
                                                            }else {
                                                                if(!m.defaultValues) {
                                                                    m.defaultValues = {};
                                                                }
                                                                m.defaultValues[header.id] = e.target.value;
                                                                setMarketPlace({ ...m });
                                                            }
                                                        }} />
                                                </Box>
                                            </Box>
                                        ))}
                                    </Box>
                                </Card>
                            )
                        })}
                        <Card>
                            <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: ".5%" }}>
                                <Typography variant="h6" sx={{ marginBottom: "1%", padding: "2%" }}>Size Name Converter</Typography>
                                <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", padding: ".5% 2%", cursor: "pointer", "&:hover": { opacity: .6 } }}>
                                    {showSizeConverter ? (
                                        <KeyboardArrowUpIcon onClick={() => setShowSizeConverter(false)} />
                                    ) : (
                                        <KeyboardArrowDownIcon onClick={() => setShowSizeConverter(true)} />
                                    )}
                                </Box>
                            </Box>
                            {showSizeConverter && (
                                <Container sx={{ marginTop: "2%" }}>
                                    <Box sx={{ display: "flex", flexDirection: "column", gap: "1%", justifyContent: "center", alignItems: "center", padding: "1%" }}>
                                        {Object.keys(marketPlace.sizeConverter ? marketPlace.sizeConverter : {}).map((sizeItem, index) => (
                                            <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
                                                <TextField
                                                    variant="outlined"
                                                    size="small"
                                                    value={sizeItem}
                                                    disabled
                                                />
                                                <Box sx={{ padding: "0 10px", fontSize: "14px" }}>:</Box>
                                                <TextField
                                                    variant="outlined"
                                                    size="small"
                                                    value={marketPlace.sizeConverter[sizeItem]}
                                                    onChange={(e) => {
                                                        let m = { ...marketPlace };
                                                        m.sizeConverter[sizeItem] = e.target.value;
                                                        setMarketPlace({ ...m });
                                                    }}
                                                />
                                            </Box>
                                        ))}
                                    </Box>
                                </Container>
                            )}
                        </Card>
                        
                        <Box sx={{ display: "flex", justifyContent: "flex-end", marginTop: "2%" }}>
                            <Button variant="contained" color="primary" onClick={() => {
                                createMarketplace();
                            }}>
                                {marketPlace._id ? "Update Marketplace" : "Create Marketplace"}
                            </Button>
                        </Box>
                    </Box>
                </Container>
                <UpdateModal open={update} setOpen={setUpdate} ori={header} marketPlace={marketPlace} setMarketPlace={setMarketPlace} />
            </Box>
        </Modal>
    )
}

function UpdateModal({ open, setOpen, ori, marketPlace, setMarketPlace }) {
    const [loading, setLoading] = useState(false);
    const [newHeader, setNewHeader] = useState(ori.label);
    const updateHeader = async () => {
        let m = { ...marketPlace };
        m.headers[ori.index][ori.hIndex]= { id: newHeader, Label: newHeader };
        setMarketPlace({ ...m });
        setNewHeader("");
        setLoading(false);
        setOpen(false);
        
    }

    return (
        <Modal open={open} onClose={() => setOpen(false)}>
            <Box sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 500,
                bgcolor: 'background.paper',
                boxShadow: 24,
                p: 4,
                borderRadius: 2
            }}>
                <Typography variant="h6" component="h2" gutterBottom>
                    Update Header Name
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <TextField
                        label="New Header Name"
                        id="newHeader"
                        value={newHeader}
                        onChange={(e) => setNewHeader(e.target.value)}
                    />
                    <Box>
                        <Button variant="contained" color="error" disabled={loading} onClick={() => updateHeader()}>
                            {loading ? "Updating..." : "Update"}
                        </Button>
                        <Button variant="outlined" onClick={() => setOpen(false)} startIcon={<CloseIcon />}>
                            Cancel
                        </Button>
                    </Box>
                </Box>
            </Box>
        </Modal>
    );
}
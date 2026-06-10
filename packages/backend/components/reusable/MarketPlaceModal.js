import { Box, Grid2, TextField, Modal, Button, Typography, Card, Container, IconButton, Divider, Checkbox, FormControlLabel, Chip, Dialog, DialogTitle, DialogContent, DialogActions, Snackbar, Alert } from "@mui/material";
import LoaderOverlay from "./LoaderOverlay";
import DeleteIcon from '@mui/icons-material/Delete';
import DeleteModel from "../reusable/DeleteModal";
import axios from "axios";
import {useState, useEffect} from "react";
import CloseIcon from '@mui/icons-material/Close';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import EditNoteIcon from '@mui/icons-material/EditNote';
import Link from "next/link";

export const csvFunctions = {
    productSku: (product) => {
        return product.sku ? product.sku : product.name.replace(/ /g, "-").toLowerCase();
    },
    productTitle: (product, index, mp, variant) => {
        let title = product.title ? product.title : product.sku;
        if (mp?.name?.toLowerCase().includes("kohl's") && title && title.length > 100) title = title.slice(0, 100);
        if (mp?.name?.toLowerCase().includes("zulily") && variant?.color) {
            const parts = [
                title,
                product.brand,
                product.gender,
                product.category,
                variant.size?.name,
                variant.color?.name,
            ].filter(Boolean);
            return parts.join(" ");
        }
        if (mp?.variantTitle && variant?.color) {
            const parts = [title];
            if (variant.color?.name) parts.push(variant.color.name);
            if (variant.size?.name) parts.push(variant.size.name);
            return parts.join(" - ");
        }
        return title;
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
        return variant.color ? numBlanks > 1 ? `${variant.color.name}` : variant.color.name : "";
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
    variantMarketPlaceId: (variant, sizeConverter, numBlanks, blankName, index, connection) => {
        if (variant.ids && variant.ids[connection?.toLowerCase().includes("target")? "acenda": connection]) {
            return variant.ids[connection?.toLowerCase().includes("target") ? "acenda" : connection];
        }
        return "N/A";
    },
    productMarketPlaceId: (product, index, name) => {
        if (product.ids && product.ids[name?.toLowerCase().includes("target")? "acenda": name]) {
            return product.ids[name.toLowerCase().includes("target")? "acenda": name];
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
    variantImages: (variant, sizeConverter, numBlanks, blankName, index, connection, colorFamilyConverter, sizeGuide) => {
        //console.log(sizeGuide, "sizeGuide in variantImages");
        return variant.images && variant.images.length > index ? variant.images[index] : sizeGuide && sizeGuide.length > 0 && sizeGuide[index - variant.images.length] ? sizeGuide[index - variant.images.length] : "N/A";
    },
    variantColorFamily: (variant, sizeConverter, numBlanks, blankName, index, connection, colorFamilyConverter) => {
        return variant.color && variant.color.colorFamily ? colorFamilyConverter && colorFamilyConverter[variant.color.colorFamily] ? colorFamilyConverter[variant.color.colorFamily] : variant.color.colorFamily : "N/A";
    }
};



const RemoveMarketPlaceModal = ({ open, setOpen, mp, removeMarketplaceConnection }) => {
    const style = {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: "35%",
        height: "20%",
        bgcolor: 'background.paper',
        border: '2px solid #000',
        boxShadow: 24,
        p: 4,
        overflowX: "auto",
        overflowY: "none",
    };

    return (
        <Modal
            open={open}
            onClose={() => setOpen(false)}
            aria-labelledby="remove-marketplace-modal-title"
            aria-describedby="remove-marketplace-modal-description"
        >
            <Box sx={style}>
                <Typography id="remove-marketplace-modal-title" variant="h6" component="h2">
                    Remove Marketplace Connection
                </Typography>
                <Typography id="remove-marketplace-modal-description" sx={{ mt: 2, marginBottom: "2%" }}>
                    Are you sure you want to remove the connection to {mp.name}?
                </Typography>
                <Button variant="outlined" color="error" sx={{width: "50%", padding: "1%"}} onClick={() => removeMarketplaceConnection({mp})}>
                    Remove
                </Button>
                <Button variant="outlined" color="primary" sx={{ width: "50%", padding: "1%" }} onClick={() => setOpen(false)}>
                    Cancel
                </Button>
            </Box>
        </Modal>
    )
}

export const MarketplaceModal = ({ open, setOpen, marketPlaces, setMarketPlaces, sizes, blank, setBlank, product, setProduct, design, setDesign, source, orgId, products, setProducts, canManage, canEdit }) => {
    const [size, setSize] = useState([]);
    const [deleteModal, setDeleteModal] = useState(false);
    const [deleteTitle, setDeleteTitle] = useState();
    const [deleteFunction, setDeleteFunction] = useState({});
    const [deleteImage, setDeleteImage] = useState();
    const [marketplace, setMarketplace] = useState({ name: "", headers: [[]], defaultValues: {}, sizes: {} });
    const [connections, setConnections] = useState([]);
    const [tiktokAuth, setTiktokAuth] = useState([]);
    const [loading, setLoading] = useState(false);
    const [openRemoveModal, setOpenRemoveModal] = useState(false);
    const [confirmDeleteMp, setConfirmDeleteMp] = useState(null);
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
            console.log("getConnections called");
            const integrationParams = orgId
                ? { orgId }
                : { provider: source.includes("test") ? "pythias-test" : source === "simplysage" ? "premierPrinting" : source };
            let res = await axios.get("/api/admin/integrations", { params: integrationParams });
            console.log(res?.data, "res in getConnections");
            if(res.data && res.data.integration) {
                setLoading(true);
                let connections = res.data.integration ? res.data.integration : [];
                if (product && product.marketPlacesArray && product.marketPlacesArray.length > 0) {
                    let mp = marketPlaces.filter(m => product.marketPlacesArray.map(mp => mp._id ? mp._id.toString() : mp.toString()).includes(m._id.toString()));
                    //console.log(mp, "mp")
                    if (mp) {
                        //console.log("here")
                        let prod = {...product}
                        for (let m of mp) {
                            //console.log("here")
                            for( let c of connections) {
                               // console.log(c, "c", m.connections)
                                if (c.displayName?.toLowerCase().includes("acenda") && m.connections && (m.connections.includes(c._id.toString()) || m.connections.filter(co=> co._id?.toString() == c._id?.toString())[0])) {
                                    //console.log("here")
                                    try {
                                        let res = await axios.post("/api/integrations/acenda", { connection: c, product });
                                        prod = res.data.product;
                                    } catch (e) {
                                        console.error("Acenda sync error:", e);
                                    }
                                }
                            }
                        }
                        setProduct({...prod});
                    }
                }
                setConnections(res.data.integration);
                setLoading(false);
            }
            if(res.data && res.data.tiktokAuth) {
                setTiktokAuth(res.data.tiktokAuth);
            }
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
                        } catch (error) {
                            console.warn("pre-cache image failed:", error?.message);
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
                                } catch (error) {
                                    console.error("Error pre-caching variant image:", error);
                                }
                            }
                        }
                    }
                    if(variant.image) {
                        try {
                            await axios.get(variant.image.replace("=400", "=2400"));
                        } catch (error) {
                            console.warn("pre-cache variant image failed:", error?.message);
                        }
                    }
                }
            }
        }
        preCacheImages();
    },[product]);
    const checkForIds = async ({ product }) => {
        setLoading(true);
        if (product) {
            if (product && product.marketPlacesArray && product.marketPlacesArray.length > 0) {
                let mp = marketPlaces.filter(m => product.marketPlacesArray.map(mp => mp._id ? mp._id.toString() : mp.toString()).includes(m._id.toString()));
                if (mp) {
                    let prod = { ...product }
                    for (let m of mp) {
                        for (let c of connections) {
                            if (c.displayName?.toLowerCase().includes("acenda") && m.connections && m.connections.includes(c._id.toString())) {
                                let res = await axios.post("/api/integrations/acenda", { connection: c, product });
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
    const removeMarketplaceConnection = async ({mp, }) => {
        setLoading(true);
        let p = { ...product };
        if (mp.connections && mp.connections.length > 0) {
            let shopifyConnections = mp.connections.filter(c => c.displayName?.toLowerCase().includes("shopify"))[0];
            if (shopifyConnections) {
                const headers = {
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${shopifyConnections.apiKey}`
                    }
                }
                setLoading(true);
                if (p.ids && p.ids[shopifyConnections.displayName]) {
                    let res = await axios.post("/api/integrations/shopify/delete", { id: p.ids && p.ids[shopifyConnections.displayName], connection: shopifyConnections }, headers).catch(e => {
                        alert("Something Went Wron Please Try Again Later")
                        setLoading(false);
                    });
                    if (p.ids && p.ids[shopifyConnections.displayName]) {
                        delete p.ids[shopifyConnections.displayName];
                    }
                    for (let v of p.variantsArray) {
                        if (v.ids && v.ids[shopifyConnections.displayName]) {
                            delete v.ids[shopifyConnections.displayName];
                        }
                    }
                }
            }
        }
        p.marketPlacesArray = p.marketPlacesArray.filter(m => (m._id ? m._id.toString() : m?.toString()) !== mp?._id?.toString());
        let res = await axios.post("/api/admin/products", { products: [p] });
        setProduct({ ...p });
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
        setOpenRemoveModal(false);
        setMarketplace({ name: "", headers: [[]], defaultValues: {}, sizes: {} })
    }
    const deleteMarketplace = async (mp) => {
        try {
            await axios.delete("/api/admin/marketplaces", { data: { id: mp._id } });
            setMarketPlaces(prev => prev.filter(m => m._id.toString() !== mp._id.toString()));
            setConfirmDeleteMp(null);
        } catch {
            notify("error", "Failed to delete marketplace. Please try again.");
        }
    };
    const [addMarketPlace, setAddMarketPlace] = useState(false);
    const [sendMsg, setSendMsg] = useState(null); // { severity, text }

    const notify = (severity, text) => setSendMsg({ severity, text });

    // Extract the most descriptive error string from an axios error or a raw value
    const extractErr = (e, fallback) => {
        if (typeof e === "string") return e;
        const d = e?.response?.data;
        if (d?.error && typeof d.error === "string") return d.error;
        if (d?.msg   && typeof d.msg   === "string") return d.msg;
        return e?.message ?? fallback ?? "Something went wrong";
    };

    // Show error from a 200-OK body that still carries an error field
    const bodyErr = (data, marketplace) => {
        const msg = typeof data?.error === "string" ? data.error : (data?.msg ?? null);
        if (msg) notify("error", `${marketplace}: ${msg}`);
        return !!msg;
    };

    const sendToConnection = async (c, mpName, mp) => {
        if (c.displayName?.includes("shopify")) {
            setLoading(true);
            const res = await axios.post("/api/integrations/shopify/send", { product, connection: c }, { headers: { "Content-Type": "application/json", "Authorization": `Bearer ${c.apiKey}` } })
                .catch((e) => { notify("error", extractErr(e, "Something went wrong sending to Shopify.")); setLoading(false); });
            if (res?.data) {
                if (res.data.limitReached) {
                    notify("warning", `You've hit your daily listing limit for ${c.displayName}. The product has been added to the queue and will be processed tomorrow — it will update in the system automatically.`);
                } else if (bodyErr(res.data, "Shopify")) { /* error shown */
                } else {
                    let p = { ...product };
                    if (!p.ids) p.ids = {};
                    p.ids[c.displayName] = res.data.productId;
                    for (let v of p.variantsArray) { if (!v.ids) v.ids = {}; v.ids[c.displayName] = res.data.variantIds?.find(vId => vId.sku === v.sku)?.id; }
                    await axios.post("/api/admin/products", { products: [p] });
                    setProduct({ ...p });
                    if (products?.length) setProducts(products.map(prod => prod._id.toString() === p._id.toString() ? { ...p } : prod));
                }
            }
            setLoading(false);
        } else if (c.displayName?.toLowerCase().includes("etsy")) {
            setLoading(true);
            const existingListingId = product.ids?.[c.displayName];
            if (existingListingId) {
                const res = await axios.put("/api/admin/integrations/etsy", { product, connection: c, listingId: existingListingId })
                    .catch((e) => { notify("error", extractErr(e, "Something went wrong updating the Etsy listing.")); });
                if (res?.data && bodyErr(res.data, "Etsy")) { /* error shown */ }
            } else {
                const res = await axios.post("/api/admin/integrations/etsy", { product, connection: c })
                    .catch((e) => { notify("error", extractErr(e, "Something went wrong creating the Etsy listing.")); setLoading(false); });
                if (res?.data) {
                    if (bodyErr(res.data, "Etsy")) { /* error shown */ }
                    else {
                        let p = { ...product };
                        if (!p.ids) p.ids = {};
                        p.ids[c.displayName] = res.data.productId;
                        await axios.post("/api/admin/products", { products: [p] });
                        setProduct({ ...p });
                        if (products?.length) setProducts(products.map(prod => prod._id.toString() === p._id.toString() ? { ...p } : prod));
                    }
                }
            }
            setLoading(false);
        } else if (c.type === "faire") {
            setLoading(true);
            const res = await axios.post("/api/integrations/faire/send", { product, connectionId: c._id })
                .catch((e) => { notify("error", extractErr(e, "Something went wrong sending to Faire.")); setLoading(false); });
            if (res?.data) {
                if (bodyErr(res.data, "Faire")) { /* error shown */ }
                else {
                    let p = { ...product };
                    if (!p.ids) p.ids = {};
                    p.ids[c.displayName] = res.data.faireProductId;
                    await axios.post("/api/admin/products", { products: [p] });
                    setProduct({ ...p });
                    if (products?.length) setProducts(products.map(prod => prod._id.toString() === p._id.toString() ? { ...p } : prod));
                    notify("success", `Sent to Faire. Product ID: ${res.data.faireProductId}`);
                }
            }
            setLoading(false);
        } else if (c.type === "shein") {
            setLoading(true);
            const res = await axios.post("/api/integrations/shein/send", { product, connectionId: c._id })
                .catch((e) => { notify("error", extractErr(e, "Something went wrong sending to SHEIN.")); setLoading(false); });
            if (res?.data) {
                if (bodyErr(res.data, "SHEIN")) { /* error shown */ }
                else {
                    let p = { ...product };
                    if (!p.ids) p.ids = {};
                    p.ids[c.displayName] = res.data.sheinSpuName;
                    await axios.post("/api/admin/products", { products: [p] });
                    setProduct({ ...p });
                    if (products?.length) setProducts(products.map(prod => prod._id.toString() === p._id.toString() ? { ...p } : prod));
                    notify("success", `Sent to SHEIN. SPU Name: ${res.data.sheinSpuName}`);
                }
            }
            setLoading(false);
        } else if (c.type === "temu") {
            setLoading(true);
            const res = await axios.post("/api/integrations/temu/send", { product, connectionId: c._id })
                .catch((e) => { notify("error", extractErr(e, "Something went wrong sending to Temu.")); setLoading(false); });
            if (res?.data) {
                if (bodyErr(res.data, "Temu")) { /* error shown */ }
                else {
                    let p = { ...product };
                    if (!p.ids) p.ids = {};
                    p.ids[c.displayName] = res.data.goodsId;
                    await axios.post("/api/admin/products", { products: [p] });
                    setProduct({ ...p });
                    if (products?.length) setProducts(products.map(prod => prod._id.toString() === p._id.toString() ? { ...p } : prod));
                    notify("success", `Sent to Temu. Goods ID: ${res.data.goodsId}`);
                }
            }
            setLoading(false);
        } else if (c.type === "walmart") {
            setLoading(true);
            const res = await axios.post("/api/integrations/walmart/send", { product, connectionId: c._id })
                .catch((e) => {
                    notify("error", extractErr(e, "Something went wrong sending to Walmart."));
                    if (e.response?.data?.notAuthorized) {
                        const parentMp = marketPlaces.find(mp => mp.connections?.some(conn => (conn._id?.toString() ?? conn.toString()) === c._id.toString()));
                        if (parentMp) {
                            const p = { ...product };
                            p.marketPlacesArray = (p.marketPlacesArray ?? []).filter(m => (m._id ? m._id.toString() : m.toString()) !== parentMp._id.toString());
                            axios.post("/api/admin/products", { products: [p] }).then(() => {
                                setProduct({ ...p });
                                if (products?.length) setProducts(products.map(prod => prod._id.toString() === p._id.toString() ? { ...p } : prod));
                            });
                        }
                    }
                    setLoading(false);
                });
            if (res?.data) {
                if (bodyErr(res.data, "Walmart")) { /* error shown */ }
                else {
                    let p = { ...product };
                    if (!p.ids) p.ids = {};
                    p.ids[c.displayName] = res.data.feedId;
                    await axios.post("/api/admin/products", { products: [p] });
                    setProduct({ ...p });
                    if (products?.length) setProducts(products.map(prod => prod._id.toString() === p._id.toString() ? { ...p } : prod));
                    notify("success", `Sent to Walmart. Feed ID: ${res.data.feedId}`);
                }
            }
            setLoading(false);
        } else if (c.displayName?.toLowerCase().includes("acenda") || c.type === "acenda") {
            setLoading(true);
            const res = await axios.post("/api/integrations/acenda", { connectionId: c._id, product })
                .catch((e) => { notify("error", extractErr(e, "Something went wrong sending to Acenda.")); setLoading(false); });
            if (res?.data) {
                if (bodyErr(res.data, "Acenda")) { /* error shown */ }
                else {
                    const p = res.data.product;
                    setProduct({ ...p });
                    if (products?.length) setProducts(products.map(prod => prod._id.toString() === p._id.toString() ? { ...p } : prod));
                }
            }
            setLoading(false);
        } else if (c.type === "wix") {
            setLoading(true);
            const res = await axios.post("/api/integrations/wix/send", { product, connectionId: c._id })
                .catch((e) => { notify("error", extractErr(e, "Something went wrong sending to Wix.")); setLoading(false); });
            if (res?.data) {
                if (bodyErr(res.data, "Wix")) { /* error shown */ }
                else {
                    let p = { ...product };
                    if (!p.ids) p.ids = {};
                    p.ids[c.displayName] = res.data.wixProductId;
                    for (let v of p.variantsArray) { if (!v.ids) v.ids = {}; const wv = res.data.variantIds?.find(vi => vi.sku === v.sku); if (wv) v.ids[c.displayName] = wv.id; }
                    await axios.post("/api/admin/products", { products: [p] });
                    setProduct({ ...p });
                    if (products?.length) setProducts(products.map(prod => prod._id.toString() === p._id.toString() ? { ...p } : prod));
                }
            }
            setLoading(false);
        } else if (c.type === "woocommerce") {
            setLoading(true);
            const res = await axios.post("/api/integrations/woocommerce/send", { product, connectionId: c._id })
                .catch((e) => { notify("error", extractErr(e, "Something went wrong sending to WooCommerce.")); setLoading(false); });
            if (res?.data) {
                if (bodyErr(res.data, "WooCommerce")) { /* error shown */ }
                else {
                    let p = { ...product };
                    if (!p.ids) p.ids = {};
                    p.ids[c.displayName] = res.data.wooProductId;
                    for (let v of p.variantsArray) { if (!v.ids) v.ids = {}; const wv = res.data.variantIds?.find(vi => vi.sku === v.sku); if (wv) v.ids[c.displayName] = wv.id; }
                    await axios.post("/api/admin/products", { products: [p] });
                    setProduct({ ...p });
                    if (products?.length) setProducts(products.map(prod => prod._id.toString() === p._id.toString() ? { ...p } : prod));
                }
            }
            setLoading(false);
        } else if (c.type === "squarespace") {
            setLoading(true);
            const res = await axios.post("/api/integrations/squarespace/send", { product, connectionId: c._id })
                .catch((e) => { notify("error", extractErr(e, "Something went wrong sending to Squarespace.")); setLoading(false); });
            if (res?.data) {
                if (bodyErr(res.data, "Squarespace")) { /* error shown */ }
                else {
                    let p = { ...product };
                    if (!p.ids) p.ids = {};
                    p.ids[c.displayName] = res.data.squarespaceProductId;
                    for (let v of p.variantsArray) { if (!v.ids) v.ids = {}; const sv = res.data.variantIds?.find(vi => vi.sku === v.sku); if (sv) v.ids[c.displayName] = sv.id; }
                    await axios.post("/api/admin/products", { products: [p] });
                    setProduct({ ...p });
                    if (products?.length) setProducts(products.map(prod => prod._id.toString() === p._id.toString() ? { ...p } : prod));
                }
            }
            setLoading(false);
        } else if (c.type === "meta") {
            setLoading(true);
            const res = await axios.post("/api/integrations/meta/send", { product, connectionId: c._id })
                .catch((e) => { notify("error", extractErr(e, "Something went wrong sending to Meta Shops.")); setLoading(false); });
            if (res?.data) {
                if (bodyErr(res.data, "Meta Shops")) { /* error shown */ }
                else {
                    let p = { ...product };
                    if (!p.ids) p.ids = {};
                    p.ids[c.displayName] = res.data.metaProductId;
                    await axios.post("/api/admin/products", { products: [p] });
                    setProduct({ ...p });
                    if (products?.length) setProducts(products.map(prod => prod._id.toString() === p._id.toString() ? { ...p } : prod));
                }
            }
            setLoading(false);
        } else if (c.type === "pinterest") {
            setLoading(true);
            const res = await axios.post("/api/integrations/pinterest/send", { product, connectionId: c._id })
                .catch((e) => { notify("error", extractErr(e, "Something went wrong sending to Pinterest.")); setLoading(false); });
            if (res?.data) {
                if (bodyErr(res.data, "Pinterest")) { /* error shown */ }
                else {
                    let p = { ...product };
                    if (!p.ids) p.ids = {};
                    p.ids[c.displayName] = res.data.pinterestBatchId;
                    await axios.post("/api/admin/products", { products: [p] });
                    setProduct({ ...p });
                    if (products?.length) setProducts(products.map(prod => prod._id.toString() === p._id.toString() ? { ...p } : prod));
                }
            }
            setLoading(false);
        } else if (c.type === "onbuy") {
            setLoading(true);
            const res = await axios.post("/api/integrations/onbuy/send", { product, connectionId: c._id })
                .catch((e) => { notify("error", extractErr(e, "Something went wrong sending to OnBuy.")); setLoading(false); });
            if (res?.data) {
                if (bodyErr(res.data, "OnBuy")) { /* error shown */ }
                else {
                    let p = { ...product };
                    if (!p.ids) p.ids = {};
                    p.ids[c.displayName] = res.data.onbuyListingId;
                    await axios.post("/api/admin/products", { products: [p] });
                    setProduct({ ...p });
                    if (products?.length) setProducts(products.map(prod => prod._id.toString() === p._id.toString() ? { ...p } : prod));
                }
            }
            setLoading(false);
        } else if (c.type === "rakuten") {
            setLoading(true);
            const res = await axios.post("/api/integrations/rakuten/send", { product, connectionId: c._id })
                .catch((e) => { notify("error", extractErr(e, "Something went wrong sending to Rakuten.")); setLoading(false); });
            if (res?.data) {
                if (bodyErr(res.data, "Rakuten")) { /* error shown */ }
                else {
                    let p = { ...product };
                    if (!p.ids) p.ids = {};
                    p.ids[c.displayName] = res.data.rakutenItemId;
                    await axios.post("/api/admin/products", { products: [p] });
                    setProduct({ ...p });
                    if (products?.length) setProducts(products.map(prod => prod._id.toString() === p._id.toString() ? { ...p } : prod));
                }
            }
            setLoading(false);
        } else if (c.type === "rithum") {
            setLoading(true);
            const res = await axios.post("/api/integrations/rithum/send", { product, connectionId: c._id })
                .catch((e) => { notify("error", extractErr(e, "Something went wrong sending to Rithum.")); setLoading(false); });
            if (res?.data) {
                if (bodyErr(res.data, "Rithum")) { /* error shown */ }
                else {
                    let p = { ...product };
                    if (!p.ids) p.ids = {};
                    p.ids[c.displayName] = res.data.rithumProductId;
                    await axios.post("/api/admin/products", { products: [p] });
                    setProduct({ ...p });
                    if (products?.length) setProducts(products.map(prod => prod._id.toString() === p._id.toString() ? { ...p } : prod));
                }
            }
            setLoading(false);
        } else if (c.type === "channelengine") {
            setLoading(true);
            const res = await axios.post("/api/admin/channelengine/products/send", { product })
                .catch((e) => { notify("error", extractErr(e, "Something went wrong sending to ChannelEngine.")); setLoading(false); });
            if (res?.data) {
                if (bodyErr(res.data, "ChannelEngine")) { /* error shown */ }
                else {
                    let p = { ...product };
                    if (!p.ids) p.ids = {};
                    p.ids[c.displayName] = res.data.channelEngineProductId;
                    await axios.post("/api/admin/products", { products: [p] });
                    setProduct({ ...p });
                    if (products?.length) setProducts(products.map(prod => prod._id.toString() === p._id.toString() ? { ...p } : prod));
                }
            }
            setLoading(false);
        } else if (c.type === "ebay") {
            setLoading(true);
            const offer = mp?.defaultValues ? { ...mp.defaultValues } : {};
            const res = await axios.post("/api/integrations/ebay", { connectionId: c._id, product, offer })
                .catch((e) => { notify("error", extractErr(e, "Something went wrong sending to eBay.")); setLoading(false); });
            if (res?.data) {
                if (bodyErr(res.data, "eBay")) { /* error shown */ }
                else if (res.data.success) {
                    const results = res.data.results ?? [];
                    const failed  = results.filter(r => r.error);
                    let p = { ...product };
                    if (!p.ids) p.ids = {};
                    p.ids[c.displayName] = results[0]?.offerId ?? results[0]?.sku ?? "sent";
                    for (const v of p.variantsArray ?? []) {
                        const r = results.find(r => r.sku === v.sku);
                        if (r?.offerId) { if (!v.ids) v.ids = {}; v.ids[c.displayName] = r.offerId; }
                    }
                    await axios.post("/api/admin/products", { products: [p] });
                    setProduct({ ...p });
                    if (products?.length) setProducts(products.map(prod => prod._id.toString() === p._id.toString() ? { ...p } : prod));
                    if (failed.length) {
                        notify("warning", `Sent to eBay — ${results.length - failed.length} variant(s) created, ${failed.length} failed: ${failed.map(f => `${f.sku}: ${f.error}`).join("; ")}`);
                    } else {
                        notify("success", `Sent to eBay. ${results.length} variant(s) created.`);
                    }
                }
            }
            setLoading(false);
        } else if (c.seller_name) {
            setLoading(true);
            const res = await axios.post("/api/admin/integrations/tiktok", { product, connection: c, marketplaceName: mpName })
                .catch((e) => { notify("error", extractErr(e, "Something went wrong sending to TikTok.")); setLoading(false); });
            if (res?.data) {
                if (bodyErr(res.data, "TikTok")) { /* error shown */ }
                else {
                    let p = { ...product };
                    if (!p.ids) p.ids = {};
                    p.ids[mpName] = res.data.tiktokProductId;
                    await axios.post("/api/admin/products", { products: [p] });
                    setProduct({ ...p });
                    if (products?.length) setProducts(products.map(prod => prod._id.toString() === p._id.toString() ? { ...p } : prod));
                    if (res.data.warning) notify("warning", `TikTok listing created. Note: ${res.data.warning}`);
                }
            }
            setLoading(false);
        }
    };
    const style = {
        position: "absolute", top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        width: "92%", maxWidth: 1100, height: "90%",
        bgcolor: "background.paper", borderRadius: 3, boxShadow: 24,
        display: "flex", flexDirection: "column", overflow: "hidden",
    };
    return (
        <>
        <Modal open={open} onClose={() => setOpen(false)}>
            <Box sx={style}>
                {loading && <LoaderOverlay />}

                <Box sx={{ display: "flex", flexDirection: "column", height: "100%", opacity: loading ? 0 : 1 }}>
                    {/* Header */}
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", px: 3, py: 2, borderBottom: "1px solid", borderColor: "divider", flexShrink: 0 }}>
                        <Typography variant="h6" fontWeight={700}>Marketplaces</Typography>
                        <IconButton onClick={() => setOpen(false)} size="small"><CloseIcon /></IconButton>
                    </Box>

                    {/* Body */}
                    <Box sx={{ flex: 1, overflowY: "auto", px: 3, py: 2 }}>
                        {canManage && (
                            <Box sx={{ mb: 2 }}>
                                <Button variant="contained" size="small" onClick={() => { setMarketplace({ name: "", headers: [[]], defaultValues: {}, sizes: {} }); setAddMarketPlace(true); }}>
                                    + Create Marketplace
                                </Button>
                            </Box>
                        )}

                        {/* Marketplace cards grid */}
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, mb: 3 }}>
                            {marketPlaces && marketPlaces.map((mp) => {
                                if (connections?.length > 0) {
                                    mp.connections = mp.connections?.map(c => {
                                        const conn = connections.find(conn => conn._id.toString() === c.toString())
                                            ?? tiktokAuth.find(conn => conn._id.toString() === c.toString());
                                        return conn ?? c;
                                    });
                                }
                                const isSelected = product?.marketPlacesArray?.some(m => (m._id ? m._id.toString() : m.toString()) === mp._id.toString());
                                return (
                                    <Card key={`${mp._id}-i`} variant="outlined" sx={{
                                        width: 160, height: 210, display: "flex", flexDirection: "column",
                                        borderRadius: 2, flexShrink: 0,
                                        borderColor: isSelected ? "primary.main" : "divider",
                                        borderWidth: isSelected ? 2 : 1,
                                        transition: "box-shadow 120ms",
                                        "&:hover": { boxShadow: 3 },
                                    }}>
                                        <Box sx={{ px: 1.5, pt: 1.25, pb: 0.5 }}>
                                            <Typography variant="subtitle2" fontWeight={700} noWrap title={mp.name}>{mp.name}</Typography>
                                            {isSelected && <Chip label="Active" size="small" color="primary" sx={{ mt: 0.25, fontSize: "0.6rem", height: 16 }} />}
                                        </Box>

                                        <Box sx={{ flex: 1, overflowY: "auto", px: 1, py: 0.5, display: "flex", flexDirection: "column", gap: 0.5 }}>
                                            {product && isSelected && mp.connections?.map((c) => {
                                                const connKey = c?.seller_name ? mp.name : (c?.displayName ?? c?.seller_name);
                                                const hasSent = !!product.ids?.[connKey];
                                                return (
                                                    <Button key={`${c?._id}`} fullWidth size="small"
                                                        variant={hasSent ? "contained" : "outlined"}
                                                        color={hasSent ? "success" : "primary"}
                                                        sx={{ fontSize: "0.62rem", py: 0.4, textTransform: "none" }}
                                                        onClick={() => sendToConnection(c, mp.name, mp)}>
                                                        {hasSent ? "↺ Update — " : "→ Send — "}{c?.displayName || c?.seller_name || "Connection"}
                                                    </Button>
                                                );
                                            })}
                                            {product && !isSelected && (
                                                <Typography variant="caption" color="text.disabled" sx={{ px: 0.5, py: 0.5, fontSize: "0.65rem" }}>
                                                    Select to enable sending
                                                </Typography>
                                            )}
                                        </Box>

                                        <Divider />
                                        <Box sx={{ px: 1, py: 0.75, display: "flex", flexDirection: "column", gap: 0.5 }}>
                                            {product && !isSelected && (
                                                <Button fullWidth size="small" variant="contained" sx={{ fontSize: "0.7rem", py: 0.4 }} onClick={async () => {
                                                    let p = { ...product };
                                                    if (!p.marketPlacesArray) p.marketPlacesArray = [];
                                                    if (!p.marketPlacesArray.map(m => m._id ? m._id.toString() : m.toString()).includes(mp._id.toString())) p.marketPlacesArray.push(mp);
                                                    if (design) { let d = { ...design }; d.products = d.products.filter(pr => pr._id.toString() !== p._id.toString()); d.products.push(p); setDesign({ ...d }); }
                                                    checkForIds({ product: p });
                                                    await axios.post("/api/admin/products", { products: [p] });
                                                    setProduct({ ...p });
                                                    if (products?.length) setProducts(products.map(prod => prod._id.toString() === p._id.toString() ? { ...p } : prod));
                                                }}>Select</Button>
                                            )}
                                            {product && isSelected && (
                                                <Button fullWidth size="small" variant="outlined" color="warning" sx={{ fontSize: "0.7rem", py: 0.4 }} onClick={() => { setMarketplace(mp); setOpenRemoveModal(true); }}>Remove</Button>
                                            )}
                                            {(canManage || canEdit) && (
                                                <Box sx={{ display: "flex", gap: 0.5 }}>
                                                    <Button fullWidth size="small" variant="outlined" sx={{ fontSize: "0.7rem", py: 0.4 }} onClick={() => { setMarketplace(mp); setAddMarketPlace(true); }}>Edit</Button>
                                                    {canManage && (
                                                        <IconButton size="small" color="error" sx={{ p: 0.5 }} onClick={() => setConfirmDeleteMp(mp)}>
                                                            <DeleteIcon fontSize="small" />
                                                        </IconButton>
                                                    )}
                                                </Box>
                                            )}
                                        </Box>
                                    </Card>
                                );
                            })}
                        </Box>

                        {/* Selected Marketplaces */}
                        {product?.marketPlacesArray?.length > 0 && (
                            <>
                                <Divider sx={{ mb: 2 }} />
                                <Typography variant="h6" fontWeight={700} sx={{ mb: 1.5 }}>Selected Marketplaces</Typography>
                                {marketPlaces.filter(m => product.marketPlacesArray.map(mp => (mp._id ? mp._id.toString() : mp.toString())).includes(m._id.toString())).map((marketPlace) => {
                                    if (connections?.length > 0 || tiktokAuth?.length > 0) {
                                        marketPlace.connections = marketPlace.connections?.map(c => {
                                            const id = c?._id?.toString() ?? c?.toString();
                                            const conn = connections.find(conn => conn._id.toString() === id)
                                                ?? tiktokAuth.find(conn => conn._id.toString() === id);
                                            return conn ?? c;
                                        });
                                    }
                                    return (
                                        <Box key={marketPlace._id} sx={{ mb: 2, border: "1px solid", borderColor: "divider", borderRadius: 2, overflow: "hidden" }}>
                                            {marketPlace.headers.map((header, index) => (
                                                <Box key={marketPlace._id + "-" + index} sx={{ p: 2, borderBottom: index < marketPlace.headers.length - 1 ? "1px solid" : "none", borderColor: "divider" }}>
                                                    <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, mb: 1.5 }}>
                                                        {marketPlace.connections?.map(c => connections.filter(conn => conn._id.toString() === c.toString()).filter(c => c.displayName?.toLowerCase().includes("acenda")[0])) && (
                                                            <Button variant="outlined" size="small" onClick={async () => { await axios.get("/api/integrations/acenda", { params: { connectionId: marketPlace.connections.map(c => connections.filter(conn => conn._id.toString() === c.toString()).filter(c => c.displayName?.toLowerCase().includes("acenda"))[0])[0]?._id, productId: product._id } }); }}>Add Inventory</Button>
                                                        )}
                                                        <Button variant="outlined" size="small" href={`/api/download?marketPlace=${marketPlace._id}&product=${product._id}&header=${index}&disableDefault=${marketPlace.disableProductDefaults ? marketPlace.disableProductDefaults[index] : false}`} target="_blank">Download CSV</Button>
                                                    </Box>
                                                    {marketPlace.connections?.filter(c => c?.displayName?.toLowerCase().includes("shopify"))[0] && (
                                                        <Card variant="outlined" sx={{ p: 1.5, mb: 1, borderRadius: 1.5 }}>
                                                            <Typography variant="subtitle2" fontWeight={700}>{marketPlace.connections.filter(c => c?.displayName?.toLowerCase().includes("shopify"))[0].displayName}</Typography>
                                                            <Divider sx={{ my: 0.75 }} />
                                                            {product.ids?.[marketPlace.connections.filter(c => c?.displayName?.toLowerCase().includes("shopify"))[0].displayName] && <Typography variant="body2" color="text.secondary">Shopify ID: {product.ids[marketPlace.connections.filter(c => c?.displayName?.toLowerCase().includes("shopify"))[0].displayName]}</Typography>}
                                                        </Card>
                                                    )}
                                                    {marketPlace.connections?.filter(c => c?.type === "etsy")[0] && (
                                                        <Card variant="outlined" sx={{ p: 1.5, mb: 1, borderRadius: 1.5 }}>
                                                            <Typography variant="subtitle2" fontWeight={700}>{marketPlace.connections.filter(c => c?.type === "etsy")[0].displayName}</Typography>
                                                            <Divider sx={{ my: 0.75 }} />
                                                            {product.ids?.[marketPlace.connections.filter(c => c?.type === "etsy")[0].displayName] && <Typography variant="body2" color="text.secondary">Etsy ID: {product.ids[marketPlace.connections.filter(c => c?.type === "etsy")[0].displayName]}</Typography>}
                                                        </Card>
                                                    )}
                                                    {marketPlace.connections?.filter(c => c?.type === "walmart")[0] && (
                                                        <Card variant="outlined" sx={{ p: 1.5, mb: 1, borderRadius: 1.5 }}>
                                                            <Typography variant="subtitle2" fontWeight={700}>{marketPlace.connections.filter(c => c?.type === "walmart")[0].displayName}</Typography>
                                                            <Divider sx={{ my: 0.75 }} />
                                                            {product.ids?.[marketPlace.connections.filter(c => c?.type === "walmart")[0].displayName] && <Typography variant="body2" color="text.secondary">Walmart Feed ID: {product.ids[marketPlace.connections.filter(c => c?.type === "walmart")[0].displayName]}</Typography>}
                                                        </Card>
                                                    )}
                                                    {marketPlace.connections?.filter(c => c?.type === "faire")[0] && (
                                                        <Card variant="outlined" sx={{ p: 1.5, mb: 1, borderRadius: 1.5 }}>
                                                            <Typography variant="subtitle2" fontWeight={700}>{marketPlace.connections.filter(c => c?.type === "faire")[0].displayName}</Typography>
                                                            <Divider sx={{ my: 0.75 }} />
                                                            {product.ids?.[marketPlace.connections.filter(c => c?.type === "faire")[0].displayName] && <Typography variant="body2" color="text.secondary">Faire Product ID: {product.ids[marketPlace.connections.filter(c => c?.type === "faire")[0].displayName]}</Typography>}
                                                        </Card>
                                                    )}
                                                    {marketPlace.connections?.filter(c => c?.type === "shein")[0] && (
                                                        <Card variant="outlined" sx={{ p: 1.5, mb: 1, borderRadius: 1.5 }}>
                                                            <Typography variant="subtitle2" fontWeight={700}>{marketPlace.connections.filter(c => c?.type === "shein")[0].displayName}</Typography>
                                                            <Divider sx={{ my: 0.75 }} />
                                                            {product.ids?.[marketPlace.connections.filter(c => c?.type === "shein")[0].displayName] && <Typography variant="body2" color="text.secondary">SHEIN SPU: {product.ids[marketPlace.connections.filter(c => c?.type === "shein")[0].displayName]}</Typography>}
                                                        </Card>
                                                    )}
                                                    {marketPlace.connections?.filter(c => c?.type === "temu")[0] && (
                                                        <Card variant="outlined" sx={{ p: 1.5, mb: 1, borderRadius: 1.5 }}>
                                                            <Typography variant="subtitle2" fontWeight={700}>{marketPlace.connections.filter(c => c?.type === "temu")[0].displayName}</Typography>
                                                            <Divider sx={{ my: 0.75 }} />
                                                            {product.ids?.[marketPlace.connections.filter(c => c?.type === "temu")[0].displayName] && <Typography variant="body2" color="text.secondary">Temu Goods ID: {product.ids[marketPlace.connections.filter(c => c?.type === "temu")[0].displayName]}</Typography>}
                                                        </Card>
                                                    )}
                                                    {marketPlace.connections?.some(c => c?.type === "wix") && (
                                                        <Card variant="outlined" sx={{ p: 1.5, mb: 1, borderRadius: 1.5 }}>
                                                            <Typography variant="subtitle2" fontWeight={700}>{marketPlace.connections.find(c => c?.type === "wix").displayName}</Typography>
                                                            <Divider sx={{ my: 0.75 }} />
                                                            {product.ids?.[marketPlace.connections.find(c => c?.type === "wix").displayName]
                                                                ? <Typography variant="body2" color="text.secondary">Wix Product ID: {product.ids[marketPlace.connections.find(c => c?.type === "wix").displayName]}</Typography>
                                                                : <Typography variant="body2" color="text.disabled">Not yet sent</Typography>
                                                            }
                                                        </Card>
                                                    )}
                                                    {marketPlace.connections?.some(c => c?.type === "woocommerce") && (
                                                        <Card variant="outlined" sx={{ p: 1.5, mb: 1, borderRadius: 1.5 }}>
                                                            <Typography variant="subtitle2" fontWeight={700}>{marketPlace.connections.find(c => c?.type === "woocommerce").displayName}</Typography>
                                                            <Divider sx={{ my: 0.75 }} />
                                                            {product.ids?.[marketPlace.connections.find(c => c?.type === "woocommerce").displayName]
                                                                ? <Typography variant="body2" color="text.secondary">WooCommerce ID: {product.ids[marketPlace.connections.find(c => c?.type === "woocommerce").displayName]}</Typography>
                                                                : <Typography variant="body2" color="text.disabled">Not yet sent</Typography>
                                                            }
                                                        </Card>
                                                    )}
                                                    {marketPlace.connections?.some(c => c?.type === "squarespace") && (
                                                        <Card variant="outlined" sx={{ p: 1.5, mb: 1, borderRadius: 1.5 }}>
                                                            <Typography variant="subtitle2" fontWeight={700}>{marketPlace.connections.find(c => c?.type === "squarespace").displayName}</Typography>
                                                            <Divider sx={{ my: 0.75 }} />
                                                            {product.ids?.[marketPlace.connections.find(c => c?.type === "squarespace").displayName]
                                                                ? <Typography variant="body2" color="text.secondary">Squarespace ID: {product.ids[marketPlace.connections.find(c => c?.type === "squarespace").displayName]}</Typography>
                                                                : <Typography variant="body2" color="text.disabled">Not yet sent</Typography>
                                                            }
                                                        </Card>
                                                    )}
                                                    {marketPlace.connections?.some(c => c?.type === "meta") && (
                                                        <Card variant="outlined" sx={{ p: 1.5, mb: 1, borderRadius: 1.5 }}>
                                                            <Typography variant="subtitle2" fontWeight={700}>{marketPlace.connections.find(c => c?.type === "meta").displayName}</Typography>
                                                            <Divider sx={{ my: 0.75 }} />
                                                            {product.ids?.[marketPlace.connections.find(c => c?.type === "meta").displayName]
                                                                ? <Typography variant="body2" color="text.secondary">Meta Catalog ID: {product.ids[marketPlace.connections.find(c => c?.type === "meta").displayName]}</Typography>
                                                                : <Typography variant="body2" color="text.disabled">Not yet sent</Typography>
                                                            }
                                                        </Card>
                                                    )}
                                                    {marketPlace.connections?.some(c => c?.type === "pinterest") && (
                                                        <Card variant="outlined" sx={{ p: 1.5, mb: 1, borderRadius: 1.5 }}>
                                                            <Typography variant="subtitle2" fontWeight={700}>{marketPlace.connections.find(c => c?.type === "pinterest").displayName}</Typography>
                                                            <Divider sx={{ my: 0.75 }} />
                                                            {product.ids?.[marketPlace.connections.find(c => c?.type === "pinterest").displayName]
                                                                ? <Typography variant="body2" color="text.secondary">Pinterest Batch ID: {product.ids[marketPlace.connections.find(c => c?.type === "pinterest").displayName]}</Typography>
                                                                : <Typography variant="body2" color="text.disabled">Not yet sent</Typography>
                                                            }
                                                        </Card>
                                                    )}
                                                    {marketPlace.connections?.some(c => c?.type === "onbuy") && (
                                                        <Card variant="outlined" sx={{ p: 1.5, mb: 1, borderRadius: 1.5 }}>
                                                            <Typography variant="subtitle2" fontWeight={700}>{marketPlace.connections.find(c => c?.type === "onbuy").displayName}</Typography>
                                                            <Divider sx={{ my: 0.75 }} />
                                                            {product.ids?.[marketPlace.connections.find(c => c?.type === "onbuy").displayName]
                                                                ? <Typography variant="body2" color="text.secondary">OnBuy Listing ID: {product.ids[marketPlace.connections.find(c => c?.type === "onbuy").displayName]}</Typography>
                                                                : <Typography variant="body2" color="text.disabled">Not yet sent</Typography>
                                                            }
                                                        </Card>
                                                    )}
                                                    {marketPlace.connections?.some(c => c?.type === "rakuten") && (
                                                        <Card variant="outlined" sx={{ p: 1.5, mb: 1, borderRadius: 1.5 }}>
                                                            <Typography variant="subtitle2" fontWeight={700}>{marketPlace.connections.find(c => c?.type === "rakuten").displayName}</Typography>
                                                            <Divider sx={{ my: 0.75 }} />
                                                            {product.ids?.[marketPlace.connections.find(c => c?.type === "rakuten").displayName]
                                                                ? <Typography variant="body2" color="text.secondary">Rakuten Manage #: {product.ids[marketPlace.connections.find(c => c?.type === "rakuten").displayName]}</Typography>
                                                                : <Typography variant="body2" color="text.disabled">Not yet sent</Typography>
                                                            }
                                                        </Card>
                                                    )}
                                                    {marketPlace.connections?.some(c => c?.type === "rithum") && (
                                                        <Card variant="outlined" sx={{ p: 1.5, mb: 1, borderRadius: 1.5 }}>
                                                            <Typography variant="subtitle2" fontWeight={700}>{marketPlace.connections.find(c => c?.type === "rithum").displayName}</Typography>
                                                            <Divider sx={{ my: 0.75 }} />
                                                            {product.ids?.[marketPlace.connections.find(c => c?.type === "rithum").displayName]
                                                                ? <Typography variant="body2" color="text.secondary">Rithum Product ID: {product.ids[marketPlace.connections.find(c => c?.type === "rithum").displayName]}</Typography>
                                                                : <Typography variant="body2" color="text.disabled">Not yet sent</Typography>
                                                            }
                                                        </Card>
                                                    )}
                                                    {marketPlace.connections?.some(c => c?.type === "channelengine") && (
                                                        <Card variant="outlined" sx={{ p: 1.5, mb: 1, borderRadius: 1.5 }}>
                                                            <Typography variant="subtitle2" fontWeight={700}>{marketPlace.connections.find(c => c?.type === "channelengine").displayName}</Typography>
                                                            <Divider sx={{ my: 0.75 }} />
                                                            {product.ids?.[marketPlace.connections.find(c => c?.type === "channelengine").displayName]
                                                                ? <Typography variant="body2" color="text.secondary">ChannelEngine Product #: {product.ids[marketPlace.connections.find(c => c?.type === "channelengine").displayName]}</Typography>
                                                                : <Typography variant="body2" color="text.disabled">Not yet sent</Typography>
                                                            }
                                                        </Card>
                                                    )}
                                                    {marketPlace.connections?.some(c => c?.type === "ebay") && (
                                                        <Card variant="outlined" sx={{ p: 1.5, mb: 1, borderRadius: 1.5 }}>
                                                            <Typography variant="subtitle2" fontWeight={700}>{marketPlace.connections.find(c => c?.type === "ebay").displayName}</Typography>
                                                            <Divider sx={{ my: 0.75 }} />
                                                            {product.ids?.[marketPlace.connections.find(c => c?.type === "ebay").displayName]
                                                                ? <Typography variant="body2" color="text.secondary">eBay Offer ID: {product.ids[marketPlace.connections.find(c => c?.type === "ebay").displayName]}</Typography>
                                                                : <Typography variant="body2" color="text.disabled">Not yet sent</Typography>
                                                            }
                                                        </Card>
                                                    )}
                                                    {marketPlace.connections?.some(c => c?.seller_name) && (
                                                        <Card variant="outlined" sx={{ p: 1.5, mb: 1, borderRadius: 1.5 }}>
                                                            <Typography variant="subtitle2" fontWeight={700}>{marketPlace.name}</Typography>
                                                            <Divider sx={{ my: 0.75 }} />
                                                            {product.ids?.[marketPlace.name]
                                                                ? <Typography variant="body2" color="text.secondary">TikTok ID: {product.ids[marketPlace.name]}</Typography>
                                                                : <Typography variant="body2" color="text.disabled">Not yet sent</Typography>
                                                            }
                                                        </Card>
                                                    )}
                                                    {header.length > 0 && (
                                                        <MarketPlaceList marketPlace={marketPlace} header={header} addMarketPlace={addMarketPlace} products={[product]} productLine={marketPlace.hasProductLine ? marketPlace.hasProductLine[index] : false} disableDefault={marketPlace.disableProductDefaults ? marketPlace.disableProductDefaults[index] : false} connections={connections} />
                                                    )}
                                                </Box>
                                            ))}
                                        </Box>
                                    );
                                })}
                            </>
                        )}
                    </Box>
                </Box>

                {/* Delete marketplace confirmation */}
                <Dialog open={!!confirmDeleteMp} onClose={() => setConfirmDeleteMp(null)} maxWidth="xs" fullWidth>
                    <DialogTitle sx={{ fontWeight: 700, color: "error.main" }}>Delete Marketplace</DialogTitle>
                    <DialogContent>
                        <Typography>Are you sure you want to permanently delete <strong>{confirmDeleteMp?.name}</strong>? This cannot be undone.</Typography>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setConfirmDeleteMp(null)}>Cancel</Button>
                        <Button variant="contained" color="error" onClick={() => deleteMarketplace(confirmDeleteMp)}>Delete</Button>
                    </DialogActions>
                </Dialog>

                <AddMarketplaceModal open={addMarketPlace} setOpen={setAddMarketPlace} sizes={size} marketPlace={marketplace} setMarketPlace={setMarketplace} setDeleteModal={setDeleteModal} setDeleteTitle={setDeleteTitle} setDeleteImage={setDeleteImage} setOnDelete={setDeleteFunction} setMarketPlaces={setMarketPlaces} blank={blank} setBlank={setBlank} connections={connections} tiktokAuth={tiktokAuth} setTiktokAuth={setTiktokAuth} />
                <DeleteModel open={deleteModal} setOpen={setDeleteModal} title={deleteTitle} onDelete={deleteFunction.onDelete} deleteImage={deleteImage} />
                <RemoveMarketPlaceModal open={openRemoveModal} setOpen={setOpenRemoveModal} mp={marketplace} removeMarketplaceConnection={removeMarketplaceConnection} />
            </Box>
        </Modal>

        <Snackbar
            open={!!sendMsg}
            autoHideDuration={8000}
            onClose={() => setSendMsg(null)}
            anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
            <Alert
                onClose={() => setSendMsg(null)}
                severity={sendMsg?.severity ?? "info"}
                variant="filled"
                sx={{ width: "100%", maxWidth: 600, whiteSpace: "pre-wrap", wordBreak: "break-word" }}
            >
                {sendMsg?.text}
            </Alert>
        </Snackbar>
        </>
    );
}
export const MarketPlaceList = ({ marketPlace, header, addMarketPlace, products, productLine, disableDefault, connections }) => {
    let headers = {}
    for(let h of header) {
        headers[h.Label] = []
    }
    if(productLine) {
        for(let product of products){
            for (let h of Object.keys(headers)) {
                let val = HeaderList({ product, mp: marketPlace, variant: {}, blankOverRides: product.blanks[0].marketPlaceOverrides ? product.blanks[0].marketPlaceOverrides[marketPlace.name] : [], headerLabel: h, color: "", blankCode: product.blanks[0].code, category: product.blanks[0].category[0], threadColor: "", numBlanks: product.blanks.length, blankName: product.blanks[0].name, type: "product" })
                headers[h].push(val);
            }
        }
    }
    for(let product of products) {
        let index = 0;
        if(product.threadColors && product.threadColors.length > 0) {
            for (let b of product.blanks) {
                for (let tc of product.threadColors) {
                    for (let c of product.colors) {
                        if (product.variantsArray.filter(v => v.blank?.toString() == b._id?.toString() && v.threadColor?._id ? v.threadColor._id?.toString() == tc._id?.toString() : v.threadColor?.toString() == tc._id?.toString() && (v.color._id ? v.color._id?.toString() : v.color?.toString()) == c._id?.toString()).length > 0) {
                            for (let v of product.variantsArray.filter(v => v.blank?.toString() == b._id?.toString() && v.threadColor?._id ? v.threadColor._id?.toString() == tc._id?.toString() : v.threadColor?.toString() == tc._id?.toString() && (v.color._id ? v.color._id?.toString() : v.color?.toString()) == c._id?.toString())) {
                                if (!v.size._id) v.size = b.sizes.filter(s => s._id.toString() == v.size)[0];
                                if (!v.color._id) v.color = c;
                                if (!v.threadColor._id) v.threadColor = tc;
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
            for(let b of product.blanks) {
                for(let c of product.colors) {
                    if (product.variantsArray.filter(v => v.blank?.toString() == b._id?.toString() && (v.color?._id ? v.color._id.toString() : v.color?.toString()) == c._id?.toString()).length > 0) {
                        for (let v of product.variantsArray.filter(v => v.blank?.toString() == b._id?.toString() && (v.color?._id ? v.color._id.toString() : v.color?.toString()) == c._id?.toString())) {
                            if (v.size && !v.size._id)v.size = b.sizes.filter(s => s._id.toString() == v.size)[0];
                            if(!v.color._id) v.color = c;
                            for(let h of Object.keys(headers)) {
                                let val = HeaderList({ product, mp: marketPlace, variant: v, blankOverRides: product.blanks.filter(bl => bl.code == b.code)[0]?.marketPlaceOverrides ? product.blanks.filter(bl => bl.code == b.code)[0]?.marketPlaceOverrides[marketPlace.name] : {}, headerLabel: h, index: index, color: c.name, blankCode: b.code, category: product.blanks.filter(bl => bl.code == b.code)[0]?.category[0], numBlanks: product.blanks.length, blankName: b.name, sizeGuide: b.sizeGuide.images && b.sizeGuide.images.length > 0 ? b.sizeGuide.images : [] })
                                headers[h].push(val);
                            }
                            index++;
                        }
                    }

                }
            }
        }
        if (!disableDefault && product.marketplaceValues && product.marketplaceValues[marketPlace._id] && Object.keys(product.marketplaceValues[marketPlace._id]).length > 0){
            Object.keys(product.marketplaceValues[marketPlace._id]).map(key => {
                console.log("key", key)
                if (key != "titleGenerator" && key != "name") {
                    headers[key] = [];
                    if (productLine) {
                        let val = product.marketplaceValues[marketPlace._id][key]
                        headers[key].push(val);
                    }
                    for (let variant of product.variantsArray) {
                        let val = product.marketplaceValues[marketPlace._id][key]
                        headers[key].push(val);
                    }
                }else if (key == "titleGenerator") {
                    if(!marketPlace.productDropDowns || !marketPlace.productDropDowns[key] || !marketPlace.productDropDowns[key]["label"]) {
                        return;
                    }
                    headers[marketPlace.productDropDowns[key]["label"]] = [];
                    if (productLine) {
                        let val = product.marketplaceValues[marketPlace._id][key].replace("- {color} ", "").replace("- {blank} ", "").replace("- {size} ", "");
                        headers[marketPlace.productDropDowns[key]["label"]].push(val);
                    }
                    for (let variant of product.variantsArray) {
                        let val = product.marketplaceValues[marketPlace._id][key].replace("{color}", variant.color.name).replace("{blank}", variant.blank.name).replace("{size}", variant.size.name);
                        headers[marketPlace.productDropDowns[key]["label"]].push(val);
                    }
                }

            })
        } 
    }
    console.log("headers", headers)
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

export const HeaderList = ({ product, mp, variant, blankOverRides, headerLabel, index, color, blankCode, threadColor, category, numBlanks, blankName, type, connection, sizeGuide }) => {
    let value = "N/A";
    if(type && type == "product") {
        //console.log(mp.productDefaultValues[headerLabel], headerLabel == "id", mp.productDefaultValues[headerLabel]?.split(",")[0])
        if (mp.productDefaultValues[headerLabel] && headerLabel == "id" && csvFunctions[mp.productDefaultValues[headerLabel]?.split(",")[0]]) {
            //console.log("HERE", csvFunctions[mp.productDefaultValues[headerLabel]?.split(",")[0]](product, index, mp.name));
            value = csvFunctions[mp.productDefaultValues[headerLabel]?.split(",")[0]](product, index, mp.name);
        }
        else if (mp.productDefaultValues && mp.productDefaultValues[headerLabel] && mp.productDefaultValues[headerLabel].includes("product") && csvFunctions[mp.productDefaultValues[headerLabel]]) {
            if (headerLabel == "Image Alt Text" && index >= product.productImages.length) {
                value = "N/A";
            }
            else value = csvFunctions[mp.productDefaultValues[headerLabel]](product, index, mp.productDefaultValues[headerLabel].split(",")[1]);
        }
        else if (mp.productDefaultValues && mp.productDefaultValues[headerLabel] && mp.productDefaultValues[headerLabel].includes("variant") && csvFunctions[mp.productDefaultValues[headerLabel].split(",")[0]]) {
            value = csvFunctions[mp.productDefaultValues[headerLabel].split(",")[0]](variant, mp.sizeConverter, numBlanks, blankName, mp.productDefaultValues[headerLabel].split(",")[1], mp.colorFamilyConverter);
        } else if (mp.productDefaultValues && mp.productDefaultValues[headerLabel] == "index") {
            if (index < product.productImages.length) {
                value = index + 1;
            }
        }
        else if (blankOverRides && blankOverRides[headerLabel]) {
            if (blankOverRides[headerLabel].includes("variant") && csvFunctions[blankOverRides[headerLabel].split(",")[0]]) {
                value = csvFunctions[blankOverRides[headerLabel].split(",")[0]](variant, mp.sizeConverter, numBlanks, blankName, blankOverRides[headerLabel].split(",")[1], mp.colorFamilyConverter);
            } else {
                value = blankOverRides[headerLabel];
            }
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
            else value = csvFunctions[mp.defaultValues[headerLabel]](product, index, mp, variant);
        }
        else if (mp.defaultValues && mp.defaultValues[headerLabel] && mp.defaultValues[headerLabel].includes("variant") && csvFunctions[mp.defaultValues[headerLabel].split(",")[0]]) {
            value = csvFunctions[mp.defaultValues[headerLabel].split(",")[0]](variant, mp.sizeConverter, numBlanks, blankName, mp.defaultValues[headerLabel].split(",")[1], mp.name, mp.colorFamilyConverter, sizeGuide);
        } else if (mp.defaultValues && mp.defaultValues[headerLabel]== "index") {
            if(index < product.productImages.length) {
                value = index + 1;
            }
        }
        else if( blankOverRides && blankOverRides[headerLabel]) {
            if (blankOverRides[headerLabel].includes("variant") && csvFunctions[blankOverRides[headerLabel].split(",")[0]]) {
                value = csvFunctions[blankOverRides[headerLabel].split(",")[0]](variant, mp.sizeConverter, numBlanks, blankName, blankOverRides[headerLabel].split(",")[1], mp.colorFamilyConverter);
            } else {
                value = blankOverRides[headerLabel];
            }
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
const AddMarketplaceModal = ({ open, setOpen, sizes, marketPlace, setMarketPlace, setDeleteModal, setDeleteImage, setOnDelete, setDeleteTitle, setMarketPlaces, blank, setBlank, connections, tiktokAuth, setTiktokAuth }) => {
    const [showSizeConverter, setShowSizeConverter] = useState(false);
    const [showColorFamily, setShowColorFamily] = useState(false);
    const [update, setUpdate] = useState(false);
    const [header, setHeader] = useState({});
    const [newHeaderTexts, setNewHeaderTexts] = useState([]);
    const [tikTokAttrOpen, setTikTokAttrOpen] = useState(false);
    const [tikTokAttrData, setTikTokAttrData] = useState(null);
    const [tikTokAttrLoading, setTikTokAttrLoading] = useState(false);
    const [tikTokAttrError, setTikTokAttrError] = useState(null);
    const [copiedId, setCopiedId] = useState(null);
    const [expandedAttrs, setExpandedAttrs] = useState(new Set());
    const [tikTokSearchTerm, setTikTokSearchTerm] = useState("");

    useEffect(() => {
        if (open) {
            let sizeObj = {};
            if (!marketPlace.sizeConverter) marketPlace.sizeConverter = {};
            for (let size of sizes) {
                if (!marketPlace.sizeConverter[size]) sizeObj[size] = size;
                else sizeObj[size] = marketPlace.sizeConverter[size];
            }
            let m = { ...marketPlace };
            m.sizeConverter = sizeObj;
            const getColors = async () => {
                let res = await axios.get("/api/admin/colors");
                if (res.data && !res.data.error) {
                    let colorConverter = marketPlace.colorFamilyConverter ? marketPlace.colorFamilyConverter : {};
                    for (let color of res.data.colors) {
                        if (!colorConverter[color.colorFamily]) {
                            colorConverter[color.colorFamily] = color.colorFamily;
                        }
                    }
                    m.colorFamilyConverter = colorConverter;
                    setMarketPlace({ ...m });
                }
            };
            getColors();
            setNewHeaderTexts((marketPlace.headers || []).map(() => ""));
        }
    }, [open]);

    const deleteCSV = (index) => {
        let m = { ...marketPlace };
        m.headers.splice(index, 1);
        setMarketPlace({ ...m });
    };

    const removeHeader = ({ index, hIndex }) => {
        let m = { ...marketPlace };
        m.headers[index].splice(hIndex, 1);
        setMarketPlace({ ...m });
    };

    const addHeader = (index) => {
        const text = (newHeaderTexts[index] || "").trim();
        if (!text) return;
        let m = { ...marketPlace };
        m.headers[index].push({ id: text, Label: text });
        setMarketPlace({ ...m });
        setNewHeaderTexts(prev => { const t = [...prev]; t[index] = ""; return t; });
    };

    const createMarketplace = async () => {
        if (!marketPlace.name) return alert("Please enter a marketplace name");
        let res = await axios.post("/api/admin/marketplaces", { marketPlace, blank });
        if (res.data.error) return alert(res.data.msg);
        setMarketPlaces([...res.data.marketPlaces]);
        setOpen(false);
    };

    const toggleConnection = (id) => {
        let m = { ...marketPlace };
        const ids = (m.connections || []).map(c => c?._id ? c._id.toString() : c?.toString());
        m.connections = ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id];
        setMarketPlace({ ...m });
    };

    const connIds = (marketPlace.connections || []).map(c => c?._id ? c._id.toString() : c?.toString());
    const hasTikTokSelected = tiktokAuth?.some(a => connIds.includes(a._id.toString()));

    const fetchTikTokAttributes = async (term) => {
        setTikTokAttrLoading(true);
        setTikTokAttrError(null);
        try {
            const productName = term || blank?.name || "t-shirt";
            const res = await axios.get(`/api/admin/integrations/tiktok?productName=${encodeURIComponent(productName)}`);
            if (res.data.error) setTikTokAttrError(res.data.msg);
            else setTikTokAttrData(res.data);
        } catch (e) {
            setTikTokAttrError(e?.response?.data?.msg ?? "Failed to load attributes");
        }
        setTikTokAttrLoading(false);
    };

    const handleViewTikTokAttributes = async () => {
        setTikTokAttrOpen(true);
        if (tikTokAttrData) return;
        await fetchTikTokAttributes();
    };

    const copyToClipboard = (text) => {
        navigator.clipboard?.writeText(text);
        setCopiedId(text);
        setTimeout(() => setCopiedId(null), 1500);
    };

    return (
        <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3, maxHeight: "92vh" } }}>
            <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pb: 1.5, borderBottom: "1px solid", borderColor: "divider" }}>
                <Typography variant="h6" fontWeight={700}>
                    {marketPlace._id ? "Update Marketplace" : "Create Marketplace"}
                </Typography>
                <IconButton onClick={() => setOpen(false)} size="small">
                    <CloseIcon fontSize="small" />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ overflowY: "auto", py: 3 }}>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>

                    {/* Name */}
                    <TextField
                        label="Marketplace Name"
                        fullWidth
                        value={marketPlace.name || ""}
                        onChange={(e) => setMarketPlace({ ...marketPlace, name: e.target.value })}
                    />

                    {/* Connections */}
                    {((connections && connections.length > 0) || (tiktokAuth && tiktokAuth.length > 0)) && (
                        <Box>
                            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, fontSize: "0.72rem" }}>
                                Connections
                            </Typography>
                            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                                {connections && connections.map((connection) => {
                                    const selected = connIds.includes(connection._id.toString());
                                    return (
                                        <Chip
                                            key={connection._id}
                                            label={connection.displayName}
                                            onClick={() => toggleConnection(connection._id.toString())}
                                            color={selected ? "primary" : "default"}
                                            variant={selected ? "filled" : "outlined"}
                                            sx={{ fontWeight: selected ? 600 : 400 }}
                                        />
                                    );
                                })}
                                {tiktokAuth && tiktokAuth.map((auth) => {
                                    const selected = connIds.includes(auth._id.toString());
                                    return (
                                        <Chip
                                            key={auth._id}
                                            label={auth.seller_name}
                                            onClick={() => toggleConnection(auth._id.toString())}
                                            color={selected ? "primary" : "default"}
                                            variant={selected ? "filled" : "outlined"}
                                            sx={{ fontWeight: selected ? 600 : 400 }}
                                        />
                                    );
                                })}
                            </Box>
                            {hasTikTokSelected && (
                                <Button size="small" variant="text" onClick={handleViewTikTokAttributes} sx={{ alignSelf: "flex-start", mt: 0.5, pl: 0, fontSize: "0.78rem" }}>
                                    View TikTok attribute reference →
                                </Button>
                            )}
                        </Box>
                    )}

                    {/* CSV Groups */}
                    {(marketPlace.headers || []).map((headerGroup, index) => (
                        <Card key={index} variant="outlined" sx={{ borderRadius: 2 }}>
                            {/* Card header */}
                            <Box sx={{ px: 2, py: 1.5, background: "rgba(0,0,0,0.025)", borderBottom: "1px solid", borderColor: "divider", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}>
                                <Typography variant="subtitle1" fontWeight={600}>CSV Group {index + 1}</Typography>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                    <FormControlLabel
                                        control={<Checkbox size="small" checked={marketPlace.hasProductLine ? Boolean(marketPlace.hasProductLine[index]) : false} onChange={(e) => {
                                            let m = { ...marketPlace };
                                            if (!m.hasProductLine) m.hasProductLine = [];
                                            m.hasProductLine[index] = e.target.checked;
                                            setMarketPlace({ ...m });
                                        }} />}
                                        label={<Typography variant="body2">Product Line</Typography>}
                                        sx={{ mr: 0 }}
                                    />
                                    <FormControlLabel
                                        control={<Checkbox size="small" checked={marketPlace.disableProductDefaults ? Boolean(marketPlace.disableProductDefaults[index]) : false} onChange={(e) => {
                                            let m = { ...marketPlace };
                                            if (!m.disableProductDefaults) m.disableProductDefaults = [];
                                            m.disableProductDefaults[index] = e.target.checked;
                                            setMarketPlace({ ...m });
                                        }} />}
                                        label={<Typography variant="body2">Disable Defaults</Typography>}
                                        sx={{ mr: 0 }}
                                    />
                                    <IconButton size="small" color="error" onClick={() => {
                                        setDeleteImage(index);
                                        setOnDelete({ onDelete: deleteCSV });
                                        setDeleteTitle("Are you sure you want to delete this CSV group?");
                                        setDeleteModal(true);
                                    }}>
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
                                </Box>
                            </Box>

                            <Box sx={{ p: 2 }}>
                                {/* Add header input */}
                                <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
                                    <TextField
                                        size="small"
                                        placeholder="New header name..."
                                        value={newHeaderTexts[index] || ""}
                                        onChange={(e) => setNewHeaderTexts(prev => { const t = [...prev]; t[index] = e.target.value; return t; })}
                                        onKeyDown={(e) => { if (e.key === "Enter") addHeader(index); }}
                                        sx={{ flex: 1 }}
                                    />
                                    <Button variant="contained" size="small" onClick={() => addHeader(index)} sx={{ whiteSpace: "nowrap" }}>
                                        Add Header
                                    </Button>
                                </Box>

                                {headerGroup.length === 0 && (
                                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 2 }}>
                                        No headers yet. Add one above.
                                    </Typography>
                                )}

                                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                                    {headerGroup.map((h, hIndex) => (
                                        <Box key={hIndex} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1.5, overflow: "hidden" }}>
                                            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 1.5, py: 0.75, background: "rgba(0,0,0,0.02)" }}>
                                                <Typography variant="body2" fontWeight={600} sx={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={h.Label}>
                                                    {h.Label}
                                                </Typography>
                                                <Box sx={{ display: "flex", flexShrink: 0 }}>
                                                    <IconButton size="small" onClick={() => { setUpdate(true); setHeader({ label: h.Label, index, hIndex }); }}>
                                                        <EditNoteIcon fontSize="small" />
                                                    </IconButton>
                                                    <IconButton size="small" color="error" onClick={() => {
                                                        setDeleteImage({ index, hIndex });
                                                        setOnDelete({ onDelete: removeHeader });
                                                        setDeleteTitle("Are you sure you want to remove this header?");
                                                        setDeleteModal(true);
                                                    }}>
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </Box>
                                            </Box>
                                            <Box sx={{ px: 1.5, py: 1, display: "flex", flexDirection: "column", gap: 1 }}>
                                                {marketPlace.hasProductLine && marketPlace.hasProductLine[index] && (
                                                    <TextField
                                                        label="Product Line Default"
                                                        size="small"
                                                        fullWidth
                                                        value={blank?.marketPlaceOverrides?.[marketPlace.name]?.[h.id] ?? (marketPlace.productDefaultValues?.[h.id] ?? "")}
                                                        onChange={(e) => {
                                                            if (blank) {
                                                                let b = { ...blank };
                                                                if (!b.marketPlaceOverrides) b.marketPlaceOverrides = {};
                                                                if (!b.marketPlaceOverrides[marketPlace.name]) b.marketPlaceOverrides[marketPlace.name] = {};
                                                                b.marketPlaceOverrides[marketPlace.name][h.id] = e.target.value;
                                                                setBlank(b);
                                                            } else {
                                                                let m = { ...marketPlace };
                                                                if (!m.productDefaultValues) m.productDefaultValues = {};
                                                                m.productDefaultValues[h.id] = e.target.value;
                                                                setMarketPlace({ ...m });
                                                            }
                                                        }}
                                                    />
                                                )}
                                                <TextField
                                                    label="Default Value"
                                                    size="small"
                                                    fullWidth
                                                    value={blank?.marketPlaceOverrides?.[marketPlace.name]?.[h.id] ?? (marketPlace.defaultValues?.[h.id] ?? "")}
                                                    onChange={(e) => {
                                                        if (blank) {
                                                            let b = { ...blank };
                                                            if (!b.marketPlaceOverrides) b.marketPlaceOverrides = {};
                                                            if (!b.marketPlaceOverrides[marketPlace.name]) b.marketPlaceOverrides[marketPlace.name] = {};
                                                            b.marketPlaceOverrides[marketPlace.name][h.id] = e.target.value;
                                                            setBlank(b);
                                                        } else {
                                                            let m = { ...marketPlace };
                                                            if (!m.defaultValues) m.defaultValues = {};
                                                            m.defaultValues[h.id] = e.target.value;
                                                            setMarketPlace({ ...m });
                                                        }
                                                    }}
                                                />
                                            </Box>
                                        </Box>
                                    ))}
                                </Box>
                            </Box>
                        </Card>
                    ))}

                    <Button
                        variant="outlined"
                        onClick={() => {
                            let m = { ...marketPlace };
                            m.headers.push([]);
                            setMarketPlace({ ...m });
                            setNewHeaderTexts(prev => [...prev, ""]);
                        }}
                        sx={{ alignSelf: "flex-start" }}
                    >
                        + Add CSV Group
                    </Button>

                    {/* Color Family Converter */}
                    <Card variant="outlined" sx={{ borderRadius: 2 }}>
                        <Box
                            sx={{ px: 2, py: 1.5, display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", userSelect: "none" }}
                            onClick={() => setShowColorFamily(v => !v)}
                        >
                            <Typography variant="subtitle1" fontWeight={600}>Color Family Converter</Typography>
                            {showColorFamily ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                        </Box>
                        {showColorFamily && (
                            <Box sx={{ px: 2, pb: 2 }}>
                                <Grid2 container spacing={1.5}>
                                    {Object.keys(marketPlace.colorFamilyConverter || {}).map((colorItem) => (
                                        <Grid2 size={{ xs: 12, sm: 6 }} key={colorItem}>
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                <TextField size="small" value={colorItem} disabled sx={{ flex: 1 }} />
                                                <Typography color="text.secondary" sx={{ flexShrink: 0 }}>→</Typography>
                                                <TextField
                                                    size="small"
                                                    value={marketPlace.colorFamilyConverter[colorItem]}
                                                    onChange={(e) => {
                                                        let m = { ...marketPlace };
                                                        m.colorFamilyConverter[colorItem] = e.target.value;
                                                        setMarketPlace({ ...m });
                                                    }}
                                                    sx={{ flex: 1 }}
                                                />
                                            </Box>
                                        </Grid2>
                                    ))}
                                </Grid2>
                            </Box>
                        )}
                    </Card>

                    {/* Size Name Converter */}
                    <Card variant="outlined" sx={{ borderRadius: 2 }}>
                        <Box
                            sx={{ px: 2, py: 1.5, display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", userSelect: "none" }}
                            onClick={() => setShowSizeConverter(v => !v)}
                        >
                            <Typography variant="subtitle1" fontWeight={600}>Size Name Converter</Typography>
                            {showSizeConverter ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                        </Box>
                        {showSizeConverter && (
                            <Box sx={{ px: 2, pb: 2 }}>
                                <Grid2 container spacing={1.5}>
                                    {Object.keys(marketPlace.sizeConverter || {}).map((sizeItem) => (
                                        <Grid2 size={{ xs: 12, sm: 6 }} key={sizeItem}>
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                <TextField size="small" value={sizeItem} disabled sx={{ flex: 1 }} />
                                                <Typography color="text.secondary" sx={{ flexShrink: 0 }}>→</Typography>
                                                <TextField
                                                    size="small"
                                                    value={marketPlace.sizeConverter[sizeItem]}
                                                    onChange={(e) => {
                                                        let m = { ...marketPlace };
                                                        m.sizeConverter[sizeItem] = e.target.value;
                                                        setMarketPlace({ ...m });
                                                    }}
                                                    sx={{ flex: 1 }}
                                                />
                                            </Box>
                                        </Grid2>
                                    ))}
                                </Grid2>
                            </Box>
                        )}
                    </Card>

                </Box>
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2, borderTop: "1px solid", borderColor: "divider", gap: 1 }}>
                <Button onClick={() => setOpen(false)}>Cancel</Button>
                <Button variant="contained" onClick={createMarketplace} sx={{ minWidth: 180 }}>
                    {marketPlace._id ? "Update Marketplace" : "Create Marketplace"}
                </Button>
            </DialogActions>

            <UpdateModal open={update} setOpen={setUpdate} ori={header} marketPlace={marketPlace} setMarketPlace={setMarketPlace} />

            {/* TikTok attribute reference dialog */}
            <Dialog open={tikTokAttrOpen} onClose={() => { setTikTokAttrOpen(false); setExpandedAttrs(new Set()); }} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3, maxHeight: "88vh" } }}>
                <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pb: 1, borderBottom: "1px solid", borderColor: "divider" }}>
                    <Box>
                        <Typography variant="h6" fontWeight={700}>TikTok Attribute Reference</Typography>
                        {tikTokAttrData?.categoryName && (
                            <Typography variant="caption" color="text.secondary">Category: {tikTokAttrData.categoryName} (ID: {tikTokAttrData.categoryId})</Typography>
                        )}
                    </Box>
                    <IconButton onClick={() => setTikTokAttrOpen(false)} size="small"><CloseIcon fontSize="small" /></IconButton>
                </DialogTitle>
                <DialogContent sx={{ py: 2 }}>
                    {tikTokAttrLoading && <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 4 }}>Loading attributes from TikTok…</Typography>}
                    {tikTokAttrError && <Typography variant="body2" color="error" sx={{ py: 2 }}>{tikTokAttrError}</Typography>}
                    {(tikTokAttrData || tikTokAttrError) && !tikTokAttrLoading && (
                        <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
                            <TextField
                                size="small"
                                placeholder={`Product type (e.g. "${blank?.name || "t-shirt"}")`}
                                value={tikTokSearchTerm}
                                onChange={e => setTikTokSearchTerm(e.target.value)}
                                onKeyDown={e => { if (e.key === "Enter") fetchTikTokAttributes(tikTokSearchTerm); }}
                                sx={{ flex: 1 }}
                            />
                            <Button variant="outlined" size="small" onClick={() => fetchTikTokAttributes(tikTokSearchTerm)} sx={{ whiteSpace: "nowrap" }}>
                                Reload Attributes
                            </Button>
                        </Box>
                    )}
                    {tikTokAttrData && !tikTokAttrLoading && (
                        <Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                Use the <strong>attribute name</strong> as the field key in <code>marketPlaceOverrides</code> (e.g. <code>"Dangerous Goods": "None"</code>). Click a value chip to copy it. The system will also auto-translate common compliance phrases like "No Dangerous Goods" to the correct TikTok value.
                            </Typography>
                            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                                {[...(tikTokAttrData.attributes ?? [])].filter(a => !["size", "color"].includes(a.name?.toLowerCase())).sort((a, b) => (b.is_required ? 1 : 0) - (a.is_required ? 1 : 0)).map((attr) => (
                                    <Card key={attr.id} variant="outlined" sx={{ borderRadius: 1.5, borderColor: attr.is_required ? "primary.light" : "divider" }}>
                                        {(() => {
                                            const currentVal = blank?.marketPlaceOverrides?.[marketPlace.name]?.[attr.name];
                                            const addOverride = (valueName) => {
                                                if (!blank) return;
                                                let b = { ...blank };
                                                if (!b.marketPlaceOverrides) b.marketPlaceOverrides = {};
                                                if (!b.marketPlaceOverrides[marketPlace.name]) b.marketPlaceOverrides[marketPlace.name] = {};
                                                b.marketPlaceOverrides[marketPlace.name][attr.name] = valueName;
                                                setBlank(b);
                                            };
                                            return (
                                                <Box sx={{ px: 2, py: 1, display: "flex", alignItems: "flex-start", gap: 1.5, flexWrap: "wrap" }}>
                                                    <Box sx={{ flex: 1, minWidth: 160 }}>
                                                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexWrap: "wrap" }}>
                                                            <Typography variant="body2" fontWeight={600}>{attr.name}</Typography>
                                                            {attr.is_required && <Chip label="Required" size="small" color="primary" sx={{ height: 16, fontSize: "0.6rem" }} />}
                                                            {currentVal && <Chip label="Added" size="small" color="success" sx={{ height: 16, fontSize: "0.6rem" }} />}
                                                        </Box>
                                                        {currentVal && (
                                                            <Typography variant="caption" color="success.main" sx={{ mt: 0.25, display: "block", fontWeight: 600 }}>
                                                                Set to: {currentVal}
                                                            </Typography>
                                                        )}
                                                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.25 }}>
                                                            <Button size="small" variant="outlined" sx={{ fontSize: "0.65rem", py: 0.2, px: 0.75, lineHeight: 1.4 }} onClick={() => copyToClipboard(attr.name)}>
                                                                {copiedId === attr.name ? "✓ copied field name" : "copy field name"}
                                                            </Button>
                                                        </Box>
                                                        <Typography variant="caption" color="text.disabled" sx={{ mt: 0.25, display: "block" }}>ID: {attr.id}</Typography>
                                                    </Box>
                                                    <Box sx={{ flex: 2, minWidth: 200 }}>
                                                        {attr.values?.length > 0 ? (
                                                            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                                                                {(expandedAttrs.has(attr.id) ? attr.values : attr.values.slice(0, 30)).map(v => {
                                                                    const isSelected = currentVal === v.name;
                                                                    return (
                                                                        <Chip
                                                                            key={v.id ?? v.name}
                                                                            label={v.name}
                                                                            size="small"
                                                                            variant={isSelected ? "filled" : "outlined"}
                                                                            color={isSelected ? "primary" : "default"}
                                                                            sx={{ fontSize: "0.65rem", height: 20, cursor: "pointer" }}
                                                                            onClick={() => blank ? addOverride(v.name) : copyToClipboard(v.name)}
                                                                            title={blank ? `Click to set: ${v.name}` : `Click to copy: ${v.name}`}
                                                                        />
                                                                    );
                                                                })}
                                                                {attr.values.length > 30 && !expandedAttrs.has(attr.id) && (
                                                                    <Typography
                                                                        variant="caption"
                                                                        color="primary"
                                                                        sx={{ alignSelf: "center", cursor: "pointer", textDecoration: "underline" }}
                                                                        onClick={() => setExpandedAttrs(prev => new Set([...prev, attr.id]))}
                                                                    >
                                                                        +{attr.values.length - 30} more
                                                                    </Typography>
                                                                )}
                                                            </Box>
                                                        ) : (
                                                            <Typography variant="caption" color="text.secondary" sx={{ fontStyle: "italic" }}>Custom text accepted</Typography>
                                                        )}
                                                    </Box>
                                                </Box>
                                            );
                                        })()}
                                    </Card>
                                ))}
                            </Box>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 1.5, borderTop: "1px solid", borderColor: "divider" }}>
                    <Button onClick={() => setTikTokAttrOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>
        </Dialog>
    );
};

function UpdateModal({ open, setOpen, ori, marketPlace, setMarketPlace }) {
    const [newHeader, setNewHeader] = useState("");

    useEffect(() => {
        if (open) setNewHeader(ori?.label || "");
    }, [open, ori]);

    const updateHeader = () => {
        if (!newHeader.trim()) return;
        let m = { ...marketPlace };
        m.headers[ori.index][ori.hIndex] = { id: newHeader.trim(), Label: newHeader.trim() };
        setMarketPlace({ ...m });
        setOpen(false);
    };

    return (
        <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
            <DialogTitle sx={{ pb: 1 }}>Rename Header</DialogTitle>
            <DialogContent>
                <TextField
                    label="Header Name"
                    fullWidth
                    autoFocus
                    value={newHeader}
                    onChange={(e) => setNewHeader(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") updateHeader(); }}
                    sx={{ mt: 1 }}
                />
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={() => setOpen(false)}>Cancel</Button>
                <Button variant="contained" onClick={updateHeader}>Save</Button>
            </DialogActions>
        </Dialog>
    );
}

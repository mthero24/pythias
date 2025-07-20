import { Box, Grid2, TextField, Modal, Button, Typography, Card, Container, IconButton, Divider } from "@mui/material";
import DeleteIcon from '@mui/icons-material/Delete';
import DeleteModel from "../reusable/DeleteModal";
import axios from "axios";
import {useState, useEffect, use} from "react";
import CloseIcon from '@mui/icons-material/Close';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import EditNoteIcon from '@mui/icons-material/EditNote';
import Link from "next/link";

const csvFunctions = {
    productSku: (product) => {
        return product.sku ? product.sku : product.name.replace(/ /g, "-").toLowerCase();
    },
    productTitle: (product) => {
        return product.title ? product.title : product.sku;
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
        return product.brand ? product.brand : "No Value";
    },
    variantColor: (variant, sizeConverer, numBlanks, blankName) => {
        return variant.color ? numBlanks > 1 ? `${variant.color.name} (${blankName})` : variant.color.name : "";
    },
    variantSize: (variant, sizeConverter) => {
        return variant.size ? sizeConverter[variant.size.name] ? sizeConverter[variant.size.name] : "" : "";
    },
    variantThreadColor: (variant) => {
        console.log(variant, "variantThreadColor")
        return variant.threadColor ? variant.threadColor.name : "N/A";
    },
    variantSku: (variant) => {
        return variant.sku ? variant.sku : ""
    },
    variantPrice: (variant) => {
        return variant.size ? `$${variant.size.retailPrice.toFixed(2)}` : 0;
    },
    variantWeight: (variant) => {
        return variant.size ? `${variant.size.weight.toFixed(2)}` : 0;
    },
    variantUpc: (variant) => {
        return variant.upc ? variant.upc : "N/A";
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
    variantImage: (variant, color, blankCode) => {
        //console.log(variant, color, blankCode, "variantImage")
        return variant.image ? variant.image : "N/A";
    },
    variantColorFamily: (variant) => {
        return variant.color && variant.color.colorFamily ? variant.color.colorFamily : "";
    }
};

export const MarketplaceModal = ({ open, setOpen, marketPlaces, setMarketPlaces, sizes, blank, setBlank, product, setProduct }) => {
    const [size, setSize] = useState([]);
    const [deleteModal, setDeleteModal] = useState(false);
    const [deleteTitle, setDeleteTitle] = useState();
    const [deleteFunction, setDeleteFunction] = useState({});
    const [deleteImage, setDeleteImage] = useState();
    const [marketplace, setMarketplace] = useState({ name: "", headers: [[]], defaultValues: {}, sizes: {} });
    console.log(product, "product in marketplace modal")
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
    }, [open]);
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
                <Typography id="modal-modal-title" textAlign={"center"} variant="h6" component="h2">
                    Add Product to Marketplace
                </Typography>
                <Box>
                    <Box sx={{ maxHeight: "60vh", overflowY: "auto" }}>
                        <Button variant="outlined" sx={{ margin: "1% 2%", color: "#0f0f0f" }} onClick={() => { setMarketplace({ name: "", headers: [[]], defaultValues: {}, sizes: {} }); setAddMarketPlace(true);}}>Create MarketPlace</Button>
                    </Box>
                    <Box sx={{width: "100%", overflowY: "auto", display: "flex", flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", padding: "1%" }}>
                        {marketPlaces.map(mp => (
                            <Card key={mp._id} sx={{ padding: "1%", display: "flex", flexDirection: "column", alignItems: "center", width: "20%" }} >
                                <Typography variant="p" sx={{ textAlign: "center", marginBottom: "1%", textAlign: "center" }}>{mp.name}</Typography>
                                <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", marginBottom: "1%" }}>
                                    <Button fullWidth size="small" variant="outlined" sx={{ margin: "1% 2%", color: "#0f0f0f" }} onClick={() => { setMarketplace(mp); setAddMarketPlace(true); }}>Edit</Button>
                                    {product &&<Button fullWidth size="small" variant="outlined" sx={{ margin: "1% 2%", color: "#0f0f0f" }} onClick={()=>{
                                        let p = { ...product };
                                        if (!p.marketPlaces) {
                                            p.marketPlaces = {};
                                        }
                                        p.marketPlaces[mp._id] = mp;
                                        let res = axios.post("/api/admin/products", { product: p });
                                        setProduct(p);
                                    }}>Select</Button>}
                                </Box>
                            </Card>
                        ))}
                    </Box>
                    <Divider sx={{ margin: ".5% 0" }} />
                    <Typography variant="h6" sx={{ marginBottom: "1%" }}>Selected Marketplaces</Typography>
                    {product && product.marketPlaces && Object.keys(product.marketPlaces).length > 0 && Object.keys(product.marketPlaces).map((mpId) => (
                        <Box>
                            {product.marketPlaces[mpId].headers.map((header, index) => (
                                <Box sx={{ display: "flex", flexDirection: "column", padding: "1%", borderBottom: "1px solid #eee",position: "relative", top: "-5%" }}>
                                    <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "flex-end", alignItems: "center", position: "relative", marginTop: "-5%", zIndex:99 }}>
                                        <Button variant="outlined" size="small" sx={{ margin: "1% 2%", color: "#0f0f0f" }} href={`/api/download?marketPlace=${product.marketPlaces[mpId]._id}&product=${product._id}&header=${index}`} target="_blank">Download</Button>
                                    </Box>
                                    <MarketPlaceList key={mpId} marketPlace={product.marketPlaces[mpId]} header={header} addMarketPlace={addMarketPlace} product={product} />
                                </Box>
                            ))}
                        </Box>
                    ))}
                </Box>
                <AddMarketplaceModal open={addMarketPlace} setOpen={setAddMarketPlace} sizes={size} marketPlace={marketplace} setMarketPlace={setMarketplace} setDeleteModal={setDeleteModal} setDeleteTitle={setDeleteTitle} setDeleteImage={setDeleteImage} setOnDelete={setDeleteFunction} setMarketPlaces={setMarketPlaces} blank={blank} setBlank={setBlank} />
                <DeleteModel open={deleteModal} setOpen={setDeleteModal} title={deleteTitle} onDelete={deleteFunction.onDelete} deleteImage={deleteImage} />
            </Box>
        </Modal>
    )
}
const MarketPlaceList = ({ marketPlace, header, addMarketPlace, product }) => {
    let headers = {}
    for(let h of header) {
        headers[h.Label] = []
    }
    let index = 0;
    if(product.threadColors && product.threadColors.length > 0) {
        for (let b of product.blanks) {
            for (let tc of product.threadColors) {
                for (let c of product.colors) {
                    if (product.variants[b.code] && product.variants[b.code][tc.name] && product.variants[b.code][tc.name][c.name] && product.variants[b.code][tc.name][c.name].length > 0) {
                        for (let v of product.variants[b.code][tc.name][c.name]) {
                            for (let h of Object.keys(headers)) {
                                let val = HeaderList({ product, mp: marketPlace, variant: v, blankOverRides: product.blanks.filter(bl => bl.code == b.code)[0].marketPlaceOverrides[marketPlace.name], headerLabel: h, index: index, color: c.name, blankCode: b.code, category: product.blanks.filter(bl => bl.code == b.code)[0].category[0], threadColor: tc.name, numBlanks: product.blanks.length, blankName: b.name })
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
                if (product.variants[b.code] && product.variants[b.code][c.name] && product.variants[b.code][c.name].length > 0){
                    for(let v of product.variants[b.code][c.name]) {
                        for(let h of Object.keys(headers)) {
                            let val = HeaderList({ product, mp: marketPlace, variant: v, blankOverRides: product.blanks.filter(bl => bl.code == b.code)[0].marketPlaceOverrides[marketPlace.name], headerLabel: h, index: index, color: c.name, blankCode: b.code, category: product.blanks.filter(bl => bl.code == b.code)[0].category, numBlanks: product.blanks.length, blankName: b.name })
                            headers[h].push(val);
                        }
                        index++;
                    }
                }

            }
        }
    }
    console.log(headers, "headers")
    return (
        <Card sx={{ padding: "2%" }} >
            <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: "0% 1%" }}>
                <Typography variant="h6" sx={{ textAlign: "center", marginBottom: "1%", textAlign: "center" }}>{marketPlace.name}</Typography>
            </Box>
            <Box sx={{ overflowY: "auto", marginTop: "2%", display: "flex", flexDirection: "row", position: "relative", marginTop: "-2%", zIndex: 1 }}>   
                <Box sx={{ maxHeight: "60vh", overflowY: "auto", marginTop: "2%", display: "flex", flexDirection: "row" }}>
                    {!addMarketPlace &&Object.keys(headers).map((header, hIndex) => (
                        <Box key={hIndex} sx={{ minWidth: "30%", textAlign: "center" }}>
                            <Box sx={{ display: "flex", minWidth: "100%", justifyContent: "space-between", padding: "3%", border: "1px solid #eee" }}>
                                <Typography variant="body1" sx={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={header}>{header}</Typography>
                            </Box>
                            {headers[header].map((value, index) => (
                                <Box sx={{ display: "flex", minWidth: "100%", justifyContent: "space-between", padding: "3%", border: "1px solid #eee" }}>
                                    <Typography variant="body1" sx={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={value}>{value}</Typography>
                                </Box>
                            ))}
                        </Box>
                    ))}
                </Box>
            </Box>
        </Card>
    ); 
}

const HeaderList = ({ product, mp, variant, blankOverRides, headerLabel, index, color, blankCode, threadColor, category, numBlanks, blankName }) => {
    console.log(numBlanks, blankName, "numBlanks, blankName")

    let value = "N/A";
    if (mp.defaultValues[headerLabel] && mp.defaultValues[headerLabel].includes("product") && csvFunctions[mp.defaultValues[headerLabel]]) {
        if (headerLabel == "Image Alt Text" && index >= product.productImages.length) {
            value = "N/A";
        }
        else value = csvFunctions[mp.defaultValues[headerLabel]](product, index);
    }
    else if (mp.defaultValues[headerLabel] && mp.defaultValues[headerLabel].includes("variant") && csvFunctions[mp.defaultValues[headerLabel]]) {
        value = csvFunctions[mp.defaultValues[headerLabel]](variant, mp.sizeConverter, numBlanks, blankName);
    }else if(mp.defaultValues[headerLabel]== "index") {
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
    //console.log(mp.defaultValues[headerLabel], "defaultValues", value)
    return value
}
const AddMarketplaceModal = ({ open, setOpen, sizes, marketPlace, setMarketPlace, setDeleteModal, setDeleteImage, setOnDelete, setDeleteTitle, setMarketPlaces, blank, setBlank }) => {
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
            console.log(m, "marketPlace")
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
            setMarketPlaces(res.data.marketPlaces);
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
                                                {console.log(sizeItem, "sizeItem")}
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
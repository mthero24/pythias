"use client";
import { useState, useEffect, useContext, createContext } from 'react';
import { Fab, Drawer, Box, Grid2, Snackbar, Typography, Modal, Button } from "@mui/material";
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import DeleteModal from "./DeleteModal";
import CloseIcon from '@mui/icons-material/Close';
import axios from 'axios';
import { HeaderList, MarketPlaceList, csvFunctions } from "./MarketPlaceModal"
import { set } from 'mongoose';
const CSVContext = createContext();


export const CSVProvider = ({ children }) => {
    const [csvData, setCsvData] = useState({});
    const [show, setShow] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [added, setAdded] = useState(false);
    const [notAdded, setNotAdded] = useState(false);
    const [deleteModal, setDeleteModal] = useState(false);
    const [deleteTitle, setDeleteTitle] = useState("");
    const [deleteFunction, setDeleteFunction] = useState({});
    const [type, setType] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [marketplace, setMarketplace] = useState();
    const [change, setChange] = useState(false);
    const [products, setProducts] = useState([]);
    let deleteImage
    useEffect(() => {
        // Load initial CSV data if needed
        const loadInitialData = async () => {
            setShow(false)
            let csv = localStorage.getItem("csvData");
            csv = csv ? JSON.parse(csv) : {};
            if (csv && csv.marketplaces) {
                setCsvData(csv);
            }else{
                csv = {}
                let marketPlaces = await axios.get("/api/admin/marketplaces")
                csv.marketplaces = marketPlaces.data.marketPlaces.map(mp => { return { name: mp.name, _id: mp._id } });
                setCsvData(csv);
                localStorage.setItem("csvData", JSON.stringify(csv));
            }
        };
        loadInitialData();
    }, []);
    useEffect( () => {
        // Save csvData to localStorage whenever it changes
        if (csvData.marketplaces && csvData.products) localStorage.setItem("csvData", JSON.stringify(csvData));
        else setShow(false)
    }, [csvData]);
    const handleClear = async () => {
        let updatedCsvData = { ...csvData };
        //console.log("Clearing products for", updatedCsvData, deleteImage);
        updatedCsvData.products[deleteImage] = [];
        setCsvData(updatedCsvData);
    };
    return (
        <CSVContext.Provider value={{ csvData, setCsvData, show, setShow, setAdded, setNotAdded }}>
            {children}
            <Fab color="primary" aria-label="add" sx={{ display: show ? 'block' : 'none', position: 'fixed', bottom: 16, right: 16 }} onClick={() => {setShow(false);setDrawerOpen(true)}}>
                <AddIcon />
            </Fab>
            <Snackbar
                open={added}
                anchorOrigin={{ vertical: "top", horizontal: "center" }}
                autoHideDuration={1200}
                slots={{ transition: "fade" }}
                onClose={() => setAdded(false)}
                message={
                    <Typography variant="body2" sx={{  textAlign: "center" }}>
                        Product added to CSV
                    </Typography>
                }
            />
            <Snackbar
                open={notAdded}
                anchorOrigin={{ vertical: "top", horizontal: "center" }}
                autoHideDuration={1200}
                slots={{ transition: "fade" }}
                onClose={() => setNotAdded(false)}
                message={
                    <Typography variant="body2" sx={{ textAlign: "center" }}>
                        Product already exists in CSV
                    </Typography>
                }
            />
            <Drawer
                anchor={"right"}
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
            >
                <Box
                    sx={{ width: 350 }}
                    role="presentation"
                    overflowX="hidden"
                    overflowY="auto"
                >
                    <Grid2 container spacing={2} sx={{ padding: "16px" }}>
                        <Box sx={{ width: "100%", display: "flex", flexDirection: "row", justifyContent: "flex-end", alignItems: "center", cursor: "pointer", "&:hover": { opacity: .6 } }} onClick={() => setDrawerOpen(false)}>
                            <CloseIcon sx={{ color: "#780606" }} />
                        </Box>
                        <p>Marketplaces:</p>
                        {csvData && csvData.marketplaces && csvData.marketplaces.length > 0  && csvData.marketplaces.map((marketplace, index) => (
                            <Grid2 size={12} key={index} sx={{ border: "1px solid #ddd", borderRadius: "4px", padding: "2%", "&:hover": { backgroundColor: "#f5f5f5", cursor: "pointer" } }}>
                                <Grid2 container spacing={2} sx={{ width: "100%", alignItems: "center" }}>
                                    <Grid2 size={6} sx={{ textAlign: "center", textWrap: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} onClick={() => {
                                        setMarketplace(marketplace._id);
                                        setProducts(csvData.products && csvData.products[marketplace.name] ? csvData.products[marketplace.name] : []);
                                        setModalOpen(true);
                                    }}>
                                        <h3 sx={{ width: "40%", textAlign: "center" }}>{marketplace.name}</h3>
                                    </Grid2>
                                    <Grid2 size={5} sx={{ textAlign: "center", textWrap: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} onClick={() => {
                                        setMarketplace(marketplace._id);
                                        setProducts(csvData.products && csvData.products[marketplace.name] ? csvData.products[marketplace.name] : []);
                                        setModalOpen(true);
                                    }}>
                                        {!change && <h3 sx={{ width: "40%", textAlign: "center" }}>Products: {csvData.products && csvData.products[marketplace.name] ? csvData.products[marketplace.name].length : 0} </h3>}
                                    </Grid2>
                                    <Grid2 size={1} sx={{ textAlign: "center",}}>
                                        <Box sx={{width: "20%", display: "flex", justifyContent: "flex-end"}}>
                                            <DeleteIcon sx={{ color: "#780606" }} onClick={() => {
                                                setDeleteFunction({ onDelete: handleClear }); 
                                                setDeleteTitle(`Are You Sure You want to Clear Products from ${marketplace.name}?`); 
                                                deleteImage = marketplace.name; 
                                                setDeleteModal(true);
                                            }} title="Clear Products" />
                                        </Box>
                                    </Grid2>
                                </Grid2>
                            </Grid2>
                        ))}
                    </Grid2>
                </Box>
                <DeleteModal open={deleteModal} setOpen={setDeleteModal} title={deleteTitle } onDelete={deleteFunction.onDelete} deleteImage={deleteImage} type={type} />
                <CsvModal open={modalOpen} setOpen={setModalOpen} marketplace={marketplace} products={products} />
            </Drawer>
        </CSVContext.Provider>
    );
};

export const useCSV = () => {
    const context = useContext(CSVContext);
    if (!context) {
        throw new Error("useCSV must be used within a CSVProvider");
    }
    return context;
};

export const CsvModal = ({open, setOpen, marketplace, products})=>{
    const [market, setMarket] = useState()
    const [connections, setConnections] = useState([])
    const [prods, setProds] = useState([])
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        const getData = async () => {
            if (marketplace && products && products.length > 0) {
                let mark = await axios.get(`/api/admin/marketplaces?marketPlace=${marketplace}`);
                let pods = await axios.get(`/api/admin/products?products=${products.map(p => p._id).toString()}`);
                let conns = await axios.get("/api/admin/integrations", { params: { provider: "premierPrinting" } });
                //console.log(mark.data, pods.data, conns.data);
                setMarket(mark.data.marketPlaces[0]);
                setProds(pods.data.products);
                setConnections(conns.data.integration);
            } else {
                setMarket(null);
                setProds([]);
            }
            setLoading(false);
        }
        if (marketplace && products) {
            getData();
            setLoading(true);
        }
    }, [marketplace, products])
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
        >
            <Box sx={style}>
               {!loading && <Box>
                    <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "flex-end", alignItems: "center", padding: "1%", cursor: "pointer", "&:hover": { opacity: .6 } }} onClick={() => setOpen(false)}>
                        <CloseIcon sx={{ color: "#780606" }} />
                    </Box>
                    <Typography id="modal-modal-title" textAlign={"center"} variant="h6" component="h2">
                        Add Product to Marketplace
                    </Typography>
                    <Box>
                        {market && market.headers.map((header, index) => (
                            <Box key={market._id + "-" + index} sx={{ display: "flex", flexDirection: "column", padding: "1%", borderBottom: "1px solid #eee", position: "relative", top: "-5%" }}>
                                <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "flex-end", alignItems: "center", position: "relative", }}>
                                    {market.connections && market.connections.map(c => connections.filter(conn => conn._id.toString() === c.toString()).filter(c => c.displayName.toLowerCase().includes("acenda"))[0]).length > 0 && <Button variant="outlined" size="small" sx={{ margin: "1% 2%", color: "#0f0f0f" }} onClick={async () => {
                                        let res = await axios.get("/api/integrations/acenda", { params: { connectionId: market.connections.map(c => connections.filter(conn => conn._id.toString() === c.toString()).filter(c => c.displayName.toLowerCase().includes("acenda"))[0])[0]._id, prods: prods.map(p => p._id).join(",") } });
                                    }}>Add Inventory</Button>}
                                    <Button variant="outlined" size="small" sx={{ margin: "1% 2%", color: "#0f0f0f" }} href={`/api/download?marketPlace=${market._id}&product=${products.map(p => p._id).toString()}&header=${index}`} target="_blank">Download</Button>
                                </Box>
                                <MarketPlaceList marketPlace={market} header={header} addMarketPlace={false} products={prods} productLine={market.hasProductLine ? market.hasProductLine[index] : false} />
                            </Box>
                        ))}
                    </Box>
                </Box>}
                {loading && <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
                    <Typography variant="h6">Loading...</Typography>
                </Box>}
            </Box>
        </Modal>
    )
}
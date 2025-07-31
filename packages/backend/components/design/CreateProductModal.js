import { Box, Grid2, TextField, Modal, Button, Typography, Card, Divider, FormControlLabel, Checkbox, List, CircularProgress, ListItemText, Avatar, ListItemAvatar, ListItem, ImageList, ImageListItem } from "@mui/material";
import CreatableSelect from "react-select/creatable";
import axios from "axios";
import { useState, useEffect, useRef } from "react";
import CheckIcon from '@mui/icons-material/Check';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import CloseIcon from '@mui/icons-material/Close';
import { BlankStage } from "./stages/blankStage";
import { ColorStage } from "./stages/colorStage";
import { ProductImageStage } from "./stages/productImageStage";
import { VariantImageStage } from "./stages/variantImageStage";
import { InformationStage } from "./stages/informationStage";
import { PreviewStage } from "./stages/previewStage";
import { set } from "mongoose";

export const CreateProductModal = ({ open, setOpen, product, setProduct, design, setDesign, updateDesign, blanks, colors, imageGroups, brands, genders, seasons, setSeasons, setGenders, setBrands, CreateSku, source, loading, setLoading, preview, setPreview }) => {
    const [cols, setColors] = useState({})
    const [sizes, setSizes] = useState({})
    const [images, setImages] = useState([])
    const [stage, setStage] = useState("blanks")
    const [upcs, setUpcs] = useState([])
    const [tempUpcs, setTempUpcs] = useState([])
    const [combined, setCombined] = useState(false);
    const [products, setProducts] = useState([]);
    const targetRef = useRef(null);
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
    useEffect(() => {
        if(product) {
            let prods = []
            let prod = {...product}
            for (let b of prod.blanks) {
                if (b.multiImages["modelFront"] && b.multiImages["modelFront"].length > 0) {
                    for (let i of b.multiImages["modelFront"]) {
                        if (!b.multiImages["front"].filter(mi => mi.image == i.image)[0]) {
                            b.multiImages["front"].push(i);
                        }
                    }
                }
                if (b.multiImages["modelBack"] && b.multiImages["modelBack"].length > 0) {
                    for (let i of b.multiImages["modelBack"]) {
                        if (!b.multiImages["back"].filter(mi => mi.image == i.image)[0]) {
                            b.multiImages["back"].push(i);
                        }
                    }
                }
            }
            if(prod && prod._id)prods.push(prod);
            setProducts(prods);
        }
    }, [product])
    useEffect(() => {
        if(open && preview) {
            setStage("preview");
        }
    }, [open]);
    useEffect(() => {
        const handleBeforeUnload = async (event) => {
            // Perform actions before the page unloads
            // e.g., save unsaved data, send analytics, clean up resources
            //event.preventDefault(); // This line is crucial for displaying the prompt
            let res = await axios.post("/api/upc/releasehold", { upcs: window.dataLayer[0] }); // Release hold on temp UPCs if any
        // Optional: Display a confirmation message to the user
        // event.preventDefault(); // This line is crucial for displaying the prompt
        // event.returnValue = 'Are you sure you want to leave?';
        };
        window.addEventListener('beforeunload', handleBeforeUnload);

        // Cleanup function: Remove the event listener when the component unmounts
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, []);    
    for(let b of blanks){
        if (b.multiImages["modelFront"] && b.multiImages["modelFront"].length > 0) {
            for (let i of b.multiImages["modelFront"]){
                if (!b.multiImages["front"].filter(mi=> mi.image == i.image)[0]) {
                    b.multiImages["front"].push(i);
                }
            }
        }
        if (b.multiImages["modelBack"] && b.multiImages["modelBack"].length > 0) {
            for (let i of b.multiImages["modelBack"]){
                if (!b.multiImages["back"].filter(mi=> mi.image == i.image)[0]) {
                    b.multiImages["back"].push(i);
                }
            }
        }
    }
    const getUpcs = async ({ blanks, design }) => {
        let upcs = await axios.post("/api/upc", { blanks, design }).catch(e => {
            console.error(e);
        });
        setUpcs(upcs.data.upcs);
    }
    const getTempUpcs = async (count) => {
        let tempUpcs = await axios.post("/api/upc", { count }).catch(e => {
            console.error(e);
        });
        if(!window.dataLayer) window.dataLayer = [];
        setTempUpcs([...tempUpcs.data.upcs]);
        window.dataLayer.push(tempUpcs.data.upcs)
    }
    const releaseHold = async () => {
        let res = await axios.post("/api/upc/releasehold", { upcs: tempUpcs });
    }
    product.tags = design.tags ? design.tags : []
    if (product.defaultColor && !product.defaultColor._id){
        product.defaultColor = colors.filter(c => c._id.toString() == product.defaultColor.toString())[0]
    }
    useEffect(() => {
        scrollToTarget();
    }, [stage]);
    const scrollToTarget = () => {
        if (targetRef.current) {
            targetRef.current.scrollTop = 0;
        }
      };
    return (
        <Modal
            open={open}
            onClose={() => { setOpen(false); setUpcs([]); releaseHold(); setTempUpcs([]); setStage("blanks"); setProduct({ blanks: [], colors: [], threadColors: [], sizes: [], productImages: { blank: [], color: [], threadColor: [] } }); setPreview(false); setProducts([]); }}
            aria-labelledby="modal-modal-title"
            aria-describedby="modal-modal-description"
            id="create-product-modal"
        >
            <Box sx={style} ref={targetRef}>
                <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "flex-end", alignItems: "center", padding: "1%", cursor: "pointer", "&:hover": { opacity: .6 } }} onClick={() => { setOpen(false); setUpcs([]); releaseHold(); setTempUpcs([]); setStage("blanks"); setProduct({ blanks: [], colors: [], threadColors: [], sizes: [], productImages: { blank: [], color: [], threadColor: [] } }); setProducts([]); setPreview(false); }}>
                    <CloseIcon sx={{ color: "#780606" }} />
                </Box>
                <Typography variant="h4" sx={{ marginBottom: "2%", color: "#000", textAlign: "center" }} >Create Product</Typography>
                {stage == "blanks" && 
                    <BlankStage products={products} setProducts={setProducts} stage={stage} setStage={setStage} blanks={blanks} design={design} source={source} combined={combined} colors={colors} cols={cols} setColors={setColors} sizes={sizes} setSizes={setSizes} setCombined={setCombined} getUpcs={getUpcs}scrollToTarget={scrollToTarget} />
                }
                {stage == "colors" && 
                    <ColorStage products={products} setProducts={setProducts} stage={stage} setStage={setStage} design={design} source={source} combined={combined} colors={colors} cols={cols} sizes={sizes} setColors={setColors} setCombined={setCombined} getUpcs={getUpcs} setImages={setImages} upcs={upcs} getTempUpcs={getTempUpcs} />
                }
                {stage == "product_images" && 
                    <ProductImageStage products={products} setProducts={setProducts} setStage={setStage} design={design} source={source} combined={combined} colors={colors} cols={cols} sizes={sizes} setColors={setColors} setImages={setImages} images={images} imageGroups={imageGroups} />
                }
                {stage == "variant_images" && 
                    <VariantImageStage products={products} setProducts={setProducts} design={design} source={source} setStage={setStage} />
                }
                {stage == "information" && 
                   <InformationStage
                    products={products} setProducts={setProducts} product={product} setProduct={setProduct} design={design} source={source} setStage={setStage} brands={brands} seasons={seasons} setSeasons={setSeasons} setBrands={setBrands} setGenders={setGenders} genders={genders} CreateSku={CreateSku} setLoading={setLoading} loading={loading} upcs={upcs} tempUpcs={tempUpcs} colors={colors}
                   />
                }
                {stage == "preview" && 
                    <PreviewStage
                        products={products} setProducts={setProducts} product={product} setProduct={setProduct} design={design} source={source} setStage={setStage} brands={brands} seasons={seasons} setSeasons={setSeasons} setBrands={setBrands} setGenders={setGenders} genders={genders} upcs={upcs} setUpcs={setUpcs} releaseHold={releaseHold} setLoading={setLoading} loading={loading} images={images} setImages={setImages} imageGroups={imageGroups} setDesign={setDesign} updateDesign={updateDesign} setOpen={setOpen} setSizes={setSizes} setColors={setColors} cols={cols} sizes={sizes} preview={preview} setPreview={setPreview} tempUpcs={tempUpcs} setTempUpcs={setTempUpcs} setCombined={setCombined} combined={combined} colors={colors}
                    />
                }
            </Box>
        </Modal>
    )
}


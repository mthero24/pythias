import { Box, Button, Modal, Typography, Stepper, Step, StepLabel, StepButton, Snackbar, Alert, IconButton, useTheme, useMediaQuery } from "@mui/material";

import axios from "axios";
import { useState, useEffect, useRef, useCallback } from "react";
import CloseIcon from '@mui/icons-material/Close';
import { CatalogProductCreate } from "../product/CatalogProductCreate";
import { CatalogPreview } from "../product/CatalogPreview";
import { BlankStage } from "./stages/blankStage";
import { ColorStage } from "./stages/colorStage";
import { ProductImageStage } from "./stages/productImageStage";
import { VariantImageStage } from "./stages/variantImageStage";
import { InformationStage } from "./stages/informationStage";
import { PreviewStage } from "./stages/previewStage";

const STAGES = [
    { key: "blanks", label: "Blanks" },
    { key: "colors", label: "Colors & Sizes" },
    { key: "product_images", label: "Product Images" },
    { key: "variant_images", label: "Variant Images" },
    { key: "information", label: "Information" },
    { key: "preview", label: "Preview" },
];

export const CreateProductModal = ({ open, setOpen, product, setProduct, design, setDesign, updateDesign, blanks, colors, imageGroups, brands, genders, seasons, setSeasons, setGenders, setBrands, CreateSku, source, slug, loading, setLoading, preview, setPreview, themes, sportUsedFor , setThemes, setSportUsedFor, pageProducts, setPageProducts, printTypes, licenses }) => {
    const [cols, setColors] = useState({})
    const [sizes, setSizes] = useState({})
    const [images, setImages] = useState([])
    const [stage, setStage] = useState("blanks")
    const [upcs, setUpcs] = useState([])
    const [tempUpcs, setTempUpcs] = useState([])
    const [combined, setCombined] = useState(false);
    const [products, setProducts] = useState([]);
    const [toast, setToast] = useState({ open: false, message: "", severity: "success" });
    const targetRef = useRef(null);
    const [lockedBy, setLockedBy] = useState(null);   // set when another user is editing this product
    const heldRef = useRef(false);

    // Edit lock — while the modal is open editing an EXISTING product, claim product:<id> so a second
    // user can't open the same product and clobber the save. Released when the modal closes. Keyed on
    // the product (not the design) so opening this from the design editor doesn't touch that lock.
    useEffect(() => {
        const id = open ? product?._id : null;
        if (!id) { heldRef.current = false; setLockedBy(null); return; }
        const key = `product:${id}`;
        let alive = true;
        const claim = async () => {
            try {
                const r = await axios.post("/api/edit-lock", { key });
                if (!alive) return;
                const ok = !!r.data?.ok;
                heldRef.current = ok;
                setLockedBy(ok ? null : (r.data?.lockedBy || "another user"));
            } catch { if (alive) { heldRef.current = true; setLockedBy(null); } }  // fail open
        };
        claim();
        const hb = setInterval(() => { if (heldRef.current) axios.post("/api/edit-lock", { key }).catch(() => {}); }, 30000);
        const onUnload = () => { try { navigator.sendBeacon?.("/api/edit-lock", new Blob([JSON.stringify({ key, release: true })], { type: "application/json" })); } catch { /* ignore */ } };
        window.addEventListener("beforeunload", onUnload);
        return () => {
            alive = false;
            clearInterval(hb);
            window.removeEventListener("beforeunload", onUnload);
            if (heldRef.current) axios.delete("/api/edit-lock", { data: { key } }).catch(() => {});
            heldRef.current = false;
        };
    }, [open, product?._id]);
    const theme = useTheme();
    const isSmall = useMediaQuery(theme.breakpoints.down('sm'));
    const showToast = useCallback((message, severity = "success") => {
        setToast({ open: true, message, severity });
    }, []);
    const currentStepIndex = STAGES.findIndex(s => s.key === stage);
    const style = {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: isSmall ? "98%" : "90%",
        height: isSmall ? "98%" : "90%",
        bgcolor: 'background.paper',
        borderRadius: 2,
        boxShadow: 24,
        p: { xs: 2, sm: 3, md: 4 },
        overflowX: "auto",
        overflowY: "auto",
    };
    useEffect(() => {
        if(product) {
            let prods = []
            let prod = {...product}
            if(prod?.blanks?.length > 1) setCombined(true);
            if(prod && prod._id)prods.push(prod);
            setProducts(prods);
        }
    }, [product]);
    useEffect(() => {
        if(product && product._id) {
            let prod= {...product,}
            if (!design._id) setDesign({...prod.design, products: [{...prod}]});
        }
    }, [product]);
    useEffect(() => {
        if(open && preview) {
            setStage("preview");
        }
    }, [open]);
    useEffect(() => {
        const handleBeforeUnload = async (event) => {
            // Perform actions before the page unloads
            // e.g., save unsaved data, send analytics, clean up resources
            if (window.dataLayer[0]) {
                event.preventDefault(); // This line is crucial for displaying the prompt
                let res = await axios.post("/api/upc/releasehold", { upcs: window.dataLayer[0] }); // Release hold on temp UPCs if any
            }
            // Optional: Display a confirmation message to the user
            //event.preventDefault(); // This line is crucial for displaying the prompt
            //event.returnValue = 'Are you sure you want to leave?';
        };
        window.addEventListener('beforeunload', handleBeforeUnload);

        // Cleanup function: Remove the event listener when the component unmounts
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, []);    
    
    const getUpcs = async ({ blanks, design }) => {
        let upcs = await axios.post("/api/upc", { blanks, design }).catch(e => {
            console.error(e);
        });
        setUpcs(upcs.data.upcs);
    }
    const getTempUpcs = async (count) => {
        console.log("Getting temp UPCs", count)
        let tempUpcs = await axios.post("/api/upc", { count }).catch(e => {
            console.error(e);
        });
        if(!window.dataLayer) window.dataLayer = [];
        console.log(tempUpcs.data.upcs, "tempUpcs")
        setTempUpcs([...tempUpcs.data.upcs]);
        window.dataLayer.push(tempUpcs.data.upcs)
    }
    const releaseHold = async () => {
        let res = await axios.post("/api/upc/releasehold", { upcs: tempUpcs });
        window.dataLayer = [];
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
    // If someone else is already editing this product, block this user with a message instead of the editor.
    if (open && lockedBy) {
        const closeLocked = () => { setLockedBy(null); setOpen(false); };
        return (
            <Modal open={open} onClose={closeLocked}>
                <Box sx={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 440, maxWidth: "92%", bgcolor: "background.paper", borderRadius: 2, boxShadow: 24, p: 4, textAlign: "center" }}>
                    <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>This product is being edited</Typography>
                    <Typography sx={{ mb: 3, color: "text.secondary" }}>
                        Page is already being edited by <b>{lockedBy}</b>. Try again when {lockedBy} is finished with the page.
                    </Typography>
                    <Button variant="contained" onClick={closeLocked}>Close</Button>
                </Box>
            </Modal>
        );
    }

    // Catalog (buy-not-build / imported) products use their own editor + preview — the blank/design
    // stages below don't apply. POD products are untouched.
    if (product?.isCatalogProduct) {
        const closeCatalog = () => { setOpen(false); setPreview(false); };
        return (
            <Modal open={open} onClose={closeCatalog} id="catalog-product-modal">
                <Box sx={style}>
                    <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                        <IconButton onClick={closeCatalog}><CloseIcon /></IconButton>
                    </Box>
                    {preview
                        ? <CatalogPreview product={product} />
                        : <CatalogProductCreate editProduct={product} onSaved={() => { closeCatalog(); if (typeof window !== "undefined") window.location.reload(); }} onCancel={closeCatalog} />}
                </Box>
            </Modal>
        );
    }

    return (
        <Modal
            open={open}
            onClose={() => { setOpen(false); setUpcs([]); releaseHold(); setTempUpcs([]); setStage("blanks"); setProduct({ blanks: [], colors: [], threadColors: [], sizes: [], productImages: { blank: [], color: [], threadColor: [] } }); setPreview(false); setProducts([]); }}
            aria-labelledby="modal-modal-title"
            aria-describedby="modal-modal-description"
            id="create-product-modal"
        >
            <Box sx={style} ref={targetRef}>
                <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 1 }}>
                    <Typography variant="h5" sx={{ fontWeight: 500 }}>{product?._id ? "Edit Product" : "Create Product"}</Typography>
                    <IconButton onClick={() => { setOpen(false); setUpcs([]); releaseHold(); setTempUpcs([]); setStage("blanks"); setProduct({ blanks: [], colors: [], threadColors: [], sizes: [], productImages: { blank: [], color: [], threadColor: [] } }); setProducts([]); setPreview(false); }} aria-label="close" size="small">
                        <CloseIcon />
                    </IconButton>
                </Box>
                <Stepper activeStep={currentStepIndex} alternativeLabel sx={{ marginBottom: 3 }} nonLinear>
                    {STAGES.map((s, idx) => (
                        <Step key={s.key} completed={idx < currentStepIndex}>
                            <StepButton onClick={() => { if (idx <= currentStepIndex) setStage(s.key); }} disabled={idx > currentStepIndex}>
                                <StepLabel>{s.label}</StepLabel>
                            </StepButton>
                        </Step>
                    ))}
                </Stepper>
                {stage == "blanks" &&
                    <BlankStage products={products} setProducts={setProducts} stage={stage} setStage={setStage} blanks={blanks} design={design} source={source} slug={slug} combined={combined} colors={colors} cols={cols} setColors={setColors} sizes={sizes} setSizes={setSizes} setCombined={setCombined} getUpcs={getUpcs} scrollToTarget={scrollToTarget} showToast={showToast} />
                }
                {stage == "colors" &&
                    <ColorStage products={products} setProducts={setProducts} stage={stage} setStage={setStage} design={design} source={source} slug={slug} combined={combined} colors={colors} cols={cols} sizes={sizes} setColors={setColors} setCombined={setCombined} getUpcs={getUpcs} setImages={setImages} upcs={upcs} getTempUpcs={getTempUpcs} showToast={showToast} />
                }
                {stage == "product_images" &&
                    <ProductImageStage products={products} setProducts={setProducts} setStage={setStage} design={design} source={source} combined={combined} colors={colors} cols={cols} sizes={sizes} setColors={setColors} setImages={setImages} images={images} imageGroups={imageGroups} showToast={showToast} />
                }
                {stage == "variant_images" &&
                    <VariantImageStage products={products} setProducts={setProducts} design={design} source={source} slug={slug} setStage={setStage} showToast={showToast} />
                }
                {stage == "information" &&
                   <InformationStage
                    products={products} setProducts={setProducts} product={product} setProduct={setProduct} design={design} source={source} setStage={setStage} brands={brands} seasons={seasons} setSeasons={setSeasons} setBrands={setBrands} setGenders={setGenders} genders={genders} CreateSku={CreateSku} setLoading={setLoading} loading={loading} upcs={upcs} tempUpcs={tempUpcs} colors={colors} themes={themes} sportUsedFor={sportUsedFor} setPreview={setPreview} preview={preview} setOpen={setOpen} updateDesign={updateDesign} setSizes={setSizes} setColors={setColors} cols={cols} sizes={sizes} releaseHold={releaseHold} setTempUpcs={setTempUpcs} combined={combined} setCombined={setCombined} setThemes={setThemes} setSportUsedFor={setSportUsedFor} printTypes={printTypes} licenses={licenses} showToast={showToast}
                   />
                }
                {stage == "preview" &&
                    <PreviewStage
                    products={products} setProducts={setProducts} product={product} setProduct={setProduct} design={design} source={source} setStage={setStage} brands={brands} seasons={seasons} setSeasons={setSeasons} setBrands={setBrands} setGenders={setGenders} genders={genders} upcs={upcs} setUpcs={setUpcs} releaseHold={releaseHold} setLoading={setLoading} loading={loading} images={images} setImages={setImages} imageGroups={imageGroups} updateDesign={updateDesign} setOpen={setOpen} setSizes={setSizes} setColors={setColors} cols={cols} sizes={sizes} preview={preview} setPreview={setPreview} tempUpcs={tempUpcs} setTempUpcs={setTempUpcs} setCombined={setCombined} combined={combined} colors={colors} setDesign={setDesign} pageProducts={pageProducts} setPageProducts={setPageProducts} showToast={showToast}
                    />
                }
                <Snackbar open={toast.open} autoHideDuration={4000} onClose={() => setToast(t => ({ ...t, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
                    <Alert onClose={() => setToast(t => ({ ...t, open: false }))} severity={toast.severity} variant="filled" sx={{ width: "100%" }}>
                        {toast.message}
                    </Alert>
                </Snackbar>
            </Box>
        </Modal>
    )
}


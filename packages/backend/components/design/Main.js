"use client";
import {
    Box, Grid2, TextField, Button, Typography, Card, CardContent, Container,
    Snackbar, Dialog, DialogTitle, DialogContent, DialogActions, Divider,
    Stack, Chip, IconButton, Tooltip,
} from "@mui/material";
import axios from "axios";
import { useState, useEffect } from "react";
import { Uploader } from "../reusable/premier/uploader";
import CreatableSelect from "react-select/creatable";
import { useRouter } from "next/navigation";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";
import LoaderOverlay from "../reusable/LoaderOverlay";
import DeleteModal from "../reusable/DeleteModal";
import { Footer } from "../reusable/Footer";
import { CreateProductModal } from "./CreateProductModal";
import { MarketplaceModal } from "../reusable/MarketPlaceModal";
import { ProductCard } from "../reusable/ProductCard";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { useCSV } from "../reusable/CSVProvider";
import { SublimationImages } from "./sublimationImages";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import AddIcon from "@mui/icons-material/Add";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import QrCode2Icon from "@mui/icons-material/QrCode2";
import ImageIcon from "@mui/icons-material/Image";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

const selectMenuPortalProps = {
    menuPortalTarget: typeof document !== "undefined" ? document.body : null,
    menuPosition: "fixed",
    styles: { menuPortal: (base) => ({ ...base, zIndex: 9999 }) },
};

const SectionCard = ({ icon, title, subtitle, children, action }) => (
    <Card variant="outlined" sx={{ borderRadius: 2 }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Stack direction="row" spacing={1.5} alignItems="flex-start" justifyContent="space-between" sx={{ mb: 2 }}>
                <Stack direction="row" spacing={1.5} alignItems="flex-start">
                    <Box sx={{ color: "primary.main", mt: 0.25 }}>{icon}</Box>
                    <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>{title}</Typography>
                        {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
                    </Box>
                </Stack>
                {action}
            </Stack>
            <Divider sx={{ mb: 2 }} />
            {children}
        </CardContent>
    </Card>
);

export function Main({ design, bls, brands, mPs, pI, licenses, colors, printLocations, seas, gen, CreateSku, source, them, sport, printTypes, canEdit = true }) {
    const router = useRouter();
    const [des, setDesign] = useState({ ...design });
    const [bran, setBrands] = useState(brands);
    const [marketPlaces, setMarketPlaces] = useState(mPs);
    const [loading, setLoading] = useState(true);
    const [blanks, setBlanks] = useState(bls);
    const [imageGroups, setImageGroups] = useState([]);
    const [reload, setReload] = useState(true);
    const [imageLocations, setImageLocations] = useState(printLocations.map(l => l.name));
    const [addImageModal, setAddImageModal] = useState(false);
    const [addDSTModal, setAddDSTModal] = useState(false);
    const [deleteModal, setDeleteModal] = useState(false);
    const [deleteImage, setDeleteImage] = useState({});
    const [type, setType] = useState("image");
    const [deleteFunction, setDeleeFunction] = useState({});
    const [deleteTitle, setDeleteTitle] = useState("");
    const [createProduct, setCreateProduct] = useState(false);
    const [genders, setGenders] = useState(gen ?? []);
    const [seasons, setSeasons] = useState(seas ?? []);
    const [themes, setThemes] = useState(them ?? []);
    const [sportUsedFor, setSportUsedFor] = useState(sport ?? []);
    const [product, setProduct] = useState({ blanks: [], design: design, threadColors: [], colors: [], sizes: [], defaultColor: null, variants: [], productImages: [], variantImages: {} });
    const [marketplaceModal, setMarketplaceModal] = useState(false);
    const [preview, setPreview] = useState(false);
    const [copied, setCopied] = useState(false);
    const [sublimationOpen, setSublimationOpen] = useState(false);
    const { setShow } = useCSV();
    setShow(true);

    useEffect(() => {
        if (!reload) setReload(!reload);
    }, [reload]);

    useEffect(() => {
        if (blanks) {
            let d = { ...des };
            if (!d.blanks) d.blanks = [];
            if (!d.brands) d.brands = [];
            if (d.images == undefined) d.images = {};
            d.blanks = d.blanks.map(bl => {
                let blank = blanks.filter(b => b._id.toString() == (bl.blank?._id ? bl.blank?._id.toString() : bl.blank?.toString()))[0];
                bl.colors = bl?.colors.map(c => blank?.colors.filter(bc => bc._id.toString() == (c._id ? c._id.toString() : c.toString()))[0]);
                bl.defaultColor = bl?.colors.filter(c => (c?._id ? c?._id.toString() : c?.toString()) == (bl.defaultColor?._id ? bl.defaultColor._id.toString() : bl.defaultColor?.toString()))[0];
                bl.colors = bl?.colors.filter(c => c != undefined);
                bl.blank = blank;
                return bl;
            });
            d.blanks.filter(b => b.blank != undefined);
            d.brands = d.brands.map(br => brands.filter(b => b?._id.toString() == (br?._id ? br?._id.toString() : br?.toString()))[0]);
            d.blanks = d.blanks.filter(b => b.blank != undefined);
            setDesign({ ...d });
            let imGr = [];
            blanks.map(b => {
                if (b.multiImages) {
                    Object.keys(b.multiImages).map(i => {
                        b.multiImages[i].map(im => {
                            im.imageGroup?.map(g => {
                                if (!imGr.includes(g)) imGr.push(g);
                            });
                        });
                    });
                }
            });
            setImageGroups(imGr);
            setLoading(false);
        }
    }, [blanks]);

    const getAiDescription = async () => {
        let d = { ...des };
        try {
            let title = des.name;
            let result = await axios.post("/api/ai", {
                prompt: `Generate a 100 word description & 10 tags for a print on demand design. The print on demand design is called: "${title}". The products it is printed on are dynamic so do not be specific and mention a product name, do not mention t-shirt. Return the data as a json object {tags:[],description}.`,
            });
            let { tags, description } = await JSON.parse(result.data);
            d.tags = tags;
            d.description = description;
            setDesign({ ...d });
            updateDesign({ ...d });
        } catch (err) {
            alert("Something went wrong...");
        }
    };

    let updateDesign = async (des, oldSku) => {
        if (!canEdit) return;
        let res = await axios.put("/api/admin/designs", { design: { ...des }, oldSku }).catch(e => { res = e.response; });
        if (res?.data?.error) alert(res.data.msg);
    };

    const tagUpdate = (val) => {
        let d = { ...des };
        d.tags = val;
        setDesign({ ...d });
        updateDesign({ ...d });
    };

    let updateTitleSku = (key, e) => {
        let d = { ...des };
        let oldSku;
        if (key == "sku") oldSku = des[key];
        d[key] = e.target.value;
        setDesign({ ...d });
        updateDesign({ ...d }, oldSku);
    };

    const deleteDesignImage = ({ location, threadColor }) => {
        let d = { ...des };
        if (threadColor) {
            let newImages = {};
            for (let i of Object.keys(d.threadImages)) {
                for (let j of Object.keys(d.threadImages[i])) {
                    if (i == threadColor && j == location) continue;
                    if (!newImages[i]) newImages[i] = {};
                    newImages[i][j] = d.threadImages[i][j];
                }
            }
            d.threadImages = newImages;
        } else {
            let newImages = {};
            for (let i of Object.keys(d.images)) {
                if (i != location) newImages[i] = d.images[i];
            }
            d.images = newImages;
        }
        setDesign({ ...d });
        updateDesign({ ...d });
    };

    const deleteDesign = async () => {
        let res = await axios.delete(`/api/admin/designs?design=${des._id}`);
        if (res.data.error) alert(res.data.msg);
        else router.push("/admin/designs");
    };

    async function copyTextToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
        } catch (err) {
            console.error("Failed to copy text: ", err);
        }
    }

    async function releaseUPCs() {
        await axios.post(`/api/admin/designs/releaseUPCs`, {});
    }

    // Collect all images to display
    const designImages = imageLocations
        .filter(loc => des.images && des.images[loc])
        .map(loc => ({ loc, url: des.images[loc], threadColor: null, label: `Default ${loc}` }));

    const threadImages = [];
    if (des.threadColors?.length > 0) {
        des.threadColors.forEach(tc => {
            const colorObj = colors.filter(c => (c._id ? c._id.toString() : c.toString()) == tc.toString())[0];
            if (!colorObj) return;
            imageLocations.forEach(loc => {
                const url = des.threadImages?.[colorObj.name]?.[loc];
                if (url) threadImages.push({ loc, url, threadColor: colorObj.name, label: `${colorObj.name} ${loc}` });
            });
        });
    }

    const allImages = [...designImages, ...threadImages];

    return (
        <Box sx={{ width: "100%", maxWidth: "100%", overflowX: "hidden" }}>
            {/* Sticky header */}
            <Box sx={{
                position: "sticky", top: 0, zIndex: 100,
                backgroundColor: "background.paper",
                borderBottom: "1px solid", borderColor: "divider",
                px: { xs: 2, sm: 3 }, py: 1.25,
            }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                        <Button
                            variant="text"
                            startIcon={<ArrowBackIcon />}
                            href="/admin/designs"
                            size="small"
                            sx={{ color: "text.secondary", minWidth: 0, px: 1 }}
                        >
                            Designs
                        </Button>
                        <Typography variant="caption" color="text.disabled">/</Typography>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }} noWrap>
                            {des.name || des.sku || "Design"}
                        </Typography>
                        {des.sku && (
                            <Chip label={des.sku} size="small" variant="outlined" sx={{ fontSize: "0.65rem", height: 20 }} />
                        )}
                    </Stack>
                    {canEdit && (
                        <Stack direction="row" spacing={1}>
                            <Button
                                variant="outlined"
                                color="inherit"
                                size="small"
                                startIcon={<QrCode2Icon />}
                                onClick={() => {
                                    setDeleteTitle("Are you sure you want to Release UPCs?");
                                    setDeleeFunction({ onDelete: releaseUPCs });
                                    setDeleteModal(true);
                                }}
                                sx={{ fontSize: "0.75rem" }}
                            >
                                Release UPCs
                            </Button>
                            <Button
                                variant="outlined"
                                color="error"
                                size="small"
                                startIcon={<DeleteOutlineIcon />}
                                onClick={() => {
                                    setDeleteTitle("Are you sure you want to delete this design?");
                                    setDeleeFunction({ onDelete: deleteDesign });
                                    setDeleteModal(true);
                                }}
                                sx={{ fontSize: "0.75rem" }}
                            >
                                Delete
                            </Button>
                            <Button
                                variant="contained"
                                size="small"
                                startIcon={<AddIcon />}
                                onClick={() => {
                                    setProduct({ blanks: [], design: design, threadColors: [], colors: [], sizes: [], defaultColor: null, variants: [], productImages: [], variantImages: {} });
                                    setCreateProduct(true);
                                }}
                                sx={{ fontSize: "0.75rem" }}
                            >
                                Create Product
                            </Button>
                        </Stack>
                    )}
                </Stack>
            </Box>

            <Container maxWidth="lg" sx={{ py: 3 }}>
                <Stack spacing={3}>

                    {/* Images */}
                    <SectionCard
                        icon={<ImageIcon />}
                        title="Design Images"
                        subtitle="Images uploaded per print location"
                        action={canEdit && (
                            <Stack direction="row" spacing={1}>
                                <Button size="small" variant="outlined" startIcon={<AddPhotoAlternateIcon />} onClick={() => setAddImageModal(true)}>
                                    Add Images
                                </Button>
                                <Button size="small" variant="outlined" startIcon={<AutoFixHighIcon />} onClick={() => setAddDSTModal(true)}>
                                    Add DSTs
                                </Button>
                                <Button size="small" variant="outlined" startIcon={<AddPhotoAlternateIcon />} onClick={() => setSublimationOpen(true)}>
                                    Sublimation
                                </Button>
                            </Stack>
                        )}
                    >
                        {allImages.length === 0 ? (
                            <Box sx={{ py: 4, textAlign: "center" }}>
                                <ImageIcon sx={{ fontSize: 40, color: "text.disabled", mb: 1 }} />
                                <Typography variant="body2" color="text.secondary">No images uploaded yet.</Typography>
                                {canEdit && (
                                    <Button size="small" variant="outlined" startIcon={<AddPhotoAlternateIcon />} sx={{ mt: 2 }} onClick={() => setAddImageModal(true)}>
                                        Add Images
                                    </Button>
                                )}
                            </Box>
                        ) : (
                            <Box sx={{ display: "flex", gap: 2, overflowX: "auto", pb: 1, "&::-webkit-scrollbar": { height: 4 }, "&::-webkit-scrollbar-thumb": { background: "rgba(0,0,0,0.15)", borderRadius: 2 } }}>
                                {allImages.map(({ loc, url, threadColor, label }, idx) => (
                                    <Box key={idx} sx={{ minWidth: 200, width: 200, flexShrink: 0 }}>
                                        <Card variant="outlined" sx={{ borderRadius: 1.5, overflow: "hidden" }}>
                                            <Box sx={{ position: "relative", aspectRatio: "1/1", backgroundColor: "background.default", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                <img
                                                    src={`${url.replace("images1.pythiastechnologies.com", "images2.pythiastechnologies.com/origin")}?width=400`}
                                                    alt={label}
                                                    style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
                                                />
                                                {canEdit && (
                                                    <Tooltip title="Delete image" placement="top">
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => {
                                                                setDeleteImage({ location: loc, threadColor });
                                                                setDeleeFunction({ onDelete: deleteDesignImage });
                                                                setDeleteTitle("Are you sure you want to delete this image?");
                                                                setDeleteModal(true);
                                                            }}
                                                            sx={{
                                                                position: "absolute", top: 6, right: 6,
                                                                backgroundColor: "rgba(255,255,255,0.9)",
                                                                "&:hover": { backgroundColor: "rgba(239,68,68,0.1)", color: "error.main" },
                                                            }}
                                                        >
                                                            <DeleteIcon sx={{ fontSize: 16 }} />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                            </Box>
                                            <Box sx={{ px: 1.5, py: 1, borderTop: "1px solid", borderColor: "divider" }}>
                                                <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block", textAlign: "center" }}>
                                                    {label}
                                                </Typography>
                                            </Box>
                                        </Card>
                                    </Box>
                                ))}
                            </Box>
                        )}
                    </SectionCard>

                    {/* Info */}
                    <SectionCard icon={<AutoAwesomeIcon />} title="Design Information" subtitle="Title, SKU, description, and metadata">
                        <Stack spacing={2.5}>
                            <Grid2 container spacing={2}>
                                <Grid2 size={{ xs: 12, sm: 8 }}>
                                    <TextField
                                        label="Title"
                                        fullWidth
                                        value={des?.name}
                                        slotProps={{ input: { readOnly: !canEdit } }}
                                        onChange={(e) => updateTitleSku("name", e)}
                                        helperText={`${des?.name?.length ?? 0} characters`}
                                        size="small"
                                    />
                                </Grid2>
                                <Grid2 size={{ xs: 12, sm: 4 }}>
                                    <TextField
                                        label="SKU"
                                        fullWidth
                                        value={des?.sku}
                                        slotProps={{ input: { readOnly: !canEdit } }}
                                        onChange={(e) => updateTitleSku("sku", e)}
                                        size="small"
                                    />
                                </Grid2>
                            </Grid2>

                            <Box>
                                <TextField
                                    label="Description"
                                    fullWidth
                                    multiline
                                    rows={4}
                                    value={des?.description}
                                    slotProps={{ input: { readOnly: !canEdit } }}
                                    onChange={(e) => updateTitleSku("description", e)}
                                    size="small"
                                />
                                {canEdit && (
                                    <Button
                                        size="small"
                                        startIcon={<AutoAwesomeIcon />}
                                        onClick={getAiDescription}
                                        sx={{ mt: 0.75, fontSize: "0.72rem" }}
                                    >
                                        Generate description &amp; tags with AI
                                    </Button>
                                )}
                            </Box>

                            <Divider />

                            <Box>
                                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.75 }}>
                                    <Typography variant="caption" sx={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, color: "text.secondary" }}>Tags</Typography>
                                    <Tooltip title="Copy tags to clipboard">
                                        <IconButton size="small" onClick={() => { copyTextToClipboard(des?.tags.join(", ")); setCopied(true); }}>
                                            <ContentCopyIcon sx={{ fontSize: 16 }} />
                                        </IconButton>
                                    </Tooltip>
                                </Stack>
                                <CreatableSelect
                                    {...selectMenuPortalProps}
                                    placeholder="Tags"
                                    isDisabled={!canEdit}
                                    onChange={(val) => tagUpdate(val.map(t => t.value))}
                                    value={des.tags.map(t => ({ value: t, label: t }))}
                                    isMulti
                                />
                                <Snackbar
                                    open={copied}
                                    anchorOrigin={{ vertical: "top", horizontal: "center" }}
                                    autoHideDuration={1200}
                                    onClose={() => setCopied(false)}
                                    message="Tags copied to clipboard"
                                />
                            </Box>

                            <Divider />

                            <Grid2 container spacing={2}>
                                <Grid2 size={{ xs: 12, sm: 6 }}>
                                    <Typography variant="caption" sx={{ display: "block", mb: 0.5, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, color: "text.secondary" }}>Print Type</Typography>
                                    <CreatableSelect
                                        {...selectMenuPortalProps}
                                        placeholder="Print Type"
                                        isDisabled={!canEdit}
                                        options={printTypes?.map(pt => ({ label: pt.name, value: pt.name }))}
                                        value={{ label: des.printType, value: des.printType ?? "DTF" }}
                                        onChange={(vals) => {
                                            let d = { ...des };
                                            d.printType = vals.value;
                                            setDesign({ ...d });
                                            updateDesign({ ...d });
                                        }}
                                    />
                                </Grid2>
                                <Grid2 size={{ xs: 12, sm: 6 }}>
                                    <Typography variant="caption" sx={{ display: "block", mb: 0.5, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, color: "text.secondary" }}>License Holder</Typography>
                                    <CreatableSelect
                                        {...selectMenuPortalProps}
                                        placeholder="License Holder"
                                        isDisabled={!canEdit}
                                        options={[{ label: "None", value: null }, ...licenses.map(l => ({ label: l.name, value: l._id }))]}
                                        value={des.licenseHolder ? { label: licenses.filter(l => l._id.toString() == des.licenseHolder.toString())[0]?.name, value: des.licenseHolder } : null}
                                        onChange={(vals) => {
                                            let d = { ...des };
                                            d.licenseHolder = vals.value;
                                            setDesign({ ...d });
                                            updateDesign({ ...d });
                                        }}
                                    />
                                </Grid2>
                            </Grid2>
                        </Stack>
                    </SectionCard>

                    {/* Products */}
                    <SectionCard
                        icon={<AddIcon />}
                        title="Products"
                        subtitle={`${des.products?.length ?? 0} product${des.products?.length === 1 ? "" : "s"} linked to this design`}
                        action={canEdit && (
                            <Button
                                size="small"
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={() => {
                                    setProduct({ blanks: [], design: design, threadColors: [], colors: [], sizes: [], defaultColor: null, variants: [], productImages: [], variantImages: {} });
                                    setCreateProduct(true);
                                }}
                            >
                                Create Product
                            </Button>
                        )}
                    >
                        {(!des.products || des.products.length === 0) ? (
                            <Box sx={{ py: 4, textAlign: "center" }}>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>No products yet. Create one to start selling this design.</Typography>
                                {canEdit && (
                                    <Button variant="outlined" startIcon={<AddIcon />} size="small" onClick={() => {
                                        setProduct({ blanks: [], design: design, threadColors: [], colors: [], sizes: [], defaultColor: null, variants: [], productImages: [], variantImages: {} });
                                        setCreateProduct(true);
                                    }}>
                                        Create Product
                                    </Button>
                                )}
                            </Box>
                        ) : (
                            <Grid2 container spacing={2}>
                                {des.products.map((p, i) => (
                                    <ProductCard key={i} p={p} setProduct={setProduct} des={des} setDesign={setDesign} setCreateProduct={setCreateProduct} setMarketplaceModal={setMarketplaceModal} setPreview={setPreview} marketPlaces={marketPlaces} source={source} canEdit={canEdit} />
                                ))}
                            </Grid2>
                        )}
                    </SectionCard>

                </Stack>
            </Container>

            <AddImageModal open={addImageModal} setOpen={setAddImageModal} des={des} setDesign={setDesign} updateDesign={updateDesign} printLocations={printLocations} reload={reload} setReload={setReload} colors={colors} loading={loading} setLoading={setLoading} />
            <AddDSTModal open={addDSTModal} setOpen={setAddDSTModal} des={des} setDesign={setDesign} updateDesign={updateDesign} printLocations={printLocations} reload={reload} setReload={setReload} colors={colors} loading={loading} setLoading={setLoading} setDeleteModal={setDeleteModal} setDeleteImage={setDeleteImage} setDeleteTitle={setDeleteTitle} setDeleeFunction={setDeleeFunction} />
            <DeleteModal open={deleteModal} setOpen={setDeleteModal} title={deleteTitle} onDelete={deleteFunction.onDelete} deleteImage={deleteImage} type={type} product={product} />
            <CreateProductModal open={createProduct} setOpen={setCreateProduct} product={product} setProduct={setProduct} blanks={blanks} design={des} setDesign={setDesign} updateDesign={updateDesign} colors={colors} imageGroups={imageGroups} brands={bran} genders={genders} seasons={seasons} setBrands={setBrands} setGenders={setGenders} setSeasons={setSeasons} CreateSku={CreateSku} source={source} loading={loading} setLoading={setLoading} preview={preview} setPreview={setPreview} themes={themes} sportUsedFor={sportUsedFor} setThemes={setThemes} setSportUsedFor={setSportUsedFor} printTypes={printTypes} licenses={licenses} />
            {loading && <LoaderOverlay />}
            <MarketplaceModal open={marketplaceModal} setOpen={setMarketplaceModal} product={product} setProduct={setProduct} marketPlaces={marketPlaces} setMarketPlaces={setMarketPlaces} sizes={blanks.map(b => b.sizes.map(s => s.name))} design={des} setDesign={setDesign} source={source} />
            <SublimationImages design={des} setDesign={setDesign} updateDesign={updateDesign} open={sublimationOpen} setOpen={setSublimationOpen} />

            <Footer />
        </Box>
    );
}

const AddDSTModal = ({ open, setOpen, reload, setReload, des, loading, setLoading, setDesign, updateDesign, printLocations, setDeleteModal, setDeleteImage, setDeleteTitle, setDeleeFunction }) => {
    const [location, setLocation] = useState("front");

    const updateEmbroidery = async ({ url, location }) => {
        let d = { ...des };
        if (!d.embroideryFiles) d.embroideryFiles = {};
        d.embroideryFiles[location] = url;
        setDesign({ ...d });
        updateDesign({ ...d });
        setLoading(false);
        setReload(true);
        setOpen(true);
    };

    const relocateDST = (url, location) => {
        let d = { ...des };
        let newFiles = {};
        newFiles[location] = url;
        d.embroideryFiles = newFiles;
        setDesign({ ...d });
        updateDesign({ ...d });
    };

    const deleteEmbroideryFile = ({ location }) => {
        let d = { ...des };
        des.embroideryFiles[location] = null;
        setDesign({ ...d });
        updateDesign({ ...d });
    };

    return (
        <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
            <DialogTitle sx={{ fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                Add DST / Embroidery Files
                <IconButton size="small" onClick={() => setOpen(false)}><CloseIcon fontSize="small" /></IconButton>
            </DialogTitle>
            <DialogContent dividers>
                <Grid2 container spacing={2}>
                    <Grid2 size={{ xs: 12, sm: 4 }}>
                        <Stack spacing={1.5}>
                            <Typography variant="caption" sx={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, color: "text.secondary" }}>Upload Location</Typography>
                            <CreatableSelect
                                {...selectMenuPortalProps}
                                options={printLocations.map(p => ({ value: p.name, label: p.name }))}
                                value={{ value: location, label: location }}
                                onChange={(vals) => { setLocation(vals.value); setReload(false); }}
                            />
                            {reload && <Uploader location={location} afterFunction={updateEmbroidery} setLoading={setLoading} setOpen={setOpen} />}
                        </Stack>
                    </Grid2>
                    {printLocations.map((i, j) => (
                        des.embroideryFiles && des.embroideryFiles[i.name] && (
                            <Grid2 size={{ xs: 12, sm: 4 }} key={j}>
                                <Card variant="outlined" sx={{ borderRadius: 1.5 }}>
                                    <Box sx={{ position: "relative" }}>
                                        <img src="/embplaceholder.jpg" alt={`${i.name} image`} style={{ width: "100%", height: "auto", display: "block" }} />
                                        <Tooltip title="Delete file" placement="top">
                                            <IconButton
                                                size="small"
                                                onClick={() => {
                                                    setDeleteImage({ location: i.name });
                                                    setDeleeFunction({ onDelete: deleteEmbroideryFile });
                                                    setDeleteTitle("Are you sure you want to delete this DST file?");
                                                    setDeleteModal(true);
                                                }}
                                                sx={{ position: "absolute", top: 6, right: 6, backgroundColor: "rgba(255,255,255,0.9)", "&:hover": { color: "error.main" } }}
                                            >
                                                <DeleteIcon sx={{ fontSize: 16 }} />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                    <Box sx={{ p: 1 }}>
                                        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5, textAlign: "center" }}>{i.name} File</Typography>
                                        <CreatableSelect
                                            {...selectMenuPortalProps}
                                            options={printLocations.map(p => ({ value: p.name, label: p.name }))}
                                            value={{ value: i.name, label: i.name }}
                                            onChange={(vals) => { relocateDST(des.embroideryFiles[i.name], vals.value); setReload(false); }}
                                        />
                                    </Box>
                                </Card>
                            </Grid2>
                        )
                    ))}
                </Grid2>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={() => setOpen(false)}>Close</Button>
            </DialogActions>
        </Dialog>
    );
};

const AddImageModal = ({ open, setOpen, reload, setReload, loading, setLoading, des, setDesign, updateDesign, printLocations, colors }) => {
    const [location, setLocation] = useState("front");
    const [threadColor, setThreadColor] = useState(null);

    const updateImage = async ({ url, location, threadColor }) => {
        let d = { ...des };
        if (threadColor && threadColor != "default" && threadColor != null) {
            if (!d.threadImages) d.threadImages = {};
            if (!d.threadImages[threadColor]) d.threadImages[threadColor] = {};
            d.threadImages[threadColor][location] = url;
        } else {
            if (!d.images) d.images = {};
            d.images[location] = url;
        }
        setDesign({ ...d });
        updateDesign({ ...d });
        setLoading(false);
        setReload(true);
        setOpen(true);
    };

    return (
        <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                Upload Design Images
                <IconButton size="small" onClick={() => setOpen(false)}><CloseIcon fontSize="small" /></IconButton>
            </DialogTitle>
            <DialogContent dividers>
                <Stack spacing={2}>
                    <Box>
                        <Typography variant="caption" sx={{ display: "block", mb: 0.5, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, color: "text.secondary" }}>Thread Colors</Typography>
                        <CreatableSelect
                            {...selectMenuPortalProps}
                            placeholder="Thread colors (optional)"
                            options={colors?.map(m => ({ value: m._id, label: m.name }))}
                            value={des?.threadColors?.map(m => ({
                                value: colors?.filter(c => (c._id ? c._id.toString() : c) == m.toString())[0]?._id,
                                label: colors.filter(c => (c._id ? c._id.toString() : c) == m.toString())[0]?.name,
                            }))}
                            onChange={(vals) => {
                                let d = { ...des };
                                let newThread = vals.map(v => v.value);
                                d.threadColors = newThread;
                                for (let m of d.threadColors) {
                                    if (!d.threadImages) d.threadImages = {};
                                    const name = colors.filter(c => (c._id ? c._id.toString() : c) == m.toString())[0]?.name;
                                    if (name && !d.threadImages[name]) d.threadImages[name] = {};
                                }
                                setDesign({ ...d });
                                updateDesign({ ...d });
                                setReload(false);
                            }}
                            isMulti
                        />
                    </Box>

                    <Grid2 container spacing={1.5}>
                        <Grid2 size={6}>
                            <Typography variant="caption" sx={{ display: "block", mb: 0.5, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, color: "text.secondary" }}>Print Location</Typography>
                            <CreatableSelect
                                {...selectMenuPortalProps}
                                options={printLocations?.map(p => ({ value: p.name, label: p.name }))}
                                value={{ value: location, label: location }}
                                onChange={(vals) => { setLocation(vals.value); setReload(false); }}
                            />
                        </Grid2>
                        <Grid2 size={6}>
                            <Typography variant="caption" sx={{ display: "block", mb: 0.5, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, color: "text.secondary" }}>Thread Color</Typography>
                            <CreatableSelect
                                {...selectMenuPortalProps}
                                options={des.threadColors?.length > 0
                                    ? [...des.threadColors.map(p => {
                                        const c = colors?.filter(c => c._id.toString() == p)[0];
                                        return { value: c?.name, label: c?.name };
                                    }), { value: "default", label: "Default" }]
                                    : [{ value: "default", label: "Default" }]}
                                value={{ value: threadColor, label: threadColor ?? "Default" }}
                                onChange={(vals) => { setThreadColor(vals.value); setReload(false); }}
                            />
                        </Grid2>
                    </Grid2>

                    <Box sx={{ display: "flex", justifyContent: "center" }}>
                        {reload && <Uploader location={location} threadColor={threadColor} afterFunction={updateImage} setLoading={setLoading} setOpen={setOpen} />}
                    </Box>
                </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={() => setOpen(false)}>Close</Button>
            </DialogActions>
        </Dialog>
    );
};

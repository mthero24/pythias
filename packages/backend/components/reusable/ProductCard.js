"use client";
import { Box, Grid2, Typography, Button, Divider, Card, CardContent, Chip, IconButton, Stack, Tooltip } from "@mui/material";
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import StorefrontIcon from '@mui/icons-material/Storefront';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteModal from "./DeleteModal";
import { useState } from "react";
import { useCSV } from "../reusable/CSVProvider";
import axios from "axios";

export const ProductCard = ({ p, setProduct, setCreateProduct, setNFProduct, marketPlaces, setMarketplaceModal, setStart, des, setDesign, updateDesign, setPreview, source, printTypes, licenses, canEdit = true }) => {
    const [deleteModal, setDeleteModal] = useState(false);
    const [deleteImage, setDeleteImage] = useState({});
    const [deleteTitle, setDeleteTitle] = useState("");
    const [deleteFunction, setDeleteFunction] = useState({});
    const [type, setType] = useState("");

    const deleteProduct = async (product) => {
        let res = await axios.delete(`/api/admin/products?product=${product._id}`)
        if (res.data.error) alert(res.data.msg)
        else {
            let d = { ...des }
            d.products = d.products?.filter(p => p._id !== product._id)
            setDesign({ ...d })
            updateDesign({ ...d })
        }
    }

    const { csvData, setCsvData, setAdded, setNotAdded, setShow } = useCSV();

    const preCacheImages = async (product) => {
        for (let image of (product.productImages || [])) {
            if (image.image) try { await axios.get(image.image.replace("=400", "=2400")); } catch (e) {}
        }
        for (let v of (product.variantsArray || [])) {
            for (let img of (v.images || [])) try { await axios.get(img.replace("=400", "=2400")); } catch (e) {}
            if (v.image) try { await axios.get(v.image.replace("=400", "=2400")); } catch (e) {}
        }
    }

    const checkForIds = async ({ product, marketPlace }) => {
        if (!product || !marketPlace) return;
        const mp = marketPlaces?.find(m => m.name.toLowerCase() === marketPlace.toLowerCase());
        if (!mp?.connections?.length) return;
        const res = await axios.get("/api/admin/integrations", { params: { provider: "premierPrinting" } });
        const connections = res.data.integration || [];
        for (let c of connections) {
            if (c.displayName.toLowerCase().includes("acenda") && mp.connections.includes(c._id.toString())) {
                await axios.post("/api/integrations/acenda", { connection: c, product });
            }
        }
    }

    const addProductToCsv = async (marketPlace, product) => {
        setShow(true);
        checkForIds({ product, marketPlace });
        const updatedCsvData = { ...csvData };
        if (!updatedCsvData.products) updatedCsvData.products = {};
        if (!updatedCsvData.products[marketPlace]) updatedCsvData.products[marketPlace] = [];
        if (!updatedCsvData.products[marketPlace].find(p => p._id === product._id)) {
            updatedCsvData.products[marketPlace].push({ _id: product._id });
            preCacheImages(product);
            setCsvData(updatedCsvData);
            setAdded(true);
        } else {
            setNotAdded(true);
        }
    }

    const defaultColorId = p.defaultColor?._id ? p.defaultColor._id.toString() : p.defaultColor?.toString() ?? p.colors?.[0]?._id?.toString();
    const primaryImage = p.productImages?.find(i => i.color?._id?.toString() === defaultColorId && i.side !== "back")?.image;
    const backImage = p.productImages?.find(i => i.color?._id?.toString() === defaultColorId && (i.side === "back" || i.side === "modelBack"))?.image;
    const variantCount = p.variantsArray?.length ?? 0;
    const isCombined = p.blanks?.length > 1;

    return (
        <Grid2 size={{ xs: 6, sm: 4, md: 3 }}>
            <Card variant="outlined" sx={{ height: "100%", display: "flex", flexDirection: "column", borderRadius: 2, position: "relative", transition: "box-shadow 150ms", "&:hover": { boxShadow: 4 } }}>
                {canEdit && (
                    <Tooltip title="Delete" placement="top">
                        <IconButton size="small" onClick={() => { setDeleteFunction({ onDelete: deleteProduct }); setDeleteTitle("Are You Sure You Want To Delete This Product?"); setDeleteImage({ ...p }); setDeleteModal(true); }} sx={{ position: "absolute", top: 6, right: 6, zIndex: 2, backgroundColor: "rgba(255,255,255,0.85)", color: "#780606", "&:hover": { backgroundColor: "rgba(255,255,255,1)" } }}>
                            <DeleteIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                )}

                <Box sx={{ position: "relative", aspectRatio: "1 / 1", backgroundColor: "background.default", overflow: "hidden" }}>
                    <img src={primaryImage || "/missingImage.jpg"} alt={p.title} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                    {backImage && (
                        <Box sx={{ position: "absolute", bottom: 6, left: 6, width: 56, height: 56, borderRadius: 1, overflow: "hidden", border: "1px solid rgba(0,0,0,0.12)", backgroundColor: "#fff" }}>
                            <img src={backImage} alt="back view" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                        </Box>
                    )}
                </Box>

                <Divider />

                <CardContent sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 1, p: "12px !important" }}>
                    <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={p.title}>{p.title}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>{p.sku}</Typography>
                    </Box>

                    <Stack direction="row" flexWrap="wrap" gap={0.5}>
                        <Chip size="small" label={isCombined ? "Combined" : "Single"} sx={{ fontSize: "0.65rem", height: 20, backgroundColor: isCombined ? "#1a1a1a" : "#6a95bf", color: "#fff" }} />
                        {variantCount > 0 && <Chip size="small" label={`${variantCount} variant${variantCount === 1 ? "" : "s"}`} sx={{ fontSize: "0.65rem", height: 20 }} />}
                    </Stack>

                    <Box>
                        <Typography variant="caption" sx={{ color: "text.secondary", textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600, display: "block", marginBottom: 0.5 }}>Marketplaces</Typography>
                        {p.marketPlacesArray?.length > 0 ? (
                            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                                {p.marketPlacesArray.map(m => {
                                    const name = marketPlaces?.find(mp => mp._id.toString() === (m._id ? m._id.toString() : m.toString()))?.name;
                                    return name ? (
                                        <Chip key={m._id ?? m} size="small" label={name} clickable icon={<StorefrontIcon sx={{ fontSize: "0.7rem !important" }} />} onClick={() => addProductToCsv(name, p)} sx={{ fontSize: "0.65rem", height: 22, backgroundColor: "#87AE73", color: "#fff", "& .MuiChip-icon": { color: "#fff" } }} />
                                    ) : null;
                                })}
                            </Box>
                        ) : (
                            <Typography variant="caption" color="text.secondary">None</Typography>
                        )}
                    </Box>

                    {canEdit && (
                        <Stack spacing={0.75} sx={{ marginTop: "auto", pt: 1 }}>
                            <Stack direction="row" spacing={0.75}>
                                <Button fullWidth size="small" variant="contained" startIcon={<StorefrontIcon />} onClick={() => { setMarketplaceModal(true); setProduct({ ...p }); }}>Markets</Button>
                                <Button fullWidth size="small" variant="outlined" startIcon={<EditIcon />} onClick={() => {
                                    setProduct({ ...p });
                                    if (p.isNFProduct) { setStart("Select Images"); setNFProduct(true); }
                                    else setCreateProduct(true);
                                }}>Edit</Button>
                            </Stack>
                            <Button fullWidth size="small" variant="outlined" color="secondary" startIcon={<VisibilityIcon />} onClick={() => { setProduct({ ...p }); setCreateProduct(true); setPreview(true); }}>Preview</Button>
                        </Stack>
                    )}
                </CardContent>

                <DeleteModal open={deleteModal} setOpen={setDeleteModal} title={deleteTitle} onDelete={deleteFunction.onDelete} deleteImage={deleteImage} type={type} />
            </Card>
        </Grid2>
    );
};

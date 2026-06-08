import { Box, Grid2, Button, Typography, Card, CardContent, Chip, IconButton, Tooltip, Modal, ToggleButton, ToggleButtonGroup, Select, MenuItem, FormControl, InputLabel } from "@mui/material";
import { renderUrlParts } from "./renderUrl";
import { useState } from "react";
import CloseIcon from '@mui/icons-material/Close';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import { RetryImage } from "./RetryImage";

const tileBackground = "radial-gradient(ellipse at center, #ffffff 0%, #eef0f3 100%)";

const VariantTile = ({ image, isMain, isSecondary, secondaryIndex, onClick, onZoom }) => (
    <Box onClick={onClick} sx={{ position: "relative", aspectRatio: "1 / 1", border: isMain ? "2px solid" : isSecondary ? "2px dashed" : "1px solid", borderColor: isMain ? "primary.main" : isSecondary ? "warning.main" : "divider", borderRadius: 1, overflow: "hidden", cursor: "pointer", background: tileBackground, display: "flex", alignItems: "center", justifyContent: "center", transition: "border-color 150ms, box-shadow 150ms", "&:hover": { boxShadow: 2, "& .tile-zoom": { opacity: 1 } } }}>
        <RetryImage src={image.image} alt={image.sku || ""} loading="lazy" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
        {isMain && (
            <Chip size="small" label="MAIN" color="primary" sx={{ position: "absolute", top: 2, right: 2, height: 18, fontSize: ".6rem", fontWeight: 700, "& .MuiChip-label": { paddingX: 0.75 } }} />
        )}
        {isSecondary && !isMain && (
            <Chip size="small" label={`#${secondaryIndex + 1}`} color="warning" sx={{ position: "absolute", top: 2, right: 2, height: 18, fontSize: ".6rem", fontWeight: 700, "& .MuiChip-label": { paddingX: 0.75 } }} />
        )}
        <Tooltip title="Zoom" placement="top" arrow>
            <IconButton size="small" className="tile-zoom" onClick={(e) => { e.stopPropagation(); onZoom(image); }} sx={{ position: "absolute", top: 2, left: 2, padding: 0.25, backgroundColor: "rgba(255,255,255,0.85)", opacity: { xs: 1, md: 0 }, transition: "opacity 150ms", "&:hover": { backgroundColor: "rgba(255,255,255,1)" } }}>
                <ZoomInIcon fontSize="small" />
            </IconButton>
        </Tooltip>
    </Box>
);

const ZoomModal = ({ image, onClose }) => (
    <Modal open={!!image} onClose={onClose} sx={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 2 }}>
        <Box sx={{ position: "relative", outline: "none", maxWidth: "92vw", maxHeight: "92vh", display: "flex", alignItems: "center", justifyContent: "center", background: tileBackground, borderRadius: 2, boxShadow: 24, padding: 1 }}>
            <IconButton onClick={onClose} sx={{ position: "absolute", top: 4, right: 4, zIndex: 2, backgroundColor: "rgba(255,255,255,0.9)", "&:hover": { backgroundColor: "rgba(255,255,255,1)" } }}>
                <CloseIcon />
            </IconButton>
            {image && (
                <RetryImage src={image.image?.replace("?width=400", "?width=1200")} alt={image.sku || ""} style={{ maxWidth: "88vw", maxHeight: "88vh", objectFit: "contain", display: "block" }} />
            )}
            {image?.sku && (
                <Box sx={{ position: "absolute", bottom: 8, left: 8, right: 8, display: "flex", justifyContent: "center", pointerEvents: "none" }}>
                    <Chip size="small" label={image.sku} sx={{ backgroundColor: "rgba(0,0,0,0.65)", color: "#fff", maxWidth: "100%", "& .MuiChip-label": { whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } }} />
                </Box>
            )}
        </Box>
    </Modal>
);

const ColorHeader = ({ color, name, mainCount, extraCount }) => (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, marginBottom: 0.75, flexWrap: "wrap" }}>
        {color?.hexcode && <Box sx={{ width: 14, height: 14, borderRadius: "50%", backgroundColor: color.hexcode, border: "1px solid rgba(0,0,0,0.2)", flexShrink: 0 }} />}
        <Typography variant="subtitle2" sx={{ fontWeight: 600, lineHeight: 1 }}>{name}</Typography>
        <Chip size="small" label={mainCount > 0 ? "main set" : "no main"} color={mainCount > 0 ? "primary" : "default"} variant={mainCount > 0 ? "filled" : "outlined"} sx={{ height: 18, fontSize: ".6rem" }} />
        {extraCount > 0 && <Chip size="small" label={`+${extraCount} extra${extraCount === 1 ? "" : "s"}`} color="warning" variant="outlined" sx={{ height: 18, fontSize: ".6rem" }} />}
    </Box>
);

export const VariantImageStage = ({ products, setProducts, design, source, slug, setStage }) => {
    return (
        <Box sx={{ padding: { xs: 1, sm: 1.5 }, background: "linear-gradient(180deg, #f4f6fa 0%, #eceff5 100%)", minHeight: "100%", borderRadius: 2 }}>
            <Typography variant="subtitle1" sx={{ textAlign: "center", fontWeight: 600, marginBottom: 0.5, color: "text.primary" }}>Select Variant Images</Typography>
            <Typography variant="caption" sx={{ display: "block", textAlign: "center", marginBottom: 1.5, color: "text.secondary" }}>Pick one <b>main</b> image per color, plus any <b>extras</b> for the gallery.</Typography>
            {products.map(product => <CreateVariantImages key={product.id} product={product} products={products} design={design.threadColors?.length > 0 ? design.threadImages : design.images} designObj={design} setProducts={setProducts} threadColors={design.threadColors?.length > 0 ? true : false} source={source} slug={slug} />)}
            <Grid2 container spacing={2} sx={{ justifyContent: "space-between", marginTop: 1.5 }}>
                <Grid2 size="auto">
                    <Button variant="outlined" size="large" sx={{ minWidth: 160 }} onClick={() => { setStage("product_images") }}>Back</Button>
                </Grid2>
                <Grid2 size="auto">
                    <Button variant="contained" size="large" sx={{ minWidth: 160 }} onClick={() => {
                        let prods = [...products]
                        for (let p of prods) {
                            p.title = p.title ? p.title : `${design.name} - ${p.blanks.map(b => b.name).join(" and ")}`
                            p.description = p.description && !p.description.includes("undefined") ? p.description : `${design.description} ${p.blanks.map(b => b.description).join(" ")}`
                            p.tags = design.tags ? design.tags : []
                        }
                        setProducts([...prods])
                        setStage("information")
                    }}>Next</Button>
                </Grid2>
            </Grid2>
        </Box>
    )
}


const CreateVariantImages = ({ product, products, setProducts, design, designObj, threadColors, source, slug }) => {
    const dSku = product.design?.sku ?? designObj?.sku ?? "";
    const dPrintType = product.design?.printType ?? designObj?.printType ?? "";
    const { base: renderBase, suffix: renderSuffix } = renderUrlParts(source, slug);
    const [mainImage, setMainImage] = useState(true);
    const [zoomImage, setZoomImage] = useState(null);
    const cdn = (url) => url.replace("https://images1.pythiastechnologies.com", "https://images2.pythiastechnologies.com/origin");
    const activeGroup = product.imageGroup || "default";
    const availableGroups = [...new Set(product.blanks.flatMap(b => (b.images || []).map(img => img.imageGroup || "default")))];

    const normUrl = url => url ? url.replace(/^https?:\/\/[^/]+/, "").replace(/%7D/gi, "").replace(/\?.*$/, "").replace(/\.jpg$/i, "") : url;
    const imgEq = (a, b) => { const na = normUrl(a), nb = normUrl(b); return na === nb || nb.startsWith(na + "-") || na.startsWith(nb + "-"); };

    let imgs = {}
    if (!threadColors) {
        for (let blank of product.blanks) {
            if (!(blank.images && blank.images.length > 0)) continue;
            for (let color of product.colors) {
                for (let img of blank.images.filter(i => i.color?.toString() == color._id.toString() && !Object.keys(i.boxes ? i.boxes : {}).length && (i.imageGroup || "default") === activeGroup)) {
                    if (!imgs[blank.code]) imgs[blank.code] = {};
                    if (!imgs[blank.code][color.name]) imgs[blank.code][color.name] = [];
                    const rawUrl = `${cdn(img.image)}?width=400`;
                    const fileBase = img.image.split("/").pop().split(".")[0];
                    const sku = `${dPrintType}_${dSku}_${color.sku}_${blank.code.replace(/-/g, "_")}_${fileBase}-${color.name.replace(/\//g, "_")}-other`;
                    if (!imgs[blank.code][color.name].find(i => i.sku === sku)) {
                        imgs[blank.code][color.name].push({ image: rawUrl, sku });
                    }
                }
            }
        }
        for (let side of Object.keys(design ? design : {})) {
            for (let blank of product.blanks) {
                for (let color of product.colors) {
                    for (let img of (blank.images || []).filter(i =>
                        (!i.color || i.color.toString() == color._id.toString()) &&
                        (i.isModel === true || i.imageGroup === "model" || (i.imageGroup || "default") === activeGroup) &&
                        (Object.keys(i.boxes ? i.boxes : {}).includes(side) || (Object.keys(i.boxes ? i.boxes : {}).includes("back") && !Object.keys(design ? design : {}).includes("back")))
                    )) {
                        if (!imgs[blank.code]) imgs[blank.code] = {};
                        if (!imgs[blank.code][color.name]) imgs[blank.code][color.name] = [];
                        const imgBoxes = Object.keys(img.boxes ?? {});
                        const imgSide = imgBoxes.includes("back") && !imgBoxes.some(b => b !== "back" && Object.keys(design ?? {}).includes(b))
                            ? "back"
                            : Object.keys(design ? design : {}).join("_");
                        const imgKey = `${dPrintType}_${dSku}_${color.sku}_${blank.code.replace(/-/g, "_")}_${img.image.split("/").pop().split(".")[0]}-${color.name.replace(/\//g, "_")}-${imgSide}`;
                        if (!imgs[blank.code][color.name].find(i => i.sku === imgKey)) {
                            imgs[blank.code][color.name].push({ image: encodeURI(`${renderBase}/${dSku}-${blank.code.replace(/-/g, "_")}-${img.image.split("/").pop().split(".")[0]}-${color.name.replace(/\//g, "_")}-${imgSide}.jpg?width=400${renderSuffix}`), sku: imgKey });
                        }
                    }
                }
            }
        }
    } else {
        for (let threadColor of Object.keys(design ? design : {}).filter(tc => product.threadColors.find(t => t.name == tc))) {
            for (let blank of product.blanks) {
                if (!(blank.images && blank.images.length > 0)) continue;
                for (let color of product.colors) {
                    for (let img of blank.images.filter(i => i.color?.toString() == color._id.toString() && !Object.keys(i.boxes ? i.boxes : {}).length && (i.imageGroup || "default") === activeGroup)) {
                        if (!imgs[blank.code]) imgs[blank.code] = {};
                        if (!imgs[blank.code][threadColor]) imgs[blank.code][threadColor] = {};
                        if (!imgs[blank.code][threadColor][color.name]) imgs[blank.code][threadColor][color.name] = [];
                        const rawUrl = `${cdn(img.image)}?width=400`;
                        const fileBase = img.image.split("/").pop().split(".")[0];
                        const sku = `${dPrintType}_${dSku}_${color.sku}_${blank.code.replace(/-/g, "_")}_${fileBase}-${color.name.replace(/\//g, "_")}-other-${threadColor}`;
                        if (!imgs[blank.code][threadColor][color.name].find(i => i.sku === sku)) {
                            imgs[blank.code][threadColor][color.name].push({ image: rawUrl, sku });
                        }
                    }
                }
            }
        }
        for (let threadColor of Object.keys(design ? design : {}).filter(tc => product.threadColors.find(t => t.name == tc))) {
            for (let side of Object.keys(design[threadColor])) {
                for (let blank of product.blanks) {
                    for (let color of product.colors) {
                        for (let img of (blank.images || []).filter(i =>
                            i.color.toString() == color._id.toString() &&
                            (i.imageGroup || "default") === activeGroup &&
                            Object.keys(i.boxes ? i.boxes : {}).includes(side)
                        )) {
                            if (!imgs[blank.code]) imgs[blank.code] = {};
                            if (!imgs[blank.code][threadColor]) imgs[blank.code][threadColor] = {};
                            if (!imgs[blank.code][threadColor][color.name]) imgs[blank.code][threadColor][color.name] = [];
                            const imgKey = `${dPrintType}_${dSku}_${color.sku}_${blank.code.replace(/-/g, "_")}_${img.image.split("/").pop().split(".")[0]}-${color.name.replace(/\//g, "_")}-${side}-${threadColor}`;
                            if (!imgs[blank.code][threadColor][color.name].find(i => i.sku === imgKey)) {
                                imgs[blank.code][threadColor][color.name].push({ image: encodeURI(`${renderBase}/${dSku}-${blank.code.replace(/-/g, "_")}-${img.image.split("/").pop().split(".")[0]}-${color.name.replace(/\//g, "_")}-${side}-${threadColor}.jpg?width=400${renderSuffix}`), sku: imgKey });
                            }
                        }
                    }
                }
            }
        }
    }
    for(let key of Object.keys(imgs)){
        for(let key2 of Object.keys(imgs[key])){
            if(threadColors){
                for(let key3 of Object.keys(imgs[key][key2])){
                    if(product.variantSecondaryImages && product.variantSecondaryImages[key] && product.variantSecondaryImages[key][key2] && product.variantSecondaryImages[key][key2][key3]){
                        product.variantSecondaryImages[key][key2][key3] = product.variantSecondaryImages[key][key2][key3].filter(i => imgs[key][key2][key3].find(si => imgEq(si.image, i.image)))
                    }
                }
            }else{
                if(product.variantSecondaryImages && product.variantSecondaryImages[key] && product.variantSecondaryImages[key][key2]){
                    product.variantSecondaryImages[key][key2] = product.variantSecondaryImages[key][key2].filter(i => imgs[key][key2].find(si => imgEq(si.image, i.image)))
                }
            }
        }
    }
    const blankKeys = Object.keys(imgs);
    if (blankKeys.length === 0) return null;

    const ModeToggle = (
        <ToggleButtonGroup
            size="small"
            exclusive
            value={mainImage ? "main" : "extras"}
            onChange={(_, v) => { if (v) setMainImage(v === "main"); }}
            sx={{ "& .MuiToggleButton-root": { textTransform: "none", paddingX: 1.25, paddingY: 0.25, fontSize: ".75rem", lineHeight: 1.2 } }}
        >
            <ToggleButton value="main" color="primary">Set Main</ToggleButton>
            <ToggleButton value="extras" color="warning">Add Extras</ToggleButton>
        </ToggleButtonGroup>
    );

    const pickFlat = (b, c, img) => {
        const prods = [...products];
        const p = prods.find(pr => pr.id == product.id);
        if (!p.variantImages) p.variantImages = {};
        if (!p.variantImages[b]) p.variantImages[b] = {};
        if (!p.variantSecondaryImages) p.variantSecondaryImages = {};
        if (!p.variantSecondaryImages[b]) p.variantSecondaryImages[b] = {};
        if (!p.variantSecondaryImages[b][c]) p.variantSecondaryImages[b][c] = [];
        if (mainImage) {
            const currentMain = p.variantImages[b][c];
            if (currentMain && imgEq(currentMain.image, img.image)) {
                delete p.variantImages[b][c];
            } else {
                p.variantSecondaryImages[b][c] = p.variantSecondaryImages[b][c].filter(i => !imgEq(i.image, img.image));
                p.variantImages[b][c] = img;
            }
        } else {
            if (!p.variantSecondaryImages[b][c].find(i => imgEq(i.image, img.image))) {
                p.variantSecondaryImages[b][c].push(img);
            } else {
                p.variantSecondaryImages[b][c] = p.variantSecondaryImages[b][c].filter(i => !imgEq(i.image, img.image));
            }
        }
        setProducts([...prods]);
    };

    const pickThread = (b, tc, c, img) => {
        const prods = [...products];
        const p = prods.find(pr => pr.id == product.id);
        if (!p.variantImages) p.variantImages = {};
        if (!p.variantImages[b]) p.variantImages[b] = {};
        if (!p.variantImages[b][tc]) p.variantImages[b][tc] = {};
        if (!p.variantSecondaryImages) p.variantSecondaryImages = {};
        if (!p.variantSecondaryImages[b]) p.variantSecondaryImages[b] = {};
        if (!p.variantSecondaryImages[b][tc]) p.variantSecondaryImages[b][tc] = {};
        if (!p.variantSecondaryImages[b][tc][c]) p.variantSecondaryImages[b][tc][c] = [];
        if (mainImage) {
            const currentMain = p.variantImages[b][tc][c];
            if (currentMain && imgEq(currentMain.image, img.image)) {
                delete p.variantImages[b][tc][c];
            } else {
                p.variantSecondaryImages[b][tc][c] = p.variantSecondaryImages[b][tc][c].filter(i => !imgEq(i.image, img.image));
                p.variantImages[b][tc][c] = img;
            }
        } else {
            if (!p.variantSecondaryImages[b][tc][c].find(i => imgEq(i.image, img.image))) {
                p.variantSecondaryImages[b][tc][c].push(img);
            } else {
                p.variantSecondaryImages[b][tc][c] = p.variantSecondaryImages[b][tc][c].filter(i => !imgEq(i.image, img.image));
            }
        }
        setProducts([...prods]);
    };

    const renderColorGroup = ({ b, tc, c, tiles, onPick }) => {
        const colorObj = product.colors?.find(co => co.name === c);
        const mainImg = tc
            ? product.variantImages?.[b]?.[tc]?.[c]
            : product.variantImages?.[b]?.[c];
        const extras = (tc
            ? product.variantSecondaryImages?.[b]?.[tc]?.[c]
            : product.variantSecondaryImages?.[b]?.[c]) || [];
        return (
            <Box key={`${b}-${tc || ""}-${c}`} sx={{ marginBottom: 1 }}>
                <ColorHeader color={colorObj} name={c} mainCount={mainImg ? 1 : 0} extraCount={extras.length} />
                <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(96px, 1fr))", gap: 0.5 }}>
                    {tiles.map((img, k) => {
                        const isMain = mainImg && imgEq(mainImg.image, img.image);
                        const extraIdx = extras.findIndex(e => imgEq(e.image, img.image));
                        return (
                            <VariantTile
                                key={`${img.sku || img.image}-${k}`}
                                image={img}
                                isMain={isMain}
                                isSecondary={extraIdx >= 0}
                                secondaryIndex={extraIdx}
                                onClick={() => onPick(img)}
                                onZoom={setZoomImage}
                            />
                        );
                    })}
                </Box>
            </Box>
        );
    };

    return (
        <Card variant="outlined" sx={{ marginBottom: 1.5, borderRadius: 2, backgroundColor: "#ffffff", borderColor: "rgba(15,23,42,0.08)", boxShadow: "0 1px 2px rgba(15,23,42,0.04)" }}>
            <CardContent sx={{ padding: { xs: 1.25, sm: 1.5 }, "&:last-child": { paddingBottom: { xs: 1.25, sm: 1.5 } } }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1, marginBottom: 1.25, position: "sticky", top: 0, zIndex: 1, backgroundColor: "#fff", paddingY: 0.5 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexWrap: "wrap" }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{dSku}</Typography>
                        <Typography variant="caption" color="text.secondary">{blankKeys.join(" · ")}</Typography>
                        {availableGroups.length > 1 && (
                            <FormControl size="small" sx={{ minWidth: 110 }}>
                                <InputLabel sx={{ fontSize: "0.75rem" }}>Theme</InputLabel>
                                <Select
                                    value={activeGroup}
                                    label="Theme"
                                    sx={{ fontSize: "0.75rem" }}
                                    onChange={e => {
                                        const prods = [...products];
                                        prods.find(p => p.id === product.id).imageGroup = e.target.value;
                                        setProducts([...prods]);
                                    }}
                                >
                                    {availableGroups.map(g => <MenuItem key={g} value={g} sx={{ fontSize: "0.75rem" }}>{g}</MenuItem>)}
                                </Select>
                            </FormControl>
                        )}
                    </Box>
                    {ModeToggle}
                </Box>

                {!threadColors && blankKeys.map((b) => (
                    <Box key={b} sx={{ marginBottom: 1.25 }}>
                        {blankKeys.length > 1 && (
                            <Chip size="small" label={b} sx={{ height: 20, fontSize: ".7rem", marginBottom: 0.75, fontWeight: 600 }} />
                        )}
                        {Object.keys(imgs[b]).map((c) => {
                            const tempForColor = (product.tempImages || []).filter(t => t.color?.name === c);
                            const tiles = [...imgs[b][c], ...tempForColor];
                            return renderColorGroup({ b, c, tiles, onPick: (img) => pickFlat(b, c, img) });
                        })}
                    </Box>
                ))}

                {threadColors && blankKeys.map((b) => (
                    <Box key={b} sx={{ marginBottom: 1.25 }}>
                        {blankKeys.length > 1 && (
                            <Chip size="small" label={b} sx={{ height: 20, fontSize: ".7rem", marginBottom: 0.75, fontWeight: 600 }} />
                        )}
                        {Object.keys(imgs[b]).map((tc) => (
                            <Box key={tc} sx={{ marginBottom: 1, paddingLeft: 1, borderLeft: "3px solid", borderColor: "primary.light" }}>
                                <Typography variant="caption" sx={{ display: "block", fontWeight: 600, color: "text.secondary", marginBottom: 0.5, textTransform: "uppercase", letterSpacing: ".5px" }}>Thread: {tc}</Typography>
                                {Object.keys(imgs[b][tc]).map((c) => renderColorGroup({ b, tc, c, tiles: imgs[b][tc][c], onPick: (img) => pickThread(b, tc, c, img) }))}
                            </Box>
                        ))}
                    </Box>
                ))}
            </CardContent>
            <ZoomModal image={zoomImage} onClose={() => setZoomImage(null)} />
        </Card>
    );
}
import { Box, Grid2, Button, Typography, Card, CardContent, Chip, Stack, Tooltip, Divider } from "@mui/material";
import CheckIcon from '@mui/icons-material/Check';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';

const SectionLabel = ({ children, count }) => (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, marginBottom: 1.25 }}>
        <Typography variant="caption" sx={{ color: "text.secondary", textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600 }}>{children}</Typography>
        {count != null && <Chip size="small" label={count} sx={{ height: 18, fontSize: ".7rem" }} />}
    </Box>
);

const ColorSwatch = ({ color, selected, premium, onClick, size = 48 }) => (
    <Tooltip title={color.name} placement="top" arrow>
        <Box onClick={onClick} sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5, cursor: "pointer", width: size + 8 }}>
            <Box sx={{ position: "relative", width: size, height: size, borderRadius: "50%", backgroundColor: color.hexcode, border: selected ? "3px solid" : "1px solid", borderColor: selected ? "primary.main" : "rgba(0,0,0,0.15)", boxShadow: selected ? 2 : 0, display: "flex", alignItems: "center", justifyContent: "center", transition: "transform 100ms, box-shadow 150ms", "&:hover": { transform: "scale(1.06)" } }}>
                {selected && <CheckIcon sx={{ color: color.color_type == "dark" ? "#fff" : "#000", fontSize: "1.4rem" }} />}
                {premium && (
                    <Box sx={{ position: "absolute", top: -4, right: -4, backgroundColor: "background.paper", borderRadius: "50%", display: "flex", padding: "1px" }}>
                        <WorkspacePremiumIcon sx={{ color: "#FFD700", fontSize: "1rem" }} />
                    </Box>
                )}
            </Box>
            <Typography variant="caption" sx={{ fontSize: ".7rem", textAlign: "center", lineHeight: 1.1, maxWidth: size + 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{color.name}</Typography>
        </Box>
    </Tooltip>
);

export const ColorStage = ({ products, setProducts, setStage, design, source, slug, combined, colors, cols, sizes, setImages, upcs, getTempUpcs }) => {
    const hasThreadColors = design.threadColors?.length > 0;
    return (
        <Box sx={{ padding: { xs: 1.5, sm: 2 } }}>
            {products.map((product, i) => {
                const isPremiumColor = (c) => {
                    const match = design.blanks?.filter(d => product.blanks.filter(pb => pb?._id?.toString() == (d.blank._id ? d.blank._id.toString() : d.blank.toString()))[0])[0];
                    return !!match?.colors?.filter(cl => cl._id?.toString() == c._id?.toString())[0];
                };
                const totalVariants = combined
                    ? product.blanks.map(b => product.colors.filter(c => product.blanks.filter(bl => bl.code == b.code)[0].colors.filter(co => co._id.toString() == c._id.toString())[0]).length * product.sizes.filter(s => product.blanks.filter(bl => bl.code == b.code)[0].sizes.filter(si => si._id.toString() == s._id.toString())[0]).length).reduce((a, b) => a + b, 0)
                    : product.blanks.length * product.colors.length * product.sizes.length * (product.threadColor && product.threadColors.length > 0 ? product.threadColors.length : 1);
                return (
                <Card key={i} variant="outlined" sx={{ marginBottom: 3, borderRadius: 2 }}>
                    <CardContent sx={{ padding: { xs: 2, sm: 3 } }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1, marginBottom: 2 }}>
                            <Box>
                                <Typography variant="h6" sx={{ fontWeight: 600, lineHeight: 1.2 }}>{product.design?.sku}</Typography>
                                <Typography variant="caption" color="text.secondary">{product.blanks.map(b => b.code).join(" · ")}</Typography>
                            </Box>
                            <Chip label={`${totalVariants} variant${totalVariants === 1 ? "" : "s"}`} color="primary" variant="outlined" />
                        </Box>

                        <Grid2 container spacing={3}>
                            {hasThreadColors && (
                                <Grid2 size={{ xs: 12, md: 4 }}>
                                    <SectionLabel count={product.threadColors.length}>Thread Colors</SectionLabel>
                                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
                                        {design.threadColors.map(tc => colors.filter(c => c._id.toString() == tc.toString())[0]).filter(Boolean).map(c => (
                                            <ColorSwatch
                                                key={c._id.toString()}
                                                color={c}
                                                selected={!!product.threadColors.filter(co => co._id.toString() == c._id.toString())[0]}
                                                onClick={() => {
                                                    let produs = [...products]
                                                    let p = produs.filter(p => p.id == product.id)[0]
                                                    if (!p.threadColors.filter(co => co._id.toString() == c._id.toString())[0]) p.threadColors.push(c)
                                                    else p.threadColors = p.threadColors.filter(co => co._id.toString() != c._id.toString())
                                                    setProducts([...produs])
                                                }}
                                            />
                                        ))}
                                    </Box>
                                </Grid2>
                            )}

                            <Grid2 size={{ xs: 12, md: hasThreadColors ? 8 : 12 }}>
                                <SectionLabel count={product.colors.length}>Colors</SectionLabel>
                                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
                                    {cols[product.id].map(c => (
                                        <ColorSwatch
                                            key={c._id}
                                            color={c}
                                            selected={!!product.colors.filter(co => co._id.toString() == c._id.toString())[0]}
                                            premium={isPremiumColor(c)}
                                            onClick={() => {
                                                let produs = [...products]
                                                let p = produs.filter(p => p.id == product.id)[0]
                                                if (!p.colors.filter(co => co._id.toString() == c._id.toString())[0]) p.colors.push(c)
                                                else {
                                                    p.colors = p.colors.filter(co => co._id.toString() != c._id.toString())
                                                    if (p.defaultColor && p.defaultColor._id.toString() == c._id.toString()) p.defaultColor = null
                                                }
                                                setProducts([...produs])
                                            }}
                                        />
                                    ))}
                                </Box>
                            </Grid2>

                            {product.colors.length > 0 && (
                                <Grid2 size={12}>
                                    <SectionLabel>Default Color</SectionLabel>
                                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
                                        {product.colors.map(c => (
                                            <ColorSwatch
                                                key={c._id}
                                                color={c}
                                                selected={!!(product.defaultColor && product.defaultColor._id.toString() == c._id.toString())}
                                                onClick={() => {
                                                    let produs = [...products]
                                                    let p = produs.filter(p => p.id == product.id)[0]
                                                    p.defaultColor = c
                                                    setProducts([...produs])
                                                }}
                                            />
                                        ))}
                                    </Box>
                                </Grid2>
                            )}

                            <Grid2 size={12}>
                                <SectionLabel count={product.sizes.length}>Sizes</SectionLabel>
                                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                                    {sizes[product.id.toString()].map(s => {
                                        const sel = !!product.sizes.filter(si => si.name == s.name)[0];
                                        return (
                                            <Chip
                                                key={s._id}
                                                label={s.name}
                                                color={sel ? "primary" : "default"}
                                                variant={sel ? "filled" : "outlined"}
                                                clickable
                                                onClick={() => {
                                                    let produs = [...products]
                                                    let p = produs.filter(p => p.id == product.id)[0]
                                                    if (!p.sizes.filter(si => si.name == s.name)[0]) p.sizes.push(s)
                                                    else p.sizes = p.sizes.filter(si => si.name != s.name)
                                                    setProducts([...produs])
                                                }}
                                                sx={{ minWidth: 56, fontWeight: 500 }}
                                            />
                                        );
                                    })}
                                </Box>
                            </Grid2>

                            {combined && product.blanks.length > 1 && (
                                <Grid2 size={12}>
                                    <Divider sx={{ marginBottom: 1.5 }} />
                                    <SectionLabel>Combined Breakdown</SectionLabel>
                                    <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 0.75 }}>
                                        {product.blanks.map((b, j) => {
                                            const count = product.colors.filter(c => product.blanks.filter(bl => bl.code == b.code)[0].colors.filter(co => co._id.toString() == c._id.toString())[0]).length * product.sizes.filter(s => product.blanks.filter(bl => bl.code == b.code)[0].sizes.filter(si => si.name.toString() == s.name.toString())[0]).length;
                                            return <Chip key={j} size="small" variant="outlined" label={`${b.code}: ${count}`} />;
                                        })}
                                    </Stack>
                                </Grid2>
                            )}
                        </Grid2>
                    </CardContent>
                </Card>
                );
            })}
            <Grid2 container spacing={2} sx={{ justifyContent: "space-between", marginTop: 2 }}>
                <Grid2 size="auto">
                    <Button variant="outlined" size="large" sx={{ minWidth: 160 }} onClick={() => { setStage("blanks") }}>Back</Button>
                </Grid2>
                <Grid2 size="auto">
                        <Button variant="contained" size="large" sx={{ minWidth: 160 }} onClick={() => {
                            const cdn = (url) => url.replace("https://images1.pythiastechnologies.com", "https://images2.pythiastechnologies.com/origin");
                            let imgs = {}
                            for (let product of products) {
                                let im = []
                                product.blanks.map(b => {
                                    if (product.threadColors.length > 0) {
                                        // images without boxes — plain product photos, no design overlay
                                        if (b.images && b.images.length > 0) {
                                            for (let tc of product.threadColors) {
                                                for (let col of product.colors) {
                                                    for (let bm of b.images.filter(m => m.color?.toString() == col._id?.toString() && !Object.keys(m.boxes ? m.boxes : {}).length)) {
                                                        const rawUrl = `${cdn(bm.image)}?width=400`;
                                                        if (!im.find(i => i.image === rawUrl)) {
                                                            const fileBase = bm.image.split("/").pop().split(".")[0];
                                                            im.push({ image: rawUrl, color: col, threadColor: tc, blank: b, sku: `${design.printType}_${design.sku}_${col.sku}_${b.code.replace(/-/g, "_")}_${fileBase}-${col.name.replace(/\//g, "_")}-other-${tc.name}` });
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                        for (let tc of product.threadColors) {
                                            for (let ti of Object.keys(design.threadImages[tc.name] ? design.threadImages[tc.name] : {})) {
                                                for (let col of product.colors) {
                                                    if(b.images && b.images.length > 0){
                                                        for (let bm of b.images.filter(m => m.color.toString() == col._id.toString())) {
                                                            if(!im.filter(i => i.image == encodeURI(`/api/renderImages/${design.sku}-${b.code.replace(/-/g, "_")}-${bm.image.split("/")[bm.image.split("/").length - 1].split(".")[0]}-${col.name.replace(/\//g, "_")}-${ti}-${tc.name}.jpg?width=400&orgSlug=${slug}`)).length > 0){
                                                                im.push({ image: encodeURI(`/api/renderImages/${design.sku}-${b.code.replace(/-/g, "_")}-${bm.image.split("/")[bm.image.split("/").length - 1].split(".")[0]}-${col.name.replace(/\//g, "_")}-${ti}-${tc.name}.jpg?width=400&orgSlug=${slug}`), color: col, threadColor: tc, side: ti, blank: b, sku: `${design.printType}_${design.sku}_${col.sku}_${b.code.replace(/-/g, "_")}_${bm.image.split("/")[bm.image.split("/").length - 1].split(".")[0]}-${col.name.replace(/\//g, "_")}-${ti}-${tc.name}` })
                                                            }
                                                            
                                                        }
                                                    }else{
                                                        for (let bm of b.multiImages[ti].filter(m => m.color.toString() == col._id.toString() && m.imageGroup?.includes(product.imageGroup)).length > 0 ? b.multiImages[ti].filter(m => m.color.toString() == col._id.toString() && m.imageGroup?.includes(product.imageGroup)) : b.multiImages[ti].filter(m => m.color.toString() == col._id.toString() && m.imageGroup?.includes("default"))) {
                                                            im.push({ image: encodeURI(`/api/renderImages/${design.sku}-${b.code.replace(/-/g, "_")}-${bm.image.split("/")[bm.image.split("/").length - 1].split(".")[0]}-${col.name.replace(/\//g, "_")}-${ti}-${tc.name}.jpg?width=400&orgSlug=${slug}`), color: col, threadColor: tc, side: ti, blank: b, sku: `${design.printType}_${design.sku}_${col.sku}_${b.code.replace(/-/g, "_")}_${bm.image.split("/")[bm.image.split("/").length - 1].split(".")[0]}-${col.name.replace(/\//g, "_")}-${ti}-${tc.name}` })
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    } else {
                                        // images without boxes — plain product photos, no design overlay
                                        if (b.images && b.images.length > 0) {
                                            for (let col of product.colors) {
                                                for (let bm of b.images.filter(m => m.color?.toString() == col._id?.toString() && !Object.keys(m.boxes ? m.boxes : {}).length)) {
                                                    const rawUrl = `${cdn(bm.image)}?width=400`;
                                                    if (!im.find(i => i.image === rawUrl)) {
                                                        const fileBase = bm.image.split("/").pop().split(".")[0];
                                                        im.push({ image: rawUrl, color: col, blank: b, sku: `${design.printType}_${design.sku}_${col.sku}_${b.code.replace(/-/g, "_")}_${fileBase}-${col.name.replace(/\//g, "_")}-other` });
                                                    }
                                                }
                                            }
                                        }
                                        for (let ti of Object.keys(design.images ? design.images : {})) {
                                            for (let col of product.colors) {
                                                if (b.images && b.images.length > 0) {
                                                    for (let bm of b.images.filter(m => m.color?.toString() == col._id?.toString() && (Object.keys(m.boxes ? m.boxes : {}).includes(ti) || Object.keys(m.boxes ? m.boxes : {}).includes("back")))) {
                                                        if (!im.filter(i => i.image == encodeURI(`/api/renderImages/${design.sku}-${b.code.replace(/-/g, "_")}-${bm.image.split("/")[bm.image.split("/").length - 1].split(".")[0]}-${col.name.replace(/\//g, "_")}-${Object.keys(design.images ? design.images : {}).join("_") }.jpg?width=400&orgSlug=${slug}`)).length > 0 && Object.keys(bm.boxes ? bm.boxes : {}).includes(ti) && Object.keys(design.images ? design.images : {}).includes(ti)) {
                                                            im.push({ image: encodeURI(`/api/renderImages/${design.sku}-${b.code.replace(/-/g, "_")}-${bm.image.split("/")[bm.image.split("/").length - 1].split(".")[0]}-${col.name.replace(/\//g, "_")}-${Object.keys(design.images ? design.images : {}).join("_") }.jpg?width=400&orgSlug=${slug}`), color: col, sides: Object.keys(design.images ? design.images : {}).join("_"), blank: b, sku: `${design.printType}_${design.sku}_${col.sku}_${b.code.replace(/-/g, "_")}_${bm.image.split("/")[bm.image.split("/").length - 1].split(".")[0]}-${col.name.replace(/\//g, "_")}-${ti}` })
                                                        }
                                                        if (!Object.keys(design.images ? design.images : {}).includes("back") && Object.keys(bm.boxes ? bm.boxes : {}).includes("back") && !im.filter(i => i.image == encodeURI(`/api/renderImages/${design.sku}-${b.code.replace(/-/g, "_")}-${bm.image.split("/")[bm.image.split("/").length - 1].split(".")[0]}-${col.name.replace(/\//g, "_")}-back.jpg?width=400&orgSlug=${slug}`)).length > 0) {
                                                            console.log("________back___________")
                                                            im.push({ image: encodeURI(`/api/renderImages/${design.sku}-${b.code.replace(/-/g, "_")}-${bm.image.split("/")[bm.image.split("/").length - 1].split(".")[0]}-${col.name.replace(/\//g, "_")}-back.jpg?width=400&orgSlug=${slug}`), color: col, sides: "back", blank: b, sku: `${design.printType}_${design.sku}_${col.sku}_${b.code.replace(/-/g, "_")}_${bm.image.split("/")[bm.image.split("/").length - 1].split(".")[0]}-${col.name.replace(/\//g, "_")}-back` })
                                                        }
                                                    }
                                                } else {
                                                    for (let bm of b.multiImages[ti].filter(m => m.color.toString() == col._id.toString() && m.imageGroup?.includes(product.imageGroup)).length > 0 ? b.multiImages[ti].filter(m => m.color.toString() == col._id.toString() && m.imageGroup?.includes(product.imageGroup)) : b.multiImages[ti].filter(m => m.color.toString() == col._id.toString() && m.imageGroup?.includes("default"))) {
                                                        im.push({ image: encodeURI(`/api/renderImages/${design.sku}-${b.code.replace(/-/g, "_")}-${bm.image.split("/")[bm.image.split("/").length - 1].split(".")[0]}-${col.name.replace(/\//g, "_")}-${ti}-${tc.name}.jpg?width=400&orgSlug=${slug}`), color: col, threadColor: tc, side: ti, blank: b, sku: `${design.printType}_${design.sku}_${col.sku}_${b.code.replace(/-/g, "_")}_${bm.image.split("/")[bm.image.split("/").length - 1].split(".")[0]}-${col.name.replace(/\//g, "_")}-${ti}-${tc.name}` })
                                                    }
                                                }
                                            }
                                        }
                                    }

                                    // Ensure a back-side render exists for every blank, even when the design has no back image.
                                    const codeKey = b.code.replace(/-/g, "_");
                                    const pushBackFromImages = (col, urlSideSuffix, extra) => {
                                        if (!b.images || b.images.length === 0) return;
                                        for (const bm of b.images.filter(m => m.color?.toString() == col._id?.toString() && Object.keys(m.boxes ? m.boxes : {}).includes("back"))) {
                                            const fileBase = bm.image.split("/").pop().split(".")[0];
                                            const url = encodeURI(`/api/renderImages/${design.sku}-${codeKey}-${fileBase}-${col.name.replace(/\//g, "_")}-${urlSideSuffix}.jpg?width=400&orgSlug=${slug}`);
                                            if (!im.find(i => i.image === url)) {
                                                im.push({ image: url, color: col, blank: b, sku: `${design.printType}_${design.sku}_${col.sku}_${codeKey}_${fileBase}-${col.name.replace(/\//g, "_")}-${urlSideSuffix}`, ...extra });
                                            }
                                        }
                                    };
                                    const pushBackFromMultiImages = (col, urlSideSuffix, extra) => {
                                        const backList = b.multiImages?.back;
                                        if (!backList || backList.length === 0) return;
                                        const matches = backList.filter(m => m.color?.toString() == col._id?.toString() && m.imageGroup?.includes(product.imageGroup));
                                        const pool = matches.length > 0 ? matches : backList.filter(m => m.color?.toString() == col._id?.toString() && m.imageGroup?.includes("default"));
                                        for (const bm of pool) {
                                            const fileBase = bm.image.split("/").pop().split(".")[0];
                                            const url = encodeURI(`/api/renderImages/${design.sku}-${codeKey}-${fileBase}-${col.name.replace(/\//g, "_")}-${urlSideSuffix}.jpg?width=400&orgSlug=${slug}`);
                                            if (!im.find(i => i.image === url)) {
                                                im.push({ image: url, color: col, blank: b, sku: `${design.printType}_${design.sku}_${col.sku}_${codeKey}_${fileBase}-${col.name.replace(/\//g, "_")}-${urlSideSuffix}`, ...extra });
                                            }
                                        }
                                    };

                                    if (product.threadColors.length > 0) {
                                        for (const tc of product.threadColors) {
                                            if (Object.keys(design.threadImages?.[tc.name] || {}).includes("back")) continue;
                                            for (const col of product.colors) {
                                                pushBackFromImages(col, `back-${tc.name}`, { threadColor: tc, side: "back" });
                                                pushBackFromMultiImages(col, `back-${tc.name}`, { threadColor: tc, side: "back" });
                                            }
                                        }
                                    } else if (!Object.keys(design.images || {}).includes("back")) {
                                        for (const col of product.colors) {
                                            pushBackFromImages(col, "back", { sides: "back" });
                                            pushBackFromMultiImages(col, "back", { sides: "back" });
                                        }
                                    }
                                })
                                imgs[product.id] = im
                            }
                            if (source == "simplysage") {
                                let variantsLength = {}
                                for(let product of products){
                                    if(combined){
                                        for(let b of product.blanks){
                                            variantsLength[b.code] = 0
                                            variantsLength[b.code] += product.colors.filter(c => product.blanks.filter(bl => bl.code == b.code)[0].colors.filter(co => co._id.toString() == c._id.toString())[0]).length * product.sizes.filter(s => product.blanks.filter(bl => bl.code == b.code)[0].sizes.filter(si => si.name.toString() == s.name.toString())[0]).length * (product.threadColor && product.threadColors.length > 0 ? product.threadColors.length : 1);
                                        }
                                    }else{
                                        variantsLength[product.id] = 0
                                        variantsLength[product.id] += product.blanks.length * product.colors.length * product.sizes.length * (product.threadColor && product.threadColors.length > 0 ? product.threadColors.length : 1);
                                    }
                                }
                                let vLength = 0
                                console.log(variantsLength, "variantsLength")
                                for(let v of Object.keys(variantsLength)) vLength += variantsLength[v]
                                let used = 0
                                for(let p of products){
                                    for(let b of p.blanks){
                                        used += upcs.filter(u => u.blank._id.toString() == b._id.toString() && p.colors.map(c => c._id.toString()).includes(u.color._id.toString())).length
                                    }
                                }
                                console.log("Used upcs:", used, "vLength:", vLength)
                                if (vLength > used) {
                                    getTempUpcs(vLength - used)
                                    console.log("Getting temp upcs", vLength - used)
                                }
                            }
                            const normUrl = url => url ? url.replace(/^https?:\/\/[^/]+/, "").replace(/%7D/gi, "").replace(/\?.*$/, "").replace(/\.jpg$/i, "") : url;
                            const imgMatch = (a, b) => { const na = normUrl(a), nb = normUrl(b); return na === nb || nb.startsWith(na + "-") || na.startsWith(nb + "-"); };
                            let prods = [...products]
                            for(let p of prods){
                                let pImages = []
                                const available = (imgs[p.id.toString()] || []).map(i => i.image);
                                for(let im of p.productImages){
                                    if(available.some(a => imgMatch(im.image, a))) pImages.push(im)
                                }
                                p.productImages = pImages
                            }
                            setProducts(prods)
                            setImages(imgs)
                            setStage("product_images")
                        }}>Next</Button>
                </Grid2>
            </Grid2>
        </Box>
    )
}
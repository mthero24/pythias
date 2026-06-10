import { Grid2, TextField, Button, Typography, Divider, Card, CardContent, Stack, CircularProgress } from "@mui/material";
import CreatableSelect from "react-select/creatable";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import axios from "axios";
import { useState, useEffect } from "react";

const selectMenuPortalProps = {
    menuPortalTarget: typeof document !== "undefined" ? document.body : null,
    menuPosition: "fixed",
    styles: { menuPortal: (base) => ({ ...base, zIndex: 9999 }) },
};

const toOpts = (arr) => arr.map(v => ({ value: v, label: v }));

const PLATFORM_ATTRS = {
    tiktok: [
        { field: "Holiday/Occasion", opts: ["Christmas","Halloween","Thanksgiving","Valentine's Day","Easter","Mother's Day","Father's Day","Independence Day","New Year","Graduation","Birthday","Wedding","Anniversary","Back to School","Hanukkah","St. Patrick's Day","Mardi Gras","Kwanzaa","Eid","Diwali","Memorial Day","Labor Day","Juneteenth"] },
        { field: "Occasion",         opts: ["Casual","Sports & Outdoors","Party","Holiday","Vacation","Beach","Work","School","Gym & Fitness","Yoga","Running","Formal","Date Night","Concert","Festival"] },
        { field: "Design",           opts: ["Graphic","Text","Logo","Abstract","Floral","Geometric","Animal","Character","Vintage","Retro","Novelty","Paisley","Tie Dye","Stripe","Plaid","Solid","Camouflage"] },
    ],
    shopify: [
        { field: "Product Type", opts: ["T-Shirt","Hoodie","Sweatshirt","Tank Top","Long Sleeve","Polo","Jacket","Hat","Tote Bag","Youth Tee","Ladies Tee","Jogger"] },
    ],
    etsy: [
        { field: "Occasion",  opts: ["Birthday","Wedding","Anniversary","Graduation","Baby Shower","Bridal Shower","Christmas","Valentine's Day","Mother's Day","Father's Day","Easter","Halloween","Thanksgiving","New Year","All Occasions"] },
        { field: "Recipient", opts: ["Women","Men","Kids","Baby","Teens - Boys","Teens - Girls","Unisex Adults"] },
        { field: "Style",     opts: ["Boho","Minimalist","Rustic","Vintage","Modern","Classic","Funny","Graphic","Artsy","Trendy"] },
    ],
    walmart: [
        { field: "Occasion",   opts: ["Everyday","Holiday","Birthday","Sports & Outdoors","Casual","Work","Party","Patriotic"] },
        { field: "Age Group",  opts: ["Adult","Kids","Baby","Toddler","Youth"] },
        { field: "Theme",      opts: ["Graphic","Holiday","Sports","Patriotic","Nature","Animal","Funny","Inspirational","Music","Gaming"] },
    ],
    faire: [
        { field: "Season",     opts: ["Spring/Summer","Fall/Winter","Holiday","Year Round"] },
        { field: "Age Group",  opts: ["Adult","Kids","Baby","Toddler"] },
    ],
    shein: [
        { field: "Style",     opts: ["Casual","Streetwear","Vintage","Preppy","Sporty","Boho","Minimalist","Y2K","Cottagecore"] },
        { field: "Occasion",  opts: ["Daily","Party","Work","Weekend","Vacation","Sports","Holiday","Date Night"] },
    ],
};

export const InformationStage = ({products, setProducts, product, design, setStage, brands, setBrands, seasons, setSeasons, genders, setGenders, CreateSku, upcs, tempUpcs, colors, themes, sportUsedFor, setThemes, setSportUsedFor, printTypes, licenses, showToast }) => {
    const [markets, setMarkets] = useState([]);
    const [aiDescLoading, setAiDescLoading] = useState({});
    const [tiktokAuthIds, setTiktokAuthIds] = useState(new Set());
    const [connectionTypes, setConnectionTypes] = useState({});

    // Re-resolve all titleGenerator fields when a template variable (brand, gender, etc.) changes.
    const reResolveTitleGenerators = (p, overrides = {}) => {
        for (const market of markets) {
            const tg    = market.productDropDowns?.titleGenerator;
            const mpId  = market._id?.toString();
            if (!tg?.prompt || !mpId) continue;
            const resolved = tg.prompt
                .replace("{design}",        design?.name                              ?? "")
                .replace("{blank}",         p.blanks?.[0]?.name                       ?? "")
                .replace("{brand}",         overrides.brand         ?? p.brand        ?? "")
                .replace("{gender}",        overrides.gender        ?? p.gender       ?? "")
                .replace("{season}",        overrides.season        ?? p.season       ?? "")
                .replace("{theme}",         overrides.theme         ?? p.theme        ?? "")
                .replace("{sportUsedFor}",  overrides.sportUsedFor  ?? p.sportUsedFor ?? "")
                .replace(/(\s*-\s*){2,}/g, " - ")
                .replace(/^\s*-\s*/,        "")
                .replace(/\s*-\s*$/,        "")
                .replace(/\s{2,}/g,         " ")
                .trim();
            if (!p.marketplaceValues)        p.marketplaceValues        = {};
            if (!p.marketplaceValues[mpId])  p.marketplaceValues[mpId]  = {};
            p.marketplaceValues[mpId].titleGenerator = resolved;
        }
    };

    // One-time: merge AI-pre-filled product data (title, description, etc.) into the wizard's products array
    useEffect(() => {
        if (!product || !products.length) return;
        const hasAiData = product.title || product.description || product.gender || (product.marketplaceValues && Object.keys(product.marketplaceValues).length > 0);
        if (!hasAiData) return;
        setProducts(prev => prev.map(p => ({
            ...p,
            title: p.title || product.title || "",
            description: p.description || product.description || "",
            gender: p.gender || product.gender || "",
            category: p.category?.length ? p.category : (product.category ?? []),
            marketplaceValues: Object.keys(p.marketplaceValues ?? {}).length ? p.marketplaceValues : (product.marketplaceValues ?? {}),
        })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [products.length]);
    useEffect(() => {
        const fetchMarkets = async () => {
            let res = await axios.get("/api/marketplaces");
            console.log(res.data.marketplaces, "marketplaces in InformationStage")
            setMarkets(res.data.marketplaces);
        };
        const fetchTiktokAuth = async () => {
            try {
                const res = await axios.get("/api/admin/integrations");
                setTiktokAuthIds(new Set((res.data.tiktokAuth ?? []).map(a => a._id.toString())));
                const types = {};
                for (const conn of res.data.integration ?? []) {
                    const id = conn._id.toString();
                    if (conn.type) types[id] = conn.type;
                    else if (conn.displayName?.toLowerCase().includes("shopify")) types[id] = "shopify";
                }
                setConnectionTypes(types);
            } catch {}
        };
        fetchMarkets();
        fetchTiktokAuth();
    }, []);
    return (
        <Grid2 size={12} sx={{ padding: { xs: 1, sm: 3 } }}>
            <Typography variant="h6" sx={{ textAlign: "center", marginBottom: 2 }}>Product Information</Typography>
            {products.map((product, i) => (
                <Grid2 key={i} container spacing={3} sx={{ marginBottom: 3 }}>
                    <Grid2 size={12}>
                        <Typography variant="h5" sx={{ textAlign: "center", marginBottom: 1 }}>{product.title}</Typography>
                    </Grid2>
                    <Grid2 size={12}>
                        <Card variant="outlined">
                            <CardContent>
                                <Typography variant="subtitle1" sx={{ marginBottom: 2, fontWeight: 600 }}>Identity</Typography>
                                <Grid2 container spacing={2}>
                                    <Grid2 size={12}>
                                        <TextField fullWidth label="Title" variant="outlined" value={product.title} onChange={(e) => {
                                            let prods = [...products]
                                            let p = prods.filter(p => p.id == product.id)[0]
                                            p.title = e.target.value
                                            setProducts([...prods])
                                        }} />
                                    </Grid2>
                                    <Grid2 size={12}>
                                        <TextField fullWidth label="Description" multiline minRows={3} variant="outlined" value={product.description && !product.description.includes("undefined") ? product.description : `${design.description} ${product.blanks[0].description && product.blanks[0].description != ""? `${product.blanks[0].description}` : ""}`} onChange={(e) => {
                                            let prods = [...products]
                                            let p = prods.filter(p => p.id == product.id)[0]
                                            p.description = e.target.value
                                            setProducts([...prods])
                                        }} />
                                        <Button
                                            size="small"
                                            startIcon={aiDescLoading[product.id] ? <CircularProgress size={12} color="inherit" /> : <AutoAwesomeIcon />}
                                            disabled={!!aiDescLoading[product.id]}
                                            onClick={async () => {
                                                setAiDescLoading(prev => ({ ...prev, [product.id]: true }));
                                                try {
                                                    const imageUrl = design.images?.front ?? Object.values(design.images ?? {}).find(v => typeof v === "string" && v.startsWith("http"));
                                                    const blankDesc = (product.blanks || []).map(b => b.description).filter(Boolean).join(" ");
                                                    const res = await axios.post("/api/ai", {
                                                        imageUrl: imageUrl || undefined,
                                                        prompt: `You are writing product copy for a print-on-demand item.${imageUrl ? " A design image is attached — observe the artwork carefully." : ""}\n\nDesign description: "${design.description || ""}"\nGarment info: "${blankDesc}"\n\nWrite a product description of at least 4 sentences that is tailored to this specific product, blending the design theme with the garment. Appeal to buyers. No generic filler phrases.\n\nReturn ONLY the plain text description.`,
                                                    });
                                                    const text = typeof res.data === "string" ? res.data.replace(/^"|"$/g, "") : res.data;
                                                    let prods = [...products];
                                                    let p = prods.find(p => p.id == product.id);
                                                    p.description = text;
                                                    setProducts([...prods]);
                                                } catch {
                                                    showToast("AI generation failed", "error");
                                                } finally {
                                                    setAiDescLoading(prev => ({ ...prev, [product.id]: false }));
                                                }
                                            }}
                                            sx={{ mt: 0.75, fontSize: "0.72rem" }}
                                        >
                                            AI Generate Description
                                        </Button>
                                    </Grid2>
                                    <Grid2 size={12}>
                                        <Typography variant="caption" sx={{ display: "block", marginBottom: .5 }}>Tags</Typography>
                                        <CreatableSelect {...selectMenuPortalProps} isMulti placeholder="Tags" options={design.tags.map(tag => { return { value: tag, label: tag } })} value={design.tags.map(tag => { return { value: tag, label: tag } })} onChange={async (newValue) => {
                                            let prods = [...products]
                                            let p = prods.filter(p => p.id == product.id)[0]
                                            p.tags.push(newValue.value)
                                            setProducts([...prods])
                                        }} />
                                    </Grid2>
                                </Grid2>
                            </CardContent>
                        </Card>
                    </Grid2>
                    <Grid2 size={12}>
                        <Card variant="outlined">
                            <CardContent>
                                <Typography variant="subtitle1" sx={{ marginBottom: 2, fontWeight: 600 }}>Categorization</Typography>
                                <Grid2 container spacing={2}>
                                    <Grid2 size={{ xs: 12, sm: 6 }}>
                                        <Typography variant="caption" sx={{ display: "block", marginBottom: .5 }}>Brand</Typography>
                                        <CreatableSelect {...selectMenuPortalProps} placeholder="Select Brand" options={[{value: null, label: "Select Brand"}, ...brands.map(brand => ({ value: brand.name, label: brand.name }))]} value={product.brand ? { value: product.brand, label: product.brand } : null} onChange={async (newValue) => {
                                            let prods = [...products]
                                            let p = prods.filter(p => p.id == product.id)[0]
                                            if (brands.filter(b => b.name == newValue.value)[0] || newValue.value == null) {
                                                p.brand = newValue.value;
                                                reResolveTitleGenerators(p, { brand: newValue.value ?? "" });
                                            }
                                            setProducts([...prods])
                                        }} />
                                    </Grid2>
                                    <Grid2 size={{ xs: 12, sm: 6 }}>
                                        <Typography variant="caption" sx={{ display: "block", marginBottom: .5 }}>Gender</Typography>
                                        <CreatableSelect {...selectMenuPortalProps} placeholder="Select Gender" options={[{value: null, label: "Select Gender"}, ...genders.map(gender => ({ value: gender.name, label: gender.name }))]} value={product.gender ? { value: product.gender, label: product.gender } : null} onChange={async (newValue) => {
                                            let prods = [...products]
                                            let p = prods.filter(p => p.id == product.id)[0]
                                            if (genders.filter(s => s.name == newValue.value)[0] || newValue.value == null) {
                                                p.gender = newValue.value;
                                                reResolveTitleGenerators(p, { gender: newValue.value ?? "" });
                                            }
                                            setProducts([...prods])
                                        }} />
                                    </Grid2>
                                </Grid2>
                            </CardContent>
                        </Card>
                    </Grid2>

                    <Grid2 size={12}>
                        <Card variant="outlined">
                            <CardContent>
                                <Typography variant="subtitle1" sx={{ marginBottom: 1, fontWeight: 600 }}>Packaging</Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
                                    Dimensions (inches) used when listing on TikTok, Shopify, Etsy, Walmart, Faire, SHEIN and others.
                                    Weight is taken from the blank ({((product.blanks?.[0]?.sizes?.[0]?.weight ?? 0) / 16).toFixed(2)} lbs).
                                </Typography>
                                <Grid2 container spacing={2}>
                                    {[
                                        { key: "packageLength", label: "Length", placeholder: "13" },
                                        { key: "packageWidth",  label: "Width",  placeholder: "10" },
                                        { key: "packageHeight", label: "Height", placeholder: "1"  },
                                    ].map(({ key, label, placeholder }) => (
                                        <Grid2 key={key} size={{ xs: 12, sm: 4 }}>
                                            <TextField
                                                size="small"
                                                fullWidth
                                                label={`${label} (in)`}
                                                type="number"
                                                inputProps={{ min: 0, step: 0.1 }}
                                                placeholder={placeholder}
                                                value={product[key] ?? ""}
                                                onChange={e => {
                                                    let prods = [...products];
                                                    let p = prods.find(p => p.id == product.id);
                                                    p[key] = e.target.value;
                                                    setProducts([...prods]);
                                                }}
                                            />
                                        </Grid2>
                                    ))}
                                </Grid2>
                            </CardContent>
                        </Card>
                    </Grid2>

                    {markets.map((market, k) => {
                        const mpId = market._id?.toString();
                        const mpVals = product.marketplaceValues?.[mpId] ?? {};
                        const setMpField = (field, value) => {
                            let prods = [...products];
                            let p = prods.find(p => p.id == product.id);
                            if (!p.marketplaceValues) p.marketplaceValues = {};
                            if (!p.marketplaceValues[mpId]) p.marketplaceValues[mpId] = { name: market.name };
                            p.marketplaceValues[mpId][field] = value;
                            setProducts([...prods]);
                        };
                        const hasDDs = market.productDropDowns && Object.keys(market.productDropDowns).length > 0;
                        const isTikTok = market.connections?.some(c => tiktokAuthIds.has((c?._id ?? c)?.toString()));
                        const connectionTypeSet = new Set(
                            (market.connections ?? [])
                                .map(c => connectionTypes[(c?._id ?? c)?.toString()])
                                .filter(Boolean)
                        );
                        if (isTikTok) connectionTypeSet.add("tiktok");
                        const platformAttrEntries = Object.entries(PLATFORM_ATTRS)
                            .filter(([type]) => connectionTypeSet.has(type))
                            .flatMap(([, attrs]) => attrs)
                            // dedupe fields — first platform wins if two platforms share a name
                            .filter((attr, i, arr) => arr.findIndex(a => a.field === attr.field) === i);
                        return (
                            <Grid2 key={k} size={12}>
                                <Card variant="outlined">
                                    <CardContent>
                                        <Typography variant="subtitle1" sx={{ marginBottom: 2, fontWeight: 600 }}>Marketplace · {market.name}</Typography>
                                        <Grid2 container spacing={2}>
                                            {/* titleGenerator */}
                                            {hasDDs && Object.keys(market.productDropDowns).map((category, l) => {
                                                if (category !== "titleGenerator") return null;
                                                const tg = market.productDropDowns[category];
                                                const resolved = (tg.prompt ?? "")
                                                    .replace("{blank}", product.blanks?.[0]?.name ?? "")
                                                    .replace("{design}", design?.name ?? "")
                                                    .replace("{brand}", product.brand ?? "")
                                                    .replace("{season}", product.season ?? "")
                                                    .replace("{gender}", product.gender ?? "")
                                                    .replace("{theme}", product.theme ?? "")
                                                    .replace("{sportUsedFor}", product.sportUsedFor ?? "");
                                                if (!product.marketplaceValues) product.marketplaceValues = {};
                                                if (!product.marketplaceValues[mpId]) product.marketplaceValues[mpId] = {};
                                                if (!product.marketplaceValues[mpId][category]) product.marketplaceValues[mpId][category] = resolved;
                                                return (
                                                    <Grid2 key={l} size={12}>
                                                        <TextField fullWidth size="small" label={tg.label ?? "Title Generator"} variant="outlined"
                                                            value={product.marketplaceValues?.[mpId]?.[category] ?? resolved}
                                                            onChange={e => {
                                                                let prods = [...products];
                                                                let p = prods.find(p => p.id == product.id);
                                                                if (!p.marketplaceValues) p.marketplaceValues = {};
                                                                if (!p.marketplaceValues[mpId]) p.marketplaceValues[mpId] = {};
                                                                p.marketplaceValues[mpId][category] = e.target.value;
                                                                setProducts([...prods]);
                                                            }} />
                                                        {tg.prompt && (
                                                            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
                                                                Template: {tg.prompt}
                                                            </Typography>
                                                        )}
                                                    </Grid2>
                                                );
                                            })}
                                            {/* dropdown fields */}
                                            {hasDDs && Object.keys(market.productDropDowns).map((category, l) => {
                                                if (category === "titleGenerator" || category === "required") return null;
                                                return (
                                                    <Grid2 key={l} size={4}>
                                                        <CreatableSelect {...selectMenuPortalProps} placeholder={`Select ${category}`}
                                                            value={mpVals[category] ? { value: mpVals[category], label: mpVals[category] } : null}
                                                            options={[{ value: null, label: `Select ${category}` }, ...(market.productDropDowns[category] || []).map(o => ({ value: o, label: o }))]}
                                                            onChange={newValue => {
                                                                let prods = [...products];
                                                                let p = prods.find(p => p.id == product.id);
                                                                if (!p.marketplaceValues) p.marketplaceValues = {};
                                                                if (!p.marketplaceValues[mpId]) p.marketplaceValues[mpId] = {};
                                                                p.marketplaceValues[mpId].name = market.name;
                                                                if ((market.productDropDowns[category] || []).includes(newValue.value) || newValue.value == null) p.marketplaceValues[mpId][category] = newValue.value;
                                                                setProducts([...prods]);
                                                            }} />
                                                        <Typography variant="caption" color="#c73333">{market.required?.[category] ? "Required" : "Recommended"}</Typography>
                                                    </Grid2>
                                                );
                                            })}
                                            {/* Platform-specific product attributes (TikTok, Shopify, Etsy, Walmart, Faire, SHEIN) */}
                                            {platformAttrEntries.map(({ field, opts }) => (
                                                <Grid2 key={field} size={4}>
                                                    <Typography variant="caption" sx={{ display: "block", mb: 0.5 }}>{field}</Typography>
                                                    <CreatableSelect
                                                        {...selectMenuPortalProps}
                                                        placeholder={`Select ${field}`}
                                                        isClearable
                                                        value={mpVals[field] ? { value: mpVals[field], label: mpVals[field] } : null}
                                                        options={toOpts(opts)}
                                                        onChange={newValue => setMpField(field, newValue?.value ?? null)}
                                                    />
                                                </Grid2>
                                            ))}
                                        </Grid2>
                                    </CardContent>
                                </Card>
                            </Grid2>
                        );
                    })}
                </Grid2>
            ))}
            <Grid2 container spacing={2} sx={{ padding: "2%", justifyContent: "space-between" }}>
                <Grid2 size="auto">
                    <Button variant="outlined" size="large" sx={{ minWidth: 160 }} onClick={() => { setStage("variant_images") }}>Back</Button>
                </Grid2>
                <Grid2 size="auto">
                    <Button variant="contained" size="large" sx={{ minWidth: 160 }} onClick={async () => {
                        let prods = [...products]
                        for(let product of prods){
                            if(!product.description || product.description.includes("undefined")){
                                product.description = `${design.description}-${product.blanks[0].description}`
                            }
                            let variants = {};
                            let printType = printTypes?.filter(pt => pt.name == product.design?.printType)[0];
                            let license = licenses?.filter(l => l.name == design.license)[0];
                            console.log(printType, license, printType, license, "printType and license in InformationStage")
                            if (product.threadColors?.length > 0) {
                                for (let d of Object.keys(design.threadImages).filter(d => product.threadColors.find(t => t.name == d))) {
                                    for (let blank of product.blanks) {
                                        for (let color of product.colors) {
                                            if (blank.colors.filter(c => c._id.toString() == color._id.toString())[0]) {
                                                for (let size of blank.sizes) {
                                                    if (product.sizes.filter(s => s.name == size.name)[0]) {
                                                        let upc
                                                        console.log(upcs, "upcs in InformationStage")
                                                        let sku = await CreateSku({ blank, color, size, design });
                                                        if (upcs.filter(u => u.sku == sku)[0]) {
                                                            upc = upcs.filter(u => u.sku == sku)[0]
                                                        } else if (upcs.filter(u => u.design._id.toString() == design._id.toString() && u.blank._id.toString() == blank._id.toString() && u.color._id.toString() == color._id.toString() && u.threadColor._id.toString() == d._id.toString() && u.size == size.name)[0]) {
                                                            upc = upcs.filter(u => u.design._id.toString() == design._id.toString() && u.blank._id.toString() == blank._id.toString() && u.color._id.toString() == color._id.toString() && u.threadColor._id.toString() == d._id.toString() && u.size == size.name)[0]

                                                        } else {
                                                            upc = tempUpcs.filter(u => u.used != true)[0]
                                                            if (upc) {
                                                                tempUpcs.filter(u => u.used != true)[0].used = true
                                                            }
                                                        }
                                                        let img = product.variantImages[blank.code] && product.variantImages[blank.code][d] && product.variantImages[blank.code][d][color.name] && product.variantImages[blank.code][d][color.name].image
                                                        let images = product.variantSecondaryImages && product.variantSecondaryImages[blank.code] && product.variantSecondaryImages[blank.code][d] && product.variantSecondaryImages[blank.code][d][color.name] && product.variantSecondaryImages[blank.code][d][color.name]
                                                        if (!variants[blank.code]) variants[blank.code] = {}
                                                        if (!variants[blank.code][d]) variants[blank.code][d] = {}
                                                        if (!variants[blank.code][d][color.name]) variants[blank.code][d][color.name] = []
                                                        variants[blank.code][d][color.name].push({ image: img, images: images, size: size, color: color, sku: await CreateSku({ blank, color, size, design, threadColor: d }), threadColor: colors.filter(tc => tc.name == d)[0], blank: blank, upc: upc?.upc, gtin: upc?.gtin, price: size.retailPrice + (printType && printType.price ? printType.price : 0) + (license && license.additionalFees ? license.additionalFees : 0), wholesalePrice: (size.wholesalePrice ?? 0) + (printType && printType.price ? printType.price : 0)})
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            } else {

                                for (let blank of product.blanks) {
                                    for (let color of product.colors) {
                                        if (blank.colors.filter(c => c._id.toString() == color._id.toString())[0]) {
                                            for (let size of blank.sizes) {
                                                if(product.sizes.filter(s => s.name == size.name)[0]) {
                                                    let upc
                                                    console.log(upcs, "upcs in InformationStage")
                                                    upcs = upcs.map(u => {
                                                        if(u.size == "5/6") u.size = "5/6T"
                                                        return u;
                                                    })
                                                    let sku = await CreateSku({ blank, color, size, design });
                                                    if (upcs.filter(u => u.sku == sku)[0]) {
                                                        upc = upcs.filter(u => u.sku == sku)[0]
                                                    }else if(upcs.filter(u=> u.design._id.toString() == design._id.toString() && u.blank._id.toString() == blank._id.toString() && u.color._id.toString() == color._id.toString() && u.size == size.name)[0]) {
                                                        upc = upcs.filter(u => u.design._id.toString() == design._id.toString() && u.blank._id.toString() == blank._id.toString() && u.color._id.toString() == color._id.toString() && u.size == size.name)[0]  

                                                    } else {
                                                        console.log(tempUpcs, "tempUpcs in InformationStage")
                                                        upc = tempUpcs.filter(u => u.used != true)[0]
                                                        if (upc) {
                                                            tempUpcs.filter(u => u.used != true)[0].used = true
                                                        }
                                                    }
                                                    let img = product.variantImages && product.variantImages[blank.code] && product.variantImages[blank.code][color.name] && product.variantImages[blank.code][color.name].image
                                                    let images = product.variantSecondaryImages && product.variantSecondaryImages[blank.code] && product.variantSecondaryImages[blank.code][color.name] && product.variantSecondaryImages[blank.code][color.name]
                                                    if (!variants[blank.code]) variants[blank.code] = {}
                                                    if (!variants[blank.code][color.name]) variants[blank.code][color.name] = []
                                                    variants[blank.code][color.name].push({ image: img, images: images, size: size, color: color, sku: await CreateSku({ blank, color, size, design, }), blank: blank, upc: upc?.upc, gtin: upc?.gtin, price: size.retailPrice + (printType && printType.price ? printType.price : 0) + (license && license.additionalFees ? license.additionalFees : 0), wholesalePrice: (size.wholesalePrice ?? 0) + (printType && printType.price ? printType.price : 0) })
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                            product.variants = variants
                            product.sku = `${design.sku}-${product.blanks.map(b => b.code).join("-")}`
                            product.hasThreadColors = design.threadColors?.length > 0 ? true : false
                        }
                        setProducts([...prods])
                        setStage("preview")
                    }}>Next</Button>
                </Grid2>
            </Grid2>
        </Grid2>
    )
}
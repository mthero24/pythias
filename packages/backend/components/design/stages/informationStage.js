import { Grid2, TextField, Button, Typography, Divider } from "@mui/material";
import CreatableSelect from "react-select/creatable";
import axios from "axios";
import { set } from "mongoose";
import { useState, useEffect } from "react";

export const InformationStage = ({products, setProducts, design, setStage, brands, setBrands, seasons, setSeasons, genders, setGenders, CreateSku, upcs, tempUpcs, colors, themes, sportUsedFor, setThemes, setSportUsedFor, printTypes, licenses }) => {
    console.log(sportUsedFor, "Themes in InformationStage");
    const [markets, setMarkets] = useState([]);
    useEffect(() => {
       const fetchMarkets = async () => {
            let res = await axios.get("/api/marketplaces");
            setMarkets(res.data.marketplaces);
        };
        fetchMarkets();
    }, []);
    return (
        <Grid2 size={12} sx={{ padding: "0% 4%" }}>
            <Typography variant="h6" sx={{ color: "#000", textAlign: "center", marginBottom: "1%" }}>Product Information</Typography>
            {products.map((product, i) => ( 
                <Grid2 key={i} container spacing={2} sx={{ padding: "2%" }}>
                    <Grid2 size={12}>
                        <Typography variant="h5" sx={{ color: "#000", textAlign: "center", marginBottom: "1%" }}>{product.title}</Typography>
                    </Grid2>
                    <Grid2 size={12}>
                        <TextField fullWidth label="Title" variant="outlined" value={product.title} onChange={(e) => {
                            let prods = [...products]
                            let p = prods.filter(p => p.id == product.id)[0]
                            p.title = e.target.value
                            setProducts([...prods])
                        }} />
                    </Grid2>
                    <Grid2 size={12}>
                        <TextField fullWidth label="Description" multiline variant="outlined" value={product.description && !product.description.includes("undefined") ? product.description : `${design.description} ${product.blanks[0].description && product.blanks[0].description != ""? `${product.blanks[0].description}` : ""}`} onChange={(e) => {
                            let prods = [...products]
                            let p = prods.filter(p => p.id == product.id)[0]
                            p.description = e.target.value
                            setProducts([...prods])
                        }} />
                    </Grid2>
                    <Grid2 size={12}>
                        <CreatableSelect isMulti placeholder="Tags" options={design.tags.map(tag => { return { value: tag, label: tag } })} value={design.tags.map(tag => { return { value: tag, label: tag } })} onChange={async (newValue) => {
                            let prods = [...products]
                            let p = prods.filter(p => p.id == product.id)[0]
                            p.tags.push(newValue.value)
                            setProducts([...prods])
                        }} />
                    </Grid2>
                    <Grid2 size={4}>
                        <CreatableSelect placeholder="Select Brand" options={[{value: null, label: "Select Brand"}, ...brands.map(brand => ({ value: brand.name, label: brand.name }))]} value={product.brand ? { value: product.brand, label: product.brand } : null} onChange={async (newValue) => {
                            let prods = [...products]
                            let p = prods.filter(p => p.id == product.id)[0]
                            if (brands.filter(b => b.name == newValue.value)[0] || newValue.value == null) p.brand = newValue.value
                            setProducts([...prods])
                        }} />
                    </Grid2>
                    <Grid2 size={4}>
                        <CreatableSelect placeholder="Select Gender" options={[{value: null, label: "Select Gender"}, ...genders.map(gender => ({ value: gender.name, label: gender.name }))]} value={product.gender ? { value: product.gender, label: product.gender } : null} onChange={async (newValue) => {
                            let prods = [...products]
                            let p = prods.filter(p => p.id == product.id)[0]
                            if(genders.filter(s => s.name == newValue.value)[0] || newValue.value == null) p.gender = newValue.value
                            setProducts([...prods])
                        }} />
                    </Grid2>
                    <Grid2 size={4}>
                        <CreatableSelect placeholder="Select Season" options={[{value: null, label: "Select Season"}, ...seasons.map(season => ({ value: season.name, label: season.name }))]} value={product.season ? { value: product.season, label: product.season } : null} onChange={async (newValue) => {
                            let prods = [...products]
                            let p = prods.filter(p => p.id == product.id)[0]
                            if(seasons.filter(s => s.name == newValue.value)[0] || newValue.value == null)p.season = newValue.value
                            setProducts([...prods])
                        }} />
                    </Grid2>
                    <Grid2 size={4}>
                        <CreatableSelect placeholder="Select Theme" options={[{value: null, label: "Select Theme"}, ...themes.map(theme => ({ value: theme.name, label: theme.name }))]} value={product.theme ? { value: product.theme, label: product.theme } : null} onChange={async (newValue) => {
                            let prods = [...products]
                            let p = prods.filter(p => p.id == product.id)[0]
                            if(themes.filter(t => t.name == newValue.value)[0] || newValue.value == null)p.theme = newValue.value
                            setProducts([...prods])
                        }} />
                    </Grid2>
                    <Grid2 size={4}>
                        <CreatableSelect placeholder="Select Sport Used For" options={[{value: null, label: "Select Sport Used For"}, ...sportUsedFor.map(sport => ({ value: sport.name, label: sport.name }))]} value={product.sportUsedFor ? { value: product.sportUsedFor, label: product.sportUsedFor } : null} onChange={async (newValue) => {
                            let prods = [...products]
                            let p = prods.filter(p => p.id == product.id)[0]
                            if(sportUsedFor.filter(s => s.name == newValue.value)[0] || newValue.value == null)p.sportUsedFor = newValue.value
                            setProducts([...prods])
                        }} />
                    </Grid2>
                    {markets.map((market, k) => {
                        if(market.productDropDowns && Object.keys(market.productDropDowns).length > 0) {
                            return (
                                <Grid2 key={k} size={12}>
                                    <Typography variant="h6">{market.name}</Typography>
                                    <Divider sx={{ margin: "1% 0" }} />

                                    <Grid2 container spacing={2}>
                                        {market.productDropDowns && Object.keys(market.productDropDowns).map((category, l) =>{
                                            if(category == "titleGenerator") {
                                                if(!product.marketplaceValues ){
                                                    product.marketplaceValues = {};
                                                }
                                                if(!product.marketplaceValues[market._id]){
                                                    product.marketplaceValues[market._id] = {};
                                                }
                                                if (!product.marketplaceValues[market._id][category]){
                                                    product.marketplaceValues[market._id][category] = market.productDropDowns[category].prompt.replace("{design}", design.name).replace("{brand}", product.brand).replace("{season}", product.season).replace("{gender}", product.gender).replace("{theme}", product.theme).replace("{sportUsedFor}", product.sportUsedFor).replace("{blank}", product.blanks[0].name);
                                                }
                                                for(let key of Object.keys(product.marketplaceValues[market._id])){
                                                     if(key != "titleGenerator" && key != "name"){
                                                        if(!market.productDropDowns[key] ){
                                                            delete product.marketplaceValues[market._id][key];
                                                        }
                                                    }
                                                }
                                                return <Grid2 key={l} size={12} sx={{ display: "flex", alignItems: "center" }}>
                                                    <TextField fullWidth label={`Product Title`} variant="outlined" value={product.marketplaceValues && product.marketplaceValues[market._id] && product.marketplaceValues[market._id][category]  ? product.marketplaceValues[market._id][category] : ""} onChange={async (e) => {
                                                        let prods = [...products]
                                                        let p = prods.filter(p => p.id == product.id)[0]
                                                        if(!p.marketplaceValues) p.marketplaceValues = {};
                                                        if(!p.marketplaceValues[market._id]) p.marketplaceValues[market._id] = {};
                                                        p.marketplaceValues[market._id][category] = e.target.value
                                                        setProducts([...prods])
                                                     }} />
                                                </Grid2>
                                            }else return null;
                                        })}
                                        {market.productDropDowns && Object.keys(market.productDropDowns).map((category, l) =>{
                                            if(category == "titleGenerator") return null;
                                            return <Grid2 key={l} size={4}>
                                                <CreatableSelect placeholder={`Select ${category}`} value={product.marketplaceValues && product.marketplaceValues[market._id] && product.marketplaceValues[market._id][category] ? { value: product.marketplaceValues[market._id][category], label: product.marketplaceValues[market._id][category] } : null} options={[{value: null, label: `Select ${category}`}, ...(market.productDropDowns[category] || []).map(option => ({ value: option, label: option }))]} onChange={async (newValue) => {
                                                    let prods = [...products]
                                                    let p = prods.filter(p => p.id == product.id)[0]
                                                    if(!p.marketplaceValues) p.marketplaceValues = {};
                                                    if(!p.marketplaceValues[market._id]) p.marketplaceValues[market._id] = {};
                                                    p.marketplaceValues[market._id].name = market.name;
                                                    if((market.productDropDowns[category] || []).filter(o => o == newValue.value)[0] || newValue.value == null)p.marketplaceValues[market._id][category] = newValue.value
                                                setProducts([...prods])
                                            }} />
                                        </Grid2>
                                    })}

                                    </Grid2>  
                                </Grid2>
                            )
                        }
                    })}
                    <Grid2 size={12}>
                        <Divider sx={{ margin: "1% 0" }} />
                    </Grid2>
                </Grid2>
            ))}
            <Grid2 container spacing={2} sx={{ padding: "2%" }}>
                <Grid2 size={6}>
                    <Button fullWidth sx={{ margin: "1% 2%", background: "#645D5B", color: "#ffffff" }} onClick={() => { setStage("variant_images") }}>Back</Button>
                </Grid2>
                <Grid2 size={6}>
                    <Button fullWidth sx={{ margin: "1% 2%", background: "#645D5B", color: "#ffffff" }} onClick={async () => {
                        let prods = [...products]
                        for(let product of prods){
                            if(!product.description || product.description.includes("undefined")){
                                product.description = `${design.description}-${product.blanks[0].description}`
                            }
                            let variants = {};
                            let printType = printTypes?.filter(pt => pt.name == product.design?.printType)[0];
                            let license = licenses?.filter(l => l.name == design.license)[0];
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
                                                        variants[blank.code][d][color.name].push({ image: img, images: images, size: size, color: color, sku: await CreateSku({ blank, color, size, design, threadColor: d }), threadColor: colors.filter(tc => tc.name == d)[0], blank: blank, upc: upc?.upc, gtin: upc?.gtin, price: size.retailPrice + (printType && printType.price ? printType.price : 0) + (license && license.additionalFees ? license.additionalFees : 0)})
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
                                                    variants[blank.code][color.name].push({ image: img, images: images, size: size, color: color, sku: await CreateSku({ blank, color, size, design, }), blank: blank, upc: upc?.upc, gtin: upc?.gtin, price: size.retailPrice + (printType && printType.price ? printType.price : 0) + (license && license.additionalFees ? license.additionalFees : 0) })
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
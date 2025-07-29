import {NextApiResponse, NextResponse} from "next/server";
import {MarketPlaces, Products} from "@pythias/mongo";
const createCsvStringifier = require('csv-writer').createObjectCsvStringifier;
//note: This code is used to generate a CSV file for product data based on the selected market place and product.
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
    variantSize: (variant,  sizeCoverter) => {
        return variant.size ? sizeCoverter && sizeCoverter[variant.size.name] ? sizeCoverter[variant.size.name] : variant.size.name : "";
    },
    variantThreadColor: (variant) => {
        return variant.threadColor ? variant.threadColor.name : "N/A";
    },
    variantSku: (variant) => {
        return variant.sku ? variant.sku : ""
    },
    variantPrice: (variant) => {
        return variant.size ? `${variant.size.retailPrice.toFixed(2)}` : 0;
    },
    variantWeight: (variant) => {
        return variant.size ? `${variant.size.weight.toFixed(2)}` : 0;
    },
    variantUpc: (variant) => {
        return variant.upc ? variant.upc : "N/A";
    },
    variantGtin: (variant) => {
        return variant.gtin ? variant.gtin : "N/A";
    },
    productImage: (product, index) => {
        if (product.productImages && product.productImages.length > index && product.productImages[index] && product.productImages[index].image) {
            return product.productImages[index].image.replace("=400", "=2400");
        }
        return "N/A";
    },
    productImageAlt: (product) => {
        return product.name;
    },
    productGender: (product) => {
        return product.gender ? product.gender : "N/A";
    },
    productSeason: (product) => {
        return product.season ? product.season : "N/A";
    },
    variantImage: (variant, color, blankCode) => {
        return variant.image ? variant.image.replace("=400", "=2400") : "N/A";
    },
    variantImages: (variant, sizeConverter, numBlanks, blankName, index) => {
       // console.log("variant", variant, "index", index);
        return variant.images && variant.images.length > index ? variant.images[index].image.replace("=400", "=2400") : "N/A";
    },
    variantColorFamily: (variant) => {
        return variant.color && variant.color.colorFamily ? variant.color.colorFamily : "";
    }
};
const HeaderList = ({ product, mp, variant, blankOverRides, headerLabel, index, color, blankCode, threadColor, category, numBlanks, blankName, type}) => {


    let value = "N/A";
    if(type && type == "product") {
        if (mp.productDefaultValues && mp.productDefaultValues[headerLabel] && mp.productDefaultValues[headerLabel].includes("product") && csvFunctions[mp.productDefaultValues[headerLabel]]) {
            if (headerLabel == "Image Alt Text" && index >= product.productImages.length) {
                value = "N/A";
            }
            else value = csvFunctions[mp.productDefaultValues[headerLabel]](product, index);
        }
        else if (mp.productDefaultValues && mp.productDefaultValues[headerLabel] && mp.productDefaultValues[headerLabel].includes("variant") && csvFunctions[mp.productDefaultValues[headerLabel].split(",")[0]]) {
            value = csvFunctions[mp.productDefaultValues[headerLabel].split(",")[0]](variant, mp.sizeConverter, numBlanks, blankName, mp.productDefaultValues[headerLabel].split(",")[1]);
        } else if (mp.productDefaultValues && mp.productDefaultValues[headerLabel] == "index") {
            if (index < product.productImages.length) {
                value = index + 1;
            }
        }
        else if (blankOverRides && blankOverRides[headerLabel]) {
            value = blankOverRides[headerLabel];
        } else if (headerLabel == "Category" || headerLabel == "Type") {
            value = category;
        } else if (mp.productDefaultValues && mp.productDefaultValues[headerLabel]) {
            value = mp.productDefaultValues[headerLabel];
            if (mp.productDefaultValues[headerLabel] == "Thread Color" && !threadColor) {
                value = "N/A";
            }
        }
    }else{
        if (mp.defaultValues[headerLabel] && mp.defaultValues[headerLabel].includes("product") && csvFunctions[mp.defaultValues[headerLabel]]) {
            if (headerLabel == "Image Alt Text" && index >= product.productImages.length) {
                value = "N/A";
            }
            else value = csvFunctions[mp.defaultValues[headerLabel]](product, index);
        }
        else if (mp.defaultValues[headerLabel] && mp.defaultValues[headerLabel].includes("variant") && csvFunctions[mp.defaultValues[headerLabel].split(",")[0]]) {
            value = csvFunctions[mp.defaultValues[headerLabel].split(",")[0]](variant, mp.sizeConverter, numBlanks, blankName, mp.defaultValues[headerLabel].split(",")[1]);
        } else if (mp.defaultValues[headerLabel] == "index") {
            if (index < product.productImages.length) {
                value = index + 1;
            }
        }
        else if (blankOverRides && blankOverRides[headerLabel]) {
            value = blankOverRides[headerLabel];
        } else if (headerLabel == "Category" || headerLabel == "Type") {
            value = category;
        } else if (mp.defaultValues && mp.defaultValues[headerLabel]) {
            value = mp.defaultValues[headerLabel];
            if (mp.defaultValues[headerLabel] == "Thread Color" && !threadColor) {
                value = "N/A";
            }
        }
    }
    return value
}

export async function GET(req = NextApiResponse, ) {
    let data = { marketPlace: req.nextUrl.searchParams.get("marketPlace"), product: req.nextUrl.searchParams.get("product"), header: req.nextUrl.searchParams.get("header") };
    let marketPlace = await MarketPlaces.findOne({_id: data.marketPlace}).lean();
    let product = await Products.findOne({_id: data.product}).populate("design colors productImages.blank productImages.color productImages.threadColor threadColors").populate({path:"blanks", populate: "colors"}).lean();
    if(!marketPlace || !product) {
        return NextResponse.json({error: true, message: "MarketPlace or Product not found"});
    }
    let headers = {}
    for (let header of marketPlace.headers) {
        for (let h of header) {
            headers[h.Label] = []
        }
    } 
    //console.log(marketPlace.hasProductLine[data.header], "hasProductLine for header", data.header);
    let sendVarianrts = [];
    if (marketPlace.hasProductLine && (marketPlace.hasProductLine[data.header])) {
        for (let b of product.blanks) {
            let thisHead = { ...headers };
            for (let h of Object.keys(headers)) {
                let val = HeaderList({ product, mp: marketPlace, variant: {}, blankOverRides: product.blanks.filter(bl => bl.code == b.code)[0].marketPlaceOverrides ? product.blanks.filter(bl => bl.code == b.code)[0].marketPlaceOverrides[marketPlace.name] : [], headerLabel: h, color: "", blankCode: b.code, category: product.blanks.filter(bl => bl.code == b.code)[0].category[0], threadColor: "", numBlanks: product.blanks.length, blankName: b.name, type: "product" })
                console.log("Header value for", h, ":", val);
                thisHead[h] = val != "N/A" ? val : "";
            }
            sendVarianrts.push(thisHead);
        }
    }
    let index = 0; 
    if(product.threadColors && product.threadColors.length > 0) {
        for (let b of product.blanks) {
            for(let tc of product.threadColors) {
                for(let c of product.colors) {
                    if (product.variants[b.code] && product.variants[b.code][tc.name] && product.variants[b.code][tc.name][c.name] && product.variants[b.code][tc.name][c.name].length > 0) {
                        for (let v of product.variants[b.code][tc.name][c.name]) {
                            let vari = [];
                            let thisHead = { ...headers };
                            for (let h of Object.keys(headers)) {
                                let val = HeaderList({ product, mp: marketPlace, variant: v, blankOverRides: b.marketPlaceOverrides ? b.marketPlaceOverrides[marketPlace.name] : {}, headerLabel: h, index: 0, color: c.name, blankCode: b.code, category: b.category[0], threadColor: tc.name, numBlanks: product.blanks.length, blankName: b.name, index });
                                thisHead[h] = val != "N/A" ? val : ""; // If the value is "N/A", it will be replaced with an empty string
                            }
                            index++
                            sendVarianrts.push(thisHead);
                        }
                    }
                }
            }
        }
    }else{
        for (let b of product.blanks) {
            for (let c of product.colors) {
                if (product.variants[b.code]  && product.variants[b.code][c.name] && product.variants[b.code][c.name].length > 0) {
                    for (let v of product.variants[b.code][c.name]) {
                        let thisHead = {...headers};
                        for (let h of Object.keys(headers)) {
                            let val = HeaderList({ product, mp: marketPlace, variant: v, blankOverRides: b.marketPlaceOverrides ? b.marketPlaceOverrides[marketPlace.name] : {}, headerLabel: h, index: 0, color: c.name, blankCode: b.code, category: b.category[0], numBlanks: product.blanks.length, blankName: b.name, index,  });
                            thisHead[h]= val!= "N/A"? val : ""; // If the value is "N/A", it will be replaced with an empty string                       
                        }
                        index++
                        sendVarianrts.push(thisHead);
                    }
                }
            }
        }
    }
    let newHeaders = [];
    for(let h of marketPlace.headers[data.header]) {
        newHeaders.push({id: h.id, title: h.Label});
    }
    const csvStringifier = createCsvStringifier({
        header: newHeaders,
    });
    let csvString = await csvStringifier.stringifyRecords([...sendVarianrts])
    csvString = `${csvStringifier.getHeaderString()}${csvString}`
    let buffer = new Buffer.from(csvString, "utf8")
    return new NextResponse(buffer, {
        headers: {
            'Content-Type': 'text/csv',
            "Access-Control-Allow-Origin": "*",
            'Content-Disposition': `attachment; filename="${marketPlace.name}-${new Date(Date.now()).toLocaleDateString("en-US")}-${new Date(Date.now()).getHours() % 12}:${new Date(Date.now()).getMinutes().length > 2 ? new Date(Date.now()).getMinutes(): `0${new Date(Date.now()).getMinutes()}`}${new Date(Date.now()).getHours() < 12 ? "AM" : "PM"}.csv"`
        }
    })
}
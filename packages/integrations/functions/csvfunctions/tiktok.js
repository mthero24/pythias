const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const createCsvStringifier = require('csv-writer').createObjectCsvStringifier;
import {S3Client, PutObjectCommand} from "@aws-sdk/client-s3";
const s3 = new S3Client({ credentials:{
    accessKeyId:'XWHXU4FP7MT2V842ITN9',
   secretAccessKey:'kf78BeufoEwwhSdecZCdcpZVJsIng6v5WFJM1Nm3'
}, region: "us-west-1", profile: "wasabi", endpoint: "https://s3.us-west-1.wasabisys.com/"  }); // for S3

export const tikTokHeader = [
    {id: "category", title: "category"},
    {id: "brand", title: "brand"},
    {id: "productName", title: "Product Name"},
    {id: "productDescription", title: "Product Description"},
    {id: "Image1", title: "Main Product Image"},
    {id: "Image2", title: "Product Image 2"},
    {id: "Image3", title: "Product Image 3"},
    {id: "Image4", title: "Product Image 4"},
    {id: "Image5", title: "Product Image 5"},
    {id: "Image6", title: "Product Image 6"},
    {id: "Image7", title: "Product Image 7"},
    {id: "Image8", title: "Product Image 8"},
    {id: "Image9", title: "Product Image 9"},
    {id: "productSku", title: "Identifier Code"},
    {id: "primaryVariationName", title: "Primary variation name"},
    {id: "primaryVariationValue", title: "Primary variation value"},
    {id: "primaryVariationImage1", title: "primaryVariationImage1"},
    {id: "primaryVariationImage2", title: "primaryVariationImage2"},
    {id: "primaryVariationImage3", title: "primaryVariationImage3"},
    {id: "primaryVariationImage4", title: "primaryVariationImage4"},
    {id: "primaryVariationImage5", title: "primaryVariationImage5"},
    {id: "primaryVariationImage6", title: "primaryVariationImage6"},
    {id: "primaryVariationImage7", title: "primaryVariationImage7"},
    {id: "primaryVariationImage8", title: "primaryVariationImage8"},
    {id: "primaryVariationImage9", title: "primaryVariationImage9"},
    {id: "secondaryVariationName", title: "secondary variation name"},
    {id: "secondaryVariationValue", title: "secondary variation value"},
    {id: "weight", title: "Package Weight(lb)"},
    {id: "Package Length(inch)", title: "Package Length(inch)"},
    {id: "Package Width(inch)", title: "Package Width(inch)"},
    {id: "Package Height(inch)", title: "Package Height(inch)"},
    {id: "deliveryOptions", title: "Delivery options"},
    {id: "price", title: "Retail Price (Local Currency)"},
    {id: "quantity", title: "Quantity in Sandbox US Local Sales warehouse"},
    {id: "sku", title: "Seller SKU"},
    {id: "sizeChart", title: "Size Chart"},
    {id: "Materials", title: "Materials"},
    {id: "pattern", title: "Pattern"},
    {id: "Neckline", title: "Neckline"},
    {id: "Sleeve Length", title: "Sleeve Length"},
    {id: "Season", title: "Season"},
    {id: "Style", title: "Style"},
    {id: "Fit", title: "Fit"},
    {id: "Stretch", title: "Stretch"},
    {id: "Washing Instructions", title: "Washing Instructions"},
    {id: "Waist Height", title: "Waist Height"},
    {id: "CA Prop 65: Carcinogens", title: "CA Prop 65: Carcinogens"},
    {id: "Carcinogen", title: "Carcinogen"},
    {id: "CA Prop 65: Repro. Chems", title: "Reprotoxic Chemicals"},
    {id: "Safety Data Sheet (SDS) for other dangerous goods or hazardous materials", title: "Safety Data Sheet (SDS) for other dangerous goods or hazardous materials"},
    {id: "productStatus", title: "Product Status"},
]
const createTikTokVariant = ({p, v})=>{
    console.log("make variant", v.sku)
      let sizes = {
        xs: "X SMALL",
        s: "SMALL",
        m: "MEDIUM",
        l: "LARGE",
        xl: "X LARGE",
        "2xl": "2XL",
        "2t": "2T",
        "3t": "3T",
        "4t": "4T",
        "5/6t": "5T-6T",
        "5t": "5T-6T",
        "6m": "6 MONTHS",
        "12m": "12 MONTHS",
        "18m": "18 MONTHS",
        "24m": "24 MONTHS",
        "nb": "NEWBORN"
    }
    let productImages = {}
    let variantImages = {}
    let j = 1
    let k = 1
    for(let i of p.images){
        productImages[`Image${j}`] = i
        j++
    }
    for(let i of v.images){
        variantImages[`primaryVariationImage${k}`] = i
        k++
    }
    return {
        "productName": `${p.name}`,
        "productDescription": `${p.design.description} ${p.blank.blank.description}`,
        brand: p.brand,
        productSku: p.sku,
        "sku": v.sku,
        primaryVariationName: "color",
        primaryVariationValue: v.threadColor? `${v.color.name} with ${v.threadColor.name} Lettering`: v.color.name,
        secondaryVariationName: "size",
        secondaryVariationValue: sizes[v.size.name]? sizes[v.size.name]: v.size.name,
        weight: v.size.weight,
        price: v.size.retailPrice,
        ...productImages,
        ...variantImages,
        ...p.blank.tikTokHeader,
        productStatus: "active"
    }
}

export  const createTikTokCsv = async ({products})=>{
    let sendProducts = []
    for(p of products){
        for(let v of products.variants){
            sendProducts.push(createTikTokVariant({p,v}))
        }
    }
    const csvStringifier = createCsvStringifier({
        header: tikTokHeader,
    });
    //console.log(products)
    //console.log("product", products.length)
    let csvString =  await csvStringifier.stringifyRecords([...products])
    csvString = `
        ${csvStringifier.getHeaderString()}${csvString}
    `
    let url = `csv/tiktok/${Date.now()}.csv`
    let params = {
        Bucket: "images1.pythiastechnologies.com",
        Key: url,
        Body: csvString.toString("base64"),
        ACL: "public-read",
        ContentEncoding: "base64",
        ContentDisposition: "inline",
        ContentType: "text/csv",
        };
    const data = await s3.send(new PutObjectCommand(params));
    return url
}
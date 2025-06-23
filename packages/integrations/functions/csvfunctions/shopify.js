const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const createCsvStringifier = require('csv-writer').createObjectCsvStringifier;
import {S3Client, PutObjectCommand} from "@aws-sdk/client-s3";
const s3 = new S3Client({ credentials:{
    accessKeyId:'XWHXU4FP7MT2V842ITN9',
   secretAccessKey:'kf78BeufoEwwhSdecZCdcpZVJsIng6v5WFJM1Nm3'
}, region: "us-west-1", profile: "wasabi", endpoint: "https://s3.us-west-1.wasabisys.com/"  }); // for S3

export const tikTokHeader = [
    {id: "handle", title: "Handle"},
    {id: "title", title: "Title"},
    {id: "body", title: "Body (HTML)"},
    {id: "vendor", title: "Vendor"},
    {id: "Product Category", title: "Product Category"},
    {id: "Type", title: "Type"},
    {id: "tags", title: "Tags"},
    {id: "published", title: "Published"},
    {id: "option1", title: "Option1 Name"},
    {id: "color", title: "Option1 Value"},
    {id: "option2", title: "Option2 Name"},
    {id: "size", title: "Option2 value"},
    {id: "option3", title: "Option3 Name"},
    {id: "threadColor", title: "Option3 Value"},
    {id: "sku", title: "Variant Sku"},
    {id: "weight", title: "Variant Grams"},
    {id: "inventoryTracker", title: "Variant Inventory Tracker"},
    {id: "quantity", title: "Variant Inventory Qty"},
    {id: "inventoryPolicy", title: "Variant Inventory Policy"},
    {id: "inventoryService", title: "Variant Fulfillment Service"},
    {id: "price", title: "Variant Price"},
    {id: "Variant Compare At Price", title: "Variant Compare At Price"},
    {id: "requiresShipping", title: "Variant Requires Shipping"},
    {id: "taxable", title: "Variant Taxable"},
    {id: "barcode", title: "Variant Barcode"},
    {id: "imageSrc", title: "Image Src"},
    {id: "imagePosition", title: "Image Position"},
    {id: "imageAltText", title: "Image Alt Text"},
    {id: "giftCard", title: "Gift Card"},
    {id: "seoTitle", title: "SEO Title"},
    {id: "seoDescription", title: "SEO Description"},
    {id: "Google Shopping / Google Product Category", title: "Google Shopping / Google Product Category"},
    {id: "Google Shopping / Gender", title: "Google Shopping / Gender"},
    {id: "Google Shopping / Age Group", title: "Google Shopping / Age Group"},
    {id: "Google Shopping / MPN", title: "Google Shopping / MPN"},
    {id: "Google Shopping / Condition", title: "Google Shopping / Condition"},
    {id: "Google Shopping / Custom Product", title: "Google Shopping / Custom Product"},
    {id: "variantImage", title: "Variant Image"},
    {id: "Variant Tax Code", title: "Variant Tax Code"},
    {id: "Cost per item", title: "Cost per item"},
    {id: "Included / United States", title: "Included / United States"},
    {id: "Price / United States", title: "Price / United States"},
    {id: "Compare At Price / United States", title: "Compare At Price / United States"},
    {id: "Included / International", title: "Included / International"},
    {id: "Price / International", title: "Price / International"},
    {id: "Compare At Price / International", title: "Compare At Price / International Instructions"},
    {id: "status", title: "Status"},
]
const createTikTokVariant = ({p, v, image})=>{
    //console.log("make variant", v.sku)
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
    if(p.blank.blank.code == "CC1717") console.log(p.blank.blank.tikTokHeader, "tiktokheader")
    return {
        "title": `${p.name}`,
        "body": `<p>${p.design.description} ${p.blank.blank.description}</p>`,
        handle: p.sku,
        "sku": v.sku,
        vendor: "Imperial The Label",
        option1: "color",
        color: v.threadColor? `${v.color.name}`: null,
        option2: "size",
        tags: p.design.tags,
        Type: p.blank.blank.category,
        size: sizes[v.size.name.toLowerCase()]? sizes[v.size.name.toLowerCase()]: v.size.name,
        option3: v.threadColor? p.design.printType == "EMB"? "Thread Color": "Print Color": null,
        threadColor: v.threadColor? v.threadColor.name: null,
        inventoryTracker: "shopify",
        inventoryPolicy: "allow",
        inventoryService: "manual",
        barcode: v.barcode,
        published: true,
        requiresShipping: true,
        taxable: true,
        ...image,
        giftCard: false,
        quantity: 1000,
        seoTitle: `${p.design.name} ${p.blank.blank.name}| Imperial The Label`,
        seoDescription: p.design.description,
        variantImage: v.images[0],
        variantWeightUnit: "oz",
        weight: v.size.weight,
        price: v.size.retailPrice,
        ...p.blank.blank.shopifyHeader,
        status: "active"
    }
}

export  const createShopifyCsv = async ({products})=>{
    let sendProducts = []
    for(let p of products){
        let j = 0
        for(let v of p.variants){
            let image = {}
            if(p.images[j]) image= {imageSrc: p.images[j], imagePosition: j, imageAltText: p.name}
            let variant = await createTikTokVariant({p,v, image})
            j++
            //console.log(variant)
            sendProducts.push(variant)
        }
    }
    const csvStringifier = createCsvStringifier({
        header: tikTokHeader,
    });
    //console.log(products)
    //console.log("product", products.length)
    let csvString =  await csvStringifier.stringifyRecords([...sendProducts])
    csvString = `
        ${csvStringifier.getHeaderString()}${csvString}
    `
    let url = `csv/shopify/${Date.now()}.csv`
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
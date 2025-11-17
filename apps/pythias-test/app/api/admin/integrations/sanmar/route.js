import {NextApiRequest, NextResponse} from "next/server"
import { getProductInfoByBrand } from "@pythias/inventory";
import {Blank, Color,Suppliers} from "@pythias/mongo"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";
import axios from "axios";
import { ControlPointDuplicateOutlined } from "@mui/icons-material";
const s3 = new S3Client({
    credentials: {
        accessKeyId: 'XWHXU4FP7MT2V842ITN9',
        secretAccessKey: 'kf78BeufoEwwhSdecZCdcpZVJsIng6v5WFJM1Nm3'
    }, region: "us-west-1", profile: "wasabi", endpoint: "https://s3.us-west-1.wasabisys.com/"
}); // for S3
const readImage = async (url) => {
    const response = await axios.get(
        `http://localhost:3011/resize?url=${url}`,
        { responseType: "arraybuffer" }
    ).catch(e => { });
    if (response) {
        console.log(response.data, "response data from sanmar image")
        const buffer = Buffer.from(response.data, "binary");
        // Use sharp to process the image
        return buffer;
    }
    return null
}
export async function POST(req=NextApiRequest){
    let data = await req.json();
    console.log(data, "data from sanmar route");
    let productInfo = await getProductInfoByBrand(data.brandName);
    console.log(productInfo, "product info from sanmar");
    return NextResponse.json({error: false, productInfo})
}

export async function PUT(req=NextApiRequest){
    let data = await req.json();
    console.log(data, "data from sanmar route - put");
    console.log(data.product, "product to add from sanmar");
    let sizes = [];
    let colors = [];
    let images = []
    for(let p of data.product){
        if(!sizes.find(s=>s.name===p.productBasicInfo.size)){
            sizes.push({
                name: p.productBasicInfo.size,
                weight: parseFloat(p.productBasicInfo.pieceWeight),
                basePrice: parseFloat(p.productPriceInfo.piecePrice),
                wholesaleCost: parseFloat(p.productPriceInfo.piecePrice + (p.productPriceInfo.piecePrice * 2.25)),
                retailPrice: parseFloat(p.productPriceInfo.piecePrice + (p.productPriceInfo.piecePrice * 4.5)),
            });
        }
        let color = await Color.findOne({name: p.productBasicInfo.color});
        if(!color){
            color = new Color({
                name: p.productBasicInfo.color,
            });
            color = await color.save();
        }
        if(color && colors.filter(c=>c._id.toString()===color._id.toString()).length===0) {
            colors.push(await Color.findOne({name: p.productBasicInfo.color}));
            for(let key of Object.keys(p.productImageInfo)){
                if(!p.productImageInfo[key] || p.productImageInfo[key] == "" || p.productImageInfo[key].includes("pdf") ) continue;
                let url = "styles/" + Date.now() + "." + p.productImageInfo[key].split(".")[p.productImageInfo[key].split(".").length - 1];
                let base64 = await readImage(p.productImageInfo[key]);
                let params = {
                    Bucket: "images1.pythiastechnologies.com",
                    Key: url,
                    Body: base64,
                    ACL: "public-read",
                    ContentEncoding: "base64",
                    ContentDisposition: "inline",
                    ContentType: `image/${p.productImageInfo[key].split(".")[p.productImageInfo[key].split(".").length - 1]}`,
                };
                const data = await s3.send(new PutObjectCommand(params));
                console.log("Success, object uploaded", data);
                images.push({
                    image: `https://images1.pythiastechnologies.com/${url}`,
                    color: color._id,
                    boxes: {}
                }) 
            };
        }
    }
    let blank = new Blank({
        name: data.product[0].productBasicInfo.productTitle,
        code: data.product[0].productBasicInfo.style,
        brand: data.product[0].productBasicInfo.brandName,
        description: data.product[0].productBasicInfo.productDescription,
        sizes: sizes,
        department: data.product[0].productBasicInfo.department,
        category: [data.product[0].productBasicInfo.category],
        suppliers: ["Sanmar"],
        colors: colors,
        images: images,
        slug: data.product[0].productBasicInfo.productTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
    });
    blank = await blank.save();
    // Here you would typically add the product to your database or perform other actions
    return NextResponse.json({error: false, message: "Product added successfully", blankId: blank._id})
}
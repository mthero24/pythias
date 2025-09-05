import { Nightlife } from "@mui/icons-material";
import {Design, SkuToUpc, SkuToUpcOld, Blank, Color, Size, Products, MarketPlaces, ApiKeyIntegrations, Inventory} from "@pythias/mongo"
import axios from "axios";
import { pullOrders } from "@/functions/pullOrders"
import {refreshToken} from "@pythias/integrations"
import { image } from "pdfkit";
let converter = {
    YL: "L",
    YS: "S",
    YM: "M",
    YXL: "XL",
    YXXL: "2XL",
}
export default async function Test(){
    
    // let blanks = await Blank.find({}).populate("colors")
    // for(let b of blanks){
    //     console.log(b.multiImages, "multi images")
    //     b.images = []
    //     for(let key of Object.keys(b.multiImages)){
    //         for(let img of b.multiImages[key]){
    //             console.log(img.box[0])
    //             b.images.push({image: img.image, color: img.color, boxes: {[key.toLowerCase().includes("model")? key.toLowerCase().replace("model", "") : key]: {x: img.box[0]?.x, y: img.box[0]?.y, width: img.box[0]?.boxWidth, height: img.box[0]?.boxHeight, rotation: img.box[0]?.rotation}}})
    //         }
    //     }
    //     console.log(b.images, "images")
    //     await b.save()
    // }
    return <h1>test</h1>
}
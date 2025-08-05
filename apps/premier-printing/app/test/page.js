import { Nightlife } from "@mui/icons-material";
import {Design, SkuToUpc, SkuToUpcOld, Blank, Color, Size, Products, marketPlaces, ApiKeyIntegrations, Inventory} from "@pythias/mongo"
let converter = {
    YL: "L",
    YS: "S",
    YM: "M",
    YXL: "XL",
    YXXL: "2XL",
}
export default async function Test(){

    // let prods = await Products.find({})

    // for(let p of prods){
    //     for(let v of p.variantsArray){
    //         v.inventory = await Inventory.findOne({ blank: v.blank, color: v.color, sizeId: v.size });
    //     }
    //     p.markModified("variantsArray");
    //     await p.save();
    // }

    return <h1>test</h1>
}
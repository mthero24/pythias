import { Nightlife } from "@mui/icons-material";
import {Design, SkuToUpc, SkuToUpcOld, Blank, Color, Size, Products, marketPlaces, ApiKeyIntegrations} from "@pythias/mongo"
let converter = {
    YL: "L",
    YS: "S",
    YM: "M",
    YXL: "XL",
    YXXL: "2XL",
}
export default async function Test(){
    let connections = await ApiKeyIntegrations.find({ provider: "premierPrinting"}).catch(err => console.error("Error finding connections:", err));
    console.log("Connections found:", connections);
    // let prods = await Products.find({ sku: { $ne: "21577M_F"}}).populate("design colors productImages.blank productImages.color productImages.threadColor threadColors variantsArray.color variantsArray.blank").populate({ path: "blanks", populate: "colors" })
    
    // for(let p of prods){
    //     if(!p.marketPlacesArray) p.marketPlacesArray = [];
    //     for(let m of Object.keys(p.marketPlaces? p.marketPlaces : {})){ 
    //         console.log("Marketplaces:", m, p.marketPlaces[m]);
    //         if(!p.marketPlacesArray.includes(m)) p.marketPlacesArray.push(m);
    //     }
    //     await p.save()
    // }

    return <h1>test</h1>
}
import { pullOrders } from "@/functions/pullOrders"
import {Inventory, InventoryOrders, Products} from "@pythias/mongo"
import axios from "axios";
export default async function Test(){
    let prods = await Products.find({ sku: { $ne: "21577M_F" } }).populate("design colors productImages.blank productImages.color productImages.threadColor threadColors variantsArray.color variantsArray.blank").populate({ path: "blanks", populate: "colors" })

    // for (let p of prods) {
    //     if (!p.marketPlacesArray) p.marketPlacesArray = [];
    //     for (let m of Object.keys(p.marketPlaces ? p.marketPlaces : {})) {
    //         console.log("Marketplaces:", m, p.marketPlaces[m]);
    //         if (!p.marketPlacesArray.includes(m)) p.marketPlacesArray.push(m);
    //     }
    //     await p.save()
    // }

    return <h1>test</h1>
}
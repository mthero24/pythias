import { Nightlife } from "@mui/icons-material";
import { Design, SkuToUpc, SkuToUpcOld, Blank, Color, Size, Products, marketPlaces, ApiKeyIntegrations, Inventory, ProductInventory, Items, Order, LicenseHolders } from "@pythias/mongo"
import axios from "axios";
import { pullOrders, updateInventory} from "@/functions/pullOrders"
import { getOrders, generatePieceID } from "@pythias/integrations";
import { canceled } from "@/functions/itemFunctions";
let converter = {
    YL: "L",
    YS: "S",
    YM: "M",
    YXL: "XL",
    YXXL: "2XL",
}
const CreateSku = async ({blank, color, size, design, threadColor}) => {
    let sku = `${blank.code}_${color.sku}_${size.name}${threadColor ? `_${threadColor}` : ""}_${design.sku}`;
    return sku;
}
export default async function Test(){
  //await pullOrders();
    // let item = await Items.findOne({ pieceId: "TE4FPTPG3"})
    // let inventory = await Inventory.findOne({ blank: item.blank, color: item.color, size: item.size })
    // console.log(inventory)
    // item.inventory = {
    //     inventoryType: "inventory",
    //     inventory: inventory
    // }
    // await item.save();
//     let productInventories = await ProductInventory.find({ quantity: { $gt: 0 } })
//     console.log(productInventories.length)
//    let items = await Items.find({sku: {$in: productInventories.map(pi => pi.sku)}}).populate("designRef blank color threadColor size order")
//    console.log(items.length, "items found")
//     console.log(items[0].order.poNumber)
//     let item = items[0]
//     let productInv = await ProductInventory.findOne({sku: item.sku})
//     console.log(productInv) 
   //console.log("test page called")
    //await updateInventory();
    
    return <h1>test</h1>
}
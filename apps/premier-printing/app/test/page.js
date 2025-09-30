import { Nightlife } from "@mui/icons-material";
import {Design, SkuToUpc, SkuToUpcOld, Blank, Color, Size, Products, marketPlaces, ApiKeyIntegrations, Inventory, ProductInventory, Items, Order} from "@pythias/mongo"
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
//     let items = await Items.find({"inventory.inventoryType": null, labelPrinted: false})
//    console.log(items.length, "items to update")
//    for(let i of items){
//     i.inventory = {inventoryType: "inventory"};
//     i.inventory.inventory = await Inventory.findOne({blank:  i.blank, color:  i.color, sizeId: i.size})
//     if (!i.inventory.inventory) {
//         i.inventory.inventory = await Inventory.findOne({ inventory_id: `${i.colorName}-${i.sizeName}-${i.styleCode}` })
//     }
//     await i.save();
//     console.log(i.inventory, "inventory for item")
//    }
    await updateInventory();
   
    return <h1>test</h1>
}
import { pullOrders } from "@/functions/pullOrders"
import {Inventory, InventoryOrders, Products, Order,  ProductInventory, Blank, Design, Color, Item, } from "@pythias/mongo"
import axios from "axios";
import btoa from "btoa";
import { getOrders, generatePieceID } from "@pythias/integrations";
import { create } from "@mui/material/styles/createTransitions";
import { isSingleItem } from "@/functions/itemFunctions";
const CreateSku = async ({ blank, color, size, design, threadColor }) => {
    let sku = `${design.printType}_${design.sku}_${color.sku}_${size.name}_${blank.code}${threadColor ? `_${threadColor}` : ""}`;
    return sku;
}


export default async function Test(){
    
   //await pullOrders();
    
    return <h1>test</h1>
}
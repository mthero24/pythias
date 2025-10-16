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
   //console.log("test page called")
    //await updateInventory();
    let licenses = await LicenseHolders.find().lean()
    let months = [{ number: 0, licenses: [] }, { number: 1, licenses: [] }, { number: 2, licenses: [] }, { number: 3, licenses: [] }, { number: 4, licenses: [] }, { number: 5, licenses: [] }, { number: 6, licenses: [] }, { number: 7, licenses: [] }, { number: 8, licenses: [] }, { number: 9, licenses: [] }, { number: 10, licenses: [] }, { number: 11, licenses: [] }]
    for (let l of licenses) {
        let designs = await Design.find({ licenseHolder: l._id }).select("_id").lean()
        //console.log(designs.length, "designs length")
        let items = await Items.find({ designRef: { $in: designs.map(d => d._id) }, date: { $gt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) } }).populate("blank").lean()
        //console.log(items.length, "items length")
        for (let i of items) {
            let month = new Date(i.date).getMonth()
            //console.log(i.blank.sizes, "blank sizes", i.sizeName)
            let size = await i.blank?.sizes.filter(s => s.name?.toString() == i.sizeName?.toString())[0]
            //console.log(size, "size")
            let price = size ? size.retailPrice : 0
            price = price + (l.additionalFees ? l.additionalFees : 0)
            let payment = price * (l.paymentType == "Percentage Per Unit" ? (l.amount / 100) : 1) + (l.paymentType == "Flat Per Unit" || l.paymentType == "One Time" ? l.amount : 0)
            console.log(price, payment, month, "price")
            let mo = months.filter(m => m.number == month)[0]
            let license = mo.licenses.filter(li => li._id.toString() == l._id.toString())[0]
            if (!license) {
                mo.licenses.push({ ...l, totalOwed: payment ? payment : 0, sold: price, })
            } else {
                license.totalOwed = license.totalOwed + (payment ? payment : 0)
                license.sold = license.sold + price
            }
        }
    }
    console.log(months, "months")
    for(let month of months){
        console.log(month.number, month.licenses.length, "month", month.licenses.reduce((a,b)=>a+b.totalOwed, 0), month.licenses.reduce((a,b)=>a+b.sold, 0))
    }
    return <h1>test</h1>
}
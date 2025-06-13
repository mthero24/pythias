import Items from "@/models/Items";
import Inventory from "@/models/inventory";
import ReturnBins from "@/models/returnBins"
import Order from "@/models/Order";
import Design from "@/models/Design";
import { dirname } from "path";
import { BatchPredictionRounded } from "@mui/icons-material";
let updateReturnBin = async (re, upc, sku)=>{
  try{
    let hasReturn = await ReturnBins.findOne({_id: re._id})
    for(let i of hasReturn.inventory){
      if(i.upc == upc || i.sku == sku){
        i.quantity -= 1
      }
    }
    hasReturn.markModified("inventory")
    await hasReturn.save()
  }catch(e){
    console.log(e)
  }
}
let fullSize = {
  "XS": "XSMALL",
  "S": "SMALL",
  "M": "MEDIUM",
  "L": "LARGE",
  "XL": "XLARGE",
  "2XL": "2XLARGE",
  "3XL": "3XLARGE"
}
export const buildLabelData = async (item, i, doc, opts={}) => {
    //console.log(item.inventory)
    if(!item.order.poNumber)item.order = await Order.findOne({_id: item.order}).select("items poNumber")
    let totalQuantity = 1
    if(item.order) totalQuantity = await Items.find({_id: { $in: item.order.items }, canceled: false,}).countDocuments();
   // console.log(item.order.items?.length, "item order")
    //console.log(totalQuantity)
    let hasReturn = await ReturnBins.findOne({$or: [{"inventory.upc": item.upc}, {"inventory.sku": item.sku}], "inventory.quantity": {$gt: 0}})
    if(hasReturn){
      updateReturnBin(hasReturn, item.upc, item.sku)
    }
    let frontBackString;
    if (item.design?.back) {
      if (item.design?.front && item.design.back) {
        frontBackString = `FRONT&BACK`;
      } else if (item.design?.pocket && item.design?.back) {
        frontBackString = `POCKET&BACK`;
      }else {
        frontBackString = `BACK ONLY`;
      }
    }else if(item.design?.pocket){
        frontBackString = `POCKET Only`;
    } else frontBackString = "FRONT ONLY";
    if(!item.design) frontBackString = "Missing Design";
    let printPO = opts.printPO ? `${opts.printPO}`: "";
    let printTypeAbbr = item.sku.split("_")[0];
    doc.font("./LibreBarcode39-Regular.ttf").fontSize(25).text(`*${item.pieceId}*`, 3, 8);
    doc.font("Courier-Bold").fontSize(8)
    doc.text(`Po#: ${item.order ? item.order.poNumber : "no order"} Piece: ${item.pieceId}`, 10 )
    doc.font("Courier-Bold").fontSize(9).text(`${item.styleCode} loc: ${item?.inventory?.location}`)
    doc.font("Courier-Bold").fontSize(9)
    doc.text(`Color: ${item.colorName}`, 10)
    doc.text(`Size: ${fullSize[item.sizeName]? fullSize[item.sizeName]: item.sizeName} CNT: ${totalQuantity}`)
    doc.text(`Thread: ${item.threadColorName}`)
    doc.text(`Art: ${item.designRef && item.designRef.name? item.designRef.name: item.sku}`)
    doc.text(`${item.type}`)
    doc.text(`#${i + 1}`)
    if(printPO){
      doc.text(`printPO`)
    }
    if(frontBackString){
      doc.font("Courier-Bold").fontSize(10)
      doc.text(frontBackString, 50, 130)
      }
        // ${hasReturn == null? `^LH12,18^CFS,25,12^AXN,22,30^FO320,100^FDAisle:${inventory?.row}^FS
        // ^LH12,18^CFS,25,12^AXN,22,30^FO320,130^FDUnit:${inventory?.unit}^FS
        // ^LH12,18^CFS,25,12^AXN,22,30^FO320,160^FDShelf:${inventory?.shelf}^FS
        // ^LH12,18^CFS,25,12^AXN,22,30^FO320,190^FDBin:${inventory?.bin}^FS`: `R Bin${hasReturn.number}`}
    
  }
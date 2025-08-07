import {Items, Order} from "@pythias/mongo";
let fullSize = {
  "XS": "XSMALL",
  "S": "SMALL",
  "M": "MEDIUM",
  "L": "LARGE",
  "XL": "XLARGE",
  "2XL": "2XLARGE",
  "3XL": "3XLARGE"
}
export const buildLabelData = async (item, i, doc, type, opts={}) => {
    //console.log(item.inventory)
    if(!item.order.poNumber)item.order = await Order.findOne({_id: item.order}).select("items poNumber")
    let totalQuantity = 1
    if(item.order) totalQuantity = await Items.find({_id: { $in: item.order.items }, canceled: false,}).countDocuments();
   // console.log(item.order.items?.length, "item order")
    //console.log(totalQuantity)
    let frontBackString = ``
    for(let loc of Object.keys(item.design)){
        if(item.design[loc]){
          frontBackString = `${frontBackString} ${frontBackString != ""? "&": ""} ${loc} ${Object.keys(item.design).length == 1? "Only": ""}`
        }
    }
    if(!item.design) frontBackString = "Missing Design";
    let printPO = opts.printPO ? `${opts.printPO}`: "";
    doc.font("./LibreBarcode39-Regular.ttf").fontSize(25).text(`*${item.pieceId}*`, 3, 8);
    doc.font("Courier-Bold").fontSize(8)
    doc.text(`Po#: ${item.order ? item.order.poNumber : "no order"} Piece: ${item.pieceId}`, 10 )
    doc.font("Courier-Bold").fontSize(9).text(`${item.styleCode} loc: ${item.pulledFromReturn? `RB ${item.returnBinNUmber}`:item?.inventory?.location}`)
    doc.font("Courier-Bold").fontSize(9)
    doc.text(`Color: ${item.colorName}`, 10)
    doc.text(`Size: ${fullSize[item.sizeName]? fullSize[item.sizeName]: item.sizeName} CNT: ${totalQuantity}`)
    doc.text(`Thread: ${item.threadColorName}`)
    doc.text(`Art: ${item.designRef && item.designRef.name? item.designRef.name.substring(0, 20): item.sku}`)
    doc.text(`${item.type} ${new Date(item.date).toLocaleDateString("EN-us")}`)
    doc.text(`#${i + 1}`)
    if(printPO){
      doc.text(printPO)
    }
    if(frontBackString){
      doc.font("Courier-Bold").fontSize(10)
      doc.text(frontBackString, 10, 130)
    }    
  }
import {Items, Order, Inventory, ProductInventory} from "@pythias/mongo";
let fullSize = {
  "XS": "XSMALL",
  "S": "SMALL",
  "M": "MEDIUM",
  "L": "LARGE",
  "XL": "XLARGE",
  "2XL": "2XLARGE",
  "3XL": "3XLARGE"
}
export const buildLabelData = async (item, i, doc, type, poNumber, opts={}) => {
    //console.log(item.inventory)
    if(!item.order.poNumber)item.order = await Order.findOne({_id: item.order}).select("items poNumber")
    let totalQuantity = 1
    if(item.order) totalQuantity = await Items.find({_id: { $in: item.order.items }, canceled: false,}).countDocuments();
    if (item.inventory.inventoryType == "productInventory") {
      let productInventory = await productInventory.findOne({ _id: item.inventory.productInventory._id }).select("location quantity onHold");
      productInventory.quantity -= 1;
      if(productInventory.inStock) productInventory.inStock = productInventory.inStock.filter(i => i.toString() != item._id.toString());
      await productInventory.save();
    } else if (item.inventory.inventoryType == "inventory") {
      let inventory = await Inventory.findOne({ _id: item.inventory.inventory._id? item.inventory.inventory._id : item.inventory.inventory }).select("quantity onHold inStock attached orders");
      if(inventory){
        inventory.quantity -= 1;
        if (inventory.inStock)inventory.inStock = inventory.inStock.filter(i => i.toString() != item._id.toString());
        if (inventory.attached)inventory.attached = inventory.attached.filter(i => i.toString() != item._id.toString());
        await inventory.save();
      }
    }
    let frontBackString = ``
    for(let loc of Object.keys(item.design? item.design : item.designRef? item.designRef.images : {})){
        if(item.design[loc]){
          frontBackString = `${frontBackString} ${frontBackString != "" ? "&" : ""} ${loc} ${Object.keys(item.design ? item.design : item.designRef ? item.designRef.images : {}).length == 1? "Only": ""}`
        }
    }
    if(!item.design) frontBackString = "Missing Design";
    let printPO = opts.printPO ? `${opts.printPO}`: "";
    doc.font("./LibreBarcode39-Regular.ttf").fontSize(25).text(`*${item.pieceId}*`, 3, 8);
    doc.font("Courier-Bold").fontSize(8)
    doc.text(`Po#: ${item.order ? item.order.poNumber : "no order"} Piece: ${item.pieceId}`, 10 )
  }
import Items from "../models/Items";

export const buildLabelData = async (item, i, poNumber, opts={}) => {
    let totalQuantity = await Items.find({_id: { $in: item.order.items },canceled: false,}).countDocuments();
    let frontBackString = "";
    //console.log(totalQuantity, "TQ");
    for(let loc of Object.keys(item.design)){
      if(item.design[loc]){
        frontBackString = `${frontBackString}${frontBackString != ""? "&": ""}${loc} ${Object.keys(item.design).length == 1? "Only": ""}`
      }
    }
    frontBackString = `^LH12,18^CFS,25,12^AXN,40,50^FO100,540^FD${frontBackString}^FS`;
    let printPO = opts.printPO ? `^LH12,18^CFS,25,12^AXN,22,30^FO150,540^FDPO:${opts.printPO}^FS`: "";
    let printTypeAbbr;
    if (item?.type && item?.type?.toLowerCase() == "dtf") printTypeAbbr = "DTF";
    if (item?.type && item?.type?.toLowerCase() == "gift") printTypeAbbr = "GIFT";
    if (item?.type && item?.type?.toLowerCase() == "sublimation") printTypeAbbr = "SUB";
    if (item?.type && item?.type?.toLowerCase() == "embroidery") printTypeAbbr = "EMB";
  let labelString;
    if(item.type == "gift"){
      labelString = `^XA
            ^FO50,80^BY2^BC,120,N,N,N,A^FD${item.pieceId}^FS
            ^LH6,6^CFS,30,6^AXN,22,30^FO15,30^FDPO#: ${item.order ? item.order.poNumber : "no order"}^FS
            ^LH6,6^CFS,30,6^AXN,22,30^FO15,60^FDPiece: ${item.pieceId}^FS
            ^LH12,18^CFS,25,12^AXN,22,30^FO20,330^FD#${i + 1}^FS
          ^LH12,18^CFS,25,12^AXN,75,90^FO120,250^FD${item.type}^FS
            ^LH12,18^CFS,25,12^AXN,60,35^FO20,360^FDColor: ${item.colorName}, Size: ${item.sizeName}^FS
            ^LH12,18^CFS,25,12^AXN,45,30^FO20,430^FDVendor: ${item.vendor ? item.vendor : "TSP"}, Shipping: ${item.shippingType}^FS
            ^LH12,18^CFS,25,12^AXN,45,30^FO20,480^FD PrintO Design: ${item.sku} CNT: ${item.order.items.length}^FS
            ^XZ`
    }else{
      labelString = `^XA
          ^FO50,80^BY2^BC,120,N,N,N,A^FD${item.pieceId}^FS
          ^LH6,6^CFS,30,6^AXN,22,30^FO15,30^FDPO#: ${
              item.order ? item.order.poNumber : "no order"
          }^FS
          ^LH6,6^CFS,30,6^AXN,22,30^FO15,60^FDPiece: ${item.pieceId}^FS
          ^LH12,18^CFS,25,12^AXN,22,30^FO20,330^FD#${i + 1}^FS
          ^LH12,18^CFS,25,12^AXN,75,90^FO120,250^FD${item.styleCode}^FS
          ^LH12,18^CFS,25,12^AXN,30,35^FO220,310^FD Row: ${item.inventory.inventory?.row}^FS
          ^LH12,18^CFS,25,12^AXN,30,35^FO220,340^FD Unit: ${item.inventory.inventory?.unit}^FS
          ^LH12,18^CFS,25,12^AXN,30,35^FO220,370^FD Shelf: ${item.inventory.inventory?.shelf}^FS
          ^LH12,18^CFS,25,12^AXN,30,35^FO220,400^FD Bin: ${item.inventory.inventory?.bin}^FS
          ^LH12,18^CFS,25,12^AXN,30,35^FO20,360^FD${
              item.colorName
          }^FS
          ^LH12,18^CFS,25,12^AXN,30,35^FO20,390^FD${item.sizeName}^FS
          ^LH12,18^CFS,25,12^AXN,22,30^FO20,430^FDShipping: ${item.shippingType}^FS
            ^LH12,18^CFS,25,12^AXN,22,30^FO20,460^FDPrint Areas: ${Object.keys(item.design).toString()}^FS
          ^LH12,18^CFS,25,12^AXN,22,30^FO20,500^FDCNT: ${totalQuantity}^FS
          ${
              printTypeAbbr
              ? `^LH12,18^CFS,25,12^AXN,40,50^FO20,230^FD${printTypeAbbr}^FS`
              : ""
          }
          ^LH12,18^CFS,25,12^AXN,22,30^FO20,480^FD PrintO Design: ${
            item.designSku
        }^FS
          ${poNumber ? `^LH12,18^CFS,25,12^AXN,40,50^FO100,510^FDPO: ${poNumber}^FS`: ""}
          ${frontBackString}
      ^XZ`;
    }
    //console.log(labelString)
    return labelString;
    
  }
import Items from "../models/Items";

export const buildLabelData = async (item, i, opts={}) => {
    let totalQuantity = await Items.find({_id: { $in: item.order.items },canceled: false,}).countDocuments();
    let frontBackString;
    //console.log(totalQuantity, "TQ");
    if (item.design?.back) {
      if (item.design?.front && item.design.back) {
        frontBackString = `^LH12,18^CFS,25,12^AXN,40,50^FO200,540^FDFRONT&BACK^FS`;
      } else {
        frontBackString = `^LH12,18^CFS,25,12^AXN,40,50^FO200,540^FDBACK ONLY^FS`;
      }
    } else frontBackString = "";
    if(!item.design) frontBackString = "Missing Design";
    let printPO = opts.printPO ? `^LH12,18^CFS,25,12^AXN,22,30^FO150,540^FDPO:${opts.printPO}^FS`: "";
    let printTypeAbbr;
    if (item?.type && item?.type?.toLowerCase() == "dtf") printTypeAbbr = "DTF";
    if (item?.type && item?.type?.toLowerCase() == "gift") printTypeAbbr = "GIFT";
    if (item?.type && item?.type?.toLowerCase() == "sublimation") printTypeAbbr = "SUB";
    if (item?.type && item?.type?.toLowerCase() == "embroidery") printTypeAbbr = "EMB";

    let labelString = `^XA
        ^FO50,80^BY2^BC,120,N,N,N,A^FD${item.pieceId}^FS
        ^LH6,6^CFS,30,6^AXN,22,30^FO15,30^FDPO#: ${
            item.order ? item.order.poNumber : "no order"
        }^FS
        ^LH6,6^CFS,30,6^AXN,22,30^FO15,60^FDPiece: ${item.pieceId}^FS
        ^LH12,18^CFS,25,12^AXN,22,30^FO20,330^FD#${i + 1}^FS
        ^LH12,18^CFS,25,12^AXN,75,90^FO120,250^FD${item.styleCode}^FS
        ^LH12,18^CFS,25,12^AXN,30,35^FO20,360^FDColor: ${
            item.colorName
        }, Size: ${item.sizeName}^FS
        ^LH12,18^CFS,25,12^AXN,22,30^FO20,400^FDVendor: ${
            item.vendor ? item.vendor : "TSP"
        }^FS
         ^LH12,18^CFS,25,12^AXN,22,30^FO20,430^FDShipping: ${item.shippingType}^FS
        ^LH12,18^CFS,25,12^AXN,22,30^FO20,480^FD PrintO Design: ${
            item.sku.split("-")[0]
        }^FS
        ^LH12,18^CFS,25,12^AXN,22,30^FO20,500^FDCNT: ${totalQuantity}^FS
        ${
            printTypeAbbr
            ? `^LH12,18^CFS,25,12^AXN,40,50^FO20,230^FD${printTypeAbbr}^FS`
            : ""
        }
        ${printPO}
        ${frontBackString}
    ^XZ`;
    //console.log(labelString)
    return labelString;
    
  }
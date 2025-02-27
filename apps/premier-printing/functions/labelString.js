import Items from "@/models/Items";
import Inventory from "@/models/inventory";
export const buildLabelData = async (item, i, opts={}) => {
    let totalQuantity = await Items.find({_id: { $in: item.order.items },canceled: false,}).countDocuments();
    let frontBackString;
    //console.log(totalQuantity, "TQ");
    let inventory = await Inventory.findOne({inventory_id: `${item.colorName[0].toUpperCase() + item.colorName.replace(item.colorName[0], "")}-${item.sizeName}-${item.styleCode}`}).select(" bin row shelf unit").lean()
    console.log(inventory, "inventory", `${item.colorName[0].toUpperCase() + item.colorName.replace(item.colorName[0], "")}-${item.sizeName}-${item.styleCode}`)
    if (item.design?.back) {
      if (item.design?.front && item.design.back) {
        frontBackString = `^LH12,18^CFS,25,12^AXN,40,50^FO100,350^FDFRONT&BACK^FS`;
      } else {
        frontBackString = `^LH12,18^CFS,25,12^AXN,40,50^FO100,350^FDBACK ONLY^FS`;
      }
    }else if(item.design?.pocket){
      if (item.design.pocket && item.design.back) {
        frontBackString = `^LH12,18^CFS,25,12^AXN,40,50^FO100,350^FDPOCKET&BACK^FS`;
      }else{
        frontBackString = `^LH12,18^CFS,25,12^AXN,40,50^FO100,350^FDPOCKET^FS`;
      }
    } else frontBackString = "`^LH12,18^CFS,25,12^AXN,40,50^FO100,350^FDFRONT ONLY^FS`;";
    if(!item.design) frontBackString = "Missing Design";
    let printPO = opts.printPO ? `^LH12,18^CFS,25,12^AXN,22,30^FO150,540^FDPO:${opts.printPO}^FS`: "";
    let printTypeAbbr;
    if (item?.type && item?.type?.toLowerCase() == "dtf") printTypeAbbr = "DTF";
    if (item?.type && item?.type?.toLowerCase() == "gift") printTypeAbbr = "GIFT";
    if (item?.type && item?.type?.toLowerCase() == "sublimation") printTypeAbbr = "SUB";
    if (item?.type && item?.type?.toLowerCase() == "embroidery") printTypeAbbr = "EMB";

    let labelString = `^XA
        ^FO50,50^BY2^BC,100,N,N,N,A^FD${item.pieceId}^FS
        ^LH6,6^CFS,30,6^AXN,22,30^FO10,15^FDPO#: ${
            item.order ? item.order.poNumber : "no order"
        } Piece: ${item.pieceId}^FS
        ^LH12,18^CFS,25,12^AXN,22,30^FO10,175^FD#${i + 1}^FS
        ^LH12,18^CFS,25,12^AXN,75,90^FO175,175^FD${item.styleCode}^FS
        ^LH12,18^CFS,25,12^AXN,22,30^FO320,100^FDAisle:${inventory.row}^FS
        ^LH12,18^CFS,25,12^AXN,22,30^FO320,130^FDUnit:${inventory.unit}^FS
        ^LH12,18^CFS,25,12^AXN,22,30^FO320,160^FDShelf:${inventory.shelf}^FS
        ^LH12,18^CFS,25,12^AXN,22,30^FO320,190^FDBin:${inventory.bin}^FS
        ^LH12,18^CFS,25,12^AXN,30,35^FO10,230^FDColor: ${
            item.colorName
        }, Size: ${item.sizeName}^FS
        ^LH12,18^CFS,25,12^AXN,22,30^FO10,260^FDShipping: ${item.shippingType}^FS
        ^LH12,18^CFS,25,12^AXN,22,30^FO10,290^FD Sku: ${
            item.sku.split("-")[0]
        }^FSCNT: ${totalQuantity}
        ^LH12,18^CFS,25,12^AXN,22,30^FO10,320^FD CNT: ${totalQuantity}^FS
        ${
            printTypeAbbr
            ? `^LH12,18^CFS,25,12^AXN,40,50^FO10,350^FD${printTypeAbbr}^FS`
            : ""
        }
        ${printPO}
        ${frontBackString}
    ^XZ`;
    //console.log(labelString)
    return labelString;
    
  }
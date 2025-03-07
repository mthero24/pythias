import Items from "@/models/Items";
import Inventory from "@/models/inventory";
import Design from "@/models/Design";
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
    if (item.designRef && item.designRef.sku && item.designRef.sku.includes("PU")) printTypeAbbr = "PUF";
    if (item.designRef && item.designRef.sku && item.designRef.sku.includes("EMB")) printTypeAbbr = "EMB";
    else printTypeAbbr = "DTF";

    let labelString = `
      ${item.order.marketplace == "target"? `^XA
        ^FO100,50^BY2^BC,100,N,N,N,A^FD${item.upc? item.upc: "no upc present"}^FS
        ^LH6,6^CFS,30,6^AXN,22,30^FO10,15^FDPiece: ${item.pieceId}^FS
        ^LH12,18^CFS,25,12^AXN,22,30^FO10,175^FD#1^FS
        ^LH12,18^CFS,25,12^AXN,30,35^FO10,230^FDColor: ${
            item.colorName
        }, Size: ${item.sizeName}^FS
        ^LH12,18^CFS,25,12^AXN,22,30^FO10,290^FD Sku: ${
            item.designRef && item.designRef.sku? item.designRef.sku: item.sku
        }^FS
    ^XZ` : ""}
      ^XA
        ^FO50,50^BY2^BC,100,N,N,N,A^FD${item.pieceId}^FS
        ^LH6,6^CFS,30,6^AXN,22,30^FO10,15^FDPO#: ${
            item.order ? item.order.poNumber : "no order"
        } Piece: ${item.pieceId}^FS
        ^LH12,18^CFS,25,12^AXN,22,30^FO10,175^FD#${i + 1}^FS
        ^LH12,18^CFS,25,12^AXN,75,90^FO100,175^FD${item.styleCode}^FS
        ^LH12,18^CFS,25,12^AXN,22,30^FO320,70^FDDate:${new Date(item.date).toLocaleDateString("En-us")}^FS
        ^LH12,18^CFS,25,12^AXN,22,30^FO320,100^FDAisle:${inventory?.row}^FS
        ^LH12,18^CFS,25,12^AXN,22,30^FO320,130^FDUnit:${inventory?.unit}^FS
        ^LH12,18^CFS,25,12^AXN,22,30^FO320,160^FDShelf:${inventory?.shelf}^FS
        ^LH12,18^CFS,25,12^AXN,22,30^FO320,190^FDBin:${inventory?.bin}^FS
        ^LH12,18^CFS,25,12^AXN,30,35^FO10,230^FDColor: ${
            item.colorName
        }, Size: ${item.sizeName}^FS
        ^LH12,18^CFS,25,12^AXN,22,30^FO10,260^FDShipping: ${item.shippingType} CNT: ${totalQuantity}^FS
        ^LH12,18^CFS,25,12^AXN,22,30^FO10,290^FD Sku: ${
            item.designRef && item.designRef.sku? item.designRef.sku: item.sku
        }^FS
        ^LH12,18^CFS,25,12^AXN,22,30^FO10,320^FD Title: ${
            item.designRef && item.designRef.name? item.designRef.name: item.sku
        }^FS
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
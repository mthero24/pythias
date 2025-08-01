import Items from "@/models/Items";
import Inventory from "@/models/inventory";
import ReturnBins from "@/models/returnBins"
import Design from "@/models/Design";

export const buildLabelData = async (item, i, returnBin, opts={},) => {
    let totalQuantity = await Items.find({_id: { $in: item.order.items },canceled: false,}).countDocuments();
    
    let frontBackString = "";
    //console.log(totalQuantity, "TQ");
    let inventory = await Inventory.findOne({blank: item.blank._id? item.blank._id: item.blank, color_name: item.color.name, size_name: item.sizeName})
    //console.log(inventory, "inventory", `${item.colorName[0].toUpperCase() + item.colorName.replace(item.colorName[0], "")}-${item.sizeName}-${item.styleCode}`)
    for(let loc of Object.keys(item.design)){
      if(item.design[loc]){
        frontBackString = `${frontBackString}${frontBackString != ""? "&": ""}${loc} ${Object.keys(item.design).length == 1? "Only": ""}`
      }
    }
    frontBackString = `^LH12,18^CFS,25,12^AXN,40,50^FO100,355^FD${frontBackString}^FS`;
    if(!item.design) frontBackString = "Missing Design";
    let printPO = opts.printPO ? `^LH12,18^CFS,25,12^AXN,22,30^FO150,540^FDPO:${opts.printPO}^FS`: "";
    let printTypeAbbr;
    if (item.designRef && item.designRef.sku && item.designRef.sku.includes("PU")) printTypeAbbr = "PUF";
    if (item.designRef && item.designRef.sku && item.designRef.sku.includes("EMB")) printTypeAbbr = "EMB";
    else printTypeAbbr = "DTF";

    let labelString = `
      ${item.order.marketplace == "target" || item.order.marketplace == "Target Plus US Marketplace"? `^XA
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
        ^FO50,55^BY2^BC,100,N,N,N,A^FD${item.pieceId}^FS
        ^LH6,6^CFS,30,6^AXN,22,30^FO10,15^FDPO#: ${
            item.order ? item.order.poNumber : "no order"
        }^FS
         ^LH6,6^CFS,30,6^AXN,22,30^FO10,35^FDPiece: ${item.pieceId}^FS
        ^LH12,18^CFS,25,12^AXN,22,30^FO10,175^FD#${i + 1}^FS
        ^LH12,18^CFS,25,12^AXN,75,90^FO100,175^FD${item.styleCode}^FS
        ^LH12,18^CFS,25,12^AXN,22,30^FO320,70^FD${new Date(item.date).toLocaleDateString("En-us")}^FS
        ${!returnBin?`^LH12,18^CFS,25,12^AXN,22,30^FO320,100^FDAisle:${inventory?.row}^FS
        ^LH12,18^CFS,25,12^AXN,22,30^FO320,130^FDUnit:${inventory?.unit}^FS
        ^LH12,18^CFS,25,12^AXN,22,30^FO320,160^FDShelf:${inventory?.shelf}^FS
        ^LH12,18^CFS,25,12^AXN,22,30^FO320,190^FDBin:${inventory?.bin}^FS`: `LH12,18^CFS,25,12^AXN,22,30^FO320,100^FDR Bin${returnBin.number}^FS`}
        ^LH12,18^CFS,25,12^AXN,30,35^FO10,230^FDColor: ${
            item.colorName
        }^FS
        ^LH12,18^CFS,25,12^AXN,22,30^FO10,260^FDSize: ${item.sizeName} Shipping: ${item.shippingType}^FS
        ^LH12,18^CFS,25,12^AXN,22,30^FO10,290^FD Sku: ${
            item.designRef && item.designRef.sku? item.designRef.sku: item.sku
        } CNT ${totalQuantity}^FS
        ^LH12,18^CFS,25,12^AXN,22,30^FO10,320^FD Title: ${
            item.designRef && item.designRef.name? item.designRef.name: item.sku
        }^FS
        ${
          `^LH12,18^CFS,25,12^AXN,40,50^FO10,355^FD${printTypeAbbr}^FS`
        }
        ${printPO}
        ${frontBackString}
    ^XZ`;
    //console.log(labelString)
    return labelString;
    
  }
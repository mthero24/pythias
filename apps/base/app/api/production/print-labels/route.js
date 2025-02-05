import { NextApiRequest, NextResponse } from "next/server";
import Items from "../../../../models/Items";
import Order from "../../../../models/Order";
import Inventory from "../../../../models/inventory";
import Batches from "../../../../models/batches";
import btoa from "btoa";
import axios from "axios";
let letters = ["a", "b", "c", "d","e","f","g","h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "A", "B", "C", "D", "E", "F", "G","H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9",];
export async function POST(req=NextApiRequest){
    let data = await req.json();
    let labels = ``
    //create batchId

    // build labels
    let preLabels = data.items.map(async (i, j)=>{
            let label = await buildLabelData(i, j)
            //console.log(label)
            labels += label
            return label
    })

    // full fill promises
    preLabels = await Promise.all(preLabels);
    
    //create label string
    preLabels.map(l=>{labels += l})
    
    //convert to base64
    labels = btoa(labels)
   
    //print labels
    let res = axios.post(`/${process.evn.localIP}/print-label`, {label: labels})

    //update data
    
    return NextResponse.json({error: false})
}

const buildLabelData = async (item, i, opts={}) => {
    let totalQuantity = await Items.find({_id: { $in: item.order.items },canceled: false,}).countDocuments();
    let frontBackString;
    //console.log(totalQuantity, "TQ");
    if (item.design.back) {
      if (item.design?.front && item.design.back) {
        frontBackString = `^LH12,18^CFS,25,12^AXN,80,50^FO200,540^FDFRONT&BACK^FS`;
      } else {
        frontBackString = `^LH12,18^CFS,25,12^AXN,80,50^FO200,540^FDBACK ONLY^FS`;
      }
    } else frontBackString = "";
    let printPO = opts.printPO ? `^LH12,18^CFS,25,12^AXN,45,30^FO150,540^FDPO:${opts.printPO}^FS`: "";
    let printTypeAbbr;
    if (item?.type && item?.type?.toLowerCase() == "dtf") printTypeAbbr = "DTF";
    if (item?.type && item?.type?.toLowerCase() == "gift") printTypeAbbr = "GIFT";
    if (item?.type && item?.type?.toLowerCase() == "sublimation") printTypeAbbr = "SUB";
    if (item?.type && item?.type?.toLowerCase() == "embroidery") printTypeAbbr = "EMB";

    let labelString = `^XA
        ^FO150,100^BY2^BC,100,N,N,N,A^FD${item.pieceId}^FS
        ^LH6,6^CFS,60,12^AXN,45,30^FO20,50^FDPO#: ${
            item.order ? item.order.poNumber : "no order"
        } Piece: ${item.pieceId}^FS
        ^LH12,18^CFS,25,12^AXN,45,30^FO20,330^FD#${i}^FS
        ^LH12,18^CFS,25,12^AXN,150,90^FO250,230^FD${item.styleCode}^FS
        ^LH12,18^CFS,25,12^AXN,60,35^FO20,360^FDColor: ${
            item.colorName
        }, Size: ${item.sizeName}^FS
        ^LH12,18^CFS,25,12^AXN,45,30^FO20,430^FDVendor: ${
            item.vendor ? item.vendor : "TSP"
        }, Shipping: ${item.shippingType}^FS
        ^LH12,18^CFS,25,12^AXN,45,30^FO20,480^FD PrintO Design: ${
            item.sku.split("-")[0]
        } CNT: ${totalQuantity}^FS
        ${
            printTypeAbbr
            ? `^LH12,18^CFS,25,12^AXN,80,50^FO20,230^FD${printTypeAbbr}^FS`
            : ""
        }
        ${printPO}
        ${frontBackString}
    ^XZ`;
    //console.log(labelString)
    return labelString;
    
  }
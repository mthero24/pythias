import SkuToUpc from "@/models/skuUpcConversion";
import Design from "@/models/Design";
import Item from "@/models/Items";
import Blank from "@/models/Blanks";
import Color from "@/models/Color";
import Order from "@/models/Order";
import skus from "./rest.json";
import t2n from "./t2n.json";
import fs from "fs"
import axios from "axios"
import btoa from "btoa"
import {getRates}from "@pythias/shipping"
import { getOrders, generatePieceID } from "@pythias/integrations";
import {buyLabels} from "@pythias/shipping";
export default async function Test(){
    // let rates = await getRates({
    //     address: {
    //         name: "michael thero",
    //         address: "1421 hidden view dr",
    //         city: "lapeer",
    //         state: "MI",
    //         country: "US",
    //         zip: "48446"
    //     },
    //     businessAddress:  {
    //         name: "Premier Printing",
    //         address: "2901 14th N",
    //         city: "Ammon",
    //         state: "ID",
    //         country: "US",
    //         zip: "83401"
    //     },
    //     type: "Standard",
    //     providers: ["endicia", "ups"],
    //     weight: 10,
    //     dimensions: {height: .5, width: 8, length: 8},
    //     enSettings: {
    //     requesterID: process.env.endiciaRequesterID,
    //     accountNumber: process.env.endiciaAccountNUmber,
    //     passPhrase: process.env.endiciaPassPhrase,
    //     },
    //     credentialsUPS: {
    //     accountNumber: process.env.upsAccountNumber,
    //     clientID: process.env.upsClientID,
    //     clientSecret: process.env.upsClientSecret,
    //     },
    // });
    // console.log(rates)
    // let rates = await getRates({
    //     address: {
    //         name: "michael thero",
    //         address1: "1421 hidden view dr",
    //         city: "lapeer",
    //         state: "MI",
    //         country: "US",
    //         zip: "48446"
    //     },
    //     weight: 10,
    //     type: "Expedited",
    //     selectedShipping: {provider: "usps", name: "GroundAdvantage",},
    //     businessAddress: JSON.parse(process.env.businessAddress),
    //     providers: ["shipstation", "ups"],
    //     enSettings: {
    //     requesterID: process.env.endiciaRequesterID,
    //     accountNumber: process.env.endiciaAccountNUmber,
    //     passPhrase: process.env.endiciaPassPhrase,
    //     },
    //     credentials: {
    //         clientId: process.env.uspsClientId,
    //         clientSecret: process.env.uspsClientSecret,
    //         crid: process.env.uspsCRID,
    //         mid: process.env.uspsMID,
    //         manifestMID: process.env.manifestMID,
    //         accountNumber: process.env.accountNumber
    //     },
    //     credentialsFedEx: {
    //         accountNumber: process.env.tpalfedexaccountnumber,
    //         meterNumber: process.env.tpalfedexmeternumber,
    //         key: process.env.tpalfedexkey,
    //         password: process.env.tpalfedexpassword,
    //     },
    //     credentialsFedExNew: {
    //         accountNumber: process.env.AccountFedExTest,
    //         key: process.env.ApiKeyTestFedEx,
    //         secret: process.env.SecretKeyFedExTest,
    //     },
    //     credentialsUPS: {
    //         accountNumber: process.env.UPSAccountNumber,
    //         clientID: process.env.UPSClientID,
    //         clientSecret: process.env.UPSClientSecret,
    //     },
    //     upsThirdParty:  process.env.upsZulily,
    //     imageFormat: "PDF",
    //     credentialsShipStation: {
    //         apiKey: `SEBwOjXwy9XE01lg+UWRuCMKeq/4uWOMBPHV7pWTtjQ`
    //     },
    //     dimensions:{
    //         width: 8,
    //         length: 8,
    //         height: .5
    //     }
    // })
    // console.log(rates)
    // let label = await buyLabel({
    //     address: {
    //         name: "michael thero",
    //         address1: "1421 hidden view dr",
    //         city: "lapeer",
    //         state: "MI",
    //         country: "US",
    //         zip: "48446"
    //     },
    //     weight: 10,
    //     selectedShipping: {provider: "usps", name: "GroundAdvantage",},
    //     businessAddress: JSON.parse(process.env.businessAddress),
    //     providers: ["shipstation", "ups"],
    //     enSettings: {
    //     requesterID: process.env.endiciaRequesterID,
    //     accountNumber: process.env.endiciaAccountNUmber,
    //     passPhrase: process.env.endiciaPassPhrase,
    //     },
    //     credentials: {
    //         clientId: process.env.uspsClientId,
    //         clientSecret: process.env.uspsClientSecret,
    //         crid: process.env.uspsCRID,
    //         mid: process.env.uspsMID,
    //         manifestMID: process.env.manifestMID,
    //         accountNumber: process.env.accountNumber
    //     },
    //     credentialsFedEx: {
    //         accountNumber: process.env.tpalfedexaccountnumber,
    //         meterNumber: process.env.tpalfedexmeternumber,
    //         key: process.env.tpalfedexkey,
    //         password: process.env.tpalfedexpassword,
    //     },
    //     credentialsFedExNew: {
    //         accountNumber: process.env.AccountFedExTest,
    //         key: process.env.ApiKeyTestFedEx,
    //         secret: process.env.SecretKeyFedExTest,
    //     },
    //     credentialsUPS: {
    //         accountNumber: process.env.UPSAccountNumber,
    //         clientID: process.env.UPSClientID,
    //         clientSecret: process.env.UPSClientSecret,
    //     },
    //     upsThirdParty:  process.env.upsZulily,
    //     imageFormat: "PDF",
    //     credentialsShipStation: {
    //         apiKey: `SEBwOjXwy9XE01lg+UWRuCMKeq/4uWOMBPHV7pWTtjQ`
    //     },
    //     dimensions:{
    //         width: 8,
    //         length: 8,
    //         height: .5
    //     }
    // });
    // console.log(label)
    // let item = await Item.findOne({upc: {$ne: null}})
    // //console.log(item)
    // let labelString = `^XA
    //     ^FO100,50^BY2^BC,100,N,N,N,A^FD${item.upc}^FS
    //     ^LH6,6^CFS,30,6^AXN,22,30^FO10,15^FDPiece: ${item.pieceId}^FS
    //     ^LH12,18^CFS,25,12^AXN,22,30^FO10,175^FD#1^FS
    //     ^LH12,18^CFS,25,12^AXN,30,35^FO10,230^FDColor: ${
    //         item.colorName
    //     }, Size: ${item.sizeName}^FS
    //     ^LH12,18^CFS,25,12^AXN,22,30^FO10,290^FD Sku: ${
    //         item.designRef && item.designRef.sku? item.designRef.sku: item.sku
    //     }^FS
    // ^XZ`;
    // labelString = btoa(labelString)
    // console.log(labelString)
    // if(label.label){
        // let headers = {
        //     headers: {
        //         "Content-Type": "application/json",
        //         "Authorization": `Bearer $2a$10$Z7IGcOqlki/aMY.SxBz6/.vj3toNJ39/TGh0YunAAUHh3dkWy1ZUW`
        //     }
        // }
        // let res = await axios.post(`http://${process.env.localIP}/api/shipping/cpu`, {label: label.label, station: "station1", barcode: "jjj"}, headers)
        // console.log(res.data, "res.data")
    // }
    // let somePDF = await fs.readFileSync("./app/test/some2.pdf")
    // somePDF = btoa(somePDF)
    // console.log(somePDF)
    //let res = await axios.post("http://localhost:3500/print-shipping", {barcode: "here", label: label.label,  station: "station2"}, headers ).catch(e=>{console.log(e)})
    //console.log(res?.data)


    
    // let items = await Item.find({status: "shipped", labelPrinted: false})
    // console.log(items.length)
    // for(let i of items){
    //     i.labelPrinted = true;
    //     await i.save()
    // }
    // let headers = {
    //     headers: {
    //         "Content-Type": "application/json",
    //         "Authorization": `Bearer $2a$10$Z7IGcOqlki/aMY.SxBz6/.vj3toNJ39/TGh0YunAAUHh3dkWy1ZUW`
    //     }
    // }
    // let headers = {
    //     headers: {
    //         "Content-Type": "application/json",
    //         "api-key": `SEBwOjXwy9XE01lg+UWRuCMKeq/4uWOMBPHV7pWTtjQ`
    //     }
    // }
    // // // let res = await axios.get(`http://${process.env.localIP}/api/shipping/scales?station=station2`, headers)
    // // // console.log(res.data)
    let orders = await getOrders({auth: `${process.env.ssApiKey}:${process.env.ssApiSecret}`})
    // // console.log(orders[orders.length - 4])
    // let res = await axios.get(`https://api.shipstation.com/v2/shipments?page=1&page_size=10&sort_dir=desc&sort_by=created_at`, headers).catch(e=> {console.log(e)})
    // console.log(res?.data)
    // console.log(new Date(orders[orders.length -1].orderDate).toLocaleDateString("En-us"))
    // for(let o of orders){
    //     try{
    //         let order = await Order.findOne({orderId: o.orderId}).populate("items")
    //         if(!order){
    //             let marketplace = o.orderNumber.toLowerCase().includes("cs")? "customer service entry": o.advancedOptions.source? o.advancedOptions.source: o.billTo.name
    //             order = new Order({orderId: o.orderId, poNumber: o.orderNumber, orderKey: o.orderKey, date: o.orderDate, status: o.orderStatus,
    //                 uniquePo: `${o.orderNumber}-${o.orderId}-${o.advancedOptions.source? o.advancedOptions.source: o.billTo.name}`,
    //                 shippingAddress: {
    //                     name: o.shipTo.name,
    //                     address1: o.shipTo.street1,
    //                     address2: o.shipTo.street2,
    //                     city: o.shipTo.city,
    //                     zip: o.shipTo.postalCode,
    //                     state: o.shipTo.state,
    //                     country: o.shipTo.country
    //                 },
    //                 shippingType: marketplace == "faire" || marketplace == "TSC" || marketplace == "zulily"? "Expedited": "Standard",
    //                 marketplace: marketplace,
    //                 total: o.orderTotal,
    //                 paid: true
    //             })
    //             let items = []
    //             for(let i of o.items){
    //                 if(i.sku != ""){
    //                     let sku
    //                     if(i.upc){
    //                         sku = await SkuToUpc.findOne({upc: i.upc})
    //                     }
    //                     if(!sku) sku = await SkuToUpc.findOne({sku: i.sku})
    //                     for(let j = 0; j < parseInt(i.quantity); j++){
    //                         let design
    //                         let blank
    //                         let color
    //                         let size
    //                         if(sku) {
    //                             design = await Design.findOne({_id: sku.design})
    //                             blank = await Blank.findOne({_id: sku.blank})
    //                             color = await Color.findOne({_id: sku.color})
    //                             size = blank?.sizes?.filter(s=> s.name.toLowerCase() == sku.size?.toLowerCase())[0]   
    //                         }else{
    //                             blank = await Blank.findOne({code: i.sku.split("_")[0]})
    //                             color = await Color.findOne({name: i.sku.split("_")[1]})
    //                             if(!color) await Color.findOne({name: i.sku.split("_")[2]})
    //                             if(blank){
    //                                 size = blank.sizes?.filter(s=> s.name.toLowerCase() == i.sku.split("_")[2]?.toLowerCase())[0] 
    //                                 if(!size) size = blank.sizes?.filter(s=> s.name.toLowerCase() == i.sku.split("_")[1]?.toLowerCase())[0]
    //                             }
    //                             let dSku = i.sku.split("_").splice(3)
    //                             let designSku =""
    //                             for(let j = 0; j < dSku.length; j++){
    //                                 if(j == 0) designSku = dSku[j]
    //                                 else designSku = `${designSku}_${dSku[j]}`
    //                             }
    //                             design = await Design.findOne({sku: designSku})
    //                         }
    //                         let item = new Item({pieceId: await generatePieceID(), paid: true, sku: i.sku, upc: i.upc, orderItemId: i.orderItemId, blank, styleCode: blank?.code, sizeName: size?.name, colorName: color?.name, color, size, design: design?.images, designRef: design, order: order._id, shippingType: order.shippingType, quantity: 1, status: order.status, name: i.name})
    //                         //console.log(item)
    //                         await item.save()
    //                         items.push(item)
    //                     }
    //                 }
    //                 //console.log(items)
    //             }
    //             order.items = items
    //         }else{
              
    //                 order.status = o.orderStatus
    //                 if(order.status == "shipped"){
    //                     order.items.map(async i=>{
    //                         i.status = order.status;
    //                         i.labelPrinted = true;
    //                         await i.save()
    //                     })
    //                 }
    //         }
    //         //console.log(order)
    //         await order.save()
    //     }catch(e){
    //         console.log(e)
    //     }
    //     //save order
    // }
    // console.log(skusFound, skusNotFOund)
    return <h1>test</h1>
}
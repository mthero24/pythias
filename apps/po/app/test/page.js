import Items from "@/models/Items"
import Styles from "@/models/StyleV2"
import fs from "fs";
//const createCsvWriter = require('csv-writer').createObjectCsvWriter;
import {getRates} from "@pythias/shipping";
import {getRatesFeNew, purchaseFedexNew} from "@pythias/shipping";
export default async function POST(req= NextApiRequest){
//    let address ={
//     name: "Michael Thero",
//     address1: "1421 hidden view dr",
//     address2: "",
//     city: "lapeer",
//     state: "MI",
//     zip: "48446",
//     country: "US"
//    }
//    let businessAddress =JSON.parse(process.env.businessAddress) 
//    let weight = 1 
//    let service = "PRESORTED_STANDARD"
//    let serviceType = "GROUND_HOME_DELIVERY"
//    let packaging = "YOUR_PACKAGING"
//    let overnight = false
//    let saturdayDelivery=false 
//    console.log({accountNumber: process.env.AccountFedExTest,
//         key: process.env.ApiKeyTestFedEx,
//         secret: process.env.SecretKeyFedExTest,})
//    let credentials = {
//         accountNumber: process.env.AccountFedExTest,
//         key: process.env.ApiKeyTestFedEx,
//         secret: process.env.SecretKeyFedExTest,
//     }
//     console.log(credentials, "page")
//     let res = await getRatesFeNew({address, businessAddress, weight, service, serviceType, packaging, overnight, saturdayDelivery, credentials})
//     console.log(res)
//     let res2 = await purchaseFedexNew({address, businessAddress, weight, service, serviceType, packaging, overnight, saturdayDelivery, credentials})
//     console.log(res2)
    // let items = await Items.find({date: {$gt: new Date("2024-04-17")}, canceled: false, styleCode: {$ne: null}}).limit(100000)
    // console.log(items.length, " How Many Items")
    // let breakdown = {}
    // let skip = 100000
    // while(items.length > 0){
    //     for(let i of items){
    //         if(!breakdown[i.styleCode]) breakdown[i.styleCode] = 0
    //         breakdown[i.styleCode]++
    //     }
    //     items = await Items.find({date: {$gt: new Date("2024-04-17")}, canceled: false, styleCode: {$ne: null}}).skip(skip).limit(100000)
    //     skip += 100000
    //     console.log(skip)
    // }
    // console.log(breakdown)
    // for(let style of styles){
    //     if(!breakdown[style.code]) breakdown[style.code] = 0
    // }
    // let sets = []
    // for(let style of Object.keys(breakdown)){
    //     console.log(style, "style")
    //     sets.push({style: style, sold: breakdown[style]})
    // }
    // console.log(sets)
    // let targetHeader = [
    //     {id: "style", title: "Style Code"},
    //     {id: "sold", title: "Amount Sold"},
    // ]
    // const csvWriter = createCsvWriter({
    //     path: `.items-sold.csv`,
    //     header: targetHeader,
    // });
    // //console.log(products)
    // //console.log("product", products.length)
    //await csvWriter.writeRecords([...sets])
    // let rates = await getRates({
    //     address: {
    //         name: "michael thero",
    //         address1: "1421 hidden view dr",
    //         city: "lapeer",
    //         state: "MI",
    //         zip: "48446",
    //         country: "US"
    //     },
    //     businessAddress: JSON.parse(process.env.businessAddress),
    //     type: "Standard",
    //     providers: ["usps", "fedex"],
    //     weight: 7.9,
    //     dimensions: {width: 8, height: 1, length: 10 },
    //     enSettings: {
    //     requesterID: process.env.endiciaRequesterID,
    //     accountNumber: process.env.endiciaAccountNUmber,
    //     passPhrase: process.env.endiciaPassPhrase,
    //     },
    //     credentials: {
    //     clientId: process.env.uspsClientId,
    //     clientSecret: process.env.uspsClientSecret,
    //     accountNumber: process.env.accountNumber
    //     },
    //     credentialsFedEx: {
    //     accountNumber: process.env.tpalfedexaccountnumber,
    //     meterNumber: process.env.tpalfedexmeternumber,
    //     key: process.env.tpalfedexkey,
    //     password: process.env.tpalfedexpassword,
    //     },
    //     credentialsFedExNew: {
    //     accountNumber: process.env.AccountFedExTest,
    //     key: process.env.ApiKeyTestFedEx,
    //     secret: process.env.SecretKeyFedExTest,
    //     },
    //     credentialsUPS: {
    //     accountNumber: process.env.UPSAccountNumber,
    //     clientID: process.env.UPSClientID,
    //     clientSecret: process.env.UPSClientSecret,
    //     },
    // });
    // console.log(rates)
    return <h1>Test</h1>
}
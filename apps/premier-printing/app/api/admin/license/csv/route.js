import { NextApiRequest, NextResponse } from "next/server";
import { createObjectCsvStringifier } from 'csv-writer';
import { LicenseHolders, Design, Items } from "@pythias/mongo";

export async function GET(req = NextApiRequest) {
    let { searchParams } = new URL(req.url);
    let from = searchParams.get("from")
    let to = searchParams.get("to")
    console.log(from, to, "from to")
    let range = {}
    if(from && to){
        range = { $gt: new Date(from), $lt: new Date(to) }
    }else if(from && !to){
        range = { $gt: new Date(from) }
    }else if(!from && to){
        range = { $lt: new Date(to) }
    }
    let licenses = await LicenseHolders.find().lean()
    let months = [{ number: 0, licenses: [] }, { number: 1, licenses: [] }, { number: 2, licenses: [] }, { number: 3, licenses: [] }, { number: 4, licenses: [] }, { number: 5, licenses: [] }, { number: 6, licenses: [] }, { number: 7, licenses: [] }, { number: 8, licenses: [] }, { number: 9, licenses: [] }, { number: 10, licenses: [] }, { number: 11, licenses: [] }]
    let itemsToSend = []
    for (let l of licenses) {
        console.log(l.name, "license")
        let designs = await Design.find({ licenseHolder: l._id }).select("_id").lean()
        //console.log(designs.length, "designs length")
        let items = await Items.find({ designRef: { $in: designs.map(d => d._id) }, date: range }).populate("order").lean()
        console.log(items.length, "items length")
        for (let i of items) {
            let item = {}
            item.license = l.name
            item.date = new Date(i.date).toLocaleDateString()
            item.itemSKU = i.sku
            item.itemName = i.name
            item.itemPrice = i.price? i.price : 0
            item.marketplace = i.order?.marketplace
            item.payment = (i.price ? i.price : 0) * (l.paymentType == "Percentage Per Unit" ? (l.amount / 100) : 1) + (l.paymentType == "Flat Per Unit" || l.paymentType == "One Time" ? l.amount : 0)
            itemsToSend.push(item)
        }
    }
    let newHeaders = [{ id: 'license', title: 'License Holder' },
    { id: 'date', title: 'Date Sold' },
    { id: 'itemSKU', title: 'Item SKU' }, { id: 'itemName', title: 'Item Name' },
    { id: 'itemPrice', title: 'Item Price' },
    { id: 'marketplace', title: 'Marketplace' },
    { id: 'payment', title: 'Payment Amount' }]
    const csvStringifier = createObjectCsvStringifier({
        header: newHeaders
    });
    const headerString = csvStringifier.getHeaderString();
    let csvString = await csvStringifier.stringifyRecords([...itemsToSend])
    csvString = `${csvStringifier.getHeaderString()}${csvString}`
    let buffer = new Buffer.from(csvString, "utf8")
    return new NextResponse(buffer, {
        headers: {
            'Content-Type': 'text/csv',
            "Access-Control-Allow-Origin": "*",
            'Content-Disposition': `attachment; filename="licence-sold-${new Date(Date.now()).toLocaleDateString("en-US")}-${new Date(Date.now()).getHours() % 12}:${new Date(Date.now()).getMinutes().length > 2 ? new Date(Date.now()).getMinutes() : `0${new Date(Date.now()).getMinutes()}`}${new Date(Date.now()).getHours() < 12 ? "AM" : "PM"}.csv"`
        }
    })
}
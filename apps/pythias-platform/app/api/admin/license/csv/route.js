import { NextResponse } from "next/server";
import { createObjectCsvStringifier } from "csv-writer";
import { PlatformLicenseHolder as LicenseHolders, PlatformDesign as Design, PlatformItem as Items } from "@pythias/mongo";
import { getToken } from "next-auth/jwt";

export async function GET(req) {
    const token = await getToken({ req });
    const orgId = token?.orgId;

    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    let range = {};
    if (from && to)       range = { $gt: new Date(from), $lt: new Date(to) };
    else if (from)        range = { $gt: new Date(from) };
    else if (to)          range = { $lt: new Date(to) };

    const licenses = await LicenseHolders.find({ orgId }).lean();
    const itemsToSend = [];

    for (let l of licenses) {
        const designs = await Design.find({ orgId, licenseHolder: l._id }).select("_id name").lean();
        const items = await Items.find({
            orgId,
            designRef: { $in: designs.map(d => d._id) },
            ...(Object.keys(range).length ? { date: range } : {}),
        }).populate({ path: "order", select: "poNumber marketplace" }).lean();

        for (let i of items) {
            itemsToSend.push({
                license: l.name,
                date: new Date(i.date).toLocaleDateString(),
                itemSKU: i.sku,
                itemName: i.name ?? designs.find(d => d._id.toString() === i.designRef?.toString())?.name,
                itemPrice: i.price ?? 0,
                marketplace: i.order?.marketplace,
                marketplaceOrderId: i.order?.poNumber,
                payment: (i.price ?? 0) * (l.paymentType === "Percentage Per Unit" ? (l.amount / 100) : 1)
                    + (l.paymentType === "Flat Per Unit" || l.paymentType === "One Time" ? l.amount : 0),
                pieceId: i.pieceId,
                status: i.status === "cancelled" ? "Canceled" : "",
            });
        }
    }

    const csvStringifier = createObjectCsvStringifier({
        header: [
            { id: "license",            title: "License Holder" },
            { id: "date",               title: "Date Sold" },
            { id: "itemSKU",            title: "Item SKU" },
            { id: "itemName",           title: "Item Name" },
            { id: "itemPrice",          title: "Item Price" },
            { id: "marketplace",        title: "Marketplace" },
            { id: "marketplaceOrderId", title: "Marketplace/Order ID" },
            { id: "payment",            title: "Payment Amount" },
            { id: "pieceId",            title: "Piece ID" },
            { id: "status",             title: "Canceled" },
        ],
    });

    const csvString = csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(itemsToSend);
    const buffer = Buffer.from(csvString, "utf8");
    const ts = new Date();
    const filename = `licence-sold-${ts.toLocaleDateString("en-US").replace(/\//g, "-")}.csv`;

    return new NextResponse(buffer, {
        headers: {
            "Content-Type": "text/csv",
            "Access-Control-Allow-Origin": "*",
            "Content-Disposition": `attachment; filename="${filename}"`,
        },
    });
}

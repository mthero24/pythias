import { NextResponse } from "next/server";
import { Inventory } from "@pythias/mongo";
import mongoose from "mongoose";

let tspConn = null;
let TspItems = null;

function getTspItems() {
    if (!TspItems) {
        tspConn = mongoose.createConnection(process.env.tspMongoURL);
        TspItems = tspConn.model("Item", new mongoose.Schema({}, { strict: false }), "items");
    }
    return TspItems;
}

export async function POST() {
    const Items = getTspItems();

    const [inStockCounts, attachedCounts, allInvs] = await Promise.all([
        Items.aggregate([
            { $match: { stockStatus: "inStock", canceled: false, shipped: false, paid: true, "inventory.inventory": { $exists: true, $ne: null } } },
            { $group: { _id: "$inventory.inventory", count: { $sum: 1 } } },
        ]),
        Items.aggregate([
            { $match: { stockStatus: "attached", canceled: false, paid: true, "inventory.inventory": { $exists: true, $ne: null } } },
            { $group: { _id: "$inventory.inventory", count: { $sum: 1 } } },
        ]),
        Inventory.find({}, "_id").lean(),
    ]);

    const inStockMap = new Map(inStockCounts.map(r => [r._id.toString(), r.count]));
    const attachedMap = new Map(attachedCounts.map(r => [r._id.toString(), r.count]));

    const ops = allInvs.map(inv => ({
        updateOne: { filter: { _id: inv._id }, update: { $set: {
            allocated: inStockMap.get(inv._id.toString()) ?? 0,
            attachedCount: attachedMap.get(inv._id.toString()) ?? 0,
        } } },
    }));

    if (ops.length) await Inventory.bulkWrite(ops, { ordered: false });

    return NextResponse.json({ error: false, updated: ops.length });
}

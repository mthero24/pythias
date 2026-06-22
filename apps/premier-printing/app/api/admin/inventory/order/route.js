import {NextApiRequest, NextResponse} from "next/server"
import {Blank as Blanks, Item as Items, Inventory, InventoryOrders, Settings} from "@pythias/mongo";
import axios from "axios";
import { getToken } from "next-auth/jwt";
import { logActivity, logChange, userFromToken } from "@pythias/backend/server";
import { getProductInfoByStyleColorSize, preSubmitPO, submitPO, submitSSOrder } from "@pythias/inventory";

async function getSanmarCredentials() {
    const [cn, un, pw, conn] = await Promise.all([
        Settings.findOne({ key: "sanmar.customerNumber" }).lean(),
        Settings.findOne({ key: "sanmar.userName" }).lean(),
        Settings.findOne({ key: "sanmar.password" }).lean(),
        Settings.findOne({ key: "sanmar.connected" }).lean(),
    ]);
    if (conn?.value !== "true") return null;
    return { customerNumber: cn?.value, userName: un?.value, password: pw?.value };
}

async function getSSCredentials() {
    const [acc, key, conn] = await Promise.all([
        Settings.findOne({ key: "ssactivewear.accountNumber" }).lean(),
        Settings.findOne({ key: "ssactivewear.apiKey" }).lean(),
        Settings.findOne({ key: "ssactivewear.connected" }).lean(),
    ]);
    if (conn?.value !== "true") return null;
    return { accountNumber: acc?.value, apiKey: key?.value };
}

async function buildSanmarLineItems(sanmarItems, credentials) {
    const lineItems = [];
    for (const item of sanmarItems) {
        // Fetch inventoryKey + sizeIndex from product info
        const info = await getProductInfoByStyleColorSize(item.style, item.color, item.size, credentials);
        const product = info.products?.[0];
        lineItems.push({
            style:        item.style,
            color:        item.color,
            size:         item.size,
            inventoryKey: product?.INVENTORY_KEY || product?.inventoryKey || "",
            sizeIndex:    product?.SIZE_INDEX    || product?.sizeIndex    || "",
            qty:          item.qty,
            warehouse:    0, // auto-select closest warehouse
        });
    }
    return lineItems;
}

const recomputeForInventory = async (invId) => {
    const [inv, linkedItems, activeOrders] = await Promise.all([
        Inventory.findById(invId, "quantity").lean(),
        Items.find({ "inventory.inventory": invId, labelPrinted: false, canceled: false, shipped: false, paid: true })
            .select("_id stockStatus date").sort({ date: 1 }).lean(),
        InventoryOrders.find({ received: { $ne: true }, "locations.items.inventory": invId }, "locations").lean(),
    ]);
    if (!linkedItems.length) return;
    const quantity = Math.max(0, inv?.quantity ?? 0);
    let orderedCap = 0;
    for (const po of activeOrders) {
        for (const loc of po.locations ?? []) {
            if (loc.received) continue;
            for (const li of loc.items ?? []) {
                if (li.inventory?.toString() === invId.toString()) orderedCap += li.quantity ?? 0;
            }
        }
    }
    let slotsUsed = 0, orderedUsed = 0;
    const ops = [];
    for (const item of linkedItems) {
        let computed;
        if (slotsUsed < quantity)          { computed = "inStock";  slotsUsed++; }
        else if (orderedUsed < orderedCap) { computed = "ordered";  orderedUsed++; }
        else                               { computed = "attached"; }
        if (item.stockStatus !== computed)
            ops.push({ updateOne: { filter: { _id: item._id }, update: { $set: { stockStatus: computed } } } });
    }
    if (ops.length) await Items.bulkWrite(ops, { ordered: false });
};
export async function GET(){
    console.log("Fetching inventory orders");
    let orders = await InventoryOrders.find({received: false}).populate("locations.items.inventory")
    return NextResponse.json({error: false, orders})
}
export async function PUT(req=NextApiRequest){
    const token = await getToken({ req });
    const { userName, email } = userFromToken(token);
    let data = await req.json()
    //console.log(data)
    let printItems = []
    let order = await InventoryOrders.findById(data.id)
    if(order){
        let location = order.locations.filter(l=> l.name == data.location)[0]
        for (let i of location.items) {
            let itemsToPrint = []
            let inv = await Inventory.findById(i.inventory)
            if (!inv) continue;
            inv.quantity = inv.quantity + i.quantity
            inv.pending_quantity = inv.pending_quantity - i.quantity
            if (inv.orders) {
                let o = inv.orders.filter(o => o.order.toString() == order._id.toString())[0]
                let items = await Items.find({ _id: { $in: o?.items } }).populate("designRef inventory.inventory").sort({ _id: 1 })
                itemsToPrint.push(...items)
            }
            inv.orders = inv.orders.filter(o => o.order.toString() != order._id.toString())
            printItems.push(...itemsToPrint)
            await inv.save()
            recomputeForInventory(inv._id); // fire-and-forget
        }
        console.log(printItems.length)
        location.received = true
        if (order.locations.filter(l => l.received == false).length == 0) order.received = true
        order.markModified("locations received")
        await order.save()   // persist the receive BEFORE printing — a label-print failure must not lose it
        try {
            const printLabels = await axios.post("https://simplysage.pythiastechnologies.com/api/production/print-labels", { items: printItems, poNumber: order.poNumber })
            console.log(printLabels?.data)
        } catch (e) { console.error("[inventory/order receive] label print failed (receive saved):", e.message) }
        logActivity({ action: "inventory_order_receive", entity: "inventory_order", entityId: order._id, entityName: order.poNumber || "", userName, email, provider: "premierPrinting" });
    logChange({ entityType: "inventory_order", entityId: order._id, entityName: order.poNumber || "", action: "receive", userName, email, provider: "premierPrinting" });
    }
    let orders = await InventoryOrders.find({ received: { $in: [null, false] } }).populate("locations.items.inventory")
    return NextResponse.json({ error: false, orders })
}
export async function POST(req=NextApiRequest){
    const token = await getToken({ req });
    const { userName, email } = userFromToken(token);
    let data = await req.json()
    //console.log(data)
    console.log(data)
    let order = new InventoryOrders({vendor: data.order.company, poNumber: data.order.poNumber, dateOrdered: new Date(data.order.dateOrdered + "T12:00:00"), dateExpected: data.order.dateExpected? new Date(data.order.dateExpected + "T12:00:00"): null, locations: [], items: data.items})
    let locations = []
    for(let i of data.needsOrdered){
        if(!locations.includes(i.location)) locations.push(i.location)
    }
    for(let loc of locations){
        let items = []
        for (let i of data.needsOrdered) {
            if (i.location == loc && i.included) {
                items.push({
                    inventory: i.inv._id,
                    quantity: i.order
                })
                let inv = await Inventory.findById(i.inv._id)
                inv.pending_quantity += i.order
                let it = await Items.find({ _id: { $in: inv.attached } }).sort({ _id: 1 })
                if (it.length > i.order) {
                    it = it.slice(0, i.order)
                }
                if (!inv.orders) inv.orders = []
                inv.orders.push({
                    order: order._id,
                    quantity: i.order,
                    items: it.map(i => i._id)
                })
                inv.attached = inv.attached.filter(a => !it.map(i => i._id.toString()).includes(a.toString()))
                await inv.save()
            }
        }
        //console.log(items)
        if(items.length > 0){
            order.locations.push({
                name: loc,
                received: false,
                items
            })
        }
    }
    // ── SanMar auto-submission ──────────────────────────────────────────────
    // Collect all included items whose blank has a sanmarStyle set
    const sanmarCredentials = await getSanmarCredentials();
    if (sanmarCredentials) {
        const sanmarLineData = [];
        for (const i of data.needsOrdered) {
            if (!i.included) continue;
            const inv   = await Inventory.findById(i.inv._id).lean();
            const blank = await Blanks.findById(inv?.blank).select("sanmarStyle").lean();
            if (blank?.sanmarStyle) {
                sanmarLineData.push({
                    style: blank.sanmarStyle,
                    color: inv.color_name,
                    size:  inv.size_name,
                    qty:   i.order,
                });
            }
        }

        if (sanmarLineData.length > 0) {
            try {
                const shipToDoc = await Settings.findOne({ key: "sanmar.shipTo" }).lean();
                const shipTo    = shipToDoc?.value ? JSON.parse(shipToDoc.value) : { name: "Premier Printing", address1: "", city: "", state: "", zip: "", country: "US" };
                const lineItems = await buildSanmarLineItems(sanmarLineData, sanmarCredentials);

                // Validate first
                const preCheck = await preSubmitPO(data.order.poNumber, lineItems, shipTo, sanmarCredentials);
                if (!preCheck.error) {
                    const poResult = await submitPO(data.order.poNumber, lineItems, shipTo, sanmarCredentials);
                    order.submittedToSanmar = !poResult.error;
                    order.sanmarPONumber    = poResult.sanmarPONumber || "";
                    order.sanmarResponse    = poResult.message || "";
                } else {
                    order.sanmarResponse = `Pre-submit failed: ${preCheck.message}`;
                }
            } catch (err) {
                order.sanmarResponse = `Submission error: ${err.message}`;
                console.error("[SanMar submitPO]", err);
            }
        }
    }
    // ── S&S Activewear auto-submission ──────────────────────────────────────
    const ssCredentials = await getSSCredentials();
    if (ssCredentials) {
        const ssLineData = [];
        for (const i of data.needsOrdered) {
            if (!i.included) continue;
            const inv   = await Inventory.findById(i.inv._id).lean();
            const blank = await Blanks.findById(inv?.blank).select("ssActivewearStyle").lean();
            if (blank?.ssActivewearStyle) {
                // SS Activewear SKU format: StyleCode-ColorName-SizeName
                const sku = `${blank.ssActivewearStyle}-${inv.color_name}-${inv.size_name}`;
                ssLineData.push({ sku, qty: i.order });
            }
        }

        if (ssLineData.length > 0) {
            try {
                const shipToDoc = await Settings.findOne({ key: "ssactivewear.shipTo" }).lean();
                const shipTo    = shipToDoc?.value ? JSON.parse(shipToDoc.value) : { address: "", city: "", state: "", zip: "" };
                const result    = await submitSSOrder(data.order.poNumber, ssLineData, shipTo, ssCredentials);
                if (!order.sanmarResponse) order.sanmarResponse = "";
                order.sanmarResponse += result.error
                    ? `\nSS Activewear error: ${result.message}`
                    : `\nSS Activewear order(s): ${result.orderNumbers.join(", ")}`;
            } catch (err) {
                order.sanmarResponse = (order.sanmarResponse || "") + `\nSS Activewear error: ${err.message}`;
                console.error("[SS Activewear submitOrder]", err);
            }
        }
    }
    // ───────────────────────────────────────────────────────────────────────

    console.log(order)
    await order.save()
    logActivity({ action: "inventory_order_create", entity: "inventory_order", entityId: order._id, entityName: order.poNumber || "", userName, email, provider: "premierPrinting" });
    logChange({ entityType: "inventory_order", entityId: order._id, entityName: order.poNumber || "", action: "create", userName, email, provider: "premierPrinting" });
    let inventory = await Inventory.find({}).populate("color").select("color color_name pending_quantity size_name style_code blank quantity order_at_quantity quantity_to_order location")
    let blanks = await Blanks.find({}).populate("colors").select("code name colors sizes department")
    let combined = []
    for(let blank of blanks){
        blank.inventory = inventory.filter(i=> i.blank.toString() == blank._id.toString())
        combined.push({blank, inventories: blank.inventory})
    }
    return NextResponse.json({error: false, combined, items: []})
}
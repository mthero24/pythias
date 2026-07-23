import { NextResponse } from "next/server";
import { Inventory, Settings } from "@pythias/mongo";
import { buildShelfLabelZPL, SHELF_LABEL_TEMPLATE_DEFAULT } from "@pythias/backend/lib/labelConstants.js";
import { getShippingCreds } from "@/lib/getShippingCreds";
import { getToken } from "next-auth/jwt";
import { logActivity, userFromToken } from "@pythias/backend/server";
import axios from "axios";

async function loadShelfTemplate() {
    const doc = await Settings.findOne({ key: "shelfLabelTemplate" }).lean();
    return doc?.value ? { ...SHELF_LABEL_TEMPLATE_DEFAULT, ...JSON.parse(doc.value) } : { ...SHELF_LABEL_TEMPLATE_DEFAULT };
}

// POST { ids?: [inventoryId], all?: bool, row?: string, printer?: string }
// Prints a shelf/bin barcode label for each matching inventoryv2 record.
export async function POST(req) {
    try {
        const token = await getToken({ req });
        const { userName, email } = userFromToken(token);
        const { ids, all, row, printer } = await req.json();

        let filter;
        if (Array.isArray(ids) && ids.length) filter = { _id: { $in: ids } };
        else if (all)                         filter = { barcode_id: { $nin: [null, ""] } };
        else if (row != null && row !== "")   filter = { row: String(row), barcode_id: { $nin: [null, ""] } };
        else return NextResponse.json({ error: true, msg: "Provide ids, all, or row" }, { status: 400 });

        const recs = await Inventory.find(filter)
            .select("barcode_id row unit shelf bin sku color_name size_name style_code quantity")
            .sort({ row: 1, unit: 1, shelf: 1, bin: 1 })
            .lean();
        if (!recs.length) return NextResponse.json({ error: true, msg: "No inventory records found" });

        const tpl = await loadShelfTemplate();
        let labelsString = "";
        for (const r of recs) labelsString += buildShelfLabelZPL(r, tpl);
        const encoded = Buffer.from(labelsString, "utf8").toString("base64");

        const sc = await getShippingCreds();
        const headers = { headers: { "Content-Type": "application/json", Authorization: `Bearer ${sc.localKey}` } };
        await axios
            .post(`http://${sc.localIP}/api/print-labels`, { label: encoded, printer: printer ?? "printer1" }, headers)
            .catch(e => { console.error("[shelf-labels] printer error:", e.message); });

        logActivity({ action: "shelf_label_print", entity: "inventory", count: recs.length, userName, email });
        return NextResponse.json({ error: false, count: recs.length });
    } catch (e) {
        console.error("[shelf-labels] 500:", e);
        return NextResponse.json({ error: true, msg: e.message ?? String(e) }, { status: 500 });
    }
}

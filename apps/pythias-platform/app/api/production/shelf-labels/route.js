import { NextResponse } from "next/server";
import { Inventory, Settings } from "@pythias/mongo";
import { buildShelfLabelZPL, SHELF_LABEL_TEMPLATE_DEFAULT } from "@pythias/backend/lib/labelConstants.js";
import { getOrgCreds } from "@/lib/getOrgCreds";
import { getToken } from "next-auth/jwt";
import axios from "axios";

async function loadShelfTemplate() {
    const doc = await Settings.findOne({ key: "shelfLabelTemplate" }).lean();
    return doc?.value ? { ...SHELF_LABEL_TEMPLATE_DEFAULT, ...JSON.parse(doc.value) } : { ...SHELF_LABEL_TEMPLATE_DEFAULT };
}

// POST { ids?: [inventoryId], all?: bool, row?: string, printer?: string }
// Prints a shelf/bin barcode label for each matching inventoryv2 record (org-scoped).
export async function POST(req) {
    try {
        const token = await getToken({ req });
        const orgId = token?.orgId;
        if (!orgId) return NextResponse.json({ error: true, msg: "No org" }, { status: 401 });
        const { ids, all, row, printer } = await req.json();

        let filter;
        if (Array.isArray(ids) && ids.length) filter = { _id: { $in: ids }, orgId };
        else if (all)                         filter = { orgId, barcode_id: { $nin: [null, ""] } };
        else if (row != null && row !== "")   filter = { orgId, row: String(row), barcode_id: { $nin: [null, ""] } };
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

        const creds = await getOrgCreds(orgId);
        if (!creds?.localIP) return NextResponse.json({ error: true, msg: "No printer configured for this org" });
        const headers = { headers: { "Content-Type": "application/json", Authorization: `Bearer ${creds.localKey}` } };
        await axios
            .post(`http://${creds.localIP}/api/print-labels`, { label: encoded, printer: printer ?? "printer1" }, headers)
            .catch(e => { console.error("[shelf-labels] printer error:", e.message); });

        return NextResponse.json({ error: false, count: recs.length });
    } catch (e) {
        console.error("[shelf-labels] 500:", e);
        return NextResponse.json({ error: true, msg: e.message ?? String(e) }, { status: 500 });
    }
}

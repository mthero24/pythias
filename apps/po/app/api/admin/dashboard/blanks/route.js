import { NextResponse } from "next/server";
import Order from "@/models/Order";
import Items from "@/models/Items";
import StyleV2 from "@/models/StyleV2";

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const fromParam   = searchParams.get("from");
        const toParam     = searchParams.get("to");
        const marketplace = searchParams.get("marketplace");

        const since = fromParam ? new Date(fromParam + "T00:00:00") : (() => { const d = new Date(); d.setDate(d.getDate() - 30); return d; })();
        const until = toParam   ? new Date(toParam   + "T23:59:59") : new Date();
        const dateFilter = { $gte: since, $lte: until };

        const filter = { date: dateFilter, canceled: { $ne: true } };
        if (marketplace && marketplace !== "All") {
            const orderDocs = await Order.find({ date: dateFilter, marketplace }).select("_id").lean();
            filter.order = { $in: orderDocs.map(o => o._id) };
        }

        const rows = await Items.aggregate([
            { $match: filter },
            { $group: { _id: { styleCode: "$styleCode", colorName: "$colorName", sizeName: "$sizeName" }, qty: { $sum: 1 } } },
            { $project: { _id: 0, styleCode: "$_id.styleCode", colorName: "$_id.colorName", sizeName: "$_id.sizeName", qty: 1 } },
            { $sort: { qty: -1 } },
        ]);

        const styleCodes = [...new Set(rows.map(r => r.styleCode).filter(Boolean))];
        const styles = await StyleV2.find({ code: { $in: styleCodes } }).select("code sizes").lean();

        const costMap = {};
        for (const s of styles) { costMap[s.code] = {}; for (const sz of s.sizes ?? []) costMap[s.code][sz.name] = sz.wholesaleCost ?? 0; }

        const enriched = rows.map(r => ({ ...r, unitCost: costMap[r.styleCode]?.[r.sizeName] ?? 0, totalCogs: (costMap[r.styleCode]?.[r.sizeName] ?? 0) * r.qty }));

        return NextResponse.json({ blanks: enriched });
    } catch (e) {
        console.error("[dashboard/blanks] error:", e);
        return NextResponse.json({ error: true, msg: e.message, blanks: [] }, { status: 500 });
    }
}

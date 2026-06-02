import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { PlatformOrder, PlatformItem, PlatformBlank } from "@pythias/mongo";

export async function GET(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: true, msg: "Unauthorized" }, { status: 401 });
        const orgId = session.user.orgId;

        const { searchParams } = new URL(req.url);
        const fromParam   = searchParams.get("from");
        const toParam     = searchParams.get("to");
        const marketplace = searchParams.get("marketplace");

        const since = fromParam ? new Date(fromParam + "T00:00:00") : (() => { const d = new Date(); d.setDate(d.getDate() - 30); return d; })();
        const until = toParam   ? new Date(toParam   + "T23:59:59") : new Date();
        const dateFilter = { $gte: since, $lte: until };

        const filter = { orgId, date: dateFilter, cancelled: { $ne: true } };
        if (marketplace && marketplace !== "All") {
            const orderDocs = await PlatformOrder.find({ orgId, date: dateFilter, marketplace }).select("_id").lean();
            filter.order = { $in: orderDocs.map(o => o._id) };
        }

        const rows = await PlatformItem.aggregate([
            { $match: filter },
            { $group: { _id: { styleCode: "$styleCode", colorName: "$colorName", sizeName: "$sizeName" }, qty: { $sum: 1 } } },
            { $project: { _id: 0, styleCode: "$_id.styleCode", colorName: "$_id.colorName", sizeName: "$_id.sizeName", qty: 1 } },
            { $sort: { qty: -1 } },
        ]);

        const styleCodes = [...new Set(rows.map(r => r.styleCode).filter(Boolean))];
        const blanks = await PlatformBlank.find({ orgId, code: { $in: styleCodes } }).select("code sizes").lean();
        const costMap = {};
        for (const b of blanks) { costMap[b.code] = {}; for (const sz of b.sizes ?? []) costMap[b.code][sz.name] = sz.wholesaleCost ?? 0; }

        const enriched = rows.map(r => ({
            ...r,
            unitCost:  costMap[r.styleCode]?.[r.sizeName] ?? 0,
            totalCogs: (costMap[r.styleCode]?.[r.sizeName] ?? 0) * r.qty,
        }));

        return NextResponse.json({ blanks: enriched });
    } catch (e) {
        console.error("[reports/blanks]", e);
        return NextResponse.json({ error: true, msg: e.message, blanks: [] }, { status: 500 });
    }
}

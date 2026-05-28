import { NextResponse } from "next/server";
import Order from "@/models/Order";
import Items from "@/models/Items";
import StyleV2 from "@/models/StyleV2";
import { Design, LicenseHolders } from "@pythias/mongo";

const VALID_SORT_FIELDS = new Set(["date", "styleCode", "colorName", "sizeName", "price", "marketplace"]);

const MP_RATES = {
    amazon: 0.15, ebay: 0.13, etsy: 0.065, walmart: 0.15, target: 0.10,
    "target plus us marketplace": 0.10, faire: 0.25, tiktok: 0.08,
    "tik tok": 0.08, shopify: 0.02, kohls: 0.15, "kohl's": 0.15,
    acenda: 0.15, zulily: 0.20, tsc: 0.15,
};

async function addLicenceFees(items) {
    if (!items.length) return items.map(i => ({ ...i, licenceFee: 0 }));
    const designIds = [...new Set(items.map(i => i.designRef).filter(Boolean).map(String))];
    if (!designIds.length) return items.map(i => ({ ...i, licenceFee: 0 }));
    const designs = await Design.find({ _id: { $in: designIds }, licenseHolder: { $ne: null } }).select("_id licenseHolder").lean();
    if (!designs.length) return items.map(i => ({ ...i, licenceFee: 0 }));
    const holderIds = [...new Set(designs.map(d => d.licenseHolder).filter(Boolean).map(String))];
    const holders = await LicenseHolders.find({ _id: { $in: holderIds } }).lean();
    const holderMap = Object.fromEntries(holders.map(h => [String(h._id), h]));
    const designHolderMap = {};
    for (const d of designs) { if (d.licenseHolder) designHolderMap[String(d._id)] = holderMap[String(d.licenseHolder)]; }
    const styleCodes = [...new Set(items.map(i => i.styleCode).filter(Boolean))];
    const styles = styleCodes.length ? await StyleV2.find({ code: { $in: styleCodes } }).select("code sizes").lean() : [];
    const retailMap = {};
    for (const s of styles) { retailMap[s.code] = {}; for (const sz of s.sizes ?? []) retailMap[s.code][sz.name] = sz.retailPrice ?? 0; }
    return items.map(i => {
        const holder = i.designRef ? designHolderMap[String(i.designRef)] : null;
        if (!holder) return { ...i, licenceFee: 0 };
        const basePrice = i.price || retailMap[i.styleCode]?.[i.sizeName] || 0;
        const adjPrice = basePrice + (holder.additionalFees || 0);
        const fee = adjPrice * (holder.paymentType === "Percentage Per Unit" ? (holder.amount / 100) : 1)
            + (holder.paymentType === "Flat Per Unit" || holder.paymentType === "One Time" ? holder.amount : 0);
        return { ...i, licenceFee: fee || 0 };
    });
}

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const fromParam = searchParams.get("from");
        const toParam   = searchParams.get("to");
        const csvMode   = searchParams.get("csv") === "1";
        const page      = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
        const pageSize  = csvMode ? 20000 : Math.min(200, Math.max(10, parseInt(searchParams.get("pageSize") || "50", 10)));
        const sortField = VALID_SORT_FIELDS.has(searchParams.get("sort")) ? searchParams.get("sort") : "date";
        const sortDir   = searchParams.get("dir") === "asc" ? 1 : -1;

        const since = fromParam ? new Date(fromParam + "T00:00:00") : (() => { const d = new Date(); d.setDate(d.getDate() - 30); return d; })();
        const until = toParam   ? new Date(toParam   + "T23:59:59") : new Date();
        const dateFilter = { $gte: since, $lte: until };

        const filter = { date: dateFilter, canceled: { $ne: true } };

        const basePipeline = [
            { $match: filter },
            { $lookup: { from: Order.collection.name, localField: "order", foreignField: "_id", as: "_ord" } },
            { $addFields: { marketplace: { $ifNull: [{ $arrayElemAt: ["$_ord.marketplace", 0] }, "Unknown"] } } },
            { $project: { _ord: 0 } },
        ];

        const [rawItems, countAgg] = await Promise.all([
            Items.aggregate([
                ...basePipeline,
                { $sort: { [sortField]: sortDir, _id: 1 } },
                ...(csvMode ? [] : [{ $skip: (page - 1) * pageSize }]),
                { $limit: pageSize },
                { $project: { date: 1, styleCode: 1, sizeName: 1, colorName: 1, price: 1, designRef: 1, orderId: 1, poNumber: 1, marketplace: 1 } },
            ]),
            csvMode ? Promise.resolve([]) : Items.aggregate([...basePipeline, { $count: "total" }]),
        ]);
        const total = csvMode ? 0 : (countAgg[0]?.total ?? 0);

        const styleCodes = [...new Set(rawItems.map(i => i.styleCode).filter(Boolean))];
        const styles = styleCodes.length ? await StyleV2.find({ code: { $in: styleCodes } }).select("code sizes").lean() : [];
        const costMap = {};
        for (const s of styles) { costMap[s.code] = {}; for (const sz of s.sizes ?? []) costMap[s.code][sz.name] = sz.wholesaleCost ?? 0; }
        const itemsWithCogs = rawItems.map(i => ({ ...i, wholesaleCost: costMap[i.styleCode]?.[i.sizeName] ?? 0 }));

        const items = await addLicenceFees(itemsWithCogs);

        if (csvMode) {
            const esc = (v) => { const s = String(v ?? ""); return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s; };
            const headers = ["Date", "Channel", "Blank Code", "Size", "Color", "Price Sold", "Blank COGS", "Licence Fees", "Est. MP Fees", "Net"];
            const rows = items.map(i => {
                const mpFee = (i.price || 0) * (MP_RATES[(i.marketplace || "").toLowerCase()] ?? 0);
                const net = (i.price || 0) - (i.wholesaleCost || 0) - (i.licenceFee || 0) - mpFee;
                return [i.date ? new Date(i.date).toLocaleDateString() : "", i.marketplace || "", i.styleCode || "", i.sizeName || "", i.colorName || "", (i.price ?? 0).toFixed(2), (i.wholesaleCost ?? 0).toFixed(2), (i.licenceFee ?? 0).toFixed(2), mpFee.toFixed(2), net.toFixed(2)];
            });
            const csv = [headers, ...rows].map(r => r.map(esc).join(",")).join("\r\n");
            return new Response(csv, { headers: { "Content-Type": "text/csv", "Content-Disposition": `attachment; filename="cost-items.csv"` } });
        }

        return NextResponse.json({ items, total, page, pageSize, pages: Math.ceil(total / pageSize) });
    } catch (e) {
        console.error("[cost-items] error:", e);
        return NextResponse.json({ error: true, msg: e.message, items: [], total: 0, page: 1, pageSize: 50, pages: 0 }, { status: 500 });
    }
}

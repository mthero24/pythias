export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { PlatformItem } from "@pythias/mongo";
import { setConfig, createImage } from "@pythias/dtf";
import { getToken } from "next-auth/jwt";
import { getOrgCreds } from "@/lib/getOrgCreds";

// Same model as Premier: print size (inches) comes from the blank ENVELOPE for the item's size +
// location, NOT from a design SKU (custom "create your own" orders have no design SKU). Custom items
// carry a normalized placement (0–1) within the envelope → print the art at its REAL size.
const dtfSize = (envelope, item, key) => {
    const place = item?.personalization?.sides?.find((s) => s.location === key)?.place;
    const w = place?.wPct > 0 ? envelope.width * place.wPct : envelope.width;
    const h = place?.hPct > 0 ? envelope.height * place.hPct : envelope.height;
    return `${Math.round(w * 100) / 100}x${Math.round(h * 100) / 100}`;
};

export async function GET(req) {
    const token = await getToken({ req });
    if (!token?.orgId) return NextResponse.json({ error: true, msg: "Unauthorized" }, { status: 401 });

    const orgId = token.orgId;
    const creds = await getOrgCreds(orgId);
    setConfig({ internalIP: creds.localIP, apiKey: creds.localKey });

    const pieceID = req.nextUrl.searchParams.get("pieceID");
    if (!pieceID) return NextResponse.json({ error: true, msg: "pieceID required" });

    const item = await PlatformItem.findOne({ orgId, pieceId: pieceID })
        .populate("blank", "code sizes printLocations")
        .populate("designRef", "sku");

    if (!item) return NextResponse.json({ error: true, msg: "Item not found" });
    if (item.cancelled) return NextResponse.json({ error: true, msg: "Item Canceled" });

    item.printed = true;
    item.printedDate = new Date();
    item.status = "DTF Find";
    item.steps = item.steps ?? [];
    item.steps.push({ status: "DTF Find", date: new Date() });
    await item.save();

    return NextResponse.json({
        error: false,
        msg: "here is the design",
        pieceID: item.pieceId,
        styleCode: item.blank?.code,
        colorName: item.colorName,
        item: JSON.parse(JSON.stringify(item)),
        designSku: item.designRef?.sku,
        source: "PLATFORM",
    });
}

export async function POST(req) {
    const token = await getToken({ req });
    if (!token?.orgId) return NextResponse.json({ error: true, msg: "Unauthorized" }, { status: 401 });

    const orgId = token.orgId;
    const creds = await getOrgCreds(orgId);
    setConfig({ internalIP: creds.localIP, apiKey: creds.localKey });

    const data = await req.json();
    const item = await PlatformItem.findOne({ orgId, pieceId: data.pieceId?.toUpperCase().trim() })
        .populate("blank", "code envelopes sizes")
        .populate("designRef", "sku");

    if (!item) return NextResponse.json({ error: true, msg: "item not found" });
    if (item.cancelled) return NextResponse.json({ error: true, msg: "item canceled" });
    if (item.dtfScan) {
        item.dtfScan = false;
        await item.save();
        return NextResponse.json({ error: true, msg: "Item already Scanned Into DTF. Scan again to resend." });
    }

    item.dtfScan = true;
    // Print each designed location from the item's design map, sized to the envelope (+ placement).
    await Promise.all(Object.keys(item.design || {}).map(async (key) => {
        if (!key || !item.design[key]) return;
        const envelope = (item.blank?.envelopes || []).find(
            (e) => (e.size?.toString() === item.size?.toString() || e.sizeName === item.sizeName) && e.placement === key
        );
        if (!envelope) return;
        await createImage({
            url: item.design[key],
            pieceID: `${item.pieceId}-${key}`,
            horizontal: false,
            size: dtfSize(envelope, item, key),
            offset: envelope.vertoffset,
            style: item.blank.code,
            styleSize: item.sizeName,
            color: item.colorName,
            sku: item.sku ?? "",
            shouldFitDesign: null,
            printer: data.printer,
        });
    }));

    item.status = "DTF Load";
    item.steps = item.steps ?? [];
    item.steps.push({ status: "DTF Load", date: new Date() });
    await item.save();

    return NextResponse.json({
        error: false,
        msg: "added to queue",
        styleCode: item.blank?.code,
        colorName: item.colorName,
        item: JSON.parse(JSON.stringify(item)),
        designSku: item.designRef?.sku,
        source: "PLATFORM",
    });
}

export async function PUT(req) {
    const token = await getToken({ req });
    if (!token?.orgId) return NextResponse.json({ error: true, msg: "Unauthorized" }, { status: 401 });

    const orgId = token.orgId;
    const creds = await getOrgCreds(orgId);
    setConfig({ internalIP: creds.localIP, apiKey: creds.localKey });

    const data = await req.json();
    const items = await PlatformItem.find({
        orgId,
        design: { $ne: null },
        colorName: { $ne: null },
        sizeName: { $ne: null },
        labelPrinted: false,
        cancelled: false,
        paid: true,
    })
        .populate("designRef", "sku")
        .populate("blank", "code envelopes sizes");

    const chunks = Math.ceil(items.length / (data.printers?.length || 1));
    const send = (data.printers ?? ["printer1"]).map((printer, i) => ({
        printer,
        items: items.slice(i * chunks, i * chunks + chunks),
    }));

    const now = new Date();
    const bulkOps = [];

    await Promise.all(send.map(async ({ printer, items: printerItems }) => {
        await Promise.all(printerItems.map(async item => {
            if (!item || item.cancelled || item.dtfScan) return;
            await Promise.all(Object.keys(item.design || {}).map(async (key) => {
                if (!key || !item.design[key]) return;
                const envelope = (item.blank?.envelopes || []).find(
                    (e) => (e.size?.toString() === item.size?.toString() || e.sizeName === item.sizeName) && e.placement === key
                );
                if (!envelope) return;
                await createImage({
                    url: item.design[key],
                    pieceID: `${item.pieceId}-${key}`,
                    horizontal: false,
                    size: dtfSize(envelope, item, key),
                    offset: envelope.vertoffset,
                    style: item.blank.code,
                    styleSize: item.sizeName,
                    color: item.colorName,
                    sku: item.sku ?? "",
                    shouldFitDesign: null,
                    printer,
                });
            }));
            bulkOps.push({
                updateOne: {
                    filter: { _id: item._id, orgId },
                    update: { $set: { dtfScan: true, status: "DTF Load" }, $push: { steps: { status: "DTF Load", date: now } } },
                },
            });
        }));
    }));

    if (bulkOps.length) await PlatformItem.bulkWrite(bulkOps, { ordered: false });

    return NextResponse.json({ error: false, msg: `${bulkOps.length} sent to printers` });
}

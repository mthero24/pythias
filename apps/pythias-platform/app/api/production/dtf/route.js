export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { PlatformItem } from "@pythias/mongo";
import { setConfig, createImage } from "@pythias/dtf";
import { getToken } from "next-auth/jwt";
import { getOrgCreds } from "@/lib/getOrgCreds";

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
        .populate("blank", "code printLocations sizes")
        .populate("designRef", "sku images sublimationImages");

    if (!item) return NextResponse.json({ error: true, msg: "item not found" });
    if (item.cancelled) return NextResponse.json({ error: true, msg: "item canceled" });
    if (item.dtfScan) {
        item.dtfScan = false;
        await item.save();
        return NextResponse.json({ error: true, msg: "Item already Scanned Into DTF. Scan again to resend." });
    }

    item.dtfScan = true;
    const printLocations = item.blank?.printLocations ?? [];
    const designImages = item.designRef?.images ?? {};

    await Promise.all(
        printLocations.map(async loc => {
            const imageUrl = designImages[loc.code] ?? designImages[loc.name];
            if (!imageUrl) return;
            await createImage({
                url: imageUrl,
                pieceID: `${item.pieceId}-${loc.code ?? loc.name}`,
                horizontal: false,
                size: `${loc.width}x${loc.height}`,
                offset: 0,
                style: item.blank.code,
                styleSize: item.sizeName,
                color: item.colorName,
                sku: item.sku ?? "",
                shouldFitDesign: null,
                printer: data.printer,
            });
        }),
    );

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
        designRef: { $ne: null },
        colorName: { $ne: null },
        sizeName: { $ne: null },
        labelPrinted: false,
        cancelled: false,
        paid: true,
    })
        .populate("designRef", "sku images")
        .populate("blank", "code printLocations sizes");

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
            const designImages = item.designRef?.images ?? {};
            await Promise.all(
                (item.blank?.printLocations ?? []).map(async loc => {
                    const imageUrl = designImages[loc.code] ?? designImages[loc.name];
                    if (!imageUrl) return;
                    await createImage({
                        url: imageUrl,
                        pieceID: `${item.pieceId}-${loc.code ?? loc.name}`,
                        horizontal: false,
                        size: `${loc.width}x${loc.height}`,
                        offset: 0,
                        style: item.blank.code,
                        styleSize: item.sizeName,
                        color: item.colorName,
                        sku: item.sku ?? "",
                        shouldFitDesign: null,
                        printer,
                    });
                }),
            );
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

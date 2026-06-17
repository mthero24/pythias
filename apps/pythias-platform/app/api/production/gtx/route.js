export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { PlatformItem as Items } from "@pythias/mongo";
import axios from "axios";
import { getToken } from "next-auth/jwt";
import { logActivity, userFromToken } from "@pythias/backend/server";
import { getShippingCreds } from "@/lib/getShippingCreds";

function internalHeaders(key) {
    return { Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
}

// Custom designs carry a normalized placement (0–1) within the envelope. Shrink + reposition the
// envelope so GTX prints the cropped art at its real size/spot (horizoffset from left, vertoffset
// from top). Pre-made designs (no placement) keep the full envelope.
function applyPlace(env, place) {
    if (!env || !place || !(place.wPct > 0) || !(place.hPct > 0)) return env;
    const r2 = (n) => Math.round(n * 100) / 100;
    return {
        ...env,
        width: r2(env.width * place.wPct),
        height: r2(env.height * place.hPct),
        horizoffset: r2((env.horizoffset || 0) + (place.xPct || 0) * env.width),
        vertoffset: r2((env.vertoffset || 0) + (place.yPct || 0) * env.height),
    };
}
const placeFor = (item, loc) => item?.personalization?.sides?.find((s) => s.location === loc)?.place;
// Image per location — same source DTF uses (item.design[location]); for custom this is the cropped art.
const artworkFor = (item, loc) => item?.design?.[loc] || undefined;

function buildGTXJob(item, printAs) {
    const baseFront = item.blank?.envelopes?.find(
        (e) => (e.size?.toString() === item.size?.toString() || e.sizeName === item.sizeName) && e.placement === "front"
    ) || item.blank?.envelopes?.[0] || {};
    const baseBack = item.blank?.envelopes?.find(
        (e) => (e.size?.toString() === item.size?.toString() || e.sizeName === item.sizeName) && e.placement === "back"
    );
    const envelope = applyPlace(baseFront, placeFor(item, "front"));
    const backEnvelope = baseBack ? applyPlace(baseBack, placeFor(item, "back")) : undefined;

    const profile = {
        inkCombination: 2,
        resolution: 1,
        saturation: 10,
        brightness: 5,
        contrast: 10,
        unidirectional: false,
        ecomode: false,
        blackBackground: false,
        minWhite: 1,
        Choke: 2,
        whiteColorPause: false,
        whiteColorPauseSpan: 0,
        highlight: 5,
        mask: 3,
        transparent: false,
        LayerWhite2: false,
        inkVolume: 10,
        doublePrint: 2,
        multiple: false,
        cyanBalance: 0,
        MagentaBalance: 0,
        YellowBalance: 0,
        blackBalance: 0,
    };

    const colorName = (item.colorName || "").toLowerCase();
    const colorCategory = (item.color?.category || "").toLowerCase();
    const colorType = item.color?.color_type;

    if (colorName === "white" || (colorCategory === "2 tone") || printAs === "white") {
        profile.inkCombination = 0;
    } else if (colorName === "ash" || printAs === "ash") {
        profile.saturation = 5;
        profile.brightness = 0;
        profile.contrast = 5;
        profile.highlight = 3;
        profile.mask = 2;
    } else if (colorType === "dark") {
        profile.highlight = 6;
        profile.mask = 4;
    }

    return {
        order_Id: item.order?.poNumber,
        pieceID: item.pieceId,
        style: item.blank?.code,
        color: item.colorName,
        size: item.sizeName,
        design: item.sku?.split("-")[0],
        vendor: "PremierPrinting",
        amazon: false,
        order: item.order,
        Profile: profile,
        Envelope: envelope,
        ...(backEnvelope ? { BackEnvelope: backEnvelope } : {}),
        varient: {
            sku: item.sku,
            images: {
                design_image: artworkFor(item, "front"),
                back_design_image: artworkFor(item, "back"),
            },
        },
        hasBack: !!artworkFor(item, "back"),
        printedFront: item.frontPrinted,
        teeshirtprinted: item.printed,
    };
}

async function getItemForGTX(pieceId, orgId) {
    return Items.findOne({ pieceId: pieceId.toUpperCase().trim(), orgId })
        .populate("blank", "code envelopes")
        .populate("order", "poNumber items notes")
        .populate("color", "category name color_type")
        .lean();
}

// GET — state + printer queue
export async function GET(req) {
    const token = await getToken({ req });
    const { userName, email } = userFromToken(token);
    const orgId = token?.orgId;
    const printer = req.nextUrl.searchParams.get("printer") || "printer1";

    const [onPrinter, printerQue] = await Promise.all([
        Items.findOne({ onPrinter: true, "printerQue.printer": printer, orgId })
            .populate("blank", "code envelopes")
            .populate("order", "poNumber items notes")
            .populate("color", "category name color_type")
            .lean(),
        Items.find({ onPrinter: false, "printerQue.printer": printer, orgId })
            .populate("blank", "code envelopes")
            .populate("order", "poNumber items")
            .populate("color", "category name color_type")
            .sort({ "printerQue.scan": 1 })
            .lean(),
    ]);

    return NextResponse.json({ error: false, onPrinter, printerQue });
}

// POST — scan (add to queue), send-to-printer, send-to-dryer, repull, print-as-white, print-as-ash, resend, clear, clear-all
export async function POST(req) {
    const token = await getToken({ req });
    const { userName, email } = userFromToken(token);
    const orgId = token?.orgId;
    const data = await req.json();
    const { action, pieceID, pieceIDs, printer = "printer1" } = data;
    const sc = await getShippingCreds();

    try {
        // ── scan: add pieceIDs to queue ──
        if (action === "scan") {
            const errors = {};
            const ids = Array.isArray(pieceIDs) ? pieceIDs : [pieceID];
            for (const id of ids) {
                try {
                    const item = await Items.findOne({ pieceId: id.toUpperCase().trim(), orgId })
                        .populate("blank", "code envelopes")
                        .populate("order", "poNumber items notes")
                        .populate("color", "category name color_type");
                    if (!item) throw new Error("Item not found");
                    if (item.canceled) throw new Error("Item canceled");
                    if (item.shipped) throw new Error("Item already shipped");
                    if (!item.design?.front && !item.design?.back) throw new Error("No design on item");

                    const job = buildGTXJob(item);
                    const onPrinterNow = await Items.findOne({ onPrinter: true, "printerQue.printer": printer, orgId });
                    await axios.post(`http://${sc.localIP}/api/gtx/send`, { que: job, createOnly: !!onPrinterNow }, { headers: internalHeaders(sc.localKey) });

                    if (!onPrinterNow) {
                        item.onPrinter = true;
                        item.status = `Loaded On Printer ${printer}`;
                        if (!item.steps) item.steps = [];
                        item.steps.push({ status: `Loaded On Printer ${printer}`, date: new Date() });
                    }
                    item.printerQue = { printer, scan: Date.now() };
                    item.lastScan = { station: `GTX ${printer}`, date: new Date(), user: token?.sub };
                    await item.save();
                    logActivity({ action: "gtx_scan", entity: "gtx", entityId: item._id, entityName: item.pieceId, userName, email });
                } catch (e) {
                    errors[id] = e.message;
                }
            }
            const [onPrinter, printerQue] = await Promise.all([
                Items.findOne({ onPrinter: true, "printerQue.printer": printer, orgId }).populate("blank", "code envelopes").populate("order", "poNumber items notes").populate("color", "category name color_type").lean(),
                Items.find({ onPrinter: false, "printerQue.printer": printer, orgId }).populate("blank", "code envelopes").populate("order", "poNumber items").populate("color", "category name color_type").sort({ "printerQue.scan": 1 }).lean(),
            ]);
            return NextResponse.json({ error: false, errors, onPrinter, printerQue });
        }

        // ── send-to-printer: advance queue ──
        if (action === "send-to-printer") {
            const item = await Items.findOne({ pieceId: pieceID.toUpperCase().trim(), orgId }).populate("blank", "code envelopes").populate("order", "poNumber items notes").populate("color", "category name color_type");
            if (!item) return NextResponse.json({ error: true, msg: "Item not found" });

            const onPrinter = await Items.findOne({ onPrinter: true, "printerQue.printer": printer, orgId }).populate("blank", "code envelopes").populate("order", "poNumber items").populate("color", "category name color_type");
            const job = buildGTXJob(item);

            if (onPrinter) {
                const oldJob = buildGTXJob(onPrinter);
                await axios.post(`http://${sc.localIP}/api/gtx/delete`, { que: oldJob }, { headers: internalHeaders(sc.localKey) });
                onPrinter.onPrinter = false;
                onPrinter.printed = true;
                onPrinter.printedDate = new Date();
                onPrinter.frontPrinted = true;
                onPrinter.printerQue = {};
                onPrinter.status = "Printed";
                if (!onPrinter.steps) onPrinter.steps = [];
                onPrinter.steps.push({ status: "Printed", date: new Date() });
                await onPrinter.save();
            }

            await axios.post(`http://${sc.localIP}/api/gtx/send`, { que: job, createOnly: false }, { headers: internalHeaders(sc.localKey) });
            item.onPrinter = true;
            item.printerQue = { printer, scan: Date.now() };
            item.status = `On Printer ${printer}`;
            if (!item.steps) item.steps = [];
            item.steps.push({ status: `On Printer ${printer}`, date: new Date() });
            await item.save();
            logActivity({ action: "gtx_send_to_printer", entity: "gtx", entityId: item._id, entityName: item.pieceId, userName, email });
            return NextResponse.json({ error: false, msg: "sent to printer" });
        }

        // ── send-to-dryer: mark current as printed, advance ──
        if (action === "send-to-dryer") {
            const onPrinter = await Items.findOne({ onPrinter: true, "printerQue.printer": printer, orgId }).populate("blank", "code envelopes").populate("order", "poNumber items").populate("color", "category name color_type");
            if (!onPrinter) return NextResponse.json({ error: true, msg: "Nothing on printer" });

            const oldJob = buildGTXJob(onPrinter);
            const nextItem = await Items.findOne({ onPrinter: false, "printerQue.printer": printer, orgId }).populate("blank", "code envelopes").populate("order", "poNumber items").populate("color", "category name color_type").sort({ "printerQue.scan": 1 });

            await axios.post(`http://${sc.localIP}/api/gtx/delete`, { que: oldJob }, { headers: internalHeaders(sc.localKey) });
            onPrinter.onPrinter = false;
            onPrinter.printed = true;
            onPrinter.printedDate = new Date();
            onPrinter.frontPrinted = true;
            onPrinter.printerQue = {};
            onPrinter.status = "Sent To Dryer";
            if (!onPrinter.steps) onPrinter.steps = [];
            onPrinter.steps.push({ status: "Sent To Dryer", date: new Date() });
            await onPrinter.save();

            if (nextItem) {
                const nextJob = buildGTXJob(nextItem);
                await axios.post(`http://${sc.localIP}/api/gtx/send`, { que: nextJob, createOnly: false }, { headers: internalHeaders(sc.localKey) });
                nextItem.onPrinter = true;
                nextItem.status = `On Printer ${printer}`;
                if (!nextItem.steps) nextItem.steps = [];
                nextItem.steps.push({ status: `On Printer ${printer}`, date: new Date() });
                await nextItem.save();
            }
            logActivity({ action: "gtx_dryer", entity: "gtx", entityId: onPrinter._id, entityName: onPrinter.pieceId, userName, email });
            return NextResponse.json({ error: false, msg: "sent to dryer" });
        }

        // ── repull: re-download and resend current on-printer item ──
        if (action === "repull") {
            const item = await Items.findOne({ pieceId: pieceID.toUpperCase().trim(), orgId }).populate("blank", "code envelopes").populate("order", "poNumber items").populate("color", "category name color_type");
            if (!item) return NextResponse.json({ error: true, msg: "Item not found" });
            const job = buildGTXJob(item);
            await axios.post(`http://${sc.localIP}/api/gtx/send`, { que: job, createOnly: false }, { headers: internalHeaders(sc.localKey) });
            return NextResponse.json({ error: false, msg: "repulled" });
        }

        // ── print-as-white ──
        if (action === "print-as-white") {
            const item = await getItemForGTX(pieceID, orgId);
            if (!item) return NextResponse.json({ error: true, msg: "Item not found" });
            const job = buildGTXJob(item, "white");
            await axios.post(`http://${sc.localIP}/api/gtx/send`, { que: job, createOnly: false }, { headers: internalHeaders(sc.localKey) });
            return NextResponse.json({ error: false, msg: "printing as white" });
        }

        // ── print-as-ash ──
        if (action === "print-as-ash") {
            const item = await getItemForGTX(pieceID, orgId);
            if (!item) return NextResponse.json({ error: true, msg: "Item not found" });
            const job = buildGTXJob(item, "ash");
            await axios.post(`http://${sc.localIP}/api/gtx/send`, { que: job, createOnly: false }, { headers: internalHeaders(sc.localKey) });
            return NextResponse.json({ error: false, msg: "printing as ash" });
        }

        // ── resend: resend current item to printer ──
        if (action === "resend") {
            const item = await getItemForGTX(pieceID, orgId);
            if (!item) return NextResponse.json({ error: true, msg: "Item not found" });
            const job = buildGTXJob(item);
            await axios.post(`http://${sc.localIP}/api/gtx/send`, { que: job, createOnly: false }, { headers: internalHeaders(sc.localKey) });
            return NextResponse.json({ error: false, msg: "resent to printer" });
        }

        // ── clear: remove single item from queue ──
        if (action === "clear") {
            const item = await getItemForGTX(pieceID, orgId);
            if (!item) return NextResponse.json({ error: true, msg: "Item not found" });
            const job = buildGTXJob(item);
            await axios.post(`http://${sc.localIP}/api/gtx/delete`, { que: job }, { headers: internalHeaders(sc.localKey) });
            await Items.updateOne({ pieceId: pieceID.toUpperCase().trim(), orgId }, { $set: { onPrinter: false, printerQue: {} } });
            return NextResponse.json({ error: false, msg: "cleared" });
        }

        // ── clear-all: clear entire printer queue ──
        if (action === "clear-all") {
            const queued = await Items.find({ "printerQue.printer": printer, orgId });
            for (const item of queued) {
                item.onPrinter = false;
                item.printerQue = {};
                await item.save();
            }
            return NextResponse.json({ error: false, msg: "queue cleared" });
        }

        return NextResponse.json({ error: true, msg: "Unknown action" });
    } catch (e) {
        console.error("GTX route error:", e);
        return NextResponse.json({ error: true, msg: String(e) });
    }
}

export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import Items from "@/models/Items";
import { setConfig, createImage } from "@pythias/dtf";
import { getShippingCreds } from "@/lib/getShippingCreds";
import { getToken } from "next-auth/jwt";
import { logActivity, userFromToken } from "@pythias/backend/server";
import axios from "axios";
import sharp from "sharp";
const changeDPI = require("changedpi");

const HEADER_DPI   = 300;
const HEADER_WIDTH = 24; // inches
const BATCH_SIZE   = 5;

async function buildHeaderBuffer(dateFrom, dateTo) {
    const w  = HEADER_WIDTH * HEADER_DPI; // 7200px
    const h  = Math.round(HEADER_DPI * 1.4);
    const fs = Math.round(h * 0.56);

    let text;
    if (dateFrom && dateTo) text = `OUT OF STOCK:  ${dateFrom}  —  ${dateTo}`;
    else if (dateFrom)      text = `OUT OF STOCK:  FROM  ${dateFrom}`;
    else if (dateTo)        text = `OUT OF STOCK:  TO  ${dateTo}`;
    else                    text = "OUT OF STOCK ITEMS";

    const svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
      <text x="${w / 2}" y="${Math.round(h * 0.75)}"
        font-family="Arial,Helvetica,sans-serif"
        font-size="${fs}" font-weight="bold"
        fill="black" text-anchor="middle">${text}</text>
    </svg>`;

    const raw = await sharp(Buffer.from(svg)).png().toBuffer();
    const b64 = await changeDPI.changeDpiDataUrl(
        `data:image/png;base64,${raw.toString("base64")}`, HEADER_DPI,
    );
    return Buffer.from(b64.replace(/^data:image\/\w+;base64,/, ""), "base64");
}

async function sendItemImages(item, printer) {
    const styleRef = item.styleV2;
    if (!item.design || !styleRef) return;

    await Promise.allSettled(
        Object.keys(item.design).map(async (key) => {
            const url = item.design[key];
            if (!url) return;

            let envelope = styleRef.envelopes?.find(
                (ev) =>
                    (ev.sizeName === item.sizeName || ev.size?.toString() === item.size?.toString()) &&
                    ev.placement === key,
            );
            if (!envelope) envelope = styleRef.envelopes?.find((ev) => ev.placement === key);
            if (!envelope?.width || !envelope?.height) return;

            await createImage({
                url,
                pieceID:         `${item.pieceId}-${key}`,
                horizontal:      false,
                size:            `${envelope.width}x${envelope.height}`,
                offset:          envelope.vertoffset,
                style:           styleRef.code,
                styleSize:       item.sizeName,
                color:           item.color?.name || item.colorName,
                sku:             item.sku,
                shouldFitDesign: null,
                printer,
                quantity:        1,
            }).catch((e) => console.error(`OOS image error ${item.pieceId}-${key}:`, e.message));
        }),
    );

    if (!item.steps) item.steps = [];
    item.steps.push({ status: "OOS Image Sent", date: new Date() });
    item.lastScan = { station: "DTF Load", date: new Date() };
    await item.save();
}

export async function POST(req) {
    const token = await getToken({ req });
    const { userName, email } = userFromToken(token);
    const { printersByType, dateFrom, dateTo } = await req.json();

    if (!printersByType || !Object.values(printersByType).some((p) => p?.length)) {
        return NextResponse.json({ error: true, msg: "No printers selected" });
    }

    const sc = await getShippingCreds();
    setConfig({ internalIP: sc.localIP, apiKey: sc.localKey });

    let allItems = await Items.find({
        stockStatus: { $in: ["attached", "ordered"] },
        type:        { $regex: /dtf/i },
        canceled:    { $ne: true },
    })
        .populate("color",   "name")
        .populate("styleV2", "code envelopes")
        .populate("order",   "date");

    if (dateFrom || dateTo) {
        allItems = allItems.filter((item) => {
            const raw = item.shipByDate || item.order?.date;
            if (!raw) return false;
            const d = new Date(raw).toLocaleDateString("en-CA");
            if (dateFrom && d < dateFrom) return false;
            if (dateTo   && d > dateTo)   return false;
            return true;
        });
    }

    // Skip items already sent or blank (no design to print)
    allItems = allItems.filter(
        (item) => !item.isBlank && !item.steps?.some((s) => s.status === "OOS Image Sent"),
    );

    // Group items by type, only for types that have selected printers
    const itemsByType = {};
    for (const item of allItems) {
        const type = item.type?.toUpperCase();
        if (!type || !printersByType[type]?.length) continue;
        if (!itemsByType[type]) itemsByType[type] = [];
        itemsByType[type].push(item);
    }

    const totalItems = Object.values(itemsByType).reduce((s, a) => s + a.length, 0);

    if (!totalItems) {
        return NextResponse.json({ error: true, msg: "No matching OOS DTF items found for the selected criteria" });
    }

    // Build flat task list: { item, printer }
    const tasks = [];
    for (const [type, items] of Object.entries(itemsByType)) {
        const printers  = printersByType[type];
        const chunkSize = Math.ceil(items.length / printers.length);
        for (let i = 0; i < printers.length; i++) {
            for (const item of items.slice(i * chunkSize, (i + 1) * chunkSize)) {
                tasks.push({ item, printer: printers[i] });
            }
        }
    }

    const authHeaders = {
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${sc.localKey}`,
        },
    };

    const encoder = new TextEncoder();
    let sent = 0;

    const stream = new ReadableStream({
        async start(controller) {
            const push = (obj) => controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));

            try {
                // Send header image to every unique selected printer
                const allPrinters = [...new Set(Object.values(printersByType).flat())];
                const headerBuffer = await buildHeaderBuffer(dateFrom, dateTo);
                await Promise.allSettled(
                    allPrinters.map((printer) =>
                        axios
                            .post(
                                `http://${sc.localIP}/api/dtf`,
                                { files: [{ buffer: headerBuffer, type: "png" }], printer, sku: "OOS-HEADER" },
                                authHeaders,
                            )
                            .catch((e) => console.error(`Header send error (${printer}):`, e.message)),
                    ),
                );

                // Send item images BATCH_SIZE at a time, streaming progress
                for (let i = 0; i < tasks.length; i += BATCH_SIZE) {
                    const batch = tasks.slice(i, i + BATCH_SIZE);
                    await Promise.allSettled(
                        batch.map(async ({ item, printer }) => {
                            await sendItemImages(item, printer);
                            sent++;
                            push({ sent, total: totalItems });
                        }),
                    );
                }

                logActivity({ action: "dtf_oos_sent", entity: "dtf", count: sent, userName, email, provider: "po" });
                push({ sent, total: totalItems, done: true });
            } catch (err) {
                console.error("OOS stream error:", err);
                push({ error: true, msg: err.message });
            } finally {
                controller.close();
            }
        },
    });

    return new Response(stream, { headers: { "Content-Type": "application/x-ndjson" } });
}

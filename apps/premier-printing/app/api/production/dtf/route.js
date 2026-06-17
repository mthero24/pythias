export const dynamic = "force-dynamic";
import { NextApiRequest, NextResponse } from "next/server";
import {Item as Items} from "@pythias/mongo";
import { Color } from "@pythias/mongo";
import {setConfig, createImage} from "@pythias/dtf"
import axios from "axios";
import { getToken } from "next-auth/jwt";
import { logActivity, userFromToken } from "@pythias/backend/server";
import { getShippingCreds } from "@/lib/getShippingCreds";

// Print size (inches) for a side. Custom designs carry a normalized placement (0–1) within the
// envelope, so the print is the ART's real size — not the full envelope (which is what blows a small
// placed design up to full width). Pre-made designs (no placement) fill the envelope as before.
const dtfSize = (envelope, item, key) => {
    const place = item?.personalization?.sides?.find((s) => s.location === key)?.place;
    const w = place?.wPct > 0 ? envelope.width * place.wPct : envelope.width;
    const h = place?.hPct > 0 ? envelope.height * place.hPct : envelope.height;
    return `${Math.round(w * 100) / 100}x${Math.round(h * 100) / 100}`;
};

export async function GET(req) {
    const token = await getToken({ req });
    const { userName, email } = userFromToken(token);
    let config = JSON.parse(process.env.dtf);
    console.log(config)
    setConfig({
        internalIP: config.localIP,
        apiKey: config.apiKey
    })
    let pieceID
    let item
    if( req.nextUrl.searchParams.get("pieceID")) pieceID = req.nextUrl.searchParams.get("pieceID")
    if(pieceID) item = await Items.findOne({pieceId: pieceID}).populate("blank", "code sizes multiImages").populate("designRef", "sku")
    console.log(item)
    if(item){
        console.log(item)
        if(!item.canceled){
            item.printed = true;
            item.printedDate = new Date();
            if (item.design?.front) item.frontPrinted = true;
            if (item.design?.back) item.backPrinted = true;
            item.status = "DTF Find";
            if (!item.steps) item.steps = [];
            item.steps.push({
                status: "DTF Find",
                date: new Date(),
            });
            await item.save();
            logActivity({ action: "dtf_found", entity: "dtf", entityId: item._id, entityName: item.pieceId || "", userName, email });

            console.log(item, "item");
            // console.log(style)
            return NextResponse.json( {error: false,
                msg: "here is the design",
                pieceID: item.pieceId,
                styleCode: item.blank.code, 
                colorName: item.colorName,
                item,
                images: item.design,
                designSku: item.designRef?.sku,
                type: "new",
                source: "PP",
            })
         
        }else return NextResponse.json({error: true, msg: "Item Canceled"});
    }else return NextResponse.json({error: true, msg: "Item not found"});
}

export async function POST(req = NextApiRequest) {
    const token = await getToken({ req });
    const { userName, email } = userFromToken(token);
    const sc = await getShippingCreds();
    setConfig({
      internalIP: sc.localIP,
      apiKey: sc.localKey,
    });
    let data = await req.json()
    console.log(data, "data")
    let item = await Items.findOne({
        pieceId: data.pieceId.toUpperCase().trim(),
    }).populate("blank", "code envelopes box sizes multiImages images").populate("designRef", "sku")
    console.log(item, "item", item.color, "item color")
    if (item && !item.canceled && !item.dtfScan) {
        item.dtfScan = true
        console.log(item.design, "item design")
        await Promise.all(Object.keys(item.design).map(async key => {
            if (key != undefined && item.design[key]) {
                console.log(key, "key", item.design[key], "design key")
                let envelopes = item.blank.envelopes.filter(
                    (envelope) => (envelope.size?.toString() == item.size.toString() || envelope.sizeName == item.sizeName) && envelope.placement == key
                );
                await createImage({
                    url: item.design[key],
                    pieceID: `${item.pieceId}-${key}`,
                    horizontal: false,
                    size: dtfSize(envelopes[0], item, key),
                    offset: envelopes[0].vertoffset,
                    style: item.blank.code,
                    styleSize: item.sizeName,
                    color: item.colorName,
                    sku: item.sku,
                    shouldFitDesign: null,
                    printer: data.printer
                })
            }
        }))
      
          item.status = "DTF Load";
          if (!item.steps) item.steps = [];
          item.steps.push({
            status: "DTF Load",
            date: new Date(),
          });
        await item.save()
        logActivity({ action: "dtf_sent", entity: "dtf", entityId: item._id, entityName: item.pieceId || "", userName, email });
        return NextResponse.json({
            error: false, msg: "added to que", styleCode: item.blank.code,
            colorName: item.colorName, item,
            images: item.design, designSku: item.designRef?.sku, type: "new", source: "PP" });
    }else if (item && item.canceled) {
        return NextResponse.json({ error: true, msg: "item canceled", design: item.design, designSku: item.designRef?.sku });
    }else if (item && item.dtfScan) {
        item.dtfScan = false
        await item.save()
        return NextResponse.json({ error: true, msg: "Item already Scanned Into DTF. If You Want To Resend It Scan It Again!", design: item.design });
    } else {
        return NextResponse.json({ error: true, msg: "item not found" });
    }
}

export async function PUT(req = NextApiRequest) {
    const token = await getToken({ req });
    const { userName, email } = userFromToken(token);
    let data = await req.json();
    try {
        const items = await Items.find({
            blank: { $ne: null },
            colorName: { $ne: null },
            sizeName: { $ne: null },
            designRef: { $ne: null },
            design: { $ne: null },
            labelPrinted: false,
            canceled: false,
            type: "DTF",
            paid: true,
        }).populate("designRef", "sku name printType").populate("blank", "code envelopes box sizes multiImages");

        const chunks = Math.ceil(items.length / data.printers.length);
        const send = data.printers.map((printer, i) => ({
            printer,
            items: items.slice(i * chunks, i * chunks + chunks),
        }));

        const now = new Date();
        const bulkOps = [];

        // All printers in parallel, all items within each printer in parallel
        await Promise.all(send.map(async ({ printer, items: printerItems }) => {
            await Promise.all(printerItems.map(async (item) => {
                if (!item || item.canceled || item.dtfScan) return;

                await Promise.all(
                    Object.keys(item.design).map(async (key) => {
                        if (!item.design[key]) return;
                        const envelope = item.blank.envelopes.find(
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
                            sku: item.sku,
                            shouldFitDesign: null,
                            printer,
                        });
                    })
                );

                bulkOps.push({
                    updateOne: {
                        filter: { _id: item._id },
                        update: {
                            $set: { dtfScan: true, status: "DTF Load" },
                            $push: { steps: { status: "DTF Load", date: now } },
                        },
                    },
                });
            }));
        }));

        if (bulkOps.length) await Items.bulkWrite(bulkOps, { ordered: false });

        logActivity({ action: "dtf_sent", entity: "dtf", count: bulkOps.length, userName, email });
        return NextResponse.json({ error: false, msg: `${bulkOps.length} sent to printers`, items: send });
    } catch (error) {
        console.error("Error in DTF PUT:", error);
        return NextResponse.json({ error: true, msg: "Error processing request" });
    }
}
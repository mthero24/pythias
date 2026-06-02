import { NextResponse } from "next/server";
import { PlatformBin, PlatformOrder, PlatformItem } from "@pythias/mongo";
import { getToken } from "next-auth/jwt";
import { getOrgCreds, buildShippingCreds } from "@/lib/getOrgCreds";
import axios from "axios";

export async function POST(req) {
    const token = await getToken({ req });
    if (!token?.orgId) return NextResponse.json({ error: true, msg: "Unauthorized" }, { status: 401 });

    const orgId = token.orgId;
    const data = await req.json();
    const creds = await getOrgCreds(orgId);

    if (data.reprint) {
        const item = await PlatformItem.findOne({ orgId, pieceId: data.scan.trim() })
            .populate({ path: "order", populate: "items" });
        const order = item?.order ?? await PlatformOrder.findOne({ orgId, poNumber: data.scan.trim() });
        if (!order?.shippingInfo?.label) {
            return NextResponse.json({ error: true, msg: "No label found" });
        }
        const headers = { headers: { "Content-Type": "application/json", Authorization: `Bearer ${creds.localKey}` } };
        const res = await axios.post(
            `http://${creds.localIP}/api/shipping/cpu`,
            { label: order.shippingInfo.label, station: data.station, barcode: "ppp" },
            headers,
        ).catch(e => ({ error: true, data: e.message }));
        return NextResponse.json(res.error ? { error: true, msg: "error printing label" } : res.data);
    }

    try {
        const [item, orderByPo] = await Promise.all([
            PlatformItem.findOne({ orgId, pieceId: data.scan.trim() })
                .populate({ path: "order", populate: "items" })
                .populate("blank"),
            PlatformOrder.findOne({ orgId, poNumber: data.scan.trim() })
                .populate({ path: "items", populate: "blank" }),
        ]);

        let bin = null;
        if (!isNaN(data.scan.trim())) {
            bin = await PlatformBin.findOne({ orgId, number: data.scan.trim() })
                .populate({ path: "order", populate: { path: "items", populate: "blank" } });
        }

        const res = { error: false, msg: "", item, order: null, bin };

        if (item) {
            res.order = item.order;
            if (item.cancelled || item.order?.cancelled) {
                res.error = true;
                res.msg = "Item Canceled";
            } else if (item.shipped) {
                res.error = true;
                res.msg = "Order already shipped";
            } else {
                const orderItemCount = item.order?.items?.length ?? 1;
                if (orderItemCount <= 1) {
                    res.activate = "ship";
                    const sizeData = item.blank?.sizes?.find(s => s.name === item.sizeName);
                    res.weight = sizeData?.weight ?? 8;
                    res.dimensions = { length: 10, width: 13, height: 1 };
                } else {
                    let existingBin = await PlatformBin.findOne({ orgId, order: item.order._id })
                        .populate({ path: "order", populate: "items" });
                    if (!existingBin) {
                        existingBin = await PlatformBin.findOne({ orgId, status: "empty" });
                        if (existingBin) {
                            existingBin.order = item.order._id;
                            existingBin.status = "in_use";
                            existingBin.assignedAt = new Date();
                        }
                    }
                    if (existingBin) {
                        res.activate = "bin";
                        res.bin = existingBin;
                        item.bin = existingBin._id;
                        await item.save();
                        await existingBin.save();

                        const binOrderItems = item.order.items.map(i => i._id?.toString());
                        const binnedItems = await PlatformItem.find({
                            orgId,
                            order: item.order._id,
                            bin: existingBin._id,
                        }).select("_id");
                        const allInBin = binOrderItems.every(id =>
                            binnedItems.some(bi => bi._id.toString() === id)
                        );
                        if (allInBin) {
                            existingBin.status = "ready";
                            await existingBin.save();
                            res.activate = "bin/ship";
                        }
                    }
                }
            }
        } else if (orderByPo) {
            res.order = orderByPo;
            res.activate = "ship";
        } else if (bin) {
            res.order = bin.order;
        }

        return NextResponse.json(JSON.parse(JSON.stringify(res)));
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: true, msg: e.message });
    }
}

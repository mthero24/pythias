import { NextApiRequest, NextResponse } from "next/server";
import Order from "../../../../../models/Order";
import "../../../../../models/Items";
import "../../../../../models/StyleV2";
import axios from "axios";
import { getShippingCreds } from "@/lib/getShippingCreds";

export async function GET(req = NextApiRequest) {
    const noScale = req.nextUrl.searchParams.get("noScale") === "true";

    if (noScale) {
        try {
            const order = await Order.findById(req.nextUrl.searchParams.get("id"))
                .populate({ path: "items", populate: "styleV2" });
            let weight = 0;
            for (const i of order.items) {
                const sizeWeight = i.styleV2?.sizes?.find(s => s.name === i.sizeName)?.weight;
                weight += sizeWeight ?? 3;
            }
            return NextResponse.json({ error: false, value: weight });
        } catch (e) {
            return NextResponse.json({ error: false, value: 8 });
        }
    }

    const sc = await getShippingCreds();
    const headers = {
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${sc.localKey}`
        }
    };
    const res = await axios.get(`http://${sc.localIP}/api/shipping/scales?station=${req.nextUrl.searchParams.get("station")}`, headers);
    return NextResponse.json({ ...res.data });
}
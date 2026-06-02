import { NextApiRequest, NextResponse } from "next/server";
import Order from "../../../../../models/Order";
import "../../../../../models/Items";
import "../../../../../models/StyleV2";
import axios from "axios";

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

    const headers = {
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer $2a$10$PDlV9Xhf.lMicHvMvBCMwuyCYUhWGqjaCEFpG0AJMSKteUfKBO.Hy`
        }
    };
    const res = await axios.get(`http://${process.env.localIP}/api/shipping/scales?station=${req.nextUrl.searchParams.get("station")}`, headers);
    return NextResponse.json({ ...res.data });
}
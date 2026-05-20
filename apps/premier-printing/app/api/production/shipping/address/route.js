import { NextApiRequest, NextResponse } from "next/server";
import { Order } from "@pythias/mongo";
import { getToken } from "next-auth/jwt";
import { logActivity, userFromToken, logChange } from "@pythias/backend/server";

export async function POST(req = NextApiRequest) {
    const token = await getToken({ req });
    const { userName, email } = userFromToken(token);
    const data = await req.json();
    try {
        const before = await Order.findById(data.id).select("shippingAddress poNumber").lean();
        await Order.findOneAndUpdate({ _id: data.id }, { shippingAddress: { ...data.shippingAddress } });
        logActivity({ action: "order_address_update", entity: "order", entityId: data.id, entityName: before?.poNumber || "", userName, email });
        logChange({ entityType: "order", entityId: data.id, entityName: before?.poNumber || "", action: "address_update", before: before?.shippingAddress, after: data.shippingAddress, userName, email, provider: "premierPrinting" });
        return NextResponse.json({ error: false });
    } catch (e) {
        return NextResponse.json({ error: true, msg: e.message });
    }
}

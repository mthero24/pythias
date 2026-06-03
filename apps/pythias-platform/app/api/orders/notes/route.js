import { NextApiRequest, NextResponse } from "next/server";
import { PlatformOrder as Order } from "@pythias/mongo";
import { getToken } from "next-auth/jwt";
import { logActivity, userFromToken, logChange } from "@pythias/backend/server";

export async function POST(req = NextApiRequest) {
    const token = await getToken({ req });
    const { userName, email } = userFromToken(token);
    const orgId = token?.orgId;
    const data = await req.json();
    let order = await Order.findOne({ _id: data.order._id, orgId }).populate("items");
    if (!order.notes) order.notes = [];
    const note = { userName: token.userName, date: new Date(), note: data.note };
    order.notes.push(note);
    order = await order.save();
    logActivity({ action: "order_note", entity: "order", entityId: order._id, entityName: order.poNumber || "", userName, email });
    logChange({ entityType: "order", entityId: order._id, entityName: order.poNumber || "", action: "note_added", before: null, after: note, userName, email, provider: "premierPrinting" });
    return NextResponse.json({ error: false, order });
}

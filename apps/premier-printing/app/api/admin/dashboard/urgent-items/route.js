import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { Items } from "@pythias/mongo";

export async function GET(req) {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["admin", "owner"].includes(session.user.role)) {
        return NextResponse.json({ error: true, msg: "Unauthorized" }, { status: 401 });
    }
    try {
        const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);

        const items = await Items.find({
            shipped:     { $ne: true },
            canceled:    { $ne: true },
            shipByDate:  { $exists: true, $ne: null, $lte: tomorrow },
        })
            .select("pieceId steps shipByDate styleCode colorName sizeName order")
            .populate("order", "poNumber marketplace")
            .sort({ shipByDate: 1 })
            .lean();

        return NextResponse.json({ items });
    } catch (e) {
        console.error("[urgent-items]", e);
        return NextResponse.json({ error: true, msg: e.message, items: [] }, { status: 500 });
    }
}

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { backfillShipByDate } from "@/functions/pullOrders";

export async function POST(req) {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["admin", "owner"].includes(session.user.role)) {
        return NextResponse.json({ error: true, msg: "Unauthorized" }, { status: 401 });
    }
    try {
        const result = await backfillShipByDate();
        return NextResponse.json({ error: false, ...result });
    } catch (e) {
        console.error("[backfill/ship-by-date]", e);
        return NextResponse.json({ error: true, msg: e.message }, { status: 500 });
    }
}

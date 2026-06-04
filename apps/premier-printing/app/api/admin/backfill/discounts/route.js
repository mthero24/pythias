import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { backfillDiscounts } from "@/functions/pullOrders";

export async function POST(req) {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["admin", "owner"].includes(session.user.role)) {
        return NextResponse.json({ error: true, msg: "Unauthorized" }, { status: 401 });
    }
    try {
        const result = await backfillDiscounts();
        return NextResponse.json({ error: false, ...result });
    } catch (e) {
        console.error("[backfill/discounts]", e);
        return NextResponse.json({ error: true, msg: e.message }, { status: 500 });
    }
}

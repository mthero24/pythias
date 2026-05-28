import { NextResponse } from "next/server";
import { listShipments, createShipment, CEPermissionError } from "@/functions/channelEngine";

// GET /api/admin/channelengine/shipments?page=0&pageSize=50
export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const page = searchParams.get("page") || "0";
        const pageSize = searchParams.get("pageSize") || "50";

        const result = await listShipments({ pageIndex: page, pageSize });
        return NextResponse.json({ error: false, ...result });
    } catch (e) {
        if (e instanceof CEPermissionError)
            return NextResponse.json({ error: false, noPermission: true, Content: [], TotalCount: 0 });
        console.error("[channelengine/shipments GET]", e.message);
        return NextResponse.json({ error: true, msg: e.message }, { status: 500 });
    }
}

// POST /api/admin/channelengine/shipments
// Body: { MerchantOrderNo, Lines: [{ MerchantProductNo, Quantity, ShipmentLineNo }], TrackTraceNo, Method, ShippedAt }
export async function POST(req) {
    try {
        const body = await req.json();
        if (!body?.MerchantOrderNo)
            return NextResponse.json({ error: true, msg: "MerchantOrderNo is required" }, { status: 400 });

        const result = await createShipment(body);
        return NextResponse.json({ error: false, result });
    } catch (e) {
        console.error("[channelengine/shipments POST]", e.message);
        return NextResponse.json({ error: true, msg: e.message }, { status: 500 });
    }
}

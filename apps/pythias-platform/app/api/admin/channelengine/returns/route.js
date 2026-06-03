import { NextResponse } from "next/server";
import { listReturns, CEPermissionError } from "@/functions/channelEngine";

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const page = searchParams.get("page") || "0";
        const pageSize = searchParams.get("pageSize") || "50";

        const result = await listReturns({ pageIndex: page, pageSize });
        return NextResponse.json({ error: false, ...result });
    } catch (e) {
        if (e instanceof CEPermissionError)
            return NextResponse.json({ error: false, noPermission: true, Content: [], TotalCount: 0 });
        console.error("[channelengine/returns GET]", e.message);
        return NextResponse.json({ error: true, msg: e.message }, { status: 500 });
    }
}

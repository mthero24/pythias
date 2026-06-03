import { NextResponse } from "next/server";
import { ErrorLog } from "@pythias/mongo";
import { getToken } from "next-auth/jwt";

export async function GET(req) {
    const token = await getToken({ req });
    if (!token?.permissions?.charts) {
        return NextResponse.json({ error: true, msg: "Access denied" }, { status: 403 });
    }

    const provider   = req.nextUrl.searchParams.get("provider") || "premierPrinting";
    const range      = req.nextUrl.searchParams.get("range") || "day";
    const source     = req.nextUrl.searchParams.get("source") || null;
    const page       = Math.max(1, parseInt(req.nextUrl.searchParams.get("page") || "1"));
    const limit      = 50;

    const now = new Date();
    let since;
    if (range === "hour")  since = new Date(now - 60 * 60 * 1000);
    else if (range === "week")  since = new Date(now - 7 * 24 * 60 * 60 * 1000);
    else if (range === "month") since = new Date(now - 30 * 24 * 60 * 60 * 1000);
    else since = new Date(now - 24 * 60 * 60 * 1000);

    const match = { provider, timestamp: { $gte: since } };
    if (source) match.source = source;

    try {
        const [entries, total] = await Promise.all([
            ErrorLog.find(match).sort({ timestamp: -1 }).skip((page - 1) * limit).limit(limit).lean(),
            ErrorLog.countDocuments(match),
        ]);
        return NextResponse.json({ error: false, entries, total, page, pages: Math.ceil(total / limit) });
    } catch (e) {
        console.error("Errorlog route error:", e);
        return NextResponse.json({ error: true, msg: e.message });
    }
}

export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { ErrorLog } from "@pythias/mongo";

// Optional super-admin gate: if PYTHIAS_ADMIN_EMAILS is set, only those emails can view errors.
function allowed(session) {
    if (!session?.user?.email) return false;
    const admins = (process.env.PYTHIAS_ADMIN_EMAILS || "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
    if (!admins.length) return true; // no allow-list configured → any signed-in user
    return admins.includes(session.user.email.toLowerCase());
}

export async function GET(req) {
    const session = await getServerSession(authOptions);
    if (!allowed(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const sp = req.nextUrl.searchParams;
    const fingerprint = sp.get("fingerprint");
    const sinceHours = Math.min(parseInt(sp.get("hours") || "168", 10) || 168, 24 * 30); // default 7d, max 30d
    const since = new Date(Date.now() - sinceHours * 3600 * 1000);

    // Drill-down: recent occurrences for one fingerprint (full detail incl. stack).
    if (fingerprint) {
        const occurrences = await ErrorLog.find({ fingerprint }).sort({ timestamp: -1 }).limit(50).lean();
        return NextResponse.json({ error: false, occurrences });
    }

    // Grouped overview: one row per distinct error, newest first.
    const groups = await ErrorLog.aggregate([
        { $match: { timestamp: { $gte: since } } },
        { $sort: { timestamp: -1 } },
        { $group: {
            _id: "$fingerprint",
            count: { $sum: 1 },
            lastSeen: { $first: "$timestamp" },
            firstSeen: { $last: "$timestamp" },
            message: { $first: "$message" },
            route: { $first: "$route" },
            source: { $first: "$source" },
            method: { $first: "$method" },
            app: { $first: "$app" },
            provider: { $first: "$provider" },
            status: { $first: "$status" },
        } },
        { $sort: { lastSeen: -1 } },
        { $limit: 200 },
    ]);
    const totalEvents = await ErrorLog.countDocuments({ timestamp: { $gte: since } });
    return NextResponse.json({ error: false, groups, totalEvents, sinceHours });
}

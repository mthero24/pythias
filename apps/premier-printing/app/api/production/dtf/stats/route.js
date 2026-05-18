import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { userFromToken } from "@pythias/backend/server";
import { UserActivity } from "@pythias/mongo";

export async function GET(req) {
    const token = await getToken({ req });
    if (!token) return NextResponse.json({ sent: 0, found: 0 });
    const { userName } = userFromToken(token);

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [sentDocs, found] = await Promise.all([
        UserActivity.find({ action: "dtf_sent", userName, timestamp: { $gte: startOfDay } }).lean(),
        UserActivity.countDocuments({ action: "dtf_found", userName, timestamp: { $gte: startOfDay } }),
    ]);

    const sent = sentDocs.reduce((sum, doc) => sum + (doc.count || 1), 0);

    return NextResponse.json({ sent, found });
}

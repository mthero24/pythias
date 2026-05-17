import { NextResponse } from "next/server";
import { UserActivity } from "@pythias/mongo";
import { getToken } from "next-auth/jwt";

export async function GET(req) {
    const token = await getToken({ req });
    if (!token?.permissions?.charts) {
        return NextResponse.json({ error: true, msg: "Access denied" }, { status: 403 });
    }
    const provider = req.nextUrl.searchParams.get("provider") || "pythiasTest";
    const range = req.nextUrl.searchParams.get("range") || "day";
    const userName = req.nextUrl.searchParams.get("user") || null;

    const now = new Date();
    let since;
    if (range === "hour") since = new Date(now - 60 * 60 * 1000);
    else if (range === "week") since = new Date(now - 7 * 24 * 60 * 60 * 1000);
    else if (range === "month") since = new Date(now - 30 * 24 * 60 * 60 * 1000);
    else since = new Date(now - 24 * 60 * 60 * 1000);

    const match = { provider, timestamp: { $gte: since } };
    if (userName) match.userName = userName;

    try {
        const byUser = await UserActivity.aggregate([
            { $match: match },
            {
                $group: {
                    _id: { userName: "$userName", action: "$action" },
                    email: { $first: "$email" },
                    count: { $sum: "$count" },
                }
            },
            { $sort: { "_id.userName": 1, "_id.action": 1 } }
        ]);

        const bucketSize = range === "hour" ? 5 : range === "week" ? 360 : range === "month" ? 1440 : 60;
        const timeline = await UserActivity.aggregate([
            { $match: match },
            {
                $group: {
                    _id: {
                        userName: "$userName",
                        bucket: {
                            $toDate: {
                                $subtract: [
                                    { $toLong: "$timestamp" },
                                    { $mod: [{ $toLong: "$timestamp" }, bucketSize * 60 * 1000] }
                                ]
                            }
                        }
                    },
                    count: { $sum: "$count" },
                }
            },
            { $sort: { "_id.bucket": 1 } }
        ]);

        const users = {};
        for (const row of byUser) {
            const { userName, action } = row._id;
            if (!users[userName]) users[userName] = { email: row.email, actions: {}, total: 0 };
            users[userName].actions[action] = row.count;
            users[userName].total += row.count;
        }

        return NextResponse.json({ error: false, users, timeline, range, since });
    } catch (e) {
        console.error("Activity route error:", e);
        return NextResponse.json({ error: true, msg: e.message });
    }
}

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { PlatformItem } from "@pythias/mongo";

// "Items Due to Ship — Next 5 Days": for staffing decisions, a daily tally of the org's
// unshipped, un-cancelled items whose shipByDate falls in [startOfToday .. +5d), plus a
// leading "Overdue" bucket (ship-by already past). Org-scoped via the platform session.
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: true, msg: "Unauthorized" }, { status: 401 });
        const orgId = session.user.orgId;

        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const horizonDays = 7;
        const end = new Date(startOfToday);
        end.setDate(end.getDate() + horizonDays);

        // NOT shipped + NOT cancelled (the model field is `canceled`; legacy docs use `cancelled` —
        // exclude both spellings) with a ship-by date.
        const notDone = {
            orgId,
            shipped: { $ne: true },
            canceled: { $ne: true },
            cancelled: { $ne: true },
            shipByDate: { $ne: null },
        };

        const [overdueCount, upcoming] = await Promise.all([
            PlatformItem.countDocuments({ ...notDone, shipByDate: { $lt: startOfToday } }),
            PlatformItem.aggregate([
                { $match: { ...notDone, shipByDate: { $gte: startOfToday, $lt: end } } },
                { $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$shipByDate" } },
                    count: { $sum: 1 },
                }},
            ]),
        ]);

        const countByDay = {};
        for (const r of upcoming) countByDay[r._id] = r.count;

        const isoDay = (d) =>
            `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        const dayLabel = (d) =>
            d.toLocaleDateString("en-US", { weekday: "short" }) + ` ${d.getMonth() + 1}/${d.getDate()}`;

        const buckets = [
            { label: "Overdue", date: "overdue", count: overdueCount },
        ];
        for (let i = 0; i < horizonDays; i++) {
            const d = new Date(startOfToday);
            d.setDate(d.getDate() + i);
            const key = isoDay(d);
            buckets.push({ label: dayLabel(d), date: key, count: countByDay[key] ?? 0 });
        }

        return NextResponse.json({ buckets });
    } catch (e) {
        console.error("[reports/due-to-ship]", e);
        return NextResponse.json({ error: true, msg: e.message, buckets: [] }, { status: 500 });
    }
}

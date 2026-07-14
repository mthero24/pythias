import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { Items } from "@pythias/mongo";

const DAY_MS = 24 * 60 * 60 * 1000;
const DAYS   = 10;

function startOfDay(d) {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
}

// "Mon 6/30"
function dayLabel(d) {
    const wd = d.toLocaleDateString("en-US", { weekday: "short" });
    return `${wd} ${d.getMonth() + 1}/${d.getDate()}`;
}

export async function GET(req) {
    const session = await getServerSession(authOptions);
    // Dashboard permission (charts) is enough to view the Production tab — no admin role required.
    const u = session?.user;
    if (!u || !(u.permissions?.charts || ["admin", "owner"].includes(u.role))) {
        return NextResponse.json({ error: true, msg: "Unauthorized" }, { status: 401 });
    }
    try {
        const today = startOfDay(new Date());
        const end   = new Date(today.getTime() + DAYS * DAY_MS); // exclusive upper bound (today + 10d)

        // Due to ship = NOT shipped, NOT cancelled, with a shipByDate.
        const baseFilter = {
            shipped:    { $ne: true },
            canceled:   { $ne: true },
            paid:       { $ne: false }, // exclude unpaid items (e.g. unpaid custom orders)
            shipByDate: { $exists: true, $ne: null },
        };

        const [overdueCount, dailyAgg] = await Promise.all([
            // Overdue: unshipped items whose shipByDate is before today.
            Items.countDocuments({ ...baseFilter, shipByDate: { $lt: today } }),
            // Next 10 calendar days, grouped by day.
            Items.aggregate([
                { $match: { ...baseFilter, shipByDate: { $gte: today, $lt: end } } },
                { $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$shipByDate" } },
                    count: { $sum: 1 },
                }},
            ]),
        ]);

        const byDay = {};
        for (const r of dailyAgg) byDay[r._id] = r.count;

        const rows = [{ label: "Overdue", date: null, count: overdueCount }];
        for (let i = 0; i < DAYS; i++) {
            const d   = new Date(today.getTime() + i * DAY_MS);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
            rows.push({ label: dayLabel(d), date: key, count: byDay[key] || 0 });
        }

        return NextResponse.json({ rows });
    } catch (e) {
        console.error("[ship-tally]", e);
        return NextResponse.json({ error: true, msg: e.message, rows: [] }, { status: 500 });
    }
}

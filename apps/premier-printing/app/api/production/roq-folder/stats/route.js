import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { userFromToken } from "@pythias/backend/server";
import { UserActivity } from "@pythias/mongo";

export async function GET(req) {
    const token = await getToken({ req });
    if (!token) return NextResponse.json({ shipped: 0, folded: 0 });
    const { userName } = userFromToken(token);

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [shipped, folded] = await Promise.all([
        UserActivity.countDocuments({ action: "item_shipped", userName, timestamp: { $gte: startOfDay } }),
        UserActivity.countDocuments({ action: "item_folded", userName, timestamp: { $gte: startOfDay } }),
    ]);

    return NextResponse.json({ shipped, folded });
}

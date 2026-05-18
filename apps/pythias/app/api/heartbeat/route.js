import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { User } from "@pythias/mongo";

export async function POST(req) {
    const token = await getToken({ req });
    if (!token?.userName) return NextResponse.json({ valid: false });

    const body = await req.json().catch(() => ({}));
    const page = body.page;

    const now = new Date();
    const $set = { lastSeen: now };

    if (page && typeof page === "string" && !page.startsWith("/api/")) {
        const existing = await User.findOne({ userName: token.userName })
            .select("currentPage")
            .lean();

        if (!existing) return NextResponse.json({ valid: false });

        if (existing.currentPage !== page) {
            $set.previousPage  = existing.currentPage ?? null;
            $set.currentPage   = page;
            $set.pageEnteredAt = now;
        }
    }

    const user = await User.findOneAndUpdate(
        { userName: token.userName },
        { $set }
    ).lean();

    if (!user) return NextResponse.json({ valid: false });

    return NextResponse.json({ valid: true });
}

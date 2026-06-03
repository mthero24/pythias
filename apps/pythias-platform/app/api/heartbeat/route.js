import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { User, ActiveSession } from "@pythias/mongo";

export async function POST(req) {
    const body = await req.json().catch(() => ({}));
    const { page, sessionId, source, medium, campaign } = body;
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const now = new Date();

    // Track every human visitor (anonymous or logged-in) in ActiveSession
    if (sessionId && page && typeof page === "string" && !page.startsWith("/api/")) {
        try {
            const existing = await ActiveSession.findOne({ sessionId }).lean();
            const pages = existing?.pages ?? [];
            if (!pages.length || pages[pages.length - 1] !== page) pages.push(page);

            await ActiveSession.findOneAndUpdate(
                { sessionId },
                {
                    $set: {
                        lastSeen: now,
                        pages,
                        userName: token?.userName || existing?.userName || undefined,
                        ...(source && { source }),
                        ...(medium && { medium }),
                        ...(campaign && { campaign }),
                    },
                    $setOnInsert: { entryPage: page, startedAt: now, source: source || "direct" },
                },
                { upsert: true }
            );
        } catch {}
    }

    // For authenticated users also update the User record (live-user presence)
    if (!token?.userName) return NextResponse.json({ valid: true });

    const $set = { lastSeen: now };
    if (page && typeof page === "string" && !page.startsWith("/api/")) {
        const existing = await User.findOne({ userName: token.userName }).select("currentPage").lean();
        if (existing && existing.currentPage !== page) {
            $set.previousPage = existing.currentPage ?? null;
            $set.currentPage  = page;
            $set.pageEnteredAt = now;
        }
    }

    const user = await User.findOneAndUpdate({ userName: token.userName }, { $set }).lean();
    return NextResponse.json({ valid: !!user });
}

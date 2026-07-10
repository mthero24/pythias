import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { EditLock } from "@pythias/mongo";

// Cooperative record lock so two users don't edit the same thing and clobber each other's saves.
// POST { key }                -> claim/refresh the lock. { ok:true } if held, else { ok:false, lockedBy }.
// POST { key, release:true }  -> release (used by navigator.sendBeacon on page unload, which can only POST).
// DELETE { key }              -> release (used on React unmount / SPA navigation).
const STALE_MS = 75 * 1000;   // a holder that hasn't heartbeat in 75s is considered gone

async function who(req) {
    const t = await getToken({ req });
    if (!t) return null;
    return {
        owner: String(t.userId || t.userName || t.email || ""),
        name:  t.userName || t.firstName || t.email || "another user",
    };
}

export async function POST(req) {
    const me = await who(req);
    if (!me?.owner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { key, release } = await req.json().catch(() => ({}));
    if (!key) return NextResponse.json({ error: "key required" }, { status: 400 });

    if (release) { await EditLock.deleteOne({ key, owner: me.owner }); return NextResponse.json({ ok: true }); }

    const now = new Date();
    const staleBefore = new Date(now.getTime() - STALE_MS);
    // Take it if it's already mine or the current holder went stale (atomic update).
    const mine = await EditLock.findOneAndUpdate(
        { key, $or: [{ owner: me.owner }, { lastSeen: { $lt: staleBefore } }] },
        { $set: { owner: me.owner, userName: me.name, lastSeen: now } },
        { new: true },
    );
    if (mine) return NextResponse.json({ ok: true });
    // Otherwise it's free (create it) or held by someone active.
    try {
        await EditLock.create({ key, owner: me.owner, userName: me.name, lockedAt: now, lastSeen: now });
        return NextResponse.json({ ok: true });
    } catch {
        const l = await EditLock.findOne({ key }).lean();
        if (l && l.owner === me.owner) return NextResponse.json({ ok: true });
        return NextResponse.json({ ok: false, lockedBy: l?.userName || "another user" });
    }
}

export async function DELETE(req) {
    const me = await who(req);
    if (!me?.owner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { key } = await req.json().catch(() => ({}));
    if (key) await EditLock.deleteOne({ key, owner: me.owner });
    return NextResponse.json({ ok: true });
}

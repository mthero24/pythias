import mongoose from "mongoose";
import { PremierPrinting } from "../lib/connection";

// A short-lived "who's editing this record" lock, keyed by an opaque string (e.g. "blank:<id>").
// The client refreshes `lastSeen` on a heartbeat while the editor is open; a lock whose lastSeen
// is older than the server's staleness window (or the TTL below) is treated as free — so a closed
// tab / crash never blocks the record forever. Used to stop two users editing the same record and
// clobbering each other's saves.
const schema = new mongoose.Schema(
    {
        key:      { type: String, required: true, unique: true, index: true },
        owner:    { type: String },   // stable per-user id (userId, or userName in premier) — for "is this mine?"
        userName: { type: String },   // display name shown to the second user
        lockedAt: { type: Date, default: Date.now },
        lastSeen: { type: Date, default: Date.now },
    },
    { timestamps: true }
);
// Backstop cleanup: Mongo drops locks 120s after the last heartbeat (the API also treats
// anything older than its staleness window as free, so takeover is faster than this).
schema.index({ lastSeen: 1 }, { expireAfterSeconds: 120 });

export default PremierPrinting.models.EditLock || PremierPrinting.model("EditLock", schema);

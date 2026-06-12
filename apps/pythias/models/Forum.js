import mongoose from "mongoose";
import { PremierPrinting } from "@/lib/connection";

const ThreadSchema = new mongoose.Schema({
    title:       { type: String, required: true, trim: true, maxlength: 200 },
    body:        { type: String, required: true, trim: true, maxlength: 10000 },
    category:    { type: String, required: true, index: true },
    authorName:  { type: String, required: true, trim: true, maxlength: 80 },
    authorEmail: { type: String, required: true, trim: true, lowercase: true },
    views:       { type: Number, default: 0 },
    replyCount:  { type: Number, default: 0 },
    pinned:      { type: Boolean, default: false },
    locked:      { type: Boolean, default: false },
    lastActivityAt: { type: Date, default: Date.now },
}, { timestamps: true });

ThreadSchema.index({ category: 1, lastActivityAt: -1 });
ThreadSchema.index({ pinned: -1, lastActivityAt: -1 });

const ReplySchema = new mongoose.Schema({
    threadId:    { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    body:        { type: String, required: true, trim: true, maxlength: 10000 },
    authorName:  { type: String, required: true, trim: true, maxlength: 80 },
    authorEmail: { type: String, required: true, trim: true, lowercase: true },
    helpful:     { type: Number, default: 0 },
}, { timestamps: true });

ReplySchema.index({ threadId: 1, createdAt: 1 });

export const ForumThread = PremierPrinting.model("ForumThread", ThreadSchema, "forum_threads");
export const ForumReply  = PremierPrinting.model("ForumReply",  ReplySchema,  "forum_replies");

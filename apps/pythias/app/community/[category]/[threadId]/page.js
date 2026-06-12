"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

const CATEGORIES = {
    "production-tips":          { label: "Production Tips & Equipment", icon: "🖨️" },
    "business-sales":           { label: "Business & Sales",            icon: "📈" },
    "problems-troubleshooting": { label: "Problems & Troubleshooting",  icon: "🔧" },
    "wins-announcements":       { label: "Wins, Announcements & General", icon: "🎉" },
};

function timeAgo(date) {
    const s = Math.floor((Date.now() - new Date(date)) / 1000);
    if (s < 60)    return "just now";
    if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    const d = Math.floor(s / 86400);
    return d === 1 ? "yesterday" : `${d}d ago`;
}

function Avatar({ name }) {
    const initials = name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
    const hue = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
    return (
        <div style={{
            width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
            background: `hsl(${hue}, 45%, 30%)`, border: `2px solid hsl(${hue}, 45%, 45%)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "0.8rem", fontWeight: 700, color: "#fff",
        }}>
            {initials}
        </div>
    );
}

function PostBody({ body }) {
    return (
        <div style={{ color: "rgba(255,255,255,0.75)", fontSize: "0.95rem", lineHeight: 1.8, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
            {body}
        </div>
    );
}

export default function ThreadPage({ params }) {
    const [category, setCategory]   = useState(null);
    const [threadId, setThreadId]   = useState(null);
    const [thread,   setThread]     = useState(null);
    const [replies,  setReplies]    = useState([]);
    const [loading,  setLoading]    = useState(true);
    const [error,    setError]      = useState(null);

    const [name,     setName]       = useState("");
    const [email,    setEmail]      = useState("");
    const [body,     setBody]       = useState("");
    const [posting,  setPosting]    = useState(false);
    const [postErr,  setPostErr]    = useState("");

    useEffect(() => {
        params.then(p => { setCategory(p.category); setThreadId(p.threadId); });
    }, [params]);

    useEffect(() => {
        if (!threadId) return;
        fetch(`/api/forum/threads/${threadId}`)
            .then(r => r.json())
            .then(d => { setThread(d.thread); setReplies(d.replies ?? []); })
            .catch(() => setError("Failed to load thread"))
            .finally(() => setLoading(false));
    }, [threadId]);

    const submit = async (e) => {
        e.preventDefault();
        setPostErr("");
        if (!name.trim() || !email.trim() || !body.trim()) { setPostErr("All fields are required"); return; }
        setPosting(true);
        try {
            const res  = await fetch(`/api/forum/threads/${threadId}/reply`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ body: body.trim(), authorName: name.trim(), authorEmail: email.trim() }),
            });
            const data = await res.json();
            if (!res.ok) { setPostErr(data.error || "Failed to post"); return; }
            setReplies(prev => [...prev, data.reply]);
            setThread(prev => ({ ...prev, replyCount: (prev.replyCount || 0) + 1 }));
            setBody("");
        } catch { setPostErr("Failed to post"); }
        finally { setPosting(false); }
    };

    const cat = CATEGORIES[category] ?? {};

    if (loading) return (
        <main style={{ background: "#0f172a", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <p style={{ color: "rgba(255,255,255,0.3)" }}>Loading…</p>
        </main>
    );

    if (error || !thread) return (
        <main style={{ background: "#0f172a", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ textAlign: "center" }}>
                <p style={{ color: "rgba(255,255,255,0.4)", marginBottom: 16 }}>Thread not found.</p>
                <Link href="/community" style={{ color: "#D3A73D" }}>← Back to Community</Link>
            </div>
        </main>
    );

    return (
        <main style={{ background: "#0f172a", minHeight: "100vh" }}>
            <div style={{ maxWidth: 800, margin: "0 auto", padding: "40px 24px 80px" }}>

                {/* Breadcrumb */}
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 28, fontSize: "0.8rem" }}>
                    <Link href="/community" style={{ color: "#D3A73D", textDecoration: "none" }}>Community</Link>
                    <span style={{ color: "rgba(255,255,255,0.2)" }}>›</span>
                    <Link href={`/community/${category}`} style={{ color: "#D3A73D", textDecoration: "none" }}>{cat.label}</Link>
                </div>

                {/* Thread */}
                <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "28px 32px", marginBottom: 24 }}>
                    <h1 style={{ fontSize: "clamp(1.3rem, 3vw, 1.8rem)", fontWeight: 800, color: "#fff", lineHeight: 1.3, marginBottom: 20 }}>
                        {thread.pinned && <span style={{ color: "#D3A73D", marginRight: 8 }}>📌</span>}
                        {thread.title}
                    </h1>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24, paddingBottom: 20, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                        <Avatar name={thread.authorName} />
                        <div>
                            <p style={{ fontWeight: 700, color: "#fff", fontSize: "0.9rem", margin: 0 }}>{thread.authorName}</p>
                            <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.78rem", margin: 0 }}>{timeAgo(thread.createdAt)} · {thread.views} views</p>
                        </div>
                    </div>
                    <PostBody body={thread.body} />
                </div>

                {/* Replies */}
                {replies.length > 0 && (
                    <div style={{ marginBottom: 32 }}>
                        <p style={{ fontSize: "0.8rem", fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>
                            {replies.length} {replies.length === 1 ? "Reply" : "Replies"}
                        </p>
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            {replies.map((r, i) => (
                                <div key={r._id ?? i} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "20px 24px" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                                        <Avatar name={r.authorName} />
                                        <div>
                                            <p style={{ fontWeight: 700, color: "#fff", fontSize: "0.875rem", margin: 0 }}>{r.authorName}</p>
                                            <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.75rem", margin: 0 }}>{timeAgo(r.createdAt)}</p>
                                        </div>
                                    </div>
                                    <PostBody body={r.body} />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Reply form */}
                {!thread.locked ? (
                    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(211,167,61,0.15)", borderRadius: 16, padding: "28px 32px" }}>
                        <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#fff", marginBottom: 20 }}>Join the conversation</h2>
                        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "rgba(255,255,255,0.45)", marginBottom: 6 }}>Your name</label>
                                    <input value={name} onChange={e => setName(e.target.value)} placeholder="Jane Smith"
                                        style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "10px 14px", color: "#fff", fontSize: "0.9rem", boxSizing: "border-box", outline: "none" }} />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "rgba(255,255,255,0.45)", marginBottom: 6 }}>Email <span style={{ color: "rgba(255,255,255,0.25)" }}>(not displayed)</span></label>
                                    <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="you@example.com"
                                        style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "10px 14px", color: "#fff", fontSize: "0.9rem", boxSizing: "border-box", outline: "none" }} />
                                </div>
                            </div>
                            <div>
                                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "rgba(255,255,255,0.45)", marginBottom: 6 }}>Your reply</label>
                                <textarea value={body} onChange={e => setBody(e.target.value)} rows={5} placeholder="Share your thoughts, experience, or solution…"
                                    style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "12px 14px", color: "#fff", fontSize: "0.9rem", resize: "vertical", boxSizing: "border-box", outline: "none", fontFamily: "inherit" }} />
                            </div>
                            {postErr && <p style={{ color: "#f87171", fontSize: "0.85rem", margin: 0 }}>{postErr}</p>}
                            <div>
                                <button type="submit" disabled={posting}
                                    style={{ background: posting ? "rgba(211,167,61,0.5)" : "#D3A73D", color: "#0f172a", fontWeight: 700, fontSize: "0.875rem", padding: "12px 24px", borderRadius: 9, border: "none", cursor: posting ? "default" : "pointer" }}>
                                    {posting ? "Posting…" : "Post Reply"}
                                </button>
                            </div>
                        </form>
                    </div>
                ) : (
                    <p style={{ color: "rgba(255,255,255,0.3)", textAlign: "center", padding: "24px 0" }}>🔒 This thread is locked.</p>
                )}
            </div>
        </main>
    );
}

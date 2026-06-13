"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

const CATEGORIES = [
    { slug: "production-tips",           label: "Production Tips & Equipment", icon: "🖨️" },
    { slug: "business-sales",            label: "Business & Sales",            icon: "📈" },
    { slug: "problems-troubleshooting",  label: "Problems & Troubleshooting",  icon: "🔧" },
    { slug: "wins-announcements",        label: "Wins, Announcements & General", icon: "🎉" },
];

function NewThreadForm() {
    const router       = useRouter();
    const searchParams = useSearchParams();
    const [category, setCategory] = useState(searchParams.get("category") ?? "");
    const [title,    setTitle]    = useState("");
    const [body,     setBody]     = useState("");
    const [name,     setName]     = useState("");
    const [email,    setEmail]    = useState("");
    const [posting,  setPosting]  = useState(false);
    const [error,    setError]    = useState("");

    const submit = async (e) => {
        e.preventDefault();
        setError("");
        if (!title.trim() || !body.trim() || !name.trim() || !email.trim() || !category)
            { setError("All fields are required"); return; }
        setPosting(true);
        try {
            const res  = await fetch("/api/forum/threads", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: title.trim(), body: body.trim(), category, authorName: name.trim(), authorEmail: email.trim() }),
            });
            const data = await res.json();
            if (!res.ok) { setError(data.error || "Failed to post"); setPosting(false); return; }
            router.push(`/community/${category}/${data.thread._id}`);
        } catch { setError("Failed to post"); setPosting(false); }
    };

    return (
        <main style={{ background: "#0f172a", minHeight: "100vh", padding: "48px 24px 80px" }}>
            <div style={{ maxWidth: 700, margin: "0 auto" }}>
                <Link href="/community" style={{ fontSize: "0.8rem", color: "#D3A73D", textDecoration: "none", display: "inline-block", marginBottom: 24 }}>
                    ← Back to Community
                </Link>
                <h1 style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 800, color: "#fff", marginBottom: 8 }}>Start a Discussion</h1>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.9rem", marginBottom: 36 }}>
                    Ask a question, share something you{"'"}ve learned, or just start a conversation.
                </p>

                <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    {/* Category */}
                    <div>
                        <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "rgba(255,255,255,0.5)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>Category</label>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
                            {CATEGORIES.map(cat => (
                                <button key={cat.slug} type="button" onClick={() => setCategory(cat.slug)}
                                    style={{
                                        background: category === cat.slug ? "rgba(211,167,61,0.15)" : "rgba(255,255,255,0.03)",
                                        border: `1px solid ${category === cat.slug ? "rgba(211,167,61,0.5)" : "rgba(255,255,255,0.08)"}`,
                                        borderRadius: 10, padding: "12px 16px", cursor: "pointer",
                                        display: "flex", alignItems: "center", gap: 10, textAlign: "left",
                                    }}>
                                    <span style={{ fontSize: "1.2rem" }}>{cat.icon}</span>
                                    <span style={{ fontSize: "0.85rem", fontWeight: 600, color: category === cat.slug ? "#D3A73D" : "rgba(255,255,255,0.6)" }}>{cat.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Title */}
                    <div>
                        <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "rgba(255,255,255,0.5)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Title</label>
                        <input value={title} onChange={e => setTitle(e.target.value)} maxLength={200}
                            placeholder="What's your question or topic?"
                            style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 9, padding: "12px 16px", color: "#fff", fontSize: "0.95rem", boxSizing: "border-box", outline: "none", fontFamily: "inherit" }} />
                    </div>

                    {/* Body */}
                    <div>
                        <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "rgba(255,255,255,0.5)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Details</label>
                        <textarea value={body} onChange={e => setBody(e.target.value)} rows={8} maxLength={10000}
                            placeholder="Share as much context as you can. The more you share, the better people can help."
                            style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 9, padding: "12px 16px", color: "#fff", fontSize: "0.9rem", resize: "vertical", boxSizing: "border-box", outline: "none", fontFamily: "inherit", lineHeight: 1.7 }} />
                    </div>

                    {/* Author */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                        <div>
                            <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "rgba(255,255,255,0.5)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Your name</label>
                            <input value={name} onChange={e => setName(e.target.value)} placeholder="Jane Smith"
                                style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 9, padding: "11px 14px", color: "#fff", fontSize: "0.9rem", boxSizing: "border-box", outline: "none", fontFamily: "inherit" }} />
                        </div>
                        <div>
                            <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "rgba(255,255,255,0.5)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                                Email <span style={{ color: "rgba(255,255,255,0.25)", textTransform: "none", fontSize: "0.72rem" }}>(not displayed)</span>
                            </label>
                            <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="you@example.com"
                                style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 9, padding: "11px 14px", color: "#fff", fontSize: "0.9rem", boxSizing: "border-box", outline: "none", fontFamily: "inherit" }} />
                        </div>
                    </div>

                    {error && <p style={{ color: "#f87171", fontSize: "0.875rem", margin: 0 }}>{error}</p>}

                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                        <button type="submit" disabled={posting}
                            style={{ background: posting ? "rgba(211,167,61,0.5)" : "#D3A73D", color: "#0f172a", fontWeight: 700, fontSize: "0.9rem", padding: "13px 28px", borderRadius: 10, border: "none", cursor: posting ? "default" : "pointer" }}>
                            {posting ? "Posting…" : "Post Thread"}
                        </button>
                        <Link href="/community" style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.875rem", textDecoration: "none" }}>Cancel</Link>
                    </div>
                </form>
            </div>
        </main>
    );
}

export default function NewThreadPage() {
    return (
        <Suspense>
            <NewThreadForm />
        </Suspense>
    );
}

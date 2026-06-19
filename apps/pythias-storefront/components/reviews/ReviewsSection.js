"use client";
import { useEffect, useState } from "react";
import { useCustomer } from "@/components/account/CustomerProvider";

const Stars = ({ value = 0, size = 16, onPick }) => (
    <span style={{ display: "inline-flex", gap: 1, fontSize: size, color: "#f59e0b", cursor: onPick ? "pointer" : "default" }}>
        {[1, 2, 3, 4, 5].map((n) => (
            <span key={n} onClick={onPick ? () => onPick(n) : undefined} style={{ lineHeight: 1 }}>{n <= Math.round(value) ? "★" : "☆"}</span>
        ))}
    </span>
);

export default function ReviewsSection({ productId }) {
    const { customer } = useCustomer();
    const [data, setData] = useState(null);
    const [writing, setWriting] = useState(false);

    const load = () => {
        const token = typeof window !== "undefined" ? localStorage.getItem("sf_token") : null;
        return fetch(`/api/products/${productId}/reviews`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
            .then((r) => r.json()).then((d) => !d.error && setData(d)).catch(() => {});
    };
    useEffect(() => { load(); }, [productId, customer]);

    if (!data) return null;
    const { summary, reviews, canReview, verifiedOnly, signedIn } = data;

    return (
        <section style={{ borderTop: "1px solid rgba(0,0,0,0.08)", marginTop: 40, paddingTop: 32 }}>
            <h2 style={{ margin: "0 0 16px", fontSize: "1.4rem" }}>Reviews</h2>

            <div style={{ display: "flex", gap: 32, flexWrap: "wrap", alignItems: "flex-start" }}>
                {/* Score + distribution */}
                <div style={{ minWidth: 200 }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                        <span style={{ fontSize: "2.4rem", fontWeight: 800 }}>{summary.count ? summary.avg.toFixed(1) : "—"}</span>
                        <Stars value={summary.avg} size={18} />
                    </div>
                    <div style={{ color: "#64748b", fontSize: "0.88rem", marginBottom: 10 }}>{summary.count} review{summary.count === 1 ? "" : "s"}</div>
                    {[5, 4, 3, 2, 1].map((n) => {
                        const c = summary.distribution?.[n] || 0;
                        const pct = summary.count ? (c / summary.count) * 100 : 0;
                        return (
                            <div key={n} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.8rem", margin: "2px 0" }}>
                                <span style={{ width: 12 }}>{n}</span>
                                <div style={{ flex: 1, height: 6, background: "#f1f5f9", borderRadius: 3 }}><div style={{ width: `${pct}%`, height: "100%", background: "#f59e0b", borderRadius: 3 }} /></div>
                                <span style={{ width: 24, textAlign: "right", color: "#94a3b8" }}>{c}</span>
                            </div>
                        );
                    })}
                    {canReview ? (
                        <button onClick={() => setWriting((w) => !w)} style={{ marginTop: 14, padding: "10px 16px", borderRadius: 9, border: "1px solid rgba(0,0,0,0.18)", background: "#fff", fontWeight: 700, cursor: "pointer" }}>
                            Write a review
                        </button>
                    ) : verifiedOnly ? (
                        <div style={{ marginTop: 14, fontSize: "0.82rem", color: "#64748b", lineHeight: 1.5 }}>
                            {signedIn
                                ? "Only verified buyers who purchased this product can leave a review."
                                : <>Purchased this? <a href="/account" style={{ color: "var(--sf-secondary)", fontWeight: 600 }}>Sign in</a> to write a review.</>}
                        </div>
                    ) : (
                        <button onClick={() => setWriting((w) => !w)} style={{ marginTop: 14, padding: "10px 16px", borderRadius: 9, border: "1px solid rgba(0,0,0,0.18)", background: "#fff", fontWeight: 700, cursor: "pointer" }}>
                            Write a review
                        </button>
                    )}
                </div>

                {/* AI highlights */}
                {summary.aiSummary && (
                    <div style={{ flex: 1, minWidth: 260, background: "#f8fafc", borderRadius: 12, padding: 16 }}>
                        <div style={{ fontWeight: 700, fontSize: "0.82rem", color: "#635bff", marginBottom: 6 }}>✨ What customers say</div>
                        <p style={{ margin: "0 0 10px", fontSize: "0.92rem" }}>{summary.aiSummary}</p>
                        <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
                            {summary.aiPros?.length > 0 && <div><div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#16a34a" }}>Pros</div><ul style={{ margin: "4px 0 0", paddingLeft: 18, fontSize: "0.84rem" }}>{summary.aiPros.map((p, i) => <li key={i}>{p}</li>)}</ul></div>}
                            {summary.aiCons?.length > 0 && <div><div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#dc2626" }}>Cons</div><ul style={{ margin: "4px 0 0", paddingLeft: 18, fontSize: "0.84rem" }}>{summary.aiCons.map((p, i) => <li key={i}>{p}</li>)}</ul></div>}
                        </div>
                    </div>
                )}
            </div>

            {writing && <ReviewForm productId={productId} customer={customer} onDone={() => { setWriting(false); load(); }} />}

            {/* List */}
            <div style={{ marginTop: 24, display: "grid", gap: 16 }}>
                {reviews.length === 0 && <div style={{ color: "#94a3b8" }}>No reviews yet — be the first!</div>}
                {reviews.map((r) => <ReviewCard key={r.id} r={r} onHelpful={load} />)}
            </div>
        </section>
    );
}

function ReviewCard({ r, onHelpful }) {
    const helpful = async () => { await fetch(`/api/reviews/${r.id}/helpful`, { method: "POST" }); onHelpful(); };
    return (
        <div style={{ borderBottom: "1px solid rgba(0,0,0,0.06)", paddingBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <Stars value={r.rating} />
                <b style={{ fontSize: "0.92rem" }}>{r.title}</b>
                {r.verifiedBuyer && <span style={{ background: "#dcfce7", color: "#166534", fontSize: "0.72rem", fontWeight: 700, padding: "2px 8px", borderRadius: 999 }}>✓ Verified buyer</span>}
            </div>
            <div style={{ color: "#64748b", fontSize: "0.8rem", margin: "2px 0 6px" }}>{r.authorName} · {new Date(r.createdAt).toLocaleDateString()}</div>
            {r.body && <p style={{ margin: "0 0 8px", fontSize: "0.92rem", lineHeight: 1.6 }}>{r.body}</p>}
            {r.photos?.length > 0 && <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>{r.photos.map((p, i) => <img key={i} src={p} alt="" style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 8 }} />)}</div>}
            {r.aiTags?.length > 0 && <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>{r.aiTags.map((t, i) => <span key={i} style={{ fontSize: "0.72rem", background: "#f1f5f9", borderRadius: 999, padding: "2px 8px" }}>{t}</span>)}</div>}
            {r.sellerReply && <div style={{ background: "#f8fafc", borderRadius: 8, padding: 10, fontSize: "0.86rem", marginBottom: 6 }}><b>Seller response:</b> {r.sellerReply.body}</div>}
            <button onClick={helpful} style={{ background: "none", border: "1px solid rgba(0,0,0,0.15)", borderRadius: 8, padding: "4px 10px", fontSize: "0.8rem", cursor: "pointer", color: "#475569" }}>👍 Helpful ({r.helpfulCount})</button>
        </div>
    );
}

function ReviewForm({ productId, customer, onDone }) {
    const [f, setF] = useState({ rating: 0, title: "", body: "", authorName: customer?.name || "", email: customer?.email || "" });
    const [photos, setPhotos] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);
    const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
    const input = { width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid rgba(0,0,0,0.18)", fontSize: "0.92rem", boxSizing: "border-box" };

    const addPhoto = async (e) => {
        const file = e.target.files?.[0]; e.target.value = "";
        if (!file || photos.length >= 4) return;
        setUploading(true); setError(null);
        try {
            const dataUrl = await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(file); });
            const d = await (await fetch("/api/reviews/upload", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ dataUrl }) })).json();
            if (d.error) throw new Error(d.error);
            setPhotos((p) => [...p, d.url]);
        } catch (err) { setError(err.message); }
        finally { setUploading(false); }
    };

    const submit = async () => {
        if (!f.rating) { setError("Please pick a star rating."); return; }
        if (!f.authorName) { setError("Please add your name."); return; }
        setBusy(true); setError(null);
        try {
            const d = await (await fetch(`/api/products/${productId}/reviews`, { method: "POST", headers: { "Content-Type": "application/json", ...(typeof window !== "undefined" && localStorage.getItem("sf_token") ? { Authorization: `Bearer ${localStorage.getItem("sf_token")}` } : {}) }, body: JSON.stringify({ ...f, photos }) })).json();
            if (d.error) throw new Error(d.error);
            onDone();
        } catch (e) { setError(e.message); }
        finally { setBusy(false); }
    };

    return (
        <div style={{ marginTop: 20, background: "#fff", border: "1px solid rgba(0,0,0,0.1)", borderRadius: 12, padding: 18, display: "grid", gap: 10, maxWidth: 520 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}><span style={{ fontSize: "0.9rem", fontWeight: 600 }}>Your rating:</span><Stars value={f.rating} size={24} onPick={(n) => setF((s) => ({ ...s, rating: n }))} /></div>
            {!customer && <input style={input} placeholder="Your name" value={f.authorName} onChange={set("authorName")} />}
            {!customer && <input style={input} placeholder="Email" value={f.email} onChange={set("email")} />}
            <input style={input} placeholder="Title (optional)" value={f.title} onChange={set("title")} />
            <textarea style={{ ...input, minHeight: 90 }} placeholder="Share your experience" value={f.body} onChange={set("body")} />
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                {photos.map((p, i) => (
                    <div key={i} style={{ position: "relative" }}>
                        <img src={p} alt="" style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 8 }} />
                        <button onClick={() => setPhotos((s) => s.filter((_, j) => j !== i))} style={{ position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: 999, border: "none", background: "#dc2626", color: "#fff", cursor: "pointer", fontSize: 12, lineHeight: 1 }}>×</button>
                    </div>
                ))}
                {photos.length < 4 && <label style={{ width: 56, height: 56, borderRadius: 8, border: "1px dashed rgba(0,0,0,0.25)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#94a3b8", fontSize: "0.75rem" }}>{uploading ? "…" : "+ Photo"}<input type="file" accept="image/*" onChange={addPhoto} style={{ display: "none" }} /></label>}
            </div>
            {error && <div style={{ color: "#dc2626", fontSize: "0.86rem" }}>{error}</div>}
            <button onClick={submit} disabled={busy} style={{ padding: "11px", borderRadius: 9, border: "none", background: "var(--sf-accent, #f59e0b)", color: "#fff", fontWeight: 700, cursor: "pointer" }}>{busy ? "Submitting…" : "Submit review"}</button>
        </div>
    );
}

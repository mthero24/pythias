"use client";
import { useCallback, useEffect, useState } from "react";

const card = { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 16 };
const ghost = { padding: "7px 12px", borderRadius: 9, border: "1px solid #cbd5e1", background: "#fff", color: "#334155", fontWeight: 600, cursor: "pointer", fontSize: "0.82rem" };
const input = { width: "100%", padding: "9px 11px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: "0.9rem", boxSizing: "border-box" };
const Stars = ({ n }) => <span style={{ color: "#f59e0b" }}>{"★★★★★".slice(0, n)}{"☆☆☆☆☆".slice(0, 5 - n)}</span>;
const STATUS = { published: "#16a34a", pending: "#854d0e", rejected: "#991b1b" };

export default function ReviewsClient() {
    const [list, setList] = useState(null);
    const [filter, setFilter] = useState("");
    const load = useCallback(async () => {
        try { const d = await (await fetch(`/api/storefront/reviews${filter ? `?status=${filter}` : ""}`)).json(); setList(d.error ? [] : d.reviews); } catch { setList([]); }
    }, [filter]);
    useEffect(() => { load(); }, [load]);

    const act = async (id, action, body) => {
        await fetch(`/api/storefront/reviews/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, body }) });
        load();
    };

    return (
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "28px 20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                <div><h1 style={{ margin: 0 }}>Reviews</h1><p style={{ color: "#64748b", margin: "2px 0 0" }}>Reply to customers and moderate which reviews show on your store.</p></div>
                <select value={filter} onChange={(e) => setFilter(e.target.value)} style={{ ...input, width: 160 }}>
                    <option value="">All</option><option value="published">Published</option><option value="pending">Pending</option><option value="rejected">Rejected</option>
                </select>
            </div>
            <div style={{ display: "grid", gap: 12, marginTop: 18 }}>
                {list === null ? <div style={{ color: "#64748b" }}>Loading…</div> : list.length === 0 ? <div style={card}>No reviews.</div> :
                    list.map((r) => <Review key={r._id} r={r} act={act} />)}
            </div>
        </div>
    );
}

function Review({ r, act }) {
    const [reply, setReply] = useState(r.sellerReply?.body || "");
    const [open, setOpen] = useState(false);
    return (
        <div style={card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                <div><Stars n={r.rating} /> <b style={{ marginLeft: 6 }}>{r.title}</b> {r.verifiedBuyer && <span style={{ background: "#dcfce7", color: "#166534", fontSize: "0.7rem", fontWeight: 700, padding: "2px 8px", borderRadius: 999, marginLeft: 6 }}>✓ Verified</span>}</div>
                <span style={{ color: STATUS[r.status], fontWeight: 600, fontSize: "0.8rem", textTransform: "capitalize" }}>{r.status}</span>
            </div>
            <div style={{ color: "#64748b", fontSize: "0.8rem", margin: "2px 0 6px" }}>{r.authorName} · {new Date(r.createdAt).toLocaleDateString()}</div>
            {r.body && <p style={{ margin: "0 0 8px", fontSize: "0.9rem" }}>{r.body}</p>}
            {r.photos?.length > 0 && <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>{r.photos.map((p, i) => <img key={i} src={p} alt="" style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 6 }} />)}</div>}
            {r.sellerReply?.body && !open && <div style={{ background: "#f8fafc", borderRadius: 8, padding: 8, fontSize: "0.85rem", marginBottom: 8 }}><b>Your reply:</b> {r.sellerReply.body}</div>}

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button onClick={() => setOpen((o) => !o)} style={ghost}>{r.sellerReply?.body ? "Edit reply" : "Reply"}</button>
                {r.status !== "published" && <button onClick={() => act(r._id, "publish")} style={ghost}>Publish</button>}
                {r.status !== "rejected" && <button onClick={() => act(r._id, "reject")} style={{ ...ghost, color: "#dc2626" }}>Reject</button>}
            </div>
            {open && (
                <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
                    <textarea style={{ ...input, minHeight: 70 }} placeholder="Write a public reply…" value={reply} onChange={(e) => setReply(e.target.value)} />
                    <div><button onClick={() => { act(r._id, "reply", reply); setOpen(false); }} style={{ ...ghost, background: "#635bff", color: "#fff", border: "none" }}>Post reply</button></div>
                </div>
            )}
        </div>
    );
}

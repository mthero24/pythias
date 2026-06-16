"use client";
import { useEffect, useRef, useState } from "react";
import { AccountShell, card, primaryBtn } from "@/components/account/ui";
import { useCustomer, authHeaders } from "@/components/account/CustomerProvider";

// "My Images" — the buyer's reusable design-image library (uploaded + AI art). They can upload new
// images and delete old ones here; the same library powers the "Create your own" studio.
export default function MyImagesPage() {
    const { customer, ready } = useCustomer();
    const [uploads, setUploads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState("");
    const fileRef = useRef(null);

    useEffect(() => {
        if (!ready || !customer) return;
        (async () => {
            try { const d = await (await fetch("/api/account/uploads", { headers: authHeaders() })).json(); if (!d.error) setUploads(d.uploads || []); }
            catch { /* ignore */ } finally { setLoading(false); }
        })();
    }, [ready, customer]);

    const onUpload = (e) => {
        const f = e.target.files?.[0]; if (!f) return; setBusy(true); setMsg("");
        const reader = new FileReader();
        reader.onload = async () => {
            try {
                const up = await (await fetch("/api/customizer/upload", { method: "POST", headers: { "Content-Type": "application/json", ...authHeaders() }, body: JSON.stringify({ dataUrl: reader.result }) })).json();
                if (up.error) throw new Error(up.error);
                await fetch("/api/account/uploads", { method: "POST", headers: { "Content-Type": "application/json", ...authHeaders() }, body: JSON.stringify({ url: up.url }) });
                setUploads((u) => [up.url, ...u.filter((x) => x !== up.url)]);
            } catch (err) { setMsg(err.message); } finally { setBusy(false); if (fileRef.current) fileRef.current.value = ""; }
        };
        reader.readAsDataURL(f);
    };

    const remove = async (url) => {
        setUploads((u) => u.filter((x) => x !== url));
        try { await fetch("/api/account/uploads", { method: "DELETE", headers: { "Content-Type": "application/json", ...authHeaders() }, body: JSON.stringify({ url }) }); } catch { /* ignore */ }
    };

    return (
        <AccountShell active="/account/images">
            <div style={{ ...card }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: "1.2rem" }}>My Images</h2>
                        <div style={{ color: "#64748b", fontSize: "0.88rem" }}>Your saved artwork — use any of these in the design studio.</div>
                    </div>
                    <label style={{ ...primaryBtn, display: "inline-block" }}>
                        {busy ? "Uploading…" : "⬆ Upload image"}
                        <input ref={fileRef} type="file" accept="image/*" onChange={onUpload} style={{ display: "none" }} />
                    </label>
                </div>
                {msg && <div style={{ color: "#dc2626", fontSize: "0.88rem", marginBottom: 12 }}>{msg}</div>}

                {loading ? <div style={{ color: "#64748b", padding: "30px 0", textAlign: "center" }}>Loading…</div>
                    : uploads.length === 0 ? <div style={{ color: "#64748b", padding: "30px 0", textAlign: "center" }}>No images yet. Upload one above or generate art in the <a href="/create-your-own" style={{ color: "var(--sf-accent, #f59e0b)" }}>design studio</a>.</div>
                        : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: 12 }}>
                            {uploads.map((u) => (
                                <div key={u} style={{ position: "relative" }}>
                                    <div style={{ aspectRatio: "1", border: "1px solid rgba(0,0,0,0.1)", borderRadius: 10, background: "#f8fafc", overflow: "hidden" }}>
                                        <img src={`${u}?width=200&height=200`} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                                    </div>
                                    <button onClick={() => remove(u)} title="Delete" style={{ position: "absolute", top: -7, right: -7, width: 22, height: 22, borderRadius: "50%", border: "none", background: "#1e293b", color: "#fff", fontSize: "0.72rem", cursor: "pointer", lineHeight: 1 }}>✕</button>
                                </div>
                            ))}
                        </div>}
            </div>
        </AccountShell>
    );
}

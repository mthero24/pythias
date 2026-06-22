"use client";
import { useState } from "react";
import { authHeaders } from "@/components/account/CustomerProvider";
import { AccountShell, card, primaryBtn } from "@/components/account/ui";

export default function PasswordPage() {
    return <AccountShell active="/account/password"><ChangePassword /></AccountShell>;
}

function ChangePassword() {
    const [cur, setCur] = useState("");
    const [nw, setNw] = useState("");
    const [confirm, setConfirm] = useState("");
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState(null);

    const submit = async (e) => {
        e.preventDefault();
        setMsg(null);
        if (nw !== confirm) { setMsg({ ok: false, t: "New passwords don't match" }); return; }
        setBusy(true);
        try {
            const r = await fetch("/api/account/password", {
                method: "POST",
                headers: { "Content-Type": "application/json", ...authHeaders() },
                body: JSON.stringify({ currentPassword: cur, newPassword: nw }),
            });
            const d = await r.json();
            if (!r.ok || d.error) setMsg({ ok: false, t: d.error || "Could not change password" });
            else { setMsg({ ok: true, t: "Password updated." }); setCur(""); setNw(""); setConfirm(""); }
        } catch { setMsg({ ok: false, t: "Something went wrong" }); }
        setBusy(false);
    };

    const input = { padding: "11px 13px", borderRadius: 9, border: "1px solid rgba(0,0,0,0.18)", fontSize: "0.95rem", width: "100%", boxSizing: "border-box" };
    return (
        <form onSubmit={submit} style={{ ...card, display: "grid", gap: 12, maxWidth: 420 }}>
            <h2 style={{ margin: 0, fontSize: "1.1rem" }}>Change password</h2>
            <input style={input} type="password" placeholder="Current password" value={cur} onChange={(e) => setCur(e.target.value)} autoComplete="current-password" />
            <input style={input} type="password" placeholder="New password (min 8 characters)" value={nw} onChange={(e) => setNw(e.target.value)} autoComplete="new-password" />
            <input style={input} type="password" placeholder="Confirm new password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
            {msg && <div style={{ color: msg.ok ? "#16a34a" : "#dc2626", fontSize: "0.9rem" }}>{msg.t}</div>}
            <button type="submit" disabled={busy || !nw} style={primaryBtn}>{busy ? "Saving…" : "Update password"}</button>
        </form>
    );
}

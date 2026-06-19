"use client";
import { useState } from "react";

// Collapsible "Size Chart" for the product page — fed by the blank's structured size guide (set by the
// Fulfillment Cloud customer on the blank). Image + measurement table (Size + custom columns) + how-to notes.
export default function SizeChart({ guide }) {
    const [open, setOpen] = useState(true);
    if (!guide?.enabled) return null;
    const columns = (guide.columns || []).filter(Boolean);
    const rows = (guide.rows || []).filter((r) => r?.size);
    const notes = (guide.measureNotes || []).filter((n) => n?.title || n?.body);
    const image = guide.image || (guide.images || [])[0] || null;
    if (!rows.length && !image && !notes.length) return null;

    const cell = { padding: "12px 16px", fontSize: "0.9rem", textAlign: "left", borderBottom: "1px solid var(--sf-border, #eef1f5)" };
    const head = { ...cell, fontSize: "0.72rem", letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--sf-muted, #64748b)", fontWeight: 600 };

    return (
        <section style={{ marginTop: 44, borderTop: "1px solid var(--sf-border, #e5e7eb)", paddingTop: 28 }}>
            <button onClick={() => setOpen((o) => !o)} aria-expanded={open}
                style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", background: "none", border: "none", cursor: "pointer", padding: 0, color: "var(--sf-text)" }}>
                <h2 style={{ fontSize: "1.15rem", fontWeight: 700, margin: 0 }}>Size Chart</h2>
                <span style={{ fontSize: "1.5rem", lineHeight: 1 }}>{open ? "–" : "+"}</span>
            </button>

            {open && (
                <div style={{ marginTop: 18 }}>
                    {guide.unit && <div style={{ textAlign: "center", color: "var(--sf-muted, #64748b)", fontSize: "0.92rem", marginBottom: 18 }}>All measurements in {guide.unit}</div>}

                    <div style={{ display: "flex", flexWrap: "wrap", gap: 28, alignItems: "flex-start" }}>
                        {image && (
                            <div style={{ flex: "1 1 240px", maxWidth: 360, background: "#fff", border: "1px solid var(--sf-border, #eef1f5)", borderRadius: 12, padding: 16 }}>
                                <img src={image} alt="Size guide" style={{ width: "100%", height: "auto", objectFit: "contain", display: "block" }} />
                            </div>
                        )}
                        {rows.length > 0 && columns.length > 0 && (
                            <div style={{ flex: "2 1 420px", minWidth: 0, overflowX: "auto", border: "1px solid var(--sf-border, #eef1f5)", borderRadius: 12 }}>
                                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                    <thead>
                                        <tr style={{ background: "var(--sf-bg-alt, #f8fafc)" }}>
                                            <th style={head}>Size</th>
                                            {columns.map((c) => <th key={c} style={head}>{c}</th>)}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rows.map((r, ri) => (
                                            <tr key={ri}>
                                                <td style={{ ...cell, fontWeight: 700 }}>{r.size}</td>
                                                {columns.map((c, ci) => <td key={ci} style={{ ...cell, fontWeight: 600 }}>{r.values?.[ci] || ""}</td>)}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {notes.length > 0 && (
                        <div style={{ marginTop: 24, background: "var(--sf-bg-alt, #f8fafc)", border: "1px solid var(--sf-border, #eef1f5)", borderRadius: 12, padding: "18px 22px" }}>
                            {notes.map((n, i) => (
                                <div key={i} style={{ marginBottom: i < notes.length - 1 ? 14 : 0 }}>
                                    {n.title && <div style={{ fontWeight: 700, fontSize: "0.9rem", marginBottom: 4 }}>{n.title}</div>}
                                    {n.body && <div style={{ lineHeight: 1.65, fontSize: "0.9rem", color: "var(--sf-muted, #64748b)", whiteSpace: "pre-wrap" }}>{n.body}</div>}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </section>
    );
}

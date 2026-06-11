"use client";
import { useState, useEffect, useCallback } from "react";

const gridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 28,
    listStyle: "none",
    padding: 0,
    margin: 0,
};

const cardStyle = (idx) => ({
    gridColumn: idx === 0 ? "1 / 3" : idx === 1 ? "3 / 5" : "2 / 4",
    borderRadius: 16,
    overflow: "hidden",
    background: "#fff",
    border: "1px solid #e5e7eb",
    boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
    cursor: "zoom-in",
    transition: "box-shadow 0.2s, transform 0.2s",
});

const imgStyle = {
    width: "100%",
    height: "auto",
    display: "block",
    aspectRatio: "16/10",
    objectFit: "cover",
    background: "#e5e7eb",
};

const captionStyle = { padding: "18px 22px" };
const captionTitleStyle = { fontSize: "0.95rem", fontWeight: 700, color: "#111827", marginBottom: 5 };
const captionSubStyle   = { fontSize: "0.82rem", color: "#6b7280", lineHeight: 1.55, margin: 0 };

// ── Modal ─────────────────────────────────────────────────────────────────
function Modal({ screenshots, index, onClose, onPrev, onNext }) {
    const ss = screenshots[index];

    useEffect(() => {
        function onKey(e) {
            if (e.key === "Escape")    onClose();
            if (e.key === "ArrowLeft"  && index > 0)                      onPrev();
            if (e.key === "ArrowRight" && index < screenshots.length - 1) onNext();
        }
        window.addEventListener("keydown", onKey);
        document.body.style.overflow = "hidden";
        return () => {
            window.removeEventListener("keydown", onKey);
            document.body.style.overflow = "";
        };
    }, [index, onClose, onPrev, onNext, screenshots.length]);

    return (
        <div
            onClick={onClose}
            style={{
                position: "fixed", inset: 0, zIndex: 9999,
                background: "rgba(0,0,0,0.85)", backdropFilter: "blur(6px)",
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: "24px 16px",
            }}
        >
            {/* Close */}
            <button
                onClick={onClose}
                style={{
                    position: "absolute", top: 20, right: 20,
                    width: 40, height: 40, borderRadius: "50%",
                    background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)",
                    color: "#fff", fontSize: 20, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    lineHeight: 1, transition: "background 0.15s",
                }}
                aria-label="Close"
            >
                ×
            </button>

            {/* Prev */}
            {index > 0 && (
                <button
                    onClick={(e) => { e.stopPropagation(); onPrev(); }}
                    style={{
                        position: "absolute", left: 20, top: "50%", transform: "translateY(-50%)",
                        width: 44, height: 44, borderRadius: "50%",
                        background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)",
                        color: "#fff", fontSize: 22, cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "background 0.15s",
                    }}
                    aria-label="Previous"
                >
                    ‹
                </button>
            )}

            {/* Next */}
            {index < screenshots.length - 1 && (
                <button
                    onClick={(e) => { e.stopPropagation(); onNext(); }}
                    style={{
                        position: "absolute", right: 20, top: "50%", transform: "translateY(-50%)",
                        width: 44, height: 44, borderRadius: "50%",
                        background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)",
                        color: "#fff", fontSize: 22, cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "background 0.15s",
                    }}
                    aria-label="Next"
                >
                    ›
                </button>
            )}

            {/* Image container */}
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    maxWidth: "min(1100px, calc(100vw - 120px))",
                    width: "100%",
                    borderRadius: 16,
                    overflow: "hidden",
                    boxShadow: "0 32px 80px rgba(0,0,0,0.6)",
                    background: "#0f172a",
                }}
            >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={ss.src}
                    alt={ss.title}
                    style={{ width: "100%", height: "auto", display: "block" }}
                />
                <div style={{ padding: "18px 24px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                    <p style={{ margin: 0, fontWeight: 700, color: "#fff", fontSize: "0.95rem" }}>{ss.title}</p>
                    <p style={{ margin: "4px 0 0", color: "rgba(255,255,255,0.5)", fontSize: "0.82rem" }}>{ss.sub}</p>
                </div>
            </div>

            {/* Dot indicators */}
            <div style={{ position: "absolute", bottom: 20, display: "flex", gap: 8 }}>
                {screenshots.map((_, i) => (
                    <button
                        key={i}
                        onClick={(e) => { e.stopPropagation(); onPrev(); /* handled via index */ }}
                        style={{
                            width: i === index ? 20 : 8, height: 8,
                            borderRadius: 4,
                            background: i === index ? "#D3A73D" : "rgba(255,255,255,0.3)",
                            border: "none", cursor: "pointer", padding: 0,
                            transition: "all 0.2s",
                        }}
                        aria-label={`Go to ${i + 1}`}
                    />
                ))}
            </div>
        </div>
    );
}

// ── Gallery ───────────────────────────────────────────────────────────────
export default function ScreenshotGallery({ screenshots }) {
    const [active, setActive] = useState(null);

    const close = useCallback(() => setActive(null), []);
    const prev  = useCallback(() => setActive(i => Math.max(0, i - 1)), []);
    const next  = useCallback(() => setActive(i => Math.min(screenshots.length - 1, i + 1)), [screenshots.length]);

    return (
        <>
            <ul style={gridStyle}>
                {screenshots.map((ss, idx) => (
                    <li
                        key={ss.title}
                        style={cardStyle(idx)}
                        onClick={() => setActive(idx)}
                        onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 8px 36px rgba(0,0,0,0.12)"; e.currentTarget.style.transform = "translateY(-4px)"; }}
                        onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 4px 24px rgba(0,0,0,0.07)"; e.currentTarget.style.transform = "none"; }}
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={ss.src} alt={ss.title} style={imgStyle} />
                        <div style={captionStyle}>
                            <p style={captionTitleStyle}>{ss.title}</p>
                            <p style={captionSubStyle}>{ss.sub}</p>
                        </div>
                    </li>
                ))}
            </ul>

            {active !== null && (
                <Modal
                    screenshots={screenshots}
                    index={active}
                    onClose={close}
                    onPrev={prev}
                    onNext={next}
                />
            )}
        </>
    );
}

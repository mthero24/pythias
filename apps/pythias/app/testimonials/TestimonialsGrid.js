"use client";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Dialog, DialogContent, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import s from "./testimonials.module.css";

function initials(name) {
    return (name || "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

function Stars({ rating = 5 }) {
    return (
        <div className={s.stars}>
            {Array.from({ length: 5 }).map((_, i) => (
                <span key={i} className={s.star} style={{ color: i < rating ? "#fbbf24" : "#e5e7eb" }}>★</span>
            ))}
        </div>
    );
}

function VideoModal({ item, onClose }) {
    const videoRef = useRef();
    useEffect(() => { videoRef.current?.play?.(); }, []);
    return (
        <Dialog open onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3, overflow: "hidden", bgcolor: "#0f172a" } }}>
            <IconButton onClick={onClose} sx={{ position: "absolute", top: 8, right: 8, color: "rgba(255,255,255,0.7)", zIndex: 1 }}>
                <CloseIcon />
            </IconButton>
            <DialogContent sx={{ p: 0 }}>
                <video ref={videoRef} src={item.videoUrl} controls className={s.modalVideo} />
                <div style={{ padding: "0 20px 20px" }}>
                    <div className={s.modalPerson}>
                        <div className={s.modalAvatar}>{initials(item.customerName)}</div>
                        <div>
                            <p className={s.modalName}>{item.customerName}</p>
                            <p className={s.modalMeta}>{[item.role, item.company].filter(Boolean).join(" · ")}</p>
                            <div className={s.modalStars}><Stars rating={item.rating} /></div>
                        </div>
                    </div>
                    {item.description && (
                        <p style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.65)", lineHeight: 1.7, marginTop: 12, fontStyle: "italic" }}>
                            &ldquo;{item.description}&rdquo;
                        </p>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default function TestimonialsGrid() {
    const [items, setItems]     = useState([]);
    const [loading, setLoading] = useState(true);
    const [active, setActive]   = useState(null);

    useEffect(() => {
        fetch("/api/testimonials")
            .then(r => r.json())
            .then(d => { setItems(d.testimonials || []); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div style={{ display: "flex", justifyContent: "center", padding: "80px 0", gap: 12 }}>
                {[1, 2, 3].map(i => (
                    <div key={i} style={{ width: 320, height: 280, borderRadius: 20, background: "#e5e7eb", animation: "pulse 1.5s infinite" }} />
                ))}
            </div>
        );
    }

    if (items.length === 0) {
        return <div className={s.empty}><p>Customer testimonials coming soon.</p></div>;
    }

    return (
        <>
            <div className={s.grid}>
                {items.map((item) => (
                    <div key={item._id} className={s.card} onClick={() => setActive(item)}>
                        <div className={s.thumbWrap}>
                            {item.thumbnailUrl ? (
                                <Image src={item.thumbnailUrl} alt={item.customerName} className={s.thumb} fill style={{ objectFit: "cover" }} unoptimized />
                            ) : (
                                <div className={s.thumbPlaceholder}>
                                    <div className={s.avatar} style={{ width: 64, height: 64, fontSize: "1.4rem" }}>
                                        {initials(item.customerName)}
                                    </div>
                                </div>
                            )}
                            <div className={s.playOverlay}>
                                <div className={s.playBtn}>
                                    <div className={s.playIcon} />
                                </div>
                            </div>
                        </div>
                        <div className={s.cardBody}>
                            <Stars rating={item.rating} />
                            {item.description && <p className={s.quote}>&ldquo;{item.description}&rdquo;</p>}
                            <div className={s.person}>
                                <div className={s.avatar}>{initials(item.customerName)}</div>
                                <div>
                                    <p className={s.name}>{item.customerName}</p>
                                    <p className={s.meta}>{[item.role, item.company].filter(Boolean).join(" · ")}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {active && <VideoModal item={active} onClose={() => setActive(null)} />}
        </>
    );
}

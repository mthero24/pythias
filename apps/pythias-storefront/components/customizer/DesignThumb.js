"use client";

// A small DOM mockup of a saved design's FRONT: the garment image with the placed art + text laid
// over it (objects are positioned in the studio's 560-px canvas space, scaled down here). We use DOM
// <img>/<span> instead of a canvas snapshot because the art CDN sends no CORS headers (a canvas
// export would taint), but plain <img> tags display fine.
const CANVAS = 560;

export default function DesignThumb({ thumbnail, preview = [], size = 56, radius = 10 }) {
    const scale = size / CANVAS;
    return (
        <div style={{ width: size, height: size, borderRadius: radius, background: "#f8fafc", overflow: "hidden", position: "relative", flexShrink: 0 }}>
            {thumbnail && <img src={`${thumbnail}?width=200&height=200`} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain" }} />}
            {preview.map((o, i) => {
                const w = (o.width || 0) * (o.scaleX || 1) * scale;
                const h = (o.height || 0) * (o.scaleY || 1) * scale;
                const common = {
                    position: "absolute", left: (o.left || 0) * scale, top: (o.top || 0) * scale,
                    transform: `translate(-50%, -50%) rotate(${o.angle || 0}deg)`, transformOrigin: "center",
                };
                if (o.type === "image" && o.src) {
                    return <img key={i} src={`${o.src}?width=200&height=200`} alt="" style={{ ...common, width: w, height: h, objectFit: "contain" }} />;
                }
                if (o.type === "i-text") {
                    return <span key={i} style={{ ...common, color: o.fill || "#111", fontFamily: o.fontFamily || "inherit", fontSize: Math.max(4, (o.fontSize || 24) * (o.scaleY || 1) * scale), fontWeight: 700, lineHeight: 1, whiteSpace: "nowrap" }}>{o.text}</span>;
                }
                return null;
            })}
        </div>
    );
}

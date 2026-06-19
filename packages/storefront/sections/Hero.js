// Hero section — headline, subheadline, a background (color and/or image), optional foreground
// overlay images layered on top (e.g. product cut-outs), and a CTA button.
export default function Hero({ settings = {} }) {
    const { headline, subheadline, backgroundImage, backgroundColor, overlayImages, ctaText, ctaLink, align = "center", height } = settings;
    const hasBg = !!backgroundImage;
    const overlays = (Array.isArray(overlayImages) ? overlayImages : []).map((o) => (typeof o === "string" ? o : o?.image)).filter(Boolean);
    const h = Number(height) > 0 ? Number(height) : null;
    // Over a photo we use light text; over a solid color we keep the theme text color (sellers usually pick a light bar).
    const onImage = hasBg;
    const bg = hasBg
        ? `linear-gradient(rgba(0,0,0,0.35),rgba(0,0,0,0.35)), url(${backgroundImage})`
        : "none";
    return (
        <section
            style={{
                position: "relative",
                minHeight: h ? `${h}px` : undefined,
                padding: h ? "32px 0" : (hasBg ? "120px 0" : "80px 0"),
                display: h ? "flex" : "block",
                alignItems: h ? "center" : undefined,
                color: onImage ? "#fff" : "var(--sf-text)",
                textAlign: align,
                backgroundColor: backgroundColor || (hasBg ? undefined : "transparent"),
                backgroundImage: bg,
                backgroundSize: "cover",
                backgroundPosition: "center",
            }}
        >
            <div className="sf-container" style={{ width: "100%" }}>
                {headline && <h1 style={{ fontSize: "2.75rem", margin: "0 0 12px", lineHeight: 1.1 }}>{headline}</h1>}
                {subheadline && <p style={{ fontSize: "1.15rem", opacity: 0.9, margin: "0 0 24px", maxWidth: 640, marginInline: align === "center" ? "auto" : 0 }}>{subheadline}</p>}
                {ctaText && (
                    <a href={ctaLink || "#"} style={{
                        display: "inline-block", padding: "12px 28px", borderRadius: 8,
                        background: "var(--sf-accent)", color: "#fff", fontWeight: 600,
                    }}>{ctaText}</a>
                )}
                {overlays.length > 0 && (
                    <div style={{
                        display: "flex", flexWrap: "wrap", gap: 18, marginTop: 32,
                        justifyContent: align === "left" ? "flex-start" : align === "right" ? "flex-end" : "center",
                        alignItems: "flex-end",
                    }}>
                        {overlays.slice(0, 6).map((src, i) => (
                            <img key={i} src={src} alt="" style={{
                                height: "clamp(120px, 18vw, 220px)", width: "auto", maxWidth: "100%",
                                objectFit: "contain", borderRadius: 12,
                                filter: "drop-shadow(0 18px 30px rgba(0,0,0,0.28))",
                            }} />
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}

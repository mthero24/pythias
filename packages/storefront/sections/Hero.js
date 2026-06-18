// Hero section — headline, subheadline, optional background image + height, CTA button.
export default function Hero({ settings = {} }) {
    const { headline, subheadline, backgroundImage, ctaText, ctaLink, align = "center", height } = settings;
    const hasBg = !!backgroundImage;
    const h = Number(height) > 0 ? Number(height) : null;
    return (
        <section
            style={{
                position: "relative",
                minHeight: h ? `${h}px` : undefined,
                padding: h ? "32px 0" : (hasBg ? "120px 0" : "80px 0"),
                display: h ? "flex" : "block",
                alignItems: h ? "center" : undefined,
                color: hasBg ? "#fff" : "var(--sf-text)",
                textAlign: align,
                backgroundImage: hasBg ? `linear-gradient(rgba(0,0,0,0.35),rgba(0,0,0,0.35)), url(${backgroundImage})` : "none",
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
            </div>
        </section>
    );
}

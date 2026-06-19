// Default copy for the customizable system pages (overridden by site.system.{notFound,error}).
export const SPECIAL_DEFAULTS = {
    notFound: { code: "404", title: "Page not found", message: "Sorry — we couldn’t find the page you were looking for.", ctaText: "Back to shop", ctaLink: "/products" },
    error:    { title: "Something went wrong", message: "An unexpected error occurred on our end. Please try again.", ctaText: "Try again", ctaLink: "/" },
};

// Presentational 404 / error page body. Used by the storefront's not-found.js, error.js, and the
// editor preview routes so they all look identical.
export default function SpecialPage({ code, title, message, ctaText, ctaLink, onCta, backgroundImage }) {
    const cta = ctaText && (
        onCta
            ? <button onClick={onCta} style={btnStyle}>{ctaText}</button>
            : <a href={ctaLink || "/"} style={btnStyle}>{ctaText}</a>
    );
    const hasBg = !!backgroundImage;
    const section = hasBg
        ? { position: "relative", padding: "120px 0", textAlign: "center", minHeight: "62vh", display: "flex", alignItems: "center", backgroundImage: `url(${backgroundImage})`, backgroundSize: "cover", backgroundPosition: "center" }
        : { padding: "90px 0", textAlign: "center" };
    return (
        <section style={section}>
            {hasBg && <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)" }} />}
            <div className="sf-container" style={{ maxWidth: 620, position: "relative", margin: "0 auto", color: hasBg ? "#fff" : "inherit" }}>
                {code && <div style={{ fontSize: "4.5rem", fontWeight: 800, lineHeight: 1, opacity: hasBg ? 0.55 : 0.16 }}>{code}</div>}
                <h1 style={{ fontSize: "1.9rem", margin: "14px 0 10px" }}>{title}</h1>
                {message && <p style={{ fontSize: "1.05rem", opacity: hasBg ? 0.95 : 0.75, margin: "0 0 26px", whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{message}</p>}
                {cta}
            </div>
        </section>
    );
}

const btnStyle = {
    display: "inline-block", padding: "12px 28px", borderRadius: 8, border: "none", cursor: "pointer",
    background: "var(--sf-accent, #222)", color: "#fff", fontWeight: 600, fontSize: "1rem", textDecoration: "none",
};

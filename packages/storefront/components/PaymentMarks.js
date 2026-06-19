// Self-contained payment-method marks (no external/trademarked image files) — recognizable mini brand
// logos rendered as small white cards. Used in the footer's "accepted payments" row + the editor preview.
const DEFAULT_METHODS = ["visa", "mastercard", "amex", "discover", "paypal", "applepay", "googlepay"];

function Card({ children, bg = "#fff", w = 40, h = 26 }) {
    return (
        <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: w, height: h, background: bg, borderRadius: 4, boxShadow: "0 1px 2px rgba(0,0,0,0.25)", flexShrink: 0 }}>
            {children}
        </span>
    );
}

const MARKS = {
    visa: (k) => <Card key={k}><span style={{ color: "#1A1F71", fontWeight: 800, fontStyle: "italic", fontSize: 11, fontFamily: "Arial, sans-serif", letterSpacing: "-0.3px" }}>VISA</span></Card>,
    mastercard: (k) => <Card key={k}><span style={{ position: "relative", width: 28, height: 17, display: "inline-block" }}>
        <span style={{ position: "absolute", left: 1, top: 0.5, width: 16, height: 16, borderRadius: "50%", background: "#EB001B" }} />
        <span style={{ position: "absolute", right: 1, top: 0.5, width: 16, height: 16, borderRadius: "50%", background: "#F79E1B", mixBlendMode: "multiply" }} />
    </span></Card>,
    amex: (k) => <Card key={k} bg="#1F72CD"><span style={{ color: "#fff", fontWeight: 800, fontSize: 7.5, fontFamily: "Arial", letterSpacing: "0.3px" }}>AMEX</span></Card>,
    discover: (k) => <Card key={k}><span style={{ fontSize: 6.5, fontWeight: 800, color: "#222", fontFamily: "Arial", letterSpacing: "-0.2px" }}>DISC<span style={{ color: "#F76C00" }}>O</span>VER</span></Card>,
    paypal: (k) => <Card key={k}><span style={{ fontSize: 9.5, fontWeight: 800, fontFamily: "Arial", fontStyle: "italic" }}><span style={{ color: "#003087" }}>Pay</span><span style={{ color: "#0070E0" }}>Pal</span></span></Card>,
    applepay: (k) => <Card key={k} bg="#000"><span style={{ color: "#fff", fontSize: 9, fontWeight: 500, fontFamily: "system-ui, -apple-system, sans-serif" }}>&#63743; Pay</span></Card>,
    googlepay: (k) => <Card key={k}><span style={{ fontSize: 9, fontWeight: 700, fontFamily: "Arial" }}><span style={{ color: "#4285F4" }}>G</span><span style={{ color: "#5f6368" }}>&nbsp;Pay</span></span></Card>,
};

export default function PaymentMarks({ methods = DEFAULT_METHODS, gap = 7, style }) {
    // maxWidth:100% so the row wraps to its container instead of forcing horizontal page scroll on mobile.
    return (
        <span style={{ display: "inline-flex", flexWrap: "wrap", gap, alignItems: "center", maxWidth: "100%", ...style }}>
            {methods.map((m, i) => (MARKS[m] ? MARKS[m](i) : null))}
        </span>
    );
}

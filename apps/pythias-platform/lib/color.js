// Color math for ink matching — shared by the ink-mix API routes (server) and UI (client).
// hex (sRGB) → CIE-Lab, plus CIEDE2000 ΔE. No dependencies so it works in both contexts.
//
// NOTE: a hex code is not colorimetrically sufficient for physical ink matching (no spectral
// data, no substrate/opacity). ΔE against an org's own *measured* library is the honest use:
// it finds the closest recipe the shop has actually produced, and surfaces the ΔE so the
// operator can judge the match rather than trust it blindly.

export function hexToRgb(hex) {
    if (typeof hex !== "string") return null;
    let h = hex.trim().replace(/^#/, "");
    if (h.length === 3) h = h.split("").map((c) => c + c).join("");
    if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
    return {
        r: parseInt(h.slice(0, 2), 16),
        g: parseInt(h.slice(2, 4), 16),
        b: parseInt(h.slice(4, 6), 16),
    };
}

// sRGB (0–255) → linear
function toLinear(c) {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

// D65 reference white
const Xn = 95.047, Yn = 100.0, Zn = 108.883;

export function hexToLab(hex) {
    const rgb = hexToRgb(hex);
    if (!rgb) return null;
    const r = toLinear(rgb.r), g = toLinear(rgb.g), b = toLinear(rgb.b);
    // linear RGB → XYZ (sRGB / D65), scaled to 0–100
    const X = (r * 0.4124 + g * 0.3576 + b * 0.1805) * 100;
    const Y = (r * 0.2126 + g * 0.7152 + b * 0.0722) * 100;
    const Z = (r * 0.0193 + g * 0.1192 + b * 0.9505) * 100;
    const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
    const fx = f(X / Xn), fy = f(Y / Yn), fz = f(Z / Zn);
    return {
        L: 116 * fy - 16,
        a: 500 * (fx - fy),
        b: 200 * (fy - fz),
    };
}

// CIEDE2000. Returns perceptual color difference; < ~1 is imperceptible, < ~3 is a good
// production match, > ~5 is clearly off.
export function deltaE2000(lab1, lab2) {
    if (!lab1 || !lab2) return Infinity;
    const { L: L1, a: a1, b: b1 } = lab1;
    const { L: L2, a: a2, b: b2 } = lab2;
    const rad = Math.PI / 180, deg = 180 / Math.PI;

    const C1 = Math.hypot(a1, b1), C2 = Math.hypot(a2, b2);
    const Cbar = (C1 + C2) / 2;
    const G = 0.5 * (1 - Math.sqrt(Math.pow(Cbar, 7) / (Math.pow(Cbar, 7) + Math.pow(25, 7))));
    const a1p = (1 + G) * a1, a2p = (1 + G) * a2;
    const C1p = Math.hypot(a1p, b1), C2p = Math.hypot(a2p, b2);
    const h1p = Math.atan2(b1, a1p) === 0 ? 0 : ((Math.atan2(b1, a1p) * deg) + 360) % 360;
    const h2p = Math.atan2(b2, a2p) === 0 ? 0 : ((Math.atan2(b2, a2p) * deg) + 360) % 360;

    const dLp = L2 - L1;
    const dCp = C2p - C1p;
    let dhp;
    if (C1p * C2p === 0) dhp = 0;
    else if (Math.abs(h2p - h1p) <= 180) dhp = h2p - h1p;
    else if (h2p - h1p > 180) dhp = h2p - h1p - 360;
    else dhp = h2p - h1p + 360;
    const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin((dhp * rad) / 2);

    const Lbarp = (L1 + L2) / 2;
    const Cbarp = (C1p + C2p) / 2;
    let hbarp;
    if (C1p * C2p === 0) hbarp = h1p + h2p;
    else if (Math.abs(h1p - h2p) <= 180) hbarp = (h1p + h2p) / 2;
    else if (h1p + h2p < 360) hbarp = (h1p + h2p + 360) / 2;
    else hbarp = (h1p + h2p - 360) / 2;

    const T = 1 - 0.17 * Math.cos((hbarp - 30) * rad) + 0.24 * Math.cos(2 * hbarp * rad)
        + 0.32 * Math.cos((3 * hbarp + 6) * rad) - 0.20 * Math.cos((4 * hbarp - 63) * rad);
    const dTheta = 30 * Math.exp(-Math.pow((hbarp - 275) / 25, 2));
    const Rc = 2 * Math.sqrt(Math.pow(Cbarp, 7) / (Math.pow(Cbarp, 7) + Math.pow(25, 7)));
    const Sl = 1 + (0.015 * Math.pow(Lbarp - 50, 2)) / Math.sqrt(20 + Math.pow(Lbarp - 50, 2));
    const Sc = 1 + 0.045 * Cbarp;
    const Sh = 1 + 0.015 * Cbarp * T;
    const Rt = -Math.sin(2 * dTheta * rad) * Rc;

    return Math.sqrt(
        Math.pow(dLp / Sl, 2) +
        Math.pow(dCp / Sc, 2) +
        Math.pow(dHp / Sh, 2) +
        Rt * (dCp / Sc) * (dHp / Sh)
    );
}

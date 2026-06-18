// Image-collage section — customizable rows of clickable image tiles, where each spot in a row is a
// COLUMN that can hold one image or a vertical STACK of images (e.g. a tall image next to two stacked
// smaller ones). Tiles link to a search/collection/path (seasonal merchandising). Pure/presentational.
//
// settings.rows = [{ height, tiles: [ column ] }]
//   column = { width, cells: [{ image, label, sublabel, link }] }   (legacy: a flat {image,label,…,width})
const cellsOf = (col) => (col?.cells && col.cells.length)
    ? col.cells
    : [{ image: col?.image, label: col?.label, sublabel: col?.sublabel, link: col?.link }];

export default function ImageCollage({ settings = {} }) {
    const { heading, subheading, gap = 12, rounded = 14 } = settings;

    let rows = Array.isArray(settings.rows) ? settings.rows : null;
    if (!rows && Array.isArray(settings.tiles) && settings.tiles.length) {
        rows = [{ tiles: settings.tiles, height: Number(settings.height) || 240 }];
    }
    rows = (rows || [])
        .map((r) => ({
            height: Number(r?.height) || 240,
            cols: (r?.tiles || [])
                .map((col) => ({ width: Number(col?.width) > 0 ? Number(col.width) : 1, cells: cellsOf(col).filter((c) => c && (c.image || c.label)) }))
                .filter((col) => col.cells.length),
        }))
        .filter((r) => r.cols.length);
    if (!rows.length) return null;

    const Cell = (c, key) => (
        <a key={key} href={c.link || "#"} className="sf-collage-tile" style={{
            position: "relative", flex: "1 1 0", minHeight: 0, borderRadius: Number(rounded), overflow: "hidden",
            textDecoration: "none", background: c.image ? `#0001 url(${c.image}) center/cover no-repeat` : "var(--sf-accent, #222)",
        }}>
            <span style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.05) 45%, rgba(0,0,0,0) 70%)" }} />
            {c.label && (
                <span style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "14px 16px", color: "#fff", fontWeight: 800, fontSize: "1.18rem", letterSpacing: "-0.01em", lineHeight: 1.15, textShadow: "0 1px 8px rgba(0,0,0,0.4)" }}>
                    {c.label}
                    {c.sublabel && <span style={{ display: "block", fontWeight: 500, fontSize: "0.84rem", opacity: 0.92, marginTop: 3 }}>{c.sublabel}</span>}
                </span>
            )}
        </a>
    );

    return (
        <section style={{ padding: "44px 0" }}>
            <div className="sf-container">
                {heading && <h2 style={{ fontSize: "1.9rem", margin: "0 0 4px", textAlign: "center" }}>{heading}</h2>}
                {subheading && <p style={{ margin: "0 0 22px", textAlign: "center", color: "var(--sf-muted, #667)", fontSize: "1.02rem" }}>{subheading}</p>}
                {!heading && !subheading && <div style={{ height: 4 }} />}

                <div style={{ display: "flex", flexDirection: "column", gap: Number(gap) }}>
                    {rows.map((row, ri) => (
                        <div key={ri} className="sf-collage-row" style={{ display: "flex", gap: Number(gap), height: row.height }}>
                            {row.cols.map((col, ci) => (
                                <div key={ci} style={{ flex: `${col.width} 1 0`, minWidth: 0, height: "100%", display: "flex", flexDirection: "column", gap: Number(gap) }}>
                                    {col.cells.map((c, ki) => Cell(c, ki))}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

// Layout presets. A row is an array of columns; a column is either a number (width, single image) or
// { w, cells } where `cells` is how many images stack vertically in that column.
export const COLLAGE_PRESETS = [
    { id: "3-2-3",      label: "3 · 2 · 3",          rows: [[1, 1, 1], [1, 1], [1, 1, 1]],        height: 220 },
    { id: "1-2-3",      label: "1 · 2 · 3",          rows: [[1], [1, 1], [1, 1, 1]],              height: 220 },
    { id: "big-2",      label: "Big + 2 small",      rows: [[2, 1, 1]],                           height: 300 },
    { id: "tall-2stack", label: "Tall + 2 stacked",  rows: [[{ w: 1, cells: 1 }, { w: 1, cells: 2 }]], height: 380 },
    { id: "2stack-tall", label: "2 stacked + tall",  rows: [[{ w: 1, cells: 2 }, { w: 1, cells: 1 }]], height: 380 },
    { id: "feature-3stack", label: "Feature + 3 stacked", rows: [[{ w: 2, cells: 1 }, { w: 1, cells: 3 }]], height: 420 },
    { id: "2-wide",     label: "2 wide",             rows: [[1, 1]],                              height: 320 },
    { id: "grid-4",     label: "4 across",           rows: [[1, 1, 1, 1]],                        height: 240 },
];

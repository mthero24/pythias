/**
 * Polygon → ultra-fine boxes (1px tall), no merging.
 * Produces a pixel-perfect curve made of thin rectangles.
 */

function polygonToBoxes(points) {
    if (!points || points.length < 3) return [];

    const IMG_W = 400;
    const IMG_H = 400;

    // Find min/max Y
    let minY = Math.max(0, Math.floor(Math.min(...points.map(p => p.y))));
    let maxY = Math.min(IMG_H - 1, Math.ceil(Math.max(...points.map(p => p.y))));

    function scanlineIntersections(y) {
        const xs = [];

        for (let i = 0; i < points.length; i++) {
            const p1 = points[i];
            const p2 = points[(i + 1) % points.length];

            if (p1.y === p2.y) continue;

            const ymin = Math.min(p1.y, p2.y);
            const ymax = Math.max(p1.y, p2.y);

            if (y >= ymin && y < ymax) {
                const t = (y - p1.y) / (p2.y - p1.y);
                const x = p1.x + t * (p2.x - p1.x);
                xs.push(x);
            }
        }

        xs.sort((a, b) => a - b);

        const spans = [];
        for (let i = 0; i + 1 < xs.length; i += 2) {
            let x1 = Math.max(0, xs[i]);
            let x2 = Math.min(IMG_W, xs[i + 1]);

            if (x2 > x1) {
                spans.push({ x1, x2 });
            }
        }
        return spans;
    }

    // Generate 1px-tall boxes
    const finalBoxes = [];

    for (let y = minY; y <= maxY; y++) {
        const spans = scanlineIntersections(y + 0.5); // mid-scanline

        for (const span of spans) {
            const x = Math.floor(span.x1);
            const width = Math.ceil(span.x2 - span.x1);

            if (width > 0) {
                finalBoxes.push({
                    x,
                    y,
                    width,
                    height: 1,
                    id: `px-${x}-${y}`,
                    name: "rect",
                    fill: "#c58686ff",
                    rotation: 0
                });
            }
        }
    }

    return finalBoxes;
}

export default polygonToBoxes;

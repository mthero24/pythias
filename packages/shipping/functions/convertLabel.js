/**
 * Convert a shipping label between ZPL and PDF formats.
 *
 * ZPL → PDF: renders ZPL in-house using @napi-rs/canvas + bwip-js, wraps in PDF via pdfkit.
 * PDF → ZPL: renders the PDF page to a bitmap using pdfjs-dist + canvas,
 *             then encodes as a ZPL GRF (Graphic Field) command.
 *
 * Both directions are supported. All imports are dynamic so heavy modules are
 * only loaded when conversion is actually needed.
 *
 * @param {string} label  Raw ZPL string or base64-encoded PDF
 * @param {"ZPL"|"PDF"} fromFormat
 * @param {"ZPL"|"PDF"} toFormat
 * @param {{ dpmm?: number, width?: number, height?: number }} opts  Label dimensions (default: 8dpmm, 4×6 in)
 * @returns {Promise<{ label: string, format: string, converted: boolean, error?: string }>}
 */
export async function convertLabel(label, fromFormat, toFormat, opts = {}) {
    if (!label) return { label, format: fromFormat, converted: false, error: "No label provided" };
    if (fromFormat === toFormat) return { label, format: fromFormat, converted: false };

    if (fromFormat === "ZPL" && toFormat === "PDF") {
        return zplToPdf(label, opts);
    }

    if (fromFormat === "PDF" && toFormat === "ZPL") {
        return pdfToZpl(label, opts);
    }

    return { label, format: fromFormat, converted: false, error: `Unknown conversion: ${fromFormat} → ${toFormat}` };
}

// ── ZPL → PDF via in-house renderer ──────────────────────────────────────────

async function zplToPdf(zpl, opts = {}) {
    const dpmm    = opts.dpmm   ?? 8;
    const widthIn = opts.width  ?? 4;
    const heightIn= opts.height ?? 6;
    const dpi     = Math.round(dpmm * 25.4);

    let pngBuffer;
    try {
        const { renderZplToPng } = await import("./zplRenderer.js");
        pngBuffer = await renderZplToPng(zpl, { dpmm, widthIn, heightIn });
    } catch (e) {
        return { label: zpl, format: "ZPL", converted: false, error: `ZPL render failed: ${e.message}` };
    }

    try {
        const PDFDocument = (await import("pdfkit")).default;
        const pdfBuf = await new Promise((resolve, reject) => {
            const doc = new PDFDocument({ size: [widthIn * 72, heightIn * 72], margin: 0, autoFirstPage: true });
            const chunks = [];
            doc.on("data", c => chunks.push(c));
            doc.on("end",  () => resolve(Buffer.concat(chunks)));
            doc.on("error", reject);
            // embed PNG at full label size (72 pts per inch)
            doc.image(pngBuffer, 0, 0, { width: widthIn * 72, height: heightIn * 72 });
            doc.end();
        });
        const pdfBase64 = pdfBuf.toString("base64");
        return { label: pdfBase64, format: "PDF", converted: true };
    } catch (e) {
        return { label: zpl, format: "ZPL", converted: false, error: `PDF build failed: ${e.message}` };
    }
}

// ── PDF → ZPL via pdfjs-dist + canvas ────────────────────────────────────────

async function pdfToZpl(pdfBase64, opts = {}) {
    const dpmm = opts.dpmm ?? 8;
    const dpi = Math.round(dpmm * 25.4); // 203 for 8dpmm
    const threshold = opts.threshold ?? 128;

    let pdfDoc, page;
    try {
        // Dynamic import — heavy, only loaded when conversion is actually needed
        const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
        // Disable the web worker — required in Node.js
        pdfjsLib.GlobalWorkerOptions.workerSrc = "";
        const pdfBuffer = Buffer.from(pdfBase64, "base64");
        const loadingTask = pdfjsLib.getDocument({
            data: new Uint8Array(pdfBuffer),
            useWorkerFetch: false,
            isEvalSupported: false,
            useSystemFonts: true,
            disableFontFace: true,
        });
        pdfDoc = await loadingTask.promise;
        page = await pdfDoc.getPage(1);
    } catch (e) {
        return { label: pdfBase64, format: "PDF", converted: false, error: `PDF load failed: ${e.message}` };
    }

    let imageData, canvasWidth, canvasHeight;
    try {
        const { createCanvas } = await import("@napi-rs/canvas");
        const scale = dpi / 72; // PDF internal resolution is 72 DPI
        const viewport = page.getViewport({ scale });
        canvasWidth  = Math.round(viewport.width);
        canvasHeight = Math.round(viewport.height);

        const canvas = createCanvas(canvasWidth, canvasHeight);
        const ctx = canvas.getContext("2d");

        // White background (unprinted ZPL areas must be white/1-bit)
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        await page.render({ canvasContext: ctx, viewport }).promise;
        imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
    } catch (e) {
        return { label: pdfBase64, format: "PDF", converted: false, error: `Canvas render failed: ${e.message}` };
    }

    try {
        const zpl = bitmapToZpl(imageData.data, canvasWidth, canvasHeight, threshold);
        return { label: zpl, format: "ZPL", converted: true };
    } catch (e) {
        return { label: pdfBase64, format: "PDF", converted: false, error: `ZPL encoding failed: ${e.message}` };
    }
}

/**
 * Convert raw RGBA pixel data to a ZPL GRF (Graphic Field) string.
 * ZPL uses 1 bit per pixel: 1 = black (print), 0 = white (no print).
 */
function bitmapToZpl(pixelData, width, height, threshold = 128) {
    const bytesPerRow = Math.ceil(width / 8);
    const totalBytes = bytesPerRow * height;
    const rows = [];

    for (let y = 0; y < height; y++) {
        const rowNibbles = [];
        for (let byteIdx = 0; byteIdx < bytesPerRow; byteIdx++) {
            let byte = 0;
            for (let bit = 0; bit < 8; bit++) {
                const x = byteIdx * 8 + bit;
                if (x < width) {
                    const idx = (y * width + x) * 4;
                    const r = pixelData[idx];
                    const g = pixelData[idx + 1];
                    const b = pixelData[idx + 2];
                    // Perceived luminance — dark pixels print (1 bit set)
                    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
                    if (luminance < threshold) {
                        byte |= (0x80 >> bit);
                    }
                }
            }
            rowNibbles.push(byte.toString(16).padStart(2, "0").toUpperCase());
        }
        rows.push(rowNibbles.join(""));
    }

    const hexData = rows.join("");
    return `^XA\n^FO0,0\n^GFA,${totalBytes},${totalBytes},${bytesPerRow},\n${hexData}\n^XZ`;
}

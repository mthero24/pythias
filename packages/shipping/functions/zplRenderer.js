/**
 * In-house ZPL → PDF renderer.
 *
 * Supports the common subset of ZPL II commands used by shipping carriers:
 *   ^XA / ^XZ   label start/end
 *   ^FO          field origin (x, y)
 *   ^A           scalable font (^AF for FRU font, size)
 *   ^FD / ^FS    field data / field separator
 *   ^GFA         graphic field (1-bit hex bitmap with ZPL RLE)
 *   ^BC          Code 128 barcode
 *   ^BQ          QR Code
 *   ^GB          graphic box
 *   ^FX          comment (ignored)
 *   ^CF          default font
 *   ^BY          bar code defaults
 *   ^PQ          print quantity (ignored)
 *   ^LH          label home
 *   ^LL          label length
 *   ^PW          print width
 *
 * Output: PNG buffer (caller wraps in PDF with pdfkit).
 */

// ── ZPL RLE decoder ──────────────────────────────────────────────────────────

/**
 * Decode one line of ZPL hex data (with RLE) into a Uint8Array of bytes.
 * ZPL RLE encoding:
 *   G–Z  = repeat next char 1–20×
 *   g–z  = repeat next char 21–40×
 *   :    = repeat previous row (caller handles — returns null)
 *   ,    = fill rest of row with 0x00
 */
function decodeZplRow(encoded, bytesPerRow) {
    if (encoded === ":") return null; // repeat previous row signal

    const out = new Uint8Array(bytesPerRow);
    let outIdx = 0;
    let i = 0;

    while (i < encoded.length && outIdx < bytesPerRow) {
        const ch = encoded[i];

        // RLE prefix (ZPL uses mixed case: G-Z = 1-20, g-z = 21-40)
        let repeat = 1;
        if (ch >= "G" && ch <= "Z") {
            repeat = ch.charCodeAt(0) - 70; // "F"=70, so G=1 … Z=20
            i++;
        } else if (ch >= "g" && ch <= "z") {
            repeat = ch.charCodeAt(0) - 102; // "f"=102, so g=21 … z=40
            i++;
        }

        if (i >= src.length) break;

        if (encoded[i] === ",") {
            // fill rest of row with 0
            while (outIdx < bytesPerRow) out[outIdx++] = 0x00;
            i++;
            break;
        }

        // consume two hex nibbles (ZPL uses uppercase hex)
        const hexByte = encoded.slice(i, i + 2).toUpperCase();
        if (hexByte.length < 2) break;
        const byteVal = parseInt(hexByte, 16);
        i += 2;

        for (let r = 0; r < repeat && outIdx < bytesPerRow; r++) {
            out[outIdx++] = byteVal;
        }
    }

    return out;
}

/**
 * Decode a full ZPL GFA data string into a 2D byte array (array of rows).
 */
function decodeGfa(dataStr, bytesPerRow, height) {
    // Strip whitespace / newlines
    const clean = dataStr.replace(/[\s]/g, "");

    // Split into rows of (bytesPerRow * 2) hex chars each
    const rowLen = bytesPerRow * 2;
    const rows = [];
    for (let i = 0; i < clean.length; i += rowLen) {
        rows.push(clean.slice(i, i + rowLen));
    }

    const decoded = [];
    let lastRow = new Uint8Array(bytesPerRow);

    for (let r = 0; r < height; r++) {
        const rowStr = rows[r] ?? "";
        const result = decodeZplRow(rowStr, bytesPerRow);
        if (result === null) {
            // ":" = copy previous row
            decoded.push(new Uint8Array(lastRow));
        } else {
            decoded.push(result);
            lastRow = result;
        }
    }

    return decoded;
}

// ── ZPL command parser ────────────────────────────────────────────────────────

/**
 * Parse a ZPL string into a list of command objects.
 * Each command: { cmd: "GFA"|"FO"|"A"|"FD"|"BC"|"BQ"|"GB"|... , args: [...], raw: string }
 */
function parseZpl(zpl) {
    // Tokenise by ^
    const tokens = zpl.split("^").filter(Boolean);
    const commands = [];

    for (const tok of tokens) {
        const cmd = tok.slice(0, 2).toUpperCase();
        const rest = tok.slice(2);
        commands.push({ cmd, args: rest, raw: tok });
    }

    return commands;
}

// ── Renderer ──────────────────────────────────────────────────────────────────

/**
 * Render a ZPL string to a PNG buffer.
 *
 * @param {string} zpl
 * @param {{ dpmm?: number, widthIn?: number, heightIn?: number }} opts
 * @returns {Promise<Buffer>}  PNG buffer
 */
export async function renderZplToPng(zpl, opts = {}) {
    const { createCanvas } = await import("@napi-rs/canvas");
    const bwipjs = await import("bwip-js");

    const dpmm   = opts.dpmm    ?? 8;          // dots per mm (8 = 203 dpi)
    const dpi    = Math.round(dpmm * 25.4);    // 203
    const scale  = dpi / 72;                   // canvas pixels per ZPL dot (ZPL dot = 1/dpi in)
    // ZPL coordinates are in dots (1 dot = 1/dpi inch)
    const widthDots  = Math.round((opts.widthIn  ?? 4) * dpi);
    const heightDots = Math.round((opts.heightIn ?? 6) * dpi);

    const canvas = createCanvas(widthDots, heightDots);
    const ctx    = canvas.getContext("2d");

    // White background
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, widthDots, heightDots);

    const cmds   = parseZpl(zpl);
    let ox = 0, oy = 0;           // current field origin (^FO)
    let fontSize = 30;            // ^CF / ^A default
    let pendingText = null;       // text waiting for ^FD
    let pendingBarcode = null;    // barcode config waiting for ^FD
    let labelHome = { x: 0, y: 0 }; // ^LH

    for (let ci = 0; ci < cmds.length; ci++) {
        const { cmd, args } = cmds[ci];

        if (cmd === "LH") {
            const parts = args.split(",");
            labelHome = { x: +parts[0] || 0, y: +parts[1] || 0 };
            continue;
        }

        if (cmd === "FO") {
            const parts = args.split(",");
            ox = (+parts[0] || 0) + labelHome.x;
            oy = (+parts[1] || 0) + labelHome.y;
            pendingText    = null;
            pendingBarcode = null;
            continue;
        }

        if (cmd === "CF") {
            const parts = args.split(",");
            fontSize = +parts[1] || 30;
            continue;
        }

        if (cmd === "A") {
            // ^Afont,orientation,height,width — just grab height as font size
            const parts = args.split(",");
            // first char of args is font name; remaining are params
            const params = parts.join(",").replace(/^[A-Z@]/i, "").split(",");
            fontSize = +params[1] || fontSize;
            pendingText = "text";
            continue;
        }

        // ^FD field data
        if (cmd === "FD") {
            const text = args.replace(/\^FS.*/, "").replace(/\^.*/, "");
            if (pendingBarcode) {
                await drawBarcode(ctx, bwipjs, pendingBarcode, text, ox, oy);
                pendingBarcode = null;
            } else {
                // draw text
                ctx.fillStyle = "black";
                ctx.font = `${fontSize}px monospace`;
                ctx.fillText(text, ox, oy + fontSize);
            }
            pendingText = null;
            continue;
        }

        // ^GFA — graphic field
        if (cmd === "GFA" || cmd === "GF") {
            // ^GFA,totalBytes,totalBytes,bytesPerRow,data
            const commaIdx = args.indexOf(",");
            const rest1    = args.slice(commaIdx + 1);
            const c2       = rest1.indexOf(",");
            const rest2    = rest1.slice(c2 + 1);
            const c3       = rest2.indexOf(",");
            const bytesPerRowStr = rest2.slice(0, c3);
            const dataStr  = rest2.slice(c3 + 1);

            const bytesPerRow = parseInt(bytesPerRowStr, 10);
            const pixelWidth  = bytesPerRow * 8;
            // height inferred from data length
            const cleanData   = dataStr.replace(/[\s]/g, "");
            const height      = Math.floor(cleanData.length / (bytesPerRow * 2)) || 1;

            const rows = decodeGfa(dataStr, bytesPerRow, height);
            drawGfa(ctx, rows, pixelWidth, height, ox, oy);
            continue;
        }

        // ^GB graphic box
        if (cmd === "GB") {
            const parts = args.split(",");
            const w   = +parts[0] || 0;
            const h   = +parts[1] || 0;
            const t   = +parts[2] || 1;
            const col = parts[3] === "W" ? "white" : "black";
            ctx.strokeStyle = col;
            ctx.lineWidth   = t;
            ctx.strokeRect(ox + t / 2, oy + t / 2, w - t, h - t);
            if (parts[4] === "R") {
                // rounded — not drawn specially, skip
            }
            continue;
        }

        // ^BC Code 128
        if (cmd === "BC") {
            const parts = args.split(",");
            const heightPx   = +parts[1] || 100;
            const printHri   = parts[2] !== "N";
            pendingBarcode   = { type: "code128", heightPx, printHri, orientation: parts[0] };
            continue;
        }

        // ^BQ QR code
        if (cmd === "BQ") {
            const parts = args.split(",");
            const magnify = +parts[2] || 3;
            pendingBarcode = { type: "qrcode", magnify };
            continue;
        }

        // ^B3 Code 39
        if (cmd === "B3") {
            const parts = args.split(",");
            const heightPx = +parts[2] || 100;
            pendingBarcode = { type: "code39", heightPx };
            continue;
        }
    }

    return canvas.toBuffer("image/png");
}

// ── Drawing helpers ───────────────────────────────────────────────────────────

function drawGfa(ctx, rows, pixelWidth, height, ox, oy) {
    const imgData = ctx.createImageData(pixelWidth, height);
    const data    = imgData.data;

    for (let y = 0; y < height; y++) {
        const row = rows[y];
        if (!row) continue;
        for (let byteIdx = 0; byteIdx < row.length; byteIdx++) {
            const byte = row[byteIdx];
            for (let bit = 0; bit < 8; bit++) {
                const x   = byteIdx * 8 + bit;
                if (x >= pixelWidth) break;
                const idx = (y * pixelWidth + x) * 4;
                const on  = (byte >> (7 - bit)) & 1;
                const val = on ? 0 : 255; // ZPL: 1-bit = black print
                data[idx]     = val;
                data[idx + 1] = val;
                data[idx + 2] = val;
                data[idx + 3] = 255;
            }
        }
    }

    ctx.putImageData(imgData, ox, oy);
}

async function drawBarcode(ctx, bwipjs, config, text, ox, oy) {
    try {
        const { createCanvas } = await import("@napi-rs/canvas");
        const barcodeCanvas = createCanvas(1, 1); // bwip-js resizes it

        const bwipOpts = {
            bcid:        config.type === "qrcode" ? "qrcode" : config.type === "code39" ? "code39" : "code128",
            text:        text,
            scale:       config.magnify ?? 2,
            height:      config.heightPx ? Math.round(config.heightPx / 10) : 10,
            includetext: config.printHri ?? false,
            textxalign:  "center",
        };

        await bwipjs.toCanvas(barcodeCanvas, bwipOpts);
        ctx.drawImage(barcodeCanvas, ox, oy);
    } catch (e) {
        // Barcode render failed — draw placeholder text
        ctx.fillStyle = "black";
        ctx.font = "12px monospace";
        ctx.fillText(`[${text}]`, ox, oy + 12);
    }
}

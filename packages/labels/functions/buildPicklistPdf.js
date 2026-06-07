import PDFDocument from "pdfkit";
import { Base64Encode } from "base64-stream";
import axios from "axios";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BARCODE_FONT = join(__dirname, "public/fonts/LibreBarcode128-Regular.ttf");
const BARCODE39_FONT = join(__dirname, "public/fonts/LibreBarcode39-Regular.ttf");

// ── Column layout ─────────────────────────────────────────────────────────────
const PAGE_W  = 612;
const MARGIN  = 36;
const BODY_W  = PAGE_W - MARGIN * 2;   // 540pt
const ROW_H   = 56;
const HDR_H   = 18;

const FIXED_COLS = [
    { key: "barcode",  label: "BULK ID",   width: 190 },
    { key: "quantity", label: "QTY",        width: 44  },
    { key: "poNumber", label: "PO #",       width: 80  },
];
const FIXED_W = FIXED_COLS.reduce((s, c) => s + c.width, 0); // 314

const OPTIONAL_FIELDS = [
    { key: "colorName",    label: "Color"       },
    { key: "sizeName",     label: "Size"        },
    { key: "styleCode",    label: "Style"       },
    { key: "designSku",    label: "Design SKU"  },
    { key: "shippingType", label: "Shipping"    },
    { key: "type",         label: "Print Type"  },
    { key: "inventoryLoc", label: "Location"    },
];

function fieldValue(key, item) {
    switch (key) {
        case "colorName":    return item.colorName    ?? "";
        case "sizeName":     return item.sizeName     ?? "";
        case "styleCode":    return item.styleCode    ?? item.blankCode ?? "";
        case "designSku":    return item.designSku    ?? item.sku       ?? "";
        case "shippingType": return item.shippingType ?? "";
        case "type":         return item.type         ?? "";
        case "inventoryLoc": {
            const inv = item.inventory;
            if (!inv) return "";
            return `R${inv.row ?? "?"} U${inv.unit ?? "?"} S${inv.shelf ?? "?"} B${inv.bin ?? "?"}`;
        }
        default: return "";
    }
}

// ── Build the PDF as base64 ───────────────────────────────────────────────────
async function buildBase64(items, poNumber, template) {
    const enabledOpt = (template?.fields ?? [])
        .map(k => OPTIONAL_FIELDS.find(f => f.key === k))
        .filter(Boolean);

    const optW   = enabledOpt.length > 0 ? Math.floor((BODY_W - FIXED_W) / enabledOpt.length) : 0;
    const totalW = FIXED_W + optW * enabledOpt.length;

    return new Promise((resolve, reject) => {
        let base64 = "";
        const doc = new PDFDocument({ size: "LETTER", margin: MARGIN, autoFirstPage: true });
        doc.registerFont("Barcode", BARCODE_FONT);

        const enc = doc.pipe(new Base64Encode());
        enc.on("data", chunk => { base64 += chunk; });
        enc.on("end",  () => resolve(base64));
        enc.on("error", reject);

        // ── Page header ───────────────────────────────────────────────────────
        doc.font("Helvetica-Bold").fontSize(15).fillColor("#111827")
            .text(`Pick List — PO: ${poNumber}`, MARGIN, MARGIN, { width: totalW, align: "center" });
        doc.font("Helvetica").fontSize(8).fillColor("#6b7280")
            .text(new Date().toLocaleString("en-US"), MARGIN, MARGIN + 18, { width: totalW, align: "center" });

        let y = MARGIN + 42;

        const drawHeader = () => {
            doc.rect(MARGIN, y, totalW, HDR_H).fill("#e2e8f0");
            doc.font("Helvetica-Bold").fontSize(7).fillColor("#374151");
            let cx = MARGIN + 3;
            for (const col of FIXED_COLS) {
                doc.text(col.label, cx, y + 5, { width: col.width - 3 });
                cx += col.width;
            }
            for (const f of enabledOpt) {
                doc.text(f.label, cx, y + 5, { width: optW - 3 });
                cx += optW;
            }
            y += HDR_H;
        };

        drawHeader();

        items.forEach((item, i) => {
            if (y + ROW_H > 792 - MARGIN) {
                doc.addPage();
                y = MARGIN;
                drawHeader();
            }

            const bg = i % 2 === 0 ? "#ffffff" : "#f8fafc";
            doc.rect(MARGIN, y, totalW, ROW_H).fill(bg);
            doc.strokeColor("#e2e8f0").lineWidth(0.4).rect(MARGIN, y, totalW, ROW_H).stroke();

            // Barcode cell — Code128 font
            const barcodeText = item.bulkId ?? "";
            const midY = y + ROW_H / 2;
            try {
                doc.font("Barcode").fontSize(26).fillColor("#111827")
                    .text(barcodeText, MARGIN + 2, midY - 18, { width: FIXED_COLS[0].width - 4, align: "center" });
                doc.font("Helvetica").fontSize(6).fillColor("#6b7280")
                    .text(barcodeText, MARGIN + 2, midY + 10, { width: FIXED_COLS[0].width - 4, align: "center" });
            } catch {
                doc.font("Helvetica-Bold").fontSize(8).fillColor("#111827")
                    .text(barcodeText, MARGIN + 2, midY - 6, { width: FIXED_COLS[0].width - 4, align: "center" });
            }

            let cx = MARGIN + FIXED_COLS[0].width;

            // QTY
            doc.font("Helvetica-Bold").fontSize(14).fillColor("#111827")
                .text(String(item.quantity ?? ""), cx, midY - 9, { width: FIXED_COLS[1].width, align: "center" });
            cx += FIXED_COLS[1].width;

            // PO Number
            doc.font("Helvetica").fontSize(8).fillColor("#374151")
                .text(item.poNumber ?? poNumber ?? "", cx + 3, midY - 5, { width: FIXED_COLS[2].width - 3 });
            cx += FIXED_COLS[2].width;

            // Optional fields
            for (const f of enabledOpt) {
                const val = fieldValue(f.key, item);
                doc.font("Helvetica").fontSize(8).fillColor("#374151")
                    .text(val, cx + 3, midY - 5, { width: optW - 3 });
                cx += optW;
            }

            y += ROW_H;
        });

        // Footer
        const pageCount = doc.bufferedPageRange?.().count ?? 1;
        for (let p = 0; p < pageCount; p++) {
            doc.switchToPage?.(p);
            doc.font("Helvetica").fontSize(7).fillColor("#9ca3af")
                .text(`${items.length} bulk group${items.length !== 1 ? "s" : ""} · printed ${new Date().toLocaleDateString("en-US")}`,
                    MARGIN, 792 - MARGIN - 12, { width: BODY_W, align: "right" });
        }

        doc.end();
    });
}

// ── Public API ────────────────────────────────────────────────────────────────
export async function buildPicklistPdf({ items, poNumber, sc, printer = "printer1", template = {} }) {
    const base64 = await buildBase64(items, poNumber, template);

    await axios.post(
        `http://${sc.localIP}/api/print-labels-pdf`,
        { label: base64, printer, barcode: "picklist" },
        {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${sc.localKey}`,
            },
            timeout: 15_000,
        },
    ).catch(e => console.error("[picklist-pdf] printer error:", e.message));
}

import { Settings } from "@pythias/mongo";
import { LABEL_TEMPLATE_DEFAULT, PREMIER_DEFAULT_FIELDS, DEFAULT_FIELD_POSITIONS, SIZE_TO_ZPL } from "../lib/labelConstants.js";

const DPI = 203;

// Returns a display string for each optional field key
function fieldText(key, item, idx, totalQuantity) {
    switch (key) {
        case "itemNumber":
            return `#${idx + 1}`;
        case "styleCode":
            return item.styleCode ?? "";
        case "shipByDate":
            return new Date(item.shipByDate ?? item.date).toLocaleDateString("en-US");
        case "inventoryLoc":
            if (item.inventory?.inventoryType === "productInventory") {
                return `R LOC: ${item.inventory?.productInventory?.location ?? ""}`;
            }
            return [
                `Aisle:${item.inventory?.inventory?.row ?? ""}`,
                `Unit:${item.inventory?.inventory?.unit ?? ""}`,
                `Shelf:${item.inventory?.inventory?.shelf ?? ""}`,
                `Bin:${item.inventory?.inventory?.bin ?? ""}`,
            ].join(" ");
        case "color":
            return `Color: ${item.colorName ?? ""}`;
        case "size":
            return `Size: ${item.sizeName ?? ""}`;
        case "shippingType":
            return `Shipping: ${item.shippingType ?? ""}`;
        case "designSku":
            return `SKU: ${item.isBlank ? "Blank Item" : (item.designRef?.sku ?? item.sku ?? "")}`;
        case "orderCount":
            return `CNT ${totalQuantity}`;
        case "designName":
            return `Title: ${item.isBlank ? "Blank Item" : (item.designRef?.name ?? item.sku ?? "")}`;
        case "printType":
            return item.designRef?.printType ?? "DTF";
        case "printLocations": {
            const locs = Object.keys(item.design ?? {}).filter(l => item.design[l]);
            if (!locs.length) return "";
            const suffix = locs.length === 1 ? " Only" : "";
            return locs.join(" & ") + suffix;
        }
        case "blankCode":
            return `Blank: ${item.blank?.code ?? item.blank?.styleCode ?? ""}`;
        case "orderDate":
            return new Date(item.order?.date ?? item.date).toLocaleDateString("en-US");
        default:
            return "";
    }
}

function buildZPL(item, poNumber, idx, totalQuantity, template) {
    const widthDots  = Math.round(template.width  * DPI);
    const heightDots = Math.round(template.height * DPI);

    const lines = [];
    lines.push("^XA");
    lines.push(`^PW${widthDots}`);
    lines.push(`^LL${heightDots}`);

    // Fixed top — PO# and Piece ID
    lines.push(`^LH6,6^CFS,25,12^AXN,22,30^FO10,15^FDPO#: ${poNumber}^FS`);
    lines.push(`^LH6,6^CFS,25,12^AXN,22,30^FO10,35^FDPiece: ${item.pieceId}^FS`);

    // Barcode — position from template
    const barcodePos = template.fieldPositions?.barcode ?? DEFAULT_FIELD_POSITIONS.barcode;
    lines.push(`^FO${barcodePos.x},${barcodePos.y}^BY2^BC,100,N,N,N,A^FD${item.pieceId}^FS`);

    const positions = { ...DEFAULT_FIELD_POSITIONS, ...(template.fieldPositions ?? {}) };
    for (const key of (template.fields ?? [])) {
        const text = fieldText(key, item, idx, totalQuantity);
        if (!text) continue;
        const pos = positions[key] ?? { x: 10, y: 175, size: "sm", rotation: "N" };
        const { h, w } = SIZE_TO_ZPL[pos.size ?? "sm"] ?? SIZE_TO_ZPL.sm;
        const rot = pos.rotation ?? "N";
        lines.push(`^LH12,18^CFS,25,12^AX${rot},${h},${w}^FO${pos.x},${pos.y}^FD${text}^FS`);
    }

    lines.push("^XZ");
    return lines.join("\n");
}

/**
 * Load the org's label template from settings.
 * Falls back to the Premier default layout if not configured.
 */
async function loadTemplate() {
    const doc = await Settings.findOne({ key: "labelTemplate" }).lean();
    if (!doc?.value) return { ...LABEL_TEMPLATE_DEFAULT };
    try {
        return { ...LABEL_TEMPLATE_DEFAULT, ...JSON.parse(doc.value) };
    } catch {
        return { ...LABEL_TEMPLATE_DEFAULT };
    }
}

/**
 * Generate a pick label for one order item.
 *
 * @param {object} item           - Populated item document (same shape as labelString.js expects)
 * @param {string} poNumber       - Order PO number
 * @param {number} idx            - Zero-based position within the batch (for item number field)
 * @param {number} totalQuantity  - Total items in the order
 * @returns {Promise<{ label: string, format: "ZPL"|"PDF" }>}
 */
export async function generatePickLabel(item, poNumber, idx, totalQuantity) {
    const template = await loadTemplate();

    if (template.format === "ZPL") {
        return { label: buildZPL(item, poNumber, idx, totalQuantity, template), format: "ZPL" };
    }

    // PDF: return ZPL for now — PDF pick-label rendering is a separate enhancement
    return { label: buildZPL(item, poNumber, idx, totalQuantity, template), format: "ZPL" };
}

/**
 * Generate labels for a batch of items and return an array in print order.
 *
 * @param {object[]} items        - Array of populated item documents
 * @param {string}   poNumber     - Order PO number
 * @param {number}   totalQuantity
 * @returns {Promise<Array<{ label: string, format: "ZPL"|"PDF", pieceId: string }>>}
 */
export async function generatePickLabels(items, poNumber, totalQuantity) {
    const template = await loadTemplate();
    return items.map((item, idx) => ({
        pieceId: item.pieceId,
        format: template.format,
        label: buildZPL(item, poNumber, idx, totalQuantity, template),
    }));
}

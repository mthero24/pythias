import { PlatformItem, Settings } from "@pythias/mongo";
import { LABEL_TEMPLATE_DEFAULT, DEFAULT_FIELD_POSITIONS, SIZE_TO_ZPL } from "@pythias/backend/server";

const DPI = 203;

const MK_KEY_MAP = {
    "target": "target",
    "target plus us marketplace": "target",
    "walmart": "walmart",
    "walmart marketplace": "walmart",
    "kohls": "kohls",
    "kohl's": "kohls",
    "amazon": "amazon",
    "tiktok": "tiktok",
    "tiktok shop": "tiktok",
    "faire": "faire",
    "etsy": "etsy",
};
function marketplaceKey(marketplace) {
    return MK_KEY_MAP[(marketplace ?? "").toLowerCase()] ?? null;
}

function fieldText(key, item, idx, totalQuantity, poNumber) {
    switch (key) {
        case "upc":            return item.upc ?? "";
        case "poNumber":       return `PO#: ${item.order?.poNumber ?? poNumber ?? ""}`;
        case "pieceId":        return `Piece: ${item.pieceId ?? ""}`;
        case "itemNumber":     return `#${idx + 1}`;
        case "styleCode":      return item.styleCode ?? "";
        case "shipByDate":     return new Date(item.shipByDate ?? item.date).toLocaleDateString("en-US");
        case "inventoryLoc":
            if (item.inventory?.inventoryType === "productInventory")
                return `R LOC: ${item.inventory?.productInventory?.location ?? ""}`;
            return `Aisle:${item.inventory?.inventory?.row ?? ""} Unit:${item.inventory?.inventory?.unit ?? ""} Shelf:${item.inventory?.inventory?.shelf ?? ""} Bin:${item.inventory?.inventory?.bin ?? ""}`;
        case "color":          return `Color: ${item.colorName ?? ""}`;
        case "size":           return `Size: ${item.sizeName ?? ""}`;
        case "shippingType":   return `Shipping: ${item.shippingType ?? ""}`;
        case "designSku":      return `SKU: ${item.isBlank ? "Blank Item" : (item.designRef?.sku ?? item.sku ?? "")}`;
        case "orderCount":     return `CNT ${totalQuantity}`;
        case "designName":     return `Title: ${item.isBlank ? "Blank Item" : (item.designRef?.name ?? item.sku ?? "")}`;
        case "printType":      return item.designRef?.printType ?? "DTF";
        case "printLocations": {
            const locs = Object.keys(item.design ?? {}).filter(l => item.design[l]);
            if (!locs.length) return "";
            return locs.join(" & ") + (locs.length === 1 ? " Only" : "");
        }
        case "blankCode":      return `Blank: ${item.blank?.code ?? item.blank?.styleCode ?? ""}`;
        case "orderDate":      return new Date(item.order?.date ?? item.date).toLocaleDateString("en-US");
        default:               return "";
    }
}

function buildZPL(item, idx, poNumber, totalQuantity, template) {
    const widthDots = Math.round((template.width  ?? 2) * DPI);
    const heightDots = Math.round((template.height ?? 2) * DPI); // used for ^LL

    const lines = [
        "^XA",
        `^PW${widthDots}`,
        `^LL${heightDots}`,
        // Fixed top
        `^LH6,6^CFS,30,6^AXN,22,30^FO10,15^FDPO#: ${item.order?.poNumber ?? poNumber ?? ""}^FS`,
        `^LH6,6^CFS,30,6^AXN,22,30^FO10,35^FDPiece: ${item.pieceId}^FS`,
        // Barcode — position from template
        `^FO${(template.fieldPositions?.barcode?.x ?? 50)},${(template.fieldPositions?.barcode?.y ?? 55)}^BY2^BC,100,N,N,N,A^FD${item.pieceId}^FS`,
    ];

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

let _templateCache = null;
let _templateCacheTs = 0;
const TEMPLATE_TTL = 60_000;

async function loadTemplate() {
    if (_templateCache && Date.now() - _templateCacheTs < TEMPLATE_TTL) return _templateCache;
    const doc = await Settings.findOne({ key: "labelTemplate" }).lean();
    const tpl = doc?.value ? { ...LABEL_TEMPLATE_DEFAULT, ...JSON.parse(doc.value) } : { ...LABEL_TEMPLATE_DEFAULT };
    _templateCache = tpl;
    _templateCacheTs = Date.now();
    return tpl;
}

function buildSpecialCaseZPL(item, idx, sc, template, totalQuantity, poNumber) {
    const widthDots  = Math.round((template.width  ?? 2) * DPI);
    const heightDots = Math.round((template.height ?? 2) * DPI);
    const positions  = { ...DEFAULT_FIELD_POSITIONS, ...(sc.fieldPositions ?? {}) };
    const barcodePos = positions.barcode ?? { x: 50, y: 55 };
    const barcodeValue = sc.barcodeField === "pieceId" ? item.pieceId : (item.upc ?? "NO UPC");

    const lines = [
        "^XA",
        `^PW${widthDots}`,
        `^LL${heightDots}`,
        // Locked header — PO# + Piece always print at the top (matches the standard label + the creator).
        `^LH6,6^CFS,30,6^AXN,22,30^FO10,15^FDPO#: ${item.order?.poNumber ?? poNumber ?? ""}^FS`,
        `^LH6,6^CFS,30,6^AXN,22,30^FO10,35^FDPiece: ${item.pieceId ?? ""}^FS`,
        `^FO${barcodePos.x},${barcodePos.y}^BY2^BC,100,N,N,N,A^FD${barcodeValue}^FS`,
    ];

    for (const key of (sc.fields ?? [])) {
        if (key === "poNumber" || key === "pieceId") continue;   // already rendered as the locked header
        const text = fieldText(key, item, idx, totalQuantity, poNumber);
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
 * Build a ZPL label string for one item using the org's saved label template.
 * Special-case labels (per-marketplace) always print alongside the standard pick label.
 */
export async function buildLabelData(item, idx, poNumber, totalQuantity, template = null) {
    const tpl = template ?? await loadTemplate();

    if (totalQuantity == null) {
        totalQuantity = await PlatformItem.countDocuments({
            order: typeof item.order === "object" ? item.order._id : item.order,
            cancelled: false,
        });
    }

    const mkKey = marketplaceKey(item.order?.marketplace);
    const sc = mkKey ? (tpl.specialCases?.[mkKey] ?? null) : null;
    const specialLabel = sc?.enabled ? buildSpecialCaseZPL(item, idx, sc, tpl, totalQuantity, poNumber) : "";

    return specialLabel + buildZPL(item, idx, poNumber, totalQuantity, tpl);
}

/**
 * Load the label template once for use across a batch print job.
 * Call this at the start of a route handler and pass the result to buildLabelData.
 */
export { loadTemplate };

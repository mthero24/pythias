// Shared label template constants — imported by both client components and server functions.

export const PREMIER_DEFAULT_FIELDS = [
    "itemNumber", "styleCode", "shipByDate", "inventoryLoc",
    "color", "size", "shippingType", "designSku", "orderCount",
    "designName", "printType", "printLocations",
];

// Field sizes — map to ZPL ^AXN heights and pixel sizes in preview
// sm → 22/30  |  md → 30/35  |  lg → 40/50  |  xl → 75/90
export const FIELD_SIZES = ["sm", "md", "lg", "xl"];
export const SIZE_TO_ZPL = {
    sm: { h: 22, w: 30 },
    md: { h: 30, w: 35 },
    lg: { h: 40, w: 50 },
    xl: { h: 75, w: 90 },
};
export const SIZE_TO_PX = { sm: 8, md: 11, lg: 14, xl: 20 };

// Field rotations — ZPL orientation characters and CSS degrees
// N = normal  |  R = 90° CW  |  I = 180°  |  B = 270° CW (bottom-up)
export const FIELD_ROTATIONS = ["N", "R", "I", "B"];
export const ROTATION_TO_DEG = { N: 0, R: 90, I: 180, B: 270 };
export const ROTATION_LABELS = { N: "0°", R: "90°", I: "180°", B: "270°" };

// Default field positions in dots at 203 dpi (ZPL coordinate space), with size
export const DEFAULT_FIELD_POSITIONS = {
    barcode:        { x: 50,  y: 55  },
    itemNumber:     { x: 10,  y: 175, size: "sm" },
    styleCode:      { x: 100, y: 175, size: "xl" },
    shipByDate:     { x: 320, y: 70,  size: "sm" },
    inventoryLoc:   { x: 320, y: 100, size: "sm" },
    color:          { x: 10,  y: 230, size: "md" },
    size:           { x: 10,  y: 260, size: "sm" },
    shippingType:   { x: 200, y: 260, size: "sm" },
    designSku:      { x: 10,  y: 290, size: "sm" },
    orderCount:     { x: 200, y: 290, size: "sm" },
    designName:     { x: 10,  y: 320, size: "sm" },
    printType:      { x: 10,  y: 355, size: "md" },
    printLocations: { x: 100, y: 355, size: "md" },
    blankCode:      { x: 10,  y: 385, size: "sm" },
    orderDate:      { x: 10,  y: 415, size: "sm" },
};

export const LABEL_TEMPLATE_DEFAULT = {
    width: 2,
    height: 2,
    format: "ZPL",
    fields: PREMIER_DEFAULT_FIELDS,
    fieldPositions: DEFAULT_FIELD_POSITIONS,
    stackInventoryLoc: false,
};

// PO default — mirrors the existing bulkLabelString.js layout
export const PO_DEFAULT_FIELDS = [
    "itemNumber", "styleCode", "inventoryLoc", "color", "size",
    "shippingType", "designSku", "orderCount", "printType", "printLocations",
];

export const PO_DEFAULT_FIELD_POSITIONS = {
    barcode:        { x: 50,  y: 80  },
    itemNumber:     { x: 20,  y: 330, size: "sm" },
    styleCode:      { x: 120, y: 250, size: "xl" },
    inventoryLoc:   { x: 220, y: 310, size: "sm" },
    color:          { x: 20,  y: 360, size: "md" },
    size:           { x: 20,  y: 390, size: "md" },
    shippingType:   { x: 20,  y: 430, size: "sm" },
    designSku:      { x: 20,  y: 480, size: "sm" },
    orderCount:     { x: 150, y: 500, size: "sm" },
    printType:      { x: 20,  y: 230, size: "lg" },
    printLocations: { x: 20,  y: 460, size: "sm" },
};

export const PO_LABEL_TEMPLATE_DEFAULT = {
    width: 4,
    height: 3,
    format: "ZPL",
    fields: PO_DEFAULT_FIELDS,
    fieldPositions: { ...DEFAULT_FIELD_POSITIONS, ...PO_DEFAULT_FIELD_POSITIONS },
};

// ── Shelf / bin location labels ───────────────────────────────────────────────
// A separate template (stored under Settings key "shelfLabelTemplate") for the
// barcodes affixed to warehouse bins. Rendered from an inventory record, NOT an
// order item — the scannable barcode is the inventory `barcode_id`.
export const SHELF_LABEL_FIELDS = [
    { key: "barcodeText", label: "Barcode #",   sample: "1622" },
    { key: "location",    label: "Location",    sample: "R:1 U:C S:1 B:M" },
    { key: "row",         label: "Row",         sample: "Row: 1" },
    { key: "unit",        label: "Unit",        sample: "Unit: C" },
    { key: "shelf",       label: "Shelf",       sample: "Shelf: 1" },
    { key: "bin",         label: "Bin",         sample: "Bin: M" },
    { key: "sku",         label: "SKU",         sample: "SWT_dust_M_3838M_F" },
    { key: "blankCode",   label: "Style Code",  sample: "3838M" },
    { key: "colorName",   label: "Color",       sample: "Dust" },
    { key: "sizeName",    label: "Size",        sample: "M" },
    { key: "quantity",    label: "Quantity",    sample: "Qty: 114" },
];

export const SHELF_DEFAULT_FIELDS = ["barcodeText", "location", "sku", "colorName", "sizeName", "quantity"];

export const SHELF_DEFAULT_FIELD_POSITIONS = {
    barcode:     { x: 40,  y: 25 },
    barcodeText: { x: 40,  y: 132, size: "sm" },
    location:    { x: 40,  y: 162, size: "md" },
    row:         { x: 40,  y: 162, size: "sm" },
    unit:        { x: 140, y: 162, size: "sm" },
    shelf:       { x: 240, y: 162, size: "sm" },
    bin:         { x: 320, y: 162, size: "sm" },
    sku:         { x: 40,  y: 200, size: "sm" },
    blankCode:   { x: 40,  y: 228, size: "sm" },
    colorName:   { x: 40,  y: 228, size: "md" },
    sizeName:    { x: 220, y: 228, size: "md" },
    quantity:    { x: 40,  y: 262, size: "md" },
};

export const SHELF_LABEL_TEMPLATE_DEFAULT = {
    width: 2,
    height: 1.5,
    format: "ZPL",
    fields: SHELF_DEFAULT_FIELDS,
    fieldPositions: SHELF_DEFAULT_FIELD_POSITIONS,
};

// Resolve a shelf-label field's text from an inventory record (handles both the
// premier/platform `inventoryv2` shape — color_name/size_name/style_code — and a
// normalized colorName/sizeName/blankCode shape).
function shelfFieldText(key, rec) {
    const pick = (a, b) => rec[a] ?? rec[b] ?? "";
    switch (key) {
        case "barcodeText": return String(rec.barcode_id ?? "");
        case "location":    return `R:${rec.row ?? ""} U:${rec.unit ?? ""} S:${rec.shelf ?? ""} B:${rec.bin ?? ""}`;
        case "row":         return `Row: ${rec.row ?? ""}`;
        case "unit":        return `Unit: ${rec.unit ?? ""}`;
        case "shelf":       return `Shelf: ${rec.shelf ?? ""}`;
        case "bin":         return `Bin: ${rec.bin ?? ""}`;
        case "sku":         return rec.sku ?? "";
        case "blankCode":   return pick("blankCode", "style_code") || (rec.styleCode ?? "");
        case "colorName":   return pick("colorName", "color_name");
        case "sizeName":    return pick("sizeName", "size_name");
        case "quantity":    return `Qty: ${rec.quantity ?? 0}`;
        default:            return "";
    }
}

const SHELF_DPI = 203;

// Build a single shelf/bin ZPL label from an inventory record + the shelf template.
// The scannable barcode encodes the inventory `barcode_id`. Pure (no DB).
export function buildShelfLabelZPL(rec, template) {
    const tpl = { ...SHELF_LABEL_TEMPLATE_DEFAULT, ...(template ?? {}) };
    const widthDots  = Math.round((tpl.width  ?? 2)   * SHELF_DPI);
    const heightDots = Math.round((tpl.height ?? 1.5) * SHELF_DPI);
    const positions  = { ...SHELF_DEFAULT_FIELD_POSITIONS, ...(tpl.fieldPositions ?? {}) };
    const bcPos = positions.barcode ?? { x: 40, y: 25 };
    const bcVal = String(rec.barcode_id ?? "").trim();
    const lines = ["^XA", `^PW${widthDots}`, `^LL${heightDots}`];
    if (bcVal) lines.push(`^FO${bcPos.x},${bcPos.y}^BY2^BC,90,N,N,N,A^FD${bcVal}^FS`);
    for (const key of (tpl.fields ?? [])) {
        const text = shelfFieldText(key, rec);
        if (!text) continue;
        const pos = positions[key] ?? { x: 10, y: 175, size: "sm", rotation: "N" };
        const { h, w } = SIZE_TO_ZPL[pos.size ?? "sm"] ?? SIZE_TO_ZPL.sm;
        const rot = pos.rotation ?? "N";
        lines.push(`^LH12,18^CFS,25,12^AX${rot},${h},${w}^FO${pos.x},${pos.y}^FD${text}^FS`);
    }
    lines.push("^XZ");
    return lines.join("\n");
}

import { Items, Inventory, ProductInventory, Settings } from "@pythias/mongo";
import { LABEL_TEMPLATE_DEFAULT, DEFAULT_FIELD_POSITIONS, SIZE_TO_ZPL } from "@pythias/backend/server";

const DPI = 203;

// ── Template loader (60s cache) ───────────────────────────────────────────────
let _tplCache = null;
let _tplCacheTs = 0;
const TEMPLATE_TTL = 60_000;

export async function loadTemplate() {
    if (_tplCache && Date.now() - _tplCacheTs < TEMPLATE_TTL) return _tplCache;
    const doc = await Settings.findOne({ key: "labelTemplate" }).lean();
    const tpl = doc?.value ? { ...LABEL_TEMPLATE_DEFAULT, ...JSON.parse(doc.value) } : { ...LABEL_TEMPLATE_DEFAULT };
    _tplCache = tpl;
    _tplCacheTs = Date.now();
    return tpl;
}

// ── Marketplace key normalizer ────────────────────────────────────────────────
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

// ── Field text resolvers ──────────────────────────────────────────────────────
function fieldText(key, item, i, totalQuantity, poNumber) {
    switch (key) {
        case "upc":            return item.upc ?? "";
        case "poNumber":       return `PO#: ${item.order?.poNumber ?? poNumber ?? ""}`;
        case "pieceId":        return `Piece: ${item.pieceId ?? ""}`;
        case "itemNumber":     return `#${i + 1}`;
        case "styleCode":      return item.styleCode ?? "";
        case "shipByDate":     return new Date(item.shipByDate ?? item.date).toLocaleDateString("en-US");
        case "inventoryLoc":
            if (item.inventory?.inventoryType === "productInventory")
                return `R LOC: ${item.inventory?.productInventory?.location ?? ""}`;
            return [
                `Aisle:${item.inventory?.inventory?.row ?? ""}`,
                `Unit:${item.inventory?.inventory?.unit ?? ""}`,
                `Shelf:${item.inventory?.inventory?.shelf ?? ""}`,
                `Bin:${item.inventory?.inventory?.bin ?? ""}`,
            ].join(" ");
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

function buildZPL(item, i, poNumber, totalQuantity, template) {
    const widthDots  = Math.round((template.width  ?? 2) * DPI);
    const heightDots = Math.round((template.height ?? 2) * DPI);
    const positions  = { ...DEFAULT_FIELD_POSITIONS, ...(template.fieldPositions ?? {}) };
    const barcodePos = positions.barcode ?? { x: 50, y: 55 };

    const lines = [
        "^XA",
        `^PW${widthDots}`,
        `^LL${heightDots}`,
        `^LH6,6^CFS,30,6^AXN,22,30^FO10,15^FDPO#: ${item.order?.poNumber ?? poNumber ?? ""}^FS`,
        `^LH6,6^CFS,30,6^AXN,22,30^FO10,35^FDPiece: ${item.pieceId}^FS`,
        `^FO${barcodePos.x},${barcodePos.y}^BY2^BC,100,N,N,N,A^FD${item.pieceId}^FS`,
    ];

    for (const key of (template.fields ?? [])) {
        // Stacked inventory location — each component on its own ZPL line
        if (key === "inventoryLoc" && template.stackInventoryLoc) {
            const pos = positions[key] ?? { x: 10, y: 175, size: "sm", rotation: "N" };
            const { h, w } = SIZE_TO_ZPL[pos.size ?? "sm"] ?? SIZE_TO_ZPL.sm;
            const rot = pos.rotation ?? "N";
            if (item.inventory?.inventoryType === "productInventory") {
                const loc = item.inventory?.productInventory?.location;
                if (loc) lines.push(`^LH12,18^CFS,25,12^AX${rot},${h},${w}^FO${pos.x},${pos.y}^FDR LOC: ${loc}^FS`);
            } else {
                const inv = item.inventory?.inventory;
                const parts = [
                    inv?.row   != null ? `Aisle: ${inv.row}`   : null,
                    inv?.unit  != null ? `Unit:  ${inv.unit}`  : null,
                    inv?.shelf != null ? `Shelf: ${inv.shelf}` : null,
                    inv?.bin   != null ? `Bin:   ${inv.bin}`   : null,
                ].filter(Boolean);
                const lineSpacing = h + 6;
                for (let li = 0; li < parts.length; li++) {
                    lines.push(`^LH12,18^CFS,25,12^AX${rot},${h},${w}^FO${pos.x},${pos.y + li * lineSpacing}^FD${parts[li]}^FS`);
                }
            }
            continue;
        }

        const text = fieldText(key, item, i, totalQuantity);
        if (!text) continue;
        const pos = positions[key] ?? { x: 10, y: 175, size: "sm", rotation: "N" };
        const { h, w } = SIZE_TO_ZPL[pos.size ?? "sm"] ?? SIZE_TO_ZPL.sm;
        const rot = pos.rotation ?? "N";
        lines.push(`^LH12,18^CFS,25,12^AX${rot},${h},${w}^FO${pos.x},${pos.y}^FD${text}^FS`);
    }

    lines.push("^XZ");
    return lines.join("\n");
}

// ── Special-case label builder ────────────────────────────────────────────────
function buildSpecialCaseZPL(item, i, sc, template, totalQuantity, poNumber) {
    const widthDots  = Math.round((template.width  ?? 2) * DPI);
    const heightDots = Math.round((template.height ?? 2) * DPI);
    const positions  = { ...DEFAULT_FIELD_POSITIONS, ...(sc.fieldPositions ?? {}) };
    const barcodePos = positions.barcode ?? { x: 50, y: 55 };
    const barcodeValue = sc.barcodeField === "pieceId" ? item.pieceId : (item.upc ?? "NO UPC");

    const lines = [
        "^XA",
        `^PW${widthDots}`,
        `^LL${heightDots}`,
        `^FO${barcodePos.x},${barcodePos.y}^BY2^BC,100,N,N,N,A^FD${barcodeValue}^FS`,
    ];

    for (const key of (sc.fields ?? [])) {
        const text = fieldText(key, item, i, totalQuantity, poNumber);
        if (!text) continue;
        const pos = positions[key] ?? { x: 10, y: 175, size: "sm", rotation: "N" };
        const { h, w } = SIZE_TO_ZPL[pos.size ?? "sm"] ?? SIZE_TO_ZPL.sm;
        const rot = pos.rotation ?? "N";
        lines.push(`^LH12,18^CFS,25,12^AX${rot},${h},${w}^FO${pos.x},${pos.y}^FD${text}^FS`);
    }

    lines.push("^XZ");
    return lines.join("\n");
}

// ── Main export ───────────────────────────────────────────────────────────────
export const buildLabelData = async (item, i, poNumber, opts = {}, totalQuantity, template = null) => {
    // Resolve total quantity
    if (totalQuantity == null) {
        totalQuantity = await Items.find({ _id: { $in: item.order?.items ?? [] }, canceled: false }).countDocuments();
    }

    // Gift items have no inventory — skip all inventory management
    if (item.type !== "gift") {
        if (!item.inventory) item.inventory = {};
        if (!item.inventory.inventoryType) item.inventory.inventoryType = "inventory";

        if (item.inventory.inventoryType === "productInventory") {
            const piId = item.inventory.productInventory?._id ?? item.inventory.productInventory;
            if (piId) {
                const pi = await ProductInventory.findById(piId).select("location quantity onhold inStock");
                if (pi) {
                    pi.quantity -= 1;
                    if (pi.inStock) pi.inStock = pi.inStock.filter(id => id.toString() !== item._id.toString());
                    await pi.save();
                }
            }
        } else if (item.inventory.inventoryType === "inventory" && (item.blank?._id ?? item.blank)) {
            if (!item.inventory.inventory) {
                item.inventory.inventory = await Inventory.findOne({
                    blank:  item.blank?._id  ?? item.blank,
                    color:  item.color?._id  ?? item.color,
                    sizeId: item.size?._id   ?? item.size,
                }).select("row bin shelf unit quantity onhold");
            }
            const inv = item.inventory.inventory
                ? await Inventory.findById(item.inventory.inventory?._id ?? item.inventory.inventory).select("quantity onhold inStock attached")
                : null;
            if (inv) {
                inv.quantity -= 1;
                if (inv.inStock)  inv.inStock  = inv.inStock.filter(id => id.toString() !== item._id.toString());
                if (inv.attached) inv.attached = inv.attached.filter(id => id.toString() !== item._id.toString());
                await inv.save();
            }
        }
    } else if (!item.inventory) {
        item.inventory = {};
    }

    const tpl = template ?? await loadTemplate();

    // Determine if this order has a configured special-case label.
    // Template-driven config takes priority; fall back to the legacy hardcoded
    // Target label for orgs that haven't configured it in label settings yet.
    const mkKey = marketplaceKey(item.order?.marketplace);
    const sc = mkKey ? (tpl.specialCases?.[mkKey] ?? null) : null;

    let specialLabel = "";
    if (sc?.enabled) {
        specialLabel = buildSpecialCaseZPL(item, i, sc, tpl, totalQuantity, poNumber);
    } else if (item.order?.marketplace === "target" || item.order?.marketplace === "Target Plus US Marketplace") {
        specialLabel = [
            "^XA",
            `^FO100,50^BY2^BC,100,N,N,N,A^FD${item.upc ?? "no upc present"}^FS`,
            `^LH6,6^CFS,30,6^AXN,22,30^FO10,15^FDPO#: ${item.order?.poNumber ?? poNumber ?? ""}^FS`,
            `^LH6,6^CFS,30,6^AXN,22,30^FO10,35^FDPiece: ${item.pieceId}^FS`,
            `^LH12,18^CFS,25,12^AXN,22,30^FO10,175^FD#1^FS`,
            `^LH12,18^CFS,25,12^AXN,30,35^FO10,230^FDColor: ${item.colorName}, Size: ${item.sizeName}^FS`,
            `^LH12,18^CFS,25,12^AXN,22,30^FO10,290^FDSku: ${item.isBlank ? "Blank Item" : (item.designRef?.sku ?? item.sku)}^FS`,
            "^XZ",
        ].join("\n");
    }

    // Special-case label always prints alongside (before) the standard pick label — never instead of it.
    return specialLabel + buildZPL(item, i, poNumber, totalQuantity, tpl);
};

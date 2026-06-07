import { PlatformItem, Settings } from "@pythias/mongo";

const DPI = 203;

const LABEL_TEMPLATE_DEFAULT = {
    width: 2, height: 2, format: "ZPL",
    fields: ["itemNumber", "styleCode", "shipByDate", "color", "size", "shippingType", "designSku", "orderCount", "designName", "printType", "printLocations"],
};

function fieldText(key, item, idx, totalQuantity) {
    switch (key) {
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
    const widthDots  = Math.round((template.width  ?? 2) * DPI);
    const heightDots = Math.round((template.height ?? 2) * DPI);

    const lines = [
        "^XA",
        `^PW${widthDots}`,
        `^LL${heightDots}`,
        // Fixed top
        `^LH6,6^CFS,30,6^AXN,22,30^FO10,15^FDPO#: ${item.order?.poNumber ?? poNumber ?? ""}^FS`,
        `^LH6,6^CFS,30,6^AXN,22,30^FO10,35^FDPiece: ${item.pieceId}^FS`,
        // Fixed center barcode
        `^FO50,55^BY2^BC,100,N,N,N,A^FD${item.pieceId}^FS`,
    ];

    let y = 175;
    const rowH = 30;
    for (const key of (template.fields ?? [])) {
        const text = fieldText(key, item, idx, totalQuantity);
        if (!text) continue;
        lines.push(`^LH12,18^CFS,25,12^AXN,22,30^FO10,${y}^FD${text}^FS`);
        y += rowH;
        if (y + rowH > heightDots) break;
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

/**
 * Build a ZPL label string for one item using the org's saved label template.
 * Returns { zpl: string, format: "ZPL"|"PDF" }.
 */
export async function buildLabelData(item, idx, poNumber, totalQuantity, template = null) {
    const tpl = template ?? await loadTemplate();

    if (totalQuantity == null) {
        totalQuantity = await PlatformItem.countDocuments({
            order: typeof item.order === "object" ? item.order._id : item.order,
            cancelled: false,
        });
    }

    return buildZPL(item, idx, poNumber, totalQuantity, tpl);
}

/**
 * Load the label template once for use across a batch print job.
 * Call this at the start of a route handler and pass the result to buildLabelData.
 */
export { loadTemplate };

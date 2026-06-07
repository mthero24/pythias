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
};

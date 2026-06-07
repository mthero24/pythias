// Shared label template constants — imported by both client components and server functions.

export const PREMIER_DEFAULT_FIELDS = [
    "itemNumber", "styleCode", "shipByDate", "inventoryLoc",
    "color", "size", "shippingType", "designSku", "orderCount",
    "designName", "printType", "printLocations",
];

export const LABEL_TEMPLATE_DEFAULT = {
    width: 2,
    height: 2,
    format: "ZPL",
    fields: PREMIER_DEFAULT_FIELDS,
};

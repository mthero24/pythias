export function Sort(list, source) {
    // Pre-compute all sort keys once per item (called O(n) times)
    // rather than re-computing inside the comparator (called O(n log n) times)
    const keyed = list.map(item => ({
        item,
        shippingType: (item.shippingType || "").toUpperCase(),
        type:         (item.type || "").toUpperCase(),
        designSku:    (item.designRef?.sku || "").toUpperCase(),
        threadColor:  (item.threadColorName || "").toUpperCase(),
        row:          parseInt(item.inventory?.inventory?.row  || 0),
        unit:         (item.inventory?.inventory?.unit  || "").toUpperCase(),
        shelf:        parseInt(item.inventory?.inventory?.shelf || 0),
        productLoc:   item.inventory?.productInventory?.location || "",
        bin:          (item.inventory?.bin || "").toUpperCase(),
        styleCode:    (item.styleCode || "").toUpperCase(),
        vendor:       (item.vendor || "").toUpperCase(),
        colorName:    (item.colorName || "").toUpperCase(),
        sizeName:     (item.sizeName || "").toUpperCase(),
    }));

    keyed.sort((a, b) => {
        if (source === "PO") {
            if (a.shippingType !== b.shippingType) return a.shippingType < b.shippingType ? -1 : 1;
        }
        if (a.type !== b.type) return a.type < b.type ? -1 : 1;
        if (source === "IM") {
            if (a.designSku !== b.designSku)   return a.designSku   < b.designSku   ? -1 : 1;
            if (a.threadColor !== b.threadColor) return a.threadColor < b.threadColor ? -1 : 1;
        }
        if (a.row   !== b.row)   return a.row   - b.row;
        if (a.unit  !== b.unit)  return a.unit  < b.unit  ? -1 : 1;
        if (a.shelf !== b.shelf) return a.shelf - b.shelf;
        if (a.productLoc !== b.productLoc) return a.productLoc < b.productLoc ? -1 : 1;
        if (a.bin   !== b.bin)   return a.bin   < b.bin   ? -1 : 1;
        if (a.styleCode !== b.styleCode) return a.styleCode < b.styleCode ? -1 : 1;
        if (a.vendor    !== b.vendor)    return a.vendor    < b.vendor    ? -1 : 1;
        if (a.colorName !== b.colorName) return a.colorName < b.colorName ? -1 : 1;
        if (a.sizeName  !== b.sizeName)  return a.sizeName  < b.sizeName  ? -1 : 1;
        return 0;
    });

    return keyed.map(k => k.item);
}

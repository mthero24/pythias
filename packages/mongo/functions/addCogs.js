import Blank from "../models/Blanks";

/**
 * Stamps wholesaleCost onto each item by looking up the Blank's size wholesale price.
 * Items must have styleCode and sizeName. Items with no matching blank get wholesaleCost: 0.
 *
 * @param {object[]} items - lean item documents
 * @returns {Promise<object[]>} same items with wholesaleCost added
 */
export async function addCogs(items) {
    if (!items.length) return items;

    const styleCodes = [...new Set(items.map((i) => i.styleCode).filter(Boolean))];
    if (!styleCodes.length) return items.map((i) => ({ ...i, wholesaleCost: 0 }));

    const blanks = await Blank.find({ code: { $in: styleCodes } }).select("code sizes").lean();

    const costMap = {};
    for (const b of blanks) {
        costMap[b.code] = {};
        for (const s of b.sizes ?? []) {
            costMap[b.code][s.name] = s.wholesaleCost ?? 0;
        }
    }

    return items.map((i) => ({
        ...i,
        wholesaleCost: costMap[i.styleCode]?.[i.sizeName] ?? 0,
    }));
}

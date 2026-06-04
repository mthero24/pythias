import Design from "../models/Design";
import LicenseHolders from "../models/LicenseHolders";
import Blank from "../models/Blanks";

export async function addLicenceFees(items) {
    if (!items.length) return items.map(i => ({ ...i, licenceFee: 0 }));
    const designIds = [...new Set(items.map(i => i.designRef).filter(Boolean).map(String))];
    if (!designIds.length) return items.map(i => ({ ...i, licenceFee: 0 }));

    // Find designs that have a licenseHolder (mirrors what the license page route does)
    const designs = await Design.find({ _id: { $in: designIds }, licenseHolder: { $ne: null } }).select("_id licenseHolder").lean();
    if (!designs.length) return items.map(i => ({ ...i, licenceFee: 0 }));

    const holderIds = [...new Set(designs.map(d => d.licenseHolder).filter(Boolean).map(String))];
    const holders = await LicenseHolders.find({ _id: { $in: holderIds } }).lean();
    const holderMap = Object.fromEntries(holders.map(h => [String(h._id), h]));
    const designHolderMap = {};
    for (const d of designs) { if (d.licenseHolder) designHolderMap[String(d._id)] = holderMap[String(d.licenseHolder)]; }

    // Build retailPrice fallback map from blank sizes (same pattern as addCogs)
    const styleCodes = [...new Set(items.map(i => i.styleCode).filter(Boolean))];
    const blanks = styleCodes.length ? await Blank.find({ code: { $in: styleCodes } }).select("code sizes").lean() : [];
    const retailMap = {};
    for (const b of blanks) {
        retailMap[b.code] = {};
        for (const s of b.sizes ?? []) retailMap[b.code][s.name] = s.retailPrice ?? 0;
    }

    return items.map(i => {
        const holder = i.designRef ? designHolderMap[String(i.designRef)] : null;
        if (!holder) return { ...i, licenceFee: 0 };
        const rawPrice  = i.price || retailMap[i.styleCode]?.[i.sizeName] || 0;
        const basePrice = i.price ? Math.max(0, rawPrice - (i.discount || 0)) : rawPrice;
        const adjPrice = basePrice + (holder.additionalFees || 0);
        const fee = adjPrice * (holder.paymentType === "Percentage Per Unit" ? (holder.amount / 100) : 1)
            + (holder.paymentType === "Flat Per Unit" || holder.paymentType === "One Time" ? holder.amount : 0);
        return { ...i, licenceFee: fee || 0 };
    });
}

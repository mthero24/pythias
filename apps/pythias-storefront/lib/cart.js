import mongoose from "mongoose";
import { PlatformProduct, Blank, resolveVariantSize } from "@pythias/mongo";

// Validate + price a cart against the org's real products (never trust client prices).
// items: [{ productId, sku, qty }]  →  { lines, subtotalCents, errors }
export async function validateCart(orgId, items = []) {
    const errors = [];
    const ids = [...new Set(items.map((i) => i.productId).filter((id) => mongoose.Types.ObjectId.isValid(id)))];
    const products = ids.length
        ? await PlatformProduct.find({ _id: { $in: ids }, orgId, active: { $ne: false } })
            .populate("variantsArray.color", "name")
            .populate("design", "images printType")
            .select("title code productImages variantsArray design salePercent").lean()
        : [];
    const byId = Object.fromEntries(products.map((p) => [String(p._id), p]));

    // Blanks used by "create your own" custom lines (priced from the blank's sizes) + the product
    // variants' blanks (for the print-placement per-extra-spot surcharge).
    const variantBlankIds = products.flatMap((p) => (p.variantsArray || []).map((v) => v.blank).filter(Boolean).map(String));
    const blankIds = [...new Set([...items.map((i) => i.blankId), ...variantBlankIds].filter((id) => mongoose.Types.ObjectId.isValid(id)))];
    const blanks = blankIds.length ? await Blank.find({ _id: { $in: blankIds }, orgId }).select("name code sizes extraLocationPriceCents").lean() : [];
    const blankById = Object.fromEntries(blanks.map((b) => [String(b._id), b]));

    const lines = [];
    let subtotalCents = 0, wholesaleTotalCents = 0;
    for (const it of items) {
        const qty = Math.max(1, Math.min(Number(it.qty) || 1, 99));

        // ── Create-your-own blank line (no product) ──
        if (it.blankId) {
            const b = blankById[String(it.blankId)];
            if (!b) { errors.push("Custom item unavailable"); continue; }
            const sz = (b.sizes || []).find((s) => s.name === it.size && !s.hidden);
            const basePrice = Math.round((sz?.retailPrice || sz?.basePrice || 0) * 100);
            if (!(basePrice > 0)) { errors.push(`${b.name}: size unavailable`); continue; }
            // Second-side print surcharge: both front AND back designed → +$2 (matches the studio).
            const views = new Set((it.personalization?.sides || []).filter((s) => s.artworkUrl).map((s) => s.view));
            const priceCents = basePrice + (views.has("front") && views.has("back") ? 200 : 0);
            const wholesaleCents = Math.round((sz?.wholesaleCost || 0) * 100);
            subtotalCents += priceCents * qty; wholesaleTotalCents += wholesaleCents * qty;
            lines.push({
                blankId: String(b._id), styleCode: b.code, title: b.name,
                colorName: it.color || "", sizeName: it.size || "", sku: it.sku || `${b.code}-${it.size || ""}`,
                image: it.image || null, priceCents, wholesaleCents, qty, lineTotalCents: priceCents * qty,
                vertical: "pod", custom: true, personalization: it.personalization || null,
            });
            continue;
        }

        const p = byId[String(it.productId)];
        if (!p) { errors.push(`Product unavailable`); continue; }
        const v = (p.variantsArray ?? []).find((x) => x.sku === it.sku) ?? (p.variantsArray ?? [])[0];
        if (!v || !(v.price > 0)) { errors.push(`${p.title}: variant unavailable`); continue; }

        // Print-placement customization (single-image designs only): the buyer moved the one design onto
        // the chosen spot(s). Remap the design map to those spots from the REAL art (never trust the
        // client) and add the blank's per-extra-spot surcharge. Multi-location designs render natively.
        const spots = Array.isArray(it.printLocations) ? it.printLocations.filter(Boolean) : [];
        const designImgs = p.design?.images || {};
        const labeledSides = Object.keys(designImgs).filter((k) => designImgs[k]);
        let design = p.design?.images ?? null;
        let placementSurchargeCents = 0, printLocation = null;
        if (spots.length && labeledSides.length === 1) {
            const art = designImgs[labeledSides[0]];
            design = Object.fromEntries(spots.map((s) => [s, art]));   // the single art on each chosen spot
            const blank = v.blank ? blankById[String(v.blank)] : null;
            placementSurchargeCents = Math.max(0, spots.length - 1) * Math.round(blank?.extraLocationPriceCents || 0);
            printLocation = it.printLocation || spots.join(" + ");
        }

        // Per-product sale % off (authoritative — never trust client price).
        const salePct = Math.max(0, Math.min(100, Number(p.salePercent) || 0));
        const priceCents = Math.round(v.price * 100 * (1 - salePct / 100)) + placementSurchargeCents;
        const wholesaleCents = Math.round((v.wholesalePrice || 0) * 100);  // cost basis (for seller payout)
        subtotalCents += priceCents * qty;
        wholesaleTotalCents += wholesaleCents * qty;
        const vBlank = v.blank ? blankById[String(v.blank)] : null;
        lines.push({
            productId: String(p._id),
            // Style/blank code for the production floor — prefer the blank's code; the product `code`
            // is often empty for storefront catalog products.
            styleCode: vBlank?.code || p.code || "",
            title: p.title,
            sku: v.sku ?? null,
            colorName: v.color?.name ?? v.ids?.colorName ?? "",
            // Resolve the size NAME (the variant often stores a size _id in `size`); resolveVariantSize
            // maps it back via the blank's sizes ([{_id,name}]). Otherwise the order shows a raw _id.
            sizeName: resolveVariantSize(v, vBlank?.sizes),
            image: v.image ?? p.productImages?.find((i) => i.image)?.image ?? null,
            // Fulfillment-routing refs: routeOrder matches providers on blank+color+sizeName;
            // sendToProvider ships the design artwork + print type.
            blankId: v.blank ? String(v.blank) : null,
            colorId: v.color?._id ? String(v.color._id) : (v.color ? String(v.color) : null),
            designRef: p.design?._id ? String(p.design._id) : null,
            design,
            printType: p.design?.printType ?? null,
            printLocation, printLocations: spots.length ? spots : undefined,
            priceCents,
            wholesaleCents,
            qty,
            lineTotalCents: priceCents * qty,
            // Multi-vertical routing: which fulfiller handles this line.
            vertical: p.vertical || "pod",
            dropshipSupplierEmail: p.fulfillment?.supplierEmail || null,
            warehouseSku: p.fulfillment?.warehouseSku || null,
            // Buyer personalization (custom-text design) — carried to the order item.
            personalization: it.personalization || null,
        });
    }
    return { lines, subtotalCents, wholesaleTotalCents, errors };
}

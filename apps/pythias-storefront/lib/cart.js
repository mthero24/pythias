import mongoose from "mongoose";
import { PlatformProduct, Blank } from "@pythias/mongo";

// Validate + price a cart against the org's real products (never trust client prices).
// items: [{ productId, sku, qty }]  →  { lines, subtotalCents, errors }
export async function validateCart(orgId, items = []) {
    const errors = [];
    const ids = [...new Set(items.map((i) => i.productId).filter((id) => mongoose.Types.ObjectId.isValid(id)))];
    const products = ids.length
        ? await PlatformProduct.find({ _id: { $in: ids }, orgId, active: { $ne: false } })
            .populate("variantsArray.color", "name")
            .populate("design", "images printType")
            .select("title code productImages variantsArray design").lean()
        : [];
    const byId = Object.fromEntries(products.map((p) => [String(p._id), p]));

    // Blanks used by "create your own" custom lines — priced authoritatively from the blank's sizes.
    const blankIds = [...new Set(items.map((i) => i.blankId).filter((id) => mongoose.Types.ObjectId.isValid(id)))];
    const blanks = blankIds.length ? await Blank.find({ _id: { $in: blankIds }, orgId }).select("name code sizes").lean() : [];
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
            const priceCents = Math.round((sz?.retailPrice || sz?.basePrice || 0) * 100);
            if (!(priceCents > 0)) { errors.push(`${b.name}: size unavailable`); continue; }
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

        const priceCents = Math.round(v.price * 100);
        const wholesaleCents = Math.round((v.wholesalePrice || 0) * 100);  // cost basis (for seller payout)
        subtotalCents += priceCents * qty;
        wholesaleTotalCents += wholesaleCents * qty;
        lines.push({
            productId: String(p._id),
            styleCode: p.code ?? "",
            title: p.title,
            sku: v.sku ?? null,
            colorName: v.color?.name ?? v.ids?.colorName ?? "",
            sizeName: v.ids?.sizeName ?? (typeof v.size === "string" ? v.size : ""),
            image: v.image ?? p.productImages?.find((i) => i.image)?.image ?? null,
            // Fulfillment-routing refs: routeOrder matches providers on blank+color+sizeName;
            // sendToProvider ships the design artwork + print type.
            blankId: v.blank ? String(v.blank) : null,
            colorId: v.color?._id ? String(v.color._id) : (v.color ? String(v.color) : null),
            designRef: p.design?._id ? String(p.design._id) : null,
            design: p.design?.images ?? null,
            printType: p.design?.printType ?? null,
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

import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { ApiKeyIntegrations, Products, ProductInventory } from "@pythias/mongo";
import {
    generateEbayAuthUrl, exchangeCodeEbay,
    getSellerIdentityEbay,
    getOrdersEbay, shipOrderEbay,
    getInventoryItemsEbay, getOffersEbay, getOfferEbay, updateOfferEbay, publishOfferEbay, deleteInventoryItemEbay, deleteOfferEbay,
    createInventoryItemEbay, createInventoryItemGroupEbay, createOfferEbay,
    getAccountPoliciesEbay, createFulfillmentPolicyEbay, deleteFulfillmentPolicyEbay, createPaymentPolicyEbay, createReturnPolicyEbay,
    getSellerStandardsEbay, getTrafficReportEbay,
    getTransactionsEbay, getPayoutsEbay,
    getConversationsEbay, getConversationMessagesEbay, sendMessageEbay,
    getFeedbackEbay,
    getDisputesEbay, getDisputeEbay,
    getCampaignsEbay, getPromotionsEbay, createCampaignEbay, createPromotionEbay,
    getStoreEbay,
    getItemAspectsEbay,
    getCategorySuggestionsEbay,
} from "../functions/ebay.js";

// ─── Identity ─────────────────────────────────────────────────────────────────

export async function handleEbayIdentityGET(req) {
    const { searchParams } = new URL(req.url);
    const connectionId = searchParams.get("connectionId");
    if (!connectionId) return NextResponse.json({ error: "connectionId required" }, { status: 400 });
    const connection = await ApiKeyIntegrations.findById(connectionId);
    if (!connection) return NextResponse.json({ error: "Connection not found" }, { status: 404 });
    try {
        const data = await getSellerIdentityEbay(connection);
        return NextResponse.json(data);
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 502 });
    }
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export async function handleEbayGET(req) {
    return NextResponse.json({ error: "not implemented" });
}


export async function handleEbaySendPOST(req) {
    const body = await req.json();
    const { connectionId, product, offer } = body;
    if (!connectionId || !product) {
        return NextResponse.json({ error: "connectionId and product required" }, { status: 400 });
    }
    const connection = await ApiKeyIntegrations.findById(connectionId);
    if (!connection) return NextResponse.json({ error: "Connection not found" }, { status: 404 });
    try {
        const blank = product.blanks?.[0] ?? null;
        // field saved with multiple typo variants; check all spellings
        const mpMap = blank?.marketPlaceOverrides
            ?? blank?.marketPlaceOverides
            ?? blank?.marketPlaceOverided
            ?? {};
        // key is marketPlace.name — do a case-insensitive scan for any key containing "ebay"
        const ebayKey = Object.keys(mpMap).find(k => k.toLowerCase().includes("ebay"))
            ?? connection.displayName;
        const blankOverrides = mpMap[ebayKey] ?? {};
        console.log("[eBay send] blank keys:", Object.keys(blank ?? {}), "| mpMap keys:", Object.keys(mpMap), "| ebayKey:", ebayKey, "| blankOverrides:", JSON.stringify(blankOverrides));
        const categoryId          = offer?.categoryId
            ?? blankOverrides.categoryId
            ?? blankOverrides.category_id
            ?? blankOverrides.eBayCategoryId
            ?? blankOverrides.ebayCategoryId
            ?? blankOverrides.category;
        // auto-resolve policy IDs: prefer offer > blank overrides > first policy from account
        let fulfillmentPolicyId = offer?.fulfillmentPolicyId ?? blankOverrides.fulfillmentPolicyId;
        let paymentPolicyId     = offer?.paymentPolicyId     ?? blankOverrides.paymentPolicyId;
        let returnPolicyId      = offer?.returnPolicyId      ?? blankOverrides.returnPolicyId;
        const merchantLocationKey = offer?.merchantLocationKey ?? blankOverrides.merchantLocationKey;
        if (!fulfillmentPolicyId || !paymentPolicyId || !returnPolicyId) {
            try {
                const policies = await getAccountPoliciesEbay(connection);
                if (!fulfillmentPolicyId) fulfillmentPolicyId = policies.fulfillmentPolicies?.[0]?.fulfillmentPolicyId;
                if (!paymentPolicyId)     paymentPolicyId     = policies.paymentPolicies?.[0]?.paymentPolicyId;
                if (!returnPolicyId)      returnPolicyId      = policies.returnPolicies?.[0]?.returnPolicyId;
                console.log("[eBay send] auto-resolved policies — fulfillment:", fulfillmentPolicyId, "payment:", paymentPolicyId, "return:", returnPolicyId);
            } catch (e) {
                console.warn("[eBay send] could not fetch policies (account may not be opted in):", e.message);
            }
        }

        const variants  = product.variantsArray ?? [];
        const results   = [];
        const allBlanks = product.blanks ?? [];

        // resolve blank + its metadata for a given variant
        const blankFor = (variant) =>
            allBlanks.find(b => b._id?.toString() === variant.blank?.toString()) ?? blank;

        const sizeNameFor = (variant) => {
            const b     = blankFor(variant);
            const sizes = b?.sizes ?? [];
            const sv    = variant.size;
            if (sv && typeof sv === "object" && sv.name) return sv.name;
            const sid = (sv?._id ?? sv)?.toString() ?? "";
            if (!sid) return "";
            const byId   = sizes.find(sz => sz._id?.toString() === sid);
            if (byId?.name) return byId.name;
            const byName = sizes.find(sz => sz.name === sid || sz.name?.toLowerCase() === sid.toLowerCase());
            if (byName?.name) return byName.name;
            if (!/^[a-f0-9]{24}$/i.test(sid)) return sid;
            console.warn("[eBay] size lookup miss — variant.size:", JSON.stringify(sv), "| blank sizes:", sizes.map(s => s._id?.toString() + "=" + s.name));
            return "";
        };

        const colorNameFor = (variant) => {
            const b      = blankFor(variant);
            const colors = b?.colors ?? [];
            const cv     = variant.color;
            if (cv && typeof cv === "object" && cv.name) return cv.name;
            const cid = (cv?._id ?? cv)?.toString() ?? "";
            if (!cid) return "";
            const byId   = colors.find(c => c._id?.toString() === cid);
            if (byId?.name) return byId.name;
            const byName = colors.find(c => c.name === cid || c.name?.toLowerCase() === cid.toLowerCase());
            if (byName?.name) return byName.name;
            if (!/^[a-f0-9]{24}$/i.test(cid)) return cid;
            console.warn("[eBay] color lookup miss — variant.color:", JSON.stringify(cv), "| blank colors:", colors.map(c => c._id?.toString() + "=" + c.name));
            return "";
        };

        const RESERVED = new Set(["categoryId","category_id","eBayCategoryId","ebayCategoryId","category","fulfillmentPolicyId","paymentPolicyId","returnPolicyId","merchantLocationKey","style","type","sizeType","size_type","Size Type","aspects","color"]);
        const extraAspects = Object.fromEntries(
            Object.entries(blankOverrides.aspects ?? {})
                .concat(Object.entries(blankOverrides).filter(([k]) => !RESERVED.has(k) && typeof blankOverrides[k] === "string"))
                .map(([k, v]) => [k, Array.isArray(v) ? v : [v]])
        );

        const title       = offer?.title       || product.name || product.title || product.sku || "Custom Print Item";
        const description = offer?.description || product.description || product.name || product.title || product.sku || "Custom Print Item";
        const imageUrls   = [];
        if (product.design?.images?.front) imageUrls.push(product.design.images.front);
        if (product.design?.images?.back)  imageUrls.push(product.design.images.back);

        // resolve category once using the first blank's data
        let resolvedCategoryId = categoryId;
        if (!resolvedCategoryId) {
            const firstBlank = blankFor(variants.find(v => v.sku) ?? {});
            const deptStr0   = firstBlank?.department ?? "";
            const parts = [deptStr0, ...(firstBlank?.category ?? []), firstBlank?.subcategory].filter(Boolean);
            if (parts.length) {
                try {
                    const suggestions = await getCategorySuggestionsEbay(connection, parts.join(" "));
                    resolvedCategoryId = suggestions[0]?.category?.categoryId;
                    console.log("[eBay] auto-resolved categoryId:", resolvedCategoryId, "for query:", parts.join(" "));
                } catch (e) {
                    console.warn("[eBay] category suggestion failed:", e.message);
                }
            }
        }

        // ── Step 1: create/update each inventory item ─────────────────────────
        const variantSKUs = [];
        const allColors   = new Set();
        const allSizes    = new Set();
        let   minPrice    = Infinity;
        let   firstDept = "", firstStyle = "", firstType = "", firstSizeType = "";

        for (const variant of variants) {
            const sku = variant.sku;
            if (!sku) continue;
            const vBlank      = blankFor(variant);
            const deptStr     = vBlank?.department ?? "";
            const styleStr    = blankOverrides.style ?? vBlank?.subcategory ?? "";
            const typeStr     = blankOverrides.type  ?? vBlank?.category?.[0] ?? "";
            const blankName   = (vBlank?.name ?? "").toLowerCase();
            const autoSizeType = blankName.includes("plus") ? "Plus"
                : (blankName.includes("big") || blankName.includes("tall")) ? "Big & Tall"
                : "Regular";
            const sizeTypeStr = blankOverrides["Size Type"] ?? blankOverrides.sizeType ?? blankOverrides.size_type ?? autoSizeType;
            const sizeName    = sizeNameFor(variant);
            const colorName   = colorNameFor(variant) || blankOverrides.color || "Custom";

            await createInventoryItemEbay(connection, sku, {
                title, description, condition: "NEW",
                quantity: variant.quantity ?? 9999,
                imageUrls,
                aspects: {
                    Color: [colorName],
                    ...(sizeName ? { Size: [sizeName] } : {}),
                    "Size Type": [sizeTypeStr],
                    Brand: [product.brand ?? "Custom"],
                    ...(deptStr  ? { Department: [deptStr]  } : {}),
                    ...(styleStr ? { Style: [styleStr] } : {}),
                    ...(typeStr  ? { Type:  [typeStr]  } : {}),
                    ...extraAspects,
                },
            });

            variantSKUs.push(sku);
            if (colorName) allColors.add(colorName);
            if (sizeName)  allSizes.add(sizeName);
            const p = variant.price ?? offer?.price ?? 0;
            if (p < minPrice) minPrice = p;
            if (!firstDept)     firstDept     = deptStr;
            if (!firstStyle)    firstStyle    = styleStr;
            if (!firstType)     firstType     = typeStr;
            if (!firstSizeType) firstSizeType = sizeTypeStr;
        }

        if (variantSKUs.length === 0) {
            return NextResponse.json({ success: true, results: [] });
        }

        // ── Step 2: single-variant → individual offer; multi → grouped ────────
        if (variantSKUs.length === 1) {
            const invItem = await ProductInventory.findOne({ sku: variantSKUs[0] }).select("quantity").lean().catch(() => null);
            const invQty  = invItem?.quantity ?? 1;
            const result  = resolvedCategoryId
                ? await createOfferEbay(connection, {
                    sku: variantSKUs[0],
                    categoryId: resolvedCategoryId,
                    listingDescription: description,
                    price: minPrice === Infinity ? 0 : minPrice,
                    quantity: invQty,
                    fulfillmentPolicyId, paymentPolicyId, returnPolicyId, merchantLocationKey,
                    publish: offer?.publish !== false,
                  })
                : { ok: true };
            return NextResponse.json({ success: true, results: [{ sku: variantSKUs[0], ...result }] });
        }

        // multi-variant — create group then one grouped offer
        if (!resolvedCategoryId) {
            return NextResponse.json({ success: true, results: variantSKUs.map(sku => ({ sku, ok: true, note: "no category — inventory items created, no offer" })) });
        }

        const groupKey = `grp${String(product._id ?? product.sku ?? "").replace(/[^a-zA-Z0-9]/g, "").slice(0, 40)}`;

        const groupAspects = {
            Brand: [product.brand ?? "Custom"],
            ...(firstDept     ? { Department: [firstDept]     } : {}),
            ...(firstStyle    ? { Style:      [firstStyle]    } : {}),
            ...(firstType     ? { Type:       [firstType]     } : {}),
            ...(firstSizeType ? { "Size Type": [firstSizeType] } : {}),
            ...extraAspects,
        };

        const variesBy = {
            specifications: [
                ...(allColors.size > 0 ? [{ name: "Color", values: [...allColors] }] : []),
                ...(allSizes.size  > 0 ? [{ name: "Size",  values: [...allSizes]  }] : []),
            ],
        };

        await createInventoryItemGroupEbay(connection, groupKey, {
            title, description,
            aspects: groupAspects,
            imageUrls,
            variantSKUs,
            variesBy,
        });

        const groupResult = await createOfferEbay(connection, {
            inventoryItemGroupKey: groupKey,
            categoryId: resolvedCategoryId,
            listingDescription: description,
            price: minPrice === Infinity ? 0 : minPrice,
            fulfillmentPolicyId, paymentPolicyId, returnPolicyId, merchantLocationKey,
            publish: offer?.publish !== false,
        });

        return NextResponse.json({ success: true, results: [{ groupKey, ...groupResult }] });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 502 });
    }
}

export async function handleEbayPoliciesGET(req) {
    const { searchParams } = new URL(req.url);
    const connectionId = searchParams.get("connectionId");
    if (!connectionId) return NextResponse.json({ error: "connectionId required" }, { status: 400 });
    const connection = await ApiKeyIntegrations.findById(connectionId);
    if (!connection) return NextResponse.json({ error: "Connection not found" }, { status: 404 });
    try {
        const policies = await getAccountPoliciesEbay(connection);
        return NextResponse.json(policies);
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 502 });
    }
}

export async function handleEbayPoliciesPOST(req) {
    const body = await req.json();
    const { connectionId, type, ...fields } = body;
    if (!connectionId || !type) return NextResponse.json({ error: "connectionId and type required" }, { status: 400 });
    const connection = await ApiKeyIntegrations.findById(connectionId);
    if (!connection) return NextResponse.json({ error: "Connection not found" }, { status: 404 });
    try {
        let result;
        if      (type === "fulfillment") result = await createFulfillmentPolicyEbay(connection, fields);
        else if (type === "payment")     result = await createPaymentPolicyEbay(connection, fields);
        else if (type === "return")      result = await createReturnPolicyEbay(connection, fields);
        else return NextResponse.json({ error: "type must be fulfillment, payment, or return" }, { status: 400 });
        return NextResponse.json({ success: true, ...result });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 502 });
    }
}

export async function handleEbayPoliciesDELETE(req) {
    const { searchParams } = new URL(req.url);
    const connectionId = searchParams.get("connectionId");
    const policyId     = searchParams.get("policyId");
    if (!connectionId || !policyId) return NextResponse.json({ error: "connectionId and policyId required" }, { status: 400 });
    const connection = await ApiKeyIntegrations.findById(connectionId);
    if (!connection) return NextResponse.json({ error: "Connection not found" }, { status: 404 });
    try {
        await deleteFulfillmentPolicyEbay(connection, policyId);
        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 502 });
    }
}

export async function handleEbayOrdersGET(req) {
    const { searchParams } = new URL(req.url);
    const connectionId = searchParams.get("connectionId");
    if (!connectionId) return NextResponse.json({ error: "connectionId required" }, { status: 400 });
    const connection = await ApiKeyIntegrations.findById(connectionId);
    if (!connection) return NextResponse.json({ error: "Connection not found" }, { status: 404 });
    try {
        const orders = await getOrdersEbay(connection);
        return NextResponse.json({ orders, count: orders.length });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 502 });
    }
}

export async function handleEbayOrdersPOST(req) {
    const body = await req.json();
    const { connectionId, orderId, trackingNumber, carrier, lineItemIds } = body;
    if (!connectionId || !orderId || !trackingNumber) {
        return NextResponse.json({ error: "connectionId, orderId, and trackingNumber required" }, { status: 400 });
    }
    const connection = await ApiKeyIntegrations.findById(connectionId);
    if (!connection) return NextResponse.json({ error: "Connection not found" }, { status: 404 });
    try {
        const result = await shipOrderEbay(connection, orderId, { trackingNumber, carrier, lineItemIds });
        return NextResponse.json({ success: true, result });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 502 });
    }
}

// ─── Listings ─────────────────────────────────────────────────────────────────

export async function handleEbayListingsGET(req) {
    const { searchParams } = new URL(req.url);
    const connectionId = searchParams.get("connectionId");
    const tab    = searchParams.get("tab") ?? "items";
    const limit  = parseInt(searchParams.get("limit") ?? "50");
    const offset = parseInt(searchParams.get("offset") ?? "0");
    const sku    = searchParams.get("sku") ?? undefined;
    if (!connectionId) return NextResponse.json({ error: "connectionId required" }, { status: 400 });
    const connection = await ApiKeyIntegrations.findById(connectionId);
    if (!connection) return NextResponse.json({ error: "Connection not found" }, { status: 404 });
    try {
        if (tab === "offers") {
            const data = await getOffersEbay(connection, { sku, limit, offset });
            return NextResponse.json(data);
        }
        const data = await getInventoryItemsEbay(connection, { limit, offset });
        return NextResponse.json(data);
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 502 });
    }
}

export async function handleEbayListingsPUT(req) {
    const body = await req.json();
    const { connectionId, offerId, price, quantity, listingDescription } = body;
    if (!connectionId || !offerId) return NextResponse.json({ error: "connectionId and offerId required" }, { status: 400 });
    const connection = await ApiKeyIntegrations.findById(connectionId);
    if (!connection) return NextResponse.json({ error: "Connection not found" }, { status: 404 });
    try {
        const result = await updateOfferEbay(connection, offerId, { price, quantity, listingDescription });
        return NextResponse.json({ success: true, result });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 502 });
    }
}

export async function handleEbayListingsPOST(req) {
    const body = await req.json();
    const { connectionId, offerId, createOffer: createOfferData } = body;
    if (!connectionId) return NextResponse.json({ error: "connectionId required" }, { status: 400 });
    const connection = await ApiKeyIntegrations.findById(connectionId);
    if (!connection) return NextResponse.json({ error: "Connection not found" }, { status: 404 });
    try {
        if (createOfferData) {
            // auto-fill missing policy IDs from account
            if (!createOfferData.fulfillmentPolicyId || !createOfferData.paymentPolicyId || !createOfferData.returnPolicyId) {
                try {
                    const policies = await getAccountPoliciesEbay(connection);
                    if (!createOfferData.fulfillmentPolicyId) createOfferData.fulfillmentPolicyId = policies.fulfillmentPolicies?.[0]?.fulfillmentPolicyId;
                    if (!createOfferData.paymentPolicyId)     createOfferData.paymentPolicyId     = policies.paymentPolicies?.[0]?.paymentPolicyId;
                    if (!createOfferData.returnPolicyId)      createOfferData.returnPolicyId      = policies.returnPolicies?.[0]?.returnPolicyId;
                } catch { /* account may not be opted in — proceed without policies */ }
            }
            const { groupKey, groupTitle, groupDescription, groupAspects, groupImageUrls, variantSKUs, ...offerFields } = createOfferData;
            if (groupKey && variantSKUs?.length) {
                let resolvedImageUrls = groupImageUrls?.length ? groupImageUrls : [];
                if (!resolvedImageUrls.length) {
                    // pull images from the first matching inventory item
                    const { items } = await getInventoryItemsEbay(connection, { limit: 200 }).catch(() => ({ items: [] }));
                    for (const sku of variantSKUs) {
                        const match = items.find(i => i.sku === sku || i.sku === sku.replace(/[^a-zA-Z0-9]/g, "").slice(0, 50));
                        const urls  = match?.product?.imageUrls ?? match?.inventoryItem?.product?.imageUrls ?? [];
                        if (urls.length) { resolvedImageUrls = urls; break; }
                    }
                }
                await createInventoryItemGroupEbay(connection, groupKey, {
                    title:       groupTitle       ?? offerFields.listingDescription ?? "Custom Print Item",
                    description: groupDescription ?? offerFields.listingDescription ?? "",
                    aspects:     groupAspects     ?? {},
                    imageUrls:   resolvedImageUrls,
                    variantSKUs,
                });
                const result = await createOfferEbay(connection, { ...offerFields, inventoryItemGroupKey: groupKey });
                return NextResponse.json({ success: true, ...result });
            }
            const result = await createOfferEbay(connection, createOfferData);
            return NextResponse.json({ success: true, ...result });
        }
        if (!offerId) return NextResponse.json({ error: "offerId required" }, { status: 400 });

        // sync price + quantity from the DB before publishing
        try {
            const offer = await getOfferEbay(connection, offerId).catch(() => null);
            const sku   = offer?.sku;
            if (sku) {
                const [product, invItem] = await Promise.all([
                    Products.findOne({ "variantsArray.sku": sku }).lean().catch(() => null),
                    ProductInventory.findOne({ sku }).lean().catch(() => null),
                ]);
                const variant  = product?.variantsArray?.find(v => v.sku === sku);
                const price    = variant?.price ?? product?.price;
                const quantity = invItem?.quantity;
                if (price != null || quantity != null) {
                    await updateOfferEbay(connection, offerId, {
                        ...(price    != null ? { price }    : {}),
                        ...(quantity != null ? { quantity } : {}),
                    }).catch(e => console.warn("[eBay] pre-publish sync warning:", e.message));
                }
            }
        } catch (syncErr) {
            console.warn("[eBay] pre-publish product sync failed:", syncErr.message);
        }

        const result = await publishOfferEbay(connection, offerId);
        return NextResponse.json({ success: true, ...result });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 502 });
    }
}

export async function handleEbayListingsDELETE(req) {
    const { searchParams } = new URL(req.url);
    const connectionId = searchParams.get("connectionId");
    const sku          = searchParams.get("sku");
    const offerId      = searchParams.get("offerId");
    if (!connectionId || (!sku && !offerId)) return NextResponse.json({ error: "connectionId and sku or offerId required" }, { status: 400 });
    const connection = await ApiKeyIntegrations.findById(connectionId);
    if (!connection) return NextResponse.json({ error: "Connection not found" }, { status: 404 });
    try {
        const result = offerId
            ? await deleteOfferEbay(connection, offerId)
            : await deleteInventoryItemEbay(connection, sku);
        return NextResponse.json(result);
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 502 });
    }
}

// ─── Taxonomy / Aspects ───────────────────────────────────────────────────────

export async function handleEbayAspectsGET(req) {
    const { searchParams } = new URL(req.url);
    const connectionId = searchParams.get("connectionId");
    const categoryId   = searchParams.get("categoryId");
    if (!connectionId || !categoryId) return NextResponse.json({ error: "connectionId and categoryId required" }, { status: 400 });
    const connection = await ApiKeyIntegrations.findById(connectionId);
    if (!connection) return NextResponse.json({ error: "Connection not found" }, { status: 404 });
    try {
        const aspects = await getItemAspectsEbay(connection, categoryId);
        return NextResponse.json({ aspects });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 502 });
    }
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export async function handleEbayAnalyticsGET(req) {
    const { searchParams } = new URL(req.url);
    const connectionId = searchParams.get("connectionId");
    const type = searchParams.get("type") ?? "traffic";
    if (!connectionId) return NextResponse.json({ error: "connectionId required" }, { status: 400 });
    const connection = await ApiKeyIntegrations.findById(connectionId);
    if (!connection) return NextResponse.json({ error: "Connection not found" }, { status: 404 });
    try {
        if (type === "standards") {
            const data = await getSellerStandardsEbay(connection);
            return NextResponse.json(data);
        }
        const startDate = searchParams.get("startDate") ?? undefined;
        const endDate   = searchParams.get("endDate") ?? undefined;
        const data = await getTrafficReportEbay(connection, { startDate, endDate });
        return NextResponse.json(data);
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 502 });
    }
}

// ─── Finances ─────────────────────────────────────────────────────────────────

export async function handleEbayFinancesGET(req) {
    const { searchParams } = new URL(req.url);
    const connectionId = searchParams.get("connectionId");
    const type   = searchParams.get("type") ?? "transactions";
    const limit  = parseInt(searchParams.get("limit") ?? "50");
    const offset = parseInt(searchParams.get("offset") ?? "0");
    if (!connectionId) return NextResponse.json({ error: "connectionId required" }, { status: 400 });
    const connection = await ApiKeyIntegrations.findById(connectionId);
    if (!connection) return NextResponse.json({ error: "Connection not found" }, { status: 404 });
    try {
        if (type === "payouts") {
            const data = await getPayoutsEbay(connection, { limit });
            return NextResponse.json(data);
        }
        const data = await getTransactionsEbay(connection, { limit, offset });
        return NextResponse.json(data);
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 502 });
    }
}

// ─── Messages ─────────────────────────────────────────────────────────────────

export async function handleEbayMessagesGET(req) {
    const { searchParams } = new URL(req.url);
    const connectionId     = searchParams.get("connectionId");
    const conversationId   = searchParams.get("conversationId");
    const limit  = parseInt(searchParams.get("limit") ?? "20");
    const offset = parseInt(searchParams.get("offset") ?? "0");
    if (!connectionId) return NextResponse.json({ error: "connectionId required" }, { status: 400 });
    const connection = await ApiKeyIntegrations.findById(connectionId);
    if (!connection) return NextResponse.json({ error: "Connection not found" }, { status: 404 });
    try {
        if (conversationId) {
            const messages = await getConversationMessagesEbay(connection, conversationId);
            return NextResponse.json({ messages });
        }
        const data = await getConversationsEbay(connection, { limit, offset });
        return NextResponse.json(data);
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 502 });
    }
}

export async function handleEbayMessagesPOST(req) {
    const body = await req.json();
    const { connectionId, conversationId, text } = body;
    if (!connectionId || !conversationId || !text) {
        return NextResponse.json({ error: "connectionId, conversationId, and text required" }, { status: 400 });
    }
    const connection = await ApiKeyIntegrations.findById(connectionId);
    if (!connection) return NextResponse.json({ error: "Connection not found" }, { status: 404 });
    try {
        const result = await sendMessageEbay(connection, conversationId, text);
        return NextResponse.json({ success: true, result });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 502 });
    }
}

// ─── Feedback ─────────────────────────────────────────────────────────────────

export async function handleEbayFeedbackGET(req) {
    const { searchParams } = new URL(req.url);
    const connectionId  = searchParams.get("connectionId");
    const feedbackType  = searchParams.get("feedbackType") ?? "RECEIVED_AS_SELLER";
    const limit  = parseInt(searchParams.get("limit") ?? "25");
    const offset = parseInt(searchParams.get("offset") ?? "0");
    if (!connectionId) return NextResponse.json({ error: "connectionId required" }, { status: 400 });
    const connection = await ApiKeyIntegrations.findById(connectionId);
    if (!connection) return NextResponse.json({ error: "Connection not found" }, { status: 404 });
    try {
        const data = await getFeedbackEbay(connection, { limit, offset, feedbackType });
        return NextResponse.json(data);
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 502 });
    }
}

// ─── Disputes ─────────────────────────────────────────────────────────────────

export async function handleEbayDisputesGET(req) {
    const { searchParams } = new URL(req.url);
    const connectionId = searchParams.get("connectionId");
    const disputeId    = searchParams.get("disputeId");
    const limit  = parseInt(searchParams.get("limit") ?? "25");
    const offset = parseInt(searchParams.get("offset") ?? "0");
    if (!connectionId) return NextResponse.json({ error: "connectionId required" }, { status: 400 });
    const connection = await ApiKeyIntegrations.findById(connectionId);
    if (!connection) return NextResponse.json({ error: "Connection not found" }, { status: 404 });
    try {
        if (disputeId) {
            const data = await getDisputeEbay(connection, disputeId);
            return NextResponse.json(data);
        }
        const data = await getDisputesEbay(connection, { limit, offset });
        return NextResponse.json(data);
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 502 });
    }
}

// ─── Marketing ────────────────────────────────────────────────────────────────

export async function handleEbayMarketingGET(req) {
    const { searchParams } = new URL(req.url);
    const connectionId = searchParams.get("connectionId");
    const type = searchParams.get("type") ?? "campaigns";
    const limit  = parseInt(searchParams.get("limit") ?? "20");
    const offset = parseInt(searchParams.get("offset") ?? "0");
    if (!connectionId) return NextResponse.json({ error: "connectionId required" }, { status: 400 });
    const connection = await ApiKeyIntegrations.findById(connectionId);
    if (!connection) return NextResponse.json({ error: "Connection not found" }, { status: 404 });
    try {
        if (type === "promotions") {
            const data = await getPromotionsEbay(connection, { limit, offset });
            return NextResponse.json(data);
        }
        const data = await getCampaignsEbay(connection, { limit });
        return NextResponse.json(data);
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 502 });
    }
}

export async function handleEbayMarketingPOST(req) {
    const body = await req.json();
    const { connectionId, type, ...fields } = body;
    if (!connectionId || !type) return NextResponse.json({ error: "connectionId and type required" }, { status: 400 });
    const connection = await ApiKeyIntegrations.findById(connectionId);
    if (!connection) return NextResponse.json({ error: "Connection not found" }, { status: 404 });
    try {
        let result;
        if      (type === "campaign")   result = await createCampaignEbay(connection, fields);
        else if (type === "promotion")  result = await createPromotionEbay(connection, fields);
        else return NextResponse.json({ error: "type must be campaign or promotion" }, { status: 400 });
        return NextResponse.json({ success: true, ...result });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 502 });
    }
}

// ─── Store ────────────────────────────────────────────────────────────────────

export async function handleEbayStoreGET(req) {
    const { searchParams } = new URL(req.url);
    const connectionId = searchParams.get("connectionId");
    if (!connectionId) return NextResponse.json({ error: "connectionId required" }, { status: 400 });
    const connection = await ApiKeyIntegrations.findById(connectionId);
    if (!connection) return NextResponse.json({ error: "Connection not found" }, { status: 404 });
    try {
        const data = await getStoreEbay(connection);
        return NextResponse.json(data);
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 502 });
    }
}

// ─── Marketplace Account Deletion Notification ───────────────────────────────
// eBay requires this endpoint to be verified before granting production keys.
// Set EBAY_VERIFICATION_TOKEN in your env to the token you enter in the eBay
// developer portal (30–80 chars, any string you choose).
// The endpoint URL you register must match exactly what eBay calls.
// eBay verifies by GET ?challenge_code=XXX → respond SHA-256(challenge+token+url)
// Production account deletion events arrive as POST — log and acknowledge them.

export async function handleEbayNotificationsGET(req) {
    const { searchParams } = new URL(req.url);
    const challengeCode = searchParams.get("challenge_code");
    const debug         = searchParams.get("debug") === "1";

    const token       = process.env.EBAY_VERIFICATION_TOKEN;
    const endpointUrl = process.env.EBAY_NOTIFICATION_ENDPOINT_URL ?? req.url.split("?")[0];

    if (debug) {
        const hash = token && challengeCode
            ? createHash("sha256").update((challengeCode ?? "TEST") + token + endpointUrl).digest("hex")
            : null;
        return NextResponse.json({
            tokenSet:    !!token,
            tokenLength: token?.length ?? 0,
            endpointUrl,
            challengeCode: challengeCode ?? "(not provided)",
            challengeResponse: hash,
        });
    }

    if (!challengeCode) return NextResponse.json({ error: "challenge_code required" }, { status: 400 });
    if (!token) return NextResponse.json({ error: "EBAY_VERIFICATION_TOKEN not set" }, { status: 500 });

    const hash = createHash("sha256")
        .update(challengeCode + token + endpointUrl)
        .digest("hex");

    return NextResponse.json({ challengeResponse: hash });
}

export async function handleEbayNotificationsPOST(req) {
    try {
        const body = await req.json();
        console.log("[eBay] account deletion notification:", JSON.stringify(body));
    } catch {}
    return new NextResponse(null, { status: 200 });
}

// ─── OAuth ────────────────────────────────────────────────────────────────────

export function makeEbayOAuthRedirectGET({ redirectUri, provider, adminUrl }) {
    return async function handleEbayOAuthRedirectGET(req) {
        const { searchParams } = new URL(req.url);
        const code  = searchParams.get("code");
        const error = searchParams.get("error");
        if (error || !code) {
            return NextResponse.redirect(`${adminUrl}?error=ebay_auth_failed`);
        }
        try {
            const tokens = await exchangeCodeEbay(code);
            const conn = new ApiKeyIntegrations({
                apiKey:       tokens.access_token,
                refreshToken: tokens.refresh_token,
                tokenType:    "bearer",
                type:         "ebay",
                provider,
                displayName:  "eBay Store",
                organization: "admin",
                pullOrdersEnabled: true,
            });
            await conn.save();
            return NextResponse.redirect(adminUrl);
        } catch (e) {
            return NextResponse.json({ error: e.toString() }, { status: 500 });
        }
    };
}

export async function handleEbayOAuthInitGET(req) {
    const { searchParams } = new URL(req.url);
    const redirectUri = searchParams.get("redirectUri") ?? "";
    const state       = searchParams.get("state") ?? Math.random().toString(36).slice(2);
    const url = generateEbayAuthUrl(redirectUri, state);
    return NextResponse.redirect(url);
}

// Routes OAuth through Pythias (central callback like TikTok).
// State encodes: "<provider>" or "<provider>:sandbox"
// Add ?debug=1 to return the auth URL as JSON instead of redirecting.
export function makeEbayOAuthInitGET({ provider }) {
    return async function(req) {
        const { searchParams } = new URL(req.url);
        const sandbox = searchParams.get("sandbox") === "1";
        const debug   = searchParams.get("debug") === "1";
        const state   = `${provider}${sandbox ? ":sandbox" : ""}`;
        const url     = generateEbayAuthUrl("", state, { sandbox });
        if (debug) return NextResponse.json({ url, sandbox, state });
        return NextResponse.redirect(url);
    };
}

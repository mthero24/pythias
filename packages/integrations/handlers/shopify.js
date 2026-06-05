import { NextResponse } from "next/server";
import { headers } from "next/headers";
import axios from "axios";
import atob from "atob";
import { User, ApiKeyIntegrations, Products, Order, Items as Item, Inventory, MarketPlaces, Brands, Design, SkuToUpc } from "@pythias/mongo";
import { generatePieceID } from "../functions/createPiceId.js";
import { CreateUpdateUPC } from "../functions/gs1.js";

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

const updateInventory = async () => {
    let inventories = await Inventory.find({});
    for (let inv of inventories) {
        let items = await Item.find({ "inventory.inventory": inv._id, labelPrinted: false, canceled: false, shipped: false, paid: true });
        if (inv.quantity < 0) inv.quantity = 0;
        if (items.length > 0) {
            let itemIds = items.map(i => i._id.toString());
            inv.inStock = inv.inStock.filter(i => itemIds.includes(i.toString()));
            inv.attached = inv.attached.filter(i => itemIds.includes(i.toString()));
            if (inv.quantity > 0) {
                if (inv.quantity > inv.inStock.length + inv.attached.length) {
                    inv.attached = [];
                }
            }
            let newInStck = [];
            for (let id of inv.inStock) {
                if (!newInStck.includes(id) && !inv.orders.map(o => o.items.map(i => i)).flat().includes(id)) {
                    newInStck.push(id);
                }
            }
            inv.inStock = newInStck;
            let newAttached = [];
            for (let id of inv.attached) {
                if (!newAttached.includes(id) && !inv.inStock.includes(id)) {
                    newAttached.push(id);
                }
            }
            inv.attached = newAttached;
            if (inv.quantity > 0) {
                for (let item of items) {
                    if (inv.quantity - inv.inStock.length > 0 && !inv.attached.includes(item._id.toString()) && !inv.inStock.includes(item._id.toString()) && !inv.orders.map(o => o.items.map(i => i)).flat().includes(item._id.toString())) {
                        inv.inStock.push(item._id.toString());
                    } else if (!inv.attached.includes(item._id.toString()) && !inv.inStock.includes(item._id.toString()) && !inv.orders.map(o => o.items.map(i => i)).flat().includes(item._id.toString())) {
                        inv.attached.push(item._id.toString());
                    }
                }
                await inv.save();
            } else {
                if (items.length > 0) {
                    for (let item of items) {
                        if (!inv.attached.includes(item._id.toString()) && !inv.inStock.includes(item._id.toString()) && !inv.orders.map(o => o.items.map(i => i)).flat().includes(item._id.toString())) {
                            inv.attached.push(item._id.toString());
                        }
                    }
                    await inv.save();
                }
            }
        }
    }
};

const createItem = async ({ variant, design, order, inventoryType, name }) => {
    let item = new Item({
        pieceId: await generatePieceID(),
        paid: true,
        sku: variant.sku,
        blank: variant.blank,
        styleCode: variant.blank?.code,
        sizeName: variant.blank.sizes.find(s => s._id.toString() == variant.sizeId)?.name,
        threadColorName: variant.threadColor?.name,
        threadColor: variant.threadColor,
        colorName: variant.color?.name,
        color: variant.color,
        size: variant.blank.sizes.find(s => s._id.toString() == variant.sizeId),
        design: variant.threadColor ? design.threadImages[variant.threadColor?.name] : design?.images,
        designRef: design,
        order: order._id,
        shippingType: "Standard",
        quantity: 1,
        status: order.status,
        name: name,
        date: order.date,
        type: design?.printType,
        upc: variant.upc,
        inventory: {
            inventoryType: inventoryType,
            inventory: inventoryType == "inventory" ? variant.inventory : null,
            productInventory: inventoryType == "productInventory" ? variant.productInventory : null,
        },
    });
    item = await item.save();
    return item;
};

// ---------------------------------------------------------------------------
// Route handlers
// ---------------------------------------------------------------------------

export function createShopifyPOSTHandler(provider) {
    return async function handleShopifyPOST(req) {
        let data = await req.json();
        let userName = atob(data.Basic).split(":")[0];
        let password = atob(data.Basic).split(":")[1];
        let user = await User.findOne({ $or: [{ email: userName }, { userName: userName }] });
        if (user) {
            if (await user.comparePassword(password)) {
                await ApiKeyIntegrations.findOneAndUpdate(
                    { displayName: `shopify-${data.shop}` },
                    { $set: { apiKey: data.pythiasToken, provider, type: "shopify" } },
                    { upsert: true }
                );
                return NextResponse.json({ error: false, token: user.password });
            } else {
                return NextResponse.json({ error: true, msg: "User Name or Password are incorrect!" });
            }
        }
        return NextResponse.json({ error: true, msg: "User Name or Password are incorrect!" });
    };
}

export const handleShopifyPOST = createShopifyPOSTHandler("pythias-test");

export async function handleShopifySendPOST(req) {
    const body = await req.json();
    const reqHeaders = {
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${body.connection.apiKey}`,
        },
    };
    let res = await axios.post("https://shopapp.pythiastechnologies.com/webhooks/products", { ...body }, reqHeaders).catch(e => { console.log(e.response.data); });
    return NextResponse.json({ ...res?.data });
}

export async function handleShopifyOrdersPOST(req) {
    let data = await req.json();
    const headersList = await headers();
    const authorizationHeader = headersList.get("authorization");
    if (authorizationHeader) {
        let password = authorizationHeader?.split(" ")[1];
        let user = await User.findOne({ password: password });
        if (user) {
            let order = await Order.findOne({ shopifyOrderId: data.order.shopifyOrderId }).populate("items");
            if (!order) {
                order = new Order({
                    shopifyOrderId: data.order.shopifyOrderId,
                    orderId: data.order.shopifyOrderId.split("/")[data.order.shopifyOrderId.split("/").length - 1],
                    date: new Date(data.order.date),
                    shopifyShop: data.shop,
                    marketplace: "shopify",
                    poNumber: data.order.poNumber,
                    uniquePo: `${data.order._id}-${data.order.poNumber}-shopify`,
                    shippingAddress: {
                        name: data.order.shippingAddress?.name,
                        address1: data.order.shippingAddress?.address1,
                        address2: data.order.shippingAddress?.address2,
                        city: data.order.shippingAddress?.city,
                        state: data.order.shippingAddress?.provinceCode,
                        zip: data.order.shippingAddress?.zip,
                        country: data.order.shippingAddress?.countryCode,
                    },
                    total: data.order.totalPrice,
                    status: data.order.status,
                    shippingType: "Standard",
                    ...(data.orgId ? { orgId: data.orgId } : {}),
                });
                let items = [];
                for (let i of data.order.items) {
                    let product = await Products.findById(i.product).populate("design variantsArray.color variantsArray.threadColor variantsArray.blank variantsArray.inventory variantsArray.productInventory");
                    if (product) {
                        let variant = product.variantsArray.find(v => v.sku == i.sku);
                        for (let j = 0; j < i.quantity; j++) {
                            let inventoryType;
                            if (variant.productInventory && variant.productInventory.quantity > 0 && variant.productInventory.quantity > variant.productInventory.inStock.length) {
                                inventoryType = "productInventory";
                            } else {
                                inventoryType = "inventory";
                            }
                            let item = await createItem({ variant, design: product.design, order, inventoryType, name: product.name });
                            if (data.order.paymentStatus == "PAID") {
                                order.paid = true;
                                item.paid = true;
                                item = await item.save();
                            }
                            if (inventoryType == "productInventory") {
                                if (!variant.productInventory.inStock) variant.productInventory.inStock = [];
                                variant.productInventory.inStock.push(item._id);
                                await variant.productInventory.save();
                            }
                            items.push(item);
                        }
                    }
                }
                order.items = items;
                order = await order.save();
                updateInventory();
            } else {
                order.status = data.order.status;
                if (data.orgId && !order.orgId) order.orgId = data.orgId;
                if (data.order.paymentStatus == "PAID") {
                    order.paid = true;
                    for (let item of order.items) {
                        if (!item.paid) {
                            item.paid = true;
                            item = await item.save();
                        }
                    }
                }
                if (data.order.status == "CANCELED") {
                    order.canceled = true;
                    order.status = data.order.displayFinancialStatus;
                    for (let item of order.items) {
                        item.canceled = true;
                        item = await item.save();
                    }
                }
                order.shippingAddress = {
                    name: data.order.shippingAddress?.name,
                    address1: data.order.shippingAddress?.address1,
                    address2: data.order.shippingAddress?.address2,
                    city: data.order.shippingAddress?.city,
                    state: data.order.shippingAddress?.provinceCode,
                    zip: data.order.shippingAddress?.zip,
                    country: data.order.shippingAddress?.countryCode,
                };
                order.total = data.order.totalPrice;
                await order.save();
            }
            return NextResponse.json({ error: false, orderId: order._id });
        }
    }
    return NextResponse.json({ error: true, msg: "Unauthorized" });
}

export async function handleShopifyDeletePOST(req) {
    const body = await req.json();
    const reqHeaders = {
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${body.connection.apiKey}`,
        },
    };
    let res = await axios.post("https://shopapp.pythiastechnologies.com/webhooks/product/delete", { ...body }, reqHeaders).catch(e => { console.log(e.response.data); });
    return NextResponse.json({ ...res?.data });
}

export async function handleShopifyProductsDeletePOST(req) {
    let data = await req.json();
    const headersList = await headers();
    const authorizationHeader = headersList.get("authorization");
    let password = authorizationHeader.split(" ")[1];
    let user = await User.findOne({ password: password });
    if (user) {
        let product = await Products.findById(data.id);
        if (product) {
            let newIds = {};
            for (let id of Object.keys(product.ids)) {
                if (id != `shopify-${data.shop}`) newIds[id] = product.ids[id];
            }
            product.ids = newIds;
            for (let v of product.variantsArray) {
                newIds = {};
                for (let id of Object.keys(v.ids)) {
                    if (id != `shopify-${data.shop}`) newIds[id] = v.ids[id];
                }
                v.ids = newIds;
            }
            let marketplace = await MarketPlaces.findOne({ name: "shopify" });
            if (marketplace) {
                product.marketPlacesArray = product.marketPlacesArray.filter(m => m.toString() != marketplace._id.toString());
            }
        }
        product.markModified("ids marketplaces variantsArray");
        await product.save();
        return NextResponse.json({ error: false, msg: "Product deleted from Shopify" });
    }
    return NextResponse.json({ error: true, msg: "User does not exist" });
}

export async function handleShopifyRemoveConnectionPOST(req) {
    let data = await req.json();
    const headersList = await headers();
    const authorizationHeader = headersList.get("authorization");
    let password = authorizationHeader.split(" ")[1];
    let user = await User.findOne({ password: password });
    if (user) {
        let marketplace = await MarketPlaces.findOne({ name: "shopify" });
        let connection = await ApiKeyIntegrations.findOneAndDelete({ displayName: `shopify-${data.shop}` });
        marketplace.connections = marketplace.connections.filter(c => c.toString() !== connection._id.toString());
        await marketplace.save();
        let products = await Products.find({ marketPlacesArray: marketplace._id, ids: { $exists: true, $ne: {} } });
        for (let product of products) {
            product.marketPlacesArray = product.marketPlacesArray.filter(m => m.toString() !== marketplace._id.toString());
            let newIds = {};
            for (let id of Object.keys(product.ids)) {
                if (id !== `shopify-${data.shop}`) newIds[id] = product.ids[id];
            }
            product.ids = newIds;
            for (let v of product.variantsArray) {
                newIds = {};
                for (let id of Object.keys(v.ids)) {
                    if (id !== `shopify-${data.shop}`) newIds[id] = v.ids[id];
                }
                v.ids = newIds;
            }
            product.markModified("ids marketplaces variantsArray");
            await product.save();
        }
        return NextResponse.json({ error: false, msg: "uninstalled shopify integration" });
    }
    return NextResponse.json({ error: true, msg: "User does not exist" });
}

// Alias — uninstall and remove-connection have the same logic
export const handleShopifyUninstallPOST = handleShopifyRemoveConnectionPOST;

export async function handleShopifyBrandsGET(req) {
    const headersList = await headers();
    const authorizationHeader = headersList.get("authorization");
    if (authorizationHeader) {
        let password = authorizationHeader?.split(" ")[1];
        let user = await User.findOne({ password: password });
        if (user) {
            let filtered = [];
            let brands = await Brands.find({});
            for (let b of brands) {
                if (!filtered.filter(br => br.name == b.name)[0]) {
                    filtered.push(b);
                }
            }
            return NextResponse.json({ error: false, brands: filtered });
        }
    }
    return NextResponse.json({ error: true, msg: "Unauthorized" });
}

const createProducts = async (design, brand) => {
    let products = [];
    for (let b of design.blanks) {
        if (b.blank && ((brand == "The Juniper Shop" && b.blank.department.toLowerCase() == "kids") || (brand == "Simply Sage Market" && b.blank.department.toLowerCase() != "kids") || (brand != "The Juniper Shop" && brand != "Simply Sage Market"))) {
            let skus = await SkuToUpc.find({ design: design._id, blank: b.blank._id });
            if (skus.length < (b.colors.length * b.blank.sizes.length)) await CreateUpdateUPC({ design, blank: b.blank._id });
            let product = {
                design,
                blank: b.blank,
                colors: b.colors,
                defaultColor: b.defaultColor,
                defaultImages: b.defaultImages,
                variants: await SkuToUpc.find({ design: design._id, blank: b.blank._id }),
            };
            products.push(product);
        }
    }
    return products;
};

export async function handleShopifyProductsGET(req) {
    const headersList = await headers();
    const authorizationHeader = headersList.get("authorization");
    let password = authorizationHeader.split(" ")[1];
    let user = await User.findOne({ password: password });
    if (user) {
        const searchParams = new URL(req.url).searchParams;
        let brand  = searchParams.get("brand");
        let orgId  = searchParams.get("orgId");
        let designs = await Design.find({
            "b2m.brand": brand,
            onShopify: { $in: [null, false] },
            published: true,
            ...(orgId ? { orgId } : {}),
        }).limit(5).populate("blanks.blank blanks.colors");
        let products = [];
        for (let d of designs) {
            products = products.concat(await createProducts(d, brand));
        }
        return NextResponse.json({ error: false, products });
    }
    return NextResponse.json({ error: true, msg: "User does not exist" });
}

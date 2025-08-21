import {NextApiRequest, NextResponse} from "next/server";
import { headers } from "next/headers";
import { User, Design, Items as Item, Blank, Color, Order, Products, SkuToUpc, Inventory, ProductInventory } from "@pythias/mongo";
import { generatePieceID } from "@pythias/integrations";
import inventory from "@/models/inventory";

const updateInventory = async () => {
    let inventories = await Inventory.find({})
    console.log(inventories.length, "inventories")
    for (let inv of inventories) {
        let items = await Item.find({ "inventory.inventory": inv._id, labelPrinted: false, canceled: false, shipped: false, paid: true })
        if (inv.quantity < 0) {
            inv.quantity = 0;
        }
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
            console.log(inv.style_code, inv.color_name, inv.size_name, inv.quantity, inv.attached.length, inv.inStock.length, items.length, inv.orders.map(o => o.items.length).reduce((accumulator, currentValue) => accumulator + currentValue, 0));
            if (inv.quantity > 0) {
                for (let item of items) {
                    if (inv.quantity - inv.inStock.length > 0 && !inv.attached.includes(item._id.toString()) && !inv.inStock.includes(item._id.toString()) && !inv.orders.map(o => o.items.map(i => i)).flat().includes(item._id.toString())) {
                        inv.inStock.push(item._id.toString())
                    } else if (!inv.attached.includes(item._id.toString()) && !inv.inStock.includes(item._id.toString()) && !inv.orders.map(o => o.items.map(i => i)).flat().includes(item._id.toString())) {
                        inv.attached.push(item._id.toString())
                    }
                }
                await inv.save()
            } else {
                if (items.length > 0) {
                    for (let item of items) {
                        if (!inv.attached.includes(item._id.toString()) && !inv.inStock.includes(item._id.toString()) && !inv.orders.map(o => o.items.map(i => i)).flat().includes(item._id.toString())) {
                            inv.attached.push(item._id.toString())
                        }
                    }
                    await inv.save()
                }
            }
        }
    }
}

const createItem = async ({variant, design, order, inventoryType, name}) => {
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
        }
    })
    item = await item.save();
    return item
}

export async function POST(req = NextApiRequest, res = NextResponse) {
    let data = await req.json()
    const headersList = await headers();
    const authorizationHeader = headersList.get("authorization");
    //console.log("Authorization:", authorizationHeader);
    if(authorizationHeader){
        let password = authorizationHeader?.split(" ")[1]
        //console.log(password)
        let user = await User.findOne({password: password})
        //console.log(user)
        if(user){
            ///console.log(data, "data")
            let order = await Order.findOne({shopifyOrderId: data.order.shopifyOrderId }).populate("items");
            //console.log(order, "order")
            if(!order){
                console.log("Creating new order")
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
                });
                //console.log(order, "order to save")
                let items = [];
                for (let i of data.order.items) {
                    console.log(i, "item")
                    let product = await Products.findById(i.product).populate("design variantsArray.color variantsArray.threadColor variantsArray.blank variantsArray.inventory variantsArray.productInventory");
                    //console.log(product, "product")
                    if(product){
                        let variant = product.variantsArray.find(v => v.sku == i.sku);
                        for(let j = 0; j < i.quantity; j++) {
                            let inventoryType
                            if(variant.productInventory && variant.productInventory.quantity > 0 && variant.productInventory.quantity > variant.productInventory.inStock.length) {
                                inventoryType = "productInventory";
                            }else{
                                inventoryType = "inventory";
                            }
                            let item = await createItem({variant, design: product.design, order, inventoryType, name: product.name})
                            if (data.order.paymentStatus == "PAID") {
                                order.paid = true;
                                item.paid = true;
                                item = await item.save();
                            }
                            if(inventoryType == "productInventory") {
                                if(!variant.productInventory.inStock) variant.productInventory.inStock = [];
                                variant.productInventory.inStock.push(item._id);
                                await variant.productInventory.save();
                            }
                            items.push(item);
                        }
                    }else{
                        console.log("Product not found for item", i);
                    }
                }
                order.items = items;
                order = await order.save();
                updateInventory();
            }else{
                order.status = data.order.status;
                if (data.order.paymentStatus == "PAID"){
                    order.paid = true;
                    for (let item of order.items) {
                        if(!item.paid){
                            item.paid = true;
                            item = await item.save();
                        }
                    }
                }
                if(data.order.status == "CANCELED"){
                    order.canceled = true;
                    order.status = data.order.displayFinancialStatus
                    for(let item of order.items){
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
            return NextResponse.json({error: false, orderId: order._id })
        }
    }
    return NextResponse.json({error: true, msg: "Unauthorized"})
}
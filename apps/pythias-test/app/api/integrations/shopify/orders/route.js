import {NextApiRequest, NextResponse} from "next/server";
import { headers } from "next/headers";
import { User, Design, Items as Item, Blank, Color, Order, Products, SkuToUpc, Inventory, ProductInventory } from "@pythias/mongo";
import { generatePieceID } from "@pythias/integrations";

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

const createItem = async (i, order, blank, color, threadColor, size, design, sku) => {
    console.log(size, "size")
    let item = new Item({
        pieceId: await generatePieceID(),
        paid: true,
        sku: i.sku,
        orderItemId: i.orderItemId,
        blank: blank,
        styleCode: blank?.code,
        sizeName: size?.name,
        threadColorName: threadColor?.name,
        threadColor: threadColor,
        colorName: color?.name,
        color: color,
        size: size,
        design: threadColor ? design.threadImages[threadColor?.name] : design?.images,
        designRef: design,
        order: order._id,
        shippingType: order.shippingType,
        quantity: 1,
        status: order.status,
        name: i.name,
        date: order.date,
        type: design?.printType,
        upc: i.upc,
        options: i.options[0]?.value
    })
    item = await item.save();
    let productInventory = await ProductInventory.findOne({ sku: item.sku })
    if (productInventory && productInventory.quantity - productInventory.onhold > 0) {
        if (productInventory.quantity > 0 - productInventory.onhold > 0) {
            item.inventory.inventoryType = "productInventory"
            item.inventory.productInventory = productInventory._id
            productInventory.inStock.push(item._id.toString())
            await productInventory.save()
        }
    } else {
        let inventory = await Inventory.findOne({ blank: item.blank, color: item.color, sizeId: item.size })
        //console.log(inventory?.quantity, "inventory quantity for item",)
        if (inventory) {
            if (!item.inventory) item.inventory = {}
            item.inventory.inventoryType = "inventory"
            item.inventory.inventory = inventory._id
            console.log(inventory.attached, "inventory to save")
        }
    }
    return item
}

export async function POST(req = NextApiRequest, res = NextResponse) {
    let data = await req.json()
    const headersList = await headers();
    const authorizationHeader = headersList.get("authorization");
    console.log("Authorization:", authorizationHeader);
    console.log("Authorization:", authorizationHeader);
    if(authorizationHeader){
        let password = authorizationHeader?.split(" ")[1]
        console.log(password)
        let user = await User.findOne({password: password})
        console.log(user)
        if(user){
            console.log(data)
            let order = await Order.findOne({ shopifyOrderId: data.shopifyOrderId });
            if(!order){
                order = new Order({
                    shopifyOrderId: data.order.shopifyOrderId,
                    shippingAddress: {
                        name: data.order.shippingAddress.name,
                        addressLine1: data.order.shippingAddress.address1,
                        addressLine2: data.order.shippingAddress.address2,
                        city: data.order.shippingAddress.city,
                        state: data.order.shippingAddress.provinceCode,
                        zip: data.order.shippingAddress.zip,
                        country: data.order.shippingAddress.countryCode,
                    },
                    total: data.order.totalPrice,
                    status: data.order.status,
                });
            }
            return NextResponse.json({error: false, orderId: order._id })
        }
    }
    return NextResponse.json({error: true, msg: "Unauthorized"})
}
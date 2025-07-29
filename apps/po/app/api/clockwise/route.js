import {NextApiRequest, NextResponse} from "next/server";
import atob from "atob";
import Blank from "@/models/StyleV2"
import Items from "@/models/Items";
import Order from "@/models/Order";
export async function POST(req= NextApiRequest){
    let data = await req.json();
    let jsonData = JSON.parse(atob(data.buff));
    console.log(jsonData, "decoded data");
    for(let json of jsonData){
        try{
            let order = await Order.findOne({poNumber: json.po_number}).populate("items");
            if(!order){
                let shippingAddress = {
                    name: json.shipping_name,
                    address1: json.shipping_street_address,
                    address2: json.shipping_street_2,
                    city: json.shipping_city,
                    state: json.shipping_state,
                    zip: json.shipping_postal_code,
                    country: json.shipping_country,
                }
                order = {
                    shippingAddress,
                    poNumber: json.po_number,
                    orderId: json.id,
                    uniquePo: `${json.po_number}-${json.id}`,
                    shippingCost: 0,
                    taxCost: 0,
                    productCost: 0,
                    shippingType: "Standard",
                    clockWise: true,
                    status: "Received",
                    marketplace: "Clockwise",
                    items: [],
                }
                order = new Order({ ...order });
            }
            order = await order.save();
            let items = []
            
            for (let i = 0; i < json.decorations.length; i++) {
                let decoration = json.decorations[i];
                let item = order.items.find(i => i.pieceId == decoration.id);
                if (!item) item = {};
                if(!json.blanks[i]){
                    console.log("No blank found for decoration", decoration);
                    break;
                }
                item.sku = decoration.product_variation_sku;
                console.log(decoration, "decoration")
                console.log(json.blanks[i], "blank")
                let blank = await Blank.findOne({code: json.blanks[i]?.style}).populate("colors").lean()
                if(!blank){
                    console.log("Blank not found for style", json.blanks[i]?.style);
                    if (json.blanks[i]?.brand == "Bella + Canvas" || json.blanks[i]?.brand == "Next Level") {
                        blank = await Blank.findOne({ code: "PT" }).populate("colors").lean()
                    }else{
                        blank = await Blank.findOne({ code: "AFTH" }).populate("colors").lean()
                    }
                }
                item.blank = blank
                console.log(blank.colors.filter(c => c.name.toLowerCase() == json.blanks[i]?.color.toLowerCase())[0], "color")
                console.log(blank.sizes.filter(s => s.name.toLowerCase() == json.blanks[i]?.sizes[0].size.toLowerCase())[0], "size")
                let design = {}
                design[decoration.location.toLowerCase()] = decoration.artwork;
                item.labelPrinted = true;
                item.paid = true;
                item.order = order
                item.productCost = 0;
                item.pieceId = decoration.id;
                item.design = design;
                item.size = blank.sizes.filter(s => s.name.toLowerCase() == json.blanks[i]?.sizes[0].size.toLowerCase())[0];
                item.sizeName = json.blanks[i]?.sizes[0].size;
                item.colorName = json.blanks[i]?.color;
                item.styleCode = blank.code;
                item.color = blank.colors.filter(c => c.name.toLowerCase() == json.blanks[i]?.color.toLowerCase())[0];
                if(!item.color){
                    console.log("Color not found for name", json.blanks[i]?.color);
                    item.color = blank.colors.filter(c => json.blanks[i]?.color.toLowerCase().includes(c.name.toLowerCase()))[0]; // Fallback to first color if not found
                }
                item.styleV2 = blank._id;
                item.quantity = 1;
                item.clockWise = true;
                item.status = "Received";
                if(!item._id){
                    console.log("Creating new item for decoration", decoration);    
                    item = await Items.create(item);
                }else{
                    item = await item.save();
                }
                console.log(item, "item")
                items.push(item);
                //console.log(blank, "blank found")
            }
            //console.log(items, "items")
            order.items = items;
            order = await order.save();
            console.log(order, "order")
        }catch(e){
            console.log(e)
        }
    }
    return NextResponse.json({error: false, msg: "This is a test response from the Clockwise API endpoint."});
}
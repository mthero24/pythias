import {NextApiRequest, NextResponse} from "next/server";
import atob from "atob";
import Blank from "@/models/StyleV2"
export async function POST(req= NextApiRequest){
    let data = await req.json();
    let jsonData = JSON.parse(atob(data.buff));
    console.log(jsonData, "decoded data");
    console.log(jsonData[0])
    let shippingAddress = {
        name: jsonData[0].shipping_name,
        address: jsonData[0].shipping_street_address,
        address2: jsonData[0].shipping_street_2,
        city: jsonData[0].shipping_city,
        state: jsonData[0].shipping_state,
        zip: jsonData[0].shipping_postal_code,
        country: jsonData[0].shipping_country,
    }
    let order = {
        shippingAddress,
        poNumber: jsonData[0].po_number,
        orderId: jsonData[0].order_id,
        uniquePo: `${jsonData[0].po_number}-${jsonData[0].order_id}`,
        shippingCosdt: 0,
        taxCost: 0,
        productCost: 0,
        shippingType: "Standard",
        marketplace: "Clockwise",
    }
    let items = []
    for (let i = 0; i < jsonData[0].decorations.length; i++) {
        let item = {}
        let decoration = jsonData[0].decorations[i];
        item.sku = decoration.porduct_decoration_sku;
        console.log(decoration, "decoration")
        console.log(jsonData[0].blanks[i], "blank")
        let blank = await Blank.findOne({code: jsonData[0].blanks[i].style}).populate("colors").lean()
        if(!blank){
            console.log("Blank not found for style", jsonData[0].blanks[i].style);
            if (jsonData[0].blanks[i].brand == "Bella + Canvas" || jsonData[0].blanks[i].brand == "next Level") {
                blank = await Blank.findOne({ code: "PT" }).populate("colors").lean()
            }else{
                blank = await Blank.findOne({ code: "AFTH" }).populate("colors").lean()
            }
        }
        item.blank = blank
        console.log(blank.colors.filter(c => c.name.toLowerCase() == jsonData[0].blanks[i].color.toLowerCase())[0], "color")
        console.log(blank.sizes.filter(s => s.name.toLowerCase() == jsonData[0].blanks[i].sizes[i].size.toLowerCase())[0], "size")
        let design = {}
        design[decoration.location.toLowerCase()] = decoration.artwork;
        item.labelPrinted = true;
        item.paid = true;
        item.design = design;
        item.size = blank.sizes.filter(s => s.name.toLowerCase() == jsonData[0].blanks[i].sizes[i].size.toLowerCase())[0];
        item.sizeName = jsonData[0].blanks[i].sizes[i].size;
        item.colorName = jsonData[0].blanks[i].color;
        item.styleCode = blank.code;
        item.color = blank.colors.filter(c => c.name.toLowerCase() == jsonData[0].blanks[i].color.toLowerCase())[0];
        item.styleV2 = blank._id;
        item.quantity = 1;
        console.log(item, "item")
        //console.log(blank, "blank found")
    }
    return NextResponse.json({error: false, msg: "This is a test response from the Clockwise API endpoint."});
}
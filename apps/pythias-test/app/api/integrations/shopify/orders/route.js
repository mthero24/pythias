import {NextApiRequest, NextResponse} from "next/server";
import { headers } from "next/headers";
import {User, Order} from "@pythias/mongo";


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
                    shopifyOrderId: data.shopifyOrderId,
                    shippingAddress: {
                        name: data.shippingAddress.name,
                        addressLine1: data.shippingAddress.address1,
                        addressLine2: data.shippingAddress.address2,
                        city: data.shippingAddress.city,
                        state: data.shippingAddress.provinceCode,
                        zip: data.shippingAddress.zip,
                        country: data.shippingAddress.countryCode,
                    },
                    totalPrice: data.totalPrice,
                    currency: data.currency,
                    status: "pending",
                });
            }
            return NextResponse.json({error: false, orderId: order._id })
        }
    }
    return NextResponse.json({error: true, msg: "Unauthorized"})
}
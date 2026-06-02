import { NextApiRequest, NextResponse } from "next/server";
import {buyLabel} from "@pythias/shipping";
import {getRefund} from "@pythias/shipping"
import { Order } from "@pythias/mongo";
import { Manifest as manifest } from "@pythias/mongo";
import axios from "axios"
import { Bin } from "@pythias/mongo";
import {updateOrder} from "@pythias/integrations";
export async function POST(req= NextApiRequest){
    let data = await req.json();
    console.log(data)
    //return NextResponse.json({error: true})
    if(!data.address.country) data.address.country = "US"
    const buyOpts = {
        ...data,
        imageType: "PDF",
        businessAddress: data.marketplace == "TCS" ? { name: "TSC Distribution Center", businessName: "ATTN: Online Orders", address: "100 Rains Drive", city: "Fanklin", state: "KY", postalCode: "42134", country: "US" } : JSON.parse(process.env.businessAddress),
        providers: ["usps", "ups"],
        enSettings: { requesterID: process.env.endiciaRequesterID, accountNumber: process.env.endiciaAccountNUmber, passPhrase: process.env.endiciaPassPhrase },
        credentials: { clientId: process.env.uspsClientId, clientSecret: process.env.uspsClientSecret, crid: process.env.uspsCRID, mid: process.env.uspsMID, manifestMID: process.env.manifestMID, accountNumber: process.env.accountNumber, api: "apis" },
        credentialsFedEx: { accountNumber: process.env.tpalfedexaccountnumber, meterNumber: process.env.tpalfedexmeternumber, key: process.env.tpalfedexkey, password: process.env.tpalfedexpassword },
        credentialsFedExNew: { accountNumber: process.env.AccountFedExTest, key: process.env.ApiKeyTestFedEx, secret: process.env.SecretKeyFedExTest },
        credentialsUPS: { accountNumber: process.env.upsAccountNumber, clientID: process.env.upsClientId, clientSecret: process.env.upsClientSecret },
        credentialsDHL: { accountNumber: process.env.dhlAccount, basic: process.env.dhlBasic },
        thirdParty: data.marketplace?.trim() == "Zulily" ? process.env.upsZulily : data.marketplace?.trim() == "TSC" ? process.env.upsTSC : null,
        credentialsShipStation: { apiKey: process.env.ssV2 },
        imageFormat: "PDF",
        carrierCodes: { usps: "se-65258", ups: "se-801899" },
        warehouse_id: 349794,
    };
    try{
        const pkgs = data.packages?.length > 1 ? data.packages : [{ weight: data.weight, dimensions: data.dimensions }];
        const purchasedLabels = [];
        for (const pkg of pkgs) {
            const lbl = await buyLabel({ ...buyOpts, weight: pkg.weight, dimensions: pkg.dimensions });
            if (lbl.error) return NextResponse.json(lbl);
            purchasedLabels.push(lbl);
        }
        const primaryLabel = purchasedLabels[0];
        const totalCost = purchasedLabels.reduce((s, l) => s + parseFloat(l.cost || 0), 0);

        let order = await Order.findOne({_id: data.orderId}).populate("items");
        try { await updateOrder({ auth: `${process.env.ssApiKey}:${process.env.ssApiSecret}`, orderId: order.orderId, carrierCode: "usps", trackingNumber: primaryLabel.trackingNumber }); } catch(e) {}
        order.shippingInfo.label = primaryLabel.label;
        order.shippingInfo.shippingCost += totalCost;
        order.status = "Shipped";
        for (const lbl of purchasedLabels) {
            if (data.selectedShipping.provider == "usps") {
                await new manifest({ pic: lbl.trackingNumber, Date: new Date() }).save();
            }
            order.shippingInfo.labels.push({
                trackingNumber: lbl.trackingNumber,
                label: lbl.label,
                cost: parseFloat(lbl.cost || 0),
                trackingInfo: ["Label Purchased"],
                provider: data.selectedShipping.provider,
            });
        }
        for (let item of order.items) {
            item.shipped = true; item.shippedDate = new Date();
            if (!item.steps) item.steps = [];
            item.steps.push({ status: "Shipped", date: new Date() });
            await item.save();
        }
        order = await order.save();
        await Bin.findOneAndUpdate({ order: order._id }, { "items":[],"ready":false,"inUse":false,"order":null,"giftWrap":false,"readyToWrap":false,"wrapped":false,"wrapImage":null });
        const printHeaders = { headers: { "Content-Type": "application/json", "Authorization": `Bearer $2a$10$Z7IGcOqlki/aMY.SxBz6/.vj3toNJ39/TGh0YunAAUHh3dkWy1ZUW` } };
        for (const lbl of purchasedLabels) {
            try { await axios.post(`http://${process.env.localIP}/api/shipping/cpu`, { label: lbl.label, station: data.station, barcode: "ppp" }, printHeaders); } catch(e) { console.error("Print failed:", e.message); }
        }
        return NextResponse.json({
            error: false, label: primaryLabel.label,
            bins: {
                readyToShip: await Bin.find({ ready: true }).sort({ number: 1 }).populate({ path: "order", populate: "items" }).lean(),
                inUse: await Bin.find({ inUse: true }).sort({ number: 1 }).populate({ path: "order", populate: "items" }).lean(),
            },
        });
    }catch(e){
        console.log(e)
        return NextResponse.json({error: true, msg:JSON.stringify(e)})
    }
}

export async function PUT(req= NextApiRequest){
    let data = await req.json();
    let res = await getRefund({providers: ["usps", "fedex"], PIC: data.PIC,  enSettings: {
        requesterID: process.env.endiciaRequesterID,
        accountNumber: process.env.endiciaAccountNUmber,
        passPhrase: process.env.endiciaPassPhrase,
        },
        credentials: {
            clientId: process.env.uspsClientId,
            clientSecret: process.env.uspsClientSecret,
            crid: process.env.uspsCRID,
            mid: process.env.uspsMID,
            manifestMID: process.env.manifestMID,
            accountNumber: process.env.accountNumber
        },
        credentialsFedEx: {
        accountNumber: process.env.tpalfedexaccountnumber,
        meterNumber: process.env.tpalfedexmeternumber,
        key: process.env.tpalfedexkey,
        password: process.env.tpalfedexpassword,
        },
        credentialsFedExNew: {
        accountNumber: process.env.AccountFedExTest,
        key: process.env.ApiKeyTestFedEx,
        secret: process.env.SecretKeyFedExTest,
        },
        credentialsUPS: {
        accountNumber: process.env.UPSAccountNumber,
        clientID: process.env.UPSClientID,
        clientSecret: process.env.UPSClientSecret,
        },})
    return NextResponse.json(res)
}
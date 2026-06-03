import { NextResponse } from "next/server";
import { PlatformLicenseHolder as LicenseHolders, PlatformDesign as Design, PlatformItem as Items } from "@pythias/mongo";
import { getToken } from "next-auth/jwt";

export async function GET(req) {
    const token = await getToken({ req });
    const orgId = token?.orgId;

    let licenses = await LicenseHolders.find({ orgId }).lean();
    let months = Array.from({ length: 12 }, (_, i) => ({ number: i, licenses: [] }));

    for (let l of licenses) {
        let designs = await Design.find({ orgId, licenseHolder: l._id }).select("_id").lean();
        let items = await Items.find({
            orgId,
            designRef: { $in: designs.map(d => d._id) },
            date: { $gt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) },
        }).populate("blank").lean();

        for (let i of items) {
            let month = new Date(i.date).getMonth();
            let size = i.blank?.sizes?.find(s => s.name?.toString() === i.sizeName?.toString());
            let price = i.price ? i.price : size ? size.retailPrice : 0;
            price = price + (l.additionalFees ?? 0);
            let payment = price * (l.paymentType === "Percentage Per Unit" ? (l.amount / 100) : 1)
                + (l.paymentType === "Flat Per Unit" || l.paymentType === "One Time" ? l.amount : 0);

            let mo = months.find(m => m.number === month);
            let license = mo.licenses.find(li => li._id.toString() === l._id.toString());
            if (!license) {
                mo.licenses.push({ ...l, totalOwed: payment ?? 0, sold: price });
            } else {
                license.totalOwed += payment ?? 0;
                license.sold += price;
            }
        }
    }

    return NextResponse.json({ error: false, months, licenses });
}

export async function POST(req) {
    const token = await getToken({ req });
    const orgId = token?.orgId;
    let { license } = await req.json();

    if (!license._id) {
        license = new LicenseHolders({ ...license, orgId });
        await license.save();
    } else {
        license = await LicenseHolders.findOneAndUpdate({ _id: license._id, orgId }, { ...license }, { new: true });
    }

    const licenses = await LicenseHolders.find({ orgId }).lean();
    return NextResponse.json({ error: false, licenses });
}

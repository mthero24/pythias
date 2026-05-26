import { NextResponse } from "next/server";
import { ServicePlanPo } from "@pythias/mongo";

export async function GET() {
    const plans = await ServicePlanPo.find({}).sort({ appName: 1 }).lean();
    return NextResponse.json({ plans });
}

export async function POST(req) {
    const { appName, description, monthlyPrice } = await req.json();
    if (!appName || monthlyPrice == null) {
        return NextResponse.json({ error: "appName and monthlyPrice are required" }, { status: 400 });
    }
    const plan = await ServicePlanPo.create({ appName, description: description ?? "", monthlyPrice });
    return NextResponse.json({ plan });
}

export async function PUT(req) {
    const { _id, appName, description, monthlyPrice, active } = await req.json();
    if (!_id) return NextResponse.json({ error: "Missing _id" }, { status: 400 });
    const update = { updatedAt: new Date() };
    if (appName != null) update.appName = appName;
    if (description != null) update.description = description;
    if (monthlyPrice != null) update.monthlyPrice = monthlyPrice;
    if (active != null) update.active = active;
    const plan = await ServicePlanPo.findByIdAndUpdate(_id, update, { new: true });
    return NextResponse.json({ plan });
}

export async function DELETE(req) {
    const { _id } = await req.json();
    if (!_id) return NextResponse.json({ error: "Missing _id" }, { status: 400 });
    await ServicePlanPo.findByIdAndDelete(_id);
    return NextResponse.json({ ok: true });
}

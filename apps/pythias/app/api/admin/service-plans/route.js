import { NextResponse } from "next/server";
import { ServicePlanPremier, ServicePlanPo } from "@pythias/mongo";

const MODEL = { "premier-printing": ServicePlanPremier, po: ServicePlanPo };

export async function GET() {
    const [premierPlans, poPlans] = await Promise.all([
        ServicePlanPremier.find({}).sort({ appName: 1 }).lean(),
        ServicePlanPo.find({}).sort({ appName: 1 }).lean(),
    ]);
    const plans = [
        ...premierPlans.map(p => ({ ...p, _client: "premier-printing" })),
        ...poPlans.map(p => ({ ...p, _client: "po" })),
    ];
    return NextResponse.json({ plans });
}

export async function POST(req) {
    const { client, appName, description, monthlyPrice } = await req.json();
    const M = MODEL[client];
    if (!M) return NextResponse.json({ error: "Invalid client" }, { status: 400 });
    if (!appName || monthlyPrice == null) {
        return NextResponse.json({ error: "appName and monthlyPrice are required" }, { status: 400 });
    }
    const plan = await M.create({ appName, description: description ?? "", monthlyPrice });
    return NextResponse.json({ plan: { ...plan.toObject(), _client: client } });
}

export async function PUT(req) {
    const { _id, client, appName, description, monthlyPrice, active } = await req.json();
    const M = MODEL[client];
    if (!_id || !M) return NextResponse.json({ error: "Missing _id or invalid client" }, { status: 400 });
    const update = { updatedAt: new Date() };
    if (appName != null) update.appName = appName;
    if (description != null) update.description = description;
    if (monthlyPrice != null) update.monthlyPrice = monthlyPrice;
    if (active != null) update.active = active;
    const plan = await M.findByIdAndUpdate(_id, update, { new: true });
    return NextResponse.json({ plan: { ...plan.toObject(), _client: client } });
}

export async function DELETE(req) {
    const { _id, client } = await req.json();
    const M = MODEL[client];
    if (!_id || !M) return NextResponse.json({ error: "Missing _id or invalid client" }, { status: 400 });
    await M.findByIdAndDelete(_id);
    return NextResponse.json({ ok: true });
}

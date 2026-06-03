import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { Settings } from "@pythias/mongo";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: true, msg: "Unauthorized" }, { status: 401 });

    const [apiKeyDoc, secondaryKeyDoc, accountNumberDoc] = await Promise.all([
        Settings.findOne({ key: "gs1.apiKey" }).lean(),
        Settings.findOne({ key: "gs1.secondaryKey" }).lean(),
        Settings.findOne({ key: "gs1.accountNumber" }).lean(),
    ]);

    return NextResponse.json({
        error: false,
        gs1: {
            apiKey: apiKeyDoc?.value ?? "",
            secondaryKey: secondaryKeyDoc?.value ?? "",
            accountNumber: accountNumberDoc?.value ?? "",
        },
    });
}

export async function PUT(req) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: true, msg: "Unauthorized" }, { status: 401 });

    const { apiKey, secondaryKey, accountNumber } = await req.json();

    await Promise.all([
        Settings.findOneAndUpdate({ key: "gs1.apiKey" }, { key: "gs1.apiKey", value: apiKey ?? "" }, { upsert: true }),
        Settings.findOneAndUpdate({ key: "gs1.secondaryKey" }, { key: "gs1.secondaryKey", value: secondaryKey ?? "" }, { upsert: true }),
        Settings.findOneAndUpdate({ key: "gs1.accountNumber" }, { key: "gs1.accountNumber", value: accountNumber ?? "" }, { upsert: true }),
    ]);

    return NextResponse.json({ error: false });
}

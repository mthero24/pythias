import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { Settings } from "@pythias/mongo";
import { handleGs1DashboardGET } from "@pythias/integrations";

export async function GET(req) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: true }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const limit  = parseInt(searchParams.get("limit")  ?? "25");
    const skip   = parseInt(searchParams.get("skip")   ?? "0");
    const search = searchParams.get("search") ?? "";

    const [apiKeyDoc, accountDoc] = await Promise.all([
        Settings.findOne({ key: "gs1.apiKey" }).lean(),
        Settings.findOne({ key: "gs1.accountNumber" }).lean(),
    ]);

    const data = await handleGs1DashboardGET({
        apiKey:        apiKeyDoc?.value ?? "",
        accountNumber: accountDoc?.value ?? "",
        limit, skip, search,
    });

    return NextResponse.json(data);
}

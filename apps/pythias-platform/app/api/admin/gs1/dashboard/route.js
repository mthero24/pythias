import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { Organization } from "@pythias/mongo";
import { handleGs1DashboardGET } from "@pythias/integrations";

export async function GET(req) {
    const token = await getToken({ req });
    if (!token?.orgId) return NextResponse.json({ error: true }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const limit  = parseInt(searchParams.get("limit")  ?? "25");
    const skip   = parseInt(searchParams.get("skip")   ?? "0");
    const search = searchParams.get("search") ?? "";

    const org = await Organization.findById(token.orgId).select("settings.gs1").lean();
    const gs1 = org?.settings?.gs1 ?? {};

    const data = await handleGs1DashboardGET({
        apiKey:        gs1.apiKey        ?? "",
        accountNumber: gs1.accountNumber ?? "",
        limit, skip, search,
    });

    return NextResponse.json(data);
}

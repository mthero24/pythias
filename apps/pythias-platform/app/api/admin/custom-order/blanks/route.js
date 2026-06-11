import { NextResponse } from "next/server";
import { PlatformBlank as Blank } from "@pythias/mongo";
import { getToken } from "next-auth/jwt";

// GET /api/admin/custom-order/blanks?q=search
export async function GET(request) {
    const token  = await getToken({ req: request });
    const orgId  = token?.orgId;
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || "";
    const filter = { orgId, active: true };
    if (q) {
        filter.$or = [
            { code:  { $regex: q, $options: "i" } },
            { name:  { $regex: q, $options: "i" } },
            { brand: { $regex: q, $options: "i" } },
        ];
    }
    const blanks = await Blank.find(filter)
        .populate("colors")
        .select("code name colors sizes brand department")
        .limit(40)
        .lean();
    return NextResponse.json({ blanks });
}

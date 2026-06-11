import { NextResponse } from "next/server";
import { Blank } from "@pythias/mongo";

// GET /api/admin/custom-order/blanks?q=search
export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || "";
    const filter = q
        ? { active: true, $or: [
            { code:  { $regex: q, $options: "i" } },
            { name:  { $regex: q, $options: "i" } },
            { brand: { $regex: q, $options: "i" } },
        ]}
        : { active: true };
    const blanks = await Blank.find(filter)
        .populate("colors")
        .select("code name colors sizes brand department")
        .limit(40)
        .lean();
    return NextResponse.json({ blanks });
}

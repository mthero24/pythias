import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { InkFormula } from "@pythias/mongo";
import { hexToLab, deltaE2000 } from "@/lib/color";

// Given a target hex, rank the org's saved formulas by CIEDE2000 ΔE (closest first) so an
// operator can pick the best existing recipe. Grams/cost are computed client-side from the
// chosen formula + batch weight so the operator can re-scale without another round trip.
export async function POST(req) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const orgId = session.user.orgId;

    const { targetHex, limit } = await req.json();
    const targetLab = hexToLab(targetHex);
    if (!targetLab) return NextResponse.json({ error: "valid targetHex required" }, { status: 400 });

    const formulas = await InkFormula.find({ orgId })
        .populate("components.base", "name code hex costPerGram")
        .lean();

    const ranked = formulas
        .map((f) => {
            // Fall back to deriving Lab from the stored hex for older formulas saved before targetLab.
            const lab = f.targetLab?.L != null ? f.targetLab : hexToLab(f.targetHex);
            return { ...f, deltaE: lab ? deltaE2000(targetLab, lab) : Infinity };
        })
        .filter((f) => Number.isFinite(f.deltaE))
        .sort((a, b) => a.deltaE - b.deltaE)
        .slice(0, Number(limit) > 0 ? Number(limit) : 5);

    return NextResponse.json({ targetLab, matches: ranked });
}

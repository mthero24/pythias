import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { redirect } from "next/navigation";
import { PlatformBin } from "@pythias/mongo";
import { Main } from "@pythias/shipping";
import { getOrgCreds } from "@/lib/getOrgCreds";
export const dynamic = "force-dynamic";

export default async function Shipping(req) {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    const orgId = session.user.orgId;
    const creds = await getOrgCreds(orgId);

    const stations = creds.production?.shippingStations ?? [];
    const binCount = await PlatformBin.countDocuments({ orgId });

    const [readyToShip, inUse] = await Promise.all([
        PlatformBin.find({ orgId, status: "ready" })
            .sort({ number: 1 })
            .populate({ path: "order", populate: "items" })
            .lean(),
        PlatformBin.find({ orgId, status: "in_use" })
            .sort({ number: 1 })
            .populate({ path: "order", populate: "items" })
            .lean(),
    ]);

    const params = await req.searchParams;
    const pieceId = params.pieceId;
    const station = params.station;

    return (
        <Main
            stations={stations}
            binCount={binCount}
            bins={{
                readyToShip: JSON.parse(JSON.stringify(readyToShip)),
                inUse: JSON.parse(JSON.stringify(inUse)),
            }}
            pieceId={pieceId}
            stat={station}
            source="PLATFORM"
        />
    );
}

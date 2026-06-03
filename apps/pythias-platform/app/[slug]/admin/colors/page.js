import { PlatformColor } from "@pythias/mongo";
import { serialize } from "@/functions/serialize";
import { ColorsMain } from "@pythias/backend";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";

export const dynamic = 'force-dynamic';

export default async function Colors() {
    const session = await getServerSession(authOptions);
    const orgId = session?.user?.orgId;
    let colors = await PlatformColor.find({ orgId, combined: { $in: [false, null] } }).lean();
    colors = serialize(colors);
    return <ColorsMain colors={colors} />;
}

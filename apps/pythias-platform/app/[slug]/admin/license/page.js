import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { PlatformLicenseHolder } from "@pythias/mongo";
import { serialize } from "@/functions/serialize";
import { Main } from "@pythias/licenses";

export const dynamic = 'force-dynamic';

export default async function LicensePage() {
    const session = await getServerSession(authOptions);
    const orgId = session?.user?.orgId;
    let licenses = await PlatformLicenseHolder.find({ orgId }).lean();
    licenses = serialize(licenses);
    return <Main licenses={licenses} />;
}

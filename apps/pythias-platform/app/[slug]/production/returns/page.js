import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { redirect } from "next/navigation";
import { PlatformBlank } from "@pythias/mongo";
import { Main } from "@pythias/returns";
export const dynamic = "force-dynamic";

export default async function Returns() {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    const blanks = await PlatformBlank.find({ orgId: session.user.orgId }).lean();

    return (
        <Main
            blanks={JSON.parse(JSON.stringify(blanks))}
            source="PLATFORM"
        />
    );
}

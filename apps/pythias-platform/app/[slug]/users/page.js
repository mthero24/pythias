import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { redirect } from "next/navigation";
import { PlatformUser } from "@pythias/mongo";
import { PlatformUsersPage } from "@/components/PlatformUsersPage";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    const users = await PlatformUser.find({ orgId: session.user.orgId })
        .select("-password")
        .lean();

    return <PlatformUsersPage users={JSON.parse(JSON.stringify(users))} />;
}

import { Users } from "@pythias/mongo";
import { UsersMain } from "@pythias/backend";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function User() {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/admin");

    const users = await Users.find({})
        .select("userName firstName lastName email role permissions avatar lastSeen")
        .lean();
    return <UsersMain user={JSON.parse(JSON.stringify(users))} />;
}

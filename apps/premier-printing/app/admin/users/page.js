import { Users } from "@pythias/mongo";
import { UsersMain } from "@pythias/backend";

export const dynamic = "force-dynamic";

export default async function User() {
    const users = await Users.find({})
        .select("userName firstName lastName email role permissions avatar lastSeen")
        .lean();
    return <UsersMain user={JSON.parse(JSON.stringify(users))} />;
}

import { AccountMain } from "@pythias/backend";
import { User } from "@pythias/mongo";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export default async function Account() {
    const headersList = await headers();
    const userName = headersList.get("user");
    const user = await User.findOne({ userName })
        .select("userName firstName lastName email role avatar")
        .lean();
    return <AccountMain user={JSON.parse(JSON.stringify(user ?? {}))} />;
}

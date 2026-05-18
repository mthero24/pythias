import { AccountMain } from "@pythias/backend";
import User from "@/models/User";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export default async function Account() {
    const headersList = await headers();
    const me = headersList.get("user");
    if (!me) return <AccountMain user={{}} />;
    const user = await User.findOne({ email: me })
        .select("firstName lastName email isAdmin type avatar")
        .lean();
    const safe = user ? JSON.parse(JSON.stringify({
        ...user,
        userName: me,
        role: user.isAdmin ? "admin" : user.type,
    })) : {};
    return <AccountMain user={safe} />;
}

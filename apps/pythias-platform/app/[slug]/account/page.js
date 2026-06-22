import { AccountMain } from "@pythias/backend";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { redirect } from "next/navigation";
import { User } from "@pythias/mongo";

export const dynamic = "force-dynamic";

// Per-user profile/account page — mirrors Premier's. AccountMain posts to /api/account
// (name/avatar/password) + /api/messages/upload (avatar), both of which the platform has.
export default async function AccountPage() {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");
    const user = await User.findOne({
        $or: [{ userName: session.user.userName }, { email: session.user.email }],
    }).select("userName firstName lastName email role avatar").lean();
    return <AccountMain user={JSON.parse(JSON.stringify(user ?? {}))} />;
}

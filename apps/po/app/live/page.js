import { LiveUsers } from "@pythias/backend";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { redirect } from "next/navigation";
export const dynamic = "force-dynamic";

export default async function LivePage() {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "admin") redirect("/");
    return <LiveUsers apiUrl="/api/admin/users/presence" />;
}

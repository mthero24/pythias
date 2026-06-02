import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { redirect } from "next/navigation";

// Super-admin area — requires PYTHIAS_ADMIN_EMAILS env var (comma-separated)
export default async function AdminLayout({ children }) {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    const adminEmails = (process.env.PYTHIAS_ADMIN_EMAILS ?? "").split(",").map(e => e.trim());
    if (!adminEmails.includes(session.user.email)) {
        redirect("/dashboard");
    }

    return <>{children}</>;
}

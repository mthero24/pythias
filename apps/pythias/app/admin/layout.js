import { headers } from "next/headers";
import { redirect } from "next/navigation";
import AdminSidebar from "./AdminSidebar";

export default async function AdminLayout({ children }) {
    const headersList = await headers();
    const user = headersList.get("user");
    if (!user) redirect("/login");

    return (
        <div style={{ display: "flex", minHeight: "100vh" }}>
            <AdminSidebar />
            <main style={{ flex: 1, overflowY: "auto" }}>
                {children}
            </main>
        </div>
    );
}

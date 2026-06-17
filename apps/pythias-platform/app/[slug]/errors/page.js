import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import ErrorsClient from "./ErrorsClient";

export const dynamic = "force-dynamic";

export default async function ErrorsPage() {
    const session = await getServerSession(authOptions);
    if (!session) return null;
    return <ErrorsClient />;
}

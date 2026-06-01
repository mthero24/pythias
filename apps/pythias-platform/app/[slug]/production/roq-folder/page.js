import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { redirect } from "next/navigation";
import { getOrgCreds } from "@/lib/getOrgCreds";
import { Main } from "@pythias/roq-folder";
export const dynamic = "force-dynamic";

export default async function RoqFolder() {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    const creds = await getOrgCreds(session.user.orgId);

    return <Main localIP={creds.localIP} localKey={creds.localKey} />;
}

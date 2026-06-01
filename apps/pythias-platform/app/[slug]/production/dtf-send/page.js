import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { redirect } from "next/navigation";
import { getOrgCreds } from "@/lib/getOrgCreds";
import { setConfig, DTFSend } from "@pythias/dtf";
export const dynamic = "force-dynamic";

export default async function DtfSend() {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    const creds = await getOrgCreds(session.user.orgId);
    const dtfPrinters = creds.production?.dtfPrinters ?? [];

    setConfig({ active: true, localIP: creds.localIP, localKey: creds.localKey });

    return <DTFSend printers={dtfPrinters} />;
}

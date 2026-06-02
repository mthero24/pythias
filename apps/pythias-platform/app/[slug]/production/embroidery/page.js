import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { redirect } from "next/navigation";
import { getOrgCreds } from "@/lib/getOrgCreds";
import { Main } from "@pythias/embroidery";
import { Box } from "@mui/material";
export const dynamic = "force-dynamic";

export default async function Embroidery() {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    const creds = await getOrgCreds(session.user.orgId);
    const machines = creds.production?.embroideryMachines ?? ["machine1"];

    return (
        <Box sx={{ padding: "3%", background: "#e2e2e2", minHeight: "92vh" }}>
            <Main printers={machines} />
        </Box>
    );
}

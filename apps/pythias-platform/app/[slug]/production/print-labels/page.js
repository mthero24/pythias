import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { redirect } from "next/navigation";
import { LabelsData } from "@/functions/labelsData";
import { Main } from "@pythias/labels";
export const dynamic = "force-dynamic";

export default async function PrintLabels() {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    const { labels, giftMessages, rePulls, batches } = await LabelsData(session.user.orgId);
    return (
        <Main
            labels={labels}
            giftLabels={giftMessages}
            rePulls={rePulls}
            batches={batches}
            source="PLATFORM"
        />
    );
}

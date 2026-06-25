import { OutreachClient } from "@pythias/backend";
import { OutreachProspect } from "@pythias/mongo";

export const dynamic = "force-dynamic";

export default async function OutreachPage() {
    let prospects = [];
    let dueCount = 0;
    try {
        const raw = await OutreachProspect.find({}).sort({ createdAt: -1 }).lean();
        prospects = JSON.parse(JSON.stringify(raw));
        dueCount = await OutreachProspect.countDocuments({
            status: "active",
            nextSendAt: { $lte: new Date() },
        });
    } catch (e) {
        console.error("[outreach page]", e);
    }
    return <OutreachClient prospects={prospects} dueCount={dueCount} apiUrl="/api/admin/outreach" />;
}

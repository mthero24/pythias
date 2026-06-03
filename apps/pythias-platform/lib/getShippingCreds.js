import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { getOrgCreds } from "./getOrgCreds";

export async function getShippingCreds() {
    const session = await getServerSession(authOptions);
    const orgId = session?.user?.orgId;
    if (!orgId) return { localIP: "", localKey: "", stations: [], labelPrinters: [] };

    const doc = await getOrgCreds(orgId);
    return {
        localIP: doc.localIP ?? "",
        localKey: doc.localKey ?? "",
        stations: doc.stations ?? [],
        labelPrinters: (() => {
            try { return JSON.parse(doc.productionLabelPrinters || "[]"); }
            catch { return []; }
        })(),
    };
}

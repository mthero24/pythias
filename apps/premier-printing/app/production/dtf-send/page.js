import { DTFSend, setConfig } from "@pythias/dtf";
import { Settings } from "@pythias/mongo";

setConfig(process.env.dtf);

export default async function dtfSend() {
    let printers = [];
    try {
        const doc = await Settings.findOne({ key: "production" }).lean();
        const prod = doc?.value ? JSON.parse(doc.value) : {};
        printers = prod.dtfPrinters ?? [];
    } catch {}

    return <DTFSend printers={printers} />;
}
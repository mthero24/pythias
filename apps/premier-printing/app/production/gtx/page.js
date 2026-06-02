import { Settings } from "@pythias/mongo";
import GTXClient from "./GTXClient";

export default async function GTXPage() {
    let printers = [];
    try {
        const doc = await Settings.findOne({ key: "production" }).lean();
        const prod = doc?.value ? JSON.parse(doc.value) : {};
        printers = prod.gtxPrinters ?? [];
    } catch {}
    return <GTXClient printers={printers} />;
}

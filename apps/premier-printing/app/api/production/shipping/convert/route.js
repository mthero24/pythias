import { NextApiRequest, NextResponse } from "next/server";
import { convertLabel } from "@pythias/shipping";
import { getShippingCreds } from "@/lib/getShippingCreds";
import axios from "axios";

export async function POST(req = NextApiRequest) {
    const { label, fromFormat, toFormat, station } = await req.json();
    if (!label || !fromFormat || !toFormat) {
        return NextResponse.json({ error: true, msg: "label, fromFormat, and toFormat are required" });
    }
    const result = await convertLabel(label, fromFormat.toUpperCase(), toFormat.toUpperCase());
    if (!result.converted && result.error) {
        return NextResponse.json({ error: true, msg: result.error, label: result.label, format: result.format });
    }

    // If a station is provided, send the converted label directly to the printer
    if (station && result.converted) {
        try {
            const sc = await getShippingCreds();
            const stationCfg = sc.stations.find(s => s.name === station);
            const stationFmt = stationCfg?.format ?? toFormat.toUpperCase();
            const endpoint = stationFmt === "ZPL" ? "printers" : "cpu";
            const printHeaders = { headers: { "Content-Type": "application/json", "Authorization": `Bearer ${sc.localKey}` } };
            await axios.post(`http://${sc.localIP}/api/shipping/${endpoint}`, { label: result.label, station, barcode: "ppp" }, printHeaders);
        } catch(e) { console.error("Print after convert failed:", e.message); }
    }

    return NextResponse.json({ error: false, label: result.label, format: result.format, converted: result.converted });
}

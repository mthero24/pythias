import { NextResponse } from "next/server";
import btoa from "btoa";
import axios from "axios";
import { getShippingCreds } from "@/lib/getShippingCreds";

export async function POST(req) {
    let data;
    try {
        data = await req.json();
    } catch {
        return NextResponse.json({ error: true, msg: "Invalid request body" }, { status: 400 });
    }

    const { item } = data;
    if (!item?.pieceId) {
        return NextResponse.json({ error: true, msg: "Missing pieceId" }, { status: 400 });
    }

    const label = `^XA
^FO50,80^BY2^BC,120,N,N,N,A^FD${item.pieceId}^FS
^LH6,6^CFS,30,6^AXN,22,30^FO15,30^FDPO#: ${item.order?.poNumber ?? ""}^FS
^LH6,6^CFS,30,6^AXN,22,30^FO15,60^FDPiece: ${item.pieceId}^FS
^LH12,18^CFS,25,12^AXN,75,90^FO120,250^FD${item.styleCode ?? ""}^FS
^LH12,18^CFS,25,12^AXN,30,35^FO20,360^FD${item.colorName ?? ""}^FS
^LH12,18^CFS,25,12^AXN,30,35^FO20,390^FD${item.sizeName ?? ""}^FS
^LH12,18^CFS,25,12^AXN,40,50^FO20,230^FDBin: ${item.bin ?? "?"}^FS
^LH12,18^CFS,25,12^AXN,22,30^FO20,430^FD[REPRINT]^FS
^XZ`;

    const sc = await getShippingCreds();
    try {
        await axios.post(
            `http://${sc.localIP}/api/print-labels`,
            { label: btoa(label), printer: "printer1" },
            {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${sc.localKey}`,
                },
                timeout: 10_000,
            }
        );
    } catch (e) {
        console.error("[reprint-barcode] printer error:", e.message);
        return NextResponse.json({ error: true, msg: "Printer unreachable" }, { status: 503 });
    }

    return NextResponse.json({ error: false });
}

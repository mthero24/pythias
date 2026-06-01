import { PlatformItem } from "@pythias/mongo";
import { Types } from "mongoose";

export async function buildLabelData(item, i, poNumber, totalQuantity) {
    if (totalQuantity == null) {
        totalQuantity = await PlatformItem.countDocuments({
            order: typeof item.order === "object" ? item.order._id : item.order,
            cancelled: false,
        });
    }

    const printTypeAbbr = item.designRef?.printType ?? "DTF";
    const printPO = poNumber ? `^LH12,18^CFS,25,12^AXN,22,30^FO150,540^FDPO:${poNumber}^FS` : "";

    const labelString = `
^XA
  ^FO50,55^BY2^BC,100,N,N,N,A^FD${item.pieceId}^FS
  ^LH6,6^CFS,30,6^AXN,22,30^FO10,15^FDPO#: ${item.order?.poNumber ?? "no order"}^FS
  ^LH6,6^CFS,30,6^AXN,22,30^FO10,35^FDPiece: ${item.pieceId}^FS
  ^LH12,18^CFS,25,12^AXN,22,30^FO10,175^FD#${i + 1}^FS
  ^LH12,18^CFS,25,12^AXN,75,90^FO100,175^FD${item.styleCode ?? ""}^FS
  ^LH12,18^CFS,25,12^AXN,22,30^FO320,70^FD${new Date(item.date).toLocaleDateString("en-US")}^FS
  ^LH12,18^CFS,25,12^AXN,30,35^FO10,230^FDColor: ${item.colorName}^FS
  ^LH12,18^CFS,25,12^AXN,22,30^FO10,260^FDSize: ${item.sizeName} Shipping: ${item.shippingType}^FS
  ^LH12,18^CFS,25,12^AXN,22,30^FO10,290^FD Sku: ${item.designRef?.sku ?? item.sku ?? ""} CNT ${totalQuantity}^FS
  ^LH12,18^CFS,25,12^AXN,22,30^FO10,320^FD Title: ${item.designRef?.name ?? item.name ?? ""}^FS
  ^LH12,18^CFS,25,12^AXN,40,50^FO10,355^FD${printTypeAbbr}^FS
  ${printPO}
^XZ`;

    return labelString;
}

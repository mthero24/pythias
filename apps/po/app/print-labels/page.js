import { LabelsData } from "../../functions/labels";
import { Main } from "@pythias/labels";
import { getShippingCreds } from "@/lib/getShippingCreds";
export const dynamic = 'force-dynamic';
export default async function PrintLabels(){
    const [{labels, giftMessages, rePulls, batches}, sc] = await Promise.all([LabelsData(), getShippingCreds()]);
    return <Main labels={labels} giftLabels={giftMessages} rePulls={rePulls} batches={batches} source="po" printers={sc.labelPrinters} />
}
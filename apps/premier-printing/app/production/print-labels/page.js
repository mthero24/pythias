import { LabelsData } from "@/functions/labels";
import {Main} from "@pythias/labels"
import { getShippingCreds } from "@/lib/getShippingCreds";
import { loadTemplate } from "@/functions/labelString";
export const dynamic = 'force-dynamic';
export default async function PrintLabels(){
    const [{labels, giftMessages, rePulls, batches}, sc, tpl] = await Promise.all([LabelsData(), getShippingCreds(), loadTemplate()]);
    const useShipByDate = (tpl.fields ?? []).includes("shipByDate");
    return <Main labels={labels} giftLabels={giftMessages} rePulls={rePulls} batches={batches} source={"PP"} printers={sc.labelPrinters} useShipByDate={useShipByDate} stackInventoryLoc={!!tpl.stackInventoryLoc} />
}
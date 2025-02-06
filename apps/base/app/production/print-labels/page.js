import { LabelsData } from "../../../functions/labels";
import {Main} from "@pythias/labels"

export default async function PrintLabels(){
    const {labels, giftMessages, rePulls, batches} = await LabelsData()
    return <Main labels={labels} giftLabels={giftMessages} rePulls={rePulls} batches={batches}/>
}
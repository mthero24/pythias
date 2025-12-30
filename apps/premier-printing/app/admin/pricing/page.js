import { Print } from "@mui/icons-material";
import {PricingMain, serialize} from "@pythias/backend";
import {PrintTypes} from "@pythias/mongo";
export default async function PricingPage() {
    let printTypes = await PrintTypes.find({});
    printTypes = serialize(printTypes);
    return <PricingMain printTypes={printTypes} />;
}

import { Design, SkuToUpc, SkuToUpcOld, Blank, Color, Size, Products, marketPlaces, ApiKeyIntegrations, Inventory, ProductInventory, Items, Order, LicenseHolders, Converters } from "@pythias/mongo"
import axios from "axios";
import { pullOrders, updateInventory} from "@/functions/pullOrders"
import { getOrders, generatePieceID, getPages, getPageOrders } from "@pythias/integrations";
import { canceled } from "@/functions/itemFunctions";
import { style } from "@mui/system";
import { runTrackingAll, runTracking } from "@/functions/tracking";

export default async function Test(){
    //await runTracking()
    return <h1>test</h1>
}
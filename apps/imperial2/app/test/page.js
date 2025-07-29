import { pullOrders } from "@/functions/pullOrders"
import {Inventory, InventoryOrders} from "@pythias/mongo"
import axios from "axios";
export default async function Test(){
    //await pullOrders()
    let res = await axios.get(`https://www.etsy.com/oauth/connect?
        response_type = code
        & redirect_uri=https://www.pythiastechinologies.com/etsy
    & scope=transactions_r transactions_w
    & client_id=1aa2bb33c44d55eeeeee6fff & state=superstate
    & code_challenge=DSWlW2Abh - cf8CeLL8 - g3hQ2WQyYdKyiu83u_s7nRhI
    & code_challenge_method=S256`)
    return <h1>test</h1>
}
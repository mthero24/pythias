import axios from "axios";
import btoa from "btoa"
export async function getOrders({auth}){
    console.log(auth)
    let headers = {
        headers: {
            Authorization: `Basic ${btoa(auth)}`
        }
    }
    console.log(new Date(Date.now() - 3 * (24 * 60 * 60 * 1000)))
    let res = await axios.get(`https://ssapi.shipstation.com/orders?createDateStart=02/21/2025&pageSize=500`, headers).catch(e=>{console.log(e.response.data)})
    // for(let order of res.data.orders){
    //     for(let i of order.items){
    //         console.log("sku: ", i.sku, "upc: ", i.upc)
    //     }
    // }
    return res?.data.orders
}
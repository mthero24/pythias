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
    let res = await axios.get(`https://ssapi.shipstation.com/orders?createDateStart=02/21/2025&page=${1}&pageSize=500`, headers).catch(e=>{console.log(e.response.data)})
    console.log(res.data.pages)
    let orders = res.data.orders
    console.log(orders.length)
    for(let i = 2; i <= parseInt(res.data.pages); i++){
        console.log(orders.length, i)
        let res = await axios.get(`https://ssapi.shipstation.com/orders?createDateStart=02/21/2025&page=${i}&pageSize=500`, headers).catch(e=>{console.log(e.response.data)})
        orders = orders.concat(res.data.orders)
    }
    console.log(orders.length)
    return orders
}
import axios from "axios";
import btoa from "btoa"
export async function getOrders({auth}){
    console.log(auth)
    let headers = {
        headers: {
            Authorization: `Basic ${btoa(auth)}`
        }
    }
    console.log(new Date(Date.now() - 7 * (24 * 60 * 60 * 1000)))
    let lastDate = new Date(Date.now() - (7* (24 * 60 * 60 * 1000)))
    console.log(`${lastDate.getMonth().toString().length == 2? lastDate.getMonth(): `0${lastDate.getMonth() + 1}` }/${lastDate.getDate().toString().length == 2? lastDate.getDate(): `0${lastDate.getDate()}`}/${lastDate.getFullYear()}`)
    let res = await axios.get(`https://ssapi.shipstation.com/orders?createDateStart=${lastDate.getMonth().toString().length == 2? lastDate.getMonth(): `0${lastDate.getMonth() + 1}` }/${lastDate.getDate().toString().length == 2? lastDate.getDate(): `0${lastDate.getDate()}`}/${lastDate.getFullYear()}&page=${1}&pageSize=500`, headers).catch(e=>{console.log(e.response.data)})
    console.log(res.data.pages)
    let orders = res.data.orders
    console.log(orders.length)
    for(let i = 2; i <= parseInt(res.data.pages); i++){
        console.log(orders.length, i)
        let res = await axios.get(`https://ssapi.shipstation.com/orders?createDateStart=${lastDate.getMonth().toString().length == 2? lastDate.getMonth(): `0${lastDate.getMonth() + 1}` }/${lastDate.getDate().toString().length == 2? lastDate.getDate(): `0${lastDate.getDate()}`}/${lastDate.getFullYear()}&page=${i}&pageSize=500`, headers).catch(e=>{console.log(e.response.data)})
        orders = orders.concat(res.data.orders)
    }
    console.log(orders.length)
    return orders
}

export async function updateOrder({auth, orderId, carrierCode, trackingNumber}){
    let lastDate = new Date(Date.now())
    console.log(auth)
    console.log(btoa(auth))
    let headers = {
        headers: {
            Authorization: `Basic ${btoa(auth)}`
        }
    }
    let res = await axios.post(`https://ssapi.shipstation.com/orders/markasshipped`, {
        "orderId": orderId,
        "carrierCode": carrierCode,
        "shipDate": `${lastDate.getFullYear()}-${lastDate.getMonth().toString().length == 2? lastDate.getMonth(): `0${lastDate.getMonth() + 1}` }-${lastDate.getDate().toString().length == 2? lastDate.getDate(): `0${lastDate.getDate()}`}`,
        "trackingNumber": trackingNumber,
        "notifyCustomer": false,
        "notifySalesChannel": true
    }, headers).catch(e=> {
        console.log(e.response.data)
    })
    return res
}
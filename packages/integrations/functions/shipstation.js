import axios from "axios";
import btoa from "btoa"

export async function getOrders({auth, id}){
    console.log(auth)
    let headers = {
        headers: {
            Authorization: `Basic ${btoa(auth)}`
        }
    }
    console.log(new Date(Date.now() - 7 * (24 * 60 * 60 * 1000)))
    let lastDate = new Date(Date.now() - (7* (24 * 60 * 60 * 1000)))
    console.log(`${lastDate.getMonth().toString().length == 2? lastDate.getMonth(): `0${lastDate.getMonth() + 1}` }/${lastDate.getDate().toString().length == 2? lastDate.getDate(): `0${lastDate.getDate()}`}/${lastDate.getFullYear()}`)
    let res = await axios.get(`https://ssapi.shipstation.com/orders?createDateStart=${lastDate.getMonth().toString().length == 2? lastDate.getMonth(): `0${lastDate.getMonth() + 1}` }/${lastDate.getDate().toString().length == 2? lastDate.getDate(): `0${lastDate.getDate()}`}/${lastDate.getFullYear()}&page=${1}${id? `&orderNumber=${id}`: ""}&pageSize=500`, headers).catch(e=>{console.log(e.response.data)})
    console.log(res?.data?.pages)
    let orders = res && res.data? res.data.orders: []
    console.log(orders.length, res?.data?.pages)
    for(let i = 2; i <= parseInt(res?.data?.pages); i++){
        console.log(orders.length, i)
        let res = await axios.get(`https://ssapi.shipstation.com/orders?createDateStart=${lastDate.getMonth().toString().length == 2 ? lastDate.getMonth() : `0${lastDate.getMonth() + 1}`}/${lastDate.getDate().toString().length == 2 ? lastDate.getDate() : `0${lastDate.getDate()}`}/${lastDate.getFullYear()}&page=${i}${id ? `&orderNumber=${id}` : ""}&pageSize=500`, headers).catch(e=>{console.log(e.response.data)})
        orders = orders.concat(res.data.orders)
    }
    console.log(orders.length, orders)
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
    let body = {
        "orderId": orderId,
        "carrierCode": carrierCode,
        "trackingNumber": trackingNumber,
        "notifyCustomer": false,
        "notifySalesChannel": true
    }
    console.log(body)
    let res = await axios.post(`https://ssapi.shipstation.com/orders/markasshipped`, body, headers).catch(e=> {
        console.log(e.response.data)
    })
    return res
}
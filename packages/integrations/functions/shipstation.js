import axios from "axios";
import btoa from "btoa"

export async function getOrders({auth, id}){
    console.log(auth, id)
    let headers = {
        headers: {
            Authorization: `Basic ${btoa(auth)}`
        }
    }
    //&orderStatus=cancelled
    console.log(new Date(Date.now() - 30 * (24 * 60 * 60 * 1000)))
    let lastDate = new Date(Date.now() - ((12 * 30) * (24 * 60 * 60 * 1000)))
    console.log(`${(lastDate.getMonth() + 1).toString().length == 2? lastDate.getMonth() + 1: `0${lastDate.getMonth() + 1}` }/${lastDate.getDate().toString().length == 2? lastDate.getDate(): `0${lastDate.getDate()}`}/${lastDate.getFullYear()}`)
    let res = await axios.get(`https://ssapi.shipstation.com/orders?createDateStart=${(lastDate.getMonth() + 1).toString().length == 2 ? lastDate.getMonth() + 1 : `0${lastDate.getMonth() + 1}`}/${lastDate.getDate().toString().length == 2 ? lastDate.getDate() : `0${lastDate.getDate()}`}/${lastDate.getFullYear()}&page=${1}${id ? `&orderNumber=${id}` : ""}&pageSize=500`, headers).catch(e=>{console.log(e.response.data)})
    console.log(res?.data?.pages)
    let orders = res && res.data? res.data.orders: []
    console.log(orders.length, res?.data?.pages)
    for(let i = 2; i <= parseInt(res?.data?.pages); i++){
        console.log(orders.length, i)
        let res = await axios.get(`https://ssapi.shipstation.com/orders?createDateStart=${(lastDate.getMonth() + 1).toString().length == 2 ? lastDate.getMonth() + 1 : `0${lastDate.getMonth() + 1}`}/${lastDate.getDate().toString().length == 2 ? lastDate.getDate() : `0${lastDate.getDate()}`}/${lastDate.getFullYear()}&page=${i}${id ? `&orderNumber=${id}` : ""}&pageSize=500`, headers).catch(e=>{console.log(e.response.data)})
        orders = orders.concat(res.data.orders)
    }
    let res2 = await axios.get(`https://ssapi.shipstation.com/orders?createDateStart=${(lastDate.getMonth() + 1).toString().length == 2 ? lastDate.getMonth() + 1 : `0${lastDate.getMonth() + 1}`}/${lastDate.getDate().toString().length == 2 ? lastDate.getDate() : `0${lastDate.getDate()}`}/${lastDate.getFullYear()}&page=${1}${id ? `&orderNumber=${id}` : ""}&orderStatus=cancelled&pageSize=500`, headers).catch(e => { console.log(e.response.data) })
    if(res2.data && res2.data.orders){
        orders = orders.concat(res2.data.orders)
    }
    for (let i = 2; i <= parseInt(res2?.data?.pages); i++) {
        console.log(orders.length, i)
        let res = await axios.get(`https://ssapi.shipstation.com/orders?createDateStart=${(lastDate.getMonth() + 1).toString().length == 2 ? lastDate.getMonth() + 1 : `0${lastDate.getMonth() + 1}`}/${lastDate.getDate().toString().length == 2 ? lastDate.getDate() : `0${lastDate.getDate()}`}/${lastDate.getFullYear()}&page=${i}${id ? `&orderNumber=${id}` : ""}&orderStatus=cancelled&pageSize=500`, headers).catch(e => { console.log(e.response.data) })
        orders = orders.concat(res.data.orders)
    }
    console.log(orders.length, orders)
    return orders
}
export async function getPages({auth}) {
    let headers = {
        headers: {
            Authorization: `Basic ${btoa(auth)}`
        }
    }
    let lastDate = new Date(Date.now() - ((12 * 30) * (24 * 60 * 60 * 1000)))
    console.log(`${(lastDate.getMonth() + 1).toString().length == 2 ? lastDate.getMonth() + 1 : `0${lastDate.getMonth() + 1}`}/${lastDate.getDate().toString().length == 2 ? lastDate.getDate() : `0${lastDate.getDate()}`}/${lastDate.getFullYear()}`)
    let res = await axios.get(`https://ssapi.shipstation.com/orders?createDateStart=${(lastDate.getMonth() + 1).toString().length == 2 ? lastDate.getMonth() + 1 : `0${lastDate.getMonth() + 1}`}/${lastDate.getDate().toString().length == 2 ? lastDate.getDate() : `0${lastDate.getDate()}`}/${lastDate.getFullYear()}&page=${1}&pageSize=500`, headers).catch(e => { console.log(e.response.data) })
    console.log(res?.data?.pages)
    return res.data?.pages
}

export const getPageOrders = async ({auth, page}) => {
    let headers = {
        headers: {
            Authorization: `Basic ${btoa(auth)}`
        }
    }
    let lastDate = new Date(Date.now() - ((12 * 30) * (24 * 60 * 60 * 1000)))
    let res = await axios.get(`https://ssapi.shipstation.com/orders?createDateStart=${(lastDate.getMonth() + 1).toString().length == 2 ? lastDate.getMonth() + 1 : `0${lastDate.getMonth() + 1}`}/${lastDate.getDate().toString().length == 2 ? lastDate.getDate() : `0${lastDate.getDate()}`}/${lastDate.getFullYear()}&page=${page}&pageSize=500`, headers).catch(e => { console.log(e.response.data) })
    return res.data.orders
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
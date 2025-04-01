import axios from "axios"
import btoa from "btoa"
import { getToken } from "next-auth/jwt"
const getTokenWalmart = async ({clientId, clientSecret, partnerId})=>{
    //console.log(clientId, clientSecret)
    let headers={
        headers: {
            Accept: "application/json",
            "Content-Type": "application/x-www-form-urlencoded",
            "WM_PARTNER.ID": partnerId,
            "WM_SVC.NAME": "pythias",
            "WM_QOS.CORRELATION_ID": "pythias",
            "WM_CONSUMER.CHANNEL.TYPE": "some-channel"
        },
        auth: {
            username: clientId,
            password:clientSecret
        }
    }
    //console.log(headers)
    let body= {
        grant_type: "client_credentials",
    }
    let errorRes
    let res = await axios.post("https://marketplace.walmartapis.com/v3/token", body, headers).catch(e=> {errorRes = e.response.data})
    //console.log(errorRes, res?.data)
    if(errorRes){
        return null
    }else{
        return res?.data.access_token
    }
} 

export const getItemsWalmart = async ({clientId, clientSecret, partnerId, params})=>{
    let token = await getTokenWalmart({clientId, clientSecret, partnerId})
    //console.log(token, "token")
    let searchParams = ``
    if(params){
        for(let par of params){
            if(searchParams.length > 0){
                searchParams = `${searchParams}&${Object.keys(par)[0]}=${par[Object.keys(par)[0]]}`
            }else{
                searchParams = `${Object.keys(par)[0]}=${par[Object.keys(par)[0]]}`
            }
        }
    }
    console.log(searchParams)
    let headers={
        headers: {
            Accept: "application/json",
            "WM_SEC.ACCESS_TOKEN": token,
            "WM_PARTNER.ID": partnerId,
            "WM_SVC.NAME": "pythias",
            "WM_QOS.CORRELATION_ID": "pythias",
            "WM_CONSUMER.CHANNEL.TYPE": "some-channel"
        }
    }
    let errorRes
    let res = await axios.get(`https://marketplace.walmartapis.com/v3/items?${searchParams}`, headers).catch(e=> {errorRes = e.response.data})
    //console.log(errorRes, res?.data)
    if(errorRes){
        return null
    }else{
        return res?.data.ItemResponse
    }
}
export const retireItemWalmart = async ({clientId, clientSecret, partnerId, sku})=>{
    let token = await getTokenWalmart({clientId, clientSecret, partnerId})
    //console.log(token, "token")
    let headers={
        headers: {
            Accept: "application/json",
            "WM_SEC.ACCESS_TOKEN": token,
            "WM_PARTNER.ID": partnerId,
            "WM_SVC.NAME": "pythias",
            "WM_QOS.CORRELATION_ID": "pythias",
            "WM_CONSUMER.CHANNEL.TYPE": "some-channel"
        }
    }
    let errorRes
    let res = await axios.delete(`https://marketplace.walmartapis.com/v3/items/${sku}`, headers).catch(e=> {errorRes = e.response.data})
    console.log(errorRes, res?.data)
    if(errorRes){
        return null
    }else{
        return res?.data.ItemResponse
    }
}


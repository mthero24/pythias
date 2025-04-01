import axios from "axios"
import btoa from "btoa"
export const getTokenWalmart = async ({clientId, clientSecret, partnerId})=>{
    console.log(clientId, clientSecret)
    let base64 = `${clientId}:${clientSecret}`.toString("base64")
    console.log(base64)
    let header={
        header: {
            Accept: "application/json",
            "Content-Type": "application/json",
            "WM_PARTNER.ID": partnerId,
            "WM_SVC.NAME": "walmart service name",
            "WM_QOS.CORRELATION_ID": "some thing",
            "WM_CONSUMER.CHANNEL.TYPE": "some channel"
        },
        auth: {
            username: clientId,
            password:clientSecret
        }
    }
    console.log(header)
    let body= {
        grant_type: "client_credentials",
    }
    let errorRes
    let res = await axios.post("https://marketplace.walmartapis.com/v3/token", body, header).catch(e=> {errorRes = e.response.data})
    console.log(errorRes, res?.data)
    if(errorRes){
        return null
    }else{
        return res?.data
    }
} 
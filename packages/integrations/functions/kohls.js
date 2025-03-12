import axios from "axios";

export const getToken = async ({clientId, clientSecret, companyId})=>{
    console.log(clientId, clientSecret, companyId)
    let headers ={
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        }
    }
    let body = {
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret,
        audience: companyId
    }
    let resError
    let res = await axios.post("https://auth.mirakl.net/oauth/token", body, headers).catch(e=>{resError = e.response.data})
    console.log(res?.data, resError)
    return res?.data.access_token
}

export const getOrders = async ({clientId, clientSecret, companyId})=>{
    let query = new URLSearchParams({
        fulfillment_type: 'FULFILLED_BY_SELLER',
        updated_from: new Date(Date.now() - 14 * (24 * 60 * 60 * 1000)),
        page_token: 'string',
        limit: 100
    })
    let headers = {
        headers: {
            Authorization: `Bearer ${await getToken({clientId, clientSecret, companyId})}`,
            Accept: "application/json"
        }
    }
    let resError
    let res = await axios.get(`https://miraklconnect.com/api/v2/orders?${query}`, headers).catch(e=>{resError = e.response.data})
    console.log(res?.data.next_page_token, resError)
    console.log(res.data.data[0])
    res.data.data.map(o=>{
        console.log(o.origin)
    })
}
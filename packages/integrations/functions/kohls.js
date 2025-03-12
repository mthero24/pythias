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